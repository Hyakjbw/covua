// Định nghĩa các hằng số
const PIECE_TYPES = {
    EMPTY: 0,
    PAWN: 1,
    ROOK: 2,
    KNIGHT: 3,
    BISHOP: 4,
    QUEEN: 5,
    KING: 6
};

const COLORS = {
    WHITE: 0,
    BLACK: 1
};

const PIECE_SYMBOLS = {
    [COLORS.WHITE]: {
        [PIECE_TYPES.PAWN]: '♙',
        [PIECE_TYPES.ROOK]: '♖',
        [PIECE_TYPES.KNIGHT]: '♘',
        [PIECE_TYPES.BISHOP]: '♗',
        [PIECE_TYPES.QUEEN]: '♕',
        [PIECE_TYPES.KING]: '♔'
    },
    [COLORS.BLACK]: {
        [PIECE_TYPES.PAWN]: '♟',
        [PIECE_TYPES.ROOK]: '♜',
        [PIECE_TYPES.KNIGHT]: '♞',
        [PIECE_TYPES.BISHOP]: '♝',
        [PIECE_TYPES.QUEEN]: '♛',
        [PIECE_TYPES.KING]: '♚'
    }
};

const PIECE_VALUES = {
    [PIECE_TYPES.PAWN]: 10,
    [PIECE_TYPES.KNIGHT]: 30,
    [PIECE_TYPES.BISHOP]: 30,
    [PIECE_TYPES.ROOK]: 50,
    [PIECE_TYPES.QUEEN]: 90,
    [PIECE_TYPES.KING]: 900
};

// Lớp đại diện cho một quân cờ
class Piece {
    constructor(type, color) {
        this.type = type;
        this.color = color;
        this.hasMoved = false;
    }

    getSymbol() {
        return PIECE_SYMBOLS[this.color][this.type];
    }

    getValue() {
        return PIECE_VALUES[this.type];
    }

    clone() {
        const piece = new Piece(this.type, this.color);
        piece.hasMoved = this.hasMoved;
        return piece;
    }
}

// Lớp đại diện cho bàn cờ
class ChessBoard {
    constructor() {
        this.board = Array(8).fill().map(() => Array(8).fill(null));
        this.currentPlayer = COLORS.WHITE;
        this.selectedPiece = null;
        this.validMoves = [];
        this.moveHistory = [];
        this.capturedPieces = {
            [COLORS.WHITE]: [],
            [COLORS.BLACK]: []
        };
        this.initializeBoard();
    }

    initializeBoard() {
        // Thiết lập quân cờ đen
        this.board[0][0] = new Piece(PIECE_TYPES.ROOK, COLORS.BLACK);
        this.board[0][1] = new Piece(PIECE_TYPES.KNIGHT, COLORS.BLACK);
        this.board[0][2] = new Piece(PIECE_TYPES.BISHOP, COLORS.BLACK);
        this.board[0][3] = new Piece(PIECE_TYPES.QUEEN, COLORS.BLACK);
        this.board[0][4] = new Piece(PIECE_TYPES.KING, COLORS.BLACK);
        this.board[0][5] = new Piece(PIECE_TYPES.BISHOP, COLORS.BLACK);
        this.board[0][6] = new Piece(PIECE_TYPES.KNIGHT, COLORS.BLACK);
        this.board[0][7] = new Piece(PIECE_TYPES.ROOK, COLORS.BLACK);
        
        for (let i = 0; i < 8; i++) {
            this.board[1][i] = new Piece(PIECE_TYPES.PAWN, COLORS.BLACK);
        }

        // Thiết lập quân cờ trắng
        this.board[7][0] = new Piece(PIECE_TYPES.ROOK, COLORS.WHITE);
        this.board[7][1] = new Piece(PIECE_TYPES.KNIGHT, COLORS.WHITE);
        this.board[7][2] = new Piece(PIECE_TYPES.BISHOP, COLORS.WHITE);
        this.board[7][3] = new Piece(PIECE_TYPES.QUEEN, COLORS.WHITE);
        this.board[7][4] = new Piece(PIECE_TYPES.KING, COLORS.WHITE);
        this.board[7][5] = new Piece(PIECE_TYPES.BISHOP, COLORS.WHITE);
        this.board[7][6] = new Piece(PIECE_TYPES.KNIGHT, COLORS.WHITE);
        this.board[7][7] = new Piece(PIECE_TYPES.ROOK, COLORS.WHITE);
        
        for (let i = 0; i < 8; i++) {
            this.board[6][i] = new Piece(PIECE_TYPES.PAWN, COLORS.WHITE);
        }
    }

