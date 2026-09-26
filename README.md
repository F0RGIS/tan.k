# TAN.K — a Battle City (NES) tribute

A remake of the classic 1985 NES tank game. Defend your eagle, destroy the
20 enemy tanks in each stage and collect power-ups. It runs on **Windows**
and **Android** (as native apps or an installable web app), and in any
modern browser.

Pure HTML5 canvas + JavaScript. There are no runtime dependencies and no
image or sound files: sprites, font and sound effects are all generated in
code.

## Features

- NES-style 256×224 pixel playfield
- Walls and terrain: **brick** (breaks in 4-pixel chunks), **steel** (only a
  fully upgraded tank can break it), **water** (blocks tanks, not bullets),
  **trees** (hide tanks) and **ice** (tanks slide). Brick and steel also come
  as half and quarter blocks.
- 4 enemy types, each with its own look (the stage screen shows each
  stage's lineup):
  - **Basic**: slow
  - **Fast**: moves quickly
  - **Power**: fires fast shells
  - **Armor**: takes 4 hits and flashes green → gold → teal as it's damaged
- Red flashing tanks drop power-ups: **star** (upgrade), **gun** (instant max
  upgrade), **grenade** (destroy all enemies), **helmet** (shield),
  **shovel** (steel fortress), **clock** (freeze enemies) and **tank**
  (extra life)
- Player upgrades: each star changes the tank's look, and the sidebar
  shows how many you have.
  1. Fast shells
  2. Double shot
  3. Steel breaker (heavy tank)

  Losing a life resets your upgrades.
- 12 hand-made stages, then endless generated stages. You can pick the
  starting stage on the stage screen.
- 1 or 2 players (same keyboard, or gamepads)
- Score tally screen, extra life every 20,000 points, saved hi-score
- Keyboard, gamepad (XInput / Android controllers) and on-screen touch
  controls

## Controls

| Action | Keyboard | Gamepad | Touch |
| --- | --- | --- | --- |
| Move | Arrows / WASD (P2: arrows in 2P mode) | D-pad / left stick | Left joystick |
| Fire | Space, J, K, Z, X (P2: Enter, Right Ctrl) | A / B / X / Y | FIRE button |
| Pause | P / Esc | Start | II button |
| Mute | M | — | Title menu |
| Fullscreen | F11 | — | — |

## Play in the browser

```bash
npm start            # serves www/ on http://localhost:8080
```

Any static web server works, because the game is just the `www/` folder.
When it's served over HTTPS, Chrome and Edge offer to **install** it as an
app (PWA), which also works offline, on both Windows and Android.

## Build for Windows (.exe)

```bash
npm install
npm run electron     # run the desktop version
npm run build:win    # -> dist/TAN.K Setup x.y.z.exe and TAN.K-x.y.z-portable.exe
```

Run `build:win` on Windows. Building on Linux or macOS needs Wine.

## Build for Android (.apk)

Requires JDK 21 and the Android SDK (Android Studio installs both).

```bash
npm install
npm run android:init   # one-time: creates android/ and launcher icons
npm run build:android  # -> android/app/build/outputs/apk/debug/app-debug.apk
```

You can also open the `android/` folder in Android Studio to run it on a
device or build a signed release.

## CI builds

`.github/workflows/build.yml` builds the Windows `.exe` files and the
Android `.apk`. To run it, go to **Actions → Build apps → Run workflow**,
or push a tag such as `v1.0.0`. The files appear as workflow artifacts.

## Project layout

```
www/                 the game (the only thing shipped)
  index.html         canvas + touch controls
  js/game.js         game logic, AI, rendering, screens
  js/levels.js       stage maps and enemy lineups
  js/sprites.js      procedural pixel-art sprites
  js/audio.js        WebAudio sound effects
  js/input.js        keyboard / gamepad / touch input
  js/font.js         5x7 bitmap font
  sw.js, manifest.webmanifest   offline / installable web app
electron/main.js     Windows desktop wrapper
capacitor.config.json  Android wrapper config
tools/make-icons.js  regenerates the app icons (needs Playwright)
```

### Adding stages

Stages in `www/js/levels.js` are 13×13 text grids:
`#` brick, `@` steel, `~` water, `%` trees, `-` ice, `.` empty.
`r` `l` `t` `b` make half bricks, and `R` `L` `T` `B` make half steel
blocks. `1`–`4` are quarter bricks and `5`–`8` quarter steel blocks, in the
order top-left, top-right, bottom-left, bottom-right. The eagle and its wall are added automatically.

---

*TAN.K is a fan-made tribute and is not affiliated with Namco / Bandai Namco.*
