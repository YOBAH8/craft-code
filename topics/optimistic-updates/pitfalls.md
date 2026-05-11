# Optimistic Updates — Common Pitfalls

---

## ❌ Pitfall 1: Not saving a rollback snapshot

Most developers apply the optimistic update but forget to store the previous state.
When the request fails, they have no way to undo the change.

**Wrong:**
```js
setLiked(true) // no snapshot saved
await likePost(id) // if this throws, liked is stuck on true
```

**Right:**
```js
const previousLiked = liked  // save first
setLiked(true)
try {
  await likePost(id)
} catch {
  setLiked(previousLiked)  // restore on failure
}
```

---

## ❌ Pitfall 2: Showing a spinner while being "optimistic"

If you show a loading spinner, you've defeated the entire purpose. The UI should look complete and final, not in-progress.

The only acceptable loading indicator is a subtle "pending" style (e.g., reduced opacity) to signal background activity — not a blocking spinner.

---

## ❌ Pitfall 3: Not handling race conditions

If the user clicks Like → Unlike → Like very fast, multiple requests fly in parallel.
The last response to arrive (not the last sent) wins — which may contradict the UI.

**Solution:** Cancel previous in-flight requests before firing new ones, or debounce the action.

```js
// Using AbortController for cancellation
let controller = null

async function handleLike() {
  if (controller) controller.abort() // cancel previous request
  controller = new AbortController()

  try {
    await fetch('/api/like', { signal: controller.signal })
  } catch (e) {
    if (e.name === 'AbortError') return // expected, ignore
    // handle real error
  }
}
```

---

## ❌ Pitfall 4: Using optimistic updates for irreversible actions

Payments, permanent deletions, sending emails — these should NOT be optimistic.
The user needs a real confirmation before seeing a success state for high-stakes actions.

Rule of thumb: if your rollback message would be "we charged you but then reversed it" — don't use optimistic updates.

---

## ❌ Pitfall 5: Not handling the offline case

Optimistic updates give a false impression of success when the device is offline.
The request silently fails, the UI looks correct, but no change was persisted.

Handle this by:
- Checking `navigator.onLine` before mutating
- Using a service worker with background sync
- Marking pending items visually until confirmed by server

---

## ❌ Pitfall 6: Forgetting to reconcile with server response

After the server confirms, some developers never update the UI with the server's actual data.
The server might have incremented the count differently (e.g., another user also liked at the same time).

Always sync with `onSettled` or `onSuccess` by invalidating the query or setting the real server value.
