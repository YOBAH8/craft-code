"use client";

import { useState, useEffect, useRef } from "react";
import {
  useQuery,
  useInfiniteQuery,
  keepPreviousData,
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";
import { ProductCard } from "@/components/ProductCard";
import { SkeletonCard, SkeletonGrid } from "@/components/SkeletonCard";
import { fetchProductsPage, fetchProductsCursor } from "@/lib/mock-data";

const queryClient = new QueryClient();

// ─── Colours ──────────────────────────────────────────────────────────────────

const C = {
  bg:        "#080D0A",
  surface:   "#0E140B",
  surface2:  "#141F11",
  surface3:  "#1A2A16",
  border:    "#243020",
  copper:    "#D4620A",
  copperDim: "#A34A05",
  green:     "#1B6B3A",
  gold:      "#F5A623",
  text:      "#F0EDE8",
  muted:     "#8A9E8E",
  dim:       "#4A6050",
};

// ─── Pagination Panel ─────────────────────────────────────────────────────────

function PaginationPanel() {
  const [page, setPage] = useState(1);

  const { data, isPlaceholderData, status } = useQuery({
    queryKey: ["products-page", page],
    queryFn: () => fetchProductsPage(page),
    placeholderData: keepPreviousData, // keeps old page visible while loading new one
  });

  const canPrev = page > 1;
  const canNext = data ? page < data.meta.last_page : false;

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel header */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: 12, fontWeight: 800, color: C.copper, letterSpacing: 1, textTransform: "uppercase", marginBottom: 4 }}>
              Pattern A
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              Pagination
            </div>
          </div>

          {data && (
            <div
              style={{
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                color: C.muted,
              }}
            >
              Page <strong style={{ color: C.text }}>{data.meta.current_page}</strong> of{" "}
              <strong style={{ color: C.text }}>{data.meta.last_page}</strong>
              &nbsp;·&nbsp;
              <strong style={{ color: C.copper }}>{data.meta.total}</strong> total
            </div>
          )}
        </div>

        {/* Callout */}
        <div
          style={{
            marginTop: 12,
            background: "#1A0800",
            border: `1px solid ${C.copper}30`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.5,
          }}
        >
          ✦ Notice: Old page stays visible (dimmed) while new page loads.
          This is <code style={{ color: C.gold, fontSize: 10 }}>keepPreviousData</code> — without it,
          the grid would flash empty on every page change.
        </div>
      </div>

      {/* Product grid */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
          opacity: isPlaceholderData ? 0.45 : 1,
          transition: "opacity 0.2s",
        }}
      >
        {status === "pending" ? (
          <SkeletonGrid count={12} />
        ) : status === "error" ? (
          <div style={{ textAlign: "center", color: "#E84040", padding: 40 }}>
            Failed to load products
          </div>
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
              gap: 14,
            }}
          >
            {data.data.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        )}
      </div>

      {/* Pagination controls */}
      <div
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: "14px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <button
          onClick={() => setPage((p) => p - 1)}
          disabled={!canPrev || isPlaceholderData}
          style={{
            background: canPrev ? C.surface2 : "transparent",
            color: canPrev ? C.text : C.dim,
            border: `1px solid ${canPrev ? C.border : "transparent"}`,
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: canPrev ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {data && (
          <div style={{ display: "flex", gap: 4 }}>
            {Array.from({ length: Math.min(data.meta.last_page, 7) }, (_, i) => {
              const p = i + 1;
              const isActive = p === page;
              return (
                <button
                  key={p}
                  onClick={() => setPage(p)}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 6,
                    border: `1px solid ${isActive ? C.copper : C.border}`,
                    background: isActive ? C.copper : C.surface2,
                    color: isActive ? "#fff" : C.muted,
                    fontSize: 12,
                    fontWeight: isActive ? 800 : 400,
                    cursor: "pointer",
                    transition: "all 0.1s",
                  }}
                >
                  {p}
                </button>
              );
            })}
            {data.meta.last_page > 7 && (
              <span style={{ color: C.dim, padding: "0 4px", lineHeight: "32px" }}>···</span>
            )}
          </div>
        )}

        <button
          onClick={() => setPage((p) => p + 1)}
          disabled={!canNext || isPlaceholderData}
          style={{
            background: canNext ? `linear-gradient(135deg, ${C.copper}, ${C.copperDim})` : "transparent",
            color: canNext ? "#fff" : C.dim,
            border: `1px solid ${canNext ? C.copper : "transparent"}`,
            borderRadius: 8,
            padding: "8px 20px",
            fontSize: 13,
            fontWeight: 700,
            cursor: canNext ? "pointer" : "not-allowed",
            transition: "all 0.15s",
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}

// ─── Infinite Scroll Panel ────────────────────────────────────────────────────

function InfiniteScrollPanel() {
  const sentinelRef = useRef<HTMLDivElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [fetchCount, setFetchCount] = useState(0);

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    status,
  } = useInfiniteQuery({
    queryKey: ["products-cursor"],
    queryFn: ({ pageParam }) =>
      fetchProductsCursor(pageParam as string | undefined),
    initialPageParam: undefined,
    getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
  });

  const products = data?.pages.flatMap((page) => page.data) ?? [];

  // ── IntersectionObserver — the right way to trigger load more ──
  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && hasNextPage && !isFetchingNextPage) {
          fetchNextPage();
          setFetchCount((c) => c + 1);
        }
      },
      {
        root: scrollRef.current, // observe within this scroll container
        rootMargin: "200px",     // trigger 200px before the sentinel enters view
      }
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      {/* Panel header */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "16px 24px",
          flexShrink: 0,
        }}
      >
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <div
              style={{
                fontSize: 12,
                fontWeight: 800,
                color: C.green,
                letterSpacing: 1,
                textTransform: "uppercase",
                marginBottom: 4,
              }}
            >
              Pattern B
            </div>
            <div style={{ fontSize: 18, fontWeight: 800, color: C.text, letterSpacing: -0.5 }}>
              Infinite Scroll
            </div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div
              style={{
                background: C.surface2,
                border: `1px solid ${C.border}`,
                borderRadius: 8,
                padding: "6px 14px",
                fontSize: 12,
                color: C.muted,
              }}
            >
              <strong style={{ color: C.copper }}>{products.length}</strong> loaded ·{" "}
              <strong style={{ color: C.green }}>{fetchCount}</strong> fetches
            </div>
          </div>
        </div>

        {/* Callout */}
        <div
          style={{
            marginTop: 12,
            background: "#001A0A",
            border: `1px solid ${C.green}30`,
            borderRadius: 6,
            padding: "8px 12px",
            fontSize: 11,
            color: C.muted,
            lineHeight: 1.5,
          }}
        >
          ✦ Scroll down — next batch loads automatically via{" "}
          <code style={{ color: C.gold, fontSize: 10 }}>IntersectionObserver</code> with{" "}
          <code style={{ color: C.gold, fontSize: 10 }}>rootMargin: 200px</code> pre-fetch.
        </div>
      </div>

      {/* Scrollable product list */}
      <div
        ref={scrollRef}
        style={{
          flex: 1,
          overflowY: "auto",
          padding: "20px 24px",
        }}
      >
        {status === "pending" ? (
          <SkeletonGrid count={12} />
        ) : status === "error" ? (
          <div style={{ textAlign: "center", color: "#E84040", padding: 40 }}>
            Failed to load products
          </div>
        ) : (
          <>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fill, minmax(180px, 1fr))",
                gap: 14,
              }}
            >
              {products.map((product) => (
                <ProductCard key={product.id} product={product} />
              ))}

              {/* Skeleton cards while loading next page */}
              {isFetchingNextPage &&
                Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={`sk-${i}`} />)}
            </div>

            {/* Sentinel — IntersectionObserver target */}
            <div ref={sentinelRef} style={{ height: 1, marginTop: 20 }} />

            {/* End of list */}
            {!hasNextPage && products.length > 0 && (
              <div
                style={{
                  textAlign: "center",
                  padding: "32px 0",
                  color: C.dim,
                  fontSize: 13,
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 8 }}>✓</div>
                You've seen all {products.length} products
              </div>
            )}
          </>
        )}
      </div>

      {/* Footer stats */}
      <div
        style={{
          background: C.surface,
          borderTop: `1px solid ${C.border}`,
          padding: "12px 24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 11, color: C.dim }}>
          Cursor-based · No OFFSET · Stable results
        </span>
        <span style={{ fontSize: 11, color: hasNextPage ? C.green : C.dim, fontWeight: 700 }}>
          {hasNextPage ? "● More to load" : "● All loaded"}
        </span>
      </div>
    </div>
  );
}

