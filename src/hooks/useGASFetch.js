// useGASFetch — centralny hook do pobierania danych z Google Apps Script
// Wzorzec: stale-while-revalidate + sessionStorage cache (TTL 5 min) + retry 1x po timeout
//
// Użycie:
//   const { data, loading, error, refresh } = useGASFetch(API_URL);
//
// Zwraca:
//   data    — surowy JSON z GAS (null przed pierwszym fetch lub gdy brak danych)
//   loading — true tylko przy pierwszym ładowaniu (bez cache); przy tle refresh = false
//   error   — string z komunikatem błędu lub null
//   refresh — funkcja wymuszająca ponowny fetch (resetuje loading)

import { useState, useEffect, useCallback, useRef } from 'react';

const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minut
const TIMEOUT_MS = 12_000;           // 12 sekund — tyle samo co dotychczasowe timeouty w GAS

function cacheKey(url) {
  return `gas_cache_${url}`;
}

function readCache(url) {
  try {
    const raw = sessionStorage.getItem(cacheKey(url));
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > CACHE_TTL_MS) return null;
    return data;
  } catch {
    return null;
  }
}

function writeCache(url, data) {
  try {
    sessionStorage.setItem(cacheKey(url), JSON.stringify({ data, ts: Date.now() }));
  } catch {
    // sessionStorage może być pełny — ignorujemy, cache jest opcjonalne
  }
}

async function fetchWithTimeout(url, signal) {
  const controller = new AbortController();
  // Łączymy zewnętrzny signal (abort przy odmontowaniu) z timeoutem
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  const linked = signal
    ? new Promise((_, reject) => signal.addEventListener('abort', () => reject(new DOMException('Aborted', 'AbortError'))))
    : null;

  try {
    const res = await Promise.race([
      fetch(url, { signal: controller.signal }),
      ...(linked ? [linked] : []),
    ]);
    clearTimeout(timer);
    const json = await res.json();
    if (json?.error) throw new Error(json.error);
    return json;
  } catch (e) {
    clearTimeout(timer);
    throw e;
  }
}

export function useGASFetch(url, { enabled = true } = {}) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Ref do AbortController żeby anulować fetch przy odmontowaniu komponentu
  const abortRef = useRef(null);

  const doFetch = useCallback(async (silent = false) => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    // Anuluj ewentualnie trwający poprzedni fetch
    if (abortRef.current) abortRef.current.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    if (!silent) setLoading(true);
    setError(null);

    try {
      let json;
      try {
        json = await fetchWithTimeout(url, controller.signal);
      } catch (e) {
        if (e.name === 'AbortError' && !controller.signal.aborted) {
          // Timeout wewnętrzny (nie odmontowanie) — jedna próba retry
          json = await fetchWithTimeout(url, controller.signal);
        } else {
          throw e;
        }
      }

      writeCache(url, json);
      setData(json);
      setError(null);
    } catch (e) {
      // Nie pokazuj błędu jeśli komponent został odmontowany (abort od cleanup)
      if (e.name !== 'AbortError' || !controller.signal.aborted) {
        setError('Błąd połączenia. Sprawdź internet i spróbuj odświeżyć stronę.');
      }
    } finally {
      if (!controller.signal.aborted) {
        setLoading(false);
      }
    }
  }, [url, enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (!url || !enabled) {
      setLoading(false);
      return;
    }

    const cached = readCache(url);
    if (cached !== null) {
      // Stale-while-revalidate: pokaż cache natychmiast, odśwież w tle
      setData(cached);
      setLoading(false);
      doFetch(true);
    } else {
      doFetch(false);
    }

    return () => {
      if (abortRef.current) abortRef.current.abort();
    };
  }, [url, enabled, doFetch]);

  const refresh = useCallback(() => doFetch(false), [doFetch]);

  return { data, loading, error, refresh };
}
