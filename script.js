(function () {
  const root = document.documentElement;
  const themeToggle = document.getElementById("themeToggle");
  const navToggle = document.getElementById("navToggle");
  const navLinks = document.getElementById("navLinks");
  const yearEl = document.getElementById("year");

  if (yearEl) yearEl.textContent = new Date().getFullYear();

  const visitCounter = document.getElementById("visitCounter");
  if (visitCounter) {
    fetch("https://sekarm.goatcounter.com/counter//.json")
      .then(function (res) { return res.ok ? res.json() : null; })
      .then(function (data) {
        if (data && data.count_unique) {
          visitCounter.textContent = Number(data.count_unique).toLocaleString() + " visitors so far";
        }
      })
      .catch(function () { /* blocked by an ad-blocker or offline; fail silently */ });
  }

  function applyTheme(theme) {
    root.setAttribute("data-theme", theme);
    try { localStorage.setItem("theme", theme); } catch (e) {}
  }

  let stored = null;
  try { stored = localStorage.getItem("theme"); } catch (e) {}
  const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
  applyTheme(stored || (prefersDark ? "dark" : "light"));

  themeToggle.addEventListener("click", function () {
    const current = root.getAttribute("data-theme");
    applyTheme(current === "dark" ? "light" : "dark");
  });

  navToggle.addEventListener("click", function () {
    const open = navLinks.classList.toggle("open");
    navToggle.setAttribute("aria-expanded", open ? "true" : "false");
  });

  navLinks.querySelectorAll("a").forEach(function (link) {
    link.addEventListener("click", function () {
      navLinks.classList.remove("open");
      navToggle.setAttribute("aria-expanded", "false");
    });
  });

  const lightbox = document.getElementById("lightbox");
  const lightboxImg = document.getElementById("lightboxImg");
  const lightboxClose = document.getElementById("lightboxClose");

  if (lightbox && lightboxImg) {
    document.querySelectorAll(".poetry-thumb").forEach(function (thumb) {
      thumb.addEventListener("click", function () {
        lightboxImg.src = thumb.getAttribute("data-full");
        lightboxImg.alt = thumb.querySelector("img").alt;
        lightbox.classList.add("open");
      });
    });

    function closeLightbox() {
      lightbox.classList.remove("open");
      lightboxImg.src = "";
    }

    lightboxClose.addEventListener("click", closeLightbox);
    lightbox.addEventListener("click", function (e) {
      if (e.target === lightbox) closeLightbox();
    });
    document.addEventListener("keydown", function (e) {
      if (e.key === "Escape") closeLightbox();
    });
  }

  /* ---------- click sparkles ---------- */
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (!reduceMotion) {
    const sparkleVars = ["--c-blue", "--c-purple", "--c-teal", "--c-amber", "--c-green", "--c-pink"];
    document.addEventListener("click", function (e) {
      const styles = getComputedStyle(root);
      const count = 8;
      for (let i = 0; i < count; i++) {
        const el = document.createElement("span");
        el.className = "sparkle";
        const colorVar = sparkleVars[Math.floor(Math.random() * sparkleVars.length)];
        el.style.setProperty("--sparkle-color", styles.getPropertyValue(colorVar).trim());
        const angle = (Math.PI * 2 * i) / count + Math.random() * 0.6;
        const distance = 26 + Math.random() * 34;
        el.style.setProperty("--tx", (Math.cos(angle) * distance).toFixed(1) + "px");
        el.style.setProperty("--ty", (Math.sin(angle) * distance).toFixed(1) + "px");
        el.style.left = e.clientX + "px";
        el.style.top = e.clientY + "px";
        document.body.appendChild(el);
        el.addEventListener("animationend", function () { el.remove(); });
        setTimeout(function () { if (el.parentNode) el.remove(); }, 900);
      }
    });
  }

  /* ---------- neural net canvas ---------- */
  const canvas = document.getElementById("netCanvas");
  const caption = document.getElementById("visualCaption");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  const LAYERS = 5;
  const ROWS = 5;
  const LABEL_H = 22;
  const LAYER_COLORS = ["--c-blue", "--c-purple", "--c-teal", "--c-pink", "--c-amber"];
  const LAYER_LABELS = ["Input", "Hidden", "Hidden", "Hidden", "Output"];
  let nodes = [];
  let dpr = Math.max(1, window.devicePixelRatio || 1);
  let w = 0, h = 0;

  function cssVar(name, fallback) {
    const v = getComputedStyle(root).getPropertyValue(name).trim();
    return v || fallback;
  }
  function layerColor(l) { return cssVar(LAYER_COLORS[l % LAYER_COLORS.length], "#1a56db"); }
  function borderColor() { return cssVar("--border", "#333"); }
  function fgMuted() { return cssVar("--fg-muted", "#888"); }
  function bgAlt() { return cssVar("--bg-alt", "#111"); }

  function layout() {
    const rect = canvas.getBoundingClientRect();
    w = rect.width;
    h = rect.height;
    dpr = Math.max(1, window.devicePixelRatio || 1);
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    nodes = [];
    const padX = w * 0.08;
    const plotH = h - LABEL_H;
    const padY = plotH * 0.12;
    for (let l = 0; l < LAYERS; l++) {
      const x = padX + (l * (w - 2 * padX)) / (LAYERS - 1);
      const col = [];
      const rowsInCol = ROWS - (l % 2 === 0 ? 0 : 1);
      const offset = rowsInCol < ROWS ? (plotH - 2 * padY) / (ROWS - 1) / 2 : 0;
      for (let r = 0; r < rowsInCol; r++) {
        const y = padY + offset + (r * (plotH - 2 * padY)) / (rowsInCol - 1 || 1);
        col.push({ x: x, y: y, activity: 0 });
      }
      nodes.push(col);
    }
  }

  function fireFrom(layerIdx, nodeIdx) {
    if (!nodes[layerIdx] || !nodes[layerIdx][nodeIdx]) return;
    const counts = new Array(LAYERS).fill(0);
    let path = [{ l: layerIdx, i: nodeIdx, delay: 0 }];
    counts[layerIdx]++;
    let frontier = [{ l: layerIdx, i: nodeIdx }];
    let t = 0;
    while (frontier.length && path.length < 40) {
      const nextL = frontier[0].l + 1;
      if (nextL >= LAYERS) break;
      t += 140;
      const nextFrontier = [];
      frontier.forEach(function (node) {
        const targets = nodes[nextL];
        const pick = Math.min(2, targets.length);
        for (let k = 0; k < pick; k++) {
          const idx = Math.floor(Math.random() * targets.length);
          path.push({ l: nextL, i: idx, delay: t, from: node });
          nextFrontier.push({ l: nextL, i: idx });
          counts[nextL]++;
        }
      });
      frontier = nextFrontier;
    }
    path.forEach(function (p) {
      setTimeout(function () {
        if (nodes[p.l] && nodes[p.l][p.i]) {
          nodes[p.l][p.i].activity = 1;
        }
      }, p.delay);
    });
    if (caption) {
      caption.textContent = "[" + counts.join(", ") + "] firing";
      clearTimeout(fireFrom._resetTimer);
      fireFrom._resetTimer = setTimeout(function () {
        caption.textContent = "hover or click to fire";
      }, t + 900);
    }
  }

  function draw() {
    ctx.clearRect(0, 0, w, h);
    const border = borderColor();

    // edges
    for (let l = 0; l < LAYERS - 1; l++) {
      nodes[l].forEach(function (a) {
        nodes[l + 1].forEach(function (b) {
          const lit = a.activity > 0.05 && b.activity > 0.05;
          ctx.strokeStyle = lit ? layerColor(l + 1) : border;
          ctx.globalAlpha = lit ? 0.55 : 0.35;
          ctx.lineWidth = lit ? 1.3 : 0.6;
          ctx.beginPath();
          ctx.moveTo(a.x, a.y);
          ctx.lineTo(b.x, b.y);
          ctx.stroke();
        });
      });
    }
    ctx.globalAlpha = 1;

    // dotted background texture
    ctx.fillStyle = border;
    ctx.globalAlpha = 0.4;
    for (let x = 8; x < w; x += 22) {
      for (let y = 8; y < h - LABEL_H; y += 22) {
        ctx.beginPath();
        ctx.arc(x, y, 0.7, 0, Math.PI * 2);
        ctx.fill();
      }
    }
    ctx.globalAlpha = 1;

    // nodes (glossy bubbles)
    nodes.forEach(function (col, l) {
      const color = layerColor(l);
      col.forEach(function (n) {
        n.activity *= 0.965;
        const active = n.activity > 0.05;
        const r = 5 + n.activity * 4.5;
        const grad = ctx.createRadialGradient(n.x - r * 0.35, n.y - r * 0.35, r * 0.1, n.x, n.y, r);
        if (active) {
          grad.addColorStop(0, "#ffffff");
          grad.addColorStop(0.4, color);
          grad.addColorStop(1, color);
        } else {
          grad.addColorStop(0, "rgba(255,255,255,0.35)");
          grad.addColorStop(1, bgAlt());
        }
        ctx.beginPath();
        ctx.arc(n.x, n.y, r, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        if (active) { ctx.shadowColor = color; ctx.shadowBlur = 11; }
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.lineWidth = 1.3;
        ctx.strokeStyle = active ? color : fgMuted();
        ctx.globalAlpha = active ? 1 : 0.65;
        ctx.stroke();
        ctx.globalAlpha = 1;
      });
    });

    // layer labels
    ctx.font = "600 10px -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif";
    ctx.fillStyle = fgMuted();
    ctx.textAlign = "center";
    ctx.globalAlpha = 0.8;
    nodes.forEach(function (col, l) {
      if (!col.length) return;
      ctx.fillText(LAYER_LABELS[l] || "", col[0].x, h - 6);
    });
    ctx.globalAlpha = 1;
    ctx.textAlign = "left";

    requestAnimationFrame(draw);
  }

  layout();
  draw();
  window.addEventListener("resize", layout);

  function ambientFire() {
    const idx = Math.floor(Math.random() * nodes[0].length);
    fireFrom(0, idx);
    const next = 2600 + Math.random() * 2200;
    setTimeout(ambientFire, next);
  }
  if (!reduceMotion) {
    setTimeout(ambientFire, 1200);
  }

  function fireNear(clientX, clientY) {
    const rect = canvas.getBoundingClientRect();
    const x = clientX - rect.left;
    const y = clientY - rect.top;
    let best = { l: 0, i: 0, d: Infinity };
    nodes[0].forEach(function (n, i) {
      const d = Math.hypot(n.x - x, n.y - y);
      if (d < best.d) best = { l: 0, i: i, d: d };
    });
    fireFrom(best.l, best.i);
  }

  canvas.addEventListener("click", function (e) {
    fireNear(e.clientX, e.clientY);
  });
  let hoverTimer = null;
  canvas.addEventListener("mousemove", function (e) {
    if (hoverTimer) return;
    hoverTimer = setTimeout(function () { hoverTimer = null; }, 900);
    fireNear(e.clientX, e.clientY);
  });
})();
