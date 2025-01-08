export function mathRandomSecure(): number {
  const globalObj: Window | typeof globalThis =
    typeof window !== "undefined" ? window : globalThis;

  if (!("crypto" in globalObj) || !globalObj.crypto) {
    throw new Error("Crypto API is not available in this environment");
  }

  const cryptoObj: Crypto = globalObj.crypto;
  const arr = cryptoObj.getRandomValues(new Uint32Array(1));
  if (!arr[0]) {
    throw "Missing value";
  }
  return arr[0] / (0xffffffff + 1);
}
