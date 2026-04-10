// SkeletonLoader — animowane placeholdery zastępujące "Ładowanie..." tekst
//
// Eksporty:
//   SkeletonLine   — pojedyncza linia (text placeholder)
//   SkeletonCard   — karta z kilkoma liniami (np. ogłoszenie, rezerwacja)
//   SkeletonTable  — tabela wierszy (np. lista sprzętu)
//   SkeletonGrid   — siatka kart (np. katalog sprzętu)

export function SkeletonLine({ className = '' }) {
  return (
    <div className={`bg-gray-200 animate-pulse rounded ${className}`} />
  );
}

export function SkeletonCard({ lines = 3, className = '' }) {
  return (
    <div className={`bg-white rounded-xl border border-gray-100 p-4 ${className}`}>
      <SkeletonLine className="h-4 w-3/4 mb-3" />
      {Array.from({ length: lines - 1 }).map((_, i) => (
        <SkeletonLine
          key={i}
          className={`h-3 mt-2 ${i === lines - 2 ? 'w-1/2' : 'w-full'}`}
        />
      ))}
    </div>
  );
}

export function SkeletonTable({ rows = 5, cols = 4, className = '' }) {
  return (
    <div className={`space-y-2 ${className}`}>
      {/* Nagłówek */}
      <div className="flex gap-3 pb-2 border-b border-gray-100">
        {Array.from({ length: cols }).map((_, j) => (
          <SkeletonLine key={j} className="h-3 flex-1" />
        ))}
      </div>
      {/* Wiersze */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3 items-center py-1">
          {Array.from({ length: cols }).map((_, j) => (
            <SkeletonLine
              key={j}
              className={`h-8 flex-1 ${j === 0 ? 'max-w-[2rem]' : ''}`}
            />
          ))}
        </div>
      ))}
    </div>
  );
}

export function SkeletonGrid({ items = 6, className = '' }) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 ${className}`}>
      {Array.from({ length: items }).map((_, i) => (
        <SkeletonCard key={i} lines={4} />
      ))}
    </div>
  );
}
