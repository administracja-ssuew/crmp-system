export default async function handler(req, res) {
  const { id } = req.query;

  if (!id || !/^[a-zA-Z0-9_-]+$/.test(id)) {
    return res.status(400).end();
  }

  const urls = [
    // Nowszy endpoint Google Drive (najlepiej działa dla plików publicznych)
    `https://drive.usercontent.google.com/download?id=${id}&export=view&authuser=0`,
    // Klasyczny endpoint
    `https://drive.google.com/uc?export=view&id=${id}`,
    // Thumbnail jako ostatnia deska ratunku
    `https://drive.google.com/thumbnail?id=${id}&sz=w600`,
  ];

  for (const url of urls) {
    try {
      const resp = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'image/webp,image/apng,image/*,*/*;q=0.8',
        },
        redirect: 'follow',
      });

      if (!resp.ok) continue;

      const ct = resp.headers.get('content-type') || '';

      // Akceptuj obraz — jeśli content-type to HTML, Drive pokazał stronę błędu, pomijamy
      if (!ct.startsWith('image/')) continue;

      res.setHeader('Content-Type', ct);
      res.setHeader('Cache-Control', 'public, max-age=86400, stale-while-revalidate=3600');
      res.setHeader('Access-Control-Allow-Origin', '*');
      const buf = await resp.arrayBuffer();
      return res.send(Buffer.from(buf));
    } catch (_) {
      continue;
    }
  }

  // Zwróć przezroczysty 1×1 px GIF zamiast 404 — żeby onError się nie odpaliło
  const EMPTY_GIF = Buffer.from('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7', 'base64');
  res.setHeader('Content-Type', 'image/gif');
  res.setHeader('Cache-Control', 'no-store');
  return res.send(EMPTY_GIF);
}
