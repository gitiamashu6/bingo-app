const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = socketIo(server, {
  cors: {
    origin: "https://bingo-app-mu.vercel.app",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 4000;

let gameState = {
  player1Board: null,
  player2Board: null,
  player1Marked: Array(25).fill(false),
  player2Marked: Array(25).fill(false),
  player1CompletedLines: 0,
  player2CompletedLines: 0,
  calledNumbers: [],
  currentPlayer: 1,
  winner: null,
  players: {},
};

const generateBoard = () => {
  const board = [];
  const numbers = Array.from({ length: 25 }, (_, i) => i + 1);
  for (let i = 0; i < 25; i++) {
    const randomIndex = Math.floor(Math.random() * numbers.length);
    board.push(numbers.splice(randomIndex, 1)[0]);
  }
  return board;
};

io.on('connection', (socket) => {
  console.log('New client connected');

  let playerNumber = null;

  if (!gameState.player1Board) {
    playerNumber = 1;
    gameState.players[socket.id] = playerNumber;
    gameState.player1Board = generateBoard();
  } else if (!gameState.player2Board) {
    playerNumber = 2;
    gameState.players[socket.id] = playerNumber;
    gameState.player2Board = generateBoard();
  }

  if (playerNumber) {
    socket.emit('playerNumber', playerNumber);
    io.emit('gameState', gameState);
  }

  socket.on('callNumber', (number) => {
    if (gameState.winner) {
      return;
    }

    if (!gameState.calledNumbers.includes(number)) {
      gameState.calledNumbers.push(number);

      // Mark the number on both players' boards
      if (gameState.player1Board) {
        const player1Index = gameState.player1Board.indexOf(number);
        if (player1Index !== -1) {
          gameState.player1Marked[player1Index] = true;
          const player1CompletedLines = countCompletedLines(gameState.player1Marked);
          gameState.player1CompletedLines = player1CompletedLines;
          console.log(`Player 1 completed lines: ${player1CompletedLines}`);
          if (player1CompletedLines >= 5) {
            gameState.winner = 1;
          }
        }
      }

      if (gameState.player2Board) {
        const player2Index = gameState.player2Board.indexOf(number);
        if (player2Index !== -1) {
          gameState.player2Marked[player2Index] = true;
          const player2CompletedLines = countCompletedLines(gameState.player2Marked);
          gameState.player2CompletedLines = player2CompletedLines;
          console.log(`Player 2 completed lines: ${player2CompletedLines}`);
          if (player2CompletedLines >= 5) {
            gameState.winner = 2;
          }
        }
      }

      console.log(gameState);
      gameState.currentPlayer = gameState.currentPlayer === 1 ? 2 : 1;
      io.emit('gameState', gameState);
    }
  });

  socket.on('cellClick', ({ player, index }) => {
    // This is now handled by the callNumber event
  });

  socket.on('restartGame', () => {
    gameState = {
      ...gameState,
      player1Board: generateBoard(),
      player2Board: generateBoard(),
      player1Marked: Array(25).fill(false),
      player2Marked: Array(25).fill(false),
      player1CompletedLines: 0,
      player2CompletedLines: 0,
      calledNumbers: [],
      currentPlayer: 1,
      winner: null,
    };
    io.emit('gameState', gameState);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected');
    const disconnectedPlayer = gameState.players[socket.id];
    delete gameState.players[socket.id];

    if (disconnectedPlayer) {
      if (Object.keys(gameState.players).length === 0) {
        // Reset game if all players leave
        gameState = {
          player1Board: null,
          player2Board: null,
          player1Marked: Array(25).fill(false),
          player2Marked: Array(25).fill(false),
          player1CompletedLines: 0,
          player2CompletedLines: 0,
          calledNumbers: [],
          currentPlayer: 1,
          winner: null,
          players: {},
        };
      } else {
        if (disconnectedPlayer === 1) {
          gameState.player1Board = null;
          gameState.player1Marked = Array(25).fill(false);
          gameState.player1CompletedLines = 0;
        }
        if (disconnectedPlayer === 2) {
          gameState.player2Board = null;
          gameState.player2Marked = Array(25).fill(false);
          gameState.player2CompletedLines = 0;
        }
      }
    }

    io.emit('gameState', gameState);
  });
});

const countCompletedLines = (marked) => {
  const lines = [
    [0, 1, 2, 3, 4],
    [5, 6, 7, 8, 9],
    [10, 11, 12, 13, 14],
    [15, 16, 17, 18, 19],
    [20, 21, 22, 23, 24],
    [0, 5, 10, 15, 20],
    [1, 6, 11, 16, 21],
    [2, 7, 12, 17, 22],
    [3, 8, 13, 18, 23],
    [4, 9, 14, 19, 24],
    [0, 6, 12, 18, 24],
    [4, 8, 12, 16, 20],
  ];

  let completedLines = 0;
  for (const line of lines) {
    if (line.every((index) => marked[index])) {
      completedLines++;
    }
  }

  return completedLines;
};

server.listen(PORT, () => console.log(`Listening on port ${PORT}`));
