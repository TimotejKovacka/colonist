import type { BaseResource, ResourceIds } from "./resource.types.js";

export type PathPattern = {
  regex: RegExp;
  paramNames: string[];
};

export const createResourcePathRegex = <TResource extends BaseResource>(
  resource: TResource,
  idsOrder: string[]
): PathPattern => {
  // Build the regex pattern parts and collect param names
  const paramNames: string[] = [];
  const patternParts = idsOrder.flatMap((idKey) => {
    paramNames.push(idKey);
    return [
      "/", // Escape forward slash
      idKey,
      "/",
      "([a-zA-Z0-9-_]+)", // Capture group for the ID value
    ];
  });

  // Add the resource type at the end
  patternParts.push("/", resource.type);

  // Join all parts and create the regex
  const pattern = `^${patternParts.join("")}$`;
  const regex = new RegExp(pattern);

  return {
    regex,
    paramNames,
  };
};

export const parseResourcePath = <TResource extends BaseResource>(
  pattern: PathPattern,
  path: string
): ResourceIds<TResource> | null => {
  const matches = pattern.regex.exec(path);

  if (!matches) {
    return null;
  }

  // First match is the full string, subsequent matches are capture groups
  const values = matches.slice(1);

  if (values.length !== pattern.paramNames.length) {
    return null;
  }

  // Create an object mapping param names to their values
  const result = pattern.paramNames.reduce<Record<string, string>>(
    (acc, paramName, index) => {
      const mappedId = values[index];
      if (!mappedId) {
        throw new Error(`Missing id for key:${paramName}`);
      }
      acc[paramName] = mappedId;
      return acc;
    },
    {}
  );

  return result as ResourceIds<TResource>;
};
