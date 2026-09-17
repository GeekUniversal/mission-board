# Mission Board — project blueprint

Design revision: 0.2 • 2026-09-17 • Status: implementation blueprint, not a shipped application

## 1. Product promise

Mission Board helps people organize meaningful work, resume after interruptions, and preserve what they learn. Users can maintain it manually or ask their own chatbot to maintain it while they work. The normal experience should be conversation plus a useful, organized board, with little clerical effort.

The three questions remain: **What am I working on? Where did I leave off? What can I work on now?** The fourth is **What did we learn, and where is that knowledge?**

Design for technical learners and people who find large task lists or context switching difficult; use plain language so the same tool works for a garden, coursework, creative work, or a small business. Do not market it as an ADHD treatment. No mandatory priorities, deadlines, streaks, productivity scores, or completion percentages.

## 2. Firm requirements and proposed implementation choices

### Requirements established by the project owner

- Public software and each user's private board are separate. Never publish real user boards, inventories, conversations, or histories as product examples.
- Users bring their own chatbot. Chatbot-assisted creation and maintenance are a first-release workflow. Manual use is fully supported.
- User-defined categories and nested subcategories organize missions primarily. Status is a separate property and view.
- Reusable instructions live with the product; workspace, category, and mission instructions specialize how assistants work.
- Each mission has independent controls for conversational detail, step size, explanations, progress reports, and documentation depth.
- Notes can be a few inline bullets, Markdown documents, or links to very deep external documentation. A compact resume summary is always available.
- Ownership, offline manual operation, portability, optional Git, and easy onboarding are fundamental.
- Updates preserve evidence and uncertainty. An assistant cannot invent work, test results, completion, or synchronization.

### Defaults chosen in this blueprint

These resolve implementation ambiguity; they can be revised through documented design changes.

| Decision | Default and reason |
|---|---|
| Primary category | One per mission; immutable IDs survive renames/moves. Tags and related-mission links handle overlap. |
| Quick capture | Title only; app fills ID, time, `idea`, and workspace Inbox category. |
| AI baseline | Selected-context export and validated update import. Works without a connected integration. |
| AI automation | Review by default; later opt-in scoped automatic routine updates through the same validator. |
| First portable format | One canonical JSON board snapshot with Markdown strings, plus generated human-readable exports. Avoid conflicting editable JSON and Markdown copies. |
| Native persistence | First prototype uses the canonical snapshot. A production storage adapter may change later only with tested migration/export. |
| First release UI | Category sidebar, mission list/board, focused mission detail, prominent Resume and Work with AI actions. |
| App technology | Proposed TypeScript domain layer and React UI; browser file import/export first, then a Tauri desktop shell for a simpler local-folder experience. Validate the shell on target systems before promising support. |
| Integration sequencing | Universal file exchange first; connected adapters next. No provider dependency in the domain layer. |
| License | Unselected. Owner chooses before a distributable application release; do not label the project open source merely because the repository is public. |

## 3. What exists at this checkpoint

Before this design batch, the public repository held a README and descriptive Mission Schema v0. This batch supplies the blueprint, updated v0.2 model, AI contract, JSON schemas, synthetic examples, a protocol validation harness, build backlog, and a regular-chat handoff. These are foundations, not a working end-user application.

No native app, browser app, database, installed integration, automatic documentation daemon, cloud sync, or user-data migration exists at this checkpoint. The validation harness checks example data and protocol rules; it is not the production write engine.

## 4. Organization people can understand

**Workspace → Category → optional Subcategories → Mission.** Categories may hold both missions and child categories. Users choose their own names. The default Inbox accepts uncategorized capture without forcing a setup exercise.

| Example workspace | Category path | Example mission |
|---|---|---|
| Example Workshop | Computing / Storage / Backups | Demonstrate restoring a sample file |
| Example Workshop | Garden / Growing experiments | Compare two seed-starting methods |
| Example Study | Languages / Spanish / Conversation | Complete a practice conversation |

These examples are fictional. A workspace is a private data boundary. A category is navigation, not a filesystem directory or a lifecycle state. A project may simply be a category with an outcome and instructions; do not require a second overlapping Project entity for v0.2. A large mission can become a category containing several outcome-focused missions, retaining a redirect/history entry so links do not disappear.

Use stable IDs for all relations. Moving a category changes its parent ID, not every descendant mission. Reject cycles, foreign-workspace references, duplicate IDs, and orphan references. Deleting a nonempty category requires an explicit reassignment plan; initial UI supports archive and move, not permanent deletion. Archived ancestors hide descendants by default without erasing them. Search can include archived content.

