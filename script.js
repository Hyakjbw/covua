/* =============================================================
   CONFIGURATION & INITIALIZATION (SỬA LỖI HIỆN QUÂN)
   ============================================================= */
var board = null;
var game = new Chess();
var gameMode = 'pvp'; // Default

// Interaction State
var selectedSquare = null;
var $board = $('#board');

// Piece Image Path (Nâng cấp nguồn ảnh ổn định)
var pieceThemePath = 'https://chessboardjs.com/img/chesspieces/wikipedia/{piece}.png';

function initBoard() {
    var config = {
        // TẮT KÉO THẢ TƯỜNG MINH (NÂNG CẤP ĐỂ DÙNG ẤN)
        draggable: false, 
        position: 'start',
    };
    board = Chessboard('board', config);
    
    // NÂNG CẤP: Áp dụng ảnh quân cờ thủ công ngay khi khởi tạo
    applyPieceImagesManual();

    // Binds square clicks (NÂNG CẤP ĐỂ DÙNG ẤN)
    $board.on('click', '.square-55d63', onSquareClick);
    
    updateStatus();
}

// NÂNG CẤP: Hàm áp dụng ảnh quân cờ thủ công cho toàn bộ bàn cờ
function applyPieceImagesManual() {
    $('.square-55d63 img').each(function() {
        var piece = $(this).attr('data-piece');
        if (piece) {
            var url = pieceThemePath.replace('{piece}', piece);
            $(this).attr('src', url);
        }
    });
}

/* =============================================================
   INTERACTION LOGIC: CLICK TO MOVE (SỬA LỖI KÉO THẢ)
   ============================================================= */

// Remove old highlights
function removeHighlights() {
    $board.find('.square-55d63').removeClass('highlight-move highlight-selected');
}

// Visual feedback for selection and possible moves
function addHighlights(square, moves) {
    // Highlight ô đang chọn
    $board.find('.square-' + square).addClass('highlight-selected');
    
    // Highlight các ô đích hợp lệ
    moves.forEach(function(move) {
        $board.find('.square-' + move.to).addClass('highlight-move');
    });
}

// Logic handles 'Click-to-Move' (Ấn lần 1 -> Chọn quân; Ấn lần 2 -> Đi)
function onSquareClick() {
    // Prevent interaction on game over or AI's turn
    if (game.game_over() || (gameMode === 'pve' && game.turn() === 'b')) return;

    var square = $(this).attr('data-square');

    if (selectedSquare) {
        // --- STEP 2: Attempt the move from already selected piece ---
        var move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' // Auto-promote to Queen for simplicity
        });

        if (move) {
            // Valid move
            board.position(game.fen());
            
            // NÂNG CẤP: Áp dụng lại ảnh sau khi di chuyển
            applyPieceImagesManual(); 
            
            selectedSquare = null;
            removeHighlights();
            updateStatus();
            
            // PvE AI Turn
            if (gameMode === 'pve' && !game.game_over()) {
                window.setTimeout(makeSmartMove, 300);
            }
        } else {
            // Invalid move to new square: Check if new square has a same-color piece to re-select
            removeHighlights();
            handleFirstClick(square);
        }
    } else {
        // --- STEP 1: No piece selected, try to select one ---
        handleFirstClick(square);
    }
}

// Logic for initial selection and re-selection
function handleFirstClick(square) {
    var piece = game.get(square);
    
    // Ensure piece exists and is of correct turn
    if (piece && piece.color === game.turn()) {
        selectedSquare = square;
        var moves = game.moves({
            square: square,
            verbose: true
        });
        
        // No valid moves from this piece, deselect
        if (moves.length === 0) {
            selectedSquare = null;
            return;
        }

        // Show selection and possible moves
        addHighlights(square, moves);
    } else {
        selectedSquare = null;
    }
}

/* =============================================================
   AI LOGIC: MINIMAX + ALPHA-BETA (Giữ nguyên)
   ============================================================= */

// Bảng giá trị vị trí cho từng loại quân
var pawnEval = [
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0],
    [5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0,  5.0],
    [1.0,  1.0,  2.0,  3.0,  3.0,  2.0,  1.0,  1.0],
    [0.5,  0.5,  1.0,  2.5,  2.5,  1.0,  0.5,  0.5],
    [0.0,  0.0,  0.0,  2.0,  2.0,  0.0,  0.0,  0.0],
    [0.5, -0.5, -1.0,  0.0,  0.0, -1.0, -0.5,  0.5],
    [0.5,  1.0,  1.0, -2.0, -2.0,  1.0,  1.0,  0.5],
    [0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0]
];
var knightEval = [
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0],
    [-4.0, -2.0,  0.0,  0.0,  0.0,  0.0, -2.0, -4.0],
    [-3.0,  0.0,  1.0,  1.5,  1.5,  1.0,  0.0, -3.0],
    [-3.0,  0.5,  1.5,  2.0,  2.0,  1.5,  0.5, -3.0],
    [-3.0,  0.0,  1.5,  2.0,  2.0,  1.5,  0.0, -3.0],
    [-3.0,  0.5,  1.0,  1.5,  1.5,  1.0,  0.5, -3.0],
    [-4.0, -2.0,  0.0,  0.5,  0.5,  0.0, -2.0, -4.0],
    [-5.0, -4.0, -3.0, -3.0, -3.0, -3.0, -4.0, -5.0]
];
var bishopEval = [
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  1.0,  1.0,  0.5,  0.0, -1.0],
    [-1.0,  0.5,  0.5,  1.0,  1.0,  0.5,  0.5, -1.0],
    [-1.0,  0.0,  1.0,  1.0,  1.0,  1.0,  0.0, -1.0],
    [-1.0,  1.0,  1.0,  1.0,  1.0,  1.0,  1.0, -1.0],
    [-1.0,  0.5,  0.0,  0.0,  0.0,  0.0,  0.5, -1.0],
    [-2.0, -1.0, -1.0, -1.0, -1.0, -1.0, -1.0, -2.0]
];
var rookEval = [
    [0.0, 0.0, 0.0, 0.5, 0.5, 0.0, 0.0, 0.0],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [-0.5, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, -0.5],
    [ 0.5, 1.0, 1.0, 1.0, 1.0, 1.0, 1.0, 0.5],
    [ 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0, 0.0]
];
var evalQueen = [
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0],
    [-1.0,  0.0,  0.0,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-0.5,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [ 0.0,  0.0,  0.5,  0.5,  0.5,  0.5,  0.0, -0.5],
    [-1.0,  0.5,  0.5,  0.5,  0.5,  0.5,  0.0, -1.0],
    [-1.0,  0.0,  0.5,  0.0,  0.0,  0.0,  0.0, -1.0],
    [-2.0, -1.0, -1.0, -0.5, -0.5, -1.0, -1.0, -2.0]
];
var kingEval = [
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-3.0, -4.0, -4.0, -5.0, -5.0, -4.0, -4.0, -3.0],
    [-2.0, -3.0, -3.0, -4.0, -4.0, -3.0, -3.0, -2.0],
    [-1.0, -2.0, -2.0, -2.0, -2.0, -2.0, -2.0, -1.0],
    [ 2.0,  2.0,  0.0,  0.0,  0.0,  0.0,  2.0,  2.0],
    [ 2.0,  3.0,  1.0,  0.0,  0.0,  1.0,  3.0,  2.0]
];

