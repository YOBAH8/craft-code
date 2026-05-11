/**
 * Optimistic UI Updates — Complete Example
 *
 * Scenario: A post feed where users can like/unlike posts.
 * The like should feel instant, not wait for the server.
 *
 * Three implementations shown:
 *  1. Naive (bad) — waits for server
 *  2. Optimistic with useState (manual)
 *  3. Optimistic with TanStack Query (production-ready)
 */

import { useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'

// ─────────────────────────────────────────────
// 1. NAIVE IMPLEMENTATION — Don't do this
// ─────────────────────────────────────────────

function NaiveLikeButton({ post }) {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)
  const [loading, setLoading] = useState(false)

  async function handleLike() {
    setLoading(true)

    try {
      // ❌ User waits here — UI frozen until server responds
      const response = await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
      })
      const data = await response.json()

      // Only THEN does the UI update
      setLiked(data.liked)
      setLikes(data.likes)
    } catch (error) {
      console.error('Failed to like post', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <button onClick={handleLike} disabled={loading}>
      {liked ? '❤️' : '🤍'} {likes}
    </button>
  )
}


// ─────────────────────────────────────────────
// 2. OPTIMISTIC WITH useState — Manual approach
//    Good for simple cases without a query library
// ─────────────────────────────────────────────

function OptimisticLikeButtonManual({ post }) {
  const [liked, setLiked] = useState(post.liked)
  const [likes, setLikes] = useState(post.likes)

  async function handleLike() {
    // Step 1: Save current state (snapshot for rollback)
    const previousLiked = liked
    const previousLikes = likes

    // Step 2: Apply optimistic update IMMEDIATELY — no await
    const newLiked = !liked
    setLiked(newLiked)
    setLikes(prev => newLiked ? prev + 1 : prev - 1)

    // Step 3: Fire request in background
    try {
      await fetch(`/api/posts/${post.id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ liked: newLiked }),
      })
      // ✅ Success — UI is already correct, nothing to do
    } catch (error) {
      // ❌ Failure — roll back to previous state
      setLiked(previousLiked)
      setLikes(previousLikes)
      alert('Failed to update like. Please try again.')
    }
  }

  return (
    <button onClick={handleLike} style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}>
      {liked ? '❤️' : '🤍'} {likes}
    </button>
  )
}


// ─────────────────────────────────────────────
// 3. OPTIMISTIC WITH TANSTACK QUERY
//    Production-ready — handles cache, retries, devtools
// ─────────────────────────────────────────────

async function toggleLikeAPI(postId) {
  const response = await fetch(`/api/posts/${postId}/like`, { method: 'POST' })
  if (!response.ok) throw new Error('Failed to toggle like')
  return response.json()
}

function OptimisticLikeButtonQuery({ post }) {
  const queryClient = useQueryClient()

  const { mutate } = useMutation({
    mutationFn: () => toggleLikeAPI(post.id),

    // Step 1: Called BEFORE the mutation fires
    onMutate: async () => {
      // Cancel any in-flight refetches (avoid overwriting our optimistic update)
      await queryClient.cancelQueries({ queryKey: ['posts'] })

      // Snapshot the current value
      const previousPosts = queryClient.getQueryData(['posts'])

      // Optimistically update the cache
      queryClient.setQueryData(['posts'], (old) =>
        old.map((p) =>
          p.id === post.id
            ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 }
            : p
        )
      )

      // Return snapshot in context so onError can use it
      return { previousPosts }
    },

    // Step 2: If mutation fails, roll back using context snapshot
    onError: (error, _variables, context) => {
      queryClient.setQueryData(['posts'], context.previousPosts)
      console.error('Like failed, rolled back:', error.message)
    },

    // Step 3: Always refetch after error or success to stay in sync
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['posts'] })
    },
  })

  return (
    <button
      onClick={() => mutate()}
      style={{ cursor: 'pointer', border: 'none', background: 'none', fontSize: '1.2rem' }}
    >
      {post.liked ? '❤️' : '🤍'} {post.likes}
    </button>
  )
}


// ─────────────────────────────────────────────
// BONUS: Optimistic form submission
// Useful for comment boxes, chat inputs
// ─────────────────────────────────────────────

function OptimisticCommentForm({ postId, onAddComment }) {
  const [text, setText] = useState('')
  const [pendingComments, setPendingComments] = useState([])

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return

    // Generate a temporary ID for the optimistic comment
    const tempId = `temp-${Date.now()}`
    const optimisticComment = {
      id: tempId,
      text,
      author: 'You',           // Use real user from your auth context
      createdAt: new Date(),
      isPending: true,          // Flag to show pending state in UI
    }

    // Clear input immediately — don't wait
    setText('')

    // Show comment instantly
    setPendingComments(prev => [...prev, optimisticComment])

    try {
      const savedComment = await fetch(`/api/posts/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: optimisticComment.text }),
      }).then(r => r.json())

      // Replace temp comment with real one from server
      setPendingComments(prev =>
        prev.map(c => c.id === tempId ? { ...savedComment, isPending: false } : c)
      )

      onAddComment?.(savedComment)
    } catch (error) {
      // Mark comment as failed — let user retry or dismiss
      setPendingComments(prev =>
        prev.map(c =>
          c.id === tempId ? { ...c, isPending: false, hasFailed: true } : c
        )
      )
    }
  }

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <input
          value={text}
          onChange={e => setText(e.target.value)}
          placeholder="Write a comment..."
        />
        <button type="submit">Post</button>
      </form>

      {pendingComments.map(comment => (
        <div key={comment.id} style={{ opacity: comment.isPending ? 0.6 : 1 }}>
          <p>{comment.text}</p>
          {comment.isPending && <small>Sending...</small>}
          {comment.hasFailed && (
            <small style={{ color: 'red' }}>
              Failed to send. <button onClick={() => {/* retry logic */}}>Retry</button>
            </small>
          )}
        </div>
      ))}
    </div>
  )
}


export {
  NaiveLikeButton,
  OptimisticLikeButtonManual,
  OptimisticLikeButtonQuery,
  OptimisticCommentForm,
}
