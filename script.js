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
        draggable: false, 
        position: 'start',
        
        // Kỹ thuật Cache-Busting: Ép trình duyệt điện thoại tải lại ảnh mới hoàn toàn
        pieceTheme: function(piece) {
            // Thêm '?v=thời_gian_hiện_tại' để link ảnh luôn mới mẻ với trình duyệt
            var timestamp = new Date().getTime();
            return 'img/chesspieces/wikipedia/' + piece + '.png?v=' + timestamp;
        }
    };
    
    board = Chessboard('board', config);
    updateStatus();

    $board.off('click').on('click', '.square-55d63', onSquareClick);
}

/* =============================================================
   LOGIC XỬ LÝ CLICK ĐỂ DI CHUYỂN
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
   TRÍ TUỆ NHÂN TẠO (AI)
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
   GIAO DIỆN & TRẠNG THÁI GAME (Đã nâng cấp CSS màu sắc)
   ============================================================= */

function updateStatus() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'TRẮNG' : 'ĐEN';
    var $statusEl = $('#status');

    if (game.in_checkmate()) {
        status = 'HẾT CỜ! ' + moveColor + ' THUA.';
        $statusEl.css({'color': '#ff6b81', 'background-color': 'rgba(255, 107, 129, 0.2)', 'border': '1px solid #ff6b81'});
    } else if (game.in_draw()) {
        status = 'HÒA CỜ!';
        $statusEl.css({'color': '#feca57', 'background-color': 'rgba(254, 202, 87, 0.2)', 'border': '1px solid #feca57'});
    } else {
        status = 'LƯỢT ĐI: ' + moveColor;
        if (game.in_check()) {
            status += ' (BỊ CHIẾU!)';
            $statusEl.css({'color': '#ff6b81', 'background-color': 'rgba(255, 107, 129, 0.2)', 'border': '1px solid #ff6b81'});
        } else {
            // Sửa lại thành chữ Trắng tinh, nền sáng hơn để cực kỳ dễ nhìn
            $statusEl.css({'color': '#ffffff', 'background-color': 'rgba(255, 255, 255, 0.2)', 'border': '1px solid #ffffff'});
        }
        
        if (gameMode === 'pve' && game.turn() === 'b') {
            status = 'Máy đang suy nghĩ... ⚙️';
            // Máy nghĩ sẽ hiện màu xanh ngọc bích sáng
            $statusEl.css({'color': '#1dd1a1', 'background-color': 'rgba(29, 209, 161, 0.2)', 'border': '1px solid #1dd1a1'});
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
