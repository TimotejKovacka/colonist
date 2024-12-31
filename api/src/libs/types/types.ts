import {
  Kind,
  type Static,
  type TArray,
  type TObject,
  type TRecord,
  type TSchema,
  type TUnion,
} from "@sinclair/typebox";
import { Value } from "@sinclair/typebox/value";

export type ValueOf<T> = T[keyof T];

export type ResourceRequired<T> = {
  [K in keyof T]-?: T[K] extends boolean | number | string | undefined
    ? Exclude<T[K], undefined>
    : T[K] extends Array<infer U>
    ? Array<ResourceRequired<U>>
    : ResourceRequired<T[K]>;
};

export function valueOfRecordSchema<Schema extends TRecord<TSchema, TSchema>>(
  schema: Schema
): ValueOf<Schema["patternProperties"]> {
  return schema.patternProperties["^(.*)$"] as ValueOf<
    Schema["patternProperties"]
  >;
}
export function recordValueOfSchema<Schema extends TSchema>(
  schema: Schema
): ValueOf<Schema["patternProperties"]> | undefined {
  return schema["patternProperties"]?.["^(.*)$"] as ValueOf<
    Schema["patternProperties"] | undefined
  >;
}
/**
 * Populates value with default values from schema.
 *
 * Note: Works only the defaults are explicitly set in the schema
 * due to limitations in Type.Value.
 *
 * Workaround: We set the missing defaults explicitly in resourceSchema.
 */
export function setValueDefaults<Schema extends TObject>(
  schema: Schema,
  value: Static<Schema>
): ResourceRequired<Static<Schema>> {
  return Value.Default(schema, value) as ResourceRequired<Static<Schema>>;
}

export function setMaybeValueDefaults<
  Schema extends TObject,
  Value extends Static<Schema> | undefined
>(schema: Schema, value: Value): ResourceRequired<Static<Schema>> | undefined {
  if (value === undefined) {
    return undefined;
  }
  return setValueDefaults(schema, value);
}

/**
 * Populates value with default values from schema into a value clone.
 */
export function valueWithDefaults<Schema extends TObject>(
  schema: Schema,
  value: Static<Schema>
): ResourceRequired<Static<Schema>> {
  const clone = Value.Clone(value);
  return setValueDefaults(schema, clone) as ResourceRequired<Static<Schema>>;
}

export function schemaDefault<Schema extends TSchema>(
  schema: Schema
): Static<Schema> {
  if (schema.default !== undefined) {
    return schema.default as Static<Schema>;
  }
  if (schema["const"] !== undefined) {
    return schema["const"] as Static<Schema>;
  }
  switch (schema[Kind]) {
    case "Null":
      return null;
    case "Boolean":
      return false;
    case "Number":
      return 0;
    case "Integer":
      return 0;
    case "String":
      return "";
    case "Array":
      return [];
    case "Object": {
      const objectSchema = schema as unknown as TObject;
      const requiredKeys = new Set(objectSchema.required ?? []);
      return Object.fromEntries(
        Object.entries(objectSchema.properties)
          .filter(([key]) => requiredKeys.has(key))
          .map(([key, property]) => [key, schemaDefault(property)])
      );
    }
    case "Record":
      return {};
    case "Union":
      // requires the union options to be populated by setSchemaDefaults first
      return (schema["anyOf"] as TSchema[] | undefined)?.[0]
        ?.default as Static<Schema>;
    default:
      return undefined;
  }
}

/**
 * Fill missing `default` for TSchema recursively.
 */
export function setSchemaDefaults<Schema extends TSchema>(
  schema: Schema
): Schema {
  if (schema["type"] === "array") {
    setSchemaDefaults(schema["items"]);
  }
  if (schema["type"] === "object") {
    for (const [, property] of Object.entries(schema["properties"] ?? {})) {
      setSchemaDefaults(property as TSchema);
    }
    for (const [, property] of Object.entries(
      schema["patternProperties"] ?? {}
    )) {
      setSchemaDefaults(property as TSchema);
    }
  }
  if (Array.isArray(schema["anyOf"])) {
    for (const option of schema["anyOf"]) {
      setSchemaDefaults(option);
    }
  }
  schema.default = schemaDefault(schema);
  return schema;
}

