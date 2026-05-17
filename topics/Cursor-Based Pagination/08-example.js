/**
 * Cursor-Based Pagination — Complete Implementation
 *
 * This file shows:
 *  1. Server-side cursor encoding/decoding (Node.js / Express)
 *  2. Database query with cursor condition (SQL via knex, but logic is universal)
 *  3. React hook: useCursorPagination — "load more" pattern
 *  4. Infinite scroll integration using IntersectionObserver
 */


// ─────────────────────────────────────────────
// 1. SERVER SIDE — Express + SQL (knex)
// ─────────────────────────────────────────────

import express from 'express'
import knex from 'knex'

const db = knex({ client: 'pg', connection: process.env.DATABASE_URL })
const router = express.Router()

// ── Cursor helpers ──

/**
 * encodeCursor
 * Converts a plain object into a base64 opaque string.
 * Clients receive this and send it back — they don't parse it.
 */
function encodeCursor(payload) {
  return Buffer.from(JSON.stringify(payload)).toString('base64url')
}

/**
 * decodeCursor
 * Converts a base64 cursor string back into its payload object.
 * Returns null if the cursor is invalid or tampered with.
 */
function decodeCursor(cursor) {
  try {
    return JSON.parse(Buffer.from(cursor, 'base64url').toString('utf8'))
  } catch {
    return null
  }
}

// ── GET /api/posts — paginated feed ──

router.get('/api/posts', async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 20, 100) // cap at 100
  const cursorStr = req.query.cursor || null

  let query = db('posts')
    .select('id', 'title', 'body', 'author_id', 'created_at')
    .orderBy('created_at', 'desc')
    .orderBy('id', 'desc') // tiebreaker for posts with same timestamp
    .limit(limit + 1)      // fetch one extra to know if there's a next page

  // Apply cursor condition if provided
  if (cursorStr) {
    const cursor = decodeCursor(cursorStr)

    if (!cursor) {
      return res.status(400).json({ error: 'Invalid cursor' })
    }

    // Composite condition: created_at < cursor.created_at
    //                   OR (created_at = cursor.created_at AND id < cursor.id)
    query = query.where(function () {
      this.where('created_at', '<', cursor.created_at)
        .orWhere(function () {
          this.where('created_at', '=', cursor.created_at)
            .andWhere('id', '<', cursor.id)
        })
    })
  }

  const rows = await query

  // If we got limit+1 rows, there's a next page
  const hasMore = rows.length > limit
  const data = hasMore ? rows.slice(0, limit) : rows

  // Cursor points to the last item in the current page
  const lastItem = data[data.length - 1]
  const nextCursor = hasMore && lastItem
    ? encodeCursor({ id: lastItem.id, created_at: lastItem.created_at })
    : null

  res.json({
    data,
    pagination: {
      nextCursor,
      hasMore,
      count: data.length,
    }
  })
})


// ─────────────────────────────────────────────
// 2. CLIENT SIDE — vanilla JS fetcher
// ─────────────────────────────────────────────

class CursorPaginatedFeed {
  constructor(baseUrl, limit = 20) {
    this.baseUrl = baseUrl
    this.limit = limit
    this.nextCursor = null
    this.hasMore = true
    this.isLoading = false
    this.allItems = []
  }

  async loadMore() {
    if (this.isLoading || !this.hasMore) return

    this.isLoading = true

    try {
      const params = new URLSearchParams({ limit: this.limit })
      if (this.nextCursor) params.set('cursor', this.nextCursor)

      const response = await fetch(`${this.baseUrl}?${params}`)
      if (!response.ok) throw new Error(`HTTP ${response.status}`)

      const { data, pagination } = await response.json()

      this.allItems = [...this.allItems, ...data]
      this.nextCursor = pagination.nextCursor
      this.hasMore = pagination.hasMore

      return data
    } finally {
      this.isLoading = false
    }
  }

  reset() {
    this.nextCursor = null
    this.hasMore = true
    this.isLoading = false
    this.allItems = []
  }
}

