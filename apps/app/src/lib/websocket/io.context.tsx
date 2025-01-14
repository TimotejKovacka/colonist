import React from "react";

import type { IoContextInterface } from "./types";

const IoContext = React.createContext<IoContextInterface | null>(null);

export { IoContext };
