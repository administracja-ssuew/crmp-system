export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).end();
  }

  const urls = [
    `https://drive.google.com/uc?export=view&id=${id}`,
    `https://drive.google.com/thumbnail?id=${id}&sz=w600`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 (compatible; Googlebot/2.1)' },
        redirect: 'follow',
      });
      const ct = resp.headers.get('content-type') || '';
      if (resp.ok && ct.startsWith('image/')) {
        res.setHeader('Content-Type', ct);
        res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
        const buf = await resp.arrayBuffer();
        return res.send(Buffer.from(buf));
      }
    } catch (_) {}
  }

  return res.status(404).end();
}
