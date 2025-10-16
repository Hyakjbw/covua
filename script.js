let board = [];
let currentPlayer = 'white'; // Toggle between 'white' and 'black'

function initializeBoard() {
  board = [
    ["r", "n", "b", "q", "k", "b", "n", "r"],
    ["p", "p", "p", "p", "p", "p", "p", "p"],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["", "", "", "", "", "", "", ""],
    ["P", "P", "P", "P", "P", "P", "P", "P"],
    ["R", "N", "B", "Q", "K", "B", "N", "R"]
  ];
}

function basicMovePiece(from, to) {
  const fromRow = parseInt(from.dataset.row);
  const fromCol = parseInt(from.dataset.col);
  const toRow = parseInt(to.dataset.row);
  const toCol = parseInt(to.dataset.col);

  // Pawn simple move example
  if (isValidPawnMove(fromRow, fromCol, toRow, toCol)) {
    updateBoard(fromRow, fromCol, toRow, toCol);
    changeTurn();
    aiMove();
  }
}

function isValidPawnMove(fromRow, fromCol, toRow, toCol) {
  const piece = board[fromRow][fromCol];
  const direction = piece === 'P' ? -1 : 1;
  return (piece.toLowerCase() === 'p' && fromCol === toCol && board[toRow][toCol] === '' && 
    (toRow - fromRow === direction));
}

function updateBoard(fromRow, fromCol, toRow, toCol) {
  board[toRow][toCol] = board[fromRow][fromCol];
  board[fromRow][fromCol] = '';
  updateVisualBoard();
}

function aiMove() {
  // Simple random move as a placeholder, ideally use minimax or similar
  const possibleMoves = getPossibleMoves();
  const randomMove = possibleMoves[Math.floor(Math.random() * possibleMoves.length)];
  if (randomMove) {
    updateBoard(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
    changeTurn();
  }
}

function getPossibleMoves() {
  // Logic to get all possible moves for current player
  return [];
}

function changeTurn() {
  currentPlayer = currentPlayer === 'white' ? 'black' : 'white';
}

function updateVisualBoard() {
  const squares = document.querySelectorAll(".square");
  squares.forEach((square, index) => {
    const row = Math.floor(index / 8);
    const col = index % 8;
    square.textContent = board[row][col];
  });
}

window.addEventListener("DOMContentLoaded", () => {
  createBoard();
  setupPieces();
  initializeBoard();
});
