/* datafeed.js — 야후 파이낸스 멀티시간대 (30m/1h/4h/1D, 키/PC 불필요) */
(function (global) {
  const TFS = {
    "30m": { sec: 1800, interval: "30m", range: "3mo", minAge: 60 * 1000 },
    "1h": { sec: 3600, interval: "60m", range: "6mo", minAge: 5 * 60 * 1000 },
    "4h": { sec: 14400, interval: "60m", range: "6mo", resample: 14400, minAge: 15 * 60 * 1000 },
    "1D": { sec: 86400, interval: "1d", range: "2y", minAge: 60 * 60 * 1000 },
  };
  const IDX = { KOSPI: "^KS11", KOSPI200: "^KS200", KOSDAQ: "^KQ11", US100: "^NDX", IXIC: "^IXIC" };

  function candidates(symbol) {
    const s = String(symbol || "").trim().toUpperCase();
    if (!s) return [];
    if (IDX[s]) return [IDX[s]];
    if (/^\d{6}$/.test(s)) {
      const cached = Feed.resolved[s];
      if (cached) return [cached];
      return [s + ".KS", s + ".KQ"];
    }
    if (/^[A-Z.\-^=]+$/.test(s)) return [s];
    const m = s.match(/^(BTC|ETH|SOL|XRP)[\/\-]?(KRW|USD)?$/);
    if (m) return [m[1] + "-KRW", m[1] + "-USD"];
    return [s];
  }

  async function fetchJson(url) {
    const urls = [url, url.replace("query1.", "query2.")];
    let err = null;
    for (const u of urls) {
      try {
        const r = await fetch(u);
        if (!r.ok) { err = new Error("HTTP " + r.status); continue; }
        return await r.json();
      } catch (e) { err = e; }
    }
    try {
      const r = await fetch("/yahoo-api?url=" + encodeURIComponent(url));
      if (r.ok) return await r.json();
    } catch (e) { err = e; }
    throw err || new Error("야후 조회 실패");
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

  async function fetchBars(symbol, tfKey) {
    const tf = TFS[tfKey] || TFS["30m"];
    const isCrypto = /^(BTC|ETH|SOL|XRP)[\/\-]?(KRW|USD)?$/i.test(String(symbol).trim());
    const range = isCrypto && tf.sec < 86400 ? "1mo" : tf.range;
    let lastErr = null;
    for (const yh of candidates(symbol)) {
      try {
        const j = await fetchJson(`https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(yh)}?interval=${tf.interval}&range=${range}`);
        const res = j && j.chart && j.chart.result && j.chart.result[0];
        const ts = (res && res.timestamp) || [];
        const q = (res && res.indicators && res.indicators.quote && res.indicators.quote[0]) || {};
        let bars = [];
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
        if (tf.resample) bars = resample(bars, tf.resample);
        else if (tfKey === "1D") bars = resample(bars, 86400);
        if (bars.length > 5) {
          if (/^\d{6}\.(KS|KQ)$/.test(yh)) Feed.resolved[String(symbol).trim().toUpperCase()] = yh;
          return bars.slice(-400);
        }
        lastErr = new Error(yh + "/" + tfKey + ": 데이터 부족");
      } catch (e) { lastErr = e; }
    }
    throw lastErr || new Error(symbol + "/" + tfKey + ": 야후 데이터 없음");
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
      list.forEach(({ id, name }) => {
        id = String(id).trim().toUpperCase();
        if (!id || this.symbols.some(s => s.id === id)) return;
        this.symbols.push({ id, name: name || id });
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
    startPolling(mainTf, onCycle) {
      this.stopPolling();
      this._timer = setInterval(async () => {
        for (const s of this.symbols) {
          try { await this.getBars(s.id, mainTf); this.emitLive(s.id, mainTf); }
          catch (e) { this.log(`야후 폴링 실패 ${s.id}/${mainTf}: ${e.message}`); }
          await new Promise(r => setTimeout(r, 300));
        }
        onCycle && onCycle();
      }, Math.max(15, this.pollSec) * 1000);
    }
    stopPolling() { if (this._timer) clearInterval(this._timer); this._timer = null; }
  }
  Feed.resolved = {};
  try { Feed.resolved = JSON.parse(localStorage.getItem("a30_yh") || "{}"); } catch (_) {}
  setInterval(() => { try { localStorage.setItem("a30_yh", JSON.stringify(Feed.resolved)); } catch (_) {} }, 10000);

  global.Feed30m = { TFS, Feed30m: Feed, TF_SEC: 1800 };
})(window);