    getPiece(row, col) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return null;
        return this.board[row][col];
    }

    setPiece(row, col, piece) {
        if (row < 0 || row >= 8 || col < 0 || col >= 8) return;
        this.board[row][col] = piece;
    }

    selectPiece(row, col) {
        const piece = this.getPiece(row, col);
        if (piece && piece.color === this.currentPlayer) {
            this.selectedPiece = { row, col, piece };
            this.validMoves = this.calculateValidMoves(row, col);
            return true;
        }
        return false;
    }

    movePiece(fromRow, fromCol, toRow, toCol) {
        const piece = this.getPiece(fromRow, fromCol);
        if (!piece) return false;

        // Kiểm tra nước đi có hợp lệ không
        const isValidMove = this.validMoves.some(move => 
            move.row === toRow && move.col === toCol
        );

        if (!isValidMove) return false;

        // Lưu trạng thái trước khi di chuyển
        const capturedPiece = this.getPiece(toRow, toCol);
        const moveInfo = {
            from: { row: fromRow, col: fromCol },
            to: { row: toRow, col: toCol },
            piece: piece,
            captured: capturedPiece,
            hasMoved: piece.hasMoved
        };

        // Thực hiện di chuyển
        if (capturedPiece) {
            this.capturedPieces[this.currentPlayer].push(capturedPiece);
        }

        this.setPiece(toRow, toCol, piece);
        this.setPiece(fromRow, fromCol, null);
        piece.hasMoved = true;

        // Thêm vào lịch sử
        this.moveHistory.push(moveInfo);

        // Đổi lượt
        this.currentPlayer = this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;
        this.selectedPiece = null;
        this.validMoves = [];

        return true;
    }

    undoMove() {
        if (this.moveHistory.length === 0) return false;

        const lastMove = this.moveHistory.pop();
        const { from, to, piece, captured, hasMoved } = lastMove;

        // Khôi phục quân cờ
        this.setPiece(from.row, from.col, piece);
        this.setPiece(to.row, to.col, captured);
        piece.hasMoved = hasMoved;

        // Khôi phục quân bị bắt nếu có
        if (captured) {
            this.capturedPieces[this.currentPlayer].pop();
        }

        // Đổi lượt về người chơi trước
        this.currentPlayer = this.currentPlayer === COLORS.WHITE ? COLORS.BLACK : COLORS.WHITE;

        return true;
    }

    calculateValidMoves(row, col) {
        const piece = this.getPiece(row, col);
        if (!piece) return [];

        const moves = [];
        const directions = this.getMoveDirections(piece);

        for (const direction of directions) {
            for (let i = 1; i <= (piece.type === PIECE_TYPES.KNIGHT ? 1 : 7); i++) {
                const newRow = row + direction.dr * i;
                const newCol = col + direction.dc * i;

                // Kiểm tra xem có ra ngoài bàn cờ không
                if (newRow < 0 || newRow >= 8 || newCol < 0 || newCol >= 8) break;

                const targetPiece = this.getPiece(newRow, newCol);

                // Ô trống
                if (!targetPiece) {
                    moves.push({ row: newRow, col: newCol, capture: false });
                } 
                // Có quân đối phương
                else if (targetPiece.color !== piece.color) {
                    moves.push({ row: newRow, col: newCol, capture: true });
                    break; // Không thể đi xa hơn sau khi ăn quân
                } 
                // Có quân đồng minh
                else {
                    break; // Không thể đi qua quân đồng minh
                }

                // Các quân cờ như mã, tốt chỉ di chuyển một bước theo hướng
                if (piece.type === PIECE_TYPES.KNIGHT || piece.type === PIECE_TYPES.PAWN || piece.type === PIECE_TYPES.KING) {
                    break;
                }
            }
        }

        // Xử lý nước đi đặc biệt cho tốt
        if (piece.type === PIECE_TYPES.PAWN) {
            const direction = piece.color === COLORS.WHITE ? -1 : 1;
            
            // Di chuyển tiến 1 ô
            if (!this.getPiece(row + direction, col)) {
                moves.push({ row: row + direction, col: col, capture: false });
                
                // Di chuyển tiến 2 ô từ vị trí ban đầu
                if ((piece.color === COLORS.WHITE && row === 6) || 
                    (piece.color === COLORS.BLACK && row === 1)) {
                    if (!this.getPiece(row + 2 * direction, col)) {
                        moves.push({ row: row + 2 * direction, col: col, capture: false });
                    }
                }
            }
            
            // Ăn chéo
            for (const dc of [-1, 1]) {
                const newRow = row + direction;
                const newCol = col + dc;
                
                if (newRow >= 0 && newRow < 8 && newCol >= 0 && newCol < 8) {
                    const targetPiece = this.getPiece(newRow, newCol);
                    if (targetPiece && targetPiece.color !== piece.color) {
                        moves.push({ row: newRow, col: newCol, capture: true });
                    }
                }
            }
        }

        return moves;
    }

    getMoveDirections(piece) {
        switch (piece.type) {
            case PIECE_TYPES.PAWN:
                const direction = piece.color === COLORS.WHITE ? -1 : 1;
                return [{ dr: direction, dc: 0 }];
            
            case PIECE_TYPES.ROOK:
                return [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
                    { dr: 0, dc: -1 }, { dr: 0, dc: 1 }
                ];
            
            case PIECE_TYPES.KNIGHT:
                return [
                    { dr: -2, dc: -1 }, { dr: -2, dc: 1 },
                    { dr: -1, dc: -2 }, { dr: -1, dc: 2 },
                    { dr: 1, dc: -2 }, { dr: 1, dc: 2 },
                    { dr: 2, dc: -1 }, { dr: 2, dc: 1 }
                ];
            
            case PIECE_TYPES.BISHOP:
                return [
                    { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
                    { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
                ];
            
            case PIECE_TYPES.QUEEN:
                return [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
                    { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
                    { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
                    { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
                ];
            
            case PIECE_TYPES.KING:
                return [
                    { dr: -1, dc: 0 }, { dr: 1, dc: 0 },
                    { dr: 0, dc: -1 }, { dr: 0, dc: 1 },
                    { dr: -1, dc: -1 }, { dr: -1, dc: 1 },
                    { dr: 1, dc: -1 }, { dr: 1, dc: 1 }
                ];
            
            default:
                return [];
        }
    }

    clone() {
        const newBoard = new ChessBoard();
        newBoard.board = this.board.map(row => 
            row.map(piece => piece ? piece.clone() : null)
        );
        newBoard.currentPlayer = this.currentPlayer;
        newBoard.moveHistory = [...this.moveHistory];
        newBoard.capturedPieces = {
            [COLORS.WHITE]: [...this.capturedPieces[COLORS.WHITE]],
            [COLORS.BLACK]: [...this.capturedPieces[COLORS.BLACK]]
        };
        return newBoard;
    }

    isCheck(color) {
        // Tìm vua
        let kingRow, kingCol;
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.type === PIECE_TYPES.KING && piece.color === color) {
                    kingRow = row;
                    kingCol = col;
                    break;
                }
            }
        }

        // Kiểm tra xem có quân đối phương nào tấn công vua không
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color !== color) {
                    const moves = this.calculateValidMoves(row, col);
                    if (moves.some(move => move.row === kingRow && move.col === kingCol)) {
                        return true;
                    }
                }
            }
        }

        return false;
    }

    isCheckmate(color) {
        if (!this.isCheck(color)) return false;

        // Kiểm tra xem có nước đi nào để thoát chiếu không
        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece && piece.color === color) {
                    const moves = this.calculateValidMoves(row, col);
                    for (const move of moves) {
                        const testBoard = this.clone();
                        testBoard.movePiece(row, col, move.row, move.col);
                        if (!testBoard.isCheck(color)) {
                            return false;
                        }
                    }
                }
            }
        }

        return true;
    }

    evaluate() {
        let score = 0;

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = this.getPiece(row, col);
                if (piece) {
                    const value = piece.getValue();
                    // Thêm giá trị vị trí cho một số quân cờ
                    if (piece.type === PIECE_TYPES.PAWN) {
                        // Tốt ở trung tâm có giá trị cao hơn
                        const pawnTable = [
                            [0, 0, 0, 0, 0, 0, 0, 0],
                            [5, 5, 5, 5, 5, 5, 5, 5],
                            [1, 1, 2, 3, 3, 2, 1, 1],
                            [0, 0, 0, 2, 2, 0, 0, 0],
                            [0, 0, 0, 1, 1, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0],
                            [0, 0, 0, 0, 0, 0, 0, 0]
                        ];
                        score += (piece.color === COLORS.WHITE ? pawnTable[row][col] : pawnTable[7 - row][col]);
                    }

                    score += piece.color === COLORS.WHITE ? value : -value;
                }
            }
        }

        // Thêm điểm cho việc kiểm soát trung tâm
        const centerSquares = [[3, 3], [3, 4], [4, 3], [4, 4]];
        for (const [row, col] of centerSquares) {
            const piece = this.getPiece(row, col);
            if (piece) {
                score += piece.color === COLORS.WHITE ? 1 : -1;
            }
        }

        return score;
    }
}

