// src/components/SkeletonCard.tsx

export function SkeletonCard() {
  return (
    <div
      style={{
        background: "#111810",
        border: "1px solid #243020",
        borderRadius: 10,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: 110,
          background: "linear-gradient(90deg, #172014 25%, #1E2E1A 50%, #172014 75%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 1.4s ease infinite",
        }}
      />
      <div style={{ padding: "12px 14px" }}>
        {[40, 90, 60, 50, 100].map((w, i) => (
          <div
            key={i}
            style={{
              height: i === 1 ? 28 : 12,
              width: `${w}%`,
              background: "linear-gradient(90deg, #172014 25%, #1E2E1A 50%, #172014 75%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 1.4s ease infinite",
              borderRadius: 4,
              marginBottom: i < 4 ? 10 : 0,
            }}
          />
        ))}
      </div>
      <style>{`
        @keyframes shimmer {
          0%   { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
      `}</style>
    </div>
  );
}

export function SkeletonGrid({ count = 12 }: { count?: number }) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
        gap: 16,
      }}
    >
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
