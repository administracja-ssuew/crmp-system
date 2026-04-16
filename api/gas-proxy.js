/**
 * Vercel API route — proxy dla Google Apps Script (MapPage).
 * Omija CORS: przeglądarka → /api/gas-proxy → GAS (server-to-server).
 *
 * Obsługuje ręcznie redirect GAS (302 zmienia POST→GET, więc musimy sami
 * powtórzyć POST pod docelowy URL zamiast pozwolić fetch go śledzić).
 */

import https from 'https';
import http from 'http';
import { URL } from 'url';

const GAS_URL = "https://script.google.com/macros/s/AKfycbyO_eJLtdAs63yScKpVuIzbkCQoQKqQTcWgBN_nlfjg__nAkzXXVYuuisKm_MHmoQ5rNw/exec";

export const config = {
  api: { bodyParser: false },
};

// Odczyt surowego ciała requestu
function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', chunk => chunks.push(Buffer.from(chunk)));
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')));
    req.on('error', reject);
  });
}

// HTTP/HTTPS GET z obsługą redirectów
function httpGet(urlStr) {
  return new Promise((resolve, reject) => {
    const makeReq = (u) => {
      const mod = u.startsWith('https') ? https : http;
      mod.get(u, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          makeReq(res.headers.location);
          return;
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      }).on('error', reject);
    };
    makeReq(urlStr);
  });
}

// HTTP/HTTPS POST z ręczną obsługą redirectu (zachowuje metodę POST po redirectcie)
function httpPost(urlStr, body) {
  return new Promise((resolve, reject) => {
    const makeReq = (u, attempt) => {
      if (attempt > 5) return reject(new Error('Too many redirects'));
      const parsed = new URL(u);
      const mod = parsed.protocol === 'https:' ? https : http;
      const options = {
        hostname: parsed.hostname,
        path: parsed.pathname + parsed.search,
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain;charset=utf-8',
          'Content-Length': Buffer.byteLength(body),
        },
      };
      const req = mod.request(options, (res) => {
        if (res.statusCode >= 300 && res.statusCode < 400 && res.headers.location) {
          // Ręczne śledzenie redirectu jako POST (nie GET jak robi fetch)
          makeReq(res.headers.location, attempt + 1);
          return;
        }
        let data = '';
        res.on('data', c => data += c);
        res.on('end', () => resolve(data));
      });
      req.on('error', reject);
      req.write(body);
      req.end();
    };
    makeReq(urlStr, 0);
  });
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  try {
    let responseText;

    if (req.method === 'GET') {
      const qs = new URLSearchParams(req.query).toString();
      const url = qs ? `${GAS_URL}?${qs}` : GAS_URL;
      responseText = await httpGet(url);

    } else if (req.method === 'POST') {
      const rawBody = await readRawBody(req);
      responseText = await httpPost(GAS_URL, rawBody);

    } else {
      return res.status(405).json({ error: 'Method not allowed' });
    }

    try {
      const data = JSON.parse(responseText);
      return res.status(200).json(data);
    } catch {
      console.error('GAS non-JSON:', responseText.slice(0, 300));
      return res.status(502).json({ error: 'GAS returned non-JSON', raw: responseText.slice(0, 300) });
    }

  } catch (err) {
    console.error('gas-proxy error:', err.message);
    return res.status(500).json({ error: err.message });
  }
}