// Lớp AI sử dụng thuật toán Minimax với cắt tỉa Alpha-Beta
class ChessAI {
    constructor(difficulty = 3) {
        this.difficulty = difficulty;
    }

    setDifficulty(difficulty) {
        this.difficulty = difficulty;
    }

    getBestMove(board) {
        const startTime = Date.now();
        let bestMove = null;
        let bestValue = -Infinity;
        const alpha = -Infinity;
        const beta = Infinity;

        // Lấy tất cả các nước đi có thể
        const moves = this.getAllPossibleMoves(board, COLORS.BLACK);

        // Sắp xếp các nước đi để tối ưu hóa cắt tỉa alpha-beta
        moves.sort((a, b) => {
            // Ưu tiên các nước đi ăn quân
            const aCapture = board.getPiece(a.to.row, a.to.col) ? 1 : 0;
            const bCapture = board.getPiece(b.to.row, b.to.col) ? 1 : 0;
            return bCapture - aCapture;
        });

        for (const move of moves) {
            const testBoard = board.clone();
            testBoard.movePiece(move.from.row, move.from.col, move.to.row, move.to.col);

            // Kiểm tra nếu nước đi này dẫn đến chiếu tướng cho AI
            if (testBoard.isCheck(COLORS.BLACK)) {
                continue;
            }

            const value = this.minimax(testBoard, this.difficulty - 1, alpha, beta, false);

            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        const endTime = Date.now();
        console.log(`AI took ${endTime - startTime}ms to make a move with depth ${this.difficulty}`);

        return bestMove;
    }

    minimax(board, depth, alpha, beta, maximizingPlayer) {
        if (depth === 0 || board.isCheckmate(COLORS.WHITE) || board.isCheckmate(COLORS.BLACK)) {
            return board.evaluate();
        }

        if (maximizingPlayer) {
            let maxEval = -Infinity;
            const moves = this.getAllPossibleMoves(board, COLORS.BLACK);

            for (const move of moves) {
                const testBoard = board.clone();
                testBoard.movePiece(move.from.row, move.from.col, move.to.row, move.to.col);
                
                // Bỏ qua các nước đi dẫn đến chiếu tướng
                if (testBoard.isCheck(COLORS.BLACK)) {
                    continue;
                }
                
                const eval = this.minimax(testBoard, depth - 1, alpha, beta, false);
                maxEval = Math.max(maxEval, eval);
                alpha = Math.max(alpha, eval);
                if (beta <= alpha) break;
            }
            return maxEval;
        } else {
            let minEval = Infinity;
            const moves = this.getAllPossibleMoves(board, COLORS.WHITE);

            for (const move of moves) {
                const testBoard = board.clone();
                testBoard.movePiece(move.from.row, move.from.col, move.to.row, move.to.col);
                
                // Bỏ qua các nước đi dẫn đến chiếu tướng
                if (testBoard.isCheck(COLORS.WHITE)) {
                    continue;
                }
                
                const eval = this.minimax(testBoard, depth - 1, alpha, beta, true);
                minEval = Math.min(minEval, eval);
                beta = Math.min(beta, eval);
                if (beta <= alpha) break;
            }
            return minEval;
        }
    }

    getAllPossibleMoves(board, color) {
        const moves = [];

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const piece = board.getPiece(row, col);
                if (piece && piece.color === color) {
                    const validMoves = board.calculateValidMoves(row, col);
                    for (const move of validMoves) {
                        moves.push({
                            from: { row, col },
                            to: { row: move.row, col: move.col }
                        });
                    }
                }
            }
        }

