import { DomainError } from "./errors.js";
import type { Board, Preferences } from "./types.js";
import { validateBoard } from "./validation.js";

export const PRODUCT_DEFAULTS = {
  conversation: "standard",
  explanation: "standard",
  progress: "concise",
  step_size: "one_action",
  notes_depth: "standard",
  notes_placement: "auto",
} as const satisfies Required<Preferences>;

export type PreferenceKey = keyof typeof PRODUCT_DEFAULTS;
export type ResolvedPreferenceValues = Required<Preferences>;
export type PreferenceOrigin =
  | { kind: "product" }
  | { kind: "workspace"; id: string }
  | { kind: "category"; id: string }
  | { kind: "mission"; id: string };

export interface ResolvedPreferences {
  values: ResolvedPreferenceValues;
  origins: Record<PreferenceKey, PreferenceOrigin>;
}

export function resolvePreferences(board: Board, missionId: string): ResolvedPreferences {
  validateBoard(board);
  const categories = new Map(board.categories.map((category) => [category.id, category]));
  const mission = board.missions.find((item) => item.id === missionId);
  if (!mission) {
    throw new DomainError("missing_reference", `Unknown mission ${missionId}`);
  }

  const lineage = [];
  let category = categories.get(mission.category_id);
  while (category) {
    lineage.push(category);
    category = category.parent_id ? categories.get(category.parent_id) : undefined;
  }
  lineage.reverse();

  const values: ResolvedPreferenceValues = { ...PRODUCT_DEFAULTS };
  const origins = Object.fromEntries(
    Object.keys(PRODUCT_DEFAULTS).map((key) => [key, { kind: "product" }]),
  ) as Record<PreferenceKey, PreferenceOrigin>;

  const apply = (preferences: Preferences, origin: PreferenceOrigin): void => {
    for (const key of Object.keys(preferences) as PreferenceKey[]) {
      const value = preferences[key];
      if (value !== undefined) {
        (values as Record<PreferenceKey, Preferences[PreferenceKey]>)[key] = value;
        origins[key] = origin;
      }
    }
  };

  apply(board.preferences, { kind: "workspace", id: board.workspace_id });
  for (const ancestor of lineage) {
    apply(ancestor.preferences, { kind: "category", id: ancestor.id });
  }
  apply(mission.preferences, { kind: "mission", id: mission.id });
  return { values, origins };
}
