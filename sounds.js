/* RANGO · sonidos sintetizados (sin archivos) */
(function (R) {
  'use strict';
  var ctx = null, on = true, master = null;
  function ensure() {
    if (!ctx) {
      try {
        ctx = new (window.AudioContext || window.webkitAudioContext)();
        master = ctx.createGain(); master.gain.value = 0.9; master.connect(ctx.destination);
      } catch (e) { ctx = null; }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }
  function tone(f, d, type, vol, when, glide) {
    var c = ensure(); if (!c || !on) return;
    var t = c.currentTime + (when || 0), o = c.createOscillator(), g = c.createGain();
    o.type = type || 'sine'; o.frequency.setValueAtTime(f, t);
    if (glide) o.frequency.exponentialRampToValueAtTime(glide, t + d);
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol || 0.2, t + 0.012);
    g.gain.exponentialRampToValueAtTime(0.0001, t + d);
    o.connect(g); g.connect(master); o.start(t); o.stop(t + d + 0.03);
  }
  var N = { C5: 523.25, D5: 587.33, E5: 659.25, G5: 783.99, A5: 880, B5: 987.77, C6: 1046.5, E6: 1318.5, G6: 1568 };
  var S = {
    tap: function () { tone(700, 0.04, 'triangle', 0.06); },
    step: function () { tone(540, 0.035, 'triangle', 0.05); },
    set: function () { tone(N.C5, 0.14, 'sine', 0.22); tone(N.G5, 0.26, 'sine', 0.22, 0.1); },
    tick: function () { tone(880, 0.07, 'square', 0.06); },
    go: function () { tone(N.C6, 0.12, 'square', 0.08); tone(N.C6, 0.12, 'square', 0.08, 0.17); tone(N.G6, 0.34, 'square', 0.09, 0.34); },
    pr: function () { tone(N.E5, 0.1, 'triangle', 0.2); tone(N.A5, 0.1, 'triangle', 0.2, 0.09); tone(N.E6, 0.3, 'triangle', 0.2, 0.18); },
    rankup: function () {
      [N.C5, N.E5, N.G5, N.C6, N.E6].forEach(function (f, i) { tone(f, 0.34, 'triangle', 0.2, i * 0.095); });
      tone(N.G6, 0.9, 'sine', 0.16, 0.5); tone(N.C6, 1.0, 'sine', 0.14, 0.5);
      tone(2093, 0.5, 'sine', 0.05, 0.62, 3000);
    },
    ach: function () { tone(N.G5, 0.12, 'sine', 0.18); tone(N.B5, 0.12, 'sine', 0.18, 0.1); tone(N.G6, 0.34, 'sine', 0.18, 0.2); },
    finish: function () {
      [N.C5, N.E5, N.G5, N.C6].forEach(function (f, i) { tone(f, 0.22, 'triangle', 0.2, i * 0.14); });
      tone(N.C6, 0.9, 'sine', 0.18, 0.56); tone(N.E6, 0.9, 'sine', 0.14, 0.56); tone(N.G6, 0.9, 'sine', 0.12, 0.56);
    },
    start: function () { tone(N.G5, 0.1, 'triangle', 0.18); tone(N.C6, 0.22, 'triangle', 0.2, 0.1); },
    warn: function () { tone(220, 0.18, 'sawtooth', 0.08); }
  };
  R.Sfx = {
    enable: function (v) { on = !!v; },
    play: function (n) { if (on && S[n]) S[n](); },
    unlock: ensure
  };
  ['pointerdown', 'touchstart', 'keydown'].forEach(function (ev) { document.addEventListener(ev, function () { ensure(); }, { once: false, passive: true }); });
})(window.RANGO);
