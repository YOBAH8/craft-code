# Debounce vs Throttle

## What is it?

Both debounce and throttle are techniques to **control how often a function executes** in response to repeated events. They look similar, behave differently, and developers constantly mix them up.

Getting this wrong means:
- Firing 50 API requests when a user types a search query
- Overloading your server on scroll events
- Laggy UIs that do too much work

---

## The core difference

| | Debounce | Throttle |
|---|---|---|
| **Fires when?** | After the event *stops* | At a *maximum rate* during the event |
| **Use case** | Search input, form validation | Scroll handler, resize handler, rate limiting |
| **Mental model** | "Wait until they're done" | "No more than once per X ms" |

---

## Debounce — "Wait until they stop"

Debounce delays execution until the event hasn't fired for a specified duration.

```
User types: h → e → l → l → o
Debounce (300ms wait):
  h    (timer starts)
  e    (timer resets)
  l    (timer resets)
  l    (timer resets)
  o    (timer resets)
  ... 300ms of silence ...
  → function fires ONCE with "hello"
```

**Perfect for:** Search-as-you-type — you want to query the API once, after the user finishes typing, not on every keystroke.

---

## Throttle — "No more than once per N ms"

Throttle guarantees the function fires at most once per interval, regardless of how often the event fires.

```
User scrolls continuously for 2 seconds
Throttle (200ms):
  0ms   → fires
  200ms → fires
  400ms → fires
  600ms → fires
  ... (fires every 200ms, ignores events in between)
```

**Perfect for:** Scroll handlers, window resize, game loops — you want regular updates, just not on *every single event*.

---

## When to use which

**Debounce:**
- Search input / autocomplete
- Form field validation (check after typing stops)
- Window resize (recalculate layout after user finishes resizing)
- Save-as-you-type (autosave after pause)

**Throttle:**
- Scroll event handlers (infinite scroll, sticky headers)
- Mouse move tracking
- Button clicks that trigger expensive operations (prevent double-submit)
- Sending analytics events on scroll position

---

## Code example

See [`example.js`](./example.js) for:
- Debounce from scratch
- Throttle from scratch
- React hooks for both
- Common real-world usage

---

## The trap developers fall into

Most developers know debounce and throttle exist. Fewer know which one to use.

**Wrong:** "I'll debounce my scroll handler" — debounce fires *after stopping*, so your sticky header would only update after the user stops scrolling. That's wrong.

**Right:** Throttle the scroll handler (regular updates during scroll), debounce the search input (one request after typing stops).

Ask yourself: *"Do I want this to fire after the event stops, or regularly during the event?"*
- After it stops → Debounce
- During it, regularly → Throttle

---

## Further reading

- [Lodash debounce source](https://github.com/lodash/lodash/blob/main/src/debounce.ts) — worth reading, it's well commented
- [CSS Tricks — Debounce and Throttle](https://css-tricks.com/debouncing-throttling-explained-examples/)
- [MDN — requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame) — often better than throttle for visual updates
