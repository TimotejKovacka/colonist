import {
  adjectives,
  animals,
  colors,
  uniqueNamesGenerator,
} from "unique-names-generator";

export function createSessionPlayer() {
  return {
    id: crypto.randomUUID(),
    name: uniqueNamesGenerator({
      dictionaries: [adjectives, colors, animals],
      separator: "",
      style: "capital",
      length: 3,
    }),
  };
}
