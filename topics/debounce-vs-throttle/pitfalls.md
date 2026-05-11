# Debounce vs Throttle — Common Pitfalls

---

## ❌ Pitfall 1: Using debounce for scroll handlers

Debounce fires *after the event stops*. If you debounce a scroll handler, your sticky header or infinite scroll trigger only activates after the user *stops scrolling* — which is almost certainly wrong.

**Use throttle for scroll.** It fires *during* the scroll at a controlled rate.

---

## ❌ Pitfall 2: Creating a new debounced function on every render

```js
// WRONG — new function created every render, debounce timer resets constantly
function SearchBar() {
  const handleSearch = debounce((query) => fetchResults(query), 300)
  return <input onChange={e => handleSearch(e.target.value)} />
}
```

The debounced function must be **stable** across renders. Use `useRef` or `useCallback`:

```js
// RIGHT — stable reference, timer accumulates correctly
function SearchBar() {
  const handleSearch = useRef(debounce((query) => fetchResults(query), 300)).current
  return <input onChange={e => handleSearch(e.target.value)} />
}
```

---

## ❌ Pitfall 3: Not cancelling on unmount

Debounced functions hold timers. If a component unmounts before the timer fires, the callback still executes — potentially calling `setState` on an unmounted component (or making a stale API call).

```js
useEffect(() => {
  const debouncedFn = debounce(fn, 300)
  input.addEventListener('input', debouncedFn)

  return () => {
    input.removeEventListener('input', debouncedFn)
    debouncedFn.cancel?.() // lodash debounce supports .cancel()
  }
}, [])
```

---

## ❌ Pitfall 4: Using debounce when you needed leading-edge

Standard debounce fires *after* the delay. For form submissions or payment buttons, you often want to fire *immediately* on first click, then block subsequent clicks.

That's **leading-edge debounce** (or throttle). Don't use trailing debounce on buttons — the user clicks and nothing happens immediately, which feels broken.

---

## ❌ Pitfall 5: Too long or too short a delay

- 300ms is the sweet spot for search inputs
- 100–200ms for scroll/resize handlers
- Less than 100ms: barely reduces work, adds complexity
- More than 500ms: perceptibly slow for users

Test with your actual API response time — if the API takes 100ms, a 50ms debounce barely helps.

---

## ❌ Pitfall 6: Debouncing when you should use requestAnimationFrame

For visual updates tied to scroll or animation, `requestAnimationFrame` is usually better than throttle. It syncs with the browser's paint cycle (typically 60fps) — giving you smooth visuals with zero wasted renders.

```js
// Instead of throttling a visual update:
let ticking = false
window.addEventListener('scroll', () => {
  if (!ticking) {
    requestAnimationFrame(() => {
      updateParallaxEffect(window.scrollY)
      ticking = false
    })
    ticking = true
  }
})
```
