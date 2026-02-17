import { supabase } from "../supabaseClient";
import type { VocabWord } from "./vocabulary";

// ─── Supabase row types ───────────────────────────────────────────────────────

interface HskWordRow {
  id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
}

interface ExampleRow {
  id: number;
  word_id: number;
  hanzi: string;
  pinyin: string | null;
  english: string;
}

// ─── Pinyin helpers ───────────────────────────────────────────────────────────

const PUNCT_RE = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/;

/**
 * Split a pinyin string (space-separated syllables like "nǐ hǎo") into one
 * syllable per character in `hanzi`.  Falls back to repeating the whole string
 * for single-character words, or leaving chars empty when no mapping is found.
 */
function buildPinyinWords(
  hanzi: string,
  pinyin: string | null
): { char: string; pinyin: string }[] {
  const chars = Array.from(hanzi);

  if (!pinyin) {
    return chars.map((char) => ({ char, pinyin: "" }));
  }

  // Split on whitespace — the DB stores syllables space-separated
  const syllables = pinyin.trim().split(/\s+/).filter(Boolean);

  return chars.map((char, i) => {
    if (PUNCT_RE.test(char)) return { char, pinyin: "" };
    return { char, pinyin: syllables[i] ?? syllables[0] ?? "" };
  });
}

/**
 * Limit an English definition string to at most `max` comma/semicolon-separated
 * meanings so cards don't overflow with giant definition lists.
 */
function limitEnglish(english: string, max = 3): string {
  // Split on ", " or "; " boundaries
  const parts = english
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join(", ");
}

/**
 * Infer a rough category from the HSK level and word position.
 * This is a lightweight heuristic — the Supabase table doesn't store categories,
 * so we assign them based on the pinyin/english rather than hardcoding offsets
 * that differ between HSK 2.0 and HSK 3.0.
 */
function inferCategory(english: string, hskLevel: number): string {
  const e = english.toLowerCase();
  if (/\b(i|you|he|she|we|they|me|him|her|us|them)\b/.test(e)) return "Pronouns";
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|zero|\d)\b/.test(e)) return "Numbers";
  if (/\b(father|mother|son|daughter|brother|sister|family|parent|child|husband|wife|grandpa|grandma|uncle|aunt)\b/.test(e)) return "Family";
  if (/\b(eat|drink|cook|buy|sell|give|take|bring|go|come|walk|run|sit|stand|sleep|wake|work|play|study|read|write|speak|listen|look|watch|learn|teach)\b/.test(e)) return "Verbs";
  if (/\b(big|small|good|bad|hot|cold|fast|slow|tall|short|long|happy|sad|angry|tired|busy|new|old|clean|dirty|beautiful|expensive|cheap|important|easy|difficult|simple|clear)\b/.test(e)) return "Adjectives";
  if (/\b(today|yesterday|tomorrow|now|morning|afternoon|evening|night|year|month|week|day|hour|minute|time|before|after|already|soon|always|often|sometimes|never|again)\b/.test(e)) return "Time";
  if (/\b(china|beijing|school|hospital|airport|station|hotel|restaurant|shop|store|bank|company|park|library|home|house|room|office)\b/.test(e)) return "Places";
  if (/\b(rice|noodle|bread|meat|fish|chicken|egg|vegetable|fruit|apple|water|tea|coffee|milk|beer)\b/.test(e)) return "Food & Drink";
  if (/\b(weather|rain|snow|wind|sun|cloud|cold|hot|warm|temperature)\b/.test(e)) return "Weather";
  if (/\b(doctor|hospital|medicine|sick|health|body|head|eye|ear|mouth|hand|foot|leg)\b/.test(e)) return "Health";
  if (/\b(airplane|train|bus|taxi|subway|car|bicycle|boat|ticket|passport)\b/.test(e)) return "Transport";
  if (/\b(red|blue|green|yellow|white|black|color|colour)\b/.test(e)) return "Colors";
  if (/\b(this|that|which|what|who|where|when|why|how|here|there)\b/.test(e)) return "Question Words";
  if (hskLevel === 1) return "HSK 1";
  return "HSK 2";
}

