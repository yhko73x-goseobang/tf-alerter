/* datafeed.js — 야후 멀티시간대 (30m/1h/4h/1D) + 공개프록시 폴백
 * 폰 웹뷰에서 야후가 HTML 차단 페이지를 줄 때가 있어 쿠키 확보 → query1 → query2 → 공개프록시 순으로 시도.
 * 키/PC 불필요.
 */
(function (global) {
  const TFS = {
    "1m": { sec: 60, interval: "1m", range: "5d", minAge: 60 * 1000 },
    "3m": { sec: 180, interval: "1m", range: "5d", resample: 180, minAge: 60 * 1000 },
    "5m": { sec: 300, interval: "5m", range: "1mo", minAge: 60 * 1000 },
    "15m": { sec: 900, interval: "15m", range: "1mo", minAge: 2 * 60 * 1000 },
    "30m": { sec: 1800, interval: "30m", range: "1mo", minAge: 3 * 60 * 1000 },
    "1h": { sec: 3600, interval: "60m", range: "3mo", minAge: 10 * 60 * 1000 },
    "4h": { sec: 14400, interval: "60m", range: "3mo", resample: 14400, minAge: 30 * 60 * 1000 },
    "1D": { sec: 86400, interval: "1d", range: "2y", minAge: 2 * 60 * 60 * 1000 },
  };
  const IDX = { KOSPI: "^KS11", KOSPI200: "^KS200", KOSDAQ: "^KQ11", US100: "^NDX", NDX: "^NDX", IXIC: "^IXIC", COMP: "^IXIC" };

  function candidates(symbol) {
    const s = String(symbol || "").trim().toUpperCase();
    if (!s) return [];
    if (IDX[s]) return [IDX[s]];
    if (/^[A-Z0-9]{6}$/.test(s)) {
      const cached = Feed.resolved[s];
      if (cached) return [cached];
      return [s + ".KS", s + ".KQ"]; // 숫자 6자리 + 영숫자 ETF 코드(0008S0 등)
    }
    if (/^[A-Z.\-^=]+$/.test(s)) return [s];
    const m = s.match(/^(BTC|ETH|SOL|XRP)[\/\-]?(KRW|USD)?$/);
    if (m) return [m[1] + "-KRW", m[1] + "-USD"];
    return [s];
  }

  // 주의: 야후는 ACAO:* 응답이라 credentials:include를 쓰면
  // 브라우저 CORS 검사에서 전부 차단됨. 쿠키 없이 요청해야 함.
  // 요청 제한 차단기: 네트워크 실패 연속 6회면 90초 휴식
  let netFail = 0, coolUntil = 0;
  // 자체 중계 서버 (Cloudflare Worker. 미입력 시 기본값 사용, 지우면 직접+공개프록시만)
  const DEFAULT_RELAY = "https://tf-relay.yhko73x.workers.dev";
  function relay() {
    try {
      const v = localStorage.getItem("a30_proxy");
      return ((v == null ? DEFAULT_RELAY : v) || "").replace(/\/+$/, "");
    }
    catch (_) { return Feed.proxyUrl || DEFAULT_RELAY; }
  }
  async function fetchDirectJson(url) {
    if (Date.now() < coolUntil) throw new Error("야후 요청 제한 중 — 잠시 후 자동 재개");
    const direct = [url, url.replace("query1.", "query2.")];
    let firstErr = null;
    const note = e => {
      if (!firstErr) firstErr = e;
      if (/Failed to fetch|Load failed|NetworkError|network/i.test(e.message || "")) {
        if (++netFail >= 6) coolUntil = Date.now() + 90000;
      }
    };
    for (const u of direct) {
      try {
        const r = await fetch(u, { headers: { Accept: "application/json" } });
        const t = await r.text();
        if (!r.ok) { note(new Error("야후 HTTP " + r.status)); break; }
        if (t.charAt(0) === "<") { note(new Error("야후 차단페이지 응답")); break; }
        netFail = 0;
        return JSON.parse(t);
      } catch (e) { note(e); }
    }
    throw firstErr || new Error("야후 직접 조회 실패");
  }
  // 공개 프록시 경유 야후 (서버 없이 폰에서 직접)
  async function fetchPublicJson(url) {
    try {
      const r = await fetch("https://api.allorigins.win/raw?url=" + encodeURIComponent(url));
      const t = await r.text();
      if (r.ok && t.charAt(0) !== "<") { netFail = 0; return JSON.parse(t); }
    } catch (_) {}
    try {
      const r = await fetch("/yahoo-api?url=" + encodeURIComponent(url));
      if (r.ok) { netFail = 0; return await r.json(); }
    } catch (_) {}
    throw new Error("프록시 경유 실패");
  }
  async function fetchYahooJson(url) {
    // 1) 직접 → 2) 자체 중계(엣지 캐시) → 3) 공개 프록시 → 4) 로컬 프록시
    try { return await fetchDirectJson(url); }
    catch (firstErr) {
      const px = relay();
      if (px) {
        try {
          const r = await fetch(px + "/yahoo?url=" + encodeURIComponent(url));
          const t = await r.text();
          if (r.ok && t.charAt(0) !== "<") { netFail = 0; return JSON.parse(t); }
        } catch (_) {}
      }
      try { return await fetchPublicJson(url); }
      catch (_) { throw firstErr; }
    }
  }
  // 네이버 분봉/일봉 (중계 서버 경유 — 브라우저 CORS 직접 호출 불가)
  function parseNaver(text, tfSec) {
    const rows = [...String(text).matchAll(/\["(\d{8,12})",\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,]+),\s*([^,\]]+)/g)];
    const bars = [];
    for (const m of rows) {
      const dt = m[1], c = parseFloat(m[5]);
      if (!isFinite(c)) continue;
      const num = v => (v === "null" || !isFinite(parseFloat(v)) ? c : parseFloat(v));
      let t;
      if (dt.length === 12) t = Math.floor(new Date(`${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T${dt.slice(8, 10)}:${dt.slice(10, 12)}:00+09:00`).getTime() / 1000);
      else t = Math.floor(new Date(`${dt.slice(0, 4)}-${dt.slice(4, 6)}-${dt.slice(6, 8)}T00:00:00+09:00`).getTime() / 1000);
      if (!t) continue;
      bars.push({ time: t, open: num(m[2]), high: num(m[3]), low: num(m[4]), close: c, volume: parseInt(m[6], 10) || 0 });
    }
    bars.sort((a, b) => a.time - b.time);
    if (tfSec <= 60) return bars; // 1분봉 그대로
    return resample(bars, tfSec);
  }
  async function fetchNaverViaRelay(symbol, tfKey, tf) {
    const px = relay();
    if (!px || !/^[A-Z0-9]{6}$/.test(String(symbol).trim())) throw new Error("중계 서버 미설정");
    const isDay = tfKey === "1D";
    const r = await fetch(`${px}/naver?symbol=${symbol.trim()}&timeframe=${isDay ? "day" : "minute"}&count=${isDay ? 800 : 3000}`);
    const t = await r.text();
    if (!r.ok || !t || t.charAt(0) === "<") throw new Error("중계 네이버 실패");
    const bars = parseNaver(t, tf.sec);
    if (bars.length < 5) throw new Error("네이버 봉 부족");
    netFail = 0;
    return bars.slice(-400);
  }

  function resample(bars, sec) {
    const out = [];
    let cur = null;
    for (const b of bars) {
      const t = Math.floor(b.time / sec) * sec;
      if (!cur || cur.time !== t) { if (cur) out.push(cur); cur = { time: t, open: b.open, high: b.high, low: b.low, close: b.close, volume: b.volume }; }
      else { cur.high = Math.max(cur.high, b.high); cur.low = Math.min(cur.low, b.low); cur.close = b.close; cur.volume += b.volume; }
    }
    if (cur) out.push(cur);
    return out;
  }

  // 1D 최후 수단은 야후 일봉 재시도 없이 그대로 실패 전달 (캐시 유지)

  function barsFromYahoo(j) {
    const res = j && j.chart && j.chart.result && j.chart.result[0];
    if (!res) {
      const e = j && j.chart && j.chart.error;
      throw new Error(e ? ("야후: " + (e.description || e.code || "데이터 없음")) : "야후 데이터 없음");
    }
    const ts = res.timestamp || [];
    const q = (res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
    const bars = [];
    for (let i = 0; i < ts.length; i++) {
      const c = q.close && q.close[i];
      if (c == null) continue;
      bars.push({
        time: ts[i],
        open: q.open[i] ?? c, high: q.high[i] ?? c,
        low: q.low[i] ?? c, close: c,
        volume: q.volume[i] || 0,
      });
    }
    return bars;
  }

  async function fetchBars(symbol, tfKey) {
    const tf = TFS[tfKey] || TFS["30m"];
    const isCrypto = /^(BTC|ETH|SOL|XRP)[\/\-]?(KRW|USD)?$/i.test(String(symbol).trim());
    const range = isCrypto && tf.sec < 86400 ? "1mo" : tf.range;
    let lastErr = null, firstErr = null;
    for (const yh of candidates(symbol)) {
      try {
        const j = await fetchYahooJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yh)}?interval=${tf.interval}&range=${range}`);
        let bars = barsFromYahoo(j);
        if (tf.resample) bars = resample(bars, tf.resample); // 3m·4h만 합성 (1D는 야후 일봉 그대로 — DST 병합 방지)
        if (bars.length > 5) {
          if (/^[A-Z0-9]{6}\.(KS|KQ)$/.test(yh)) Feed.resolved[String(symbol).trim().toUpperCase()] = yh;
          return bars.slice(-400);
        }
        lastErr = new Error(yh + "/" + tfKey + ": 봉 부족");
      } catch (e) { if (!firstErr) firstErr = e; lastErr = e; }
    }
    // 한국 종목: 중계 서버 경유 네이버 분봉/일봉 (야후 전부 실패 시)
    try {
      return await fetchNaverViaRelay(symbol, tfKey, tf);
    } catch (e) { if (!firstErr) firstErr = e; }
    throw firstErr || lastErr || new Error(symbol + "/" + tfKey + ": 데이터 없음");
  }

  class Feed {
    constructor() {
      this.symbols = [];
      this.spot = {};
      this.barsCache = new Map(); // "SYM|TF" -> bars
      this.lastFetch = new Map();
      this.tickCb = new Map(); // "SYM|TF" -> Set
      this.onWatch = null; this.onLog = null;
      this.pollSec = 20;
      this._timer = null;
    }
    get mode() { return "yahoo"; }
    log(m) { this.onLog && this.onLog(m); }
    key(symbol, tf) { return symbol + "|" + tf; }
    addSymbols(list) {
      let n = 0;
      list.forEach(s0 => {
        let id = String(s0.id).trim().toUpperCase();
        if (!id || this.symbols.some(s => s.id === id)) return;
        this.symbols.push({ id, name: s0.name || id, alert: s0.alert !== false, star: !!s0.star });
        n++;
      });
      return n;
    }
    removeSymbol(id) {
      this.symbols = this.symbols.filter(s => s.id !== id);
      Object.keys(TFS).forEach(tf => { this.tickCb.delete(this.key(id, tf)); this.barsCache.delete(this.key(id, tf)); this.lastFetch.delete(this.key(id, tf)); });
      delete this.spot[id];
    }
    async getBars(symbol, tfKey, force) {
      tfKey = TFS[tfKey] ? tfKey : "30m";
      const k = this.key(symbol, tfKey);
      const now = Date.now();
      const cached = this.barsCache.get(k) || [];
      if (!force && cached.length && now - (this.lastFetch.get(k) || 0) < TFS[tfKey].minAge) return cached;
      const bars = await fetchBars(symbol, tfKey);
      this.barsCache.set(k, bars);
      this.lastFetch.set(k, now);
      const last = bars[bars.length - 1];
      if (last) { this.spot[symbol] = last.close; this.onWatch && this.onWatch({ ...this.spot }); }
      return bars;
    }
    getBars30m(symbol, force) { return this.getBars(symbol, "30m", force); }
    subscribe(symbol, tfKey, cb) {
      if (typeof tfKey === "function") { cb = tfKey; tfKey = "30m"; }
      const k = this.key(symbol, tfKey);
      if (!this.tickCb.has(k)) this.tickCb.set(k, new Set());
      const set = this.tickCb.get(k);
      set.add(cb);
      return () => set.delete(cb);
    }
    emitLive(symbol, tfKey) {
      const k = this.key(symbol, tfKey);
      const bars = this.barsCache.get(k) || [];
      const last = bars[bars.length - 1];
      if (!last) return;
      this.spot[symbol] = last.close;
      (this.tickCb.get(k) || []).forEach(cb => cb(
        { symbol, price: last.close, time: last.time * 1000, volume: 0 }, bars));
      this.onWatch && this.onWatch({ ...this.spot });
    }
    startPolling(mainTf, symbolFn, onCycle) {
      this.stopPolling();
      this._timer = setInterval(async () => {
        const sym = typeof symbolFn === "function" ? symbolFn() : symbolFn;
        if (!sym) return;
        try { await this.getBars(sym, mainTf); this.emitLive(sym, mainTf); }
        catch (e) { this.log(`수신 실패 ${sym}/${mainTf}: ${e.message}`); }
        onCycle && onCycle();
      }, Math.max(15, this.pollSec) * 1000);
    }
    stopPolling() { if (this._timer) clearInterval(this._timer); this._timer = null; }
  }
  Feed.proxyUrl = "";
  Feed.resolved = {};
  try { Feed.resolved = JSON.parse(localStorage.getItem("a30_yh") || "{}"); } catch (_) {}
  setInterval(() => { try { localStorage.setItem("a30_yh", JSON.stringify(Feed.resolved)); } catch (_) {} }, 10000);

  global.Feed30m = { TFS, Feed30m: Feed, TF_SEC: 1800 };
})(window);
