'use strict';
// TAN.K — a Battle City (NES) tribute. Core game logic and rendering.
(() => {
  // ---------- Constants ----------
  const W = 256, H = 224;          // logical screen (NES resolution)
  const FX = 16, FY = 8, FS = 208; // playfield origin and size
  const N = 52;                    // terrain grid: 52x52 cells of 4px
  const T_EMPTY = 0, T_BRICK = 1, T_STEEL = 2, T_WATER = 3, T_TREES = 4, T_ICE = 5, T_BASE = 6;
  const DX = [0, 1, 0, -1], DY = [-1, 0, 1, 0];
  const FPS = 60;
  const COL = { bg: '#737373', white: '#fcfcfc', red: '#b53120', orange: '#ea9e22', black: '#000' };

  const ENEMY = [ // basic, fast, power, armor
    { speed: 0.5, bullet: 2, hp: 1, score: 100, fire: 1 / 90 },
    { speed: 1.5, bullet: 3, hp: 1, score: 200, fire: 1 / 90 },
    { speed: 0.75, bullet: 4, hp: 1, score: 300, fire: 1 / 60 },
    { speed: 0.5, bullet: 3, hp: 4, score: 400, fire: 1 / 70 },
  ];
  const PLAYER_SPEED = 1;
  const ENEMY_SPAWN_X = [96, 192, 0];
  const PLAYER_SPAWN = [[64, 192], [128, 192]];
  const BONUS_INDEX = [3, 10, 17]; // 4th, 11th and 18th enemies carry power-ups
  const BONUS_WEIGHT = { star: 4, helmet: 2, clock: 2, shovel: 2, grenade: 2, tank: 1, gun: 1 };
  // Player upgrade levels (stars): what each one adds.
  const ENEMY_NAME = ['BASIC', 'FAST', 'POWER', 'ARMOR'];
  const ARMOR_PAL = ['silver', 'silver', 'teal', 'gold', 'green']; // by hit points left
  const UPGRADE_NAME = ['', 'FAST SHELLS', 'DOUBLE SHOT', 'STEEL BREAKER'];

  // ---------- Canvas ----------
  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d');
  canvas.width = W; canvas.height = H;
  const mk = (w, h) => { const c = document.createElement('canvas'); c.width = w; c.height = h; return c; };

  // 8x8 tiles, sampled in 4x4 pieces. Painted with fillRect (no drawImage).
  const TILE = {
    brick: { L:'#f0a070', M:'#c86828', D:'#6a6a6a',
      rows:['MMMMMMMD','LLLLLLLD','DDDDDDDD','MMMMMMMD','MMMDMMMM','LLLDLLLL','DDDDDDDD','MMMMMMMM'] },
    steel: { L:'#fcfcfc', M:'#b0b0b0', D:'#5a5a5a',
      rows:['LLLLLLLD','LMMMMMMD','LMLLLLMD','LMLMMLMD','LMLDDDMD','LMDDDDMD','LDDDDDDD','DDDDDDDD'] },
    ice: { L:'#fcfcfc', M:'#d0d0e0', D:'#8888a8',
      rows:['MMMMMMMM','MLDMLDMM','MMLDMLDM','MMMLDMLD','DMMMLDML','LDMMMLDM','MLDMMMLD','MMLDMMML'] },
    trees: { L:'#80d010', M:'#006800', D:'#003800',
      rows:['MLMLDMLM','LMDMLMDL','DMLMLDML','MLDMLMLD','LMLDMLDM','MDMLMLDM','LMLDMLML','DMLMLDML'] },
    water0: { L:'#9cc4fc', M:'#2848e8', D:'#1830b0',
      rows:['MMMMMMMM','MLLMMMMM','MMMLLMMM','MMMMMLLM','LLMMMMMM','MMLLMMMM','MMMMMLLM','MMMMMMML'] },
    water1: { L:'#9cc4fc', M:'#2848e8', D:'#1830b0',
      rows:['MMMMMMMM','MMMMLLMM','MMMMMMLL','LLMMMMMM','MMLLMMMM','MMMMMLLM','MLLMMMMM','MMMLLMMM'] },
  };
  function paintTile(g, name, dx, dy, sx, sy, sw, sh) {
    const t = TILE[name];
    for (let y = 0; y < sh; y++) {
      const row = t.rows[(sy + y) & 7];
      let x = 0;
      while (x < sw) {
        const col = t[row[(sx + x) & 7]];
        if (!col) { x++; continue; }
        let x2 = x + 1;
        while (x2 < sw && t[row[(sx + x2) & 7]] === col) x2++;
        g.fillStyle = col;
        g.fillRect(dx + x, dy + y, x2 - x, 1);
        x = x2;
      }
    }
  }
  // Copy an offscreen canvas with fillRect. drawImage of a canvas is blank
  // on some browsers when imageSmoothingEnabled is false.
  function blitCanvas(ctx, src, dx, dy) {
    const w = src.width, h = src.height;
    const data = src.getContext('2d').getImageData(0, 0, w, h).data;
    let style = '';
    for (let y = 0; y < h; y++) {
      let x = 0;
      const row = y * w;
      while (x < w) {
        const i = (row + x) * 4;
        if (data[i + 3] < 16) { x++; continue; }
        let x2 = x + 1;
        while (x2 < w) {
          const j = (row + x2) * 4;
          if (data[j + 3] < 16 || data[j] !== data[i] || data[j + 1] !== data[i + 1] || data[j + 2] !== data[i + 2]) break;
          x2++;
        }
        const fill = 'rgb(' + data[i] + ',' + data[i + 1] + ',' + data[i + 2] + ')';
        if (fill !== style) { ctx.fillStyle = fill; style = fill; }
        ctx.fillRect(dx + x, dy + y, x2 - x, 1);
        x = x2;
      }
    }
  }

  const grid = new Uint8Array(N * N);
  const terrainCv = mk(FS, FS), terrainG = terrainCv.getContext('2d');
  const treesCv = mk(FS, FS), treesG = treesCv.getContext('2d');
  let waterCells = [];

  const FORT_CELLS = [];
  for (let y = 46; y < 52; y++) FORT_CELLS.push([22, y], [23, y], [28, y], [29, y]);
  for (let x = 24; x < 28; x++) FORT_CELLS.push([x, 46], [x, 47]);

  function cell(mx, my) { return mx < 0 || my < 0 || mx >= N || my >= N ? -1 : grid[my * N + mx]; }
  function drawCell(mx, my) {
    const x = mx * 4, y = my * 4, v = grid[my * N + mx];
    terrainG.clearRect(x, y, 4, 4);
    const name = v === T_BRICK ? 'brick' : v === T_STEEL ? 'steel' : v === T_ICE ? 'ice' : null;
    if (name) paintTile(terrainG, name, x, y, x & 7, y & 7, 4, 4);
  }
  function setCell(mx, my, v) { if (cell(mx, my) < 0) return; grid[my * N + mx] = v; drawCell(mx, my); }

  function loadStage(n) {
    grid.fill(0);
    const rows = Levels.map(n);
    const fill = (tx, ty, v, x0, y0, x1, y1) => {
      for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) grid[(ty * 4 + y) * N + tx * 4 + x] = v;
    };
    for (let ty = 0; ty < 13; ty++) for (let tx = 0; tx < 13; tx++) {
      const ch = (rows[ty] || '')[tx] || '.';
      const t = { '#': T_BRICK, '@': T_STEEL, '~': T_WATER, '%': T_TREES, '-': T_ICE,
        r: T_BRICK, l: T_BRICK, t: T_BRICK, b: T_BRICK, R: T_STEEL, L: T_STEEL, T: T_STEEL, B: T_STEEL,
        1: T_BRICK, 2: T_BRICK, 3: T_BRICK, 4: T_BRICK, 5: T_STEEL, 6: T_STEEL, 7: T_STEEL, 8: T_STEEL }[ch];
      if (!t) continue;
      const k = ch.toLowerCase();
      const q = '12345678'.indexOf(ch) % 4; // quarter: 0 top-left, 1 top-right, 2 bottom-left, 3 bottom-right
      if (q >= 0) fill(tx, ty, t, (q & 1) * 2, (q >> 1) * 2, (q & 1) * 2 + 2, (q >> 1) * 2 + 2);
      else if (k === 'r') fill(tx, ty, t, 2, 0, 4, 4);
      else if (k === 'l') fill(tx, ty, t, 0, 0, 2, 4);
      else if (k === 't') fill(tx, ty, t, 0, 0, 4, 2);
      else if (k === 'b') fill(tx, ty, t, 0, 2, 4, 4);
      else fill(tx, ty, t, 0, 0, 4, 4);
    }
    // Eagle area and its surroundings.
    for (let y = 44; y < 52; y++) for (let x = 20; x < 32; x++) grid[y * N + x] = 0;
    for (const [x, y] of FORT_CELLS) grid[y * N + x] = T_BRICK;
    for (let y = 48; y < 52; y++) for (let x = 24; x < 28; x++) grid[y * N + x] = T_BASE;
    redrawTerrain();
  }
  function redrawTerrain() {
    terrainG.clearRect(0, 0, FS, FS);
    treesG.clearRect(0, 0, FS, FS);
    waterCells = [];
    for (let my = 0; my < N; my++) for (let mx = 0; mx < N; mx++) {
      const v = grid[my * N + mx];
      if (v === T_TREES) paintTile(treesG, 'trees', mx * 4, my * 4, (mx * 4) & 7, (my * 4) & 7, 4, 4);
      else if (v === T_WATER) waterCells.push(mx, my);
      else drawCell(mx, my);
    }
  }
  function setFortress(v) { for (const [x, y] of FORT_CELLS) setCell(x, y, v); }

  // ---------- Game state ----------
  let mode = 'title';      // title | intro | play | tally | gameover
  let modeT = 0;           // frames spent in current mode
  let frame = 0;
  let twoPlayer = false;
  let stage = 1;
  let players = [];
  let tanks = [], bullets = [], effects = [], spawns = [], popups = [], particles = [];
  let shakeT = 0, shakeMag = 0;
  let queue = [], enemySpawned = 0, spawnTimer = 0, spawnIdx = 0;
  let bonus = null;
  let freezeT = 0, shovelT = 0;
  let baseDead = false, gameOverT = -1, clearT = -1;
  let paused = false;
  let menuSel = 0;
  let tally = null;
  let hiScore = 20000;
  try { hiScore = Math.max(hiScore, +localStorage.getItem('tank.hiscore') || 0); } catch (e) { /* storage unavailable */ }

  function saveHi() {
    for (const p of players) hiScore = Math.max(hiScore, p.score);
    try { localStorage.setItem('tank.hiscore', hiScore); } catch (e) { /* ignore */ }
  }

  function setMode(m) { mode = m; modeT = 0; }

  function newGame(two) {
    twoPlayer = two;
    Input.setTwoPlayer(two);
    stage = 1;
    players = [];
    for (let i = 0; i < (two ? 2 : 1); i++) {
      players.push({ idx: i, lives: 2, score: 0, level: 0, kills: [0, 0, 0, 0], tank: null, respawn: -1, out: false, nextLife: 20000 });
    }
    setMode('intro');
  }

  function startStage() {
    loadStage(stage);
    tanks = []; bullets = []; effects = []; spawns = []; popups = []; particles = [];
    queue = Levels.enemies(stage);
    enemySpawned = 0; spawnTimer = 0; spawnIdx = 0;
    bonus = null; freezeT = 0; shovelT = 0;
    baseDead = false; gameOverT = -1; clearT = -1; paused = false;
    shakeT = 0; shakeMag = 0;
    for (const p of players) {
      p.kills = [0, 0, 0, 0];
      p.tank = null;
      if (!p.out) spawnPlayer(p);
    }
    setMode('play');
    Sfx.play('start');
  }

  // ---------- Entities ----------
  function makeTank(o) {
    return Object.assign({ dir: 0, sub: 0, anim: 0, moved: false, bullets: 0, cool: 0, shield: 0, frozen: 0,
      slide: 0, dead: false, bonus: false, hp: 1 }, o);
  }

  function spawnPlayer(p) {
    const [x, y] = PLAYER_SPAWN[p.idx];
    spawns.push({ x, y, t: 0, done: () => {
      p.tank = makeTank({ x, y, dir: 0, player: p, speed: PLAYER_SPEED, shield: 180 });
      tanks.push(p.tank);
      burst(x + 8, y + 8, 'spawn');
    } });
  }

  function spawnEnemy() {
    const type = queue.shift();
    const idx = enemySpawned++;
    const x = ENEMY_SPAWN_X[spawnIdx % 3], y = 0;
    spawnIdx++;
    spawns.push({ x, y, t: 0, enemy: true, done: () => {
      const e = ENEMY[type];
      tanks.push(makeTank({ x, y, dir: 2, type, speed: e.speed, hp: e.hp, bonus: BONUS_INDEX.includes(idx), ai: 0 }));
      burst(x + 8, y + 8, 'spawn');
    } });
  }

  const overlap = (ax, ay, aw, ah, bx, by, bw, bh) => ax < bx + bw && ax + aw > bx && ay < by + bh && ay + ah > by;

  function tankBlocked(t, nx, ny) {
    if (nx < 0 || ny < 0 || nx > FS - 16 || ny > FS - 16) return true;
    // Leading edge only, so tanks never get stuck in partially overlapping walls.
    let x0 = nx, x1 = nx + 15, y0 = ny, y1 = ny + 15;
    if (t.dir === 0) y1 = ny; else if (t.dir === 2) y0 = ny + 15;
    else if (t.dir === 1) x0 = nx + 15; else x1 = nx;
    for (let my = y0 >> 2; my <= y1 >> 2; my++) for (let mx = x0 >> 2; mx <= x1 >> 2; mx++) {
      const v = cell(mx, my);
      if (v === T_BRICK || v === T_STEEL || v === T_WATER || v === T_BASE) return true;
    }
    const cx = t.x + 8, cy = t.y + 8;
    const check = (ox, oy) => {
      if (!overlap(nx, ny, 16, 16, ox, oy, 16, 16)) return false;
      if (!overlap(t.x, t.y, 16, 16, ox, oy, 16, 16)) return true;
      // Already overlapping: only allow moves that separate the two.
      return Math.hypot(nx + 8 - ox - 8, ny + 8 - oy - 8) < Math.hypot(cx - ox - 8, cy - oy - 8);
    };
    for (const o of tanks) if (o !== t && !o.dead && check(o.x, o.y)) return true;
    for (const s of spawns) if (check(s.x, s.y)) return true;
    return false;
  }

  // Move a tank forward by its speed. Returns true if it was blocked.
  function moveTank(t) {
    t.sub += t.speed;
    let blocked = false;
    while (t.sub >= 1) {
      t.sub -= 1;
      const nx = t.x + DX[t.dir], ny = t.y + DY[t.dir];
      if (tankBlocked(t, nx, ny)) { blocked = true; t.sub = 0; break; }
      t.x = nx; t.y = ny; t.moved = true;
    }
    t.anim++;
    return blocked;
  }

  // True if a 16x16 body at (x,y) would overlap impassable terrain.
  function terrainHit(x, y) {
    if (x < 0 || y < 0 || x > FS - 16 || y > FS - 16) return true;
    for (let my = y >> 2; my <= (y + 15) >> 2; my++) for (let mx = x >> 2; mx <= (x + 15) >> 2; mx++) {
      const v = cell(mx, my);
      if (v === T_BRICK || v === T_STEEL || v === T_WATER || v === T_BASE) return true;
    }
    return false;
  }

  // Turning 90 degrees snaps the tank onto the 8px lane grid (like the NES), but
  // only onto a lane that is free: snapping blindly pushed tanks into walls.
  function turnTank(t, d) {
    if (d === t.dir) return;
    if ((d & 1) !== (t.dir & 1)) {
      const v = d & 1 ? t.y : t.x;
      const near = Math.round(v / 8) * 8, far = near + (v >= near ? 8 : -8);
      for (const c of v === near ? [near] : [near, far]) {
        if (Math.abs(c - v) > 4) continue;
        if (!(d & 1 ? terrainHit(t.x, c) : terrainHit(c, t.y))) { if (d & 1) t.y = c; else t.x = c; break; }
      }
      t.sub = 0;
    }
    t.dir = d;
  }

  function onIce(t) { return cell((t.x + 8) >> 2, (t.y + 8) >> 2) === T_ICE; }



  function addShake(frames, mag) {
    if (frames > shakeT) shakeT = frames;
    if (mag > shakeMag) shakeMag = mag;
  }
  function shakeOffset() {
    const m = shakeMag;
    const seq = [[m, 0], [-m, 0], [0, m], [0, -m]];
    return seq[frame % 4];
  }

  const PARTICLE_CAP = 96;
  const PARTICLE_KINDS = {
    brick: { n: 7, colors: ['#d86c28', '#9c4a00', '#6c6c6c'], speed: 1.3, life: 16 },
    steel: { n: 5, colors: ['#fcfcfc', '#adadad', '#636363'], speed: 1.7, life: 10 },
    boom:  { n: 16, colors: ['#fcfcfc', '#fcb030', '#e03010', '#681078'], speed: 1.9, life: 20 },
    armor: { n: 6, colors: ['#fcf0a0', '#d89800', '#fcfcfc'], speed: 1.4, life: 12 },
    spawn: { n: 8, colors: ['#fcfcfc', '#80d8fc', '#fcfc54'], speed: 0.9, life: 14 },
  };
  function burst(x, y, kind) {
    const spec = PARTICLE_KINDS[kind];
    if (!spec) return;
    for (let i = 0; i < spec.n && particles.length < PARTICLE_CAP; i++) {
      const a = Math.random() * Math.PI * 2;
      const sp = spec.speed * (0.35 + Math.random() * 0.65);
      particles.push({
        x, y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp,
        life: spec.life + (Math.random() * 5 | 0), age: 0,
        c: spec.colors[(Math.random() * spec.colors.length) | 0],
      });
    }
  }

  function fire(t) {
    let speed, power = false;
    if (t.player) { const l = t.player.level; speed = l >= 1 ? 5 : 3; power = l >= 3; }
    else speed = ENEMY[t.type].bullet;
    bullets.push({ x: t.x + 8 + DX[t.dir] * 6, y: t.y + 8 + DY[t.dir] * 6, dir: t.dir, speed, power, owner: t, dead: false });
    t.bullets++;
    if (t.player) Sfx.play('fire');
  }

  function killBullet(b, boom) {
    if (b.dead) return;
    b.dead = true;
    b.owner.bullets--;
    if (boom) effects.push({ x: b.x, y: b.y, size: 16, seq: [0, 1, 2], rate: 3, t: 0 });
  }

  function impact(b) {
    const vertical = !(b.dir & 1);
    const depth = b.power ? 2 : 1;
    let hitSteel = false, hitBrick = false;
    for (let d = 0; d < depth; d++) {
      for (let i = -2; i < 2; i++) {
        let mx, my;
        if (vertical) {
          mx = ((b.x + i * 4) >> 2);
          my = (b.dir === 0 ? (b.y - 2) >> 2 : (b.y + 1) >> 2) + (b.dir === 0 ? -d : d);
        } else {
          my = ((b.y + i * 4) >> 2);
          mx = (b.dir === 3 ? (b.x - 2) >> 2 : (b.x + 1) >> 2) + (b.dir === 3 ? -d : d);
        }
        const v = cell(mx, my);
        if (v === T_BRICK) { setCell(mx, my, T_EMPTY); hitBrick = true; }
        else if (v === T_STEEL) { if (b.power) { setCell(mx, my, T_EMPTY); hitBrick = true; } else hitSteel = true; }
      }
    }
    if (b.owner.player) Sfx.play(hitBrick ? 'brick' : hitSteel ? 'steel' : 'brick');
    if (hitBrick) burst(b.x, b.y, 'brick');
    else if (hitSteel) { burst(b.x, b.y, 'steel'); addShake(4, 1); }
  }

  function bulletStep(b) {
    b.x += DX[b.dir]; b.y += DY[b.dir];
    const x0 = b.x - 2, y0 = b.y - 2;
    if (x0 < 0 || y0 < 0 || x0 + 4 > FS || y0 + 4 > FS) {
      if (b.owner.player) { Sfx.play('steel'); addShake(3, 1); }
      killBullet(b, true); return;
    }
    let solid = false, base = false;
    for (let my = y0 >> 2; my <= (y0 + 3) >> 2; my++) for (let mx = x0 >> 2; mx <= (x0 + 3) >> 2; mx++) {
      const v = cell(mx, my);
      if (v === T_BRICK || v === T_STEEL) solid = true;
      if (v === T_BASE) base = true;
    }
    if (base && !baseDead) { destroyBase(); killBullet(b, true); return; }
    if (solid) { impact(b); killBullet(b, true); return; }
    // Tanks
    for (const t of tanks) {
      if (t.dead || t === b.owner || !overlap(x0, y0, 4, 4, t.x, t.y, 16, 16)) continue;
      if (b.owner.player) {
        if (!t.player) { hitEnemy(t, b.owner.player); killBullet(b, false); return; }
        if (!t.shield) t.frozen = 150;
        killBullet(b, false); return;
      } else if (t.player) {
        if (!t.shield) killPlayer(t);
        killBullet(b, false); return;
      }
    }
    // Bullets cancel each other unless both are enemy bullets.
    for (const o of bullets) {
      if (o === b || o.dead || (!o.owner.player && !b.owner.player)) continue;
      if (overlap(x0, y0, 4, 4, o.x - 2, o.y - 2, 4, 4)) { killBullet(b, false); killBullet(o, false); return; }
    }
  }

  function bigBoom(t) {
    effects.push({ x: t.x + 8, y: t.y + 8, size: 32, seq: [0, 1, 2, 3, 2, 1], rate: 4, t: 0 });
    burst(t.x + 8, t.y + 8, 'boom');
    addShake(t.player ? 12 : 8, t.player ? 2 : 1);
  }

  function addScore(p, pts) {
    p.score += pts;
    if (p.score >= p.nextLife) { p.nextLife += 20000; p.lives++; Sfx.play('life'); }
  }

  function hitEnemy(t, p) {
    if (t.bonus) { t.bonus = false; placeBonus(); }
    t.hp--;
    if (t.hp > 0) { Sfx.play('hitArmor'); burst(t.x + 8, t.y + 8, 'armor'); addShake(5, 1); return; }
    t.dead = true;
    bigBoom(t);
    Sfx.play('explode');
    p.kills[t.type]++;
    const pts = ENEMY[t.type].score;
    addScore(p, pts);
    popups.push({ x: t.x + 8, y: t.y + 5, text: String(pts), t: 0, delay: 24 });
  }

  function killPlayer(t) {
    const p = t.player;
    t.dead = true;
    p.tank = null;
    p.level = 0;
    bigBoom(t);
    Sfx.play('bigExplode');
    if (p.lives > 0) { p.lives--; p.respawn = 40; }
    else {
      p.out = true;
      if (players.every(q => q.out) && gameOverT < 0) gameOverT = 0;
    }
  }

  function destroyBase() {
    baseDead = true;
    effects.push({ x: 104, y: 200, size: 32, seq: [0, 1, 2, 3, 2, 1], rate: 5, t: 0 });
    burst(104, 200, 'boom');
    addShake(18, 3);
    Sfx.play('bigExplode');
    if (gameOverT < 0) gameOverT = 0;
  }

  function placeBonus() {
    const types = Sprites.BONUS_TYPES;
    let x, y, tries = 0;
    do {
      x = 8 * Math.floor(Math.random() * 25);
      y = 8 * Math.floor(Math.random() * 25);
      tries++;
    } while (tries < 50 && (overlap(x, y, 16, 16, 80, 176, 48, 32) || blockedArea(x, y)));
    const pool = types.flatMap(k => Array(BONUS_WEIGHT[k] || 1).fill(k));
    bonus = { x, y, type: pool[Math.floor(Math.random() * pool.length)], t: 0 };
    Sfx.play('bonusAppear');
  }
  function blockedArea(x, y) {
    let n = 0;
    for (let my = y >> 2; my < (y + 16) >> 2; my++) for (let mx = x >> 2; mx < (x + 16) >> 2; mx++) {
      const v = cell(mx, my); if (v === T_STEEL || v === T_WATER) n++;
    }
    return n > 4;
  }

  function takeBonus(p, t) {
    const type = bonus.type;
    bonus = null;
    addScore(p, 500);
    popups.push({ x: t.x + 8, y: t.y + 5, text: '500', t: 0, delay: 0 });
    switch (type) {
      case 'star': case 'gun': {
        const before = p.level;
        p.level = type === 'gun' ? 3 : Math.min(3, p.level + 1);
        if (p.level > before) popups.push({ x: t.x + 8, y: t.y - 6, text: UPGRADE_NAME[p.level], t: 0, delay: 20, color: COL.orange });
        break;
      }
      case 'tank': p.lives++; Sfx.play('life'); return;
      case 'helmet': t.shield = 600; break;
      case 'shovel': shovelT = 1200; setFortress(T_STEEL); break;
      case 'clock': freezeT = 600; break;
      case 'grenade':
        for (const e of tanks) if (!e.player && !e.dead) { e.dead = true; bigBoom(e); }
        Sfx.play('explode');
        break;
    }
    Sfx.play('bonus');
  }

  // ---------- Enemy AI ----------
  function chooseDir(t, blocked) {
    const r = Math.random();
    let d;
    let target = null;
    if (r < 0.16) target = [96, 192];
    else if (r < 0.36) {
      const alive = players.filter(p => p.tank && !p.tank.dead);
      if (alive.length) { const pt = alive[Math.floor(Math.random() * alive.length)].tank; target = [pt.x, pt.y]; }
    }
    if (target) {
      const dx = target[0] - t.x, dy = target[1] - t.y;
      if (Math.random() * (Math.abs(dx) + Math.abs(dy) + 1) < Math.abs(dx)) d = dx > 0 ? 1 : 3;
      else d = dy > 0 ? 2 : 0;
    } else d = Math.floor(Math.random() * 4);
    if (blocked && d === t.dir) d = (t.dir + 1 + Math.floor(Math.random() * 3)) % 4;
    turnTank(t, d);
  }

  function updateEnemy(t) {
    if (freezeT > 0) return;
    const blocked = moveTank(t);
    if (blocked) {
      t.ai++;
      if (t.ai > 8 && Math.random() < 0.3) { chooseDir(t, true); t.ai = 0; }
    } else if (t.x % 16 === 0 && t.y % 16 === 0 && Math.random() < 1 / 16) chooseDir(t, false);
    if (t.bullets < 1 && Math.random() < ENEMY[t.type].fire * (blocked ? 2 : 1) * (1 + stage * 0.02)) fire(t);
  }

  // ---------- Player ----------
  function updatePlayer(p) {
    if (p.respawn > 0 && --p.respawn === 0 && gameOverT < 0) spawnPlayer(p);
    const t = p.tank;
    if (!t || t.dead) return;
    if (t.shield > 0) t.shield--;
    if (t.cool > 0) t.cool--;
    if (gameOverT >= 0) return;
    if (t.frozen > 0) { t.frozen--; return; }
    const d = Input.dir(p.idx);
    if (d >= 0) {
      turnTank(t, d);
      moveTank(t);
      t.slide = onIce(t) ? 28 : 0;
    } else if (t.slide > 0) {
      t.slide--;
      if (onIce(t)) moveTank(t); else t.slide = 0;
    }
    const maxB = p.level >= 2 ? 2 : 1;
    if (Input.fire(p.idx) && t.bullets < maxB && t.cool <= 0) { fire(t); t.cool = 8; }
    if (bonus && overlap(t.x, t.y, 16, 16, bonus.x, bonus.y, 16, 16)) takeBonus(p, t);
  }

  // ---------- Update ----------
  function updatePlay() {
    if (Input.pressed('pause') || (Input.pressed('blur') && !paused)) {
      if (gameOverT < 0) { paused = Input.pressed('blur') ? true : !paused; Sfx.play('pause'); }
    }
    if (shakeT > 0 && --shakeT === 0) shakeMag = 0;
    if (paused) { Sfx.engine(0); return; }

    // Enemy spawning
    const maxOn = twoPlayer ? 6 : 4;
    const onScreen = tanks.filter(t => !t.player && !t.dead).length + spawns.filter(s => s.enemy).length;
    if (--spawnTimer <= 0 && queue.length && onScreen < maxOn) {
      spawnEnemy();
      spawnTimer = Math.max(60, 190 - stage * 4 - (twoPlayer ? 20 : 0));
    }
    for (const s of spawns) if (++s.t >= 60) s.done();
    spawns = spawns.filter(s => s.t < 60);

    for (const p of players) updatePlayer(p);
    for (const t of tanks) { t.moved = false; if (!t.player && !t.dead) updateEnemy(t); }
    tanks = tanks.filter(t => !t.dead);

    for (const b of bullets) for (let i = 0; i < b.speed && !b.dead; i++) bulletStep(b);
    bullets = bullets.filter(b => !b.dead);

    for (const e of effects) e.t++;
    effects = effects.filter(e => e.t < e.seq.length * e.rate);
    for (const q of particles) { q.x += q.vx; q.y += q.vy; q.age++; }
    if (particles.length) particles = particles.filter(q => q.age < q.life);
    for (const p of popups) p.t++;
    popups = popups.filter(p => p.t < p.delay + 45);
    if (bonus) bonus.t++;

    if (freezeT > 0) freezeT--;
    if (shovelT > 0) {
      shovelT--;
      if (shovelT === 0) setFortress(T_BRICK);
      else if (shovelT < 240 && shovelT % 16 === 0) setFortress((shovelT / 16) % 2 ? T_BRICK : T_STEEL);
    }

    const moving = players.some(p => p.tank && p.tank.moved);
    Sfx.engine(gameOverT >= 0 ? 0 : moving ? 2 : 1);

    // Stage clear
    if (gameOverT < 0 && clearT < 0 && !queue.length && !spawns.some(s => s.enemy) && !tanks.some(t => !t.player)) clearT = 0;
    if (clearT >= 0 && gameOverT < 0 && ++clearT > 180) { Sfx.engine(0); beginTally(false); }
    if (gameOverT >= 0 && ++gameOverT > 260) { Sfx.engine(0); beginTally(true); }
  }

  function beginTally(over) {
    saveHi();
    const rows = [0, 1, 2, 3].map(type => players.map(p => p.kills[type]));
    tally = { over, rows, row: 0, count: 0, t: 0, done: false, bonusGiven: false };
    setMode('tally');
  }

  function updateTally() {
    const tl = tally;
    tl.t++;
    if (!tl.done) {
      if (tl.t % 7 === 0) {
        const max = Math.max(...tl.rows[tl.row]);
        if (tl.count < max) { tl.count++; Sfx.play('tick'); }
        else { tl.row++; tl.count = 0; tl.t = -20; if (tl.row >= 4) { tl.done = true; tl.t = 0; } }
      }
      if (Input.pressed('start') || Input.pressed('tap')) { tl.row = 4; tl.done = true; tl.t = 0; }
    } else {
      if (twoPlayer && !tl.bonusGiven && !tl.over) {
        tl.bonusGiven = true;
        const k = players.map(p => p.kills.reduce((a, b) => a + b, 0));
        if (k[0] !== k[1]) { const w = players[k[0] > k[1] ? 0 : 1]; addScore(w, 1000); tl.bonus = w.idx; Sfx.play('bonus'); }
        saveHi();
      }
      if (tl.t > 150) {
        if (tl.over) { setMode('gameover'); Sfx.play('gameOver'); }
        else { stage++; setMode('intro'); }
      }
    }
  }

  function update() {
    frame++; modeT++;
    Input.poll();
    if (Input.pressed('mute')) Sfx.setMuted(!Sfx.muted);
    switch (mode) {
      case 'title':
        if (modeT < 120) { if (Input.pressed('start') || Input.pressed('fire') || Input.pressed('tap')) modeT = 120; break; }
        if (Input.pressed('up')) { menuSel = (menuSel + 2) % 3; Sfx.play('tick'); }
        if (Input.pressed('down')) { menuSel = (menuSel + 1) % 3; Sfx.play('tick'); }
        if (Input.pressed('start') || Input.pressed('fire') || Input.pressed('tap')) {
          if (menuSel === 2) { Sfx.setMuted(!Sfx.muted); Sfx.play('tick'); }
          else newGame(menuSel === 1);
        }
        break;
      case 'intro': {
        const chooser = stage === 1 && players.every(p => p.score === 0);
        if (chooser && modeT > 20) {
          if (Input.pressed('up') || Input.pressed('right')) { stage = Math.min(99, stage + 1); Sfx.play('tick'); }
          if (Input.pressed('down') || Input.pressed('left')) { stage = Math.max(1, stage - 1); Sfx.play('tick'); }
          if (Input.pressed('start') || Input.pressed('fire') || Input.pressed('tap')) startStage();
          if (Input.pressed('back')) setMode('title');
        } else if (!chooser && modeT > 100) startStage();
        break;
      }
      case 'play': updatePlay(); break;
      case 'tally': updateTally(); break;
      case 'gameover':
        if (modeT > 200 || (modeT > 60 && (Input.pressed('start') || Input.pressed('tap')))) setMode('title');
        break;
    }
    Input.endFrame();
  }

  // ---------- Rendering ----------
  function text(s, x, y, c = COL.white, scale = 1, align = 'left') { Font.draw(ctx, s, x, y, c, scale, align); }

  // Large text built out of brick blocks (title / game over).
  function bigBrickText(s, cx, top, scale = 4) {
    const w = Font.width(s, 1), h = 7;
    const tmp = mk(w, h), tg = tmp.getContext('2d');
    Font.draw(tg, s, 0, 0, '#fff', 1);
    const data = tg.getImageData(0, 0, w, h).data;
    const x0 = Math.round(cx - (w * scale) / 2);
    for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
      if (!data[(y * w + x) * 4 + 3]) continue;
      for (let by = 0; by < scale; by += 4) for (let bx = 0; bx < scale; bx += 4) {
        const px = x0 + x * scale + bx, py = top + y * scale + by;
        paintTile(ctx, 'brick', px, py, px & 4, py & 4, 4, 4);
      }
    }
  }

  function drawStar(x, y, c) { // 5x5 upgrade star
    ctx.fillStyle = c;
    ctx.fillRect(x + 2, y, 1, 1); ctx.fillRect(x, y + 1, 5, 2); ctx.fillRect(x + 1, y + 3, 3, 1);
    ctx.fillRect(x, y + 4, 2, 1); ctx.fillRect(x + 3, y + 4, 2, 1);
  }

  function drawSidebar() {
    // Remaining enemies
    const left = queue.length;
    for (let i = 0; i < left; i++) {
      const x = 233 + (i % 2) * 8, y = 24 + Math.floor(i / 2) * 8;
      ctx.fillStyle = COL.black;
      ctx.fillRect(x, y + 1, 1, 6); ctx.fillRect(x + 6, y + 1, 1, 6);
      ctx.fillRect(x + 1, y + 2, 5, 4); ctx.fillRect(x + 3, y, 1, 3);
    }
    players.forEach((p, i) => {
      const y = 108 + i * 30;
      text(i ? 'IIP' : 'IP', 233, y, COL.black);
      ctx.fillStyle = COL.black; ctx.fillRect(233, y + 9, 1, 6); ctx.fillRect(239, y + 9, 1, 6); ctx.fillRect(234, y + 10, 5, 4); ctx.fillRect(236, y + 8, 1, 3);
      text(String(p.lives), 243, y + 9, COL.black);
      for (let s = 0; s < 3; s++) drawStar(233 + s * 7, y + 18, s < p.level ? '#fcfc54' : '#5c5c5c');
    });
    Sprites.drawFlag(ctx, 232, 170);
    text(String(stage), 248, 188, COL.black, 1, 'right');
  }

  function drawField() {
    ctx.fillStyle = COL.black;
    ctx.fillRect(FX, FY, FS, FS);
    // Water (animated)
    const wf = (frame >> 5) & 1 ? 'water1' : 'water0';
    for (let i = 0; i < waterCells.length; i += 2) {
      const x = waterCells[i] * 4, y = waterCells[i + 1] * 4;
      paintTile(ctx, wf, FX + x, FY + y, x & 7, y & 7, 4, 4);
    }
    blitCanvas(ctx, terrainCv, FX, FY);
    if (baseDead) Sprites.drawFlag(ctx, FX + 96, FY + 192);
    else Sprites.drawEagle(ctx, FX + 96, FY + 192);

    for (const s of spawns) {
      const f = [0, 1, 2, 3, 2, 1][(s.t >> 2) % 6];
      Sprites.drawSpawn(ctx, FX + (s.x | 0), FY + (s.y | 0), f);
    }
    for (const t of tanks) {
      if (t.player && t.frozen > 0 && (frame >> 3) & 1) continue;
      const kind = t.player ? 'p' + t.player.level : 'e' + t.type;
      let pal = t.player ? (t.player.idx ? 'green' : 'yellow') : 'silver';
      if (!t.player && t.type === 3 && t.hp > 1) pal = (frame >> 2) & 1 ? ARMOR_PAL[t.hp] : 'silver';
      if (!t.player && t.bonus && (frame >> 3) & 1) pal = 'red';
      const x = FX + Math.round(t.x), y = FY + Math.round(t.y);
      Sprites.drawTank(ctx, x, y, kind, pal, t.dir, (t.anim >> 2) & 1);
      if (t.shield > 0) Sprites.drawShield(ctx, x, y, (frame >> 1) & 1);
    }
    ctx.fillStyle = COL.white;
    for (const b of bullets) {
      ctx.fillStyle = '#adadad'; ctx.fillRect(FX + b.x - 2, FY + b.y - 2, 4, 4);
      ctx.fillStyle = COL.white; ctx.fillRect(FX + b.x - 1, FY + b.y - 1, 2, 2);
    }
    blitCanvas(ctx, treesCv, FX, FY);
    if (bonus && ((bonus.t >> 3) & 1 || bonus.t < 8)) Sprites.drawBonus(ctx, FX + Math.round(bonus.x), FY + Math.round(bonus.y), bonus.type);
    for (const e of effects) {
      const f = e.seq[Math.floor(e.t / e.rate)];
      Sprites.drawExplosion(ctx, Math.round(FX + e.x - e.size / 2), Math.round(FY + e.y - e.size / 2), e.size, e.size === 16 ? Math.min(2, f) : f);
    }
    for (const p of popups) {
      if (p.t < p.delay) continue;
      const w = Font.width(p.text) / 2;
      const x = Math.max(w, Math.min(FS - w, p.x));
      text(p.text, FX + x, FY + Math.max(0, p.y), p.color || COL.white, 1, 'center');
    }

    if (paused && (frame >> 4) & 1) text('PAUSE', FX + 104, FY + 100, COL.red, 1, 'center');
    if (gameOverT >= 0) {
      const y = Math.max(FY + 96, FY + FS - gameOverT * 1.2);
      text('GAME', FX + 104, y, COL.red, 1, 'center');
      text('OVER', FX + 104, y + 9, COL.red, 1, 'center');
    }
  }

  function renderPlay() {
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, H);
    drawField();
    drawSidebar();
    // Curtain opening effect at stage start.
    if (modeT < 24) {
      const h = Math.round((1 - modeT / 24) * (H / 2));
      ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    }
  }

  function renderIntro() {
    ctx.fillStyle = COL.black; ctx.fillRect(0, 0, W, H);
    const h = Math.round(Math.min(1, modeT / 20) * (H / 2));
    ctx.fillStyle = COL.bg; ctx.fillRect(0, 0, W, h); ctx.fillRect(0, H - h, W, h);
    if (modeT >= 20) {
      text('STAGE ' + stage, W / 2, H / 2 - 48, COL.black, 1, 'center');
      const counts = [0, 0, 0, 0];
      for (const e of Levels.enemies(stage)) counts[e]++;
      ENEMY_NAME.forEach((name, i) => {
        const cx = 44 + i * 56;
        Sprites.drawTank(ctx, cx - 16, H / 2 - 26, 'e' + i, i === 3 ? 'green' : 'silver', 0, 0, 2);
        text('X' + counts[i], cx, H / 2 + 10, COL.black, 1, 'center');
        text(name, cx, H / 2 + 20, COL.black, 1, 'center');
      });
      if (stage === 1 && players.every(p => p.score === 0) && (frame >> 5) & 1) {
        const touch = Input.source === 'touch';
        text(touch ? 'D-PAD: CHOOSE  FIRE: START' : 'ARROWS: CHOOSE  FIRE: START', W / 2, H / 2 + 44, COL.black, 1, 'center');
      }
    }
  }

  function renderTitle() {
    ctx.fillStyle = COL.black; ctx.fillRect(0, 0, W, H);
    const off = Math.max(0, H - modeT * (H / 120));
    ctx.save(); ctx.translate(0, Math.round(off));
    text('I- ' + (players[0] ? players[0].score : 0), 24, 12);
    text('HI- ' + hiScore, 120, 12);
    bigBrickText('TAN.K', W / 2, 36, 8);
    text('BATTLE CITY TRIBUTE', W / 2, 104, COL.orange, 1, 'center');
    const items = ['1 PLAYER', '2 PLAYERS', 'SOUND ' + (Sfx.muted ? 'OFF' : 'ON')];
    items.forEach((s, i) => text(s, 96, 128 + i * 16));
    if (modeT >= 120) Sprites.drawTank(ctx, 72, 124 + menuSel * 16, 'p0', 'yellow', 1, (frame >> 2) & 1);
    const touch = Input.source === 'touch', pad = Input.source === 'gamepad';
    const hint = touch ? 'D-PAD MOVE   FIRE BUTTON SHOOT'
      : pad ? 'D-PAD MOVE   A/B FIRE   START PAUSE'
      : menuSel === 1 ? 'P1 WASD+SPACE   P2 ARROWS+ENTER' : 'ARROWS/WASD MOVE  SPACE FIRE';
    text(hint, W / 2, 184, COL.bg, 1, 'center');
    text('P PAUSE  M MUTE  F11 FULLSCREEN', W / 2, 196, COL.bg, 1, 'center');
    ctx.restore();
  }

  function renderTally() {
    const tl = tally;
    ctx.fillStyle = COL.black; ctx.fillRect(0, 0, W, H);
    text('HI-SCORE', 72, 16, COL.red); text(String(hiScore), 184, 16, COL.orange, 1, 'right');
    text('STAGE ' + stage, W / 2, 32, COL.white, 1, 'center');
    players.forEach((p, i) => {
      text(i ? 'II-PLAYER' : 'I-PLAYER', i ? 176 : 24, 48, COL.red);
      text(String(p.score), i ? 228 : 72, 60, COL.orange, 1, 'right');
    });
    for (let r = 0; r < 4; r++) {
      if (r > tl.row) break;
      const y = 80 + r * 22;
      Sprites.drawTank(ctx, W / 2 - 8, y - 4, 'e' + r, 'silver', 0, 0);
      players.forEach((p, i) => {
        const k = r < tl.row ? tl.rows[r][i] : Math.min(tl.count, tl.rows[r][i]);
        if (i === 0) {
          text(String(k * ENEMY[r].score), 60, y, COL.white, 1, 'right'); text('PTS', 64, y);
          text(String(k), 100, y, COL.white, 1, 'right'); text('<', 106, y);
        } else {
          text('>', 145, y); text(String(k), 154, y);
          text(String(k * ENEMY[r].score), 204, y, COL.white, 1, 'right'); text('PTS', 208, y);
        }
      });
    }
    if (tl.done) {
      ctx.fillStyle = COL.white; ctx.fillRect(88, 166, 80, 2);
      players.forEach((p, i) => {
        text('TOTAL', i === 0 ? 40 : 154, 174);
        text(String(p.kills.reduce((a, b) => a + b, 0)), i === 0 ? 100 : 204, 174, COL.white, 1, 'right');
      });
      if (tl.bonus !== undefined) {
        text('BONUS!', tl.bonus ? 154 : 40, 192, COL.red);
        text('1000 PTS', tl.bonus ? 154 : 40, 202);
      }
    }
  }

  function renderGameOver() {
    ctx.fillStyle = COL.black; ctx.fillRect(0, 0, W, H);
    bigBrickText('GAME', W / 2, 56, 8);
    bigBrickText('OVER', W / 2, 124, 8);
  }

  function render() {
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.imageSmoothingEnabled = false;
    if (mode === 'play' && shakeT > 0) {
      ctx.fillStyle = COL.bg;
      ctx.fillRect(0, 0, W, H);
      const [ox, oy] = shakeOffset();
      ctx.setTransform(1, 0, 0, 1, ox, oy);
    }
    switch (mode) {
      case 'title': renderTitle(); break;
      case 'intro': renderIntro(); break;
      case 'play': renderPlay(); break;
      case 'tally': renderTally(); break;
      case 'gameover': renderGameOver(); break;
    }
  }

  // ---------- Layout & loop ----------
  function layout() {
    const vw = window.innerWidth, vh = window.innerHeight;
    const touch = document.body.classList.contains('touch');
    const portrait = vh > vw;
    document.body.classList.toggle('portrait', portrait);
    let aw = vw, ah = vh;
    if (touch && portrait) ah = vh * 0.6;
    if (touch && !portrait) aw = vw - 2 * Math.min(vw * 0.22, 220);
    let s = Math.min(aw / W, ah / H);
    if (s >= 2) s = Math.floor(s);
    canvas.style.width = Math.floor(W * s) + 'px';
    canvas.style.height = Math.floor(H * s) + 'px';
  }
  window.addEventListener('resize', layout);
  new MutationObserver(layout).observe(document.body, { attributes: true, attributeFilter: ['class'] });

  Input.setupTouch();
  if (matchMedia('(pointer: coarse)').matches) Input.showTouch(true);
  layout();

  let last = performance.now(), acc = 0;
  const STEP = 1000 / FPS;
  function loop(now) {
    acc += Math.min(250, now - last);
    last = now;
    while (acc >= STEP) { update(); acc -= STEP; }
    render();
    requestAnimationFrame(loop);
  }
  requestAnimationFrame(loop);

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) { Sfx.engine(0); if (mode === 'play' && gameOverT < 0) paused = true; }
  });

  // Expose a tiny debug hook for automated tests.
  window.__tank = { get mode() { return mode; }, get stage() { return stage; }, get tanks() { return tanks; },
    get players() { return players; }, get queue() { return queue; }, get baseDead() { return baseDead; }, get bonus() { return bonus; },
    newGame, startStage, placeBonus, cell, setStage(n) { stage = n; }, sim(n) { for (let i = 0; i < n; i++) update(); } };
})();