Navigation shows expand/collapse, breadcrumbs, optional counts, search, and drag/move with keyboard alternatives. Opening a parent includes descendants by default, with a visible toggle. Users can also view Active, Ready, Waiting, Experiments, Ideas, Maintenance, and Completed across the workspace or within the selected category. Never duplicate a mission to show it in two views.

Cross-workspace links are ordinary resource links in v0.2, not a hidden shared record. Switching workspaces must switch exports and permissions too.

## 5. Mission experience

Capture requires only a title. The app assigns the Inbox and defaults. A mission card shows title, status, next action, and optionally its category path and last work date. Opening it reveals:

1. **Resume:** current state, last meaningful result, next action, blockers.
2. **Notes:** small inline summary and document links, with progressive disclosure.
3. **Sessions:** what changed during meaningful periods of work.
4. **Details:** purpose, definition of done, related missions, resources, availability, evidence.
5. **How my assistant should help:** inherited instructions and detail settings, with explicit overrides and Reset to inherited.

Manual edits and AI updates use the same domain commands and history. Users can always correct assistant mistakes. Undo creates an observable reversing change; it does not erase history or silently restore an old whole-board snapshot over later edits.

`next_action` is authoritative. The Resume view displays that field rather than storing a competing `resume.next`. A checklist is optional supporting detail, not a replacement for a clear next action. Metadata edits do not change `last_activity_at`; completed work sessions do.

## 6. States and meaningful completion

Keep the seven agreed status values. Add `kind` (`mission`, `experiment`, `maintenance`) so an experiment remains identifiable when waiting or completed. No mandatory state sequence.

| Status | Meaning / readiness rule |
|---|---|
| Idea | Captured possibility; title-only input permitted. |
| Ready | Purpose and actionable next step present; no unresolved blocker. |
| Active | Current state, purpose, and next action present; currently receiving work. |
| Waiting | At least one unresolved blocker and a useful current-state description. |
| Experiment | Exploratory work; kind is experiment; include question and stopping condition before substantive testing. |
| Maintenance | Recurring responsibility; kind is maintenance. Completion of one occurrence is a session, not completion of the entire responsibility. |
| Completed | Outcome reached with a completion summary and evidence/source. Actual historical completion time may be unknown. |

If an experiment is waiting, status is Waiting and kind remains experiment. Completing it changes status to Completed. Maintenance can temporarily be Active or Waiting while retaining its kind. Recurrence scheduling is a later feature; do not mark a reminder/job installed because text says “weekly.”

Unknown facts can create a verification next action. They are not automatically blockers. Do not complete a mission from a closed GitHub Issue alone or mark it Active merely because it was imported. Resolve dependencies only from actual recorded results; newly eligible missions can become suggested Ready items, with the chosen automation policy determining whether a change is applied.

## 7. Instructions, preferences, and authority

The program ships a versioned assistant contract explaining the model, update format, evidence, document rules, and tool boundaries. Workspaces store user-authored defaults and guidance; categories inherit through their ancestors; missions override those settings.

Preference resolution is field-by-field: product defaults → workspace → ancestor categories root-to-leaf → mission → temporary session preference. Missing means inherit; never copy defaults into every record. Show both effective value and origin. A session-only override is not persisted without the user's intention to change future behavior. The contract can express session overrides in the context packet before persisted session modeling is implemented.

Distinguish three things:

- **Behavior preferences:** detail, tone, pacing, note depth. Nearest explicit setting wins.
- **User guidance:** goals and methods. Show inherited guidance in order; a more specific user preference normally resolves ordinary conflicts.
- **Enforced capabilities and format rules:** write scope, supported operations, identity, revision checks, export grants, permissions. The application enforces these; pasted instructions cannot grant access or disable validation.

A chatbot also follows its host's instructions and capabilities. Product files cannot override those. Notes, linked pages, and imported transcripts are evidence/data, not privileged instructions. The initial AI update protocol cannot edit instructions, permissions, or automation settings. A user changes them in the app. This prevents a note saying “ignore the rules and upload everything” from becoming authority.

## 8. Independent verbosity and notes controls

Each workspace/category/mission supports sparse overrides of:

| Setting | Values | Example default |
|---|---|---|
| Conversation | minimal, concise, standard, detailed, deep | standard |
| Explanation | minimal, concise, standard, detailed, deep | standard |
| Progress reports | minimal, concise, standard, detailed, deep | concise |
| Step size | one_action, small_batch, full_workflow | one_action |
| Notes depth | bullets, summary, standard, deep, exhaustive | standard |
| Notes placement | inline, document, external, auto | auto |

