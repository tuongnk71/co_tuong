/* Xiangqi rule engine — board[row][col], row 0 = black back rank (top), row 9 = red back rank.
   Piece: {s:'r'|'b', t:'R'|'H'|'E'|'A'|'K'|'C'|'P'} or null. Red moves toward row 0. */
"use strict";

function initialBoard() {
  var b = [];
  for (var r = 0; r < 10; r++) { b.push([null,null,null,null,null,null,null,null,null]); }
  var back = ["R","H","E","A","K","A","E","H","R"];
  for (var c = 0; c < 9; c++) {
    b[0][c] = { s: "b", t: back[c] };
    b[9][c] = { s: "r", t: back[c] };
  }
  b[2][1] = { s: "b", t: "C" }; b[2][7] = { s: "b", t: "C" };
  b[7][1] = { s: "r", t: "C" }; b[7][7] = { s: "r", t: "C" };
  for (var c2 = 0; c2 < 9; c2 += 2) {
    b[3][c2] = { s: "b", t: "P" };
    b[6][c2] = { s: "r", t: "P" };
  }
  return b;
}

function inBoard(c, r) { return c >= 0 && c <= 8 && r >= 0 && r <= 9; }
function inPalace(c, r, s) {
  if (c < 3 || c > 5) return false;
  return s === "r" ? (r >= 7 && r <= 9) : (r >= 0 && r <= 2);
}
function crossedRiver(r, s) { return s === "r" ? r <= 4 : r >= 5; }
function ownSide(r, s) { return s === "r" ? r >= 5 : r <= 4; }

/* pseudo-legal moves for piece at (c,r); returns array of [c,r,tc,tr] */
function pieceMoves(board, c, r) {
  var p = board[r][c];
  if (!p) return [];
  var s = p.s, out = [];
  function add(tc, tr) {
    if (!inBoard(tc, tr)) return;
    var q = board[tr][tc];
    if (q && q.s === s) return;
    out.push([c, r, tc, tr]);
  }
  var fwd = s === "r" ? -1 : 1;
  if (p.t === "R" || p.t === "C") {
    var dirs = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var d = 0; d < 4; d++) {
      var dc = dirs[d][0], dr = dirs[d][1];
      var tc = c + dc, tr = r + dr, jumped = false;
      while (inBoard(tc, tr)) {
        var q = board[tr][tc];
        if (p.t === "R") {
          if (!q) { add(tc, tr); } else { add(tc, tr); break; }
        } else { /* cannon */
          if (!jumped) {
            if (!q) { add(tc, tr); } else { jumped = true; }
          } else {
            if (q) { if (q.s !== s) add(tc, tr); break; }
          }
        }
        tc += dc; tr += dr;
      }
    }
  } else if (p.t === "H") {
    var hops = [[1,2,0,1],[-1,2,0,1],[1,-2,0,-1],[-1,-2,0,-1],[2,1,1,0],[2,-1,1,0],[-2,1,-1,0],[-2,-1,-1,0]];
    for (var i = 0; i < 8; i++) {
      var lc = c + hops[i][2], lr = r + hops[i][3];
      if (inBoard(lc, lr) && !board[lr][lc]) add(c + hops[i][0], r + hops[i][1]);
    }
  } else if (p.t === "E") {
    var es = [[2,2],[2,-2],[-2,2],[-2,-2]];
    for (var j = 0; j < 4; j++) {
      var tc2 = c + es[j][0], tr2 = r + es[j][1];
      if (!inBoard(tc2, tr2) || !ownSide(tr2, s)) continue;
      var ec = c + es[j][0] / 2, er = r + es[j][1] / 2;
      if (!board[er][ec]) add(tc2, tr2);
    }
  } else if (p.t === "A") {
    var as = [[1,1],[1,-1],[-1,1],[-1,-1]];
    for (var k = 0; k < 4; k++) {
      var tc3 = c + as[k][0], tr3 = r + as[k][1];
      if (inPalace(tc3, tr3, s)) add(tc3, tr3);
    }
  } else if (p.t === "K") {
    var ks = [[1,0],[-1,0],[0,1],[0,-1]];
    for (var m = 0; m < 4; m++) {
      var tc4 = c + ks[m][0], tr4 = r + ks[m][1];
      if (inPalace(tc4, tr4, s)) add(tc4, tr4);
    }
  } else if (p.t === "P") {
    add(c, r + fwd);
    if (crossedRiver(r, s)) { add(c + 1, r); add(c - 1, r); }
  }
  return out;
}

