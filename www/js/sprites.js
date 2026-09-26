'use strict';
// NES-style sprites for TAN.K. Shapes follow the Battle City sheets
// (basic / long gun / wide muzzle / heavy, and fast / power / armor)
// but are drawn here. Pixels are stamped with fillRect — never drawImage —
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
    p0: [ // short gun, open tracks
      '................',
      '.......MM.......',
      '.......LL.......',
      '.AA....MM....BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.MMLLMMLL.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.MMDDDDMM.AA.',
      '.BB.MMMMMMMM.DD.',
      '.AA.MMDDDDMM.BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.DDDDDDDD.DD.',
      '.AA..........BB.',
      '.DD..........AA.',
      '................',
      '................',
    ],
    p1: [ // long barrel
      '.......LL.......',
      '.......LL.......',
      '.......MM.......',
      '.AA....MM....BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.MMLLMMLL.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.MMDDDDMM.AA.',
      '.BB.MMMMMMMM.DD.',
      '.AA.MMDDDDMM.BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.DDDDDDDD.DD.',
      '.AA..........BB.',
      '.DD..........AA.',
      '.BB..........DD.',
      '................',
    ],
    p2: [ // wide muzzle, twin-shot
      '.....LLLLLL.....',
      '.....MMMMMM.....',
      '......DDDD......',
      '.AA.MMMMMMMM.BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.MMLLMMLL.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.MMDDDDMM.AA.',
      '.BB.MMMMMMMM.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.DDDDDDDD.AA.',
      '.BB..........DD.',
      '.AA..........BB.',
      '.DD..........AA.',
      '................',
      '................',
    ],
    p3: [ // heavy, steel-breaker
      '....LLLLLLLL....',
      '....MMMMMMMM....',
      '.AA.DDDDDDDD.BB.',
      '.DDMMMMMMMMMMDD.',
      '.AAMMMMLLMMLMAA.',
      '.BBMMMMMMMMMMDD.',
      '.AAMMMM.D.MMMBB.',
      '.DDMMMMMMMMMMAA.',
      '.BBMMMMMMMMMMDD.',
      '.AADDDDDDDDDDBB.',
      '.DDMMMMMMMMMMAA.',
      '.BB..........DD.',
      '.AA..........BB.',
      '.DD..........AA.',
      '................',
      '................',
    ],
    e0: [ // basic: compact, stubby gun
      '................',
      '.......M........',
      '.......L........',
      '.AA...MMM....BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.MMLLMMLL.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.MMDDDDMM.AA.',
      '.BB.MMMMMMMM.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.DDDDDDDD.AA.',
      '.BB..........DD.',
      '.AA..........BB.',
      '................',
      '................',
      '................',
    ],
    e1: [ // fast: pinched waist, needle gun
      '................',
      '.......LL.......',
      '.......MM.......',
      '.A.....MM.....B.',
      '.D..MMMMMMMM..A.',
      '.A.MM......MM.B.',
      '.D.M.MMMMMM.M.A.',
      '.A.MM.DDDD.MM.B.',
      '.D.M.MMMMMM.M.A.',
      '.A.MM......MM.B.',
      '.D..MMMMMMMM..A.',
      '.A..DDDDDDDD..B.',
      '.D............A.',
      '.B............D.',
      '................',
      '................',
    ],
    e2: [ // power: fat cannon, round turret
      '......LLLL......',
      '......MMMM......',
      '......DDDD......',
      '.AA..MMMMMM..BB.',
      '.DD.MMMMMMMM.AA.',
      '.BB.MMLLMMLL.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.MM.DD.MM.AA.',
      '.BB.MMMMMMMM.DD.',
      '.AA.MMMMMMMM.BB.',
      '.DD.DDDDDDDD.AA.',
      '.BB..........DD.',
      '................',
      '................',
      '................',
      '................',
    ],
    e3: [ // armor: full tile, twin guns, plates
      '.AA..LL..LL..BB.',
      '.DD..MM..MM..AA.',
      '.AAMMMMMMMMMMBB.',
      '.DDMMMMMMMMMMDD.',
      '.AAMMMMLLMMLMAA.',
      '.BBMMMMMMMMMMDD.',
      '.AAMMMM.D.MMMBB.',
      '.DDMMMMMMMMMMAA.',
      '.BBMMMMMMMMMMDD.',
      '.AADDDDDDDDDDBB.',
      '.DDMMMMMMMMMMAA.',
      '.BB..........DD.',
      '.AA..........BB.',
      '.DD..........AA.',
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
    const r0 = size / 2;
    const radius = r0 * [0.45, 0.75, 1, 0.7][frame] || r0;
    let seed = size * 17 + frame * 9 + 3;
    const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let py = 0; py < size; py++) for (let px = 0; px < size; px++) {
      const d = Math.hypot(px + 0.5 - r0, py + 0.5 - r0) / radius + rnd() * 0.22 - 0.1;
      if (d > 1) continue;
      ctx.fillStyle = d < 0.25 ? '#fcfcfc' : d < 0.5 ? '#fcb030' : d < 0.75 ? '#e03010' : '#681080';
      ctx.fillRect(x + px, y + py, 1, 1);
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
    drawTank, drawExplosion, drawSpawn, drawShield,
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
