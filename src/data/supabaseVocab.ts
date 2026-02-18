import { supabase, isSupabaseConfigured } from "../supabaseClient";
import type { VocabWord } from "./vocabulary";
import { FALLBACK_DATA } from "./fallbackData";

// ─── Materialized View Row Type ───────────────────────────────────────────────
// Matches your `hsk_words_with_examples` materialized view

interface HskWordWithExamplesRow {
  word_id: number;
  hanzi: string;
  pinyin: string;
  english: string;
  hsk_level: number;
  examples: {
    id: number;
    hanzi: string;
    pinyin: string | null;
    english: string;
  }[];
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
 */
function buildPinyinWords(
  hanzi: string,
  pinyin: string | null,
): { char: string; pinyin: string }[] {
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

/**
 * Limit an English definition to at most `max` comma/semicolon-separated meanings.
 */
function limitEnglish(english: string, max = 3): string {
  const parts = english
    .split(/[,;]/)
    .map((s) => s.trim())
    .filter(Boolean);
  return parts.slice(0, max).join(", ");
}

/**
 * Infer a rough display category from the English definition + HSK level.
 */
function inferCategory(english: string, hskLevel: number): string {
  const e = english.toLowerCase();
  if (/\bdet\.\s*:/.test(e)) return "Numbers";
  if (/\bm\.\[/.test(e)) return "Measure Words";
  if (/\bparticle\b/.test(e)) return "Particles";
  if (/\b(i|you|he|she|we|they|me|him|her|us|them|myself|yourself|oneself)\b/.test(e)) return "Pronouns";
  if (/\b(one|two|three|four|five|six|seven|eight|nine|ten|hundred|thousand|zero|\d)\b/.test(e)) return "Numbers";
  if (/\b(father|mother|son|daughter|brother|sister|family|parent|child|husband|wife|grandpa|grandma)\b/.test(e)) return "Family";
  if (/\b(eat|drink|cook|buy|sell|give|take|bring|go|come|walk|run|sit|stand|sleep|wake|work|play|study|read|write|speak|listen|look|watch|learn|teach|help|want|need|use|open|close|start|finish|make|put|move|carry|return|arrive|leave|meet|tell|ask|answer|call|wait|try|hope|prepare|practice|choose|allow|invite|welcome|worry|feel|think|know|understand|remember|forget|believe|swim|climb|dance|sing|travel|exercise|jump|fly|drive|ride|pay|send|receive|collect|change|grow|build|fix|clean|wash|wear|dress|visit|check|rest|continue|stop|begin|end|happen|become|seem|appear|need|cost|spend|save)\b/.test(e)) return "Verbs";
  if (/\b(big|small|good|bad|hot|cold|fast|slow|tall|short|long|happy|sad|angry|tired|busy|new|old|clean|beautiful|expensive|cheap|important|easy|difficult|simple|clear|comfortable|healthy|smart|clever|famous|special|same|different|correct|wrong|safe|dangerous|quiet|loud|heavy|light|strong|weak|full|empty|near|far|left|right|front|back|up|down|high|low|early|late|young|dark|bright|round|flat|soft|hard|sweet|bitter|sour|spicy|delicious|fresh|convenient|satisfied|ordinary|strange|serious|careful|patient)\b/.test(e)) return "Adjectives";
  if (/\b(today|yesterday|tomorrow|now|morning|afternoon|evening|night|year|month|week|day|hour|minute|time|before|after|already|soon|always|often|sometimes|never|again|early|late|then|ago|during|while|until|since|recently|immediately|finally|suddenly|usually|generally|perhaps|maybe|together|apart|quickly|slowly|carefully|especially|actually|certainly|already|still|also|just|only|even|almost|quite|very|too|so|here|there|everywhere|nowhere|somewhere|anywhere)\b/.test(e)) return "Time & Adverbs";
  if (/\b(china|beijing|school|hospital|airport|station|hotel|restaurant|shop|store|bank|company|park|library|home|house|room|office|city|country|place|road|street|bridge|building|floor|garden|market|pharmacy)\b/.test(e)) return "Places";
  if (/\b(rice|noodle|bread|meat|fish|chicken|beef|pork|egg|vegetable|fruit|apple|orange|water|tea|coffee|milk|beer|juice|soup|cake|bun|dumpling)\b/.test(e)) return "Food & Drink";
  if (/\b(weather|rain|snow|wind|sun|cloud|cold|hot|warm|temperature|season|spring|summer|autumn|winter)\b/.test(e)) return "Weather & Nature";
  if (/\b(doctor|hospital|medicine|sick|health|body|head|eye|ear|mouth|nose|hand|foot|leg|arm|back|heart|pain|fever)\b/.test(e)) return "Health & Body";
  if (/\b(airplane|train|bus|taxi|subway|car|bicycle|boat|ship|ticket|passport|luggage|travel|trip)\b/.test(e)) return "Transport & Travel";
  if (/\b(red|blue|green|yellow|white|black|grey|pink|purple|orange|brown|color|colour)\b/.test(e)) return "Colors";
  if (/\b(money|price|pay|cost|yuan|dollar|cheap|expensive|discount|change|receipt)\b/.test(e)) return "Shopping";
  if (/\b(phone|computer|internet|television|radio|newspaper|book|movie|music|song|game|camera|photo)\b/.test(e)) return "Technology & Media";
  if (/\b(sport|exercise|swim|run|ball|game|hobby|basketball|football|tennis|dance|sing)\b/.test(e)) return "Sports & Hobbies";
  if (/\b(class|lesson|exam|test|homework|grade|score|teacher|student|school|university|study|learn|practice|review|textbook)\b/.test(e)) return "Education";
  if (/\b(happy|sad|angry|worried|excited|surprised|scared|nervous|tired|bored|interested|satisfied|disappointed|lonely|confident|proud|grateful|sorry|love|hate|miss|like|dislike)\b/.test(e)) return "Emotions";
  if (hskLevel === 1) return "HSK 1";
  return "HSK 2";
}

// ─── Convert fallback JSON format to VocabWord ────────────────────────────────

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

// ─── Cache keys & helpers ─────────────────────────────────────────────────────

const CACHE_KEY = "hanyu_vocab_cache_v2";
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

interface CachedData {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  cachedAt: number;
}

function readCache(): CachedData | null {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    
    const parsed = JSON.parse(raw) as CachedData;
    if (!parsed?.words?.length) return null;
    
    // Check TTL
    if (Date.now() - (parsed.cachedAt ?? 0) > CACHE_TTL_MS) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }
    
    return parsed;
  } catch {
    return null;
  }
}

function writeCache(data: CachedData): void {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(data));
  } catch {
    // Storage full or disabled — ignore
  }
}

