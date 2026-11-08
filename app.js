/* =========================================================
   INSERT ($INSERT) · app.js
   Edit CONFIG below before deploying.
   ========================================================= */
const CONFIG = {
  CA: "",                       // paste the $INSERT mint here after launch (leave "" until then)
  X_URL: "https://x.com/UseInsertSol", // project X account
  PUMP_URL: "https://pump.fun", // auto-switches to pump.fun/coin/<CA> once CA is set
  TICKER: "$INSERT",
};

/* ---------- pump.fun bonding curve constants ---------- */
const CURVE = {
  VS0: 30,                 // virtual SOL at launch
  VT0: 1073000191,         // virtual tokens at launch
  REAL: 793100000,         // tokens sold on the curve
  SUPPLY: 1000000000,
};
CURVE.K = CURVE.VS0 * CURVE.VT0;
CURVE.GRAD_SOL = CURVE.K / (CURVE.VT0 - CURVE.REAL) - CURVE.VS0; // ≈ 85.005 SOL

/* ---------- helpers ---------- */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => [...r.querySelectorAll(s)];
const clamp = (v, a = 0, b = 100) => Math.max(a, Math.min(b, v));
const num = (el) => { const v = parseFloat(el.value); return isFinite(v) ? v : 0; };
const store = {
  get(k, d) { try { const v = localStorage.getItem("insert:" + k); return v ? JSON.parse(v) : d; } catch { return d; } },
  set(k, v) { try { localStorage.setItem("insert:" + k, JSON.stringify(v)); } catch {} },
};
function fmtUsd(v, dp) {
  if (v == null || !isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return "$" + (v / 1e9).toFixed(2) + "B";
  if (a >= 1e6) return "$" + (v / 1e6).toFixed(2) + "M";
  if (a >= 1e4) return "$" + (v / 1e3).toFixed(1) + "K";
  if (a >= 1) return "$" + v.toLocaleString(undefined, { maximumFractionDigits: dp ?? 2 });
  if (a === 0) return "$0";
  return "$" + tinyNum(v);
}
function tinyNum(v) {
  if (v >= 0.01) return v.toFixed(4);
  const s = v.toExponential(3); const [m, e] = s.split("e");
  const zeros = Math.abs(+e) - 1;
  if (zeros >= 4) { const sub = String(zeros).split("").map(d => "₀₁₂₃₄₅₆₇₈₉"[d]).join(""); return "0.0" + sub + m.replace(".", "").slice(0, 4); }
  return v.toFixed(Math.min(12, zeros + 5));
}
function fmtNum(v, dp = 2) {
  if (!isFinite(v)) return "—";
  const a = Math.abs(v);
  if (a >= 1e9) return (v / 1e9).toFixed(dp) + "B";
  if (a >= 1e6) return (v / 1e6).toFixed(dp) + "M";
  if (a >= 1e3) return (v / 1e3).toFixed(1) + "K";
  return v.toLocaleString(undefined, { maximumFractionDigits: dp });
}
const fmtSol = (v, dp = 3) => (isFinite(v) ? (+v).toLocaleString(undefined, { maximumFractionDigits: dp }) : "—") + " SOL";
const fmtPct = (v, dp = 1) => (v == null || !isFinite(v) ? "—" : (v > 0 ? "+" : "") + v.toFixed(dp) + "%");
const short = (a) => a ? a.slice(0, 4) + "…" + a.slice(-4) : "";
const esc = (s) => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
function ago(ms) {
  const m = Math.max(0, (Date.now() - ms) / 60000);
  if (m < 60) return Math.round(m) + "m";
  if (m < 1440) return (m / 60).toFixed(1) + "h";
  return Math.round(m / 1440) + "d";
}
function extractCA(input) {
  const s = (input || "").trim();
  const m = s.match(/[1-9A-HJ-NP-Za-km-z]{32,44}/g);
  if (!m) return null;
  return m.find(x => /pump$/.test(x)) || m[m.length - 1];
}
let toastT;
function toast(msg, err) {
  const t = $("#toast"); t.textContent = msg; t.classList.toggle("err", !!err); t.classList.add("show");
  clearTimeout(toastT); toastT = setTimeout(() => t.classList.remove("show"), 2600);
}
async function copy(text, label = "COPIED!") {
  try { await navigator.clipboard.writeText(text); toast(label); }
  catch { const ta = document.createElement("textarea"); ta.value = text; document.body.appendChild(ta); ta.select(); document.execCommand("copy"); ta.remove(); toast(label); }
}

/* ---------- curve math ---------- */
function curveBuy(raisedBefore, solIn, feePct) {
  const { VS0, K, GRAD_SOL } = CURVE;
  raisedBefore = clamp(raisedBefore, 0, GRAD_SOL);
  const fee = solIn * (feePct / 100);
  let net = Math.max(0, solIn - fee);
  let capped = false;
  if (raisedBefore + net > GRAD_SOL) { net = GRAD_SOL - raisedBefore; capped = true; }
  const vs1 = VS0 + raisedBefore, vt1 = K / vs1;
  const vs2 = vs1 + net, vt2 = K / vs2;
  const tokens = vt1 - vt2;
  const p1 = vs1 / vt1, p2 = vs2 / vt2;
  return {
    tokens, fee: capped ? net * feePct / (100 - feePct) : fee, net, capped,
    priceBefore: p1, priceAfter: p2,
    mcBeforeSol: p1 * CURVE.SUPPLY, mcAfterSol: p2 * CURVE.SUPPLY,
    impact: (p2 / p1 - 1) * 100,
    avg: tokens > 0 ? net / tokens : 0,
    raisedAfter: raisedBefore + net,
  };
}
const curvePriceAt = (raised) => { const vs = CURVE.VS0 + raised; return vs / (CURVE.K / vs); };
const raisedFromPrice = (pSol) => Math.sqrt(CURVE.K * pSol) - CURVE.VS0;
const GRAD_PRICE = curvePriceAt(CURVE.GRAD_SOL);

/* ---------- SOL price (live) ---------- */
let SOL_USD = null;
async function loadSolPrice() {
  try {
    const r = await fetch("https://api.dexscreener.com/latest/dex/tokens/So11111111111111111111111111111111111111112");
    const j = await r.json();
    const pairs = (j.pairs || []).filter(p => p.chainId === "solana" && /^(USDC|USDT)$/.test(p.quoteToken?.symbol) && p.baseToken?.symbol === "SOL");
    pairs.sort((a, b) => (b.liquidity?.usd || 0) - (a.liquidity?.usd || 0));
    const v = parseFloat(pairs[0]?.priceUsd);
    if (v > 0) setSolUsd(v, "live");
    else throw 0;
  } catch {
    $("#cvSolNote").textContent = "Couldn't fetch the live SOL price. Type it in to see USD values.";
  }
}
function setSolUsd(v, src) {
  SOL_USD = v;
  ["#cvSolUsd", "#exSolUsd"].forEach(id => { const el = $(id); if (!el.dataset.touched) el.value = v.toFixed(2); });
  if (src === "live") $("#cvSolNote").textContent = `SOL price pulled live ($${v.toFixed(2)}) and you can edit it. Fees change on pump.fun, so set the % you actually see.`;
  renderCurve(); renderExit(); renderLaunch();
}

/* =========================================================
   SESSION STATS
   ========================================================= */
const session = store.get("session", { scans: 0, hi: 0, credits: 0 });
function renderSession() {
  $("#statScans").textContent = session.scans;
  $("#statHi").textContent = String(session.hi).padStart(3, "0");
  $("#statWatch").textContent = watchlist.length;
  $("#statCredits").textContent = String(session.credits).padStart(2, "0");
}
function saveSession() { store.set("session", session); renderSession(); }

/* =========================================================
   HERO: CA + coin slot
   ========================================================= */
function initConfig() {
  $$(".js-x").forEach(a => a.href = CONFIG.X_URL);
  const buyUrl = CONFIG.CA ? `https://pump.fun/coin/${CONFIG.CA}` : CONFIG.PUMP_URL;
  $$(".js-buy").forEach(a => a.href = buyUrl);
  if (CONFIG.CA) {
    ["#caValue", "#caFact"].forEach(id => { const el = $(id); el.textContent = CONFIG.CA; el.removeAttribute("href"); });
    $("#caCopy").hidden = false;
    $("#caCopy").onclick = () => copy(CONFIG.CA, "CA COPIED!");
  }
  $("#yr").textContent = new Date().getFullYear();
}
function onCoinInserted() {
  session.credits = Math.min(99, session.credits + 1); saveSession();
  toast("+1 CREDIT · PLAYER 1 READY");
  setTimeout(() => {
    $("#scan").scrollIntoView({ behavior: "smooth" });
    setTimeout(() => $("#scanInput").focus({ preventScroll: true }), 800);
  }, 1100);
}
function initReveal() {
  const els = $$(".reveal");
  if (!("IntersectionObserver" in window)) { els.forEach(e => e.classList.add("in")); return; }
  const io = new IntersectionObserver((es) => es.forEach(e => { if (e.isIntersecting) { e.target.classList.add("in"); io.unobserve(e.target); } }), { rootMargin: "0px 0px -8% 0px" });
  els.forEach((e, i) => { e.style.transitionDelay = (i % 4) * 70 + "ms"; io.observe(e); });
}
function initNav() {
  const links = $$("#navLinks a");
  const map = new Map(links.map(a => [a.getAttribute("href").slice(1), a]));
  const io = new IntersectionObserver((es) => es.forEach(e => {
    if (!e.isIntersecting) return;
    links.forEach(a => a.classList.remove("active"));
    const a = map.get(e.target.id); if (!a) return;
    a.classList.add("active");
    a.style.setProperty("--navc", getComputedStyle(e.target).getPropertyValue("--acc").trim() || "var(--cyan)");
  }), { rootMargin: "-45% 0px -50% 0px" });
  map.forEach((a, id) => { const el = document.getElementById(id); if (el) io.observe(el); });
  const nav = $(".nav"); const onS = () => nav.classList.toggle("scrolled", scrollY > 20);
  addEventListener("scroll", onS, { passive: true }); onS();
}
function initContinue() {
  const el = $("#contN"); let n = 9;
  setInterval(() => { n = n <= 0 ? 9 : n - 1; el.textContent = n; }, 1000);
}

/* =========================================================
   SCANNER
   ========================================================= */
let lastScan = null;
let recent = store.get("recent", []);

async function fetchPairs(ca) {
  let pairs = [];
  try {
    const r = await fetch(`https://api.dexscreener.com/latest/dex/tokens/${ca}`);
    if (r.ok) { const j = await r.json(); pairs = j.pairs || []; }
  } catch {}
  if (!pairs.length) {
    try {
      const r = await fetch(`https://api.dexscreener.com/tokens/v1/solana/${ca}`);
      if (r.ok) { const j = await r.json(); pairs = Array.isArray(j) ? j : []; }
    } catch {}
  }
  pairs = pairs.filter(p => p.chainId === "solana" && (p.baseToken?.address === ca || p.quoteToken?.address === ca));
  return pairs;
}
function pickPair(pairs, ca) {
  const base = pairs.filter(p => p.baseToken?.address === ca);
  const list = base.length ? base : pairs;
  list.sort((a, b) => ((b.volume?.h24 || 0) + (b.liquidity?.usd || 0)) - ((a.volume?.h24 || 0) + (a.liquidity?.usd || 0)));
  return list[0];
}

function scorePair(p) {
  const tx = p.txns || {}, ch = p.priceChange || {}, vol = p.volume || {};
  const h1 = tx.h1 || { buys: 0, sells: 0 }, m5 = tx.m5 || { buys: 0, sells: 0 }, h24 = tx.h24 || { buys: 0, sells: 0 };
  const mc = p.marketCap || p.fdv || 0;
  const liq = p.liquidity?.usd || 0;
  const isCurve = p.dexId === "pumpfun";
  const priceNative = parseFloat(p.priceNative);
  const priceUsd = parseFloat(p.priceUsd);
  const solUsd = priceNative > 0 && priceUsd > 0 && p.quoteToken?.symbol === "SOL" ? priceUsd / priceNative : SOL_USD;
  let curve = null;
  if (isCurve && priceNative > 0) {
    const raised = clamp(raisedFromPrice(priceNative), 0, CURVE.GRAD_SOL);
    curve = { raised, pct: raised / CURVE.GRAD_SOL * 100, left: CURVE.GRAD_SOL - raised };
  }
  const F = [];
  const add = (key, name, w, v, note) => F.push({ key, name, w, v: Math.round(clamp(v)), note });

  // 1 buy pressure
  const t1 = h1.buys + h1.sells, t24 = h24.buys + h24.sells;
  const useTx = t1 >= 8 ? h1 : h24;
  const tot = useTx.buys + useTx.sells;
  const br = tot ? useTx.buys / tot : 0.5;
  add("pressure", "Buy pressure", .20, (br - 0.35) / 0.35 * 100,
    tot ? `${Math.round(br * 100)}% of ${tot} ${t1 >= 8 ? "1h" : "24h"} trades are buys` : "No trades recorded yet");

  // 2 momentum
  const c1 = ch.h1 ?? 0;
  let mo, moN;
  if (c1 < -30) { mo = 10; moN = "Bleeding hard on the hour"; }
  else if (c1 < -10) { mo = 30; moN = "Trending down on the hour"; }
  else if (c1 < 0) { mo = 50; moN = "Flat to slightly red"; }
  else if (c1 <= 60) { mo = 70 + c1 / 2; moN = "Healthy climb, not overheated"; }
  else if (c1 <= 150) { mo = 72; moN = "Running hot, so size down"; }
  else { mo = 35; moN = "Vertical. You'd be chasing"; }
  add("momentum", "Momentum", .17, mo, `${fmtPct(c1)} 1h · ${moN}`);

  // 3 activity
  add("activity", "Activity", .15, Math.log10(t1 + 1) / Math.log10(1500) * 100, `${t1.toLocaleString()} trades in the last hour`);

  // 4 depth
  if (isCurve && curve) {
    add("depth", "Curve depth", .14, curve.pct * 1.15, `${curve.raised.toFixed(1)} SOL in the curve (${curve.pct.toFixed(1)}%)`);
  } else {
    const r = mc ? liq / mc : 0;
    add("depth", "Liquidity depth", .14, r / 0.15 * 100, `Liquidity is ${(r * 100).toFixed(1)}% of market cap`);
  }

  // 5 turnover
  const to = mc ? (vol.h24 || 0) / mc : 0;
  add("turnover", "Volume turnover", .10, to / 1.5 * 100, `24h volume is ${to.toFixed(2)}x market cap`);

  // 6 socials
  const soc = (p.info?.websites?.length || 0) + (p.info?.socials?.length || 0);
  add("socials", "Socials", .08, [10, 50, 80, 100][Math.min(3, soc)], soc ? `${soc} link${soc > 1 ? "s" : ""} listed on DexScreener` : "No website or socials listed");

  // 7 age
  const mins = p.pairCreatedAt ? (Date.now() - p.pairCreatedAt) / 60000 : null;
  let ag = 60, agN = "Unknown age";
  if (mins != null) {
    if (mins < 10) { ag = 30; agN = "Under 10 minutes old. Very early, very risky"; }
    else if (mins < 60) { ag = 70; agN = "Under an hour old"; }
    else if (mins < 1440) { ag = 100; agN = "Survived its first hours"; }
    else if (mins < 10080) { ag = 82; agN = "A few days old"; }
    else { ag = 62; agN = "Older coin, so it needs a fresh catalyst"; }
  }
  add("age", "Age", .08, ag, agN);

  // 8 entry timing
  const c5 = ch.m5 ?? 0;
  let tm = 60, tmN = "Neutral 5-minute candle";
  if (c1 > 0 && c5 < 0 && c5 > -15) { tm = 100; tmN = `Dip (${fmtPct(c5)} 5m) inside an uptrend`; }
  else if (c5 > 25) { tm = 20; tmN = `Vertical 5m candle (${fmtPct(c5)}). Wait for a pullback`; }
  else if (c5 < -15) { tm = 30; tmN = `Sharp 5m dump (${fmtPct(c5)})`; }
  add("timing", "Entry timing", .08, tm, tmN);

  const score = Math.round(F.reduce((s, f) => s + f.v * f.w, 0));
  return { score, factors: F, mc, liq, isCurve, curve, solUsd, priceUsd, mins, t1, m5, h1, ch, vol };
}
function verdictOf(score) {
  if (score >= 70) return { label: "INSERT ▶", color: "var(--lime)", hex: "#7dff6a", note: "The board looks good. Size it with the curve calculator and set your exits first." };
  if (score >= 45) return { label: "WAIT · PRESS START", color: "var(--yellow)", hex: "#ffd23f", note: "Mixed signals. Wait for confirmation or go small." };
  return { label: "GAME OVER", color: "var(--red)", hex: "#ff4d5e", note: "Weak board right now. Most of the time, skipping is the best trade." };
}
const scoreColor = (v) => v >= 70 ? "var(--lime)" : v >= 45 ? "var(--yellow)" : "var(--red)";
const scoreHex = (v) => v >= 70 ? "#7dff6a" : v >= 45 ? "#ffd23f" : "#ff4d5e";

async function runScan(input, opts = {}) {
  const ca = extractCA(input);
  if (!ca) { toast("THAT DOESN'T LOOK LIKE A SOLANA CA", true); return null; }
  const panel = $("#scan .panel");
  if (!opts.silent) { panel.classList.add("scanning"); $("#scanStatus").textContent = "SCANNING…"; $("#scanBtn").disabled = true; }
  try {
    const pairs = await fetchPairs(ca);
    if (!pairs.length) {
      if (!opts.silent) { toast("NOT INDEXED YET. TRY AGAIN IN A MINUTE", true); showNotFound(ca); }
      return null;
    }
    const p = pickPair(pairs, ca);
    const s = scorePair(p);
    const result = { ca, pair: p, ...s, at: Date.now() };
    if (!opts.silent) {
      lastScan = result;
      session.scans++; session.hi = Math.max(session.hi, s.score); saveSession();
      recent = [{ ca, sym: p.baseToken?.symbol || short(ca) }, ...recent.filter(r => r.ca !== ca)].slice(0, 6);
      store.set("recent", recent); renderRecent();
      renderScan(result);
      feedTools(result);
    }
    return result;
  } catch (e) {
    if (!opts.silent) toast("SCAN FAILED. CHECK YOUR CONNECTION", true);
    return null;
  } finally {
    if (!opts.silent) { panel.classList.remove("scanning"); $("#scanStatus").textContent = lastScan ? "SCORE " + lastScan.score : "IDLE"; $("#scanBtn").disabled = false; }
  }
}
function showNotFound(ca) {
  $("#scanEmpty").hidden = false; $("#scanResult").hidden = true;
  $("#scanEmpty p").innerHTML = `<b>${esc(short(ca))} isn't on DexScreener yet.</b> Brand-new pump.fun coins can take a minute to get indexed. You can still check it directly: <a href="https://pump.fun/coin/${esc(ca)}" target="_blank" rel="noopener" style="color:var(--cyan)">pump.fun ↗</a>`;
  renderCheckLinks(ca);
}
function renderScan(r) {
  const p = r.pair, v = verdictOf(r.score);
  $("#scanEmpty").hidden = true; $("#scanResult").hidden = false;
  const img = p.info?.imageUrl;
  const ri = $("#resImg");
  ri.style.backgroundImage = img ? `url("${img}")` : "none";
  ri.textContent = img ? "" : (p.baseToken?.symbol || "?").slice(0, 2);
  $("#resName").textContent = p.baseToken?.name || "Unknown";
  $("#resSym").textContent = "$" + (p.baseToken?.symbol || "?");
  $("#resCa").textContent = short(r.ca);
  $("#resDex").textContent = r.isCurve ? "pump.fun curve" : (p.dexId || "dex");
  $("#resAge").textContent = p.pairCreatedAt ? ago(p.pairCreatedAt) + " old" : "age n/a";

  const box = $(".score-box"); box.style.setProperty("--sc", v.color);
  const fg = $("#ringFg"); fg.style.strokeDashoffset = 314.16;
  requestAnimationFrame(() => setTimeout(() => fg.style.strokeDashoffset = 314.16 * (1 - r.score / 100), 30));
  countUp($("#scoreNum"), r.score);
  $("#verdict").textContent = v.label;
  $("#verdictNote").textContent = v.note;

  const ch = r.ch || {};
  const cls = (x) => x > 0 ? "up" : x < 0 ? "down" : "";
  const tiles = [
    ["Price", fmtUsd(r.priceUsd), p.priceNative ? tinyNum(+p.priceNative) + " SOL" : ""],
    ["Market cap", fmtUsd(r.mc), r.solUsd ? fmtNum(r.mc / r.solUsd, 1) + " SOL" : ""],
    [r.isCurve ? "Curve liquidity" : "Liquidity", r.liq ? fmtUsd(r.liq) : (r.curve ? fmtSol(r.curve.raised, 1) : "—"), ""],
    ["Volume 24h", fmtUsd(r.vol.h24 || 0), "1h " + fmtUsd(r.vol.h1 || 0)],
    ["Trades 1h", (r.t1 || 0).toLocaleString(), `${r.h1.buys} buys · ${r.h1.sells} sells`],
    ["Change 5m", `<span class="${cls(ch.m5)}">${fmtPct(ch.m5)}</span>`, ""],
    ["Change 1h", `<span class="${cls(ch.h1)}">${fmtPct(ch.h1)}</span>`, "6h " + fmtPct(ch.h6)],
    ["Change 24h", `<span class="${cls(ch.h24)}">${fmtPct(ch.h24)}</span>`, ""],
  ];
  $("#statTiles").innerHTML = tiles.map(([a, b, c]) => `<div class="tile"><span>${a}</span><b>${b}</b><small>${c || "&nbsp;"}</small></div>`).join("");

  if (r.curve) {
    $("#curveProgress").hidden = false;
    $("#cpPct").textContent = r.curve.pct.toFixed(1) + "%";
    $("#cpFill").style.width = "0%";
    setTimeout(() => $("#cpFill").style.width = r.curve.pct + "%", 40);
    $("#cpRaised").textContent = r.curve.raised.toFixed(2) + " SOL in curve";
    $("#cpLeft").textContent = r.curve.left > 0.01 ? r.curve.left.toFixed(2) + " SOL to graduate" : "Graduating…";
  } else $("#curveProgress").hidden = true;

  $("#factorList").innerHTML = r.factors.map(f => `
    <div class="factor" style="--fc:${scoreColor(f.v)}">
      <span class="fn">${f.name}</span><span class="fbar"><i data-w="${f.v}"></i></span><span class="fv">${f.v}</span>
      <span class="fnote">${esc(f.note)} · weight ${Math.round(f.w * 100)}%</span>
    </div>`).join("");
  setTimeout(() => $$("#factorList .fbar i").forEach(i => i.style.width = i.dataset.w + "%"), 60);

  $("#quickLinks").innerHTML = linkSet(r.ca).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("");
  $("#resWatch").textContent = watchlist.some(w => w.ca === r.ca) ? "★ Watching" : "★ Watch";
  renderCheckLinks(r.ca);
  $("#scanResult").scrollIntoView({ behavior: "smooth", block: "nearest" });
}
function linkSet(ca) {
  return [
    ["pump.fun", `https://pump.fun/coin/${ca}`],
    ["DexScreener", `https://dexscreener.com/solana/${ca}`],
    ["Solscan holders", `https://solscan.io/token/${ca}#holders`],
    ["RugCheck", `https://rugcheck.xyz/tokens/${ca}`],
    ["Bubblemaps", `https://app.bubblemaps.io/sol/token/${ca}`],
    ["GMGN", `https://gmgn.ai/sol/token/${ca}`],
  ];
}
function countUp(el, to) {
  const start = performance.now(), d = 900;
  const step = (t) => { const k = Math.min(1, (t - start) / d); el.textContent = Math.round(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
  requestAnimationFrame(step);
}
function renderRecent() {
  const el = $("#recent");
  if (!recent.length) { el.innerHTML = ""; return; }
  el.innerHTML = `<span class="lbl">RECENT</span>` + recent.map(r => `<button type="button" data-ca="${esc(r.ca)}">$${esc(r.sym)}</button>`).join("");
}
function feedTools(r) {
  // curve calculator: drop the slider at this coin's real curve position
  if (r.curve) { $("#cvPos").value = r.curve.raised.toFixed(2); }
  if (r.solUsd && !SOL_USD) setSolUsd(r.solUsd);
  renderCurve();
}

/* =========================================================
   CURVE CALCULATOR
   ========================================================= */
function renderCurve() {
  const pos = num($("#cvPos")), sol = num($("#cvSol")), fee = num($("#cvFee")), slip = num($("#cvSlip"));
  const usd = num($("#cvSolUsd")) || SOL_USD || 0;
  $("#cvPos").style.setProperty("--fill", (pos / 85) * 100 + "%");
  $("#cvPosLbl").textContent = `${pos.toFixed(2)} SOL in curve (${(pos / CURVE.GRAD_SOL * 100).toFixed(1)}%)`;
  const b = curveBuy(pos, sol, fee);
  $("#cvTokens").textContent = fmtNum(b.tokens, 2);
  $("#cvSupply").textContent = (b.tokens / CURVE.SUPPLY * 100).toFixed(3) + "% of supply";
  $("#cvMcBefore").textContent = usd ? fmtUsd(b.mcBeforeSol * usd) : fmtSol(b.mcBeforeSol, 2);
  $("#cvMcBeforeSol").textContent = fmtSol(b.mcBeforeSol, 2);
  $("#cvMcAfter").textContent = usd ? fmtUsd(b.mcAfterSol * usd) : fmtSol(b.mcAfterSol, 2);
  $("#cvMcAfterSol").textContent = fmtSol(b.mcAfterSol, 2);
  $("#cvImpact").textContent = "+" + b.impact.toFixed(2) + "%";
  $("#cvImpactNote").textContent = b.impact < 3 ? "barely moves it" : b.impact < 15 ? "noticeable push" : b.impact < 50 ? "big candle" : "you ARE the pump";
  $("#cvAvg").textContent = usd ? fmtUsd(b.avg * usd) : tinyNum(b.avg) + " SOL";
  $("#cvAvgSol").textContent = tinyNum(b.avg) + " SOL";
  $("#cvFeePaid").textContent = fmtSol(b.fee, 4);
  $("#cvFeeUsd").textContent = usd ? fmtUsd(b.fee * usd) : "";
  $("#cvMin").textContent = fmtNum(b.tokens * (1 - slip / 100), 2);
  const gradVal = b.tokens * GRAD_PRICE;
  $("#cvGradVal").textContent = fmtSol(gradVal, 2);
  $("#cvGradX").textContent = sol ? (gradVal / sol).toFixed(2) + "x your SOL if it graduates (before sell impact)" : "—";
  $("#cvGradFlag").textContent = b.capped ? "GRADUATES" : "ON CURVE";
  if (b.capped) $("#cvImpactNote").textContent = "your buy completes the curve";
  drawCurve(pos, b.raisedAfter);
}
function drawCurve(from, to) {
  const svg = $("#curveSvg"), W = 600, H = 220, pad = 8;
  const maxP = GRAD_PRICE, n = 80;
  const x = (r) => pad + (r / CURVE.GRAD_SOL) * (W - pad * 2);
  const y = (p) => H - pad - (p / maxP) * (H - pad * 2);
  let d = "";
  for (let i = 0; i <= n; i++) { const r = CURVE.GRAD_SOL * i / n; d += (i ? "L" : "M") + x(r).toFixed(1) + "," + y(curvePriceAt(r)).toFixed(1); }
  let area = "";
  const steps = 24;
  for (let i = 0; i <= steps; i++) { const r = from + (to - from) * i / steps; area += (i ? "L" : "M") + x(r).toFixed(1) + "," + y(curvePriceAt(r)).toFixed(1); }
  area += `L${x(to).toFixed(1)},${H - pad}L${x(from).toFixed(1)},${H - pad}Z`;
  const grid = [0.25, 0.5, 0.75].map(k => `<line x1="${pad}" x2="${W - pad}" y1="${y(maxP * k)}" y2="${y(maxP * k)}" stroke="#241a55" stroke-dasharray="4 6"/>`).join("") +
    [0.25, 0.5, 0.75].map(k => `<line y1="${pad}" y2="${H - pad}" x1="${x(CURVE.GRAD_SOL * k)}" x2="${x(CURVE.GRAD_SOL * k)}" stroke="#241a55" stroke-dasharray="4 6"/>`).join("");
  svg.innerHTML = `${grid}
    <path d="${area}" fill="rgba(255,61,154,.28)"/>
    <path d="${d}" fill="none" stroke="#7dff6a" stroke-width="3" vector-effect="non-scaling-stroke"/>
    <line x1="${x(from)}" x2="${x(from)}" y1="${pad}" y2="${H - pad}" stroke="#ff3d9a" stroke-width="2" vector-effect="non-scaling-stroke"/>
    <line x1="${x(to)}" x2="${x(to)}" y1="${pad}" y2="${H - pad}" stroke="#ffd23f" stroke-width="2" stroke-dasharray="5 4" vector-effect="non-scaling-stroke"/>
    <circle cx="${x(from)}" cy="${y(curvePriceAt(from))}" r="5" fill="#ff3d9a" stroke="#05020f" stroke-width="2"/>
    <circle cx="${x(to)}" cy="${y(curvePriceAt(to))}" r="5" fill="#ffd23f" stroke="#05020f" stroke-width="2"/>`;
}

/* =========================================================
   EXIT PLANNER
   ========================================================= */
const PRESETS = {
  safe: [[2, 50], [4, 20], [8, 15], [20, 10]],
  balanced: [[2, 25], [5, 25], [10, 25], [25, 15]],
  moon: [[3, 20], [10, 20], [30, 20], [100, 20]],
};
let ladder = store.get("ladder", PRESETS.balanced.map(([m, s]) => ({ m, s })));
function renderLadder() {
  $("#ladder").innerHTML = ladder.map((l, i) => `
    <div class="lrow">
      <span class="ln">TP${i + 1}</span>
      <label><input type="number" min="1" step="0.1" value="${l.m}" data-i="${i}" data-k="m" aria-label="Multiple"/><em>x</em></label>
      <label><input type="number" min="0" max="100" step="1" value="${l.s}" data-i="${i}" data-k="s" aria-label="Sell percent"/><em>% sell</em></label>
      <button class="rm" type="button" data-rm="${i}" aria-label="Remove level">×</button>
    </div>`).join("");
}
function renderExit() {
  const mc = num($("#exMc")), sol = num($("#exSol")), stop = num($("#exStop"));
  const usd = num($("#exSolUsd")) || SOL_USD || 0;
  store.set("ladder", ladder);
  let realized = 0, sold = 0, rows = "";
  const sorted = ladder.map((l, i) => ({ ...l, i })).sort((a, b) => a.m - b.m);
  let over = false, firstBE = null;
  sorted.forEach((l, idx) => {
    let s = Math.max(0, l.s);
    if (sold + s > 100) { s = Math.max(0, 100 - sold); over = true; }
    const out = sol * l.m * s / 100;
    sold += s; realized += out;
    if (firstBE == null && realized >= sol) firstBE = l;
    rows += `<tr><td class="lvl">TP${idx + 1} · ${l.m}x</td><td>${fmtUsd(mc * l.m)}</td><td>${s.toFixed(0)}%</td><td>${fmtSol(out, 3)}</td><td>${usd ? fmtUsd(out * usd) : "—"}</td><td class="${realized >= sol ? "up" : ""}">${fmtSol(realized, 3)}</td></tr>`;
  });
  $("#exTable tbody").innerHTML = rows || `<tr><td colspan="6" style="color:var(--dim)">Add a level to start your ladder.</td></tr>`;
  const bag = Math.max(0, 100 - sold);
  $("#exTotal").textContent = fmtSol(realized, 3);
  $("#exTotalUsd").textContent = usd ? fmtUsd(realized * usd) + " · " + (sol ? (realized / sol).toFixed(2) + "x" : "") : (sol ? (realized / sol).toFixed(2) + "x overall" : "");
  $("#exBag").textContent = bag.toFixed(0) + "%";
  $("#exBagVal").textContent = bag > 0 ? (firstBE ? "rides free after TP" + (sorted.indexOf(firstBE) + 1) : "still at risk") : "fully sold";
  const stopOut = sol * (1 - stop / 100);
  $("#exStopOut").textContent = fmtSol(stopOut, 3);
  $("#exStopMc").textContent = `at ${fmtUsd(mc * (1 - stop / 100))} MC · −${fmtSol(sol - stopOut, 3)}`;
  $("#exStatus").textContent = over ? "OVER 100%" : "OK";
  $("#exBreakeven").innerHTML = firstBE
    ? `You get your initial ${fmtSol(sol, 2)} back at <b>TP${sorted.indexOf(firstBE) + 1} (${firstBE.m}x · ${fmtUsd(mc * firstBE.m)} MC)</b>. Everything after that is house money.`
    : `This ladder never gets your initial ${fmtSol(sol, 2)} back. Sell more at the early levels if you want a free ride.`;
}

/* =========================================================
   LAUNCH KIT
   ========================================================= */
let lkImgInfo = null;
function renderLaunch() {
  const name = $("#lkName").value.trim(), tick = $("#lkTick").value.trim().replace(/^\$/, "");
  const desc = $("#lkDesc").value.trim(), dev = num($("#lkDev"));
  const x = $("#lkX").value.trim(), web = $("#lkWeb").value.trim();
  const usd = SOL_USD || 0;
  const nc = $("#lkNameC"), tc = $("#lkTickC");
  nc.textContent = `${name.length}/32`; nc.classList.toggle("bad", name.length > 32);
  tc.textContent = `${tick.length}/10`; tc.classList.toggle("bad", tick.length > 10);
  $("#lkDescC").textContent = desc.length;
  $("#lkPrevName").textContent = name || "Your Coin";
  $("#lkPrevTick").textContent = `($${(tick || "TICKER").toUpperCase()})`;
  $("#lkPrevDesc").textContent = desc || "Your description shows here.";

  const b = curveBuy(0, dev, 0);
  const startSol = curvePriceAt(0) * CURVE.SUPPLY;
  $("#lkDevTok").textContent = fmtNum(b.tokens, 2);
  $("#lkDevPct").textContent = (b.tokens / CURVE.SUPPLY * 100).toFixed(2) + "% of supply";
  $("#lkStartMc").textContent = usd ? fmtUsd(startSol * usd) : fmtSol(startSol, 2);
  $("#lkStartMcSol").textContent = fmtSol(startSol, 2);
  $("#lkAfterMc").textContent = usd ? fmtUsd(b.mcAfterSol * usd) : fmtSol(b.mcAfterSol, 2);
  $("#lkAfterMcSol").textContent = fmtSol(b.mcAfterSol, 2);
  $("#lkPrevMc").textContent = usd ? fmtUsd(b.mcAfterSol * usd) : fmtSol(b.mcAfterSol, 2);

  const devPct = b.tokens / CURVE.SUPPLY * 100;
  const urlOk = (u) => /^https?:\/\/\S+\.\S+/.test(u);
  const checks = [
    [name.length > 0 && name.length <= 32, `Name is 1–32 characters`],
    [tick.length > 0 && tick.length <= 10, `Ticker is 1–10 characters`],
    [/^[A-Za-z0-9]+$/.test(tick), `Ticker is letters and numbers only`],
    [desc.length >= 10, `Description written`],
    [lkImgInfo && lkImgInfo.ok, lkImgInfo ? lkImgInfo.msg : `Image added (square, under 15MB)`, lkImgInfo && lkImgInfo.warn],
    [urlOk(x), `X link added`],
    [urlOk(web), `Website linked`],
    [devPct <= 5, devPct <= 5 ? `Dev buy ≤ 5% of supply (${devPct.toFixed(2)}%)` : `Dev buy is ${devPct.toFixed(2)}% of supply. Traders will notice`, devPct > 5 && devPct <= 10],
  ];
  const ok = checks.filter(c => c[0]).length;
  $("#lkChecks").innerHTML = checks.map(([g, t, w]) => `<li class="${g ? "ok" : w ? "warn" : ""}">${esc(t)}</li>`).join("");
  $("#lkScore").textContent = `${ok}/${checks.length}`;
  $("#lkStatus").textContent = ok === checks.length ? "READY" : "DRAFT";
}
function launchPost() {
  const name = $("#lkName").value.trim() || "My Coin";
  const tick = ($("#lkTick").value.trim().replace(/^\$/, "") || "TICKER").toUpperCase();
  const desc = $("#lkDesc").value.trim();
  const web = $("#lkWeb").value.trim();
  return `$${tick} is live on @pumpdotfun 🕹️\n\n${name}${desc ? " · " + desc : ""}\n\nCA: <paste CA>\n${web ? "\n🌐 " + web : ""}\n\nNo presale. No team allocation. Fair launch.`;
}

/* =========================================================
   CHECKLIST
   ========================================================= */
const CHECKS = [
  ["Top 10 holders under 30%", "Check holders on Solscan or Bubblemaps", 14],
  ["Dev wallet under 5%, not dumping", "Look at the creator's wallet activity", 12],
  ["No obvious bundle or sniper cluster", "Bubblemaps clusters, same-block buys", 12],
  ["RugCheck has no red flags", "Mint and freeze revoked, no danger warnings", 10],
  ["Real socials with real engagement", "Not a bot-filled X or an empty Telegram", 10],
  ["Not a copycat ticker", "Search the ticker. Is this the original?", 8],
  ["Clear narrative or meta", "Can you explain why it runs in one line?", 8],
  ["I know my exit before I enter", "Exit ladder planned above", 10],
  ["Position size ≤ what I can lose", "If it goes to zero, I'm fine", 10],
  ["Not FOMO-ing a vertical candle", "Waited for a dip or a consolidation", 6],
];
let ck = store.get("check", []);
function renderChecklist() {
  $("#ckList").innerHTML = CHECKS.map(([t, s, w], i) => `
    <li><label><input type="checkbox" data-i="${i}" ${ck.includes(i) ? "checked" : ""}/><span class="ck-box"></span>
    <span class="ck-text"><b>${t}</b><small>${s}</small></span><span class="ck-w">+${w}</span></label></li>`).join("");
  updateChecklist();
}
function updateChecklist() {
  const total = CHECKS.reduce((s, c) => s + c[2], 0);
  const got = ck.reduce((s, i) => s + (CHECKS[i]?.[2] || 0), 0);
  const pct = Math.round(got / total * 100);
  $("#ckFill").style.width = pct + "%";
  $("#ckFill").style.backgroundPosition = `${-pct * 3}px 0`;
  $("#ckStatus").textContent = `${ck.length}/${CHECKS.length}`;
  let g, m, c;
  if (!ck.length) { g = "—"; m = "Tick the boxes that check out."; c = "var(--orange)"; }
  else if (pct >= 85) { g = "CLEARED"; m = `${pct}% clear. You did the homework, so stick to your plan.`; c = "var(--lime)"; }
  else if (pct >= 60) { g = "CAUTION"; m = `${pct}% clear. A few gaps, so size down.`; c = "var(--yellow)"; }
  else { g = "NOT YET"; m = `${pct}% clear. Too many unknowns to insert.`; c = "var(--red)"; }
  const el = $("#ckGrade"); el.textContent = g; el.style.color = c;
  $("#ckMsg").textContent = m;
  store.set("check", ck);
}
function renderCheckLinks(ca) {
  $("#ckLinks").innerHTML = linkSet(ca).map(([n, u]) => `<a href="${u}" target="_blank" rel="noopener">${n} ↗</a>`).join("") + `<p class="fine" style="width:100%">Links for ${esc(short(ca))}</p>`;
}

/* =========================================================
   WATCHLIST
   ========================================================= */
let watchlist = store.get("watch", []);
function toggleWatch(r) {
  const i = watchlist.findIndex(w => w.ca === r.ca);
  if (i >= 0) { watchlist.splice(i, 1); toast("REMOVED FROM WATCHLIST"); }
  else {
    watchlist.unshift({ ca: r.ca, sym: r.pair.baseToken?.symbol || "?", name: r.pair.baseToken?.name || "", img: r.pair.info?.imageUrl || "", score0: r.score, mc0: r.mc, score1: null, mc1: null, at: Date.now() });
    watchlist = watchlist.slice(0, 40);
    toast("★ ADDED TO WATCHLIST");
  }
  store.set("watch", watchlist); renderWatch(); renderSession();
  $("#resWatch").textContent = watchlist.some(w => w.ca === r.ca) ? "★ Watching" : "★ Watch";
}
function renderWatch() {
  const tb = $("#wlTable tbody");
  $("#wlEmpty").hidden = watchlist.length > 0;
  $("#wlTable").style.display = watchlist.length ? "" : "none";
  $("#wlStatus").textContent = watchlist.length + (watchlist.length === 1 ? " SLOT" : " SLOTS");
  tb.innerHTML = watchlist.map((w, i) => {
    const d = w.score1 != null ? w.score1 - w.score0 : null;
    return `<tr>
      <td><div class="wl-coin">${w.img ? `<img src="${esc(w.img)}" alt="" loading="lazy"/>` : `<span class="ph"></span>`}<b>$${esc(w.sym)}</b></div></td>
      <td><button class="mini" data-copy="${esc(w.ca)}">${short(w.ca)}</button></td>
      <td><span class="sc" style="background:${scoreHex(w.score0)}">${w.score0}</span></td>
      <td>${w.score1 != null ? `<span class="sc" style="background:${scoreHex(w.score1)}">${w.score1}</span> <small class="${d > 0 ? "up" : d < 0 ? "down" : ""}">${d > 0 ? "+" : ""}${d}</small>` : "—"}</td>
      <td>${fmtUsd(w.mc0)}</td>
      <td>${w.mc1 != null ? `${fmtUsd(w.mc1)} <small class="${w.mc1 >= w.mc0 ? "up" : "down"}">${fmtPct((w.mc1 / w.mc0 - 1) * 100, 0)}</small>` : "—"}</td>
      <td><div class="acts"><button class="mini" data-scan="${esc(w.ca)}">scan</button><button class="mini" data-del="${i}">✕</button></div></td>
    </tr>`;
  }).join("");
}
async function rescanAll() {
  if (!watchlist.length) return;
  $("#wlStatus").textContent = "SCANNING…";
  for (const w of watchlist) {
    const r = await runScan(w.ca, { silent: true });
    if (r) { w.score1 = r.score; w.mc1 = r.mc; }
    renderWatch();
    await new Promise(res => setTimeout(res, 250)); // be polite to the public API
  }
  store.set("watch", watchlist); renderWatch(); toast("WATCHLIST UPDATED");
}

/* =========================================================
   SHARE CARD
   ========================================================= */
async function shareCard(r) {
  try { await Promise.all([document.fonts.load('40px "Insert Pixel"'), document.fonts.load('700 26px "Code"')]); } catch {}
  const c = $("#shareCanvas"), x = c.getContext("2d"), W = 1200, H = 630, v = verdictOf(r.score);
  const g = x.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#0e0826"); g.addColorStop(.6, "#22104f"); g.addColorStop(1, "#3a0c4e");
  x.fillStyle = g; x.fillRect(0, 0, W, H);
  // grid floor
  x.strokeStyle = "rgba(255,61,154,.35)"; x.lineWidth = 2;
  for (let i = 0; i < 12; i++) { const yy = 440 + i * i * 2.2; x.beginPath(); x.moveTo(0, yy); x.lineTo(W, yy); x.stroke(); }
  for (let i = -20; i <= 20; i++) { x.beginPath(); x.moveTo(W / 2 + i * 30, 440); x.lineTo(W / 2 + i * 140, H); x.stroke(); }
  // sun
  const sg = x.createLinearGradient(0, 120, 0, 440); sg.addColorStop(0, "#ffd23f"); sg.addColorStop(.5, "#ff8a3d"); sg.addColorStop(1, "#ff3d9a");
  x.save(); x.globalAlpha = .28; x.fillStyle = sg; x.beginPath(); x.arc(900, 440, 230, Math.PI, 0); x.fill(); x.restore();
  // frame
  x.strokeStyle = "#05020f"; x.lineWidth = 16; x.strokeRect(8, 8, W - 16, H - 16);
  x.strokeStyle = v.hex; x.lineWidth = 6; x.strokeRect(26, 26, W - 52, H - 52);
  const px = (s, sz, col, X, Y, al = "left") => { x.font = `${sz}px "Insert Pixel", monospace`; x.textAlign = al; x.fillStyle = "#05020f"; x.fillText(s, X + 5, Y + 5); x.fillStyle = col; x.fillText(s, X, Y); };
  px("INSERT SCORE", 32, "#2de2e6", 70, 110);
  px(String(r.score), 200, v.hex, 70, 330);
  px(v.label, 40, v.hex, 70, 410);
  const sym = "$" + (r.pair.baseToken?.symbol || "?").slice(0, 12).toUpperCase();
  px(sym, 48, "#ffffff", W - 70, 120, "right");
  x.font = `700 26px "Code", monospace`; x.textAlign = "right"; x.fillStyle = "#d9d2ff";
  x.fillText("MC " + fmtUsd(r.mc), W - 70, 180);
  x.fillText("1H " + fmtPct(r.ch?.h1), W - 70, 222);
  if (r.curve) x.fillText("CURVE " + r.curve.pct.toFixed(1) + "%", W - 70, 264);
  x.font = `400 20px "Code", monospace`; x.fillStyle = "#a99fd3"; x.textAlign = "left";
  x.fillText(short(r.ca) + " · " + new Date().toLocaleString(), 70, 470);
  px("SCANNED WITH INSERT · $INSERT", 24, "#ffd23f", 70, 560);
  px("NFA", 24, "#6f66a0", W - 70, 560, "right");
  const a = document.createElement("a");
  a.download = `insert-score-${(r.pair.baseToken?.symbol || "coin").toLowerCase()}.png`;
  a.href = c.toDataURL("image/png"); a.click();
  toast("SHARE CARD SAVED");
}

/* =========================================================
   WIRING
   ========================================================= */
function bind() {
  // nav
  $("#burger").onclick = () => { const o = $("#navLinks").classList.toggle("open"); $("#burger").setAttribute("aria-expanded", o); };
  $$("#navLinks a").forEach(a => a.onclick = () => $("#navLinks").classList.remove("open"));
  $("#heroInsert").onclick = () => { $("#heroScene").scrollIntoView({ behavior: "smooth", block: "center" }); Scene.insert(); };

  // scanner
  $("#scanForm").onsubmit = (e) => { e.preventDefault(); runScan($("#scanInput").value); };
  $("#scanInput").addEventListener("paste", () => setTimeout(() => { if (extractCA($("#scanInput").value)) runScan($("#scanInput").value); }, 30));
  $("#recent").onclick = (e) => { const b = e.target.closest("button[data-ca]"); if (b) { $("#scanInput").value = b.dataset.ca; runScan(b.dataset.ca); } };
  $("#resCopy").onclick = () => lastScan && copy(lastScan.ca, "CA COPIED!");
  $("#resWatch").onclick = () => lastScan && toggleWatch(lastScan);
  $("#resShare").onclick = () => lastScan && shareCard(lastScan);
  $("#resCurve").onclick = () => { $("#curve").scrollIntoView({ behavior: "smooth" }); };
  $("#resExit").onclick = () => {
    if (lastScan?.mc) { $("#exMc").value = Math.round(lastScan.mc); $("#exSol").value = $("#cvSol").value; renderExit(); }
    $("#exit").scrollIntoView({ behavior: "smooth" });
  };

  // curve
  ["#cvPos", "#cvSol", "#cvFee", "#cvSolUsd", "#cvSlip"].forEach(id => $(id).addEventListener("input", renderCurve));
  $("#cvSolUsd").addEventListener("input", e => { e.target.dataset.touched = 1; });
  $("#cvPresets").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; $("#cvSol").value = b.dataset.sol; $$("#cvPresets button").forEach(x => x.classList.toggle("on", x === b)); renderCurve(); };

  // exit
  ["#exMc", "#exSol", "#exStop", "#exSolUsd"].forEach(id => $(id).addEventListener("input", renderExit));
  $("#exSolUsd").addEventListener("input", e => { e.target.dataset.touched = 1; });
  $("#ladder").addEventListener("input", (e) => { const i = e.target.dataset.i; if (i == null) return; ladder[i][e.target.dataset.k] = parseFloat(e.target.value) || 0; renderExit(); });
  $("#ladder").addEventListener("click", (e) => { const b = e.target.closest("[data-rm]"); if (!b) return; ladder.splice(+b.dataset.rm, 1); renderLadder(); renderExit(); });
  $("#exAdd").onclick = () => { if (ladder.length >= 8) return toast("MAX 8 LEVELS", true); const last = ladder[ladder.length - 1]; ladder.push({ m: last ? +(last.m * 2).toFixed(1) : 2, s: 10 }); renderLadder(); renderExit(); };
  $("#exPresets").onclick = (e) => { const b = e.target.closest("button"); if (!b) return; ladder = PRESETS[b.dataset.preset].map(([m, s]) => ({ m, s })); renderLadder(); renderExit(); };

  // launch
  ["#lkName", "#lkTick", "#lkDesc", "#lkDev", "#lkX", "#lkWeb", "#lkTg"].forEach(id => $(id).addEventListener("input", renderLaunch));
  $("#lkImg").onchange = (e) => {
    const f = e.target.files[0]; if (!f) return;
    const okType = /image\/(png|jpe?g|gif|webp)/.test(f.type), mb = f.size / 1048576;
    const url = URL.createObjectURL(f);
    const im = new Image();
    im.onload = () => {
      const sq = Math.abs(im.width - im.height) <= Math.max(im.width, im.height) * 0.02;
      const ok = okType && mb <= 15;
      lkImgInfo = { ok: ok && sq, warn: ok && !sq, msg: !okType ? "Image must be PNG, JPG, GIF or WEBP" : mb > 15 ? `Image is ${mb.toFixed(1)}MB, over the 15MB limit` : sq ? `Image ${im.width}×${im.height}, ${mb.toFixed(2)}MB` : `Image is ${im.width}×${im.height}. Square (1:1) looks best` };
      const pi = $("#lkPrevImg"); pi.style.backgroundImage = `url("${url}")`; pi.textContent = "";
      renderLaunch();
    };
    im.src = url;
  };
  $("#lkCopyPost").onclick = () => copy(launchPost(), "LAUNCH POST COPIED!");

  // checklist
  $("#ckList").addEventListener("change", (e) => { const i = +e.target.dataset.i; ck = e.target.checked ? [...new Set([...ck, i])] : ck.filter(x => x !== i); updateChecklist(); });
  $("#ckReset").onclick = () => { ck = []; renderChecklist(); };

  // watchlist
  $("#wlRescan").onclick = rescanAll;
  $("#wlClear").onclick = () => { if (!watchlist.length) return; watchlist = []; store.set("watch", watchlist); renderWatch(); renderSession(); toast("WATCHLIST CLEARED"); };
  $("#wlTable").onclick = (e) => {
    const s = e.target.closest("[data-scan]"), d = e.target.closest("[data-del]"), c = e.target.closest("[data-copy]");
    if (s) { $("#scanInput").value = s.dataset.scan; $("#scan").scrollIntoView({ behavior: "smooth" }); runScan(s.dataset.scan); }
    if (d) { watchlist.splice(+d.dataset.del, 1); store.set("watch", watchlist); renderWatch(); renderSession(); }
    if (c) copy(c.dataset.copy, "CA COPIED!");
  };

  // keyboard: Insert key jumps to scanner; Konami = coin rain
  const k = ["ArrowUp", "ArrowUp", "ArrowDown", "ArrowDown", "ArrowLeft", "ArrowRight", "ArrowLeft", "ArrowRight", "b", "a"]; let ki = 0;
  document.addEventListener("keydown", (e) => {
    if (e.key === "Insert") { e.preventDefault(); $("#scan").scrollIntoView({ behavior: "smooth" }); setTimeout(() => $("#scanInput").focus({ preventScroll: true }), 500); }
    ki = (e.key === k[ki] || e.key.toLowerCase() === k[ki]) ? ki + 1 : 0;
    if (ki === k.length) { ki = 0; coinRain(); }
  });
}
function coinRain() {
  toast("+30 CREDITS · CHEAT ACTIVATED");
  session.credits = 99; saveSession();
  for (let i = 0; i < 40; i++) {
    const c = document.createElement("div"); c.className = "confetti";
    c.style.left = Math.random() * 100 + "vw"; c.style.animationDuration = 1.6 + Math.random() * 1.6 + "s"; c.style.animationDelay = Math.random() * .8 + "s";
    document.body.appendChild(c); setTimeout(() => c.remove(), 4200);
  }
}

/* ---------- boot ---------- */
document.documentElement.classList.remove("no-js");
initConfig();
bind();
initReveal();
initNav();
initContinue();
try { Scene.init($("#heroScene"), onCoinInserted); } catch (e) { console.warn(e); }
renderSession();
renderRecent();
renderLadder();
renderCurve();
renderExit();
renderLaunch();
renderChecklist();
renderWatch();
loadSolPrice();
