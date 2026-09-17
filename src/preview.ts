import { DomainError, requireDomain } from "./errors.js";
import type {
  Board,
  ChangeDescription,
  ContextGrant,
  DomainServices,
  Mission,
  Update,
  UpdatePreview,
} from "./types.js";
import { validateBoard, validateGrant, validateUpdate } from "./validation.js";

const systemServices: DomainServices = {
  now: () => new Date().toISOString(),
  generateId: (kind) => `${kind.slice(0, 3)}_${crypto.randomUUID()}`,
};

function appTime(services: DomainServices): string {
  const value = services.now();
  requireDomain(
    !Number.isNaN(Date.parse(value)),
    "invalid_service_value",
    `Clock returned an invalid date-time: ${value}`,
  );
  return value;
}

function missionMap(board: Board): Map<string, Mission> {
  return new Map(board.missions.map((mission) => [mission.id, mission]));
}

function touchMission(mission: Mission, now: string): void {
  mission.updated_at = now;
}

function describeFields(changes: Record<string, unknown>): string {
  const labels: Record<string, string> = {
    category_id: "category",
    next_action: "next action",
    current_state: "current state",
    completion_criteria: "completion criteria",
    related_mission_ids: "related missions",
    dependency_ids: "dependencies",
    stopping_condition: "stopping condition",
  };
  return Object.keys(changes)
    .map((field) => labels[field] ?? field.replaceAll("_", " "))
    .join(", ");
}

export function previewUpdate(
  board: Board,
  update: Update,
  grant: ContextGrant,
  services: DomainServices = systemServices,
): UpdatePreview {
  validateBoard(board);
  validateUpdate(update);
  validateGrant(grant, board);

  requireDomain(
    board.workspace_id === update.workspace_id && board.workspace_id === grant.workspace_id,
    "workspace_mismatch",
    "Board, update, and grant must belong to the same workspace",
  );
  requireDomain(
    update.context_id === grant.context_id,
    "unknown_context",
    `Update context ${update.context_id} does not match the stored grant`,
  );
  requireDomain(
    update.base_revision === board.revision && grant.base_revision === board.revision,
    "stale_revision",
    `Expected revision ${board.revision}; update/grant use ${update.base_revision}/${grant.base_revision}`,
  );

  const candidate = structuredClone(board);
  const allowedMissions = new Set(grant.mission_ids);
  const allowedCategories = new Set(grant.category_ids);
  const allowedOperations = new Set(grant.operations);
  const changes: ChangeDescription[] = [];
  const now = appTime(services);

  for (const [operationIndex, operation] of update.operations.entries()) {
    requireDomain(
      allowedOperations.has(operation.op),
      "operation_not_granted",
      `Operation ${operation.op} is not granted`,
    );

    if (operation.op === "create_category") {
      const item = structuredClone(operation.category);
      requireDomain(
        (item.parent_id === null && grant.allow_root_categories) ||
          (item.parent_id !== null && allowedCategories.has(item.parent_id)),
        "scope_violation",
        `Category ${item.id} is outside the granted category scope`,
      );
      requireDomain(
        item.instructions.length === 0 && Object.keys(item.preferences).length === 0,
        "instruction_escalation",
        "AI category creation cannot set instructions or preferences",
      );
      requireDomain(
        !candidate.categories.some((category) => category.id === item.id),
        "duplicate_id",
        `Category ${item.id} already exists`,
      );
      candidate.categories.push(item);
      allowedCategories.add(item.id);
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `Created category “${item.name}”.`,
      });
      continue;
    }

    if (operation.op === "create_mission") {
      const item = structuredClone(operation.mission);
      requireDomain(
        allowedCategories.has(item.category_id),
        "scope_violation",
        `Mission ${item.id} targets a category outside the grant`,
      );
      requireDomain(
        item.instructions.length === 0 && Object.keys(item.preferences).length === 0,
        "instruction_escalation",
        "AI mission creation cannot set instructions or preferences",
      );
      requireDomain(
        !candidate.missions.some((mission) => mission.id === item.id),
        "duplicate_id",
        `Mission ${item.id} already exists`,
      );
      item.created_at = now;
      item.updated_at = now;
      candidate.missions.push(item);
      allowedMissions.add(item.id);
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `Created mission “${item.title}”.`,
      });
      continue;
    }

    const missions = missionMap(candidate);
    const missionId =
      operation.op === "put_document"
        ? operation.document.mission_id
        : operation.op === "record_session"
          ? operation.session.mission_id
          : operation.mission_id;
    const mission = missions.get(missionId);
    requireDomain(
      mission && allowedMissions.has(missionId),
      "scope_violation",
      `Mission ${missionId} is outside the granted scope`,
    );

    if (operation.op === "update_mission") {
      if (operation.changes.category_id !== undefined) {
        requireDomain(
          operation.changes.category_id === mission.category_id ||
            allowedCategories.has(operation.changes.category_id),
          "scope_violation",
          `Mission ${missionId} cannot move outside the granted categories`,
        );
      }
      Object.assign(mission, structuredClone(operation.changes));
      touchMission(mission, now);
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `Updated ${describeFields(operation.changes)} for mission “${mission.title}”.`,
      });
    } else if (operation.op === "append_note") {
      mission.notes_markdown = mission.notes_markdown
        ? `${mission.notes_markdown}\n\n${operation.markdown}`
        : operation.markdown;
      touchMission(mission, now);
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `Appended an inline note to mission “${mission.title}”.`,
      });
    } else if (operation.op === "put_document") {
      const item = structuredClone(operation.document);
      const existingIndex = candidate.documents.findIndex((document) => document.id === item.id);
      const existing = candidate.documents[existingIndex];
      requireDomain(
        !existing || existing.mission_id === item.mission_id,
        "document_ownership",
        `Document ${item.id} cannot change owning mission`,
      );
      if (existingIndex >= 0) candidate.documents[existingIndex] = item;
      else candidate.documents.push(item);
      if (!mission.document_ids.includes(item.id)) mission.document_ids.push(item.id);
      touchMission(mission, now);
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `${existing ? "Updated" : "Created"} internal document “${item.title}” for mission “${mission.title}”.`,
      });
    } else if (operation.op === "record_session") {
      const item = structuredClone(operation.session);
      requireDomain(
        !candidate.sessions.some((session) => session.id === item.id),
        "duplicate_id",
        `Session ${item.id} already exists`,
      );
      candidate.sessions.push(item);
      touchMission(mission, now);
      if (item.occurred_at !== null) mission.last_activity_at = item.occurred_at;
      changes.push({
        operation_index: operationIndex,
        operation: operation.op,
        description: `Recorded work session “${item.summary}” for mission “${mission.title}”.`,
      });
    }
  }

  candidate.revision += 1;
  validateBoard(candidate);
  return { candidate, changes };
}

export function isDomainError(error: unknown): error is DomainError {
  return error instanceof DomainError;
}
