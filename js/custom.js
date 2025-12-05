document.addEventListener("DOMContentLoaded", () => {
  try {
    const imgSrc =
      "https://upload.wikimedia.org/wikipedia/commons/8/80/World_map_-_low_resolution.svg";
    const canvas = document.getElementById("c");
    if (!canvas) throw new Error("Canvas element not found");
    const ctx = canvas.getContext("2d", { alpha: true });

    // Get CSS variables for colors
    const root = document.documentElement;
    const styles = getComputedStyle(root);
    const dotGreyColor = styles.getPropertyValue("--dot-grey").trim();
    const dotWhiteColor = styles.getPropertyValue("--dot-white").trim();

    const greyRGB = hexToRgb(dotGreyColor);
    const whiteRGB = hexToRgb(dotWhiteColor);

    const DOT_SIZE = 2;
    const SPACING = 4;
    const DOT_DECAY = 3000;

    let dots = [];
    let animating = false;

    function hexToRgb(hex) {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result
        ? {
            r: parseInt(result[1], 16),
            g: parseInt(result[2], 16),
            b: parseInt(result[3], 16),
          }
        : { r: 111, g: 111, b: 111 };
    }

    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => {
      fitCanvasToWindow();
      generateGrid();
      renderOnce();
    };
    img.onerror = () => {
      fitCanvasToWindow();
      generateGrid(true);
      renderOnce();
    };
    img.src = imgSrc;

    window.addEventListener("resize", () => {
      fitCanvasToWindow();
      generateGrid();
      renderOnce();
    });

    function fitCanvasToWindow() {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    }

    function generateGrid(forceFallback = false) {
      dots = [];
      const off = document.createElement("canvas");
      off.width = canvas.width;
      off.height = canvas.height;
      const octx = off.getContext("2d");

      if (!forceFallback && img && img.complete && img.naturalWidth) {
        const imgAR = img.width / img.height;
        const canvasAR = off.width / off.height;
        let dw, dh, dx, dy;

        if (imgAR > canvasAR) {
          dh = off.height;
          dw = Math.round(off.height * imgAR);
          dy = 0;
          dx = Math.round((off.width - dw) / 2);
        } else {
          dw = off.width;
          dh = Math.round(off.width / imgAR);
          dx = 0;
          dy = Math.round((off.height - dh) / 2);
        }

        octx.drawImage(img, dx, dy, dw, dh);
      } else {
        octx.fillStyle = "#ffffff";
        octx.fillRect(0, 0, off.width, off.height);
      }

      const imgData = octx.getImageData(0, 0, off.width, off.height).data;
      for (let y = 0; y < off.height; y += SPACING) {
        for (let x = 0; x < off.width; x += SPACING) {
          const idx = (y * off.width + x) * 4 + 3;
          if (imgData[idx] > 10) {
            dots.push({ x, y, lastHit: -Infinity });
          }
        }
      }
    }

    function lightUpRandomDots() {
      const now = performance.now();
      const numDots = 3 + Math.floor(Math.random() * 6);

      for (let i = 0; i < numDots; i++) {
        if (dots.length > 0) {
          const randomIndex = Math.floor(Math.random() * dots.length);
          dots[randomIndex].lastHit = now;
        }
      }

      if (!animating) {
        animating = true;
        requestAnimationFrame(loop);
      }
    }

    function loop() {
      const now = performance.now();
      let anyActive = false;

      for (let i = 0; i < dots.length; i++) {
        if (now - dots[i].lastHit < DOT_DECAY) {
          anyActive = true;
          break;
        }
      }

      renderOnce();

      if (anyActive) {
        requestAnimationFrame(loop);
      } else {
        animating = false;
      }
    }

    function renderOnce() {
      if (!ctx) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.fillStyle = "#000";
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      const now = performance.now();
      for (const d of dots) {
        const age = now - d.lastHit;
        let t = 0;
        if (age < DOT_DECAY) {
          t = 1 - age / DOT_DECAY;
          t = 1 - Math.pow(1 - t, 3);
        }

        const r = Math.round(greyRGB.r + (whiteRGB.r - greyRGB.r) * t);
        const g = Math.round(greyRGB.g + (whiteRGB.g - greyRGB.g) * t);
        const b = Math.round(greyRGB.b + (whiteRGB.b - greyRGB.b) * t);

        ctx.fillStyle = `rgb(${r}, ${g}, ${b})`;
        ctx.fillRect(d.x - DOT_SIZE / 2, d.y - DOT_SIZE / 2, DOT_SIZE, DOT_SIZE);
      }
    }

    function startAutomaticDotLighting() {
      lightUpRandomDots();
      const nextInterval = 200 + Math.random() * 600;
      setTimeout(startAutomaticDotLighting, nextInterval);
    }

    fitCanvasToWindow();
    generateGrid();
    renderOnce();
    setTimeout(startAutomaticDotLighting, 500);
  } catch (err) {
    console.error("Initialization error:", err);
  }
});
