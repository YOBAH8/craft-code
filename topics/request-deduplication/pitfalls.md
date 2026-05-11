# Request Deduplication — Common Pitfalls

---

## ❌ Pitfall 1: Deduplicating POST/mutation requests

Deduplication only makes sense for **idempotent** requests — GET requests that return the same data regardless of how many times you call them.

Never deduplicate POST, PUT, PATCH, or DELETE — each one has a side effect that should happen exactly once. Deduplicating a payment request could mean a user clicks "Pay" twice, one request fires, but both component handlers think it succeeded.

---

## ❌ Pitfall 2: Using the URL alone as the cache key

Two requests to `/api/user` with different Authorization headers are different requests. Using only the URL as the key means User A's cached response could be served to User B.

Your cache key should include anything that affects the response:
```js
const cacheKey = `${url}::${JSON.stringify(headers.Authorization)}`
```

Or scope the cache per-user session.

---

## ❌ Pitfall 3: Never clearing the in-flight map on error

If a request fails and throws an error, and you don't clean up the in-flight map, subsequent calls to that URL will receive a rejected Promise forever.

Always use `.finally()` to clean up:

```js
const promise = fetch(url)
  .then(r => r.json())
  .finally(() => {
    inFlightRequests.delete(url) // runs on both success and error
  })
```

---

## ❌ Pitfall 4: Sharing error state across requesters

If the shared Promise rejects, every component waiting on it gets the error. This is usually fine, but make sure each component handles the error independently — don't assume one error handler covers all.

---

## ❌ Pitfall 5: Cache growing unboundedly

A response cache without a TTL or size limit will grow forever. In single-page apps with long sessions, this can cause memory issues.

Set a TTL (time-to-live) and a max cache size:
```js
const MAX_CACHE_SIZE = 100

if (responseCache.size >= MAX_CACHE_SIZE) {
  // Remove oldest entry
  const firstKey = responseCache.keys().next().value
  responseCache.delete(firstKey)
}
```
