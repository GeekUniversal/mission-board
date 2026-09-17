import { readFileSync } from "node:fs";
import { createRequire } from "node:module";

import type { Ajv2020 as Ajv2020Class, ErrorObject, ValidateFunction } from "ajv/dist/2020.js";
import type { FormatsPlugin } from "ajv-formats";

import { DomainError, requireDomain } from "./errors.js";
import {
  SUPPORTED_OPERATIONS,
  type Board,
  type ContextGrant,
  type Mission,
  type Update,
} from "./types.js";

const boardSchema: object = JSON.parse(
  readFileSync(new URL("../schemas/board.schema.json", import.meta.url), "utf8"),
);
const updateSchema: object = JSON.parse(
  readFileSync(new URL("../schemas/update.schema.json", import.meta.url), "utf8"),
);

const grantSchema = {
  type: "object",
  properties: {
    context_id: { type: "string", pattern: "^ctx_[A-Za-z0-9_-]{1,80}$" },
    workspace_id: { type: "string", pattern: "^ws_[A-Za-z0-9_-]{1,80}$" },
    base_revision: { type: "integer", minimum: 0 },
    mission_ids: {
      type: "array",
      items: { type: "string", pattern: "^mis_[A-Za-z0-9_-]{1,80}$" },
      uniqueItems: true,
    },
    category_ids: {
      type: "array",
      items: { type: "string", pattern: "^cat_[A-Za-z0-9_-]{1,80}$" },
      uniqueItems: true,
    },
    operations: {
      type: "array",
      items: { enum: SUPPORTED_OPERATIONS },
      uniqueItems: true,
    },
    allow_root_categories: { type: "boolean" },
  },
  required: [
    "context_id",
    "workspace_id",
    "base_revision",
    "mission_ids",
    "category_ids",
    "operations",
    "allow_root_categories",
  ],
  additionalProperties: false,
} as const;

const require = createRequire(import.meta.url);
const { default: Ajv2020 } = require("ajv/dist/2020.js") as {
  default: typeof Ajv2020Class;
};
const { default: addFormats } = require("ajv-formats") as {
  default: FormatsPlugin;
};
const ajv = new Ajv2020({ allErrors: true, strict: true });
addFormats(ajv);

const boardValidator = ajv.compile(boardSchema);
const updateValidator = ajv.compile(updateSchema);
const grantValidator = ajv.compile(grantSchema);

function structuralMessage(kind: string, errors: ErrorObject[] | null | undefined): string {
  const details = (errors ?? [])
    .map((error) => `${error.instancePath || "/"} ${error.message ?? "is invalid"}`)
    .join("; ");
  return `${kind} does not match its strict schema${details ? `: ${details}` : ""}`;
}

function assertStructure<T>(
  value: unknown,
  validator: ValidateFunction,
  kind: string,
  code: "invalid_board" | "invalid_update" | "invalid_grant",
): asserts value is T {
  if (!validator(value)) {
    throw new DomainError(code, structuralMessage(kind, validator.errors));
  }
}

function indexById<T extends { id: string }>(
  items: readonly T[],
  collection: string,
): Map<string, T> {
  const result = new Map<string, T>();
  for (const item of items) {
    requireDomain(
      !result.has(item.id),
      "duplicate_id",
      `Duplicate ${collection} ID: ${item.id}`,
    );
    result.set(item.id, item);
  }
  return result;
}

function assertAcyclic(graph: ReadonlyMap<string, readonly string[]>, label: string): void {
  const done = new Set<string>();
  for (const root of graph.keys()) {
    if (done.has(root)) continue;
    const active = new Set<string>();
    const stack: Array<{ id: string; exiting: boolean }> = [{ id: root, exiting: false }];
    while (stack.length > 0) {
      const current = stack.pop();
      if (!current) break;
      if (current.exiting) {
        active.delete(current.id);
        done.add(current.id);
        continue;
      }
      if (done.has(current.id)) continue;
      requireDomain(
        graph.has(current.id),
        "missing_reference",
        `${label} references missing entity ${current.id}`,
      );
      requireDomain(
        !active.has(current.id),
        "relationship_cycle",
        `${label} contains a cycle at ${current.id}`,
      );
      active.add(current.id);
      stack.push({ id: current.id, exiting: true });
      for (const target of graph.get(current.id) ?? []) {
        stack.push({ id: target, exiting: false });
      }
    }
  }
}

function repeatedlyDecode(value: string): string | null {
  let decoded = value;
  for (let count = 0; count < 4; count += 1) {
    try {
      const next = decodeURIComponent(decoded);
      if (next === decoded) return decoded;
      decoded = next;
    } catch {
      return null;
    }
  }
  return decoded;
}

