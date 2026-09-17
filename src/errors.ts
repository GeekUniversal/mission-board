export type DomainErrorCode =
  | "invalid_board"
  | "invalid_update"
  | "invalid_grant"
  | "workspace_mismatch"
  | "unknown_context"
  | "stale_revision"
  | "operation_not_granted"
  | "scope_violation"
  | "duplicate_id"
  | "missing_reference"
  | "relationship_cycle"
  | "document_ownership"
  | "lifecycle_violation"
  | "unsafe_resource"
  | "instruction_escalation"
  | "invalid_service_value";

export class DomainError extends Error {
  readonly code: DomainErrorCode;

  constructor(code: DomainErrorCode, message: string) {
    super(message);
    this.name = "DomainError";
    this.code = code;
  }
}

export function requireDomain(
  condition: unknown,
  code: DomainErrorCode,
  message: string,
): asserts condition {
  if (!condition) {
    throw new DomainError(code, message);
  }
}
