# Rowmio Mastery Diagnosis

Interactive portfolio demo by Ezekiel Ologunde. A client-side walkthrough of Rowmio's
diagnose &rarr; remediate &rarr; verify loop (bank mode), running the real, unmodified
`nextMasteryStatus` state-transition function ported from the private `rowmio` monorepo.

See [DESIGN.md](DESIGN.md) for exactly what this is and is not.

## Run

No build step. Any static file server works:

```
npx serve .
```

Or open `index.html` directly &mdash; it only imports local ES modules, no bundler, no
network calls.

## What's real vs. synthetic

- **Real**: the `nextMasteryStatus` transition logic (`state-machine.js`, ported verbatim
  from `packages/core/src/mastery-state-machine.ts` in the private Rowmio monorepo, which
  has zero dependencies so the port is exact, not a reimplementation).
- **Synthetic**: the learning objective, the four questions, and the misconception tags on
  each wrong answer (`fixtures.js`). No real course, student, or instructor data.
- **Not modeled**: the adaptive item-selection engine, the cohort instructor view, AI mode,
  and the real scheduling/persistence layer. Those live server-side in the private repo.

## Relationship to the real D1 sub-project

The private `rowmio` monorepo has landed the real migration, state machine, authorization
policy, and API routes for this feature (commits tagged `D1-*`), including a red-team and
sane-mode review pass. This public repo is the portfolio-facing companion, not a copy of
that implementation &mdash; only the pure, dependency-free transition function is shared
between the two, by design.
