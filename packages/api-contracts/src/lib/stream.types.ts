import type { BaseResourceDto } from "./resource.types.js";

/**
 * Patch transforming one resource state to next resource state.
 *
 * Use jsonmergepatch.generate to create a patch.
 * Use jsonmergepatch.apply to apply the patch.
 */
export type ResourcePatch = {
  patch: unknown | null; // null for delete
  oldModifiedAtMs?: number | null; // undefined / null for newly created resource
};

export function isResourcePatch(obj: unknown): obj is ResourcePatch {
  return typeof obj === "object" && obj !== null && "patch" in obj;
}

export const isPatchOk = (
  data: BaseResourceDto | undefined,
  patch: ResourcePatch
): boolean => (patch.oldModifiedAtMs ?? -1) === (data?.modifiedAtMs ?? -1);

export const isPatchTooNew = (
  data: BaseResourceDto | undefined,
  patch: ResourcePatch
): boolean => (patch.oldModifiedAtMs ?? -1) > (data?.modifiedAtMs ?? -1);
