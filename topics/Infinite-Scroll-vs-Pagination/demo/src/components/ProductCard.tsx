// src/components/ProductCard.tsx
import type { Product } from "@/lib/mock-data";

interface Props {
  product: Product;
  style?: React.CSSProperties;
}

function Stars({ rating }: { rating: number }) {
  return (
    <span>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          style={{ color: i <= Math.round(rating) ? "#F5A623" : "#2A3A2A", fontSize: 11 }}
        >
          ★
        </span>
      ))}
    </span>
  );
}

const CATEGORY_ICONS: Record<string, string> = {
  Electronics: "📱", Clothing: "👗", Food: "🛒", Home: "🏠",
  Footwear: "👟", Beauty: "✨", Sports: "⚽", Books: "📚",
  Garden: "🌿", Automotive: "🚗",
};

export function ProductCard({ product, style }: Props) {
  const icon = CATEGORY_ICONS[product.category] ?? "📦";

  return (
    <div
      style={{
        background: "#111810",
        border: "1px solid #243020",
        borderRadius: 10,
        overflow: "hidden",
        transition: "border-color 0.15s, transform 0.15s",
        ...style,
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#D4620A55";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLDivElement).style.borderColor = "#243020";
        (e.currentTarget as HTMLDivElement).style.transform = "translateY(0)";
      }}
    >
      {/* Image placeholder */}
      <div
        style={{
          height: 110,
          background: "#172014",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontSize: 40,
          borderBottom: "1px solid #1E2E1A",
        }}
      >
        {icon}
      </div>

      <div style={{ padding: "12px 14px" }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            color: "#1B6B3A",
            letterSpacing: 0.5,
            marginBottom: 4,
            textTransform: "uppercase",
          }}
        >
          {product.category}
        </div>

        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            color: "#F0EDE8",
            lineHeight: 1.3,
            marginBottom: 6,
            height: 34,
            overflow: "hidden",
          }}
        >
          {product.name}
        </div>

        <div style={{ fontSize: 10, color: "#567060", marginBottom: 8 }}>
          by {product.seller}
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 10 }}>
          <Stars rating={product.rating} />
          <span style={{ fontSize: 10, color: "#567060" }}>({product.reviews})</span>
        </div>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <span
            style={{
              fontSize: 15,
              fontWeight: 900,
              color: "#D4620A",
              fontFamily: "monospace",
            }}
          >
            K {product.price.toLocaleString()}
          </span>
          <button
            style={{
              background: "linear-gradient(135deg, #D4620A, #A34A05)",
              color: "#fff",
              border: "none",
              fontSize: 10,
              fontWeight: 700,
              padding: "5px 12px",
              borderRadius: 6,
              cursor: "pointer",
              letterSpacing: 0.3,
            }}
          >
            Add to Cart
          </button>
        </div>
      </div>
    </div>
  );
}
