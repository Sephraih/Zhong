import { useState } from "react";
import { HoverCharacter, isHoverCharacterEvent } from "./HoverCharacter";
import { SpeakerButton } from "./SpeakerButton";
import { getHskBadgeClasses } from "../utils/hskColors";
import type { VocabWord } from "../data/vocabulary";
import { extractPinyinForChar, groupByTrailingPunctuation } from "../utils/pinyinUtils";
import { useIsMobile } from "../hooks/useIsMobile";

interface VocabCardProps {
  word: VocabWord;
  isLearned: boolean;
  onToggleLearned: (wordId: number) => void;
  onAddToDeck?: (word: VocabWord) => void;
  isInDeck?: boolean;
}

export function VocabCard({ word, isLearned, onToggleLearned, onAddToDeck, isInDeck }: VocabCardProps) {
  const isMobile = useIsMobile();
  const [isFlipped, setIsFlipped] = useState(false);
  const [showExamples, setShowExamples] = useState(false);

  return (
    <div
      className={`rounded-2xl shadow-lg border overflow-hidden hover:shadow-xl transition-all duration-300 ${
        isLearned
          ? "bg-neutral-900 border-emerald-800/40 hover:border-emerald-700/60"
          : "bg-neutral-900 border-neutral-800 hover:border-neutral-700"
      }`}
    >
      {/* Main Card */}
      <div
        className="p-6 cursor-pointer"
        onClick={(e) => {
          if (isHoverCharacterEvent(e)) return;
          setIsFlipped(!isFlipped);
        }}
      >
        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2">
            <span
              className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${getHskBadgeClasses(word.hskLevel)}`}
            >
              HSK {word.hskLevel}
            </span>
            {isLearned && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">
                ✓ Learned
              </span>
            )}
          </div>
          <span className="text-xs text-gray-600 font-medium">{word.category}</span>
        </div>

        <div className="text-center py-4">
          <div className="inline-flex items-end gap-1 mb-2">
            {word.hanzi.split("").map((char, i) => (
              <HoverCharacter
                key={i}
                char={char}
                pinyin={
                  word.hanzi.length === 1
                    ? word.pinyin
                    : extractPinyinForChar(word.pinyin, i, word.hanzi.length)
                }
                size="2xl"
              />
            ))}
          </div>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              isFlipped ? "max-h-24 opacity-100" : "max-h-0 opacity-0"
            }`}
          >
            <div className="flex items-center justify-center gap-2 mt-1">
              <p className="text-red-400 text-2xl font-medium">{word.pinyin}</p>
              <SpeakerButton text={word.hanzi} size="sm" />
            </div>
            <p className="text-white text-lg font-semibold mt-1">{word.english}</p>
          </div>

          {!isFlipped && (
            <p className="text-gray-600 text-xs mt-2">Click to reveal meaning</p>
          )}
        </div>
      </div>

      {/* Learned/Still Learning Toggle */}
      <div className={`border-t border-neutral-800 ${onAddToDeck ? "flex" : ""}`}>
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleLearned(word.id);
          }}
          className={`flex-1 px-6 py-2.5 text-xs font-semibold transition-all flex items-center justify-center gap-2 ${
            isLearned
              ? "text-emerald-400 hover:bg-red-950/30 hover:text-red-400"
              : "text-gray-500 hover:bg-emerald-950/30 hover:text-emerald-400"
          }`}
          title={isLearned ? "Click to mark as Still Learning" : "Click to mark as Learned"}
        >
          {isLearned ? (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
              Learned — Click to reset
            </>
          ) : (
            <>
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Mark as Learned
            </>
          )}
        </button>
        {onAddToDeck && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              if (!isInDeck) onAddToDeck(word);
            }}
            disabled={isInDeck}
            className={`px-3 py-2.5 text-xs font-semibold border-l border-neutral-800 transition-all flex items-center gap-1 ${
              isInDeck
                ? "text-emerald-400 bg-emerald-950/30 cursor-default"
                : "text-red-400 hover:bg-red-950/30 cursor-pointer"
            }`}
            title={isInDeck ? "Already in deck" : "Add to deck"}
          >
            {isInDeck ? "✓" : "🎴+"}
          </button>
        )}
      </div>

      {/* Examples Section */}
      {word.examples.length > 0 && (
        <div className="border-t border-neutral-800">
          <button
            onClick={() => setShowExamples(!showExamples)}
            className="w-full px-6 py-3 text-sm font-medium text-gray-500 hover:text-gray-300 hover:bg-neutral-800/60 transition-colors flex items-center justify-between"
          >
            <span>
              {showExamples ? "Hide" : "Show"} Examples ({word.examples.length})
            </span>
            <svg
              className={`w-4 h-4 transition-transform duration-200 ${
                showExamples ? "rotate-180" : ""
              }`}
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          <div
            className={`transition-all duration-300 overflow-hidden ${
              showExamples ? "max-h-[600px]" : "max-h-0"
            }`}
          >
            {word.examples.map((example, idx) => (
              <div key={idx} className="px-6 py-4 bg-black/30 border-t border-neutral-800/60">
                <div className="flex items-start gap-2">
                  <div className="flex-1">
                    <div className="flex flex-wrap items-end gap-0.5 mb-2">
                      {groupByTrailingPunctuation(example.pinyinWords).map((group, gi) => (
                        <span key={gi} className="inline-flex items-end gap-0.5">
                          {group.map((pw, i) => (
                            <HoverCharacter key={i} char={pw.char} pinyin={pw.pinyin} size={isMobile ? "lg" : "xl"} charClassName={isMobile ? undefined : "text-[43px]"} />
                          ))}
                        </span>
                      ))}
                    </div>
                    <p className="text-gray-500 text-sm">{example.english}</p>
                  </div>
                  <SpeakerButton text={example.chinese} size="sm" />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
