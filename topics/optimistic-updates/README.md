# Optimistic UI Updates

## What is it?

Optimistic UI is a pattern where you **update the interface immediately** — before the server confirms the action — and then reconcile with the real server response when it arrives.

The name comes from the assumption that most requests will *succeed*. You optimistically assume success, show the result instantly, and quietly handle the rare failure in the background.

---

## The problem it solves

Here's the standard (naive) flow most developers write:

```
User clicks "Like" → Send API request → Wait... → Update UI ✓
```

The user clicks a button and waits 300–800ms for the server to respond before anything changes. On a slow mobile connection (common across Africa and many markets), that wait can be 1–3 seconds.

Users perceive this as lag. They click again. Things break.

**Optimistic flow:**

```
User clicks "Like" → Update UI instantly → Send API request (background) → Done ✓
                                         ↘ If error → Rollback UI + notify user
```

The user sees an immediate response. The app feels native.

---

## Real-world examples

- **Twitter/X** — heart animation happens before the server confirms
- **WhatsApp** — your message appears with a clock icon before it's delivered
- **Notion** — typing updates the block immediately; sync happens in background
- **Nchito (service marketplace)** — a user saving a handyman to favourites should feel instant, not slow

---

## How it works

Three steps:

1. **Apply the change locally** — update your local state/cache immediately
2. **Fire the API request** — don't await it before updating UI
3. **Handle the outcome**:
   - ✅ Success → do nothing (UI already correct)
   - ❌ Error → roll back the local state + show error to user

---

## When to use it

✅ Actions with a high success rate (likes, bookmarks, toggles, form saves)  
✅ Actions where instant feedback dramatically improves UX  
✅ Simple state changes (boolean toggles, counter increments)  
✅ When your API is reliable but has latency (network, not logic errors)

## When NOT to use it

❌ Actions where failure is likely or consequential (payments, deletions of important data)  
❌ Actions that depend on server-generated values you can't predict (e.g., auto-assigned IDs you immediately need)  
❌ When the server applies complex business logic that could reject the action for non-obvious reasons

---

## Code example

See [`example.jsx`](./example.jsx) — a complete React implementation with:
- Optimistic like button (toggle)
- Proper rollback on error
- Loading/error states

---

## The rollback problem

The trickiest part is rollback. You need to:

1. **Save state before the mutation**
2. Apply optimistic update
3. On error, restore the saved state

```js
// Save snapshot BEFORE mutating
const previousPosts = queryClient.getQueryData(['posts'])

// Optimistically update
queryClient.setQueryData(['posts'], old => ({
  ...old,
  liked: true,
  likes: old.likes + 1
}))

try {
  await likePost(postId)
} catch (error) {
  // Restore snapshot
  queryClient.setQueryData(['posts'], previousPosts)
  toast.error('Failed to like post. Please try again.')
}
```

---

## Common mistakes developers make

See [`pitfalls.md`](./pitfalls.md)

---

## Further reading

- [TanStack Query — Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [SWR — Mutation with Optimistic UI](https://swr.vercel.app/docs/mutation#optimistic-updates)
- [Google — Offline UX Considerations](https://web.dev/offline-ux-design-guidelines/)
