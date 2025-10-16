// Sửa hàm onSquareClick để fix lỗi đường đi không clear và quân cờ mất
function onSquareClick(square) {
    if (currentPlayer !== 'white') return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = gameState[row][col];
    
    // Nếu đã có quân cờ được chọn trước đó
    if (selectedSquare) {
        const fromRow = parseInt(selectedSquare.dataset.row);
        const fromCol = parseInt(selectedSquare.dataset.col);
        
        // Nếu click vào cùng một quân cờ -> bỏ chọn
        if (fromRow === row && fromCol === col) {
            clearHighlights();
            selectedSquare.classList.remove('selected');
            selectedSquare = null;
            validMoves = [];
            return;
        }
        
        // Kiểm tra nước đi hợp lệ
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
        
        // Luôn clear highlights và bỏ chọn sau khi thử di chuyển
        clearHighlights();
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
        validMoves = [];
        
        // Nếu click vào quân cờ mới sau khi đã clear
        if (piece && piece === piece.toUpperCase() && !isValidMove) {
            selectedSquare = square;
            square.classList.add('selected');
            validMoves = getValidMoves(row, col, gameState);
            highlightValidMoves(validMoves);
        }
        
    } else {
        // Chọn quân cờ mới
        if (piece && piece === piece.toUpperCase()) {
            selectedSquare = square;
            square.classList.add('selected');
            validMoves = getValidMoves(row, col, gameState);
            highlightValidMoves(validMoves);
        }
    }
}

// Sửa hàm makeMove để thêm phong hậu cho tốt
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState[fromRow][fromCol];
    const capturedPiece = gameState[toRow][toCol];
    
    // Phong hậu cho tốt khi đến cuối bàn cờ
    if (piece.toLowerCase() === 'p') {
        if ((piece === 'P' && toRow === 0) || (piece === 'p' && toRow === 7)) {
            gameState[toRow][toCol] = piece === 'P' ? 'Q' : 'q'; // Phong thành hậu
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

// Sửa hàm makeAIMove để đảm bảo AI luôn đánh
function makeAIMove() {
    console.log("AI is thinking...");
    
    // Lấy tất cả nước đi hợp lệ của quân đen
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
    
    // Chọn nước đi ngẫu nhiên từ các nước đi hợp lệ (tạm thời)
    // Để đảm bảo AI luôn đánh được
    const randomMove = moves[Math.floor(Math.random() * moves.length)];
    console.log("AI making random move:", randomMove);
    
    makeMove(randomMove.fromRow, randomMove.fromCol, randomMove.toRow, randomMove.toCol);
    currentPlayer = 'white';
    updateTurnIndicator();
}

// Tạm thời comment hàm findBestMove phức tạp và dùng AI đơn giản
/*
function findBestMove(board, depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    
    const moves = getAllValidMoves(board, 'black');
    
    if (moves.length === 0) {
        return null;
    }
    
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
*/

// Sửa hàm getAllValidMoves để đảm bảo hoạt động chính xác
function getAllValidMoves(board, player) {
    const moves = [];
    const isBlack = player === 'black';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                const isPieceOfPlayer = (isBlack && piece === piece.toLowerCase()) || 
                                      (!isBlack && piece === piece.toUpperCase());
                
                if (isPieceOfPlayer) {
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
    }
    
    return moves;
}

// Thêm hàm reset highlights mạnh hơn
function clearHighlights() {
    document.querySelectorAll('.square').forEach(square => {
        square.classList.remove('valid-move', 'valid-capture', 'selected');
    });
}

// Sửa hàm resetGame để clear hoàn toàn
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
