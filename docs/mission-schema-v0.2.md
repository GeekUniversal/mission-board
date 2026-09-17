# Mission schema v0.2 — portable snapshot and update contract

Status: draft implementation contract, 2026-09-17. Supersedes v0 for new implementation. Original v0 remains historical.

## Authority and serialization

`schemas/board.schema.json` specifies a complete portable workspace snapshot using JSON Schema 2020-12. It is also the proposed first native persistence format. `schemas/update.schema.json` specifies changes. `docs/BLUEPRINT.md` and `docs/AI-CONTRACT.md` define behavior beyond JSON validation. Unsupported protocol versions are rejected, not guessed.

Root fields: `format_version`, immutable `workspace_id`, monotonically increasing `revision`, `name`, `inbox_category_id`, sparse `preferences`, user-authored `instructions`, arrays of `categories`, `missions`, `documents`, and `sessions`. Revision 0 is allowed for a new workspace. A successful transaction increments once, not once per operation. Context grants and idempotency receipts are application-managed private metadata rather than assistant-controlled board content.

The first snapshot is one atomic data unit. Documents are internal Markdown records, not uncontrolled filesystem writes. Generated Markdown views are exports. Large externally maintained documents remain links. See blueprint section 10 for persistence and evolution.

## Entities

| Entity | Identity / required relationships | Important content |
|---|---|---|
| Category | `cat_…`, parent ID or null | Name, guidance, sparse preferences, archive visibility |
| Mission | `mis_…`, primary category ID | Title, status/kind, purpose, state, next action, resume, blockers, notes, evidence, completion and constraints |
| Document | `doc_…`, owning mission ID | Title, Markdown, document type, source provenance |
| Session | `ses_…`, mission ID | Time if known, what happened, result, next action, provenance |
| Resource | Stored on mission | Label, absolute HTTPS URL or safe relative path, document/repository/file/issue/etc. type; never automatically followed |

IDs are stable opaque strings matching their prefixes, not names or paths. The fixture uses memorable fictional IDs for readability. Production can generate prefixed UUIDs. Renaming/moving records does not rewrite IDs. IDs must be unique within each entity collection; references must resolve in the workspace.

`created_at` and `updated_at` are application-generated ISO 8601 timestamps. `last_activity_at` records actual session activity and can be null. Historical completion/session event times can be null; capture time and occurrence time must not be conflated. Import preserves source time uncertainty.

## Mission semantics

Only title is required from the person; the app expands it into a valid full record with defaults. All snapshot boilerplate is the program's responsibility. AI create operations return a complete record in v0.2; the packet provides the example/template.

Seven statuses: `idea`, `ready`, `active`, `waiting`, `experiment`, `maintenance`, `completed`. Kind remains `mission`, `experiment`, or `maintenance` when status changes. Purpose/next action are required to be nonempty for Ready/Active. Active/Waiting need current state. Waiting needs unresolved blockers. Ready cannot have unresolved blockers. Completed needs a summary; the semantic validator rejects claiming the exact completion date is known when null but permits unknown historical dates. Experiment needs an experiment kind, question and stopping condition. Maintenance needs maintenance kind.

`resume` contains last result, known working state, failed attempts and decisions. `next_action` is the only stored current next action. `completion_criteria` is an array of observable boundaries. A completed record must have at least one criterion; evidence remains attributable, not automatically proven.

Inline `notes_markdown` stays readable. `document_ids` points to internal owned documents. `resources` holds external links. A document belongs to one mission in v0.2; reuse elsewhere is through a resource reference in exported views or a future explicit relationship, not duplicate ownership. Mission `related_mission_ids` supports cross-category relationships; `dependency_ids` forms a separate acyclic dependency graph. Deleting completed dependencies must not erase their meaning.

## Preferences

Supported sparse preference keys: `conversation`, `explanation`, `progress`, `step_size`, `notes_depth`, `notes_placement`. Enumerations are authoritative in the schema. An absent key inherits; null is not an override. Product defaults live in the context builder, not repeated on every record. Category ancestors are resolved root-first, mission last. Context export includes effective values plus origin labels. Temporary session overrides are packet/session context and do not mutate persisted defaults.

## Availability

Optional broad constraints: estimated minutes, energy, internet requirement, purchase requirement, required devices, physical access, downtime and remote capability. Unknown remains unknown. An unknown requirement must be shown as uncertain, not silently counted as satisfied. Availability filtering uses these constraints and unresolved blockers; it does not impose a priority ranking.

## Provenance

Provenance fields: `source_type`, `source_ref` or null, `observed_at` or null, `freshness`. Source values: user_reported, observed_result, repository_evidence, assistant_inference, integration_event. Freshness: current, historical, unknown. Evidence records add a claim. A prior repository snapshot may be strong evidence of the file and weak evidence of current runtime state; preserve that distinction in the claim.

Operation attribution, evidence on a claim, and the authority to apply an update are separate. Claiming `observed_result` is not a permission or proof; the UI must display the source and supporting reference.

## Update operations

All operations include `reason` and `provenance`.

| Operation | Payload | Constraints |
|---|---|---|
| create_category | Complete category | Parent within granted subtree or explicit workspace creation scope; no permission/guidance escalation. Initial AI category creation requires empty instructions/preferences. |
| create_mission | Complete mission | Target category permitted; no instruction/preference edits in AI create payload; unique ID. |
| update_mission | Mission ID + `changes` allowlist | Scope/revision valid; no changing IDs, instructions, preferences, evidence source of existing notes, or app-owned creation timestamps. |
| append_note | Mission ID + Markdown | Append once via update receipt deduplication. |
| put_document | Complete document | Owning mission allowed; an existing document cannot silently change ownership. |
| record_session | Complete session | Mission allowed, unique session ID; occurrence times may be unknown. |

No operation edits global preferences, automation grants, or instruction text. The user configures those in a dedicated UI. Manual mutations still validate graph/lifecycle invariants and use history.

Context packets show allowed mission/category IDs and allowed operations. The importer consults its stored grant, never a scope supplied by the returned update. Initial full-workspace onboarding can permit category creation with explicit empty-root scope. Ordinary mission-only exports grant no unrelated category/mission creation.

## Validation and transaction order

1. Enforce byte/depth bounds and reject duplicate keys/nonfinite numbers; parse.
2. Validate envelope structure and version; compare workspace and stored context grant.
3. Check replay identity before base revision: an identical already-applied update returns its receipt; changed content using the same ID is rejected.
4. Reject stale base revision or changed source fingerprint; never partially apply.
5. Check operation scope against the persisted grant, including new entities and document ownership.
6. Apply to an in-memory copy; app controls revision/timestamps and writes provenance history.
7. Validate full structure and semantics: all references, category/dependency cycles, status rules, ownership, URLs and maximum bounds.
8. Preview meaningful differences; enforce actual approval/automation policy.
9. Commit atomically with recovery copy, durable receipt and event history; report success only after persistence succeeds.

The supplied validation harness exercises a subset of these rules in memory and explicitly does not implement steps 8–9, durable grants, receipts, context generation, time authority, or a UI. These are build-backlog requirements.

## Migration from v0

v0 was descriptive and had no defined import file. There is no safe generic migration from arbitrary old YAML. A future importer must preview mappings: workspace/projects become categories only by chosen mapping; preserve systems as tags/resources; map `resume.next` to `next_action` only after resolving disagreements; keep unknown completion time null; retain unsupported source fields in a migration report. Back up originals. Do not migrate private users or the private Homelab as part of publishing this product specification.