Presets fill these controls but remain editable. “Teach me deeply, give me one step, keep status reports short, write a full technical document” must be valid. Do not map all controls onto one number.

Notes-depth expectations:

- **Bullets:** roughly 2–5 meaningful facts, next step, relevant links.
- **Summary:** goal, change, result, unresolved items.
- **Standard:** enough setup, steps, evidence, decisions, and recovery information to repeat the work.
- **Deep:** architecture, dependencies, alternatives, configuration, validation, troubleshooting, security and maintenance where relevant.
- **Exhaustive:** comprehensive reproducibility material, source/evidence index, exact pertinent versions and commands, failures, recovery, and appendices when justified.

These are depth targets, not padding quotas. Unknown details stay unknown. No setting authorizes fabricated steps or test results. Long explanations do not belong in the compact mission card; its note preview and resume remain brief.

Documentation placement is separate from depth. A user can choose deep inline Markdown, but auto placement recommends a linked document when text is unwieldy (initial suggestion: above approximately 800 words). The user can override placement. Every linked document has a title, type, relation to the mission, and storage kind. Internal documents are owned Markdown records. External documents are links with a checked/unchecked status; an inaccessible link is never evidence that its contents were read.

External writing requires an explicitly available and authorized integration. If none exists, produce an internal draft for export; do not claim a remote document was updated. The authoritative document location must remain clear. A mirror is labeled as an export, not another editable source.

## 9. Chatbot-first workflow

### Universal exchange — first usable release

The user selects a workspace, category, or mission and chooses **Work with my AI**. Mission Board offers three plain tasks: Plan my work, Continue this mission, or Record what we did. It prepares a readable packet containing only the selected scope, necessary ancestors, effective instructions, detail preferences, relevant current records, the supported contract version, and the board revision.

The user copies it or attaches the file to their chosen chatbot. The chatbot helps them work, then returns a structured update file/block. The user brings it back through **Import AI update**. The app summarizes proposed additions and edits, validates the entire result, and applies accepted changes atomically. The success screen identifies the updated missions and where documents were saved.

This workflow needs no Mission Board AI subscription or API key. A chat service may impose its own file/context limits. For long packets use selected missions and explicit document excerpts; never imply an assistant remembers material it was not given. Manual editing works without any AI.

### Connected operation — subsequent milestone

An authorized adapter can expose narrow tools: read scoped context, preview update, and apply a permitted update. A provider-neutral tool contract may later be exposed through MCP or a local agent integration, subject to client support and installation testing. Do not promise every consumer chat can connect automatically or edit local files.

The same proposal validator handles clipboard, files, CLI, and connected tools. “AI-native” describes the workflow, not magical access. A running, configured integration is required for automatic application or background operation.

### Automation preferences

- **Review:** default; user sees the diff before application.
- **Routine auto-apply:** later opt-in for scoped low-impact note/session/next-action updates; visible receipt, history and undo remain required.
- **Manual only:** assistance can draft but cannot apply changes.

Changing permissions/instructions, deleting data, publishing, exporting additional data, or choosing a new destination is not authorized by routine auto-apply. Exporting selected context to a cloud chatbot is a user-chosen disclosure to that provider; local storage does not mean those chats are offline. Preview the selection before sharing and do not silently fetch/upload linked documents.

## 10. Portable data and durable storage

The first schema uses a canonical `missionboard.json` per private workspace. It contains categories, missions, internal Markdown documents, sessions, configuration, and application-managed revision metadata. JSON is an implementation detail; people use forms, buttons, import/export and document links.

Why start here: an entire update can be validated and committed as one unit; the file is inspectable, portable and easy to bring into another chat. Markdown exports make it readable without a specialized app. Avoid attempting independent bidirectional edits to a manifest and generated Markdown in the first release.

Tradeoff: long documents and history make one file larger and Git diffs less pleasant. Initial interactive import limits are 10 MiB and 50 operations; these are explicit engineering guardrails, not permanent product limits. Large documentation can stay in user-owned external files. If tests show unacceptable scale, move native persistence to SQLite or per-record files using an explicit migration. Keep the portable exchange schema stable and maintain one authority.

Internal documents store Markdown content in the canonical snapshot. Exported `.md` documents are derived copies. External resources retain their own authority and are not imported automatically. Attachments and provider credentials are outside the snapshot in v0.2; credentials belong in a secure credential store when integrations exist, never in exports.

Desktop save contract: take a workspace lock; verify current revision and source fingerprint; validate candidate in memory; write and flush a backup of the previous valid snapshot; write and flush a temporary candidate on the same filesystem; atomically replace the live file; flush the directory where supported; release lock. On failure retain a valid previous snapshot and a clear error. A journal/receipt mechanism must prevent duplicate application after a crash. Implement and test the OS-specific behavior before making durability guarantees.

