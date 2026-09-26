'use strict';
// Improved procedural pixel-art sprites for TAN.K
// Cleaner silhouettes, NES Battle City–faithful proportions, sharper 3-tone shading.
const Sprites = (() => {
  const cache = new Map();
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  const PAL = {
    yellow: { l: '#fcfc54', m: '#e8b800', d: '#8c5400', k: '#3c2400' },
    green:  { l: '#b8fcb8', m: '#00b800', d: '#005800', k: '#002800' },
    silver: { l: '#fcfcfc', m: '#b0b0b0', d: '#585858', k: '#202020' },
    red:    { l: '#fcb8a0', m: '#e02800', d: '#780800', k: '#300000' },
    gold:   { l: '#fcf0a0', m: '#d89800', d: '#684000', k: '#281800' },
    teal:   { l: '#a8fcfc', m: '#00a0a8', d: '#004848', k: '#001818' },
  };

  function px(g, c, x, y, w = 1, h = 1) {
    g.fillStyle = c;
    g.fillRect(x, y, w, h);
  }

  function treads(g, p, x, y, w, h, frame) {
    px(g, p.k, x, y, w, h);
    px(g, p.d, x, y, w, 1);
    px(g, p.d, x, y + h - 1, w, 1);
    const off = frame & 1;
    for (let yy = y + 1 + off; yy < y + h - 1; yy += 2) px(g, p.m, x, yy, w, 1);
    for (let yy = y + 2 - off; yy < y + h - 1; yy += 2) px(g, p.d, x, yy, w, 1);
    px(g, p.l, x, y + 1, 1, h - 2);
    px(g, p.k, x + w - 1, y + 1, 1, h - 2);
  }

  function hull(g, p, x, y, w, h) {
    px(g, p.m, x, y, w, h);
    px(g, p.l, x, y, w, 1);
    px(g, p.l, x, y, 1, h);
    px(g, p.d, x, y + h - 1, w, 1);
    px(g, p.d, x + w - 1, y, 1, h);
    px(g, p.k, x + w - 1, y + h - 1, 1, 1);
  }

  function turret(g, p, x, y, w, h) {
    hull(g, p, x, y, w, h);
    const cx = x + ((w / 2) | 0) - 1;
    const cy = y + ((h / 2) | 0) - 1;
    px(g, p.d, cx, cy, 2, 2);
    px(g, p.l, cx, cy, 1, 1);
  }

  function barrel(g, p, x, y, w, h, flared) {
    px(g, p.l, x, y, w, h);
    px(g, p.m, x + w - 1, y, 1, h);
    px(g, p.d, x, y + h - 1, w, 1);
    if (flared) {
      px(g, p.l, x - 1, y, w + 2, 2);
      px(g, p.m, x + w, y, 1, 2);
    }
  }

  // kind: 'p0'..'p3' (player levels) or 'e0'..'e3' (enemy types)
  function drawTankUp(g, kind, p, frame) {
    switch (kind) {
      case 'p0': {
        treads(g, p, 1, 3, 3, 12, frame);
        treads(g, p, 12, 3, 3, 12, frame);
        hull(g, p, 4, 6, 8, 9);
        turret(g, p, 5, 8, 6, 5);
        barrel(g, p, 7, 1, 2, 8, false);
        break;
      }
      case 'p1': {
        treads(g, p, 1, 3, 3, 12, frame);
        treads(g, p, 12, 3, 3, 12, frame);
        hull(g, p, 4, 5, 8, 10);
        turret(g, p, 5, 7, 6, 6);
        barrel(g, p, 7, 0, 2, 8, true);
        break;
      }
      case 'p2': {
        treads(g, p, 1, 2, 3, 13, frame);
        treads(g, p, 12, 2, 3, 13, frame);
        hull(g, p, 4, 5, 8, 10);
        turret(g, p, 4, 7, 8, 6);
        barrel(g, p, 7, 0, 2, 8, true);
        px(g, p.l, 6, 0, 4, 1);
        break;
      }
      case 'p3': {
        treads(g, p, 1, 2, 3, 13, frame);
        treads(g, p, 12, 2, 3, 13, frame);
        hull(g, p, 3, 4, 10, 11);
        turret(g, p, 4, 6, 8, 7);
        barrel(g, p, 7, 0, 2, 7, true);
        px(g, p.l, 5, 0, 6, 1);
        px(g, p.d, 4, 5, 1, 1);
        px(g, p.d, 11, 5, 1, 1);
        px(g, p.d, 4, 13, 1, 1);
        px(g, p.d, 11, 13, 1, 1);
        break;
      }
      case 'e0': {
        treads(g, p, 1, 2, 3, 13, frame);
        treads(g, p, 12, 2, 3, 13, frame);
        hull(g, p, 4, 5, 8, 9);
        turret(g, p, 5, 7, 6, 5);
        barrel(g, p, 7, 0, 2, 8, false);
        break;
      }
      case 'e1': {
        treads(g, p, 2, 2, 2, 13, frame);
        treads(g, p, 12, 2, 2, 13, frame);
        hull(g, p, 4, 5, 8, 8);
        turret(g, p, 6, 7, 4, 5);
        barrel(g, p, 7, 0, 2, 9, false);
        px(g, p.d, 4, 13, 8, 2);
        px(g, p.m, 5, 13, 6, 1);
        break;
      }
      case 'e2': {
        treads(g, p, 1, 3, 3, 12, frame);
        treads(g, p, 12, 3, 3, 12, frame);
        hull(g, p, 3, 6, 10, 9);
        turret(g, p, 5, 6, 6, 7);
        barrel(g, p, 7, 1, 2, 6, true);
        px(g, p.l, 6, 0, 4, 2);
        break;
      }
      case 'e3': {
        treads(g, p, 0, 2, 4, 13, frame);
        treads(g, p, 12, 2, 4, 13, frame);
        hull(g, p, 3, 4, 10, 11);
        px(g, p.d, 4, 5, 1, 1);
        px(g, p.d, 11, 5, 1, 1);
        px(g, p.d, 4, 13, 1, 1);
        px(g, p.d, 11, 13, 1, 1);
        turret(g, p, 5, 6, 6, 7);
        px(g, p.l, 7, 8, 2, 2);
        barrel(g, p, 7, 0, 2, 7, true);
        break;
      }
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
    g.imageSmoothingEnabled = false;
    g.translate(8, 8);
    g.rotate(dir * Math.PI / 2);
    g.drawImage(up, -8, -8);
    cache.set(key, c);
    return c;
  }

  const COLORS = {
    w: '#fcfcfc', g: '#a8a8a8', k: '#303030', r: '#e02800', y: '#f8d800',
    b: '#3c78fc', o: '#fc9838', n: '#503000', G: '#28a028', K: '#000000',
    s: '#d8d8d8', d: '#686868',
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
    '.www..wkwk..www.',
    '.wwww.wwww.wwww.',
    '..wwwwwwwwwwww..',
    '..wwgswwwwsgww..',
    '...wwgwwwwgww...',
    '....wwwwwwww....',
    '.....wwkkww.....',
    '.....ww..ww.....',
    '....www..www....',
    '....GGG..GGG....',
    '...wwwwwwwwww...',
    '..GGGGGGGGGGGG..',
    '................',
  ];

  const FLAG = [
    '................',
    '..k.............',
    '..kwwwwwww......',
    '..kwrrrrwww.....',
    '..kwrrrrrrww....',
    '..kwrrrrwww.....',
    '..kwwwwwww......',
    '..k.............',
    '..k.......GG....',
    '..k....GGGGGG...',
    '.GkGG.GGGkGGGG..',
    'GGGGGGGkkGGGkGGG',
    'GGkGGGGGGGGGGGGG',
    'GGGGGkGGGGkGGGkG',
    'kGGGGGGGGGGGGGGG',
    '................',
  ];

  const BONUS = {
    helmet: [
      '................',
      '................',
      '.....wwwwww.....',
      '...wwwwsswwww...',
      '..wwsswwwwwwww..',
      '..wsswwwwwwwww..',
      '.wwswwwwwwwwwww.',
      '.wwwwwwwwwwwwww.',
      '.wwwwwwwkkkkkkk.',
      '.wwwwwwk........',
      '.wwsswwk........',
      '.GGGGGk.........',
      '................',
      '................',
      '................',
      '................',
    ],
    clock: [
      '................',
      '......wwww......',
      '....wwskksww....',
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
      '................',
      '................',
    ],
    shovel: [
      '................',
      '............ww..',
      '...........wwsw.',
      '............ww..',
      '...........n....',
      '..........n.....',
      '.........n......',
      '....GGG.n.......',
      '...GwwwG........',
      '..GwwwwwG.......',
      '..GwwswwG.......',
      '..GwwwwG........',
      '...GwwG.........',
      '....GG..........',
      '................',
      '................',
    ],
    star: [
      '................',
      '.......ww.......',
      '.......ws.......',
      '......wwww......',
      '......wssw......',
      '.wwwwwwwwwwwwww.',
      '..wwwwsswwwwww..',
      '...wwwwwwwwww...',
      '....wwssssww....',
      '....wwwwwwww....',
      '...wwwww.wwwww..',
      '...wwww...wwww..',
      '..www.......www.',
      '................',
      '................',
      '................',
    ],
    grenade: [
      '................',
      '.........ww.....',
      '........wssw....',
      '......GG...w....',
      '......GG........',
      '....wwwwww......',
      '...wwkwwkww.....',
      '..wwwwsswwww....',
      '..wkwwkwwkww....',
      '..wwwwwwwwww....',
      '..wwkwwkwwkw....',
      '..wwwwsswwww....',
      '...wwkwwkww.....',
      '....wwwwww......',
      '................',
      '................',
    ],
    tank: [
      '................',
      '................',
      '.......ww.......',
      '.......ws.......',
      '..www..ww..www..',
      '..wkw.wwww.wkw..',
      '..www.wssw.www..',
      '..wkwwwwwwwwkw..',
      '..wwwwwkkwwwww..',
      '..wkwwwwwwwwkw..',
      '..wwwwsswwwwww..',
      '..wkw......wkw..',
      '..www......www..',
      '................',
      '................',
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
    for (const [dx, dy] of [[-1, 0], [1, 0], [0, -1], [0, 1]]) g.drawImage(icon, dx, 1 + dy);
    g.globalCompositeOperation = 'source-in';
    g.fillStyle = '#000';
    g.fillRect(0, 0, 16, 16);
    g.globalCompositeOperation = 'source-over';
    g.drawImage(icon, 0, 1);
    cache.set(key, c);
    return c;
  }

  function explosion(size, frame) {
    const key = `x:${size}:${frame}`;
    let c = cache.get(key);
    if (c) return c;
    c = mk(size, size);
    const g = c.getContext('2d');
    const r0 = size / 2, radius = r0 * [0.42, 0.72, 1.0, 0.82][frame];
    let seed = size * 13 + frame * 7 + 1;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let y = 0; y < size; y++) for (let x = 0; x < size; x++) {
      const d = Math.hypot(x + 0.5 - r0, y + 0.5 - r0) / radius + rnd() * 0.28 - 0.14;
      if (d > 1) continue;
      g.fillStyle = d < 0.28 ? '#fcfcfc' : d < 0.5 ? '#fcb030' : d < 0.72 ? '#e03010' : '#681078';
      g.fillRect(x, y, 1, 1);
    }
    cache.set(key, c);
    return c;
  }

  function spawnStar(frame) {
    const key = 'spawn:' + frame;
    let c = cache.get(key);
    if (c) return c;
    c = mk(16, 16);
    const g = c.getContext('2d');
    const r = [2, 4, 6, 7][frame];
    g.fillStyle = '#fcfcfc';
    g.fillRect(8 - r, 7, r * 2, 2);
    g.fillRect(7, 8 - r, 2, r * 2);
    g.fillStyle = '#80d8fc';
    for (let i = 1; i < r * 0.7; i++) {
      g.fillRect(8 + i - 1, 8 + i - 1, 1, 1);
      g.fillRect(8 - i, 8 - i, 1, 1);
      g.fillRect(8 + i - 1, 8 - i, 1, 1);
      g.fillRect(8 - i, 8 + i - 1, 1, 1);
    }
    g.fillStyle = '#fcfc54';
    g.fillRect(7, 7, 2, 2);
    g.fillStyle = '#fcfcfc';
    g.fillRect(6, 6, 4, 4);
    cache.set(key, c);
    return c;
  }

  function shield(frame) {
    const key = 'shield:' + frame;
    let c = cache.get(key);
    if (c) return c;
    c = mk(16, 16);
    const g = c.getContext('2d');
    g.fillStyle = frame & 1 ? '#fcfcfc' : '#80e0fc';
    for (let a = 0; a < 56; a++) {
      if ((a + frame * 3) % 7 > 3) continue;
      const t = a / 56 * Math.PI * 2;
      g.fillRect(Math.round(7.5 + Math.cos(t) * 7.4), Math.round(7.5 + Math.sin(t) * 7.4), 1, 1);
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
