export function mathRandomSecure(): number {
  const globalObj = typeof window !== "undefined" ? window : globalThis;
  const cryptoObj = globalObj.crypto;
  const arr = cryptoObj.getRandomValues(new Uint32Array(1));
  return arr[0] / (0xffffffff + 1);
}
