import { mathRandomSecure } from "./math-random-secure";

export function getRandomString(
  length: number,
  charSet = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789"
) {
  let randomString = "";
  for (let i = 0; i < length; i++) {
    randomString += charSet.charAt(
      Math.floor(mathRandomSecure() * charSet.length)
    );
  }
  return randomString;
}
