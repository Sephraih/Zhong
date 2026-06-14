import { useState, useEffect } from "react";
import type { VocabWord } from "../data/vocabulary";
import { getDecksFromStorage, type DeckSummary } from "../hooks/useCardStore";

interface DeckPickerModalProps {
  word: VocabWord | null;
  onClose: () => void;
  onPickDeck: (deckId: number, deckTitle: string) => void;
  onGoToDecks: () => void;
}

export function DeckPickerModal({ word, onClose, onPickDeck, onGoToDecks }: DeckPickerModalProps) {
  const [decks, setDecks] = useState<DeckSummary[]>([]);

  useEffect(() => {
    if (word !== null) {
      setDecks(getDecksFromStorage());
    }
  }, [word]);

  if (word === null) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black/60 z-50" onClick={onClose} />
      <div className="fixed bottom-0 left-0 right-0 z-50 bg-neutral-900 border-t border-neutral-800 rounded-t-2xl max-h-[70vh] flex flex-col">
        <div className="w-10 h-1 bg-neutral-700 rounded-full mx-auto mt-3 mb-1 flex-shrink-0" />

        <div className="px-5 py-3 border-b border-neutral-800 flex-shrink-0">
          <p className="text-base font-semibold text-white">Add to Deck</p>
          <p className="text-sm text-red-400 mt-0.5">{word.hanzi} · {word.pinyin}</p>
        </div>

        <div className="flex-1 overflow-y-auto">
          {decks.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 px-5 text-center gap-4">
              <span className="text-4xl">📚</span>
              <p className="text-gray-400 text-sm">You don't have any decks yet.</p>
              <button
                onClick={() => { onClose(); onGoToDecks(); }}
                className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors"
              >
                Create a Deck →
              </button>
            </div>
          ) : (
            <ul className="py-2">
              {decks.map((deck) => (
                <li key={deck.id}>
                  <button
                    onClick={() => onPickDeck(deck.id, deck.title)}
                    className="w-full flex items-center justify-between px-5 py-3.5 hover:bg-neutral-800 active:bg-neutral-700 transition-colors text-left"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-xl">📚</span>
                      <div>
                        <p className="text-white font-medium text-sm">{deck.title}</p>
                        {deck.description && (
                          <p className="text-gray-500 text-xs mt-0.5 line-clamp-1">{deck.description}</p>
                        )}
                      </div>
                    </div>
                    <span className="text-xs text-gray-500 flex-shrink-0 ml-3">
                      {deck.cardCount} card{deck.cardCount !== 1 ? "s" : ""}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="px-5 py-4 border-t border-neutral-800 flex-shrink-0">
          <button
            onClick={onClose}
            className="w-full py-3 bg-neutral-800 hover:bg-neutral-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
