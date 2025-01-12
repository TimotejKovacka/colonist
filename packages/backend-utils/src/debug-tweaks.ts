// biome-ignore lint/complexity/useLiteralKeys: accessing env variable
export const debugTweaks = process.env["DEBUG_TWEAKS"] === "1";
