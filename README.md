# Mission Board

A local-first project memory and navigation tool designed for people who juggle projects, experiments, learning and ideas. Organize missions in categories and subcategories, resume after interruptions, and let your chosen chatbot help maintain the record while you work.

**Current stage: design foundation 0.2. There is no installable end-user application yet.** This repository contains specifications, fictional examples and a tested specification harness. The next implementation milestone is the domain command and preview layer.

## Start here

- [Complete project blueprint](docs/BLUEPRINT.md) — product, UX, architecture, decisions, roadmap and acceptance gates.
- [Continue in a regular chat](docs/CHAT-HANDOFF.md) — copyable prompt and accurate development checkpoint.
- [Build backlog](docs/BUILD-BACKLOG.md) — bounded implementation tasks and next action.
- [Assistant operating contract](docs/AI-CONTRACT.md) — embedded instructions and truthful update behavior.
- [Mission schema v0.2](docs/mission-schema-v0.2.md) — portable data and update semantics.
- [Validation evidence](docs/VALIDATION.md) — what has and has not been tested.
- [Original v0 model](docs/mission-schema-v0.md) — historical design context.

## The intended experience

1. Create a private workspace or open your own board.
2. Add missions manually, or ask your preferred chatbot to organize your goals.
3. Browse categories and nested subcategories; use statuses as another view.
4. Continue a mission using compact Resume context and its next action.
5. Choose independent conversation, pacing, explanation and documentation detail for each mission.
6. Keep brief notes inline or link to deep Markdown/external documentation.
7. Let the assistant prepare updates from real work; review/apply them through the program.

The first AI workflow is selected-context export and validated update import. Connected, scoped automatic updates come later through the same rules. A prompt alone does not give a chatbot local-file access. Manual use works without AI; Git and cloud accounts are optional.

## Privacy and ownership

This public repository is the reusable software project. **It is not a storage location for anyone's personal board.** User workspaces live outside the source checkout in local storage or a user-chosen private destination. Public examples are fictional. Sending selected context to a chatbot is an explicit user choice; private documents are never silently uploaded or published.

## Product principles

- Meaningful outcomes with low-friction, title-only capture.
- Workspace → Category → Subcategories → Mission, with one category home and cross-cutting links/tags.
- Compact current state, last result, next action, blockers and documentation links.
- Independent per-mission detail preferences inherited from workspace and categories.
- Portable instructions and data for the user's own chatbot; no required model provider.
- Validated updates, attributable evidence, revision checks and recoverable history.
- No forced learning order, deadlines, priority scores, fake completion percentages or guilt features.
- Local ownership and offline manual operation; no mandatory subscription or cloud backend.

## Specification files

| Location | Role |
|---|---|
| `schemas/board.schema.json` | Complete portable workspace snapshot contract |
| `schemas/update.schema.json` | Typed assistant update envelope |
| `examples/synthetic-board.json` | Five fictional missions and nested categories |
| `examples/synthetic-update.json` | Fictional scoped mission/session update |
| `examples/synthetic-grant.json` | Example locally stored permission scope; not an AI permission request |
| `tools/validate_spec.py` | In-memory contract tests; no persistence or real user-data writes |

## Run the specification checks

Developer/contributor workflow with Python 3.12 or a compatible supported Python version:

```bash
python -m venv .venv
```

```bash
.venv/bin/python -m pip install -r requirements-dev.txt
```

```bash
.venv/bin/python tools/validate_spec.py
```

On Windows use `.venv\Scripts\python.exe` in place of `.venv/bin/python`. These are contributor checks, not end-user installation instructions. Python is used for the specification harness; the proposed application direction is TypeScript/React with a later desktop shell.

## Implementation status and limits

The schemas and harness are draft contract artifacts. No UI, production importer, durable save engine, context exporter, connected AI adapter, Git synchronization, installer or background worker has been implemented. Validate semantics in addition to JSON structure. See the backlog for persistence, idempotency, crash recovery and permission enforcement requirements.

## License

A software license has not been selected. Public visibility alone is not an open-source license. The owner will choose a license before publishing a distributable application release.
