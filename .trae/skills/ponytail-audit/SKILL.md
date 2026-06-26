---
name: "ponytail-audit"
description: "Whole-repo audit for over-engineering. Scans entire codebase for what to delete or simplify. Use when user says 'audit codebase', 'find bloat', '/ponytail-audit'. One-shot report, does not apply fixes."
---

# Ponytail Audit

ponytail-review, repo-wide. Scan the whole tree instead of a diff. Rank findings biggest cut first.

## Tags

- `delete:` dead code, unused flexibility, speculative feature.
- `stdlib:` hand-rolled thing the standard library ships.
- `native:` dependency doing what the platform already does.
- `yagni:` abstraction with one implementation, config nobody sets.
- `shrink:` same logic, fewer lines.

## Output

One line per finding, ranked: `<tag> <what to cut>. <replacement>. [path]`
End with `net: -<N> lines, -<M> deps possible.`
Nothing to cut: `Lean already. Ship.`

## Boundaries

Over-engineering and complexity only. Correctness bugs, security, performance are out of scope.
Lists findings, applies nothing. One-shot.
