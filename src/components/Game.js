import React, { useState, useEffect, useRef } from 'react';
import socketIOClient from 'socket.io-client';
import Board from './Board';
import './Game.css';

const ENDPOINT = 'http://localhost:4000';

const Game = () => {
  const [gameState, setGameState] = useState(null);
  const [playerNumber, setPlayerNumber] = useState(null);
  const socketRef = useRef();

  useEffect(() => {
    socketRef.current = socketIOClient(ENDPOINT);

    socketRef.current.on('gameState', (data) => {
      setGameState(data);
    });

    socketRef.current.on('playerNumber', (number) => {
      setPlayerNumber(number);
    });

    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const handleNumberCall = (number) => {
    socketRef.current.emit('callNumber', number);
  };

  const handleCellClick = (player, index) => {
    socketRef.current.emit('cellClick', { player, index });
  };

  const restartGame = () => {
    socketRef.current.emit('restartGame');
  };

  const getBingoWord = (completedLines) => {
    const BINGO = ['B', 'I', 'N', 'G', 'O'];
    return BINGO.slice(0, completedLines).join('');
  };

  if (!gameState || !playerNumber) {
    return <div>Loading...</div>;
  }

  const {
    player1Board,
    player2Board,
    player1Marked,
    player2Marked,
    player1CompletedLines,
    player2CompletedLines,
    calledNumbers,
    currentPlayer,
    winner
  } = gameState;

  const isMyTurn = currentPlayer === playerNumber;

  return (
    <div className="game">
      <h1>Bingo</h1>
      <h2>You are Player {playerNumber}</h2>
      {winner && <h2 className="winner-message">BINGO! Player {winner} Wins!</h2>}
      {!winner && <h2>Current Player: {currentPlayer}</h2>}
      <div className="called-numbers">
        <h2>Click a number to call it:</h2>
        <div className="numbers">
          {Array.from({ length: 25 }, (_, i) => i + 1).map((num) => (
            <span
              key={num}
              className={`number ${calledNumbers.includes(num) ? 'called' : ''} ${!isMyTurn ? 'disabled' : ''}`}
              onClick={() => isMyTurn && handleNumberCall(num)}
            >
              {num}
            </span>
          ))}
        </div>
      </div>
      {winner && <button onClick={restartGame}>Play Again</button>}
      <div className="boards">
        {playerNumber === 1 && (
          <div className="board-container">
            <h2>Player 1: {getBingoWord(player1CompletedLines)}</h2>
            <Board board={player1Board} marked={player1Marked} onCellClick={(index) => handleCellClick(1, index)} />
          </div>
        )}
        {playerNumber === 2 && (
          <div className="board-container">
            <h2>Player 2: {getBingoWord(player2CompletedLines)}</h2>
            <Board board={player2Board} marked={player2Marked} onCellClick={(index) => handleCellClick(2, index)} />
          </div>
        )}
      </div>
    </div>
  );
};

export default Game;