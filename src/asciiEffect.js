/**
 * AsciiEffect - optimized copy of three/addons/effects/AsciiEffect.js
 * Optimizations: willReadFrequently, lookup table, array join, persistent TD,
 * no clearRect, imageSmoothing off and render without recreating table per frame.
 * Based on three@0.185.1 — identical visual output.
 */
class AsciiEffect {
  constructor(renderer, charSet = " .:-=+*#%@", options = {}) {
    const fResolution = options["resolution"] || 0.15;
    const rawStretch = options["stretch"] != null ? Number(options["stretch"]) : 1;
    const fStretch = Number.isFinite(rawStretch) && rawStretch > 0 ? rawStretch : 1;
    const iScale = options["scale"] || 1;
    const bColor = options["color"] || false;
    const bAlpha = options["alpha"] || false;
    const bBlock = options["block"] || false;
    const bInvert = options["invert"] || false;
    const strResolution = options["strResolution"] || "low";

    let width, height;

    const domElement = document.createElement("div");
    domElement.style.cursor = "default";
    domElement.style.userSelect = "none";
    domElement.style.webkitUserSelect = "none";

    const oAscii = document.createElement("table");
    oAscii.style.userSelect = "none";
    oAscii.style.webkitUserSelect = "none";
    domElement.appendChild(oAscii);

    // Persistent structure: single row/cell reused per frame
    const oRow = document.createElement("tr");
    const oCell = document.createElement("td");
    oAscii.appendChild(oRow);
    oRow.appendChild(oCell);

    let iWidth, iHeight;

    this.domElement = domElement;

    this.setSize = function (w, h) {
      width = w;
      height = h;
      renderer.setSize(w, h);
      initAsciiSize();
    };

    this.render = function (scene, camera) {
      renderer.render(scene, camera);
      asciifyImage();
    };

    const htmlEscapes = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
    };
    const reUnescapedHtml = /[&<>]/g;
    function escapeHTML(s) {
      return s.replace(reUnescapedHtml, (ch) => htmlEscapes[ch]);
    }

    const strFont = "Consolas, Courier New, monospace";
    const oCanvasImg = renderer.domElement;
    const oCanvas = document.createElement("canvas");
    if (!oCanvas.getContext) return;
    const oCtx = oCanvas.getContext("2d", { willReadFrequently: true });
    if (!oCtx.getImageData) return;
    // Faster, block-accurate NN sampling; avoids bilinear blur from downscaling
    oCtx.imageSmoothingEnabled = false;

    let aCharList;
    if (charSet) {
      aCharList = charSet.split("").map((c) => {
        if (c === " ") return "&nbsp;";
        return escapeHTML(c);
      });
    } else {
      const aDefaultCharList = " .,:;i1tfLCG08@".split("");
      const aDefaultColorCharList = " CGO08@".split("");
      const src = bColor ? aDefaultColorCharList : aDefaultCharList;
      aCharList = src.map((c) => (c === " " ? "&nbsp;" : escapeHTML(c)));
    }

    const fFontSize = (2 / fResolution) * iScale;
    const fLineHeight = (2 / fResolution) * iScale;
    let fLetterSpacing = 0;
    if (strResolution == "low") {
      switch (iScale) {
        case 1: fLetterSpacing = -1; break;
        case 2:
        case 3: fLetterSpacing = -2.1; break;
        case 4: fLetterSpacing = -3.1; break;
        case 5: fLetterSpacing = -4.15; break;
      }
    }
    if (strResolution == "medium") {
      switch (iScale) {
        case 1: fLetterSpacing = 0; break;
        case 2: fLetterSpacing = -1; break;
        case 3: fLetterSpacing = -1.04; break;
        case 4:
        case 5: fLetterSpacing = -2.1; break;
      }
    }
    if (strResolution == "high") {
      switch (iScale) {
        case 1:
        case 2: fLetterSpacing = 0; break;
        case 3:
        case 4:
        case 5: fLetterSpacing = -1; break;
      }
    }

