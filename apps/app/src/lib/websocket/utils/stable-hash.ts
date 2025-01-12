// The MIT License (MIT)

// Copyright (c) Shu Ding
// https://github.com/shuding/stable-hash

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

// Use WeakMap to store the object-key mapping so the objects can still be
// garbage collected. WeakMap uses a hashtable under the hood, so the lookup
// complexity is almost O(1).
const table = new WeakMap<object, string>();

// A counter of the key.
let counter = 0;

// A stable hash implementation that supports:
//  - Fast and ensures unique hash properties
//  - Handles unserializable values
//  - Handles object key ordering
//  - Generates short results
//
// This is not a serialization function, and the result is not guaranteed to be
// parsable.
export default function stableHash(arg: any): string {
  const type = typeof arg;
  const constructor = arg && arg.constructor;
  const isDate = constructor == Date;

  if (Object(arg) === arg && !isDate && constructor != RegExp) {
    // Object/function, not null/date/regexp. Use WeakMap to store the id first.
    // If it's already hashed, directly return the result.
    let result = table.get(arg);
    if (result) return result;
    // Store the hash first for circular reference detection before entering the
    // recursive `stableHash` calls.
    // For other objects like set and map, we use this id directly as the hash.
    result = ++counter + "~";
    table.set(arg, result);
    let index: any;

    if (constructor == Array) {
      // Array.
      result = "@";
      for (index = 0; index < arg.length; index++) {
        result += stableHash(arg[index]) + ",";
      }
      table.set(arg, result);
    } else if (constructor == Object) {
      // Object, sort keys.
      result = "#";
      const keys = Object.keys(arg).sort();
      while ((index = keys.pop() as string) !== undefined) {
        if (arg[index] !== undefined) {
          result += index + ":" + stableHash(arg[index]) + ",";
        }
      }
      table.set(arg, result);
    }
    return result;
  }
  if (isDate) return arg.toJSON();
  if (type == "symbol") return arg.toString();
  return type == "string" ? JSON.stringify(arg) : "" + arg;
}
