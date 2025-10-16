const boardEl = document.getElementById("board");
const moveListEl = document.getElementById("movelist");
let selectedSquare = null;
let currentPlayer = 'white'; // 'white' hoặc 'black'
let gameState = Array(8).fill().map(() => Array(8).fill(null));
let validMoves = [];

// Giá trị quân cờ
const PIECE_VALUES = {
    'p': 10, 'n': 30, 'b': 30, 'r': 50, 'q': 90, 'k': 900,
    'P': -10, 'N': -30, 'B': -30, 'R': -50, 'Q': -90, 'K': -900
};

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
    
    if (!selectedSquare) {
        // Chọn quân cờ
        const piece = gameState[row][col];
        if (piece && piece === piece.toUpperCase()) { // Chỉ chọn quân trắng
            selectedSquare = square;
            square.style.outline = "3px solid yellow";
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
            
            // AI thực hiện nước đi sau 500ms
            setTimeout(makeAIMove, 500);
        }
        
        clearHighlights();
        selectedSquare.style.outline = "";
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
            if (board[row + direction] && !board[row + direction][col]) {
                moves.push({toRow: row + direction, toCol: col});
                
                // Di chuyển 2 ô từ vị trí ban đầu
                if (row === startRow && !board[row + 2 * direction][col]) {
                    moves.push({toRow: row + 2 * direction, toCol: col});
                }
            }
            
            // Ăn chéo
            for (let dc of [-1, 1]) {
                if (board[row + direction] && board[row + direction][col + dc]) {
                    const target = board[row + direction][col + dc];
                    if ((isWhite && target === target.toLowerCase()) || 
                        (!isWhite && target === target.toUpperCase())) {
                        moves.push({toRow: row + direction, toCol: col + dc});
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
                    if (!target || (isWhite && target === target.toLowerCase()) || 
                        (!isWhite && target === target.toUpperCase())) {
                        moves.push({toRow: newRow, toCol: newCol});
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
                    if (!target || (isWhite && target === target.toLowerCase()) || 
                        (!isWhite && target === target.toUpperCase())) {
                        moves.push({toRow: newRow, toCol: newCol});
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
                moves.push({toRow: r, toCol: c});
            } else {
                if ((isWhite && target === target.toLowerCase()) || 
                    (!isWhite && target === target.toUpperCase())) {
                    moves.push({toRow: r, toCol: c});
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
                moves.push({toRow: r, toCol: c});
            } else {
                if ((isWhite && target === target.toLowerCase()) || 
                    (!isWhite && target === target.toUpperCase())) {
                    moves.push({toRow: r, toCol: c});
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
            square.style.backgroundColor = "rgba(0, 255, 0, 0.3)";
        }
    });
}

function clearHighlights() {
    document.querySelectorAll('.square').forEach(square => {
        square.style.backgroundColor = '';
    });
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState[fromRow][fromCol];
    gameState[toRow][toCol] = piece;
    gameState[fromRow][fromCol] = null;
    
    updateBoardDisplay();
    
    const move = `${String.fromCharCode(97 + fromCol)}${8 - fromRow} → ${String.fromCharCode(97 + toCol)}${8 - toRow}`;
    const li = document.createElement("li");
    li.textContent = move;
    moveListEl.appendChild(li);
}

function updateBoardDisplay() {
    const squares = document.querySelectorAll(".square");
    for (let i = 0; i < 64; i++) {
        const row = Math.floor(i / 8);
        const col = i % 8;
        squares[i].textContent = getPieceSymbol(gameState[row][col]);
    }
}

// AI sử dụng thuật toán Minimax
function makeAIMove() {
    const bestMove = findBestMove(gameState, 3); // Độ sâu 3
    if (bestMove) {
        makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
        currentPlayer = 'white';
    }
}

function findBestMove(board, depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    
    const moves = getAllValidMoves(board, 'black');
    
    for (let move of moves) {
        const newBoard = cloneBoard(board);
        newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
        newBoard[move.fromRow][move.fromCol] = null;
        
        const score = minimax(newBoard, depth - 1, -Infinity, Infinity, false);
        
        if (score > bestScore) {
            bestScore = score;
            bestMove = move;
        }
    }
    
    return bestMove;
}

function minimax(board, depth, alpha, beta, isMaximizing) {
    if (depth === 0) {
        return evaluateBoard(board);
    }
    
    const moves = getAllValidMoves(board, isMaximizing ? 'black' : 'white');
    
    if (isMaximizing) {
        let maxScore = -Infinity;
        for (let move of moves) {
            const newBoard = cloneBoard(board);
            newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
            newBoard[move.fromRow][move.fromCol] = null;
            
            const score = minimax(newBoard, depth - 1, alpha, beta, false);
            maxScore = Math.max(maxScore, score);
            alpha = Math.max(alpha, score);
            if (beta <= alpha) break;
        }
        return maxScore;
    } else {
        let minScore = Infinity;
        for (let move of moves) {
            const newBoard = cloneBoard(board);
            newBoard[move.toRow][move.toCol] = newBoard[move.fromRow][move.fromCol];
            newBoard[move.fromRow][move.fromCol] = null;
            
            const score = minimax(newBoard, depth - 1, alpha, beta, true);
            minScore = Math.min(minScore, score);
            beta = Math.min(beta, score);
            if (beta <= alpha) break;
        }
        return minScore;
    }
}

function getAllValidMoves(board, player) {
    const moves = [];
    const isBlack = player === 'black';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece && ((isBlack && piece === piece.toLowerCase()) || 
                         (!isBlack && piece === piece.toUpperCase()))) {
                const pieceMoves = getValidMoves(row, col, board);
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
    
    return moves;
}

function evaluateBoard(board) {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                score += PIECE_VALUES[piece];
                
                // Thêm điểm vị trí (đơn giản)
                if (piece === 'p') score += (7 - row); // Tốt đen tiến lên
                if (piece === 'P') score -= row; // Tốt trắng tiến lên
            }
        }
    }
    
    return score;
}

function cloneBoard(board) {
    return board.map(row => [...row]);
}

// Gọi hàm khi trang tải xong
window.addEventListener("DOMContentLoaded", () => {
    createBoard();
    setupPieces();
});
