/* RANGO · planificador de sesiones, modo entrenamiento y resumen */
(function (R) {
  'use strict';
  var C = R.core, EX = R.EXERCISES, BYID = R.BYID, FOCUS = R.FOCUS, AUTO = R.AUTO, GROUPS = R.GROUPS;
  var W = R.workout = {}, $ = C.$, $$ = C.$$;
  var planEl = $('#plan'), playerEl = $('#player');
  var ORDER = ['push', 'pull', 'legs', 'upper', 'full', 'pecho', 'espalda', 'hombros', 'brazos', 'core'];
  var DURS = [30, 45, 60, 75, 90, 120];

  /* ================= Planificador ================= */
  function restSec() { return C.st.s.rest || 60; }
  function cost(sets) { return sets * (0.75 + restSec() / 60) + 1; }
  function setsFor(ex, minutes) { return ex.c && minutes > 40 ? 4 : 3; }

  W.focusDays = function (fid) {
    var last = C.lastByMuscle(), ms = FOCUS[fid].m, sum = 0, never = true, min = 999;
    ms.forEach(function (m) {
      var d = last[m] ? C.daysAgo(last[m]) : 30;
      if (last[m]) never = false;
      sum += d; if (d < min) min = d;
    });
    return { avg: sum / ms.length, never: never, min: min };
  };
  function autoRec() {
    var any = EX.some(function (e) { return C.st.logs[e.id]; });
    if (!any) return { focus: 'full', reason: 'Tu primer entrenamiento: cuerpo completo para empezar' };
    var best = null;
    AUTO.forEach(function (f) { var d = W.focusDays(f); if (!best || d.avg > best.avg + 1e-9) best = { f: f, avg: d.avg, never: d.never, min: d.min }; });
    var n = Math.round(best.avg), reason;
    if (best.never) reason = 'Todavía no has entrenado ' + FOCUS[best.f].sub.split(' · ')[0].toLowerCase();
    else if (best.min <= 0) reason = 'Hoy ya has entrenado, pero esto es lo que más toca';
    else reason = 'Llevas ' + n + (n === 1 ? ' día' : ' días') + ' sin entrenar ' + FOCUS[best.f].n.toLowerCase();
    return { focus: best.f, reason: reason };
  }
  W.recommend = function () {
    var P = R.PROGRAMS[C.st.s.program], dow = new Date().getDay(), r;
    if (P && P.map) {
      if (P.map[dow]) return { focus: P.map[dow], reason: 'Tu programa: ' + P.n, prog: true };
      r = autoRec(); r.rest = true; r.reason = 'Hoy es día de descanso en tu programa'; return r;
    }
    r = autoRec();
    if (C.streak() >= 5) { r.rest = true; r.reason = 'Llevas ' + C.streak() + ' días seguidos entrenando: hoy toca descansar'; }
    return r;
  };
  W.build = function (fid, minutes) {
    var F = FOCUS[fid], budget = minutes - 5, time = 0, used = {}, cnt = {}, out = [];
    for (var i = 0; i < F.slots.length; i++) {
      var m = F.slots[i];
      var cands = EX.filter(function (e) { return e.m === m && !used[e.id] && C.equipOk(e); });
      if (!cands.length) continue;
      var wantC = !cnt[m];
      cands.sort(function (a, b) {
        var ca = wantC && a.c ? 0 : 1, cb = wantC && b.c ? 0 : 1;
        if (ca !== cb) return ca - cb;
        var fa = C.isFav(a.id) ? 0 : 1, fb = C.isFav(b.id) ? 0 : 1;
        if (fa !== fb) return fa - fb;
        var la = C.lastOf(a.id), lb = C.lastOf(b.id);
        if (la !== lb) return la - lb;
        return EX.indexOf(a) - EX.indexOf(b);
      });
      var ex = cands[0], sets = setsFor(ex, minutes), c = cost(sets);
      if (time + c > budget + 1.5) { if (out.length >= 3) break; sets = 3; c = cost(3); }
      out.push({ id: ex.id, sets: sets }); used[ex.id] = 1; cnt[m] = (cnt[m] || 0) + 1; time += c;
      if (time >= budget) break;
    }
    return out;
  };
  W.estimate = function (list) { var t = 5; list.forEach(function (x) { t += cost(x.sets); }); return Math.round(t); };
  W.ensurePlan = function () {
    var p = C.st.plan, today = C.sod(Date.now());
    if (!p.list || !p.list.length || p.day !== today) {
      var rec = W.recommend();
      p.focus = rec.focus; p.dur = C.st.s.dur; p.list = W.build(p.focus, p.dur); p.day = today; p.routine = null; C.save();
    }
    return p;
  };
  W.suggest = function (ex, before) {
    var logs = (C.st.logs[ex.id] || []).filter(function (l) { return !before || l.t < before; });
    if (!logs.length) return { w: ex.def[0], r: Math.round((ex.reps[0] + ex.reps[1]) / 2), last: null };
    var last = logs[logs.length - 1], w = last.w, r = last.r;
    if (r >= ex.reps[1]) { w = last.w + ex.step; r = ex.reps[0]; }
    else r = Math.min(ex.reps[1], last.r + 1);
    return { w: w, r: r, last: last };
  };
  W.todayHTML = function () {
    var cur = C.st.cur;
    if (cur) {
      var ds = 0; cur.list.forEach(function (x) { ds += x.done.length; });
      return '<a class="today live" href="#/workout"><div class="eyebrow"><i class="dotlive"></i> Entrenamiento en curso</div><div class="t-name">' + FOCUS[cur.focus].n + '</div>' +
        '<div class="muted">' + C.clock(Date.now() - cur.t0) + ' · ' + ds + (ds === 1 ? ' serie hecha' : ' series hechas') + '</div><span class="btn" style="margin-top:16px">Continuar</span></a>';
    }
    var rec = W.recommend();
    if (rec.rest) return '<div class="today rest"><div class="eyebrow">Recuperación</div><div class="t-name">Día de descanso</div><div class="muted">' + rec.reason + '</div>' +
      '<div class="t-meta"><span>Recuperar también es entrenar</span></div><a class="btn ghost" href="#/plan">Entrenar igualmente</a></div>';
    var F = FOCUS[rec.focus], p = C.st.plan, n = (p.list && p.day === C.sod(Date.now()) && p.focus === rec.focus) ? p.list.length : W.build(rec.focus, C.st.s.dur).length;
    var dur = p.list && p.day === C.sod(Date.now()) ? p.dur : C.st.s.dur;
    return '<div class="today"><div class="eyebrow">Hoy te toca</div><div class="t-name">' + F.n + '</div><div class="muted">' + rec.reason + '</div>' +
      '<div class="t-meta"><span>' + dur + ' min</span><span>' + n + ' ejercicios</span><span>' + F.sub.split(' · ').slice(0, 3).join(' · ') + '</span></div>' +
      '<a class="btn" href="#/plan">Entrenar</a><a class="t-alt" href="#/plan">Elegir otro entrenamiento</a></div>';
  };

  /* ================= Pantalla del plan ================= */
  function planHTML() {
    var p = W.ensurePlan(), rec = W.recommend(), F = FOCUS[p.focus], est = W.estimate(p.list), sets = 0, h = '';
    p.list.forEach(function (x) { sets += x.sets; });
    h += '<div class="sh-scroll"><div class="sh-in"><div class="sh-top"><button class="icon-btn" data-act="w-back" aria-label="Volver">‹</button><div class="sh-title">Entrenamiento</div></div>';
    h += '<div class="plan-hero"><div class="eyebrow">' + (p.routine ? 'Tu rutina' : rec.rest ? 'Descanso recomendado' : p.focus === rec.focus ? 'Hoy te toca' : 'Tu elección') + '</div><div class="plan-name">' + (p.routine || F.n) + '</div>' +
      '<div class="muted">' + (p.routine ? 'Guardada por ti' : p.focus === rec.focus ? rec.reason : F.sub) + '</div></div>';
    h += '<h2><span>Elige otro</span><em>tú decides</em></h2><div class="chips">';
    ORDER.forEach(function (fid) {
      var d = W.focusDays(fid), tx = d.never ? 'sin hacer' : (d.min <= 0 ? 'hoy' : 'hace ' + Math.round(d.avg) + ' d');
      h += '<button class="chip' + (fid === p.focus ? ' on' : '') + '" data-focus="' + fid + '">' + (fid === rec.focus ? '★ ' : '') + FOCUS[fid].n + '<small>' + tx + '</small></button>';
    });
    h += '</div>';
    if (C.st.routines.length) {
      h += '<h2><span>Mis rutinas</span></h2><div class="chips">';
      C.st.routines.forEach(function (r) { h += '<span class="chip rtn' + (p.routine === r.name ? ' on' : '') + '"><button data-rt="' + r.id + '">' + r.name + '</button><button data-rtx="' + r.id + '" aria-label="Borrar rutina">✕</button></span>'; });
      h += '</div>';
    }
    h += '<h2><span>Duración</span><em class="num">≈ ' + est + ' min</em></h2><div class="chips dur">';
    DURS.forEach(function (d) { h += '<button class="chip' + (d === p.dur ? ' on' : '') + '" data-dur="' + d + '">' + (d === 90 ? '1 h 30' : d === 60 ? '1 h' : d === 120 ? '2 h' : d === 75 ? '1 h 15' : d + ' min') + '</button>'; });
    h += '</div><h2><span>Ejercicios</span><em class="num">' + p.list.length + ' · ' + sets + ' series</em></h2><div class="plist">';
    p.list.forEach(function (x, i) {
      var ex = BYID[x.id], inf = C.info(ex), sg = W.suggest(ex);
      h += '<div class="prow">' + C.thumb(ex, inf.lvl, 0, 'sm') + '<div class="pmid"><b>' + ex.name + '</b><span>' + ex.reps[0] + '–' + ex.reps[1] + ' reps · ' +
        (sg.last ? 'Última: ' + C.setTxt(ex, sg.last.w, sg.last.r) : 'Nuevo para ti') + '</span></div>' +
        '<div class="pbtns"><button data-pa="sets" data-i="' + i + '" class="pset" aria-label="Series">' + x.sets + '×</button>' +
        '<button data-pa="up" data-i="' + i + '" aria-label="Subir">↑</button><button data-pa="down" data-i="' + i + '" aria-label="Bajar">↓</button>' +
        '<button data-pa="swap" data-i="' + i + '" aria-label="Cambiar">⇄</button><button data-pa="rm" data-i="' + i + '" aria-label="Quitar">✕</button></div></div>';
    });
    if (!p.list.length) h += '<div class="empty">Sin ejercicios con tu equipo. Añade alguno o cambia el equipo en Ajustes.</div>';
    h += '</div><div class="duo"><button class="btn ghost sm" data-act="w-add">+ Añadir ejercicio</button><button class="btn ghost sm" data-act="w-save">Guardar rutina</button></div></div></div>' +
      '<div class="logbar"><div class="logbar-in"><button class="btn" data-act="w-start">Empezar entrenamiento</button></div></div>';
    return h;
  }
  function renderPlan() {
    var sc = $('.sh-scroll', planEl), top = sc ? sc.scrollTop : 0;
    C.dropFigs('plan'); planEl.innerHTML = planHTML(); C.mount(planEl, 'plan');
    var n = $('.sh-scroll', planEl); if (n) n.scrollTop = top;
  }
  W.openPlan = function () {
    renderPlan(); planEl.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () { planEl.classList.add('open'); }); });
  };
  W.closePlan = function () {
    if (!planEl.classList.contains('open')) return;
    planEl.classList.remove('open'); planEl.setAttribute('aria-hidden', 'true');
    if (!playerEl.classList.contains('open')) document.body.classList.remove('lock');
    setTimeout(function () { if (!planEl.classList.contains('open')) { C.dropFigs('plan'); planEl.innerHTML = ''; } }, 380);
  };

  function swapEx(i) {
    var p = C.st.plan, ex = BYID[p.list[i].id], inList = {};
    p.list.forEach(function (x) { inList[x.id] = 1; });
    var c = EX.filter(function (e) { return e.m === ex.m && !inList[e.id] && C.equipOk(e); });
    if (!c.length) c = EX.filter(function (e) { return e.group === ex.group && !inList[e.id] && C.equipOk(e); });
    if (!c.length) { C.note('No hay más alternativas'); return; }
    var idx = EX.indexOf(ex), next = c.filter(function (e) { return EX.indexOf(e) > idx; })[0] || c[0];
    p.list[i] = { id: next.id, sets: p.list[i].sets }; C.save();
  }

  /* ================= Selector de ejercicios ================= */
  var pickGroup = 'todos', pickCb = null;
  function pickHTML() {
    var inList = {}, list = pickCb.list();
    list.forEach(function (x) { inList[x.id] = 1; });
    var h = '<div class="mbox wide"><h3>Añadir ejercicio</h3><div class="chips sm">' +
      [['todos', 'Todos']].concat(GROUPS.map(function (g) { return [g.id, g.n]; })).map(function (g) {
        return '<button class="chip' + (pickGroup === g[0] ? ' on' : '') + '" data-pick-g="' + g[0] + '">' + g[1] + '</button>';
      }).join('') + '</div><div class="plist pick">';
    EX.filter(function (e) { return !inList[e.id] && (pickGroup === 'todos' || C.groupOf(e.m) === pickGroup); }).forEach(function (ex) {
      h += '<button class="prow pk" data-add="' + ex.id + '">' + C.thumb(ex, C.info(ex).lvl, 0, 'sm') + '<div class="pmid"><b>' + ex.name + '</b><span>' + ex.group + ' · ' + R.EQUIP.filter(function (q) { return q.id === ex.eq; })[0].n + '</span></div><span class="plus">+</span></button>';
    });
    return h + '</div><button class="btn ghost sm" data-act="m-close" style="margin-top:12px">Cerrar</button></div>';
  }
  function openPick(cb) {
    pickCb = cb; pickGroup = 'todos'; C.showModal(pickHTML(), 'plain top');
  }

  /* ================= Modo entrenamiento ================= */
  var cur = null, timer = null, lastTick = -1;
  W.summary = null;
  function exOf() { return BYID[cur.list[cur.i].id]; }
  function warmLeft(it) { return !!(it.wu && it.wd < it.wu.length && !it.done.length); }
  function loadInputs() {
    var it0 = cur.list[cur.i];
    if (warmLeft(it0)) { cur.w = it0.wu[it0.wd].w; cur.r = it0.wu[it0.wd].r; return; }
    var ex = exOf(), sg = W.suggest(ex, cur.t0);
    cur.w = sg.w; cur.r = sg.r;
  }
  function done(it) { return it.done.length >= it.sets; }
  function nextIndex(from) {
    var n = cur.list.length, j;
    for (j = from + 1; j < n; j++) if (!cur.list[j].skip && !done(cur.list[j])) return j;
    for (j = 0; j < from; j++) if (!cur.list[j].skip && !done(cur.list[j])) return j;
    return -1;
  }

  W.start = function () {
    var p = W.ensurePlan();
    if (!p.list.length) { C.note('Añade al menos un ejercicio'); return; }
    cur = C.st.cur = { id: 'w' + Date.now(), t0: Date.now(), focus: p.focus, dur: p.dur,
      list: p.list.map(function (x) { return { id: x.id, sets: x.sets, done: [], skip: false }; }),
      i: 0, s: 0, phase: 'work', restEnd: 0, restTotal: 0, vol: 0, prs: 0, ups: [], ach: [], w: 0, r: 8 };
    var seen = {};
    cur.title = p.routine || FOCUS[p.focus].n;
    cur.list.forEach(function (it) {
      var ex = BYID[it.id]; it.wd = 0; it.wu = [];
      if (C.st.s.warm && ex.c && !ex.bw && !seen[ex.m]) {
        var sg = W.suggest(ex);
        if (sg.w >= 30) it.wu = [{ w: Math.max(20, Math.round(sg.w * 0.5 / ex.step) * ex.step), r: 8 }, { w: Math.round(sg.w * 0.75 / ex.step) * ex.step, r: 4 }];
      }
      if (ex.c && !ex.bw) seen[ex.m] = 1;
    });
    loadInputs(); C.save(); C.sfx('start'); location.hash = '/workout';
  };

  function playerHTML() {
    var it = cur.list[cur.i], ex = BYID[it.id], inf = C.info(ex), rest = cur.phase === 'rest', n = cur.list.length, h = '';
    var sg = W.suggest(ex, cur.t0), step = C.st.s.unit === 'lb' ? 5 : ex.step;
    var minW = ex.bw > 0 ? -Math.floor(C.toD(ex.bw * C.st.s.bw) * 0.9) : 0;
    h += '<div class="pl"><div class="pl-top"><button class="icon-btn" data-pa="menu" aria-label="Menú">✕</button>' +
      '<div class="pl-mid"><b>' + (cur.title || FOCUS[cur.focus].n) + '</b><span id="pl-el" class="num">' + C.clock(Date.now() - cur.t0) + '</span></div>' +
      '<button class="icon-btn" data-pa="list" aria-label="Lista de ejercicios">☰</button></div><div class="pl-bar">';
    cur.list.forEach(function (x, j) { h += '<i class="' + (done(x) ? 'd' : x.skip ? 's' : j === cur.i ? 'c' : '') + '"></i>'; });
    h += '</div><div class="pl-body"><div class="pl-fig">' + C.thumb(ex, inf.lvl, 36) + '</div><div class="pl-name">' + ex.name + '</div>';
    var warm = warmLeft(it);
    h += '<div class="pl-meta">' + (rest && cur.s === 0 && !warm ? 'Siguiente ejercicio' : 'Ejercicio ' + (cur.i + 1) + ' de ' + n) + ' · ' +
      (warm ? 'Calentamiento ' + (it.wd + 1) + ' de ' + it.wu.length : 'Serie ' + (it.done.length + 1) + ' de ' + it.sets + ' · ' + ex.reps[0] + '–' + ex.reps[1] + ' reps') + '</div>';
    if (warm && !rest) h += '<div class="pl-last warm">Peso ligero · no cuenta para tu rango</div>';
    if (rest) {
      var left = Math.max(0, Math.ceil((cur.restEnd - Date.now()) / 1000));
      h += '<div class="rest-panel"><div class="rr"><svg viewBox="0 0 120 120"><circle class="rbg" cx="60" cy="60" r="54"/><circle class="rfg" id="rfg" cx="60" cy="60" r="54" transform="rotate(-90 60 60)" stroke-dasharray="339.3" stroke-dashoffset="0"/></svg>' +
        '<div class="rt"><b id="rt" class="num">' + Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2) + '</b><span>descanso</span></div></div>' +
        '<div class="rbtn"><button data-pa="rminus">−15 s</button><button data-pa="rplus">+15 s</button></div></div>';
    } else if (sg.last && !warm) {
      h += '<div class="pl-last">Última vez: ' + C.setTxt(ex, sg.last.w, sg.last.r) + '</div>';
    }
    h += '<div class="logrow"><div class="fld"><div class="lbl">' + (ex.bw > 0 ? 'Lastre' : 'Peso') + ' (' + C.st.s.unit + ')</div>' + C.stepper('pw', C.fmt(C.toD(cur.w), 2), step, minW, 1000) + '</div>' +
      '<div class="fld"><div class="lbl">Repeticiones</div>' + C.stepper('pr', cur.r, 1, 1, 100) + '</div></div>';
    if (ex.bw > 0) h += '<div class="hint">0 = solo tu peso corporal · negativo = asistencia</div>';
    h += '<div class="sdots">';
    for (var k = 0; k < it.sets; k++) h += '<i class="' + (k < it.done.length ? 'd' : (!rest && k === it.done.length ? 'c' : '')) + '"></i>';
    h += '</div></div><div class="pl-foot">' +
      (rest ? '<button class="btn" data-pa="rskip">Saltar descanso</button>' : '<button class="btn" data-pa="done">' + (warm ? 'Calentamiento hecho ✓' : 'Serie hecha ✓') + '</button>') +
      '<div class="pl-sec"><button data-pa="skip">Saltar</button><button data-pa="how">Técnica</button>' + (cur.last ? '<button data-pa="undo">Deshacer</button>' : '') + '</div></div></div>';
    return h;
  }
  function renderPlayer() {
    if (!cur) return;
    C.dropFigs('player'); playerEl.innerHTML = playerHTML(); C.mount(playerEl, 'player'); lastTick = -1; tick();
  }
  C.fields.pw = function (v) { if (cur) { cur.w = C.fromD(v); C.save(); } };
  C.fields.pr = function (v) { if (cur) { cur.r = Math.round(v); C.save(); } };
  C.fields['get:pw'] = function () { return cur ? C.toD(cur.w) : 0; };
  C.fields['get:pr'] = function () { return cur ? cur.r : 8; };

  function tick() {
    if (!cur) return;
    var now = Date.now(), el = $('#pl-el', playerEl);
    if (el) el.textContent = C.clock(now - cur.t0);
    if (cur.phase === 'rest') {
      var left = Math.ceil((cur.restEnd - now) / 1000), rt = $('#rt', playerEl), rf = $('#rfg', playerEl);
      if (left < 0) left = 0;
      if (rt) rt.textContent = Math.floor(left / 60) + ':' + ('0' + left % 60).slice(-2);
      if (rf) rf.setAttribute('stroke-dashoffset', (339.3 * (1 - C.clamp((cur.restEnd - now) / (cur.restTotal * 1000), 0, 1))).toFixed(1));
      if (left !== lastTick) { lastTick = left; if (left > 0 && left <= 3) { C.sfx('tick'); C.vib(15); } }
      if (cur.restEnd - now <= 0) endRest(true);
    }
  }
  function endRest(auto) {
    if (!cur || cur.phase !== 'rest') return;
    cur.phase = 'work'; C.save();
    if (auto) { C.sfx('go'); C.vib([200, 100, 200]); }
    renderPlayer();
  }
  function restFor(ex) { var b = C.st.s.rest; if (!b) return 0; return C.st.s.autorest ? (ex.c ? 120 : 60) : b; }
  function startRest(sec) {
    var r = sec === undefined ? C.st.s.rest : sec;
    if (!r) { cur.phase = 'work'; C.save(); renderPlayer(); return; }
    cur.phase = 'rest'; cur.restTotal = r; cur.restEnd = Date.now() + r * 1000; C.save(); renderPlayer();
  }

  function doneSet() {
    if (!cur || cur.phase !== 'work') return;
    var it = cur.list[cur.i], ex = BYID[it.id], w = cur.w, r = Math.round(cur.r);
    if (!(r >= 1) || isNaN(w)) { C.note('Revisa el peso y las repeticiones'); return; }
    if (warmLeft(it)) { it.wd++; C.sfx('step'); C.vib(12); loadInputs(); startRest(C.st.s.rest ? 30 : 0); return; }
    if (ex.bw * C.st.s.bw + w <= 0) { C.note('La asistencia no puede superar tu peso corporal'); return; }
    var res = C.logSet(ex, w, r);
    it.done.push({ w: w, r: r, t: Date.now() }); cur.vol += C.setVol(ex, w, r); if (res.pr) cur.prs++;
    cur.last = { i: cur.i, w: w, r: r, up: res.up, pr: res.pr, vol: C.setVol(ex, w, r) };
    var fresh = C.checkAch(); fresh.forEach(function (a) { cur.ach.push(a.id); });
    C.save();
    var fin = done(it), proceed = function () {
      if (fin) {
        var j = nextIndex(cur.i);
        if (j < 0) { finish(); return; }
        cur.i = j; cur.s = cur.list[j].done.length; loadInputs();
      } else cur.s = it.done.length;
      startRest(restFor(ex));
    };
    if (res.up) { cur.ups.push({ id: ex.id, lvl: res.after.lvl }); C.save(); C.rankUp(ex, res.after, proceed); }
    else {
      C.sfx(res.pr ? 'pr' : 'set'); C.vib(18);
      if (res.pr && res.before.has) C.note('¡Nuevo récord! ' + C.setTxt(ex, w, r), true);
      proceed();
    }
  }
  function undoLast() {
    var L = cur && cur.last; if (!L) return;
    var it = cur.list[L.i], ex = BYID[it.id], logs = C.st.logs[ex.id];
    if (!logs || !logs.length || !it.done.length) { cur.last = null; renderPlayer(); return; }
    C.deleteSet(ex, logs.length - 1); it.done.pop(); cur.vol = Math.max(0, cur.vol - L.vol);
    if (L.pr) cur.prs = Math.max(0, cur.prs - 1);
    if (L.up) { cur.ups.pop(); C.st.ups.pop(); }
    cur.last = null; it.skip = false; cur.i = L.i; cur.s = it.done.length; cur.phase = 'work'; cur.w = L.w; cur.r = L.r;
    C.save(); renderPlayer(); C.note('Serie deshecha');
  }
  function skipEx() {
    var it = cur.list[cur.i]; it.skip = true;
    var j = nextIndex(cur.i);
    if (j < 0) { finish(); return; }
    cur.i = j; cur.s = cur.list[j].done.length; cur.phase = 'work'; loadInputs(); C.save(); renderPlayer();
  }
  function jumpTo(j) {
    var it = cur.list[j]; if (done(it)) { C.note('Ese ejercicio ya está completo'); return; }
    it.skip = false; cur.i = j; cur.s = it.done.length; cur.phase = 'work'; loadInputs(); C.save(); C.closeModal(); renderPlayer();
  }

  function finish() {
    var sets = 0; cur.list.forEach(function (x) { sets += x.done.length; });
    if (!sets) { discard(true); return; }
    var t1 = Date.now(), exs = cur.list.filter(function (x) { return x.done.length; }).map(function (x) { return x.id; });
    var sess = { id: cur.id, t0: cur.t0, t1: t1, focus: cur.focus, sets: sets, vol: Math.round(cur.vol), exs: exs, ups: cur.ups.length, prs: cur.prs };
    C.st.sessions.push(sess); C.st.cur = null; C.st.plan = { focus: null, dur: null, list: null, day: 0 }; C.save();
    var fresh = C.checkAch(); fresh.forEach(function (a) { cur.ach.push(a.id); });
    W.summary = { sess: sess, list: cur.list, ups: cur.ups, ach: cur.ach.slice() };
    cur = null; stopTimer(); C.wake(false); C.sfx('finish'); C.vib([60, 80, 60, 80, 200]);
    C.closeModal(); renderSummary();
  }
  function discard(silent) {
    if (!silent && !confirm('¿Descartar este entrenamiento? Las series ya guardadas se mantienen en tu historial.')) return;
    cur = null; C.st.cur = null; C.save(); stopTimer(); C.wake(false); C.closeModal(); W.closePlayer(); location.hash = '/';
  }

  function summaryHTML() {
    var S = W.summary, s = S.sess, h = '', mins = Math.max(1, Math.round((s.t1 - s.t0) / 60000));
    h += '<div class="sum"><div class="sum-hero"><div class="sum-ic"><svg viewBox="0 0 24 24" width="38" height="38" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12.5l4.5 4.5L19 7.5"/></svg></div>' +
      '<h1>¡Entrenamiento completado!</h1><p class="muted">' + FOCUS[s.focus].n + ' · ' + C.dateShort(s.t1) + '</p></div>' +
      '<div class="sum-grid"><div><span class="eyebrow">Duración</span><b class="num">' + mins + ' min</b></div><div><span class="eyebrow">Series</span><b class="num">' + s.sets + '</b></div>' +
      '<div><span class="eyebrow">Volumen</span><b class="num">' + C.fmt(C.toD(s.vol), 0) + ' ' + C.st.s.unit + '</b></div><div><span class="eyebrow">Ejercicios</span><b class="num">' + s.exs.length + '</b></div></div>';
    if (S.ups.length) {
      h += '<h2><span>Rangos conseguidos</span></h2><div class="card p" style="margin-top:0">';
      S.ups.forEach(function (u) { var ex = BYID[u.id]; h += '<div class="sumrow">' + C.badge(u.lvl, 26) + '<b>' + ex.name + '</b><span style="color:' + C.tierOf(u.lvl).c + '">' + C.lvlName(u.lvl) + '</span></div>'; });
      h += '</div>';
    }
    if (s.prs) h += '<div class="card p sumnote">🔥 ' + s.prs + (s.prs === 1 ? ' récord personal' : ' récords personales') + '</div>';
    if (S.ach.length) {
      h += '<h2><span>Logros nuevos</span></h2><div class="card p" style="margin-top:0">';
      S.ach.forEach(function (id) { var a = C.ACH.filter(function (x) { return x.id === id; })[0]; if (a) h += '<div class="sumrow"><span class="medal">★</span><b>' + a.n + '</b><span class="muted">' + a.d + '</span></div>'; });
      h += '</div>';
    }
    h += '<h2><span>Resumen</span></h2><div class="card p" style="margin-top:0">';
    S.list.forEach(function (x) {
      if (!x.done.length) return;
      var ex = BYID[x.id];
      h += '<div class="sumex"><b>' + ex.name + '</b><span>' + x.done.map(function (d) { return ex.bw > 0 && Math.abs(d.w) < 0.01 ? 'PC×' + d.r : C.fmt(C.toD(d.w), 1) + '×' + d.r; }).join(' · ') + '</span></div>';
    });
    return h + '</div><div class="duo" style="margin-top:20px"><button class="btn ghost" data-pa="share">Compartir</button><button class="btn" data-pa="sumdone">Listo</button></div></div>';
  }
  function renderSummary() {
    C.dropFigs('player'); playerEl.innerHTML = '<div class="sh-scroll"><div class="sh-in">' + summaryHTML() + '</div></div>';
    var sc = $('.sh-scroll', playerEl); if (sc) sc.scrollTop = 0;
  }

  function shareSummary() {
    var S = W.summary; if (!S) return;
    var s = S.sess, mins = Math.max(1, Math.round((s.t1 - s.t0) / 60000));
    var txt = 'Entreno de ' + FOCUS[s.focus].n + ' en Rango: ' + mins + ' min · ' + s.sets + ' series · ' + C.fmt(C.toD(s.vol), 0) + ' ' + C.st.s.unit + ' de volumen' +
      (s.prs ? ' · ' + s.prs + ' récord' + (s.prs > 1 ? 's' : '') : '') + S.ups.map(function (u) { return '\n🏆 ' + BYID[u.id].name + ': ' + C.lvlName(u.lvl); }).join('');
    if (navigator.share) navigator.share({ text: txt }).catch(function () {});
    else if (navigator.clipboard) navigator.clipboard.writeText(txt).then(function () { C.note('Resumen copiado', true); }, function () { C.note('No se pudo copiar'); });
  }
  function stopTimer() { if (timer) clearInterval(timer); timer = null; }
  W.openPlayer = function () {
    if (W.summary) { renderSummary(); } else {
      cur = C.st.cur;
      if (!cur) return false;
      if (cur.phase === 'rest' && cur.restEnd - Date.now() <= 0) cur.phase = 'work';
      renderPlayer(); stopTimer(); timer = setInterval(tick, 250); C.wake(true);
    }
    playerEl.setAttribute('aria-hidden', 'false'); document.body.classList.add('lock');
    requestAnimationFrame(function () { requestAnimationFrame(function () { playerEl.classList.add('open'); }); });
    return true;
  };
  W.closePlayer = function () {
    if (!playerEl.classList.contains('open')) return;
    playerEl.classList.remove('open'); playerEl.setAttribute('aria-hidden', 'true'); stopTimer();
    if (!planEl.classList.contains('open')) document.body.classList.remove('lock');
    if (!C.st.cur) C.wake(false);
    setTimeout(function () { if (!playerEl.classList.contains('open')) { C.dropFigs('player'); playerEl.innerHTML = ''; } }, 380);
  };

  function listModal() {
    var h = '<div class="mbox wide"><h3>Tu entrenamiento</h3><p>Toca un ejercicio para hacerlo ahora.</p><div class="plist pick">';
    cur.list.forEach(function (x, j) {
      var ex = BYID[x.id], st = done(x) ? '✓ Completo' : x.skip ? 'Saltado' : x.done.length + '/' + x.sets + ' series';
      h += '<button class="prow pk' + (j === cur.i ? ' now' : '') + '" data-jump="' + j + '">' + C.thumb(ex, C.info(ex).lvl, 0, 'sm') + '<div class="pmid"><b>' + ex.name + '</b><span>' + st + '</span></div></button>';
    });
    return h + '</div><button class="btn ghost sm" data-act="w-add-now" style="margin-top:10px">+ Añadir ejercicio</button><button class="btn ghost sm" data-act="m-close" style="margin-top:8px">Cerrar</button></div>';
  }

  /* ================= Eventos ================= */
  document.addEventListener('click', function (e) {
    var t = e.target, el, p = C.st.plan;
    if ((el = t.closest('[data-focus]'))) {
      C.sfx('tap'); p.routine = null; p.focus = el.getAttribute('data-focus'); p.list = W.build(p.focus, p.dur); C.save(); renderPlan(); return;
    }
    if ((el = t.closest('[data-dur]'))) {
      C.sfx('tap'); p.routine = null; p.dur = +el.getAttribute('data-dur'); p.list = W.build(p.focus, p.dur); C.save(); renderPlan(); return;
    }
    if ((el = t.closest('[data-rt]'))) {
      var rt = C.st.routines.filter(function (r) { return r.id === el.getAttribute('data-rt'); })[0];
      if (rt) { C.sfx('tap'); p.list = rt.list.map(function (x) { return { id: x.id, sets: x.sets }; }); p.routine = rt.name; C.save(); renderPlan(); }
      return;
    }
    if ((el = t.closest('[data-rtx]'))) {
      if (confirm('¿Borrar esta rutina?')) { var rid = el.getAttribute('data-rtx'); C.st.routines = C.st.routines.filter(function (r) { return r.id !== rid; }); C.save(); renderPlan(); }
      return;
    }
    if ((el = t.closest('[data-pick-g]'))) { pickGroup = el.getAttribute('data-pick-g'); C.$('.mbox.wide', C.modal).outerHTML = pickHTML(); C.mount(C.modal, 'modal'); return; }
    if ((el = t.closest('[data-add]'))) {
      C.sfx('tap'); var id = el.getAttribute('data-add'); C.closeModal(); pickCb.add(id); return;
    }
    if ((el = t.closest('[data-jump]'))) { jumpTo(+el.getAttribute('data-jump')); return; }
    if ((el = t.closest('[data-pa]'))) {
      var a = el.getAttribute('data-pa'), i = +el.getAttribute('data-i');
      if (planEl.classList.contains('open') && !playerEl.classList.contains('open') && /^(up|down|swap|rm|sets)$/.test(a)) {
        C.sfx('tap');
        if (a === 'up' && i > 0) { var x = p.list[i]; p.list[i] = p.list[i - 1]; p.list[i - 1] = x; }
        else if (a === 'down' && i < p.list.length - 1) { var y = p.list[i]; p.list[i] = p.list[i + 1]; p.list[i + 1] = y; }
        else if (a === 'rm') p.list.splice(i, 1);
        else if (a === 'sets') p.list[i].sets = p.list[i].sets >= 6 ? 2 : p.list[i].sets + 1;
        else if (a === 'swap') swapEx(i);
        C.save(); renderPlan(); return;
      }
      if (!cur && a !== 'sumdone' && a !== 'share') return;
      C.sfx('tap');
      if (a === 'done') doneSet();
      else if (a === 'rskip') endRest(false);
      else if (a === 'rplus') { cur.restEnd += 15000; cur.restTotal += 15; C.save(); }
      else if (a === 'rminus') { cur.restEnd -= 15000; cur.restTotal = Math.max(5, cur.restTotal - 15); C.save(); }
      else if (a === 'skip') skipEx();
      else if (a === 'undo') undoLast();
      else if (a === 'share') shareSummary();
      else if (a === 'how') {
        var ex = exOf();
        C.showModal('<div class="mbox wide"><h3>' + ex.name + '</h3>' + C.guideHTML(ex) +
          '<button class="btn ghost sm" data-act="m-close" style="margin-top:14px">Entendido</button></div>', 'plain');
      }
      else if (a === 'list') C.showModal(listModal(), 'plain top');
      else if (a === 'menu') C.showModal('<div class="mbox"><h3>Entrenamiento</h3><p>¿Qué quieres hacer?</p><div class="actions" style="margin:0">' +
        '<button class="btn sm" data-act="m-close">Continuar entrenando</button><button class="btn ghost sm" data-act="w-finish">Terminar y ver resumen</button>' +
        '<button class="btn danger sm" data-act="w-discard">Descartar entrenamiento</button></div></div>', 'plain');
      else if (a === 'sumdone') { W.summary = null; W.closePlayer(); location.hash = '/'; }
      return;
    }
    if ((el = t.closest('[data-act]'))) {
      var act = el.getAttribute('data-act');
      if (act === 'w-start') W.start();
      else if (act === 'w-back') { location.hash = '/'; }
      else if (act === 'w-add') { C.sfx('tap'); openPick({ list: function () { return C.st.plan.list; }, add: function (id) { C.st.plan.list.push({ id: id, sets: BYID[id].c ? 4 : 3 }); C.save(); renderPlan(); } }); }
      else if (act === 'w-add-now') { C.closeModal(); openPick({ list: function () { return cur.list; }, add: function (id) { cur.list.push({ id: id, sets: BYID[id].c ? 3 : 3, done: [], skip: false }); C.save(); C.note('Ejercicio añadido', true); } }); }
      else if (act === 'w-save') {
        var nm = prompt('Nombre de la rutina', p.routine || FOCUS[p.focus].n);
        if (nm && nm.trim() && p.list.length) {
          nm = nm.trim().slice(0, 30);
          C.st.routines = C.st.routines.filter(function (r) { return r.name !== nm; });
          C.st.routines.push({ id: 'r' + Date.now(), name: nm, list: p.list.map(function (x) { return { id: x.id, sets: x.sets }; }) });
          if (C.st.routines.length > 20) C.st.routines.shift();
          p.routine = nm; C.save(); C.sfx('set'); C.note('Rutina guardada', true); renderPlan();
        }
      }
      else if (act === 'w-finish') finish();
      else if (act === 'w-discard') discard(false);
    }
  });
  document.addEventListener('visibilitychange', function () { if (!document.hidden && cur && playerEl.classList.contains('open')) tick(); });
})(window.RANGO);
