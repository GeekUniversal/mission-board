import { DomainError } from "./errors.js";
import type { DomainServices, Mission } from "./types.js";

export interface NewMissionInput {
  title: string;
  category_id: string;
}

function validatedNow(services: DomainServices): string {
  const value = services.now();
  if (Number.isNaN(Date.parse(value))) {
    throw new DomainError("invalid_service_value", `Clock returned an invalid date-time: ${value}`);
  }
  return value;
}

export function createMission(input: NewMissionInput, services: DomainServices): Mission {
  const title = input.title.trim();
  if (!title) {
    throw new DomainError("lifecycle_violation", "A mission title cannot be blank");
  }
  const id = services.generateId("mission");
  if (!/^mis_[A-Za-z0-9_-]{1,80}$/u.test(id)) {
    throw new DomainError("invalid_service_value", `ID service returned invalid mission ID: ${id}`);
  }
  const now = validatedNow(services);
  return {
    id,
    category_id: input.category_id,
    title,
    status: "idea",
    kind: "mission",
    purpose: "",
    current_state: "",
    next_action: "",
    resume: { last_result: "", known_working: "", failed_attempts: [], decisions: [] },
    completion_criteria: [],
    blockers: [],
    notes_markdown: "",
    document_ids: [],
    resources: [],
    related_mission_ids: [],
    dependency_ids: [],
    tags: [],
    instructions: "",
    preferences: {},
    availability: {},
    evidence: [],
    question: null,
    stopping_condition: null,
    completion: null,
    created_at: now,
    updated_at: now,
    last_activity_at: null,
    archived: false,
  };
}
