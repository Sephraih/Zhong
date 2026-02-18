import { useState, useMemo, useCallback } from "react";
import { HoverCharacter } from "./HoverCharacter";
import { useIsMobile } from "../hooks/useIsMobile";
import type { VocabWord } from "../data/vocabulary";

interface QuizModeProps {
  words: VocabWord[];
}

interface QuizQuestion {
  word: VocabWord;
  options: string[];
  correctIndex: number;
}

function splitPinyin(pinyin: string): string[] {
  const result: string[] = [];
  let current = "";
  const vowels = "aeiouüāáǎàēéěèīíǐìōóǒòūúǔùǖǘǚǜ";

  for (let i = 0; i < pinyin.length; i++) {
    const ch = pinyin[i];
    if (ch === " ") {
      if (current) result.push(current);
      current = "";
      continue;
    }
    current += ch;

    if (i < pinyin.length - 1) {
      const next = pinyin[i + 1];
      if (next === " ") continue;
      const isCurrentVowel = vowels.includes(ch.toLowerCase());
      const isNextConsonant = !vowels.includes(next.toLowerCase());
      if (isCurrentVowel && isNextConsonant) {
        const remaining = pinyin.slice(i + 1);
        const nextSyllableMatch = remaining.match(/^[bpmfdtnlgkhjqxzhchshrzcsyw]/i);
        if (nextSyllableMatch) {
          if (ch === "n" || (ch === "g" && current.endsWith("ng"))) continue;
          result.push(current);
          current = "";
        }
      }
    }
  }

  if (current) result.push(current);
  return result.length === 0 ? [pinyin] : result;
}

function extractPinyinForChar(fullPinyin: string, charIndex: number, totalChars: number): string {
  const syllables = splitPinyin(fullPinyin);
  if (totalChars === 1) return fullPinyin;
  if (charIndex < syllables.length) return syllables[charIndex];
  return fullPinyin;
}

export function QuizMode({ words }: QuizModeProps) {
  const isMobile = useIsMobile();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [answered, setAnswered] = useState(0);

  const questions: QuizQuestion[] = useMemo(() => {
    const shuffled = [...words].sort(() => Math.random() - 0.5).slice(0, 10);
    return shuffled.map((word) => {
      const otherWords = words.filter((w) => w.id !== word.id);
      const wrongOptions = otherWords
        .sort(() => Math.random() - 0.5)
        .slice(0, 3)
        .map((w) => w.english);

      const correctIndex = Math.floor(Math.random() * 4);
      const options = [...wrongOptions];
      options.splice(correctIndex, 0, word.english);

      return { word, options, correctIndex };
    });
  }, [words]);

  const currentQuestion = questions[currentIndex];
  const isComplete = currentIndex >= questions.length;

  const handleAnswer = useCallback(
    (index: number) => {
      if (selectedAnswer !== null) return;
      setSelectedAnswer(index);
      setAnswered((prev) => prev + 1);
      if (index === currentQuestion.correctIndex) {
        setScore((prev) => prev + 1);
      }

      setTimeout(() => {
        setSelectedAnswer(null);
        setCurrentIndex((prev) => prev + 1);
      }, 1500);
    },
    [selectedAnswer, currentQuestion]
  );

  const restart = () => {
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setAnswered(0);
  };

  if (words.length < 4) {
    return (
      <div className="text-center py-16 text-gray-400">
        Need at least 4 words to create a quiz. Adjust your filters.
      </div>
    );
  }

  if (isComplete) {
    const percentage = Math.round((score / answered) * 100);
    return (
      <div className="max-w-lg mx-auto text-center py-12">
        <div className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-8">
          <div className="text-6xl mb-4">{percentage >= 80 ? "🏆" : percentage >= 60 ? "👍" : "💪"}</div>
          <h2 className="text-2xl font-bold text-white mb-2">Quiz Complete!</h2>
          <p className="text-gray-400 mb-2">
            You scored {score} out of {answered}
          </p>
          <p className="text-3xl font-bold text-red-400 mb-6">{percentage}%</p>

          <button
            onClick={restart}
            className="px-8 py-3 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-500 transition-colors shadow-lg shadow-red-900/30"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const progress = ((currentIndex + 1) / questions.length) * 100;

  return (
    <div className="max-w-lg mx-auto">
      {/* Progress */}
      <div className="mb-6">
        <div className="flex justify-between text-sm text-gray-400 mb-2">
          <span>
            Question {currentIndex + 1} of {questions.length}
          </span>
          <span>Score: {score}/{answered}</span>
        </div>
        <div className="h-2 bg-neutral-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-red-600 to-red-500 rounded-full transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Question */}
      <div className="bg-neutral-900 rounded-3xl shadow-2xl border border-neutral-800 p-8 text-center mb-6">
        <p className="text-sm text-gray-500 mb-4">What does this mean?</p>
        
        {/* Hanzi with hover/tap pinyin */}
        <div className="flex items-end gap-1 justify-center mb-2">
          {currentQuestion.word.hanzi.split("").map((char, i) => (
            <HoverCharacter
              key={`${currentQuestion.word.id}-${i}`}
              char={char}
              pinyin={extractPinyinForChar(currentQuestion.word.pinyin, i, currentQuestion.word.hanzi.length)}
              size="xl"
              wordId={currentQuestion.word.id}
            />
          ))}
        </div>

        <p className="text-gray-600 text-xs mt-2">
          {isMobile ? "Tap characters for pinyin" : "Hover for pinyin"}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {currentQuestion.options.map((option, idx) => {
          let btnClass =
            "w-full py-4 px-6 rounded-xl font-medium text-left transition-all duration-200 border ";

          if (selectedAnswer === null) {
            btnClass += "bg-neutral-900 border-neutral-800 text-gray-200 hover:border-red-700/60 hover:bg-neutral-800";
          } else if (idx === currentQuestion.correctIndex) {
            btnClass += "bg-emerald-950/50 border-emerald-600/60 text-emerald-300";
          } else if (idx === selectedAnswer) {
            btnClass += "bg-red-950/50 border-red-600/60 text-red-300";
          } else {
            btnClass += "bg-neutral-900/40 border-neutral-800/40 text-gray-600";
          }

          return (
            <button key={idx} onClick={() => handleAnswer(idx)} className={btnClass}>
              <span className="mr-3 text-gray-600 font-mono">{String.fromCharCode(65 + idx)}.</span>
              {option}
            </button>
          );
        })}
      </div>
    </div>
  );
}
