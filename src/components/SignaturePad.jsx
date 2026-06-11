import { forwardRef, useImperativeHandle, useRef, useState } from 'react';
import { pressureToLineWidth, scalePoint } from './signaturePadUtils';

// Wspólne pole podpisu. Renderuje canvas (absolutny) + placeholder,
// jako fragment wstawiany do istniejącego pudełka z obramowaniem w rodzicu.
// Obsługuje pióro/mysz/dotyk przez Pointer Events; pióro Wacom daje nacisk.
const SignaturePad = forwardRef(function SignaturePad(
  { label, onChange, width = 600, height = 200, penColor = '#000080' },
  ref
) {
  const canvasRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);
  const [hasInk, setHasInk] = useState(false);

  useImperativeHandle(ref, () => ({
    clear() {
      const canvas = canvasRef.current;
      if (canvas) {
        const ctx = canvas.getContext('2d');
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
      setHasInk(false);
      if (onChange) onChange(null);
    },
  }), [onChange]);

  const getPoint = (e) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return scalePoint(e.clientX, e.clientY, rect, canvas.width, canvas.height);
  };

  const handlePointerDown = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    e.preventDefault();
    if (canvas.setPointerCapture) canvas.setPointerCapture(e.pointerId);
    drawingRef.current = true;
    lastPointRef.current = getPoint(e);
  };

  const handlePointerMove = (e) => {
    if (!drawingRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas && canvas.getContext('2d');
    if (!ctx) return;
    e.preventDefault();
    const point = getPoint(e);
    const last = lastPointRef.current;
    ctx.strokeStyle = penColor;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = pressureToLineWidth(e.pressure);
    ctx.beginPath();
    ctx.moveTo(last.x, last.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
    if (!hasInk) setHasInk(true);
  };

  const endStroke = (e) => {
    if (!drawingRef.current) return;
    drawingRef.current = false;
    const canvas = canvasRef.current;
    if (canvas && canvas.releasePointerCapture) {
      try { canvas.releasePointerCapture(e.pointerId); } catch (_) { /* już zwolniony */ }
    }
    if (canvas && onChange) onChange(canvas.toDataURL());
  };

  return (
    <>
      <canvas
        ref={canvasRef}
        width={width}
        height={height}
        className="w-full h-full cursor-crosshair absolute top-0 left-0 touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={endStroke}
        onPointerLeave={endStroke}
        onPointerCancel={endStroke}
      />
      {label && !hasInk && (
        <div className="absolute inset-0 flex items-center justify-center opacity-30 font-bold tracking-widest pointer-events-none print:hidden text-xs text-center">
          {label}
        </div>
      )}
    </>
  );
});

export default SignaturePad;
