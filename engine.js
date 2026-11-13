/* ==========================================================================
   A2.2 — v19.0 · Quizzes · Flashcards · Escucha · Exámenes
   Interfaz y preguntas en español. El árabe solo en la explicación del error
   y en el resumen/glosario del tab de escucha.
   Almacenamiento propio: a21_v17_* (no toca a2_inline_answers_v3).
   ========================================================================== */
const XV = 'v17.2';
const XLS = 'a21_v17_';

const XTRA_TABS = [
  {k:'qz', es:'Quizzes'},
  {k:'fc', es:'Flashcards'},
  {k:'ls', es:'Escucha'},
  {k:'ex', es:'Exámenes'}
];
let XTAB = null;

/* ---------- utilidades ---------- */
const xEl = (t, cls, html) => { const e=document.createElement(t); if(cls)e.className=cls; if(html!=null)e.innerHTML=html; return e; };
const xEsc = s => String(s==null?'':s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
const xShuffle = a => { a=a.slice(); for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1)); [a[i],a[j]]=[a[j],a[i]];} return a; };
const xSample = (a,n) => xShuffle(a).slice(0, Math.min(n, a.length));
const xNorm = s => String(s||'').toLowerCase()
   .replace(/[áà]/g,'a').replace(/[éè]/g,'e').replace(/[íì]/g,'i').replace(/[óò]/g,'o').replace(/[úù]/g,'u')
   .replace(/ñ/g,'n').replace(/ü/g,'u').replace(/[¿?¡!.,;:"'`´()]/g,' ').replace(/\s+/g,' ').trim();
/* النص العربي: نحوّل [[español]] لمستطيل شفاف معزول الاتجاه */
const xAr = s => xEsc(s==null?'':s)
   .replace(/\[\[(.+?)\]\]/g,'<span class="esx" dir="ltr">$1</span>')
   .replace(/\n/g,'<br>');
const xKeep = s => String(s==null?'':s);   // المحتوى الإسباني موثوق (نحن نكتبه)

const xStore = {
  get(k,d){ try{ const v=localStorage.getItem(XLS+k); return v==null?d:JSON.parse(v); }catch(e){ return d; } },
  set(k,v){ try{ localStorage.setItem(XLS+k, JSON.stringify(v)); }catch(e){} }
};
const XU = k => (XD.units.find(u=>u.k===k)||{ar:k,es:''});

/* ==========================================================================
   Diálogos dentro de la página (nunca alert/confirm del navegador)
   ========================================================================== */
function xModal(msg, opts){
  opts = opts || {};
  return new Promise(resolve=>{
    const wrap = xEl('div','xmodal');
    const box = xEl('div','xmodal-b');
    box.innerHTML = '<div class="xm-ic">'+(opts.icon||'?')+'</div>'+
      '<div class="xm-t">'+xEsc(opts.title||'')+'</div>'+
      '<div class="xm-m">'+xKeep(msg).replace(/\n/g,'<br>')+'</div>';
    const row = xEl('div','xm-row');
    const done = v => { wrap.classList.remove('on');
      setTimeout(()=>wrap.remove(), 180);
      document.removeEventListener('keydown', onkey);
      resolve(v); };
    if (opts.cancel !== false){
      const b = xEl('button','xbtn', opts.no||'Cancelar'); b.onclick=()=>done(false); row.appendChild(b);
    }
    const okb = xEl('button','xbtn '+(opts.danger?'bad':'pri'), opts.ok||'Aceptar');
    okb.onclick=()=>done(true); row.appendChild(okb);
    box.appendChild(row); wrap.appendChild(box);
    const onkey = e=>{ if (e.key==='Escape') done(false); if (e.key==='Enter') done(true); };
    document.addEventListener('keydown', onkey);
    (document.getElementById('xtraPanel')||document.body).appendChild(wrap);
    requestAnimationFrame(()=>wrap.classList.add('on'));
  });
}
const xConfirm = (msg, opts) => xModal(msg, Object.assign({cancel:true}, opts||{}));
const xAlert   = (msg, opts) => xModal(msg, Object.assign({cancel:false, ok:'Entendido'}, opts||{}));
function xToast(msg, kind){
  let host = document.getElementById('xToasts');
  if (!host){ host = xEl('div','xtoasts'); host.id='xToasts'; document.body.appendChild(host); }
  const t = xEl('div','xtoast '+(kind||''), msg);
  host.appendChild(t);
  requestAnimationFrame(()=>t.classList.add('on'));
  setTimeout(()=>{ t.classList.remove('on'); setTimeout(()=>t.remove(), 300); }, 2600);
}

/* ---------- panel ---------- */
function xPanel(){
  let p = document.getElementById('xtraPanel');
  if (!p){
    p = xEl('div','xtra'); p.id='xtraPanel';
    const doc = document.getElementById('doc');
    doc.parentNode.insertBefore(p, doc.nextSibling);
  }
  return p;
}
function xOpen(k){
  XTAB = k;
  if (typeof au !== 'undefined' && au && !au.paused){ try{ au.pause(); }catch(e){} }
  xStopAudio();
  document.body.classList.add('xtra-on');
  const p = xPanel(); p.classList.add('on');
  const b = xClear();
  if (k==='qz') xQuizHome(b);
  if (k==='fc') xFlashHome(b);
  if (k==='ls') xListenHome(b);
  if (k==='ex') xExamHome(b);
  xSyncTabs();
  window.scrollTo({top:0, behavior:'auto'});
  try{ localStorage.setItem('lector_iview', 'x:'+k); }catch(e){}
}
function xHide(){
  XTAB = null; xStopAudio();
  if (xTimer){ clearInterval(xTimer); xTimer=null; }
  document.body.classList.remove('xtra-on');
  const p = document.getElementById('xtraPanel'); if (p){ p.classList.remove('on'); p.innerHTML=''; }
  const t = document.getElementById('xToasts'); if (t) t.remove();
  document.querySelectorAll('.tab[data-k^="x-"]').forEach(b=>b.classList.remove('on'));
  window.scrollTo({top:0, behavior:'auto'});
  xToast('Has vuelto al libro', 'ok');
}
function xSyncTabs(){
  document.querySelectorAll('.tab').forEach(b=>{
    const k = b.dataset.k||'';
    if (k.startsWith('x-')) b.classList.toggle('on', XTAB===k.slice(2));
    else if (XTAB) b.classList.remove('on');
  });
}
function xStrip(active){
  const s = xEl('div','xstrip');
  XTRA_TABS.forEach(t=>{
    const b = xEl('button','xsb'+(t.k===active?' on':''), t.es); b.dataset.k=t.k;
    b.onclick=()=>xOpen(t.k); s.appendChild(b);
  });
  const x = xEl('button','xsb xexit','← Libro'); x.onclick=xHide; s.appendChild(x);
  return s;
}
function xClear(){
  const p = xPanel();
  let strip = p.querySelector('.xstrip'), body = p.querySelector('.xbody');
  if (!strip || !body){
    p.innerHTML=''; strip = xStrip(XTAB); body = xEl('div','xbody'); p.append(strip, body);
  }
  strip.querySelectorAll('.xsb').forEach(el=>{ if(el.dataset.k) el.classList.toggle('on', el.dataset.k===XTAB); });
  body.innerHTML=''; return body;
}
function xHead(title, sub, backFn, backLabel){
  const h = xEl('div','xh');
  h.appendChild(xEl('div','xt','<b>'+xEsc(title)+'</b>'+(sub?'<span class="xe">'+xEsc(sub)+'</span>':'')));
  if (backFn){ const b=xEl('button','xback','← '+(backLabel||'Volver')); b.onclick=backFn; h.appendChild(b); }
  return h;
}
function xPills(list){ return '<div class="xc-m">'+list.map(t=>'<span class="pill">'+xEsc(t)+'</span>').join('')+'</div>'; }

/* ==========================================================================
   1) QUIZZES
   ========================================================================== */
let QZ = null;
function xQuizHome(p){
  if (!p || typeof p.appendChild !== 'function') p = xClear();
  p.innerHTML='';
  const best = xStore.get('scores', {});
  p.appendChild(xHead('Quizzes por unidad','A2.2 · preguntas aleatorias'));
  p.appendChild(xEl('div','xnote','Cada intento toma preguntas <b>al azar</b> del banco y cambia el orden de las opciones. Al final se corrige solo: nota, porcentaje y revisión de cada pregunta (con la explicación del error en árabe).'));
  const grid = xEl('div','xgrid');
  XD.units.filter(u=>XD.quiz[u.k] && XD.quiz[u.k].length).forEach(u=>{
    const bank = XD.quiz[u.k], s = best['q_'+u.k];
    const c = xEl('div','xcard');
    c.innerHTML = '<div class="xc-h"><b>'+xEsc(u.es)+' · '+xEsc(u.ar)+'</b></div>'+
      xPills([bank.length+' preguntas en el banco',
              s? 'Mejor nota: '+s.right+'/'+s.total : 'Sin hacer']);
    const row = xEl('div','xc-btns');
    [['10','Quiz rápido'],['20','Quiz completo'],['0','Todo el banco']].forEach(([n,lab],i)=>{
      const b=xEl('button','xbtn'+(i===1?' pri':''),lab);
      b.onclick=()=>xQuizStart(u.k, +n);
      row.appendChild(b);
    });
    c.appendChild(row); grid.appendChild(c);
  });
  const all = xEl('div','xcard wide');
  const tot = Object.values(XD.quiz).reduce((a,b)=>a+b.length,0);
  all.innerHTML = '<div class="xc-h"><b>Quiz global</b></div>'+xPills(['Unidades 1–4', tot+' preguntas en el banco']);
  const r2 = xEl('div','xc-btns');
  [['20','20 preguntas'],['30','30 preguntas'],['0','Todo el banco']].forEach(([n,lab],i)=>{
    const b=xEl('button','xbtn'+(i===1?' pri':''),lab); b.onclick=()=>xQuizStart('ALL', +n); r2.appendChild(b);
  });
  all.appendChild(r2); grid.appendChild(all);
  p.appendChild(grid);
}
function xPool(uk){
  if (uk==='ALL') return [].concat(...Object.keys(XD.quiz).map(k=>XD.quiz[k].map(q=>({...q, unit:k}))));
  return XD.quiz[uk].map(q=>({...q, unit:uk}));
}
function xPrepQ(q){
  if (q.type==='mcq'){
    const sh = xShuffle(q.opts.map((o,i)=>i));
    return {...q, opts:sh.map(i=>q.opts[i]), a:sh.indexOf(q.a)};
  }
  return q;
}
function xQuizStart(uk, n){
  const pool = xPool(uk);
  const qs = xSample(pool, n>0?n:pool.length).map(xPrepQ);
  QZ = {uk, qs, i:0, ans:new Array(qs.length).fill(null), t0:Date.now()};
  xQuizRender();
}
function xQuizRender(){
  const p = xClear(); if (!QZ) return;
  const u = QZ.uk==='ALL' ? {es:'Quiz global', ar:'Unidades 1–4'} : XU(QZ.uk);
  p.appendChild(xHead(u.es+' · '+u.ar, 'Pregunta '+(QZ.i+1)+' de '+QZ.qs.length, xQuizHome));
  const bar = xEl('div','xbar');
  bar.innerHTML = '<div class="xbar-in"><i style="width:'+Math.round((QZ.i/QZ.qs.length)*100)+'%"></i></div>'+
                  '<span>'+(QZ.i+1)+' / '+QZ.qs.length+'</span>';
  p.appendChild(bar);
  const q = QZ.qs[QZ.i];
  const card = xEl('div','xq');
  card.appendChild(xEl('div','xq-tag',
    (q.tag?'<span class="tagx">'+xEsc(q.tag)+'</span>':'')+(q.ref?'<span class="refx">'+xEsc(q.ref)+'</span>':'')));
  card.appendChild(xEl('div','xq-q', xKeep(q.q)));
  if (q.type==='mcq'){
    const ul = xEl('div','xopts');
    q.opts.forEach((o,i)=>{
      const b = xEl('button','xopt'+(QZ.ans[QZ.i]===i?' sel':''),
        '<span class="k">'+'ABCD'[i]+'</span><span class="t">'+xKeep(o)+'</span>');
      b.onclick=()=>{ QZ.ans[QZ.i]=i; xQuizRender();
        if (QZ.i < QZ.qs.length-1) setTimeout(()=>{ if (XTAB==='qz' && QZ && QZ.ans[QZ.i]!=null) xQuizNext(); }, 260); };
      ul.appendChild(b);
    });
    card.appendChild(ul);
  } else {
    const inp = xEl('input','xfill');
    inp.type='text'; inp.placeholder='Escribe la palabra que falta…'; inp.autocapitalize='off'; inp.autocomplete='off'; inp.spellcheck=false;
    inp.value = QZ.ans[QZ.i] || '';
    inp.oninput = ()=>{ QZ.ans[QZ.i]=inp.value; };
    inp.onkeydown = (e)=>{ if(e.key==='Enter'){ QZ.i<QZ.qs.length-1 ? xQuizNext() : xQuizSubmit(); } };
    card.appendChild(inp);
    card.appendChild(xEl('div','xhint','Escribe solo la palabra o expresión que falta. No importan las mayúsculas ni los acentos.'));
    setTimeout(()=>inp.focus(), 30);
  }
  p.appendChild(card);

  const nav = xEl('div','xnav');
  const prev = xEl('button','xbtn','← Anterior'); prev.disabled = QZ.i===0; prev.onclick=()=>{ QZ.i--; xQuizRender(); };
  const isLast = QZ.i===QZ.qs.length-1;
  const next = xEl('button','xbtn pri', isLast? 'Corregir y ver la nota':'Siguiente →');
  next.onclick = ()=> isLast ? xQuizSubmit() : xQuizNext();
  nav.append(prev,next); p.appendChild(nav);

  const dots = xEl('div','xdots');
  QZ.qs.forEach((qq,i)=>{
    const d=xEl('button','xdot'+(i===QZ.i?' on':'')+(QZ.ans[i]!=null && QZ.ans[i]!==''?' done':''), String(i+1));
    d.onclick=()=>{ QZ.i=i; xQuizRender(); };
    dots.appendChild(d);
  });
  p.appendChild(dots);
}
function xQuizNext(){ if (QZ.i < QZ.qs.length-1){ QZ.i++; xQuizRender(); } }
function xGrade(q, ans){
  if (ans==null || ans==='') return false;
  if (q.type==='mcq') return ans === q.a;
  const ok = [q.a].concat(q.alt||[]).map(xNorm);
  const got = xNorm(ans);
  return got ? ok.indexOf(got)>=0 : false;
}
async function xQuizSubmit(){
  if (!QZ) return;
  const unans = QZ.qs.map((q,i)=> (QZ.ans[i]==null||QZ.ans[i]==='') ? i+1 : 0).filter(Boolean);
  if (unans.length){
    const go = await xConfirm('Hay '+unans.length+' pregunta(s) sin responder ('+unans.slice(0,12).join(', ')+(unans.length>12?'…':'')+'). ¿Quieres corregir igualmente?',
      {title:'Faltan respuestas', icon:'✎', ok:'Corregir ahora', no:'Seguir contestando'});
    if (!go) return;
  }
  let right=0; const byTag={};
  QZ.qs.forEach((q,i)=>{
    const ok = xGrade(q, QZ.ans[i]);
    if (ok) right++;
    const t = q.tag||'General';
    byTag[t]=byTag[t]||{r:0,n:0}; byTag[t].n++; if(ok) byTag[t].r++;
  });
  const total=QZ.qs.length, pct=Math.round(right/total*100), secs=Math.round((Date.now()-QZ.t0)/1000);
  const best = xStore.get('scores', {}); const key='q_'+QZ.uk;
  if (!best[key] || right > best[key].right){ best[key]={right,total,at:Date.now()}; xStore.set('scores', best); }
  const hist = xStore.get('qhist', []); hist.unshift({uk:QZ.uk,right,total,at:Date.now()}); xStore.set('qhist', hist.slice(0,40));

  const p = xClear();
  const u = QZ.uk==='ALL' ? {es:'Quiz global', ar:'Unidades 1–4'} : XU(QZ.uk);
  p.appendChild(xHead(u.es+' · resultado', u.ar, xQuizHome));
  const g = right/total>=.9?['Excelente','g4']:right/total>=.75?['Muy bien','g3']:right/total>=.6?['Bien','g2']:['Hay que repasar','g1'];
  const res = xEl('div','xres');
  res.innerHTML =
    '<div class="ring '+g[1]+'"><div class="rv">'+pct+'<small>%</small></div><div class="rl">'+g[0]+'</div></div>'+
    '<div class="rstack">'+
      '<div class="rline"><b>'+right+'</b> correctas de <b>'+total+'</b> · tiempo '+Math.floor(secs/60)+':'+String(secs%60).padStart(2,'0')+'</div>'+
      '<div class="rline">'+(pct>=60?'Aprobado (mínimo 60%)':'Suspenso: repasa los errores y vuelve a intentarlo')+'</div>'+
      '<div class="rtags">'+Object.keys(byTag).map(t=>'<span class="tagx">'+xEsc(t)+': '+byTag[t].r+'/'+byTag[t].n+'</span>').join('')+'</div>'+
    '</div>';
  p.appendChild(res);

  const nav = xEl('div','xnav');
  const again = xEl('button','xbtn pri','Nuevo intento con preguntas nuevas');
  again.onclick=()=>xQuizStart(QZ.uk, QZ.qs.length>=xPool(QZ.uk).length?0:QZ.qs.length);
  const wrongQs = QZ.qs.filter((q,i)=>!xGrade(q,QZ.ans[i]));
  const onlyWrong = xEl('button','xbtn','Repetir solo los errores');
  onlyWrong.disabled = !wrongQs.length;
  onlyWrong.onclick=()=>{ QZ={uk:QZ.uk, qs:wrongQs.map(xPrepQ), i:0, ans:wrongQs.map(()=>null), t0:Date.now()}; xQuizRender(); };
  nav.append(again, onlyWrong); p.appendChild(nav);

  const rev = xEl('div','xrev');
  rev.appendChild(xEl('h3','xsec','Revisión de todas las preguntas'));
  QZ.qs.forEach((q,i)=>{
    const ok = xGrade(q, QZ.ans[i]);
    const mine = q.type==='mcq' ? (QZ.ans[i]!=null? q.opts[QZ.ans[i]] : 'Sin respuesta') : (QZ.ans[i]||'Sin respuesta');
    const corr = q.type==='mcq' ? q.opts[q.a] : q.a;
    const d = xEl('div','xr'+(ok?' ok':' no'));
    d.innerHTML =
      '<div class="xr-h"><span class="num">'+(i+1)+'</span><span class="st">'+(ok?'✓':'✗')+'</span>'+
      '<span class="unit">'+xEsc(XU(q.unit).es)+'</span></div>'+
      '<div class="xr-q">'+xKeep(q.q)+'</div>'+
      '<div class="xr-a">'+
        '<div><span class="lb">Tu respuesta:</span> <span class="'+(ok?'good':'bad')+'">'+xEsc(mine)+'</span></div>'+
        (ok?'':'<div><span class="lb">Correcta:</span> <span class="good">'+xEsc(corr)+'</span></div>')+
        (q.ex?'<div class="ex ar" dir="rtl">'+xAr(q.ex)+'</div>':'')+
        (q.ref?'<div class="rf">'+xEsc(q.ref)+'</div>':'')+
      '</div>';
    rev.appendChild(d);
  });
  p.appendChild(rev);
  window.scrollTo({top:0,behavior:'auto'});
}
function xQuizBank(p){
  p.innerHTML='';
  p.appendChild(xHead('Banco de preguntas','Todas las preguntas del curso', xQuizHome));
  p.appendChild(xEl('div','xnote','Vista para el profesor: aquí están todas las preguntas de las que salen los quizzes. En clase usa los quizzes, que cambian el orden en cada intento.'));
  XD.units.filter(u=>XD.quiz[u.k]).forEach(u=>{
    const box = xEl('div','xbank');
    box.appendChild(xEl('h3','xsec', u.es+' — '+u.ar+' ('+XD.quiz[u.k].length+')'));
    XD.quiz[u.k].forEach((q,i)=>{
      const d = xEl('div','xr');
      d.innerHTML = '<div class="xr-h"><span class="num">'+(i+1)+'</span><span class="unit">'+xEsc(q.tag||'')+'</span></div>'+
        '<div class="xr-q">'+xKeep(q.q)+'</div>'+
        (q.type==='mcq'
          ? '<div class="xr-a">'+q.opts.map((o,j)=>'<div class="'+(j===q.a?'good':'')+'">'+'ABCD'[j]+'. '+xKeep(o)+'</div>').join('')+'</div>'
          : '<div class="xr-a"><div class="good">'+xEsc(q.a)+'</div></div>')+
        (q.ex?'<div class="ex ar" dir="rtl">'+xAr(q.ex)+'</div>':'');
      box.appendChild(d);
    });
    p.appendChild(box);
  });
}

/* ==========================================================================
   2) FLASHCARDS
   ========================================================================== */
let FC = null, xFlashKeys = null;
function xFlashHome(p){
  if (!p || typeof p.appendChild !== 'function') p = xClear();
  p.innerHTML='';
  p.appendChild(xHead('Flashcards','Vocabulario y frases · español ↔ árabe'));
  p.appendChild(xEl('div','xnote','Español delante, significado y ejemplo detrás. Marca lo que ya sabes: lo que no sepas se queda para repasar. Atajos: <b>espacio</b> gira la carta, <b>←</b> la sabía, <b>→</b> repasar.'));
  const grid = xEl('div','xgrid');
  const prog = xStore.get('fcprog', {});
  XD.units.forEach(u=>{
    const d = XD.flash[u.k]; if(!d) return;
    const nW=(d.words||[]).length, nS=(d.sentences||[]).length, pr=prog[u.k]||{};
    const c = xEl('div','xcard');
    c.innerHTML = '<div class="xc-h"><b>'+xEsc(u.es)+' · '+xEsc(u.ar)+'</b></div>'+
      xPills([nW+' palabras', nS+' frases'].concat(pr.known? ['Sabidas: '+pr.known]:[]));
    const row = xEl('div','xc-btns');
    const b1=xEl('button','xbtn pri','Empezar'); b1.onclick=()=>xFlashStart(u.k,'all');
    const b2=xEl('button','xbtn','Solo palabras'); b2.onclick=()=>xFlashStart(u.k,'words');
    const b3=xEl('button','xbtn','Solo frases'); b3.onclick=()=>xFlashStart(u.k,'sentences');
    row.append(b1,b2,b3); c.appendChild(row); grid.appendChild(c);
  });
  p.appendChild(grid);
  const c2 = xEl('div','xcard wide');
  c2.innerHTML = '<div class="xc-h"><b>Repaso rápido</b></div>'+xPills(['20 cartas al azar de todo el curso']);
  const rr = xEl('div','xc-btns');
  const b=xEl('button','xbtn pri','20 cartas al azar'); b.onclick=()=>xFlashStart('ALL','random');
  rr.appendChild(b); c2.appendChild(rr); p.appendChild(c2);
}
function xFlashDeck(uk, mode){
  if (uk==='ALL'){
    let all=[]; Object.keys(XD.flash).forEach(k=>{
      const d=XD.flash[k];
      all = all.concat((d.words||[]).map(w=>({...w,type:'w',unit:k})), (d.sentences||[]).map(w=>({...w,type:'s',unit:k})));
    });
    return xShuffle(all).slice(0,20);
  }
  const d = XD.flash[uk]||{};
  if (mode==='words') return (d.words||[]).map(w=>({...w,type:'w',unit:uk}));
  if (mode==='sentences') return (d.sentences||[]).map(w=>({...w,type:'s',unit:uk}));
  return (d.words||[]).map(w=>({...w,type:'w',unit:uk})).concat((d.sentences||[]).map(w=>({...w,type:'s',unit:uk})));
}
function xFlashStart(uk, mode){
  FC = {uk, mode, deck:xFlashDeck(uk,mode), i:0, known:{}, again:{}};
  xFlashRender();
}
function xFlashRender(){
  const p = xClear(); if (!FC) return;
  const u = FC.uk==='ALL' ? {es:'Repaso rápido', ar:'20 cartas'} : XU(FC.uk);
  p.appendChild(xHead(u.es+' · flashcards', FC.mode==='words'?'Solo palabras':FC.mode==='sentences'?'Solo frases':'Todo', xFlashHome));
  if (FC.i >= FC.deck.length){ xFlashDone(p); return; }
  const done = Object.keys(FC.known).length + Object.keys(FC.again).length;
  const bar = xEl('div','xbar');
  bar.innerHTML = '<div class="xbar-in"><i style="width:'+Math.round(done/FC.deck.length*100)+'%"></i></div>'+
                  '<span>'+(FC.i+1)+' / '+FC.deck.length+'</span>';
  p.appendChild(bar);

  const c = FC.deck[FC.i];
  const card = xEl('div','flashcard');
  const front = xEl('div','fc-face');
  front.innerHTML = '<div class="fc-badge">'+(c.type==='w'?'Palabra o expresión':'Frase')+' · '+xEsc(XU(c.unit).ar)+'</div>'+
    '<div class="fc-es">'+xEsc(c.es)+'</div>'+
    '<button class="fc-flip">Girar ↻</button>';
  const back = xEl('div','fc-face back');
  back.innerHTML = '<div class="fc-badge">Significado</div>'+
    '<div class="fc-ar" dir="rtl">'+xEsc(c.ar)+'</div>'+
    (c.ex?'<div class="fc-ex">'+xEsc(c.ex)+'</div>':'')+
    '<button class="fc-flip">Volver ↺</button>';
  front.querySelector('.fc-flip').onclick=()=>card.classList.add('flipped');
  back.querySelector('.fc-flip').onclick=()=>card.classList.remove('flipped');
  card.append(front,back);
  card.onclick = e => { if(e.target.closest('.fc-flip')) return; card.classList.toggle('flipped'); };
  p.appendChild(card);

  const nav = xEl('div','xnav fc-nav');
  const no = xEl('button','xbtn bad','✗ A repasar');
  const yes = xEl('button','xbtn good','✓ La sabía');
  const adv = (ok)=>{ (ok?FC.known:FC.again)[FC.i]=1;
    const prog = xStore.get('fcprog',{}); const k=FC.uk;
    prog[k]=prog[k]||{}; if(ok) prog[k].known=(prog[k].known||0)+1; xStore.set('fcprog',prog);
    FC.i++; xFlashRender(); };
  no.onclick=()=>adv(false); yes.onclick=()=>adv(true);
  nav.append(no,yes); p.appendChild(nav);
  p.appendChild(xEl('div','xhint','Espacio: girar · ← la sabía · → a repasar'));
  xFlashKeys = { flip:()=>card.classList.toggle('flipped'), yes:()=>adv(true), no:()=>adv(false) };
}
function xFlashDone(p){
  const n = FC.deck.length, ok = Object.keys(FC.known).length;
  const res = xEl('div','xres');
  const pct = Math.round(ok/n*100);
  res.innerHTML = '<div class="ring '+(pct>=80?'g4':pct>=50?'g2':'g1')+'"><div class="rv">'+pct+'<small>%</small></div><div class="rl">sabidas</div></div>'+
    '<div class="rstack"><div class="rline"><b>'+ok+'</b> de <b>'+n+'</b> cartas</div>'+
    '<div class="rline">'+(pct>=80?'Muy bien: puedes pasar a la unidad siguiente.':'Repite el mazo: las cartas marcadas vuelven a salir.')+'</div></div>';
  p.appendChild(res);
  const nav = xEl('div','xnav');
  const b1=xEl('button','xbtn pri','Repetir este mazo'); b1.onclick=()=>xFlashStart(FC.uk, FC.mode);
  const b2=xEl('button','xbtn','Volver'); b2.onclick=xFlashHome;
  nav.append(b1,b2); p.appendChild(nav);
  xFlashKeys = null;
}

/* ==========================================================================
   3) ESCUCHA — pistas + pestañas internas por pista
   ========================================================================== */
let xAud = null, xLSTab = 'trans', xLSFile = null;
const LSN = [['trans','Transcripción'],['ar','Resumen'],['voc','Vocabulario'],['q','Comprensión']];
function xStopAudio(){ if (xAud){ try{ xAud.pause(); }catch(e){} } }
function xListenHome(p){
  if (!p || typeof p.appendChild !== 'function') p = xClear();
  p.innerHTML='';
  p.appendChild(xHead('Escucha','Audios y transcripciones · A2.2'));
  p.appendChild(xEl('div','xnote','Cada pista con su <b>transcripción oficial</b>, el resumen en árabe y preguntas de comprensión. Escucha primero sin abrir la transcripción: como en el examen.'));
  const byUnit = {};
  XD.listen.tracks.forEach(t=>{ (byUnit[t.unit]=byUnit[t.unit]||[]).push(t); });
  Object.keys(byUnit).forEach(uk=>{
    const box = xEl('div','xbank');
    box.appendChild(xEl('h3','xsec', XU(uk).es+' — '+XU(uk).ar));
    byUnit[uk].forEach(t=>{
      const row = xEl('div','xls-row');
      const alt = /_alt\.mp3$/.test(t.file);
      row.innerHTML = '<span class="trk'+(alt?' alt':'')+'">'+xEsc(t.trk)+'</span>'+
        '<span class="ttl"><b>'+xEsc(t.title)+'</b><span>p. '+t.page+(alt?' · versión alternativa':'')+' · '+t.q.length+' preguntas</span></span>'+
        '<button class="xbtn">Abrir</button>';
      row.querySelector('button').onclick=()=>{ xLSTab='trans'; xListenOpen(t.id); };
      box.appendChild(row);
    });
    p.appendChild(box);
  });
}
function xListenOpen(id){
  const t = XD.listen.tracks.find(x=>x.id===id);
  if (!t) return;
  xLSFile = id;
  xStopAudio(); if (xTimer){ clearInterval(xTimer); xTimer=null; }
  const p = xClear();
  p.appendChild(xHead('Pista '+t.trk+' · '+t.title, 'p. '+t.page+' · '+t.q.length+' preguntas', xListenHome));

  /* reproductor (siempre visible) */
  const pl = xEl('div','xply');
  pl.innerHTML = '<audio id="xAudio" preload="metadata" src="audio/'+t.file+'"></audio>'+
    '<div class="xseek"><span class="tm"><b id="xCur">0:00</b> / <span id="xDur">—</span></span>'+
    '<input type="range" id="xSeek" min="0" max="100" value="0" step="0.1"></div>';
  const ctrls = xEl('div','xply-c');
  const play = xEl('button','xplay','▶ Reproducir');
  const b10 = xEl('button','xbtn','⟲ 10 s'); const f10 = xEl('button','xbtn','10 s ⟳');
  const spd = xEl('select','xspd');
  ['0.7','0.85','1','1.15','1.3'].forEach(v=>{ const o=xEl('option',null, v==='1'?'Velocidad 1×':v+'×'); o.value=v; if(v==='1')o.selected=true; spd.appendChild(o); });
  ctrls.append(play,b10,f10,spd); pl.appendChild(ctrls);
  p.appendChild(pl);

  /* pestañas internas: el contenido ocupa el sitio del tab abierto */
  const tabs = xEl('div','xtabs');
  LSN.forEach(([k,lab])=>{
    const b = xEl('button','xtab2'+(k===xLSTab?' on':''), lab);
    b.dataset.ls=k;
    b.onclick=()=>{ xLSTab=k; xListenOpen(id); };
    tabs.appendChild(b);
  });
  p.appendChild(tabs);

  const view = xEl('div','xlsview');
  if (xLSTab==='trans'){
    view.innerHTML = '<div class="xblock"><h4>Transcripción · Pista '+xEsc(t.trk)+'</h4>'+
      '<div class="tr-es" dir="ltr">'+xEsc(t.es).replace(/\n/g,'<br>')+'</div>'+
      '</div>';
  } else if (xLSTab==='ar'){
    view.innerHTML = '<div class="xblock"><h4>الملخص بالعربي</h4><div class="tr-ar ar" dir="rtl">'+xAr(t.ar)+'</div>'+
      '<h4>عبارات مفتاحية</h4><div class="keys">'+
      (t.keys||[]).map(k=>'<div class="krow"><span class="kes" dir="ltr">'+xEsc(k[0])+'</span><span class="kar" dir="rtl">'+xEsc(k[1])+'</span></div>').join('')+
      '</div></div>';
  } else if (xLSTab==='voc'){
    view.innerHTML = '<div class="xblock"><h4>مفردات المسار</h4><div class="vocab">'+
      (t.vocab||[]).map(v=>'<span class="vchip"><b dir="ltr">'+xEsc(v[0])+'</b><i dir="rtl">'+xEsc(v[1])+'</i></span>').join('')+
      '</div></div>';
  } else {
    view.innerHTML = '<div class="xblock"><h4>Comprensión — '+t.q.length+' preguntas sin mirar la transcripción</h4>'+
      '<div class="xhint" style="margin:0 0 10px">Escucha la pista y contesta. Cada pregunta se corrige en el momento y te explica el error en árabe.</div></div>';
    const holder = xEl('div','xqlist');
    let done = 0, okN = 0;
    const score = xEl('div','xscore','0 / '+t.q.length+' correctas');
    t.q.forEach((q,qi)=>{
      const d = xEl('div','xmini');
      d.appendChild(xEl('div','xq-q', (qi+1)+'. '+xKeep(q.q)));
      const box = xEl('div','xopts');
      q.opts.forEach((o,oi)=>{
        const b=xEl('button','xopt','<span class="k">'+'ABCD'[oi]+'</span><span class="t">'+xEsc(o)+'</span>');
        b.onclick=()=>{
          if (d.dataset.done) return;
          d.dataset.done='1'; done++;
          const ok = oi===q.a; if (ok) okN++;
          b.classList.add(ok?'ok':'no');
          if(!ok) box.querySelectorAll('.xopt')[q.a].classList.add('ok');
          const s = xEl('div','ex ar', ok? '✓ <b>Correcto.</b><br>'+xAr(q.ex||'') : '✗ <b>Correcta:</b> <span class="okc" dir="ltr">'+xEsc(q.opts[q.a])+'</span><br>'+xAr(q.ex||''));
          s.setAttribute('dir','rtl');
          d.appendChild(s);
          box.querySelectorAll('button').forEach(x=>x.classList.add('locked'));
          score.textContent = okN+' / '+t.q.length+' correctas';
          score.className = 'xscore '+(okN===t.q.length?'g4':okN?'g2':'g1');
          if (done===t.q.length) xToast('Comprensión terminada: '+okN+'/'+t.q.length, okN===t.q.length?'ok':'');
        };
        box.appendChild(b);
      });
      d.appendChild(box); holder.appendChild(d);
    });
    view.appendChild(holder);
    const foot = xEl('div','xnav');
    foot.append(score);
    const rst = xEl('button','xbtn','Reiniciar preguntas'); rst.onclick=()=>xListenOpen(id);
    foot.append(rst);
    view.appendChild(foot);
  }
  p.appendChild(view);

  /* audio */
  xAud = pl.querySelector('#xAudio');
  const seekI = pl.querySelector('#xSeek'), cur = pl.querySelector('#xCur'), dur = pl.querySelector('#xDur');
  const mmss = v => isFinite(v)&&v>0 ? Math.floor(v/60)+':'+String(Math.floor(v%60)).padStart(2,'0') : '—';
  const sync = ()=>{ play.textContent = xAud.paused? '▶ Reproducir' : '⏸ Pausa'; };
  play.onclick=()=>{ if (xAud.paused) xAud.play(); else xAud.pause(); };
  b10.onclick=()=>{ xAud.currentTime=Math.max(0,xAud.currentTime-10); };
  f10.onclick=()=>{ xAud.currentTime=Math.min(xAud.duration||0, xAud.currentTime+10); };
  xAud.onplay=sync; xAud.onpause=sync;
  xAud.onended=()=>{ sync(); play.textContent='↻ Otra vez'; };
  xAud.onloadedmetadata=()=>{ dur.textContent=mmss(xAud.duration); };
  xAud.ontimeupdate=()=>{ cur.textContent=mmss(xAud.currentTime);
    if (xAud.duration) seekI.value=(xAud.currentTime/xAud.duration)*100; };
  seekI.oninput=()=>{ if (xAud.duration) xAud.currentTime=(seekI.value/100)*xAud.duration; };
  spd.onchange=()=>{ xAud.playbackRate=+spd.value; };
}

/* ==========================================================================
   4) EXÁMENES — por tiempo (el audio es la prueba), nunca «la pista N»
   ========================================================================== */
let EX = null, xTimer = null;
function xExamHome(p){
  if (!p || typeof p.appendChild !== 'function') p = xClear();
  p.innerHTML='';
  if (xTimer){ clearInterval(xTimer); xTimer=null; }
  p.appendChild(xHead('Exámenes A2.2','Unidades 5–8 · con tiempo'));
  p.appendChild(xEl('div','xnote','Exámenes completos: vocabulario, gramática y una prueba de <b>comprensión auditiva</b>. No verás transcripciones ni resúmenes: escucha y contesta. El tiempo lo marca el examen, no la pista. Al entregar verás la nota por secciones y la explicación de cada error en árabe.'));
  const hist = xStore.get('exhist', []);
  const grid = xEl('div','xgrid');
  XD.exams.models.forEach(m=>{
    const c = xEl('div','xcard');
    c.innerHTML = '<div class="xc-h"><b>'+xEsc(m.ar)+'</b><span>'+xEsc(m.es)+'</span></div>'+
      xPills([m.n+' preguntas', m.minutes+' min', m.note]);
    const row = xEl('div','xc-btns');
    const b = xEl('button','xbtn pri','Empezar'); b.onclick=()=>xExamStart(m.k);
    const last = hist.find(h=>h.k===m.k);
    const b2 = xEl('button','xbtn','Último resultado'); b2.disabled=!last;
    b2.onclick=()=>xExamShowLast(m.k);
    row.append(b,b2); c.appendChild(row); grid.appendChild(c);
  });
  p.appendChild(grid);
  if (hist.length){
    const box = xEl('div','xbank');
    box.appendChild(xEl('h3','xsec','Historial'));
    hist.slice(0,10).forEach(h=>{
      const d = xEl('div','xls-row');
      d.innerHTML = '<span class="trk">'+xEsc(h.k)+'</span>'+
        '<span class="ttl"><b>'+h.right+' / '+h.total+' ('+Math.round(h.right/h.total*100)+'%)</b>'+
        '<span>'+new Date(h.at).toLocaleString('es-ES')+' · '+Math.floor(h.secs/60)+' min</span></span>';
      box.appendChild(d);
    });
    p.appendChild(box);
  }
}
/* التوزيع: ٨٠٪ من بنك الوحدة و٢٠٪ استماع، ومفيش سؤالين لنفس مسار الصوت */
function xBuildExam(model, n){
  const only = model && model.unit;
  const units = only ? [only] : Object.keys(XD.quiz);
  const perUnit = Math.floor(n*0.8/units.length);
  let qs = [];
  units.forEach(u=>{ qs = qs.concat(xSample(XD.quiz[u], perUnit).map(q=>({...q, unit:u}))); });
  const need = n - qs.length;
  const pool = only ? XD.listen.bank.filter(q=>q.tunit===only) : XD.listen.bank;
  const src = pool.length>=need*3 ? pool : XD.listen.bank;
  const byTrack = {};
  src.forEach(q=>{ (byTrack[q.trk]=byTrack[q.trk]||[]).push(q); });
  const trackIds = xShuffle(Object.keys(byTrack));
  const lis = [];
  let round = 0;
  while (lis.length < need && round < 8){
    for (const tid of trackIds){
      if (lis.length >= need) break;
      const cand = byTrack[tid].filter(q=>lis.indexOf(q)<0);
      if (!cand.length) continue;
      lis.push(cand[round % cand.length]);
    }
    round++;
  }
  return xShuffle(qs.concat(lis.slice(0,need).map(q=>({...q, type:'mcq', unit:'ls', tag:'Escucha'})))).map(xPrepQ);
}
/* صندوق امتحان الاستماع: مشغّل بدون أي عنوان أو رقم */
function xExamAudioBox(session, idx){
  const box = xEl('div','xexl');
  const cur = session.audio[idx];
  box.appendChild(xEl('div','xexl-h','<b>Comprensión auditiva</b><span>Escucha y elige la opción correcta</span>'));
  const au = xEl('audio','xexl-a');
  au.id = 'xExAudio'; au.preload='metadata'; au.src = 'audio/'+cur.file;
  box.appendChild(au);
  const row = xEl('div','xply-c');
  const play = xEl('button','xplay','▶ Escuchar');
  const rp = xEl('button','xbtn','↻ Otra vez');
  const lb = xEl('button','xbtn','🔊 Ver la letra'); // deshabilitado en examen
  lb.disabled = true; lb.title = 'En el examen no se puede leer la transcripción';
  const spd = xEl('select','xspd');
  ['0.8','1','1.2'].forEach(v=>{ const o=xEl('option',null,v+'×'); o.value=v; if(v==='1')o.selected=true; spd.appendChild(o); });
  play.onclick=()=>{ au.currentTime=0; au.play(); };
  rp.onclick=()=>{ au.currentTime=0; au.play(); };
  spd.onchange=()=>{ au.playbackRate=+spd.value; };
  row.append(play,rp,spd,lb); box.appendChild(row);
  box.appendChild(xEl('div','xhint','Puedes escucharla tantas veces como quieras mientras dure el examen.'));
  session.audio[idx]._au = au;
  return box;
}
async function xExamStart(k){
  const m = XD.exams.models.find(x=>x.k===k);
  const go = await xConfirm('<b>'+xEsc(m.ar)+'</b> · '+m.es+'<br>'+m.n+' preguntas · '+m.minutes+' minutos.<br>El cronómetro empieza ahora y no se puede parar.',
    {title:'¿Empezamos el examen?', icon:'⏱', ok:'Sí, empezar', no:'Ahora no'});
  if (!go) return;
  const qs = xBuildExam(m, m.n);
  EX = {k, qs, i:0, ans:[], t0:Date.now(), left:m.minutes*60, n:m.n, audio:{}};
  EX.ans = new Array(qs.length).fill(null);
  /* كل سؤال استماع ليه صوته الخاص (من غير تكرار نفس المسار) */
  const used = [];
  qs.forEach((q,i)=>{ if (q.tag==='Escucha'){ used.push(q.trk); EX.audio[i]={file:q.file, trk:q.trk}; } });
  xExamRender();
  if (xTimer) clearInterval(xTimer);
  xTimer = setInterval(()=>{
    EX.left--;
    const el = document.getElementById('xClock');
    if (el){ el.textContent = xFmt(EX.left); el.classList.toggle('warn', EX.left<300); }
    if (EX.left<=0){ clearInterval(xTimer); xTimer=null; xExamSubmit(true); }
  }, 1000);
}
function xFmt(s){ s=Math.max(0,s); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); }
function xExamRender(){
  const p = xClear(); if (!EX) return;
  const m = XD.exams.models.find(x=>x.k===EX.k);
  xStopExamAudio();
  const h = xHead(m.ar, m.es, async ()=>{
    const q = await xConfirm('Si sales ahora, el intento se cancela y no se guarda la nota.', {title:'¿Salir del examen?', icon:'⚠', ok:'Salir', no:'Seguir'});
    if (q){ clearInterval(xTimer); xTimer=null; EX=null; xExamHome(xClear()); }
  });
  const clock = xEl('div','xclock'); clock.innerHTML='<span class="lb">Tiempo</span><b id="xClock">'+xFmt(EX.left)+'</b>';
  h.appendChild(clock); p.appendChild(h);
  const answered = EX.ans.filter(a=>a!=null&&a!=='').length;
  const bar = xEl('div','xbar');
  bar.innerHTML='<div class="xbar-in"><i style="width:'+Math.round(answered/EX.qs.length*100)+'%"></i></div><span>'+answered+' / '+EX.qs.length+'</span>';
  p.appendChild(bar);
  const q = EX.qs[EX.i];
  if (q.tag==='Escucha' && EX.audio[EX.i]) p.appendChild(xExamAudioBox(EX, EX.i));
  const card = xEl('div','xq');
  card.appendChild(xEl('div','xq-tag','<span class="tagx">'+xEsc(XU(q.unit).es)+'</span>'+
    (q.tag?'<span class="refx">'+xEsc(q.tag)+'</span>':'')+'<span class="refx">'+(EX.i+1)+'/'+EX.qs.length+'</span>'));
  card.appendChild(xEl('div','xq-q', xKeep(q.q)));
  if (q.type==='mcq'){
    const ul = xEl('div','xopts');
    q.opts.forEach((o,i)=>{
      const b = xEl('button','xopt'+(EX.ans[EX.i]===i?' sel':''),'<span class="k">'+'ABCD'[i]+'</span><span class="t">'+xKeep(o)+'</span>');
      b.onclick=()=>{ EX.ans[EX.i]=i; xExamRender();
        if (EX.i < EX.qs.length-1) setTimeout(()=>{ if (XTAB==='ex' && EX && EX.ans[EX.i]!=null) { EX.i++; xExamRender(); } }, 260); };
      ul.appendChild(b);
    });
    card.appendChild(ul);
  } else {
    const inp = xEl('input','xfill'); inp.type='text'; inp.placeholder='Escribe la respuesta…'; inp.value=EX.ans[EX.i]||'';
    inp.oninput=()=>{ EX.ans[EX.i]=inp.value; };
    card.appendChild(inp);
  }
  p.appendChild(card);
  const nav = xEl('div','xnav');
  const prev=xEl('button','xbtn','← Anterior'); prev.disabled=EX.i===0; prev.onclick=()=>{EX.i--;xExamRender();};
  const next=xEl('button','xbtn','Siguiente →'); next.disabled=EX.i>=EX.qs.length-1; next.onclick=()=>{EX.i++;xExamRender();};
  const sub=xEl('button','xbtn pri','Entregar examen'); sub.onclick=()=>xExamSubmit();
  nav.append(prev,next,sub); p.appendChild(nav);
  const dots = xEl('div','xdots');
  EX.qs.forEach((qq,i)=>{
    const d=xEl('button','xdot'+(i===EX.i?' on':'')+(EX.ans[i]!=null&&EX.ans[i]!==''?' done':''),String(i+1));
    if (qq.tag==='Escucha') d.classList.add('aud');
    d.onclick=()=>{EX.i=i;xExamRender();}; dots.appendChild(d);
  });
  p.appendChild(dots);
  window.scrollTo({top:0,behavior:'auto'});
}
function xStopExamAudio(){ const a = document.getElementById('xExAudio'); if (a){ try{ a.pause(); }catch(e){} } }
async function xExamSubmit(auto){
  if (!EX) return;
  if (!auto){
    const falta = EX.ans.filter(a=>a==null||a==='').length;
    const go = await xConfirm(falta? 'Quedan <b>'+falta+'</b> preguntas sin responder. ¿Entregar de todas formas?' : '¿Entregar el examen y ver la nota?',
      {title:'Entregar el examen', icon:'✔', ok:'Entregar', no:'Seguir', danger: falta>0});
    if (!go) return;
  } else {
    xToast('Se acabó el tiempo: el examen se ha entregado solo');
  }
  clearInterval(xTimer); xTimer=null; xStopExamAudio();
  let right=0; const bySec={};
  EX.qs.forEach((q,i)=>{
    const ok = xGrade(q, EX.ans[i]); if(ok) right++;
    const s = q.tag==='Escucha'?'Comprensión auditiva':'Gramática y vocabulario';
    bySec[s]=bySec[s]||{r:0,n:0}; bySec[s].n++; if(ok) bySec[s].r++;
  });
  const total=EX.qs.length, pct=Math.round(right/total*100), secs=Math.round((Date.now()-EX.t0)/1000);
  const rec = {k:EX.k, right, total, pct, secs, at:Date.now(), bySec,
    detail:EX.qs.map((q,i)=>({q:q.q, ok:xGrade(q,EX.ans[i]), aud:q.tag==='Escucha',
      mine: q.type==='mcq' ? (EX.ans[i]!=null? q.opts[EX.ans[i]] : 'Sin respuesta') : (EX.ans[i]||'Sin respuesta'),
      corr: q.type==='mcq' ? q.opts[q.a] : q.a, ex:q.ex||'', unit:q.unit}))};
  const hist = xStore.get('exhist', []); hist.unshift(rec); xStore.set('exhist', hist.slice(0,20));
  EX = null;
  xExamReport(rec);
}
function xExamShowLast(k){
  const rec = (xStore.get('exhist', [])).find(h=>h.k===k);
  if (rec) xExamReport(rec);
}
function xExamReport(rec){
  const p = xClear();
  const m = XD.exams.models.find(x=>x.k===rec.k) || {ar:'Examen', es:''};
  p.appendChild(xHead(m.ar+' · informe', m.es, xExamHome));
  const pass = rec.pct>=60;
  const res = xEl('div','xres');
  res.innerHTML = '<div class="ring '+(rec.pct>=85?'g4':rec.pct>=70?'g3':rec.pct>=60?'g2':'g1')+'">'+
    '<div class="rv">'+rec.pct+'<small>%</small></div><div class="rl">'+(pass?'Aprobado':'Suspenso')+'</div></div>'+
    '<div class="rstack">'+
      '<div class="rline"><b>'+rec.right+'</b> correctas de <b>'+rec.total+'</b> · '+Math.floor(rec.secs/60)+' min '+('0'+rec.secs%60).slice(-2)+' s</div>'+
      '<div class="rline">'+(pass?'Estás por encima del 60%':'Por debajo del 60%: repasa los errores y repite')+'</div>'+
      '<div class="rtags">'+Object.keys(rec.bySec||{}).map(s=>'<span class="tagx">'+s+': '+rec.bySec[s].r+'/'+rec.bySec[s].n+'</span>').join('')+'</div>'+
    '</div>';
  p.appendChild(res);
  const nav = xEl('div','xnav');
  const b1=xEl('button','xbtn pri','Nuevo intento'); b1.onclick=()=>xExamStart(rec.k);
  const b2=xEl('button','xbtn','Volver a exámenes'); b2.onclick=xExamHome;
  nav.append(b1,b2); p.appendChild(nav);
  const box = xEl('div','xrev');
  box.appendChild(xEl('h3','xsec','Detalle de las preguntas'));
  (rec.detail||[]).forEach((d,i)=>{
    const e = xEl('div','xr'+(d.ok?' ok':' no'));
    e.innerHTML='<div class="xr-h"><span class="num">'+(i+1)+'</span><span class="st">'+(d.ok?'✓':'✗')+'</span>'+
      '<span class="unit">'+xEsc(XU(d.unit).es)+(d.aud?' · audición':'')+'</span></div>'+
      '<div class="xr-q">'+xKeep(d.q)+'</div><div class="xr-a">'+
      '<div><span class="lb">Tu respuesta:</span> <span class="'+(d.ok?'good':'bad')+'">'+xEsc(d.mine)+'</span></div>'+
      (d.ok?'':'<div><span class="lb">Correcta:</span> <span class="good">'+xEsc(d.corr)+'</span></div>')+
      (d.ex?'<div class="ex ar" dir="rtl">'+xAr(d.ex)+'</div>':'')+'</div>';
    box.appendChild(e);
  });
  p.appendChild(box);
}

/* ---------- pestañas nuevas ---------- */
function xBuildTabs(host){
  XTRA_TABS.forEach(tb=>{
    const b = document.createElement('button');
    b.className='tab xtab'; b.dataset.k='x-'+tb.k;
    b.textContent = tb.es;
    b.onclick=()=>xOpen(tb.k);
    host.appendChild(b);
  });
}
function xBindHide(){
  try{
    document.querySelectorAll('#tabs .tab').forEach(b=>{
      const k=b.dataset.k||'';
      if (!k || k.startsWith('x-')) return;
      if (b.dataset.xhide) return;
      b.dataset.xhide='1';
      b.addEventListener('click', xHide);
    });
  }catch(e){}
}
document.addEventListener('keydown', e=>{
  if (!XTAB || !xFlashKeys) return;
  if (document.querySelector('.xmodal.on')) return;
  if (document.activeElement && /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
  if (e.key===' '){ e.preventDefault(); xFlashKeys.flip(); }
  else if (e.key==='ArrowLeft'){ xFlashKeys.yes(); }
  else if (e.key==='ArrowRight'){ xFlashKeys.no(); }
});
if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', xBindHide);
else xBindHide();