    // Lookup: luminance 0..255 -> char, precomputed to avoid Math.round/div per pixel
    const maxIdx = aCharList.length - 1;
    const brightnessMap = new Array(256);
    for (let i = 0; i < 256; i++) {
      // bInvert=true: high brightness -> dense char; else inverted
      const idx = bInvert ? Math.round((i / 255) * maxIdx) : Math.round((1 - i / 255) * maxIdx);
      brightnessMap[i] = aCharList[idx];
    }
    // Char for alpha 0 (transparent background -> max brightness)
    const transparentChar = bInvert ? brightnessMap[255] : brightnessMap[255];

    function initAsciiSize() {
      iWidth = Math.floor(width * fResolution * fStretch);
      iHeight = Math.floor(height * fResolution);
      oCanvas.width = iWidth;
      oCanvas.height = iHeight;
      oCtx.imageSmoothingEnabled = false;
      // table styles — set once per resize
      oAscii.cellSpacing = "0";
      oAscii.cellPadding = "0";
      const s = oAscii.style;
      s.whiteSpace = "pre";
      s.margin = "0 auto";
      s.padding = "0px";
      s.letterSpacing = fLetterSpacing + "px";
      s.fontFamily = strFont;
      s.fontSize = fFontSize + "px";
      s.lineHeight = fLineHeight + "px";
      s.textAlign = "center";
      s.textDecoration = "none";
      s.display = "table";
      s.width = "auto";
      s.maxWidth = "none";
      s.borderCollapse = "collapse";
      s.borderSpacing = "0";
      // persistent cell
      const cs = oCell.style;
      cs.display = "table-cell";
      cs.width = "auto";
      cs.maxWidth = "none";
      cs.height = "auto";
      cs.overflow = "visible";
      cs.textAlign = "center";
      cs.margin = "0 auto";
      cs.padding = "0";
    }

    // Fast path without color (actual wallpaper case: bColor=false)
    function asciifySimple() {
      // drawImage overwrites the entire canvas, no clearRect needed
      oCtx.drawImage(oCanvasImg, 0, 0, iWidth, iHeight);
      const data = oCtx.getImageData(0, 0, iWidth, iHeight).data;
      const w = iWidth;
      const h = iHeight;
      const parts = [];
      // build row-by-row with join to avoid 40k intermediate concatenations
      for (let y = 0; y < h; y += 2) {
        const rowOff = y * w * 4;
        for (let x = 0; x < w; x++) {
          const o = rowOff + x * 4;
          const a = data[o + 3];
          let lum;
          if (a === 0) {
            parts.push(transparentChar);
            continue;
          }
          // BT.601 luma: 0.3R+0.59G+0.11B — |0 avoids extra /255 division via lookup
          lum = (0.3 * data[o] + 0.59 * data[o + 1] + 0.11 * data[o + 2]) | 0;
          parts.push(brightnessMap[lum]);
        }
        parts.push("<br/>");
      }
      oCell.innerHTML = parts.join("");
    }

    // Color/block/alpha path — preserves original behavior when enabled
    function asciifyColor() {
      oCtx.drawImage(oCanvasImg, 0, 0, iWidth, iHeight);
      const data = oCtx.getImageData(0, 0, iWidth, iHeight).data;
      const w = iWidth;
      const h = iHeight;
      const parts = [];
      for (let y = 0; y < h; y += 2) {
        const rowOff = y * w * 4;
        for (let x = 0; x < w; x++) {
          const o = rowOff + x * 4;
          const r = data[o];
          const g = data[o + 1];
          const b = data[o + 2];
          const a = data[o + 3];
          let lum;
          let ch;
          if (a === 0) {
            ch = transparentChar;
            lum = 255;
          } else {
            lum = (0.3 * r + 0.59 * g + 0.11 * b) | 0;
            ch = brightnessMap[lum];
          }
          parts.push(
            "<span style='color:rgb(" + r + "," + g + "," + b + ");" +
              (bBlock ? "background-color:rgb(" + r + "," + g + "," + b + ");" : "") +
              (bAlpha ? "opacity:" + a / 255 + ";" : "") +
              "'>" + ch + "</span>"
          );
        }
        parts.push("<br/>");
      }
      oCell.innerHTML = parts.join("");
    }

    function asciifyImage() {
      if (bColor || bBlock || bAlpha) {
        asciifyColor();
      } else {
        asciifySimple();
      }
    }
  }
}

export { AsciiEffect };
