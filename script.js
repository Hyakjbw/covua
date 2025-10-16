// Sửa hàm onSquareClick để fix lỗi quân trắng tự ăn
function onSquareClick(square) {
    if (currentPlayer !== 'white') return;
    
    const row = parseInt(square.dataset.row);
    const col = parseInt(square.dataset.col);
    const piece = gameState[row][col];
    
    if (!selectedSquare) {
        // Chọn quân cờ - chỉ chọn quân trắng và không cho phép chọn ô trống
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
            
            // AI thực hiện nước đi ngay lập tức
            setTimeout(makeAIMove, 100);
        }
        
        clearHighlights();
        selectedSquare.classList.remove('selected');
        selectedSquare = null;
        validMoves = [];
    }
}

// Sửa hàm getValidMoves để ngăn quân trắng ăn quân trắng
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
            
            // Ăn chéo - CHỈ ăn quân đen
            for (let dc of [-1, 1]) {
                if (isValidPosition(row + direction, col + dc)) {
                    const target = board[row + direction][col + dc];
                    if (target) {
                        // Quân trắng chỉ được ăn quân đen (chữ thường)
                        if (isWhite && target === target.toLowerCase()) {
                            moves.push({toRow: row + direction, toCol: col + dc, type: 'capture'});
                        }
                        // Quân đen chỉ được ăn quân trắng (chữ hoa)
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
                        // Chỉ ăn quân đối phương
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
                        // Chỉ ăn quân đối phương
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

// Sửa hàm addStraightMoves và addDiagonalMoves để ngăn ăn quân cùng màu
function addStraightMoves(row, col, board, moves, isWhite) {
    const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
    for (let [dr, dc] of directions) {
        let r = row + dr, c = col + dc;
        while (isValidPosition(r, c)) {
            const target = board[r][c];
            if (!target) {
                moves.push({toRow: r, toCol: c, type: 'move'});
            } else {
                // Chỉ ăn quân đối phương
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
                // Chỉ ăn quân đối phương
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

// Sửa hàm makeAIMove để đảm bảo AI luôn tìm được nước đi
function makeAIMove() {
    console.log("AI is thinking...");
    
    const moves = getAllValidMoves(gameState, 'black');
    console.log("Available moves for AI:", moves.length);
    
    if (moves.length === 0) {
        console.log("No moves available for AI");
        currentPlayer = 'white';
        updateTurnIndicator();
        return;
    }
    
    const bestMove = findBestMove(gameState, 3);
    
    if (bestMove) {
        console.log("AI making move:", bestMove);
        makeMove(bestMove.fromRow, bestMove.fromCol, bestMove.toRow, bestMove.toCol);
        currentPlayer = 'white';
        updateTurnIndicator();
    } else {
        // Nếu không tìm được nước đi tốt nhất, chọn nước đi đầu tiên
        console.log("Using first available move");
        const firstMove = moves[0];
        makeMove(firstMove.fromRow, firstMove.fromCol, firstMove.toRow, firstMove.toCol);
        currentPlayer = 'white';
        updateTurnIndicator();
    }
}

// Sửa hàm findBestMove để xử lý trường hợp không có nước đi
function findBestMove(board, depth) {
    let bestScore = -Infinity;
    let bestMove = null;
    
    const moves = getAllValidMoves(board, 'black');
    
    if (moves.length === 0) {
        return null;
    }
    
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

// Sửa hàm makeMove để log ra thông tin
function makeMove(fromRow, fromCol, toRow, toCol) {
    const piece = gameState[fromRow][fromCol];
    const capturedPiece = gameState[toRow][toCol];
    
    console.log(`Move: ${getPieceSymbol(piece)} from (${fromRow},${fromCol}) to (${toRow},${toCol})`);
    if (capturedPiece) {
        console.log(`Captured: ${getPieceSymbol(capturedPiece)}`);
    }
    
    gameState[toRow][toCol] = piece;
    gameState[fromRow][fromCol] = null;
    
    updateBoardDisplay();
}

// Đảm bảo hàm getAllValidMoves hoạt động chính xác
function getAllValidMoves(board, player) {
    const moves = [];
    const isBlack = player === 'black';
    
    for (let row = 0; row < 8; row++) {
        for (let col = 0; col < 8; col++) {
            const piece = board[row][col];
            if (piece) {
                // Quân đen (chữ thường) hoặc quân trắng (chữ hoa)
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
