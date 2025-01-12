import React from "react";

import type { IoContextInterface } from "./types";

const IoContext = React.createContext<IoContextInterface<any>>({
  createConnection: () => undefined,
  getConnection: () => undefined,
  registerSharedListener: () => () => {},
});

export { IoContext };
