const boardEl = document.getElementById("board");
const currentPlayerEl = document.getElementById("current-player");
let selectedSquare = null;
let currentPlayer = 'white';
let gameState = Array(8).fill().map(() => Array(8).fill(null));
let validMoves = [];

// Giá trị quân cờ
const PIECE_VALUES = {
    'p': 100, 'n': 320, 'b': 330, 'r': 500, 'q': 900, 'k': 20000,
    'P': -100, 'N': -320, 'B': -330, 'R': -500, 'Q': -900, 'K': -20000
};

// Khôi phục các hàm cơ bản
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

function setupPieces() {
    // Khởi tạo bàn cờ với ký hiệu Unicode
    const initial = [
        "♜", "♞", "♝", "♛", "♚", "♝", "♞", "♜",
        "♟", "♟", "♟", "♟", "♟", "♟", "♟", "♟",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "", "", "", "", "", "", "", "",
        "♙", "♙", "♙", "♙", "♙", "♙", "♙", "♙",
        "♖", "♘", "♗", "♕", "♔", "♗", "♘", "♖"
    ];
    
    const squares = document.querySelectorAll(".square");
    for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        squares[i].textContent = initial[i];
        gameState[row][col] = getPieceCode(initial[i]);
    }
}

function getPieceCode(piece) {
    const pieceMap = {
        '♙': 'P', '♘': 'N', '♗': 'B', '♖': 'R', '♕': 'Q', '♔': 'K',
        '♟': 'p', '♞': 'n', '♝': 'b', '♜': 'r', '♛': 'q', '♚': 'k'
    };
    return pieceMap[piece] || null;
}

function getPieceSymbol(code) {
    const symbolMap = {
        'P': '♙', 'N': '♘', 'B': '♗', 'R': '♖', 'Q': '♕', 'K': '♔',
        'p': '♟', 'n': '♞', 'b': '♝', 'r': '♜', 'q': '♛', 'k': '♚'
    };
    return symbolMap[code] || '';
}

function onSquareClick(square) {
    if (currentPlayer !== 'white') return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = gameState[row][col];
    
    if (!selectedSquare) {
        // Chọn quân cờ
        if (piece && piece === piece.toUpperCase()) {
            selectedSquare = square;
            square.classList.add('selected');
            validMoves = getValidMoves(row, col, gameState);
            highlightValidMoves(validMoves);
        }
    } else {
        // Di chuyển quân cờ
        const fromRow = parseInt(selectedSquare.dataset.row);
        const fromCol = parseInt(selectedSquare.dataset.col);
        
        const isValidMove = validMoves.some(move => 
            move.toRow === row && move.toCol === col
        );
        
        if (isValidMove) {
            makeMove(fromRow, fromCol, row, col);
            currentPlayer = 'black';
            updateTurnIndicator();
            
            // AI thực hiện nước đi
            setTimeout(makeAIMove, 100);
        }
        
        clearHighlights();
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
        validMoves = [];
    }
}

function getValidMoves(row, col, board) {
    const piece = board[row][col];
    if (!piece) return [];
    
    const moves = [];
    const isWhite = piece === piece.toUpperCase();
    
    switch (piece.toLowerCase()) {
        case 'p': // Tốt
            const direction = isWhite ? -1 : 1;
            const startRow = isWhite ? 6 : 1;
            
            // Di chuyển thẳng
            if (isValidPosition(row + direction, col) && !board[row + direction][col]) {
                moves.push({toRow: row + direction, toCol: col, type: 'move'});
                
                // Di chuyển 2 ô từ vị trí ban đầu
                if (row === startRow && isValidPosition(row + 2 * direction, col) && 
                    !board[row + 2 * direction][col]) {
                    moves.push({toRow: row + 2 * direction, toCol: col, type: 'move'});
                }
            }
            
            // Ăn chéo
            for (let dc of [-1, 1]) {
                if (isValidPosition(row + direction, col + dc)) {
                    const target = board[row + direction][col + dc];
                    if (target) {
                        if (isWhite && target === target.toLowerCase()) {
                            moves.push({toRow: row + direction, toCol: col + dc, type: 'capture'});
                        }
                        if (!isWhite && target === target.toUpperCase()) {
                            moves.push({toRow: row + direction, toCol: col + dc, type: 'capture'});
                        }
                    }
                }
            }
            break;
            
        case 'r': // Xe
            addStraightMoves(row, col, board, moves, isWhite);
            break;
            
        case 'n': // Mã
            const knightMoves = [
                [-2, -1], [-2, 1], [-1, -2], [-1, 2],
                [1, -2], [1, 2], [2, -1], [2, 1]
            ];
            for (let [dr, dc] of knightMoves) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (isValidPosition(newRow, newCol)) {
                    const target = board[newRow][newCol];
                    if (!target) {
                        moves.push({toRow: newRow, toCol: newCol, type: 'move'});
                    } else {
                        if ((isWhite && target === target.toLowerCase()) || 
                            (!isWhite && target === target.toUpperCase())) {
                            moves.push({toRow: newRow, toCol: newCol, type: 'capture'});
                        }
                    }
                }
            }
            break;
            
        case 'b': // Tượng
            addDiagonalMoves(row, col, board, moves, isWhite);
            break;
            
        case 'q': // Hậu
            addStraightMoves(row, col, board, moves, isWhite);
            addDiagonalMoves(row, col, board, moves, isWhite);
            break;
            
        case 'k': // Vua
            const kingMoves = [
                [-1, -1], [-1, 0], [-1, 1],
                [0, -1], [0, 1],
                [1, -1], [1, 0], [1, 1]
            ];
            for (let [dr, dc] of kingMoves) {
                const newRow = row + dr;
                const newCol = col + dc;
                if (isValidPosition(newRow, newCol)) {
                    const target = board[newRow][newCol];
                    if (!target) {
                        moves.push({toRow: newRow, toCol: newCol, type: 'move'});
                    } else {
                        if ((isWhite && target === target.toLowerCase()) || 
                            (!isWhite && target === target.toUpperCase())) {
                            moves.push({toRow: newRow, toCol: newCol, type: 'capture'});
                        }
                    }
                }
            }
            break;
    }
    
    return moves;
}

