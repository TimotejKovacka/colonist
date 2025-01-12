export interface PathSegment {
  key: string;
  value: string;
}

/**
 * Validates a key-value pair for path segment
 */
function isValidSegment(
  key: string | undefined,
  value: string | undefined
): key is string {
  return (
    typeof key === "string" &&
    typeof value === "string" &&
    key.length > 0 &&
    value.length > 0
  );
}

/**
 * Parse a path into segments with strong type guarantees
 */
export function parsePath(path: string): PathSegment[] {
  if (!path) {
    return [];
  }

  const cleanPath = path.startsWith("/") ? path.slice(1) : path;
  const parts = cleanPath.split("/").filter(Boolean); // Remove empty strings
  const segments: PathSegment[] = [];

  // Process pairs of segments
  for (let i = 0; i < parts.length - 1; i += 2) {
    const key = parts[i];
    const value = parts[i + 1];

    if (isValidSegment(key, value) && value !== undefined) {
      segments.push({ key, value });
    }
  }

  // Handle the type segment if it exists
  const remainingPart = parts[parts.length - 1];
  if (typeof remainingPart === "string" && remainingPart.length > 0) {
    segments.push({ key: "type", value: remainingPart });
  }

  return segments;
}

/**
 * Type guard to ensure two segments can be compared
 */
function areComparableSegments(
  pattern: PathSegment | undefined,
  target: PathSegment | undefined
): pattern is PathSegment & { key: string } {
  return Boolean(
    pattern &&
      target &&
      typeof pattern.key === "string" &&
      typeof pattern.value === "string" &&
      typeof target.key === "string" &&
      typeof target.value === "string"
  );
}

/**
 * Check if a path segment matches a pattern segment with type safety
 */
function segmentMatches(pattern: PathSegment, target: PathSegment): boolean {
  if (!areComparableSegments(pattern, target)) {
    return false;
  }

  return (
    pattern.key === target.key &&
    (pattern.value.startsWith(":") || pattern.value === target.value)
  );
}

/**
 * Validate segments arrays before comparison
 */
function areValidSegmentArrays(
  patternSegments: PathSegment[],
  targetSegments: PathSegment[]
): patternSegments is PathSegment[] & { length: number } {
  return (
    Array.isArray(patternSegments) &&
    Array.isArray(targetSegments) &&
    patternSegments.length === targetSegments.length &&
    patternSegments.length > 0 &&
    patternSegments.every(
      (seg): seg is PathSegment =>
        typeof seg?.key === "string" && typeof seg?.value === "string"
    ) &&
    targetSegments.every(
      (seg): seg is PathSegment =>
        typeof seg?.key === "string" && typeof seg?.value === "string"
    )
  );
}

/**
 * Extract parameters from a concrete path based on a pattern with complete type safety
 */
export function extractParams(
  pattern: string,
  target: string
): Record<string, string> | null {
  const patternSegments = parsePath(pattern);
  const targetSegments = parsePath(target);

  if (!areValidSegmentArrays(patternSegments, targetSegments)) {
    return null;
  }

  const params: Record<string, string> = {};

  for (let i = 0; i < patternSegments.length; i++) {
    const patternSeg = patternSegments[i];
    const targetSeg = targetSegments[i];

    // We know these exist because of areValidSegmentArrays check
    if (!patternSeg || !targetSeg || !segmentMatches(patternSeg, targetSeg)) {
      return null;
    }

    if (patternSeg.value.startsWith(":")) {
      // Safe to slice because we validated value is a string and starts with ":"
      const paramName = patternSeg.value.slice(1);
      params[paramName] = targetSeg.value;
    }
  }

  return params;
}

/**
 * Match a target path against a set of patterns
 *
 * Example usage:
 *
 * const patterns = [
 *   "/userId/:userId/sessionId/:sessionId/gameState",
 *   "/userId/:userId/profile"
 * ];
 *```
 * const result = matchPath(patterns, "/userId/123/sessionId/ABC/gameState");
 * // Result: {
 * //   path: "/userId/:userId/sessionId/:sessionId/gameState",
 * //   params: { userId: "123", sessionId: "ABC" }
 * // }
 * ```
 */
export function matchPath(
  patterns: string[],
  target: string
): { path: string; params: Record<string, string> } | null {
  if (!Array.isArray(patterns) || typeof target !== "string") {
    return null;
  }

  for (const pattern of patterns) {
    if (typeof pattern !== "string") {
      continue;
    }

    const params = extractParams(pattern, target);
    if (params !== null) {
      return { path: pattern, params };
    }
  }

  return null;
}
