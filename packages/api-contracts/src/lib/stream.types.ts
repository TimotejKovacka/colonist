/**
 * Patch transforming one resource state to next resource state.
 *
 * Use jsonmergepatch.apply to apply the patch.
 */
export type ResourcePatch = {
  patch: unknown; // null / undefined for delete
  oldModifiedAtMs: number | undefined; // undefined for newly created resource
  actionsAtMs?: Record<string, number>;
};

export function isResourcePatch(obj: unknown): obj is ResourcePatch {
  return typeof obj === "object" && obj !== null && "patch" in obj;
}
