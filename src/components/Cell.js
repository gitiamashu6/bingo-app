import React from 'react';

const Cell = ({ number, isMarked, onClick }) => {
  return (
    <div className={`cell ${isMarked ? 'marked' : ''}`} onClick={onClick}>
      {number}
    </div>
  );
};

export default Cell;
