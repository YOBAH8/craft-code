# 🔧 craft-code

> **Senior-level software engineering patterns — explained clearly, with real code.**

Most tutorials teach you *how* to build things. This repo teaches you *how to build them properly* — the patterns, tradeoffs, and techniques that separate mid-level developers from senior engineers.

Written and maintained by **[John Yobah](https://johnyobah.vercel.app)** — Software Engineer, Zambia.

---

## Who this is for

- Developers who can already build apps but want to level up their engineering thinking
- Self-taught engineers filling gaps that bootcamps and tutorials skip
- Anyone preparing for senior-level technical interviews
- Developers in Africa and emerging markets who want world-class engineering references without paywalls

---

## How each topic is structured

Every topic folder contains:

| File | What it covers |
|------|---------------|
| `README.md` | Concept explanation, when to use it, real-world context |
| `example.*` | Clean, commented source code you can run or adapt |
| `pitfalls.md` | Common mistakes developers make with this pattern |
| `/demo` | Minimal runnable demo (Next.js or vanilla JS) |

---

## 📚 Topics

### 🚀 Performance & UX
| # | Topic | Difficulty | Status |
|---|-------|-----------|--------|
| 01 | [Optimistic UI Updates](./topics/optimistic-updates/) | ⭐⭐ | ✅ Ready |
| 02 | [Skeleton Screens & Shimmer Effects](./topics/virtualization/) | ⭐ | ✅ Ready |
| 03 | [Virtualization / List Windowing](./topics/virtualization/) | ⭐⭐⭐ | ✅ Ready |
| 04 | [Debounce vs Throttle (Deep Dive)](./topics/debounce-vs-throttle/) | ⭐⭐ | ✅ Ready |
| 05 | [Web Workers for Heavy Computation](./topics/web-workers/) | ⭐⭐⭐ | ✅ Ready |

### 🔄 Data Fetching & Caching
| # | Topic | Difficulty | Status |
|---|-------|-----------|--------|
| 06 | [Stale-While-Revalidate (SWR)](./topics/stale-while-revalidate/) | ⭐⭐ | ✅ Ready |
| 07 | [Request Deduplication](./topics/request-deduplication/) | ⭐⭐⭐ | ✅ Ready |
| 08 | [Cursor-Based Pagination](./topics/Cursor-Based-Pagination/) | ⭐⭐⭐ | ✅ Ready |
 09 | [Infinite Scroll vs Pagination](./topics/Infinite-Scroll-vs-Pagination/) | ⭐⭐⭐ | ✅ Ready |
| 10 | [API Response Shaping](./topics/api-response-shaping/) | ⭐⭐⭐ | ✅ Ready |

### 🏗️ Architecture & Patterns
| # | Topic | Difficulty | Status |
|---|-------|-----------|--------|
| 11 | JWT vs Session Auth — The Real Tradeoffs | ⭐⭐⭐ | 🔜 Coming |
| 12 | Database N+1 Problem & Eager Loading | ⭐⭐⭐ | 🔜 Coming |
| 13 | Rate Limiting — Token Bucket vs Sliding Window | ⭐⭐⭐ | 🔜 Coming |
| 14 | Optimistic Locking vs Pessimistic Locking | ⭐⭐⭐ | 🔜 Coming |
| 15 | Clean Code in React — Real Examples | ⭐⭐ | 🔜 Coming |

### ⚡ Advanced (Talk-Show Level)
| # | Topic | Difficulty | Status |
|---|-------|-----------|--------|
| 16 | WebSockets vs SSE vs Long Polling | ⭐⭐⭐ | 🔜 Coming |
| 17 | Edge Functions & Latency (Vercel Edge) | ⭐⭐⭐ | 🔜 Coming |
| 18 | Event Sourcing — Storing What Happened | ⭐⭐⭐⭐ | 🔜 Coming |
| 19 | CRDT — How Google Docs Handles Conflicts | ⭐⭐⭐⭐ | 🔜 Coming |
| 20 | Micro-Frontend Architecture | ⭐⭐⭐⭐ | 🔜 Coming |

---

## Running the demos

Each `/demo` folder is a self-contained Next.js or vanilla JS project.

```bash
cd topics/optimistic-updates/demo
npm install
npm run dev
```

---

## Contributing

This is an open-source reference — contributions are welcome. See [CONTRIBUTING.md](./CONTRIBUTING.md).

---

## Connect

- 🌐 Portfolio: [johnyobah.vercel.app](https://johnyobah.vercel.app)
- 💼 LinkedIn: [linkedin.com/in/john-yobah-b90401212](https://linkedin.com/in/john-yobah-b90401212)
- 🐙 GitHub: [github.com/YOBAH8](https://github.com/YOBAH8)

---

> *"Good code is not just code that works. It's code that can be understood, maintained, and scaled."*

MIT License ·
