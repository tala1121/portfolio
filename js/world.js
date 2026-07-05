/* ————————————————————————————————
   WORLD — ten real 3D sets built in Three.js.
   Each builder returns:
     group  — the set, placed at its station on the dolly track
     update(t, p) — per-frame animation (p = chapter progress 0..1)
     mod(p, t)    — camera choreography for this chapter
                    { dx, dy, dz, df } offsets + fov kick
   ———————————————————————————————— */
(function () {
  "use strict";
  const T = window.THREE;
  const TAU = Math.PI * 2;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const ease = (k) => k * k * (3 - 2 * k);

  function mulberry32(seed) {
    let s = seed >>> 0;
    return function () {
      s |= 0; s = (s + 0x6D2B79F5) | 0;
      let x = Math.imul(s ^ (s >>> 15), 1 | s);
      x = (x + Math.imul(x ^ (x >>> 7), 61 | x)) ^ x;
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }

  // ——— shared textures ———
  const glowTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 128;
    const g = c.getContext("2d");
    const rad = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    rad.addColorStop(0, "rgba(255,255,255,1)");
    rad.addColorStop(0.25, "rgba(255,255,255,0.5)");
    rad.addColorStop(1, "rgba(255,255,255,0)");
    g.fillStyle = rad;
    g.fillRect(0, 0, 128, 128);
    return new T.CanvasTexture(c);
  })();

  function windowTex(seed, lit) {
    const rnd = mulberry32(seed);
    const c = document.createElement("canvas");
    c.width = 64; c.height = 128;
    const g = c.getContext("2d");
    g.fillStyle = "#0a0e16";
    g.fillRect(0, 0, 64, 128);
    for (let y = 6; y < 122; y += 9)
      for (let x = 6; x < 58; x += 10) {
        const on = rnd() < lit;
        g.fillStyle = on ? (rnd() < 0.8 ? "#9fc4ff" : "#ffd9a0") : "#141a26";
        g.globalAlpha = on ? 0.5 + rnd() * 0.5 : 1;
        g.fillRect(x, y, 5, 5);
      }
    g.globalAlpha = 1;
    const tex = new T.CanvasTexture(c);
    tex.magFilter = T.NearestFilter;
    return tex;
  }

  // ——— brand textures, painted by hand ———

  // ISL — golden markhor crest on a heater shield
  const markhorTex = (() => {
    const c = document.createElement("canvas");
    c.width = 512; c.height = 640;
    const g = c.getContext("2d");
    const gold = g.createLinearGradient(0, 100, 0, 580);
    gold.addColorStop(0, "#ffdf8a");
    gold.addColorStop(0.5, "#e8b74f");
    gold.addColorStop(1, "#9a6b1e");
    g.strokeStyle = gold;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.shadowColor = "rgba(255,200,90,0.9)";
    g.shadowBlur = 26;
    // shield
    g.lineWidth = 16;
    g.beginPath();
    g.moveTo(100, 130);
    g.quadraticCurveTo(256, 96, 412, 130);
    g.quadraticCurveTo(420, 330, 380, 430);
    g.quadraticCurveTo(340, 530, 256, 576);
    g.quadraticCurveTo(172, 530, 132, 430);
    g.quadraticCurveTo(92, 330, 100, 130);
    g.closePath();
    g.stroke();
    // inner line
    g.lineWidth = 4;
    g.beginPath();
    g.moveTo(124, 152);
    g.quadraticCurveTo(256, 122, 388, 152);
    g.quadraticCurveTo(394, 330, 358, 418);
    g.quadraticCurveTo(324, 506, 256, 546);
    g.quadraticCurveTo(188, 506, 154, 418);
    g.quadraticCurveTo(118, 330, 124, 152);
    g.closePath();
    g.stroke();
    // markhor — spiral horns, narrow face
    g.lineWidth = 11;
    g.beginPath(); // left horn
    g.moveTo(232, 320);
    g.bezierCurveTo(214, 280, 226, 252, 204, 224);
    g.bezierCurveTo(182, 196, 192, 172, 172, 150);
    g.stroke();
    g.beginPath(); // right horn
    g.moveTo(280, 320);
    g.bezierCurveTo(298, 280, 286, 252, 308, 224);
    g.bezierCurveTo(330, 196, 320, 172, 340, 150);
    g.stroke();
    g.lineWidth = 9;
    g.beginPath(); // face
    g.moveTo(232, 318);
    g.lineTo(244, 402);
    g.lineTo(256, 428);
    g.lineTo(268, 402);
    g.lineTo(280, 318);
    g.stroke();
    g.beginPath(); // brow
    g.moveTo(236, 330);
    g.quadraticCurveTo(256, 344, 276, 330);
    g.stroke();
    g.beginPath(); // ears
    g.moveTo(226, 316); g.lineTo(202, 306);
    g.moveTo(286, 316); g.lineTo(310, 306);
    g.stroke();
    g.lineWidth = 6;
    g.beginPath(); // beard
    g.moveTo(256, 430); g.lineTo(256, 452);
    g.stroke();
    return new T.CanvasTexture(c);
  })();

  // U.n.I — a simple, clean koala outline: two ears, round head, the nose
  const koalaTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d");
    const AC = "#17c3b2";
    g.strokeStyle = AC;
    g.fillStyle = AC;
    g.lineCap = "round";
    g.lineJoin = "round";
    g.shadowColor = "rgba(23,195,178,0.85)";
    g.shadowBlur = 16;
    g.lineWidth = 12;
    // ears
    g.beginPath(); g.arc(126, 176, 76, 0, TAU); g.stroke();
    g.beginPath(); g.arc(386, 176, 76, 0, TAU); g.stroke();
    // inner ears
    g.lineWidth = 7;
    g.beginPath(); g.arc(126, 176, 40, -0.6, Math.PI * 0.9); g.stroke();
    g.beginPath(); g.arc(386, 176, 40, Math.PI * 0.1, Math.PI + 0.6); g.stroke();
    // head
    g.lineWidth = 12;
    g.beginPath(); g.arc(256, 278, 128, 0, TAU); g.stroke();
    // the koala nose
    g.beginPath();
    g.ellipse(256, 300, 36, 56, 0, 0, TAU);
    g.fill();
    // eyes
    g.beginPath(); g.arc(198, 242, 10, 0, TAU); g.fill();
    g.beginPath(); g.arc(314, 242, 10, 0, TAU); g.fill();
    return new T.CanvasTexture(c);
  })();

  // COMSATS — accurate seal: purple outer ring, blue disc, white globe-lens
  const comsatsTex = (() => {
    const c = document.createElement("canvas");
    c.width = c.height = 512;
    const g = c.getContext("2d");
    const cx = 256, cy = 256;
    const PUR = "#3b2d7a", BLU = "#1a65b0";

    // outer purple ring
    g.shadowColor = "rgba(90,70,200,0.5)";
    g.shadowBlur = 20;
    g.fillStyle = PUR;
    g.beginPath(); g.arc(cx, cy, 248, 0, TAU); g.fill();
    g.shadowBlur = 0;

    // white border on outer ring
    g.strokeStyle = "#ffffff";
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, 248, 0, TAU); g.stroke();

    // inner blue disc
    g.fillStyle = BLU;
    g.beginPath(); g.arc(cx, cy, 185, 0, TAU); g.fill();
    g.strokeStyle = "#ffffff";
    g.lineWidth = 3;
    g.beginPath(); g.arc(cx, cy, 185, 0, TAU); g.stroke();

    // --- the globe-lens motif ---
    var lensCy = 245;
    var drawLens = function() {
      g.beginPath();
      g.moveTo(120, lensCy);
      g.quadraticCurveTo(cx, 135, 392, lensCy);
      g.quadraticCurveTo(cx, 355, 120, lensCy);
      g.closePath();
    };

    // fill lens with slightly lighter blue
    g.fillStyle = "#1f72c0";
    drawLens(); g.fill();

    // white lens outline
    g.strokeStyle = "#ffffff";
    g.lineWidth = 6;
    drawLens(); g.stroke();

    // clip inside lens for globe lines
    g.save();
    drawLens(); g.clip();

    g.strokeStyle = "#ffffff";
    g.lineWidth = 4;

    // vertical meridians
    var meridianRadii = [18, 46, 76, 108];
    for (var mi = 0; mi < meridianRadii.length; mi++) {
      g.beginPath();
      g.ellipse(cx, lensCy, meridianRadii[mi], 100, 0, 0, TAU);
      g.stroke();
    }

    // prime meridian (vertical center line)
    g.lineWidth = 4;
    g.beginPath(); g.moveTo(cx, 140); g.lineTo(cx, 350); g.stroke();

    // horizontal equator
    g.lineWidth = 3;
    g.beginPath(); g.moveTo(110, lensCy); g.lineTo(402, lensCy); g.stroke();

    g.restore();

    // --- ring text ---
    var arcText = function(str, radius, a0, a1, flip, font, col) {
      g.font = font;
      g.textAlign = "center";
      g.textBaseline = "middle";
      g.fillStyle = col;
      for (var i = 0; i < str.length; i++) {
        var a = a0 + ((a1 - a0) * i) / Math.max(1, str.length - 1);
        g.save();
        g.translate(cx + Math.cos(a) * radius, cy + Math.sin(a) * radius);
        g.rotate(a + (flip ? -Math.PI / 2 : Math.PI / 2));
        g.fillText(str[i], 0, 0);
        g.restore();
      }
    };

    // "COMSATS UNIVERSITY" along the top arc
    arcText("COMSATS UNIVERSITY", 216, -Math.PI * 1.05, Math.PI * 0.05, false,
      "bold 36px Georgia, 'Times New Roman', serif", "#ffffff");

    // white ribbon across the bottom
    g.fillStyle = "#ffffff";
    g.beginPath();
    g.arc(cx, cy, 238, Math.PI * 0.2, Math.PI * 0.8);
    g.arc(cx, cy, 192, Math.PI * 0.8, Math.PI * 0.2, true);
    g.closePath();
    g.fill();

    // "ISLAMABAD" on the ribbon
    arcText("ISLAMABAD", 214, Math.PI * 0.72, Math.PI * 0.28, true,
      "bold 28px Georgia, 'Times New Roman', serif", "#1a1040");

    // diamond separators at ribbon ends
    g.fillStyle = PUR;
    [Math.PI * 0.2, Math.PI * 0.8].forEach(function(da) {
      g.save();
      g.translate(cx + Math.cos(da) * 215, cy + Math.sin(da) * 215);
      g.rotate(Math.PI / 4);
      g.fillRect(-8, -8, 16, 16);
      g.restore();
    });

    return new T.CanvasTexture(c);
  })();

  // Systems Limited — the lowercase wordmark
  const systemsTex = (() => {
    const c = document.createElement("canvas");
    c.width = 768; c.height = 256;
    const g = c.getContext("2d");
    g.font = "300 152px 'Segoe UI', 'Helvetica Neue', Arial, sans-serif";
    g.textBaseline = "middle";
    g.fillStyle = "#d6dae2";
    g.shadowColor = "rgba(190,210,255,0.55)";
    g.shadowBlur = 16;
    const wordW = g.measureText("systems").width;
    const x0 = (768 - wordW) / 2;
    g.fillText("systems", x0, 138);
    // the red tick over the t
    const sysW = g.measureText("sys").width;
    const tW = g.measureText("t").width;
    g.shadowBlur = 10;
    g.shadowColor = "rgba(226,60,60,0.8)";
    g.fillStyle = "#e23c3c";
    g.fillRect(x0 + sysW + tW * 0.62, 52, 16, 16);
    return new T.CanvasTexture(c);
  })();

  // Cirkles — the live product, repainted as a screen
  const cirklesSiteTex = (() => {
    const c = document.createElement("canvas");
    c.width = 1024; c.height = 640;
    const g = c.getContext("2d");
    const rr = (x, y, w2, h2, r) => {
      g.beginPath();
      g.roundRect(x, y, w2, h2, r);
    };
    // rounded dark-purple ground
    rr(0, 0, 1024, 640, 26);
    const bg = g.createLinearGradient(0, 0, 0, 640);
    bg.addColorStop(0, "#171029");
    bg.addColorStop(1, "#0a0714");
    g.fillStyle = bg;
    g.fill();
    g.save();
    rr(0, 0, 1024, 640, 26);
    g.clip();
    for (const [gx, gy, gr, ca] of [[260, 170, 420, 0.5], [820, 460, 380, 0.4]]) {
      const rad = g.createRadialGradient(gx, gy, 0, gx, gy, gr);
      rad.addColorStop(0, `rgba(88,52,160,${ca})`);
      rad.addColorStop(1, "rgba(88,52,160,0)");
      g.fillStyle = rad;
      g.fillRect(0, 0, 1024, 640);
    }
    // mini eight-dot logo
    g.fillStyle = "#ffffff";
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      g.beginPath();
      g.arc(52 + Math.cos(a) * 15, 52 + Math.sin(a) * 15, 3.4, 0, TAU);
      g.fill();
    }
    // top-right chips
    g.strokeStyle = "rgba(255,255,255,0.4)";
    g.lineWidth = 2;
    rr(700, 34, 150, 38, 10); g.stroke();
    g.fillStyle = "rgba(255,255,255,0.92)";
    rr(866, 34, 110, 38, 10); g.fill();
    g.font = "600 19px 'Segoe UI', Arial, sans-serif";
    g.fillStyle = "rgba(255,255,255,0.8)";
    g.fillText("Create Event", 716, 59);
    g.fillStyle = "#151022";
    g.fillText("Sign In", 890, 59);
    // hero copy
    g.fillStyle = "#ffffff";
    g.font = "800 74px 'Segoe UI', Arial, sans-serif";
    g.textAlign = "center";
    g.fillText("hey, this is cirkles.", 512, 205);
    g.font = "400 27px 'Segoe UI', Arial, sans-serif";
    g.fillStyle = "rgba(224,216,244,0.85)";
    g.fillText("the go-to space to discover events happening around you", 512, 258);
    // buttons
    g.textAlign = "left";
    g.strokeStyle = "rgba(255,255,255,0.65)";
    rr(348, 300, 160, 46, 12); g.stroke();
    g.fillStyle = "#ffffff";
    rr(524, 300, 158, 46, 12); g.fill();
    g.font = "600 20px 'Segoe UI', Arial, sans-serif";
    g.fillStyle = "rgba(255,255,255,0.9)";
    g.fillText("events near me", 366, 330);
    g.fillStyle = "#151022";
    g.fillText("explore events", 546, 330);
    // event cards
    const hues = [["#3b2a68", "#7d54c9"], ["#1d4038", "#3fae82"], ["#4a2340", "#b0518f"]];
    for (let i = 0; i < 3; i++) {
      const cx2 = 76 + i * 300;
      g.fillStyle = "rgba(255,255,255,0.07)";
      rr(cx2, 398, 272, 200, 16); g.fill();
      const img = g.createLinearGradient(cx2, 398, cx2 + 272, 500);
      img.addColorStop(0, hues[i][0]);
      img.addColorStop(1, hues[i][1]);
      g.fillStyle = img;
      rr(cx2 + 12, 410, 248, 104, 10); g.fill();
      g.fillStyle = "rgba(255,255,255,0.92)";
      g.font = "700 20px 'Segoe UI', Arial, sans-serif";
      g.fillText(["Comedy Night — Fridays", "Safari Tourist Train", "Humpday Open Mic"][i], cx2 + 14, 545);
      g.fillStyle = "rgba(255,255,255,0.45)";
      g.font = "400 16px 'Segoe UI', Arial, sans-serif";
      g.fillText(["Apr 12 · 9:30 PM · Lahore", "Apr 5 · 1:30 PM · Rawalpindi", "Jun 4 · 9:00 PM · Karachi"][i], cx2 + 14, 572);
    }
    g.restore();
    return new T.CanvasTexture(c);
  })();

  function brandPlane(tex, w2, h2, opacity) {
    const m = new T.Mesh(
      new T.PlaneGeometry(w2, h2),
      new T.MeshBasicMaterial({
        map: tex, transparent: true, opacity: opacity === undefined ? 1 : opacity,
        side: T.DoubleSide, depthWrite: false,
      })
    );
    return m;
  }

  function glowSprite(color, size, opacity) {
    const m = new T.SpriteMaterial({
      map: glowTex, color, transparent: true, opacity: opacity || 0.8,
      blending: T.AdditiveBlending, depthWrite: false,
    });
    const s = new T.Sprite(m);
    s.scale.set(size, size, 1);
    return s;
  }

  function textSprite(text, color, worldH, weight) {
    const c = document.createElement("canvas");
    const fs = 56;
    const g = c.getContext("2d");
    g.font = (weight || 600) + " " + fs + "px 'SF Mono', Menlo, Consolas, monospace";
    const tw = Math.ceil(g.measureText(text).width) + 24;
    c.width = tw; c.height = fs + 28;
    const g2 = c.getContext("2d");
    g2.font = (weight || 600) + " " + fs + "px 'SF Mono', Menlo, Consolas, monospace";
    g2.fillStyle = color;
    g2.textBaseline = "middle";
    g2.fillText(text, 12, c.height / 2);
    const tex = new T.CanvasTexture(c);
    const m = new T.SpriteMaterial({ map: tex, transparent: true, depthWrite: false });
    const s = new T.Sprite(m);
    s.scale.set(worldH * (c.width / c.height), worldH, 1);
    return s;
  }

  function solid(geo, color, opacity) {
    return new T.Mesh(geo, new T.MeshBasicMaterial({
      color, transparent: opacity !== undefined, opacity: opacity === undefined ? 1 : opacity,
    }));
  }
  function edges(geo, color, opacity) {
    return new T.LineSegments(
      new T.EdgesGeometry(geo, 12),
      new T.LineBasicMaterial({ color, transparent: true, opacity: opacity || 0.9 })
    );
  }
  function edgedBox(wd, ht, dp, faceCol, lineCol, lineOp) {
    const geo = new T.BoxGeometry(wd, ht, dp);
    const mesh = solid(geo, faceCol);
    mesh.add(edges(geo, lineCol, lineOp));
    return mesh;
  }
  function pointsCloud(positions, color, size, opacity) {
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    return new T.Points(geo, new T.PointsMaterial({
      color, size, map: glowTex, transparent: true, opacity: opacity || 0.9,
      blending: T.AdditiveBlending, depthWrite: false,
    }));
  }
  const NOMOD = () => ({ dx: 0, dy: 0, dz: 0, df: 0 });

  // ============================================================
  // 0 — PROLOGUE: dust field + a vast slow iris
  // ============================================================
  function buildHero() {
    const g = new T.Group();
    const rnd = mulberry32(7);
    const pos = [];
    for (let i = 0; i < 400; i++)
      pos.push((rnd() - 0.5) * 300, (rnd() - 0.5) * 160, (rnd() - 0.5) * 500);
    const dust = pointsCloud(pos, 0xf4f1ea, 1.6, 0.5);
    g.add(dust);
    const ring = new T.Mesh(
      new T.TorusGeometry(34, 0.12, 8, 160),
      new T.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.35 })
    );
    const ring2 = ring.clone();
    ring2.scale.setScalar(1.25);
    ring2.material = ring.material.clone();
    ring2.material.opacity = 0.15;
    g.add(ring, ring2);
    const glow = glowSprite(0x8090b0, 90, 0.25);
    glow.position.z = -60;
    g.add(glow);

    // the face — a line-and-dot portrait sampled live from the photograph,
    // assembled out of dust on load, dissolved again by the scroll
    const portrait = new T.Group();
    portrait.position.set(0, 3, -42);
    g.add(portrait);
    const port = { pts: null, lines: null, tgt: null, scat: null, cur: null, lastK: -1 };
    (function loadPortrait() {
      const img = new Image();
      img.onload = () => {
        try {
          // 400-wide sampling ≈ 40k dots — photographic detail that still
          // rewrites its position buffer at 60fps while assembling/dissolving
          const iw = 400;
          const ih = Math.max(2, Math.round((img.height / img.width) * iw));
          const cv = document.createElement("canvas");
          cv.width = iw; cv.height = ih;
          const g2 = cv.getContext("2d");
          g2.drawImage(img, 0, 0, iw, ih);
          const data = g2.getImageData(0, 0, iw, ih).data; // throws if canvas is tainted (file://)
          const lum = (x, y) => {
            const k = (y * iw + x) * 4;
            return (data[k] * 0.299 + data[k + 1] * 0.587 + data[k + 2] * 0.114) / 255;
          };
          const MOB = window.innerWidth <= 820;
          const S = (MOB ? 62 : 78) / ih; // smaller face fits narrow frames
          const STEP = MOB ? 3 : 2;       // fewer particles for phone GPUs
          // oval portrait mask, weighted to the face
          const mask = (x, y) => {
            const nx = (x - iw / 2) / (iw * 0.44);
            const ny = (y - ih * 0.4) / (ih * 0.55);
            return nx * nx + ny * ny;
          };
          const tgt = [], scat = [], colArr = [];
          for (let y = 0; y < ih; y += STEP)
            for (let x = 0; x < iw; x += STEP) {
              const d = mask(x, y);
              if (d > 1) continue;
              const L = lum(x, y);
              if (L < 0.1) continue;
              const edgeFade = 1 - Math.max(0, (d - 0.55) / 0.45) * 0.9;
              tgt.push((x - iw / 2) * S, (ih / 2 - y) * S, L * 6);
              scat.push((Math.random() - 0.5) * 190, (Math.random() - 0.5) * 120, (Math.random() - 0.5) * 100);
              // gamma-lift the midtones so the face reads, not just the hoodie
              const cc = (0.34 + Math.pow(L, 0.72) * 0.7) * edgeFade;
              colArr.push(cc, cc * 0.98, cc * 0.92);
            }
          const geo = new T.BufferGeometry();
          const cur = new Float32Array(scat);
          geo.setAttribute("position", new T.BufferAttribute(cur, 3));
          geo.setAttribute("color", new T.Float32BufferAttribute(colArr, 3));
          const pts = new T.Points(geo, new T.PointsMaterial({
            size: 0.4, vertexColors: true, map: glowTex, transparent: true,
            opacity: 0.95, blending: T.AdditiveBlending, depthWrite: false,
          }));
          portrait.add(pts);
          // contour strokes: short ink lines laid along tonal edges
          const lpos = [];
          for (let y = 2; y < ih - 2 && lpos.length < (MOB ? 9000 : 18000); y += STEP)
            for (let x = 2; x < iw - 2; x += STEP) {
              if (mask(x, y) > 0.92) continue;
              const sgx = lum(x + 2, y) - lum(x - 2, y);
              const sgy = lum(x, y + 2) - lum(x, y - 2);
              const mag = Math.hypot(sgx, sgy);
              if (mag < 0.22) continue;
              let tx = -sgy / mag, ty = sgx / mag; // edge tangent, image space
              const wx = (x - iw / 2) * S, wy = (ih / 2 - y) * S;
              const wz = lum(x, y) * 6 + 0.25;
              const ln = 1.1 * S;
              lpos.push(wx - tx * ln, wy + ty * ln, wz, wx + tx * ln, wy - ty * ln, wz);
            }
          const lgeo = new T.BufferGeometry();
          lgeo.setAttribute("position", new T.Float32BufferAttribute(lpos, 3));
          const lines = new T.LineSegments(lgeo, new T.LineBasicMaterial({
            color: 0xf4f1ea, transparent: true, opacity: 0,
            blending: T.AdditiveBlending, depthWrite: false,
          }));
          portrait.add(lines);
          port.pts = pts; port.lines = lines;
          port.tgt = tgt; port.scat = scat; port.cur = cur;
        } catch (e) {
          // canvas tainted (opened via file://) or unreadable — the film runs without the face
        }
      };
      img.src = "assets/talha.jpg";
    })();

    return {
      group: g,
      update(t, p) {
        ring.rotation.z = t * 0.08;
        ring2.rotation.z = -t * 0.05;
        const fade = clamp01(1 - p * 1.6);
        ring.material.opacity = 0.35 * fade;
        ring2.material.opacity = 0.15 * fade;
        dust.rotation.y = t * 0.008;
        if (port.pts) {
          // stays assembled through the whole zoom; dissolves into the flight out
          const assemble = ease(clamp01((t - 0.6) * 0.55));
          const k = assemble * (1 - ease(clamp01((p - 0.56) * 3.2)));
          if (Math.abs(k - port.lastK) > 0.0008) {
            port.lastK = k;
            const { cur, tgt, scat } = port;
            for (let i = 0; i < cur.length; i += 3) {
              cur[i] = tgt[i] * k + scat[i] * (1 - k);
              cur[i + 1] = tgt[i + 1] * k + scat[i + 1] * (1 - k);
              cur[i + 2] = tgt[i + 2] * k + scat[i + 2] * (1 - k);
            }
            port.pts.geometry.attributes.position.needsUpdate = true;
            port.pts.material.opacity = 0.3 + k * 0.6;
            port.lines.material.opacity = Math.max(0, k - 0.72) * 3.6 * 0.55;
          }
          portrait.rotation.y = Math.sin(t * 0.16) * 0.07;
        }
      },
      // start pulled far back, then push in until the face fills the frame
      mod: (p) => ({ dx: 0, dy: 2 + 2 * ease(p), dz: 86 - 116 * ease(p), df: -4 * ease(p) }),
    };
  }

  // ============================================================
  // 1 — PUMPKIN STUDIOS: monumental torus knot in a render viewport
  // ============================================================
  function buildPumpkin() {
    const g = new T.Group();
    const AC = 0xff8a3c;
    const knotGeo = new T.TorusKnotGeometry(15, 4.4, 240, 20);
    const knotCore = solid(knotGeo, 0x120a05);
    const knotWire = new T.Mesh(knotGeo, new T.MeshBasicMaterial({
      color: AC, wireframe: true, transparent: true, opacity: 0.55,
    }));
    knotWire.scale.setScalar(1.002);
    const knot = new T.Group();
    knot.add(knotCore, knotWire);
    knot.position.y = 6;
    g.add(knot);

    const halo = glowSprite(AC, 110, 0.3);
    halo.position.set(0, 6, -30);
    g.add(halo);

    const grid = new T.GridHelper(260, 26, 0x59331a, 0x241509);
    grid.position.y = -26;
    g.add(grid);

    const tets = [];
    for (let i = 0; i < 4; i++) {
      const tg = new T.TetrahedronGeometry(3.2);
      const tm = solid(tg, 0x0d0d10);
      tm.add(edges(tg, 0xf4f1ea, 0.7));
      g.add(tm);
      tets.push(tm);
    }
    const rnd = mulberry32(21);
    const pos = [];
    for (let i = 0; i < 220; i++)
      pos.push((rnd() - 0.5) * 200, (rnd() - 0.5) * 120, (rnd() - 0.5) * 200);
    const embers = pointsCloud(pos, AC, 1.5, 0.6);
    g.add(embers);

    return {
      group: g,
      update(t, p) {
        knot.rotation.y = t * 0.28;
        knot.rotation.x = 0.35 + Math.sin(t * 0.2) * 0.12;
        const s = 0.35 + ease(clamp01(p * 2.2 + 0.15)) * 0.65;
        knot.scale.setScalar(s);
        tets.forEach((tm, i) => {
          const a = t * 0.32 + (i * TAU) / 4;
          tm.position.set(Math.cos(a) * 42, 6 + Math.sin(t * 0.6 + i) * 8, Math.sin(a) * 42);
          tm.rotation.set(t * 0.7 + i, t * 0.5, 0);
        });
        embers.position.y = ((t * 1.4) % 40) - 20;
        grid.position.z = (t * 2) % 10;
      },
      mod: (p, t) => ({ dx: Math.sin(p * Math.PI) * 10, dy: 2 - 6 * p, dz: 22 * (1 - ease(p)) - 8 * p, df: 0 }),
    };
  }

  // ============================================================
  // 2 — SCHOOL: a colonnaded campus that constructs itself
  // ============================================================
  function buildSchool() {
    const g = new T.Group();
    const BLU = 0x8db8ff;
    const FACE = 0x0b1120;
    const parts = []; // { mesh, delay }
    function part(mesh, x, y, z, delay) {
      // anchor scale at the base so parts grow upward out of the ground
      mesh.geometry.computeBoundingBox();
      mesh.geometry.translate(0, -mesh.geometry.boundingBox.min.y, 0);
      mesh.position.set(x, y, z);
      g.add(mesh);
      parts.push({ mesh, delay });
      return mesh;
    }
    // base + steps
    part(edgedBox(96, 3, 34, FACE, BLU, 0.8), 0, -26, 0, 0);
    part(edgedBox(78, 2.4, 30, FACE, BLU, 0.8), 0, -23, 0, 0.06);
    // six columns
    for (let i = 0; i < 6; i++) {
      const geo = new T.CylinderGeometry(1.5, 1.7, 24, 12);
      const m = solid(geo, FACE);
      m.add(edges(geo, BLU, 0.55));
      part(m, -27.5 + i * 11, -20.6, 6, 0.14 + i * 0.07);
    }
    // entablature + pediment
    part(edgedBox(70, 3.4, 26, FACE, BLU, 0.85), 0, 3.4, 2, 0.62);
    const shp = new T.Shape();
    shp.moveTo(-37, 0); shp.lineTo(37, 0); shp.lineTo(0, 12);
    shp.closePath();
    const pedGeo = new T.ExtrudeGeometry(shp, { depth: 26, bevelEnabled: false });
    pedGeo.translate(0, 0, -13);
    const ped = solid(pedGeo, FACE);
    ped.add(edges(pedGeo, BLU, 0.9));
    part(ped, 0, 6.8, 2, 0.72);
    // wings
    part(edgedBox(34, 20, 22, FACE, BLU, 0.7), -60, -24.6, -2, 0.4);
    part(edgedBox(34, 20, 22, FACE, BLU, 0.7), 60, -24.6, -2, 0.48);
    // door
    part(edgedBox(9, 14, 1.2, 0x080d18, BLU, 0.9), 0, -20.6, 18.2, 0.56);
    // flag pole + flag
    part(edgedBox(0.5, 12, 0.5, FACE, BLU, 0.9), 0, 18.8, 2, 0.84);
    const flagGeo = new T.PlaneGeometry(7, 4, 8, 2);
    const flag = new T.Mesh(flagGeo, new T.MeshBasicMaterial({
      color: BLU, side: T.DoubleSide, transparent: true, opacity: 0.85,
    }));
    flag.position.set(3.9, 28.4, 2);
    g.add(flag);

    const moon = glowSprite(0xbcd4ff, 60, 0.5);
    moon.position.set(52, 44, -70);
    g.add(moon);

    // the ISL crest — golden markhor, crowning the school
    const crest = brandPlane(markhorTex, 12, 15, 0);
    crest.position.set(0, 36, 6);
    g.add(crest);
    const crestGlow = glowSprite(0xe8b74f, 24, 0);
    crestGlow.position.set(0, 36, 3);
    g.add(crestGlow);
    const grid = new T.GridHelper(320, 32, 0x1c2c4a, 0x10192c);
    grid.position.y = -27.6;
    g.add(grid);

    const rnd = mulberry32(33);
    const pos = [];
    for (let i = 0; i < 160; i++)
      pos.push((rnd() - 0.5) * 240, -20 + rnd() * 90, (rnd() - 0.5) * 200);
    const dust = pointsCloud(pos, 0x8db8ff, 1.2, 0.35);
    g.add(dust);

    return {
      group: g,
      update(t, p) {
        const build = clamp01(p * 2.6 + 0.12);
        for (const pt of parts) {
          const k = ease(clamp01((build - pt.delay) / 0.28));
          pt.mesh.scale.y = Math.max(0.001, k);
          pt.mesh.visible = k > 0.002;
        }
        // waving flag
        const posA = flag.geometry.attributes.position;
        for (let i = 0; i < posA.count; i++) {
          const x = posA.getX(i);
          posA.setZ(i, Math.sin(x * 1.2 + t * 3) * 0.4 * (x + 3.5) * 0.14);
        }
        posA.needsUpdate = true;
        flag.visible = parts[parts.length - 1].mesh.visible;
        dust.rotation.y = t * 0.01;
        // crest fades in once the building stands, then hovers
        const ca = ease(clamp01((build - 0.9) * 8));
        crest.material.opacity = ca;
        crestGlow.material.opacity = 0.4 * ca * (0.8 + Math.sin(t * 1.6) * 0.2);
        crest.position.y = 36 + Math.sin(t * 0.9) * 1.1;
        crestGlow.position.y = crest.position.y;
        crest.rotation.y = Math.sin(t * 0.4) * 0.14;
      },
      mod: (p) => ({ dx: -8 + 8 * p, dy: -14 + 24 * ease(p), dz: 12 + 26 * (1 - ease(p)), df: 0 }),
    };
  }

  // ============================================================
  // 3 — COMSATS: the iconic campus gate + code galaxy
  // ============================================================
  function buildComsats() {
    const g = new T.Group();
    const AC = 0x5ee6a8;
    const BRICK = 0x7a3b2e;
    const BRICK_DARK = 0x4e231a;
    const rnd = mulberry32(42);

    // --- ground plane ---
    const grid = new T.GridHelper(280, 28, 0x0e2a1e, 0x081810);
    grid.position.y = -30;
    g.add(grid);

    // --- the gateway: bottom-anchored parts that rise out of the lawn,
    //     with a 20-unit portal the dolly exits straight through.
    //     Dark clay faces + warm brick line-work = the submerged look. ---
    const BRICK_LINE = 0xe0784f;
    const CLAY = 0x150a06;
    const parts = [];
    function part(geo, lineCol, lineOp, x, y, z, delay) {
      geo.computeBoundingBox();
      geo.translate(0, -geo.boundingBox.min.y, 0);
      const m = solid(geo, CLAY, 0.97);
      m.add(edges(geo, lineCol, lineOp));
      m.position.set(x, y, z);
      g.add(m);
      parts.push({ m, delay });
      return m;
    }
    // brick coursing drawn on a face — sells the masonry without textures
    function courses(mesh, w2, h2, d2) {
      const pos = [];
      let row = 0;
      for (let yy = 3; yy < h2 - 1; yy += 3.4, row++) {
        pos.push(-w2 / 2 + 0.6, yy, d2 / 2 + 0.06, w2 / 2 - 0.6, yy, d2 / 2 + 0.06);
        const xs = row % 2 ? [-w2 / 4, w2 / 4] : [0];
        for (const xx of xs)
          pos.push(xx, Math.max(0.4, yy - 3.4), d2 / 2 + 0.06, xx, yy, d2 / 2 + 0.06);
      }
      const geo = new T.BufferGeometry();
      geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
      mesh.add(new T.LineSegments(geo, new T.LineBasicMaterial({
        color: BRICK_LINE, transparent: true, opacity: 0.3,
      })));
    }
    // steps up to the portal
    for (let i = 0; i < 4; i++)
      part(new T.BoxGeometry(54 - i * 4, 1.6, 5), BRICK_LINE, 0.4, 0, -30 + i * 1.6, 15 - i * 4, 0.04 * i);
    // twin brick towers, portal spans local -10..+10
    courses(part(new T.BoxGeometry(16, 44, 12), BRICK_LINE, 0.85, -18, -30, 0, 0.16), 16, 44, 12);
    courses(part(new T.BoxGeometry(16, 44, 12), BRICK_LINE, 0.85, 18, -30, 0, 0.24), 16, 44, 12);
    // recessed inner arch frames (the teal-tiled reveals of the real gate)
    part(new T.BoxGeometry(2, 40, 10), AC, 0.6, -9.4, -30, 0.4, 0.36);
    part(new T.BoxGeometry(2, 40, 10), AC, 0.6, 9.4, -30, 0.4, 0.4);
    // lintel + cornice crown
    courses(part(new T.BoxGeometry(52, 7, 13), BRICK_LINE, 0.9, 0, 14, 0, 0.5), 52, 7, 13);
    part(new T.BoxGeometry(58, 3, 15), BRICK_LINE, 0.95, 0, 21, 0, 0.6);
    // flanking garden walls with end posts
    part(new T.BoxGeometry(46, 11, 7), BRICK_LINE, 0.5, -49, -30, -2, 0.3);
    part(new T.BoxGeometry(46, 11, 7), BRICK_LINE, 0.5, 49, -30, -2, 0.34);
    part(new T.BoxGeometry(5, 15, 8), BRICK_LINE, 0.7, -72, -30, -2, 0.44);
    part(new T.BoxGeometry(5, 15, 8), BRICK_LINE, 0.7, 72, -30, -2, 0.46);
    // seal mount stem on the cornice
    part(new T.BoxGeometry(3, 4.5, 3), BRICK_LINE, 0.8, 0, 24, 0, 0.66);

    // --- the real COMSATS seal, sitting on the arch like the actual gate ---
    // painted seal shows instantly; the actual logo photo swaps in when it loads
    const sealMat = new T.MeshBasicMaterial({ map: comsatsTex, transparent: true, opacity: 0 });
    const seal = new T.Mesh(new T.CircleGeometry(6.6, 48), sealMat);
    seal.position.set(0, 31, 1);
    g.add(seal);
    new T.TextureLoader().load("assets/comsats-logo.jpg", (tex) => {
      tex.center.set(0.5, 0.5);
      tex.repeat.set(1.06, 1.06); // crop the white corners of the square jpg
      sealMat.map = tex;
      sealMat.needsUpdate = true;
    });
    const sealGlow = glowSprite(AC, 22, 0);
    sealGlow.position.set(0, 31, -0.5);
    g.add(sealGlow);

    // flower beds along the front — the gate's rose pots
    const flowers = [];
    for (let i = 0; i < 12; i++) {
      const fx = -44 + i * 8;
      if (Math.abs(fx) < 14) continue;
      const sp = glowSprite([0xff8fb1, 0xfff0f0, 0xffd166][i % 3], 2.6, 0);
      sp.position.set(fx, -27.5, 6);
      g.add(sp);
      flowers.push(sp);
    }

    // --- code galaxy (network nodes around the gate) ---
    const nodes = [];
    for (let i = 0; i < 70; i++)
      nodes.push(new T.Vector3((rnd() - 0.5) * 180, (rnd() - 0.5) * 100 + 10, (rnd() - 0.5) * 260));
    const npos = [];
    nodes.forEach(function(v) { npos.push(v.x, v.y, v.z); });
    g.add(pointsCloud(npos, AC, 3.2, 0.7));

    const epos = [];
    const edgePairs = [];
    for (let i = 0; i < nodes.length; i++)
      for (let j = i + 1; j < nodes.length; j++) {
        if (nodes[i].distanceTo(nodes[j]) < 42 && edgePairs.length < 160) {
          edgePairs.push([nodes[i], nodes[j]]);
          epos.push(nodes[i].x, nodes[i].y, nodes[i].z, nodes[j].x, nodes[j].y, nodes[j].z);
        }
      }
    var cLines = new T.LineSegments(
      new T.BufferGeometry().setAttribute("position", new T.Float32BufferAttribute(epos, 3)),
      new T.LineBasicMaterial({ color: AC, transparent: true, opacity: 0.12 })
    );
    g.add(cLines);

    // data pulses along edges
    const pulses = [];
    for (let i = 0; i < 18; i++) {
      const sp = glowSprite(AC, 2.8, 0.85);
      g.add(sp);
      pulses.push({ sp: sp, e: Math.floor(rnd() * edgePairs.length), off: rnd(), spd: 0.1 + rnd() * 0.18 });
    }

    // rising data streams from the gate
    const streams = [];
    for (let i = 0; i < 14; i++) {
      const sp = glowSprite(AC, 2, 0.7);
      g.add(sp);
      streams.push({ sp: sp, x: (rnd() - 0.5) * 30, z: (rnd() - 0.5) * 8, off: rnd(), spd: 0.08 + rnd() * 0.1 });
    }

    // atmospheric haze
    const haze = glowSprite(0x1a3d2e, 120, 0.2);
    haze.position.set(0, 5, -50);
    g.add(haze);

    return {
      group: g,
      update(t, p) {
        // the gateway rises out of the lawn as you arrive
        const build = clamp01(p * 2.4 + 0.1);
        for (const pt of parts) {
          const k = ease(clamp01((build - pt.delay) / 0.3));
          pt.m.scale.y = Math.max(0.001, k);
          pt.m.visible = k > 0.002;
        }
        const on = ease(clamp01((build - 0.72) * 4));
        sealMat.opacity = on * 0.98;
        sealGlow.material.opacity = on * (0.22 + Math.sin(t * 1.5) * 0.08);
        seal.rotation.y = Math.sin(t * 0.3) * 0.1;
        for (const f of flowers)
          f.material.opacity = on * (0.5 + Math.sin(t * 1.2 + f.position.x) * 0.2);
        for (var pi = 0; pi < pulses.length; pi++) {
          var pl = pulses[pi];
          if (pl.e >= edgePairs.length) continue;
          var pair = edgePairs[pl.e];
          var q = (t * pl.spd + pl.off) % 1;
          pl.sp.position.lerpVectors(pair[0], pair[1], q);
          pl.sp.material.opacity = Math.sin(q * Math.PI) * 0.85;
        }
        for (var si = 0; si < streams.length; si++) {
          var st = streams[si];
          var sq = (t * st.spd + st.off) % 1;
          st.sp.position.set(st.x, 24 + sq * 48, st.z);
          st.sp.material.opacity = Math.sin(sq * Math.PI) * 0.7;
        }
      },
      // wide aerial reveal (seal in frame) → settle level with the portal;
      // the travel blend then carries the dolly straight through the arch
      mod: (p) => ({
        dx: -4 * ease(p),
        dy: 22 - 12 * ease(p),
        dz: 46 - 48 * ease(p),
        df: -4 * ease(p),
      }),
    };
  }

  // ============================================================
  // 4 — U.N.I: floating product, a crowd of students, the climb to 8,000
  // ============================================================
  function buildUni() {
    const g = new T.Group();
    const AC = 0xb49bff;
    const rnd = mulberry32(99);

    function screen(w2, h2) {
      const grp = new T.Group();
      const geo = new T.PlaneGeometry(w2, h2);
      const face = new T.Mesh(geo, new T.MeshBasicMaterial({
        color: 0x0d0a18, transparent: true, opacity: 0.92, side: T.DoubleSide,
      }));
      grp.add(face);
      grp.add(edges(new T.BoxGeometry(w2, h2, 0.4), AC, 0.8));
      // ui bars
      for (let i = 0; i < 4; i++) {
        const bar = solid(new T.PlaneGeometry(w2 * (0.62 - i * 0.1), 0.7), 0xf4f1ea, 0.28);
        bar.position.set(-w2 * 0.12 + i * 0.4, h2 * 0.26 - i * 2.1, 0.3);
        grp.add(bar);
      }
      const av = glowSprite(AC, 3.4, 0.9);
      av.position.set(-w2 * 0.32, h2 * 0.33, 0.4);
      grp.add(av);
      const btn = solid(new T.PlaneGeometry(w2 * 0.5, 1.8), AC, 0.5);
      btn.position.set(0, -h2 * 0.32, 0.3);
      grp.add(btn);
      return grp;
    }
    const s1 = screen(16, 30); s1.position.set(-16, 6, 0); s1.rotation.y = 0.3;
    const s2 = screen(19, 34); s2.position.set(6, 3, -8); s2.rotation.y = -0.12;
    const s3 = screen(13, 24); s3.position.set(26, 12, -22); s3.rotation.y = -0.35;
    g.add(s1, s2, s3);

    // the crowd — every dot a student
    const cpos = [];
    for (let i = 0; i < 700; i++) {
      const r = 20 + rnd() * 130, a = rnd() * TAU;
      cpos.push(Math.cos(a) * r, -24 + rnd() * 3, Math.sin(a) * r * 0.7);
    }
    const crowd = pointsCloud(cpos, 0xf4f1ea, 1.5, 0.55);
    g.add(crowd);

    // 3D growth curve → 8,000+
    const N = 60;
    const curvePts = [];
    for (let i = 0; i < N; i++) {
      const q = i / (N - 1);
      curvePts.push(new T.Vector3(-52 + q * 100, -22 + Math.pow(q, 2.4) * 46 + Math.sin(q * 30) * 0.7, 10 - q * 18));
    }
    const curveGeo = new T.BufferGeometry().setFromPoints(curvePts);
    curveGeo.setDrawRange(0, 2);
    const curve = new T.Line(curveGeo, new T.LineBasicMaterial({ color: AC, transparent: true, opacity: 0.95 }));
    g.add(curve);
    const head = glowSprite(AC, 7, 1);
    g.add(head);
    const label = textSprite("8,000+ ACTIVE USERS", "#d8ccff", 4.4);
    label.material.opacity = 0;
    g.add(label);
    const q1 = textSprite("WHAT'S MISSING ON CAMPUS?", "#f4f1ea", 3.2);
    q1.position.set(-26, 26, -6);
    g.add(q1);

    // the U.n.I koala, sketched in its own teal
    const koala = brandPlane(koalaTex, 13, 13, 0.95);
    koala.position.set(40, 20, -12);
    g.add(koala);
    const koalaGlow = glowSprite(0x17c3b2, 24, 0.3);
    koalaGlow.position.set(40, 20, -13);
    g.add(koalaGlow);

    return {
      group: g,
      update(t, p) {
        s1.position.y = 6 + Math.sin(t * 0.8) * 1.6;
        s2.position.y = 3 + Math.sin(t * 0.7 + 2) * 1.8;
        s3.position.y = 12 + Math.sin(t * 0.9 + 4) * 1.4;
        q1.position.y = 26 + Math.sin(t * 0.6) * 1;
        koala.position.y = 20 + Math.sin(t * 0.65 + 1) * 1.6;
        koala.rotation.y = Math.sin(t * 0.35) * 0.18;
        koalaGlow.position.y = koala.position.y;
        crowd.rotation.y = t * 0.02;
        const rev = ease(clamp01(p * 1.9 + 0.05));
        const n = Math.max(2, Math.floor(N * rev));
        curveGeo.setDrawRange(0, n);
        const hp = curvePts[n - 1];
        head.position.copy(hp);
        head.material.opacity = 0.5 + Math.sin(t * 4) * 0.3;
        label.position.set(hp.x - 6, hp.y + 6, hp.z);
        label.material.opacity = clamp01((rev - 0.75) * 6);
      },
      mod: (p, t) => ({ dx: Math.sin(t * 0.24) * 3 - 6 * p, dy: 2, dz: 18 * (1 - ease(p)), df: 0 }),
    };
  }

  // ============================================================
  // 5 — SYSTEMS LIMITED: a corporate district you dive into
  // ============================================================
  function buildSystems() {
    const g = new T.Group();
    const AC = 0x6ab0ff;
    const rnd = mulberry32(77);
    const texA = windowTex(1, 0.34), texB = windowTex(2, 0.22), texC = windowTex(3, 0.45);
    const texes = [texA, texB, texC];

    // skyline
    for (let i = 0; i < 26; i++) {
      const bw = 8 + rnd() * 8;
      const bh = 12 + rnd() * 34;
      const bd = 8 + rnd() * 8;
      const geo = new T.BoxGeometry(bw, bh, bd);
      const mat = new T.MeshBasicMaterial({ map: texes[i % 3] });
      const b = new T.Mesh(geo, mat);
      b.add(edges(geo, 0x28405e, 0.5));
      let bx = (rnd() - 0.5) * 190;
      let bz = (rnd() - 0.5) * 190;
      if (Math.abs(bx) < 22 && Math.abs(bz) < 22) bx += 48; // keep the plaza clear
      b.position.set(bx, -30 + bh / 2, bz);
      g.add(b);
    }
    // the HQ tower
    const hqGeo = new T.BoxGeometry(17, 66, 17);
    const hq = new T.Mesh(hqGeo, new T.MeshBasicMaterial({ map: texC }));
    hq.add(edges(hqGeo, AC, 0.9));
    hq.position.set(0, -30 + 33, 0);
    g.add(hq);
    // the wordmark, mounted like rooftop signage
    const sign = brandPlane(systemsTex, 15, 5, 0.98);
    sign.position.set(0, 40.5, 0);
    g.add(sign);
    const signBack = glowSprite(0x24344e, 24, 0.5);
    signBack.position.set(0, 40.5, -1);
    g.add(signBack);
    const beacon = glowSprite(AC, 8, 0.9);
    beacon.position.set(0, 35, 0);
    g.add(beacon);

    // data rising off the tower
    const streams = [];
    for (let i = 0; i < 26; i++) {
      const sp = glowSprite(AC, 2.4, 0.8);
      g.add(sp);
      streams.push({ sp, a: rnd() * TAU, r: 11 + rnd() * 5, off: rnd(), spd: 0.1 + rnd() * 0.12 });
    }
    const grid = new T.GridHelper(340, 34, 0x16283f, 0x0d1826);
    grid.position.y = -30;
    g.add(grid);
    const haze = glowSprite(0x2a4a75, 150, 0.22);
    haze.position.set(0, 10, -60);
    g.add(haze);

    return {
      group: g,
      update(t, p) {
        beacon.material.opacity = 0.5 + Math.sin(t * 2.4) * 0.4;
        for (const st of streams) {
          const q = (t * st.spd + st.off) % 1;
          st.sp.position.set(Math.cos(st.a + q * 3) * st.r, -28 + q * 72, Math.sin(st.a + q * 3) * st.r);
          st.sp.material.opacity = Math.sin(q * Math.PI) * 0.8;
        }
      },
      // the requested shot: start wide over the district, dive toward the tower
      mod: (p) => ({
        dx: -10 * ease(p),
        dy: 26 - 44 * ease(p),
        dz: 46 - 74 * ease(p),
        df: -6 * ease(p),
      }),
    };
  }

  // ============================================================
  // 6 — CIRKLES: eight white circles — and you fly through the ring
  // ============================================================
  function buildCirkles() {
    const g = new T.Group();
    const ringGrp = new T.Group();
    const circles = [];
    const R = 24;
    for (let i = 0; i < 8; i++) {
      const a = (i * TAU) / 8;
      const c = new T.Mesh(
        new T.TorusGeometry(6.2, 0.22, 10, 64),
        new T.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.95 })
      );
      c.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      ringGrp.add(c);
      circles.push(c);
      const gl = glowSprite(0xffffff, 9, 0.28);
      gl.position.copy(c.position);
      ringGrp.add(gl);
    }
    g.add(ringGrp);

    // the product itself — a screen of the live site, angled to the viewer
    const MOB = window.innerWidth <= 820;
    const panelBaseY = MOB ? 8 : 3;
    const panel = brandPlane(cirklesSiteTex, 30, 18.75, 0);
    panel.add(new T.LineSegments(
      new T.EdgesGeometry(new T.PlaneGeometry(30, 18.75)),
      new T.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.35 })
    ));
    panel.position.set(MOB ? 13 : 27, panelBaseY, 8);
    panel.rotation.y = -0.5;
    if (MOB) panel.scale.setScalar(0.62);
    g.add(panel);
    const panelGlow = glowSprite(0x6b46c1, 34, 0.25);
    panelGlow.position.set(panel.position.x, panel.position.y, 4);
    g.add(panelGlow);

    const rnd = mulberry32(8);
    // city of events far below
    const pos = [];
    for (let i = 0; i < 500; i++)
      pos.push((rnd() - 0.5) * 320, -46 + rnd() * 6, (rnd() - 0.5) * 320);
    g.add(pointsCloud(pos, 0x8fa0c0, 1.6, 0.5));
    // event beacons shooting up
    const pins = [];
    for (let i = 0; i < 10; i++) {
      const sp = glowSprite(0xffffff, 4, 0.8);
      g.add(sp);
      pins.push({ sp, x: (rnd() - 0.5) * 220, z: (rnd() - 0.5) * 220, off: rnd() });
    }

    return {
      group: g,
      update(t, p) {
        ringGrp.rotation.z = t * 0.12;
        const beat = t / 2.0;
        const act = Math.floor(beat) % 8;
        const age = beat % 1;
        circles.forEach((c, i) => {
          const k = i === act ? 1 + Math.sin(age * Math.PI) * 0.22 : 1;
          c.scale.setScalar(k);
        });
        for (const pin of pins) {
          const q = (t * 0.16 + pin.off) % 1;
          pin.sp.position.set(pin.x, -44 + q * 60, pin.z);
          pin.sp.material.opacity = Math.sin(q * Math.PI) * 0.7;
        }
        // the site panel drifts in from the right as the chapter opens
        const pa = ease(clamp01(p * 2.4));
        panel.material.opacity = pa * 0.96;
        panel.children[0].material.opacity = pa * 0.35;
        panelGlow.material.opacity = pa * 0.25;
        panel.position.y = panelBaseY + Math.sin(t * 0.55) * 1.2;
        panel.rotation.y = -0.5 + Math.sin(t * 0.3) * 0.06;
        panel.rotation.x = Math.sin(t * 0.42) * 0.04;
      },
      // hold centred on the logo; the dolly then threads the ring
      mod: (p) => ({ dx: 0, dy: 0, dz: 8 + 26 * (1 - ease(p)), df: 3 * Math.sin(p * Math.PI) }),
    };
  }

  // ============================================================
  // 7 — AI & ANALYTICS: a point-cloud dataset being classified
  // ============================================================
  function buildSysds() {
    const g = new T.Group();
    const AC = 0x3fd9c0;
    const rnd = mulberry32(2025);
    const posA = [], posB = [];
    for (let i = 0; i < 420; i++) {
      const x = (rnd() - 0.5) * 100, z = (rnd() - 0.5) * 70;
      const split = Math.sin(x * 0.09) * 10;
      const y = split + (rnd() - 0.5) * 44;
      (y > split ? posA : posB).push(x, y, z);
    }
    const cloudA = pointsCloud(posA, AC, 2.6, 0.85);
    const cloudB = pointsCloud(posB, 0xf4f1ea, 2.2, 0.5);
    g.add(cloudA, cloudB);

    const planeGeo = new T.PlaneGeometry(120, 80, 24, 1);
    const plane = new T.Mesh(planeGeo, new T.MeshBasicMaterial({
      color: AC, transparent: true, opacity: 0.1, side: T.DoubleSide, depthWrite: false,
    }));
    plane.rotation.x = -Math.PI / 2;
    plane.add(new T.LineSegments(
      new T.EdgesGeometry(planeGeo),
      new T.LineBasicMaterial({ color: AC, transparent: true, opacity: 0.5 })
    ));
    g.add(plane);

    const axes = new T.GridHelper(150, 15, 0x14332e, 0x0c1f1c);
    axes.position.y = -34;
    g.add(axes);
    const auc = textSprite("ROC-AUC 0.91", "#9ff0e2", 3.4);
    auc.position.set(38, 32, 0);
    auc.material.opacity = 0;
    g.add(auc);
    // back at Systems — the wordmark hangs quiet in the lab
    const mark = brandPlane(systemsTex, 12, 4, 0.5);
    mark.position.set(34, 30, -14);
    mark.rotation.y = -0.2;
    g.add(mark);

    return {
      group: g,
      update(t, p) {
        const fit = ease(clamp01(p * 1.7));
        const wob = (1 - fit) * 0.5 + 0.03;
        plane.rotation.x = -Math.PI / 2 + Math.sin(t * 0.9) * wob;
        plane.rotation.y = Math.sin(t * 0.6) * wob * 0.8;
        // the boundary surface ripples along the true split
        const pp = plane.geometry.attributes.position;
        for (let i = 0; i < pp.count; i++) {
          const x = pp.getX(i);
          pp.setZ(i, Math.sin(x * 0.09) * 10 * fit + Math.sin(x * 0.2 + t * 1.4) * 1.6 * wob * 8);
        }
        pp.needsUpdate = true;
        cloudA.rotation.y = Math.sin(t * 0.08) * 0.1;
        cloudB.rotation.y = Math.sin(t * 0.08) * 0.1;
        auc.material.opacity = clamp01((fit - 0.6) * 4);
      },
      mod: (p, t) => ({ dx: Math.sin(t * 0.2) * 5, dy: 14 - 10 * p, dz: 20 * (1 - ease(p)), df: 0 }),
    };
  }

  // ============================================================
  // 8 — RESEARCH: the shield — injections burst, verified calls pass
  // ============================================================
  function buildResearch() {
    const g = new T.Group();
    const RED = 0xff5c7a, GRN = 0x34d399;

    const shellGeo = new T.IcosahedronGeometry(19, 1);
    const shell = new T.LineSegments(
      new T.EdgesGeometry(shellGeo),
      new T.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.5 })
    );
    g.add(shell);
    const innerGeo = new T.IcosahedronGeometry(11, 0);
    const inner = new T.LineSegments(
      new T.EdgesGeometry(innerGeo),
      new T.LineBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.55 })
    );
    g.add(inner);
    const core = glowSprite(GRN, 16, 0.9);
    g.add(core);
    const verLabel = textSprite("VERIFIER-LLM — METADATA ONLY", "#ffd0da", 2.8);
    verLabel.position.set(0, -28, 6);
    g.add(verLabel);

    // attackers: red comets with tails
    const rnd = mulberry32(1337);
    const attacks = [];
    for (let i = 0; i < 7; i++) {
      const dir = new T.Vector3(rnd() - 0.5, rnd() - 0.5, rnd() - 0.3).normalize();
      const head = glowSprite(RED, 5, 1);
      const tailGeo = new T.BufferGeometry().setFromPoints([new T.Vector3(), new T.Vector3()]);
      const tail = new T.Line(tailGeo, new T.LineBasicMaterial({ color: RED, transparent: true, opacity: 0.8 }));
      const burst = new T.Mesh(
        new T.TorusGeometry(1, 0.16, 6, 40),
        new T.MeshBasicMaterial({ color: RED, transparent: true, opacity: 0 })
      );
      g.add(head, tail, burst);
      attacks.push({ head, tail, burst, dir, off: rnd(), spd: 0.24 + rnd() * 0.16 });
    }
    // verified green packets passing through on the tool lane
    const passes = [];
    for (let i = 0; i < 4; i++) {
      const sp = glowSprite(GRN, 3.4, 0.9);
      g.add(sp);
      passes.push({ sp, off: i / 4, y: -6 + i * 4 });
    }
    // hash-chain orbit
    const chain = new T.Group();
    for (let i = 0; i < 14; i++) {
      const a = (i * TAU) / 14;
      const bx = edgedBox(2.2, 2.2, 2.2, 0x0d0d12, 0xf4f1ea, 0.6);
      bx.position.set(Math.cos(a) * 30, Math.sin(a) * 4, Math.sin(a) * 30);
      chain.add(bx);
    }
    const chainRing = new T.Mesh(
      new T.TorusGeometry(30, 0.05, 6, 80),
      new T.MeshBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.25 })
    );
    chainRing.rotation.x = Math.PI / 2 - 0.13;
    chain.add(chainRing);
    g.add(chain);

    const rs = mulberry32(9);
    const pos = [];
    for (let i = 0; i < 260; i++)
      pos.push((rnd() - 0.5) * 260, (rs() - 0.5) * 160, (rs() - 0.5) * 260);
    g.add(pointsCloud(pos, 0xff5c7a, 1.2, 0.25));

    return {
      group: g,
      update(t, p) {
        shell.rotation.y = t * 0.2;
        shell.rotation.x = Math.sin(t * 0.3) * 0.2;
        inner.rotation.y = -t * 0.34;
        core.material.opacity = 0.65 + Math.sin(t * 3) * 0.25;
        chain.rotation.y = t * 0.12;

        for (const atk of attacks) {
          const q = (t * atk.spd + atk.off) % 1;
          const from = atk.dir.clone().multiplyScalar(130);
          if (q < 0.7) {
            const q2 = ease(q / 0.7);
            const posn = from.clone().lerp(atk.dir.clone().multiplyScalar(20), q2);
            atk.head.position.copy(posn);
            atk.head.material.opacity = 1;
            const tp = atk.tail.geometry.attributes.position;
            const back = posn.clone().add(atk.dir.clone().multiplyScalar(9));
            tp.setXYZ(0, back.x, back.y, back.z);
            tp.setXYZ(1, posn.x, posn.y, posn.z);
            tp.needsUpdate = true;
            atk.tail.material.opacity = 0.8;
            atk.burst.material.opacity = 0;
          } else {
            const bq = (q - 0.7) / 0.3;
            atk.head.material.opacity = 0;
            atk.tail.material.opacity = 0;
            atk.burst.position.copy(atk.dir.clone().multiplyScalar(20));
            atk.burst.lookAt(0, 0, 0);
            atk.burst.scale.setScalar(1 + bq * 9);
            atk.burst.material.opacity = (1 - bq) * 0.9;
          }
        }
        for (const ps of passes) {
          const q = (t * 0.16 + ps.off) % 1;
          ps.sp.position.set(-90 + q * 180, ps.y * Math.sin(q * Math.PI), Math.sin(q * TAU) * 4);
          ps.sp.material.opacity = Math.sin(q * Math.PI);
        }
      },
      mod: (p, t) => ({ dx: Math.sin(t * 0.3) * 4, dy: 0, dz: 24 * (1 - ease(p)), df: 2 * Math.sin(p * Math.PI) }),
    };
  }

  // ============================================================
  // 9 — CREDITS: star warp settling to stillness
  // ============================================================
  function buildFinale() {
    const g = new T.Group();
    const AC = 0xe8c46b;
    const rnd = mulberry32(5);
    const pos = [];
    for (let i = 0; i < 1200; i++)
      pos.push((rnd() - 0.5) * 500, (rnd() - 0.5) * 300, (rnd() - 0.5) * 600);
    const stars = pointsCloud(pos, 0xfff6e0, 1.7, 0.8);
    g.add(stars);
    const gold = [];
    const cpts = [];
    for (let i = 0; i < 9; i++) {
      const a = Math.PI * (1.12 - (i / 8) * 1.24);
      const v = new T.Vector3(Math.cos(a) * 56, 22 + Math.sin(i * 2.1) * 8, -20);
      cpts.push(v);
      const s = glowSprite(AC, 5, 0.9);
      s.position.copy(v);
      g.add(s);
      gold.push(s);
    }
    const constGeo = new T.BufferGeometry().setFromPoints(cpts);
    g.add(new T.Line(constGeo, new T.LineBasicMaterial({ color: AC, transparent: true, opacity: 0.3 })));

    return {
      group: g,
      update(t, p) {
        stars.rotation.z = t * 0.008;
        stars.position.z = 40 * ease(clamp01(p * 1.4));
        const lit = Math.floor((t * 0.8) % 10);
        gold.forEach((s, i) => {
          s.material.opacity = i < lit ? 0.95 : 0.3;
          s.scale.setScalar(i < lit ? 6.5 : 4);
        });
      },
      mod: (p) => ({ dx: 0, dy: 0, dz: -8 * p, df: 0 }),
    };
  }

  window.WORLD_BUILDERS = [
    buildHero, buildPumpkin, buildSchool, buildComsats, buildUni,
    buildSystems, buildCirkles, buildSysds, buildResearch, buildFinale,
  ];
})();
