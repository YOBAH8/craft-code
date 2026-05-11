/**
 * Debounce vs Throttle — Complete Implementations
 *
 * Built from scratch so you understand the mechanism,
 * not just how to call lodash.
 */

import { useState, useEffect, useRef, useCallback } from 'react'


// ─────────────────────────────────────────────
// DEBOUNCE — from scratch
// "Wait until they stop, then fire once"
// ─────────────────────────────────────────────

/**
 * debounce
 *
 * Returns a new function that delays invoking `fn` until
 * `delay` ms have passed since the last call.
 *
 * @param {Function} fn - function to debounce
 * @param {number} delay - milliseconds to wait after last call
 */
function debounce(fn, delay) {
  let timer = null

  return function (...args) {
    // Every call resets the timer
    clearTimeout(timer)

    timer = setTimeout(() => {
      fn.apply(this, args) // call with original context and args
      timer = null
    }, delay)
  }
}

// Usage — search API called once, 300ms after user stops typing
const searchAPI = debounce(async (query) => {
  console.log(`Searching for: ${query}`)
  const results = await fetch(`/api/search?q=${query}`).then(r => r.json())
  return results
}, 300)

// In an event handler:
// input.addEventListener('input', e => searchAPI(e.target.value))


// ─────────────────────────────────────────────
// THROTTLE — from scratch
// "Fire at most once per N ms"
// ─────────────────────────────────────────────

/**
 * throttle
 *
 * Returns a new function that can only fire once per `interval` ms.
 * Calls during the cooldown period are dropped.
 *
 * @param {Function} fn - function to throttle
 * @param {number} interval - minimum ms between calls
 */
function throttle(fn, interval) {
  let lastCalled = 0

  return function (...args) {
    const now = Date.now()

    if (now - lastCalled >= interval) {
      lastCalled = now
      fn.apply(this, args)
    }
    // else: called too soon, drop this invocation
  }
}

// Usage — scroll handler updates header at most every 100ms
const handleScroll = throttle(() => {
  const scrollY = window.scrollY
  const header = document.querySelector('header')
  if (header) {
    header.style.boxShadow = scrollY > 50 ? '0 2px 8px rgba(0,0,0,0.1)' : 'none'
  }
}, 100)

// window.addEventListener('scroll', handleScroll)


// ─────────────────────────────────────────────
// LEADING-EDGE DEBOUNCE
// Fires IMMEDIATELY on first call, then ignores
// subsequent calls until quiet again.
// Useful for button click prevention.
// ─────────────────────────────────────────────

function debounceLeading(fn, delay) {
  let timer = null

  return function (...args) {
    if (!timer) {
      // No active timer — fire immediately
      fn.apply(this, args)
    }

    clearTimeout(timer)

    timer = setTimeout(() => {
      timer = null // reset so next call fires immediately again
    }, delay)
  }
}

// Usage — prevent double-click on payment button
// First click fires instantly, subsequent clicks within 2s are ignored
const handlePayment = debounceLeading(async () => {
  console.log('Processing payment...')
  await submitPayment()
}, 2000)


// ─────────────────────────────────────────────
// REACT HOOK — useDebounce
// ─────────────────────────────────────────────

/**
 * useDebounce
 *
 * Returns a debounced version of `value` that only updates
 * after `delay` ms of no changes.
 *
 * Use this for search inputs — the debounced value is what
 * you pass to your API call or filter function.
 */
function useDebounce(value, delay = 300) {
  const [debouncedValue, setDebouncedValue] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedValue(value)
    }, delay)

    return () => clearTimeout(timer) // cleanup on value change or unmount
  }, [value, delay])

  return debouncedValue
}

// Example component using useDebounce
function SearchBar() {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState([])

  // Only updates 400ms after user stops typing
  const debouncedQuery = useDebounce(query, 400)

  useEffect(() => {
    if (!debouncedQuery.trim()) {
      setResults([])
      return
    }

    // This only fires once per "pause", not on every keystroke
    fetch(`/api/search?q=${encodeURIComponent(debouncedQuery)}`)
      .then(r => r.json())
      .then(setResults)
  }, [debouncedQuery]) // ← triggered by debounced value, not raw query

  return (
    <div>
      <input
        type="text"
        value={query}
        onChange={e => setQuery(e.target.value)}
        placeholder="Search..."
      />
      <ul>
        {results.map(result => (
          <li key={result.id}>{result.title}</li>
        ))}
      </ul>
    </div>
  )
}


// ─────────────────────────────────────────────
// REACT HOOK — useThrottle
// ─────────────────────────────────────────────

/**
 * useThrottle
 *
 * Returns a throttled callback that fires at most once per `interval` ms.
 * Stable reference — safe to use in event listeners.
 */
function useThrottle(fn, interval = 100) {
  const lastCalled = useRef(0)
  const fnRef = useRef(fn)

  // Keep fnRef current without triggering re-creation
  useEffect(() => {
    fnRef.current = fn
  }, [fn])

  return useCallback((...args) => {
    const now = Date.now()
    if (now - lastCalled.current >= interval) {
      lastCalled.current = now
      fnRef.current(...args)
    }
  }, [interval])
}

// Example — infinite scroll with throttled scroll handler
function InfiniteList() {
  const [items, setItems] = useState([])
  const [page, setPage] = useState(1)

  const handleScroll = useThrottle(() => {
    const { scrollTop, scrollHeight, clientHeight } = document.documentElement
    const nearBottom = scrollTop + clientHeight >= scrollHeight - 200

    if (nearBottom) {
      setPage(prev => prev + 1)
    }
  }, 200)

  useEffect(() => {
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [handleScroll])

  useEffect(() => {
    fetch(`/api/items?page=${page}`)
      .then(r => r.json())
      .then(newItems => setItems(prev => [...prev, ...newItems]))
  }, [page])

  return (
    <ul>
      {items.map(item => <li key={item.id}>{item.name}</li>)}
    </ul>
  )
}


export { debounce, throttle, debounceLeading, useDebounce, useThrottle }
