'use strict';
// Synthesized effects. No audio files. Explosions carry a low pressure thump;
// shots are a crack plus a short blast of gas.
const Sfx = (() => {
  let ac = null, master = null, noiseBuf = null, muted = false;
  let engine = null;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    const AC = window.AudioContext || window.webkitAudioContext;
    if (!AC) return;
    ac = new AC();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.4;
    master.connect(ac.destination);
    noiseBuf = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
    const d = noiseBuf.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }

  function tone(freq, dur, { type = 'square', vol = 0.3, slide = 0, delay = 0 } = {}) {
    if (!ac || vol <= 0) return;
    const t = ac.currentTime + delay;
    const o = ac.createOscillator(), g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(Math.max(30, freq), t);
    if (slide) o.frequency.exponentialRampToValueAtTime(Math.max(30, freq + slide), t + dur);
    g.gain.setValueAtTime(vol, t);
    g.gain.exponentialRampToValueAtTime(0.001, t + dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.02);
  }

  function noise(dur, { vol = 0.4, freq = 1200, delay = 0, q = 0.7, type = 'lowpass' } = {}) {
    if (!ac || vol <= 0) return;
    const t = ac.currentTime + delay;
    const s = ac.createBufferSource(); s.buffer = noiseBuf;
    const f = ac.createBiquadFilter(); f.type = type; f.frequency.value = freq; f.Q.value = q;
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
    fire(g = 1) {
      noise(0.045, { vol: 0.42 * g, freq: 1800, type: 'highpass', q: 0.6 });
      tone(160, 0.09, { type: 'sine', slide: -90, vol: 0.32 * g });
      tone(640, 0.04, { type: 'triangle', slide: -360, vol: 0.08 * g });
    },
    fireBig(g = 1) {
      noise(0.07, { vol: 0.5 * g, freq: 900, type: 'bandpass', q: 0.8 });
      tone(95, 0.14, { type: 'sine', slide: -55, vol: 0.42 * g });
      tone(420, 0.06, { type: 'square', slide: -240, vol: 0.07 * g });
    },
    brick(g = 1) {
      noise(0.09, { vol: 0.38 * g, freq: 1600, q: 0.4 });
      noise(0.07, { vol: 0.22 * g, freq: 380, delay: 0.02 });
    },
    steel(g = 1) {
      tone(1480, 0.08, { type: 'triangle', vol: 0.2 * g });
      tone(2140, 0.06, { type: 'square', vol: 0.05 * g, delay: 0.012 });
      noise(0.04, { vol: 0.22 * g, freq: 3200, type: 'highpass' });
    },
    hitArmor(g = 1) {
      tone(880, 0.07, { type: 'square', slide: 640, vol: 0.12 * g });
      tone(320, 0.1, { type: 'triangle', slide: -140, vol: 0.16 * g });
      noise(0.05, { vol: 0.18 * g, freq: 2200, type: 'highpass' });
    },
    explode(g = 1) {
      tone(78, 0.32, { type: 'sine', slide: -42, vol: 0.5 * g });
      noise(0.28, { vol: 0.48 * g, freq: 900 });
      noise(0.22, { vol: 0.16 * g, freq: 240, delay: 0.1 });
    },
    bigExplode(g = 1) {
      tone(46, 0.62, { type: 'sine', slide: -20, vol: 0.58 * g });
      tone(90, 0.35, { type: 'triangle', slide: -40, vol: 0.16 * g });
      noise(0.55, { vol: 0.5 * g, freq: 520 });
      noise(0.3, { vol: 0.14 * g, freq: 180, delay: 0.22 });
    },
    spawn(g = 1) {
      noise(0.22, { vol: 0.16 * g, freq: 500 });
      tone(180, 0.18, { type: 'sawtooth', slide: 220, vol: 0.06 * g });
    },
    bonusAppear() { melody([1047, 1319, 1568, 2093], 0.05, 'square', 0.12); },
    bonus() { melody([784, 988, 1175, 1568, 1175, 1568], 0.06, 'square', 0.15); },
    life() { melody([659, 784, 1319, 1047, 1175, 1568], 0.08, 'square', 0.15); },
    pause() { melody([1319, 1047, 1319, 1047], 0.07, 'square', 0.15); },
    tick() { tone(1200, 0.03, { vol: 0.1 }); },
    start() {
      melody([392, 0, 523, 0, 659, 587, 523, 0, 587, 659, 784, 0, 659, 0, 784, 1047], 0.09, 'square', 0.15);
      melody([196, 0, 262, 0, 330, 294, 262, 0, 294, 330, 392, 0, 330, 0, 392, 523], 0.09, 'triangle', 0.22);
    },
    gameOver() { melody([392, 370, 349, 330, 0, 262, 0, 196], 0.18, 'square', 0.15); },
  };

  function engineSet(state) {
    if (!ac) return;
    if (!engine) {
      const o = ac.createOscillator(), g = ac.createGain(), lfo = ac.createOscillator(), lg = ac.createGain();
      o.type = 'sawtooth'; o.frequency.value = 48;
      lfo.frequency.value = 12; lg.gain.value = 8;
      lfo.connect(lg); lg.connect(o.frequency);
      const f = ac.createBiquadFilter(); f.type = 'lowpass'; f.frequency.value = 240;
      g.gain.value = 0;
      o.connect(f); f.connect(g); g.connect(master);
      o.start(); lfo.start();
      engine = { o, g, lfo };
    }
    const t = ac.currentTime;
    const vol = state === 0 ? 0.0001 : state === 1 ? 0.03 : 0.055;
    engine.g.gain.setTargetAtTime(vol, t, 0.04);
    engine.o.frequency.setTargetAtTime(state === 2 ? 68 : 46, t, 0.06);
    engine.lfo.frequency.setTargetAtTime(state === 2 ? 22 : 11, t, 0.06);
  }

  function setMuted(m) { muted = m; if (master) master.gain.value = m ? 0 : 0.4; }

  return {
    init, engine: engineSet, setMuted, get muted() { return muted; },
    play(name, gain = 1) {
      if (ac && ac.state === 'suspended') ac.resume();
      if (ac && !muted && S[name]) S[name](gain);
    },
  };
})();
