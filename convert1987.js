/* Chuyển dataset tàn cuộc 1987 -> định dạng app, kiểm chứng từng nước bằng engine */
"use strict";
var fs = require("fs");
var E = require("./engine.js");
var data = JSON.parse(fs.readFileSync("/sessions/tender-focused-wozniak/mnt/uploads/xiangqi_endgames.json", "utf8"));

var TYPE = { king:"K", advisor:"A", elephant:"E", horse:"H", rook:"R", chariot:"R", cannon:"C", pawn:"P" };
/* dataset: white = trên (my 'b'), black = dưới (my 'r'), black luôn đi trước */

function buildBoard(g){
  var b = [];
  for (var r=0;r<10;r++) b.push([null,null,null,null,null,null,null,null,null]);
  var ok = true, setup = [];
  g.initial_position.pieces.forEach(function(p){
    var t = TYPE[p.piece];
    if (!t || p.x<0 || p.x>8 || p.y<0 || p.y>9){ ok=false; return; }
    var s = p.side === "black" ? "r" : "b";
    if (b[p.y][p.x]) ok = false;
    b[p.y][p.x] = { s:s, t:t };
    setup.push([s, t, p.x, p.y]);
  });
  return ok ? { board:b, setup:setup } : null;
}

function fileToCol(f, s){ return s==="r" ? 9-f : f-1; }

/* parse 1 token thành nước đi hợp lệ trên board cho bên s */
function parseMove(board, s, tokenRaw){
  var tok = tokenRaw.replace(/–/g,"-").replace(/[!?,;]+/g,"").trim();
  var m = tok.match(/^(Tg|X|P|M|T|S|C)([ts])?(\d)?([.\-\/])(\d)$/);
  if (!m) return { err: "syntax:"+tokenRaw };
  var letter=m[1], pos=m[2], fileStr=m[3], op=m[4], num=+m[5];
  var type = letter==="Tg"?"K":letter==="X"?"R":letter==="P"?"C":letter==="M"?"H":letter==="T"?"E":letter==="S"?"A":"P";
  /* candidates */
  var cands = [];
  for (var r=0;r<10;r++) for (var c=0;c<9;c++){
    var p = board[r][c];
    if (p && p.s===s && p.t===type) cands.push([c,r]);
  }
  if (fileStr){
    var col = fileToCol(+fileStr, s);
    cands = cands.filter(function(q){ return q[0]===col; });
  }
  if (pos){
    /* t = trước (gần địch hơn), s = sau — trong các quân cùng cột */
    var byCol = {};
    cands.forEach(function(q){ (byCol[q[0]]=byCol[q[0]]||[]).push(q); });
    var multi = [];
    Object.keys(byCol).forEach(function(k){ if (byCol[k].length>1) multi = multi.concat(byCol[k]); });
    if (multi.length) cands = multi;
    cands.sort(function(a,b2){ return s==="r" ? a[1]-b2[1] : b2[1]-a[1]; }); /* đầu danh sách = trước */
    cands = pos==="t" ? cands.slice(0,1) : cands.slice(-1);
  }
  var fwd = s==="r" ? -1 : 1;
  var results = [];
  cands.forEach(function(q){
    var c=q[0], r=q[1], tc, tr;
    if (op==="-"){ tc = fileToCol(num, s); tr = r; }
    else {
      var dir = op==="." ? fwd : -fwd;
      if (type==="R"||type==="C"||type==="P"||type==="K"){ tc = c; tr = r + dir*num; }
      else if (type==="H"){ tc = fileToCol(num, s); var dc = Math.abs(tc-c); if (dc!==1 && dc!==2) return; tr = r + dir*(dc===1?2:1); }
      else if (type==="E"){ tc = fileToCol(num, s); if (Math.abs(tc-c)!==2) return; tr = r + dir*2; }
      else { tc = fileToCol(num, s); if (Math.abs(tc-c)!==1) return; tr = r + dir*1; }
    }
    if (tc<0||tc>8||tr<0||tr>9) return;
    var mv = [c,r,tc,tr];
    if (E.isLegal(board, s, mv)) results.push(mv);
  });
  if (results.length===1) return { m: results[0] };
  return { err: (results.length===0?"illegal:":"ambig:")+tokenRaw };
}

