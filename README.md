# Mission Board

Mission Board is a local-first project memory and navigation system for technical people who juggle projects, experiments, repairs, learning, and ideas without wanting another rigid productivity system.

It is designed to answer three questions well:

1. What am I working on?
2. Where did I leave off?
3. What can I realistically work on right now?

## Why this exists

Traditional task managers are good at storing lists. They are often less helpful when work is interrupted and the important problem is reconstructing context:

- what is true now
- what already worked
- what failed
- what is blocking progress
- what decision was made
- what concrete action comes next

Mission Board treats that resume context as first-class project data.

## Product principles

- Missions represent meaningful outcomes, not task sludge.
- Capturing an idea should take seconds.
- Detail appears progressively when it becomes useful.
- Work can switch without losing context.
- Due dates and priority rankings are optional.
- Local ownership and offline use come first.
- Git, GitHub, Markdown, and AI are optional integrations.
- Automation assists memory without inventing facts.
- The interface should feel like a cockpit, not a school planner.

## Current stage

**Version 0: product design and Homelab dogfooding**

There is intentionally no application framework or production code yet. The first goal is to prove the Mission model against real work before committing to a database, UI stack, or synchronization architecture.

Current design artifact:

- [Mission Schema v0](docs/mission-schema-v0.md)

## Initial lifecycle

- Idea
- Ready
- Active
- Waiting
- Experiment
- Maintenance
- Completed

The model emphasizes a concrete next action, clear blockers, and a compact Resume view rather than fake percentage-complete estimates.

## Planned progression

1. Dogfood the schema with real Homelab Missions.
2. Refine the lifecycle, session model, and Resume model.
3. Build a small local prototype.
4. Add sessions, history, search, and Markdown export.
5. Add optional Git and GitHub awareness.
6. Add "What can I work on now?" context filtering.
7. Add carefully bounded AI assistance after the underlying workflow works.

## Deliberately out of scope for the first prototype

- team collaboration
- enterprise accounts
- cloud-required operation
- calendars and Gantt charts
- mandatory due dates
- gamification
- large plugin ecosystems
- AI features without inspectable history and user control

## First proving ground

The creator's Homelab is the first dogfood workspace. It contains enough Linux, hardware, documentation, repair, networking, and learning work to expose whether the model genuinely helps someone resume technical projects after interruptions.

## License

A software license has not been selected yet. A license will be chosen deliberately before distributable application code is published.
