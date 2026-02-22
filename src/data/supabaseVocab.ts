import { supabase, isSupabaseConfigured } from "../supabaseClient";
import type { VocabWord } from "./vocabulary";
import { FALLBACK_DATA } from "./fallbackData";

// ─── Cache ────────────────────────────────────────────────────────────────────

const CACHE_KEY = "hanyu_supabase_vocab_cache_mv_v2"; // bumped version for HSK 3+4
const CACHE_TTL_MS = 14 * 24 * 60 * 60 * 1000; // 14 days

export interface CachedVocab {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  hsk3Count: number;
  hsk4Count: number;
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
    // Ensure new fields exist (handle old cache format)
    return {
      ...parsed,
      hsk3Count: parsed.hsk3Count ?? 0,
      hsk4Count: parsed.hsk4Count ?? 0,
    };
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
  word_type: string | null;
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

/** 
 * Get category from word_type if available, otherwise infer from English.
 * Normalizes word_type to title case for display.
 */
function getCategory(wordType: string | null, english: string, hskLevel: number): string {
  // If word_type is provided, use it (normalize to title case)
  if (wordType && wordType.trim()) {
    const type = wordType.trim().toLowerCase();
    // Normalize common word types
    const typeMap: Record<string, string> = {
      "noun": "Nouns",
      "verb": "Verbs",
      "adjective": "Adjectives",
      "adverb": "Adverbs",
      "pronoun": "Pronouns",
      "preposition": "Prepositions",
      "conjunction": "Conjunctions",
      "particle": "Particles",
      "interjection": "Interjections",
      "numeral": "Numbers",
      "measure word": "Measure Words",
      "measure": "Measure Words",
      "classifier": "Measure Words",
      "auxiliary": "Auxiliary",
      "modal": "Modal Verbs",
      "phrase": "Phrases",
      "expression": "Expressions",
      "idiom": "Idioms",
      "time word": "Time Words",
      "place word": "Place Words",
      "question word": "Question Words",
    };
    return typeMap[type] || wordType.charAt(0).toUpperCase() + wordType.slice(1).toLowerCase();
  }
  
  // Fallback: infer from English
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
  return `HSK ${hskLevel}`;
}

// ─── Fallback conversion ──────────────────────────────────────────────────────

export function buildFallbackVocabulary(): VocabWord[] {
  return FALLBACK_DATA.map((item, index) => {
    const hskLevel = (item.hsk_level >= 1 && item.hsk_level <= 4 ? item.hsk_level : 1) as 1 | 2 | 3 | 4;
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
      category: getCategory(null, item.english, hskLevel),
      examples,
    } satisfies VocabWord;
  });
}

// ─── Main fetch result ────────────────────────────────────────────────────────

export interface FetchResult {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  hsk3Count: number;
  hsk4Count: number;
  totalCount: number;
  source: "supabase" | "fallback";
}

const EMPTY_RESULT: FetchResult = {
  words: [],
  hsk1Count: 0,
  hsk2Count: 0,
  hsk3Count: 0,
  hsk4Count: 0,
  totalCount: 0,
  source: "fallback",
};

/**
 * Fetch vocabulary from the Supabase materialized view `hsk_words_with_examples`.
 *
 * Notes:
 * - This returns *one row per word* with examples aggregated as JSON.
 * - We still slice to at most 3 examples per word client-side.
 * - Results are cached in localStorage.
 * - Now fetches HSK levels 1, 2, 3, and 4.
 */
export async function fetchVocabularyFromSupabase(
  opts?: { bypassCache?: boolean }
): Promise<FetchResult> {
  // Access rules:
  // - Anonymous users: top 200 HSK 1 words
  // - Logged in (free): all HSK 1 words
  // - Purchased levels: include those levels
  // - Premium: include all levels
  //
  // This function does NOT know auth state (it uses anon key), so the caller should
  // fetch the full dataset and then filter by access. We keep the function returning
  // all levels available in Supabase (1-4) and let App.tsx filter before rendering.

  if (!isSupabaseConfigured() || !supabase) {
    return EMPTY_RESULT;
  }

  // If we have a fresh cache, return it immediately (unless bypassed).
  if (!opts?.bypassCache) {
    const cached = loadCachedSupabaseVocabulary();
    if (cached) {
      return {
        words: cached.words,
        hsk1Count: cached.hsk1Count,
        hsk2Count: cached.hsk2Count,
        hsk3Count: cached.hsk3Count,
        hsk4Count: cached.hsk4Count,
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
        .select("word_id, hanzi, pinyin, english, hsk_level, word_type, examples")
        .in("hsk_level", [1, 2, 3, 4])
        .order("hsk_level", { ascending: true })
        .order("word_id", { ascending: true })
        .range(from, to);

      if (error) {
        console.error("[supabaseVocab] view query error:", error.message);
        return EMPTY_RESULT;
      }

      const chunk = (data ?? []) as unknown as HskWordsWithExamplesRow[];
      rows.push(...chunk);
      if (chunk.length < PAGE_SIZE) break;
    }

    if (rows.length === 0) {
      console.warn("[supabaseVocab] view returned 0 rows — check grants/policies and that the materialized view is refreshed.");
      return EMPTY_RESULT;
    }

    const words: VocabWord[] = rows.map((row) => {
      const hskLevel = (row.hsk_level >= 1 && row.hsk_level <= 4 ? row.hsk_level : 1) as 1 | 2 | 3 | 4;
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
        category: getCategory(row.word_type, row.english, hskLevel),
        examples,
      } satisfies VocabWord;
    });

    const hsk1Count = rows.filter((r) => r.hsk_level === 1).length;
    const hsk2Count = rows.filter((r) => r.hsk_level === 2).length;
    const hsk3Count = rows.filter((r) => r.hsk_level === 3).length;
    const hsk4Count = rows.filter((r) => r.hsk_level === 4).length;

    saveCachedSupabaseVocabulary({
      words,
      hsk1Count,
      hsk2Count,
      hsk3Count,
      hsk4Count,
      totalCount: words.length,
      cachedAt: Date.now(),
    });

    return {
      words,
      hsk1Count,
      hsk2Count,
      hsk3Count,
      hsk4Count,
      totalCount: words.length,
      source: "supabase",
    };
  } catch (err) {
    console.error("[supabaseVocab] Unexpected error:", err);
    return EMPTY_RESULT;
  }
}
