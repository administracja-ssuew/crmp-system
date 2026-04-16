/**
 * Vercel API route — proxy dla Google Apps Script (MapPage).
 * Omija CORS: przeglądarka → /api/gas-proxy → GAS (server-to-server).
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyO_eJLtdAs63yScKpVuIzbkCQoQKqQTcWgBN_nlfjg__nAkzXXVYuuisKm_MHmoQ5rNw/exec";

// Wyłącz domyślny parser — czytamy surowe ciało ręcznie
export const config = {
  api: { bodyParser: false },
};

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    let data = '';
    req.on('data', chunk => { data += chunk; });
    req.on('end', () => resolve(data));
    req.on('error', reject);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let gasRes;

    if (req.method === 'GET') {
      const qs = new URLSearchParams(req.query).toString();
      const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
      gasRes = await fetch(url, { redirect: 'follow' });

    } else if (req.method === 'POST') {
      const rawBody = await readRawBody(req);
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: rawBody,
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const text = await gasRes.text();

    try {
      const data = JSON.parse(text);
      return res.status(200).json(data);
    } catch {
      // GAS zwrócił HTML (błąd) zamiast JSON — przekaż surową odpowiedź
      console.error('GAS returned non-JSON:', text.slice(0, 500));
      return res.status(502).json({ error: 'GAS returned non-JSON response', raw: text.slice(0, 500) });
    }

  } catch (err) {
    console.error('gas-proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
