import { isObject } from "../is-object.js";
import { serialize } from "./utils.js";

// The MIT License (MIT)

// Copyright (c) 2015 Pierre Inglebert
// https://github.com/pierreinglebert/json-merge-patch

// Permission is hereby granted, free of charge, to any person obtaining a copy
// of this software and associated documentation files (the "Software"), to deal
// in the Software without restriction, including without limitation the rights
// to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
// copies of the Software, and to permit persons to whom the Software is
// furnished to do so, subject to the following conditions:

// The above copyright notice and this permission notice shall be included in all
// copies or substantial portions of the Software.

// THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
// IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
// FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
// AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
// LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
// OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
// SOFTWARE.

export function applyPatch<T>(target: unknown, patch: unknown): T {
  patch = serialize(patch);
  if (!isObject(patch) || Array.isArray(patch)) {
    return patch as T;
  }

  target = serialize(target);
  if (!isObject(target) || Array.isArray(target)) {
    target = {};
  }

  const targetCast = target as Record<string, unknown>;

  for (const key of Object.keys(patch)) {
    if (key === "__proto__" || key === "constructor" || key === "prototype") {
      return target as T;
    }

    if (patch[key] === null) {
      // eslint-disable-next-line no-prototype-builtins
      if (targetCast.hasOwnProperty(key)) {
        delete targetCast[key];
      }
    } else {
      targetCast[key] = applyPatch(targetCast[key], patch[key]);
    }
  }

  return targetCast as T;
}
