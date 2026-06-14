export const SYLLABLE_TABLE: Record<string, string[]> = {
  // Zero-initial syllables use their conventional display forms (yi/wu/yu prefix)
  '': [
    'a', 'o', 'e', 'ai', 'ei', 'ao', 'ou', 'an', 'en', 'ang', 'eng', 'er',
    'yi', 'ya', 'yao', 'ye', 'you', 'yan', 'yin', 'yang', 'ying', 'yong',
    'wu', 'wa', 'wo', 'wai', 'wei', 'wan', 'wen', 'wang', 'weng',
    'yu', 'yue', 'yuan', 'yun',
  ],
  'b':  ['a','o','ai','ei','ao','an','en','ang','eng','i','ie','iao','ian','in','ing','u'],
  'p':  ['a','o','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','ian','in','ing','u'],
  'm':  ['a','o','e','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','iu','ian','in','ing','u'],
  'f':  ['a','o','ei','ou','an','en','ang','eng','u'],
  'd':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','ia','ie','iao','iu','ian','ing','u','uo','uan','un'],
  't':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','ian','ing','u','uo','uan','un'],
  'n':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','ie','iao','iu','ian','in','iang','ing','u','uo','uan','un','ü','üe'],
  'l':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','ia','ie','iao','iu','ian','in','iang','ing','iong','u','uo','uan','un','ü','üe'],
  'g':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','u','ua','uo','uai','ui','uan','un','uang','ong'],
  'k':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','u','ua','uo','uai','ui','uan','un','uang','ong'],
  'h':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','u','ua','uo','uai','ui','uan','un','uang','ong'],
  'j':  ['i','ia','iao','ie','iu','ian','in','iang','ing','iong','u','ue','uan','un'],
  'q':  ['i','ia','iao','ie','iu','ian','in','iang','ing','iong','u','ue','uan','un'],
  'x':  ['i','ia','iao','ie','iu','ian','in','iang','ing','iong','u','ue','uan','un'],
  'zh': ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','ua','uo','uai','ui','uan','un','uang','ong'],
  'ch': ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','uo','uai','ui','uan','un','uang','ong'],
  'sh': ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','ua','uo','uai','ui','uan','un','uang'],
  'r':  ['e','ao','ou','an','en','ang','eng','i','u','uo','ui','uan','un','ong'],
  'z':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','uo','ui','uan','un','ong'],
  'c':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','uo','ui','uan','un','ong'],
  's':  ['a','e','ai','ei','ao','ou','an','en','ang','eng','i','u','uo','ui','uan','un','ong'],
};

export const INITIALS = Object.keys(SYLLABLE_TABLE);

const TONE_MAP: Record<string, string[]> = {
  a: ['ā','á','ǎ','à'], e: ['ē','é','ě','è'],
  i: ['ī','í','ǐ','ì'], o: ['ō','ó','ǒ','ò'],
  u: ['ū','ú','ǔ','ù'], ü: ['ǖ','ǘ','ǚ','ǜ'],
};

export type Tone = 1 | 2 | 3 | 4 | 5;
export const TONES: Tone[] = [1, 2, 3, 4, 5];
export const TONE_DISPLAY = ['1', '2', '3', '4', '·'];

export function applyTone(base: string, tone: Tone): string {
  if (tone === 5) return base;
  for (const v of ['a', 'e']) {
    if (base.includes(v)) return base.replace(v, TONE_MAP[v][tone - 1]);
  }
  if (base.includes('ou')) return base.replace('o', TONE_MAP['o'][tone - 1]);
  for (let i = base.length - 1; i >= 0; i--) {
    const ch = base[i];
    if (TONE_MAP[ch]) return base.slice(0, i) + TONE_MAP[ch][tone - 1] + base.slice(i + 1);
  }
  return base;
}

export function buildSyllable(initial: string, final: string, tone: Tone): string {
  const base = initial === '' ? final : initial + final;
  return applyTone(base, tone);
}

export function randomSyllable(): { initial: string; final: string; tone: Tone } {
  const initial = INITIALS[Math.floor(Math.random() * INITIALS.length)];
  const finals = SYLLABLE_TABLE[initial];
  const final = finals[Math.floor(Math.random() * finals.length)];
  const tone = (Math.floor(Math.random() * 4) + 1) as Tone;
  return { initial, final, tone };
}
