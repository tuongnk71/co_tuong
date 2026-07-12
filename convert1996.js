/* Chuyển "Những cạm bẫy trong khai cuộc" 1996 -> app, kiểm chứng bằng engine */
"use strict";
var fs = require("fs");
var E = require("./engine.js");
var data = JSON.parse(fs.readFileSync("/sessions/tender-focused-wozniak/mnt/uploads/xiangqi_openings.json", "utf8"));

var TYPE = { king:"K", advisor:"A", elephant:"E", horse:"H", rook:"R", chariot:"R", cannon:"C", pawn:"P" };
/* dataset: red = dưới = 'r' (đi trước), black = trên = 'b' */

function buildBoard(g){
  var b = []; for (var r=0;r<10;r++) b.push([null,null,null,null,null,null,null,null,null]);
  var ok = true, setup = [];
  g.initial_position.pieces.forEach(function(p){
    var t = TYPE[p.piece];
    if (!t || p.x<0||p.x>8||p.y<0||p.y>9){ ok=false; return; }
    var s = p.side === "red" ? "r" : "b";
    if (b[p.y][p.x]) ok=false;
    b[p.y][p.x] = { s:s, t:t };
    setup.push([s,t,p.x,p.y]);
  });
  return ok ? { board:b, setup:setup } : null;
}
function fileToCol(f, s){ return s==="r" ? 9-f : f-1; }
function parseMove(board, s, tokenRaw){
  var tok = String(tokenRaw).replace(/–/g,"-").replace(/[!?,;\s]+/g,"");
  var m = tok.match(/^(Tg|X|P|M|T|S|C)([ts])?(\d)?([.\-\/])(\d)$/);
  if (!m) return { err:"syntax:"+tokenRaw };
  var letter=m[1], pos=m[2], fileStr=m[3], op=m[4], num=+m[5];
  var type = letter==="Tg"?"K":letter==="X"?"R":letter==="P"?"C":letter==="M"?"H":letter==="T"?"E":letter==="S"?"A":"P";
  var cands = [];
  for (var r=0;r<10;r++) for (var c=0;c<9;c++){
    var p = board[r][c];
    if (p && p.s===s && p.t===type) cands.push([c,r]);
  }
  if (fileStr){ var col = fileToCol(+fileStr,s); cands = cands.filter(function(q){return q[0]===col;}); }
  if (pos){
    var byCol = {};
    cands.forEach(function(q){ (byCol[q[0]]=byCol[q[0]]||[]).push(q); });
    var multi = [];
    Object.keys(byCol).forEach(function(k){ if (byCol[k].length>1) multi=multi.concat(byCol[k]); });
    if (multi.length) cands = multi;
    cands.sort(function(a,b2){ return s==="r" ? a[1]-b2[1] : b2[1]-a[1]; });
    cands = pos==="t" ? cands.slice(0,1) : cands.slice(-1);
  }
  var fwd = s==="r" ? -1 : 1, results = [];
  cands.forEach(function(q){
    var c=q[0], r=q[1], tc, tr;
    if (op==="-"){ tc = fileToCol(num,s); tr = r; }
    else {
      var dir = op==="." ? fwd : -fwd;
      if (type==="R"||type==="C"||type==="P"||type==="K"){ tc=c; tr=r+dir*num; }
      else if (type==="H"){ tc=fileToCol(num,s); var dc=Math.abs(tc-c); if(dc!==1&&dc!==2) return; tr=r+dir*(dc===1?2:1); }
      else if (type==="E"){ tc=fileToCol(num,s); if(Math.abs(tc-c)!==2) return; tr=r+dir*2; }
      else { tc=fileToCol(num,s); if(Math.abs(tc-c)!==1) return; tr=r+dir*1; }
    }
    if (tc<0||tc>8||tr<0||tr>9) return;
    var mv=[c,r,tc,tr];
    if (isLegalFast(board,s,mv)) results.push(mv);
  });
  if (results.length===1) return { m: results[0] };
  return { err:(results.length===0?"illegal:":"ambig:")+tokenRaw };
}
function isLegalFast(board, s, m){
  var ok = false, list = E.pieceMoves(board, m[0], m[1]);
  for (var i=0;i<list.length;i++) if (list[i][2]===m[2] && list[i][3]===m[3]){ ok=true; break; }
  if (!ok) return false;
  var cap = E.applyMove(board, m);
  var bad = E.inCheck(board, s);
  E.undoMove(board, m, cap);
  return !bad;
}
function tryLine(board0, tokens){
  var b = board0.map(function(row){ return row.map(function(p){ return p?{s:p.s,t:p.t}:null; }); });
  var side="r", moves=[];
  for (var i=0;i<tokens.length;i++){
    var res = parseMove(b, side, tokens[i]);
    if (res.err) return { err: res.err+" @ply"+(i+1) };
    moves.push(res.m); E.applyMove(b,res.m); side = side==="r"?"b":"r";
  }
  return { moves: moves };
}
function clean(t){
  if (!t) return "";
  return String(t).replace(/-\n/g,"").replace(/\n+/g," ").replace(/\s+/g," ").trim();
}
/* trải move_rows thành dãy token theo thứ tự */
function flattenRows(rows){
  var toks = [];
  (rows||[]).forEach(function(rw){
    if (rw.first && rw.first.notation) toks.push(rw.first.notation);
    if (rw.second && rw.second.notation) toks.push(rw.second.notation);
    (rw.extra_moves||[]).forEach(function(x){ if (x && x.notation) toks.push(x.notation); });
  });
  return toks;
}
/* gộp các hàng trùng số (nửa đỏ + nửa đen tách rời) rồi sắp theo số */
function mergedRows(rows){
  var by = {};
  (rows||[]).forEach(function(rw){
    var k = rw.number;
    if (!by[k]) by[k] = { number:k, first:null, second:null, extra_moves:[] };
    if (rw.first && !by[k].first) by[k].first = rw.first;
    if (rw.second && !by[k].second) by[k].second = rw.second;
    (rw.extra_moves||[]).forEach(function(x){ by[k].extra_moves.push(x); });
  });
  return Object.keys(by).map(Number).sort(function(a,b){return a-b;}).map(function(k){ return by[k]; });
}


