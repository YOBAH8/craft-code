# 09 — Infinite Scroll vs Pagination (Tradeoffs)

> **The wrong choice kills UX. The right choice depends on what your users are actually doing.**

Most developers pick one because they've seen it before, or because it's easier to implement. Senior engineers pick one because of *what the user needs to do with the data*. This topic breaks down the real engineering tradeoffs — including the backend query strategies that power each one.

---

## The Mental Model First

Before any code, ask this question:

> **Does the user need to find a specific item, or are they browsing?**

| User intent | Right choice |
|---|---|
| "I'm looking for a specific product I saw before" | **Pagination** |
| "Show me more posts, I'll stop when something catches me" | **Infinite Scroll** |
| "I need to process every item in this list" | **Pagination** |
| "I want to discover content" | **Infinite Scroll** |

That single question eliminates 80% of bad decisions.

---

## What Actually Is Each One?

### Traditional Pagination

The server returns a fixed page of results. The user navigates between pages explicitly — clicking "Next", "Previous", or a specific page number.

```
GET /products?page=3&per_page=20

Response:
{
  "data": [...20 items],
  "meta": {
    "current_page": 3,
    "last_page": 47,
    "per_page": 20,
    "total": 934,
    "from": 41,
    "to": 60
  }
}
```

### Infinite Scroll

The server returns a batch of results with a cursor. When the user reaches the bottom of the list, the next batch is automatically fetched and appended. There are no page numbers.

```
GET /products?cursor=eyJpZCI6NjB9&limit=20

Response:
{
  "data": [...20 items],
  "next_cursor": "eyJpZCI6ODB9",
  "has_more": true
}
```