function findKing(board, s) {
  for (var r = 0; r < 10; r++) for (var c = 3; c <= 5; c++) {
    var p = board[r][c];
    if (p && p.t === "K" && p.s === s) return [c, r];
  }
  return null;
}

/* is side s's king attacked (incl. flying general) */
function inCheck(board, s) {
  var kp = findKing(board, s);
  if (!kp) return true;
  var kc = kp[0], kr = kp[1], opp = s === "r" ? "b" : "r";
  /* flying general */
  var ok = findKing(board, opp);
  if (ok && ok[0] === kc) {
    var blocked = false;
    var lo = Math.min(kr, ok[1]), hi = Math.max(kr, ok[1]);
    for (var rr = lo + 1; rr < hi; rr++) if (board[rr][kc]) { blocked = true; break; }
    if (!blocked) return true;
  }
  for (var r = 0; r < 10; r++) for (var c = 0; c < 9; c++) {
    var p = board[r][c];
    if (!p || p.s !== opp || p.t === "K") continue;
    var mv = pieceMoves(board, c, r);
    for (var i = 0; i < mv.length; i++) {
      if (mv[i][2] === kc && mv[i][3] === kr) return true;
    }
  }
  return false;
}

function applyMove(board, m) {
  var cap = board[m[3]][m[2]];
  board[m[3]][m[2]] = board[m[1]][m[0]];
  board[m[1]][m[0]] = null;
  return cap;
}
function undoMove(board, m, cap) {
  board[m[1]][m[0]] = board[m[3]][m[2]];
  board[m[3]][m[2]] = cap;
}

/* all fully legal moves for side s */
function legalMoves(board, s) {
  var out = [];
  for (var r = 0; r < 10; r++) for (var c = 0; c < 9; c++) {
    var p = board[r][c];
    if (!p || p.s !== s) continue;
    var mv = pieceMoves(board, c, r);
    for (var i = 0; i < mv.length; i++) {
      var cap = applyMove(board, mv[i]);
      var bad = inCheck(board, s);
      undoMove(board, mv[i], cap);
      if (!bad) out.push(mv[i]);
    }
  }
  return out;
}

function isLegal(board, s, m) {
  var list = legalMoves(board, s);
  for (var i = 0; i < list.length; i++) {
    var x = list[i];
    if (x[0] === m[0] && x[1] === m[1] && x[2] === m[2] && x[3] === m[3]) return true;
  }
  return false;
}

/* ---- Vietnamese notation ---- */
var VN_LETTER = { R: "X", H: "M", E: "T", A: "S", K: "Tg", C: "P", P: "B" };
function fileNum(c, s) { return s === "r" ? 9 - c : c + 1; }
function moveNotation(board, m) {
  var p = board[m[1]][m[0]];
  if (!p) return "?";
  var s = p.s, letter = VN_LETTER[p.t];
  var f1 = fileNum(m[0], s), f2 = fileNum(m[2], s);
  /* disambiguation: another same piece same file */
  var prefix = "";
  if (p.t !== "K" && p.t !== "A" && p.t !== "E") {
    for (var r = 0; r < 10; r++) {
      if (r === m[1]) continue;
      var q = board[r][m[0]];
      if (q && q.s === s && q.t === p.t) {
        var iAmFront = s === "r" ? m[1] < r : m[1] > r;
        prefix = iAmFront ? "t" : "s"; /* trước / sau */
        break;
      }
    }
  }
  var op, num;
  if (m[3] === m[1]) { op = "-"; num = f2; } /* bình */
  else {
    var fwd = s === "r" ? m[3] < m[1] : m[3] > m[1];
    op = fwd ? "." : "/";
    if (p.t === "H" || p.t === "E" || p.t === "A") num = f2;
    else num = Math.abs(m[3] - m[1]);
  }
  return letter + (prefix ? prefix : "") + f1 + op + num;
}