// ─── Tradeoff comparison table ────────────────────────────────────────────────

const TRADEOFFS = [
  { label: "URL Shareable",       pagination: "✅ Yes — ?page=3",        infinite: "❌ No (needs History API)" },
  { label: "Browser Back Button", pagination: "✅ Works by default",      infinite: "⚠️ Loses scroll position" },
  { label: "SEO Crawlable",       pagination: "✅ Every page indexed",    infinite: "❌ JS content often missed" },
  { label: "Find a specific item",pagination: "✅ Jump to exact page",    infinite: "❌ Must scroll to find it" },
  { label: "Discovery / Browsing",pagination: "⚠️ Page breaks stop flow", infinite: "✅ Frictionless" },
  { label: "DOM Memory Usage",    pagination: "✅ Fixed (20 items only)", infinite: "⚠️ Grows — needs virtual list" },
  { label: "Mobile Performance",  pagination: "✅ Predictable",           infinite: "⚠️ Can degrade without virt." },
  { label: "Implementation",      pagination: "✅ Simpler",               infinite: "⚠️ More complexity" },
  { label: "Backend Query",       pagination: "⚠️ OFFSET (scales badly)", infinite: "✅ Cursor (scales perfectly)" },
];

// ─── Root ─────────────────────────────────────────────────────────────────────

