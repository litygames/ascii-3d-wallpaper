# ASCII 3D Wallpaper — Lively Wallpaper

> 3D models rendered as ASCII art for [Lively Wallpaper](https://github.com/rocksdanister/lively) — built with **Three.js + Vite**.

[![Try it online](https://img.shields.io/badge/Try%20it%20online-39FF88?style=flat-square)](https://litygames.github.io/ascii-3d-wallpaper/)

## Features

* **ASCII rendering** — 3D models rendered as ASCII characters
* **Custom GLB models** — load your own `.glb` files
* **Live customization** — rotation, detail, color, brightness, scale, and model selection
* **Lively integration** — supports pause/resume events
* **Lightweight** — ~154 KB gzipped

## Installation

### Release

1. Download the latest `.zip` from [Releases](../../releases).
2. Extract the folder.
3. In Lively, select **Add Wallpaper → Choose a file** and choose the extracted folder.

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

| Control        |     Range |       Default |
| -------------- | --------: | ------------: |
| Rotation speed |       0–5 |         `1.5` |
| ASCII detail   |  0.1–0.25 |         `0.2` |
| Text color     | Any color |     `#39FF88` |
| ASCII effect   |    On/Off |        `true` |
| Brightness     |     0.5–3 |         `1.8` |
| Model scale    |     0.5–3 |           `1` |
| 3D Model       |    `.glb` | `default.glb` |

## Custom Models

Place `.glb` files in `public/models/`.

Recommended:

* **File size:** < 5 MB
* **Geometry:** < 50k triangles
* **Materials:** 1 simple material
* **Animations:** None required
* **Textures:** Not required

Only `.glb` models are supported.

## Development

```bash
npm run dev
npm run build
npm run preview
npm run package
```

## Tech Stack

* [Three.js](https://threejs.org/)
* [Vite](https://vitejs.dev/)
* JavaScript
* Plain CSS

## Credits

* **Author:** [litygames](https://github.com/litygames)
* **3D engine:** [Three.js](https://threejs.org/)
* **Build tool:** [Vite](https://vitejs.dev/)
* **Wallpaper host:** [Lively Wallpaper](https://github.com/rocksdanister/lively) by [rocksdanister](https://github.com/rocksdanister/lively)
* **ASCII effect:** Based on `AsciiEffect` from Three.js

## License

MIT — see [LICENSE](LICENSE).
