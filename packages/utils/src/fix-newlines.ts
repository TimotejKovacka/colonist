export function fixNewlines(s: string): string {
  return s.replace(/\\n/g, "\n");
}
