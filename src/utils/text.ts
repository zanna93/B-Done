const STREET_PREFIXES = [
  "via",
  "viale",
  "piazza",
  "piazzale",
  "corso",
  "contrada",
  "vicolo",
  "strada",
  "largo",
  "localita",
  "località",
];

export function normalizeText(value: string): string {
  return value
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase()
    .replace(/['.]/g, " ")
    .replace(/[^\p{Letter}\p{Number}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function normalizeStreetName(value: string): string {
  const words = normalizeText(value).split(" ").filter(Boolean);
  const withoutPrefix = words.filter((word, index) => index > 0 || !STREET_PREFIXES.includes(word));
  return withoutPrefix.join(" ");
}

export function titleCase(value: string): string {
  return normalizeText(value)
    .split(" ")
    .filter(Boolean)
    .map((word) => `${word.slice(0, 1).toUpperCase()}${word.slice(1)}`)
    .join(" ");
}

export function levenshtein(a: string, b: string): number {
  if (a === b) return 0;
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const previous = Array.from({ length: b.length + 1 }, (_, index) => index);
  const current = Array.from({ length: b.length + 1 }, () => 0);

  for (let i = 1; i <= a.length; i += 1) {
    current[0] = i;
    for (let j = 1; j <= b.length; j += 1) {
      const substitutionCost = a[i - 1] === b[j - 1] ? 0 : 1;
      current[j] = Math.min(current[j - 1] + 1, previous[j] + 1, previous[j - 1] + substitutionCost);
    }
    previous.splice(0, previous.length, ...current);
  }

  return previous[b.length] ?? 0;
}
