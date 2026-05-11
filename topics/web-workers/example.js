/**
 * Web Workers for Heavy Computation
 *
 * Two files needed:
 *  1. filter.worker.js  — the worker script (runs in background thread)
 *  2. example.jsx       — React component that uses the worker
 *
 * This example: filtering and sorting a 100,000-row dataset
 * without freezing the UI.
 */


// ─────────────────────────────────────────────
// FILE 1: filter.worker.js
// This runs in the WORKER thread — no DOM access
// ─────────────────────────────────────────────

// Save this as a separate file: filter.worker.js
// (shown as a string here for reference)

const WORKER_CODE = `
// Listen for messages from the main thread
self.onmessage = function(event) {
  const { type, payload } = event.data

  switch (type) {
    case 'FILTER':
      const filtered = filterData(payload.data, payload.filters)
      self.postMessage({ type: 'FILTER_RESULT', result: filtered })
      break

    case 'SORT':
      const sorted = sortData(payload.data, payload.sortKey, payload.direction)
      self.postMessage({ type: 'SORT_RESULT', result: sorted })
      break

    case 'FILTER_AND_SORT':
      // Chain operations without going back to main thread in between
      const filteredAndSorted = sortData(
        filterData(payload.data, payload.filters),
        payload.sortKey,
        payload.direction
      )
      self.postMessage({ type: 'FILTER_SORT_RESULT', result: filteredAndSorted })
      break
  }
}

function filterData(data, filters) {
  return data.filter(item => {
    return Object.entries(filters).every(([key, value]) => {
      if (!value) return true // empty filter = no filter
      const itemValue = String(item[key] ?? '').toLowerCase()
      return itemValue.includes(String(value).toLowerCase())
    })
  })
}

function sortData(data, sortKey, direction = 'asc') {
  if (!sortKey) return data

  return [...data].sort((a, b) => {
    const aVal = a[sortKey]
    const bVal = b[sortKey]

    if (aVal < bVal) return direction === 'asc' ? -1 : 1
    if (aVal > bVal) return direction === 'asc' ? 1 : -1
    return 0
  })
}
`


// ─────────────────────────────────────────────
// FILE 2: useDataWorker.js — React hook
// Manages the Worker lifecycle cleanly
// ─────────────────────────────────────────────

import { useState, useEffect, useRef, useCallback } from 'react'

function useDataWorker(workerPath) {
  const workerRef = useRef(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const pendingRef = useRef(null) // stores { resolve, reject } for current operation

  useEffect(() => {
    // Spin up the worker
    workerRef.current = new Worker(workerPath)

    // Handle messages coming back from worker
    workerRef.current.onmessage = (event) => {
      const { type, result } = event.data

      if (pendingRef.current) {
        pendingRef.current.resolve({ type, result })
        pendingRef.current = null
      }

      setIsProcessing(false)
    }

    // Handle worker errors
    workerRef.current.onerror = (error) => {
      console.error('Worker error:', error)

      if (pendingRef.current) {
        pendingRef.current.reject(error)
        pendingRef.current = null
      }

      setIsProcessing(false)
    }

    // Terminate worker on cleanup (component unmount)
    return () => {
      workerRef.current?.terminate()
    }
  }, [workerPath])

  // Send a message to the worker, returns a Promise
  const dispatch = useCallback((message) => {
    return new Promise((resolve, reject) => {
      if (!workerRef.current) {
        reject(new Error('Worker not initialized'))
        return
      }

      setIsProcessing(true)
      pendingRef.current = { resolve, reject }
      workerRef.current.postMessage(message)
    })
  }, [])

  return { dispatch, isProcessing }
}


// ─────────────────────────────────────────────
// FILE 3: DataTable.jsx — Component using the worker
// ─────────────────────────────────────────────

function DataTable({ rawData }) {
  const [displayData, setDisplayData] = useState(rawData)
  const [filters, setFilters] = useState({ name: '', city: '', status: '' })
  const [sortKey, setSortKey] = useState(null)
  const [sortDir, setSortDir] = useState('asc')

  const { dispatch, isProcessing } = useDataWorker('/workers/filter.worker.js')

  // When filters or sort change, offload to worker
  useEffect(() => {
    if (!rawData?.length) return

    dispatch({
      type: 'FILTER_AND_SORT',
      payload: {
        data: rawData,
        filters,
        sortKey,
        direction: sortDir,
      }
    }).then(({ result }) => {
      setDisplayData(result)
    }).catch(err => {
      console.error('Worker failed:', err)
      // Fall back to main-thread processing
      setDisplayData(rawData)
    })
  }, [rawData, filters, sortKey, sortDir, dispatch])

  function handleFilterChange(key, value) {
    setFilters(prev => ({ ...prev, [key]: value }))
  }

  function handleSort(key) {
    if (sortKey === key) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortKey(key)
      setSortDir('asc')
    }
  }

  return (
    <div>
      {/* Filter inputs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input
          placeholder="Filter by name..."
          onChange={e => handleFilterChange('name', e.target.value)}
        />
        <input
          placeholder="Filter by city..."
          onChange={e => handleFilterChange('city', e.target.value)}
        />
        <input
          placeholder="Filter by status..."
          onChange={e => handleFilterChange('status', e.target.value)}
        />
      </div>

      {/* Processing indicator — UI never freezes, just shows status */}
      {isProcessing && (
        <div style={{ color: '#888', fontSize: '0.85rem', marginBottom: '8px' }}>
          Processing {rawData.length.toLocaleString()} rows...
        </div>
      )}

      {/* Results count */}
      <div style={{ marginBottom: '8px' }}>
        Showing {displayData.length.toLocaleString()} of {rawData.length.toLocaleString()} rows
      </div>

      {/* Table */}
      <table style={{ width: '100%', borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            {['name', 'city', 'status', 'createdAt'].map(col => (
              <th
                key={col}
                onClick={() => handleSort(col)}
                style={{ cursor: 'pointer', padding: '8px', textAlign: 'left', borderBottom: '2px solid #eee' }}
              >
                {col}
                {sortKey === col && (sortDir === 'asc' ? ' ↑' : ' ↓')}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {displayData.slice(0, 100).map((row, i) => ( // render only first 100 rows (use virtualization for more)
            <tr key={i}>
              <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.name}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.city}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.status}</td>
              <td style={{ padding: '8px', borderBottom: '1px solid #f0f0f0' }}>{row.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}


// ─────────────────────────────────────────────
// BONUS: Image processing in a Worker
// Process images without freezing UI
// ─────────────────────────────────────────────

// In worker file:
const IMAGE_WORKER = `
self.onmessage = function({ data }) {
  const { imageData, operation } = data

  let result
  switch (operation) {
    case 'grayscale':
      result = applyGrayscale(imageData)
      break
    case 'invert':
      result = applyInvert(imageData)
      break
  }

  // Transfer the result ArrayBuffer (zero-copy — fast for large images)
  self.postMessage({ result }, [result.data.buffer])
}

function applyGrayscale(imageData) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    const avg = (data[i] + data[i + 1] + data[i + 2]) / 3
    data[i] = avg       // R
    data[i + 1] = avg   // G
    data[i + 2] = avg   // B
    // data[i + 3] is alpha — leave unchanged
  }
  return imageData
}

function applyInvert(imageData) {
  const data = imageData.data
  for (let i = 0; i < data.length; i += 4) {
    data[i] = 255 - data[i]
    data[i + 1] = 255 - data[i + 1]
    data[i + 2] = 255 - data[i + 2]
  }
  return imageData
}
`


export { useDataWorker, DataTable }
