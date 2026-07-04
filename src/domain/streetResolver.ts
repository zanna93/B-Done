import { DEFAULT_ZONE, type StreetRecord, type ZoneId } from "./models";
import { levenshtein, normalizeStreetName } from "../utils/text";

export interface StreetMatch {
  street: string;
  zone: ZoneId;
  score: number;
  notes: string;
}

export interface StreetResolution {
  input: string;
  normalizedInput: string;
  zone: ZoneId;
  matchedStreet: string | null;
  confidence: "high" | "medium" | "fallback";
  suggestions: StreetMatch[];
}

const AUTO_MATCH_THRESHOLD = 0.72;

export function resolveStreet(input: string, streets: StreetRecord[]): StreetResolution {
  const normalizedInput = normalizeStreetName(input);
  const suggestions = suggestStreets(input, streets, 5);
  const best = suggestions[0];

  if (best && best.score >= AUTO_MATCH_THRESHOLD) {
    return {
      input,
      normalizedInput,
      zone: best.zone,
      matchedStreet: best.street,
      confidence: best.score > 0.9 ? "high" : "medium",
      suggestions,
    };
  }

  return {
    input,
    normalizedInput,
    zone: DEFAULT_ZONE,
    matchedStreet: null,
    confidence: "fallback",
    suggestions,
  };
}

export function suggestStreets(input: string, streets: StreetRecord[], limit = 5): StreetMatch[] {
  const normalizedInput = normalizeStreetName(input);
  if (normalizedInput.length === 0) return [];

  return streets
    .map((record) => ({
      street: record.street,
      zone: record.zone,
      notes: record.notes,
      score: scoreStreet(normalizedInput, normalizeStreetName(record.street)),
    }))
    .filter((match) => match.score > 0.25)
    .sort((a, b) => b.score - a.score || a.street.localeCompare(b.street))
    .slice(0, limit);
}

function scoreStreet(query: string, candidate: string): number {
  if (query === candidate) return 1;
  if (candidate.includes(query) || query.includes(candidate)) return 0.9;

  const queryTokens = query.split(" ").filter(Boolean);
  const candidateTokens = candidate.split(" ").filter(Boolean);
  const matchedTokens = queryTokens.filter((token) =>
    candidateTokens.some((candidateToken) => candidateToken.includes(token) || token.includes(candidateToken)),
  );
  const tokenScore = queryTokens.length > 0 ? matchedTokens.length / queryTokens.length : 0;

  const distance = levenshtein(query, candidate);
  const maxLength = Math.max(query.length, candidate.length, 1);
  const distanceScore = Math.max(0, 1 - distance / maxLength);

  return Math.max(tokenScore * 0.85, distanceScore);
}
