/* Generated from schemas/board.schema.json. Do not edit directly. */

export type WorkspaceId = string;
export type CategoryId = string;
export type MissionId = string;
export type DocumentId = string;
export type SessionId = string;

export interface MissionBoardPortableSnapshot02 {
  format_version: "0.2";
  workspace_id: WorkspaceId;
  revision: number;
  name: string;
  inbox_category_id: CategoryId;
  instructions: string;
  preferences: Preferences;
  /**
   * @minItems 1
   */
  categories: [Category, ...Category[]];
  missions: Mission[];
  documents: Document[];
  sessions: Session[];
}
export interface Preferences {
  conversation?: "minimal" | "concise" | "standard" | "detailed" | "deep";
  explanation?: "minimal" | "concise" | "standard" | "detailed" | "deep";
  progress?: "minimal" | "concise" | "standard" | "detailed" | "deep";
  step_size?: "one_action" | "small_batch" | "full_workflow";
  notes_depth?: "bullets" | "summary" | "standard" | "deep" | "exhaustive";
  notes_placement?: "inline" | "document" | "external" | "auto";
}
export interface Category {
  id: CategoryId;
  parent_id: CategoryId | null;
  name: string;
  instructions: string;
  preferences: Preferences;
  archived: boolean;
}
export interface Mission {
  id: MissionId;
  category_id: CategoryId;
  title: string;
  status: "idea" | "ready" | "active" | "waiting" | "experiment" | "maintenance" | "completed";
  kind: "mission" | "experiment" | "maintenance";
  purpose: string;
  current_state: string;
  next_action: string;
  resume: {
    last_result: string;
    known_working: string;
    failed_attempts: string[];
    decisions: string[];
  };
  completion_criteria: string[];
  blockers: Blocker[];
  notes_markdown: string;
  document_ids: DocumentId[];
  resources: Resource[];
  related_mission_ids: MissionId[];
  dependency_ids: MissionId[];
  tags: string[];
  instructions: string;
  preferences: Preferences;
  availability: Availability;
  evidence: Evidence[];
  question: string | null;
  stopping_condition: string | null;
  completion: Completion | null;
  created_at: string;
  updated_at: string;
  last_activity_at: string | null;
  archived: boolean;
}
export interface Blocker {
  reason: string;
  kind:
    "dependency" | "delivery" | "money" | "hardware" | "access" | "person" | "upstream" | "decision" | "time" | "other";
  resolved: boolean;
}
export interface Resource {
  label: string;
  type: "document" | "file" | "repository" | "issue" | "commit" | "url";
  locator: string;
  checked: boolean;
}
export interface Availability {
  estimated_minutes?: number | null;
  energy?: "low" | "medium" | "high" | "unknown";
  internet?: "required" | "not_required" | "unknown";
  purchase?: "required" | "not_required" | "unknown";
  required_devices?: string[];
  physical_access?: "required" | "not_required" | "unknown";
  downtime?: "required" | "not_required" | "unknown";
  remote_capable?: "yes" | "no" | "unknown";
}
export interface Evidence {
  claim: string;
  provenance: Provenance;
}
export interface Provenance {
  source_type:
    "user_reported" | "observed_result" | "repository_evidence" | "assistant_inference" | "integration_event";
  source_ref: string | null;
  observed_at: string | null;
  freshness: "current" | "historical" | "unknown";
}
export interface Completion {
  summary: string;
  occurred_at: string | null;
  time_known: boolean;
  provenance: Provenance;
}
export interface Document {
  id: DocumentId;
  mission_id: MissionId;
  title: string;
  type: "note" | "procedure" | "troubleshooting" | "reference" | "decision";
  markdown: string;
  provenance: Provenance;
}
export interface Session {
  id: SessionId;
  mission_id: MissionId;
  occurred_at: string | null;
  summary: string;
  result: string;
  next_action: string;
  provenance: Provenance;
}
