/* ================= UI ================= */
(function(){
"use strict";
function $(id){ return document.getElementById(id); }
var CHARS = { r:{K:"帥",A:"仕",E:"相",H:"傌",R:"俥",C:"炮",P:"兵"},
              b:{K:"將",A:"士",E:"象",H:"馬",R:"車",C:"砲",P:"卒"} };
var LKEY = "ct_learned_v1";
var learned = {};
try { learned = JSON.parse(localStorage.getItem(LKEY) || "{}"); } catch(e){ learned = {}; }
function saveLearned(){ try{ localStorage.setItem(LKEY, JSON.stringify(learned)); }catch(e){} }
var toastTimer = null;
function toast(msg){
  var t = $("toast"); t.textContent = msg; t.classList.add("show");
  if (toastTimer) clearTimeout(toastTimer);
  toastTimer = setTimeout(function(){ t.classList.remove("show"); }, 1900);
}
function cloneBoard(b){ return b.map(function(row){ return row.map(function(p){ return p ? {s:p.s,t:p.t} : null; }); }); }

/* board from custom setup (tàn cuộc) or standard start */
function setupBoard(op){
  var b = []; for (var r=0;r<10;r++) b.push([null,null,null,null,null,null,null,null,null]);
  op.setup.forEach(function(p){ b[p[3]][p[2]] = { s:p[0], t:p[1] }; });
  return b;
}
function startBoardOf(op){ return op.setup ? setupBoard(op) : initialBoard(); }
/* gộp sát pháp cơ bản + sách tàn cuộc 1987 */
ENDGAMES.forEach(function(op){ op.chapter = "SÁT PHÁP CƠ BẢN"; });
var ALL_EG = ENDGAMES.concat(typeof BOOK_ENDGAMES !== "undefined" ? BOOK_ENDGAMES : []);
/* precompute notations */
OPENINGS.concat(ALL_EG).forEach(function(op){
  op._not = [];
  var b = startBoardOf(op);
  op.moves.forEach(function(mv){ op._not.push(moveNotation(b, mv.m)); applyMove(b, mv.m); });
});
var EG_CHAPTERS = [];
ALL_EG.forEach(function(op){ if (EG_CHAPTERS.indexOf(op.chapter) < 0) EG_CHAPTERS.push(op.chapter); });

/* ---------- board SVG ---------- */
var CELL=50, MG=40, W=MG*2+CELL*8, HH=MG*2+CELL*9;
function px(c){ return MG + c*CELL; }
function py(r){ return MG + r*CELL; }
function boardSVG(board, opts){
  opts = opts || {};
  var s = [];
  s.push('<svg viewBox="0 0 '+W+' '+HH+'" xmlns="http://www.w3.org/2000/svg">');
  s.push('<rect x="4" y="4" width="'+(W-8)+'" height="'+(HH-8)+'" rx="10" fill="#F3E1B6"/>');
  s.push('<g stroke="#8A5A2B" stroke-width="1.6" opacity="0.9">');
  for (var r=0;r<10;r++) s.push('<line x1="'+px(0)+'" y1="'+py(r)+'" x2="'+px(8)+'" y2="'+py(r)+'"/>');
  for (var c=0;c<9;c++){
    if (c===0||c===8){ s.push('<line x1="'+px(c)+'" y1="'+py(0)+'" x2="'+px(c)+'" y2="'+py(9)+'"/>'); }
    else {
      s.push('<line x1="'+px(c)+'" y1="'+py(0)+'" x2="'+px(c)+'" y2="'+py(4)+'"/>');
      s.push('<line x1="'+px(c)+'" y1="'+py(5)+'" x2="'+px(c)+'" y2="'+py(9)+'"/>');
    }
  }
  s.push('<line x1="'+px(3)+'" y1="'+py(0)+'" x2="'+px(5)+'" y2="'+py(2)+'"/>');
  s.push('<line x1="'+px(5)+'" y1="'+py(0)+'" x2="'+px(3)+'" y2="'+py(2)+'"/>');
  s.push('<line x1="'+px(3)+'" y1="'+py(7)+'" x2="'+px(5)+'" y2="'+py(9)+'"/>');
  s.push('<line x1="'+px(5)+'" y1="'+py(7)+'" x2="'+px(3)+'" y2="'+py(9)+'"/>');
  s.push('</g>');
  /* border double frame */
  s.push('<rect x="'+(px(0)-7)+'" y="'+(py(0)-7)+'" width="'+(CELL*8+14)+'" height="'+(CELL*9+14)+'" fill="none" stroke="#8A5A2B" stroke-width="3" opacity="0.85"/>');
  /* river text */
  s.push('<text x="'+(px(2)+8)+'" y="'+(py(4)+CELL*0.65)+'" font-size="26" fill="#A9834C" font-family="Noto Serif TC,serif" letter-spacing="10">楚河</text>');
  s.push('<text x="'+(px(5)+8)+'" y="'+(py(4)+CELL*0.65)+'" font-size="26" fill="#A9834C" font-family="Noto Serif TC,serif" letter-spacing="10">漢界</text>');
  /* file numbers */
  s.push('<g font-size="12" fill="#B39869" font-weight="600" text-anchor="middle">');
  for (var cc=0;cc<9;cc++){
    s.push('<text x="'+px(cc)+'" y="'+(py(0)-16)+'">'+(cc+1)+'</text>');
    s.push('<text x="'+px(cc)+'" y="'+(py(9)+24)+'">'+(9-cc)+'</text>');
  }
  s.push('</g>');
  /* cross markers at cannon/pawn points */
  var marks=[[1,2],[7,2],[1,7],[7,7],[0,3],[2,3],[4,3],[6,3],[8,3],[0,6],[2,6],[4,6],[6,6],[8,6]];
  s.push('<g stroke="#B08D55" stroke-width="1.2" opacity="0.7">');
  marks.forEach(function(m){
    var x=px(m[0]), y=py(m[1]), g=4, l=9;
    [[-1,-1],[1,-1],[-1,1],[1,1]].forEach(function(d){
      if ((m[0]===0&&d[0]<0)||(m[0]===8&&d[0]>0)) return;
      s.push('<polyline fill="none" points="'+(x+d[0]*g)+','+(y+d[1]*(g+l))+' '+(x+d[0]*g)+','+(y+d[1]*g)+' '+(x+d[0]*(g+l))+','+(y+d[1]*g)+'"/>');
    });
  });
  s.push('</g>');
  /* last move + arrow */
  if (opts.last){
    var lm = opts.last;
    s.push('<circle cx="'+px(lm[0])+'" cy="'+py(lm[1])+'" r="10" fill="none" stroke="#2F8B57" stroke-width="3" opacity="0.8"/>');
    if (opts.arrow){
      var x1=px(lm[0]), y1=py(lm[1]), x2=px(lm[2]), y2=py(lm[3]);
      var dx=x2-x1, dy=y2-y1, len=Math.sqrt(dx*dx+dy*dy)||1;
      var ux=dx/len, uy=dy/len;
      var ex=x2-ux*30, ey=y2-uy*30, sx=x1+ux*12, sy=y1+uy*12;
      s.push('<line x1="'+sx+'" y1="'+sy+'" x2="'+ex+'" y2="'+ey+'" stroke="#2F8B57" stroke-width="5" stroke-linecap="round" opacity="0.85"/>');
      var ax=x2-ux*26, ay=y2-uy*26;
      s.push('<polygon fill="#2F8B57" opacity="0.9" points="'+(x2-ux*24)+','+(y2-uy*24)+' '+(ax-uy*7)+','+(ay+ux*7)+' '+(ax+uy*7)+','+(ay-ux*7)+'"/>');
    } else {
      s.push('<rect x="'+(px(lm[2])-24)+'" y="'+(py(lm[3])-24)+'" width="48" height="48" rx="10" fill="none" stroke="#2F8B57" stroke-width="2.5" opacity="0.7"/>');
    }
  }
  /* pieces */
  for (var rr=0;rr<10;rr++) for (var c2=0;c2<9;c2++){
    var p = board[rr][c2];
    if (!p) continue;
    var x = px(c2), y = py(rr);
    var isSel = opts.sel && opts.sel[0]===c2 && opts.sel[1]===rr;
    var red = p.s==="r";
    s.push('<g>');
    s.push('<circle cx="'+x+'" cy="'+(y+2.5)+'" r="21.5" fill="rgba(80,50,15,0.35)"/>');
    s.push('<circle cx="'+x+'" cy="'+y+'" r="21.5" fill="'+(red?"#FBF1D9":"#33291F")+'" stroke="'+(red?"#B23A2A":"#191410")+'" stroke-width="2"/>');
    s.push('<circle cx="'+x+'" cy="'+y+'" r="17.5" fill="none" stroke="'+(red?"#D8A08F":"#87755C")+'" stroke-width="1.2"/>');
    s.push('<text x="'+x+'" y="'+(y+8)+'" text-anchor="middle" font-size="23" font-weight="700" font-family="Noto Serif TC,serif" fill="'+(red?"#B23A2A":"#F3E7CB")+'">'+CHARS[p.s][p.t]+'</text>');
    if (isSel) s.push('<circle cx="'+x+'" cy="'+y+'" r="25" fill="none" stroke="#C98A2C" stroke-width="3.5"/>');
    if (opts.last && opts.last[2]===c2 && opts.last[3]===rr && opts.arrow)
      s.push('<circle cx="'+x+'" cy="'+y+'" r="25" fill="none" stroke="#2F8B57" stroke-width="3"/>');
    s.push('</g>');
  }
  /* legal dots */
  if (opts.dots){
    opts.dots.forEach(function(d){
      var occupied = board[d[1]][d[0]];
      if (occupied) s.push('<circle cx="'+px(d[0])+'" cy="'+py(d[1])+'" r="25" fill="none" stroke="#2F8B57" stroke-width="3" stroke-dasharray="5 4"/>');
      else s.push('<circle cx="'+px(d[0])+'" cy="'+py(d[1])+'" r="8" fill="#2F8B57" opacity="0.65"/>');
    });
  }
  /* click targets */
  if (opts.clickable){
    for (var r3=0;r3<10;r3++) for (var c3=0;c3<9;c3++)
      s.push('<rect data-c="'+c3+'" data-r="'+r3+'" x="'+(px(c3)-25)+'" y="'+(py(r3)-25)+'" width="50" height="50" fill="transparent" style="cursor:pointer"/>');
  }
  s.push('</svg>');
  return s.join("");
}

/* ---------- view switching ---------- */
function show(view){
  $("viewLib").classList.toggle("hidden", view!=="lib");
  $("viewEnd").classList.toggle("hidden", view!=="end");
  $("viewStudy").classList.toggle("hidden", view!=="study");
  $("viewPlay").classList.toggle("hidden", view!=="play");
  $("mainTabs").classList.toggle("hidden", view==="study");
  $("tabLib").classList.toggle("on", view==="lib");
  $("tabEnd").classList.toggle("on", view==="end");
  $("tabPlay").classList.toggle("on", view==="play");
  if (view!=="study") stopAuto();
  window.scrollTo(0,0);
}

/* ---------- libraries ---------- */
function firstBadge(op){
  if (op.result){
    var cls = op.result==="Hòa" ? "b-draw" : (op.result.indexOf("Đen")===0 ? "b-den" : "b-win");
    return '<span class="badge '+cls+'">'+op.result+'</span>';
  }
  return '';
}
function renderCards(hostId, list, from){
  var host = $(hostId); host.innerHTML = "";
  list.forEach(function(op){
    var d = document.createElement("div");
    d.className = "opcard" + (learned[op.id] ? " is-learned" : "");
    d.innerHTML = '<h3>'+op.name+(op.cn?'<span class="cn">'+op.cn+'</span>':'')+'</h3>'
      + '<div class="badges">' + firstBadge(op)
      + '<span class="badge b-lv">'+(op.level || op.chapter || "")+'</span>'
      + '<span class="badge b-n">'+op.moves.length+' nước</span>'
      + '</div>' + (op.desc ? '<p>'+op.desc+'</p>' : '') + '<div class="learned">✓</div>';
    d.addEventListener("click", function(){ openStudy(op, from); });
    host.appendChild(d);
  });
}
var OP_CHAPTERS = [];
OPENINGS.forEach(function(op){ if (OP_CHAPTERS.indexOf(op.chapter) < 0) OP_CHAPTERS.push(op.chapter); });
var opFilter = OP_CHAPTERS[0] || null;
function renderLib(){
  var chipHost = $("opChips"); chipHost.innerHTML = "";
  OP_CHAPTERS.forEach(function(ch){
    var c = document.createElement("div");
    var n = OPENINGS.filter(function(o){ return o.chapter===ch; }).length;
    c.className = "chip" + (opFilter===ch ? " cur" : "");
    c.textContent = ch + " (" + n + ")";
    c.addEventListener("click", function(){ opFilter = ch; renderLib(); });
    chipHost.appendChild(c);
  });
  renderCards("opList", opFilter ? OPENINGS.filter(function(o){ return o.chapter===opFilter; }) : OPENINGS, "lib");
}
var egFilter = "SÁT PHÁP CƠ BẢN";
function renderEnd(){
  var chipHost = $("egChips"); chipHost.innerHTML = "";
  EG_CHAPTERS.forEach(function(ch){
    var c = document.createElement("div");
    var n = ALL_EG.filter(function(o){ return o.chapter===ch; }).length;
    c.className = "chip" + (egFilter===ch ? " cur" : "");
    c.textContent = ch + " (" + n + ")";
    c.addEventListener("click", function(){ egFilter = ch; renderEnd(); });
    chipHost.appendChild(c);
  });
  renderCards("egList", ALL_EG.filter(function(o){ return o.chapter===egFilter; }), "end");
}

/* ---------- study ---------- */
var st = { op:null, ply:0, auto:null, from:"lib" };
function stopAuto(){
  if (st.auto){ clearInterval(st.auto); st.auto = null; $("stAuto").textContent = "▶︎ Auto"; }
}
function stBoardAt(ply){
  var b = startBoardOf(st.op);
  for (var i=0;i<ply;i++) applyMove(b, st.op.moves[i].m);
  return b;
}
function openStudy(op, from){
  stopAuto(); st.op = op; st.ply = 0; st.from = from || "lib";
  $("stTitle").firstChild.textContent = op.name;
  $("stSub").textContent = (op.cn ? op.cn + " · " : "") + (op.result ? op.result + " · " : "") + (op.level || op.chapter || "") + " · " + op.moves.length + " nước";
  $("stIdea").style.display = op.idea ? "" : "none";
  $("stIdea").innerHTML = op.idea ? "<b>Ý tưởng chiến lược:</b> " + op.idea : "";
  updLearnedBtn();
  renderStudy();
  show("study");
}
function updLearnedBtn(){
  $("stLearned").textContent = learned[st.op.id] ? "✓ Đã học rồi" : "✓ Đã học";
  $("stLearned").style.opacity = learned[st.op.id] ? "0.75" : "1";
}
function renderStudy(){
  var op = st.op;
  var b = stBoardAt(st.ply);
  var last = st.ply > 0 ? op.moves[st.ply-1].m : null;
  $("stBoard").innerHTML = boardSVG(b, { last:last, arrow:true });
  var bub;
  if (st.ply === 0){
    bub = "<b>" + op.name + ".</b> " + (op.desc || "") + "<br><i style='color:var(--muted)'>Bấm ▶ để xem từng nước đi" + (op.setup ? " của lời giải" : " kèm giải thích") + ".</i>";
  } else {
    var i = st.ply - 1;
    var moveNo = Math.floor(i/2) + 1;
    var who = i % 2 === 0 ? "Đỏ" : "Đen";
    bub = '<span class="mv">' + moveNo + '. ' + (i%2===1?"… ":"") + op._not[i] + '</span><b>' + who + ':</b> ' + (op.moves[i].a || "…");
  }
  $("stBubble").innerHTML = bub;
  var chips = $("stChips"); chips.innerHTML = "";
  op.moves.forEach(function(mv, i){
    var c = document.createElement("div");
    c.className = "chip " + (i%2===0?"red":"blk") + (i===st.ply-1?" cur":"");
    c.innerHTML = '<span class="no">' + (Math.floor(i/2)+1) + (i%2===1?"…":".") + '</span>' + op._not[i];
    c.addEventListener("click", function(){ stopAuto(); st.ply = i+1; renderStudy(); });
    chips.appendChild(c);
  });
  var cur = chips.querySelector(".cur");
  if (cur) cur.scrollIntoView({ block:"nearest", inline:"center", behavior:"smooth" });
  $("stPrev").disabled = $("stFirst").disabled = st.ply === 0;
  $("stNext").disabled = $("stLast").disabled = st.ply >= op.moves.length;
}
$("stBack").addEventListener("click", function(){
  if (st.from === "end"){ show("end"); renderEnd(); } else { show("lib"); renderLib(); }
});
$("stFirst").addEventListener("click", function(){ stopAuto(); st.ply=0; renderStudy(); });
$("stPrev").addEventListener("click", function(){ stopAuto(); if(st.ply>0){st.ply--; renderStudy();} });
$("stNext").addEventListener("click", function(){ stopAuto(); if(st.ply<st.op.moves.length){st.ply++; renderStudy();} });
$("stLast").addEventListener("click", function(){ stopAuto(); st.ply=st.op.moves.length; renderStudy(); });
$("stRetry").addEventListener("click", function(){ stopAuto(); st.ply=0; renderStudy(); toast("Bắt đầu lại từ đầu"); });
$("stAuto").addEventListener("click", function(){
  if (st.auto){ stopAuto(); return; }
  if (st.ply >= st.op.moves.length) st.ply = 0;
  renderStudy();
  $("stAuto").textContent = "⏸ Dừng";
  st.auto = setInterval(function(){
    if (st.ply >= st.op.moves.length){ stopAuto(); toast("Hết ván — bấm ↺ để học lại"); return; }
    st.ply++; renderStudy();
  }, 2400);
});
$("stLearned").addEventListener("click", function(){
  learned[st.op.id] = !learned[st.op.id];
  saveLearned(); updLearnedBtn();
  toast(learned[st.op.id] ? "Đã đánh dấu: bạn thuộc khai cuộc này 🎓" : "Đã bỏ đánh dấu");
});
$("stPlayFrom").addEventListener("click", function(){
  stopAuto();
  var b = stBoardAt(st.ply);
  var turn = st.ply % 2 === 0 ? "r" : "b";
  var human = (st.op.side || "do") === "do" ? "r" : "b";
  startGame({ board:b, turn:turn, mode: human==="r" ? "ai-r" : "ai-b",
    label: "Tiếp từ: " + st.op.name + (st.ply>0 ? " (sau nước "+st.ply+")" : "") });
  show("play");
});

/* ---------- play ---------- */
var pl = { board:null, turn:"r", mode:"ai-r", depth:3, hist:[], sel:null, dots:[], over:false, busy:false,
           base:null, baseTurn:"r", label:"" };
function humanSide(){ return pl.mode==="ai-r" ? "r" : pl.mode==="ai-b" ? "b" : null; }
function aiSide(){ return pl.mode==="ai-r" ? "b" : pl.mode==="ai-b" ? "r" : null; }
function startGame(optsIn){
  var o = optsIn || {};
  pl.board = o.board ? cloneBoard(o.board) : initialBoard();
  pl.turn = o.turn || "r";
  if (o.mode) pl.mode = o.mode;
  pl.base = cloneBoard(pl.board); pl.baseTurn = pl.turn;
  pl.hist = []; pl.sel = null; pl.dots = []; pl.over = false; pl.busy = false;
  pl.label = o.label || "";
  $("endOverlay").classList.remove("show");
  syncModeButtons(); renderPlay();
  maybeAI();
}
function syncModeButtons(){
  var btns = $("modeRow").querySelectorAll(".optbtn");
  for (var i=0;i<btns.length;i++) btns[i].classList.toggle("on", btns[i].getAttribute("data-mode")===pl.mode);
  var dbtns = $("diffRow").querySelectorAll(".optbtn");
  for (var j=0;j<dbtns.length;j++) dbtns[j].classList.toggle("on", +dbtns[j].getAttribute("data-d")===pl.depth);
  $("plSub").textContent = pl.label || (pl.mode==="2p" ? "Hai người chơi trên cùng máy" : "Bạn cầm " + (pl.mode==="ai-r"?"Đỏ":"Đen") + " — máy cầm " + (pl.mode==="ai-r"?"Đen":"Đỏ"));
}
function renderPlay(){
  var clickable = !pl.over && !pl.busy && (pl.mode==="2p" || pl.turn===humanSide());
  var last = pl.hist.length ? pl.hist[pl.hist.length-1].m : null;
  $("plBoard").innerHTML = boardSVG(pl.board, { last:last, arrow:true, sel:pl.sel, dots:pl.dots, clickable:clickable });
  var tp = $("plTurn");
  tp.textContent = pl.over ? "Ván đã kết thúc" : (pl.turn==="r" ? "Đỏ đi" : "Đen đi");
  tp.className = "turnpill " + (pl.turn==="r" ? "turn-r" : "turn-b");
  var chips = $("plChips"); chips.innerHTML = "";
  pl.hist.forEach(function(h, i){
    var c = document.createElement("div");
    c.className = "chip " + (h.side==="r"?"red":"blk");
    c.innerHTML = '<span class="no">' + (Math.floor(i/2)+1) + (i%2===1?"…":".") + '</span>' + h.not;
    chips.appendChild(c);
  });
  chips.scrollLeft = chips.scrollWidth;
}
function endGame(winner, why){
  pl.over = true; pl.busy = false;
  $("plThink").textContent = "";
  var hs = humanSide();
  var youWin = hs && winner===hs, youLose = hs && winner!==hs;
  $("endIcon").textContent = youWin ? "🏆" : youLose ? "🙈" : "🏁";
  $("endTitle").textContent = (winner==="r" ? "Đỏ thắng!" : "Đen thắng!") + (youWin ? " Chúc mừng!" : "");
  $("endDesc").textContent = why;
  $("endOverlay").classList.add("show");
  renderPlay();
}
function afterMove(){
  pl.sel = null; pl.dots = [];
  var next = pl.turn;
  var moves = legalMoves(pl.board, next);
  if (moves.length === 0){
    var winner = next==="r" ? "b" : "r";
    endGame(winner, inCheck(pl.board, next) ? "Chiếu bí — không còn nước cản!" : "Hết nước đi (bị vây khốn).");
    return;
  }
  if (inCheck(pl.board, next)) toast("Chiếu tướng!");
  renderPlay();
  maybeAI();
}
function doMove(m){
  var not = moveNotation(pl.board, m);
  var side = pl.board[m[1]][m[0]].s;
  var cap = applyMove(pl.board, m);
  pl.hist.push({ m:m, cap:cap, not:not, side:side });
  pl.turn = pl.turn==="r" ? "b" : "r";
  afterMove();
}
function maybeAI(){
  if (pl.over || pl.mode==="2p" || pl.turn!==aiSide()) return;
  pl.busy = true;
  $("plThink").textContent = "Máy đang nghĩ…";
  renderPlay();
  setTimeout(function(){
    var m = bestMove(pl.board, pl.turn, pl.depth);
    pl.busy = false;
    $("plThink").textContent = "";
    if (!m){ endGame(pl.turn==="r"?"b":"r", "Máy hết nước đi."); return; }
    doMove(m);
  }, 120);
}
$("plBoard").addEventListener("click", function(ev){
  var t = ev.target;
  if (!t || !t.getAttribute || t.getAttribute("data-c")===null || t.getAttribute("data-c")===undefined) return;
  var c = +t.getAttribute("data-c"), r = +t.getAttribute("data-r");
  if (isNaN(c) || pl.over || pl.busy) return;
  if (pl.mode!=="2p" && pl.turn!==humanSide()) return;
  var p = pl.board[r][c];
  if (pl.sel){
    var ok = pl.dots.some(function(d){ return d[0]===c && d[1]===r; });
    if (ok){ doMove([pl.sel[0], pl.sel[1], c, r]); return; }
  }
  if (p && p.s===pl.turn){
    pl.sel = [c,r];
    pl.dots = legalMoves(pl.board, pl.turn)
      .filter(function(m){ return m[0]===c && m[1]===r; })
      .map(function(m){ return [m[2], m[3]]; });
    if (pl.dots.length===0) toast("Quân này hiện không có nước đi hợp lệ");
    renderPlay();
  } else if (pl.sel){
    pl.sel = null; pl.dots = []; renderPlay();
  }
});
$("plUndo").addEventListener("click", function(){
  if (pl.busy) return;
  var n = pl.mode==="2p" ? 1 : 2;
  if (pl.hist.length === 0){ toast("Chưa có nước nào để đi lại"); return; }
  $("endOverlay").classList.remove("show"); pl.over = false;
  while (n-- > 0 && pl.hist.length > 0){
    var h = pl.hist.pop();
    undoMove(pl.board, h.m, h.cap);
    pl.turn = pl.turn==="r" ? "b" : "r";
  }
  pl.sel = null; pl.dots = [];
  renderPlay();
  maybeAI();
});
$("plNew").addEventListener("click", function(){ startGame({ mode: pl.mode }); toast("Ván mới — chúc may mắn!"); });
$("endNew").addEventListener("click", function(){ startGame({ mode: pl.mode }); });
$("plBack").addEventListener("click", function(){ show("lib"); renderLib(); });
$("modeRow").addEventListener("click", function(ev){
  var b = ev.target.closest(".optbtn"); if (!b) return;
  startGame({ mode: b.getAttribute("data-mode") });
});
$("diffRow").addEventListener("click", function(ev){
  var b = ev.target.closest(".optbtn"); if (!b) return;
  pl.depth = +b.getAttribute("data-d");
  syncModeButtons();
  toast("Độ khó: " + (pl.depth===2 ? "Dễ" : "Thường"));
});

/* ---------- tabs & init ---------- */
$("tabLib").addEventListener("click", function(){ show("lib"); renderLib(); });
$("tabEnd").addEventListener("click", function(){ show("end"); renderEnd(); });
$("tabPlay").addEventListener("click", function(){
  if (!pl.board) startGame({ mode:"ai-r" });
  show("play");
});
renderLib();
renderEnd();
show("lib");
})();
