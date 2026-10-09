// Ported verbatim (TypeScript types stripped, logic unchanged) from the private `rowmio`
// monorepo: packages/core/src/mastery-state-machine.ts. That file has zero dependencies,
// so this port is the real shipped function, not a reimplementation. Do not "improve" the
// logic here without porting the change back; this file exists to prove the demo's
// transitions match production, not to diverge from it.

const RECHECK_DELAY_MS = 3 * 24 * 60 * 60 * 1000;

export function nextMasteryStatus(current, attempt, currentRecheckDueAt = null, now = new Date()) {
  const hinted = attempt.hintUsed ?? false;

  switch (current) {
    case "not_started": {
      if (attempt.stage === "diagnostic") {
        return { status: "diagnosed", nextRecheckDueAt: null };
      }
      return { status: "not_started", nextRecheckDueAt: currentRecheckDueAt };
    }

    case "diagnosed":
    case "regressed": {
      if (attempt.stage === "practice") {
        return { status: "practicing", nextRecheckDueAt: null };
      }
      return { status: current, nextRecheckDueAt: currentRecheckDueAt };
    }

    case "practicing": {
      if (attempt.stage === "independent" && attempt.correct && !hinted) {
        return { status: "verified_independent", nextRecheckDueAt: new Date(now.getTime() + RECHECK_DELAY_MS) };
      }
      return { status: "practicing", nextRecheckDueAt: currentRecheckDueAt };
    }

    case "verified_independent": {
      const recheckDue = currentRecheckDueAt !== null && now.getTime() >= currentRecheckDueAt.getTime();
      if (attempt.stage === "delayed_recheck" && !recheckDue) {
        return { status: "verified_independent", nextRecheckDueAt: currentRecheckDueAt };
      }
      if (attempt.stage === "delayed_recheck" && attempt.correct && !hinted) {
        return { status: "mastered", nextRecheckDueAt: null };
      }
      if (attempt.stage === "delayed_recheck" && !attempt.correct) {
        return { status: "regressed", nextRecheckDueAt: null };
      }
      return { status: "verified_independent", nextRecheckDueAt: currentRecheckDueAt };
    }

    case "mastered": {
      if (attempt.stage === "delayed_recheck" && !attempt.correct) {
        return { status: "regressed", nextRecheckDueAt: null };
      }
      return { status: "mastered", nextRecheckDueAt: currentRecheckDueAt };
    }
  }
}

export const RECHECK_DELAY_MS_EXPORT = RECHECK_DELAY_MS;
