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
