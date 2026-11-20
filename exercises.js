/* RANGO · datos de ejercicios, rangos y motor de animación (figuras SVG) */
(function (global) {
  'use strict';

  var D = Math.PI / 180;
  var G = 165.5; // altura del tobillo con el pie apoyado en el suelo

  /* ---------- Rangos ---------- */
  var TIERS = [
    { n: 'Bronce',    c: '#e8903f', d: '#4a2a0c' },
    { n: 'Plata',     c: '#cdd5e3', d: '#2b3140' },
    { n: 'Oro',       c: '#f6c244', d: '#4a3606' },
    { n: 'Esmeralda', c: '#2ee27d', d: '#083d22' },
    { n: 'Diamante',  c: '#3ab8ff', d: '#0a3550' }
  ];
  // Percentil orientativo por nivel (0 = Bronce I ... 14 = Diamante III)
  var TOP = [85, 82, 79, 70, 65, 60, 54, 49, 44, 37, 30, 22, 11, 6, 2];

  /* ---------- Escenas (equipamiento estático) ---------- */
  var SCENES = {
    floor: '',
    bench: '<rect class="sc f" x="38" y="140" width="84" height="8" rx="3"/><path class="sc" d="M50 148V167M110 148V167"/>',
    pulldown: '<rect class="sc f" x="58" y="137" width="44" height="7" rx="3"/><path class="sc" d="M80 144V167M148 22V167M148 22H112"/><circle class="sc" cx="112" cy="22" r="4.5"/>',
    pullup: '<path class="sc" d="M60 32H136M136 32V167"/>',
    dips: '<path class="sc" d="M82 100H128M128 100V167"/>',
    none: ''
  };

  /* ---------- Poses ---------- */
  function pushPose(shY) {
    var T = [24, G], ft = 60;
    var ank = [T[0] - 11 * Math.cos(ft * D), T[1] - 11 * Math.sin(ft * D)];
    var a = Math.asin((ank[1] - shY) / 106.5);
    return {
      sh: [ank[0] + 106.5 * Math.cos(a), shY],
      tor: -a / D, legDir: 180 - a / D, ft: ft, hand: [122, 164]
    };
  }

  /* ---------- Ejercicios ---------- */
  var EXERCISES = [
    { id: 'banca', name: 'Press banca', group: 'Pecho', bw: 0, step: 2.5, def: [40, 8], fem: 0.65,
      anchors: [0.25, 0.5, 0.75, 1.25, 1.75, 2.25],
      cues: ['Escápulas juntas y pies firmes en el suelo', 'Baja la barra al pecho con control', 'Empuja hasta estirar los brazos'],
      anim: { scene: 'bench', prop: 'plate', kneePref: [0, -1], elbowPref: [-0.5, 1],
        hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [58, 133], tor: 0, ank: [26, G], ua: -90, fa: -90 },
          { hip: [58, 133], tor: 0, ank: [26, G], ua: -240, fa: -80 }
        ] } },

    { id: 'flexiones', name: 'Flexiones', group: 'Pecho', bw: 0.64, step: 1, def: [0, 10], fem: 0.85,
      anchors: [0.4, 0.75, 1.0, 1.2, 1.5, 1.8],
      cues: ['Cuerpo recto de cabeza a talones', 'Baja el pecho casi hasta el suelo', 'Sube sin hundir la cadera'],
      anim: { scene: 'none', prop: 'none', kneePref: [1, 0], elbowPref: [-1, -0.3],
        hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [pushPose(115), pushPose(149)] } },

    { id: 'dominadas', name: 'Dominadas', group: 'Espalda', bw: 1, step: 2.5, def: [0, 5], fem: 0.85,
      anchors: [0.5, 0.9, 1.1, 1.3, 1.6, 2.0],
      cues: ['Empieza con los brazos estirados', 'Sube hasta pasar la barbilla de la barra', 'Baja controlado. Usa asistencia (−) si hace falta'],
      anim: { scene: 'pullup', prop: 'none', kneePref: [1, 0.3], elbowPref: [0.5, 1],
        hl: [{ s: 'torso', a: 0.3, b: 1 }, { s: 'uarm' }],
        poses: [
          { sh: [100, 82], tor: -90, ank: [72, 145], hand: [106, 33] },
          { sh: [95, 45], tor: -92, ank: [70, 108], hand: [106, 33] }
        ] } },

    { id: 'jalon', name: 'Jalón al pecho', group: 'Espalda', bw: 0, step: 2.5, def: [40, 10], fem: 0.65,
      anchors: [0.3, 0.5, 0.8, 1.15, 1.55, 2.0],
      cues: ['Agarre algo más ancho que los hombros', 'Baja la barra a la parte alta del pecho', 'Codos hacia abajo, sin balancear el torso'],
      anim: { scene: 'pulldown', prop: 'cable', pulley: [112, 27], kneePref: [0.5, -1], elbowPref: [-0.5, 1],
        hl: [{ s: 'torso', a: 0.3, b: 0.9 }, { s: 'uarm' }],
        poses: [
          { hip: [78, 130], tor: -98, ank: [112, G], ua: -60, fa: -60 },
          { hip: [78, 130], tor: -98, ank: [112, G], ua: 110, fa: -30 }
        ] } },

    { id: 'remo', name: 'Remo con barra', group: 'Espalda', bw: 0, step: 2.5, def: [40, 8], fem: 0.65,
      anchors: [0.25, 0.5, 0.75, 1.0, 1.4, 1.8],
      cues: ['Torso inclinado y espalda recta', 'Lleva la barra hacia el ombligo', 'Aprieta la espalda y baja despacio'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [-1, 0],
        hl: [{ s: 'torso', a: 0.4, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [50, 114], tor: -22, ank: [84, G], ua: 90, fa: 90 },
          { hip: [50, 114], tor: -22, ank: [84, G], ua: 158, fa: 92 }
        ] } },

    { id: 'muerto', name: 'Peso muerto', group: 'Espalda', bw: 0, step: 2.5, def: [60, 5], fem: 0.65,
      anchors: [0.5, 1.0, 1.5, 2.0, 2.75, 3.5],
      cues: ['Barra pegada a las piernas, espalda neutra', 'Empuja el suelo con las piernas', 'Termina erguido, sin arquear la lumbar'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [0, 1],
        hl: [{ s: 'torso', a: 0, b: 0.7 }, { s: 'thigh' }],
        poses: [
          { hip: [88, 101], tor: -92, ank: [86, G], ua: 90, fa: 90 },
          { hip: [55.2, 127.9], tor: -35, ank: [86, G], ua: 90, fa: 90 }
        ] } },

    { id: 'sentadilla', name: 'Sentadilla', group: 'Piernas', bw: 0, step: 2.5, def: [50, 8], fem: 0.65,
      anchors: [0.4, 0.75, 1.25, 1.75, 2.5, 3.25],
      cues: ['Barra sobre los hombros y pecho arriba', 'Baja con la cadera hacia atrás hasta paralelo', 'Empuja con todo el pie y sube'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, -0.2], elbowPref: [-0.5, 1],
        hl: [{ s: 'thigh' }, { s: 'torso', a: 0, b: 0.3 }],
        poses: [
          { hip: [88, G - 64.5], tor: -84, ank: [88, G], ua: 122, fa: -62 },
          { hip: [62, G - 39], tor: -58, ank: [88, G], ua: 122, fa: -62 }
        ] } },

    { id: 'gemelos', name: 'Elevación de talones', group: 'Piernas', bw: 0, step: 2.5, def: [40, 12], fem: 0.65,
      anchors: [0.25, 0.5, 1.0, 1.5, 2.25, 3.0],
      cues: ['Apoya la punta del pie y estira el tobillo', 'Sube todo lo que puedas y pausa 1 s', 'Baja hasta notar el estiramiento'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [-0.5, 1],
        hl: [{ s: 'shin' }],
        poses: [
          { hip: [99, G - 64], tor: -90, ank: [99, G], ft: 0, ua: 122, fa: -62 },
          { hip: [102.9, G - 73.4], tor: -90, ank: [102.9, G - 9.4], ft: 50, ua: 122, fa: -62 }
        ] } },

    { id: 'ohp', name: 'Press militar', group: 'Hombros', bw: 0, step: 2.5, def: [25, 8], fem: 0.65,
      anchors: [0.2, 0.35, 0.55, 0.8, 1.1, 1.4],
      cues: ['Glúteos y abdomen apretados', 'Empuja la barra en línea recta sobre la cabeza', 'Bloquea arriba y baja con control'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [0.3, 1],
        hl: [{ s: 'uarm' }, { s: 'torso', a: 0.7, b: 1 }],
        poses: [
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: -88, fa: -88 },
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 70, fa: -80 }
        ] } },

    { id: 'curl', name: 'Curl de bíceps', group: 'Brazos', bw: 0, step: 1, def: [15, 10], fem: 0.65,
      anchors: [0.12, 0.25, 0.4, 0.6, 0.85, 1.1],
      cues: ['Codos pegados al cuerpo', 'Sube la barra sin balancear la espalda', 'Baja lento y estira del todo'],
      anim: { scene: 'none', prop: 'plate', plateR: 9, kneePref: [1, 0], elbowPref: [0, 1],
        hl: [{ s: 'uarm' }],
        poses: [
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 94, fa: 88 },
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 84, fa: -62 }
        ] } },

    { id: 'fondos', name: 'Fondos', group: 'Brazos', bw: 1, step: 2.5, def: [0, 8], fem: 0.85,
      anchors: [0.5, 0.9, 1.15, 1.4, 1.75, 2.2],
      cues: ['Hombros abajo y pecho ligeramente adelante', 'Baja hasta que los codos formen 90°', 'Empuja hasta estirar los brazos'],
      anim: { scene: 'dips', prop: 'none', kneePref: [1, 0], elbowPref: [-1, 0.2],
        hl: [{ s: 'uarm' }, { s: 'torso', a: 0.6, b: 1 }],
        poses: [
          { sh: [104, 52], tor: -80, ank: [84, 128], hand: [104, 100] },
          { sh: [104, 76], tor: -70, ank: [76, 146], hand: [104, 100] }
        ] } }
  ];

  var BYID = {};
  EXERCISES.forEach(function (e) { BYID[e.id] = e; });

  /* ---------- Motor de figuras ---------- */
  var L = { torso: 40, uarm: 25, farm: 25, thigh: 34, shin: 33, foot: 11, neck: 18, head: 10.5 };

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

  function ik(R, E, l1, l2, pref) {
    var dx = E[0] - R[0], dy = E[1] - R[1], d = Math.sqrt(dx * dx + dy * dy);
    if (d < 1e-6) { dx = 1; dy = 0; d = 1; }
    var maxd = l1 + l2 - 0.01, mind = Math.abs(l1 - l2) + 0.5;
    var ux = dx / d, uy = dy / d;
    if (d > maxd) d = maxd;
    if (d < mind) d = mind;
    var end = [R[0] + ux * d, R[1] + uy * d];
    var a = (l1 * l1 - l2 * l2 + d * d) / (2 * d);
    var h = Math.sqrt(Math.max(l1 * l1 - a * a, 0));
    var mx = R[0] + ux * a, my = R[1] + uy * a;
    var k1 = [mx - uy * h, my + ux * h], k2 = [mx + uy * h, my - ux * h];
    var s1 = (k1[0] - mx) * pref[0] + (k1[1] - my) * pref[1];
    var s2 = (k2[0] - mx) * pref[0] + (k2[1] - my) * pref[1];
    return { mid: s1 >= s2 ? k1 : k2, end: end };
  }

  function solve(a, P) {
    var tor = P.tor * D, dx = Math.cos(tor), dy = Math.sin(tor), hip, sh;
    if (P.hip) { hip = P.hip; sh = [hip[0] + L.torso * dx, hip[1] + L.torso * dy]; }
    else { sh = P.sh; hip = [sh[0] - L.torso * dx, sh[1] - L.torso * dy]; }
    var ank;
    if (P.ank) ank = P.ank;
    else {
      var ld = P.legDir * D, len = (L.thigh + L.shin) * 0.997;
      ank = [hip[0] + len * Math.cos(ld), hip[1] + len * Math.sin(ld)];
    }
    var lg = ik(hip, ank, L.thigh, L.shin, a.kneePref);
    var ft = (P.ft || 0) * D;
    var toe = [lg.end[0] + L.foot * Math.cos(ft), lg.end[1] + L.foot * Math.sin(ft)];
    var elbow, hand;
    if (P.ua !== undefined) {
      elbow = [sh[0] + L.uarm * Math.cos(P.ua * D), sh[1] + L.uarm * Math.sin(P.ua * D)];
      hand = [elbow[0] + L.farm * Math.cos(P.fa * D), elbow[1] + L.farm * Math.sin(P.fa * D)];
    } else {
      var ar = ik(sh, P.hand, L.uarm, L.farm, a.elbowPref);
      elbow = ar.mid; hand = ar.end;
    }
    var hd = [Math.cos(tor + (P.tilt || 0) * D), Math.sin(tor + (P.tilt || 0) * D)];
    var head = [sh[0] + L.neck * hd[0], sh[1] + L.neck * hd[1]];
    return { hip: hip, sh: sh, knee: lg.mid, ank: lg.end, toe: toe, elbow: elbow, hand: hand, head: head, hd: hd };
  }

  function setLine(el, p, q) {
    el.setAttribute('x1', p[0].toFixed(1)); el.setAttribute('y1', p[1].toFixed(1));
    el.setAttribute('x2', q[0].toFixed(1)); el.setAttribute('y2', q[1].toFixed(1));
  }

  var SEGW = { thigh: 12.5, shin: 10, foot: 7, torso: 14.5, uarm: 9.5, farm: 8.5 };
  var FAR = [-3.2, 0.6];
  var SCENEBOX = { bench: [38, 140, 122, 167], pulldown: [58, 22, 148, 167], pullup: [60, 32, 136, 167], dips: [82, 100, 128, 167] };

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
      add(J.hand, a.prop === 'plate' ? (a.plateR || 13) : 4); add(J.head, L.head + 1);
    }
    var sb = SCENEBOX[a.scene];
    if (sb) { add([sb[0], sb[1]]); add([sb[2], sb[3]]); }
    return { x: (minx + maxx) / 2, y: (miny + maxy) / 2, w: maxx - minx, h: maxy - miny };
  }

  function create(exId) {
    var ex = BYID[exId], a = ex.anim;
    var b = bounds(ex);
    var sc = Math.min(1.5, 146 / b.w, 146 / b.h);
    var tf = 'translate(100 ' + (100 + 0) + ') scale(' + sc.toFixed(3) + ') translate(' + (-b.x).toFixed(1) + ' ' + (-b.y).toFixed(1) + ')';
    var html = '<svg class="fig" viewBox="0 0 200 200" aria-hidden="true" focusable="false">' +
      '<g transform="' + tf + '">' +
      '<path class="sc" d="M-40 169.5H240"/>' + (SCENES[a.scene] || '') +
      '<line class="cab"/>' +
      '<line class="seg far f-thigh" stroke-width="' + SEGW.thigh + '"/>' +
      '<line class="seg far f-shin" stroke-width="' + SEGW.shin + '"/>' +
      '<line class="seg far f-foot" stroke-width="' + SEGW.foot + '"/>' +
      '<line class="seg far f-uarm" stroke-width="' + SEGW.uarm + '"/>' +
      '<line class="seg far f-farm" stroke-width="' + SEGW.farm + '"/>' +
      '<line class="seg s-shin" stroke-width="' + SEGW.shin + '"/>' +
      '<line class="seg s-foot" stroke-width="' + SEGW.foot + '"/>' +
      '<line class="seg s-thigh" stroke-width="' + SEGW.thigh + '"/>' +
      '<line class="seg s-torso" stroke-width="' + SEGW.torso + '"/>' +
      '<line class="seg s-uarm" stroke-width="' + SEGW.uarm + '"/>' +
      '<line class="seg s-farm" stroke-width="' + SEGW.farm + '"/>' +
      '<line class="hl h0"/><line class="hl h1"/><line class="hl h2"/>' +
      '<circle class="head" r="' + L.head + '"/>' +
      '<line class="band"/>' +
      '<circle class="pl" r="' + (a.plateR || 13) + '"/><circle class="hub" r="3.4"/>' +
      '</g></svg>';
    var w = document.createElement('div');
    w.innerHTML = html;
    var svg = w.firstChild;
    var q = function (c) { return svg.querySelector('.' + c); };
    var inst = {
      ex: ex, svg: svg, vis: true, off: 0,
      seg: { thigh: q('s-thigh'), shin: q('s-shin'), foot: q('s-foot'), torso: q('s-torso'), uarm: q('s-uarm'), farm: q('s-farm') },
      far: { thigh: q('f-thigh'), shin: q('f-shin'), foot: q('f-foot'), uarm: q('f-uarm'), farm: q('f-farm') },
      hl: [q('h0'), q('h1'), q('h2')], head: q('head'), band: q('band'), pl: q('pl'), hub: q('hub'), cab: q('cab')
    };
    svg.__fig = inst;
    if (a.prop === 'none') { inst.pl.style.display = 'none'; inst.hub.style.display = 'none'; }
    if (a.prop !== 'cable') inst.cab.style.display = 'none';
    return inst;
  }

  function draw(inst, t) {
    var ex = inst.ex, a = ex.anim, dur = a.dur || 3.4;
    var ph = (((t + inst.off) / dur) % 1 + 1) % 1;
    var P = mix(a.poses[0], a.poses[1], shape(ph));
    var J = solve(a, P);
    var s = inst.seg;
    setLine(s.thigh, J.hip, J.knee);
    setLine(s.shin, J.knee, J.ank);
    setLine(s.foot, J.ank, J.toe);
    setLine(s.torso, J.hip, J.sh);
    setLine(s.uarm, J.sh, J.elbow);
    setLine(s.farm, J.elbow, J.hand);
    var f = inst.far, o = FAR;
    function sh2(p) { return [p[0] + o[0], p[1] + o[1]]; }
    setLine(f.thigh, sh2(J.hip), sh2(J.knee)); setLine(f.shin, sh2(J.knee), sh2(J.ank));
    setLine(f.foot, sh2(J.ank), sh2(J.toe));
    setLine(f.uarm, sh2(J.sh), sh2(J.elbow)); setLine(f.farm, sh2(J.elbow), sh2(J.hand));
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
    if (a.prop === 'plate') {
      inst.pl.setAttribute('cx', J.hand[0].toFixed(1)); inst.pl.setAttribute('cy', J.hand[1].toFixed(1));
      inst.hub.setAttribute('cx', J.hand[0].toFixed(1)); inst.hub.setAttribute('cy', J.hand[1].toFixed(1));
    } else if (a.prop === 'cable') {
      setLine(inst.cab, [a.pulley[0], a.pulley[1] + 4], J.hand);
      inst.pl.setAttribute('r', 4.2); inst.hub.setAttribute('r', 0);
      inst.pl.setAttribute('cx', J.hand[0].toFixed(1)); inst.pl.setAttribute('cy', J.hand[1].toFixed(1));
    }
  }

  global.RANGO = { EXERCISES: EXERCISES, BYID: BYID, TIERS: TIERS, TOP: TOP, Fig: { create: create, draw: draw, solve: solve } };
})(window);
