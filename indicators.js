/* indicators.js — 30분봉 전용 순수 계산 (의존성 없음) */
(function (global) {
  function sma(values, n) {
    const out = new Array(values.length).fill(null);
    let sum = 0;
    for (let i = 0; i < values.length; i++) {
      sum += values[i];
      if (i >= n) sum -= values[i - n];
      if (i >= n - 1) out[i] = sum / n;
    }
    return out;
  }
  function bollinger(closes, n, k) {
    const mid = sma(closes, n);
    const up = new Array(closes.length).fill(null);
    const dn = new Array(closes.length).fill(null);
    for (let i = n - 1; i < closes.length; i++) {
      let s = 0;
      for (let j = i - n + 1; j <= i; j++) s += (closes[j] - mid[i]) ** 2;
      const sd = Math.sqrt(s / n);
      up[i] = mid[i] + k * sd; dn[i] = mid[i] - k * sd;
    }
    return { mid, up, dn };
  }
  function priceChannel(highs, lows, n) {
    const up = new Array(highs.length).fill(null);
    const dn = new Array(highs.length).fill(null);
    const mid = new Array(highs.length).fill(null);
    for (let i = n - 1; i < highs.length; i++) {
      let h = -Infinity, l = Infinity;
      for (let j = i - n + 1; j <= i; j++) { if (highs[j] > h) h = highs[j]; if (lows[j] < l) l = lows[j]; }
      up[i] = h; dn[i] = l; mid[i] = (h + l) / 2;
    }
    return { up, mid, dn };
  }
  function volMA(vols, n) { return sma(vols, n); }

  // bars: [{time,open,high,low,close,volume}] (time=초)
  function computeAll(bars, p) {
    const closes = bars.map(b => b.close);
    const highs = bars.map(b => b.high);
    const lows = bars.map(b => b.low);
    const vols = bars.map(b => b.volume);
    const mas = {};
    (p.maLengths || [20, 60, 100, 200]).forEach(n => { mas[n] = sma(closes, n); });
    const bb = bollinger(closes, p.bbN, p.bbK);
    const pc = priceChannel(highs, lows, p.pcLen);
    const vma = volMA(vols, p.volN);
    return { mas, bb, pc, vma };
  }

  global.Indicators = { sma, bollinger, priceChannel, volMA, computeAll };
})(window);
