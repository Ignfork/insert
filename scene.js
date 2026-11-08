/* INSERT · pixel arcade hero scene (canvas). No external assets. */
const PXF={"A":[5,14,17,17,31,17,17,17],"B":[5,30,17,17,30,17,17,30],"C":[5,14,17,16,16,16,17,14],"D":[5,30,17,17,17,17,17,30],"E":[5,31,16,16,30,16,16,31],"F":[5,31,16,16,30,16,16,16],"G":[5,14,17,16,23,17,17,15],"H":[5,17,17,17,31,17,17,17],"I":[3,7,2,2,2,2,2,7],"J":[5,7,2,2,2,18,18,12],"K":[5,17,18,20,24,20,18,17],"L":[5,16,16,16,16,16,16,31],"M":[5,17,27,21,21,17,17,17],"N":[5,17,25,21,19,17,17,17],"O":[5,14,17,17,17,17,17,14],"P":[5,30,17,17,30,16,16,16],"Q":[5,14,17,17,17,21,18,13],"R":[5,30,17,17,30,20,18,17],"S":[5,15,16,16,14,1,1,30],"T":[5,31,4,4,4,4,4,4],"U":[5,17,17,17,17,17,17,14],"V":[5,17,17,17,17,17,10,4],"W":[5,17,17,17,21,21,27,17],"X":[5,17,17,10,4,10,17,17],"Y":[5,17,17,10,4,4,4,4],"Z":[5,31,1,2,4,8,16,31],"0":[5,14,17,19,21,25,17,14],"1":[3,2,6,2,2,2,2,7],"2":[5,14,17,1,2,4,8,31],"3":[5,30,1,1,14,1,1,30],"4":[5,2,6,10,18,31,2,2],"5":[5,31,16,30,1,1,17,14],"6":[5,14,16,16,30,17,17,14],"7":[5,31,1,2,4,8,8,8],"8":[5,14,17,17,14,17,17,14],"9":[5,14,17,17,15,1,1,14]," ":[3,0,0,0,0,0,0,0],".":[1,0,0,0,0,0,0,1],",":[2,0,0,0,0,0,1,2],":":[1,0,1,0,0,0,1,0],";":[2,0,1,0,0,0,1,2],"!":[1,1,1,1,1,1,0,1],"?":[5,14,17,1,2,4,0,4],"'":[1,1,1,0,0,0,0,0],"\"":[3,5,5,0,0,0,0,0],"-":[4,0,0,0,15,0,0,0],"–":[4,0,0,0,15,0,0,0],"+":[5,0,4,4,31,4,4,0],"=":[4,0,0,15,0,15,0,0],"/":[5,1,1,2,4,8,16,16],"\\":[5,16,16,8,4,2,1,1],"(":[2,1,2,2,2,2,2,1],")":[2,2,1,1,1,1,1,2],"[":[2,3,2,2,2,2,2,3],"]":[2,3,1,1,1,1,1,3],"<":[4,1,2,4,8,4,2,1],">":[4,8,4,2,1,2,4,8],"_":[4,0,0,0,0,0,0,15],"#":[5,10,10,31,10,31,10,10],"$":[5,4,15,20,14,5,30,4],"%":[5,25,25,2,4,8,19,19],"&":[5,12,18,20,8,21,18,13],"*":[5,0,21,14,31,14,21,0],"@":[5,14,17,23,21,23,16,14],"↑":[5,4,14,21,4,4,4,4],"↓":[5,4,4,4,4,21,14,4],"→":[5,0,2,1,31,1,2,0],"←":[5,0,8,16,31,16,8,0],"↗":[5,7,3,5,8,16,0,0],"▶":[4,8,12,14,15,14,12,8],"▸":[4,0,8,12,14,12,8,0],"★":[5,4,4,31,14,14,27,17],"✦":[5,0,4,14,31,14,4,0],"·":[1,0,0,0,1,0,0,0],"✓":[5,0,1,2,20,8,0,0],"✕":[5,0,17,10,4,10,17,0],"×":[5,0,17,10,4,10,17,0],"¢":[5,4,14,20,20,20,14,4],"~":[5,0,0,8,21,2,0,0],"≤":[5,2,4,8,4,2,0,14],"↻":[5,14,17,16,17,19,15,3],"⬇":[5,4,4,4,31,14,4,31],"♥":[5,0,10,31,31,14,4,0]};
const Scene = (() => {
  const C = { k:"#05020f", wall:"#160c3a", wall2:"#1d1048", pink:"#ff3d9a", cyan:"#2de2e6", yellow:"#ffd23f", lime:"#7dff6a", orange:"#ff8a3d", purple:"#9b5cff", white:"#f6f2ff", red:"#ff4d5e", blue:"#4d7cff" };
  let H = 225, HORIZON = 150, WIDE = false;
  let out, octx, K = 3, DPR = 1, cv, ctx, W = 400, floorCv, layer, lctx, t0 = performance.now(), raf, running = true, visible = true;
  let cabs = [], mainCab, coinAnim = null, ready = 0, onInsert = null, motes = [], stars = [], invaders = 0, eq = [];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // ---------- pixel helpers ----------
  const R = (g, x, y, w, h, c) => { g.fillStyle = c; g.fillRect(x | 0, y | 0, w | 0, h | 0); };
  function text(g, s, x, y, c, sc = 1, align = "left") {
    s = String(s).toUpperCase();
    let w = 0; for (const ch of s) w += ((PXF[ch] || PXF[" "])[0] + 1) * sc; w -= sc;
    let cx = align === "center" ? x - w / 2 : align === "right" ? x - w : x;
    g.fillStyle = c;
    for (const ch of s) {
      const gl = PXF[ch] || PXF[" "], gw = gl[0];
      for (let r = 0; r < 7; r++) { const m = gl[r + 1]; for (let col = 0; col < gw; col++) if (m & (1 << (gw - 1 - col))) g.fillRect((cx + col * sc) | 0, (y + r * sc) | 0, sc, sc); }
      cx += (gw + 1) * sc;
    }
    return w;
  }
  function glow(g, fn, color, blur) { g.save(); g.shadowColor = color; g.shadowBlur = blur; fn(); g.restore(); }

  // ---------- static floor (perspective checker) ----------
  function buildFloor() {
    floorCv = document.createElement("canvas"); floorCv.width = W; floorCv.height = H - HORIZON;
    const f = floorCv.getContext("2d"), img = f.createImageData(W, H - HORIZON), d = img.data;
    const vx = W * 0.62;
    for (let y = 0; y < H - HORIZON; y++) {
      const z = 60 / (y + 6);
      for (let x = 0; x < W; x++) {
        const u = (x - vx) * z / 30, v = z * 4.2;
        const chk = (Math.floor(u) + Math.floor(v)) & 1;
        const shade = Math.min(1, y / (H - HORIZON) * 1.2 + 0.18);
        const i = (y * W + x) * 4;
        if (chk) { d[i] = 52 * shade; d[i + 1] = 16 * shade; d[i + 2] = 92 * shade; }
        else { d[i] = 22 * shade; d[i + 1] = 9 * shade; d[i + 2] = 52 * shade; }
        // grid line glow
        const fu = u - Math.floor(u), fv = v - Math.floor(v);
        if ((fu < 0.035 || fv < 0.07) && y > 2) { d[i] = Math.min(255, d[i] + 120 * shade); d[i + 1] += 18 * shade; d[i + 2] = Math.min(255, d[i + 2] + 90 * shade); }
        d[i + 3] = 255;
      }
    }
    f.putImageData(img, 0, 0);
  }

  // ---------- wall ----------
  function drawWall(g, t) {
    const gr = g.createLinearGradient(0, 0, 0, HORIZON); gr.addColorStop(0, "#0c0624"); gr.addColorStop(1, "#22104f");
    g.fillStyle = gr; g.fillRect(0, 0, W, HORIZON);
    // panels
    for (let x = 6; x < W; x += 28) { R(g, x, 18, 1, HORIZON - 44, "rgba(255,255,255,.035)"); }
    // ceiling strip + lights
    R(g, 0, 0, W, 12, "#07031a"); R(g, 0, 12, W, 1, "#2a1866");
    // wainscot
    R(g, 0, HORIZON - 26, W, 26, "#140a36"); R(g, 0, HORIZON - 27, W, 1, C.pink + "88");
    for (let x = -26; x < W; x += 8) { g.fillStyle = "rgba(155,92,255,.10)"; g.beginPath(); g.moveTo(x, HORIZON); g.lineTo(x + 26, HORIZON - 26); g.lineTo(x + 30, HORIZON - 26); g.lineTo(x + 4, HORIZON); g.fill(); }
    R(g, 0, HORIZON - 1, W, 1, "#05020f");
    // left wall decor: hi-score board + posters (dim, behind copy)
    const lx = 14;
    if (!WIDE) {
    R(g, lx, 34, 74, 56, "#0a0520"); R(g, lx + 1, 35, 72, 54, "#120a2e");
    text(g, "HI-SCORES", lx + 37, 39, C.yellow + "aa", 1, "center");
    const rows = [["1ST", "INS", C.lime], ["2ND", "ERT", C.cyan], ["3RD", "YOU", C.pink]];
    rows.forEach((r, i) => { text(g, r[0], lx + 5, 52 + i * 11, r[2] + "99"); text(g, r[1], lx + 69, 52 + i * 11, C.white + "77", 1, "right"); });
    // poster
    R(g, lx + 84, 40, 34, 46, "#05020f"); R(g, lx + 85, 41, 32, 44, "#2a1060");
    g.fillStyle = C.yellow + "aa"; g.beginPath(); g.arc(lx + 101, 58, 9, 0, Math.PI * 2); g.fill();
    text(g, "$", lx + 99, 55, "#7a4b00");
    text(g, "1UP", lx + 101, 74, C.pink + "cc", 1, "center");
    }
    // ceiling lamps + cones
    const lamps = [W * 0.48, W * 0.66, W * 0.84];
    g.save(); g.globalCompositeOperation = "lighter";
    lamps.forEach((lxp, i) => {
      const fl = 0.85 + 0.15 * Math.sin(t * 2 + i * 1.7);
      const cg = g.createLinearGradient(0, 12, 0, H); cg.addColorStop(0, `rgba(255,230,180,${0.16 * fl})`); cg.addColorStop(1, "rgba(255,230,180,0)");
      g.fillStyle = cg; g.beginPath(); g.moveTo(lxp - 4, 12); g.lineTo(lxp + 4, 12); g.lineTo(lxp + 46, H); g.lineTo(lxp - 46, H); g.fill();
    });
    g.restore();
    lamps.forEach(lxp => { R(g, lxp - 6, 9, 12, 4, "#2a2250"); R(g, lxp - 4, 13, 8, 1, "#fff2c4"); });
  }

  // ---------- neon sign ----------
  function drawSign(g, t) {
    const cx = signX(), y = mainCab ? Math.max(18, mainCab.y - 50) : 22;
    const flick = (Math.sin(t * 13) > 0.97 || (t % 7 > 6.6 && t % 7 < 6.75)) ? 0.25 : 1;
    // frame tube
    const fw = 128, fh = 40;
    g.save(); g.globalCompositeOperation = "lighter";
    glow(g, () => { g.strokeStyle = C.cyan; g.lineWidth = 1; g.strokeRect(cx - fw / 2 + .5, y - 6 + .5, fw, fh); }, C.cyan, 8);
    // letters
    const s = "INSERT", sc = 3; let w = 0; for (const ch of s) w += (PXF[ch][0] + 1) * sc; w -= sc;
    let x = cx - w / 2;
    for (let i = 0; i < s.length; i++) {
      const ch = s[i], col = [C.yellow, C.orange, C.pink, C.purple, C.cyan, C.lime][i];
      const a = i === 3 ? flick : 1;
      g.globalAlpha = a;
      glow(g, () => text(g, ch, x, y, col, sc), col, 10);
      text(g, ch, x, y, "#ffffff55", sc);
      x += (PXF[ch][0] + 1) * sc;
    }
    g.globalAlpha = 1;
    glow(g, () => text(g, "ARCADE · $INSERT", cx, y + 25, C.pink, 1, "center"), C.pink, 6);
    g.restore();
    // mount wires
    R(g, cx - 40, 12, 1, y - 18, "#3a2a6a"); R(g, cx + 40, 12, 1, y - 18, "#3a2a6a");
  }
  const signX = () => mainCab ? mainCab.x + mainCab.w / 2 : W * 0.7;

  // ---------- cabinets ----------
  function layout() {
    const specs = [
      { w: 44, h: 100, col: C.cyan, dark: "#0e5a6b", mq: "SNIPE", scr: scrShooter },
      { w: 44, h: 104, col: C.pink, dark: "#7a1648", mq: "CURVE", scr: scrCurve },
      { w: 56, h: 118, col: C.yellow, dark: "#7a5a0a", mq: "INSERT", scr: scrMain, main: true },
      { w: 44, h: 104, col: C.lime, dark: "#2a7a1e", mq: "EXIT", scr: scrBars },
    ];
    const gap = 7, total = specs.reduce((s, c) => s + c.w, 0) + gap * (specs.length - 1);
    const narrow = W < 330;
    let x = narrow ? Math.round((W - total) / 2) : Math.round(W - total - Math.max(12, W * 0.05));
    const base = Math.round(H * 0.782);
    cabs = specs.map(s => { const c = { ...s, x, y: base - s.h, base }; x += s.w + gap; return c; });
    mainCab = cabs.find(c => c.main);
  }
  function drawCab(g, c, t) {
    const { x, y, w, h, col, dark } = c;
    // side depth
    R(g, x + w, y + 6, 4, h - 6, "#05020f"); R(g, x + w, y + 8, 3, h - 10, dark);
    // body
    R(g, x - 1, y - 1, w + 2, h + 2, C.k);
    R(g, x, y, w, h, "#1a0f40");
    // side trims
    R(g, x, y, 3, h, col); R(g, x + w - 3, y, 3, h, col);
    R(g, x + 3, y, 1, h, "#00000055"); R(g, x + w - 4, y, 1, h, "#ffffff22");
    // marquee
    const mh = c.main ? 16 : 13;
    R(g, x + 3, y + 2, w - 6, mh, C.k);
    const mg = g.createLinearGradient(x, 0, x + w, 0); mg.addColorStop(0, col); mg.addColorStop(1, C.purple);
    g.fillStyle = mg; g.fillRect(x + 4, y + 3, w - 8, mh - 2);
    R(g, x + 4, y + 3, w - 8, 1, "#ffffff88");
    text(g, c.mq, x + w / 2, y + 3 + ((mh - 2 - 7) >> 1), C.k, 1, "center");
    // screen bezel
    const sx = x + 5, sy = y + mh + 5, sw = w - 10, sh = Math.round((w - 10) * 0.86);
    R(g, sx - 2, sy - 2, sw + 4, sh + 4, "#0a0518"); R(g, sx - 1, sy - 1, sw + 2, sh + 2, "#2b2b4a");
    R(g, sx, sy, sw, sh, "#04120f");
    g.save(); g.beginPath(); g.rect(sx, sy, sw, sh); g.clip();
    c.scr(g, sx, sy, sw, sh, t, c);
    // scanlines + glass
    for (let yy = sy; yy < sy + sh; yy += 2) R(g, sx, yy, sw, 1, "rgba(0,0,0,.22)");
    R(g, sx + 2, sy + 2, 3, sh * 0.5, "rgba(255,255,255,.06)");
    g.restore();
    c.screen = { sx, sy, sw, sh };
    // control deck
    const dy = sy + sh + 4;
    R(g, x - 2, dy, w + 4, 12, C.k); R(g, x - 1, dy + 1, w + 2, 10, "#3a1c86"); R(g, x - 1, dy + 1, w + 2, 1, "#6a4cc6");
    // joystick
    R(g, x + 8, dy - 3, 2, 6, "#c9c9d9"); R(g, x + 6, dy - 6, 6, 4, C.pink); R(g, x + 7, dy - 6, 2, 1, "#ffb3d6");
    // buttons
    [C.yellow, C.cyan, C.lime].forEach((bc, i) => { R(g, x + w - 22 + i * 6, dy + 3, 4, 4, bc); R(g, x + w - 22 + i * 6, dy + 3, 4, 1, "#ffffffaa"); });
    // coin door
    const cdy = dy + 15, cdw = c.main ? 24 : 20;
    const cdx = x + (w - cdw) / 2;
    R(g, cdx - 1, cdy - 1, cdw + 2, 20, C.k); R(g, cdx, cdy, cdw, 18, "#120830");
    const pulse = 0.55 + 0.45 * Math.sin(t * 5 + x);
    [0, 1].forEach(i => {
      const slx = cdx + 4 + i * (cdw - 12);
      R(g, slx, cdy + 3, 4, 7, "#8d8da8"); R(g, slx + 1, cdy + 4, 2, 5, C.k);
      g.save(); g.globalAlpha = pulse; R(g, slx + 1, cdy + 4, 2, 5, i ? C.orange : C.red); g.restore();
    });
    R(g, cdx + 4, cdy + 12, cdw - 8, 3, "#05020f");
    c.slot = { x: cdx, y: cdy, w: cdw, h: 18 };
    // kick plate
    R(g, x, y + h - 6, w, 6, "#0c0624"); R(g, x, y + h - 6, w, 1, col + "88");
  }

  // ---------- screen programs ----------
  function scrShooter(g, x, y, w, h, t) {
    R(g, x, y, w, h, "#030616");
    stars.forEach(s => { const yy = y + ((s.y + t * s.v) % h); R(g, x + s.x % w, yy, 1, 1, s.c); });
    // invaders
    const off = Math.round(Math.sin(t * 1.5) * 4);
    for (let i = 0; i < 4; i++) for (let j = 0; j < 2; j++) {
      const ix = x + 5 + i * 8 + off, iy = y + 5 + j * 7;
      const fr = (Math.floor(t * 3) + i + j) & 1;
      R(g, ix, iy, 5, 3, j ? C.pink : C.lime); R(g, ix + (fr ? 0 : 1), iy + 3, 1, 1, j ? C.pink : C.lime); R(g, ix + (fr ? 4 : 3), iy + 3, 1, 1, j ? C.pink : C.lime);
      R(g, ix + 1, iy + 1, 1, 1, "#000"); R(g, ix + 3, iy + 1, 1, 1, "#000");
    }
    const sx = x + w / 2 + Math.sin(t * 1.3) * (w / 2 - 6);
    R(g, sx - 3, y + h - 6, 7, 3, C.cyan); R(g, sx - 1, y + h - 8, 3, 2, C.cyan); R(g, sx, y + h - 9, 1, 1, C.white);
    const by = y + h - 10 - ((t * 60) % (h - 12));
    R(g, sx, by, 1, 3, C.yellow);
  }
  function scrCurve(g, x, y, w, h, t) {
    R(g, x, y, w, h, "#06041a");
    for (let i = 1; i < 4; i++) R(g, x, y + (h / 4) * i, w, 1, "#1a1446");
    const prog = (t * 0.18) % 1.15, p = Math.min(1, prog);
    let lx = x + 2, ly = y + h - 4;
    g.fillStyle = C.lime;
    const n = Math.floor((w - 4) * p);
    for (let i = 0; i <= n; i++) {
      const k = i / (w - 4);
      const yy = y + h - 4 - Math.pow(k, 2.1) * (h - 12);
      g.fillRect(x + 2 + i, yy | 0, 1, Math.max(1, (ly - yy) | 0) || 1);
      ly = yy;
    }
    const hx = x + 2 + n, hy = y + h - 4 - Math.pow(n / (w - 4), 2.1) * (h - 12);
    R(g, hx - 1, hy - 1, 3, 3, C.yellow);
    // progress bar
    R(g, x + 2, y + 2, w - 4, 4, "#1a1446"); R(g, x + 2, y + 2, (w - 4) * p, 4, prog > 1 ? C.yellow : C.pink);
    if (prog > 1) text(g, "GRAD!", x + w / 2, y + h / 2 - 6, C.yellow, 1, "center");
  }
  function scrMain(g, x, y, w, h, t, c) {
    const bg = g.createRadialGradient(x + w / 2, y + h / 2, 2, x + w / 2, y + h / 2, w);
    bg.addColorStop(0, "#0b2a2a"); bg.addColorStop(1, "#03100d"); g.fillStyle = bg; g.fillRect(x, y, w, h);
    if (ready > 0) {
      text(g, "PLAYER 1", x + w / 2, y + 8, C.cyan, 1, "center");
      const bounce = Math.abs(Math.sin(t * 6)) * 2;
      glow(g, () => text(g, "READY!", x + w / 2, y + 20 - bounce, C.lime, 1, "center"), C.lime, 6);
      for (let i = 0; i < 6; i++) { const a = t * 3 + i; R(g, x + w / 2 + Math.cos(a) * 16, y + 24 + Math.sin(a) * 8, 1, 1, [C.yellow, C.pink, C.cyan][i % 3]); }
      return;
    }
    text(g, "INSERT", x + w / 2, y + 5, C.yellow, 1, "center");
    // spinning coin
    const sq = Math.abs(Math.cos(t * 3));
    const cw = Math.max(1, Math.round(10 * sq));
    R(g, x + w / 2 - cw / 2, y + 15, cw, 10, "#c9900a"); R(g, x + w / 2 - cw / 2 + (cw > 3 ? 1 : 0), y + 16, Math.max(1, cw - 2), 8, C.yellow);
    if (cw > 5) text(g, "$", x + w / 2 - 2, y + 16, "#7a4b00");
    if (Math.floor(t * 2) % 2 === 0) text(g, "COIN", x + w / 2, y + h - 10, C.lime, 1, "center");
  }
  function scrBars(g, x, y, w, h, t) {
    R(g, x, y, w, h, "#0a0420");
    const n = 7, bw = Math.floor((w - 4) / n);
    for (let i = 0; i < n; i++) {
      eq[i] = eq[i] ?? Math.random();
      eq[i] += (Math.random() - 0.5) * 0.12; eq[i] = Math.max(.15, Math.min(.95, eq[i]));
      const bh = Math.round((h - 12) * eq[i]);
      for (let yy = 0; yy < bh; yy += 2) {
        const k = yy / (h - 12);
        R(g, x + 2 + i * bw, y + h - 3 - yy, bw - 1, 1, k > .7 ? C.red : k > .45 ? C.yellow : C.lime);
      }
    }
    text(g, "TP 5X", x + w / 2, y + 2, C.white + "cc", 1, "center");
  }

  // ---------- player sprite (back view) ----------
  function drawPlayer(g, t) {
    const c = cabs[1]; if (!c) return;
    const px = c.x + c.w / 2 - 6, base = c.base + 8, bob = Math.round(Math.sin(t * 2.4)) ;
    // shadow
    g.fillStyle = "rgba(0,0,0,.45)"; g.beginPath(); g.ellipse(px + 6, base + 1, 9, 2, 0, 0, Math.PI * 2); g.fill();
    const y = base - 30 + bob;
    // legs
    R(g, px + 2, y + 21, 3, 9 - bob, "#1e2a5a"); R(g, px + 7, y + 21, 3, 9 - bob, "#1e2a5a");
    R(g, px + 1, base - 1, 4, 2, C.white); R(g, px + 7, base - 1, 4, 2, C.white);
    // hoodie
    R(g, px - 1, y + 9, 14, 13, C.k); R(g, px, y + 10, 12, 11, "#5b2bc0"); R(g, px + 1, y + 10, 10, 1, "#7a4ae0");
    R(g, px + 3, y + 13, 6, 1, "#3e1a8c");
    // arms reaching to controls
    R(g, px - 2, y + 11, 2, 7, "#5b2bc0"); R(g, px + 12, y + 11, 2, 7, "#5b2bc0");
    // head + hood
    R(g, px + 2, y + 1, 8, 9, C.k); R(g, px + 3, y + 2, 6, 7, "#3a1e7a"); R(g, px + 3, y + 2, 6, 3, "#2a1440");
    // headphones
    R(g, px + 1, y + 4, 2, 4, C.cyan); R(g, px + 9, y + 4, 2, 4, C.cyan); R(g, px + 3, y + 1, 6, 1, C.cyan);
  }

  // ---------- coin drop ----------
  function drawCoin(g, t) {
    if (!coinAnim) return;
    const k = (t - coinAnim.t) / 0.9;
    if (k >= 1) { coinAnim = null; return; }
    const s = mainCab.slot, tx = s.x + 4, ty = s.y + 4;
    const sx = tx, sy = mainCab.y - 30;
    const e = k * k;
    const cx = sx, cy = sy + (ty - sy) * e;
    const wdt = Math.max(1, Math.round(7 * Math.abs(Math.cos(k * 14))));
    R(g, cx - wdt / 2 + 2, cy, wdt, 7, "#c9900a"); R(g, cx - wdt / 2 + 2, cy + 1, Math.max(1, wdt - 1), 5, C.yellow);
  }

  // ---------- particles ----------
  function seed() {
    stars = Array.from({ length: 26 }, () => ({ x: Math.random() * 60, y: Math.random() * 60, v: 6 + Math.random() * 16, c: Math.random() > .7 ? C.cyan : "#ffffff" }));
    motes = Array.from({ length: 34 }, () => ({ x: Math.random() * W, y: 14 + Math.random() * (H - 30), v: 1 + Math.random() * 3, p: Math.random() * 6 }));
  }
  function drawMotes(g, t) {
    g.save(); g.globalCompositeOperation = "lighter";
    motes.forEach(m => {
      const yy = (m.y - t * m.v) % (H - 20); const y2 = yy < 14 ? yy + H - 34 : yy;
      const a = 0.25 + 0.25 * Math.sin(t * 2 + m.p);
      R(g, m.x + Math.sin(t + m.p) * 3, y2, 1, 1, `rgba(255,236,190,${a})`);
    });
    g.restore();
  }

  // ---------- floor props: neon arrow + coins ----------
  function drawProps(g, t) {
    if (!mainCab) return;
    if (!ready) {
      const s = mainCab.slot, b = Math.round(Math.abs(Math.sin(t * 5)) * 3);
      glow(g, () => text(g, "▼", s.x + s.w / 2 - 2, s.y - 10 - b, C.yellow), C.yellow, 6);
    }
    // floor coins glint
    [[0.18, .87], [0.31, .91], [0.95, .885]].forEach(([fx, fy], i) => {
      const cx = Math.round(W * fx), cy = Math.round(H * fy);
      R(g, cx, cy, 5, 3, "#c9900a"); R(g, cx, cy, 5, 1, C.yellow);
      if ((t * 1.3 + i) % 3 < 0.25) { R(g, cx + 2, cy - 3, 1, 7, "#fff"); R(g, cx - 1, cy, 7, 1, "#fff"); }
    });
  }

  // ---------- frame ----------
  function frame(now) {
    const t = (now - t0) / 1000;
    if (ready > 0) ready = Math.max(0, ready - 1 / 60);
    // layer (cabinets) for reflection
    lctx.clearRect(0, 0, W, H);
    cabs.forEach(c => drawCab(lctx, c, t));
    drawCoin(lctx, t);

    drawWall(ctx, t);
    drawSign(ctx, t);
    ctx.drawImage(floorCv, 0, HORIZON);
    // reflection
    const axis = cabs[0] ? cabs[0].base : 176;
    ctx.save(); ctx.beginPath(); ctx.rect(0, axis, W, H - axis); ctx.clip();
    ctx.globalAlpha = 0.3; ctx.translate(0, axis * 2); ctx.scale(1, -1); ctx.drawImage(layer, 0, 0); ctx.restore();
    const fade = ctx.createLinearGradient(0, HORIZON, 0, H); fade.addColorStop(0, "rgba(14,8,38,0)"); fade.addColorStop(1, "rgba(14,8,38,.85)");
    // cabinet contact shadows
    cabs.forEach(c => { ctx.fillStyle = "rgba(0,0,0,.5)"; ctx.fillRect(c.x - 3, c.base, c.w + 9, 3); });
    ctx.drawImage(layer, 0, 0);
    // screen glow spill
    ctx.save(); ctx.globalCompositeOperation = "lighter";
    cabs.forEach(c => { if (!c.screen) return; const s = c.screen; const gg = ctx.createRadialGradient(s.sx + s.sw / 2, s.sy + s.sh / 2, 2, s.sx + s.sw / 2, s.sy + s.sh / 2, 40); gg.addColorStop(0, c.col + "22"); gg.addColorStop(1, "transparent"); ctx.fillStyle = gg; ctx.fillRect(s.sx - 40, s.sy - 40, s.sw + 80, s.sh + 80); });
    ctx.restore();
    drawPlayer(ctx, t);
    drawProps(ctx, t);
    drawMotes(ctx, t);
    ctx.fillStyle = fade; ctx.fillRect(0, HORIZON + 40, W, H);
    // vignette
    const vg = ctx.createRadialGradient(W * 0.62, H * 0.45, H * 0.3, W * 0.62, H * 0.45, W * 0.75);
    vg.addColorStop(0, "rgba(0,0,0,0)"); vg.addColorStop(1, "rgba(5,2,15,.6)"); ctx.fillStyle = vg; ctx.fillRect(0, 0, W, H);
  }
  function loop(now) {
    if (running && visible) render(now);
    raf = requestAnimationFrame(loop);
  }
  function resize() {
    const r = out.getBoundingClientRect();
    DPR = Math.min(2, window.devicePixelRatio || 1);
    const dw = Math.max(1, Math.round(r.width * DPR)), dh = Math.max(1, Math.round(r.height * DPR));
    out.width = dw; out.height = dh;
    WIDE = dw / dh > 1.45;
    const target = WIDE ? 270 : 225;
    K = Math.max(1, Math.round(dh / target));
    H = Math.ceil(dh / K); W = Math.ceil(dw / K);
    while (W > 1000) { K++; H = Math.ceil(dh / K); W = Math.ceil(dw / K); }
    HORIZON = Math.round(H * 0.667);
    cv.width = W; cv.height = H; layer.width = W; layer.height = H;
    ctx.imageSmoothingEnabled = false; lctx.imageSmoothingEnabled = false; octx.imageSmoothingEnabled = false;
    layout(); buildFloor(); seed();
    render(performance.now());
  }
  function render(now) { frame(now); octx.imageSmoothingEnabled = false; octx.drawImage(cv, 0, 0, W * K, H * K); }
  function hit(e) {
    const r = out.getBoundingClientRect();
    const x = (e.clientX - r.left) * DPR / K, y = (e.clientY - r.top) * DPR / K;
    return mainCab && x >= mainCab.x - 4 && x <= mainCab.x + mainCab.w + 4 && y >= mainCab.y && y <= mainCab.base;
  }
  function insert() {
    if (coinAnim) return;
    coinAnim = { t: (performance.now() - t0) / 1000 };
    setTimeout(() => { ready = 4; onInsert && onInsert(); }, 900);
  }
  function init(canvas, cb) {
    out = canvas; octx = out.getContext("2d"); onInsert = cb;
    cv = document.createElement("canvas"); ctx = cv.getContext("2d");
    layer = document.createElement("canvas"); lctx = layer.getContext("2d");
    resize();
    let rt; addEventListener("resize", () => { clearTimeout(rt); rt = setTimeout(resize, 120); });
    out.addEventListener("click", e => { if (hit(e)) insert(); });
    out.addEventListener("mousemove", e => { out.style.cursor = hit(e) ? "pointer" : "default"; });
    new IntersectionObserver(es => { visible = es[0].isIntersecting; }).observe(out);
    if (reduce) { running = false; render(performance.now()); }
    raf = requestAnimationFrame(loop);
  }
  return { init, insert, text };
})();
