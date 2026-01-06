/**
 * String manipulation helpers (without using prototype methods)
 */

export function toLowerCase(str: string): string {
  let result = '';
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    if (char >= 65 && char <= 90) {
      result += String.fromCharCode(char + 32);
    } else {
      result += str[i];
    }
  }
  return result;
}

export function includesString(str: string, search: string): boolean {
  const searchLen = search.length;
  const strLen = str.length;
  if (searchLen > strLen) return false;
  for (let i = 0; i <= strLen - searchLen; i++) {
    let match = true;
    for (let j = 0; j < searchLen; j++) {
      if (str[i + j] !== search[j]) {
        match = false;
        break;
      }
    }
    if (match) return true;
  }
  return false;
}

export function joinStrings(strings: string[], separator: string): string {
  if (strings.length === 0) return '';
  let result = strings[0];
  for (let i = 1; i < strings.length; i++) {
    result += separator + strings[i];
  }
  return result;
}