function Demo() {
  const [activeTab, setActiveTab] = useState<"both" | "pagination" | "infinite" | "tradeoffs">("both");

  return (
    <div
      style={{
        background: C.bg,
        minHeight: "100vh",
        fontFamily: "'DM Mono', 'Fira Code', 'Courier New', monospace",
        color: C.text,
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Header */}
      <div
        style={{
          background: C.surface,
          borderBottom: `1px solid ${C.border}`,
          padding: "18px 32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexShrink: 0,
        }}
      >
        <div>
          <div
            style={{
              fontSize: 10,
              letterSpacing: 3,
              color: C.copper,
              fontWeight: 700,
              textTransform: "uppercase",
              marginBottom: 4,
            }}
          >
            craft-code · topic 09
          </div>
          <div style={{ fontSize: 18, fontWeight: 800, letterSpacing: -0.5 }}>
            Infinite Scroll <span style={{ color: C.dim }}>vs</span> Pagination
          </div>
        </div>

        <div style={{ display: "flex", gap: 4, background: C.surface2, padding: 4, borderRadius: 10, border: `1px solid ${C.border}` }}>
          {(["both", "pagination", "infinite", "tradeoffs"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                background: activeTab === tab ? C.copper : "transparent",
                color: activeTab === tab ? "#fff" : C.muted,
                border: "none",
                padding: "6px 14px",
                borderRadius: 7,
                fontSize: 11,
                fontWeight: 700,
                cursor: "pointer",
                textTransform: "capitalize",
                letterSpacing: 0.3,
                transition: "all 0.15s",
              }}
            >
              {tab === "both" ? "⊞ Side by Side" : tab === "pagination" ? "Pagination" : tab === "infinite" ? "Infinite Scroll" : "📊 Tradeoffs"}
            </button>
          ))}
        </div>
      </div>

      {/* Panels */}
      {activeTab === "tradeoffs" ? (
        <div style={{ flex: 1, overflowY: "auto", padding: "32px" }}>
          <div style={{ maxWidth: 860, margin: "0 auto" }}>
            <h2 style={{ fontWeight: 800, fontSize: 20, marginBottom: 8, letterSpacing: -0.5 }}>
              The Tradeoff Matrix
            </h2>
            <p style={{ fontSize: 13, color: C.muted, marginBottom: 24, lineHeight: 1.6 }}>
              Neither pattern is universally better. The right choice depends on what your users are doing.
            </p>

            <div style={{ border: `1px solid ${C.border}`, borderRadius: 12, overflow: "hidden" }}>
              {/* Table header */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1.2fr 1.4fr 1.4fr",
                  background: C.surface2,
                  borderBottom: `1px solid ${C.border}`,
                  padding: "12px 20px",
                  gap: 16,
                }}
              >
                {["Consideration", "Pagination", "Infinite Scroll"].map((h, i) => (
                  <div
                    key={h}
                    style={{
                      fontSize: 10,
                      fontWeight: 800,
                      textTransform: "uppercase",
                      letterSpacing: 1,
                      color: i === 0 ? C.dim : i === 1 ? C.copper : C.green,
                    }}
                  >
                    {h}
                  </div>
                ))}
              </div>

              {/* Rows */}
              {TRADEOFFS.map((row, i) => (
                <div
                  key={row.label}
                  style={{
                    display: "grid",
                    gridTemplateColumns: "1.2fr 1.4fr 1.4fr",
                    padding: "14px 20px",
                    gap: 16,
                    background: i % 2 === 0 ? C.surface : C.bg,
                    borderBottom: i < TRADEOFFS.length - 1 ? `1px solid ${C.border}` : "none",
                  }}
                >
                  <div style={{ fontSize: 12, fontWeight: 700, color: C.text }}>{row.label}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{row.pagination}</div>
                  <div style={{ fontSize: 12, color: C.muted, lineHeight: 1.4 }}>{row.infinite}</div>
                </div>
              ))}
            </div>

            {/* Decision guide */}
            <div
              style={{
                marginTop: 32,
                background: C.surface,
                border: `1px solid ${C.border}`,
                borderRadius: 12,
                padding: "24px 28px",
              }}
            >
              <h3 style={{ fontWeight: 800, fontSize: 15, marginBottom: 16, color: C.gold }}>
                Applied to 360Market
              </h3>
              {[
                { surface: "Homepage product feed", choice: "Infinite Scroll", reason: "Discovery browsing — users want to keep seeing more" },
                { surface: "Search results", choice: "Pagination", reason: "User is looking for something specific; URL must be shareable" },
                { surface: "Order history", choice: "Pagination", reason: "User seeks a specific order; needs positional reference" },
                { surface: "Merchant store page", choice: "Infinite Scroll", reason: "Browsing a store catalogue — frictionless discovery" },
                { surface: "Admin product list", choice: "Pagination", reason: "Operators need precise control and shareable team URLs" },
                { surface: "Notification feed", choice: "Infinite Scroll", reason: "Feed behaviour — newest first, no destination" },
              ].map((r) => (
                <div
                  key={r.surface}
                  style={{
                    display: "flex",
                    gap: 16,
                    alignItems: "flex-start",
                    padding: "10px 0",
                    borderBottom: `1px solid ${C.border}`,
                  }}
                >
                  <div style={{ fontSize: 12, color: C.text, fontWeight: 700, minWidth: 180 }}>{r.surface}</div>
                  <div
                    style={{
                      fontSize: 11,
                      fontWeight: 800,
                      color: r.choice === "Pagination" ? C.copper : C.green,
                      minWidth: 110,
                      background: r.choice === "Pagination" ? "#1A0800" : "#001A08",
                      padding: "2px 10px",
                      borderRadius: 20,
                      border: `1px solid ${r.choice === "Pagination" ? C.copper + "40" : C.green + "40"}`,
                    }}
                  >
                    {r.choice}
                  </div>
                  <div style={{ fontSize: 11, color: C.muted, lineHeight: 1.5 }}>{r.reason}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <div
          style={{
            flex: 1,
            display: "grid",
            gridTemplateColumns:
              activeTab === "both"
                ? "1fr 1fr"
                : "1fr",
            gap: 0,
            overflow: "hidden",
          }}
        >
          {(activeTab === "both" || activeTab === "pagination") && (
            <div
              style={{
                borderRight: activeTab === "both" ? `1px solid ${C.border}` : "none",
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <PaginationPanel />
            </div>
          )}
          {(activeTab === "both" || activeTab === "infinite") && (
            <div style={{ overflow: "hidden", display: "flex", flexDirection: "column" }}>
              <InfiniteScrollPanel />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function Page() {
  return (
    <QueryClientProvider client={queryClient}>
      <Demo />
    </QueryClientProvider>
  );
}
