// useDebounce — opóźnia zmianę wartości o podany czas
// Użycie: const debouncedSearch = useDebounce(searchTerm, 300);
// Stosuj z useMemo na filtrowaniu list, żeby nie re-renderować przy każdym keystroke.

import { useState, useEffect } from 'react';

export function useDebounce(value, delayMs = 300) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delayMs);
    return () => clearTimeout(timer);
  }, [value, delayMs]);

  return debounced;
}
