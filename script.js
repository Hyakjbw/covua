// Khởi tạo bàn cờ và logic game
var board = null;
var game = new Chess();
var $status = $('#status');
var gameMode = 'pvp'; // 'pvp' (Người/Người) hoặc 'pve' (Người/Máy)

// Hàm cho Máy (AI cơ bản: chọn ngẫu nhiên một nước đi hợp lệ)
function makeRandomMove() {
    var possibleMoves = game.moves();
    
    // Nếu hết cờ hoặc hòa thì dừng
    if (possibleMoves.length === 0) return;

    var randomIdx = Math.floor(Math.random() * possibleMoves.length);
    game.move(possibleMoves[randomIdx]);
    
    // Cập nhật giao diện bàn cờ theo logic
    board.position(game.fen());
    updateStatus();
}

// Hàm kích hoạt khi người chơi bắt đầu nhấc 1 quân cờ lên
function onDragStart(source, piece, position, orientation) {
    // Không cho phép di chuyển nếu game đã kết thúc
    if (game.game_over()) return false;

    // Chỉ cho phép di chuyển quân của bên đang đến lượt
    if ((game.turn() === 'w' && piece.search(/^b/) !== -1) ||
        (game.turn() === 'b' && piece.search(/^w/) !== -1)) {
        return false;
    }

    // Nếu chơi với máy, người chơi chỉ được điều khiển quân Trắng
    if (gameMode === 'pve' && game.turn() === 'b') {
        return false;
    }
}

// Hàm kích hoạt khi người chơi thả quân cờ xuống ô mới
function onDrop(source, target) {
    // Thử thực hiện nước đi trên logic (chess.js)
    var move = game.move({
        from: source,
        to: target,
        promotion: 'q' // Luôn tự động phong Hậu khi Tốt đi tới đáy để đơn giản hóa giao diện
    });

    // Nếu nước đi sai luật, trả quân cờ về vị trí cũ
    if (move === null) return 'snapback';

    updateStatus();

    // Nếu đang chế độ chơi với máy và chưa hết game, gọi máy đi bước tiếp theo
    if (gameMode === 'pve' && !game.game_over()) {
        window.setTimeout(makeRandomMove, 300); // Đợi 0.3s rồi máy đi
    }
}

// Cập nhật lại đồ họa sau khi quân cờ đi xong (để hiển thị đúng nhập thành, phong cấp)
function onSnapEnd() {
    board.position(game.fen());
}

// Cập nhật trạng thái trận đấu (Lượt ai, chiếu, chiếu tướng, hòa...)
function updateStatus() {
    var statusHTML = '';
    var moveColor = (game.turn() === 'w') ? 'Trắng' : 'Đen';

    if (game.in_checkmate()) {
        statusHTML = 'Hết cờ! ' + moveColor + ' đã thua.';
    } else if (game.in_draw()) {
        statusHTML = 'Hòa cờ!';
    } else {
        statusHTML = 'Lượt ' + moveColor;
        if (game.in_check()) {
            statusHTML += ' (Đang bị chiếu!)';
        }
    }

    $status.html(statusHTML);
}

// Cấu hình thư viện bàn cờ
var config = {
    draggable: true,
    position: 'start',
    onDragStart: onDragStart,
    onDrop: onDrop,
    onSnapEnd: onSnapEnd
};

// Hiển thị bàn cờ lên web
board = Chessboard('board', config);
updateStatus();

// Xử lý nút Chơi lại
$('#resetBtn').on('click', function() {
    game.reset();
    board.start();
    updateStatus();
});

// Xử lý chuyển đổi chế độ chơi
$('#gameMode').on('change', function() {
    gameMode = $(this).val();
    game.reset();
    board.start();
    updateStatus();
});