Browser prototype: imported file plus explicit Download updated board; clearly display unsaved changes. Browser storage can assist recovery but is not the only durable copy. A successful download initiation is not proof that the user saved the file. Native directory access and automatic saves arrive with the desktop milestone.

All import paths use a parser that rejects duplicate JSON keys, invalid numbers, excessive size/depth and unknown versions. Migration never overwrites its only input. Unsupported future fields/versions are rejected with an actionable message rather than silently dropped.

## 11. AI updates, conflicts, and evidence

An update envelope contains protocol version, workspace ID, context ID, base revision, update ID, rationale, and typed operations. A packet is not permission: local application state records the allowed IDs/scope and expiry/revocation. The returned context ID selects that grant, but cannot widen it.

Supported initial operations: create category, create mission, update selected mission fields, append a note, upsert an internal Markdown document, and record a session. No arbitrary file paths, shell execution, deletion, permission editing, automatic external publication, or application-code changes. The user can still perform appropriate manual actions through dedicated app controls.

The app rejects stale revisions before any write. A second simultaneous chat sees a conflict and gets a refresh packet; no last-write-wins overwriting. A repeated update ID with identical content returns the original receipt; a repeated ID with different content is rejected. Scope and deduplication metadata live in private app state, not provider-authored fields. Native implementation must define durable storage for these receipts before enabling writes.

Preview must show changes in meaning, not just JSON: “Updated next action,” “Added a two-page note,” “Changed status to Completed.” Applying a subset means recomputing and validating a new candidate; dependencies between operations must still hold. Whole-update acceptance is sufficient for the first prototype.

Evidence carries source type (user report, observed result, repository evidence, assistant inference), optional source locator, time if known, and freshness (current, historical, unknown). A structurally valid update is not necessarily true. Software cannot prove that a claimed test was run from prose. Display attribution and retain review; do not promote assistant inference into confirmed fact. Never treat a missing exact historical completion time as a reason to invent a timestamp.

## 12. Privacy boundary

The public product repository stores source, schemas, synthetic examples, generic documentation, and tests. Private workspaces live in user-selected storage outside the source checkout. Ignore `user-data/`, private workspaces, exports and secrets in developer defaults, but explain that ignore rules are not a substitute for review.

Git is optional and explicitly configured per workspace. Never default a board's remote to the software repository. The app should detect an exact product-repository destination and warn/block the mistaken workspace setup. Do not claim it can recognize every fork or every public remote automatically. Before publishing or syncing, show the destination and scope; independent private repository policies still apply.

No default telemetry, prompt uploads, analytics, provider calls, or remote image loading in rendered Markdown. Treat Markdown as untrusted; disable raw HTML/scripts and executable URL schemes. Opening external resources is a deliberate user action. Links such as `../../secret` must never turn an imported document into a filesystem read/write request.

## 13. UI specification

Main screen: workspace selector and quick capture above a collapsible category sidebar. Center shows selected category's missions with status chips and list/board toggle. Search and filters remain available. Opening a mission exposes a detail panel or full-width focused view; long documents open separately with a breadcrumb back.

Onboarding asks only for a workspace name, optional template, and preferred working style. Start blank is first-class. Users can import an existing board or ask their AI to help plan one. They never need to create a GitHub repository or type JSON/YAML to start.

Editing a detail preference displays “Inherited from …” or “Custom for this mission.” A preview sentence demonstrates its effect. Deep notes and concise conversation must be visibly compatible. Manual Add mission remains one prominent action, with optional category selection.

Accessibility: keyboard navigation, focus return after dialogs, sufficient contrast, scalable text, accessible names, reduced-motion support, status text alongside color, and button alternatives to dragging. Avoid auto-moving focused items unexpectedly. Completion celebrates quietly and remains searchable. No guilt-oriented notifications.

## 14. Implementation architecture and stack

Use one domain model and command engine beneath every interface. Proposed layers:

1. Domain: entities, invariants, instruction resolution, lifecycle, availability filtering.
2. Exchange: context builder, schema validation, operation parsing, scope checks, preview/diff.
3. Persistence: load/save, revisions, locks, backups, receipts, migration.
4. UI: categories, mission views, document reader/editor, manual capture, preferences and import review.
5. Adapters: browser files first, desktop filesystem second, optional Git and connected AI later.

