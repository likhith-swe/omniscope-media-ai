import type { Offer, Region } from "@/lib/catalog";

export interface RecognitionMatch {
  slug: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  director: string;
  overview: string;
  confidence: number;
  matchedField: "quote" | "title" | "scene" | "cast" | "palette";
  matchedSnippet: string;
  palette: { from: string; to: string; avg: [number, number, number] };
}

export interface RecognitionAvailability {
  offers: Record<Region, Offer[]>;
  source: "cache" | "live" | "catalog";
  fetchedAt: string;
  locked: boolean;
  availableIn: Region | null;
  region: Region;
}

export interface RecognitionQuota {
  remaining: number | null;
  limit: number;
  resetAt: string;
  isPro: boolean;
}

export interface RecognitionResponse {
  ok?: boolean;
  message?: string;
  error?: string;
  requiresPro?: boolean;
  queryType?: "quote" | "description" | "image";
  match?: RecognitionMatch;
  availability?: RecognitionAvailability;
  quota?: RecognitionQuota;
}
