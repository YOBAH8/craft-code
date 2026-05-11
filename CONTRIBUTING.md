# Contributing to craft-code

First off — thank you. This repo exists to raise the bar for software engineering education, especially for developers in Africa and the Global South who deserve world-class references without paywalls.

---

## What makes a good contribution

A great topic in this repo:

- **Teaches the "why"** — not just how to use a tool, but why this pattern exists and what problem it solves
- **Shows the tradeoffs** — every pattern has a cost. Be honest about it.
- **Uses real code** — not `foo` and `bar`. Use code that resembles actual production scenarios.
- **Highlights pitfalls** — what do developers commonly get wrong? What does the naive implementation miss?

---

## How to add a new topic

### 1. Check existing topics and open issues

Make sure the topic isn't already covered or in progress. Open an issue first if you're unsure — it avoids duplicated effort.

### 2. Fork & create a branch

```bash
git checkout -b topic/your-topic-name
```

### 3. Create the folder structure

```
topics/
  your-topic-name/
    README.md        ← required
    example.jsx      ← required (or .js, .ts, .php, etc.)
    pitfalls.md      ← required
    demo/            ← optional but encouraged
      package.json
      ...
```

### 4. Follow the README template

```markdown
# Topic Name

## What is it?

One paragraph. Assume the reader is a competent developer, not a beginner.

## The problem it solves

What breaks without this pattern?

## How it works

Explanation with diagrams or pseudocode if helpful.

## When to use it

Be specific. Don't just say "when you need performance."

## When NOT to use it

This section is just as important.

## Code example

(link or embed from example file)

## Real-world analogy

Optional but powerful for complex topics.

## Further reading

Links to specs, papers, or official docs.
```

### 5. Keep examples self-contained

- No unnecessary dependencies
- Add comments explaining *why*, not just *what*
- If using React, use functional components with hooks
- If using Node.js, use ESM (`import`/`export`) unless LAMP/PHP context

### 6. Open a Pull Request

PR title: `[Topic] Your Topic Name`

In the PR description, briefly explain:
- What the topic covers
- Why it's worth including
- Any decisions you made about the code example

---

## Code style

- **JavaScript/TypeScript**: 2-space indent, single quotes, no semicolons optional but be consistent
- **PHP**: PSR-12
- **Comments**: Write for a developer reading at 11pm after a long day — be kind and clear

---

## What we don't accept

- Topics that are just rewrites of official documentation
- Code that hasn't been tested
- AI-generated explanations that aren't reviewed and edited by a human
- Anything behind a license that restricts reuse

---

## Questions?

Open a GitHub Discussion or reach out via [johnyobah.vercel.app](https://johnyobah.vercel.app).