        return moves;
    }

    getHint(board) {
        // Tìm nước đi tốt nhất cho người chơi
        const moves = this.getAllPossibleMoves(board, COLORS.WHITE);
        let bestMove = null;
        let bestValue = -Infinity;

        for (const move of moves) {
            const testBoard = board.clone();
            testBoard.movePiece(move.from.row, move.from.col, move.to.row, move.to.col);
            
            // Bỏ qua các nước đi dẫn đến chiếu tướng
            if (testBoard.isCheck(COLORS.WHITE)) {
                continue;
            }
            
            const value = testBoard.evaluate();
            if (value > bestValue) {
                bestValue = value;
                bestMove = move;
            }
        }

        return bestMove;
    }
}

// Lớp quản lý giao diện người dùng
class ChessUI {
    constructor() {
        this.board = new ChessBoard();
        this.ai = new ChessAI(3);
        this.chessboardElement = document.getElementById('chessboard');
        this.gameStatusElement = document.getElementById('gameStatus');
        this.playerCapturedElement = document.getElementById('playerCaptured');
        this.aiCapturedElement = document.getElementById('aiCaptured');
        this.moveHistoryElement = document.getElementById('moveHistory');
        this.playerInfoElement = document.getElementById('playerInfo');
        this.aiInfoElement = document.getElementById('aiInfo');
        this.difficultySelect = document.getElementById('difficulty');
        
        this.initializeEventListeners();
        this.renderBoard();
        this.updateUI();
    }