// Trả về giá trị cơ bản của quân cờ
function getPieceValue(piece, x, y) {
    if (piece === null) return 0;
    
    // Hàm lấy giá trị từ bảng eval, đảo ngược bảng nếu là quân Đen
    function getValue(type, color, x, y) {
        var evalMap = { 'p': pawnEval, 'r': rookEval, 'n': knightEval, 'b': bishopEval, 'q': evalQueen, 'k': kingEval };
        var table = evalMap[type];
        if (color === 'w') return table[y][x];
        // Đối với quân đen, ta tính vị trí đối xứng
        return table[7 - y][x];
    }

    var absValue = 0;
    if (piece.type === 'p') absValue = 10 + getValue('p', piece.color, x, y);
    else if (piece.type === 'r') absValue = 50 + getValue('r', piece.color, x, y);
    else if (piece.type === 'n') absValue = 30 + getValue('n', piece.color, x, y);
    else if (piece.type === 'b') absValue = 30 + getValue('b', piece.color, x, y);
    else if (piece.type === 'q') absValue = 90 + getValue('q', piece.color, x, y);
    else if (piece.type === 'k') absValue = 900 + getValue('k', piece.color, x, y);

    return piece.color === 'w' ? absValue : -absValue;
}

// Hàm đánh giá tổng thể bàn cờ
function evaluateBoard(boardSate) {
    var totalEval = 0;
    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            totalEval += getPieceValue(boardSate[i][j], j, i);
        }
    }
    return totalEval;
}

// Thuật toán Minimax với Cắt tỉa Alpha-Beta
function minimax(depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) return -evaluateBoard(game.board());

    var newGameMoves = game.moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < newGameMoves.length; i++) {
            game.move(newGameMoves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    }
}

// Hàm tìm nước đi tốt nhất cho Máy (Đen)
function calcBestMove() {
    var newGameMoves = game.moves();
    var bestMove = null;
    var bestValue = -9999;
    var depth = 2; // Độ sâu tính toán

    for (var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.move(newGameMove);
        var value = minimax(depth - 1, game, -10000, 10000, false);
        game.undo();
        if (value >= bestValue) {
            bestValue = value;
            bestMove = newGameMove;
        }
    }
    return bestMove;
}

// Hàm thực hiện nước đi của Máy
function makeSmartMove() {
    if (game.game_over()) return;
    
    var bestMove = calcBestMove();
    game.move(bestMove);
    board.position(game.fen());
    applyPieceImagesManual(); // Áp dụng lại ảnh sau khi máy đi
    updateStatus();
}

/* =============================================================
   SYSTEM STATUS & EVENT HANDLERS (Giữ nguyên)
   ============================================================= */

function updateStatus() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'Trắng' : 'Đen';
    var $statusEl = $('#status');

    if (game.in_checkmate()) {
        status = 'HẾT CỜ! ' + moveColor + ' thua cuộc.';
        $statusEl.css('color', '#d9534f').css('border-color', '#d9534f');
    } else if (game.in_draw()) {
        status = 'HÒA CỜ!';
        $statusEl.css('color', '#777').css('border-color', '#777');
    } else {
        status = 'Lượt ' + moveColor;
        if (game.in_check()) {
            status += ' (ĐANG BỊ CHIẾU!)';
            $statusEl.css('color', '#d9534f').css('border-color', '#d9534f');
        } else {
            $statusEl.css('color', '#34495e').css('border-color', '#27ae60');
        }
        if (gameMode === 'pve' && game.turn() === 'b') {
            status = 'Máy đang suy nghĩ...';
        }
    }
    $statusEl.html(status);
}

$(document).ready(function() {
    initBoard();

    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        applyPieceImagesManual(); // NÂNG CẤP: Áp dụng lại ảnh sau khi chơi mới
        removeHighlights();
        selectedSquare = null;
        updateStatus();
    });

    $('#gameMode').on('change', function() {
        gameMode = $(this).val();
        $('#resetBtn').click();
    });
});
