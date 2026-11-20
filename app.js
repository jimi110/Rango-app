/* RANGO · lógica de la app */
(function () {
  'use strict';

  var R = window.RANGO, EX = R.EXERCISES, BYID = R.BYID, TIERS = R.TIERS, TOP = R.TOP;
  var KEY = 'rango.v1', LB = 2.20462, ROM = ['I', 'II', 'III'], MILESTONES = [1, 7, 21, 90];
  var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ================= Estado ================= */
  function defState() {
    return { v: 1, s: { bw: 75, unit: 'kg', sex: 'm', rest: 90, onb: false }, logs: {}, peak: {}, start: null, ups: [] };
  }
  function load() {
    var st = defState();
    try {
      var j = JSON.parse(localStorage.getItem(KEY));
      if (j && j.v === 1) {
        for (var k in j.s) st.s[k] = j.s[k];
        st.logs = j.logs || {}; st.peak = j.peak || {}; st.start = j.start || null; st.ups = j.ups || [];
      }
    } catch (e) {}
    return st;
  }
  var state = load();
  function save() { try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) {} }

  /* ================= Utilidades ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  function clamp(v, a, b) { return Math.min(b, Math.max(a, v)); }
  function toD(kg) { return state.s.unit === 'lb' ? kg * LB : kg; }
  function fromD(v) { return state.s.unit === 'lb' ? v / LB : v; }
  function fmt(x, dec) { return (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toLocaleString('es-ES', { maximumFractionDigits: dec, useGrouping: false }); }
  function fW(kg) { return fmt(toD(kg), 1) + ' ' + state.s.unit; }
  function parseNum(v) { return parseFloat(String(v).replace(',', '.')); }
  function startOfDay(ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); }
  function dateShort(ts) { return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', ''); }
  function dayNum() { return state.start ? Math.round((startOfDay(Date.now()) - startOfDay(state.start)) / 864e5) + 1 : 1; }
  function vibrate(p) { try { if (navigator.vibrate) navigator.vibrate(p); } catch (e) {} }

  /* ================= Rangos ================= */
  function eff(r) { r = clamp(r, 1, 30); return r <= 1 ? 1 : 1 + r / 30; }
  function thr(ex) {
    var f = state.s.sex === 'f' ? ex.fem : 1, a = ex.anchors, t = [];
    for (var i = 0; i < 5; i++) for (var j = 0; j < 3; j++) t.push((a[i] + (a[i + 1] - a[i]) * j / 3) * f);
    return t;
  }
  function score(ex, w, r) {
    var load = ex.bw * state.s.bw + w;
    return load <= 0 ? 0 : load * eff(r) / state.s.bw;
  }
  function lvlName(l) { return TIERS[(l / 3) | 0].n + ' ' + ROM[l % 3]; }
  function tierOf(l) { return l < 0 ? null : TIERS[(l / 3) | 0]; }

  function info(ex) {
    var logs = state.logs[ex.id] || [];
    if (!logs.length) return { has: false, lvl: -1, comp: -1, frac: 0, best: null, n: 0 };
    var best = null, i, s;
    for (i = 0; i < logs.length; i++) {
      s = score(ex, logs[i].w, logs[i].r);
      if (!best || s > best.s) best = { w: logs[i].w, r: logs[i].r, s: s, t: logs[i].t, i: i };
    }
    var t = thr(ex), comp = 0;
    for (i = 0; i < t.length; i++) if (best.s >= t[i]) comp = i;
    var lvl = Math.max(comp, state.peak[ex.id] === undefined ? 0 : state.peak[ex.id]);
    var frac = lvl >= 14 ? 1 : clamp((best.s - t[lvl]) / (t[lvl + 1] - t[lvl]), 0, 1);
    if (best.s < t[0]) frac = clamp(best.s / t[0], 0, 1);
    return { has: true, lvl: lvl, comp: comp, frac: frac, best: best, n: logs.length };
  }

  function setTxt(ex, w, r) {
    if (ex.bw > 0) {
      if (Math.abs(w) < 0.01) return 'Peso corporal × ' + r;
      if (w > 0) return '+' + fW(w) + ' × ' + r;
      return fW(w).replace('-', '−') + ' asist. × ' + r;
    }
    return fW(w) + ' × ' + r;
  }

  function goal(ex, inf) {
    if (!inf.has || inf.lvl >= 14) return null;
    var t = thr(ex), tgt = t[inf.lvl + 1], bw = state.s.bw, b = inf.best, name = lvlName(inf.lvl + 1);
    if (ex.bw > 0 && b.w <= 0.01) {
      var load = ex.bw * bw + b.w, need = 30 * (tgt * bw / load - 1), r2 = Math.ceil(need - 1e-9);
      if (r2 <= b.r) r2 = b.r + 1;
      if (r2 <= 40) return { name: name, txt: r2 + ' repeticiones' + (Math.abs(b.w) < 0.01 ? '' : ' con ' + fW(b.w)) };
    }
    var w = tgt * bw / eff(b.r) - ex.bw * bw;
    var step = state.s.unit === 'lb' ? 5 : ex.step, wd = Math.ceil(toD(w) / step - 1e-9) * step, cur = toD(b.w);
    if (wd <= cur + 1e-6) wd = cur + step;
    return { name: name, txt: setTxt(ex, fromD(wd), b.r) };
  }

  function globalInfo() {
    var sum = 0, n = 0, lv = [];
    EX.forEach(function (ex) { var i = info(ex); if (i.has) { sum += i.lvl; n++; lv.push(i.lvl); } });
    if (!n) return null;
    var avg = sum / n, l = Math.floor(avg + 1e-9);
    return { lvl: l, frac: l >= 14 ? 1 : avg - l, n: n };
  }

  /* ================= Insignias y miniaturas ================= */
  function badge(lvl, size) {
    var T = TIERS[(lvl / 3) | 0], lv = lvl % 3;
    return '<svg class="badge" width="' + size + '" height="' + Math.round(size * 1.15) + '" viewBox="0 0 40 46" aria-hidden="true">' +
      '<path d="M20 1.5 37.5 11.5V33.5L20 44.5 2.5 33.5V11.5Z" fill="' + T.c + '"/>' +
      '<path d="M20 6.2 33.5 14V31L20 39.8 6.5 31V14Z" fill="' + T.d + '"/>' +
      '<text x="20" y="28.2" text-anchor="middle" font-size="14" font-weight="900" fill="' + T.c + '" font-family="system-ui,sans-serif">' + ROM[lv] + '</text></svg>';
  }
  function emptyBadge(size) {
    return '<svg class="badge" width="' + size + '" height="' + Math.round(size * 1.15) + '" viewBox="0 0 40 46" aria-hidden="true">' +
      '<path d="M20 1.5 37.5 11.5V33.5L20 44.5 2.5 33.5V11.5Z" fill="#232a37"/><path d="M20 6.2 33.5 14V31L20 39.8 6.5 31V14Z" fill="#11151c"/>' +
      '<text x="20" y="28.5" text-anchor="middle" font-size="15" font-weight="900" fill="#4b5566" font-family="system-ui,sans-serif">?</text></svg>';
  }
  function thumb(ex, lvl, bsize) {
    var T = tierOf(lvl);
    return '<div class="thumb' + (T ? '' : ' none') + '"' + (T ? ' style="--tc:' + T.c + '"' : '') + '><div class="fig-host" data-fig="' + ex.id + '"></div>' +
      (T ? '<div class="tb">' + badge(lvl, bsize || 30) + '</div>' : '') + '</div>';
  }

  /* ================= Figuras animadas ================= */
  var figs = [], sheetFigs = [], modalFigs = [], io = null;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.target.__fig) e.target.__fig.vis = e.isIntersecting; });
    }, { rootMargin: '60px' });
  }
  function mount(root, list) {
    $$('.fig-host', root).forEach(function (h, i) {
      var f = R.Fig.create(h.getAttribute('data-fig'));
      f.off = (i * 0.45) % 3;
      h.appendChild(f.svg);
      list.push(f);
      R.Fig.draw(f, performance.now() / 1000);
      if (io) { f.vis = false; io.observe(f.svg); }
    });
  }
  function dropFigs(list) {
    list.forEach(function (f) { if (io) io.unobserve(f.svg); });
    list.length = 0;
  }
  var t0 = performance.now();
  function loop(now) {
    if (!document.hidden && !reduce) {
      var t = (now - t0) / 1000, i, all = [figs, sheetFigs, modalFigs];
      for (var k = 0; k < all.length; k++) for (i = 0; i < all[k].length; i++) if (all[k][i].vis) R.Fig.draw(all[k][i], t);
    }
    requestAnimationFrame(loop);
  }

  /* ================= Vistas ================= */
  var views = { home: $('#v-home'), progress: $('#v-progress'), settings: $('#v-settings') };
  var tab = 'home';

  function renderHome() {
    var g = globalInfo(), T = g ? TIERS[(g.lvl / 3) | 0] : null, h = '';
    h += '<header class="top"><div class="logo">RANG<i>O</i></div><div class="day num">Día ' + dayNum() + '</div></header>';
    h += '<section class="hero"' + (T ? ' style="--tc:' + T.c + '"' : '') + '><div class="hero-badge">' + (g ? badge(g.lvl, 70) : emptyBadge(70)) + '</div>' +
      '<div class="hero-main"><div class="eyebrow">Nivel global</div>' +
      '<div class="hero-rank"' + (T ? ' style="color:' + T.c + '"' : ' style="color:var(--mut)"') + '>' + (g ? lvlName(g.lvl) : 'Sin rango') + '</div>';
    if (g) {
      h += '<div class="bar"><i style="width:' + Math.round(g.frac * 100) + '%"></i></div><div class="hero-sub">' +
        (g.lvl >= 14 ? '¡Rango máximo!' : 'Siguiente: ' + lvlName(g.lvl + 1)) + '</div>';
    } else {
      h += '<div class="hero-sub">Registra tu primera serie y consigue tu primer rango.</div>';
    }
    h += '</div></section>';

    // objetivo: el ejercicio más cerca de subir
    var bestEx = null, bestInf = null;
    EX.forEach(function (ex) {
      var i = info(ex);
      if (i.has && i.lvl < 14 && (!bestInf || i.frac > bestInf.frac)) { bestEx = ex; bestInf = i; }
    });
    if (bestEx) {
      var gl = goal(bestEx, bestInf), NT = TIERS[((bestInf.lvl + 1) / 3) | 0];
      h += '<a class="goal" href="#/ex/' + bestEx.id + '"><div class="gt"><div class="eyebrow">Objetivo de hoy</div>' +
        '<div class="g-title">' + bestEx.name + ' → <span style="color:' + NT.c + '">' + lvlName(bestInf.lvl + 1) + '</span></div>' +
        '<div class="g-txt">Consigue ' + gl.txt + '</div></div><span class="chev">›</span></a>';
    } else if (!g) {
      h += '<div class="goal"><div class="gt"><div class="eyebrow">Objetivo de hoy</div><div class="g-title">Consigue tu primer rango</div>' +
        '<div class="g-txt">Elige un ejercicio y apunta tu mejor serie.</div></div></div>';
    }

    var ranked = EX.filter(function (e) { return info(e).has; }).length;
    h += '<h2><span>Ejercicios</span><em class="num">' + ranked + '/' + EX.length + '</em></h2><div class="grid">';
    EX.forEach(function (ex) {
      var i = info(ex), T2 = tierOf(i.lvl);
      h += '<a class="card ex" href="#/ex/' + ex.id + '"' + (T2 ? ' style="--tc:' + T2.c + '"' : '') + '>' + thumb(ex, i.lvl, 28) +
        '<div class="ex-name">' + ex.name + '</div>' +
        '<div class="ex-rank"' + (T2 ? ' style="color:' + T2.c + '"' : ' style="color:var(--mut);font-weight:600"') + '>' + (i.has ? lvlName(i.lvl) : 'Sin rango') + '</div>' +
        '<div class="bar sm"><i style="width:' + (i.has ? Math.round(i.frac * 100) : 0) + '%"></i></div></a>';
    });
    h += '</div>';
    dropFigs(figs);
    views.home.innerHTML = h;
    mount(views.home, figs);
  }

  function weekDots() {
    var days = {}, k;
    for (k in state.logs) state.logs[k].forEach(function (l) { days[startOfDay(l.t)] = 1; });
    var out = [], d, i, cnt = 0, today = startOfDay(Date.now());
    for (i = 6; i >= 0; i--) {
      d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - i);
      var on = !!days[d.getTime()]; if (on) cnt++;
      out.push({ on: on, today: d.getTime() === today, l: ['D', 'L', 'M', 'X', 'J', 'V', 'S'][d.getDay()] });
    }
    return { dots: out, cnt: cnt };
  }

  function renderProgress() {
    var day = dayNum(), g = globalInfo(), h = '', total = 0, k;
    for (k in state.logs) total += state.logs[k].length;
    h += '<header class="top"><div class="logo">RANG<i>O</i></div><div class="day">Tu progreso</div></header>';
    h += '<section class="card p" style="margin-top:0"><div class="eyebrow">Tu camino</div><div class="big-day num">Día ' + day + '</div>';
    var nxt = null; MILESTONES.forEach(function (m) { if (!nxt && m > day) nxt = m; });
    h += '<div class="muted" style="font-size:14px">' + (nxt ? 'Faltan ' + (nxt - day) + (nxt - day === 1 ? ' día' : ' días') + ' para el Día ' + nxt : '¡Llegaste al Día 90! Sigue subiendo.') + '</div>';
    h += '<div class="track">';
    MILESTONES.forEach(function (m, i) {
      var on = day >= m;
      if (i) {
        var prev = MILESTONES[i - 1], pct = clamp((day - prev) / (m - prev), 0, 1) * 100;
        h += '<div class="seg-line"><b style="width:' + pct + '%"></b></div>';
      }
      h += '<div class="node' + (on ? ' on' : '') + '"><i>' + (on ? '✓' : '') + '</i><em>Día ' + m + '</em></div>';
    });
    h += '</div></section>';

    var w = weekDots();
    h += '<h2><span>Esta semana</span><em class="num">' + w.cnt + '/7 días</em></h2><div class="week">';
    w.dots.forEach(function (d) { h += '<div class="wd' + (d.on ? ' on' : '') + (d.today ? ' today' : '') + '"><i></i><em>' + d.l + '</em></div>'; });
    h += '</div>';

    var counts = [0, 0, 0, 0, 0];
    EX.forEach(function (ex) { var i = info(ex); if (i.has) counts[(i.lvl / 3) | 0]++; });
    h += '<h2><span>Escalera de rangos</span><em class="num">' + total + ' series</em></h2><section class="card p ladder" style="margin-top:0;padding-top:8px;padding-bottom:8px">';
    for (var t = 4; t >= 0; t--) {
      h += '<div class="lr"><span class="dot" style="background:' + TIERS[t].c + '"></span><span class="ln"' + (g && ((g.lvl / 3) | 0) === t ? ' style="color:' + TIERS[t].c + '"' : '') + '>' + TIERS[t].n + (g && ((g.lvl / 3) | 0) === t ? ' · tú' : '') + '</span><span class="lc num">' + counts[t] + '</span></div>';
    }
    h += '</section>';

    h += '<h2><span>Últimos ascensos</span></h2><section class="card p ups" style="margin-top:0;padding-top:8px;padding-bottom:8px">';
    if (!state.ups.length) h += '<div class="empty" style="padding:10px 0">Aún no hay ascensos. Tu primera serie te dará tu primer rango.</div>';
    state.ups.slice(-6).reverse().forEach(function (u) {
      var ex = BYID[u.id]; if (!ex) return;
      h += '<div class="ur"><span class="dot" style="width:10px;height:10px;border-radius:50%;background:' + tierOf(u.lvl).c + ';flex:none"></span><b>' + ex.name + ' · <span style="color:' + tierOf(u.lvl).c + ';font-size:inherit">' + lvlName(u.lvl) + '</span></b><span>' + dateShort(u.t) + '</span></div>';
    });
    h += '</section>';
    views.progress.innerHTML = h;
  }

  function stepper(f, val, step, min, max) {
    return '<div class="stp" data-f="' + f + '" data-step="' + step + '" data-min="' + min + '" data-max="' + max + '">' +
      '<button type="button" class="sb" data-d="-1" aria-label="Menos">−</button>' +
      '<input class="sv" type="text" inputmode="decimal" value="' + val + '" aria-label="' + f + '">' +
      '<button type="button" class="sb" data-d="1" aria-label="Más">+</button></div>';
  }
  function seg(setting, opts, cur) {
    return '<div class="segs">' + opts.map(function (o) { return '<button type="button" data-set="' + setting + '" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '">' + o[1] + '</button>'; }).join('') + '</div>';
  }

  function renderSettings() {
    var u = state.s.unit, h = '';
    h += '<header class="top"><div class="logo">RANG<i>O</i></div><div class="day">Ajustes</div></header>';
    h += '<section class="card set">';
    h += '<div class="srow"><div><div class="sl">Peso corporal</div><div class="ss">Los rangos se calculan según tu peso</div></div>' +
      stepper('bw', fmt(toD(state.s.bw), 1), u === 'kg' ? 0.5 : 1, fmt(toD(30), 0), fmt(toD(250), 0)) + '</div>';
    h += '<div class="srow"><div class="sl">Unidades</div>' + seg('unit', [['kg', 'kg'], ['lb', 'lb']], u) + '</div>';
    h += '<div class="srow"><div><div class="sl">Estándares</div><div class="ss">Referencia de fuerza para los rangos</div></div>' + seg('sex', [['m', 'Hombre'], ['f', 'Mujer']], state.s.sex) + '</div>';
    h += '<div class="srow"><div><div class="sl">Descanso</div><div class="ss">Temporizador tras cada serie</div></div>' + seg('rest', [[0, 'No'], [60, '1′'], [90, '1:30'], [120, '2′']], state.s.rest) + '</div>';
    h += '</section>';
    h += '<details class="card info"><summary>¿Cómo se calcula el rango?</summary><div class="body">' +
      '<p>Cada ejercicio tiene su propio rango. Se calcula con tu <b>mejor serie</b>: estimamos tu repetición máxima (peso × repeticiones) y la comparamos con tu peso corporal y con tablas de fuerza habituales.</p>' +
      '<p>Hay 5 rangos (Bronce, Plata, Oro, Esmeralda y Diamante) y 3 niveles en cada uno (I, II y III).</p>' +
      '<p>En dominadas, fondos y flexiones, el lastre es lo que añades a tu peso corporal. Si usas asistencia, ponlo en negativo.</p>' +
      '<p>El «Top %» es una estimación orientativa, no un ranking real. Tu rango nunca baja si cambias de peso: solo sube.</p></div></details>';
    h += '<details class="card info"><summary>Instalar en el móvil</summary><div class="body">' +
      '<p><b>Android (Chrome):</b> menú ⋮ → «Instalar app» o «Añadir a pantalla de inicio».</p>' +
      '<p><b>iPhone (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».</p>' +
      '<p>Después funciona sin conexión y se abre a pantalla completa.</p></div></details>';
    h += '<div class="actions"><button class="btn ghost sm" data-act="export">Exportar copia de seguridad</button>' +
      '<button class="btn ghost sm" data-act="import">Importar copia</button>' +
      '<button class="btn danger sm" data-act="reset">Borrar todos los datos</button></div>' +
      '<input type="file" id="file" accept=".json,application/json" hidden>' +
      '<div class="ver">Rango · tus datos se guardan solo en este dispositivo</div>';
    views.settings.innerHTML = h;
  }

  function setTab(name) {
    tab = name;
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    $$('.tab').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === name); });
    if (name === 'home') renderHome(); else if (name === 'progress') renderProgress(); else renderSettings();
  }

  /* ================= Ficha de ejercicio ================= */
  var sheet = $('#sheet'), ui = null, fromApp = false;

  function sheetHTML() {
    var ex = BYID[ui.id], inf = info(ex), T = tierOf(inf.lvl), g = goal(ex, inf), u = state.s.unit, h = '';
    var tc = T ? T.c : '#8b95a7';
    h += '<div class="sh-scroll"><div class="sh-in" style="--tc:' + tc + '">';
    h += '<div class="sh-top"><button class="icon-btn" data-act="back" aria-label="Volver">‹</button><div class="sh-title">' + ex.name + '</div><span class="tag">' + ex.group + '</span></div>';
    h += '<div class="sh-hero">' + thumb(ex, inf.lvl, 44) + '</div>';
    h += '<div class="rank-line"><div class="rank-name" style="color:' + (T ? T.c : 'var(--mut)') + '">' + (inf.has ? lvlName(inf.lvl) : 'Sin rango') + '</div>' +
      (inf.has ? '<div class="rank-top">TOP ~' + TOP[inf.lvl] + '%</div>' : '<div class="rank-top">Registra una serie para conseguir tu rango</div>') + '</div>';
    if (inf.has) {
      h += '<div class="prog"><div class="bar"><i style="width:' + Math.round(inf.frac * 100) + '%"></i></div><div class="row"><span>' + lvlName(inf.lvl) + '</span><span>' + (inf.lvl >= 14 ? 'Máximo' : lvlName(inf.lvl + 1)) + '</span></div></div>';
    }
    if (g) {
      var NT = tierOf(inf.lvl + 1);
      h += '<div class="card p goalbox"><div class="gi"><div class="eyebrow">Para subir a <span style="color:' + NT.c + '">' + g.name + '</span></div><b>' + g.txt + '</b></div>' + badge(inf.lvl + 1, 34) + '</div>';
    } else if (inf.has) {
      h += '<div class="card p goalbox"><div class="gi"><div class="eyebrow">Rango máximo</div><b>¡Eres Diamante III!</b></div></div>';
    }
    h += '<div class="stats"><div class="stat"><div class="eyebrow">Mejor serie</div><b>' + (inf.has ? setTxt(ex, inf.best.w, inf.best.r).replace('Peso corporal', 'PC') : '—') + '</b></div>' +
      '<div class="stat"><div class="eyebrow">Series</div><b class="num">' + inf.n + '</b></div>' +
      '<div class="stat"><div class="eyebrow">Última vez</div><b>' + (inf.has ? dateShort((state.logs[ex.id][inf.n - 1]).t) : '—') + '</b></div></div>';
    h += '<section class="card p"><div class="eyebrow">Cómo hacerlo</div><ul class="cues">' + ex.cues.map(function (c, i) { return '<li><span>' + (i + 1) + '</span>' + c + '</li>'; }).join('') + '</ul></section>';
    h += '<section class="card p"><div class="eyebrow">Historial</div><div class="hist">';
    if (!inf.has) h += '<div class="empty">Todavía no has registrado ninguna serie.</div>';
    else {
      var logs = state.logs[ex.id], shown = 0;
      for (var i = logs.length - 1; i >= 0 && shown < 6; i--, shown++) {
        h += '<div class="hrow"><span class="hd">' + dateShort(logs[i].t) + '</span><span class="hs">' + setTxt(ex, logs[i].w, logs[i].r) + (i === inf.best.i ? '<span class="pr">MEJOR</span>' : '') + '</span><button class="del" data-del="' + i + '" aria-label="Borrar serie">✕</button></div>';
      }
    }
    h += '</div></section></div></div>';

    // barra de registro
    var minW = ex.bw > 0 ? -Math.floor(toD(ex.bw * state.s.bw) * 0.9) : 0;
    h += '<div class="logbar"><div class="logbar-in"><div class="logrow">' +
      '<div class="fld"><div class="lbl">' + (ex.bw > 0 ? 'Lastre' : 'Peso') + ' (' + u + ')</div>' + stepper('w', fmt(ui.w, 2), u === 'lb' ? 5 : ex.step, minW, 1000) + '</div>' +
      '<div class="fld"><div class="lbl">Repeticiones</div>' + stepper('r', ui.r, 1, 1, 100) + '</div></div>' +
      (ex.bw > 0 ? '<div class="hint">0 = solo tu peso corporal · negativo = asistencia</div>' : '') +
      '<div class="rtline" hidden><span class="rl">Descanso</span><b class="num"></b><button class="x" data-act="rest-stop" aria-label="Cerrar descanso">✕</button></div>' +
      '<button class="btn" data-act="log">Guardar serie</button></div></div>';
    return h;
  }

  function renderSheet() {
    var sc = $('.sh-scroll', sheet), top = sc ? sc.scrollTop : 0;
    dropFigs(sheetFigs);
    sheet.innerHTML = sheetHTML();
    mount(sheet, sheetFigs);
    var n = $('.sh-scroll', sheet); if (n) n.scrollTop = top;
    if (typeof paintRest === 'function') paintRest();
  }

  function openSheet(id) {
    var ex = BYID[id], logs = state.logs[id] || [], last = logs[logs.length - 1];
    if (!ui || ui.id !== id) {
      ui = { id: id, w: toD(last ? last.w : ex.def[0]), r: last ? last.r : ex.def[1] };
      ui.w = state.s.unit === 'lb' ? Math.round(ui.w * 2) / 2 : Math.round(ui.w * 4) / 4;
    }
    renderSheet();
    sheet.setAttribute('aria-hidden', 'false');
    document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('open'); }); });
  }
  function closeSheet() {
    if (!sheet.classList.contains('open')) return;
    sheet.classList.remove('open');
    sheet.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('lock');
    ui = null;
    setTimeout(function () {
      if (!sheet.classList.contains('open')) { dropFigs(sheetFigs); sheet.innerHTML = ''; }
    }, 380);
    if (tab === 'home') renderHome();
  }

  /* ================= Registrar serie ================= */
  function saveSet() {
    var ex = BYID[ui.id], w = Math.round(fromD(ui.w) * 100) / 100, r = Math.round(ui.r);
    if (!(r >= 1) || isNaN(w)) { note('Revisa el peso y las repeticiones'); return; }
    if (ex.bw * state.s.bw + w <= 0) { note('La asistencia no puede superar tu peso corporal'); return; }
    var before = info(ex), s = score(ex, w, r);
    (state.logs[ex.id] = state.logs[ex.id] || []).push({ t: Date.now(), w: w, r: r });
    if (!state.start) state.start = Date.now();
    var after = info(ex);
    if (state.peak[ex.id] === undefined || after.comp > state.peak[ex.id]) state.peak[ex.id] = after.comp;
    after = info(ex);
    var up = after.lvl > before.lvl, pr = !before.best || s > before.best.s + 1e-9;
    if (up) { state.ups.push({ t: Date.now(), id: ex.id, lvl: after.lvl }); if (state.ups.length > 60) state.ups.shift(); }
    save();
    renderSheet();
    startRest();
    if (up) { vibrate([40, 60, 40, 60, 120]); showRankUp(ex, after); }
    else { vibrate(18); note(pr ? '¡Nuevo récord! ' + setTxt(ex, w, r) : 'Serie guardada', true); }
  }

  /* ================= Avisos y descanso ================= */
  var notesEl = $('#top-notes'), restBox = $('#rest-box'), restTimer = null, restEl = null;
  function note(msg, ok) {
    var p = document.createElement('div');
    p.className = 'pill' + (ok ? ' ok' : ''); p.textContent = msg;
    notesEl.appendChild(p);
    setTimeout(function () { p.style.transition = 'opacity .3s'; p.style.opacity = '0'; setTimeout(function () { p.remove(); }, 320); }, 2400);
  }
  var rest = null; // { end, done }
  function paintRest() {
    var line = $('.rtline', sheet), tm = restEl && $('.tm', restEl), txt, ok = false;
    if (!rest) { if (line) line.hidden = true; return; }
    var left = Math.max(0, Math.round((rest.end - Date.now()) / 1000));
    txt = Math.floor(left / 60) + ':' + ('0' + (left % 60)).slice(-2);
    ok = left <= 0;
    if (tm) { tm.textContent = ok ? '' : txt; restEl.firstChild.textContent = ok ? '¡A por la siguiente serie!' : 'Descanso'; restEl.className = 'pill' + (ok ? ' ok' : ''); }
    if (line) {
      line.hidden = false; line.className = 'rtline' + (ok ? ' ok' : '');
      $('.rl', line).textContent = ok ? '¡A por la siguiente serie!' : 'Descanso';
      $('b', line).textContent = ok ? '' : txt;
    }
  }
  function stopRest() {
    if (restTimer) clearInterval(restTimer); restTimer = null;
    rest = null;
    if (restEl) { restEl.remove(); restEl = null; }
    paintRest();
  }
  function startRest() {
    stopRest();
    var total = state.s.rest; if (!total) return;
    rest = { end: Date.now() + total * 1000 };
    restEl = document.createElement('div'); restEl.className = 'pill';
    restEl.innerHTML = '<span>Descanso</span><span class="tm num"></span><button class="x" data-act="rest-stop" aria-label="Cerrar">✕</button>';
    restBox.appendChild(restEl);
    paintRest();
    restTimer = setInterval(function () {
      paintRest();
      if (rest && rest.end - Date.now() <= 0 && !rest.done) {
        rest.done = true; vibrate([200, 100, 200]);
        setTimeout(function () { if (rest && rest.done) stopRest(); }, 4000);
        clearInterval(restTimer); restTimer = null;
      }
    }, 250);
  }

  /* ================= Pantalla de ascenso ================= */
  var modal = $('#modal');
  function showRankUp(ex, inf) {
    var T = tierOf(inf.lvl), conf = '', i, cols = [T.c, '#ffffff', '#ef4444', T.c];
    for (i = 0; i < 44; i++) {
      conf += '<s style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % 4] + ';animation-duration:' + (2.6 + Math.random() * 2.4).toFixed(2) + 's;animation-delay:' + (Math.random() * 1.4).toFixed(2) + 's;transform:rotate(' + Math.round(Math.random() * 180) + 'deg)"></s>';
    }
    modal.className = 'modal';
    modal.style.setProperty('--tc', T.c);
    modal.innerHTML = '<div class="ru-glow"></div><div class="conf">' + conf + '</div>' +
      '<div class="ru-ring">' + thumb(ex, inf.lvl, 54) + '</div>' +
      '<div class="ru-eyebrow">» RANGO ASCENDIDO</div>' +
      '<div class="ru-name">' + lvlName(inf.lvl) + '</div>' +
      '<div class="ru-top">TOP ~' + TOP[inf.lvl] + '%</div>' +
      '<div class="ru-best"><span class="eyebrow">' + ex.name + ' · Mejor serie</span><b>' + setTxt(ex, inf.best.w, inf.best.r) + '</b></div>' +
      '<button class="btn ru-btn" data-act="ru-close">Continuar</button>';
    modal.hidden = false;
    dropFigs(modalFigs); mount(modal, modalFigs);
    setTimeout(function () { var b = $('.ru-btn', modal); if (b) b.focus({ preventScroll: true }); }, 900);
  }
  function closeModal() {
    modal.hidden = true; modal.innerHTML = ''; dropFigs(modalFigs);
    if (tab === 'home' && !sheet.classList.contains('open')) renderHome();
  }

  function showOnboard() {
    modal.className = 'modal plain';
    modal.style.removeProperty('--tc');
    var u = state.s.unit;
    modal.innerHTML = '<div class="mbox"><h3>Sube de rango</h3><p>Convierte cada ejercicio en un juego.</p>' +
      '<ul class="steps"><li><b>1</b>Registra tu mejor serie</li><li><b>2</b>Consigue tu rango: de Bronce a Diamante</li><li><b>3</b>Supera el objetivo y sube de nivel</li></ul>' +
      '<div class="fld" style="margin-bottom:14px"><div class="lbl">Tu peso corporal (' + u + ')</div>' + stepper('bw', fmt(toD(state.s.bw), 1), u === 'kg' ? 0.5 : 1, fmt(toD(30), 0), fmt(toD(250), 0)) + '</div>' +
      '<div class="fld" style="margin-bottom:20px"><div class="lbl">Estándares de fuerza</div>' + seg('sex', [['m', 'Hombre'], ['f', 'Mujer']], state.s.sex).replace('class="segs"', 'class="segs" style="display:flex"') + '</div>' +
      '<button class="btn" data-act="onb-done">Empezar</button></div>';
    modal.hidden = false;
  }

  /* ================= Datos ================= */
  function exportData() {
    var blob = new Blob([JSON.stringify(state, null, 1)], { type: 'application/json' });
    var a = document.createElement('a'), d = new Date();
    a.href = URL.createObjectURL(blob);
    a.download = 'rango-copia-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    document.body.appendChild(a); a.click();
    setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    note('Copia exportada', true);
  }
  function importData(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var j = JSON.parse(fr.result), st = defState();
        if (!j || j.v !== 1 || typeof j.logs !== 'object') throw new Error('formato');
        for (var k in j.s) if (k in st.s) st.s[k] = j.s[k];
        st.s.bw = clamp(+st.s.bw || 75, 30, 250);
        Object.keys(j.logs).forEach(function (id) {
          if (!BYID[id] || !Array.isArray(j.logs[id])) return;
          st.logs[id] = j.logs[id].filter(function (l) { return l && isFinite(l.w) && isFinite(l.r) && isFinite(l.t) && l.r >= 1; })
            .map(function (l) { return { t: +l.t, w: +l.w, r: Math.round(+l.r) }; });
          if (!st.logs[id].length) delete st.logs[id];
        });
        Object.keys(j.peak || {}).forEach(function (id) { if (BYID[id] && st.logs[id] && isFinite(j.peak[id])) st.peak[id] = clamp(Math.round(j.peak[id]), 0, 14); });
        st.start = isFinite(j.start) ? +j.start : null;
        st.ups = (Array.isArray(j.ups) ? j.ups : []).filter(function (u) { return u && BYID[u.id] && isFinite(u.lvl) && isFinite(u.t); });
        if (!confirm('¿Reemplazar tus datos actuales por la copia?')) return;
        state = st; save(); setTab('settings'); note('Copia importada', true);
      } catch (e) { note('Ese archivo no es una copia válida'); }
    };
    fr.readAsText(file);
  }

  /* ================= Eventos ================= */
  function applyField(f, v) {
    if (f === 'w' && ui) ui.w = v;
    else if (f === 'r' && ui) ui.r = v;
    else if (f === 'bw') { state.s.bw = Math.round(fromD(v) * 10) / 10; save(); }
  }
  function stepTo(stp, v) {
    var step = +stp.getAttribute('data-step'), min = +stp.getAttribute('data-min'), max = +stp.getAttribute('data-max'), f = stp.getAttribute('data-f');
    v = clamp(Math.round(v * 100) / 100, min, max);
    $('.sv', stp).value = fmt(v, 2);
    applyField(f, v);
    return step;
  }
  function stepBy(stp, dir) {
    var inp = $('.sv', stp), v = parseNum(inp.value), step = +stp.getAttribute('data-step');
    if (isNaN(v)) v = 0;
    stepTo(stp, v + dir * step);
  }
  var holdT = null, holdI = null;
  function stopHold() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }

  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.sb');
    if (!b) return;
    e.preventDefault();
    var stp = b.closest('.stp'), dir = +b.getAttribute('data-d');
    stopHold(); stepBy(stp, dir);
    holdT = setTimeout(function () { holdI = setInterval(function () { stepBy(stp, dir); }, 80); }, 420);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'contextmenu'].forEach(function (ev) { document.addEventListener(ev, stopHold, true); });

  document.addEventListener('change', function (e) {
    var inp = e.target;
    if (inp.classList && inp.classList.contains('sv')) {
      var stp = inp.closest('.stp'), v = parseNum(inp.value);
      if (isNaN(v)) { var f = stp.getAttribute('data-f'); v = f === 'w' && ui ? ui.w : f === 'r' && ui ? ui.r : toD(state.s.bw); }
      if (stp.getAttribute('data-f') === 'r') v = Math.round(v);
      stepTo(stp, v);
    } else if (inp.id === 'file' && inp.files && inp.files[0]) { importData(inp.files[0]); inp.value = ''; }
  });
  document.addEventListener('focusin', function (e) { if (e.target.classList && e.target.classList.contains('sv')) setTimeout(function () { try { e.target.select(); } catch (x) {} }, 0); });

  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = t.closest('[data-set]'))) {
      var k = el.getAttribute('data-set'), v = el.getAttribute('data-v');
      if (k === 'unit' || k === 'sex') state.s[k] = v; else state.s[k] = +v;
      save();
      if (!modal.hidden && modal.classList.contains('plain')) showOnboard(); else renderSettings();
      return;
    }
    if ((el = t.closest('[data-del]'))) {
      var ex = BYID[ui.id], idx = +el.getAttribute('data-del');
      if (confirm('¿Borrar esta serie?')) {
        state.logs[ex.id].splice(idx, 1);
        if (!state.logs[ex.id].length) { delete state.logs[ex.id]; delete state.peak[ex.id]; if (!Object.keys(state.logs).length) state.start = null; }
        else { var i2 = info(ex); state.peak[ex.id] = i2.comp; }
        save(); renderSheet();
      }
      return;
    }
    if (!(el = t.closest('[data-act]'))) return;
    var act = el.getAttribute('data-act');
    if (act === 'back') { if (fromApp) history.back(); else location.hash = '/'; }
    else if (act === 'log') saveSet();
    else if (act === 'ru-close') closeModal();
    else if (act === 'rest-stop') stopRest();
    else if (act === 'onb-done') { state.s.onb = true; save(); closeModal(); renderHome(); }
    else if (act === 'export') exportData();
    else if (act === 'import') $('#file').click();
    else if (act === 'reset') {
      if (confirm('Se borrarán todas tus series y rangos de este dispositivo. ¿Continuar?')) {
        state = defState(); save(); stopRest(); setTab('settings'); showOnboard();
      }
    }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') { if (!modal.hidden && !modal.classList.contains('plain')) closeModal(); else if (sheet.classList.contains('open')) { if (fromApp) history.back(); else location.hash = '/'; } }
    if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sv')) e.target.blur();
  });

  /* ================= Navegación ================= */
  function route() {
    var h = location.hash.replace(/^#/, '') || '/', m = h.match(/^\/ex\/([a-z]+)$/);
    if (m && BYID[m[1]]) {
      if (!sheet.classList.contains('open')) { if (views.home.hidden || !views.home.innerHTML) setTab('home'); }
      openSheet(m[1]);
    } else {
      closeSheet(); fromApp = false;
      setTab(h === '/progress' ? 'progress' : h === '/settings' ? 'settings' : 'home');
    }
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/ex/"]');
    if (a) fromApp = true;
  }, true);

  /* ================= Inicio ================= */
  route();
  if (!state.s.onb) showOnboard();
  requestAnimationFrame(loop);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})();