/**
 * Deletes defaults in schema that are not meaningful:
 * * required object properties
 * * array items
 * * oneof items
 * * record values
 */
export function cleanupSchemaDefaults<Schema extends TSchema>(
  schema: Schema
): Schema {
  if (schema["type"] === "array") {
    const itemsSchema = (schema as unknown as TArray).items;
    cleanupSchemaDefaults(itemsSchema);
    itemsSchema.default = undefined;
  }
  if (schema["type"] === "object") {
    if (schema["properties"] !== undefined) {
      const requiredKeys = new Set(schema["required"] ?? []);
      const properties = (schema as unknown as TObject).properties ?? {};
      for (const key of Object.keys(properties)) {
        if (!requiredKeys.has(key)) {
          properties[key]!.default = undefined;
        }
        cleanupSchemaDefaults(properties[key]);
      }
    }
    for (const [, value] of Object.entries(schema["patternProperties"] ?? {})) {
      const valueSchema = value as TSchema;
      cleanupSchemaDefaults(valueSchema);
      valueSchema.default = undefined;
    }
  }
  if (Array.isArray(schema["anyOf"])) {
    for (const anyOf of schema["anyOf"]) {
      const anyOfSchema = anyOf as TSchema;
      cleanupSchemaDefaults(anyOfSchema);
      anyOfSchema.default = undefined;
    }
  }
  return schema;
}

/**
 * Clean value from optional default properties recursively.
 *
 * Requires the schema to be normalized with setSchemaDefaults.
 *
 * Default values can / shall be omitted during serialization.
 */
export function deleteOptionalValueDefaults<Schema extends TSchema>(
  schema: Schema,
  value: Static<Schema>
): Static<Schema> {
  if (schema === undefined || value === undefined) {
    return value;
  }
  if (schema["type"] === "array") {
    for (const item of value as []) {
      deleteOptionalValueDefaults((schema as unknown as TArray).items, item);
    }
  }
  if (schema["type"] === "object") {
    if (schema["properties"] !== undefined) {
      const objectSchema = schema as unknown as TObject;
      const objectValue = value as Static<typeof objectSchema>;
      const requiredKeys = new Set(schema["required"] ?? []);
      for (const key of Object.keys(objectValue)) {
        deleteOptionalValueDefaults(
          objectSchema.properties[key],
          objectValue[key]
        );
        if (
          !requiredKeys.has(key) &&
          Value.Equal(objectValue[key], objectSchema.properties[key]?.default)
        ) {
          delete objectValue[key];
        }
      }
    }
    const recordValueSchema = recordValueOfSchema(schema);
    if (recordValueSchema !== undefined) {
      for (const [, recordValue] of Object.entries(
        value as Record<string, unknown>
      )) {
        deleteOptionalValueDefaults(recordValueSchema, recordValue);
      }
    }
  }
  if (Array.isArray(schema["anyOf"])) {
    const unionSchema = schema as unknown as TUnion;
    for (const optionSchema of unionSchema.anyOf) {
      if (Value.Check(optionSchema, value)) {
        deleteOptionalValueDefaults(optionSchema, value);
      }
    }
  }
  return value;
}

/**
 * Cleans excess and optional defaults properties.
 */
export function minifyValue<Schema extends TSchema>(
  schema: Schema,
  value: Static<Schema>
): Static<Schema> {
  Value.Clean(schema, value);
  deleteOptionalValueDefaults(schema, value);
  return value;
}

/**
 * Returns a minified clone.
 */
export function minifiedValue<Schema extends TSchema>(
  schema: Schema,
  value: Static<Schema>
): Static<Schema> {
  const result = Value.Clone(value);
  return minifyValue(schema, result);
}
