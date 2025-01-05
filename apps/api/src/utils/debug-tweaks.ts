import { BooleanFlag, getEnvConfig } from "../env.js";

export const debugTweaks = getEnvConfig().DEBUG_TWEAKS === BooleanFlag.On;
