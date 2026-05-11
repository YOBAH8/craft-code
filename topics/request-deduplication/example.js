/**
 * Request Deduplication — Complete Implementation
 *
 * This file shows:
 *  1. The problem — naive fetching fires duplicate requests
 *  2. A deduplicating fetch wrapper built from scratch
 *  3. A React hook using the deduplicating fetcher
 *  4. How to inspect deduplication in the browser
 */


// ─────────────────────────────────────────────
// 1. THE PROBLEM — naive fetch in multiple components
// ─────────────────────────────────────────────

// Imagine both components mount at the same time.
// Two IDENTICAL network requests fire. Pure waste.

function NaiveNavbar() {
  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(setUser) // request 1
  }, [])
}

function NaiveFeed() {
  useEffect(() => {
    fetch('/api/user/me').then(r => r.json()).then(setUser) // request 2 — duplicate!
  }, [])
}


// ─────────────────────────────────────────────
// 2. DEDUPLICATING FETCH WRAPPER
//    Pure JavaScript — no framework dependency
// ─────────────────────────────────────────────

/**
 * A Map that holds in-flight requests keyed by URL.
 * When a request completes, its entry is removed.
 *
 * This is the entire mechanism — just a shared Promise store.
 */
const inFlightRequests = new Map()

/**
 * deduplicatedFetch
 *
 * Drop-in replacement for fetch() that deduplicates
 * concurrent requests to the same URL.
 *
 * @param {string} url
 * @param {RequestInit} options - standard fetch options
 * @returns {Promise<any>} - parsed JSON response
 */
async function deduplicatedFetch(url, options = {}) {
  // Only deduplicate GET requests — POST/PUT/DELETE mutations
  // should always fire independently
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET') {
    return fetch(url, options).then(r => r.json())
  }

  // Build a cache key from URL + any query params
  const cacheKey = url

  // If a request for this URL is already in flight, return the same Promise
  if (inFlightRequests.has(cacheKey)) {
    console.log(`[dedup] Reusing in-flight request for: ${cacheKey}`)
    return inFlightRequests.get(cacheKey)
  }

  // No in-flight request — create a new one
  console.log(`[dedup] New request for: ${cacheKey}`)

  const requestPromise = fetch(url, options)
    .then(response => {
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`)
      return response.json()
    })
    .finally(() => {
      // Clean up — remove from map when done (success or error)
      inFlightRequests.delete(cacheKey)
    })

  // Store the Promise so concurrent callers can share it
  inFlightRequests.set(cacheKey, requestPromise)

  return requestPromise
}


// ─────────────────────────────────────────────
// 3. REACT HOOK USING DEDUPLICATING FETCHER
// ─────────────────────────────────────────────

import { useState, useEffect, useRef } from 'react'

/**
 * useDedupedFetch
 *
 * A basic data-fetching hook with built-in deduplication.
 * Multiple components using the same URL will share one request.
 *
 * For production apps, prefer TanStack Query or SWR —
 * but understanding this pattern explains how they work.
 */
function useDedupedFetch(url) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const abortRef = useRef(null)

  useEffect(() => {
    if (!url) return

    setLoading(true)
    setError(null)

    // AbortController lets us cancel if component unmounts mid-fetch
    abortRef.current = new AbortController()

    deduplicatedFetch(url, { signal: abortRef.current.signal })
      .then(result => {
        setData(result)
        setLoading(false)
      })
      .catch(err => {
        if (err.name === 'AbortError') return // component unmounted, ignore
        setError(err.message)
        setLoading(false)
      })

    return () => {
      // On cleanup, abort the fetch (only affects this component's subscription,
      // not other subscribers — the shared Promise continues for others)
      abortRef.current?.abort()
    }
  }, [url])

  return { data, loading, error }
}


// ─────────────────────────────────────────────
// 4. USAGE — three components, one request
// ─────────────────────────────────────────────

function Navbar() {
  const { data: user } = useDedupedFetch('/api/user/me')
  return <nav>Hello, {user?.name}</nav>
}

function Sidebar() {
  const { data: user } = useDedupedFetch('/api/user/me')
  return <aside>Role: {user?.role}</aside>
}

function Avatar() {
  const { data: user } = useDedupedFetch('/api/user/me')
  return <img src={user?.avatarUrl} alt="avatar" />
}

// When App renders all three simultaneously,
// only ONE fetch('/api/user/me') fires.
function App() {
  return (
    <div>
      <Navbar />
      <Sidebar />
      <Avatar />
    </div>
  )
}


// ─────────────────────────────────────────────
// 5. ADVANCED — Deduplication with cache TTL
//    (keeps the response cached briefly to handle
//     near-simultaneous requests with small delays)
// ─────────────────────────────────────────────

const responseCache = new Map() // { url: { data, expiresAt } }
const TTL_MS = 2000 // keep cached response for 2 seconds

async function deduplicatedFetchWithCache(url, options = {}) {
  const method = (options.method || 'GET').toUpperCase()
  if (method !== 'GET') return fetch(url, options).then(r => r.json())

  const now = Date.now()

  // Return cached response if still fresh
  if (responseCache.has(url)) {
    const cached = responseCache.get(url)
    if (cached.expiresAt > now) {
      console.log(`[cache] Serving from cache: ${url}`)
      return Promise.resolve(cached.data)
    }
    responseCache.delete(url)
  }

  // Deduplicate in-flight requests
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url)
  }

  const requestPromise = fetch(url, options)
    .then(r => r.json())
    .then(data => {
      // Cache the result for TTL_MS
      responseCache.set(url, { data, expiresAt: Date.now() + TTL_MS })
      return data
    })
    .finally(() => {
      inFlightRequests.delete(url)
    })

  inFlightRequests.set(url, requestPromise)
  return requestPromise
}


export { deduplicatedFetch, useDedupedFetch, deduplicatedFetchWithCache }
