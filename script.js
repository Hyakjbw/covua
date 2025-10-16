// script.js
// Simple chess UI + JS engine (negamax + alpha-beta + quiescence).
// Limitations: reasonably complete legal move generation (including castling, en-passant is not implemented),
// repetition / 50-move rule not tracked. Good for training / casual play. For top strength integrate Stockfish WASM.

(() => {
  // --- Board representation
  // 8x8 board, 0..7 rows (rank 8 down to 1 for rendering convenience)
  // pieces: uppercase = White, lowercase = Black
  const initialFEN = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
  let board = [];
  let turn = 'w';
  let moveHistory = [];
  let selected = null;
  let legalCache = null;
  const boardEl = document.getElementById('board');
  const statusEl = document.getElementById('status');
  const movelistEl = document.getElementById('movelist');
  const botDepthEl = document.getElementById('botDepth');

  // piece unicode
  const pUnicode = {
    'P':'♙','N':'♘','B':'♗','R':'♖','Q':'♕','K':'♔',
    'p':'♟︎','n':'♞','b':'♝','r':'♜','q':'♛','k':'♚'
  };

  function fenToBoard(fen) {
    const parts=fen.split(' ');
    const rows = parts[0].split('/');
    let b = Array(8).fill().map(()=>Array(8).fill(''));
    for (let r=0;r<8;r++){
      let file=0;
      for (let ch of rows[r]){
        if (/\d/.test(ch)) file += parseInt(ch);
        else {
          b[r][file]=ch; file++;
        }
      }
    }
    turn = parts[1] === 'w' ? 'w' : 'b';
    return b;
  }

  function boardToFen() {
    let rows=[];
    for (let r=0;r<8;r++){
      let row="", empty=0;
      for (let c=0;c<8;c++){
        const p=board[r][c];
        if (!p){ empty++; } else { if (empty){ row+=empty; empty=0;} row+=p; }
      }
      if (empty) row+=empty;
      rows.push(row);
    }
    return rows.join('/') + ' ' + (turn==='w'?'w':'b') + ' - 0 1';
  }

  // --- Rendering
  function render() {
    boardEl.innerHTML='';
    for (let r=0;r<8;r++){
      for (let c=0;c<8;c++){
        const sq = document.createElement('div');
        sq.className = 'square ' + (((r+c)%2) ? 'dark':'light');
        sq.dataset.r=r; sq.dataset.c=c;
        const p = board[r][c];
        if (p) {
          const span = document.createElement('span');
          span.textContent = pUnicode[p] || p;
          span.style.fontSize = '48px';
          sq.appendChild(span);
        }
        // event
        sq.addEventListener('click', onSquareClick);
        boardEl.appendChild(sq);
      }
    }
    statusEl.textContent = (turn==='w'?'White':'Black') + "'s turn";
    updateMovelist();
    highlightLegal();
  }

  function highlightLegal() {
    // clear all selected/hints
    document.querySelectorAll('.square').forEach(el=>{
      el.classList.remove('selected','captureHint');
      const h = el.querySelector('.hint'); if (h) h.remove();
    });
    if (!selected) return;
    const [sr,sc]=selected;
    const elSel = squareEl(sr,sc); if (elSel) elSel.classList.add('selected');
    const moves = legalMovesFor(sr,sc);
    for (let m of moves){
      const [r,c]=m.to;
      const el = squareEl(r,c);
      if (!el) continue;
      if (board[r][c]) el.classList.add('captureHint');
      else {
        const hint = document.createElement('div'); hint.className='hint';
        el.appendChild(hint);
      }
    }
  }

  function squareEl(r,c){
    // board grid appended row-major, 8x8
    const idx = r*8 + c;
    return boardEl.children[idx];
  }

  // --- Moves & legality
  function inside(r,c){ return r>=0 && r<8 && c>=0 && c<8; }
  function isWhite(p){ return !!p && p === p.toUpperCase(); }
  function isBlack(p){ return !!p && p === p.toLowerCase(); }

  function legalMovesFor(r,c){
    const p = board[r][c];
    if (!p) return [];
    const color = isWhite(p)?'w':'b';
    if ((color==='w' && turn!=='w') || (color==='b' && turn!=='b')) return [];
    // generate pseudo-legal moves
    const pseudos = generatePseudoMoves(r,c);
    // filter out moves leaving own king in check
    const legals = [];
    for (let mv of pseudos){
      makeMove(mv, true);
      const kingSafe = !isKingAttacked(color);
      undoMove();
      if (kingSafe) legals.push(mv);
    }
    return legals;
  }

  function generatePseudoMoves(r,c){
    const p = board[r][c];
    const out = [];
    if (!p) return out;
    const color = isWhite(p)?'w':'b';
    const forward = color==='w' ? -1 : 1; // board row 0 is rank8
    const enemy = color==='w' ? isBlack : isWhite;
    const ally = color==='w' ? isWhite : isBlack;

    const add = (tr,tc,type='move') => out.push({from:[r,c],to:[tr,tc],piece:p,capture:board[tr][tc]||null,meta:type});

    const t = p.toLowerCase();
    if (t==='p'){
      // pawn moves
      const oneR = r + forward;
      if (inside(oneR,c) && !board[oneR][c]) add(oneR,c);
      // double
      const startRow = (color==='w'?6:1);
      const twoR = r + 2*forward;
      if (r===startRow && inside(twoR,c) && !board[oneR][c] && !board[twoR][c]) add(twoR,c);
      // captures
      for (let dc of [-1,1]){
        const cr=c+dc;
        if (inside(oneR,cr) && board[oneR][cr] && enemy(board[oneR][cr])) add(oneR,cr,'capture');
      }
      // NOTE: en-passant not implemented
    } else if (t==='n'){
      const steps = [[-2,-1],[-2,1],[-1,-2],[-1,2],[1,-2],[1,2],[2,-1],[2,1]];
      for (let s of steps){
        const tr=r+s[0], tc=c+s[1];
        if (!inside(tr,tc)) continue;
        if (!board[tr][tc] || enemy(board[tr][tc])) add(tr,tc, board[tr][tc] ? 'capture' : 'move');
      }
    } else if (t==='b' || t==='q'){
      const dirs = [[-1,-1],[-1,1],[1,-1],[1,1]];
      for (let d of dirs){
        let tr=r+d[0], tc=c+d[1];
        while (inside(tr,tc)){
          if (!board[tr][tc]) add(tr,tc);
          else { if (enemy(board[tr][tc])) add(tr,tc,'capture'); break; }
          tr+=d[0]; tc+=d[1];
        }
      }
    }
    if (t==='r' || t==='q'){
      const dirs = [[-1,0],[1,0],[0,-1],[0,1]];
      for (let d of dirs){
        let tr=r+d[0], tc=c+d[1];
        while (inside(tr,tc)){
          if (!board[tr][tc]) add(tr,tc);
          else { if (enemy(board[tr][tc])) add(tr,tc,'capture'); break; }
          tr+=d[0]; tc+=d[1];
        }
      }
    }
    if (t==='k'){
      for (let dr=-1;dr<=1;dr++) for (let dc=-1;dc<=1;dc++){
        if (dr===0 && dc===0) continue;
        const tr=r+dr, tc=c+dc;
        if (!inside(tr,tc)) continue;
        if (!board[tr][tc] || enemy(board[tr][tc])) add(tr,tc, board[tr][tc] ? 'capture' : 'move');
      }
      // castling (basic): check rook present and squares empty and not in check
      if (isWhite(p) && r===7 && c===4){
        // kingside
        if (board[7][7] && board[7][7]==='R' && !board[7][5] && !board[7][6]){
          add(7,6,'castleK');
        }
        if (board[7][0] && board[7][0]==='R' && !board[7][1] && !board[7][2] && !board[7][3]){
          add(7,2,'castleQ');
        }
      }
      if (isBlack(p) && r===0 && c===4){
        if (board[0][7] && board[0][7]==='r' && !board[0][5] && !board[0][6]){
          add(0,6,'castleK');
        }
        if (board[0][0] && board[0][0]==='r' && !board[0][1] && !board[0][2] && !board[0][3]){
          add(0,2,'castleQ');
        }
      }
    }
    return out;
  }

  // --- make / undo moves (simple stack)
  const stack = [];
  function makeMove(move, silent=false){
    const [fr,fc]=move.from, [tr,tc]=move.to;
    const piece = board[fr][fc];
    const captured = board[tr][tc];
    // for castling, move rook too
    stack.push({move, piece, captured, prevTurn:turn});
    board[fr][fc]='';
    board[tr][tc]=piece;
    // handle castle meta
    if (move.meta==='castleK'){
      if (piece==='K'){ board[tr][tc]='K'; board[fr][fc]=''; board[tr][tc]; board[tr][tc]; board[tr][tc];
        // rook from h to f
        board[tr][5]=board[tr][7]; board[tr][7]='';
      } else if (piece==='k'){
        board[tr][5]=board[tr][7]; board[tr][7]='';
      }
    } else if (move.meta==='castleQ'){
      if (piece==='K'){ board[tr][tc]='K'; board[tr][3]=board[tr][0]; board[tr][0]=''; }
      else if (piece==='k'){ board[tr][tc]='k'; board[tr][3]=board[tr][0]; board[tr][0]=''; }
    }
    // pawn promotion auto-queen
    if ((piece==='P' && tr===0) || (piece==='p' && tr===7)){
      board[tr][tc] = (piece==='P'?'Q':'q');
    }
    turn = (turn==='w'?'b':'w');
    if (!silent){
      moveHistory.push(moveNotation(move, piece, captured));
    }
  }
  function undoMove(){
    const state = stack.pop();
    if (!state) return;
    const {move,piece,captured,prevTurn} = state;
    const [fr,fc]=move.from, [tr,tc]=move.to;
    board[fr][fc]=piece;
    board[tr][tc]=captured;
    // undo castle rook movement
    if (move.meta==='castleK'){
      if (piece==='K' || piece==='k'){
        board[tr][7]=board[tr][5];
        board[tr][5]='';
      }
    } else if (move.meta==='castleQ'){
      if (piece==='K' || piece==='k'){
        board[tr][0]=board[tr][3];
        board[tr][3]='';
      }
    }
    turn = prevTurn;
    moveHistory.pop();
  }

  // --- king attacked?
  function isKingAttacked(color){
    // find king
    let kr=-1,kc=-1;
    const target = color==='w' ? 'K':'k';
    for (let r=0;r<8;r++) for (let c=0;c<8;c++) if (board[r][c]===target){ kr=r; kc=c; }
    if (kr===-1) return true; // no king => attacked
    // generate all enemy pseudo moves and see if any to king
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]; if (!p) continue;
      const colorP = isWhite(p)?'w':'b';
      if (colorP===color) continue;
      const arr = generatePseudoMoves(r,c);
      for (let m of arr) if (m.to[0]===kr && m.to[1]===kc) return true;
    }
    return false;
  }

  // --- notation for movelist (simple)
  function moveNotation(m, piece, capture){
    const from = rcToAlg(m.from[0],m.from[1]);
    const to = rcToAlg(m.to[0],m.to[1]);
    const pct = (piece && (piece.toLowerCase()!=='p')) ? piece.toUpperCase() : '';
    return `${pct}${from}${capture? 'x': ''}${to}`;
  }
  function rcToAlg(r,c){
    const file = 'abcdefgh'[c];
    const rank = 8 - r;
    return file + rank;
  }

  // --- Movelist UI
  function updateMovelist(){
    movelistEl.innerHTML='';
    for (let i=0;i<moveHistory.length;i++){
      const li = document.createElement('li');
      li.textContent = moveHistory[i];
      movelistEl.appendChild(li);
    }
  }

  // --- UI events
  function onSquareClick(e){
    const el = e.currentTarget;
    const r = parseInt(el.dataset.r), c = parseInt(el.dataset.c);
    const p = board[r][c];
    if (selected){
      // attempt move selected -> r,c
      const moves = legalMovesFor(selected[0], selected[1]);
      const chosen = moves.find(m => m.to[0]===r && m.to[1]===c);
      if (chosen){
        makeMove(chosen);
        selected=null;
        render();
        window.setTimeout(()=>{ maybeBotMove(); }, 50);
        return;
      }
    }
    // else if piece of player's turn selected
    if (p && ((isWhite(p) && turn==='w') || (isBlack(p) && turn==='b')) ){
      selected=[r,c];
      render();
    } else {
      selected=null;
      render();
    }
  }

  // --- Simple engine: negamax with alpha-beta, quiescence, piece-square
  const pieceValues = { 'p':100,'n':320,'b':330,'r':500,'q':900,'k':20000 };
  const pst_w = {
    p: [
      [0,0,0,0,0,0,0,0],
      [5,10,10,-20,-20,10,10,5],
      [5,-5,-10,0,0,-10,-5,5],
      [0,0,0,20,20,0,0,0],
      [5,5,10,25,25,10,5,5],
      [10,10,20,30,30,20,10,10],
      [50,50,50,50,50,50,50,50],
      [0,0,0,0,0,0,0,0]
    ],
    n:[
      [-50,-40,-30,-30,-30,-30,-40,-50],
      [-40,-20,0,0,0,0,-20,-40],
      [-30,0,10,15,15,10,0,-30],
      [-30,5,15,20,20,15,5,-30],
      [-30,0,15,20,20,15,0,-30],
      [-30,5,10,15,15,10,5,-30],
      [-40,-20,0,5,5,0,-20,-40],
      [-50,-40,-30,-30,-30,-30,-40,-50]
    ],
    b:[
      [-20,-10,-10,-10,-10,-10,-10,-20],
      [-10,0,0,0,0,0,0,-10],
      [-10,0,5,10,10,5,0,-10],
      [-10,5,5,10,10,5,5,-10],
      [-10,0,10,10,10,10,0,-10],
      [-10,10,10,10,10,10,10,-10],
      [-10,5,0,0,0,0,5,-10],
      [-20,-10,-10,-10,-10,-10,-10,-20]
    ],
    r:[
      [0,0,0,5,5,0,0,0],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [-5,0,0,0,0,0,0,-5],
      [5,10,10,10,10,10,10,5],
      [0,0,0,0,0,0,0,0]
    ],
    q:[
      [-20,-10,-10,-5,-5,-10,-10,-20],
      [-10,0,0,0,0,0,0,-10],
      [-10,0,5,5,5,5,0,-10],
      [-5,0,5,5,5,5,0,-5],
      [0,0,5,5,5,5,0,-5],
      [-10,5,5,5,5,5,0,-10],
      [-10,0,5,0,0,0,0,-10],
      [-20,-10,-10,-5,-5,-10,-10,-20]
    ],
    k:[
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-30,-40,-40,-50,-50,-40,-40,-30],
      [-20,-30,-30,-40,-40,-30,-30,-20],
      [-10,-20,-20,-20,-20,-20,-20,-10],
      [20,20,0,0,0,0,20,20],
      [20,30,10,0,0,10,30,20]
    ]
  };

  function materialAndPST() {
    let score = 0;
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c];
      if (!p) continue;
      const lower = p.toLowerCase();
      const val = pieceValues[lower] || 0;
      const pst = (pst_w[lower] && pst_w[lower][r] && pst_w[lower][r][c]) || 0;
      if (isWhite(p)) score += val + pst;
      else score -= val + pst;
    }
    return score;
  }

  function evaluate() {
    // simple evaluate from white perspective
    if (isCheckmate('w')) return -999999;
    if (isCheckmate('b')) return 999999;
    return materialAndPST();
  }

  function isCheckmate(color){
    // check if color to move has any legal moves
    const anyMove = hasAnyLegalMove(color);
    if (!anyMove && isKingAttacked(color)) return true;
    return false;
  }

  function hasAnyLegalMove(color){
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]; if (!p) continue;
      if ((color==='w' && !isWhite(p)) || (color==='b' && !isBlack(p))) continue;
      const arr = legalMovesFor(r,c);
      if (arr.length) return true;
    }
    return false;
  }

  // generate all legal moves for side
  function allLegalMovesForSide(side){
    const ms = [];
    for (let r=0;r<8;r++) for (let c=0;c<8;c++){
      const p = board[r][c]; if (!p) continue;
      if ((side==='w' && isWhite(p)) || (side==='b' && isBlack(p))){
        const lm = legalMovesFor(r,c);
        ms.push(...lm);
      }
    }
    return ms;
  }

  // quiescence: search captures only
  function quiesce(alpha,beta){
    let stand = evaluate();
    if (stand >= beta) return beta;
    if (alpha < stand) alpha = stand;
    // generate capture moves for side to move
    const caps = allLegalMovesForSide(turn).filter(m => m.capture);
    // order: captures with higher "victim - attacker" first (simple)
    caps.sort((a,b)=> {
      const va = valueOf(a.capture), vb = valueOf(b.capture);
      const aa = valueOf(a.piece), ab = valueOf(b.piece);
      return (vb - ab) - (va - aa);
    });
    for (let m of caps){
      makeMove(m,true);
      const score = -quiesce(-beta,-alpha);
      undoMove();
      if (score >= beta) return beta;
      if (score > alpha) alpha = score;
    }
    return alpha;
  }

  function valueOf(p){
    if (!p) return 0;
    return pieceValues[p.toLowerCase()] || 0;
  }

  // negamax with alpha-beta
  function negamax(depth, alpha, beta){
    if (depth===0) return quiesce(alpha,beta);
    if (isCheckmate(turn)) {
      return turn==='w' ? -999999 : 999999;
    }
    let moves = allLegalMovesForSide(turn);
    if (moves.length===0) return 0; // stalemate
    // move ordering: captures first
    moves.sort((a,b)=> (b.capture?1:0)-(a.capture?1:0));
    let best = -Infinity;
    for (let m of moves){
      makeMove(m,true);
      const score = -negamax(depth-1, -beta, -alpha);
      undoMove();
      if (score > best) best = score;
      if (score > alpha) alpha = score;
      if (alpha >= beta) break; // beta cut
    }
    return best;
  }

  // find best move (iterative deepening)
  function findBestMove(maxDepth){
    let bestMove = null;
    let bestScore = -Infinity;
    for (let d=1; d<=maxDepth; d++){
      const moves = allLegalMovesForSide(turn);
      // simple ordering
      moves.sort((a,b)=> (b.capture?1:0)-(a.capture?1:0));
      for (let m of moves){
        makeMove(m,true);
        const score = -negamax(d-1, -999999, 999999);
        undoMove();
        if (score > bestScore || bestMove===null){
          bestScore = score; bestMove = m;
        }
      }
      // optional: could provide iterative results to UI
    }
    return bestMove;
  }

  // --- Bot integration
  let thinking = false;
  function maybeBotMove(){
    if ((turn==='b')){ // bot plays black by default. You can adjust.
      thinking = true;
      statusEl.textContent = "Bot thinking...";
      const depth = parseInt(botDepthEl.value,10) || 4;
      // allow UI update before heavy calc
      setTimeout(()=>{
        const t0 = performance.now();
        const best = findBestMove(depth);
        const t1 = performance.now();
        if (!best){
          // game over?
          if (isCheckmate(turn)) statusEl.textContent = (turn==='w'?'White':'Black') + " is checkmated";
          else statusEl.textContent = "Stalemate";
          thinking=false; render(); return;
        }
        makeMove(best);
        moveHistory.push(moveNotation(best, best.piece, best.capture));
        render();
        thinking=false;
        statusEl.textContent = `Bot moved in ${((t1-t0)/1000).toFixed(2)}s`;
      }, 25);
    }
  }

  // --- helpers
  function setupFromFEN(fen){
    board = fenToBoard(fen);
    moveHistory = [];
    stack.length = 0;
    selected=null;
    render();
  }

  // --- init
  function init(){
    setupFromFEN(initialFEN);
    document.getElementById('newGame').addEventListener('click', ()=> setupFromFEN(initialFEN));
    document.getElementById('undoBtn').addEventListener('click', ()=>{
      undoMove(); undoMove(); // undo both sides
      render();
    });
    // let white be human, black bot. If you want bot play white, call maybeBotMove() on start.
  }

  // expose some for debugging
  window.__chess = {board, setupFromFEN};

  init();
})();