    initializeEventListeners() {
        // Nút bắt đầu ván mới
        document.getElementById('newGame').addEventListener('click', () => {
            this.board = new ChessBoard();
            this.renderBoard();
            this.updateUI();
        });

        // Nút hoàn tác
        document.getElementById('undoMove').addEventListener('click', () => {
            if (this.board.undoMove()) {
                this.renderBoard();
                this.updateUI();
            }
        });

        // Nút gợi ý
        document.getElementById('hint').addEventListener('click', () => {
            this.showHint();
        });

        // Thay đổi độ khó
        this.difficultySelect.addEventListener('change', () => {
            this.ai.setDifficulty(parseInt(this.difficultySelect.value));
        });
    }

    renderBoard() {
        this.chessboardElement.innerHTML = '';

        for (let row = 0; row < 8; row++) {
            for (let col = 0; col < 8; col++) {
                const square = document.createElement('div');
                square.className = `square ${(row + col) % 2 === 0 ? 'white' : 'black'}`;
                square.dataset.row = row;
                square.dataset.col = col;

                // Đánh dấu ô được chọn
                if (this.board.selectedPiece && 
                    this.board.selectedPiece.row === row && 
                    this.board.selectedPiece.col === col) {
                    square.classList.add('selected');
                }

                // Đánh dấu các nước đi hợp lệ
                const isValidMove = this.board.validMoves.some(move => 
                    move.row === row && move.col === col
                );
                
                if (isValidMove) {
                    const targetPiece = this.board.getPiece(row, col);
                    if (targetPiece) {
                        square.classList.add('valid-capture');
                    } else {
                        square.classList.add('valid-move');
                    }
                }

                // Thêm quân cờ nếu có
                const piece = this.board.getPiece(row, col);
                if (piece) {
                    square.textContent = piece.getSymbol();
                }

                square.addEventListener('click', () => this.handleSquareClick(row, col));
                this.chessboardElement.appendChild(square);
            }
        }
    }

    handleSquareClick(row, col) {
        // Nếu đang là lượt của AI, bỏ qua
        if (this.board.currentPlayer === COLORS.BLACK) return;

        const piece = this.board.getPiece(row, col);

        // Nếu đã chọn một quân cờ và click vào ô hợp lệ
        if (this.board.selectedPiece) {
            const moveSuccess = this.board.movePiece(
                this.board.selectedPiece.row, 
                this.board.selectedPiece.col, 
                row, 
                col
            );

            if (moveSuccess) {
                this.renderBoard();
                this.updateUI();

                // Kiểm tra kết thúc trò chơi
                if (this.board.isCheckmate(COLORS.BLACK)) {
                    this.gameStatusElement.textContent = 'Bạn thắng!';
                    return;
                }

                // Đến lượt AI
                setTimeout(() => this.makeAIMove(), 500);
            } else if (piece && piece.color === COLORS.WHITE) {
                // Chọn quân cờ mới
                this.board.selectPiece(row, col);
                this.renderBoard();
            } else {
                // Bỏ chọn
                this.board.selectedPiece = null;
                this.board.validMoves = [];
                this.renderBoard();
            }
        } else if (piece && piece.color === COLORS.WHITE) {
            // Chọn quân cờ
            this.board.selectPiece(row, col);
            this.renderBoard();
        }
    }