Recommended development default: TypeScript + React for UI/domain, a JSON Schema 2020-12 validator such as Ajv configured strictly, and a later Tauri desktop shell. This is a proposed build direction, not installed scaffolding. Tauri combines a Rust core with a webview UI; its capability model can restrict exposed application commands. See [official architecture](https://v2.tauri.app/concept/architecture/) and [capabilities](https://v2.tauri.app/security/capabilities/). The choice still needs a small Linux/Windows compatibility spike before release commitments.

JSON Schema specifies structural validation, not graph integrity, authorization, or truth. The semantic validator handles those additional rules. See [JSON Schema](https://json-schema.org/) and [Ajv documentation](https://ajv.js.org/). The included Python harness provides implementation-independent contract tests and does not prescribe the eventual application language.

Do not add a cloud backend, accounts, payments, mobile apps, collaborative editing, vector search, or built-in paid model integration to the first vertical slice. They add deployment and data risks without proving that users can resume work.

## 15. Build stages and acceptance gates

| Stage | Deliverable | Evidence required to move on |
|---|---|---|
| 0 — this batch | Blueprint, AI contract, schemas, synthetic fixtures, validation harness and handoff | Fixtures validate; invalid references, stale revisions, scope violations and malformed inputs are rejected; design limitations explicit. |
| 1 — portable core | Production domain commands, importer, preview, context export, preference resolution and durable file adapter | Round-trip loses no fields; crash/conflict tests preserve existing data; identical updates are idempotent; unsupported inputs fail clearly. |
| 2 — usable UI | Categories/subcategories, manual missions, Resume, notes/docs, detail controls, AI exchange | A new user can create a board, ask an AI for a mission, review/import, leave and resume without editing a data file. |
| 3 — desktop alpha | Native local save, backup/restore, packaging and accessible workflow | Restart preserves work; restore is demonstrated; target OS checks pass; no network required for manual use. |
| 4 — connected assistance | One scoped adapter, sessions, visible receipts, user-controlled routine automation | Real client connection tested; no tool can escape scope; documentation changes are attributable and reversible. |
| 5 — beta | Search, availability filters, optional private Git, larger-workspace tests and documentation | Useful on a sustained private pilot; real data stays private; migration/restore and public-demo boundaries pass. |

AI exchange arrives in stage 1/2, not after optional Git or availability filtering. Release version numbers are not calendar promises. The detailed backlog gives a starting order while users remain free to work on their own missions non-linearly.

## 16. Product success and testing

Initial targets to validate with people, not advertised performance claims: title capture within roughly 15 seconds; a returning user identifies the next action within about 30 seconds; no compulsory configuration beyond workspace setup; exporting only one mission works; a novice imports a chatbot update without editing JSON.

Core tests: IDs/references/cycles; inherited settings including resets and moving categories; state requirements; unknown historical dates; duplicate keys; unsupported fields; long Unicode notes; no dropped Markdown; stale updates from two chats; duplicate update IDs; changed repeated IDs; unauthorized scope; document reassignment; malformed URLs; crash during save; backup failure; manually edited files; import/export fidelity; keyboard-only onboarding.

Representative sample dataset should include five fictional missions across three nested categories, mixed statuses, one linked external document and one internal deep document. Simulate two chats with the same base revision; apply one, reject/refresh the other. Usability testing must include a participant who does not use Git.

## 17. Decisions deliberately still open

- Software license and eventual business model: owner decision, independent of user's private data ownership.
- Target release platforms and packaging: begin development on available hardware, verify each supported platform before claiming it.
- Native persistence beyond first snapshot adapter: benchmark real document/history size; do not maintain competing authoritative copies.
- First connected chatbot client: pick only after checking actual available integration capabilities.
- Mobile and multi-device sync: later, with explicit conflict, encryption and recovery design.
- Full recurrence engine: later; maintenance records alone do not schedule anything.

No decision above blocks implementing the portable core or testing the basic user flow. License selection does block describing a distributable release as open source.

## 18. Continuity if development moves to ordinary chat

The companion [chat handoff](CHAT-HANDOFF.md) is the entry point. Upload the standalone continuation packet or paste the handoff plus relevant files. A normal chat can plan, explain, review and generate patches even when it cannot execute or push. It must explicitly distinguish drafted, locally tested, committed and pushed states.

At every development milestone update the backlog, record changed files and real test results, and keep a small next-action checkpoint. Before asking the owner to copy commands, explain one task and wait for its result. Preserve their work and use deliberate Git staging. The public repo remains entirely generic; private pilot data stays outside it.

**Next concrete development task:** build the production in-memory domain command/preview layer against the supplied schemas and fixtures, starting with create mission, update next action, resolve preferences and reject a stale update. Then add persistence before calling it usable software.
