/**
 * Vercel API route — proxy dla Google Apps Script (MapPage).
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyO_eJLtdAs63yScKpVuIzbkCQoQKqQTcWgBN_nlfjg__nAkzXXVYuuisKm_MHmoQ5rNw/exec";

export const config = {
  api: { bodyParser: false },
};

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
    // Zarówno GET jak i POST trafiają do GAS jako GET
    // (GAS 302 redirect niszczy POST → kodujemy payload jako query param)
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
      headers: {
        'Accept': 'application/json, */*',
        'User-Agent': 'Mozilla/5.0 (compatible; Vercel)',
      },
    });

    const text = await gasRes.text();

    try {
      return res.status(200).json(JSON.parse(text));
    } catch {
      // Loguj pierwsze 600 znaków żeby zobaczyć co GAS zwraca
      console.error('[gas-proxy] GAS HTTP status:', gasRes.status);
      console.error('[gas-proxy] GAS response (first 600):', text.slice(0, 600));
      return res.status(502).json({
        error: 'GAS returned non-JSON',
        gasStatus: gasRes.status,
        raw: text.slice(0, 600),
      });
    }

  } catch (err) {
    console.error('[gas-proxy] fetch error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
