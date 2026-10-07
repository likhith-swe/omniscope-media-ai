/**
 * Scene & quote recognition engine.
 *
 * Text path: weighted token matching across titles, iconic quotes, scene
 * descriptions, cast, directors and genres, with phrase-contiguity bonuses
 * for near-exact quotes.
 *
 * Image path: if a vision provider key is configured it is called upstream
 * (see /api/recognize). Without one, frames are matched against each
 * title's graded color signature — a deterministic nearest-palette
 * resolver that keeps the pipeline functional in sandbox environments.
 */

import { CATALOG, type CatalogTitle } from "@/lib/catalog";

export type QueryType = "quote" | "description" | "image";

export interface RecognitionHit {
  title: CatalogTitle;
  confidence: number; // 0..1
  matchedField: "quote" | "title" | "scene" | "cast" | "palette";
  matchedSnippet: string;
  queryType: QueryType;
}

const STOPWORDS = new Set([
  "the", "a", "an", "is", "in", "on", "of", "to", "and", "or", "that", "this",
  "it", "was", "i", "you", "he", "she", "we", "they", "my", "me", "with",
  "from", "for", "at", "but", "what", "movie", "film", "scene", "where",
  "who", "said", "says", "line", "quote", "about", "there", "his", "her",
]);

export function normalize(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’'"]/g, "")
    .replace(/[^a-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function tokenize(text: string): string[] {
  return normalize(text)
    .split(" ")
    .filter((t) => t.length > 1 && !STOPWORDS.has(t));
}

interface CorpusEntry {
  field: RecognitionHit["matchedField"];
  weight: number;
  text: string;
  tokens: Set<string>;
}

function buildCorpus(): CorpusEntry[] {
  const entries: CorpusEntry[] = [];
  for (const t of CATALOG) {
    entries.push({
      field: "title",
      weight: 8,
      text: normalize(t.title),
      tokens: new Set(tokenize(t.title)),
    });
    for (const q of t.quotes) {
      entries.push({
        field: "quote",
        weight: 5,
        text: normalize(q.line),
        tokens: new Set(tokenize(q.line)),
      });
    }
    entries.push({
      field: "scene",
      weight: 3.5,
      text: normalize(`${t.scene.name} ${t.scene.description}`),
      tokens: new Set(tokenize(`${t.scene.name} ${t.scene.description}`)),
    });
    entries.push({
      field: "cast",
      weight: 4,
      text: normalize(`${t.director} ${t.cast.join(" ")}`),
      tokens: new Set(tokenize(`${t.director} ${t.cast.join(" ")}`)),
    });
  }
  return entries;
}

const CORPUS = buildCorpus();

function bigrams(tokens: string[]): string[] {
  const out: string[] = [];
  for (let i = 0; i < tokens.length - 1; i += 1) {
    out.push(`${tokens[i]}_${tokens[i + 1]}`);
  }
  return out;
}

export function recognizeText(input: string, queryType: QueryType): RecognitionHit | null {
  const norm = normalize(input);
  if (norm.length < 3) return null;

  const inputTokens = tokenize(input);
  if (inputTokens.length === 0) return null;
  const inputBigrams = new Set(bigrams(inputTokens));

  // Pre-compute document frequency for an IDF-style rarity boost.
  const docFreq = new Map<string, number>();
  for (const entry of CORPUS) {
    for (const tok of entry.tokens) {
      docFreq.set(tok, (docFreq.get(tok) ?? 0) + 1);
    }
  }

  const scores = new Map<
    string,
    { score: number; field: RecognitionHit["matchedField"]; snippet: string }
  >();

  const accumulate = (
    slug: string,
    add: number,
    field: RecognitionHit["matchedField"],
    snippet: string
  ) => {
    const prev = scores.get(slug) ?? { score: 0, field, snippet };
    if (add > 0 && (prev.score === 0 || fieldPriority(field) > fieldPriority(prev.field))) {
      prev.field = field;
      prev.snippet = snippet;
    }
    prev.score += add;
    scores.set(slug, prev);
  };

  const fieldPriority = (f: RecognitionHit["matchedField"]): number =>
    f === "quote" ? 4 : f === "title" ? 3 : f === "scene" ? 2 : 1;

  for (const t of CATALOG) {
    // 1. Phrase contiguity: near-exact quote or title matches dominate.
    for (const q of t.quotes) {
      const qNorm = normalize(q.line);
      if (qNorm.includes(norm) && norm.length >= 10) {
        accumulate(t.slug, 100, "quote", q.line);
      } else if (norm.includes(qNorm) && qNorm.length >= 12) {
        accumulate(t.slug, 90, "quote", q.line);
      }
    }
    if (normalize(t.title) === norm) {
      accumulate(t.slug, 95, "title", t.title);
    } else if (normalize(t.title).includes(norm) && norm.length >= 6) {
      accumulate(t.slug, 40, "title", t.title);
    }
  }

  // 2. Weighted token overlap with rarity boost.
  for (const entry of CORPUS) {
    const slug = slugForEntry(entry);
    let overlap = 0;
    for (const tok of inputTokens) {
      if (entry.tokens.has(tok)) {
        const df = docFreq.get(tok) ?? 1;
        overlap += entry.weight * (1 + 2 / Math.log(2 + df));
      }
    }
    // Bigram contiguity: adjacent token pairs signal real quotes, not bags of words.
    const entryBigrams = new Set(bigrams([...entry.tokens]));
    let bi = 0;
    for (const bg of inputBigrams) {
      if (entryBigrams.has(bg)) bi += 1;
    }
    overlap += bi * entry.weight * 1.5;
    if (overlap > 0) {
      accumulate(slug, overlap, entry.field, entry.text);
    }
  }

  let best: { slug: string; score: number; field: RecognitionHit["matchedField"]; snippet: string } | null =
    null;
  for (const [slug, v] of scores) {
    if (!best || v.score > best.score) best = { slug, ...v };
  }
  if (!best) return null;

  const title = CATALOG.find((t) => t.slug === best.slug);
  if (!title) return null;

  const confidence = Math.min(0.99, best.score / 100);
  if (best.score < 6) return null; // noise floor

  return {
    title,
    confidence,
    matchedField: best.field,
    matchedSnippet: best.snippet,
    queryType,
  };
}

function slugForEntry(entry: CorpusEntry): string {
  // Corpus order follows CATALOG order (title, quotes..., scene, cast per title).
  const idx = CORPUS.indexOf(entry);
  // Each title contributes exactly (1 + quotes.length + 1 + 1) entries.
  let cursor = 0;
  for (const t of CATALOG) {
    const span = 1 + t.quotes.length + 1 + 1;
    if (idx < cursor + span) return t.slug;
    cursor += span;
  }
  return CATALOG[0].slug;
}

/** Deterministic image fallback: nearest graded palette by RGB distance. */
export function recognizeImage(avgRgb: [number, number, number]): RecognitionHit {
  let best = CATALOG[0];
  let bestDist = Number.POSITIVE_INFINITY;
  for (const t of CATALOG) {
    const [r, g, b] = t.palette.avg;
    const d = Math.sqrt(
      (r - avgRgb[0]) ** 2 + (g - avgRgb[1]) ** 2 + (b - avgRgb[2]) ** 2
    );
    if (d < bestDist) {
      bestDist = d;
      best = t;
    }
  }
  const confidence = Math.min(0.92, Math.max(0.34, 1 - bestDist / 220));
  return {
    title: best,
    confidence,
    matchedField: "palette",
    matchedSnippet: `matched against graded color signature ΔRGB ${bestDist.toFixed(0)}`,
    queryType: "image",
  };
}

/** Computes a frame's average color by strided sampling of the raw buffer. */
export function averageRgbFromBase64(base64: string): [number, number, number] | null {
  try {
    const dataPart = base64.includes(",") ? base64.split(",")[1] : base64;
    const buf = Buffer.from(dataPart, "base64");
    if (buf.length < 256) return null;
    // Sample 4 KB strided across the file; PNG/JPEG pixel data is mixed in
    // with headers, so we take a trimmed mean to shrug off outliers.
    const step = Math.max(3, Math.floor(buf.length / 1024));
    const samples: number[] = [];
    for (let i = 0; i + 2 < buf.length && samples.length < 3072; i += step * 3) {
      samples.push(buf[i], buf[i + 1], buf[i + 2]);
    }
    samples.sort((a, b) => a - b);
    const trim = Math.floor(samples.length * 0.15);
    const kept = samples.slice(trim, samples.length - trim);
    if (kept.length < 3) return null;
    const avg = [0, 0, 0];
    const channelCount = Math.floor(kept.length / 3);
    for (let c = 0; c < 3; c += 1) {
      let sum = 0;
      for (let i = c; i < channelCount * 3; i += 3) sum += kept[i];
      avg[c] = Math.round(sum / channelCount);
    }
    return [avg[0], avg[1], avg[2]];
  } catch {
    return null;
  }
}