function lev(a,b){
  var m=a.length,n=b.length,d=[];
  for(var i=0;i<=m;i++){d[i]=[i];}
  for(var j=1;j<=n;j++)d[0][j]=j;
  for(var i2=1;i2<=m;i2++)for(var j2=1;j2<=n;j2++)
    d[i2][j2]=Math.min(d[i2-1][j2]+1,d[i2][j2-1]+1,d[i2-1][j2-1]+(a[i2-1]===b[j2-1]?0:1));
  return d[m][n];
}
function normTok(t){ return String(t).replace(/–/g,"-").replace(/[!?,;\s]+/g,""); }
function fuzzyCands(board, side, token){
  var tok = normTok(token);
  var lm = tok.match(/^(Tg|[XPMTSC])/);
  if (!lm) return [];
  var letter = lm[1];
  var outs = [];
  E.legalMoves(board, side).forEach(function(m){
    var n = E.moveNotation(board, m).replace(/^B/, "C");
    var nm = n.match(/^(Tg|[XPMTSC])/);
    if (!nm || nm[1] !== letter) return;
    var dd = lev(tok, n);
    if (dd <= 2) outs.push({ m:m, d:dd });
  });
  outs.sort(function(a,b){ return a.d - b.d; });
  return outs;
}
var REPAIRS = 0, NODES = 0, DEADLINE = 0;
var PATH = [], BEST = [];
function pushPath(m){ PATH.push(m); if (PATH.length > BEST.length) BEST = PATH.slice(); }
function solve(board, side, tokens, i, budget){
  if (++NODES > 120000 || Date.now() > DEADLINE) return null;
  if (i === tokens.length) return [];
  var opp = side === "r" ? "b" : "r";
  var res = parseMove(board, side, tokens[i]);
  if (!res.err){
    var cap = E.applyMove(board, res.m);
    pushPath(res.m);
    var rest = solve(board, opp, tokens, i+1, budget);
    PATH.pop();
    E.undoMove(board, res.m, cap);
    return rest ? [res.m].concat(rest) : null;
  }
  if (budget <= 0) return null;
  /* 1) thay thế: nước hợp lệ cùng loại quân, ký hiệu gần giống */
  var cands = fuzzyCands(board, side, tokens[i]);
  for (var k=0; k<cands.length; k++){
    var cap2 = E.applyMove(board, cands[k].m);
    pushPath(cands[k].m);
    var rest2 = solve(board, opp, tokens, i+1, budget-1);
    PATH.pop();
    E.undoMove(board, cands[k].m, cap2);
    if (rest2){ REPAIRS++; return [cands[k].m].concat(rest2); }
  }
  /* 2) xóa token rác (trùng lặp/nhiễu OCR) */
  if (tokens.length - i >= 2){
    var restDel = solve(board, side, tokens, i+1, budget-1);
    if (restDel){ REPAIRS++; return restDel; }
  }
  /* 3) chèn nước bị mất: nước chèn phải khiến token hiện tại chạy được cho bên kia */
  if (tokens.length - i >= 2){
    var all = E.legalMoves(board, side);
    for (var q=0; q<all.length; q++){
      var cap3 = E.applyMove(board, all[q]);
      var peek = parseMove(board, opp, tokens[i]);
      var rest3 = null;
      if (!peek.err){ pushPath(all[q]); rest3 = solve(board, opp, tokens, i, budget-1); PATH.pop(); }
      E.undoMove(board, all[q], cap3);
      if (rest3){ REPAIRS++; return [all[q]].concat(rest3); }
    }
  }
  return null;
}

