# Cursor-Based Pagination

## What is it?

Cursor-based pagination (also called keyset pagination) is a technique for paginating through large datasets using a pointer to a specific record — the cursor — rather than a numeric page number or offset.

Instead of saying "give me page 3", you say "give me the next 20 records after this specific item."

```
Offset-based:  GET /api/posts?page=3&limit=20
Cursor-based:  GET /api/posts?cursor=eyJpZCI6MTIzfQ&limit=20
```

The cursor is typically a base64-encoded version of the last record's unique identifier or sort key.

---

## The problem it solves

Offset pagination (`LIMIT 20 OFFSET 60`) has a fundamental flaw: the offset becomes incorrect the moment new data is inserted.

```
User loads page 1 (posts 1–20)
↓
Another user publishes a new post (it goes to the top)
↓
User loads page 2 (posts 21–40)
↓
What they actually get: posts 20–39

Post 20 is shown TWICE. Post 21 is SKIPPED.
```

This is the **data drift problem**. On fast-moving feeds (Twitter, Instagram, live dashboards), it makes offset pagination nearly unusable.

Cursor-based pagination eliminates drift entirely. You're not saying "skip N records" — you're saying "start after this specific record." New data above or below doesn't shift your cursor.

There's also a **performance problem** with offsets. `OFFSET 10000` on a SQL database doesn't skip those rows — it reads and discards them. On a table with millions of rows, deep pages become painfully slow.

```sql
-- Offset (slow at scale — scans and discards 10,000 rows)
SELECT * FROM posts ORDER BY created_at DESC LIMIT 20 OFFSET 10000;

-- Cursor (fast — seeks directly to the record)
SELECT * FROM posts WHERE created_at < '2024-01-15T10:30:00Z' ORDER BY created_at DESC LIMIT 20;
```

---

## How it works

### The cursor

A cursor encodes the position of the last item the client received. It can encode:

- A **single field**: `{ id: 123 }` — works if IDs are sequential
- A **composite field**: `{ created_at: "2024-01-15T10:30:00Z", id: 123 }` — required when sorting by a non-unique field

The cursor is base64-encoded before sending to the client so it's opaque — clients shouldn't need to understand its internals.

### Server flow

```
Client sends: GET /api/posts?cursor=eyJpZCI6MTIzfQ&limit=20
↓
Server decodes cursor: { id: 123 }
↓
Server queries: WHERE id < 123 ORDER BY id DESC LIMIT 20
↓
Server returns: { data: [...20 posts], nextCursor: "eyJpZCI6MTAzfQ", hasMore: true }
↓
Client stores nextCursor, uses it for next request
```

### Client flow

```
First load:   GET /api/posts?limit=20
              ← { data: [...], nextCursor: "abc", hasMore: true }

Load more:    GET /api/posts?cursor=abc&limit=20
              ← { data: [...], nextCursor: "xyz", hasMore: true }

End of data:  GET /api/posts?cursor=xyz&limit=20
              ← { data: [...], nextCursor: null, hasMore: false }
```

---

## When to use it

✅ Feeds, timelines, activity logs — data where new records are frequently inserted  
✅ Infinite scroll — the natural partner for cursor pagination  
✅ Large datasets where deep offset queries become slow  
✅ Real-time or near-real-time data sources  
✅ Any API you're building that consumers will scroll through  

## When NOT to use it

❌ When users need to jump to arbitrary pages ("go to page 47")  
❌ When users need to see total page count ("showing page 3 of 12")  
❌ Small, static datasets where offset pagination is simple and sufficient  
❌ When your sort order changes frequently (cursor becomes invalid if data is re-sorted)  

---

## Code example

See [`example.js`](./example.js) — full implementation with:

- Server-side cursor encoding/decoding (Node.js/Express)
- Database query with cursor condition
- React hook for cursor-paginated data with "load more"
- Infinite scroll integration

---

## Cursor design: simple vs composite

**Simple cursor** (sort by unique ID):

