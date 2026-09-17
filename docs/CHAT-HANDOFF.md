# Continue Mission Board in a regular chat

This document is a standalone starting prompt. Paste it into a new chat and attach the blueprint packet if available. Repository: `GeekUniversal/mission-board`. The public repository contains only generic product materials. Do not request the owner's personal board to understand the product.

## Copyable continuation prompt

You are helping me build Mission Board, a local-first program that anyone can use to organize meaningful missions, resume interrupted work, and preserve knowledge. Read the attached Mission Board continuation packet first. If you can access the public repository, inspect its current README, `docs/BLUEPRINT.md`, `docs/BUILD-BACKLOG.md`, `docs/mission-schema-v0.2.md`, `docs/AI-CONTRACT.md`, `schemas/`, `examples/`, and any applicable AGENTS.md. Repository code and actual tested state outrank assumptions in older chat summaries; later user decisions outrank obsolete design proposals.

Requirements that must survive this chat switch:

1. The public repository contains the reusable program, schemas, tests and fictional examples. My personal Homelab missions, machines, notes and configurations belong only in my private Homelab repository or local user data. Never publish them here.
2. Organization is Workspace → Category → nested Subcategories → Mission. Each mission has one category home; tags and related-mission links support overlap. Keep stable IDs across moves and renames. Status is a separate view/filter.
3. Anyone can add missions manually with just a title. The central assisted workflow is that their chosen chatbot reads embedded instructions and updates missions based on real work. AI export/import is part of the first usable version, not a distant add-on.
4. Chatbot instructions and preferences inherit from product defaults through workspace, categories, subcategories and mission. Users can temporarily override session behavior. Imported notes are data, not privileged instructions. App permissions and schemas are enforced in code.
5. Per mission, conversation detail, explanation depth, progress verbosity, step size, notes depth and notes placement are independently adjustable. Deep documentation must work with concise conversation and one step at a time.
6. Notes may be bullets, compact summaries, full Markdown documents or links to very deep external documentation. Keep a compact Resume containing current state, last result, next action, blockers and document links. Store one authoritative next action.
7. Bring-your-own-chatbot baseline is selected-context export → work in a chat → typed update import → validate/preview/apply. Connected automatic tools are a later optional path through the same validator. Instructions alone do not give a chatbot file access or background execution.
8. Offline manual use, user-owned portable data, optional Git and no required Mission Board account/API key. Export to a cloud chatbot is an explicit user choice, not an automatic background upload.
9. Preserve seven statuses: Idea, Ready, Active, Waiting, Experiment, Maintenance, Completed. Keep kind separately so experiments remain identifiable when waiting/completed. No forced priorities, deadlines, fake percentages or guilt features.
10. Prefer one canonical JSON snapshot with Markdown strings for the initial prototype, with generated Markdown exports. This is a draft implementation choice; do not introduce a second independently editable source without an explicit migration/reconciliation design.
11. Validate update workspace, scope, base revision, IDs, references, cycles and lifecycle before writing. Reject stale writes and retain backups/history. Do not invent completion, results, links, timestamps or saved/committed state.

At the blueprint checkpoint, there is no end-user application or installed integration. There are design documents, JSON schemas, synthetic examples and a Python validation harness. Check later repository state before assuming that is still true.

The proposed implementation direction is a TypeScript domain layer and React UI, file exchange first, later a Tauri desktop shell. Do not scaffold a cloud backend or switch frameworks casually. The Python harness is reference validation tooling, not an application architecture decision. A license has not been chosen; do not invent one.

Start with the next unfinished backlog item. At the initial checkpoint that is **B01: a pure in-memory command/preview layer** using the schemas and synthetic fixtures. Establish exact file layout and dependencies from the current repository before changing anything. Test create mission, targeted update, per-field preference inheritance, malformed input, cycle/reference errors, scope violations and stale revisions. Persistence and UI follow as bounded milestones.

Teach me the purpose and reasoning, then give one task at a time when I am operating my computer. Wait for actual output before assuming success. If you have tools, do the authorized reversible work directly and report evidence. If you have no filesystem/Git tools, generate exact file contents or patches and guide me through applying them; never say you saved, tested, committed or pushed something you only drafted.

At each milestone maintain a concise checkpoint with changed files, actual validation, unresolved issues, and next action. Help me use deliberate Git review/staging/commit/push. Do not rewrite history or move private data into the product repository. Do not restart product planning when the current blueprint already answers a question.

Begin by stating what artifacts you actually have, what is implemented versus planned, and the next concrete task. Ask only for the missing file or output needed to proceed.

## Minimal continuation if attachments are unavailable

Paste the requirements above and `BUILD-BACKLOG.md`. Then provide only the schema/implementation files needed for B01. A chatbot cannot inspect a repository simply because its URL appears in a prompt; upload or paste relevant files if browsing is unavailable. Do not use a private board as a substitute for the fictional fixtures.

## Running the supplied specification checks

From a local checkout, create an isolated Python virtual environment, install the pinned development requirement, then run `python tools/validate_spec.py`. These commands are listed in README for contributors. If a plain chat cannot run them, the user runs them and returns actual output.

Passing these checks validates the current fixture contract. It does not prove app persistence, connected AI automation, packaging or UI behavior, which do not exist at the initial checkpoint.