// ─── Main fetch function ──────────────────────────────────────────────────────

export interface FetchResult {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  source: "supabase" | "fallback";
}

/**
 * Fetch ALL HSK words + their example sentences from Supabase.
 *
 * Strategy:
 *  1. Fetch all rows from `hsk_words` (ordered by hsk_level, id).
 *  2. Fetch all rows from `example_sentences`.
 *  3. Join in-memory — avoids N+1 queries.
 *  4. Map to the VocabWord shape expected by all components.
 *
 * The function always resolves (never rejects).  On error it returns
 * `{ words: [], source: "fallback" }` so the caller can show the fallback.
 */
export async function fetchVocabularyFromSupabase(): Promise<FetchResult> {
  try {
    // ── 1. Fetch words ────────────────────────────────────────────────────────
    const { data: wordRows, error: wordError } = await supabase
      .from("hsk_words")
      .select("id, hanzi, pinyin, english, hsk_level")
      .order("hsk_level", { ascending: true })
      .order("id", { ascending: true });

    if (wordError) {
      console.error("[supabaseVocab] hsk_words fetch error:", wordError.message);
      return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
    }

    if (!wordRows || wordRows.length === 0) {
      console.warn("[supabaseVocab] hsk_words returned 0 rows — check RLS policies.");
      return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
    }

    // ── 2. Fetch all example sentences in one query ───────────────────────────
    const { data: exampleRows, error: exampleError } = await supabase
      .from("example_sentences")
      .select("id, word_id, hanzi, pinyin, english")
      .order("id", { ascending: true });

    if (exampleError) {
      console.warn("[supabaseVocab] example_sentences fetch error:", exampleError.message);
      // Continue without examples rather than failing completely
    }

    // ── 3. Group examples by word_id ──────────────────────────────────────────
    const examplesByWordId = new Map<number, ExampleRow[]>();
    for (const row of (exampleRows ?? []) as ExampleRow[]) {
      const existing = examplesByWordId.get(row.word_id) ?? [];
      existing.push(row);
      examplesByWordId.set(row.word_id, existing);
    }

    // ── 4. Map to VocabWord[] ─────────────────────────────────────────────────
    const hsk1Rows = (wordRows as HskWordRow[]).filter((r) => r.hsk_level === 1);
    const hsk2Rows = (wordRows as HskWordRow[]).filter((r) => r.hsk_level === 2);

    const words: VocabWord[] = (wordRows as HskWordRow[]).map((row) => {
      const rawExamples = examplesByWordId.get(row.id) ?? [];
      // Up to 3 examples per word
      const examples = rawExamples.slice(0, 3).map((ex) => ({
        chinese: ex.hanzi,
        // Build per-character pinyin from the sentence's pinyin field.
        // Tatoeba sentences may not have pinyin — in that case we leave it blank
        // (the HoverCharacter component handles empty strings gracefully).
        pinyinWords: buildPinyinWords(ex.hanzi, ex.pinyin),
        english: ex.english,
      }));

      const hskLevel = row.hsk_level === 1 ? 1 : 2;

      return {
        id: row.id,
        hanzi: row.hanzi,
        pinyin: row.pinyin,
        english: limitEnglish(row.english, 3),
        hskLevel,
        category: inferCategory(row.english, hskLevel),
        examples,
      } satisfies VocabWord;
    });

    console.log(
      `[supabaseVocab] Loaded ${words.length} words ` +
      `(HSK1: ${hsk1Rows.length}, HSK2: ${hsk2Rows.length}) ` +
      `with ${exampleRows?.length ?? 0} example sentences.`
    );

    return {
      words,
      hsk1Count: hsk1Rows.length,
      hsk2Count: hsk2Rows.length,
      totalCount: words.length,
      source: "supabase",
    };
  } catch (err) {
    console.error("[supabaseVocab] Unexpected error:", err);
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }
}
