/* RANGO · pantallas, ajustes, herramientas y navegación */
(function (R) {
  'use strict';
  var C = R.core, W = R.workout, EX = R.EXERCISES, BYID = R.BYID, TIERS = R.TIERS, TOP = R.TOP, GROUPS = R.GROUPS, EQUIP = R.EQUIP, FOCUS = R.FOCUS;
  var $ = C.$, $$ = C.$$, MILESTONES = [1, 7, 21, 90];
  var views = { today: $('#v-today'), library: $('#v-library'), progress: $('#v-progress'), settings: $('#v-settings') };
  var tab = 'today', rendered = false, sheet = $('#sheet'), ui = null, fromApp = false;
  function big(n) { return Math.round(n).toLocaleString('es-ES'); }
  function eqName(id) { return EQUIP.filter(function (q) { return q.id === id; })[0].n; }
  function header(right) { return '<header class="top"><div class="logo">RANG<i>O</i></div><div class="day">' + right + '</div></header>'; }

  /* ================= HOY ================= */
  function exCard(ex) {
    var i = C.info(ex), T = C.tierOf(i.lvl);
    return '<a class="card ex" href="#/ex/' + ex.id + '"' + (T ? ' style="--tc:' + T.c + '"' : '') + '>' + (C.isFav(ex.id) ? '<span class="fv" aria-label="Favorito">★</span>' : '') + C.thumb(ex, i.lvl, 28) + '<div class="ex-name">' + ex.name + '</div>' +
      '<div class="ex-rank"' + (T ? ' style="color:' + T.c + '"' : ' style="color:var(--mut);font-weight:600"') + '>' + (i.has ? C.lvlName(i.lvl) : 'Sin rango') + '</div>' +
      '<div class="bar sm"><i style="width:' + (i.has ? Math.round(i.frac * 100) : 0) + '%"></i></div></a>';
  }
  function renderToday() {
    var g = C.globalInfo(), T = g ? TIERS[(g.lvl / 3) | 0] : null, st = C.stats(), h = header('Día ' + C.dayNum());
    h += W.todayHTML();
    var goal = C.st.s.goal, wk = st.weekDays;
    h += '<div class="strip"><div><span class="eyebrow">Racha</span><b class="num">' + st.streak + (st.streak === 1 ? ' día' : ' días') + '</b></div>' +
      '<div><span class="eyebrow">Semana</span><b class="num">' + wk + '/' + goal + '</b></div><div><span class="eyebrow">Entrenos</span><b class="num">' + st.workouts + '</b></div></div>';
    h += '<section class="hero"' + (T ? ' style="--tc:' + T.c + '"' : '') + '><div class="hero-badge">' + (g ? C.badge(g.lvl, 64) : C.emptyBadge(64)) + '</div><div class="hero-main"><div class="eyebrow">Nivel global</div>' +
      '<div class="hero-rank"' + (T ? ' style="color:' + T.c + '"' : ' style="color:var(--mut)"') + '>' + (g ? C.lvlName(g.lvl) : 'Sin rango') + '</div>';
    h += g ? '<div class="bar"><i style="width:' + Math.round(g.frac * 100) + '%"></i></div><div class="hero-sub">' + (g.lvl >= 14 ? '¡Rango máximo!' : 'Siguiente: ' + C.lvlName(g.lvl + 1)) + '</div>'
      : '<div class="hero-sub">Registra tu primera serie y consigue tu primer rango.</div>';
    h += '</div></section>';
    var bestEx = null, bestInf = null;
    EX.forEach(function (ex) { var i = C.info(ex); if (i.has && i.lvl < 14 && (!bestInf || i.frac > bestInf.frac)) { bestEx = ex; bestInf = i; } });
    if (bestEx) {
      var gl = C.goal(bestEx, bestInf), NT = TIERS[((bestInf.lvl + 1) / 3) | 0];
      h += '<a class="goal" href="#/ex/' + bestEx.id + '"><div class="gt"><div class="eyebrow">Más cerca de subir</div><div class="g-title">' + bestEx.name + ' → <span style="color:' + NT.c + '">' + C.lvlName(bestInf.lvl + 1) + '</span></div>' +
        '<div class="g-txt">Consigue ' + gl.txt + '</div></div><span class="chev">›</span></a>';
    }
    var recent = C.st.sessions.slice(-3).reverse();
    if (recent.length) {
      h += '<h2><span>Últimos entrenos</span><a href="#/progress" class="lnk">Ver todo</a></h2><div class="card p" style="margin-top:0;padding-top:6px;padding-bottom:6px">';
      recent.forEach(function (s) {
        h += '<div class="sumrow"><b>' + FOCUS[s.focus].n + '</b><span class="muted">' + C.dateShort(s.t1) + ' · ' + Math.max(1, Math.round((s.t1 - s.t0) / 60000)) + ' min · ' + s.sets + ' series</span></div>';
      });
      h += '</div>';
    }
    views.today.innerHTML = h;
  }

  /* ================= EJERCICIOS (biblioteca) ================= */
  var lib = { q: '', g: 'todos', e: 'todos' };
  function norm(s) { return s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, ''); }
  function fillLib() {
    var q = norm(lib.q.trim()), list = EX.filter(function (e) {
      return (lib.g === 'todos' || (lib.g === 'fav' ? C.isFav(e.id) : C.groupOf(e.m) === lib.g)) && (lib.e === 'todos' || e.eq === lib.e) && (!q || norm(e.name).indexOf(q) >= 0);
    });
    C.dropFigs('lib');
    var box = $('#lib-grid');
    box.innerHTML = list.length ? list.map(exCard).join('') : '<div class="empty" style="grid-column:1/3;padding:24px 0;text-align:center">' + (lib.g === 'fav' ? 'Aún no tienes favoritos. Toca la estrella ☆ dentro de un ejercicio.' : 'No hay ejercicios con ese filtro.') + '</div>';
    $('#lib-count').textContent = list.length + ' de ' + EX.length;
    C.mount(box, 'lib');
  }
  function renderLibrary() {
    var h = header(EX.length + ' ejercicios');
    h += '<input id="lib-q" class="search" type="search" placeholder="Buscar ejercicio" value="' + lib.q.replace(/"/g, '') + '" autocomplete="off">';
    h += '<div class="chips sm scroll">' + [['todos', 'Todos'], ['fav', '★ Favoritos']].concat(GROUPS.map(function (g) { return [g.id, g.n]; })).map(function (g) { return '<button class="chip' + (lib.g === g[0] ? ' on' : '') + '" data-lg="' + g[0] + '">' + g[1] + '</button>'; }).join('') + '</div>';
    h += '<div class="chips sm scroll">' + [['todos', 'Todo el equipo']].concat(EQUIP.map(function (q) { return [q.id, q.n]; })).map(function (g) { return '<button class="chip' + (lib.e === g[0] ? ' on' : '') + '" data-le="' + g[0] + '">' + g[1] + '</button>'; }).join('') + '</div>';
    h += '<h2><span>Catálogo</span><em id="lib-count" class="num"></em></h2><div class="grid" id="lib-grid"></div>';
    views.library.innerHTML = h; fillLib();
  }

  /* ================= PROGRESO ================= */
  function setsByDay() {
    var m = {}; EX.forEach(function (e) { (C.st.logs[e.id] || []).forEach(function (l) { var k = C.sod(l.t); m[k] = (m[k] || 0) + 1; }); }); return m;
  }
  function bwChart() {
    var a = C.st.bwh.slice(-24);
    if (a.length < 2) return '<div class="empty">Registra tu peso en distintos días para ver la gráfica.</div>';
    var min = Math.min.apply(null, a.map(function (x) { return x.kg; })), max = Math.max.apply(null, a.map(function (x) { return x.kg; }));
    if (max - min < 1) { max += 0.5; min -= 0.5; }
    var W_ = 300, H_ = 90, pts = a.map(function (x, i) { return [10 + i * (W_ - 20) / (a.length - 1), 10 + (1 - (x.kg - min) / (max - min)) * (H_ - 24)]; });
    var d = pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('');
    return '<svg viewBox="0 0 300 90" class="chart" preserveAspectRatio="none"><path d="' + d + '" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 4 : 2.4) + '" fill="#fff"/>'; }).join('') + '</svg>' +
      '<div class="chart-l"><span>' + C.fW(a[0].kg) + '</span><span>' + C.fW(a[a.length - 1].kg) + '</span></div>';
  }
  function renderProgress() {
    var day = C.dayNum(), g = C.globalInfo(), st = C.stats(), h = header('Tu progreso'), k;
    h += '<section class="card p" style="margin-top:0"><div class="eyebrow">Tu camino</div><div class="big-day num">Día ' + day + '</div>';
    var nxt = null; MILESTONES.forEach(function (m) { if (!nxt && m > day) nxt = m; });
    h += '<div class="muted" style="font-size:14px">' + (nxt ? 'Faltan ' + (nxt - day) + (nxt - day === 1 ? ' día' : ' días') + ' para el Día ' + nxt : '¡Llegaste al Día 90! Sigue subiendo.') + '</div><div class="track">';
    MILESTONES.forEach(function (m, i) {
      var on = day >= m;
      if (i) { var prev = MILESTONES[i - 1]; h += '<div class="seg-line"><b style="width:' + C.clamp((day - prev) / (m - prev), 0, 1) * 100 + '%"></b></div>'; }
      h += '<div class="node' + (on ? ' on' : '') + '"><i>' + (on ? '✓' : '') + '</i><em>Día ' + m + '</em></div>';
    });
    h += '</div></section>';
    h += '<div class="sumg"><div><span class="eyebrow">Entrenos</span><b class="num">' + st.workouts + '</b></div><div><span class="eyebrow">Series</span><b class="num">' + big(st.sets) + '</b></div>' +
      '<div><span class="eyebrow">Volumen</span><b class="num">' + big(C.toD(st.vol)) + ' ' + C.st.s.unit + '</b></div><div><span class="eyebrow">Mejor racha</span><b class="num">' + C.bestStreak() + ' d</b></div></div>';

    // semana
    var days = C.dayMap(), cells = '', i, d, ws = C.weekStart();
    for (i = 0; i < 7; i++) {
      d = new Date(ws); d.setDate(d.getDate() + i);
      var on = !!days[d.getTime()], today = d.getTime() === C.sod(Date.now());
      cells += '<div class="wd' + (on ? ' on' : '') + (today ? ' now' : '') + '"><i></i><em>' + ['L', 'M', 'X', 'J', 'V', 'S', 'D'][i] + '</em></div>';
    }
    h += '<h2><span>Esta semana</span><em class="num">' + st.weekDays + '/' + C.st.s.goal + ' días</em></h2><div class="week">' + cells + '</div>';

    // calendario 5 semanas
    var sbd = setsByDay(), cal = '', w0 = new Date(ws); w0.setDate(w0.getDate() - 28);
    for (i = 0; i < 35; i++) {
      d = new Date(w0); d.setDate(d.getDate() + i);
      var n = sbd[d.getTime()] || 0, lv = n ? (n < 6 ? 1 : n < 13 ? 2 : 3) : 0, fut = d.getTime() > C.sod(Date.now());
      cal += '<i class="hm l' + lv + (fut ? ' f' : '') + '" title="' + C.dateShort(d.getTime()) + '"></i>';
    }
    h += '<h2><span>Calendario</span><em>5 semanas</em></h2><section class="card p" style="margin-top:0"><div class="heat">' + cal + '</div></section>';

    // equilibrio
    h += '<h2><span>Equilibrio muscular</span></h2><section class="card p bal" style="margin-top:0">';
    GROUPS.forEach(function (gr) {
      var s = 0, n = 0; EX.forEach(function (e) { if (C.groupOf(e.m) === gr.id) { var inf = C.info(e); if (inf.has) { s += inf.lvl; n++; } } });
      var avg = n ? Math.round(s / n) : -1, T = C.tierOf(avg);
      h += '<div class="brow"><span>' + gr.n + '</span><div class="bar"' + (T ? ' style="--tc:' + T.c + '"' : '') + '><i style="width:' + (n ? (avg + 1) / 15 * 100 : 0) + '%"></i></div><b' + (T ? ' style="color:' + T.c + '"' : '') + '>' + (n ? C.lvlName(avg) : '—') + '</b></div>';
    });
    h += '</section>';

    // peso corporal
    h += '<h2><span>Peso corporal</span><button class="lnk" data-act="bw-log">Registrar</button></h2><section class="card p" style="margin-top:0">' + bwChart() + '</section>';

    // logros
    var got = Object.keys(C.st.ach).length;
    h += '<h2><span>Logros</span><em class="num">' + got + '/' + C.ACH.length + '</em></h2><div class="achs">';
    C.ACH.forEach(function (a) { var on = !!C.st.ach[a.id]; h += '<div class="ach' + (on ? ' on' : '') + '"><span class="medal">' + (on ? '★' : '🔒') + '</span><b>' + a.n + '</b><small>' + a.d + '</small></div>'; });
    h += '</div>';

    // escalera
    var counts = [0, 0, 0, 0, 0]; EX.forEach(function (ex) { var inf = C.info(ex); if (inf.has) counts[(inf.lvl / 3) | 0]++; });
    h += '<h2><span>Escalera de rangos</span></h2><section class="card p ladder" style="margin-top:0;padding-top:8px;padding-bottom:8px">';
    for (var t = 4; t >= 0; t--) {
      var me = g && ((g.lvl / 3) | 0) === t;
      h += '<div class="lr"><span class="dot" style="background:' + TIERS[t].c + '"></span><span class="ln"' + (me ? ' style="color:' + TIERS[t].c + '"' : '') + '>' + TIERS[t].n + (me ? ' · tú' : '') + '</span><span class="lc num">' + counts[t] + '</span></div>';
    }
    h += '</section><h2><span>Últimos ascensos</span></h2><section class="card p ups" style="margin-top:0;padding-top:8px;padding-bottom:8px">';
    if (!C.st.ups.length) h += '<div class="empty" style="padding:10px 0">Aún no hay ascensos. Tu primera serie te dará tu primer rango.</div>';
    C.st.ups.slice(-6).reverse().forEach(function (u) {
      var ex = BYID[u.id]; if (!ex) return;
      h += '<div class="ur"><span class="dot" style="width:10px;height:10px;border-radius:50%;background:' + C.tierOf(u.lvl).c + ';flex:none"></span><b>' + ex.name + ' · <span style="color:' + C.tierOf(u.lvl).c + ';font-size:inherit">' + C.lvlName(u.lvl) + '</span></b><span>' + C.dateShort(u.t) + '</span></div>';
    });
    h += '</section>';

    // historial de entrenos
    h += '<h2><span>Entrenamientos</span><em class="num">' + C.st.sessions.length + '</em></h2><section class="card p" style="margin-top:0;padding-top:6px;padding-bottom:6px">';
    if (!C.st.sessions.length) h += '<div class="empty" style="padding:10px 0">Cuando termines un entrenamiento guiado aparecerá aquí.</div>';
    C.st.sessions.slice(-8).reverse().forEach(function (s) {
      h += '<div class="sumrow"><b>' + FOCUS[s.focus].n + '</b><span class="muted">' + C.dateShort(s.t1) + ' · ' + Math.max(1, Math.round((s.t1 - s.t0) / 60000)) + ' min · ' + s.sets + ' series · ' + big(C.toD(s.vol)) + ' ' + C.st.s.unit + '</span></div>';
    });
    views.progress.innerHTML = h + '</section>';
  }

  /* ================= AJUSTES ================= */
  function renderSettings() {
    var s = C.st.s, u = s.unit, h = header('Ajustes'), yn = [[1, 'Sí'], [0, 'No']];
    h += '<div class="eyebrow sec">Perfil</div><section class="card set">' +
      '<div class="srow"><div><div class="sl">Peso corporal</div><div class="ss">Los rangos se calculan según tu peso</div></div>' + C.stepper('bw', C.fmt(C.toD(s.bw), 1), u === 'kg' ? 0.5 : 1, C.fmt(C.toD(30), 0), C.fmt(C.toD(250), 0)) + '</div>' +
      '<div class="srow"><div class="sl">Unidades</div>' + C.seg('unit', [['kg', 'kg'], ['lb', 'lb']], u) + '</div>' +
      '<div class="srow"><div><div class="sl">Estándares</div><div class="ss">Referencia de fuerza para los rangos</div></div>' + C.seg('sex', [['m', 'Hombre'], ['f', 'Mujer']], s.sex) + '</div></section>';
    h += '<div class="eyebrow sec">Entrenamiento</div><section class="card set">' +
      '<div class="srow col"><div><div class="sl">Duración habitual</div><div class="ss">Se puede cambiar en cada entreno</div></div>' + C.seg('dur', [[30, '30′'], [45, '45′'], [60, '1 h'], [75, '1h15'], [90, '1h30'], [120, '2 h']], s.dur) + '</div>' +
      '<div class="srow col"><div><div class="sl">Días por semana</div><div class="ss">Tu objetivo semanal</div></div>' + C.seg('goal', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6'], [7, '7']], s.goal) + '</div>' +
      '<div class="srow col"><div><div class="sl">Descanso entre series</div><div class="ss">Temporizador automático</div></div>' + C.seg('rest', [[0, 'No'], [45, '45″'], [60, '1′'], [90, '1:30'], [120, '2′'], [180, '3′']], s.rest) + '</div>' +
      '<div class="srow"><div><div class="sl">Descanso inteligente</div><div class="ss">2 min en básicos y 1 min en aislamiento</div></div>' + C.seg('autorest', yn, s.autorest ? 1 : 0) + '</div>' +
      '<div class="srow"><div><div class="sl">Series de calentamiento</div><div class="ss">En los ejercicios básicos con peso</div></div>' + C.seg('warm', yn, s.warm ? 1 : 0) + '</div></section>';
    h += '<div class="eyebrow sec">Plan semanal</div><section class="card set"><div class="srow col"><div><div class="sl">Programa</div><div class="ss">' + R.PROGRAMS[s.program].d + '</div></div><div class="chips">' +
      Object.keys(R.PROGRAMS).map(function (k) { return '<button class="chip' + (s.program === k ? ' on' : '') + '" data-set="program" data-v="' + k + '">' + R.PROGRAMS[k].n + '</button>'; }).join('') + '</div></div></section>';
    h += '<div class="eyebrow sec">Equipo disponible</div><section class="card set"><div class="srow col"><div><div class="sl">¿Dónde entrenas?</div><div class="ss">Los entrenos solo usarán ejercicios con este equipo</div></div>' +
      C.seg('place', [['gym', 'Gimnasio'], ['home', 'Casa'], ['body', 'Sin material']], placeOf()) + '<div class="chips sm" style="margin-top:12px">' +
      R.EQUIP.map(function (q) { return '<button class="chip' + (s.equip[q.id] ? ' on' : '') + '" data-eq="' + q.id + '" aria-pressed="' + !!s.equip[q.id] + '">' + q.n + '</button>'; }).join('') + '</div></div></section>';
    h += '<div class="eyebrow sec">Sonido y pantalla</div><section class="card set">' +
      '<div class="srow"><div><div class="sl">Sonidos</div><div class="ss">Series, descansos y rangos</div></div>' + C.seg('sound', yn, s.sound ? 1 : 0) + '</div>' +
      '<div class="srow"><div><div class="sl">Vibración</div></div>' + C.seg('vib', yn, s.vib ? 1 : 0) + '</div>' +
      '<div class="srow"><div><div class="sl">Pantalla encendida</div><div class="ss">Durante el entrenamiento</div></div>' + C.seg('wake', yn, s.wake ? 1 : 0) + '</div></section>';
    h += '<div class="eyebrow sec">Herramientas</div><div class="actions" style="margin-top:0"><button class="btn ghost sm" data-act="tool-plate">Calculadora de discos</button><button class="btn ghost sm" data-act="tool-orm">Calculadora de 1RM</button></div>';
    h += '<div class="eyebrow sec">Ayuda</div><div class="actions" style="margin-top:0"><button class="btn ghost sm" data-act="tour-open">Ver guía de uso</button></div>';
    h += R.FAQ.map(function (q) { return '<details class="card info"><summary>' + q[0] + '</summary><div class="body"><p>' + q[1] + '</p></div></details>'; }).join('');
    h += '<details class="card info"><summary>Instalar en el móvil</summary><div class="body"><p><b>Android (Chrome):</b> menú ⋮ → «Instalar app» o «Añadir a pantalla de inicio».</p><p><b>iPhone (Safari):</b> botón Compartir → «Añadir a pantalla de inicio».</p><p>Después funciona sin conexión y se abre a pantalla completa.</p></div></details>';
    h += '<div class="eyebrow sec">Datos</div><div class="actions" style="margin-top:0">' + (installEvt ? '<button class="btn sm" data-act="install">Instalar la app</button>' : '') + '<button class="btn ghost sm" data-act="export">Exportar copia de seguridad</button><button class="btn ghost sm" data-act="csv">Exportar historial (CSV)</button><button class="btn ghost sm" data-act="import">Importar copia</button><button class="btn danger sm" data-act="reset">Borrar todos los datos</button></div>' +
      '<input type="file" id="file" accept=".json,application/json" hidden><div class="ver">Rango · tus datos se guardan solo en este dispositivo</div>';
    views.settings.innerHTML = h;
  }
  var installEvt = null;
  function placeOf() {
    var e = C.st.s.equip, all = R.EQUIP.every(function (q) { return e[q.id]; });
    if (all) return 'gym';
    if (e.mancuernas && e.cuerpo && !e.barra && !e.maquina && !e.polea) return 'home';
    if (e.cuerpo && !e.barra && !e.mancuernas && !e.maquina && !e.polea) return 'body';
    return 'custom';
  }
  function resetPlan() { C.st.plan = { focus: null, dur: null, list: null, day: 0 }; }
  function setBW(kg) {
    kg = Math.round(kg * 10) / 10; C.st.s.bw = kg;
    var today = C.sod(Date.now()), last = C.st.bwh[C.st.bwh.length - 1];
    if (last && C.sod(last.t) === today) { last.kg = kg; last.t = Date.now(); } else C.st.bwh.push({ t: Date.now(), kg: kg });
    C.save();
  }
  C.fields.bw = function (v) { setBW(C.fromD(v)); };
  C.fields['get:bw'] = function () { return C.toD(C.st.s.bw); };

  /* ================= Herramientas ================= */
  var tool = { pc: 60, bar: 20, ow: 60, or: 8 };
  function plateHTML() {
    var lb = C.st.s.unit === 'lb', bars = lb ? [[45, '45 lb'], [35, '35 lb'], [15, '15 lb']] : [[20, '20 kg'], [15, '15 kg'], [10, '10 kg']];
    if (lb && tool.bar < 15) tool.bar = 45; if (!lb && tool.bar > 20) tool.bar = 20;
    return '<div class="mbox wide"><h3>Calculadora de discos</h3><p>Discos por cada lado de la barra.</p>' +
      '<div class="fld" style="margin-bottom:12px"><div class="lbl">Peso total (' + C.st.s.unit + ')</div>' + C.stepper('pc', C.fmt(tool.pc, 2), lb ? 5 : 2.5, 0, 1000) + '</div>' +
      '<div class="fld" style="margin-bottom:16px"><div class="lbl">Barra</div>' + C.seg('pcbar', bars, tool.bar) + '</div><div id="pc-res"></div>' +
      '<button class="btn ghost sm" data-act="m-close" style="margin-top:14px">Cerrar</button></div>';
  }
  function plateCalc() {
    var lb = C.st.s.unit === 'lb', set = lb ? [45, 35, 25, 10, 5, 2.5] : [25, 20, 15, 10, 5, 2.5, 1.25], per = (tool.pc - tool.bar) / 2, out = [], rem = per, el = $('#pc-res');
    if (!el) return;
    if (per < 0) { el.innerHTML = '<div class="empty">El peso es menor que la barra.</div>'; return; }
    set.forEach(function (p) { var n = Math.floor(rem / p + 1e-9); if (n > 0) { out.push([p, n]); rem -= n * p; } });
    el.innerHTML = out.length ? '<div class="plates">' + out.map(function (o) { return '<div class="pl-chip"><b>' + C.fmt(o[0], 2) + '</b><span>× ' + o[1] + '</span></div>'; }).join('') + '</div>' +
      (rem > 0.01 ? '<div class="hint" style="margin-top:8px">Faltan ' + C.fmt(rem * 2, 2) + ' ' + C.st.s.unit + ' con estos discos.</div>' : '<div class="hint" style="margin-top:8px">Por cada lado · total ' + C.fmt(tool.pc, 2) + ' ' + C.st.s.unit + '</div>')
      : '<div class="empty">Solo la barra.</div>';
  }
  function ormHTML() {
    return '<div class="mbox wide"><h3>Calculadora de 1RM</h3><p>Tu repetición máxima estimada.</p><div class="logrow"><div class="fld"><div class="lbl">Peso (' + C.st.s.unit + ')</div>' + C.stepper('ow', C.fmt(tool.ow, 2), C.st.s.unit === 'lb' ? 5 : 2.5, 0, 1000) + '</div>' +
      '<div class="fld"><div class="lbl">Repeticiones</div>' + C.stepper('or', tool.or, 1, 1, 30) + '</div></div><div id="orm-res"></div><button class="btn ghost sm" data-act="m-close" style="margin-top:14px">Cerrar</button></div>';
  }
  function ormCalc() {
    var el = $('#orm-res'); if (!el) return;
    var e1 = tool.ow * C.eff(tool.or);
    el.innerHTML = '<div class="orm-big"><span class="eyebrow">1RM estimado</span><b class="num">' + C.fmt(e1, 1) + ' ' + C.st.s.unit + '</b></div><div class="orm-t">' +
      [95, 90, 85, 80, 75, 70, 65, 60].map(function (p) { return '<div><span>' + p + '%</span><b class="num">' + C.fmt(e1 * p / 100, 1) + '</b></div>'; }).join('') + '</div>';
  }
  C.fields.pc = function (v) { tool.pc = v; plateCalc(); };
  C.fields.ow = function (v) { tool.ow = v; ormCalc(); };
  C.fields.or = function (v) { tool.or = Math.round(v); ormCalc(); };
  C.fields['get:pc'] = function () { return tool.pc; }; C.fields['get:ow'] = function () { return tool.ow; }; C.fields['get:or'] = function () { return tool.or; };

  /* ================= Ficha de ejercicio ================= */
  function lineSvg(vals) {
    var min = Math.min.apply(null, vals), max = Math.max.apply(null, vals);
    if (max - min < 1) { max += 0.5; min -= 0.5; }
    var pts = vals.map(function (v, i) { return [10 + i * 280 / (vals.length - 1), 10 + (1 - (v - min) / (max - min)) * 66]; });
    return '<svg viewBox="0 0 300 90" class="chart" preserveAspectRatio="none"><path d="' + pts.map(function (p, i) { return (i ? 'L' : 'M') + p[0].toFixed(1) + ' ' + p[1].toFixed(1); }).join('') + '" fill="none" stroke="#fff" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>' +
      pts.map(function (p, i) { return '<circle cx="' + p[0].toFixed(1) + '" cy="' + p[1].toFixed(1) + '" r="' + (i === pts.length - 1 ? 4 : 2.4) + '" fill="#fff"/>'; }).join('') + '</svg>';
  }
  function evoHTML(ex) {
    var a = C.e1rmSeries(ex).slice(-20); if (a.length < 2) return '';
    var gain = a[a.length - 1].v - a[0].v;
    return '<section class="card p"><div class="eyebrow">Evolución · 1RM estimado</div>' + lineSvg(a.map(function (x) { return x.v; })) +
      '<div class="chart-l"><span>' + C.dateShort(a[0].t) + ' · ' + C.fW(a[0].v) + '</span><span>' + C.dateShort(a[a.length - 1].t) + ' · ' + C.fW(a[a.length - 1].v) + '</span></div>' +
      '<div class="gain' + (gain >= 0 ? '' : ' neg') + '">' + (gain >= 0 ? '+' : '−') + C.fW(Math.abs(gain)) + ' desde la primera vez</div></section>';
  }
  function altHTML(ex) {
    var alts = EX.filter(function (e) { return e.m === ex.m && e.id !== ex.id; }).slice(0, 6);
    if (!alts.length) return '';
    return '<section class="card p"><div class="eyebrow">Alternativas</div><div class="chips sm" style="margin-top:10px">' + alts.map(function (e) { return '<a class="chip" href="#/ex/' + e.id + '">' + e.name + '</a>'; }).join('') + '</div></section>';
  }
  function sheetHTML() {
    var ex = BYID[ui.id], inf = C.info(ex), T = C.tierOf(inf.lvl), g = C.goal(ex, inf), u = C.st.s.unit, h = '', tc = T ? T.c : '#8b95a7';
    h += '<div class="sh-scroll"><div class="sh-in" style="--tc:' + tc + '"><div class="sh-top"><button class="icon-btn" data-act="back" aria-label="Volver">‹</button><div class="sh-title">' + ex.name + '</div><button class="icon-btn favb' + (C.isFav(ex.id) ? ' on' : '') + '" data-act="fav" aria-label="Favorito" aria-pressed="' + C.isFav(ex.id) + '">' + (C.isFav(ex.id) ? '★' : '☆') + '</button></div>';
    h += '<div class="sh-hero">' + C.thumb(ex, inf.lvl, 44) + '</div><div class="eqrow"><span class="tag">' + eqName(ex.eq) + '</span><span class="tag">' + ex.reps[0] + '–' + ex.reps[1] + ' reps</span></div>';
    h += '<div class="rank-line"><div class="rank-name" style="color:' + (T ? T.c : 'var(--mut)') + '">' + (inf.has ? C.lvlName(inf.lvl) : 'Sin rango') + '</div>' +
      (inf.has ? '<div class="rank-top">TOP ~' + TOP[inf.lvl] + '%</div>' : '<div class="rank-top">Registra una serie para conseguir tu rango</div>') + '</div>';
    if (inf.has) h += '<div class="prog"><div class="bar"><i style="width:' + Math.round(inf.frac * 100) + '%"></i></div><div class="row"><span>' + C.lvlName(inf.lvl) + '</span><span>' + (inf.lvl >= 14 ? 'Máximo' : C.lvlName(inf.lvl + 1)) + '</span></div></div>';
    if (g) { var NT = C.tierOf(inf.lvl + 1); h += '<div class="card p goalbox"><div class="gi"><div class="eyebrow">Para subir a <span style="color:' + NT.c + '">' + g.name + '</span></div><b>' + g.txt + '</b></div>' + C.badge(inf.lvl + 1, 34) + '</div>'; }
    else if (inf.has) h += '<div class="card p goalbox"><div class="gi"><div class="eyebrow">Rango máximo</div><b>¡Eres Diamante III!</b></div></div>';
    h += '<div class="stats"><div class="stat"><div class="eyebrow">Mejor serie</div><b>' + (inf.has ? C.setTxt(ex, inf.best.w, inf.best.r).replace('Peso corporal', 'PC') : '—') + '</b></div>' +
      '<div class="stat"><div class="eyebrow">Series</div><b class="num">' + inf.n + '</b></div><div class="stat"><div class="eyebrow">Última vez</div><b>' + (inf.has ? C.dateShort(C.st.logs[ex.id][inf.n - 1].t) : '—') + '</b></div></div>';
    h += evoHTML(ex) + '<section class="card p">' + C.guideHTML(ex) + '</section>' + altHTML(ex);
    h += '<section class="card p"><div class="eyebrow">Historial</div><div class="hist">';
    if (!inf.has) h += '<div class="empty">Todavía no has registrado ninguna serie.</div>';
    else { var logs = C.st.logs[ex.id], shown = 0; for (var i = logs.length - 1; i >= 0 && shown < 8; i--, shown++) h += '<div class="hrow"><span class="hd">' + C.dateShort(logs[i].t) + '</span><span class="hs">' + C.setTxt(ex, logs[i].w, logs[i].r) + (i === inf.best.i ? '<span class="pr">MEJOR</span>' : '') + '</span><button class="del" data-del="' + i + '" aria-label="Borrar serie">✕</button></div>'; }
    h += '</div></section></div></div>';
    var minW = ex.bw > 0 ? -Math.floor(C.toD(ex.bw * C.st.s.bw) * 0.9) : 0;
    h += '<div class="logbar"><div class="logbar-in"><div class="logrow"><div class="fld"><div class="lbl">' + (ex.bw > 0 ? 'Lastre' : 'Peso') + ' (' + u + ')</div>' + C.stepper('w', C.fmt(ui.w, 2), u === 'lb' ? 5 : ex.step, minW, 1000) + '</div>' +
      '<div class="fld"><div class="lbl">Repeticiones</div>' + C.stepper('r', ui.r, 1, 1, 100) + '</div></div>' + (ex.bw > 0 ? '<div class="hint">0 = solo tu peso corporal · negativo = asistencia</div>' : '') +
      '<button class="btn" data-act="log">Guardar serie</button></div></div>';
    return h;
  }
  C.fields.w = function (v) { if (ui) ui.w = v; }; C.fields.r = function (v) { if (ui) ui.r = Math.round(v); };
  C.fields['get:w'] = function () { return ui ? ui.w : 0; }; C.fields['get:r'] = function () { return ui ? ui.r : 8; };
  function renderSheet() {
    var sc = $('.sh-scroll', sheet), top = sc ? sc.scrollTop : 0;
    C.dropFigs('sheet'); sheet.innerHTML = sheetHTML(); C.mount(sheet, 'sheet');
    var n = $('.sh-scroll', sheet); if (n) n.scrollTop = top;
  }
  function openSheet(id) {
    var ex = BYID[id];
    if (!ui || ui.id !== id) {
      var sg = W.suggest(ex);
      ui = { id: id, w: Math.round(C.toD(sg.w) * 4) / 4, r: sg.r };
    }
    renderSheet(); var sc0 = $('.sh-scroll', sheet); if (sc0) sc0.scrollTop = 0; sheet.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () { sheet.classList.add('open'); }); });
  }
  function closeSheet() {
    if (!sheet.classList.contains('open')) return;
    sheet.classList.remove('open'); sheet.setAttribute('aria-hidden', 'true'); document.body.classList.remove('lock'); ui = null;
    setTimeout(function () { if (!sheet.classList.contains('open')) { C.dropFigs('sheet'); sheet.innerHTML = ''; } }, 380);
    renderTab();
  }
  function saveSet() {
    var ex = BYID[ui.id], w = Math.round(C.fromD(ui.w) * 100) / 100, r = Math.round(ui.r);
    if (!(r >= 1) || isNaN(w)) { C.note('Revisa el peso y las repeticiones'); return; }
    if (ex.bw * C.st.s.bw + w <= 0) { C.note('La asistencia no puede superar tu peso corporal'); return; }
    var res = C.logSet(ex, w, r);
    C.checkAch(); renderSheet();
    if (res.up) C.rankUp(ex, res.after, null);
    else { C.sfx(res.pr ? 'pr' : 'set'); C.vib(18); C.note(res.pr && res.before.has ? '¡Nuevo récord! ' + C.setTxt(ex, w, r) : 'Serie guardada', true); }
  }

  /* ================= Datos ================= */
  function exportData() {
    var d = new Date(), copy = JSON.parse(JSON.stringify(C.st)); copy.cur = null;
    var blob = new Blob([JSON.stringify(copy, null, 1)], { type: 'application/json' }), a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'rango-copia-' + d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2) + '.json';
    document.body.appendChild(a); a.click(); setTimeout(function () { URL.revokeObjectURL(a.href); a.remove(); }, 500);
    C.note('Copia exportada', true);
  }
  function importData(file) {
    var fr = new FileReader();
    fr.onload = function () {
      try {
        var j = JSON.parse(fr.result);
        if (!j || (j.v !== 1 && j.v !== 2) || typeof j.logs !== 'object') throw new Error('formato');
        var st = C.sanitize(j, false);
        if (!confirm('¿Reemplazar tus datos actuales por la copia?')) return;
        C.reset(st); C.sfxSync(); setTab('settings'); C.note('Copia importada', true);
      } catch (e) { C.note('Ese archivo no es una copia válida'); }
    };
    fr.readAsText(file);
  }

  /* ================= Bienvenida ================= */
  function showOnboard() {
    var s = C.st.s, u = s.unit;
    C.showModal('<div class="mbox"><h3>Sube de rango</h3><p>Convierte cada entreno en un juego.</p><ul class="steps"><li><b>1</b>La app te dice qué entrenar cada día</li><li><b>2</b>Registra tus series y consigue rango en cada ejercicio</li><li><b>3</b>Supera el objetivo y sube de Bronce a Diamante</li></ul>' +
      '<div class="fld" style="margin-bottom:12px"><div class="lbl">Tu peso corporal (' + u + ')</div>' + C.stepper('bw', C.fmt(C.toD(s.bw), 1), u === 'kg' ? 0.5 : 1, C.fmt(C.toD(30), 0), C.fmt(C.toD(250), 0)) + '</div>' +
      '<div class="fld" style="margin-bottom:12px"><div class="lbl">Unidades</div>' + C.seg('unit', [['kg', 'kg'], ['lb', 'lb']], u) + '</div>' +
      '<div class="fld" style="margin-bottom:12px"><div class="lbl">Estándares de fuerza</div>' + C.seg('sex', [['m', 'Hombre'], ['f', 'Mujer']], s.sex) + '</div>' +
      '<div class="fld" style="margin-bottom:12px"><div class="lbl">¿Dónde entrenas?</div>' + C.seg('place', [['gym', 'Gimnasio'], ['home', 'Casa'], ['body', 'Sin material']], placeOf()) + '</div>' +
      '<div class="fld" style="margin-bottom:20px"><div class="lbl">Días de entreno por semana</div>' + C.seg('goal', [[2, '2'], [3, '3'], [4, '4'], [5, '5'], [6, '6']], s.goal) + '</div>' +
      '<button class="btn" data-act="onb-done">Empezar</button></div>', 'plain onb');
  }

  function showTour(i) {
    var T = R.TOUR[i], last = i === R.TOUR.length - 1;
    C.showModal('<div class="mbox tour"><div class="tour-ic">' + T.ic + '</div><h3>' + T.t + '</h3><p>' + T.d + '</p><div class="sdots" style="margin:0 0 18px">' +
      R.TOUR.map(function (x, k) { return '<i class="' + (k === i ? 'c d' : '') + '"></i>'; }).join('') + '</div>' +
      '<button class="btn" data-act="tour-next" data-i="' + (last ? R.TOUR.length : i + 1) + '">' + (last ? 'Empezar' : 'Siguiente') + '</button>' +
      (last ? '' : '<button class="t-alt" data-act="tour-skip" style="width:100%">Saltar</button>') + '</div>', 'plain onb');
  }

  /* ================= Navegación ================= */
  function renderTab() {
    if (tab === 'today') renderToday(); else if (tab === 'library') renderLibrary(); else if (tab === 'progress') renderProgress(); else renderSettings();
    window.scrollTo(0, 0);
  }
  function setTab(name) {
    tab = name; rendered = true;
    Object.keys(views).forEach(function (k) { views[k].hidden = k !== name; });
    $$('.tab').forEach(function (a) { a.classList.toggle('on', a.getAttribute('data-tab') === name); });
    C.dropFigs('lib'); renderTab();
    if (name === 'today' || name === 'progress' || name === 'settings') C.dropFigs('lib');
  }
  function route() {
    var h = location.hash.replace(/^#/, '') || '/', m = h.match(/^\/ex\/([a-z0-9]+)$/);
    if (h === '/workout') {
      closeSheet(); W.closePlan();
      if (!rendered) setTab('today');
      if (!W.openPlayer()) location.replace('#/');
      return;
    }
    W.closePlayer(); W.summary = null;
    if (h === '/plan') { closeSheet(); if (!rendered) setTab('today'); W.openPlan(); return; }
    W.closePlan();
    if (m && BYID[m[1]]) { if (!rendered) setTab('library'); openSheet(m[1]); return; }
    closeSheet(); fromApp = false;
    var t = h === '/library' ? 'library' : h === '/progress' ? 'progress' : h === '/settings' ? 'settings' : 'today';
    if (t === tab && rendered) renderTab(); else setTab(t);
  }
  window.addEventListener('hashchange', route);
  document.addEventListener('click', function (e) {
    var a = e.target.closest && e.target.closest('a[href^="#/ex/"]'); if (a) fromApp = true;
    var tb = e.target.closest && e.target.closest('.tab'); if (tb) C.sfx('tap');
  }, true);

  /* ================= Eventos ================= */
  document.addEventListener('input', function (e) {
    if (e.target.id === 'lib-q') { lib.q = e.target.value; fillLib(); }
  });
  document.addEventListener('change', function (e) { if (e.target.id === 'file' && e.target.files && e.target.files[0]) { importData(e.target.files[0]); e.target.value = ''; } });
  document.addEventListener('click', function (e) {
    var t = e.target, el;
    if ((el = t.closest('[data-lg]'))) { lib.g = el.getAttribute('data-lg'); renderLibrary(); C.sfx('tap'); return; }
    if ((el = t.closest('[data-le]'))) { lib.e = el.getAttribute('data-le'); renderLibrary(); C.sfx('tap'); return; }
    if ((el = t.closest('[data-eq]'))) {
      var q = el.getAttribute('data-eq'), eq = C.st.s.equip, on = Object.keys(eq).filter(function (k) { return eq[k]; });
      if (eq[q] && on.length === 1) { C.note('Necesitas al menos un tipo de equipo'); return; }
      eq[q] = !eq[q]; resetPlan(); C.save(); C.sfx('tap'); renderSettings(); return;
    }
    if ((el = t.closest('[data-pcbar]'))) return;
    if ((el = t.closest('[data-set]'))) {
      var k = el.getAttribute('data-set'), v = el.getAttribute('data-v'), s = C.st.s;
      C.sfx('tap');
      if (k === 'pcbar') { tool.bar = +v; C.$('.mbox.wide', C.modal).outerHTML = plateHTML(); plateCalc(); return; }
      if (k === 'unit') { s.unit = v; tool.pc = v === 'lb' ? 135 : 60; tool.bar = v === 'lb' ? 45 : 20; tool.ow = v === 'lb' ? 135 : 60; }
      else if (k === 'sex') s.sex = v;
      else if (k === 'sound' || k === 'vib' || k === 'wake' || k === 'warm' || k === 'autorest') { s[k] = v === '1'; if (k === 'sound') { C.sfxSync(); C.sfx('tap'); } if (k === 'warm' || k === 'autorest') resetPlan(); }
      else if (k === 'program') { s.program = v; resetPlan(); }
      else if (k === 'place') { var pe = s.equip; R.EQUIP.forEach(function (q) { pe[q.id] = v === 'gym' || (v === 'home' && (q.id === 'mancuernas' || q.id === 'cuerpo')) || (v === 'body' && q.id === 'cuerpo'); }); resetPlan(); }
      else s[k] = +v;
      C.save();
      if (!C.modal.hidden && C.modal.classList.contains('onb')) showOnboard(); else renderSettings();
      return;
    }
    if ((el = t.closest('[data-del]'))) {
      var ex = BYID[ui.id], idx = +el.getAttribute('data-del');
      if (confirm('¿Borrar esta serie?')) { C.deleteSet(ex, idx); renderSheet(); }
      return;
    }
    if (!(el = t.closest('[data-act]'))) return;
    var act = el.getAttribute('data-act');
    if (act === 'back') { if (fromApp) history.back(); else location.hash = '/'; }
    else if (act === 'log') saveSet();
    else if (act === 'fav') { C.toggleFav(ui.id); C.sfx('tap'); renderSheet(); }
    else if (act === 'csv') { var cb = new Blob(['\ufeff' + C.csv()], { type: 'text/csv;charset=utf-8' }), ca = document.createElement('a'); ca.href = URL.createObjectURL(cb); ca.download = 'rango-historial.csv'; document.body.appendChild(ca); ca.click(); setTimeout(function () { URL.revokeObjectURL(ca.href); ca.remove(); }, 500); C.note('Historial exportado', true); }
    else if (act === 'install') { if (installEvt) { installEvt.prompt(); installEvt = null; renderSettings(); } }
    else if (act === 'reload') location.reload();
    else if (act === 'tour-open') { C.sfx('tap'); showTour(0); }
    else if (act === 'tour-next') { var ti = +el.getAttribute('data-i'); C.sfx('tap'); if (ti >= R.TOUR.length) { C.st.s.tour = true; C.save(); C.closeModal(); } else showTour(ti); }
    else if (act === 'tour-skip') { C.st.s.tour = true; C.save(); C.closeModal(); }
    else if (act === 'onb-done') { C.st.s.onb = true; if (!C.st.bwh.length) C.st.bwh.push({ t: Date.now(), kg: C.st.s.bw }); C.save(); C.closeModal(); C.sfx('start'); renderTab(); if (!C.st.s.tour) showTour(0); }
    else if (act === 'export') exportData();
    else if (act === 'import') $('#file').click();
    else if (act === 'reset') { if (confirm('Se borrarán todas tus series, rangos y entrenamientos de este dispositivo. ¿Continuar?')) { C.reset(); C.sfxSync(); W.summary = null; location.hash = '/settings'; setTab('settings'); showOnboard(); } }
    else if (act === 'tool-plate') { C.sfx('tap'); C.showModal(plateHTML(), 'plain'); plateCalc(); }
    else if (act === 'tool-orm') { C.sfx('tap'); C.showModal(ormHTML(), 'plain'); ormCalc(); }
    else if (act === 'bw-log') {
      C.sfx('tap');
      C.showModal('<div class="mbox"><h3>Registrar peso</h3><p>Se guarda en tu gráfica y se usa para tus rangos.</p><div class="fld" style="margin-bottom:16px"><div class="lbl">Peso corporal (' + C.st.s.unit + ')</div>' +
        C.stepper('bw', C.fmt(C.toD(C.st.s.bw), 1), C.st.s.unit === 'kg' ? 0.5 : 1, C.fmt(C.toD(30), 0), C.fmt(C.toD(250), 0)) + '</div><button class="btn" data-act="bw-done">Guardar</button></div>', 'plain');
    }
    else if (act === 'bw-done') { C.closeModal(); C.sfx('set'); renderTab(); }
  });
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Escape') return;
    if (!C.modal.hidden && !C.modal.classList.contains('onb')) C.closeModal();
    else if (sheet.classList.contains('open')) { if (fromApp) history.back(); else location.hash = '/'; }
    else if ($('#plan').classList.contains('open') && !$('#player').classList.contains('open')) location.hash = '/';
  });

  /* ================= Inicio ================= */
  route();
  if (!C.st.s.onb) showOnboard();
  window.addEventListener('beforeinstallprompt', function (e) { e.preventDefault(); installEvt = e; if (tab === 'settings') renderSettings(); });
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) {
    var hadCtl = !!navigator.serviceWorker.controller;
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (!hadCtl) { hadCtl = true; return; }
      var p = document.createElement('div'); p.className = 'pill ok'; p.innerHTML = '<span>Nueva versión lista</span><button class="x" data-act="reload" style="color:#fff;font-weight:800;font-size:14px">Recargar</button>';
      $('#top-notes').appendChild(p);
    });
    window.addEventListener('load', function () { navigator.serviceWorker.register('sw.js').catch(function () {}); });
  }
})(window.RANGO);
