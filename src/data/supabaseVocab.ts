import { supabase, isSupabaseConfigured } from "../supabaseClient";
import type { VocabWord } from "./vocabulary";
import { FALLBACK_DATA } from "./fallbackData";

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

/** Characters that should never receive a pinyin label */
const PUNCT_RE = /^[。，！？、；：""''（）《》…—\s.!?,;:'"()\-]$/;

/** Pinyin tokens from the DB that represent punctuation (skip when aligning) */
function isPinyinPunct(token: string): boolean {
  return /^[。，！？、；：""''（）《》…—.!?,;:'"()\-]+$/.test(token);
}

/**
 * Build per-character { char, pinyin } pairs from a sentence.
 *
 * The DB stores pinyin as space-separated tokens that may include punctuation
 * tokens (e.g. "chuān shàng ." or "tā qǐ chuáng 。").
 *
 * Algorithm:
 *  1. Split stored pinyin on whitespace.
 *  2. Filter out punctuation tokens → clean syllable list.
 *  3. Walk the hanzi characters:
 *     – punctuation chars → pinyin: ""
 *     – non-punct chars   → next syllable from the clean list
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

  // No pinyin — return chars with empty pinyin
  return chars.map((char) => ({ char, pinyin: "" }));
}

/**
 * Limit an English definition to at most `max` comma/semicolon-separated
 * meanings so cards don't overflow.
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
  if (/\b(father|mother|son|daughter|brother|sister|family|parent|child|husband|wife|grandpa|grandma|sibling|uncle|aunt|cousin|nephew|niece)\b/.test(e)) return "Family";
  if (/\b(eat|drink|cook|buy|sell|give|take|bring|go|come|walk|run|sit|stand|sleep|wake|work|play|study|read|write|speak|listen|look|watch|learn|teach|help|want|need|use|open|close|start|finish|make|put|move|carry|return|arrive|leave|meet|tell|ask|answer|call|wait|try|hope|prepare|practice|choose|allow|invite|welcome|worry|feel|think|know|understand|remember|forget|believe|swim|climb|dance|sing|travel|exercise|jump|fly|drive|ride|pay|send|receive|collect|change|grow|build|fix|clean|wash|wear|dress|visit|check|rest|continue|stop|begin|end|happen|become|seem|appear|need|cost|spend|save)\b/.test(e)) return "Verbs";
  if (/\b(big|small|good|bad|hot|cold|fast|slow|tall|short|long|happy|sad|angry|tired|busy|new|old|clean|beautiful|expensive|cheap|important|easy|difficult|simple|clear|comfortable|healthy|smart|clever|famous|special|same|different|correct|wrong|safe|dangerous|quiet|loud|heavy|light|strong|weak|full|empty|near|far|left|right|front|back|up|down|high|low|early|late|young|dark|bright|round|flat|soft|hard|sweet|bitter|sour|spicy|delicious|fresh|convenient|satisfied|ordinary|strange|serious|careful|patient)\b/.test(e)) return "Adjectives";
  if (/\b(today|yesterday|tomorrow|now|morning|afternoon|evening|night|year|month|week|day|hour|minute|time|before|after|already|soon|always|often|sometimes|never|again|early|late|then|ago|during|while|until|since|recently|immediately|finally|suddenly|usually|generally|perhaps|maybe|together|apart|quickly|slowly|carefully|especially|actually|certainly|already|still|also|just|only|even|almost|quite|very|too|so|here|there|everywhere|nowhere|somewhere|anywhere)\b/.test(e)) return "Time & Adverbs";
  if (/\b(china|beijing|shanghai|school|hospital|airport|station|hotel|restaurant|shop|store|bank|company|park|library|home|house|room|office|city|country|place|road|street|bridge|building|floor|garden|farm|market|pharmacy|post office|embassy|museum|theater|stadium|swimming pool|gym|factory|village|town|mountain|river|lake|sea|beach|island|forest|desert)\b/.test(e)) return "Places";
  if (/\b(rice|noodle|bread|meat|fish|chicken|beef|pork|egg|vegetable|fruit|apple|orange|banana|grape|watermelon|pear|strawberry|water|tea|coffee|milk|beer|juice|soup|cake|bun|dumpling|tofu|salt|sugar|oil|sauce)\b/.test(e)) return "Food & Drink";
  if (/\b(weather|rain|snow|wind|sun|cloud|cold|hot|warm|temperature|fog|thunder|lightning|storm|season|spring|summer|autumn|winter)\b/.test(e)) return "Weather & Nature";
  if (/\b(doctor|hospital|medicine|sick|health|body|head|eye|ear|mouth|nose|hand|foot|leg|arm|back|heart|pain|fever|cold|cough|tired|rest)\b/.test(e)) return "Health & Body";
  if (/\b(airplane|train|bus|taxi|subway|car|bicycle|boat|ship|ticket|passport|luggage|travel|trip|journey|station|airport)\b/.test(e)) return "Transport & Travel";
  if (/\b(red|blue|green|yellow|white|black|grey|pink|purple|orange|brown|color|colour)\b/.test(e)) return "Colors";
  if (/\b(money|price|pay|cost|yuan|dollar|cheap|expensive|discount|change|receipt)\b/.test(e)) return "Shopping";
  if (/\b(phone|computer|internet|television|radio|newspaper|book|movie|music|song|game|app|camera|photo)\b/.test(e)) return "Technology & Media";
  if (/\b(sport|exercise|swim|run|ball|game|hobby|basketball|football|tennis|badminton|table tennis|chess|dance|sing)\b/.test(e)) return "Sports & Hobbies";
  if (/\b(class|lesson|exam|test|homework|grade|score|teacher|student|school|university|college|major|subject|study|learn|practice|review|textbook|dictionary)\b/.test(e)) return "Education";
  if (/\b(happy|sad|angry|worried|excited|surprised|scared|nervous|tired|bored|interested|satisfied|disappointed|lonely|confident|proud|grateful|sorry|love|hate|miss|like|dislike)\b/.test(e)) return "Emotions";
  if (hskLevel === 1) return "HSK 1";
  return "HSK 2";
}

// ─── Convert fallback JSON format to VocabWord ────────────────────────────────

/**
 * Converts the FALLBACK_DATA (which mirrors the Supabase export JSON format)
 * into the VocabWord[] shape used by all components.
 */
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

// ─── Main fetch result type ───────────────────────────────────────────────────

export interface FetchResult {
  words: VocabWord[];
  hsk1Count: number;
  hsk2Count: number;
  totalCount: number;
  source: "supabase" | "fallback";
}

/**
 * Fetch ALL HSK words + their example sentences from Supabase in two queries,
 * join in-memory, then map to the VocabWord shape used by all components.
 *
 * Always resolves — on any error returns source: "fallback" with empty words[]
 * so the caller can display the local fallback vocabulary instead.
 */
export async function fetchVocabularyFromSupabase(): Promise<FetchResult> {
  // If Supabase is not configured (missing env vars), return fallback immediately
  if (!isSupabaseConfigured() || !supabase) {
    console.log("[supabaseVocab] Supabase not configured — using fallback data");
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }

  try {
    // ── 1. Fetch all HSK words ────────────────────────────────────────────────
    const { data: wordRows, error: wordError } = await supabase
      .from("hsk_words")
      .select("id, hanzi, pinyin, english, hsk_level")
      .order("hsk_level", { ascending: true })
      .order("id",        { ascending: true });

    if (wordError) {
      console.error("[supabaseVocab] hsk_words error:", wordError.message);
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
      console.warn("[supabaseVocab] example_sentences error:", exampleError.message);
      // Continue without examples — better than failing entirely
    }

    // ── 3. Group examples by word_id ──────────────────────────────────────────
    const examplesByWordId = new Map<number, ExampleRow[]>();
    for (const row of (exampleRows ?? []) as ExampleRow[]) {
      const bucket = examplesByWordId.get(row.word_id) ?? [];
      bucket.push(row);
      examplesByWordId.set(row.word_id, bucket);
    }

    // ── 4. Map rows → VocabWord ───────────────────────────────────────────────
    const words: VocabWord[] = (wordRows as HskWordRow[]).map((row) => {
      const rawExamples = examplesByWordId.get(row.id) ?? [];

      const examples = rawExamples.slice(0, 3).map((ex) => ({
        chinese: ex.hanzi,
        pinyinWords: buildPinyinWords(ex.hanzi, ex.pinyin),
        english: ex.english,
      }));

      const hskLevel = row.hsk_level === 1 ? 1 : 2;

      return {
        id:       row.id,
        hanzi:    row.hanzi,
        pinyin:   row.pinyin,
        english:  limitEnglish(row.english, 3),
        hskLevel,
        category: inferCategory(row.english, hskLevel),
        examples,
      } satisfies VocabWord;
    });

    const hsk1Count = (wordRows as HskWordRow[]).filter((r) => r.hsk_level === 1).length;
    const hsk2Count = (wordRows as HskWordRow[]).filter((r) => r.hsk_level === 2).length;

    console.log(
      `[supabaseVocab] Loaded ${words.length} words ` +
      `(HSK1: ${hsk1Count}, HSK2: ${hsk2Count}) ` +
      `with ${exampleRows?.length ?? 0} example sentences.`
    );

    return { words, hsk1Count, hsk2Count, totalCount: words.length, source: "supabase" };

  } catch (err) {
    console.error("[supabaseVocab] Unexpected error:", err);
    return { words: [], hsk1Count: 0, hsk2Count: 0, totalCount: 0, source: "fallback" };
  }
}