> **Note:** Infinite scroll almost always uses cursor-based pagination under the hood, not offset-based. This is critical — see the [Backend Strategy](#backend-strategy-the-part-most-tutorials-skip) section.

---

## The Real Tradeoffs

### 1. URL State & Shareability

**Pagination wins here. Decisively.**

With pagination, the current page lives in the URL: `/products?page=3`. A user can:
- Copy the URL and share exactly what they were looking at
- Bookmark page 5 and come back to it tomorrow
- Press the browser back button and return to page 3, not page 1
- Share a specific result set with a colleague

With infinite scroll, URL state is almost never preserved. If a user scrolls to item 200, clicks into a product, then hits the browser back button — they start back at item 1. **This is one of the most common UX complaints about infinite scroll**, and it's an engineering failure disguised as a product decision.

**Fix:** You can preserve scroll position with the [History API](https://developer.mozilla.org/en-US/docs/Web/API/History_API), but it's genuinely complex to implement correctly. Most teams don't.

---

### 2. Performance & Memory

**Infinite scroll creates a growing DOM problem.**

Each batch appended to the list adds more DOM nodes. After 10 batches of 20 items, you have 200 DOM nodes. After 50 batches — 1,000 nodes. On low-RAM Android devices (Tecno, Infinix), this causes:
- Janky scrolling
- Increased memory usage
- Browser tab crashes on older devices

**Fix:** Implement *list virtualisation* — only render the DOM nodes that are visible in the viewport. Libraries like `react-window` or `@tanstack/react-virtual` handle this, but they add significant complexity to your infinite scroll implementation.

Pagination sidesteps this entirely — you only ever have 20 items in the DOM at once.

---

### 3. SEO

**Pagination wins here too.**

Search engine crawlers follow links. Paginated pages (`/products?page=2`) are crawlable. Infinite scroll content that loads via JavaScript API calls is often invisible to crawlers.

If your content needs to rank in Google — product listings, articles, directory pages — pagination is not just better, it's often required.

---

### 4. User Control & Cognitive Load

**It depends.**

Pagination gives users explicit control. They know they're on page 3 of 47. They can jump to page 10. They can tell someone "it's on page 4." That information density is valuable for task-oriented users.

Infinite scroll removes friction from discovery. Social feeds, content discovery platforms, and news aggregators are better with infinite scroll because users aren't trying to reach a destination — they're grazing. Removing page breaks keeps them in flow.

The dark pattern: **infinite scroll was engineered to be addictive.** Removing the natural stopping point of "end of page" keeps users engaged longer. This is deliberate on social platforms. It may not align with your users' actual goals.

---

### 5. Implementation Complexity

| | Pagination | Infinite Scroll |
|---|---|---|
| Backend query | `LIMIT 20 OFFSET 60` (simple, but has scaling problems) | Cursor-based (more complex, scales better) |
| Frontend | Page number state, prev/next buttons | IntersectionObserver, scroll position management |
| URL state | Trivial — just `?page=3` | Complex — requires History API if you want it |
| Back button | Works by default | Requires manual implementation |
| Loading states | One loading state per page change | Initial load + "loading more" state |
| Error recovery | Retry the page | Retry from the last cursor |

---

## Backend Strategy: The Part Most Tutorials Skip

This is where most implementations go wrong at scale.

### Offset Pagination — Simple but Broken at Scale

```sql
-- Page 3, 20 items per page
SELECT * FROM products
ORDER BY created_at DESC
LIMIT 20 OFFSET 40;
```

This works perfectly up to ~100,000 rows. Beyond that, it becomes a serious performance problem.

**Why?** The database doesn't skip rows — it *reads and discards* them. `OFFSET 40` means PostgreSQL reads 40 rows, throws them away, then returns the next 20. At `OFFSET 10000`, it reads 10,000 rows and throws them away. At `OFFSET 100000`, your query is scanning 100,000+ rows on every page load.

**The second problem:** Data shifting. If a new product is inserted while a user is on page 3, every subsequent page shifts by one. The user may see duplicates or miss items. Unacceptable for a marketplace.

### Cursor Pagination — The Right Way

Instead of "give me rows 40–60", you say "give me 20 rows after this specific item."

```sql
-- First page — no cursor
SELECT * FROM products
WHERE active = true
ORDER BY created_at DESC, id DESC
LIMIT 20;

-- Next page — cursor is the last item's (created_at, id)
SELECT * FROM products
WHERE active = true
  AND (created_at, id) < ('2026-05-15 10:23:00', 1847)
ORDER BY created_at DESC, id DESC
LIMIT 20;
```

**Why this is fast:** The `WHERE` clause with an indexed column (`created_at`, `id`) lets PostgreSQL jump directly to the right position using a B-tree index scan. No rows are read and discarded. Performance stays constant whether you're on page 1 or page 5,000.

**Why you need two columns:** Using `created_at` alone breaks when two rows have the same timestamp. Including `id` (unique, sequential) as a tiebreaker makes the cursor stable.

**How to encode the cursor:** Don't expose raw database values. Base64-encode the cursor values:

```js
// Encode
const cursor = Buffer.from(
  JSON.stringify({ created_at: "2026-05-15T10:23:00Z", id: 1847 })
).toString("base64");
// → "eyJjcmVhdGVkX2F0IjoiMjAyNi0wNS0xNVQxMDoyMzowMFoiLCJpZCI6MTg0N30="

// Decode on the server
const { created_at, id } = JSON.parse(
  Buffer.from(cursorParam, "base64").toString("utf8")
);
```

### Laravel Implementation

```php
// app/Http/Controllers/ProductController.php

public function index(Request $request)
{
    $limit = min($request->integer('limit', 20), 100);
    $cursor = $request->string('cursor')->toString();

    $query = Product::query()
        ->where('active', true)
        ->orderByDesc('created_at')
        ->orderByDesc('id');

    if ($cursor) {
        $decoded = json_decode(base64_decode($cursor), true);

        $query->where(function ($q) use ($decoded) {
            $q->where('created_at', '<', $decoded['created_at'])
              ->orWhere(function ($q2) use ($decoded) {
                  $q2->where('created_at', $decoded['created_at'])
                     ->where('id', '<', $decoded['id']);
              });
        });
    }

    $products = $query->limit($limit + 1)->get(); // fetch one extra to check hasMore

    $hasMore = $products->count() > $limit;
    $items = $products->take($limit);

    $nextCursor = null;
    if ($hasMore) {
        $last = $items->last();
        $nextCursor = base64_encode(json_encode([
            'created_at' => $last->created_at->toISOString(),
            'id'         => $last->id,
        ]));
    }

    return response()->json([
        'data'        => ProductResource::collection($items),
        'next_cursor' => $nextCursor,
        'has_more'    => $hasMore,
    ]);
}
```

> The `limit + 1` trick: fetch one more item than needed. If you get it, there are more pages. Return only `limit` items, but you now know `has_more = true` without a separate `COUNT(*)` query.

---

## Frontend Implementation

See the `/demo` folder for a full runnable Next.js example.

### Infinite Scroll with TanStack Query

```tsx
// The key hook — useInfiniteQuery handles cursor chaining automatically
const {
  data,
  fetchNextPage,
  hasNextPage,
  isFetchingNextPage,
  status,
} = useInfiniteQuery({
  queryKey: ['products', filters],
  queryFn: ({ pageParam }) => fetchProducts({ cursor: pageParam, ...filters }),
  initialPageParam: undefined,
  getNextPageParam: (lastPage) => lastPage.next_cursor ?? undefined,
});

// Flatten pages into a single array for rendering
const products = data?.pages.flatMap((page) => page.data) ?? [];
```

### The IntersectionObserver Pattern

The right way to trigger "load more" — no scroll event listeners, no scroll position arithmetic:

```tsx
// A sentinel element at the bottom of the list
// When it enters the viewport, load the next page

const sentinelRef = useRef<HTMLDivElement>(null);

useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && hasNextPage && !isFetchingNextPage) {
        fetchNextPage();
      }
    },
    { rootMargin: '200px' } // start loading 200px before the bottom
  );

  if (sentinelRef.current) observer.observe(sentinelRef.current);
  return () => observer.disconnect();
}, [hasNextPage, isFetchingNextPage, fetchNextPage]);

// In JSX:
<div ref={sentinelRef} style={{ height: 1 }} />
```

The `rootMargin: '200px'` is critical on mobile — it preloads the next batch before the user actually hits the bottom, eliminating the "loading gap" on slow connections.

### Pagination with TanStack Query

```tsx
const [page, setPage] = useState(1);

const { data, isPlaceholderData } = useQuery({
  queryKey: ['products', page, filters],
  queryFn: () => fetchProducts({ page, ...filters }),
  placeholderData: keepPreviousData, // keeps old data visible while new page loads
});
```

`keepPreviousData` is the key detail here — without it, the UI flashes empty on every page change. With it, the previous page stays visible until the new page arrives, creating a smooth transition.

---

## Decision Framework

```
Is the content primarily for discovery/browsing?
├── YES → Is the list potentially very long (1000+ items)?
│   ├── YES → Infinite scroll + virtualisation
│   └── NO  → Either works; infinite scroll for feel
└── NO (user is searching/filtering for something specific)
    ├── Does the URL need to be shareable?
    │   ├── YES → Pagination (required)
    │   └── NO  → Either works
    ├── Does content need to rank in Google?
    │   └── YES → Pagination (required)
    └── Does the user need to reference a position ("it was on page 3")?
        └── YES → Pagination
```

### Applied to 360Market

| Surface | Choice | Reason |
|---|---|---|
| Homepage product feed | **Infinite Scroll** | Discovery browsing, users want to keep seeing more |
| Search results | **Pagination** | User is looking for something specific, URL must be shareable |
| Order history | **Pagination** | User is looking for a specific order, needs position reference |
| Merchant store page | **Infinite Scroll** | Browsing a store's catalogue |
| Admin product list | **Pagination** | Operators need precise control, shareable URLs for team communication |
| Notifications | **Infinite Scroll** | Feed behaviour, newest first |

---

## Key Takeaways

1. **Infinite scroll ≠ cursor pagination.** Infinite scroll is a UX pattern. Cursor pagination is a backend query strategy. You can use cursor pagination with page numbers. You can (badly) use offset pagination with infinite scroll. They are independent decisions.

2. **Never use `OFFSET` at scale.** `OFFSET 10000` on a 1M row table is a silent performance bomb. Use cursor-based queries from the start.

3. **Infinite scroll needs virtualisation at scale.** Without `react-window` or `@tanstack/react-virtual`, infinite scroll degrades into a memory leak on mobile devices.

4. **The back button problem is real.** If your infinite scroll doesn't handle browser history, users will hate it. Plan for this before shipping.

5. **Search results pages should always be paginated.** This is not negotiable if you want Google to index your content.

---

## Further Reading

- [MDN: IntersectionObserver API](https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API)
- [TanStack Query: Infinite Queries](https://tanstack.com/query/latest/docs/framework/react/guides/infinite-queries)
- [Use the index, Luke: Pagination](https://use-the-index-luke.com/no-offset)
- [Web.dev: Infinite scroll without layout shifts](https://web.dev/articles/virtualize-long-lists-react-window)