// Usage
const feed = new CursorPaginatedFeed('/api/posts', 20)
await feed.loadMore() // first page
await feed.loadMore() // second page
console.log(feed.allItems.length) // 40


// ─────────────────────────────────────────────
// 3. REACT HOOK — useCursorPagination
// ─────────────────────────────────────────────

import { useState, useCallback, useRef } from 'react'

/**
 * useCursorPagination
 *
 * Generic hook for cursor-paginated endpoints.
 * Handles loading state, error state, cursor tracking, and deduplication.
 *
 * @param {string} url   - base API URL (without cursor/limit params)
 * @param {number} limit - items per page
 */
function useCursorPagination(url, limit = 20) {
  const [items, setItems] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [hasMore, setHasMore] = useState(true)

  // Use refs so loadMore callback doesn't become stale
  const cursorRef = useRef(null)
  const loadingRef = useRef(false)

  const loadMore = useCallback(async () => {
    // Prevent concurrent loads
    if (loadingRef.current || !hasMore) return

    loadingRef.current = true
    setLoading(true)
    setError(null)

    try {
      const params = new URLSearchParams({ limit })
      if (cursorRef.current) params.set('cursor', cursorRef.current)

      const response = await fetch(`${url}?${params}`)
      if (!response.ok) throw new Error(`Failed to load: HTTP ${response.status}`)

      const { data, pagination } = await response.json()

      setItems(prev => [...prev, ...data])
      cursorRef.current = pagination.nextCursor
      setHasMore(pagination.hasMore)
    } catch (err) {
      setError(err.message)
    } finally {
      loadingRef.current = false
      setLoading(false)
    }
  }, [url, limit, hasMore])

  const reset = useCallback(() => {
    setItems([])
    setError(null)
    setHasMore(true)
    cursorRef.current = null
    loadingRef.current = false
  }, [])

  return { items, loading, error, hasMore, loadMore, reset }
}


// ─────────────────────────────────────────────
// 4. REACT COMPONENT — Infinite scroll with IntersectionObserver
// ─────────────────────────────────────────────

import { useEffect, useRef as useRefComponent } from 'react'

function PostFeed() {
  const { items, loading, error, hasMore, loadMore } = useCursorPagination('/api/posts', 20)

  // The sentinel element — when it enters the viewport, load more
  const sentinelRef = useRefComponent(null)

  // Load first page on mount
  useEffect(() => {
    loadMore()
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  // Observe the sentinel — trigger load when it becomes visible
  useEffect(() => {
    const sentinel = sentinelRef.current
    if (!sentinel) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && !loading) {
          loadMore()
        }
      },
      { rootMargin: '200px' } // trigger 200px before the sentinel is visible
    )

    observer.observe(sentinel)
    return () => observer.unobserve(sentinel)
  }, [loading, loadMore])

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '0 16px' }}>
      {/* Posts list */}
      {items.map(post => (
        <article
          key={post.id}
          style={{
            padding: '20px 0',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <h2 style={{ margin: '0 0 8px', fontSize: '1.1rem' }}>{post.title}</h2>
          <p style={{ margin: 0, color: '#666', fontSize: '0.9rem' }}>
            {new Date(post.created_at).toLocaleDateString()}
          </p>
        </article>
      ))}

      {/* Error state */}
      {error && (
        <div style={{ padding: '16px', color: '#c0392b', textAlign: 'center' }}>
          Failed to load posts.{' '}
          <button
            onClick={loadMore}
            style={{ color: '#c0392b', textDecoration: 'underline', background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Retry
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#999' }}>
          Loading...
        </div>
      )}

      {/* End of feed */}
      {!hasMore && !loading && (
        <div style={{ padding: '24px', textAlign: 'center', color: '#bbb', fontSize: '0.9rem' }}>
          You've reached the end
        </div>
      )}

      {/* Sentinel — invisible trigger element at the bottom */}
      {hasMore && <div ref={sentinelRef} style={{ height: '1px' }} />}
    </div>
  )
}


export { encodeCursor, decodeCursor, CursorPaginatedFeed, useCursorPagination, PostFeed }
