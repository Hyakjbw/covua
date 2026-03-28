/* =============================================================
   KHỞI TẠO BÀN CỜ VÀ TRỎ ĐƯỜNG DẪN ẢNH CHUẨN XÁC
   ============================================================= */
var board = null;
var game = new Chess();
var gameMode = 'pvp'; 
var selectedSquare = null;
var $board = $('#board');

function initBoard() {
    var config = {
        // 1. TẮT HOÀN TOÀN KÉO THẢ (Chuyển sang chế độ Ấn)
        draggable: false, 
        position: 'start',
        
        // 2. GIẢI PHÁP TỐI THƯỢNG CHO ẢNH QUÂN CỜ:
        // Lấy trực tiếp ảnh từ máy chủ gốc của tác giả thư viện (Đảm bảo 100% sống và tải được trên mọi thiết bị)
        pieceTheme: 'https://raw.githubusercontent.com/oakmac/chessboardjs/master/website/img/chesspieces/wikipedia/{piece}.png', 
    };
    
    board = Chessboard('board', config);
    updateStatus();

    // 3. ĐĂNG KÝ SỰ KIỆN CLICK/CHẠM CHO MỌI Ô CỜ
    $board.off('click').on('click', '.square-55d63', onSquareClick);
}

/* =============================================================
   LOGIC XỬ LÝ CLICK ĐỂ DI CHUYỂN (ẤN -> HIỆN ĐƯỜNG -> ẤN)
   ============================================================= */

function removeHighlights() {
    $board.find('.square-55d63').removeClass('highlight-move highlight-selected');
}

function addHighlights(square, moves) {
    $board.find('.square-' + square).addClass('highlight-selected');
    moves.forEach(function(move) {
        $board.find('.square-' + move.to).addClass('highlight-move');
    });
}

function onSquareClick() {
    if (game.game_over() || (gameMode === 'pve' && game.turn() === 'b')) return;

    var square = $(this).attr('data-square');

    if (selectedSquare === square) {
        selectedSquare = null;
        removeHighlights();
        return;
    }

    if (selectedSquare) {
        var move = game.move({
            from: selectedSquare,
            to: square,
            promotion: 'q' 
        });

        if (move) {
            board.position(game.fen()); 
            selectedSquare = null;
            removeHighlights();
            updateStatus();
            
            if (gameMode === 'pve' && !game.game_over()) {
                window.setTimeout(makeSmartMove, 300);
            }
        } else {
            var piece = game.get(square);
            if (piece && piece.color === game.turn()) {
                removeHighlights();
                selectedSquare = square;
                addHighlights(square, game.moves({ square: square, verbose: true }));
            } else {
                selectedSquare = null;
                removeHighlights();
            }
        }
    } else {
        var piece = game.get(square);
        if (piece && piece.color === game.turn()) {
            selectedSquare = square;
            var moves = game.moves({ square: square, verbose: true });
            if (moves.length > 0) {
                addHighlights(square, moves);
            } else {
                selectedSquare = null; 
            }
        }
    }
}

/* =============================================================
   TRÍ TUỆ NHÂN TẠO (AI) CƠ BẢN
   ============================================================= */

function evaluateBoard(gameSate) {
    var board = gameSate.board();
    var totalEval = 0;
    var pieceValues = { 'p': 10, 'r': 50, 'n': 30, 'b': 30, 'q': 90, 'k': 900 };

    for (var i = 0; i < 8; i++) {
        for (var j = 0; j < 8; j++) {
            var piece = board[i][j];
            if (piece) {
                var val = pieceValues[piece.type];
                totalEval += (piece.color === 'w') ? val : -val;
            }
        }
    }
    return totalEval;
}

function minimax(depth, game, alpha, beta, isMaximisingPlayer) {
    if (depth === 0) return -evaluateBoard(game);

    var moves = game.moves();

    if (isMaximisingPlayer) {
        var bestMove = -9999;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestMove = Math.max(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            alpha = Math.max(alpha, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    } else {
        var bestMove = 9999;
        for (var i = 0; i < moves.length; i++) {
            game.move(moves[i]);
            bestMove = Math.min(bestMove, minimax(depth - 1, game, alpha, beta, !isMaximisingPlayer));
            game.undo();
            beta = Math.min(beta, bestMove);
            if (beta <= alpha) return bestMove;
        }
        return bestMove;
    }
}

function calcBestMove() {
    var moves = game.moves();
    var bestMove = null;
    var bestValue = -9999;
    var depth = 2; 

    for (var i = 0; i < moves.length; i++) {
        var move = moves[i];
        game.move(move);
        var value = minimax(depth - 1, game, -10000, 10000, false);
        game.undo();
        
        value += Math.random() * 0.1; 

        if (value > bestValue) {
            bestValue = value;
            bestMove = move;
        }
    }
    return bestMove || moves[Math.floor(Math.random() * moves.length)];
}

function makeSmartMove() {
    if (game.game_over()) return;
    
    var bestMove = calcBestMove();
    game.move(bestMove);
    board.position(game.fen());
    updateStatus();
}

/* =============================================================
   GIAO DIỆN & TRẠNG THÁI GAME
   ============================================================= */

function updateStatus() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'Trắng' : 'Đen';
    var $statusEl = $('#status');

    if (game.in_checkmate()) {
        status = 'HẾT CỜ! ' + moveColor + ' thua.';
        $statusEl.css('color', '#d9534f').css('border-color', '#d9534f');
    } else if (game.in_draw()) {
        status = 'HÒA CỜ!';
        $statusEl.css('color', '#777').css('border-color', '#777');
    } else {
        status = 'Lượt ' + moveColor;
        if (game.in_check()) {
            status += ' (BỊ CHIẾU!)';
            $statusEl.css('color', '#d9534f').css('border-color', '#d9534f');
        } else {
            $statusEl.css('color', '#34495e').css('border-color', '#27ae60');
        }
        if (gameMode === 'pve' && game.turn() === 'b') {
            status = 'Máy đang nghĩ...';
        }
    }
    $statusEl.html(status);
}

$(document).ready(function() {
    initBoard();

    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        removeHighlights();
        selectedSquare = null;
        updateStatus();
    });

    $('#gameMode').on('change', function() {
        gameMode = $(this).val();
        $('#resetBtn').click();
    });
});