// ─── Main fetch result type ───────────────────────────────────────────────────

export interface FetchResult {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  source: "supabase" | "cache" | "fallback";
}

/**
 * Fetch vocabulary from Supabase using the materialized view `hsk_words_with_examples`.
 * 
 * This is much faster than querying the two tables separately because:
 * 1. The data is pre-joined and cached on the database side
 * 2. Only a single query is needed
 * 3. Examples are already aggregated as JSON arrays
 * 
 * Also implements client-side caching (localStorage, 7-day TTL).
 */
export async function fetchVocabularyFromSupabase(): Promise<FetchResult> {
  // ── 0) Check if Supabase is configured ────────────────────────────────────
  if (!isSupabaseConfigured() || !supabase) {
    console.log("[supabaseVocab] Supabase not configured — using fallback data");
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }

  // ── 1) Check client-side cache first ──────────────────────────────────────
  const cached = readCache();
  if (cached) {
    console.log(`[supabaseVocab] Using cached vocabulary (${cached.words.length} words)`);
    return {
      words: cached.words,
      hsk1Count: cached.hsk1Count,
      hsk2Count: cached.hsk2Count,
      totalCount: cached.totalCount,
      source: "cache",
    };
  }

  // ── 2) Fetch from materialized view ───────────────────────────────────────
  try {
    console.log("[supabaseVocab] Fetching from hsk_words_with_examples view...");
    const startTime = Date.now();

    // Paginate to handle large datasets (PostgREST default limit is 1000)
    const PAGE_SIZE = 1000;
    const allRows: HskWordWithExamplesRow[] = [];

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
        console.error("[supabaseVocab] View query error:", error.message);
        return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
      }

      const chunk = (data ?? []) as HskWordWithExamplesRow[];
      allRows.push(...chunk);

      // If we got fewer rows than PAGE_SIZE, we've reached the end
      if (chunk.length < PAGE_SIZE) break;
    }

    const fetchTime = Date.now() - startTime;

    if (allRows.length === 0) {
      console.warn("[supabaseVocab] View returned 0 rows — check RLS policies or data");
      return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
    }

    // ── 3) Transform rows to VocabWord format ─────────────────────────────────
    const words: VocabWord[] = allRows.map((row) => {
      const hskLevel = row.hsk_level === 1 ? 1 : 2;
      
      // Examples come pre-aggregated from the view as JSON array
      const rawExamples = Array.isArray(row.examples) ? row.examples : [];
      const examples = rawExamples.slice(0, 3).map((ex) => ({
        chinese: ex.hanzi,
        pinyinWords: buildPinyinWords(ex.hanzi, ex.pinyin),
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

    const hsk1Count = allRows.filter((r) => r.hsk_level === 1).length;
    const hsk2Count = allRows.filter((r) => r.hsk_level === 2).length;

    // ── 4) Write to cache ─────────────────────────────────────────────────────
    const cacheData: CachedData = {
      words,
      hsk1Count,
      hsk2Count,
      totalCount: words.length,
      cachedAt: Date.now(),
    };
    writeCache(cacheData);

    console.log(
      `[supabaseVocab] Loaded ${words.length} words (HSK1: ${hsk1Count}, HSK2: ${hsk2Count}) in ${fetchTime}ms`
    );

    return {
      words,
      hsk1Count,
      hsk2Count,
      totalCount: words.length,
      source: "supabase",
    };
  } catch (err) {
    console.error("[supabaseVocab] Unexpected error:", err);
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }
}

/**
 * Clear the client-side vocabulary cache.
 * Useful when you want to force a fresh fetch from Supabase.
 */
export function clearVocabularyCache(): void {
  try {
    localStorage.removeItem(CACHE_KEY);
    console.log("[supabaseVocab] Cache cleared");
  } catch {
    // ignore
  }
}
