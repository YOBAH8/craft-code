# Stale-While-Revalidate (SWR)

## What is it?

Stale-While-Revalidate is an HTTP caching strategy — and a React data fetching pattern — where you:

1. **Immediately serve stale (cached) data** to the user
2. **Simultaneously revalidate in the background** by fetching fresh data
3. **Update the UI** once fresh data arrives

The user sees *something* instantly (the stale data), then the UI quietly updates when the fresh data is ready. No loading spinner. No blank screen. No waiting.

The name comes from the HTTP `Cache-Control` header:
```
Cache-Control: max-age=1, stale-while-revalidate=59
```
This tells the browser: "treat this as fresh for 1 second, but serve it stale for up to 59 more seconds while you fetch a new copy."

---

## The problem it solves

Traditional caching creates a binary choice:

**Option A — Always fresh:** Show a loading spinner every time. Slow, frustrating.  
**Option B — Always cached:** Show stale data. Fast, but potentially wrong.

SWR gives you **both fast AND accurate** — with a small delay on accuracy.

```
Without SWR:
  User navigates to page → loading spinner → data loads → user reads

With SWR:
  User navigates to page → stale data shows instantly → data quietly updates
```

---

## How it works

```
1. User requests data
         ↓
2. Is it in cache?
   YES → Return cache immediately → show to user (stale)
         → Revalidate in background → update UI when fresh data arrives
   NO  → Fetch fresh → store in cache → show to user
```

The key is step 2's YES branch — you don't block the user on the fresh fetch.

---

## When to use it

✅ Data that changes moderately (user feeds, notifications, dashboard stats)  
✅ Navigation between pages — old page data loads instantly on back-navigation  
✅ When a 1–5 second stale window is acceptable  
✅ Improving perceived performance without sacrificing accuracy  

## When NOT to use it

❌ Financial data, stock prices, live scores — where stale data is dangerous  
❌ Real-time collaborative features where conflicts matter  
❌ After a user submits a form — you want fresh data immediately to confirm the save  

---

## Code example

See [`example.js`](./example.js) — implementations from scratch and with the SWR library.

---

## The difference between SWR and React Query

Both implement stale-while-revalidate as their core pattern.

| | SWR | TanStack Query |
|---|---|---|
| Bundle size | Smaller | Larger |
| Mutation support | Basic | Rich (optimistic, rollback) |
| Devtools | No | Yes |
| Config flexibility | Less | More |
| Best for | Simple apps, Next.js | Complex data needs |

For most Next.js apps, SWR is the natural choice (same team, built-in integration).

---

## Real-world analogy

Think about a news app on your phone.

When you open it, you see **yesterday's articles instantly** (from cache) while the app fetches today's. Within a second, new articles appear at the top. You were never blocked by a spinner.

That's SWR — show what you have, then quietly make it better.

---

## Further reading

- [RFC 5861 — HTTP Extensions for SWR](https://tools.ietf.org/html/rfc5861)
- [SWR Library by Vercel](https://swr.vercel.app/)
- [web.dev — Stale-While-Revalidate](https://web.dev/stale-while-revalidate/)
