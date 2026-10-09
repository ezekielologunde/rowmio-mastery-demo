// Synthetic content only. No real course, student, or instructor data. Mirrors the D1
// design spec's "bank mode" authoring pattern: a diagnostic item's wrong answers are each
// tagged with the misconception/gap they represent, so classification is a lookup, not a
// model judgment (see DESIGN.md).

export const OBJECTIVE = {
  title: "Order of operations with nested parentheses",
  prerequisiteOf: "Order of operations with exponents",
};

export const DIAGNOSTIC = {
  stage: "diagnostic",
  prompt: "8 − (3 + (2 × 2)) = ?",
  options: [
    { value: "1", correct: true },
    { value: "-2", correct: false, tag: "missing_prerequisite",
      reason: "Multiplied before adding inside the inner group out of order — (3+2)×2 instead of 3+(2×2)." },
    { value: "14", correct: false, tag: "misconception",
      reason: "Treated the parentheses as not changing evaluation order and worked strictly left to right: 8−3, +2, ×2." },
    { value: "15", correct: false, tag: "misread_question",
      reason: "Read the − sign as +: 8+(3+(2×2))." },
    { value: "0", correct: false, tag: "simple_mistake",
      reason: "Used the right method (innermost first, multiply before add) but slipped on the final subtraction, 8−7." },
  ],
};

export const REMEDIATION = {
  missing_prerequisite: "Evaluate the innermost parentheses first — and inside them, multiplication still happens before addition.",
  misconception: "Parentheses change the order. Always resolve what's inside them before anything outside, even if it looks like it reads left to right.",
  misread_question: "Reread the expression one symbol at a time before you compute — check every operator, not just the numbers.",
  simple_mistake: "Your method was right. Redo just the final step carefully.",
  correct: "No misconception found on this item — moving to guided practice to build independent fluency before calling anything mastered.",
};

export const PRACTICE = {
  stage: "practice",
  prompt: "12 − (4 + (3 × 2)) = ?",
  answer: "2",
  hint: "Innermost first: 3×2=6. Then 4+6=10. Then 12−10.",
};

export const INDEPENDENT = {
  stage: "independent",
  prompt: "15 − (2 + (3 × 3)) = ?",
  answer: "4",
};

export const DELAYED_RECHECK = {
  stage: "delayed_recheck",
  prompt: "20 − (5 + (2 × 4)) = ?",
  answer: "7",
};