function clean(txt){
  if (!txt) return "";
  return txt.replace(/\n+/g," ").replace(/\s+/g," ").replace(/\s*\d+\s*$/,"").trim();
}

/* Tách lại nước đi từ raw_text theo SỐ THỨ TỰ nước (sửa lỗi PDF in 2 cột đảo thứ tự).
   Trả về { tokens:[...], amap:{plyIndex: annId} } */
function reparse(g){
  var raw = (g.mainline.raw_text || "").replace(/–/g, "-");
  /* bỏ các biến nằm trong ngoặc (ngoặc có chứa ký hiệu nước đi) */
  raw = raw.replace(/\([^)]*(?:Tg|[XPMTSC])[ts]?\d?\s*[.\-\/]\s*\d[^)]*\)/g, " ");
  var re = /(\d+)\s*\.\s*(?=Tg|[XPMTSC])|\((\d+)\)|(?:Tg|[XPMTSC])[ts]?\d?\s*[.\-\/]\s*\d/g;
  var chunks = [], cur = null, mt;
  while ((mt = re.exec(raw)) !== null){
    if (mt[1] !== undefined){ cur = { n:+mt[1], seq:[] }; chunks.push(cur); }
    else if (mt[2] !== undefined){ if (cur && cur.seq.length) cur.seq.push({ ann:+mt[2] }); }
    else {
      if (!cur){ cur = { n:0, seq:[] }; chunks.push(cur); }
      cur.seq.push({ tok: mt[0].replace(/\s+/g,"") });
    }
  }
  chunks.sort(function(a,b){ return a.n - b.n; });
  var tokens = [], amap = {};
  chunks.forEach(function(ch){
    ch.seq.forEach(function(it){
      if (it.tok !== undefined) tokens.push(it.tok);
      else if (tokens.length) amap[tokens.length-1] = it.ann;
    });
  });
  return { tokens: tokens, amap: amap };
}

/* gắn chú giải (n) theo move_tokens gốc */
function annotationMap(g){
  var raw = g.mainline.raw_text || "";
  var map = {};
  var re = /(Tg|[XPMTSC])[ts]?\d?\s*[.\-–\/]\s*\d|\((\d+)\)/g;
  var idx = -1, mt;
  while ((mt = re.exec(raw)) !== null){
    if (mt[2] !== undefined){ if (idx>=0) map[idx] = +mt[2]; }
    else idx++;
  }
  return map;
}

/* thử chạy 1 dãy token; trả về moves nếu toàn bộ hợp lệ */
function tryLine(board0, tokens){
  var b = board0.map(function(row){ return row.map(function(p){ return p ? {s:p.s,t:p.t} : null; }); });
  var side = "r", moves = [];
  for (var i=0;i<tokens.length;i++){
    var res = parseMove(b, side, tokens[i]);
    if (res.err) return { err: res.err + " @ply" + (i+1) };
    moves.push(res.m);
    E.applyMove(b, res.m);
    side = side==="r"?"b":"r";
  }
  return { moves: moves };
}

