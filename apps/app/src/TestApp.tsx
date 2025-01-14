import { useContext, useState } from "react";
import { useSocketEmit, useSocketEvent } from "./lib/websocket/use-socket";
import { IoContext } from "./lib/websocket/io.context";

export const TestApp = () => {
  const context = useContext(IoContext);
  const [flag, setFlag] = useState(false);
  return (
    <>
      <h1>TestApp isConnected:{String(context?.isConnected || false)}</h1>
      <button type="button" onClick={() => context?.connect()}>
        Connect
      </button>
      <button onClick={() => setFlag(true)}>Mount</button>
      <button onClick={() => setFlag(false)}>Un-Mount</button>
      {flag && <InnerComponent name="A" />}
      {/* <InnerComponent name="B" /> */}
    </>
  );
};

const InnerComponent = ({ name }: { name: string }) => {
  const { isConnected } = useSocketEvent(
    "/sessionId/123/session",
    "connected",
    () => console.log("connected")
  );
  const { emit } = useSocketEmit("/sessionId/123/session");

  return (
    <button
      type="button"
      onClick={() => emit("patch", { a: 123 }, { hello: "world" })}
    >
      Emit {name}
    </button>
  );
};
