'use strict';
// Top-down 16x16 tanks. Player levels are German (Pz II, III, IV, Tiger I).
// Enemies are Soviet (T-26, BT-7, T-34-85, KV-1). Original pixel art. Pixels are stamped with fillRect — never drawImage —
// because several browsers drop canvas-to-canvas draws when smoothing is off.
const Sprites = (() => {
  const PAL = {
    yellow: { L: '#ece78c', M: '#e89c20', D: '#6b6b00', A: '#e89c20', B: '#6b6b00' },
    green:  { L: '#b4f6ce', M: '#008c30', D: '#005200', A: '#008c30', B: '#005200' },
    silver: { L: '#fcfcfc', M: '#b4b4b4', D: '#5a5a5a', A: '#b4b4b4', B: '#5a5a5a' },
    red:    { L: '#fcb0b0', M: '#e02828', D: '#780818', A: '#e02828', B: '#780818' },
    gold:   { L: '#fce898', M: '#d89800', D: '#684000', A: '#d89800', B: '#684000' },
    teal:   { L: '#b0fcfc', M: '#00a0a8', D: '#004848', A: '#00a0a8', B: '#004848' },
  };

  // A/B are tread links; they swap each animation frame.
  const TANKS = {
    p0: [ // Panzer II — light, short 20mm
      '................',
      '................',
      '.......L........',
      '.......M........',
      '...A...M...B....',
      '...D.MMMMM.A....',
      '...BMM.L.MMD....',
      '...AMMMMMMMB....',
      '...DM.DDD.MA....',
      '...BMMMMMMMD....',
      '...A.DDDDD.B....',
      '...D.......A....',
      '................',
      '................',
      '................',
      '................',
    ],
    p1: [ // Panzer III — medium 50mm
      '.......L........',
      '.......L........',
      '.......M........',
      '..AA...M...BB...',
      '..DD.MMMMM.AA...',
      '..BBMMMMMMMDD...',
      '..AAMM.L.MMBB...',
      '..DDMMMMMMMAA...',
      '..BBMM.D.MMDD...',
      '..AAMMMMMMMBB...',
      '..DD.DDDDD.AA...',
      '..BB.......DD...',
      '..AA.......BB...',
      '................',
      '................',
      '................',
    ],
    p2: [ // Panzer IV Ausf. H — long 75, side skirts
      '.......LL.......',
      '.......LL.......',
      '.......MM.......',
      '.DAA...MM...BBD.',
      '.DDD.MMMMMM.AAD.',
      '.DBBMMMMMMMMDDD.',
      '.DAAMM.LL.MMBBD.',
      '.DDDMMMMMMMMAAD.',
      '.DBBMM.DD.MMDDD.',
      '.DAAMMMMMMMMMBBD',
      '.DDD.DDDDDDD.AAD',
      '.DBB.......DDDD.',
      '.DAA.......BBBD.',
      '................',
      '................',
      '................',
    ],
    p3: [ // Tiger I — wide tracks, long 88
      '......LL........',
      '......LL........',
      '......MM........',
      'AAA...MM...BBB..',
      'DDD.MMMMMM.AAA..',
      'BBBMMMMMMMMDDD..',
      'AAAMM.LL.MMBBB..',
      'DDDMMMMMMMMAAA..',
      'BBBMM.DD.MMDDD..',
      'AAAMMMMMMMMBBB..',
      'DDDDDDDDDDDDAAA.',
      'BBB........DDD..',
      'AAA........BBB..',
      'DDD........AAA..',
      '................',
      '................',
    ],
    e0: [ // T-26 — small round turret
      '................',
      '......MLM.......',
      '......MMM.......',
      '...A..MMM..B....',
      '...D.MMMMM.A....',
      '...BM.L.L.MD....',
      '...AMMMMMMMB....',
      '...DM.D.D.MA....',
      '...BMMMMMMMD....',
      '...A.DDDDD.B....',
      '...D.......A....',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
    e1: [ // BT-7 — fast, pointed nose, big wheels
      '.......L........',
      '......LML.......',
      '.....MMMMM......',
      '..AMMMMMMMMMB...',
      '..DMMM.L.MMMA...',
      '..BMMMMMMMMMD...',
      '..AM.MDDDM.MB...',
      '..DMMMMMMMMMMA..',
      '..BM.MDDDM.MD...',
      '..AMMMMMMMMMB...',
      '..D.DDDDDDD.A...',
      '..B.........D...',
      '................',
      '................',
      '................',
      '................',
    ],
    e2: [ // T-34-85 — wedge hull, long gun
      '.......LL.......',
      '......LLLL......',
      '......MMMM......',
      '.A...MMMMMM..B..',
      '.D..MMMMMMMM.A..',
      '.B.MMMMMMMMM.D..',
      '.AMMM.LL.MMMMB..',
      '.DMMMMMMMMMMMA..',
      '.BMMM.DD.MMMMD..',
      '.AMMMMMMMMMMMB..',
      '.DMMMMMMMMMMMA..',
      '.B.DDDDDDDDD.D..',
      '.A...........B..',
      '................',
      '................',
      '................',
    ],
    e3: [ // KV-1 — slab hull, thick gun
      '....LLLL........',
      '....MMMM........',
      'AA.MMMMMM...BB..',
      'DDMMMMMMMM..AA..',
      'BBMMMMMMMMM.DD..',
      'AAMMM.LL.MMMMBB.',
      'DDMMMMMMMMMMMAA.',
      'BBMMM.DD.MMMMDD.',
      'AAMMMMMMMMMMMBB.',
      'DDMMMMMMMMMMMAA.',
      'BBDDDDDDDDDDDDD.',
      'AA..........BB..',
      'DD..........AA..',
      'BB..........DD..',
      '................',
      '................',
    ],
  };

  function rot(rows, times) {
    let r = rows;
    for (let n = 0; n < (times & 3); n++) {
      const h = r.length, w = r[0].length, next = [];
      for (let x = 0; x < w; x++) {
        let s = '';
        for (let y = h - 1; y >= 0; y--) s += r[y][x] || '.';
        next.push(s);
      }
      r = next;
    }
    return r;
  }

  function stamp(ctx, rows, pal, x0, y0, frame, scale) {
    const s = scale || 1;
    const swap = frame & 1;
    for (let y = 0; y < rows.length; y++) {
      const row = rows[y];
      for (let x = 0; x < row.length; x++) {
        let ch = row[x];
        if (ch === 'A') ch = swap ? 'D' : 'M';
        else if (ch === 'B') ch = swap ? 'M' : 'D';
        const c = pal[ch];
        if (!c) continue;
        ctx.fillStyle = c;
        ctx.fillRect(x0 + x * s, y0 + y * s, s, s);
      }
    }
  }

  function drawTank(ctx, x, y, kind, palName, dir, frame, scale) {
    stamp(ctx, rot(TANKS[kind] || TANKS.e0, dir), PAL[palName] || PAL.silver, x | 0, y | 0, frame, scale || 1);
  }

  const INK = {
    w: '#fcfcfc', s: '#d0d0d0', g: '#8a8a8a', k: '#303030', K: '#000000',
    r: '#e02800', y: '#f0d000', o: '#f08820', b: '#3870e8', n: '#684020',
    G: '#20a020', d: '#606060',
  };

  const EAGLE = [
    '................',
    '..w..........w..',
    '.ww....ww....ww.',
    '.ww...wkkkw..ww.',
    '.www.wwwwww.www.',
    '..wwwwwwwwwwww..',
    '..wwgwwwwwwgww..',
    '...wwwwwwwwww...',
    '....wwwkkwww....',
    '.....ww..ww.....',
    '....www..www....',
    '....GGG..GGG....',
    '...wwwwwwwwww...',
    '..GGGGGGGGGGGG..',
    '................',
    '................',
  ];
  const FLAG = [
    '................',
    '..K.............',
    '..Kwwwwww.......',
    '..Kwrrrrww......',
    '..Kwrrrrrw......',
    '..Kwrrrrww......',
    '..Kwwwwww.......',
    '..K.............',
    '..K......GG.....',
    '..K...GGGGGG....',
    '.GK.GGGkGGGG....',
    'GGGGGkkGGGGG....',
    'GGGGGGGGGGGG....',
    'kGGGGGGGGGGGk...',
    '................',
    '................',
  ];
  const BONUS = {
    helmet: [
      '................',
      '......wwww......',
      '....wwssssww....',
      '...wsswwwwssw...',
      '..wsyyyyyyysw...',
      '..wsssssssssw...',
      '..wwwwwwwwwww...',
      '..wwwwkkkkwww...',
      '..wwwwk..kww....',
      '...GGGk..k......',
      '....GGGG........',
      '................',
      '................',
      '................',
      '................',
      '................',
    ],
    clock: [
      '................',
      '......kkkk......',
      '....kwwwwwwk....',
      '...kw..kk..wk...',
      '..kw...kk...wk..',
      '..kw...kk...wk..',
      '..wkkkkkkkkkkkw.',
      '..kw...kk...wk..',
      '..kw....kkk.wk..',
      '..kw.......wk...',
      '...kw.....wk....',
      '....kwwwwwwk....',
      '......kkkk......',
      '................',
      '................',
      '................',
    ],
    shovel: [
      '................',
      '.............w..',
      '............wsw.',
      '.............w..',
      '............n...',
      '...........n....',
      '..........n.....',
      '.....GG.n.......',
      '....GwwGn.......',
      '...GwwwwG.......',
      '...GwsswG.......',
      '...GwwwwG.......',
      '....GwwG........',
      '.....GG.........',
      '................',
      '................',
    ],
    star: [
      '................',
      '.......ww.......',
      '.......ys.......',
      '......yyyy......',
      '..wwwwyyyywwww..',
      '.wyyyyyyyyyyyyw.',
      '..yyyyyyyyyyyy..',
      '...yyyyyyyyyy...',
      '....yyyyyyyy....',
      '....yy.yy.yy....',
      '...yy..yy..yy...',
      '..yy.......yy...',
      '................',
      '................',
      '................',
      '................',
    ],
    grenade: [
      '................',
      '..........ww....',
      '.........wssw...',
      '.......GG..w....',
      '.......GG.......',
      '.....wwwwww.....',
      '....wwkwwkww....',
      '...wwwwsswwww...',
      '...wkwwkwwkww...',
      '...wwwwwwwwww...',
      '...wwkwwkwwkw...',
      '...wwwwsswwww...',
      '....wwkwwkww....',
      '.....wwwwww.....',
      '................',
      '................',
    ],
    tank: [
      '................',
      '.......ww.......',
      '.......ys.......',
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
      '................',
    ],
    gun: [
      '................',
      '......yyyy......',
      '.....ykkkyy.....',
      '....yk...ky.....',
      '...yk..k..ky....',
      '..yk..kk...ky...',
      '..ykkkkkkkkky...',
      '..yk..kk...ky...',
      '...yk..k..ky....',
      '....yk...ky.....',
      '.....ykkky......',
      '......yyy.......',
      '....wwwwww......',
      '...wwssssww.....',
      '....wwwwww......',
      '................',
    ],
  };

  function drawMap(ctx, x, y, rows, scale) {
    stamp(ctx, rows, INK, x | 0, y | 0, 0, scale || 1);
  }

  function drawExplosion(ctx, x, y, size, frame) {
    const cx = x + (size >> 1), cy = y + (size >> 1);
    const big = size > 16;
    const f = frame | 0;
    const smokeAt = big ? 4 : 3;
    if (f >= smokeAt) {
      const puffs = big
        ? [[0, 0, 5], [-7, -2, 3], [6, 3, 3], [-2, 7, 2], [5, -6, 2]]
        : [[0, 0, 3], [-3, 2, 2]];
      ctx.fillStyle = f === smokeAt ? '#d8d8d8' : '#787878';
      for (const [ox, oy, r] of puffs) {
        ctx.fillRect(cx + ox - r, cy + oy - (r >> 1), r * 2, r);
      }
      return;
    }
    const reach = Math.round((big ? [4, 8, 13, 15] : [3, 5, 7])[f] || 6);
    const arm = ['#fcfcfc', '#ffe070', '#fc9820', '#e02010'][f] || '#e02010';
    ctx.fillStyle = arm;
    ctx.fillRect(cx - reach, cy - 1, reach * 2 + 1, f === 0 ? 3 : 2);
    ctx.fillRect(cx - 1, cy - reach, f === 0 ? 3 : 2, reach * 2 + 1);
    if (f >= 1) {
      ctx.fillStyle = f >= 2 ? '#e02010' : '#fcb030';
      const diag = Math.round(reach * 0.65);
      for (let i = 2; i <= diag; i += 2) {
        ctx.fillRect(cx + i, cy + i, 1, 1);
        ctx.fillRect(cx - i, cy + i, 1, 1);
        ctx.fillRect(cx + i, cy - i, 1, 1);
        ctx.fillRect(cx - i, cy - i, 1, 1);
      }
    }
    const core = f === 0 ? (big ? 6 : 3) : 2;
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(cx - (core >> 1), cy - (core >> 1), core, core);
  }

  function drawShockwave(ctx, x, y, r, max, open) {
    const fade = 1 - r / max;
    const n = Math.max(10, r * 1.4 | 0);
    ctx.fillStyle = fade > 0.55 ? '#fcfcfc' : fade > 0.25 ? '#ffe070' : '#e02010';
    for (let i = 0; i < n; i++) {
      if (open && open[i] === 0) continue;
      if ((i + (r | 0)) & 1) continue;
      const a = i / n * Math.PI * 2;
      ctx.fillRect(x + Math.round(Math.cos(a) * r), y + Math.round(Math.sin(a) * r), 1, 1);
    }
    const inner = r - (max > 24 ? 4 : 2);
    if (inner > 3) {
      ctx.fillStyle = fade > 0.4 ? '#fc9820' : '#681010';
      const n2 = Math.max(8, n - 6);
      for (let i = 0; i < n2; i++) {
        const src = open ? open[Math.min(n - 1, (i * n / n2) | 0)] : 1;
        if (src === 0) continue;
        const a = (i + 0.5) / n2 * Math.PI * 2;
        ctx.fillRect(x + Math.round(Math.cos(a) * inner), y + Math.round(Math.sin(a) * inner), 1, 1);
      }
    }
  }

  function drawSpawn(ctx, x, y, frame) {
    const r = [2, 4, 6, 7][frame] || 4;
    ctx.fillStyle = '#fcfcfc';
    ctx.fillRect(x + 8 - r, y + 7, r * 2, 2);
    ctx.fillRect(x + 7, y + 8 - r, 2, r * 2);
    ctx.fillStyle = '#80d8fc';
    for (let i = 1; i < r; i++) {
      ctx.fillRect(x + 8 + i - 1, y + 8 + i - 1, 1, 1);
      ctx.fillRect(x + 7 - i, y + 7 - i, 1, 1);
      ctx.fillRect(x + 8 + i - 1, y + 7 - i, 1, 1);
      ctx.fillRect(x + 7 - i, y + 8 + i - 1, 1, 1);
    }
    ctx.fillStyle = '#fcfc54';
    ctx.fillRect(x + 7, y + 7, 2, 2);
  }

  function drawShield(ctx, x, y, frame) {
    ctx.fillStyle = frame & 1 ? '#fcfcfc' : '#80e0fc';
    for (let a = 0; a < 16; a++) {
      if ((a + frame) & 1) continue;
      const t = a / 16 * Math.PI * 2;
      ctx.fillRect(x + Math.round(7.5 + Math.cos(t) * 7), y + Math.round(7.5 + Math.sin(t) * 7), 1, 1);
    }
  }

  // Canvas copies kept for any caller that still uses drawImage.
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };
  const cache = new Map();
  function baked(key, w, h, paint) {
    let c = cache.get(key);
    if (c) return c;
    c = mk(w, h);
    paint(c.getContext('2d'));
    cache.set(key, c);
    return c;
  }

  return {
    drawTank, drawExplosion, drawShockwave, drawSpawn, drawShield,
    drawEagle: (ctx, x, y) => drawMap(ctx, x, y, EAGLE),
    drawFlag: (ctx, x, y) => drawMap(ctx, x, y, FLAG),
    drawBonus: (ctx, x, y, type) => drawMap(ctx, x, y, BONUS[type] || BONUS.star),
    tank: (kind, pal, dir, frame) => baked(`t:${kind}:${pal}:${dir}:${frame}`, 16, 16, g => drawTank(g, 0, 0, kind, pal, dir, frame)),
    eagle: () => baked('eagle', 16, 16, g => drawMap(g, 0, 0, EAGLE)),
    flag: () => baked('flag', 16, 16, g => drawMap(g, 0, 0, FLAG)),
    bonusIcon: type => baked('b:' + type, 16, 16, g => drawMap(g, 0, 0, BONUS[type] || BONUS.star)),
    explosion: (size, frame) => baked(`x:${size}:${frame}`, size, size, g => drawExplosion(g, 0, 0, size, frame)),
    spawnStar: frame => baked('s:' + frame, 16, 16, g => drawSpawn(g, 0, 0, frame)),
    shield: frame => baked('h:' + frame, 16, 16, g => drawShield(g, 0, 0, frame)),
    BONUS_TYPES: Object.keys(BONUS),
  };
})();
