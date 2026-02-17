// Thin re-export kept for backward compatibility.
// The app now loads vocabulary from Supabase via src/data/supabaseVocab.ts
// This file is no longer the primary data source.
export { getEnrichedVocabulary, type VocabWord } from "./vocabulary";