var out=[], failed=[], reasons={};
var A = +process.argv[2] || 0, B = +process.argv[3] || data.games.length;
data.games.slice(A, B).forEach(function(g){
  var built = buildBoard(g);
  if (!built){ failed.push(g.id); reasons.setup=(reasons.setup||0)+1; return; }
  if (!E.findKing(built.board,"r") || !E.findKing(built.board,"b")){ failed.push(g.id); reasons.king=(reasons.king||0)+1; return; }
  var rows = g.mainline.move_rows || [];
  var tries = [ flattenRows(rows), flattenRows(mergedRows(rows)), (g.mainline.move_tokens||[]) ];
  var moves=null, truncated=false, bestPrefix=[];
  for (var ti=0; ti<tries.length && !moves; ti++){
    if (tries[ti].length < 6) continue;
    var b0 = built.board.map(function(row){ return row.map(function(p){ return p?{s:p.s,t:p.t}:null; }); });
    NODES = 0; DEADLINE = Date.now() + 1100; PATH = []; BEST = [];
    moves = solve(b0, "r", tries[ti], 0, 6);
    if (!moves && BEST.length > bestPrefix.length) bestPrefix = BEST;
  }
  if (!moves && bestPrefix.length >= 16){ moves = bestPrefix; truncated = true; }
  console.error(g.id + (moves ? " OK(" + moves.length + ")" : " FAIL"));
  if (!moves){ failed.push(g.id); reasons.unrepairable=(reasons.unrepairable||0)+1; return; }
  /* chú giải theo content_blocks: đếm ply qua từng khối moves, commentary gắn vào ply gần nhất */
  var anns = {}, desc = clean(g.introduction||""), ply = 0;
  (g.content_blocks||[]).forEach(function(bl){
    if (bl.type === "moves"){ ply += flattenRows(bl.move_rows).length; if (ply > moves.length) ply = moves.length; }
    else if (bl.type === "commentary"){
      var txt = clean(bl.text);
      if (!txt || txt.length < 15) return;
      if (ply === 0){ desc = desc ? desc + " " + txt : txt; }
      else { var i = ply-1; anns[i] = anns[i] ? anns[i] + " " + txt : txt; }
    }
  });
  var mvs = moves.map(function(mm,i){ return anns[i] ? { m:mm, a:anns[i] } : { m:mm }; });
  /* kết quả */
  var rt = (g.mainline.result && g.mainline.result.type) || null;
  var raw = ((g.mainline.raw_text||"") + " " + (g.raw_text||"")).toLowerCase().slice(-120);
  var result = rt==="first_win" ? "Đỏ thắng" : rt==="second_win" ? "Đen thắng" : rt==="draw" ? "Hòa"
    : rt==="first_advantage" ? "Đỏ ưu thế" : rt==="second_advantage" ? "Đen ưu thế"
    : /tiên thắng|tien thắng/.test(raw) ? "Đỏ thắng" : /hậu thắng|hau thắng/.test(raw) ? "Đen thắng"
    : /hòa/.test(raw) ? "Hòa" : null;
  var last = mvs[mvs.length-1];
  if (truncated){
    result = null;
    last.a = (last.a ? last.a + " " : "") + "⚠ Phần cuối ván trong sách bị lỗi OCR nên chỉ hiển thị đến đây.";
  }
  if (result){
    var concl = "Kết quả: " + (result==="Đỏ thắng"?"Tiên (Đỏ) thắng.":result==="Đen thắng"?"Hậu (Đen) thắng.":result==="Hòa"?"hòa cờ.":result+".");
    last.a = (last.a ? last.a + " — " : "") + concl;
  }
  /* chú thích đánh số của sách -> gắn cuối */
  var notes = clean(g.annotations_raw||"");
  if (notes && last){ last.a = (last.a ? last.a + " " : "") + "• Chú thích của sách: " + notes; }
  var isTrap = g.kind === "opening_trap";
  out.push({
    id: "op1996-" + g.id,
    name: g.number + ". " + clean(g.title||g.id),
    chapter: isTrap ? "CẠM BẪY KHAI CUỘC" : "VÁN ĐẤU MINH HỌA",
    result: result || undefined,
    side: result === "Đen thắng" || result === "Đen ưu thế" ? "den" : "do",
    desc: desc,
    setup: built.setup,
    moves: mvs
  });
});

fs.writeFileSync("part_" + A + "_" + B + ".json", JSON.stringify(out), "utf8");

console.log("valid:", out.length, "/", data.games.length);
console.log("reasons:", JSON.stringify(reasons));
console.log("failed:", failed.join(","));
var ch={}; out.forEach(function(g){ ch[g.chapter]=(ch[g.chapter]||0)+1; });
console.log("chapters:", JSON.stringify(ch));
var ann=0, tot=0; out.forEach(function(g){ tot+=g.moves.length; g.moves.forEach(function(m){ if(m.a) ann++; }); });
console.log("moves:", tot, "annotated:", ann);
console.log("fuzzy repairs used:", REPAIRS);

