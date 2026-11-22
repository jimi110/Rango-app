/* RANGO · núcleo: estado, rangos, estadísticas, logros y utilidades de interfaz */
(function (R) {
  'use strict';
  var EX = R.EXERCISES, BYID = R.BYID, TIERS = R.TIERS, TOP = R.TOP, GROUPS = R.GROUPS;
  var C = R.core = {};
  var KEY = 'rango.v2', OLD = 'rango.v1', LB = 2.20462, ROM = ['I', 'II', 'III'], DAY = 864e5;
  C.ROM = ROM; C.LB = LB;

  /* ================= Estado ================= */
  function defState() {
    return {
      v: 2,
      s: { bw: 75, unit: 'kg', sex: 'm', rest: 90, onb: false, dur: 60, goal: 4, sound: true, vib: true, wake: true,
           warm: true, autorest: true, program: 'auto', tour: false, equip: { barra: true, mancuernas: true, maquina: true, polea: true, cuerpo: true } },
      logs: {}, peak: {}, start: null, ups: [], sessions: [], cur: null, bwh: [], ach: {}, fav: {}, routines: [],
      plan: { focus: null, dur: null, list: null, day: 0 }
    };
  }
  function num(v, a, b, d) { v = +v; return isFinite(v) ? Math.min(b, Math.max(a, v)) : d; }
  function sanitize(j, keepCur) {
    var st = defState(), k;
    if (!j || typeof j !== 'object') return st;
    var s = j.s || {};
    st.s.bw = num(s.bw, 30, 250, 75); st.s.unit = s.unit === 'lb' ? 'lb' : 'kg'; st.s.sex = s.sex === 'f' ? 'f' : 'm';
    st.s.rest = [0, 30, 45, 60, 90, 120, 180].indexOf(+s.rest) >= 0 ? +s.rest : 90;
    st.s.onb = !!s.onb; st.s.dur = num(s.dur, 20, 180, 60); st.s.goal = num(s.goal, 1, 7, 4);
    st.s.sound = s.sound !== false; st.s.vib = s.vib !== false; st.s.wake = s.wake !== false;
    st.s.warm = s.warm !== false; st.s.autorest = s.autorest !== false; st.s.tour = !!s.tour;
    st.s.program = R.PROGRAMS[s.program] ? s.program : 'auto';
    var eq = s.equip && typeof s.equip === 'object' ? s.equip : {};
    Object.keys(st.s.equip).forEach(function (k) { st.s.equip[k] = eq[k] !== false; });
    if (!Object.keys(st.s.equip).some(function (k) { return st.s.equip[k]; })) Object.keys(st.s.equip).forEach(function (k) { st.s.equip[k] = true; });
    var logs = j.logs && typeof j.logs === 'object' ? j.logs : {};
    Object.keys(logs).forEach(function (id) {
      if (!BYID[id] || !Array.isArray(logs[id])) return;
      var a = logs[id].filter(function (l) { return l && isFinite(l.w) && isFinite(l.r) && isFinite(l.t) && l.r >= 1; })
        .map(function (l) { return { t: +l.t, w: +l.w, r: Math.min(200, Math.round(+l.r)) }; })
        .sort(function (x, y) { return x.t - y.t; });
      if (a.length) st.logs[id] = a;
    });
    var pk = j.peak || {};
    Object.keys(pk).forEach(function (id) { if (st.logs[id] && isFinite(pk[id])) st.peak[id] = num(Math.round(pk[id]), 0, 14, 0); });
    st.start = isFinite(j.start) && j.start ? +j.start : null;
    st.ups = (Array.isArray(j.ups) ? j.ups : []).filter(function (u) { return u && BYID[u.id] && isFinite(u.lvl) && isFinite(u.t); })
      .map(function (u) { return { t: +u.t, id: u.id, lvl: num(Math.round(u.lvl), 0, 14, 0) }; }).slice(-80);
    st.sessions = (Array.isArray(j.sessions) ? j.sessions : []).filter(function (x) { return x && isFinite(x.t0) && isFinite(x.t1); })
      .map(function (x) {
        return { id: String(x.id || x.t0), t0: +x.t0, t1: +x.t1, focus: String(x.focus || 'full'), sets: num(x.sets, 0, 999, 0), vol: num(x.vol, 0, 1e7, 0),
          exs: (Array.isArray(x.exs) ? x.exs : []).filter(function (id) { return BYID[id]; }), ups: num(x.ups, 0, 99, 0), prs: num(x.prs, 0, 99, 0) };
      }).slice(-300);
    st.bwh = (Array.isArray(j.bwh) ? j.bwh : []).filter(function (x) { return x && isFinite(x.t) && isFinite(x.kg); })
      .map(function (x) { return { t: +x.t, kg: num(x.kg, 30, 250, 75) }; }).slice(-200);
    st.ach = {}; if (j.ach && typeof j.ach === 'object') Object.keys(j.ach).forEach(function (id) { if (isFinite(j.ach[id])) st.ach[id] = +j.ach[id]; });
    st.fav = {}; if (j.fav && typeof j.fav === 'object') Object.keys(j.fav).forEach(function (id) { if (BYID[id] && j.fav[id]) st.fav[id] = 1; });
    st.routines = (Array.isArray(j.routines) ? j.routines : []).filter(function (r) { return r && r.name && Array.isArray(r.list); }).slice(0, 20).map(function (r) {
      return { id: String(r.id || Date.now()), name: String(r.name).slice(0, 30), list: r.list.filter(function (x) { return x && BYID[x.id]; }).map(function (x) { return { id: x.id, sets: num(Math.round(x.sets), 1, 8, 3) }; }) };
    }).filter(function (r) { return r.list.length; });
    if (keepCur && j.cur && Array.isArray(j.cur.list) && j.cur.list.length) st.cur = j.cur;
    if (j.plan && Array.isArray(j.plan.list)) {
      st.plan = { focus: R.FOCUS[j.plan.focus] ? j.plan.focus : null, dur: num(j.plan.dur, 20, 180, 60), day: +j.plan.day || 0,
        list: j.plan.list.filter(function (x) { return x && BYID[x.id]; }).map(function (x) { return { id: x.id, sets: num(Math.round(x.sets), 1, 8, 3) }; }) };
    }
    return st;
  }
  function load() {
    try { var j = JSON.parse(localStorage.getItem(KEY)); if (j && j.v === 2) return sanitize(j, true); } catch (e) {}
    try { var o = JSON.parse(localStorage.getItem(OLD)); if (o && o.v === 1) return sanitize(o, false); } catch (e) {}
    return defState();
  }
  C.st = load();
  C.sanitize = sanitize; C.defState = defState;
  C.save = function () { try { localStorage.setItem(KEY, JSON.stringify(C.st)); } catch (e) {} };
  C.reset = function (st) { C.st = st || defState(); C.save(); };

  /* ================= Utilidades ================= */
  function $(s, r) { return (r || document).querySelector(s); }
  function $$(s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); }
  C.$ = $; C.$$ = $$;
  C.clamp = function (v, a, b) { return Math.min(b, Math.max(a, v)); };
  C.toD = function (kg) { return C.st.s.unit === 'lb' ? kg * LB : kg; };
  C.fromD = function (v) { return C.st.s.unit === 'lb' ? v / LB : v; };
  C.fmt = function (x, dec) { return (Math.round(x * Math.pow(10, dec)) / Math.pow(10, dec)).toLocaleString('es-ES', { maximumFractionDigits: dec, useGrouping: false }); };
  C.fW = function (kg) { return C.fmt(C.toD(kg), 1) + ' ' + C.st.s.unit; };
  C.parseNum = function (v) { return parseFloat(String(v).replace(',', '.')); };
  C.sod = function (ts) { var d = new Date(ts); d.setHours(0, 0, 0, 0); return d.getTime(); };
  C.dateShort = function (ts) { return new Date(ts).toLocaleDateString('es-ES', { day: 'numeric', month: 'short' }).replace('.', ''); };
  C.daysAgo = function (ts) { return Math.round((C.sod(Date.now()) - C.sod(ts)) / DAY); };
  C.dayNum = function () { return C.st.start ? Math.round((C.sod(Date.now()) - C.sod(C.st.start)) / DAY) + 1 : 1; };
  C.clock = function (ms) {
    var s = Math.max(0, Math.round(ms / 1000)), h = Math.floor(s / 3600), m = Math.floor(s % 3600 / 60);
    return (h ? h + ':' + ('0' + m).slice(-2) : m) + ':' + ('0' + (s % 60)).slice(-2);
  };
  C.vib = function (p) { try { if (C.st.s.vib && navigator.vibrate) navigator.vibrate(p); } catch (e) {} };
  C.sfx = function (n) { if (C.st.s.sound && R.Sfx) R.Sfx.play(n); };
  C.sfxSync = function () { if (R.Sfx) R.Sfx.enable(C.st.s.sound); };
  C.sfxSync();

  /* ================= Rangos ================= */
  function eff(r) { r = C.clamp(r, 1, 30); return r <= 1 ? 1 : 1 + r / 30; }
  C.eff = eff;
  C.thr = function (ex) {
    var f = C.st.s.sex === 'f' ? ex.fem : 1, a = ex.anchors, t = [];
    for (var i = 0; i < 5; i++) for (var j = 0; j < 3; j++) t.push((a[i] + (a[i + 1] - a[i]) * j / 3) * f);
    return t;
  };
  C.score = function (ex, w, r) { var load = ex.bw * C.st.s.bw + w; return load <= 0 ? 0 : load * eff(r) / C.st.s.bw; };
  C.setVol = function (ex, w, r) { return Math.max(0, ex.bw * C.st.s.bw + w) * r; };
  C.lvlName = function (l) { return TIERS[(l / 3) | 0].n + ' ' + ROM[l % 3]; };
  C.tierOf = function (l) { return l < 0 ? null : TIERS[(l / 3) | 0]; };

  C.info = function (ex) {
    var logs = C.st.logs[ex.id] || [];
    if (!logs.length) return { has: false, lvl: -1, comp: -1, frac: 0, best: null, n: 0 };
    var best = null, i, s;
    for (i = 0; i < logs.length; i++) {
      s = C.score(ex, logs[i].w, logs[i].r);
      if (!best || s > best.s) best = { w: logs[i].w, r: logs[i].r, s: s, t: logs[i].t, i: i };
    }
    var t = C.thr(ex), comp = 0;
    for (i = 0; i < t.length; i++) if (best.s >= t[i]) comp = i;
    var pk = C.st.peak[ex.id], lvl = Math.max(comp, pk === undefined ? 0 : pk);
    var frac = lvl >= 14 ? 1 : C.clamp((best.s - t[lvl]) / (t[lvl + 1] - t[lvl]), 0, 1);
    if (best.s < t[0]) frac = C.clamp(best.s / t[0], 0, 1);
    return { has: true, lvl: lvl, comp: comp, frac: frac, best: best, n: logs.length };
  };

  C.setTxt = function (ex, w, r) {
    if (ex.bw > 0) {
      if (Math.abs(w) < 0.01) return 'Peso corporal × ' + r;
      if (w > 0) return '+' + C.fW(w) + ' × ' + r;
      return C.fW(w).replace('-', '−') + ' asist. × ' + r;
    }
    return C.fW(w) + ' × ' + r;
  };

  C.goal = function (ex, inf) {
    if (!inf.has || inf.lvl >= 14) return null;
    var t = C.thr(ex), tgt = t[inf.lvl + 1], bw = C.st.s.bw, b = inf.best, name = C.lvlName(inf.lvl + 1);
    if (ex.bw > 0 && b.w <= 0.01) {
      var load = ex.bw * bw + b.w, need = 30 * (tgt * bw / load - 1), r2 = Math.ceil(need - 1e-9);
      if (r2 <= b.r) r2 = b.r + 1;
      if (r2 <= 40) return { name: name, txt: r2 + ' repeticiones' + (Math.abs(b.w) < 0.01 ? '' : ' con ' + C.fW(b.w)) };
    }
    var w = tgt * bw / eff(b.r) - ex.bw * bw, step = C.st.s.unit === 'lb' ? 5 : ex.step;
    var wd = Math.ceil(C.toD(w) / step - 1e-9) * step, cur = C.toD(b.w);
    if (wd <= cur + 1e-6) wd = cur + step;
    return { name: name, txt: C.setTxt(ex, C.fromD(wd), b.r) };
  };

  C.globalInfo = function () {
    var sum = 0, n = 0;
    EX.forEach(function (ex) { var i = C.info(ex); if (i.has) { sum += i.lvl; n++; } });
    if (!n) return null;
    var avg = sum / n, l = Math.floor(avg + 1e-9);
    return { lvl: l, frac: l >= 14 ? 1 : avg - l, n: n };
  };

  /* Registrar una serie (sin interfaz). Devuelve qué ha pasado. */
  C.logSet = function (ex, w, r) {
    var before = C.info(ex), s = C.score(ex, w, r), logs = (C.st.logs[ex.id] = C.st.logs[ex.id] || []);
    logs.push({ t: Date.now(), w: Math.round(w * 100) / 100, r: Math.round(r) });
    if (!C.st.start) C.st.start = Date.now();
    var after = C.info(ex);
    if (C.st.peak[ex.id] === undefined || after.comp > C.st.peak[ex.id]) C.st.peak[ex.id] = after.comp;
    after = C.info(ex);
    var up = after.lvl > before.lvl, pr = !before.best || s > before.best.s + 1e-9;
    if (up) { C.st.ups.push({ t: Date.now(), id: ex.id, lvl: after.lvl }); if (C.st.ups.length > 80) C.st.ups.shift(); }
    C.save();
    return { before: before, after: after, up: up, pr: pr };
  };
  C.deleteSet = function (ex, idx) {
    var a = C.st.logs[ex.id]; if (!a) return;
    a.splice(idx, 1);
    if (!a.length) { delete C.st.logs[ex.id]; delete C.st.peak[ex.id]; if (!Object.keys(C.st.logs).length && !C.st.sessions.length) C.st.start = null; }
    else C.st.peak[ex.id] = C.info(ex).comp;
    C.save();
  };

  /* ================= Estadísticas ================= */
  var muscleGroup = {}; GROUPS.forEach(function (g) { g.m.forEach(function (m) { muscleGroup[m] = g.id; }); });
  C.groupOf = function (m) { return muscleGroup[m]; };

  C.lastByMuscle = function () {
    var o = {};
    EX.forEach(function (e) {
      var l = C.st.logs[e.id]; if (!l || !l.length) return;
      var t = l[l.length - 1].t; if (!o[e.m] || t > o[e.m]) o[e.m] = t;
    });
    return o;
  };
  C.lastOf = function (id) { var l = C.st.logs[id]; return l && l.length ? l[l.length - 1].t : 0; };

  C.dayMap = function () {
    var days = {}, k;
    for (k in C.st.logs) C.st.logs[k].forEach(function (l) { days[C.sod(l.t)] = 1; });
    return days;
  };
  C.streak = function () {
    var days = C.dayMap(), d = new Date(), n = 0; d.setHours(0, 0, 0, 0);
    if (!days[d.getTime()]) d.setDate(d.getDate() - 1);
    while (days[d.getTime()]) { n++; d.setDate(d.getDate() - 1); }
    return n;
  };
  C.bestStreak = function () {
    var ks = Object.keys(C.dayMap()).map(Number).sort(function (a, b) { return a - b; }), best = 0, run = 0, prev = null;
    ks.forEach(function (k) { run = prev !== null && Math.round((k - prev) / DAY) === 1 ? run + 1 : 1; if (run > best) best = run; prev = k; });
    return best;
  };
  C.weekStart = function () { var d = new Date(); d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return d.getTime(); };
  C.weekDays = function () {
    var days = C.dayMap(), ws = C.weekStart(), n = 0;
    Object.keys(days).forEach(function (k) { if (+k >= ws) n++; });
    return n;
  };
  C.stats = function () {
    var sets = 0, vol = 0, ex = 0, mus = {}, maxLvl = -1, days = C.dayMap();
    EX.forEach(function (e) {
      var l = C.st.logs[e.id]; if (!l || !l.length) return;
      ex++; mus[muscleGroup[e.m]] = 1; sets += l.length;
      l.forEach(function (x) { vol += C.setVol(e, x.w, x.r); });
      var i = C.info(e); if (i.lvl > maxLvl) maxLvl = i.lvl;
    });
    var longest = 0; C.st.sessions.forEach(function (s) { var m = (s.t1 - s.t0) / 60000; if (m > longest) longest = m; });
    return { sets: sets, vol: vol, ex: ex, groups: Object.keys(mus).length, maxLvl: maxLvl, days: Object.keys(days).length,
      workouts: C.st.sessions.length, streak: C.streak(), day: C.dayNum(), weekDays: C.weekDays(), longest: longest };
  };

  /* ================= Equipo, favoritos y evolución ================= */
  C.equipOk = function (ex) { return C.st.s.equip[ex.eq] !== false; };
  C.isFav = function (id) { return !!C.st.fav[id]; };
  C.toggleFav = function (id) { if (C.st.fav[id]) delete C.st.fav[id]; else C.st.fav[id] = 1; C.save(); return !!C.st.fav[id]; };
  /* mejor 1RM estimado de cada día (para la gráfica) */
  C.e1rmSeries = function (ex) {
    var days = {};
    (C.st.logs[ex.id] || []).forEach(function (l) {
      var k = C.sod(l.t), v = Math.max(0, ex.bw * C.st.s.bw + l.w) * eff(l.r);
      if (!days[k] || v > days[k]) days[k] = v;
    });
    return Object.keys(days).map(Number).sort(function (a, b) { return a - b; }).map(function (k) { return { t: k, v: days[k] }; });
  };
  C.csv = function () {
    var head = 'fecha;ejercicio;grupo;peso_' + C.st.s.unit + ';repeticiones;1rm_estimado_' + C.st.s.unit, rows = [];
    EX.forEach(function (e) {
      (C.st.logs[e.id] || []).forEach(function (l) {
        var d = new Date(l.t), ds = d.getFullYear() + '-' + ('0' + (d.getMonth() + 1)).slice(-2) + '-' + ('0' + d.getDate()).slice(-2);
        rows.push([ds, e.name, e.group, C.fmt(C.toD(l.w), 1), l.r, C.fmt(C.toD(Math.max(0, e.bw * C.st.s.bw + l.w) * eff(l.r)), 1)].join(';'));
      });
    });
    return [head].concat(rows.sort(function (a, b) { return a < b ? -1 : 1; })).join('\n');
  };

  /* ================= Logros ================= */
  C.ACH = [
    { id: 'set1', n: 'Primera serie', d: 'Registra tu primera serie', ck: function (s) { return s.sets >= 1; } },
    { id: 'w1', n: 'Primer entreno', d: 'Termina un entrenamiento guiado', ck: function (s) { return s.workouts >= 1; } },
    { id: 'w5', n: 'En marcha', d: '5 entrenamientos terminados', ck: function (s) { return s.workouts >= 5; } },
    { id: 'w25', n: 'Constante', d: '25 entrenamientos terminados', ck: function (s) { return s.workouts >= 25; } },
    { id: 'w100', n: 'Leyenda', d: '100 entrenamientos terminados', ck: function (s) { return s.workouts >= 100; } },
    { id: 'st3', n: 'Racha de 3', d: '3 días seguidos entrenando', ck: function (s) { return s.streak >= 3; } },
    { id: 'st7', n: 'Semana perfecta', d: '7 días seguidos entrenando', ck: function (s) { return s.streak >= 7; } },
    { id: 'd7', n: 'Día 7', d: 'Llega al día 7', ck: function (s) { return s.day >= 7 && s.sets > 0; } },
    { id: 'd21', n: 'Día 21', d: 'Llega al día 21', ck: function (s) { return s.day >= 21 && s.sets > 0; } },
    { id: 'd90', n: 'Día 90', d: 'Llega al día 90', ck: function (s) { return s.day >= 90 && s.sets > 0; } },
    { id: 'silver', n: 'Plata', d: 'Alcanza Plata en un ejercicio', ck: function (s) { return s.maxLvl >= 3; } },
    { id: 'gold', n: 'Oro', d: 'Alcanza Oro en un ejercicio', ck: function (s) { return s.maxLvl >= 6; } },
    { id: 'emerald', n: 'Esmeralda', d: 'Alcanza Esmeralda en un ejercicio', ck: function (s) { return s.maxLvl >= 9; } },
    { id: 'diamond', n: 'Diamante', d: 'Alcanza Diamante en un ejercicio', ck: function (s) { return s.maxLvl >= 12; } },
    { id: 'all6', n: 'Cuerpo entero', d: 'Entrena los 6 grupos musculares', ck: function (s) { return s.groups >= 6; } },
    { id: 'ex10', n: 'Explorador', d: 'Prueba 10 ejercicios distintos', ck: function (s) { return s.ex >= 10; } },
    { id: 'ex25', n: 'Coleccionista', d: 'Prueba 25 ejercicios distintos', ck: function (s) { return s.ex >= 25; } },
    { id: 'vol10', n: '10 toneladas', d: 'Mueve 10.000 kg en total', ck: function (s) { return s.vol >= 10000; } },
    { id: 'vol100', n: '100 toneladas', d: 'Mueve 100.000 kg en total', ck: function (s) { return s.vol >= 100000; } },
    { id: 'long', n: 'Maratón', d: 'Entrena más de 75 minutos', ck: function (s) { return s.longest >= 75; } },
    { id: 'goal', n: 'Objetivo semanal', d: 'Cumple tus días de la semana', ck: function (s) { return s.weekDays >= C.st.s.goal; } }
  ];
  C.checkAch = function () {
    var s = C.stats(), fresh = [];
    C.ACH.forEach(function (a) { if (!C.st.ach[a.id] && a.ck(s)) { C.st.ach[a.id] = Date.now(); fresh.push(a); } });
    if (fresh.length) { C.save(); C.sfx('ach'); fresh.forEach(function (a) { C.note('🏅 Logro: ' + a.n, true); }); }
    return fresh;
  };

  /* ================= Insignias y miniaturas ================= */
  C.badge = function (lvl, size) {
    var T = TIERS[(lvl / 3) | 0], lv = lvl % 3;
    return '<svg class="badge" width="' + size + '" height="' + Math.round(size * 1.15) + '" viewBox="0 0 40 46" aria-hidden="true">' +
      '<path d="M20 1.5 37.5 11.5V33.5L20 44.5 2.5 33.5V11.5Z" fill="' + T.c + '"/><path d="M20 6.2 33.5 14V31L20 39.8 6.5 31V14Z" fill="' + T.d + '"/>' +
      '<text x="20" y="28.2" text-anchor="middle" font-size="14" font-weight="900" fill="' + T.c + '" font-family="system-ui,sans-serif">' + ROM[lv] + '</text></svg>';
  };
  C.emptyBadge = function (size) {
    return '<svg class="badge" width="' + size + '" height="' + Math.round(size * 1.15) + '" viewBox="0 0 40 46" aria-hidden="true">' +
      '<path d="M20 1.5 37.5 11.5V33.5L20 44.5 2.5 33.5V11.5Z" fill="#232a37"/><path d="M20 6.2 33.5 14V31L20 39.8 6.5 31V14Z" fill="#11151c"/>' +
      '<text x="20" y="28.5" text-anchor="middle" font-size="15" font-weight="900" fill="#4b5566" font-family="system-ui,sans-serif">?</text></svg>';
  };
  C.thumb = function (ex, lvl, bsize, cls) {
    var T = C.tierOf(lvl);
    return '<div class="thumb' + (T ? '' : ' none') + (cls ? ' ' + cls : '') + '"' + (T ? ' style="--tc:' + T.c + '"' : '') + '><div class="fig-host" data-fig="' + ex.id + '"></div>' +
      (T && bsize ? '<div class="tb">' + C.badge(lvl, bsize) + '</div>' : '') + '</div>';
  };

  /* ================= Figuras animadas ================= */
  var lists = {}, io = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  if ('IntersectionObserver' in window) {
    io = new IntersectionObserver(function (es) { es.forEach(function (e) { if (e.target.__fig) e.target.__fig.vis = e.isIntersecting; }); }, { rootMargin: '80px' });
  }
  C.mount = function (root, name) {
    var list = lists[name] = lists[name] || [];
    C.$$('.fig-host', root).forEach(function (h, i) {
      if (h.firstChild) return;
      var f = R.Fig.create(h.getAttribute('data-fig'));
      f.off = (i * 0.45) % 3; h.appendChild(f.svg); list.push(f);
      R.Fig.draw(f, performance.now() / 1000);
      if (io) { f.vis = false; io.observe(f.svg); }
    });
  };
  C.dropFigs = function (name) {
    var list = lists[name] || [];
    list.forEach(function (f) { if (io) io.unobserve(f.svg); });
    lists[name] = [];
  };
  var t0 = performance.now();
  function loop(now) {
    if (!document.hidden && !reduce) {
      var t = (now - t0) / 1000;
      for (var k in lists) { var l = lists[k]; for (var i = 0; i < l.length; i++) if (l[i].vis) R.Fig.draw(l[i], t); }
    }
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  /* ================= Campos numéricos (+ / −) ================= */
  C.stepper = function (f, val, step, min, max) {
    return '<div class="stp" data-f="' + f + '" data-step="' + step + '" data-min="' + min + '" data-max="' + max + '">' +
      '<button type="button" class="sb" data-d="-1" aria-label="Menos">−</button>' +
      '<input class="sv" type="text" inputmode="decimal" value="' + val + '" aria-label="' + f + '">' +
      '<button type="button" class="sb" data-d="1" aria-label="Más">+</button></div>';
  };
  C.fields = {};
  function stepTo(stp, v) {
    var min = +stp.getAttribute('data-min'), max = +stp.getAttribute('data-max'), f = stp.getAttribute('data-f');
    v = C.clamp(Math.round(v * 100) / 100, min, max);
    C.$('.sv', stp).value = C.fmt(v, 2);
    if (C.fields[f]) C.fields[f](v);
  }
  function stepBy(stp, dir) {
    var v = C.parseNum(C.$('.sv', stp).value), step = +stp.getAttribute('data-step');
    if (isNaN(v)) v = 0;
    stepTo(stp, v + dir * step);
  }
  var holdT = null, holdI = null;
  function stopHold() { clearTimeout(holdT); clearInterval(holdI); holdT = holdI = null; }
  document.addEventListener('pointerdown', function (e) {
    var b = e.target.closest && e.target.closest('.sb'); if (!b) return;
    e.preventDefault();
    var stp = b.closest('.stp'), dir = +b.getAttribute('data-d');
    stopHold(); stepBy(stp, dir); C.sfx('step');
    holdT = setTimeout(function () { holdI = setInterval(function () { stepBy(stp, dir); }, 80); }, 420);
  });
  ['pointerup', 'pointercancel', 'pointerleave', 'contextmenu'].forEach(function (ev) { document.addEventListener(ev, stopHold, true); });
  document.addEventListener('change', function (e) {
    var inp = e.target; if (!(inp.classList && inp.classList.contains('sv'))) return;
    var stp = inp.closest('.stp'), v = C.parseNum(inp.value), f = stp.getAttribute('data-f');
    if (isNaN(v)) v = C.fields['get:' + f] ? C.fields['get:' + f]() : 0;
    if (f === 'r' || f === 'pr') v = Math.round(v);
    stepTo(stp, v);
  });
  document.addEventListener('focusin', function (e) {
    if (e.target.classList && e.target.classList.contains('sv')) setTimeout(function () { try { e.target.select(); } catch (x) {} }, 0);
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.classList && e.target.classList.contains('sv')) e.target.blur(); });

  C.seg = function (setting, opts, cur, extra) {
    return '<div class="segs"' + (extra ? ' ' + extra : '') + '>' + opts.map(function (o) {
      return '<button type="button" data-set="' + setting + '" data-v="' + o[0] + '" class="' + (String(cur) === String(o[0]) ? 'on' : '') + '">' + o[1] + '</button>';
    }).join('') + '</div>';
  };

  /* ================= Avisos y pantalla de ascenso ================= */
  var notesEl = C.$('#top-notes'), modal = C.$('#modal');
  C.note = function (msg, ok) {
    var p = document.createElement('div');
    p.className = 'pill' + (ok ? ' ok' : ''); p.textContent = msg; notesEl.appendChild(p);
    setTimeout(function () { p.style.transition = 'opacity .3s'; p.style.opacity = '0'; setTimeout(function () { p.remove(); }, 320); }, 2600);
  };
  C.modal = modal;
  C.showModal = function (html, cls) {
    modal.className = 'modal' + (cls ? ' ' + cls : ''); modal.innerHTML = html; modal.hidden = false;
    C.mount(modal, 'modal');
  };
  C.closeModal = function () {
    modal.hidden = true; modal.innerHTML = ''; C.dropFigs('modal');
    var cb = C._after; C._after = null; if (cb) cb();
  };
  C.rankUp = function (ex, inf, done) {
    var T = C.tierOf(inf.lvl), conf = '', i, cols = [T.c, '#ffffff', '#ef4444', T.c];
    for (i = 0; i < 44; i++) {
      conf += '<s style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % 4] + ';animation-duration:' + (2.6 + Math.random() * 2.4).toFixed(2) +
        's;animation-delay:' + (Math.random() * 1.4).toFixed(2) + 's;transform:rotate(' + Math.round(Math.random() * 180) + 'deg)"></s>';
    }
    C._after = done || null;
    C.showModal('<div class="ru-glow"></div><div class="conf">' + conf + '</div><div class="ru-ring">' + C.thumb(ex, inf.lvl, 54) + '</div>' +
      '<div class="ru-eyebrow">» RANGO ASCENDIDO</div><div class="ru-name">' + C.lvlName(inf.lvl) + '</div><div class="ru-top">TOP ~' + TOP[inf.lvl] + '%</div>' +
      '<div class="ru-best"><span class="eyebrow">' + ex.name + ' · Mejor serie</span><b>' + C.setTxt(ex, inf.best.w, inf.best.r) + '</b></div>' +
      '<button class="btn ru-btn" data-act="ru-close">Continuar</button>', '');
    modal.style.setProperty('--tc', T.c);
    C.sfx('rankup'); C.vib([40, 60, 40, 60, 120]);
  };
  document.addEventListener('click', function (e) {
    var el = e.target.closest && e.target.closest('[data-act="ru-close"],[data-act="m-close"]');
    if (el) { C.sfx('tap'); C.closeModal(); }
  });

  /* ================= Guía técnica de un ejercicio ================= */
  C.guideHTML = function (ex) {
    var g = (R.GUIDE || {})[ex.id] || {}, h = '';
    if (g.mu) h += '<div class="mus">' + g.mu.map(function (m, i) { return '<span class="mu' + (i ? '' : ' main') + '">' + m + '</span>'; }).join('') + '</div>';
    h += '<div class="eyebrow gs">Cómo hacerlo</div><ul class="cues">' + ex.cues.map(function (c, i) { return '<li><span>' + (i + 1) + '</span>' + c + '</li>'; }).join('') + '</ul>';
    if (g.mis) h += '<div class="eyebrow gs">Errores comunes</div><ul class="cues bad">' + g.mis.map(function (c) { return '<li><span>✕</span>' + c + '</li>'; }).join('') + '</ul>';
    if (g.tip) h += '<div class="tipbox"><b>Consejo</b>' + g.tip + '</div>';
    return h;
  };

  /* ================= Pantalla siempre encendida ================= */
  var wl = null; C._wake = false;
  C.wake = function (on) {
    C._wake = !!on;
    if (on && C.st.s.wake && navigator.wakeLock) {
      navigator.wakeLock.request('screen').then(function (l) { wl = l; l.addEventListener('release', function () { if (wl === l) wl = null; }); }).catch(function () {});
    } else if (!on && wl) { try { wl.release(); } catch (e) {} wl = null; }
  };
  document.addEventListener('visibilitychange', function () { if (!document.hidden && C._wake && !wl) C.wake(true); });
})(window.RANGO);
