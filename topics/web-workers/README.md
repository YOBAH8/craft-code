# Web Workers for Heavy Computation

## What is it?

A Web Worker is a JavaScript script that runs in a **background thread**, completely separate from the main browser thread that handles your UI.

JavaScript is single-threaded — meaning your UI rendering, event handling, and computation all share one thread. Heavy computation blocks that thread. The page freezes. Users can't scroll, click, or interact.

Web Workers move that heavy work off the main thread so your UI stays smooth.

---

## The problem it solves

```
Main thread (single-threaded):
[Render UI] [Handle click] [Filter 100k rows] ← blocks everything
                                ↑
                    UI frozen for 2-3 seconds
```

With a Web Worker:
```
Main thread:   [Render UI] [Handle click] [Update UI with result]
Worker thread:             [Filter 100k rows ...........]
                                                        ↑
                                               UI never froze
```

---

## What belongs in a Web Worker

✅ Filtering / sorting massive datasets (10,000+ rows)  
✅ Image processing (resize, compress, apply filters)  
✅ Parsing large JSON, CSV, or XML files  
✅ Cryptographic operations (hashing passwords client-side)  
✅ Physics simulations, pathfinding (games)  
✅ Running machine learning inference (TensorFlow.js)  

## What does NOT belong in a Web Worker

❌ DOM manipulation — workers have no access to `document` or `window`  
❌ Light computation — overhead of postMessage isn't worth it for trivial work  
❌ Code that needs to run synchronously with UI state  

---

## How communication works

Workers communicate via `postMessage` and `onmessage`.
Think of it as an async message queue between two separate JS environments.

```
Main thread                    Worker thread
     │                              │
     │── postMessage(data) ────────>│
     │                              │ (processes data)
     │<─── postMessage(result) ─────│
     │                              │
```

Both sides send and receive serialized copies of the data (structured clone algorithm).
This means you can't pass functions or DOM nodes — only plain objects, arrays, numbers, strings, ArrayBuffers, etc.

---

## Code example

See [`example.js`](./example.js) — a complete Worker setup with:
- Worker file for filtering a large dataset
- Main thread integration with React
- Transferable objects for zero-copy performance

---

## Performance tip: Transferable Objects

By default, `postMessage` *copies* data. For large ArrayBuffers (images, binary data), use **Transferable Objects** to *transfer* ownership instead — this is zero-copy and near-instant even for large payloads.

```js
// Copy (slow for large data)
worker.postMessage({ buffer: largeArrayBuffer })

// Transfer (fast — zero copy, transfers ownership)
worker.postMessage({ buffer: largeArrayBuffer }, [largeArrayBuffer])
// Warning: largeArrayBuffer is now empty in the main thread after transfer
```

---

## Real-world analogy

Your main thread is like a chef in a kitchen. Every task goes through that one chef.

Without workers: The chef has to both cook and wash all dishes simultaneously — everything slows down.

With workers: You hire a dishwasher (the worker). The chef keeps cooking (UI stays smooth). The dishwasher handles the heavy, repetitive work (computation) in parallel.

---

## Further reading

- [MDN — Web Workers API](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API)
- [MDN — Transferable Objects](https://developer.mozilla.org/en-US/docs/Web/API/Web_Workers_API/Transferable_objects)
- [comlink](https://github.com/GoogleChromeLabs/comlink) — a library that wraps Worker postMessage with a clean async/await API
