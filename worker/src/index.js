export default {
  async fetch(req, env) {
    const url = new URL(req.url);
    const path = url.pathname.split("/").filter(Boolean);

    if (path.length === 2 && path[1] === "analytics") {
      if (url.searchParams.get("get") !== null || req.method === "GET") {
        const raw = await env.ANALYTICS.get(path[0]);
        const data = raw ? JSON.parse(raw) : { aiquery: 0, contentfetched: 0 };
        return Response.json(data, { headers: { "Cache-Control": "max-age=30" } });
      }

      if (req.method === "POST") {
        const type = url.searchParams.get("type");
        if (!type) return new Response("Missing 'type' query param", { status: 400 });

        const raw = await env.ANALYTICS.get(path[0]);
        const data = raw ? JSON.parse(raw) : { aiquery: 0, contentfetched: 0 };

        if (!(type in data)) data[type] = 0;
        data[type]++;
        await env.ANALYTICS.put(path[0], JSON.stringify(data));

        return Response.json({ ok: true, id: path[0], type, count: data[type] });
      }
    }

    return new Response("nothing here", { status: 404 });
  },
};
