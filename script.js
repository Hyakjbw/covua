// Khởi tạo bàn cờ 8x8
const boardEl = document.getElementById("board");
const moveListEl = document.getElementById("movelist");
let selectedSquare = null;

// Tạo bàn cờ
function createBoard() {
  boardEl.innerHTML = "";
  for (let row = 0; row < 8; row++) {
    for (let col = 0; col < 8; col++) {
      const square = document.createElement("div");
      square.classList.add("square");
      (row + col) % 2 === 0 ? square.classList.add("light") : square.classList.add("dark");
      square.dataset.row = row;
      square.dataset.col = col;
      square.addEventListener("click", () => onSquareClick(square));
      boardEl.appendChild(square);
    }
  }
}

// Giả lập quân cờ tạm (demo)
function setupPieces() {
  const initial = [
    "♜","♞","♝","♛","♚","♝","♞","♜",
    "♟","♟","♟","♟","♟","♟","♟","♟",
    "","","","","","","","",
    "","","","","","","","",
    "","","","","","","","",
    "","","","","","","","",
    "♙","♙","♙","♙","♙","♙","♙","♙",
    "♖","♘","♗","♕","♔","♗","♘","♖"
  ];
  const squares = document.querySelectorAll(".square");
  for (let i = 0; i < 64; i++) {
    squares[i].textContent = initial[i];
  }
}

function onSquareClick(square) {
  if (!selectedSquare) {
    if (square.textContent !== "") {
      selectedSquare = square;
      square.style.outline = "3px solid yellow";
    }
  } else {
    movePiece(selectedSquare, square);
    selectedSquare.style.outline = "";
    selectedSquare = null;
  }
}

function movePiece(from, to) {
  if (from === to) return;
  to.textContent = from.textContent;
  from.textContent = "";
  const move = `${from.dataset.row}${from.dataset.col} → ${to.dataset.row}${to.dataset.col}`;
  const li = document.createElement("li");
  li.textContent = move;
  moveListEl.appendChild(li);
}

// Bắt đầu
createBoard();
setupPieces();