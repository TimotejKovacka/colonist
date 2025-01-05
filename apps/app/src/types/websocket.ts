export type WebSocketStatus =
  | "connecting"
  | "connected"
  | "disconnected"
  | "reconnecting";

export interface BaseMessage<T extends string = string, P = unknown> {
  type: T;
  payload: P;
}

// Message type definitions
export type PlayerJoinedMessage = BaseMessage<
  "player_joined",
  { playerId: string; name: string }
>;
export type PlayerLeftMessage = BaseMessage<
  "player_left",
  { playerId: string }
>;
export type GameStartedMessage = BaseMessage<
  "game_started",
  { gameId: string }
>;
// export type MoveMadeMessage = BaseMessage<
//   "move_made",
//   { playerId: string; position: Position }
// >;

// Union of all possible messages
export type WebSocketMessage =
  | { type: "ping"; payload: null }
  | { type: "pong"; payload: null }
  | PlayerJoinedMessage
  | PlayerLeftMessage
  | GameStartedMessage;
//   | MoveMadeMessage;

// Type helper for extracting payload type from message type
export type PayloadFromMessageType<T extends WebSocketMessage["type"]> =
  Extract<WebSocketMessage, { type: T }>["payload"];
