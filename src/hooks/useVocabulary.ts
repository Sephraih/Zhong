import { useCallback, useEffect, useState } from "react";
import { fetchVocabularyFromSupabase, type VocabWord } from "../data/vocabulary";

export function useVocabulary() {
  const [words, setWords] = useState<VocabWord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchVocabularyFromSupabase();
      setWords(data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to load vocabulary";
      setError(message);
      setWords([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return { words, isLoading, error, refresh };
}
