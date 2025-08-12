import React from 'react';
import Cell from './Cell';

const Board = ({ board, marked, onCellClick }) => {
  if (!board) {
    return null;
  }
  
  return (
    <div>
      <div className="bingo-header">
        <span>B</span>
        <span>I</span>
        <span>N</span>
        <span>G</span>
        <span>O</span>
      </div>
      <div className="board">
        {board.map((number, index) => (
          <Cell
            key={index}
            number={number}
            isMarked={marked[index]}
            onClick={() => onCellClick(index)}
          />
        ))}
      </div>
    </div>
  );
};

export default Board;