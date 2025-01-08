import equal from "fast-deep-equal";

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

function arrayEquals(before: unknown[], after: unknown[]) {
  if (before.length !== after.length) {
    return false;
  }

  for (let i = 0; i < before.length; i++) {
    // eslint-disable-next-line @typescript-eslint/strict-boolean-expressions
    if (!equal(after[i], before[i])) {
      return false;
    }
  }

  return true;
}

export function generatePatch(before: unknown, after: unknown) {
  before = serialize(before);
  after = serialize(after);

  // patch replacing array with object or vice versa
  if (
    !isObject(before) ||
    !isObject(after) ||
    Array.isArray(before) !== Array.isArray(after)
  ) {
    return after;
  }

  // patch replacing array with a new array
  if (Array.isArray(before) && Array.isArray(after)) {
    if (!arrayEquals(before, after)) {
      return after as unknown[];
    }
    return undefined;
  }

  // we are patching two objects
  const patch: Record<string, unknown> = {};
  const beforeKeys = Object.keys(before).filter(
    (key) => before[key] !== undefined
  );
  const afterKeys = Object.keys(after).filter(
    (key) => after[key] !== undefined
  );

  // new keys
  for (const key of afterKeys) {
    if (!beforeKeys.includes(key)) {
      patch[key] = serialize(after[key]);
    }
  }

  for (const key of beforeKeys) {
    // removed keys
    if (!afterKeys.includes(key)) {
      patch[key] = null;
      continue;
    }

    // modified keys
    if (isObject(before[key])) {
      const subPatch = generatePatch(before[key], after[key]);

      if (subPatch !== undefined) {
        patch[key] = subPatch;
      }
    } else if (before[key] !== after[key]) {
      patch[key] = serialize(after[key]);
    }
  }

  return Object.keys(patch).length > 0 ? patch : undefined;
}
