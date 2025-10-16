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

// Bảng điểm vị trí cho các quân cờ
const POSITION_WEIGHTS = {
    'p': [
        [0, 0, 0, 0, 0, 0, 0, 0],
        [50, 50, 50, 50, 50, 50, 50, 50],
        [10, 10, 20, 30, 30, 20, 10, 10],
        [5, 5, 10, 25, 25, 10, 5, 5],
        [0, 0, 0, 20, 20, 0, 0, 0],
        [5, -5, -10, 0, 0, -10, -5, 5],
        [5, 10, 10, -20, -20, 10, 10, 5],
        [0, 0, 0, 0, 0, 0, 0, 0]
    ],
    'n': [
        [-50, -40, -30, -30, -30, -30, -40, -50],
        [-40, -20, 0, 0, 0, 0, -20, -40],
        [-30, 0, 10, 15, 15, 10, 0, -30],
        [-30, 5, 15, 20, 20, 15, 5, -30],
        [-30, 0, 15, 20, 20, 15, 0, -30],
        [-30, 5, 10, 15, 15, 10, 5, -30],
        [-40, -20, 0, 5, 5, 0, -20, -40],
        [-50, -40, -30, -30, -30, -30, -40, -50]
    ]
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
        if (piece && piece === piece.toUpperCase()) { // Chỉ chọn quân trắng
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
            
            // AI thực hiện nước đi sau 600ms
            setTimeout(makeAIMove, 600);
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
                if (row === startRow && !board[row + 2 * direction][col]) {
                    moves.push({toRow: row + 2 * direction, toCol: col, type: 'move'});
                }
            }
            
            // Ăn chéo
            for (let dc of [-1, 1]) {
                if (isValidPosition(row + direction, col + dc)) {
                    const target = board[row + direction][col + dc];
                    if (target && ((isWhite && target === target.toLowerCase()) || 
                                  (!isWhite && target === target.toUpperCase()))) {
                        moves.push({toRow: row + direction, toCol: col + dc, type: 'capture'});
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
                    } else if ((isWhite && target === target.toLowerCase()) || 
                              (!isWhite && target === target.toUpperCase())) {
                        moves.push({toRow: newRow, toCol: newCol, type: 'capture'});
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
                    } else if ((isWhite && target === target.toLowerCase()) || 
                              (!isWhite && target === target.toUpperCase())) {
                        moves.push({toRow: newRow, toCol: newCol, type: 'capture'});
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
        square.classList.remove('valid-move', 'valid-capture');
    });
}

function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState[fromRow][fromCol];
    gameState[toRow][toCol] = piece;
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

// AI sử dụng thuật toán Minimax với Alpha-Beta Pruning
function makeAIMove() {
    const bestMove = findBestMove(gameState, 3); // Độ sâu 3
    if (bestMove) {
        makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
        currentPlayer = 'white';
        updateTurnIndicator();
    }
}

function findBestMove(board, depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    
    const moves = getAllValidMoves(board, 'black');
    
    // Sắp xếp các nước đi để tối ưu alpha-beta pruning
    moves.sort((a, b) => {
        const scoreA = evaluateMove(a, board);
        const scoreB = evaluateMove(b, board);
        return scoreB - scoreA;
    });
    
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

function evaluateMove(move, board) {
    const piece = board[move.fromRow][move.fromCol];
    const target = board[move.toRow][move.toCol];
    
    let score = 0;
    
    // Ưu tiên ăn quân
    if (target) {
        score += Math.abs(PIECE_VALUES[target]) * 10;
    }
    
    // Ưu tiên di chuyển quân giá trị thấp
    score -= Math.abs(PIECE_VALUES[piece]) * 0.1;
    
    return score;
}

function evaluateBoard(board) {
    let score = 0;
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                // Giá trị cơ bản của quân cờ
                score += PIECE_VALUES[piece];
                
                // Điểm vị trí
                const pieceType = piece.toLowerCase();
                if (POSITION_WEIGHTS[pieceType]) {
                    const weight = piece === pieceType ? 
                        POSITION_WEIGHTS[pieceType][row][col] : 
                        -POSITION_WEIGHTS[pieceType][7 - row][col];
                    score += weight;
                }
                
                // Thưởng điểm cho tốt tiến lên
                if (pieceType === 'p') {
                    if (piece === 'p') score += (7 - row) * 5; // Tốt đen
                    else score -= row * 5; // Tốt trắng
                }
            }
        }
    }
    
    return score;
}

function cloneBoard(board) {
    return board.map(row => [...row]);
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
}

// Khởi tạo game
window.addEventListener("DOMContentLoaded", () => {
    createBoard();
    setupPieces();
    updateTurnIndicator();
});
