/**
 * Vercel API route — proxy dla Google Apps Script (MapPage).
 * Omija CORS: przeglądarka → /api/gas-proxy → GAS (server-to-server).
 */

const GAS_URL = "https://script.google.com/macros/s/AKfycbyO_eJLtdAs63yScKpVuIzbkCQoQKqQTcWgBN_nlfjg__nAkzXXVYuuisKm_MHmoQ5rNw/exec";

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    let gasRes;

    if (req.method === 'GET') {
      // Przekazujemy query string bez zmian
      const qs = new URLSearchParams(req.query).toString();
      const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
      gasRes = await fetch(url, { redirect: 'follow' });

    } else if (req.method === 'POST') {
      gasRes = await fetch(GAS_URL, {
        method: 'POST',
        redirect: 'follow',
        headers: { 'Content-Type': 'text/plain;charset=utf-8' },
        body: JSON.stringify(req.body),
      });

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    const data = await gasRes.json();
    return res.status(200).json(data);

  } catch (err) {
    console.error('gas-proxy error:', err);
    return res.status(500).json({ error: err.message });
  }
}
