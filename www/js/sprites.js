'use strict';
// Procedurally generated pixel-art sprites, cached on offscreen canvases.
const Sprites = (() => {
  const cache = new Map();
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const PAL = {
    yellow: { l: '#fcfc9c', m: '#e8b800', d: '#8c5c00' },
    green: { l: '#b8f8b8', m: '#00b800', d: '#005800' },
    silver: { l: '#fcfcfc', m: '#b0b0b0', d: '#5c5c5c' },
    red: { l: '#fcbcb0', m: '#d82800', d: '#801000' },
    gold: { l: '#fcf0b0', m: '#d8a000', d: '#705000' },
    teal: { l: '#b0fcfc', m: '#00a8a8', d: '#005058' },
  };

  function treads(g, p, x, y, w, h, frame) {
    g.fillStyle = p.d; g.fillRect(x, y, w, h);
    g.fillStyle = p.m;
    for (let yy = y + (frame & 1); yy < y + h; yy += 2) g.fillRect(x, yy, w, 1);
    g.fillStyle = p.l; g.fillRect(x, y, 1, h);
  }
  function box(g, p, x, y, w, h) {
    g.fillStyle = p.m; g.fillRect(x, y, w, h);
    g.fillStyle = p.l; g.fillRect(x, y, w, 1); g.fillRect(x, y, 1, h);
    g.fillStyle = p.d; g.fillRect(x, y + h - 1, w, 1); g.fillRect(x + w - 1, y, 1, h);
  }
  function barrel(g, p, x, y, w, h) {
    g.fillStyle = p.l; g.fillRect(x, y, w, h);
    g.fillStyle = p.m; g.fillRect(x + w - 1, y, 1, h);
  }

  // kind: 'p0'..'p3' (player levels) or 'e0'..'e3' (enemy types)
  function drawTankUp(g, kind, p, frame) {
    switch (kind) {
      case 'p0': case 'p1': case 'p2': case 'p3': {
        const lvl = +kind[1];
        treads(g, p, 1, 3, 3, 13, frame); treads(g, p, 12, 3, 3, 13, frame);
        box(g, p, 4, 5, 8, 10);
        if (lvl >= 3) { box(g, p, 3, 6, 10, 8); }
        const tw = lvl >= 2 ? 8 : 6;
        box(g, p, 8 - tw / 2, 7, tw, 6);
        g.fillStyle = p.d; g.fillRect(7, 9, 2, 2);
        barrel(g, p, 7, lvl >= 1 ? 0 : 1, 2, 8);
        if (lvl >= 2) { g.fillStyle = p.l; g.fillRect(6, 0, 4, 1); }
        break;
      }
      case 'e0':
        treads(g, p, 1, 1, 3, 14, frame); treads(g, p, 12, 1, 3, 14, frame);
        box(g, p, 4, 4, 8, 9);
        box(g, p, 5, 6, 6, 6);
        g.fillStyle = p.d; g.fillRect(7, 8, 2, 2);
        barrel(g, p, 7, 0, 2, 7);
        break;
      case 'e1':
        treads(g, p, 2, 2, 2, 13, frame); treads(g, p, 12, 2, 2, 13, frame);
        box(g, p, 4, 5, 8, 8);
        box(g, p, 6, 7, 4, 5);
        barrel(g, p, 7, 0, 2, 9);
        g.fillStyle = p.d; g.fillRect(4, 13, 8, 2);
        break;
      case 'e2':
        treads(g, p, 1, 3, 3, 13, frame); treads(g, p, 12, 3, 3, 13, frame);
        box(g, p, 3, 6, 10, 9);
        box(g, p, 5, 5, 6, 8);
        g.fillStyle = p.d; g.fillRect(7, 8, 2, 3);
        barrel(g, p, 7, 1, 2, 6);
        g.fillStyle = p.l; g.fillRect(6, 0, 4, 2);
        break;
      case 'e3':
        treads(g, p, 0, 2, 4, 14, frame); treads(g, p, 12, 2, 4, 14, frame);
        box(g, p, 3, 4, 10, 11);
        g.fillStyle = p.d;
        for (const [x, y] of [[4, 5], [11, 5], [4, 13], [11, 13]]) g.fillRect(x, y, 1, 1);
        box(g, p, 5, 6, 6, 7);
        g.fillStyle = p.l; g.fillRect(7, 8, 2, 2);
        barrel(g, p, 7, 0, 2, 7);
        break;
    }
  }

  function tank(kind, palName, dir, frame) {
    const key = `t:${kind}:${palName}:${dir}:${frame}`;
    let c = cache.get(key);
    if (c) return c;
    const up = mk(16, 16);
    drawTankUp(up.getContext('2d'), kind, PAL[palName], frame);
    c = mk(16, 16);
    const g = c.getContext('2d');
    g.translate(8, 8); g.rotate(dir * Math.PI / 2); g.drawImage(up, -8, -8);
    cache.set(key, c);
    return c;
  }

  // ---------- Pixel maps ----------
  const COLORS = {
    w: '#fcfcfc', g: '#a8a8a8', k: '#404040', r: '#e03000', y: '#f8d800',
    b: '#3c78fc', o: '#fc9838', n: '#503000', G: '#30b030', K: '#000',
  };
  function fromMap(rows, key) {
    let c = cache.get(key);
    if (c) return c;
    c = mk(rows[0].length, rows.length);
    const g = c.getContext('2d');
    rows.forEach((row, y) => {
      for (let x = 0; x < row.length; x++) {
        const col = COLORS[row[x]];
        if (col) { g.fillStyle = col; g.fillRect(x, y, 1, 1); }
      }
    });
    cache.set(key, c);
    return c;
  }

  const EAGLE = [
    '................',
    '.w............w.',
    '.ww....ww....ww.',
    '.www..wwkw..www.',
    '.wwww.wwww.wwww.',
    '..wwwwwwwwwwww..',
    '..wwggwwwwggww..',
    '...wwgwwwwgww...',
    '....wwwwwwww....',
    '.....wwwwww.....',
    '.....ww..ww.....',
    '....www..www....',
    '....ggg..ggg....',
    '...wwwwwwwwww...',
    '..gggggggggggg..',
    '................',
  ];
  const FLAG = [
    '................',
    '..k.............',
    '..kwwwwwww......',
    '..kwwwrwwww.....',
    '..kwwrrrwwww....',
    '..kwwwrwwww.....',
    '..kwwwwwww......',
    '..k.............',
    '..k.......gg....',
    '..k....gggggg...',
    '.gkgg.gggkgggg..',
    'gggggggkkgggkggg',
    'ggkggggggggggggg',
    'gggggkggggkgggkg',
    'kggggggggggggggg',
    '................',
  ];

  const BONUS = {
    helmet: [
      '................',
      '................',
      '.....wwwwww.....',
      '...wwwwwwwwww...',
      '..wwggwwwwwwww..',
      '..wggwwwwwwwwww.',
      '.wwgwwwwwwwwwww.',
      '.wwwwwwwwwwwwww.',
      '.wwwwwwwkkkkkkk.',
      '.wwwwwwk........',
      '.wwwwwwk........',
      '.gggggk.........',
      '................',
      '................',
    ],
    clock: [
      '................',
      '......wwww......',
      '....ww.kk.ww....',
      '...w...kk...w...',
      '..w....kk....w..',
      '..w....kk....w..',
      '.w.....kk.....w.',
      '.wkk...kk...kkw.',
      '.w.....kkkk...w.',
      '..w......kkk.w..',
      '..w..........w..',
      '...w........w...',
      '....ww....ww....',
      '......wwww......',
    ],
    shovel: [
      '................',
      '............ww..',
      '...........wwww.',
      '............ww..',
      '...........n....',
      '..........n.....',
      '.........n......',
      '....ggg.n.......',
      '...gwwwg........',
      '..gwwwwwg.......',
      '..gwwwwwg.......',
      '..gwwwwg........',
      '...gwwg.........',
      '....gg..........',
    ],
    star: [
      '................',
      '.......ww.......',
      '.......ww.......',
      '......wwww......',
      '......wwww......',
      '.wwwwwwwwwwwwww.',
      '..wwwwwwwwwwww..',
      '...wwwwwwwwww...',
      '....wwwwwwww....',
      '....wwwwwwww....',
      '...wwwww.wwwww..',
      '...wwww...wwww..',
      '..www.......www.',
      '................',
    ],
    grenade: [
      '................',
      '.........ww.....',
      '........w..w....',
      '......gg...w....',
      '......gg........',
      '....wwwwww......',
      '...wwkwwkww.....',
      '..wwwwwwwwww....',
      '..wkwwkwwkww....',
      '..wwwwwwwwww....',
      '..wwkwwkwwkw....',
      '..wwwwwwwwww....',
      '...wwkwwkww.....',
      '....wwwwww......',
    ],
    tank: [
      '................',
      '................',
      '.......ww.......',
      '.......ww.......',
      '..www..ww..www..',
      '..wkw.wwww.wkw..',
      '..www.wwww.www..',
      '..wkwwwwwwwwkw..',
      '..wwwwwkkwwwww..',
      '..wkwwwwwwwwkw..',
      '..wwwwwwwwwwww..',
      '..wkw......wkw..',
      '..www......www..',
      '................',
    ],
  };

  function bonusIcon(type) {
    const key = 'bonus:' + type;
    let c = cache.get(key);
    if (c) return c;
    const icon = fromMap(BONUS[type], 'raw:' + type);
    c = mk(16, 16);
    const g = c.getContext('2d');
    // Black outline so icons read on any terrain.
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(icon, dx, 1 + dy);
    g.globalCompositeOperation = 'source-in'; g.fillStyle = '#000'; g.fillRect(0, 0, 16, 16);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(icon, 0, 1);
    cache.set(key, c);
    return c;
  }

  // ---------- Effects ----------
  function explosion(size, frame) {
    const key = `x:${size}:${frame}`;
    let c = cache.get(key);
    if (c) return c;
    c = mk(size, size);
    const g = c.getContext('2d');
    const r0 = size / 2, radius = r0 * [0.45, 0.75, 1.0, 0.85][frame];
    let seed = size * 13 + frame * 7 + 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r0, y + 0.5 - r0) / radius + rnd() * 0.3 - 0.15;
      if (d > 1) continue;
      g.fillStyle = d < 0.35 ? '#fcfcfc' : d < 0.6 ? '#fc7460' : d < 0.8 ? '#b01800' : '#6c1480';
      g.fillRect(x, y, 1, 1);
    }
    cache.set(key, c);
    return c;
  }

  function spawnStar(frame) { // frame 0..3
    const key = 'spawn:' + frame;
    let c = cache.get(key);
    if (c) return c;
    c = mk(16, 16);
    const g = c.getContext('2d');
    const r = [2, 4, 6, 7][frame];
    g.fillStyle = '#fcfcfc';
    g.fillRect(8 - r, 7, r * 2, 2); g.fillRect(7, 8 - r, 2, r * 2);
    g.fillStyle = '#9ce0fc';
    for (let i = 1; i < r * 0.7; i++) {
      g.fillRect(8 + i - 1, 8 + i - 1, 1, 1); g.fillRect(8 - i, 8 - i, 1, 1);
      g.fillRect(8 + i - 1, 8 - i, 1, 1); g.fillRect(8 - i, 8 + i - 1, 1, 1);
    }
    g.fillStyle = '#fcfcfc'; g.fillRect(6, 6, 4, 4);
    cache.set(key, c);
    return c;
  }

  function shield(frame) {
    const key = 'shield:' + frame;
    let c = cache.get(key);
    if (c) return c;
    c = mk(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = '#fcfcfc';
    for (let a = 0; a < 48; a++) {
      if ((a + frame * 3) % 6 > 2) continue;
      const t = a / 48 * Math.PI * 2;
      g.fillRect(Math.round(7.5 + Math.cos(t) * 7.5), Math.round(7.5 + Math.sin(t) * 7.5), 1, 1);
    }
    cache.set(key, c);
    return c;
  }

  return {
    tank, bonusIcon, explosion, spawnStar, shield,
    eagle: () => fromMap(EAGLE, 'eagle'),
    flag: () => fromMap(FLAG, 'flag'),
    BONUS_TYPES: Object.keys(BONUS),
  };
})();
