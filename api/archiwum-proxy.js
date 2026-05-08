const GAS_URL = process.env.GAS_ARCHIWUM_URL;

export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let url;
    if (req.method === 'POST') {
      const rawBody = await readRawBody(req);
      url = `${GAS_URL}?payload=${encodeURIComponent(rawBody)}`;
    } else {
      const qs = new URLSearchParams(req.query).toString();
      url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
    }

    const gasRes = await fetch(url, {
      method: 'GET',
      redirect: 'follow',
      headers: { 'Accept': 'application/json', 'User-Agent': 'Mozilla/5.0 (compatible; Vercel)' },
    });

    const text = await gasRes.text();
    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      console.error('[archiwum-proxy] non-JSON:', text.slice(0, 400));
      return res.status(502).json({ error: 'GAS returned non-JSON', raw: text.slice(0, 400) });
    }
  } catch (err) {
    console.error('[archiwum-proxy] error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
