# Request Deduplication

## What is it?

Request deduplication is the practice of ensuring that **multiple simultaneous requests for the same resource result in only one actual network call** — with all requesters receiving the same response.

If five components mount at the same time and all call `fetch('/api/user/me')`, without deduplication you fire five HTTP requests. With deduplication, you fire one — and share the result with all five.

---

## The problem it solves

Modern React apps with component-based architecture create a subtle but serious problem: **multiple components need the same data, and they all fetch it independently.**

```
App mounts
├── Navbar → fetch('/api/user')   ← request 1
├── Sidebar → fetch('/api/user')  ← request 2
├── Feed → fetch('/api/user')     ← request 3
└── Avatar → fetch('/api/user')   ← request 4
```

Result: 4 identical HTTP requests. 4x the bandwidth. 4x the server load. Slower for the user.

This is especially painful on mobile networks, where each request has overhead from connection setup, DNS, TLS handshake — even for small payloads.

---

## How it works

The key insight: **a Promise is shareable**. You don't need to call `fetch()` again if a fetch for that URL is already in progress — you just return the existing Promise.

```
Request for /api/user comes in
↓
Is there already an in-flight request for /api/user?
  YES → return existing Promise (no new network call)
  NO  → create new fetch, store the Promise, return it
↓
When Promise resolves → notify all waiters → clear from in-flight map
```

The "in-flight map" is just a `Map<url, Promise>` — a simple cache of pending requests.

---

## When to use it

✅ Any data shared across multiple components on the same page  
✅ App-level data fetched on mount (user profile, permissions, settings)  
✅ High-traffic pages where many components render simultaneously  
✅ When using a custom fetch wrapper or data layer  

## When NOT to use it

❌ Requests with different payloads/body (POST mutations with unique data)  
❌ Requests where freshness is critical and even 50ms staleness matters  
❌ If you're already using React Query or SWR — they handle this automatically  

---

## Code example

See [`example.js`](./example.js) — a complete implementation of:
- A deduplicating fetch wrapper
- A React hook built on top of it
- A comparison showing with vs without deduplication

---

## How React Query and SWR handle this

Both libraries deduplicate requests by key automatically:

```js
// These two components can mount simultaneously —
// only ONE network request fires for 'user-profile'
function Navbar() {
  const { data } = useQuery({ queryKey: ['user-profile'], queryFn: fetchUser })
}

function Feed() {
  const { data } = useQuery({ queryKey: ['user-profile'], queryFn: fetchUser })
}
```

Understanding *why* this works (the in-flight Promise map pattern) helps you:
- Debug deduplication issues
- Build it yourself when you can't use a library
- Make informed decisions about cache key design

---

## Real-world analogy

Imagine 5 people in an office all ask the receptionist for the latest sales report at the same time.

**Without deduplication:** The receptionist goes to the archive 5 times and brings back 5 copies.  
**With deduplication:** The receptionist goes once, makes one trip, and hands copies to everyone who asked.

---

## Further reading

- [TanStack Query — Query Deduplication](https://tanstack.com/query/latest/docs/framework/react/guides/query-keys)
- [SWR — Deduplication](https://swr.vercel.app/docs/advanced/performance#deduplication)