var out = [], failed = [], reasons = {};
data.games.forEach(function(g){
  var built = buildBoard(g);
  if (!built){ failed.push(g.number); reasons["setup"] = (reasons["setup"]||0)+1; return; }
  var b = built.board;
  /* sanity: đủ 2 Tướng, bên không đi không bị chiếu, bên đi không ăn ngay Tướng */
  if (!E.findKing(b,"r") || !E.findKing(b,"b")){ failed.push(g.number); reasons["king"]=(reasons["king"]||0)+1; return; }
  if (E.inCheck(b,"b")){ failed.push(g.number); reasons["precheck"]=(reasons["precheck"]||0)+1; return; }
  /* thử 1: tách lại theo số thứ tự nước; thử 2: move_tokens gốc */
  var rp = reparse(g);
  var moves = null, amap = null, bad = null;
  if (rp.tokens.length >= 3){
    var t1 = tryLine(b, rp.tokens);
    if (t1.moves){ moves = t1.moves; amap = rp.amap; }
    else bad = t1.err;
  }
  if (!moves){
    var toks = g.mainline.move_tokens || [];
    if (toks.length >= 3){
      var t2 = tryLine(b, toks);
      if (t2.moves){ moves = t2.moves; amap = annotationMap(g); bad = null; }
      else if (!bad) bad = t2.err;
    } else if (!bad) bad = "short:";
  }
  if (!moves){ failed.push(g.number); var k = (bad||"?").split(":")[0]; reasons[k]=(reasons[k]||0)+1; return; }
  /* chạy lại lên board chính để dùng tiếp */
  moves.forEach(function(mm){ E.applyMove(b, mm); });
  /* kết quả */
  var raw = (g.mainline.raw_text||"").toLowerCase();
  var res2 = g.mainline.result;
  var result = res2==="draw" ? "Hòa" : res2==="win" ? "Đỏ thắng"
    : /hòa\s*\.?\s*$/.test(raw.trim()) || /,\s*hòa/.test(raw) ? "Hòa"
    : /thắng/.test(raw.slice(-40)) ? "Đỏ thắng" : "Hòa";
  /* chú giải */
  var annById = {};
  (g.annotations||[]).forEach(function(a){ annById[a.id] = clean(a.text); });
  var mvs = moves.map(function(mm, i){
    var a = amap[i]!==undefined ? (annById[amap[i]]||"") : "";
    return a ? { m:mm, a:a } : { m:mm };
  });
  var raw = (g.mainline.raw_text||"").toLowerCase();
  var res2 = g.mainline.result;
  var result = res2==="draw" ? "Hòa" : res2==="win" ? "Đỏ thắng"
    : /hòa\s*\.?\s*$/.test(raw.trim()) || /,\s*hòa/.test(raw) ? "Hòa"
    : /thắng/.test(raw.slice(-40)) ? "Đỏ thắng" : "Hòa";
  var last = mvs[mvs.length-1];
  var concl = result==="Hòa" ? "Kết quả: hòa cờ." : "Kết quả: bên tiên (Đỏ) thắng.";
  last.a = (last.a ? last.a + " — " : "") + concl;
  out.push({
    id: "eg1987-" + g.number,
    name: (g.number) + ". " + (g.title||"Ván " + g.number).replace(/\s+/g," ").trim(),
    chapter: g.chapter || null,
    page: g.source_pages && g.source_pages.start || 0,
    result: result,
    desc: clean(g.introduction),
    setup: built.setup,
    moves: mvs
  });
});

var chapters2 = [];
(data.metadata.chapters||[]).forEach(function(ch){ chapters2.push(ch); });
chapters2.sort(function(a,b){ return a.page-b.page; });
out.forEach(function(g){
  if (!g.chapter){
    var name = null;
    if (g.page) chapters2.forEach(function(ch){ if (g.page >= ch.page) name = ch.title; });
    g.chapter = name ? name.toUpperCase() : "THỰC DỤNG (TỔNG HỢP)";
  }
  if (g.page >= 263) g.chapter = g.chapter + " – THỰC DỤNG";
  delete g.page;
});

fs.writeFileSync("endgames1987.js",
  "/* 1987 - Cờ Tướng Tàn Cuộc (Phạm Tấn Hòa, Lê Thiên Vị, Quách Anh Tú) — đã kiểm chứng bằng engine */\n" +
  "var BOOK_ENDGAMES = " + JSON.stringify(out) + ";\n" +
  "if (typeof module !== \"undefined\") { module.exports = BOOK_ENDGAMES; }\n", "utf8");

console.log("valid:", out.length, "/", data.games.length);
console.log("fail reasons:", JSON.stringify(reasons));
console.log("failed games:", failed.join(","));
var chCount = {};
out.forEach(function(g){ chCount[g.chapter]=(chCount[g.chapter]||0)+1; });
console.log("chapters:", JSON.stringify(chCount, null, 0));
console.log("bytes:", fs.statSync("endgames1987.js").size);
