# Foundation validation — 2026-09-17

Scope: specification 0.2, fictional fixtures and in-memory contract behavior. No real personal board or machine was used.

## Executed checks

`python tools/validate_spec.py` using Python 3.12 and jsonschema 4.26.0: **32 tests passed** at the initial foundation checkpoint.

Validated both schemas against JSON Schema 2020-12; validated the complete synthetic board and typed update; exercised a pure in-memory candidate update while preserving input data.

Covered: category/dependency cycles and missing references; duplicate IDs; document ownership; independent inherited preferences and reset; Unicode/Markdown round-trip; stale updates including a second chat with an old revision; workspace/context mismatch; scope and operation checks; refusal to inject instruction fields through updates; unknown versions/fields; status requirements; unknown historical completion time; unsafe/traversing resource locators; duplicate JSON keys; nonfinite numbers; deep JSON; operation-count bound; failure after earlier tentative operations without mutating the input.

## Explicitly not proven

- No production write engine, durable grant store or idempotency receipt store.
- No application-managed timestamps or persisted event history in the fixture preview.
- No atomic filesystem save, crash recovery, restore, locking or multi-process concurrency tests.
- No UI, accessibility, native packaging, real connected chatbot or end-user onboarding test.
- No security guarantee from provenance labels: software cannot prove that an assistant's reported observation happened.
- No full dependency lockfile or supported-platform matrix; development requirement pins only the direct validator dependency.

Future production code must satisfy backlog gates, not merely reuse this passing test count as release evidence.

## B01 production-core validation — 2026-09-17

Environment used for this checkpoint: Node.js 24.19.0, npm 11.9.0, TypeScript 5.9.2, Ajv 8.17.1, Vitest 3.2.4, Python 3.12.14 and jsonschema 4.26.0.

Executed successfully:

- `npm run generate:types` regenerated declarations from both portable JSON schemas.
- `npm run typecheck` completed with no TypeScript errors.
- `npm test` passed **23 production contract tests**.
- `.venv/bin/python tools/validate_spec.py` passed the original **32 specification tests**.
- `git diff --check` reported no whitespace errors before commit review.

The TypeScript suite validates the fictional board; schema-version and unsupported-field refusal; duplicate IDs; missing references; category/dependency cycles; two-way document ownership; lifecycle requirements; safe resource locations including encoded traversal; independent preference inheritance and reset origins; the mixed deep/concise/one-action/exhaustive-document configuration; deterministic mission creation through injected ID/time services; scoped category and mission creation; targeted mission moves and updates; note preservation; Unicode/Markdown preservation; internal document create/update; session recording; one revision increment per accepted candidate; stale concurrent chat rejection; foreign workspace and unknown context rejection; unknown grant references; forbidden operations; scope violations; instruction escalation; and all-or-nothing behavior when a later operation fails.

The core treats imported Markdown as inert data and exposes no shell, filesystem path, provider, publishing or background-execution operation. The preview result is an in-memory candidate with human-readable change descriptions; the input board, update and grant are not mutated.

### Still explicitly not proven by B01

- No filesystem persistence, locking, backup, restore, crash recovery or source-fingerprint behavior.
- No durable context-grant store, idempotency receipt store, event history or replay behavior.
- No context-packet builder; B02 remains the next action.
- No UI, accessibility, browser download, desktop shell, packaging or end-user installation test.
- No real chatbot connection, automatic application, provider compatibility, Git workspace synchronization or remote publication.
- Provenance labels remain attributed claims, not cryptographic proof that reported work occurred.
