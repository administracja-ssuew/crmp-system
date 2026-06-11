// Mapuje nacisk pióra (0..1) na grubość kreski w px.
// pressure === 0 (lub brak) oznacza urządzenie bez nacisku (mysz/dotyk) -> fallback.
export function pressureToLineWidth(pressure, { min = 1.5, max = 6, fallback = 5 } = {}) {
  if (!pressure || pressure <= 0) return fallback;
  const clamped = Math.min(1, Math.max(0, pressure));
  return min + (max - min) * clamped;
}

// Przelicza współrzędne klienta (viewport) na piksele canvasa,
// uwzględniając różnicę między rozmiarem CSS a backing-store canvasa.
export function scalePoint(clientX, clientY, rect, canvasWidth, canvasHeight) {
  const scaleX = canvasWidth / rect.width;
  const scaleY = canvasHeight / rect.height;
  return {
    x: (clientX - rect.left) * scaleX,
    y: (clientY - rect.top) * scaleY,
  };
}