```js
// Works perfectly when sorting by a unique, sequential field
const cursor = Buffer.from(JSON.stringify({ id: lastItem.id })).toString('base64')
// Query: WHERE id < ? ORDER BY id DESC
```

**Composite cursor** (sort by non-unique field):

```js
// Required when sorting by created_at, score, or other non-unique fields
// Without the ID tiebreaker, records with identical timestamps get skipped/duplicated
const cursor = Buffer.from(JSON.stringify({
  created_at: lastItem.created_at,
  id: lastItem.id  // tiebreaker — ensures uniqueness
})).toString('base64')
// Query: WHERE (created_at < ? OR (created_at = ? AND id < ?)) ORDER BY created_at DESC, id DESC
```

---

## Common pitfalls

### ❌ Pitfall 1: Using a non-unique field as the sole cursor

If you sort by `created_at` and use it as your only cursor field, records created at the same timestamp will cause items to be skipped or duplicated.

```js
// Wrong — cursor loses position when timestamps collide
const cursor = encodeCursor({ created_at: lastItem.created_at })
// Query: WHERE created_at < ?   ← skips items with identical timestamp

// Right — always include a unique tiebreaker
const cursor = encodeCursor({ created_at: lastItem.created_at, id: lastItem.id })
// Query: WHERE (created_at < ?) OR (created_at = ? AND id < ?)
```

### ❌ Pitfall 2: Exposing raw cursor internals

Sending `cursor={"id":123}` directly lets clients manipulate pagination. Always base64-encode (or HMAC-sign for sensitive data) the cursor:

```js
const cursor = Buffer.from(JSON.stringify({ id: 123 })).toString('base64url')
```

### ❌ Pitfall 3: Not handling deleted records between pages

If a user loads page 1, then an item from page 1 is deleted, and they load page 2 using the cursor of that deleted item — your query breaks or returns incorrect results.

Handle this by:
- Using `<=` instead of `<` and deduplicating on the client
- Checking if the cursor record still exists and falling back gracefully
- Designing your cursor around stable fields (like auto-increment IDs that are never reused)

### ❌ Pitfall 4: Fetching N+1 to determine `hasMore`

```js
// Wrong — two queries
const data = await db('posts').limit(limit)
const total = await db('posts').count()  // expensive!
const hasMore = data.length + offset < total

// Right — one query, fetch limit+1
const rows = await db('posts').limit(limit + 1)
const hasMore = rows.length > limit
const data = rows.slice(0, limit)
```

### ❌ Pitfall 5: Allowing users to jump to arbitrary pages

Cursor pagination doesn't support "go to page 47." If your product requires page jumping, random access, or showing "page X of Y", cursor pagination is the wrong tool. Use offset pagination instead, or a hybrid (cursor for the feed, offset for admin/search).

### ❌ Pitfall 6: Not invalidating stale cursors

Cursors can become invalid when the item the cursor points to is deleted, the sort order changes, or the schema changes. Always handle `400 Invalid cursor` by resetting to the first page:

```js
if (response.status === 400) {
  reset() // clear cursor, reload from beginning
}
```

### ❌ Pitfall 7: Forgetting to cap the limit parameter

```js
// Always clamp the limit — never trust the client
const limit = Math.min(parseInt(req.query.limit) || 20, 100)
```

---

## Real-world analogy

Imagine reading a very long book by bookmarking the last page you read. Next session, you open to your bookmark and continue. It doesn't matter if the publisher inserted new chapters before your bookmark — you always resume from exactly where you left off.

Offset pagination is like saying "start at page 147" — fine until chapters are inserted before page 147 and your position shifts.

---

## Further reading

- [Slack Engineering — Evolving API Pagination](https://slack.engineering/evolving-api-pagination-at-slack/)
- [Stripe API — Cursor Pagination](https://stripe.com/docs/api/pagination)
- [Use The Index, Luke — Pagination](https://use-the-index-luke.com/sql/partial-results/fetch-next-page)
