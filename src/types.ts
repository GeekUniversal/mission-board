import type {
  Category,
  Document,
  Mission,
  MissionBoardPortableSnapshot02,
  Preferences,
  Session,
} from "./generated/board.js";
import type { MissionBoardAIUpdate02 } from "./generated/update.js";

export type Board = MissionBoardPortableSnapshot02;
export type Update = MissionBoardAIUpdate02;
export type UpdateOperation = Update["operations"][number];
export type { Category, Document, Mission, Preferences, Session };

export const SUPPORTED_OPERATIONS = [
  "create_category",
  "create_mission",
  "update_mission",
  "append_note",
  "put_document",
  "record_session",
] as const;

export type OperationName = (typeof SUPPORTED_OPERATIONS)[number];

export interface ContextGrant {
  context_id: string;
  workspace_id: string;
  base_revision: number;
  mission_ids: string[];
  category_ids: string[];
  operations: OperationName[];
  allow_root_categories: boolean;
}

export type EntityKind = "category" | "mission" | "document" | "session";

export interface DomainServices {
  now(): string;
  generateId(kind: EntityKind): string;
}

export interface ChangeDescription {
  operation_index: number;
  operation: OperationName;
  description: string;
}

export interface UpdatePreview {
  candidate: Board;
  changes: ChangeDescription[];
}
