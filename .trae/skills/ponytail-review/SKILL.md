---
name: "ponytail-review"
description: "Code review focused on over-engineering. Finds what to delete: reinventions, unneeded deps, speculative abstractions. Use when user says 'review for over-engineering', 'what can we delete', '/ponytail-review'. Complements correctness review."
---

# Ponytail Review

Review diffs for unnecessary complexity. One line per finding: location, what to cut, what replaces it.

## Format

`L<line>: <tag> <what>. <replacement>.`

Tags:
- `delete:` dead code, unused flexibility. Replacement: nothing.
- `stdlib:` hand-rolled stdlib function. Name the function.
- `native:` dep doing what platform does. Name the feature.
- `yagni:` abstraction with one implementation.
- `shrink:` same logic, fewer lines. Show shorter form.

## Examples

❌ Wordy explanations
✅ `L12-38: stdlib: 27-line validator class. "@" in email, 1 line, real validation is the confirmation mail.`
✅ `L4: native: moment.js for one format call. Intl.DateTimeFormat, 0 deps.`

## Scoring

End with: `net: -<N> lines possible.`
Nothing to cut: `Lean already. Ship.`

## Boundaries

Complexity only. Correctness, security, performance go to a normal review.
Does not apply fixes, only lists them.
