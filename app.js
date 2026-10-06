/* app.js — 야후 멀티시간대(30m/1h/4h/1D) 알리미 (키/PC 불필요) */
(function () {
  const $ = id => document.getElementById(id);
  const feed = new Feed30m.Feed30m();
  const TFS = Feed30m.TFS;
  const TF_LABEL = { "1m": "1분", "3m": "3분", "5m": "5분", "15m": "15분", "30m": "30분", "1h": "1시간", "4h": "4시간", "1D": "1일" };

  // 첨부 관심종목.txt 기본 탑재 (첫 실행·버전업 시 자동 등록, 중복은 첫 이름 유지)
  const SYMVER = 4;
  const DEFAULT_SYMS = [
    { id: "KOSPI", name: "KOSPI" }, { id: "KOSPI200", name: "KOSPI200" }, { id: "KOSDAQ", name: "KOSDAQ" },
    { id: "COMP", name: "나스닥 종합" }, { id: "US100", name: "나스닥100" }, { id: "NDX", name: "나스닥100" }, { id: "IXIC", name: "나스닥종합" },
    { id: "102110", name: "TIGER200" }, { id: "069500", name: "코덱스200" }, { id: "148020", name: "RISE200" },
    { id: "395270", name: "HANARO Fn-K반도체" }, { id: "396500", name: "TIGER반도체TOP10" },
    { id: "476260", name: "HANARO 반도체핵심공정주도주" }, { id: "471990", name: "KODEX AI반도체핵심장비" },
    { id: "471760", name: "TIGER AI 반도체핵심공정" }, { id: "482030", name: "KoAct 반도체&2차전지핵심소재액티브" },
    { id: "232080", name: "TIGER 코스닥150" }, { id: "261060", name: "TIGER 코스닥150IT" },
    { id: "123310", name: "TIGER 타이거인버스" }, { id: "114800", name: "KODEX 인버스" },
    { id: "337140", name: "KODEX 대형주" }, { id: "277640", name: "TIGER 대형주" },
    { id: "448300", name: "TIGER 나스닥100(H)" }, { id: "449190", name: "KODEX 나스닥100(H)" }, { id: "453080", name: "KIWOOM 나스닥100(H)" },
    { id: "133690", name: "TIGER 미국나스닥100" }, { id: "379810", name: "KODEX 미국나스닥100" }, { id: "426030", name: "TIME 미국나스닥100액티브" },
    { id: "448290", name: "S&P500(H)" }, { id: "449180", name: "S&P500(H)" },
    { id: "466920", name: "SOL 조선" }, { id: "228790", name: "TIGER 화장품" }, { id: "449450", name: "한화 플러스 방산" },
    { id: "161510", name: "PLUS 고배당" }, { id: "004380", name: "TIGER 머니마켓액티브" }, { id: "458730", name: "TIGER 미국배당다우존스" },
    { id: "091160", name: "KODEX 반도체" },
    { id: "139230", name: "TIGER 200 중공업" }, { id: "465580", name: "ACE미국빅테크TOP7 PLUS" }, { id: "487240", name: "KODEX AI전력핵심설비" },
    { id: "139270", name: "TIGER 200 금융" }, { id: "139240", name: "TIGER 200 철강강관" }, { id: "117460", name: "KODEX 에너지화학" },
    { id: "139250", name: "TIGER 200 에너지화학" }, { id: "229200", name: "KODEX 코스닥150" }, { id: "266390", name: "KODEX 경기소비재" },
    { id: "266420", name: "KODEX 헬스케어" }, { id: "453640", name: "KODEX 미국S&P500헬스케어" }, { id: "227560", name: "TIGER200 생활소비재" },
    { id: "266410", name: "KODEX 필수소비재" }, { id: "453630", name: "KODEX 미국S&P500필수소비재" }, { id: "453660", name: "KODEX 미국S&P500경기소비재" },
    { id: "139290", name: "TIGER200 경기소비재" }, { id: "252670", name: "KODEX 200선물인버스2X" },
    { id: "360750", name: "TIGER 미국S&P500" }, { id: "379800", name: "KODEX 미국S&P500" }, { id: "314250", name: "KODEX 미국빅테크10(H)" },
    { id: "381180", name: "TIGER 미국필라델피아반도체나스닥" }, { id: "487230", name: "KODEX 미국AI전력인프라" }, { id: "203780", name: "TIGER 미국나스닥바이오" },
    { id: "494840", name: "TIGER 미국방산" }, { id: "446720", name: "SOL 미국배당다우존스" },
    { id: "0008S0", name: "TIGER 미국배당다우존스타겟데일리커버드콜" },
    { id: "476550", name: "KODEX 미국30년국채타겟커버드콜(H)" },
    { id: "0238P0", name: "TIGER 미국S&P500미국채혼합50" },
    { id: "373590", name: "TIGER 미국S&P500채권혼합3070" }, { id: "485230", name: "ACE 미국S&P500채권혼합4060" },
    { id: "484120", name: "KODEX 미국나스닥100TR채권혼합4060" }, { id: "483320", name: "SOL 미국배당다우존스채권혼합50" },
    { id: "0131V0", name: "1Q미국우주항공테크" }, { id: "0181L0", name: "SOL미국우주항공TOP10" },
    { id: "0207G0", name: "SOL우주항공밸류체인" }, { id: "421320", name: "PLUS우주항공" },
    { id: "BTC/KRW", name: "비트코인" }, { id: "ETH/KRW", name: "이더리움" },
    { id: "SOL/KRW", name: "솔라나" }, { id: "XRP/KRW", name: "엑스알피" },
  ];

  // ---------- 상태 ----------
  let symbol = "";
  let tf = S_load("tf", "30m");
  if (!TFS[tf]) tf = "30m";
  let bars = [];
  let ind = null;
  let unsub = null;
  let follow = true, perRow = 9, offset = 0;
  const fired = new Set(); // symbol@tf@barTime@type
  const buyMarks = new Map(); // key -> {symId, tfKey, barTime, type, price} — 차트 매수 라벨용
  let markIdx = null; // {bars, map} 시간→인덱스 캐시
  function S_load(k, d) { try { const v = localStorage.getItem("a30_" + k); return v == null ? d : JSON.parse(v); } catch (_) { return d; } }
  function S_save(k, v) { try { localStorage.setItem("a30_" + k, JSON.stringify(v)); } catch (_) {} }

  // ---------- 로그 ----------
  function log(m) {
    const el = $("log"), d = document.createElement("div");
    d.textContent = `${new Date().toLocaleTimeString()} ${m}`;
    el.prepend(d);
    while (el.children.length > 80) el.lastChild.remove();
  }
  feed.onLog = log;
  window.addEventListener("error", e => log("JS오류: " + (e.message || e)));

  // ---------- 탭 ----------
  document.querySelectorAll(".tabbar button").forEach(b => {
    b.onclick = () => {
      document.body.classList.toggle("lock", b.dataset.page === "page-chart");
      document.querySelectorAll(".tabbar button").forEach(x => x.classList.toggle("active", x === b));
      document.querySelectorAll(".page").forEach(p => p.classList.toggle("active", p.id === b.dataset.page));
      if (b.dataset.page === "page-chart") draw();
    };
  });
  document.body.classList.add("lock"); // 시작 페이지는 차트(고정)

  // ---------- 사운드 (WebAudio 부드러운 음 2종, 음성 없음) ----------
  let actx = null;
  function tone(freq, dur, delay, vol) {
    try {
      actx = actx || new (window.AudioContext || window.webkitAudioContext)();
      if (actx.state === "suspended") actx.resume();
      const t = actx.currentTime + (delay || 0);
      const o = actx.createOscillator(), g = actx.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(vol || 0.25, t + 0.03);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
      o.connect(g); g.connect(actx.destination);
      o.start(t); o.stop(t + dur + 0.05);
    } catch (_) {}
  }
  function playAlert(type) {
    const mode = $("pSnd").value || "short";
    if (mode === "long") { tone(523, 0.3, 0, 0.22); tone(784, 0.45, 0.28, 0.22); }
    else if (mode === "short") { tone(880, 0.14, 0, 0.2); }
    if ($("pVibrate").checked && navigator.vibrate) { try { navigator.vibrate([120]); } catch (_) {} }
  }
  async function notify(title, body) {
    if (!$("pNotify").checked) return;
    try {
      if (!("Notification" in window)) return;
      if (Notification.permission === "default") await Notification.requestPermission();
      if (Notification.permission === "granted") new Notification(title, { body });
    } catch (_) {}
  }
  let wakeLock = null;
  async function keepAwake() {
    if (!$("pWake").checked) { try { wakeLock && wakeLock.release(); } catch (_) {} wakeLock = null; return; }
    try { wakeLock = await navigator.wakeLock.request("screen"); } catch (_) {}
  }

  // ---------- 파라미터 ----------
  function params() {
    const maLengths = $("pMA").value.split(",").map(s => parseInt(s.trim(), 10)).filter(n => n >= 2 && n <= 400);
    return {
      pcLen: Math.max(5, Math.min(200, +$("pPCLen").value || 20)),
      bbN: Math.max(5, Math.min(200, +$("pBBN").value || 20)),
      bbK: Math.max(1, Math.min(3, +$("pBBK").value || 2)),
      maLengths: maLengths.length ? maLengths : [20, 60, 100, 200],
      volN: Math.max(5, Math.min(120, +$("pVolN").value || 20)),
      volK: Math.max(1, Math.min(10, +$("pVolK").value || 2)),
      enabled: { PC: $("cPC").checked, BB: $("cBB").checked, MA200: $("cMA200").checked, VOL: $("cVol").checked },
    };
  }
  function watchTFs() {
    const out = [];
    if ($("w1m").checked) out.push("1m");
    if ($("w3m").checked) out.push("3m");
    if ($("w5m").checked) out.push("5m");
    if ($("w15m").checked) out.push("15m");
    if ($("w30m").checked) out.push("30m");
    if ($("w1h").checked) out.push("1h");
    if ($("w4h").checked) out.push("4h");
    if ($("w1D").checked) out.push("1D");
    return out.length ? out : ["30m"];
  }
  function persistParams() {
    S_save("params", { pc: $("pPCLen").value, bbn: $("pBBN").value, bbk: $("pBBK").value, ma: $("pMA").value, voln: $("pVolN").value, volk: $("pVolK").value, cpc: $("cPC").checked, cbb: $("cBB").checked, cma: $("cMA200").checked, cvol: $("cVol").checked, scan: $("pScanSec").value, poll: $("pollSec").value, w: watchTFs(), snd: $("pSnd").value });
  }
  function restoreParams() {
    const p = S_load("params", null);
    if (!p) return;
    $("pPCLen").value = p.pc || 20; $("pBBN").value = p.bbn || 20; $("pBBK").value = p.bbk || 2;
    $("pMA").value = p.ma || "20,60,100,200"; $("pVolN").value = p.voln || 20; $("pVolK").value = p.volk || 2;
    $("cPC").checked = p.cpc !== false; $("cBB").checked = p.cbb !== false;
    $("cMA200").checked = p.cma !== false; $("cVol").checked = p.cvol === true;
    if (p.scan) $("pScanSec").value = p.scan;
    if (p.poll) $("pollSec").value = p.poll;
    if (p.snd) $("pSnd").value = p.snd;
    if (p.w) { $("w1m").checked = p.w.includes("1m"); $("w3m").checked = p.w.includes("3m"); $("w5m").checked = p.w.includes("5m"); $("w15m").checked = p.w.includes("15m"); $("w30m").checked = p.w.includes("30m"); $("w1h").checked = p.w.includes("1h"); $("w4h").checked = p.w.includes("4h"); $("w1D").checked = p.w.includes("1D"); }
  }

  // ---------- 차트 (Canvas, 터치 팬/줌) ----------
  const cv = $("chart"), ctx = cv.getContext("2d");
  let dpr = 1;
  function resize() {
    const r = $("chartWrap").getBoundingClientRect();
    dpr = Math.min(2, window.devicePixelRatio || 1);
    cv.width = Math.max(1, Math.round(r.width * dpr));
    cv.height = Math.max(1, Math.round(r.height * dpr));
    draw();
  }
  new ResizeObserver(resize).observe($("chartWrap"));
  window.addEventListener("resize", resize);

  let dragX = null, dragOff = 0, pinchD = 0, pinchPR = 0;
  let downT = 0, downX = 0, downY = 0, flingOff = false;
  let hDrag = null; // {startY, startH, dir} 차트 높이 조절 중
  function chartHMin() { return 126; }
  function chartHMax() { return Math.round(window.innerHeight * 0.75); }
  function applyChartH(px, save) {
    const wrap = $("chartWrap");
    const h = Math.min(chartHMax(), Math.max(chartHMin(), Math.round(px)));
    wrap.style.height = h + "px";
    if (save) { try { localStorage.setItem("a30_charth", String(h)); } catch (_) {} }
  }
  try {
    const savedH = parseInt(localStorage.getItem("a30_charth") || "", 10);
    if (savedH >= chartHMin()) $("chartWrap").style.height = Math.min(chartHMax(), savedH) + "px";
  } catch (_) {}
  // 구분선 드래그: 아래로 밀면 차트 커짐
  (function () {
    const rz = $("resizer");
    let sy = 0, sh = 0, on = false;
    rz.addEventListener("pointerdown", e => { on = true; sy = e.clientY; sh = $("chartWrap").getBoundingClientRect().height; rz.setPointerCapture(e.pointerId); });
    rz.addEventListener("pointermove", e => { if (on) applyChartH(sh + (e.clientY - sy), true); });
    rz.addEventListener("pointerup", () => { on = false; });
    rz.addEventListener("dblclick", () => { $("chartWrap").style.height = ""; try { localStorage.removeItem("a30_charth"); } catch (_) {} });
  })();
  cv.addEventListener("pointerdown", e => {
    const r = cv.getBoundingClientRect();
    // 가격축(오른쪽 58px)을 잡으면 높이 조절 모드: 아래로 쓸면 낮아짐
    if (e.clientX - r.left > r.width - 58) {
      hDrag = { startY: e.clientY, startH: $("chartWrap").getBoundingClientRect().height };
      dragX = null; flingOff = true;
      cv.setPointerCapture(e.pointerId);
      return;
    }
    dragX = e.clientX; dragOff = offset; downT = Date.now(); downX = e.clientX; downY = e.clientY; flingOff = false; cv.setPointerCapture(e.pointerId);
  });
  cv.addEventListener("pointermove", e => {
    if (hDrag) { applyChartH(hDrag.startH - (e.clientY - hDrag.startY), true); return; }
    if (dragX == null) return;
    // 손가락을 따라 차트가 같이 밀리도록 (오른쪽으로 밀면 과거로, 왼쪽 한계 -8 미래공간)
    offset = Math.min(bars.length + 7, Math.max(-8, Math.round(dragOff + (e.clientX - dragX) / perRow)));
    follow = false; $("btnFollow").classList.remove("active");
    draw();
  });
  cv.addEventListener("pointerup", e => {
    hDrag = null;
    dragX = null;
    // 빠른 좌우 플릭이면 관심종목 이전/다음으로 전환 (천천히 밀면 팬 유지)
    if (!flingOff) {
      const dt = Date.now() - downT, dx = e.clientX - downX, dy = e.clientY - downY;
      if (dt < 350 && Math.abs(dx) > 70 && Math.abs(dy) < 50 && feed.symbols.length > 1) {
        const i = feed.symbols.findIndex(s => s.id === symbol);
        const n = feed.symbols.length;
        const next = feed.symbols[(i + (dx < 0 ? 1 : n - 1)) % n];
        if (next && next.id !== symbol) selectSymbol(next.id);
      }
    }
  });
  cv.addEventListener("wheel", e => { e.preventDefault(); perRow = Math.min(40, Math.max(4, perRow * (e.deltaY > 0 ? 1.1 : 0.9))); draw(); }, { passive: false });
  cv.addEventListener("touchstart", e => { if (e.touches.length === 2) { dragX = null; pinchD = 0; flingOff = true; } }, { passive: true });
  cv.addEventListener("touchmove", e => {
    if (e.touches.length === 2) {
      e.preventDefault();
      const d = Math.hypot(e.touches[0].clientX - e.touches[1].clientX, e.touches[0].clientY - e.touches[1].clientY);
      // 벌리면 확대(봉이 굵어짐), 오므리면 축소
      if (pinchD) perRow = Math.min(40, Math.max(4, pinchPR * d / pinchD));
      else { pinchD = d; pinchPR = perRow; }
      draw();
    }
  }, { passive: false });
  cv.addEventListener("touchend", () => { pinchD = 0; });

  const MA_COLORS = ["#ffeb3b", "#ff9800", "#ab47bc", "#42a5f5"];
  function draw() {
    const W = cv.width, H = cv.height;
    ctx.clearRect(0, 0, W, H);
    if (!bars.length) {
      ctx.fillStyle = "#7d8aa3"; ctx.font = `${13 * dpr}px sans-serif`;
      ctx.fillText("종목을 선택하세요 (야후 " + tf + ")", 16 * dpr, 30 * dpr);
      return;
    }
    const axisH = 20 * dpr, axisW = 58 * dpr, bodyH = H - axisH, plotW = W - axisW;
    const PAD = 3, MAXFUT = 8; // 오른쪽 여백 봉 수·미래 팬 한계
    const L = bars.length + PAD;
    const n = Math.min(L + MAXFUT, Math.floor(plotW / dpr / perRow) + 5);
    const end = Math.min(L + MAXFUT, Math.max(n, L - offset));
    const start = end - n;
    const slot = j => { const idx = start + j; return (idx >= 0 && idx < bars.length) ? bars[idx] : null; };
    let hasData = false;
    for (let j = 0; j < n; j++) { if (slot(j)) { hasData = true; break; } }
    if (!hasData) return;
    let hi = -Infinity, lo = Infinity, vmax = 1;
    for (let j = 0; j < n; j++) { const b = slot(j); if (!b) continue; hi = Math.max(hi, b.high); lo = Math.min(lo, b.low); vmax = Math.max(vmax, b.volume); }
    const pad = (hi - lo) * 0.08 || 1; hi += pad; lo -= pad;
    const volH = bodyH * 0.16, priceH = bodyH - volH - 8 * dpr;
    const y = p => priceH - (p - lo) / (hi - lo) * priceH;
    const baseY = bodyH; // 거래량 바닥 = 시간축 위
    const stepX = plotW / n;
    const p = params();

    ctx.strokeStyle = "#1e2a44"; ctx.lineWidth = 1;
    for (let g = 0; g < 4; g++) { const gy = priceH * (g + 1) / 5; ctx.beginPath(); ctx.moveTo(0, gy); ctx.lineTo(W, gy); ctx.stroke(); }

    for (let i = 0; i < n; i++) {
      const b = slot(i);
      if (!b) continue;
      const x = (i + 0.5) * stepX;
      const up = b.close >= b.open;
      ctx.strokeStyle = ctx.fillStyle = up ? "#26a69a" : "#ef5350";
      const bw = Math.max(2, stepX * 0.6);
      ctx.beginPath(); ctx.moveTo(x, y(b.high)); ctx.lineTo(x, y(b.low)); ctx.stroke();
      const yO = y(b.open), yC = y(b.close);
      ctx.fillRect(x - bw / 2, Math.min(yO, yC), bw, Math.max(1, Math.abs(yC - yO)));
      if ($("tglVol").checked) {
        const vh = (b.volume / vmax) * volH;
        ctx.globalAlpha = 0.55;
        ctx.fillRect(x - bw / 2, baseY - vh, bw, vh);
        ctx.globalAlpha = 1;
      }
    }

    const gi = start;
    function line(arr, color, dash, wMul) {
      ctx.strokeStyle = color; ctx.lineWidth = Math.max(1, 1.2 * dpr) * (wMul || 1); ctx.setLineDash(dash || []);
      ctx.beginPath(); let started = false;
      for (let i = 0; i < n; i++) {
        const v = arr[gi + i];
        if (v == null) { started = false; continue; }
        const x = (i + 0.5) * stepX, yy = y(v);
        if (!started) { ctx.moveTo(x, yy); started = true; } else ctx.lineTo(x, yy);
      }
      ctx.stroke(); ctx.setLineDash([]);
    }
    if (ind) {
      if ($("tglMA").checked) {
        p.maLengths.forEach((len, k) => line(ind.mas[len] || [], MA_COLORS[k % MA_COLORS.length]));
        // 100/200 라벨 (선 오른쪽 끝)
        ctx.font = `bold ${10 * dpr}px sans-serif`;
        p.maLengths.forEach((len, k) => {
          if (len !== 100 && len !== 200) return;
          const arr = ind.mas[len] || [];
          let li = Math.min(arr.length - 1, gi + n - 1);
          while (li >= gi && arr[li] == null) li--;
          if (li < gi) return;
          const tx = String(len), col = MA_COLORS[k % MA_COLORS.length];
          const tw = ctx.measureText(tx).width + 8 * dpr;
          const ty = Math.min(Math.max(y(arr[li]), 9 * dpr), priceH - 4 * dpr);
          ctx.fillStyle = "#0b1220cc";
          ctx.fillRect(plotW - tw - 2 * dpr, ty - 9 * dpr, tw, 18 * dpr);
          ctx.fillStyle = col;
          ctx.fillText(tx, plotW - tw + 2 * dpr, ty + 3.5 * dpr);
        });
      }
      if ($("tglBB").checked) { line(ind.bb.up, "#ffffff", null, 2); line(ind.bb.dn, "#ffffff", null, 2); }
      if ($("tglPC").checked) { line(ind.pc.up, "#ffb300", null, 3); line(ind.pc.dn, "#ffb300", null, 3); }
      if ($("tglVol").checked) {
        // 거래량 20 이평 (고정)
        const vma20 = Indicators.sma(bars.map(b => b.volume), 20);
        ctx.strokeStyle = "#e0e0e0"; ctx.lineWidth = Math.max(1, 1 * dpr);
        ctx.beginPath(); let started = false;
        for (let i = 0; i < n; i++) {
          const v = vma20[gi + i];
          if (v == null) { started = false; continue; }
          const x = (i + 0.5) * stepX, yy = baseY - (v / vmax) * volH;
          if (!started) { ctx.moveTo(x, yy); started = true; } else ctx.lineTo(x, yy);
        }
        ctx.stroke();
      }
    }
    const last = bars[bars.length - 1];
    const upLast = last.close >= last.open;
    // 종목 워터마크 (거래량 위, 영역 추가 없이 한 줄·자동 글자크기)
    (function () {
      const m = feed.symbols.find(s => s.id === symbol);
      const base = m ? ((m.name && m.name !== m.id) ? `${m.id} ${m.name}` : m.id) : symbol;
      if (!base) return;
      const lh = lastHits.get(symbol);
      const TN = { PC: "PC하단", BB: "BB하단", MA200: "MA200", VOL: "거래량↑" };
      const TCOL = { PC: "#ffb300", BB: "#5c9dff", MA200: "#ce93d8", VOL: "#4db6ac" };
      const suffix = lh ? ` · ${TN[lh.type] || lh.type}[${lh.tfKey}]` : "";
      let fs = 13 * dpr, ss = 16 * dpr;
      ctx.font = `${fs}px sans-serif`;
      const bw0 = ctx.measureText(base).width;
      ctx.font = `bold ${ss}px sans-serif`;
      const sw0 = suffix ? ctx.measureText(suffix).width : 0;
      const wmax = plotW - 16 * dpr;
      if (bw0 + sw0 > wmax) {
        const k = Math.max(8 * dpr / ss, wmax / (bw0 + sw0));
        fs *= k; ss *= k;
      }
      const ty = baseY - volH - 6 * dpr;
      const bw1 = ctx.measureText(base).width;
      ctx.font = `bold ${ss}px sans-serif`;
      const sw1 = suffix ? ctx.measureText(suffix).width : 0;
      const x0 = Math.max(4 * dpr, (plotW - bw1 - sw1) / 2); // 가로 가운데
      ctx.save();
      ctx.globalAlpha = 0.7; ctx.textAlign = "left";
      ctx.font = `${fs}px sans-serif`; ctx.fillStyle = "#fff";
      ctx.fillText(base, x0, ty);
      if (suffix) {
        ctx.font = `bold ${ss}px sans-serif`;
        ctx.fillStyle = TCOL[lh.type] || "#ffb300";
        ctx.fillText(suffix, x0 + bw1, ty);
      }
      ctx.restore();
    })();
    ctx.strokeStyle = upLast ? "#26a69a" : "#ef5350";
    ctx.setLineDash([4 * dpr, 3 * dpr]);
    ctx.beginPath(); ctx.moveTo(0, y(last.close)); ctx.lineTo(plotW, y(last.close)); ctx.stroke();
    ctx.setLineDash([]);
    // 오른쪽 가격축
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(plotW, 0, axisW, bodyH);
    ctx.strokeStyle = "#1e2a44"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(plotW, 0); ctx.lineTo(plotW, bodyH); ctx.stroke();
    ctx.font = `${10 * dpr}px sans-serif`; ctx.textAlign = "left";
    for (let g = 0; g <= 4; g++) {
      const pv = hi - (hi - lo) * g / 4, yy = y(pv);
      if (yy < 0 || yy > bodyH) continue;
      ctx.fillStyle = "#7d8aa3";
      ctx.fillText(fmtPx(pv), plotW + 5 * dpr, yy + 3.5 * dpr);
    }
    // 마지막가 태그
    const ly = Math.min(Math.max(y(last.close), 9 * dpr), bodyH - 9 * dpr);
    ctx.fillStyle = upLast ? "#26a69a" : "#ef5350";
    const tag = fmtPx(last.close);
    const tw = ctx.measureText(tag).width + 10 * dpr;
    ctx.fillRect(W - tw, ly - 9 * dpr, tw, 18 * dpr);
    ctx.fillStyle = "#fff";
    ctx.fillText(tag, W - tw + 5 * dpr, ly + 3.5 * dpr);
    ctx.fillStyle = "#d5dce8"; ctx.font = `${11 * dpr}px sans-serif`;
    ctx.fillText(fmtT(last.time) + " " + tf + " · 야후", 8 * dpr, 14 * dpr);
    // 하단 시간축 (날짜·시간)
    ctx.fillStyle = "#0b1220";
    ctx.fillRect(0, bodyH, W, axisH);
    ctx.strokeStyle = "#1e2a44"; ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(0, bodyH); ctx.lineTo(W, bodyH); ctx.stroke();
    ctx.fillStyle = "#7d8aa3"; ctx.font = `${10 * dpr}px sans-serif`; ctx.textAlign = "center";
    const ticks = Math.max(2, Math.min(5, Math.floor(W / dpr / 90)));
    for (let k = 1; k <= ticks; k++) {
      const i = Math.min(n - 1, Math.floor(n * k / (ticks + 0.5)) - 1);
      if (i < 0) continue;
      const b = slot(i);
      if (!b) continue;
      const x = (i + 0.5) * stepX;
      ctx.strokeStyle = "#16203a";
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, bodyH); ctx.stroke();
      ctx.fillText(fmtAxis(b.time), Math.min(Math.max(x, 30 * dpr), plotW - 30 * dpr), bodyH + 14 * dpr);
    }
    ctx.textAlign = "left";
    // 신호 자리 매수 라벨 (맨 위에 그려 가려지지 않게)
    if (buyMarks.size) {
      if (!markIdx || markIdx.bars !== bars) {
        const m = new Map();
        bars.forEach((b, bi) => m.set(b.time, bi));
        markIdx = { bars, map: m };
      }
      const MCOL = { PC: "#b78a00", BB: "#2f6fdd", MA200: "#8e3aa8", VOL: "#1e8e7e" };
      ctx.font = `bold ${10 * dpr}px sans-serif`;
      ctx.textAlign = "left";
      buyMarks.forEach(mk => {
        if (mk.symId !== symbol || mk.tfKey !== tf) return;
        const bi = markIdx.map.get(mk.barTime);
        if (bi == null) return;
        const vi = bi - gi;
        if (vi < 0 || vi >= n) return;
        const label = "매수";
        const tw = ctx.measureText(label).width + 10 * dpr;
        const bx = Math.min(Math.max((vi + 0.5) * stepX, tw / 2 + 2 * dpr), plotW - tw / 2 - 2 * dpr);
        const by = Math.min(y(mk.price) + 4 * dpr, priceH - 2 * dpr);
        ctx.fillStyle = MCOL[mk.type] || "#2962ff";
        ctx.fillRect(bx - tw / 2, by, tw, 16 * dpr);
        ctx.fillStyle = "#fff";
        ctx.fillText(label, bx - tw / 2 + 5 * dpr, by + 12 * dpr);
      });
    }
  }
  function fmtPx(v) {
    if (v >= 1000) return Math.round(v).toLocaleString("ko-KR");
    if (v >= 10) return v.toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    return String(Math.round(v * 100) / 100);
  }
  function fmtAxis(t) {
    const d = new Date(t * 1000);
    const md = `${d.getMonth() + 1}/${d.getDate()}`;
    if (tf === "1D") return md;
    return `${md} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  function fmtT(t) {
    const d = new Date(t * 1000);
    if (tf === "1D") return `${d.getMonth() + 1}/${d.getDate()}`;
    return `${d.getMonth() + 1}/${d.getDate()} ${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  }

  // ---------- 알림 기록/발동 ----------
  function alertLog(msg, kind) {
    const el = $("alertLog"), d = document.createElement("div");
    d.className = "alert-item " + (kind || "");
    d.textContent = `${new Date().toLocaleTimeString()} ${msg}`;
    el.prepend(d);
    el.scrollTop = 0; // 새 기록이 바로 보이게 맨 위로
    while (el.children.length > 60) el.lastChild.remove();
    const badge = $("alertBadge");
    badge.hidden = false;
    badge.textContent = Math.min(99, el.children.length);
  }
  function showToast(symId, tfKey, hit) {
    const t = $("alertToast");
    t.innerHTML = `🔔 [${tfKey}] ${symId} · ${hit.label}<small>터치하면 달성 기록으로 이동</small>`;
    t.hidden = false;
    clearTimeout(t._timer);
    t._timer = setTimeout(() => (t.hidden = true), 6000);
  }
  $("alertToast").onclick = () => {
    $("alertToast").hidden = true;
    document.querySelector('[data-page="page-alert"]').click();
  };
  function fire(symId, tfKey, barTime, hit, isLive, price) {
    const sm = feed.symbols.find(s => s.id === symId);
    if (sm && sm.alert === false) return; // 감시 해제 종목은 얼럿 안 울림
    const key = `${symId}@${tfKey}@${barTime}@${hit.type}`;
    if (fired.has(key)) return;
    fired.add(key);
    const seq = S_load("sigseq", 0) + 1;
    S_save("sigseq", seq);
    fires.push({ symId, tfKey, type: hit.type, barTime, wall: Date.now(), seq });
    buyMarks.set(key, { symId, tfKey, barTime, type: hit.type, price });
    if (buyMarks.size > 1000) buyMarks.delete(buyMarks.keys().next().value);
    saveSigState();
    playAlert(hit.type);
    notify(`[${tfKey}] ${symId} ${hit.type}`, hit.label);
    alertLog(`[${tfKey}] ${symId} · ${hit.label}${isLive ? " (진행봉)" : " (완성봉)"}`, hit.type);
    renderWatchlistBadge(symId);
    hitMarks.set(symId, { type: hit.type, tfKey, time: Date.now() });
    lastHits.set(symId, { type: hit.type, tfKey });
    renderStrip();
    showToast(symId, tfKey, hit);
    if (symId === symbol && tfKey === tf) {
      const f = $("alertFlash");
      f.hidden = false;
      clearTimeout(f._t);
      f._t = setTimeout(() => (f.hidden = true), 1800);
    }
  }
  function checkBars(symId, tfKey, allBars, live) {
    const p = params();
    const computed = Indicators.computeAll(allBars, p);
    if (symId === symbol && tfKey === tf) ind = computed;
    const i = allBars.length - (live ? 1 : 2);
    if (i < 1) return;
    Alerter.evalBar(allBars, computed, i, p).forEach(h => fire(symId, tfKey, allBars[i].time, h, live, allBars[i].low));
  }

  // ---------- 신호 영구 저장 (매수라벨·보드·최신신호 유지) ----------
  let sigSaveT = null;
  function saveSigState() {
    clearTimeout(sigSaveT);
    sigSaveT = setTimeout(() => {
      try {
        S_save("marks", [...buyMarks].slice(-1000));
        S_save("lasthits", [...lastHits]);
        S_save("fires", fires.slice(-3000));
      } catch (_) {}
    }, 1500);
  }
  function restoreSigState() {
    try {
      (S_load("marks", []) || []).forEach(([k, v]) => { if (v && v.symId && v.barTime) buyMarks.set(k, v); });
      (S_load("lasthits", []) || []).forEach(([k, v]) => { if (v) lastHits.set(k, v); });
      (S_load("fires", []) || []).forEach(f => { if (f && f.symId) fires.push(f); });
    } catch (_) {}
  }
  // ---------- 종목/차트 로드 ----------
  function parseCodeText(text) {
    const out = [];
    let skipped = 0;
    String(text || "").split(/[\n,;]+/).forEach(line => {
      line = line.trim();
      if (!line || /^#/.test(line)) return;
      const raw = line.split(/\s+/)[0];
      const id = raw.toUpperCase();
      const ok = /^[A-Z0-9]{6}$/.test(id) || /^(BTC|ETH|SOL|XRP)\/KRW$/.test(id) || /^[A-Z.\-^=]{2,12}$/.test(id);
      if (!ok) { skipped++; return; }
      out.push({ id, name: line.slice(raw.length).trim() || id });
    });
    if (skipped) log(`형식 오류 ${skipped}줄 건너뜀 (6자리 번호·티커 확인)`);
    return out;
  }
  async function selectSymbol(id) {
    symbol = id;
    persistSyms();
    updateCurSym(); renderWatchlist();
    await loadChart();
  }
  // 신호 온 종목은 신호 난 시간대 차트로 점프
  function jumpToSignal(id) {
    const lh = lastHits.get(id);
    if (lh && TFS[lh.tfKey] && lh.tfKey !== tf) {
      tf = lh.tfKey; persistSyms(); renderTFBar();
      log(`${id} 신호 시간대(${(TF_LABEL[tf] || tf)})로 이동`);
    }
    selectSymbol(id);
  }
  function setStatus(msg) {
    $("yahooStatus").textContent = msg;
    $("feedInfo").textContent = `${tf} · ${symbol || "-"} · ${msg}`;
  }
  async function loadChart(force) {
    if (!symbol) { bars = []; ind = null; draw(); return; }
    if (unsub) { unsub(); unsub = null; }
    setStatus(`${symbol} 받는 중…`);
    try {
      bars = await feed.getBars(symbol, tf, force);
    } catch (e) {
      setStatus("실패: " + e.message);
      log(`수신 실패(${symbol}/${tf}): ${e.message}`);
      return;
    }
    ind = Indicators.computeAll(bars, params());
    checkBars(symbol, tf, bars, false);
    offset = 0;
    draw(); updateOHLC();
    unsub = feed.subscribe(symbol, tf, () => {
      checkBars(symbol, tf, bars, true);
      ind = Indicators.computeAll(bars, params());
      if (follow) offset = 0;
      draw(); updateOHLC();
    });
    const last = bars[bars.length - 1];
    setStatus(`야후 ${tf} ${bars.length}봉 · ${fmtT(last.time)} 마감`);
    if (last) $("priceInfo").textContent = Alerter.fmt(last.close);
  }
  function updateOHLC() {
    const b = bars[bars.length - 1];
    if (!b) { $("ohlc").textContent = "—"; return; }
    const up = b.close >= b.open;
    $("ohlc").innerHTML = `${tf} <b class="${up ? "up" : "down"}">${Alerter.fmt(b.close)}</b> O:${Alerter.fmt(b.open)} H:${Alerter.fmt(b.high)} L:${Alerter.fmt(b.low)} V:${Alerter.compact(b.volume)}`;
  }
  function updateCurSym() {
    const m = feed.symbols.find(s => s.id === symbol);
    $("curSym").textContent = m ? (m.name && m.name !== m.id ? `${m.id} ${m.name}` : m.id) : "종목을 선택하세요";
  }
  function renderTFBar() {
    document.querySelectorAll("#tfBar button").forEach(b => b.classList.toggle("active", b.dataset.tf === tf));
  }

  // ---------- 차트 하단 신호보드 (종목×시간대, 신호↑·무신호↓, 5초 디바운스) ----------
  const fires = []; // {symId, tfKey, type, barTime, wall} — 세션 전체 기록
  const TF_ORDER = ["1m", "3m", "5m", "15m", "30m", "1h", "4h", "1D"];
  const TFCOL = { "1m": "#66bb6a", "3m": "#26c6da", "5m": "#ffa726", "15m": "#4db6ac", "30m": "#5c9dff", "1h": "#ffb300", "4h": "#ab47bc", "1D": "#ff7043" };
  const TFTXT = { "1h": "#231a00", "5m": "#231a00" };
  function tfWindowMs(t) {
    const s = (Feed30m.TFS[t] || { sec: 1800 }).sec;
    if (s <= 3600) return 3600000; // 단기(1분~1시간): 직전 1시간만
    if (s <= 14400) return 8 * 3600000; // 4h: 2봉 유지
    return 48 * 3600000; // 1D: 2봉 유지
  }
  let boardOrder = [], boardOrderTs = 0;
  const hitMarks = new Map(); // id -> {type, tfKey, time} — 종목탭 �지용(유지)
  const lastHits = new Map(); // id -> {type, tfKey} — 종목명 옆 표시용 최신 신호
  function renderStrip() {
    const el = $("symStrip");
    const now = Date.now();
    while (fires.length && now - fires[0].wall > 48 * 3600000) fires.shift();
    if (fires.length > 3000) fires.splice(0, fires.length - 3000);
    const cntHour = new Map(), rankMap = new Map(), lastMap = new Map();
    fires.forEach(f => {
      if (now - f.wall < 3600000) cntHour.set(f.symId, (cntHour.get(f.symId) || 0) + 1);
      if (now - f.wall < tfWindowMs(f.tfKey)) {
        let m = rankMap.get(f.symId);
        if (!m) { m = new Map(); rankMap.set(f.symId, m); }
        if (!m.has(f.tfKey) || m.get(f.tfKey) < f.wall) m.set(f.tfKey, f.wall);
      }
      if (!lastMap.has(f.symId) || lastMap.get(f.symId) < f.wall) lastMap.set(f.symId, f.wall);
    });
    // 종목마다 신호 시간대를 최신순으로 1~8위 매김
    rankMap.forEach((m, sym) => {
      const order = [...m.entries()].sort((a, b) => b[1] - a[1]);
      rankMap.set(sym, new Map(order.map(([t], i) => [t, i + 1])));
    });
    const info = feed.symbols.map((s, idx) => ({
      s, idx,
      score: cntHour.get(s.id) || 0,
      last: lastMap.get(s.id) || 0,
    }));
    info.sort((a, b) => b.score - a.score || b.last - a.last || a.idx - b.idx);
    const desired = info.map(r => r.s.id);
    if (now - boardOrderTs < 5000 && boardOrder.length) {
      const pos = new Map(boardOrder.map((id, i) => [id, i]));
      desired.sort((a, b) => (pos.has(a) ? pos.get(a) : 9999) - (pos.has(b) ? pos.get(b) : 9999));
    } else { boardOrder = desired.slice(); boardOrderTs = now; }
    const byId = new Map(info.map(r => [r.s.id, r]));
    el.innerHTML = "";
    const hr = document.createElement("div");
    hr.className = "sb-row sb-head";
    const h0 = document.createElement("span");
    h0.textContent = "종목";
    hr.appendChild(h0);
    TF_ORDER.forEach(t => {
      const c = document.createElement("span");
      c.textContent = t;
      c.style.color = TFCOL[t];
      if (t === tf) c.classList.add("cur");
      hr.appendChild(c);
    });
    el.appendChild(hr);
    boardOrder.forEach(id => {
      const r = byId.get(id);
      if (!r) return;
      const row = document.createElement("div");
      row.className = "sb-row" + (id === symbol ? " sel" : "");
      const nm = document.createElement("button");
      nm.className = "sb-name";
      nm.innerHTML = `<b>${r.s.id}</b><small>${r.s.name || ""}</small>`;
      nm.title = r.s.id + " · 1일 차트로 이동";
      nm.onclick = () => { tf = "1D"; persistSyms(); renderTFBar(); selectSymbol(id); };
      row.appendChild(nm);
      TF_ORDER.forEach(t => {
        const rk = (rankMap.get(id) || new Map()).get(t) || 0;
        const c = document.createElement("button");
        c.className = "sb-cell";
        c.title = `${id} · ${t} 차트로 이동`;
        c.onclick = () => { tf = t; persistSyms(); renderTFBar(); selectSymbol(id); };
        if (rk > 0) {
          c.textContent = rk; // 종목 내 최신 신호 시간대가 1위
          c.style.background = TFCOL[t];
          c.style.color = TFTXT[t] || "#fff";
        }
        row.appendChild(c);
      });
      el.appendChild(row);
    });
  }
  const rows = {};
  const chg = new Map(); // id -> 전일비 %
  function dayKey(t) {
    const d = new Date(t * 1000);
    return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
  }
  // 1일봉 없을 때: 당일 첫 봉 시가 기준 장중 등락율
  function sessionChg(all) {
    if (!all || all.length < 2) return null;
    const last = all[all.length - 1];
    const k = dayKey(last.time);
    let first = null;
    for (const b of all) {
      if (dayKey(b.time) === k) { first = b; break; }
    }
    if (!first || !first.open) return null;
    return (last.close - first.open) / first.open * 100;
  }
  function paintRow(id) {
    const el = rows[id];
    if (!el) return;
    const b = el.querySelector(".pr b"), i = el.querySelector(".pr i");
    const px = feed.spot[id];
    if (b && px != null) b.textContent = Number(px).toLocaleString("ko-KR", { maximumFractionDigits: 2 });
    if (i) {
      const c = chg.get(id);
      if (c == null || !isFinite(c)) { i.textContent = ""; }
      else {
        i.textContent = (c >= 0 ? "+" : "") + c.toFixed(2) + "%";
        i.style.color = c >= 0 ? "var(--up)" : "var(--down)";
      }
    }
  }
  function renderWatchlist() {
    const wl = $("watchlist");
    wl.innerHTML = "";
    for (const k in rows) delete rows[k];
    feed.symbols.forEach(s => {
      const d = document.createElement("div");
      d.className = "wl" + (s.id === symbol ? " active" : "");
      d.innerHTML = `<input class="ack" type="checkbox" title="얼럿 감시" /><span class="nm"><b>${s.id}</b><span>${s.name || ""}</span></span><span class="pr"><b>—</b><i></i></span>`;
      const ack = d.querySelector(".ack");
      ack.checked = s.alert !== false;
      ack.onclick = e => {
        e.stopPropagation();
        s.alert = ack.checked;
        persistSyms();
        log(`${s.id} 얼럿 ${s.alert ? "켜짐" : "꺼짐"}`);
      };
      const rm = document.createElement("button");
      rm.className = "rm"; rm.textContent = "✕"; rm.title = "삭제";
      rm.onclick = e => {
        e.stopPropagation();
        feed.removeSymbol(s.id);
        log("삭제: " + s.id);
        if (symbol === s.id) { symbol = feed.symbols[0] ? feed.symbols[0].id : ""; updateCurSym(); renderWatchlist(); loadChart(); persistSyms(); }
        else { renderWatchlist(); persistSyms(); }
      };
      d.appendChild(rm);
      d.onclick = () => jumpToSignal(s.id);
      wl.appendChild(d); rows[s.id] = d;
    });
    renderStrip();
  }
  function renderWatchlistBadge(symId) {
    const el = rows[symId];
    if (!el || el.querySelector(".hit")) return;
    const i = document.createElement("span");
    i.className = "hit"; i.textContent = "조건달성";
    el.appendChild(i);
    setTimeout(() => i.remove(), 5 * 60 * 1000);
  }
  feed.onWatch = spot => {
    for (const id in spot) paintRow(id);
  };
  function persistSyms() {
    S_save("symbols", feed.symbols);
    S_save("current", symbol);
    S_save("tf", tf);
  }
  function restoreSyms() {
    const list = S_load("symbols", null);
    if (list && list.length) feed.addSymbols(list.map(s => ({ id: s.id, name: s.name, alert: s.alert })));
    else { feed.addSymbols(DEFAULT_SYMS); log(`관심종목 ${DEFAULT_SYMS.length}개 자동 등록`); }
    symbol = S_load("current", "") || (feed.symbols[0] && feed.symbols[0].id) || "";
  }

  // ---------- 종목 좌우 스와이프 순차 이동 (상하는 기본 스크롤) ----------
  function stepSymbol(dir) {
    if (feed.symbols.length < 2) return;
    const i = feed.symbols.findIndex(s => s.id === symbol);
    const n = feed.symbols.length;
    const next = feed.symbols[(i + dir + n) % n];
    if (next && next.id !== symbol) selectSymbol(next.id);
  }
  function addSwipeNav(el) {
    let sx = null, sy = null;
    el.addEventListener("touchstart", e => { const t = e.touches[0]; sx = t.clientX; sy = t.clientY; }, { passive: true });
    el.addEventListener("touchmove", e => {
      if (sx == null) return;
      const t = e.touches[0], dx = t.clientX - sx, dy = t.clientY - sy;
      if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
        stepSymbol(dx < 0 ? 1 : -1); // 좌로 밀면 다음, 우로 밀면 이전
        sx = t.clientX; sy = t.clientY; // 기준점 갱신 → 계속 밀면 연속 이동
        e.preventDefault();
      }
    }, { passive: false });
    el.addEventListener("touchend", () => { sx = null; });
  }
  addSwipeNav($("symStrip"));
  addSwipeNav($("watchlist"));

  // ---------- 전체 스캔 (종목 × 감시TF) ----------
  let scanning = false;
  async function scanAll(manual) {
    if (scanning || !feed.symbols.length) return;
    scanning = true;
    const tfs = watchTFs();
    $("scanInfo").textContent = `스캔중… (${feed.symbols.length}종목 × ${tfs.join(",")})`;
    for (const s of feed.symbols) {
      if (s.alert === false) continue; // 감시 해제 종목은 스캔 제외
      for (const t of tfs) {
        try {
          // 수동 스캔도 현재 차트만 강제, 나머지는 캐시 존중 (요청 폭증 방지)
          const all = await feed.getBars(s.id, t, manual && s.id === symbol && t === tf);
          const computed = Indicators.computeAll(all, params());
          if (s.id === symbol && t === tf) { bars = all; ind = computed; draw(); updateOHLC(); feed.emitLive(s.id, t); }
          if (t === "1D" && all.length >= 2) {
            const prev = all[all.length - 2].close, last = all[all.length - 1].close;
            if (prev) { chg.set(s.id, (last - prev) / prev * 100); paintRow(s.id); }
          } else if (!chg.has(s.id)) {
            const c = sessionChg(all);
            if (c != null && isFinite(c)) { chg.set(s.id, c); paintRow(s.id); }
          }
          const i = all.length - 2;
          if (i > 0) Alerter.evalBar(all, computed, i, params()).forEach(h => fire(s.id, t, all[i].time, h, false));
        } catch (e) { if (manual) log(`스캔 실패 ${s.id}/${t}: ${e.message}`); }
        await new Promise(r => setTimeout(r, 400));
      }
    }
    $("scanInfo").textContent = `마지막 스캔 ${new Date().toLocaleTimeString()} · ${feed.symbols.length}종목 × ${tfs.join(",")} · 완성봉`;
    scanning = false;
  }
  let scanTimer = null;
  function restartScanTimer() {
    if (scanTimer) clearInterval(scanTimer);
    scanTimer = setInterval(() => scanAll(false), Math.max(30, +$("pScanSec").value || 60) * 1000);
  }

  // ---------- 중계 서버 URL ----------
  try { $("proxyUrl").value = localStorage.getItem("a30_proxy") || "https://tf-relay.yhko73x.workers.dev"; } catch (_) { $("proxyUrl").value = "https://tf-relay.yhko73x.workers.dev"; }
  function applyProxy() {
    const v = $("proxyUrl").value.trim().replace(/\/+$/, "");
    try { localStorage.setItem("a30_proxy", v); } catch (_) {}
    log(v ? "중계 서버 설정: " + v : "중계 서버 해제 (직접+공개프록시만)");
  }
  $("proxyUrl").addEventListener("change", applyProxy);
  $("btnGotoSet").onclick = () => { $("symsSettings").scrollIntoView({ behavior: "smooth", block: "start" }); };
  document.querySelectorAll("#tfBar button").forEach(b => {
    b.onclick = () => { tf = b.dataset.tf; persistSyms(); renderTFBar(); updateCurSym(); loadChart(); restartPolling(); };
  });
  ["tglMA", "tglBB", "tglPC", "tglVol"].forEach(id => $(id).onchange = draw);
  // ---------- 지표 접기/펼치기 (기본 접힘) ----------
  try { if (localStorage.getItem("a30_indopen") === "1") { $("indBar").classList.remove("collapsed"); $("indArrow").textContent = "▲"; } } catch (_) {}
  $("indHead").onclick = () => {
    const bar = $("indBar");
    bar.classList.toggle("collapsed");
    $("indArrow").textContent = bar.classList.contains("collapsed") ? "▼" : "▲";
    try { localStorage.setItem("a30_indopen", bar.classList.contains("collapsed") ? "0" : "1"); } catch (_) {}
  };
  $("btnFollow").onclick = () => { follow = true; offset = 0; $("btnFollow").classList.add("active"); draw(); };
  ["pPCLen", "pBBN", "pBBK", "pMA", "pVolN", "pVolK", "cPC", "cBB", "cMA200", "cVol", "pScanSec", "pollSec", "pSnd", "w1m", "w3m", "w5m", "w15m", "w30m", "w1h", "w4h", "w1D"].forEach(id => {
    $(id).onchange = () => {
      persistParams(); restartScanTimer(); restartPolling();
      if (bars.length) { ind = Indicators.computeAll(bars, params()); checkBars(symbol, tf, bars, false); draw(); }
    };
  });
  $("pWake").onchange = keepAwake;
  $("btnTestSound").onclick = () => { playAlert("PC"); log("테스트음 재생"); };
  $("btnScanNow").onclick = () => scanAll(true);
  $("btnPollNow").onclick = async () => { await loadChart(true); scanAll(true); };
  $("btnClearAlerts").onclick = () => { $("alertLog").innerHTML = ""; $("alertBadge").hidden = true; fired.clear(); fires.length = 0; boardOrder = []; boardOrderTs = 0; hitMarks.clear(); lastHits.clear(); buyMarks.clear(); markIdx = null; try { localStorage.removeItem("a30_marks"); localStorage.removeItem("a30_lasthits"); localStorage.removeItem("a30_fires"); } catch (_) {} renderStrip(); draw(); };
  document.querySelector('[data-page="page-alert"]').addEventListener("click", () => { $("alertBadge").hidden = true; });

  function addCodes(text, jumpSingle) {
    const list = parseCodeText(text);
    if (!list.length) { alert("인식된 종목이 없습니다. 예) 005930 삼성전자"); return; }
    feed.addSymbols(list);
    log(`${list.length}개 인식`);
    renderWatchlist(); persistSyms();
    if (jumpSingle && list.length === 1) selectSymbol(list[0].id);
    else if (!symbol) selectSymbol(list[0].id);
  }
  $("btnLoadCodes").onclick = () => { addCodes($("codeBox").value, true); $("codeBox").value = ""; };
  $("fileInput").addEventListener("change", e => {
    const f = e.target.files[0]; if (!f) return;
    const r = new FileReader();
    r.onload = () => addCodes(String(r.result || ""));
    r.readAsText(f, "utf-8");
    e.target.value = "";
  });
  $("btnSample").onclick = () => { addCodes(DEFAULT_SYMS.map(s => `${s.id} ${s.name}`).join("\n")); };
  $("btnCopyWatch").onclick = async () => {
    const text = feed.symbols.map(s => `${s.id}${s.name && s.name !== s.id ? " " + s.name : ""}`).join("\n");
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) await navigator.clipboard.writeText(text);
      else {
        const ta = document.createElement("textarea");
        ta.value = text; document.body.appendChild(ta); ta.select();
        document.execCommand("copy"); ta.remove();
      }
      log(`목록 복사됨: ${feed.symbols.length}개`);
      alert("복사됐어. 메모장에 붙여넣어줘.");
    } catch (e) { alert("복사 실패: " + (e.message || e)); }
  };
  $("btnExportWatch").onclick = () => {
    const text = feed.symbols.map(s => `${s.id}${s.name && s.name !== s.id ? " " + s.name : ""}`).join("\n");
    try {
      const blob = new Blob(["\ufeff" + text], { type: "text/plain;charset=utf-8" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = "관심종목-내보내기.txt";
      document.body.appendChild(a);
      a.click();
      setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 2000);
      log(`목록 다운로드: ${feed.symbols.length}개`);
    } catch (e) { alert("다운로드 실패: " + (e.message || e)); }
  };

  function setConn() {
    const dot = $("connDot"), txt = $("connText");
    dot.className = "dot online"; txt.textContent = "야후";
  }
  function restartPolling() {
    feed.pollSec = Math.max(15, +$("pollSec").value || 20);
    feed.startPolling(tf, () => symbol, () => { if (symbol) { checkBars(symbol, tf, bars, true); draw(); updateOHLC(); } });
  }

  // ---------- 시작 ----------
  restoreParams(); restoreSyms();
  restoreSigState(); // 이전 매수신호·보드 복원
  if (S_load("paramver", 0) < 2) { // 감시 시간대 기본값: 5분·15분·1일만
    ["w1m", "w3m", "w5m", "w15m", "w30m", "w1h", "w4h", "w1D"].forEach(id => { $(id).checked = ["w5m", "w15m", "w1D"].includes(id); });
    persistParams();
    S_save("paramver", 2);
  }
  if (S_load("symver", 0) < SYMVER) {
    const n = feed.addSymbols(DEFAULT_SYMS);
    S_save("symver", SYMVER);
    persistSyms();
    if (n) log(`새 관심종목 ${n}개 추가 (기존 유지)`);
  }
  if (!symbol) symbol = feed.symbols[0].id;
  feed.pollSec = Math.max(15, +$("pollSec").value || 20);
  renderTFBar(); updateCurSym(); renderWatchlist(); setConn(); keepAwake();
  restartScanTimer(); restartPolling();
  resize();
  loadChart().then(() => scanAll());
  log("멀티TF 알리미 시작 (30m·1h·4h·1D, 야후)");
})();
