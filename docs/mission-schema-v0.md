# Mission Schema v0

Status: Draft for dogfooding

This document defines the information Mission Board must preserve about a Mission before the application architecture is chosen. It is a product model, not yet a database schema or API contract.

## What is a Mission?

A Mission is a meaningful outcome that may span multiple work sessions.

A Mission is not a list of every keystroke. Small steps belong in the current next action or in a session record.

A useful Mission should help someone answer:

1. What am I trying to accomplish?
2. Where did I leave off?
3. What is the next concrete action?
4. What is blocking me?
5. Can I realistically work on this now?

## Design constraints

- Capturing an idea must take seconds.
- Detail should appear progressively rather than as one large form.
- Context must survive interruption and project switching.
- Dates and priorities should be optional unless the work genuinely needs them.
- Automatic updates must preserve provenance and must not turn guesses into facts.
- The model must work locally without GitHub, cloud sync, or AI.
- Git, GitHub, and AI are optional integrations built around the same core model.

## Minimum capture

Only a title is required to capture a new Mission.

```yaml
title: Restore GPU driver compatibility
status: idea
```

The application may assign the identifier and timestamps automatically. More information becomes necessary only as the Mission becomes actionable.

## Core fields

| Field | Requirement | Purpose |
|---|---|---|
| `id` | System required | Immutable unique identifier |
| `title` | User required | Short outcome-oriented name |
| `status` | Defaults to `idea` | Current lifecycle state |
| `purpose` | Required when Ready or Active | Why the outcome matters |
| `current_state` | Required when Active or Waiting | Concise statement of what is true now |
| `next_action` | Required when Ready or Active | One concrete, resumable action |
| `created_at` | System required | Creation timestamp |
| `updated_at` | System required | Last meaningful update timestamp |
| `last_activity_at` | System managed | Most recent work-session activity |
| `completion_criteria` | Recommended before Active | Observable definition of done |

## Status values

| Status | Meaning | Additional rule |
|---|---|---|
| `idea` | Interesting but not yet defined | Title alone is valid |
| `ready` | Actionable and not blocked | Must have a next action |
| `active` | Currently receiving attention | Must have current state and next action |
| `waiting` | Progress depends on an external condition | Must have at least one blocker |
| `experiment` | A time-bounded test without an adoption commitment | Should state the question or hypothesis |
| `maintenance` | Recurring operational work | Recurrence behavior is deferred |
| `completed` | The observable outcome was reached | Must record a completion summary and time |

Archiving is treated as a separate visibility behavior for now, not a Mission status.

## Resume context

Resume context is the product's central feature. It should be compact enough to scan quickly and specific enough to prevent reconstructing the entire project from memory.

```yaml
resume:
  last_time: Kernel 7.2 caused the out-of-tree GPU module build to fail.
  known_working: Kernel 7.1 with matching headers boots with both displays.
  failed_attempts:
    - Rebuilding the same driver against kernel 7.2
  decisions:
    - Keep the known-working kernel installed during investigation.
  next: Check whether a newer driver package supports kernel 7.2.
```

Not every key must be populated. The interface should show only meaningful entries.

## Blockers

A blocker explains why a Mission is not currently actionable.

```yaml
blockers:
  - id: replacement-part
    reason: Replacement motherboard has not arrived.
    kind: delivery
    waiting_on: Shipment
    created_at: 2026-09-16T14:00:00Z
    revisit_on: null
    resolved_at: null
```

Initial blocker kinds may include:

- dependency
- delivery
- money
- hardware
- access
- another-person
- upstream
- decision
- time
- other

These are filters, not moral judgments or priority levels.

## Context and relationships

A Mission can relate to several contexts without being trapped in a rigid folder hierarchy.

```yaml
workspace: Homelab
projects:
  - Precision 3630
systems:
  - workstation
tags:
  - arch-linux
  - nvidia
related_missions: []
```

The hierarchy remains shallow:

```text
Workspace -> Projects -> Missions
```

Tags and relationships handle cross-cutting work.

## Availability constraints

These optional fields support the future "What can I work on now?" feature.

```yaml
availability:
  estimated_minutes: 30
  energy: medium
  locations:
    - anywhere
  required_devices:
    - computer
  internet: required
  purchase: none
  estimated_cost: 0
```

Version 0 uses broad, forgiving values. It should not pretend that human energy or task duration can be measured precisely.

## Resources

Missions can link to the evidence and artifacts surrounding the work.

```yaml
resources:
  documents: []
  files: []
  repositories: []
  issues: []
  pull_requests: []
  commits: []
  urls: []
```

Git and GitHub references are optional. A Mission must remain fully useful without them.

## Sessions and history

A Session is one period of work toward a Mission. It is a related entity rather than an ever-growing field embedded in the Mission.

A compact Mission history records meaningful events:

```yaml
history:
  - at: 2026-09-16T14:30:00Z
    type: status_changed
    summary: Moved from Ready to Active.
    source: user
  - at: 2026-09-16T15:10:00Z
    type: finding_recorded
    summary: Confirmed the older kernel boots with the GPU driver.
    source: verified_session_result
```

Likely event types include:

- created
- updated
- status_changed
- blocker_added
- blocker_resolved
- session_started
- session_completed
- finding_recorded
- decision_recorded
- resource_linked
- completed
- reopened

## Provenance and certainty

Automatic assistance must distinguish between what was verified, what a user reported, and what the system inferred.

Meaningful generated updates should retain a source category:

- `verified_session_result`
- `user_reported`
- `repository_evidence`
- `integration_event`
- `assistant_inference`

An inference may be proposed, but it must not silently overwrite a confirmed fact.

## Full example

```yaml
id: mission_01JEXAMPLE
title: Restore GPU driver compatibility
status: active
purpose: Keep the workstation reliable while determining a safe upgrade path.
current_state: The known-working kernel boots normally; the newer kernel fails to build the GPU module.
next_action: Check the latest supported driver and kernel compatibility.
created_at: 2026-09-14T18:00:00Z
updated_at: 2026-09-16T15:10:00Z
last_activity_at: 2026-09-16T15:10:00Z
completion_criteria:
  - A supported kernel and driver combination boots successfully.
  - The recovery procedure is documented.
workspace: Homelab
projects:
  - Workstation
systems:
  - gpu
tags:
  - linux
  - drivers
resume:
  last_time: Recovered the graphical environment with the older kernel.
  known_working: Older kernel with matching headers.
  failed_attempts:
    - Building the existing driver against the newer kernel.
  decisions:
    - Preserve the working boot entry during testing.
  next: Research the currently supported combination.
blockers: []
availability:
  estimated_minutes: 30
  energy: medium
  locations:
    - anywhere
  required_devices:
    - computer
  internet: required
  purchase: none
  estimated_cost: 0
resources:
  documents: []
  files: []
  repositories: []
  issues: []
  pull_requests: []
  commits: []
  urls: []
related_missions: []
```

## Questions to test during dogfooding

- Is one next action enough, or do Missions need a small queue?
- Does `current_state` overlap too much with Resume context?
- Which fields are actually useful after several weeks away?
- Are Experiment and Maintenance true lifecycle states or specialized Mission types?
- What should automatically move a Mission between states?
- How should stale Resume context be detected?
- Which availability constraints produce useful suggestions without creating setup work?
- How much history should be generated automatically?
- Which claims require explicit confirmation before documentation is updated?

## Acceptance test for v0

The schema succeeds if the Homelab can use it for several real Missions and, after an interruption, the user can understand the state and safely resume work without reconstructing the project from chat history.
