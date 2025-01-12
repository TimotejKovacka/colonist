/*
	shorthash
	(c) 2013 Bibig
	
	https://github.com/bibig/node-shorthash
	shorthash may be freely distributed under the MIT license.
*/

// refer to: http://werxltd.com/wp/2010/05/13/javascript-implementation-of-javas-string-hashcode-method/
function bitwise(str: string) {
  let hash = 0;
  if (str.length === 0) return hash;
  for (let i = 0; i < str.length; i++) {
    const ch = str.charCodeAt(i);
    hash = (hash << 5) - hash + ch;
    hash = hash & hash; // Convert to 32bit integer
  }
  return hash;
}

function hashTable(num: number) {
  const t = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
  return t[num];
}

// convert 10 binary to customized binary, max is 62
function binaryTransfer(integer: number, binary = 62) {
  const stack: string[] = [];
  let num: number;
  const sign = integer < 0 ? "-" : "";
  let result = "";

  let accessor = Math.abs(integer);

  while (integer >= binary) {
    num = integer % binary;
    accessor = Math.floor(integer / binary);
    stack.push(hashTable(num));
  }

  if (integer > 0) {
    stack.push(hashTable(integer));
  }

  for (let i = stack.length - 1; i >= 0; i--) {
    result += stack[i];
  }

  return sign + result;
}

/**
 * why choose 61 binary, because we need the last element char to replace the minus sign
 * eg: -aGtzd will be ZaGtzd
 */
export function unique(text: string) {
  const id = binaryTransfer(bitwise(text), 61);
  return id.replace("-", "Z");
}
