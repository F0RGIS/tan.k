'use strict';
// Synthesized 8-bit style sound effects via WebAudio (no asset files needed).
const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null, muted = false;
  let engine = null; // {osc, gain, lfo}

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.35;
    master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0 } = {}) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(20, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.4, freq = 1200, delay = 0, q = 1 } = {}) {
    if (!ac) return;
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = freq; f.Q.value = q;
    const g = ac.createGain();
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    s.connect(f); f.connect(g); g.connect(master);
    s.start(t); s.stop(t + dur + 0.02);
  }

  function melody(notes, step = 0.1, type = 'square', vol = 0.18) {
    notes.forEach((n, i) => { if (n) tone(n, step * 0.95, { type, vol, delay: i * step }); });
  }

  const S = {
    fire() { tone(880, 0.08, { slide: -500, vol: 0.18 }); },
    brick() { noise(0.12, { vol: 0.35, freq: 900 }); },
    steel() { tone(1760, 0.06, { type: 'triangle', vol: 0.25 }); tone(2640, 0.05, { type: 'square', vol: 0.08 }); },
    hitArmor() { tone(300, 0.08, { vol: 0.2, slide: 200 }); },
    explode() { noise(0.45, { vol: 0.6, freq: 700 }); tone(120, 0.3, { slide: -80, vol: 0.2 }); },
    bigExplode() { noise(1.0, { vol: 0.7, freq: 500 }); tone(90, 0.8, { slide: -60, vol: 0.3, type: 'sawtooth' }); },
    bonusAppear() { melody([1047, 1319, 1568, 2093], 0.05, 'square', 0.12); },
    bonus() { melody([784, 988, 1175, 1568, 1175, 1568], 0.06, 'square', 0.15); },
    life() { melody([659, 784, 1319, 1047, 1175, 1568], 0.08, 'square', 0.15); },
    pause() { melody([1319, 1047, 1319, 1047], 0.07, 'square', 0.15); },
    tick() { tone(1200, 0.03, { vol: 0.1 }); },
    start() {
      melody([392, 0, 523, 0, 659, 587, 523, 0, 587, 659, 784, 0, 659, 0, 784, 1047], 0.09, 'square', 0.15);
      melody([196, 0, 262, 0, 330, 294, 262, 0, 294, 330, 392, 0, 330, 0, 392, 523], 0.09, 'triangle', 0.25);
    },
    gameOver() { melody([392, 370, 349, 330, 0, 262, 0, 196], 0.18, 'square', 0.15); },
  };

  // Continuous engine rumble: idle vs moving.
  function engineSet(state) { // 0 off, 1 idle, 2 moving
    if (!ac) return;
    if (!engine) {
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 55;
      lfo.frequency.value = 18; lg.gain.value = 12;
      lfo.connect(lg); lg.connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 300;
      g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(master);
      o.start(); lfo.start();
      engine = { o, g, lfo };
    }
    const t = ac.currentTime;
    const vol = state === 0 ? 0 : state === 1 ? 0.035 : 0.06;
    engine.g.gain.setTargetAtTime(vol, t, 0.03);
    engine.o.frequency.setTargetAtTime(state === 2 ? 75 : 50, t, 0.05);
    engine.lfo.frequency.setTargetAtTime(state === 2 ? 26 : 14, t, 0.05);
  }

  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.35; }

  return {
    init, engine: engineSet, setMuted, get muted() { return muted; },
    play(name) { if (ac && !muted && S[name]) S[name](); },
  };
})();
