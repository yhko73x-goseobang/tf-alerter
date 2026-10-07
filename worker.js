// Cloudflare Worker — 30m 알리미 전용 중계 (CORS 우회 + 엣지 캐시)
// 배포: cloudflare.com 가입 → Workers & Pages → Create Worker → 아래 코드 붙여넣기 → Deploy
// 앱 종목탭 "중계 서버 URL"에 https://xxx.workers.dev 입력. 무료 10만 요청/일.
export default {
  async fetch(request, env, ctx) {
    const u = new URL(request.url);
    const cors = {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET,OPTIONS",
      "Access-Control-Allow-Headers": "*",
    };
    if (request.method === "OPTIONS") return new Response(null, { headers: cors });
    try {
      // 네이버 금융 분봉/일봉 (서버간 통신이라 CORS 없음)
      if (u.pathname === "/naver") {
        const sym = (u.searchParams.get("symbol") || "").replace(/[^0-9A-Za-z]/g, "").slice(0, 10);
        const tf = u.searchParams.get("timeframe") === "day" ? "day" : "minute";
        const count = Math.min(5000, Math.max(1, +u.searchParams.get("count") || 600));
        if (!/^[A-Z0-9]{6}$/i.test(sym)) return new Response("bad symbol", { status: 400, headers: cors });
        const target = `https://fchart.stock.naver.com/siseJson.nhn?symbol=${sym}&timeframe=${tf}&count=${count}&requestType=0`;
        const r = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0", Referer: "https://finance.naver.com/" } });
        const body = await r.text();
        return new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json;charset=utf-8", "Cache-Control": "public, max-age=60" } });
      }
      // 야후 차트 (엣지 캐시 60초 — 요청 폭증 흡수)
      if (u.pathname === "/yahoo") {
        const target = u.searchParams.get("url") || "";
        if (!/^https:\/\/query[12]\.finance\.yahoo\.com\//.test(target)) return new Response("bad url", { status: 400, headers: cors });
        const cache = caches.default;
        const ck = new Request(u.toString(), request);
        let res = await cache.match(ck);
        if (!res) {
          const r = await fetch(target, { headers: { "User-Agent": "Mozilla/5.0", Accept: "application/json" } });
          const body = await r.text();
          res = new Response(body, { status: r.status, headers: { ...cors, "Content-Type": "application/json", "Cache-Control": "public, max-age=60" } });
          ctx.waitUntil(cache.put(ck, res.clone()));
        }
        return res;
      }
      return new Response("tf-alerter relay ok", { headers: cors });
    } catch (e) {
      return new Response("proxy error", { status: 502, headers: cors });
    }
  },
};
