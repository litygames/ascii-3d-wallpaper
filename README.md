# ASCII 3D Wallpaper — Lively Wallpaper

> 3D models rendered as ASCII art for [Lively Wallpaper](https://github.com/rocksdanister/lively) — built with **Three.js + Vite**.

[![Try it online](https://img.shields.io/badge/Try%20it%20online-39FF88?style=flat-square)](https://litygames.github.io/ascii-3d-wallpaper/)

## Features

- **ASCII rendering** — 3D models rendered as ASCII characters
- **Custom GLB models** — load your own `.glb` files
- **Live customization** — animation, speed, detail, color, brightness, scale, and model selection
- **Lively integration** — supports pause/resume events
- **Lightweight** — ~154 KB gzipped

## Installation

### Release

1. Download the latest `.zip` from [Releases](../../releases).
2. In Lively, select **Add Wallpaper → Choose a file** and choose the `.zip`.

### From Source

```bash
git clone https://github.com/litygames/ascii-3d-wallpaper.git
cd ascii-3d-wallpaper
npm install
npm run build
```

Then add the `dist/` folder to Lively.

## Controls

Right-click the wallpaper → **Customise**.

| Control           |     Range |                       Default |
| ----------------- | --------: | ----------------------------: |
| 3D Model          |    `.glb` |                 `default.glb` |
| Model scale       |     0.5–3 |                           `1` |
| Speed             |     0.1–5 |                         `1.5` |
| Animation         |  Dropdown |         `Continuous rotation` |
| Invert rotation   |    On/Off |                       `false` |
| Disable animation |    On/Off |                       `false` |
| ASCII detail      |  0.1–0.25 |                        `0.14` |
| ASCII effect      |    On/Off |                        `true` |
| Text color        | Any color |                     `#39FF88` |
| Background color  | Any color |                     `#0D110F` |
| Brightness        |     0.5–5 |                         `3.2` |

> **Performance tip:** `ASCII detail` is the only performance-sensitive setting. Keep ≤ `0.18` on low-end GPUs. The default `0.14` provides a good balance between detail and performance.

## Custom Models

Place `.glb` files in `public/models/`.

Recommended:

- **File size:** < 5 MB
- **Geometry:** < 50k triangles
- **Materials:** 1 simple material
- **Animations:** None required
- **Textures:** Not required

Only `.glb` models are supported.

## Development

```bash
npm run dev         # auto-syncs src/config.js → public/LivelyProperties.json
npm run build       # auto-syncs before build
npm run preview
npm run package     # build + zip
npm run sync        # manual sync (config → LivelyProperties.json)
npm run sync:check  # CI: fail if out of sync
```

- `src/config.js` is the single source of truth for configuration defaults.
- `scripts/sync-lively.mjs` generates the corresponding numeric values in
  `public/LivelyProperties.json` before development and builds.

## Tech Stack

- [Three.js](https://threejs.org/)
- [Vite](https://vitejs.dev/)
- JavaScript
- Plain CSS

## Credits

- **Author:** [litygames](https://github.com/litygames)
- **3D engine:** [Three.js](https://threejs.org/)
- **Build tool:** [Vite](https://vitejs.dev/)
- **Wallpaper host:** [Lively Wallpaper](https://github.com/rocksdanister/lively) by [rocksdanister](https://github.com/rocksdanister/lively)
- **ASCII effect:** Based on `AsciiEffect` from Three.js
- **Default model:** `default.glb` — torus by [litygames](https://github.com/litygames) (Blender) — MIT

## License

MIT — see [LICENSE](LICENSE).
