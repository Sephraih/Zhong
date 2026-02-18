import { supabase, isSupabaseConfigured } from "../supabaseClient";
import type { VocabWord } from "./vocabulary";
import { FALLBACK_DATA } from "./fallbackData";

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_KEY = "hanyu_supabase_vocab_cache_mv_v1";
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CachedVocab {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  cachedAt: number;
}

export function loadCachedSupabaseVocabulary(): CachedVocab | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedVocab;
    if (!parsed?.words?.length) return null;
    if (!parsed.cachedAt) return null;
    if (Date.now() - parsed.cachedAt > CACHE_TTL_MS) return null;
    return parsed;
  } catch {
    return null;
  }
}

function saveCachedSupabaseVocabulary(payload: CachedVocab) {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(payload));
  } catch {
    // ignore
  }
}

// ─── Supabase row types (materialized view) ───────────────────────────────────

interface HskWordsWithExamplesRow {
  word_id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
  // materialized view returns json aggregated array
  examples: Array<{
    id: number;
    hanzi: string;
    pinyin: string | null;
    english: string;
  }>;
}

// ─── Pinyin helpers ───────────────────────────────────────────────────────────

/** Characters that should never receive a pinyin label */
const PUNCT_RE = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/;

/** Pinyin tokens from the DB that represent punctuation (skip when aligning) */
function isPinyinPunct(token: string): boolean {
  return /^[。，！？、；：""''（）《》…—.!?,;:'"()\-]+$/.test(token);
}

/**
 * Build per-character { char, pinyin } pairs from a sentence.
 *
 * DB pinyin is space-separated and may include punctuation tokens
 * (e.g. "chuān shàng ." for "穿上.").
 */
function buildPinyinWords(hanzi: string, pinyin: string | null): { char: string; pinyin: string }[] {
  const chars = Array.from(hanzi);

  if (pinyin && pinyin.trim()) {
    const syllables = pinyin
      .trim()
      .split(/\s+/)
      .filter((t) => t.length > 0 && !isPinyinPunct(t));

    let si = 0;
    return chars.map((char) => {
      if (PUNCT_RE.test(char)) return { char, pinyin: "" };
      return { char, pinyin: syllables[si++] ?? "" };
    });
  }

  return chars.map((char) => ({ char, pinyin: "" }));
}

function limitEnglish(english: string, max = 3): string {
  const parts = english
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join(", ");
}

function inferCategory(english: string, hskLevel: number): string {
  const e = english.toLowerCase();
  if (/\bdet\.\s*:/.test(e)) return "Numbers";
  if (/\bm\.\[/.test(e)) return "Measure Words";
  if (/\bparticle\b/.test(e)) return "Particles";
  if (/\b(i|you|he|she|we|they|me|him|her|us|them|myself|yourself|oneself)\b/.test(e)) return "Pronouns";
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|zero|\d)\b/.test(e)) return "Numbers";
  if (/\b(father|mother|son|daughter|brother|sister|family|parent|child|husband|wife|grandpa|grandma|sibling|uncle|aunt|cousin|nephew|niece)\b/.test(e)) return "Family";
  if (/\b(eat|drink|cook|buy|sell|give|take|bring|go|come|walk|run|sit|stand|sleep|wake|work|play|study|read|write|speak|listen|look|watch|learn|teach|help|want|need|use|open|close|start|finish)\b/.test(e)) return "Verbs";
  if (/\b(big|small|good|bad|hot|cold|fast|slow|tall|short|long|happy|sad|angry|tired|busy|new|old|clean|beautiful|expensive|cheap)\b/.test(e)) return "Adjectives";
  if (/\b(today|yesterday|tomorrow|now|morning|afternoon|evening|night|year|month|week|day|hour|minute|time|before|after|already|soon|always|often|sometimes|never)\b/.test(e)) return "Time & Adverbs";
  if (hskLevel === 1) return "HSK 1";
  return "HSK 2";
}

// ─── Fallback conversion ──────────────────────────────────────────────────────

export function buildFallbackVocabulary(): VocabWord[] {
  return FALLBACK_DATA.map((item, index) => {
    const hskLevel = item.hsk_level === 1 ? 1 : 2;
    const examples = item.examples.slice(0, 3).map((ex) => ({
      chinese: ex.chinese,
      pinyinWords: buildPinyinWords(ex.chinese, ex.pinyin),
      english: ex.english,
    }));

    return {
      id: index + 1,
      hanzi: item.hanzi,
      pinyin: item.pinyin,
      english: limitEnglish(item.english, 3),
      hskLevel,
      category: inferCategory(item.english, hskLevel),
      examples,
    } satisfies VocabWord;
  });
}

// ─── Main fetch result ────────────────────────────────────────────────────────

export interface FetchResult {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  source: "supabase" | "fallback";
}

/**
 * Fetch vocabulary from the Supabase materialized view `hsk_words_with_examples`.
 *
 * Notes:
 * - This returns *one row per word* with examples aggregated as JSON.
 * - We still slice to at most 3 examples per word client-side.
 * - Results are cached in localStorage.
 */
export async function fetchVocabularyFromSupabase(
  opts?: { bypassCache?: boolean }
): Promise<FetchResult> {
  if (!isSupabaseConfigured() || !supabase) {
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }

  // If we have a fresh cache, return it immediately (unless bypassed).
  if (!opts?.bypassCache) {
    const cached = loadCachedSupabaseVocabulary();
    if (cached) {
      return {
        words: cached.words,
        hsk1Count: cached.hsk1Count,
        hsk2Count: cached.hsk2Count,
        totalCount: cached.totalCount,
        source: "supabase",
      };
    }
  }

  const PAGE_SIZE = 1000;
  const rows: HskWordsWithExamplesRow[] = [];

  try {
    for (let from = 0; ; from += PAGE_SIZE) {
      const to = from + PAGE_SIZE - 1;

      const { data, error } = await supabase
        .from("hsk_words_with_examples")
        .select("word_id, hanzi, pinyin, english, hsk_level, examples")
        .in("hsk_level", [1, 2])
        .order("hsk_level", { ascending: true })
        .order("word_id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("[supabaseVocab] view query error:", error.message);
        return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
      }

      const chunk = (data ?? []) as unknown as HskWordsWithExamplesRow[];
      rows.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
    }

    if (rows.length === 0) {
      console.warn("[supabaseVocab] view returned 0 rows — check grants/policies and that the materialized view is refreshed.");
      return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
    }

    const words: VocabWord[] = rows.map((row) => {
      const hskLevel = row.hsk_level === 1 ? 1 : 2;
      const rawExamples = Array.isArray(row.examples) ? row.examples : [];
      const examples = rawExamples.slice(0, 3).map((ex) => ({
        chinese: ex.hanzi,
        pinyinWords: buildPinyinWords(ex.hanzi, ex.pinyin ?? null),
        english: ex.english,
      }));

      return {
        id: row.word_id,
        hanzi: row.hanzi,
        pinyin: row.pinyin,
        english: limitEnglish(row.english, 3),
        hskLevel,
        category: inferCategory(row.english, hskLevel),
        examples,
      } satisfies VocabWord;
    });

    const hsk1Count = rows.filter((r) => r.hsk_level === 1).length;
    const hsk2Count = rows.filter((r) => r.hsk_level === 2).length;

    saveCachedSupabaseVocabulary({
      words,
      hsk1Count,
      hsk2Count,
      totalCount: words.length,
      cachedAt: Date.now(),
    });

    return { words, hsk1Count, hsk2Count, totalCount: words.length, source: "supabase" };
  } catch (err) {
    console.error("[supabaseVocab] Unexpected error:", err);
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }
}
