/* RANGO · catálogo de ejercicios, rangos y escenas */
(function (global) {
  'use strict';
  var D = Math.PI / 180, G = 165.5;

  var TIERS = [
    { n: 'Bronce',    c: '#e8903f', d: '#4a2a0c' },
    { n: 'Plata',     c: '#cdd5e3', d: '#2b3140' },
    { n: 'Oro',       c: '#f6c244', d: '#4a3606' },
    { n: 'Esmeralda', c: '#2ee27d', d: '#083d22' },
    { n: 'Diamante',  c: '#3ab8ff', d: '#0a3550' }
  ];
  var TOP = [85, 82, 79, 70, 65, 60, 54, 49, 44, 37, 30, 22, 11, 6, 2];

  /* grupos que ve el usuario y músculos que usa el planificador */
  var GROUPS = [
    { id: 'pecho', n: 'Pecho', m: ['pecho'] },
    { id: 'espalda', n: 'Espalda', m: ['espalda'] },
    { id: 'piernas', n: 'Piernas', m: ['piernas'] },
    { id: 'hombros', n: 'Hombros', m: ['hombros'] },
    { id: 'brazos', n: 'Brazos', m: ['biceps', 'triceps'] },
    { id: 'core', n: 'Core', m: ['core'] }
  ];
  var EQUIP = [
    { id: 'barra', n: 'Barra' }, { id: 'mancuernas', n: 'Mancuernas' }, { id: 'maquina', n: 'Máquina' },
    { id: 'polea', n: 'Polea' }, { id: 'cuerpo', n: 'Peso corporal' }
  ];

  /* sesiones: grupos de músculos y orden de huecos */
  var FOCUS = {
    push:  { n: 'Empuje', sub: 'Pecho · Hombros · Tríceps', m: ['pecho', 'hombros', 'triceps'],
             slots: ['pecho', 'hombros', 'pecho', 'triceps', 'pecho', 'hombros', 'triceps', 'pecho', 'hombros', 'triceps', 'pecho', 'hombros', 'triceps', 'pecho'] },
    pull:  { n: 'Tirón', sub: 'Espalda · Bíceps', m: ['espalda', 'biceps'],
             slots: ['espalda', 'espalda', 'biceps', 'espalda', 'biceps', 'espalda', 'biceps', 'espalda', 'biceps', 'espalda', 'biceps', 'espalda'] },
    legs:  { n: 'Piernas', sub: 'Cuádriceps · Femoral · Glúteo · Gemelo', m: ['piernas', 'core'],
             slots: ['piernas', 'piernas', 'piernas', 'piernas', 'core', 'piernas', 'piernas', 'core', 'piernas', 'piernas', 'core', 'piernas'] },
    full:  { n: 'Cuerpo completo', sub: 'Todo el cuerpo', m: ['piernas', 'pecho', 'espalda', 'hombros', 'biceps', 'triceps', 'core'],
             slots: ['piernas', 'pecho', 'espalda', 'hombros', 'piernas', 'espalda', 'pecho', 'biceps', 'triceps', 'core', 'piernas', 'hombros', 'espalda', 'pecho'] },
    upper: { n: 'Torso', sub: 'Pecho · Espalda · Hombros · Brazos', m: ['pecho', 'espalda', 'hombros', 'biceps', 'triceps'],
             slots: ['pecho', 'espalda', 'hombros', 'pecho', 'espalda', 'biceps', 'triceps', 'hombros', 'espalda', 'pecho', 'biceps', 'triceps'] },
    pecho: { n: 'Pecho', sub: 'Solo pecho', m: ['pecho'], slots: ['pecho', 'pecho', 'pecho', 'pecho', 'pecho', 'pecho', 'pecho', 'pecho'] },
    espalda: { n: 'Espalda', sub: 'Solo espalda', m: ['espalda'], slots: ['espalda', 'espalda', 'espalda', 'espalda', 'espalda', 'espalda', 'espalda', 'espalda'] },
    hombros: { n: 'Hombros', sub: 'Solo hombros', m: ['hombros'], slots: ['hombros', 'hombros', 'hombros', 'hombros', 'hombros', 'hombros'] },
    brazos: { n: 'Brazos', sub: 'Bíceps y tríceps', m: ['biceps', 'triceps'], slots: ['biceps', 'triceps', 'biceps', 'triceps', 'biceps', 'triceps', 'biceps', 'triceps'] },
    core:  { n: 'Core', sub: 'Abdominales', m: ['core'], slots: ['core', 'core', 'core', 'core', 'core', 'core'] }
  };
  var AUTO = ['push', 'pull', 'legs'];
  /* programas semanales: día de la semana (0 = domingo) -> entrenamiento */
  var PROGRAMS = {
    auto:  { n: 'Automático', d: 'La app elige según lo que lleves más tiempo sin entrenar', map: null },
    full3: { n: 'Cuerpo completo × 3', d: 'Lunes, miércoles y viernes', map: { 1: 'full', 3: 'full', 5: 'full' } },
    ppl3:  { n: 'Empuje · Tirón · Pierna × 3', d: 'Lunes, miércoles y viernes', map: { 1: 'push', 3: 'pull', 5: 'legs' } },
    ul4:   { n: 'Torso / Pierna × 4', d: 'Lunes, martes, jueves y viernes', map: { 1: 'upper', 2: 'legs', 4: 'upper', 5: 'legs' } },
    ppl6:  { n: 'Empuje · Tirón · Pierna × 6', d: 'De lunes a sábado', map: { 1: 'push', 2: 'pull', 3: 'legs', 4: 'push', 5: 'pull', 6: 'legs' } }
  };

  /* ---------- Escenas ---------- */
  var SCENES = {
    none: '',
    bench: '<rect class="sc f" x="38" y="140" width="84" height="8" rx="3"/><path class="sc" d="M50 148V167M110 148V167"/>',
    incline: '<path class="sc pad" d="M50 146L108 104"/><rect class="sc f" x="36" y="143" width="34" height="7" rx="3"/><path class="sc" d="M52 150V167M96 118L116 167"/>',
    seated: '<rect class="sc f" x="53" y="76" width="9" height="60" rx="4"/><rect class="sc f" x="52" y="137" width="46" height="7" rx="3"/><path class="sc" d="M74 144V167"/>',
    legext: '<rect class="sc f" x="48" y="78" width="9" height="56" rx="4"/><rect class="sc f" x="46" y="136" width="50" height="7" rx="3"/><path class="sc" d="M70 143V167"/>',
    legpress: '<path class="sc pad" d="M63 145L22 104"/><path class="sc" d="M76 146L146 76M64 146V167"/>',
    legcurl: '<rect class="sc f" x="28" y="140" width="106" height="7" rx="3"/><path class="sc" d="M44 147V167M118 147V167"/>',
    hipthrust: '<rect class="sc f" x="14" y="140" width="50" height="8" rx="3"/><path class="sc" d="M28 148V167M50 148V167"/>',
    seatedrow: '<rect class="sc f" x="38" y="150" width="50" height="7" rx="3"/><path class="sc" d="M62 157V167M136 128V167"/>',
    pulldown: '<rect class="sc f" x="58" y="137" width="44" height="7" rx="3"/><path class="sc" d="M80 144V167M148 22V167M148 22H112"/><circle class="sc" cx="112" cy="22" r="4.5"/>',
    cablehigh: '<path class="sc" d="M148 22V167M148 22H112"/><circle class="sc" cx="112" cy="22" r="4.5"/>',
    crossover: '<path class="sc" d="M34 22V167M34 22H58"/><circle class="sc" cx="58" cy="22" r="4.5"/>',
    facepull: '<path class="sc" d="M152 22V167"/><circle class="sc" cx="152" cy="58" r="4.5"/>',
    pullup: '<path class="sc" d="M60 32H136M136 32V167"/>',
    hangbar: '<path class="sc" d="M60 10H136M136 10V167"/>',
    dips: '<path class="sc" d="M82 100H128M128 100V167"/>'
  };
  var SCENEBOX = {
    bench: [38, 140, 122, 167], incline: [36, 100, 118, 167], seated: [52, 76, 98, 167], legext: [46, 78, 96, 167],
    legpress: [20, 76, 146, 167], legcurl: [28, 126, 134, 167], hipthrust: [14, 134, 64, 167], seatedrow: [38, 126, 136, 167],
    pulldown: [58, 22, 148, 167], cablehigh: [90, 22, 148, 167], crossover: [34, 22, 70, 167], facepull: [120, 22, 152, 167],
    pullup: [60, 32, 136, 167], hangbar: [60, 10, 136, 167], dips: [82, 100, 128, 167]
  };

  /* ---------- Poses reutilizadas ---------- */
  function pushPose(shY) {
    var T = [24, G], ft = 60;
    var ank = [T[0] - 11 * Math.cos(ft * D), T[1] - 11 * Math.sin(ft * D)];
    var a = Math.asin((ank[1] - shY) / 106.5);
    return { sh: [ank[0] + 106.5 * Math.cos(a), shY], tor: -a / D, legDir: 180 - a / D, ft: ft, hand: [122, 164] };
  }
  var BENCH = [
    { hip: [58, 133], tor: 0, ank: [26, G], ua: -90, fa: -90 },
    { hip: [58, 133], tor: 0, ank: [26, G], ua: -240, fa: -80 }
  ];
  var ROW = [
    { hip: [50, 114], tor: -22, ank: [84, G], ua: 90, fa: 90 },
    { hip: [50, 114], tor: -22, ank: [84, G], ua: 158, fa: 92 }
  ];
  var OHP = [
    { hip: [88, G - 65], tor: -90, ank: [88, G], ua: -88, fa: -88 },
    { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 70, fa: -80 }
  ];
  var CURL = [
    { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 94, fa: 88 },
    { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 84, fa: -62 }
  ];

  /* ---------- Ejercicios ---------- */
  // m: músculo · eq: equipo · c: compuesto · reps: rango objetivo · bw: fracción del peso corporal que se mueve
  var EXERCISES = [
    /* PECHO */
    { id: 'banca', name: 'Press banca', group: 'Pecho', m: 'pecho', eq: 'barra', c: 1, reps: [6, 10], bw: 0, step: 2.5, def: [40, 8], fem: 0.65,
      anchors: [0.25, 0.5, 0.75, 1.25, 1.75, 2.25],
      cues: ['Escápulas juntas y pies firmes en el suelo', 'Baja la barra al pecho con control', 'Empuja hasta estirar los brazos'],
      anim: { scene: 'bench', prop: 'plate', kneePref: [0, -1], elbowPref: [-0.5, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }], poses: BENCH } },
    { id: 'bancadb', name: 'Press banca con mancuernas', group: 'Pecho', m: 'pecho', eq: 'mancuernas', c: 1, reps: [8, 12], bw: 0, step: 2, def: [16, 10], fem: 0.65,
      anchors: [0.1, 0.2, 0.35, 0.55, 0.8, 1.05],
      cues: ['Peso por cada mancuerna', 'Baja hasta que los codos queden a la altura del pecho', 'Sube juntando las mancuernas arriba'],
      anim: { scene: 'bench', prop: 'plate', plateR: 8, kneePref: [0, -1], elbowPref: [-0.5, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }], poses: BENCH } },
    { id: 'inclinado', name: 'Press inclinado con mancuernas', group: 'Pecho', m: 'pecho', eq: 'mancuernas', c: 1, reps: [8, 12], bw: 0, step: 2, def: [14, 10], fem: 0.65,
      anchors: [0.1, 0.18, 0.3, 0.48, 0.7, 0.95],
      cues: ['Banco a unos 30°', 'Baja con control hasta estirar el pecho', 'Empuja arriba sin chocar las mancuernas'],
      anim: { scene: 'incline', prop: 'plate', plateR: 8, kneePref: [0, -1], elbowPref: [-0.5, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [52, 135], tor: -35, ank: [24, G], ua: -88, fa: -88 },
          { hip: [52, 135], tor: -35, ank: [24, G], ua: -230, fa: -85 }
        ] } },
    { id: 'pressmaq', name: 'Press de pecho en máquina', group: 'Pecho', m: 'pecho', eq: 'maquina', c: 1, reps: [8, 12], bw: 0, step: 2.5, def: [30, 10], fem: 0.65,
      anchors: [0.2, 0.4, 0.65, 1.0, 1.4, 1.8],
      cues: ['Ajusta el asiento: asas a la altura del pecho', 'Espalda pegada al respaldo', 'Empuja sin bloquear los codos de golpe'],
      anim: { scene: 'seated', prop: 'plate', plateR: 4, kneePref: [0.6, -1], elbowPref: [-0.3, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [70, 130], tor: -93, ank: [100, G], ua: 2, fa: 2 },
          { hip: [70, 130], tor: -93, ank: [100, G], ua: 150, fa: -8 }
        ] } },
    { id: 'pecdeck', name: 'Aperturas en máquina (pec deck)', group: 'Pecho', m: 'pecho', eq: 'maquina', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [25, 12], fem: 0.65,
      anchors: [0.15, 0.3, 0.5, 0.75, 1.05, 1.35],
      cues: ['Codos a la altura de los hombros', 'Junta los brazos apretando el pecho', 'Vuelve despacio sin perder tensión'],
      anim: { scene: 'seated', prop: 'plate', plateR: 5, kneePref: [0.6, -1], elbowPref: [0.2, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [70, 130], tor: -93, ank: [100, G], hand: [88, 88] },
          { hip: [70, 130], tor: -93, ank: [100, G], hand: [113, 92] }
        ] } },
    { id: 'cruces', name: 'Cruces en polea', group: 'Pecho', m: 'pecho', eq: 'polea', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [10, 12], fem: 0.65,
      anchors: [0.05, 0.1, 0.18, 0.28, 0.4, 0.55],
      cues: ['Peso por cada lado', 'Ligera flexión de codos', 'Junta las manos delante del pecho'],
      anim: { scene: 'crossover', prop: 'cable', pulley: [58, 26], po: 0, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [88, G - 65], tor: -86, ank: [88, G], ua: -35, fa: -30 },
          { hip: [88, G - 65], tor: -86, ank: [88, G], ua: 62, fa: 70 }
        ] } },
    { id: 'flexiones', name: 'Flexiones', group: 'Pecho', m: 'pecho', eq: 'cuerpo', c: 1, reps: [8, 15], bw: 0.64, step: 1, def: [0, 10], fem: 0.85,
      anchors: [0.4, 0.75, 1.0, 1.2, 1.5, 1.8],
      cues: ['Cuerpo recto de cabeza a talones', 'Baja el pecho casi hasta el suelo', 'Sube sin hundir la cadera'],
      anim: { scene: 'none', prop: 'none', kneePref: [1, 0], elbowPref: [-1, -0.3], hl: [{ s: 'torso', a: 0.5, b: 1 }, { s: 'uarm' }], poses: [pushPose(115), pushPose(149)] } },

    /* ESPALDA */
    { id: 'dominadas', name: 'Dominadas', group: 'Espalda', m: 'espalda', eq: 'cuerpo', c: 1, reps: [5, 10], bw: 1, step: 2.5, def: [0, 5], fem: 0.85,
      anchors: [0.5, 0.9, 1.1, 1.3, 1.6, 2.0],
      cues: ['Empieza con los brazos estirados', 'Sube hasta pasar la barbilla de la barra', 'Baja controlado. Usa asistencia (−) si hace falta'],
      anim: { scene: 'pullup', prop: 'none', kneePref: [1, 0.3], elbowPref: [0.5, 1], hl: [{ s: 'torso', a: 0.3, b: 1 }, { s: 'uarm' }],
        poses: [
          { sh: [100, 82], tor: -90, ank: [72, 145], hand: [106, 33] },
          { sh: [95, 45], tor: -92, ank: [70, 108], hand: [106, 33] }
        ] } },
    { id: 'jalon', name: 'Jalón al pecho', group: 'Espalda', m: 'espalda', eq: 'polea', c: 1, reps: [8, 12], bw: 0, step: 2.5, def: [40, 10], fem: 0.65,
      anchors: [0.3, 0.5, 0.8, 1.15, 1.55, 2.0],
      cues: ['Agarre algo más ancho que los hombros', 'Baja la barra a la parte alta del pecho', 'Codos hacia abajo, sin balancear el torso'],
      anim: { scene: 'pulldown', prop: 'cable', pulley: [112, 27], kneePref: [0.5, -1], elbowPref: [-0.5, 1], hl: [{ s: 'torso', a: 0.3, b: 0.9 }, { s: 'uarm' }],
        poses: [
          { hip: [78, 130], tor: -98, ank: [112, G], ua: -60, fa: -60 },
          { hip: [78, 130], tor: -98, ank: [112, G], ua: 110, fa: -30 }
        ] } },
    { id: 'remo', name: 'Remo con barra', group: 'Espalda', m: 'espalda', eq: 'barra', c: 1, reps: [6, 10], bw: 0, step: 2.5, def: [40, 8], fem: 0.65,
      anchors: [0.25, 0.5, 0.75, 1.0, 1.4, 1.8],
      cues: ['Torso inclinado y espalda recta', 'Lleva la barra hacia el ombligo', 'Aprieta la espalda y baja despacio'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [-1, 0], hl: [{ s: 'torso', a: 0.4, b: 1 }, { s: 'uarm' }], poses: ROW } },
    { id: 'remodb', name: 'Remo con mancuerna', group: 'Espalda', m: 'espalda', eq: 'mancuernas', c: 1, reps: [8, 12], bw: 0, step: 2, def: [20, 10], fem: 0.65,
      anchors: [0.1, 0.2, 0.33, 0.5, 0.7, 0.9],
      cues: ['Una mano apoyada y espalda recta', 'Lleva el codo hacia la cadera', 'Baja estirando bien la espalda'],
      anim: { scene: 'none', prop: 'plate', plateR: 8, kneePref: [1, 0], elbowPref: [-1, 0], hl: [{ s: 'torso', a: 0.4, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [52, 116], tor: -18, ank: [84, G], ua: 90, fa: 90 },
          { hip: [52, 116], tor: -18, ank: [84, G], ua: 158, fa: 92 }
        ] } },
    { id: 'remopolea', name: 'Remo en polea sentado', group: 'Espalda', m: 'espalda', eq: 'polea', c: 1, reps: [8, 12], bw: 0, step: 2.5, def: [40, 10], fem: 0.65,
      anchors: [0.25, 0.5, 0.8, 1.15, 1.55, 2.0],
      cues: ['Pies firmes y rodillas ligeramente flexionadas', 'Tira hacia el abdomen juntando las escápulas', 'Vuelve estirando sin encorvarte'],
      anim: { scene: 'seatedrow', prop: 'cable', pulley: [134, 140], po: 0, kneePref: [0, -1], elbowPref: [-0.5, 1], hl: [{ s: 'torso', a: 0.3, b: 1 }, { s: 'uarm' }],
        poses: [
          { hip: [60, 143], tor: -70, ank: [124, 146], ua: 25, fa: 25 },
          { hip: [60, 143], tor: -95, ank: [124, 146], ua: 160, fa: -5 }
        ] } },
    { id: 'muerto', name: 'Peso muerto', group: 'Espalda', m: 'espalda', eq: 'barra', c: 1, reps: [4, 8], bw: 0, step: 2.5, def: [60, 5], fem: 0.65,
      anchors: [0.5, 1.0, 1.5, 2.0, 2.75, 3.5],
      cues: ['Barra pegada a las piernas, espalda neutra', 'Empuja el suelo con las piernas', 'Termina erguido, sin arquear la lumbar'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'torso', a: 0, b: 0.7 }, { s: 'thigh' }],
        poses: [
          { hip: [88, 101], tor: -92, ank: [86, G], ua: 90, fa: 90 },
          { hip: [55.2, 127.9], tor: -35, ank: [86, G], ua: 90, fa: 90 }
        ] } },

    /* PIERNAS */
    { id: 'rumano', name: 'Peso muerto rumano', group: 'Piernas', m: 'piernas', eq: 'barra', c: 1, reps: [8, 12], bw: 0, step: 2.5, def: [50, 8], fem: 0.65,
      anchors: [0.3, 0.6, 1.0, 1.4, 1.9, 2.4],
      cues: ['Rodillas ligeramente flexionadas y espalda recta', 'Lleva la cadera atrás deslizando la barra por las piernas', 'Sube empujando la cadera hacia delante'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'thigh' }, { s: 'torso', a: 0, b: 0.5 }],
        poses: [
          { hip: [88, 101], tor: -92, ank: [86, G], ua: 90, fa: 90 },
          { hip: [52, 110], tor: -35, ank: [86, G], ua: 90, fa: 90 }
        ] } },
    { id: 'sentadilla', name: 'Sentadilla', group: 'Piernas', m: 'piernas', eq: 'barra', c: 1, reps: [5, 10], bw: 0, step: 2.5, def: [50, 8], fem: 0.65,
      anchors: [0.4, 0.75, 1.25, 1.75, 2.5, 3.25],
      cues: ['Barra sobre los hombros y pecho arriba', 'Baja con la cadera hacia atrás hasta paralelo', 'Empuja con todo el pie y sube'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, -0.2], elbowPref: [-0.5, 1], hl: [{ s: 'thigh' }, { s: 'torso', a: 0, b: 0.3 }],
        poses: [
          { hip: [88, G - 64.5], tor: -84, ank: [88, G], ua: 122, fa: -62 },
          { hip: [62, G - 39], tor: -58, ank: [88, G], ua: 122, fa: -62 }
        ] } },
    { id: 'prensa', name: 'Prensa de piernas', group: 'Piernas', m: 'piernas', eq: 'maquina', c: 1, reps: [8, 12], bw: 0, step: 5, def: [100, 10], fem: 0.65,
      anchors: [0.5, 1.0, 1.75, 2.5, 3.5, 4.5],
      cues: ['Pies a la anchura de los hombros en la plataforma', 'Baja hasta unos 90° sin despegar la cadera', 'Empuja sin bloquear las rodillas'],
      anim: { scene: 'legpress', prop: 'platform', plat: { dir: -45, off: 9, len: 18 }, kneePref: [-0.5, -1], elbowPref: [0, 1], hl: [{ s: 'thigh' }],
        poses: [
          { hip: [70, 138], tor: -135, ank: [116, 96], ft: -80, ua: 55, fa: 20 },
          { hip: [70, 138], tor: -135, ank: [98, 116], ft: -80, ua: 55, fa: 20 }
        ] } },
    { id: 'extension', name: 'Extensión de cuádriceps', group: 'Piernas', m: 'piernas', eq: 'maquina', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [30, 12], fem: 0.65,
      anchors: [0.2, 0.4, 0.7, 1.0, 1.4, 1.8],
      cues: ['Rodillas alineadas con el eje de la máquina', 'Estira las piernas y aprieta arriba 1 s', 'Baja despacio sin dejar caer el peso'],
      anim: { scene: 'legext', prop: 'plate', propAt: 'ank', plateR: 6, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'thigh' }],
        poses: [
          { hip: [64, 128], tor: -95, th: 0, sn: 85, ua: 70, fa: 45 },
          { hip: [64, 128], tor: -95, th: 0, sn: -12, ua: 70, fa: 45 }
        ] } },
    { id: 'curlfem', name: 'Curl femoral tumbado', group: 'Piernas', m: 'piernas', eq: 'maquina', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [25, 12], fem: 0.65,
      anchors: [0.15, 0.3, 0.5, 0.75, 1.05, 1.35],
      cues: ['Cadera pegada al banco', 'Lleva los talones hacia los glúteos', 'Baja lento hasta estirar casi del todo'],
      anim: { scene: 'legcurl', prop: 'plate', propAt: 'ank', plateR: 6, kneePref: [0, -1], elbowPref: [0, 1], hl: [{ s: 'thigh' }, { s: 'shin' }],
        poses: [
          { hip: [80, 133], tor: 0, th: 180, sn: 180, ft: -60, handRel: [12, 10] },
          { hip: [80, 133], tor: 0, th: 180, sn: 235, ft: -60, handRel: [12, 10] }
        ] } },
    { id: 'zancadas', name: 'Zancadas con mancuernas', group: 'Piernas', m: 'piernas', eq: 'mancuernas', c: 1, reps: [8, 12], bw: 0, step: 2, def: [10, 10], fem: 0.65,
      anchors: [0.1, 0.2, 0.32, 0.48, 0.68, 0.9],
      cues: ['Peso por cada mancuerna', 'Da un paso largo y baja la rodilla trasera', 'Empuja con el pie de delante para volver'],
      anim: { scene: 'none', prop: 'plate', plateR: 7, kneePref: [1, -0.3], kneePref2: [0.5, 1], elbowPref: [0, 1], hl: [{ s: 'thigh' }],
        poses: [
          { hip: [88, G - 64.5], tor: -90, ank: [88, G], ft: 0, ank2: [82, G], ft2: 0, ua: 90, fa: 90 },
          { hip: [88, G - 44.5], tor: -90, ank: [114, G], ft: 0, ank2: [60, G - 9], ft2: 60, ua: 90, fa: 90 }
        ] } },
    { id: 'hipthrust', name: 'Hip thrust', group: 'Piernas', m: 'piernas', eq: 'barra', c: 1, reps: [8, 12], bw: 0, step: 5, def: [40, 10], fem: 0.65,
      anchors: [0.3, 0.6, 1.0, 1.5, 2.1, 2.8],
      cues: ['Espalda alta apoyada en el banco', 'Empuja con los talones y sube la cadera', 'Aprieta los glúteos arriba 1 s'],
      anim: { scene: 'hipthrust', prop: 'plate', plateR: 11, kneePref: [0, -1], elbowPref: [0, 1], hl: [{ s: 'thigh' }, { s: 'torso', a: 0, b: 0.25 }],
        poses: [
          { sh: [44, 135], tor: 180, ank: [122, G], hh: [6, -7] },
          { sh: [44, 135], tor: -151, ank: [122, G], hh: [6, -7] }
        ] } },
    { id: 'gemelos', name: 'Elevación de talones', group: 'Piernas', m: 'piernas', eq: 'maquina', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [40, 12], fem: 0.65,
      anchors: [0.25, 0.5, 1.0, 1.5, 2.25, 3.0],
      cues: ['Apoya la punta del pie y estira el tobillo', 'Sube todo lo que puedas y pausa 1 s', 'Baja hasta notar el estiramiento'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [-0.5, 1], hl: [{ s: 'shin' }],
        poses: [
          { hip: [99, G - 64], tor: -90, ank: [99, G], ft: 0, ua: 122, fa: -62 },
          { hip: [102.9, G - 73.4], tor: -90, ank: [102.9, G - 9.4], ft: 50, ua: 122, fa: -62 }
        ] } },

    /* HOMBROS */
    { id: 'ohp', name: 'Press militar', group: 'Hombros', m: 'hombros', eq: 'barra', c: 1, reps: [6, 10], bw: 0, step: 2.5, def: [25, 8], fem: 0.65,
      anchors: [0.2, 0.35, 0.55, 0.8, 1.1, 1.4],
      cues: ['Glúteos y abdomen apretados', 'Empuja la barra en línea recta sobre la cabeza', 'Bloquea arriba y baja con control'],
      anim: { scene: 'none', prop: 'plate', kneePref: [1, 0], elbowPref: [0.3, 1], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.7, b: 1 }], poses: OHP } },
    { id: 'ohpdb', name: 'Press de hombro con mancuernas', group: 'Hombros', m: 'hombros', eq: 'mancuernas', c: 1, reps: [8, 12], bw: 0, step: 2, def: [12, 10], fem: 0.65,
      anchors: [0.08, 0.16, 0.26, 0.4, 0.58, 0.78],
      cues: ['Peso por cada mancuerna', 'Empuja hacia arriba sin arquear la espalda', 'Baja hasta la altura de las orejas'],
      anim: { scene: 'none', prop: 'plate', plateR: 8, kneePref: [1, 0], elbowPref: [0.3, 1], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.7, b: 1 }], poses: OHP } },
    { id: 'pressmaqh', name: 'Press de hombro en máquina', group: 'Hombros', m: 'hombros', eq: 'maquina', c: 1, reps: [8, 12], bw: 0, step: 2.5, def: [25, 10], fem: 0.65,
      anchors: [0.2, 0.35, 0.55, 0.8, 1.1, 1.45],
      cues: ['Asiento a la altura de los hombros', 'Empuja arriba sin despegar la espalda', 'Baja sin dejar caer el peso'],
      anim: { scene: 'seated', prop: 'plate', plateR: 4, kneePref: [0.6, -1], elbowPref: [0.3, 1], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.7, b: 1 }],
        poses: [
          { hip: [70, 130], tor: -93, ank: [100, G], ua: -88, fa: -88 },
          { hip: [70, 130], tor: -93, ank: [100, G], ua: 75, fa: -80 }
        ] } },
    { id: 'laterales', name: 'Elevaciones laterales', group: 'Hombros', m: 'hombros', eq: 'mancuernas', c: 0, reps: [12, 20], bw: 0, step: 1, def: [6, 12], fem: 0.65,
      anchors: [0.03, 0.06, 0.1, 0.15, 0.22, 0.3],
      cues: ['Peso por cada mancuerna', 'Sube los brazos hasta la altura de los hombros', 'Baja despacio, sin balancear'],
      anim: { scene: 'none', prop: 'plate', plateR: 7, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.8, b: 1 }],
        poses: [
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: 92, fa: 88 },
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: -5, fa: -10 }
        ] } },
    { id: 'facepull', name: 'Face pull', group: 'Hombros', m: 'hombros', eq: 'polea', c: 0, reps: [12, 20], bw: 0, step: 2.5, def: [20, 15], fem: 0.65,
      anchors: [0.1, 0.2, 0.32, 0.46, 0.65, 0.85],
      cues: ['Polea a la altura de la cara', 'Tira de la cuerda hacia la frente abriendo los codos', 'Aprieta la parte trasera del hombro'],
      anim: { scene: 'facepull', prop: 'cable', pulley: [152, 58], po: 0, kneePref: [1, 0], elbowPref: [-0.8, -0.6], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.8, b: 1 }],
        poses: [
          { hip: [88, G - 65], tor: -90, ank: [88, G], hand: [138, 64] },
          { hip: [88, G - 65], tor: -90, ank: [88, G], hand: [84, 46] }
        ] } },

    /* BRAZOS */
    { id: 'curl', name: 'Curl de bíceps con barra', group: 'Brazos', m: 'biceps', eq: 'barra', c: 0, reps: [8, 12], bw: 0, step: 1, def: [15, 10], fem: 0.65,
      anchors: [0.12, 0.25, 0.4, 0.6, 0.85, 1.1],
      cues: ['Codos pegados al cuerpo', 'Sube la barra sin balancear la espalda', 'Baja lento y estira del todo'],
      anim: { scene: 'none', prop: 'plate', plateR: 9, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'uarm' }], poses: CURL } },
    { id: 'curldb', name: 'Curl con mancuernas', group: 'Brazos', m: 'biceps', eq: 'mancuernas', c: 0, reps: [8, 12], bw: 0, step: 1, def: [8, 10], fem: 0.65,
      anchors: [0.06, 0.12, 0.2, 0.3, 0.42, 0.55],
      cues: ['Peso por cada mancuerna', 'Gira la muñeca al subir', 'Baja despacio hasta estirar el brazo'],
      anim: { scene: 'none', prop: 'plate', plateR: 7, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'uarm' }], poses: CURL } },
    { id: 'pushdown', name: 'Extensión de tríceps en polea', group: 'Brazos', m: 'triceps', eq: 'polea', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [20, 12], fem: 0.65,
      anchors: [0.15, 0.3, 0.5, 0.75, 1.0, 1.3],
      cues: ['Codos pegados a las costillas', 'Empuja hacia abajo hasta estirar los brazos', 'Sube controlado hasta el pecho'],
      anim: { scene: 'cablehigh', prop: 'cable', pulley: [112, 26], po: 0, kneePref: [1, 0], elbowPref: [0, 1], hl: [{ s: 'uarm' }],
        poses: [
          { hip: [88, G - 65], tor: -86, ank: [88, G], ua: 88, fa: -62 },
          { hip: [88, G - 65], tor: -86, ank: [88, G], ua: 88, fa: 85 }
        ] } },
    { id: 'nuca', name: 'Extensión de tríceps sobre la cabeza', group: 'Brazos', m: 'triceps', eq: 'mancuernas', c: 0, reps: [10, 15], bw: 0, step: 2, def: [10, 12], fem: 0.65,
      anchors: [0.1, 0.18, 0.3, 0.45, 0.65, 0.85],
      cues: ['Una mancuerna sujeta con las dos manos', 'Codos apuntando al techo', 'Baja detrás de la cabeza y estira arriba'],
      anim: { scene: 'none', prop: 'plate', plateR: 8, kneePref: [1, 0], elbowPref: [-0.5, 1], hl: [{ s: 'uarm' }, { s: 'farm' }],
        poses: [
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: -85, fa: -88 },
          { hip: [88, G - 65], tor: -90, ank: [88, G], ua: -85, fa: -240 }
        ] } },
    { id: 'fondos', name: 'Fondos', group: 'Brazos', m: 'triceps', eq: 'cuerpo', c: 1, reps: [6, 12], bw: 1, step: 2.5, def: [0, 8], fem: 0.85,
      anchors: [0.5, 0.9, 1.15, 1.4, 1.75, 2.2],
      cues: ['Hombros abajo y pecho ligeramente adelante', 'Baja hasta que los codos formen 90°', 'Empuja hasta estirar los brazos'],
      anim: { scene: 'dips', prop: 'none', kneePref: [1, 0], elbowPref: [-1, 0.2], hl: [{ s: 'uarm' }, { s: 'torso', a: 0.6, b: 1 }],
        poses: [
          { sh: [104, 52], tor: -80, ank: [84, 128], hand: [104, 100] },
          { sh: [104, 76], tor: -70, ank: [76, 146], hand: [104, 100] }
        ] } },

    /* CORE */
    { id: 'crunch', name: 'Crunch abdominal', group: 'Core', m: 'core', eq: 'cuerpo', c: 0, reps: [12, 20], bw: 0.3, step: 2, def: [0, 15], fem: 0.9,
      anchors: [0.3, 0.35, 0.4, 0.45, 0.52, 0.6],
      cues: ['Rodillas flexionadas y lumbar pegada al suelo', 'Sube el pecho hacia las rodillas', 'Baja sin relajar del todo'],
      anim: { scene: 'none', prop: 'none', kneePref: [0, -1], elbowPref: [0, -1], hl: [{ s: 'torso', a: 0.1, b: 0.9 }],
        poses: [
          { hip: [60, 160], tor: 0, ank: [22, G], hand: [114, 152] },
          { hip: [60, 160], tor: -40, ank: [22, G], hand: [100, 128] }
        ] } },
    { id: 'elevpiernas', name: 'Elevación de piernas colgado', group: 'Core', m: 'core', eq: 'cuerpo', c: 0, reps: [8, 15], bw: 0.5, step: 1, def: [0, 10], fem: 0.9,
      anchors: [0.5, 0.57, 0.67, 0.75, 0.88, 1.0],
      cues: ['Cuelga con los hombros activos', 'Sube las piernas sin balancearte', 'Baja despacio sin dejarte caer'],
      anim: { scene: 'hangbar', prop: 'none', kneePref: [1, 0.4], elbowPref: [0.3, 1], hl: [{ s: 'thigh' }, { s: 'torso', a: 0, b: 0.5 }],
        poses: [
          { sh: [100, 59], tor: -90, ank: [100, 162], ft: 70, hand: [106, 10] },
          { sh: [100, 59], tor: -98, ank: [168, 96], ft: -20, hand: [106, 10] }
        ] } },
    { id: 'crunchpolea', name: 'Crunch en polea', group: 'Core', m: 'core', eq: 'polea', c: 0, reps: [10, 15], bw: 0, step: 2.5, def: [30, 12], fem: 0.65,
      anchors: [0.2, 0.4, 0.65, 0.95, 1.3, 1.7],
      cues: ['De rodillas, cuerda junto a la cabeza', 'Encoge el abdomen llevando los codos a las rodillas', 'Vuelve sin perder la tensión'],
      anim: { scene: 'cablehigh', prop: 'cable', pulley: [112, 26], po: 0, kneePref: [0, -1], elbowPref: [0.6, 1], hl: [{ s: 'torso', a: 0.1, b: 0.8 }],
        poses: [
          { hip: [80, 128], tor: -82, th: 90, sn: 180, ft: 180, handRel: [10, -18] },
          { hip: [80, 128], tor: -30, th: 90, sn: 180, ft: 180, handRel: [8, -4] }
        ] } }
  ];

  var BYID = {};
  EXERCISES.forEach(function (e) { BYID[e.id] = e; });

  global.RANGO = {
    EXERCISES: EXERCISES, BYID: BYID, TIERS: TIERS, TOP: TOP, GROUPS: GROUPS, EQUIP: EQUIP, FOCUS: FOCUS, AUTO: AUTO, PROGRAMS: PROGRAMS,
    SCENES: SCENES, SCENEBOX: SCENEBOX, G: G
  };
})(window);