    makeAIMove() {
        if (this.board.currentPlayer === COLORS.BLACK && !this.board.isCheckmate(COLORS.WHITE)) {
            const bestMove = this.ai.getBestMove(this.board);
            
            if (bestMove) {
                this.board.movePiece(
                    bestMove.from.row,
                    bestMove.from.col,
                    bestMove.to.row,
                    bestMove.to.col
                );
                
                this.renderBoard();
                this.updateUI();

                // Kiểm tra kết thúc trò chơi
                if (this.board.isCheckmate(COLORS.WHITE)) {
                    this.gameStatusElement.textContent = 'AI thắng!';
                }
            }
        }
    }

    showHint() {
        if (this.board.currentPlayer === COLORS.WHITE) {
            const hint = this.ai.getHint(this.board);
            if (hint) {
                // Làm nổi bật nước đi gợi ý
                this.board.selectedPiece = {
                    row: hint.from.row,
                    col: hint.from.col,
                    piece: this.board.getPiece(hint.from.row, hint.from.col)
                };
                this.board.validMoves = [{ row: hint.to.row, col: hint.to.col, capture: false }];
                this.renderBoard();
                
                // Tự động bỏ chọn sau 2 giây
                setTimeout(() => {
                    this.board.selectedPiece = null;
                    this.board.validMoves = [];
                    this.renderBoard();
                }, 2000);
            }
        }
    }

    updateUI() {
        // Cập nhật trạng thái trò chơi
        if (this.board.isCheckmate(COLORS.WHITE)) {
            this.gameStatusElement.textContent = 'AI thắng!';
        } else if (this.board.isCheckmate(COLORS.BLACK)) {
            this.gameStatusElement.textContent = 'Bạn thắng!';
        } else if (this.board.isCheck(COLORS.WHITE)) {
            this.gameStatusElement.textContent = 'Bạn đang bị chiếu!';
        } else if (this.board.isCheck(COLORS.BLACK)) {
            this.gameStatusElement.textContent = 'AI đang bị chiếu!';
        } else {
            this.gameStatusElement.textContent = this.board.currentPlayer === COLORS.WHITE 
                ? 'Lượt của bạn' 
                : 'AI đang suy nghĩ...';
        }

        // Cập nhật thông tin người chơi
        if (this.board.currentPlayer === COLORS.WHITE) {
            this.playerInfoElement.classList.add('active');
            this.aiInfoElement.classList.remove('active');
        } else {
            this.playerInfoElement.classList.remove('active');
            this.aiInfoElement.classList.add('active');
        }

        // Cập nhật quân bị bắt
        this.playerCapturedElement.innerHTML = '';
        this.board.capturedPieces[COLORS.WHITE].forEach(piece => {
            const capturedPiece = document.createElement('span');
            capturedPiece.className = 'captured-piece';
            capturedPiece.textContent = piece.getSymbol();
            this.playerCapturedElement.appendChild(capturedPiece);
        });

        this.aiCapturedElement.innerHTML = '';
        this.board.capturedPieces[COLORS.BLACK].forEach(piece => {
            const capturedPiece = document.createElement('span');
            capturedPiece.className = 'captured-piece';
            capturedPiece.textContent = piece.getSymbol();
            this.aiCapturedElement.appendChild(capturedPiece);
        });

        // Cập nhật lịch sử nước đi
        this.moveHistoryElement.innerHTML = '';
        this.board.moveHistory.forEach((move, index) => {
            const moveElement = document.createElement('div');
            moveElement.className = 'move';
            
            const fromSquare = this.getSquareName(move.from.row, move.from.col);
            const toSquare = this.getSquareName(move.to.row, move.to.col);
            
            moveElement.textContent = `${fromSquare} → ${toSquare}`;
            this.moveHistoryElement.appendChild(moveElement);
        });
    }

    getSquareName(row, col) {
        const files = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'];
        const ranks = ['8', '7', '6', '5', '4', '3', '2', '1'];
        return files[col] + ranks[row];
    }
}

// Khởi tạo trò chơi khi trang được tải
document.addEventListener('DOMContentLoaded', () => {
    new ChessUI();
});
