import { defineConfig } from 'vite'

export default defineConfig({
  // Local/Lively + Release zip: "/"  → file:// + dist/ works as-is (Lively IsAbsolutePath:false)
  // GitHub Pages: "/ascii-3d-wallpaper/" → https://litygames.github.io/ascii-3d-wallpaper/
  // GITHUB_PAGES is set only in pages.yml (not in release.yml) to avoid breaking the Lively zip.
  base: process.env.GITHUB_PAGES ? '/ascii-3d-wallpaper/' : '/',
})
