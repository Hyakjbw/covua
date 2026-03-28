/* =============================================================
   CẤU HÌNH & KHỞI TẠO BÀN CỜ
   ============================================================= */
var board = null;
var game = new Chess();
var gameMode = 'pvp'; // Chế độ mặc định

// Lưu trữ trạng thái click
var squareSelected = null;
var $board = $('#board');

// Khởi tạo bàn cờ
function initBoard() {
    var config = {
        // draggable: true, // TẮT KÉO THẢ
        position: 'start',
        // SỬA LỖI KHÔNG HIỆN QUÂN CỜ: Trỏ đến link ảnh online
        pieceTheme: 'https://unpkg.com/@chrisoakman/chessboardjs@1.0.0/dist/img/chesspieces/wikipedia/{piece}.png',
    };
    board = Chessboard('board', config);
    
    // Đăng ký sự kiện click chuột/chạm vào ô cờ
    $board.on('click', '.square-55d63', onSquareClick);
    
    updateStatus();
}

/* =============================================================
   LOGIC XỬ LÝ CLICK ĐỂ DI CHUYỂN (Ấn -> Hiện đường -> Ấn)
   ============================================================= */

// Xóa các ô đang được tô màu highlight
function removeHighlights() {
    $board.find('.square-55d63').removeClass('highlight-move highlight-selected');
}

// Thêm màu highlight vào ô được chọn và các ô có thể đi đến
function addHighlights(square, moves) {
    // Highlight ô đang chọn
    $board.find('.square-' + square).addClass('highlight-selected');
    
    // Highlight các ô đích hợp lệ
    moves.forEach(function(move) {
        $board.find('.square-' + move.to).addClass('highlight-move');
    });
}

// Xử lý khi click vào 1 ô trên bàn cờ
function onSquareClick() {
    // Nếu game kết thúc hoặc đến lượt máy đi ở chế độ PvE, không cho click
    if (game.game_over() || (gameMode === 'pve' && game.turn() === 'b')) return;

    var square = $(this).attr('data-square');

    // --- BƯỚC 2: Ấn lần 2 (Đã chọn quân, giờ chọn ô đích để đi) ---
    if (squareSelected) {
        // Thử thực hiện nước đi
        var move = game.move({
            from: squareSelected,
            to: square,
            promotion: 'q' // Tự động phong Hậu để đơn giản giao diện
        });

        // Nếu nước đi hợp lệ
        if (move) {
            board.position(game.fen()); // Cập nhật hình ảnh
            removeHighlights();
            squareSelected = null; // Reset trạng thái chọn
            updateStatus();
            
            // Nếu chế độ chơi với máy, gọi AI đi sau 300ms
            if (gameMode === 'pve' && !game.game_over()) {
                window.setTimeout(makeSmartMove, 300);
            }
        } 
        // Nếu click vào ô không hợp lệ, hoặc click lại chính quân đó, hoặc click quân cùng màu khác
        else {
            removeHighlights();
            squareSelected = null;
            // Quay lại bước 1: xem ô mới click có phải quân mình không để chọn lại
            handleFirstClick(square);
        }
    } 
    // --- BƯỚC 1: Ấn lần 1 (Chọn quân cờ) ---
    else {
        handleFirstClick(square);
    }
}

// Logic xử lý khi chưa chọn quân nào
function handleFirstClick(square) {
    // Lấy thông tin quân cờ tại ô vừa click
    var piece = game.get(square);
    
    // Nếu click vào ô trống hoặc quân đối phương -> không làm gì
    if (!piece || piece.color !== game.turn()) return;

    // Lấy danh sách các nước đi hợp lệ của quân này
    var moves = game.moves({
        square: square,
        verbose: true
    });

    // Nếu không có nước đi nào -> không chọn
    if (moves.length === 0) return;

    // Lưu ô đã chọn và hiển thị highlight đường đi
    squareSelected = square;
    addHighlights(square, moves);
}


/* =============================================================
   TRÍ TUỆ NHÂN TẠO (AI) NÂNG CẤP: MINIMAX + ALPHA-BETA
   ============================================================= */

// Bảng giá trị vị trí cho từng loại quân (giúp máy biết chiếm trung tâm, phát triển quân)
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
    
    // Độ sâu tính toán (Tăng lên máy sẽ khôn hơn nhưng chậm hơn)
    // Mức 2 là vừa phải cho trình duyệt web
    var depth = 2; 

    // Thử từng nước đi và đánh giá
    for (var i = 0; i < newGameMoves.length; i++) {
        var newGameMove = newGameMoves[i];
        game.move(newGameMove);
        
        // Tính giá trị nước đi bằng Minimax
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
    updateStatus();
}

/* =============================================================
   CẬP NHẬT TRẠNG THÁI & HỆ THỐNG
   ============================================================= */

function updateStatus() {
    var status = '';
    var moveColor = (game.turn() === 'w') ? 'Trắng' : 'Đen';
    var $statusEl = $('#status');

    // Kiểm tra hết cờ, hòa
    if (game.in_checkmate()) {
        status = 'HẾT CỜ! ' + moveColor + ' thua cuộc.';
        $statusEl.css('color', '#d9534f').css('border-color', '#d9534f');
    } else if (game.in_draw()) {
        status = 'HÒA CỜ!';
        $statusEl.css('color', '#777').css('border-color', '#777');
    } else {
        // Đang chơi
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

// Xử lý sự kiện thay đổi chế độ chơi và nút chơi mới
$(document).ready(function() {
    initBoard();

    $('#resetBtn').on('click', function() {
        game.reset();
        board.start();
        removeHighlights();
        squareSelected = null;
        updateStatus();
    });

    $('#gameMode').on('change', function() {
        gameMode = $(this).val();
        $('#resetBtn').click(); // Chơi ván mới khi đổi chế độ
    });
});
