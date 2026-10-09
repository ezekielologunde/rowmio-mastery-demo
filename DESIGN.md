# Rowmio Mastery Diagnosis — public demo design

Status: design scaffold, 2026-10-09. Companion to the real D1 sub-project in the
private `rowmio` monorepo (`docs/superpowers/specs/2026-10-03-d1-diagnosis-mastery-design.md`
and `docs/superpowers/plans/2026-10-03-d1-diagnosis-mastery.md`). This repo is the
portfolio artifact, not the product.

## What this is

A static, client-side, bank-mode-only walkthrough of Rowmio's diagnose → remediate →
verify loop for one synthetic learning objective, running the *actual* mastery
state-machine function ported verbatim from `packages/core/src/mastery-state-machine.ts`
in the private Rowmio repo (pure, dependency-free, already unit-tested there — copied,
not reimplemented, so the demo's state transitions match the shipped logic exactly).

## What this is not

- Not connected to the real Rowmio API, database, or any tenant/student data. No
  network calls at all.
- Not AI mode. Bank mode has no model call in its core loop (per the D1 spec, section 4)
  — classification of a wrong answer is a lookup against a tagged distractor, not an
  LLM judgment. This demo makes that lookup explicit rather than hiding it behind an
  AI label it doesn't deserve.
- Not evidence of learning outcomes, instructor adoption, or real student usage. One
  synthetic learning objective, one synthetic learner, no cohort data.
- Not the instructor authoring UI, the cohort view, or the delayed-recheck scheduler —
  those exist server-side in the real system; here the "days later" recheck is a single
  button the visitor clicks to advance simulated time, labeled as such.

## Content

One synthetic objective ("Order of operations with nested parentheses") with:
- A diagnostic item whose wrong-answer distractors are each tagged with a
  classification (`missing_prerequisite`, `misconception`, `misread_question`,
  `simple_mistake`) — mirroring the D1 spec's "diagnostic distractor" authoring pattern.
- A practice item with a hint tied to the specific misconception diagnosed.
- An independent transfer item (no hint available).
- A delayed-recheck item, gated behind a simulated time-advance control.

Mastery states and transition rules are exactly `not_started → diagnosed → practicing →
verified_independent → mastered`, with `regressed` on a failed recheck — ported from the
real `nextMasteryStatus` function, unmodified except for TypeScript → plain JS and
removing the unused `Date`-injection parameters' type annotations.

## Visual design

Reuses the "evidence-first dossier" visual language established in the SOC Review demo
(same project family, same no-hype tone): a visible state trace panel showing exactly
which transition fired and why, so the mechanism is inspectable rather than a black box.

## Deployment

Public static site, deployed via GitHub Pages directly from this repo (no server,
nothing to keep private — unlike the SOC project, there is no real backend counterpart
to accidentally expose here; the real D1 implementation lives in the private `rowmio`
monorepo and stays there).
