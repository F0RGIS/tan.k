'use strict';
// Unified input: keyboard, gamepads and on-screen touch controls.
// Directions: 0 up, 1 right, 2 down, 3 left.
const Input = (() => {
  const DIRS = ['up', 'right', 'down', 'left'];
  // Per-player held directions (ordered by press time) from each source.
  const kb = [[], []], touchDirs = [];
  const kbFire = [false, false];
  let touchFire = false;
  const padState = [{ dir: -1, fire: false, btn: {} }, { dir: -1, fire: false, btn: {} }];
  let edges = new Set();
  let twoPlayer = false;
  let lastSource = window.matchMedia && matchMedia('(pointer: coarse)').matches ? 'touch' : 'keyboard';

  const KEYMAP = {
    KeyW: [0, 0], KeyD: [0, 1], KeyS: [0, 2], KeyA: [0, 3],
    ArrowUp: [1, 0], ArrowRight: [1, 1], ArrowDown: [1, 2], ArrowLeft: [1, 3],
  };
  const FIRE = {
    Space: 0, KeyF: 0, KeyJ: 0, KeyK: 0, KeyZ: 0, KeyX: 0,
    Enter: 1, NumpadEnter: 1, Numpad0: 1, ControlRight: 1, ShiftRight: 1,
  };

  function pushDir(list, d) { const i = list.indexOf(d); if (i >= 0) list.splice(i, 1); list.push(d); }
  function popDir(list, d) { const i = list.indexOf(d); if (i >= 0) list.splice(i, 1); }

  window.addEventListener('keydown', e => {
    Sfx.init();
    lastSource = 'keyboard';
    const k = e.code;
    if (KEYMAP[k]) {
      const [p, d] = KEYMAP[k];
      if (!e.repeat) { pushDir(kb[p], d); edges.add(DIRS[d]); }
      e.preventDefault();
    }
    if (k in FIRE) {
      if (!e.repeat) { kbFire[FIRE[k]] = true; edges.add('fire'); }
      e.preventDefault();
    }
    if (!e.repeat) {
      if (k === 'Enter' || k === 'NumpadEnter' || k === 'Space') edges.add('start');
      if (k === 'Escape' || k === 'KeyP' || k === 'Pause') edges.add('pause');
      if (k === 'Escape' || k === 'Backspace') edges.add('back');
      if (k === 'KeyM') edges.add('mute');
      if (k === 'F11' || (k === 'Enter' && e.altKey)) { toggleFullscreen(); e.preventDefault(); }
    }
  });
  window.addEventListener('keyup', e => {
    const k = e.code;
    if (KEYMAP[k]) { const [p, d] = KEYMAP[k]; popDir(kb[p], d); }
    if (k in FIRE) kbFire[FIRE[k]] = false;
  });
  window.addEventListener('blur', () => {
    kb[0].length = kb[1].length = 0; kbFire[0] = kbFire[1] = false;
    touchDirs.length = 0; touchFire = false;
    edges.add('blur');
  });

  function toggleFullscreen() {
    const el = document.documentElement;
    if (!document.fullscreenElement) (el.requestFullscreen || el.webkitRequestFullscreen || (() => {})).call(el);
    else (document.exitFullscreen || document.webkitExitFullscreen || (() => {})).call(document);
  }

  // ---------- Touch controls ----------
  function setupTouch() {
    const pad = document.getElementById('dpad');
    const knob = document.getElementById('dpad-knob');
    const fire = document.getElementById('btn-fire');
    const start = document.getElementById('btn-start');
    const pauseBtn = document.getElementById('btn-pause');
    if (!pad) return;
    let padPointer = null, curDir = -1;

    function setDir(d) {
      if (d === curDir) return;
      curDir = d;
      touchDirs.length = 0;
      if (d >= 0) { touchDirs.push(d); edges.add(DIRS[d]); if (navigator.vibrate) navigator.vibrate(8); }
      pad.dataset.dir = d >= 0 ? DIRS[d] : '';
    }
    function padMove(e) {
      const r = pad.getBoundingClientRect();
      const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
      let dx = e.clientX - cx, dy = e.clientY - cy;
      const len = Math.hypot(dx, dy), max = r.width * 0.32;
      if (len < r.width * 0.1) setDir(-1);
      else if (Math.abs(dx) > Math.abs(dy)) setDir(dx > 0 ? 1 : 3);
      else setDir(dy > 0 ? 2 : 0);
      if (len > max) { dx = dx / len * max; dy = dy / len * max; }
      knob.style.transform = `translate(${dx}px, ${dy}px)`;
    }
    pad.addEventListener('pointerdown', e => {
      Sfx.init(); lastSource = 'touch'; showTouch(true);
      padPointer = e.pointerId; pad.setPointerCapture(e.pointerId); padMove(e); e.preventDefault();
    });
    pad.addEventListener('pointermove', e => { if (e.pointerId === padPointer) padMove(e); });
    const padEnd = e => {
      if (e.pointerId !== padPointer) return;
      padPointer = null; setDir(-1); knob.style.transform = '';
    };
    pad.addEventListener('pointerup', padEnd);
    pad.addEventListener('pointercancel', padEnd);

    function button(el, onDown, onUp) {
      el.addEventListener('pointerdown', e => {
        Sfx.init(); lastSource = 'touch'; showTouch(true);
        el.setPointerCapture(e.pointerId); el.classList.add('on'); onDown(); e.preventDefault();
        if (navigator.vibrate) navigator.vibrate(10);
      });
      const up = () => { el.classList.remove('on'); onUp && onUp(); };
      el.addEventListener('pointerup', up);
      el.addEventListener('pointercancel', up);
    }
    button(fire, () => { touchFire = true; edges.add('fire'); edges.add('start'); }, () => { touchFire = false; });
    button(start, () => edges.add('start'));
    button(pauseBtn, () => edges.add('pause'));
    // Tapping the screen itself acts as "start" in menus.
    document.getElementById('game').addEventListener('pointerdown', e => {
      Sfx.init(); if (e.pointerType === 'touch') { lastSource = 'touch'; showTouch(true); }
      edges.add('tap');
    });
    document.addEventListener('contextmenu', e => e.preventDefault());
  }

  function showTouch(on) { document.body.classList.toggle('touch', on); }

  // ---------- Gamepads ----------
  function pollPads() {
    const pads = navigator.getGamepads ? navigator.getGamepads() : [];
    let n = 0;
    for (const gp of pads) {
      if (!gp || !gp.connected || n > 1) continue;
      const st = padState[n++];
      const b = i => gp.buttons[i] && gp.buttons[i].pressed;
      const ax = gp.axes[0] || 0, ay = gp.axes[1] || 0;
      let d = -1;
      if (b(12) || ay < -0.5) d = 0;
      else if (b(13) || ay > 0.5) d = 2;
      else if (b(14) || ax < -0.5) d = 3;
      else if (b(15) || ax > 0.5) d = 1;
      if (Math.abs(ax) > 0.5 && Math.abs(ax) > Math.abs(ay) && !b(12) && !b(13)) d = ax > 0 ? 1 : 3;
      if (d !== st.dir && d >= 0) edges.add(DIRS[d]);
      st.dir = d;
      const fire = b(0) || b(1) || b(2) || b(3) || b(6) || b(7);
      if (fire && !st.fire) { edges.add('fire'); edges.add('start'); }
      st.fire = fire;
      if (b(9) && !st.btn[9]) { edges.add('pause'); edges.add('start'); }
      if (b(8) && !st.btn[8]) edges.add('back');
      st.btn[9] = b(9); st.btn[8] = b(8);
      if (d >= 0 || fire) { lastSource = 'gamepad'; showTouch(false); }
    }
    for (; n < 2; n++) { padState[n].dir = -1; padState[n].fire = false; }
  }

  function dir(p) {
    const lists = [];
    if (p === 0) {
      lists.push(kb[0]);
      if (!twoPlayer) lists.push(kb[1]);
      if (touchDirs.length) return touchDirs[touchDirs.length - 1];
    } else lists.push(kb[1]);
    for (const l of lists) if (l.length) return l[l.length - 1];
    if (!twoPlayer && p === 0) {
      if (padState[0].dir >= 0) return padState[0].dir;
      if (padState[1].dir >= 0) return padState[1].dir;
    }
    return padState[p].dir;
  }
  function fire(p) {
    if (p === 0) {
      if (kbFire[0] || touchFire || padState[0].fire) return true;
      if (!twoPlayer && (kbFire[1] || padState[1].fire)) return true;
      return false;
    }
    return kbFire[1] || padState[1].fire;
  }

  return {
    setupTouch, showTouch, toggleFullscreen,
    poll: pollPads,
    dir, fire,
    pressed: a => edges.has(a),
    endFrame() { edges = new Set(); },
    setTwoPlayer(v) { twoPlayer = v; },
    get source() { return lastSource; },
  };
})();
