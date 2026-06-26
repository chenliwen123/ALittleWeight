---
name: "ponytail-debt"
description: "Harvests every `ponytail:` comment into a debt ledger. Use when user says 'ponytail debt', 'list shortcuts', 'what did ponytail defer', '/ponytail-debt'. One-shot report, changes nothing."
---

# Ponytail Debt

Every deliberate ponytail shortcut is marked with a `ponytail:` comment naming its ceiling and upgrade path. This collects them into one ledger so a deferral can't quietly become permanent.

## Scan

Grep the repo for comment markers, skipping `node_modules`, `.git`, and build output:
`grep -rnE '(#|//) ?ponytail:' .`

## Output

One row per marker, grouped by file:
`<file>:<line>, <what was simplified>. ceiling: <the limit named>. upgrade: <the trigger to revisit>.`

Flag the rot risk: any `ponytail:` comment that names no upgrade path or trigger gets a `no-trigger` tag.

End with `<N> markers, <M> with no trigger.` Nothing found: `No ponytail: debt. Clean ledger.`

## Boundaries

Reads and reports only, changes nothing. One-shot.