/* ---- Simple AI: minimax + alpha-beta ---- */
var VALS = { R: 100, C: 48, H: 45, E: 12, A: 12, P: 10, K: 10000 };
function evalBoard(board) {
  /* positive = good for red */
  var score = 0;
  for (var r = 0; r < 10; r++) for (var c = 0; c < 9; c++) {
    var p = board[r][c];
    if (!p) continue;
    var v = VALS[p.t];
    if (p.t === "P" && crossedRiver(r, p.s)) v += 8;
    if (p.t === "P" && c >= 3 && c <= 5 && crossedRiver(r, p.s)) v += 4;
    if (p.t === "H" || p.t === "C") {
      if (c >= 2 && c <= 6) v += 2;
    }
    score += p.s === "r" ? v : -v;
  }
  return score;
}

function search(board, depth, alpha, beta, side) {
  if (depth === 0) return evalBoard(board);
  var moves = legalMoves(board, side);
  if (moves.length === 0) return side === "r" ? -20000 + (3 - depth) : 20000 - (3 - depth);
  /* order: captures first */
  moves.sort(function (a, b) {
    var ca = board[a[3]][a[2]] ? VALS[board[a[3]][a[2]].t] : 0;
    var cb = board[b[3]][b[2]] ? VALS[board[b[3]][b[2]].t] : 0;
    return cb - ca;
  });
  var opp = side === "r" ? "b" : "r";
  if (side === "r") {
    var best = -Infinity;
    for (var i = 0; i < moves.length; i++) {
      var cap = applyMove(board, moves[i]);
      var v = search(board, depth - 1, alpha, beta, opp);
      undoMove(board, moves[i], cap);
      if (v > best) best = v;
      if (v > alpha) alpha = v;
      if (alpha >= beta) break;
    }
    return best;
  } else {
    var best2 = Infinity;
    for (var j = 0; j < moves.length; j++) {
      var cap2 = applyMove(board, moves[j]);
      var v2 = search(board, depth - 1, alpha, beta, opp);
      undoMove(board, moves[j], cap2);
      if (v2 < best2) best2 = v2;
      if (v2 < beta) beta = v2;
      if (alpha >= beta) break;
    }
    return best2;
  }
}

function bestMove(board, side, depth) {
  var moves = legalMoves(board, side);
  if (moves.length === 0) return null;
  moves.sort(function (a, b) {
    var ca = board[a[3]][a[2]] ? VALS[board[a[3]][a[2]].t] : 0;
    var cb = board[b[3]][b[2]] ? VALS[board[b[3]][b[2]].t] : 0;
    return cb - ca;
  });
  var opp = side === "r" ? "b" : "r";
  var bestM = null, bestV = side === "r" ? -Infinity : Infinity;
  var alpha = -Infinity, beta = Infinity;
  for (var i = 0; i < moves.length; i++) {
    var cap = applyMove(board, moves[i]);
    var v = search(board, depth - 1, alpha, beta, opp);
    undoMove(board, moves[i], cap);
    v += (Math.random() - 0.5) * 2; /* tiny jitter for variety */
    if (side === "r" ? v > bestV : v < bestV) { bestV = v; bestM = moves[i]; }
    if (side === "r") { if (v > alpha) alpha = v; } else { if (v < beta) beta = v; }
  }
  return bestM;
}

if (typeof module !== "undefined") {
  module.exports = { pieceMoves: pieceMoves, initialBoard: initialBoard, legalMoves: legalMoves, isLegal: isLegal, inCheck: inCheck, applyMove: applyMove, undoMove: undoMove, moveNotation: moveNotation, bestMove: bestMove, evalBoard: evalBoard, findKing: findKing };
}