export function isSafeResourceLocator(locator: string): boolean {
  const decoded = repeatedlyDecode(locator);
  if (
    decoded === null ||
    decoded.length === 0 ||
    /[\u0000-\u001F\u007F]/u.test(decoded) ||
    decoded.includes("\\")
  ) {
    return false;
  }

  let absolute: URL;
  try {
    absolute = new URL(decoded);
  } catch {
    if (decoded.startsWith("/") || decoded.startsWith("//")) return false;
    const path = decoded.split(/[?#]/u, 1)[0] ?? "";
    return path.split("/").every((segment) => segment !== ".." && segment !== ".");
  }
  return absolute.protocol === "https:" && absolute.hostname.length > 0 && !absolute.username && !absolute.password;
}

function validateMissionLifecycle(mission: Mission): void {
  const unresolved = mission.blockers.some((blocker) => !blocker.resolved);
  if (mission.status === "ready" || mission.status === "active") {
    requireDomain(
      mission.purpose.trim().length > 0 && mission.next_action.trim().length > 0,
      "lifecycle_violation",
      `${mission.id}: Ready/Active missions need a purpose and next action`,
    );
  }
  if (mission.status === "active" || mission.status === "waiting") {
    requireDomain(
      mission.current_state.trim().length > 0,
      "lifecycle_violation",
      `${mission.id}: Active/Waiting missions need a current state`,
    );
  }
  if (mission.status === "ready") {
    requireDomain(!unresolved, "lifecycle_violation", `${mission.id}: Ready mission has an unresolved blocker`);
  }
  if (mission.status === "waiting") {
    requireDomain(unresolved, "lifecycle_violation", `${mission.id}: Waiting mission needs an unresolved blocker`);
  }
  if (mission.status === "experiment") {
    requireDomain(
      mission.kind === "experiment" &&
        Boolean(mission.question?.trim()) &&
        Boolean(mission.stopping_condition?.trim()),
      "lifecycle_violation",
      `${mission.id}: Experiment needs experiment kind, question, and stopping condition`,
    );
  }
  if (mission.status === "maintenance") {
    requireDomain(
      mission.kind === "maintenance",
      "lifecycle_violation",
      `${mission.id}: Maintenance status needs maintenance kind`,
    );
  }
  if (mission.status === "completed") {
    requireDomain(
      mission.completion !== null &&
        mission.completion.summary.trim().length > 0 &&
        mission.completion_criteria.length > 0,
      "lifecycle_violation",
      `${mission.id}: Completed mission needs a summary and completion criteria`,
    );
    requireDomain(
      mission.completion.time_known === (mission.completion.occurred_at !== null),
      "lifecycle_violation",
      `${mission.id}: Completion time and time_known conflict`,
    );
  }
}

export function validateBoard(value: unknown): asserts value is Board {
  assertStructure<Board>(value, boardValidator, "Board", "invalid_board");

  const categories = indexById(value.categories, "category");
  const missions = indexById(value.missions, "mission");
  const documents = indexById(value.documents, "document");
  const sessions = indexById(value.sessions, "session");

  const inbox = categories.get(value.inbox_category_id);
  requireDomain(inbox, "missing_reference", `Missing Inbox category ${value.inbox_category_id}`);
  requireDomain(
    inbox.parent_id === null && !inbox.archived,
    "lifecycle_violation",
    "Inbox must be a visible root category",
  );

  const categoryGraph = new Map(
    value.categories.map((category) => [category.id, category.parent_id ? [category.parent_id] : []]),
  );
  const dependencyGraph = new Map(
    value.missions.map((mission) => [mission.id, mission.dependency_ids]),
  );
  assertAcyclic(categoryGraph, "Category graph");
  assertAcyclic(dependencyGraph, "Dependency graph");

  for (const mission of value.missions) {
    requireDomain(
      categories.has(mission.category_id),
      "missing_reference",
      `${mission.id} references missing category ${mission.category_id}`,
    );
    for (const relatedId of mission.related_mission_ids) {
      requireDomain(
        relatedId !== mission.id && missions.has(relatedId),
        "missing_reference",
        `${mission.id} has invalid related mission ${relatedId}`,
      );
    }
    for (const documentId of mission.document_ids) {
      const document = documents.get(documentId);
      requireDomain(
        document?.mission_id === mission.id,
        "document_ownership",
        `${mission.id} does not own referenced document ${documentId}`,
      );
    }
    for (const resource of mission.resources) {
      requireDomain(
        isSafeResourceLocator(resource.locator),
        "unsafe_resource",
        `${mission.id} has unsafe resource locator: ${resource.locator}`,
      );
    }
    validateMissionLifecycle(mission);
  }

  for (const document of value.documents) {
    const owner = missions.get(document.mission_id);
    requireDomain(
      owner?.document_ids.includes(document.id),
      "document_ownership",
      `${document.id} is orphaned or absent from its owning mission`,
    );
  }
  for (const session of sessions.values()) {
    requireDomain(
      missions.has(session.mission_id),
      "missing_reference",
      `${session.id} references missing mission ${session.mission_id}`,
    );
  }
}

export function validateUpdate(value: unknown): asserts value is Update {
  assertStructure<Update>(value, updateValidator, "Update", "invalid_update");
}

export function validateGrant(value: unknown, board?: Board): asserts value is ContextGrant {
  assertStructure<ContextGrant>(value, grantValidator, "Context grant", "invalid_grant");
  if (!board) return;

  const missionIds = new Set(board.missions.map((mission) => mission.id));
  const categoryIds = new Set(board.categories.map((category) => category.id));
  for (const missionId of value.mission_ids) {
    requireDomain(
      missionIds.has(missionId),
      "invalid_grant",
      `Grant references unknown mission ${missionId}`,
    );
  }
  for (const categoryId of value.category_ids) {
    requireDomain(
      categoryIds.has(categoryId),
      "invalid_grant",
      `Grant references unknown category ${categoryId}`,
    );
  }
}