function addStraightMoves(row, col, board, moves, isWhite) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        while (isValidPosition(r, c)) {
            const target = board[r][c];
            if (!target) {
                moves.push({toRow: r, toCol: c, type: 'move'});
            } else {
                if ((isWhite && target === target.toLowerCase()) || 
                    (!isWhite && target === target.toUpperCase())) {
                    moves.push({toRow: r, toCol: c, type: 'capture'});
                }
                break;
            }
            r += dr;
            c += dc;
        }
    }
}

function addDiagonalMoves(row, col, board, moves, isWhite) {
    const directions = [[-1, -1], [-1, 1], [1, -1], [1, 1]];
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        while (isValidPosition(r, c)) {
            const target = board[r][c];
            if (!target) {
                moves.push({toRow: r, toCol: c, type: 'move'});
            } else {
                if ((isWhite && target === target.toLowerCase()) || 
                    (!isWhite && target === target.toUpperCase())) {
                    moves.push({toRow: r, toCol: c, type: 'capture'});
                }
                break;
            }
            r += dr;
            c += dc;
        }
    }
}

function isValidPosition(row, col) {
    return row >= 0 && row < 8 && col >= 0 && col < 8;
}

function highlightValidMoves(moves) {
    moves.forEach(move => {
        const square = document.querySelector(`.square[data-row="${move.toRow}"][data-col="${move.toCol}"]`);
        if (square) {
            square.classList.add(move.type === 'capture' ? 'valid-capture' : 'valid-move');
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('valid-move', 'valid-capture', 'selected');
    });
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState[fromRow][fromCol];
    
    // Phong hậu cho tốt khi đến cuối bàn cờ
    if (piece.toLowerCase() === 'p') {
        if ((piece === 'P' && toRow === 0) || (piece === 'p' && toRow === 7)) {
            gameState[toRow][toCol] = piece === 'P' ? 'Q' : 'q';
            console.log(`Pawn promoted to queen at (${toRow},${toCol})`);
        } else {
            gameState[toRow][toCol] = piece;
        }
    } else {
        gameState[toRow][toCol] = piece;
    }
    
    gameState[fromRow][fromCol] = null;
    
    updateBoardDisplay();
}

function updateBoardDisplay() {
    const squares = document.querySelectorAll(".square");
    for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        squares[i].textContent = getPieceSymbol(gameState[row][col]);
    }
}

function updateTurnIndicator() {
    currentPlayerEl.textContent = currentPlayer === 'white' ? 'Trắng' : 'Đen (AI)';
    currentPlayerEl.style.color = currentPlayer === 'white' ? '#2c3e50' : '#e74c3c';
}

// AI đơn giản - luôn đánh được
function makeAIMove() {
    console.log("AI is thinking...");
    
    const moves = [];
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = gameState[row][col];
            if (piece && piece === piece.toLowerCase()) { // Quân đen
                const pieceMoves = getValidMoves(row, col, gameState);
                for (let move of pieceMoves) {
                    moves.push({
                        fromRow: row,
                        fromCol: col,
                        toRow: move.toRow,
                        toCol: move.toCol
                    });
                }
            }
        }
    }
    
    console.log("AI available moves:", moves.length);
    
    if (moves.length === 0) {
        console.log("No moves available for AI");
        currentPlayer = 'white';
        updateTurnIndicator();
        return;
    }
    
    // Chọn nước đi ngẫu nhiên
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    console.log("AI making move:", randomMove);
    
    makeMove(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
    currentPlayer = 'white';
    updateTurnIndicator();
}

function resetGame() {
    gameState = Array(8).fill().map(() => Array(8).fill(null));
    currentPlayer = 'white';
    selectedSquare = null;
    validMoves = [];
    clearHighlights();
    createBoard();
    setupPieces();
    updateTurnIndicator();
    console.log("Game reset");
}

// Khởi tạo game
window.addEventListener("DOMContentLoaded", () => {
    createBoard();
    setupPieces();
    updateTurnIndicator();
});
