/* RANGO · motor de figuras animadas (SVG) */
(function (R) {
  'use strict';
  var D = Math.PI / 180;
  var L = { torso: 40, uarm: 25, farm: 25, thigh: 34, shin: 33, foot: 11, neck: 18, head: 10.5 };
  var SEGW = { thigh: 12.5, shin: 10, foot: 7, torso: 14.5, uarm: 9.5, farm: 8.5 };
  var FAR = [-3.2, 0.6];

  function mixv(a, b, s) {
    if (typeof a === 'number') return a + (b - a) * s;
    return [a[0] + (b[0] - a[0]) * s, a[1] + (b[1] - a[1]) * s];
  }
  function mix(A, B, s) {
    var o = {};
    for (var k in A) o[k] = (B[k] === undefined) ? A[k] : mixv(A[k], B[k], s);
    return o;
  }
  function ease(x) { return 0.5 - 0.5 * Math.cos(Math.PI * x); }
  function shape(ph) {
    if (ph < 0.10) return 0;
    if (ph < 0.48) return ease((ph - 0.10) / 0.38);
    if (ph < 0.58) return 1;
    if (ph < 0.96) return 1 - ease((ph - 0.58) / 0.38);
    return 0;
  }

  function ik(Rt, E, l1, l2, pref) {
    var dx = E[0] - Rt[0], dy = E[1] - Rt[1], d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
    var maxd = l1 + l2 - 0.01, mind = Math.abs(l1 - l2) + 0.5, ux = dx / d, uy = dy / d;
    if (d > maxd) d = maxd;
    if (d < mind) d = mind;
    var end = [Rt[0] + ux * d, Rt[1] + uy * d];
    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d), h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    var mx = Rt[0] + ux * a, my = Rt[1] + uy * a;
    var k1 = [mx - uy * h, my + ux * h], k2 = [mx + uy * h, my - ux * h];
    var s1 = (k1[0] - mx) * pref[0] + (k1[1] - my) * pref[1], s2 = (k2[0] - mx) * pref[0] + (k2[1] - my) * pref[1];
    return { mid: s1 >= s2 ? k1 : k2, end: end };
  }
  function vec(p, ang, len) { return [p[0] + len * Math.cos(ang * D), p[1] + len * Math.sin(ang * D)]; }

  function solve(a, P) {
    var tor = P.tor * D, dx = Math.cos(tor), dy = Math.sin(tor), hip, sh, lg, ank, knee;
    if (P.hip) { hip = P.hip; sh = [hip[0] + L.torso * dx, hip[1] + L.torso * dy]; }
    else { sh = P.sh; hip = [sh[0] - L.torso * dx, sh[1] - L.torso * dy]; }
    if (P.th !== undefined) {
      knee = vec(hip, P.th, L.thigh); ank = vec(knee, P.sn, L.shin);
    } else {
      if (P.ank) ank = P.ank;
      else ank = vec(hip, P.legDir, (L.thigh + L.shin) * 0.997);
      lg = ik(hip, ank, L.thigh, L.shin, a.kneePref); knee = lg.mid; ank = lg.end;
    }
    var toe = vec(ank, P.ft || 0, L.foot), far = null;
    if (P.ank2) {
      var l2 = ik(hip, P.ank2, L.thigh, L.shin, a.kneePref2 || a.kneePref);
      far = { knee: l2.mid, ank: l2.end, toe: vec(l2.end, P.ft2 || 0, L.foot) };
    }
    var elbow, hand, target;
    if (P.ua !== undefined) {
      elbow = vec(sh, P.ua, L.uarm); hand = vec(elbow, P.fa, L.farm);
    } else {
      target = P.hand || (P.hh ? [hip[0] + P.hh[0], hip[1] + P.hh[1]] : [sh[0] + P.handRel[0], sh[1] + P.handRel[1]]);
      var ar = ik(sh, target, L.uarm, L.farm, a.elbowPref);
      elbow = ar.mid; hand = ar.end;
    }
    var hd = [Math.cos(tor), Math.sin(tor)];
    return { hip: hip, sh: sh, knee: knee, ank: ank, toe: toe, far: far, elbow: elbow, hand: hand, hd: hd,
      head: [sh[0] + L.neck * hd[0], sh[1] + L.neck * hd[1]] };
  }

  function bounds(ex) {
    var a = ex.anim, minx = 1e9, miny = 1e9, maxx = -1e9, maxy = -1e9;
    function add(p, r) {
      r = r || 0;
      if (p[0] - r < minx) minx = p[0] - r; if (p[0] + r > maxx) maxx = p[0] + r;
      if (p[1] - r < miny) miny = p[1] - r; if (p[1] + r > maxy) maxy = p[1] + r;
    }
    for (var i = 0; i <= 8; i++) {
      var J = solve(a, mix(a.poses[0], a.poses[1], i / 8));
      add(J.hip, 7); add(J.sh, 7); add(J.knee, 5); add(J.ank, 4); add(J.toe, 4); add(J.elbow, 5);
      add(J.hand, a.prop === 'plate' && a.propAt !== 'ank' ? (a.plateR || 13) : 4); add(J.head, L.head + 1);
      if (a.propAt === 'ank') add(J.ank, a.plateR || 8);
      if (J.far) { add(J.far.knee, 5); add(J.far.ank, 4); add(J.far.toe, 4); }
    }
    var sb = R.SCENEBOX[a.scene];
    if (sb) { add([sb[0], sb[1]]); add([sb[2], sb[3]]); }
    return { x: (minx + maxx) / 2, y: (miny + maxy) / 2, w: maxx - minx, h: maxy - miny };
  }

  function setLine(el, p, q) {
    el.setAttribute('x1', p[0].toFixed(1)); el.setAttribute('y1', p[1].toFixed(1));
    el.setAttribute('x2', q[0].toFixed(1)); el.setAttribute('y2', q[1].toFixed(1));
  }

  function create(exId) {
    var ex = R.BYID[exId], a = ex.anim, b = bounds(ex);
    var sc = Math.min(1.5, 146 / b.w, 146 / b.h);
    var tf = 'translate(100 100) scale(' + sc.toFixed(3) + ') translate(' + (-b.x).toFixed(1) + ' ' + (-b.y).toFixed(1) + ')';
    var html = '<svg class="fig" viewBox="0 0 200 200" aria-hidden="true" focusable="false"><g transform="' + tf + '">' +
      '<path class="sc" d="M-60 169.5H260"/>' + (R.SCENES[a.scene] || '') + '<line class="cab"/>' +
      '<line class="seg far f-thigh" stroke-width="' + SEGW.thigh + '"/><line class="seg far f-shin" stroke-width="' + SEGW.shin + '"/><line class="seg far f-foot" stroke-width="' + SEGW.foot + '"/>' +
      '<line class="seg far f-uarm" stroke-width="' + SEGW.uarm + '"/><line class="seg far f-farm" stroke-width="' + SEGW.farm + '"/>' +
      '<line class="seg s-shin" stroke-width="' + SEGW.shin + '"/><line class="seg s-foot" stroke-width="' + SEGW.foot + '"/><line class="seg s-thigh" stroke-width="' + SEGW.thigh + '"/>' +
      '<line class="seg s-torso" stroke-width="' + SEGW.torso + '"/><line class="seg s-uarm" stroke-width="' + SEGW.uarm + '"/><line class="seg s-farm" stroke-width="' + SEGW.farm + '"/>' +
      '<line class="hl h0"/><line class="hl h1"/><line class="hl h2"/>' +
      '<circle class="head" r="' + L.head + '"/><line class="band"/>' +
      '<line class="pf"/><circle class="pl" r="' + (a.plateR || 13) + '"/><circle class="hub" r="3.4"/></g></svg>';
    var w = document.createElement('div'); w.innerHTML = html;
    var svg = w.firstChild, q = function (c) { return svg.querySelector('.' + c); };
    var inst = {
      ex: ex, svg: svg, vis: true, off: 0,
      seg: { thigh: q('s-thigh'), shin: q('s-shin'), foot: q('s-foot'), torso: q('s-torso'), uarm: q('s-uarm'), farm: q('s-farm') },
      far: { thigh: q('f-thigh'), shin: q('f-shin'), foot: q('f-foot'), uarm: q('f-uarm'), farm: q('f-farm') },
      hl: [q('h0'), q('h1'), q('h2')], head: q('head'), band: q('band'), pl: q('pl'), hub: q('hub'), cab: q('cab'), pf: q('pf')
    };
    svg.__fig = inst;
    if (a.prop !== 'plate' && a.prop !== 'cable') { inst.pl.style.display = 'none'; inst.hub.style.display = 'none'; }
    if (a.prop !== 'cable') inst.cab.style.display = 'none';
    if (a.prop !== 'platform') inst.pf.style.display = 'none';
    return inst;
  }

  function draw(inst, t) {
    var ex = inst.ex, a = ex.anim, dur = a.dur || 3.4;
    var ph = (((t + inst.off) / dur) % 1 + 1) % 1;
    var P = mix(a.poses[0], a.poses[1], shape(ph)), J = solve(a, P), s = inst.seg, f = inst.far;
    setLine(s.thigh, J.hip, J.knee); setLine(s.shin, J.knee, J.ank); setLine(s.foot, J.ank, J.toe);
    setLine(s.torso, J.hip, J.sh); setLine(s.uarm, J.sh, J.elbow); setLine(s.farm, J.elbow, J.hand);
    function o(p) { return [p[0] + FAR[0], p[1] + FAR[1]]; }
    if (J.far) { setLine(f.thigh, J.hip, J.far.knee); setLine(f.shin, J.far.knee, J.far.ank); setLine(f.foot, J.far.ank, J.far.toe); }
    else { setLine(f.thigh, o(J.hip), o(J.knee)); setLine(f.shin, o(J.knee), o(J.ank)); setLine(f.foot, o(J.ank), o(J.toe)); }
    setLine(f.uarm, o(J.sh), o(J.elbow)); setLine(f.farm, o(J.elbow), o(J.hand));
    var ends = { thigh: [J.hip, J.knee], shin: [J.knee, J.ank], torso: [J.hip, J.sh], uarm: [J.sh, J.elbow], farm: [J.elbow, J.hand] };
    for (var i = 0; i < 3; i++) {
      var h = a.hl[i], el = inst.hl[i];
      if (!h) { el.style.display = 'none'; continue; }
      var e = ends[h.s], p = e[0], r = e[1], f0 = h.a === undefined ? 0 : h.a, f1 = h.b === undefined ? 1 : h.b;
      setLine(el, [p[0] + (r[0] - p[0]) * f0, p[1] + (r[1] - p[1]) * f0], [p[0] + (r[0] - p[0]) * f1, p[1] + (r[1] - p[1]) * f1]);
      el.setAttribute('stroke-width', (SEGW[h.s] - 1.5).toFixed(1));
    }
    inst.head.setAttribute('cx', J.head[0].toFixed(1)); inst.head.setAttribute('cy', J.head[1].toFixed(1));
    var c = [J.head[0] + J.hd[0] * 2.4, J.head[1] + J.hd[1] * 2.4], pp = [-J.hd[1], J.hd[0]], hw = 8.3;
    setLine(inst.band, [c[0] - pp[0] * hw, c[1] - pp[1] * hw], [c[0] + pp[0] * hw, c[1] + pp[1] * hw]);
    if (a.prop === 'plate' || a.prop === 'cable') {
      var at = a.propAt === 'ank' ? J.ank : J.hand;
      if (a.prop === 'cable') {
        setLine(inst.cab, [a.pulley[0], a.pulley[1] + (a.po === undefined ? 4 : a.po)], J.hand);
        inst.pl.setAttribute('r', 4.2); inst.hub.setAttribute('r', 0);
      }
      inst.pl.setAttribute('cx', at[0].toFixed(1)); inst.pl.setAttribute('cy', at[1].toFixed(1));
      inst.hub.setAttribute('cx', at[0].toFixed(1)); inst.hub.setAttribute('cy', at[1].toFixed(1));
    } else if (a.prop === 'platform') {
      var pl = a.plat, ctr = vec(J.ank, pl.dir, pl.off), pr = [Math.cos((pl.dir + 90) * D), Math.sin((pl.dir + 90) * D)];
      setLine(inst.pf, [ctr[0] - pr[0] * pl.len, ctr[1] - pr[1] * pl.len], [ctr[0] + pr[0] * pl.len, ctr[1] + pr[1] * pl.len]);
    }
  }

  R.Fig = { create: create, draw: draw, solve: solve };
})(window.RANGO);
