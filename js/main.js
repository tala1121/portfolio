/* ————————————————————————————————
   MAIN — the director.
   One WebGL dolly shot through ten 3D sets:
   the camera holds at each chapter while you read,
   then flies to the next destination as you scroll.
   Also owns HUD, grain, letterbox, reveals, dots.
   ———————————————————————————————— */
(function () {
  "use strict";

  const T = window.THREE;
  const REDUCED = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const clamp01 = (v) => Math.max(0, Math.min(1, v));
  const lerp = (a, b, k) => a + (b - a) * k;
  const smooth = (k) => k * k * (3 - 2 * k);

  const D = 420;               // distance between chapter stations
  const CAM_BACK = 62;         // camera rest distance from a station
  const HOLD = 0.52;           // fraction of a chapter spent holding on the set

  const canvas = document.getElementById("scene");
  const grainCanvas = document.getElementById("grain");
  const grainCtx = grainCanvas.getContext("2d");
  const hudYear = document.getElementById("hud-year");
  const hudChapter = document.getElementById("hud-chapter");
  const hudProg = document.getElementById("hud-prog");
  const progressFill = document.getElementById("progress-fill");
  const dotsNav = document.getElementById("dots");
  const slate = document.getElementById("slate");

  const sections = Array.from(document.querySelectorAll("[data-scene]")).map((el) => ({
    el,
    label: el.dataset.label || "",
    year: parseInt(el.dataset.year, 10) || 2019,
    accent: el.dataset.accent || "#f4f1ea",
    num: el.querySelector(".num"),
    top: 0,
    height: 1,
  }));

  // ——— opening slate ———
  const slateDelay = REDUCED ? 100 : 2300;
  setTimeout(() => slate.classList.add("done"), slateDelay);
  setTimeout(() => slate.remove(), slateDelay + 1000);

  // ——— three.js stage ———
  let renderer;
  try {
    renderer = new T.WebGLRenderer({ canvas, antialias: true, powerPreference: "high-performance" });
  } catch (err) {
    document.body.classList.add("no3d");
    return;
  }
  renderer.setClearColor(0x07070a, 1);
  const scene = new T.Scene();
  scene.fog = new T.FogExp2(0x07070a, 0.0026);
  const camera = new T.PerspectiveCamera(55, 1, 0.1, 1600);

  // art sits right of the copy on wide screens, centred on small ones
  // (ch3 sits near centre so the travel shot can thread the gateway's portal)
  const SIDE_DESKTOP = [0, 18, 14, 4, 16, 12, 6, 16, 14, 0];
  let sides = SIDE_DESKTOP.slice();

  const chapters = window.WORLD_BUILDERS.map((build, i) => {
    const ch = build();
    ch.group.position.set(sides[i], 0, -i * D);
    scene.add(ch.group);
    return ch;
  });

  // ambient dust along the whole dolly track — pure B-roll depth
  (function addTrackDust() {
    const pos = [];
    for (let i = 0; i < 1500; i++)
      pos.push(
        (Math.random() - 0.5) * 340,
        (Math.random() - 0.5) * 200,
        150 - Math.random() * (9 * D + 400)
      );
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    scene.add(new T.Points(geo, new T.PointsMaterial({
      color: 0xf4f1ea, size: 1.1, transparent: true, opacity: 0.34, depthWrite: false,
    })));
  })();

  // wireframe debris drifting between the stations — the flights pass through it
  const shards = new T.Group();
  (function addShards() {
    const geos = [
      new T.OctahedronGeometry(1.7, 0),
      new T.TetrahedronGeometry(2.0, 0),
      new T.BoxGeometry(1.7, 1.7, 1.7),
      new T.TorusGeometry(1.6, 0.14, 6, 24),
    ];
    const mat = new T.LineBasicMaterial({ color: 0xf4f1ea, transparent: true, opacity: 0.3 });
    for (let i = 0; i < 130; i++) {
      const seg = Math.floor(Math.random() * 9);
      const off = 0.2 + Math.random() * 0.6; // keep clear of the sets themselves
      const m = new T.LineSegments(new T.EdgesGeometry(geos[i % 4]), mat);
      const side = Math.random() < 0.5 ? -1 : 1;
      m.position.set(
        side * (26 + Math.random() * 150),
        (Math.random() - 0.5) * 170,
        -(seg + off) * D
      );
      const sc = 0.7 + Math.random() * 2.2;
      m.scale.setScalar(sc);
      m.userData.rs = (Math.random() - 0.5) * 0.9;
      m.userData.bob = Math.random() * Math.PI * 2;
      m.userData.by = m.position.y;
      shards.add(m);
    }
    scene.add(shards);
  })();

  // warp streaks — a handful of speed lines that ignite mid-flight,
  // kept off the frame centre so they read as accent, not hyperspace
  let streaks;
  (function addStreaks() {
    const pos = [];
    for (let i = 0; i < 44; i++) {
      const a = Math.random() * Math.PI * 2;
      const r = 34 + Math.random() * 105;
      const x = Math.cos(a) * r, y2 = Math.sin(a) * r * 0.62;
      pos.push(x, y2, -7, x, y2, 7);
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute("position", new T.Float32BufferAttribute(pos, 3));
    streaks = new T.LineSegments(geo, new T.LineBasicMaterial({
      color: 0xf4f1ea, transparent: true, opacity: 0, depthWrite: false,
    }));
    streaks.visible = false;
    scene.add(streaks);
  })();

  // ——— sizing ———
  let W = 0, H = 0, docH = 1, isMobile = false;

  let aspectComp = 0; // extra dolly distance on narrow screens so sets fit the frame

  function measure() {
    W = window.innerWidth;
    H = window.innerHeight;
    isMobile = W <= 820;
    aspectComp = Math.max(0, 1 - W / H) * 58;
    renderer.setPixelRatio(Math.min(isMobile ? 1.4 : 1.75, window.devicePixelRatio || 1));
    renderer.setSize(W, H);
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    grainCanvas.width = Math.max(2, Math.floor(W / 2));
    grainCanvas.height = Math.max(2, Math.floor(H / 2));
    sides = SIDE_DESKTOP.map((s) => (isMobile ? 0 : s));
    chapters.forEach((ch, i) => {
      ch.group.position.setX(sides[i]);
      // on phones the copy sits high, so the sets drop into the lower half
      ch.group.position.setY(isMobile && i > 0 ? -9 : 0);
    });
    for (const s of sections) {
      const r = s.el.getBoundingClientRect();
      s.top = r.top + window.scrollY;
      s.height = r.height;
    }
    docH = document.documentElement.scrollHeight;
  }
  measure();
  // mobile URL bars collapse/expand on scroll, firing resize with small height
  // deltas — re-measuring then makes the page jump. Only re-measure for real changes.
  let lastW = W, lastH = H;
  window.addEventListener("resize", () => {
    if (window.innerWidth === lastW && Math.abs(window.innerHeight - lastH) < 140) return;
    lastW = window.innerWidth;
    lastH = window.innerHeight;
    measure();
  });

  // deep-link straight to a chapter: index.html?ch=6
  const params = new URLSearchParams(location.search);
  const chParam = params.get("ch");
  if (chParam !== null && sections[+chParam]) {
    const sTo = sections[+chParam];
    window.scrollTo(0, sTo.top + (sTo.height - H) * (+(params.get("at") || 0.25)));
  }
  const STILL = params.has("still"); // deterministic frame for previews/tests

  // ——— film grain ———
  const tile = document.createElement("canvas");
  tile.width = tile.height = 128;
  const tileCtx = tile.getContext("2d");
  function refreshGrain() {
    const img = tileCtx.createImageData(128, 128);
    const d = img.data;
    for (let i = 0; i < d.length; i += 4) {
      const v = (Math.random() * 255) | 0;
      d[i] = d[i + 1] = d[i + 2] = v;
      d[i + 3] = 255;
    }
    tileCtx.putImageData(img, 0, 0);
    grainCtx.fillStyle = grainCtx.createPattern(tile, "repeat");
    grainCtx.fillRect(0, 0, grainCanvas.width, grainCanvas.height);
  }

  // ——— reveals ———
  if (STILL) {
    document.body.classList.add("still");
    document.querySelectorAll(".pin").forEach((p) => p.classList.add("in"));
    if (slate.parentNode) slate.remove();
  } else {
    const io = new IntersectionObserver(
      (entries) => entries.forEach((e) => e.target.classList.toggle("in", e.isIntersecting)),
      { threshold: 0.2 }
    );
    document.querySelectorAll(".pin").forEach((p) => io.observe(p));
  }

  // ——— chapter dots ———
  const dots = sections.map((s) => {
    const a = document.createElement("a");
    a.href = "#";
    a.dataset.tip = s.label;
    a.setAttribute("aria-label", s.label);
    a.addEventListener("click", (ev) => {
      ev.preventDefault();
      window.scrollTo({ top: s.top + H * 0.2, behavior: REDUCED ? "auto" : "smooth" });
    });
    dotsNav.appendChild(a);
    return a;
  });

  // ——— mouse parallax ———
  let mx = 0, my = 0, mxS = 0, myS = 0;
  window.addEventListener("pointermove", (e) => {
    if (e.pointerType && e.pointerType !== "mouse") return;
    mx = (e.clientX / W) * 2 - 1;
    my = (e.clientY / H) * 2 - 1;
  });

  // ——— the loop ———
  let smoothY = window.scrollY;
  let activeIdx = -1;
  let frame = 0;
  const t0 = performance.now();
  const LAST = sections.length - 1;

  function tick(now) {
    const t = REDUCED ? 0 : (now - t0) / 1000;
    const y = window.scrollY;
    smoothY = Math.abs(y - smoothY) < 0.1 ? y : lerp(smoothY, y, 0.1);
    document.body.classList.toggle("rolling", y > H * 0.4);

    // which chapter are we in, and how far through it?
    let idx = 0;
    for (let i = 0; i < sections.length; i++) {
      if (smoothY >= sections[i].top - 1) idx = i;
    }
    const s = sections[idx];
    const denom = Math.max(1, s.height - H);
    const p = clamp01((smoothY - s.top) / denom);

    // hold on the set, then travel to the next station
    const holdP = clamp01(p / HOLD);
    const travel = idx >= LAST ? 0 : smooth(clamp01((p - HOLD) / (1 - HOLD)));
    const u = idx + travel;

    // camera choreography: this chapter's move, blended into the next
    const modA = chapters[idx].mod(REDUCED ? 1 : holdP, t);
    const modB = chapters[Math.min(idx + 1, LAST)].mod(0, t);
    const k = travel;
    const dx = lerp(modA.dx, modB.dx, k);
    const dy = lerp(modA.dy, modB.dy, k);
    const dz = lerp(modA.dz, modB.dz, k);
    const df = lerp(modA.df, modB.df, k);

    mxS = lerp(mxS, mx, 0.04);
    myS = lerp(myS, my, 0.04);

    camera.position.set(
      dx + mxS * 2.6,
      dy - myS * 1.8,
      -u * D + CAM_BACK + dz + aspectComp
    );
    const kick = Math.sin(travel * Math.PI);
    const lookX = lerp(sides[idx], sides[Math.min(idx + 1, LAST)], k) * 0.45;
    camera.lookAt(lookX + dx * 0.4 + mxS * 4, dy * 0.5 - myS * 2.5, camera.position.z - 150);
    camera.rotateZ(Math.sin(u * 2.1) * 0.012 + kick * 0.034);
    camera.fov = 55 + df + kick * 10;
    camera.updateProjectionMatrix();

    // hero choreography: --hp drains the name to an outline as we zoom into the face
    const hp = idx === 0 ? smooth(clamp01((p - 0.04) / 0.5)) : 1;
    document.documentElement.style.setProperty("--hp", hp.toFixed(3));

    // debris slowly tumbling; speed lines flare mid-flight
    for (const m of shards.children) {
      if (Math.abs(m.position.z - camera.position.z) > 700) continue;
      m.rotation.x = t * m.userData.rs;
      m.rotation.y = t * m.userData.rs * 1.4;
      m.position.y = m.userData.by + Math.sin(t * 0.4 + m.userData.bob) * 4;
    }
    streaks.visible = kick > 0.03 && !REDUCED;
    if (streaks.visible) {
      streaks.position.set(camera.position.x, camera.position.y, camera.position.z - 70);
      streaks.scale.z = 1 + kick * 4.5;
      streaks.material.opacity = kick * 0.2;
    }

    // run only the sets near the camera
    for (let i = 0; i < chapters.length; i++) {
      const near = Math.abs(i - u) < 1.6;
      chapters[i].group.visible = near;
      if (near) {
        const si = sections[i];
        const pi = clamp01((smoothY - si.top) / Math.max(1, si.height - H));
        chapters[i].update(t, REDUCED ? 1 : pi);
      }
    }

    renderer.render(scene, camera);

    // HUD
    if (idx !== activeIdx) {
      activeIdx = idx;
      hudChapter.textContent = s.label;
      document.documentElement.style.setProperty("--accent", s.accent);
      dots.forEach((d, i) => d.classList.toggle("active", i === idx));
    }
    const nextYear = sections[Math.min(idx + 1, LAST)].year;
    hudYear.textContent = String(Math.round(lerp(s.year, nextYear, p)));
    if (s.num) s.num.style.setProperty("--py", ((0.5 - p) * 130).toFixed(1) + "px");

    const total = clamp01(y / Math.max(1, docH - H));
    hudProg.textContent = String(Math.round(total * 100)).padStart(3, "0");
    progressFill.style.width = (total * 100).toFixed(2) + "%";

    if (!REDUCED && frame % 5 === 0) refreshGrain();
    frame++;
    requestAnimationFrame(tick);
  }

  refreshGrain();
  requestAnimationFrame(tick);
})();

/* ————————————————————————————————
   AUTOPLAY & MUSIC CONTROLLER
   Smooth jitter-free sequential scroll + background music.
   Uses time-based interpolation with instant scrollTo
   (CSS scroll-behavior: smooth is disabled during autoplay
    to prevent compounding animation conflicts).
   ———————————————————————————————— */
(function () {
  "use strict";

  const autoBtn = document.getElementById("autoplay-btn");
  const muteBtn = document.getElementById("mute-btn");
  const audio = document.getElementById("bg-music");
  const htmlEl = document.documentElement;

  if (!autoBtn || !muteBtn || !audio) return;

  // ——— State ———
  let autoPlaying = false;
  let musicManual = false;
  let rafId = null;
  let targetY = 0;            // floating-point scroll target
  let prevTime = 0;           // previous frame timestamp

  const SCROLL_SPEED = 120;   // pixels per second (~2× original)

  // ——— Volume fade ———
  const FADE_STEPS = 30;
  const TARGET_VOL = 0.45;
  let fadeDir = 0;
  let fadeFrame = 0;

  function fadeVolume() {
    if (fadeDir === 0) return;
    fadeFrame++;
    const k = Math.min(fadeFrame / FADE_STEPS, 1);
    if (fadeDir === 1) {
      audio.volume = k * TARGET_VOL;
    } else {
      audio.volume = (1 - k) * TARGET_VOL;
    }
    if (k >= 1) {
      if (fadeDir === -1) audio.pause();
      fadeDir = 0;
    }
  }

  function startMusic() {
    audio.volume = 0;
    audio.play().then(() => {
      fadeDir = 1;
      fadeFrame = 0;
      muteBtn.classList.add("playing");
    }).catch(() => {});
  }

  function stopMusic(immediate) {
    if (immediate) {
      audio.pause();
      audio.volume = 0;
      muteBtn.classList.remove("playing");
      fadeDir = 0;
    } else {
      fadeDir = -1;
      fadeFrame = 0;
      muteBtn.classList.remove("playing");
    }
  }

  // ——— Auto-scroll loop (time-based, jitter-free) ———
  function autoScrollFrame(now) {
    if (!autoPlaying) return;

    const maxY = document.documentElement.scrollHeight - window.innerHeight;
    if (targetY >= maxY - 1) {
      stopAutoplay();
      return;
    }

    // delta-time in seconds, capped to avoid jumps after tab switch
    const dt = Math.min((now - prevTime) / 1000, 0.05);
    prevTime = now;

    targetY = Math.min(targetY + SCROLL_SPEED * dt, maxY);
    window.scrollTo(0, targetY);

    fadeVolume();
    rafId = requestAnimationFrame(autoScrollFrame);
  }

  function startAutoplay() {
    autoPlaying = true;
    autoBtn.classList.add("playing");
    autoBtn.querySelector(".autoplay-label").textContent = "PLAYING";

    // Disable CSS smooth scroll — it conflicts with per-frame scrollTo
    htmlEl.style.scrollBehavior = "auto";

    targetY = window.scrollY;
    prevTime = performance.now();

    if (!musicManual) {
      startMusic();
    }

    rafId = requestAnimationFrame(autoScrollFrame);
  }

  function stopAutoplay() {
    autoPlaying = false;
    autoBtn.classList.remove("playing");
    autoBtn.querySelector(".autoplay-label").textContent = "AUTOPLAY";
    if (rafId) cancelAnimationFrame(rafId);
    rafId = null;

    // Restore CSS smooth scroll
    htmlEl.style.scrollBehavior = "";

    if (!musicManual && !audio.paused) {
      stopMusic(false);
    }
  }

  // ——— Button handlers ———
  autoBtn.addEventListener("click", () => {
    if (autoPlaying) stopAutoplay();
    else startAutoplay();
  });

  muteBtn.addEventListener("click", () => {
    musicManual = true;
    if (audio.paused) startMusic();
    else stopMusic(true);
  });

  // ——— Interrupt autoplay on user input ———
  window.addEventListener("wheel", () => {
    if (autoPlaying) stopAutoplay();
  }, { passive: true });

  window.addEventListener("touchmove", () => {
    if (autoPlaying) stopAutoplay();
  }, { passive: true });

  window.addEventListener("keydown", (e) => {
    const scrollKeys = ["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "];
    if (autoPlaying && scrollKeys.includes(e.key)) {
      stopAutoplay();
    }
  });
})();
