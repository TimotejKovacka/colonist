import type { BaseResource } from "@colonist/api-contracts";
import type { ResourceMessage, WebSocketMessage } from "./ws-resource-route.js";
import { isObject } from "@colonist/utils";
import createHttpError from "http-errors";

export function isResourceMessage<TResource extends BaseResource>(
  message: WebSocketMessage
): asserts message is WebSocketMessage<ResourceMessage<TResource>> {
  const { payload } = message;
  if (
    isObject(payload) &&
    "target" in payload &&
    typeof payload.target === "string" &&
    "dto" in payload &&
    isObject(payload.data)
  ) {
    // now we know it should be BaseResource but here
  }
}

export function assertSubscriptionMessage(
  message: WebSocketMessage
): asserts message is WebSocketMessage<{ target: string }> {
  const { payload } = message;
  if (
    !(
      isObject(payload) &&
      "target" in payload &&
      typeof payload.target === "string"
    )
  ) {
    throw createHttpError.BadRequest("Message is not a subcription message");
  }
}
