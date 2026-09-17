# Mission Board build backlog and checkpoint

Checkpoint: 2026-09-17. Design 0.2. **Specification and validation tooling exist; end-user software does not.**

## Completed in this foundation batch

- [x] Inspect original public README and v0 model.
- [x] Define nested categories, private data boundaries, manual capture and AI-first maintenance.
- [x] Specify inherited guidance and independent conversation/documentation controls.
- [x] Specify portable snapshot and typed updates with scope/revision checks.
- [x] Supply fictional records and a read-only/in-memory contract validation harness.
- [x] Supply a regular-chat continuation guide and decision record.

Actual validation results belong in `VALIDATION.md`. A checkbox above describes foundation files, not a production implementation of their requirements.

## First development session — B01

**Goal:** implement the production in-memory command layer with no filesystem writes.

Inputs: `schemas/`, `examples/`, `docs/AI-CONTRACT.md`, schema v0.2 and validation harness cases.

Deliver: TypeScript types generated from or checked against the schema, strict validator, `resolvePreferences`, `validateBoard`, and pure `previewUpdate(board, update, grant)` returning a candidate and human-readable diff. Keep record identity and source evidence. Isolate time/ID generation behind injected services.

Acceptance: create a mission under a granted category; update only next action without erasing notes; resolve category and mission preferences independently; reject a stale update, foreign workspace, forbidden operation, cycle or dangling reference; input objects remain unchanged even on failure. Include document ownership checks. Import UI and storage are deliberately later.

## Ordered engineering work

| ID | Task | Depends on | Completion evidence |
|---|---|---|---|
| B01 | Production pure command engine and strict schemas | Foundation | Golden plus adversarial contract cases pass; schema and runtime rules agree. |
| B02 | Scoped context builder and effective instructions | B01 | Selected mission exports only requested content, ancestry and approved supporting records; omitted linked documents remain omitted. |
| B03 | File persistence, history and receipts | B01 | Atomic/recovery behavior under injected failures; replay same update is harmless; mismatched repeated ID fails; locking/source-fingerprint conflict test. |
| B04 | Manual capture, categories and Resume UI | B01/B03 | Title-only entry expands defaults; keyboard user can create/move/find/reopen mission; save/restart preserves it. |
| B05 | AI exchange and plain-language preview | B02/B04 | Export to a real chat, receive structured update, preview and apply; no manual JSON editing in the normal path. |
| B06 | Notes/documents and depth settings | B04/B05 | Bullets and a long Markdown document both work; per-field inheritance/reset tested; linked files aren't fetched automatically. |
| B07 | Sessions and application event history | B03/B06 | Distinct occurrence/capture times; last activity changes for real work only; undo is an auditable new update. |
| B08 | Desktop packaging and restore | B03–B07 | Local save/restore and platform smoke tests; beginner installs without Git or developer tools. |
| B09 | Private pilot | B05–B08 | Resume after interruption; measure friction; report generic findings only to public repository. |
| B10 | One connected AI adapter | B02/B03/B07/B09 | Actual tool/client connection; limited grants, revocation and receipt checks; routine auto-apply only within user-selected scope. |
| B11 | Search and Available Now | B04/B07/B09 | Descendant/category/status filters agree; unknown constraints remain visible; no false “ready” claims. |
| B12 | Optional workspace Git | B03/B08/B09 | Explicit private destination, deliberate changes, conflict handling; product repository never selected by default. |
| B13 | Scale/migration/release hardening | B08–B12 | Representative large boards, documented migration, accessibility review, release/backup docs and chosen license. |

Choose a narrowly complete vertical slice over implementing all rows in parallel. Never represent proposal generation alone as a working automatic documentation system.

## Decisions to carry forward

| Decision | Rationale | Revisit trigger |
|---|---|---|
| Categories primary, status secondary | People need stable topical homes and multiple views. | Usability evidence, not taste alone. |
| Single primary category | Predictable home and no duplicate mission copies. | Real cross-workspace collaboration requirement. |
| Independent detail controls | Deep notes can coexist with concise chat and one-step instruction. | User testing of labels/presets. |
| User-owned instructions separated from imported notes | Intentional guidance cannot be replaced by source text. | New trusted instruction-authoring interface. |
| JSON snapshot first | Inspectable, one validation/commit boundary. | Size/merge evidence or native transaction needs. |
| Markdown views derived | Prevent two sources of truth. | Explicit import/reconciliation workflow. |
| AI exchange first, connected tools next | Broad availability without claiming nonexistent permissions. | A verified integration can simplify the workflow. |
| Keep seven states plus kind | Preserve prior model while allowing experiments/maintenance to be waiting or completed. | Usability evidence about confusing filters. |

## Session checkpoint template

At every meaningful development milestone, record:

- Current commit/branch and whether remote sync was actually verified.
- Goal and result: drafted / implemented / tested / committed / pushed.
- Files changed and why.
- Actual commands/tests run and their results; untested cases stay explicit.
- Decisions and unresolved risks.
- The next single action and its prerequisites.
- Public/private data boundary check for artifacts being published.

Keep this concise; deeper explanation belongs in the corresponding technical document.

## Pending owner decisions

License before distributable release; supported first-release operating systems; eventual business model; first connected adapter based on tested availability. None is a reason to restart the schema or delay B01.
