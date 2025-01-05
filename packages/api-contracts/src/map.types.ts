import { Type } from "@sinclair/typebox";
import {
  type ResourceId,
  resourceIdSchema,
  createResource,
  type ResourceBody,
  type ResourceDto,
  type ResourceIds,
  type ResourceObject,
  type ResourceRef,
} from "./lib/index.js";

export const mapType = "map" as const;
declare const mapIdSymbol: "mapId";
export type MapId = ResourceId & { [mapIdSymbol]: never };
export const mapIdSchema = resourceIdSchema<typeof mapType, MapId>(mapType, {
  description: "Map id",
});
export const mapIdSchemas = {
  mapId: mapIdSchema,
};

export const mapBodySchema = {
  name: Type.String({ minLength: 1 }),
  hexDimensions: Type.Object({
    width: Type.Number({ minimum: 1, default: 224 }),
    height: Type.Number({ minimum: 1, default: 256 }),
  }),
  hexTypes: Type.Object({
    wood: Type.Integer({ minimum: 0 }),
    brick: Type.Integer({ minimum: 0 }),
    wheat: Type.Integer({ minimum: 0 }),
    sheep: Type.Integer({ minimum: 0 }),
    stone: Type.Integer({ minimum: 0 }),
    desert: Type.Integer({ minimum: 0 }),
  }),
};

export const mapResource = createResource({
  type: mapType,
  description: "Map representation",
  ids: mapIdSchemas,
  createId: "mapId",
  idsOrder: ["mapId"],
  authRoles: {
    mapId: undefined,
  },
  body: mapBodySchema,
});
export type MapResource = typeof mapResource;
export type MapDto = ResourceDto<MapResource>;
export type MapIds = ResourceIds<MapResource>;
export type MapRef = ResourceRef<MapResource>;
export type MapBody = ResourceBody<MapResource>;
export type Map = ResourceObject<MapResource>;
