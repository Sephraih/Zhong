import { useState, useMemo, useRef, useCallback } from "react";
import { useCardStore, type CustomCard, type Deck, type DeckCard } from "../hooks/useCardStore";
import type { VocabWord } from "../data/vocabulary";
import { buildLookupMap } from "../utils/analyzeUtils";

interface CardsDecksProps {
  vocabulary: VocabWord[];
  onNavigateToBrowse: (deckId: number, deckTitle: string) => void;
}

// ── Card Form ─────────────────────────────────────────────────────────────────

interface CardFormProps {
  initial?: CustomCard;
  vocabulary: VocabWord[];
  decks: Deck[];
  initialDeckIds?: number[];
  onSave: (draft: Omit<CustomCard, "id" | "createdAt">, deckIds: number[]) => void;
  onDelete?: () => void;
  onCancel: () => void;
}

function CardForm({ initial, vocabulary, decks, initialDeckIds = [], onSave, onDelete, onCancel }: CardFormProps) {
  const lookupMap = useMemo(() => buildLookupMap(vocabulary), [vocabulary]);

  const [hanzi, setHanzi] = useState(initial?.hanzi ?? "");
  const [pinyin, setPinyin] = useState(initial?.pinyin ?? "");
  const [english, setEnglish] = useState(initial?.english ?? "");
  const [learned, setLearned] = useState(initial?.learned ?? false);
  const [examples, setExamples] = useState(initial?.examples ?? []);
  const [selectedDeckIds, setSelectedDeckIds] = useState<number[]>(initialDeckIds);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const autoFill = useCallback(() => {
    if (!hanzi.trim()) return;
    const matches = lookupMap.get(hanzi.trim());
    if (matches && matches.length > 0) {
      const w = matches[0];
      if (!pinyin) setPinyin(w.pinyin);
      if (!english) setEnglish(w.english);
    }
  }, [hanzi, pinyin, english, lookupMap]);

  const toggleDeck = (id: number) => {
    setSelectedDeckIds((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleSave = () => {
    if (!hanzi.trim()) return;
    onSave({ hanzi: hanzi.trim(), pinyin, english, learned, examples }, selectedDeckIds);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Hanzi *</label>
        <input
          value={hanzi}
          onChange={(e) => setHanzi(e.target.value)}
          onBlur={autoFill}
          placeholder="e.g. 你好"
          className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-lg font-medium placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">Pinyin</label>
          <input
            value={pinyin}
            onChange={(e) => setPinyin(e.target.value)}
            placeholder="e.g. nǐ hǎo"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">English</label>
          <input
            value={english}
            onChange={(e) => setEnglish(e.target.value)}
            placeholder="e.g. hello"
            className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white text-sm placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40"
          />
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          type="button"
          onClick={() => setLearned((l) => !l)}
          className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${learned ? "bg-emerald-600" : "bg-neutral-700"}`}
        >
          <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${learned ? "translate-x-4" : "translate-x-0.5"}`} />
        </button>
        <span className="text-sm text-gray-400">Mark as learned</span>
      </div>

      {/* Examples */}
      <div>
        <div className="flex items-center justify-between mb-2">
          <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Examples (up to 3)</label>
          {examples.length < 3 && (
            <button
              type="button"
              onClick={() => setExamples((ex) => [...ex, { chinese: "", pinyinWords: [], english: "" }])}
              className="text-xs text-red-400 hover:text-red-300"
            >
              + Add example
            </button>
          )}
        </div>
        {examples.map((ex, idx) => (
          <div key={idx} className="bg-neutral-800/60 border border-neutral-700/60 rounded-xl p-3 mb-2 space-y-2">
            <div className="flex items-center gap-2">
              <input
                value={ex.chinese}
                onChange={(e) => setExamples((prev) => prev.map((x, i) => i === idx ? { ...x, chinese: e.target.value } : x))}
                placeholder="Chinese sentence"
                className="flex-1 px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/40"
              />
              <button
                type="button"
                onClick={() => setExamples((prev) => prev.filter((_, i) => i !== idx))}
                className="text-gray-600 hover:text-red-400 transition-colors p-1"
              >
                ×
              </button>
            </div>
            <input
              value={ex.english}
              onChange={(e) => setExamples((prev) => prev.map((x, i) => i === idx ? { ...x, english: e.target.value } : x))}
              placeholder="English translation"
              className="w-full px-2 py-1.5 bg-neutral-700 border border-neutral-600 rounded-lg text-white text-sm placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-red-600/40"
            />
          </div>
        ))}
      </div>

      {/* Deck chips */}
      {decks.length > 0 && (
        <div>
          <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Add to decks</label>
          <div className="flex flex-wrap gap-2">
            {decks.map((d) => (
              <button
                key={d.id}
                type="button"
                onClick={() => toggleDeck(d.id)}
                className={`px-3 py-1 rounded-full text-xs font-medium border transition-all ${
                  selectedDeckIds.includes(d.id)
                    ? "bg-red-600 border-red-500 text-white"
                    : "bg-neutral-800 border-neutral-700 text-gray-400 hover:border-neutral-600"
                }`}
              >
                {d.title}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-2">
        <button
          onClick={handleSave}
          disabled={!hanzi.trim()}
          className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white font-semibold rounded-xl transition-colors text-sm"
        >
          {initial ? "Save changes" : "Create card"}
        </button>
        <button
          onClick={onCancel}
          className="px-4 py-2.5 bg-neutral-800 hover:bg-neutral-700 text-gray-300 font-semibold rounded-xl border border-neutral-700 transition-colors text-sm"
        >
          Cancel
        </button>
        {onDelete && (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="px-3 py-2.5 bg-neutral-800 hover:bg-red-950/40 text-gray-500 hover:text-red-400 rounded-xl border border-neutral-700 transition-colors text-sm"
            title="Delete card"
          >
            🗑
          </button>
        )}
      </div>

      {showDeleteConfirm && (
        <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 flex items-center justify-between gap-3">
          <span className="text-red-300 text-sm">Delete this card?</span>
          <div className="flex gap-2">
            <button onClick={onDelete} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg">Delete</button>
            <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 bg-neutral-700 text-gray-300 text-xs font-semibold rounded-lg">Cancel</button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Card Row ──────────────────────────────────────────────────────────────────

function CardRow({ card, onClick }: { card: CustomCard; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left flex items-center gap-4 px-4 py-3 hover:bg-neutral-800/60 transition-colors border-b border-neutral-800/60 last:border-0"
    >
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-white font-medium text-xl">{card.hanzi}</span>
          <span className="text-red-400 text-sm">{card.pinyin}</span>
          {card.learned && (
            <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full bg-emerald-950/60 text-emerald-400 border border-emerald-800/40">✓</span>
          )}
        </div>
        <p className="text-gray-500 text-sm truncate">{card.english}</p>
      </div>
      <svg className="w-4 h-4 text-gray-600 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
      </svg>
    </button>
  );
}

// ── Deck Card ─────────────────────────────────────────────────────────────────

interface DeckPanelProps {
  deck: Deck;
  deckCards: DeckCard[];
  vocabulary: VocabWord[];
  customCards: CustomCard[];
  onRemoveWord: (cardId: number, cardType: "custom" | "hsk") => void;
  onAddFromBrowse: () => void;
  onEdit: () => void;
  onDelete: () => void;
}

function DeckPanel({ deck, deckCards, vocabulary, customCards, onRemoveWord, onAddFromBrowse, onEdit, onDelete }: DeckPanelProps) {
  const [expanded, setExpanded] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const vocabMap = useMemo(() => {
    const m = new Map<number, VocabWord>();
    vocabulary.forEach((w) => m.set(w.id, w));
    return m;
  }, [vocabulary]);
  const cardMap = useMemo(() => {
    const m = new Map<number, CustomCard>();
    customCards.forEach((c) => m.set(c.id, c));
    return m;
  }, [customCards]);

  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
      {/* Header — always visible */}
      <div className="p-4 flex items-start justify-between gap-3">
        <button onClick={() => setExpanded((e) => !e)} className="flex-1 text-left min-w-0">
          <p className="text-white font-semibold truncate">{deck.title}</p>
          {deck.description && <p className="text-gray-500 text-sm mt-0.5 truncate">{deck.description}</p>}
          <p className="text-gray-600 text-xs mt-1">{deckCards.length} card{deckCards.length !== 1 ? "s" : ""}</p>
        </button>
        <div className="flex gap-1.5 flex-shrink-0">
          <button onClick={onEdit} className="px-2 py-1 text-xs text-gray-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors">Edit</button>
          <button
            onClick={() => setExpanded((e) => !e)}
            className="px-2 py-1 text-xs text-gray-500 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg border border-neutral-700 transition-colors"
          >
            {expanded ? "Hide" : "Show"}
          </button>
          {/* Delete button always visible */}
          <button
            onClick={() => setShowDeleteConfirm((v) => !v)}
            className={`px-2 py-1 text-xs rounded-lg border transition-colors ${
              showDeleteConfirm
                ? "bg-red-950/50 border-red-700/50 text-red-400"
                : "text-gray-500 hover:text-red-400 bg-neutral-800 hover:bg-red-950/30 border-neutral-700"
            }`}
            title="Delete deck"
          >
            🗑
          </button>
        </div>
      </div>

      {/* Delete confirmation — shown below header, above cards */}
      {showDeleteConfirm && (
        <div className="px-4 pb-3">
          <div className="bg-red-950/40 border border-red-800/50 rounded-xl p-3 flex items-center justify-between gap-3">
            <span className="text-red-300 text-sm">Delete "{deck.title}"? This cannot be undone.</span>
            <div className="flex gap-2 flex-shrink-0">
              <button onClick={onDelete} className="px-3 py-1 bg-red-600 hover:bg-red-500 text-white text-xs font-semibold rounded-lg transition-colors">Delete</button>
              <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1 bg-neutral-700 hover:bg-neutral-600 text-gray-300 text-xs font-semibold rounded-lg transition-colors">Cancel</button>
            </div>
          </div>
        </div>
      )}

      {expanded && (
        <div className="border-t border-neutral-800">
          {deckCards.length === 0 ? (
            <p className="text-gray-600 text-sm text-center py-6">No cards yet</p>
          ) : (
            <div className="divide-y divide-neutral-800/60">
              {deckCards.map((dc) => {
                const label = dc.cardType === "hsk"
                  ? (vocabMap.get(dc.cardId)?.english ?? dc.hanzi)
                  : (cardMap.get(dc.cardId)?.english ?? dc.hanzi);
                return (
                  <div key={`${dc.cardType}_${dc.cardId}`} className="flex items-center gap-3 px-4 py-2.5">
                    <span className="text-white font-medium">{dc.hanzi}</span>
                    <span className="text-red-400 text-sm">{dc.pinyin}</span>
                    <span className="text-gray-500 text-sm flex-1 truncate">{label}</span>
                    <span className={`text-[10px] px-1.5 py-0.5 rounded-full border ${dc.cardType === "custom" ? "text-purple-400 border-purple-800/40 bg-purple-950/30" : "text-blue-400 border-blue-800/40 bg-blue-950/30"}`}>
                      {dc.cardType === "custom" ? "Custom" : "HSK"}
                    </span>
                    <button onClick={() => onRemoveWord(dc.cardId, dc.cardType)} className="text-gray-600 hover:text-red-400 transition-colors text-sm flex-shrink-0">×</button>
                  </div>
                );
              })}
            </div>
          )}

          <div className="border-t border-neutral-800 p-3">
            <button
              onClick={onAddFromBrowse}
              className="w-full py-2 text-sm font-medium text-gray-400 hover:text-white bg-neutral-800/60 hover:bg-neutral-800 rounded-xl border border-neutral-700 transition-colors"
            >
              🗂＋ Add from Browse
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Main Component ────────────────────────────────────────────────────────────

export function CardsDecksMode({ vocabulary, onNavigateToBrowse }: CardsDecksProps) {
  const store = useCardStore();
  const [tab, setTab] = useState<"cards" | "decks">("cards");
  const [searchQuery, setSearchQuery] = useState("");
  const [editingCard, setEditingCard] = useState<CustomCard | null>(null);
  const [showNewCardForm, setShowNewCardForm] = useState(false);
  const [newCardForDeckIds, setNewCardForDeckIds] = useState<number[]>([]);
  const [editingDeck, setEditingDeck] = useState<Deck | null>(null);
  const [showNewDeckForm, setShowNewDeckForm] = useState(false);
  const [newDeckTitle, setNewDeckTitle] = useState("");
  const [newDeckDesc, setNewDeckDesc] = useState("");
  const [importMode, setImportMode] = useState<"merge" | "replace" | null>(null);
  const [importJson, setImportJson] = useState<string | null>(null);
  const [importError, setImportError] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);

  const filteredCards = useMemo(() => {
    if (!searchQuery) return store.cards;
    const q = searchQuery.toLowerCase();
    return store.cards.filter(
      (c) => c.hanzi.includes(searchQuery) || c.pinyin.toLowerCase().includes(q) || c.english.toLowerCase().includes(q)
    );
  }, [store.cards, searchQuery]);

  const handleSaveCard = (draft: Omit<CustomCard, "id" | "createdAt">, deckIds: number[]) => {
    if (editingCard) {
      store.updateCard(editingCard.id, draft);
      // Sync deck membership: add to newly selected, remove from deselected
      store.decks.forEach((d) => {
        const wasIn = store.getCardsForDeck(d.id).some((dc) => dc.cardId === editingCard.id && dc.cardType === "custom");
        const nowIn = deckIds.includes(d.id);
        if (nowIn && !wasIn) store.addWordToDeck(d.id, editingCard.id, "custom", draft.hanzi, draft.pinyin);
        if (!nowIn && wasIn) store.removeWordFromDeck(d.id, editingCard.id, "custom");
      });
      setEditingCard(null);
    } else {
      const card = store.addCard(draft);
      deckIds.forEach((dId) => store.addWordToDeck(dId, card.id, "custom", draft.hanzi, draft.pinyin));
      setShowNewCardForm(false);
      setNewCardForDeckIds([]);
    }
  };

  const handleDeleteCard = (id: number) => {
    store.deleteCard(id);
    setEditingCard(null);
  };

  const handleSaveDeck = () => {
    if (!newDeckTitle.trim()) return;
    if (editingDeck) {
      store.updateDeck(editingDeck.id, { title: newDeckTitle.trim(), description: newDeckDesc.trim() });
    } else {
      store.addDeck(newDeckTitle.trim(), newDeckDesc.trim());
    }
    setShowNewDeckForm(false);
    setEditingDeck(null);
    setNewDeckTitle("");
    setNewDeckDesc("");
  };

  const startEditDeck = (deck: Deck) => {
    setEditingDeck(deck);
    setNewDeckTitle(deck.title);
    setNewDeckDesc(deck.description);
    setShowNewDeckForm(true);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      try {
        JSON.parse(text);
        setImportJson(text);
        setImportMode("merge");
        setImportError("");
      } catch {
        setImportError("Invalid JSON file.");
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  const confirmImport = () => {
    if (!importJson || !importMode) return;
    try {
      store.importData(importJson, importMode);
      setImportJson(null);
      setImportMode(null);
    } catch {
      setImportError("Failed to import data. Check the file format.");
    }
  };

  const openNewCard = (deckIds: number[] = []) => {
    setNewCardForDeckIds(deckIds);
    setShowNewCardForm(true);
    setEditingCard(null);
  };

  const currentFormDeckIds = editingCard
    ? store.decks.filter((d) => store.getCardsForDeck(d.id).some((dc) => dc.cardId === editingCard.id && dc.cardType === "custom")).map((d) => d.id)
    : newCardForDeckIds;

  const showForm = showNewCardForm || editingCard !== null;

  return (
    <div className="max-w-4xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-white mb-2">🎴 My Cards & Decks</h2>
        <p className="text-gray-400 text-sm">Build custom flashcard decks — saved in your browser</p>
      </div>

      {/* Tab selector */}
      <div className="flex gap-1 mb-6 bg-neutral-900 rounded-xl p-1 border border-neutral-800">
        {(["cards", "decks"] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`flex-1 py-2 rounded-lg text-sm font-semibold transition-all capitalize ${
              tab === t ? "bg-neutral-700 text-white" : "text-gray-500 hover:text-gray-300"
            }`}
          >
            {t === "cards" ? `My Cards (${store.cards.length})` : `My Decks (${store.decks.length})`}
          </button>
        ))}
      </div>

      {/* ── My Cards tab ── */}
      {tab === "cards" && (
        <div>
          {showForm ? (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5 mb-4">
              <h3 className="text-white font-semibold mb-4">{editingCard ? "Edit Card" : "New Card"}</h3>
              <CardForm
                initial={editingCard ?? undefined}
                vocabulary={vocabulary}
                decks={store.decks}
                initialDeckIds={currentFormDeckIds}
                onSave={handleSaveCard}
                onDelete={editingCard ? () => handleDeleteCard(editingCard.id) : undefined}
                onCancel={() => { setEditingCard(null); setShowNewCardForm(false); }}
              />
            </div>
          ) : (
            <div className="flex items-center gap-3 mb-4">
              <div className="relative flex-1">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  placeholder="Search cards…"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-9 pr-4 py-2.5 bg-neutral-900 border border-neutral-800 rounded-xl text-sm text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40"
                />
              </div>
              <button
                onClick={() => openNewCard()}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl transition-colors flex-shrink-0"
              >
                + New Card
              </button>
            </div>
          )}

          {!showForm && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
              {filteredCards.length === 0 ? (
                <div className="text-center py-12 text-gray-500">
                  {store.cards.length === 0 ? (
                    <>
                      <p className="text-4xl mb-3">🎴</p>
                      <p className="font-medium">No cards yet</p>
                      <p className="text-sm mt-1">Create your first card or add words from Browse or Analyze modes</p>
                    </>
                  ) : (
                    <p>No cards match your search</p>
                  )}
                </div>
              ) : (
                filteredCards.map((card) => (
                  <CardRow key={card.id} card={card} onClick={() => setEditingCard(card)} />
                ))
              )}
            </div>
          )}
        </div>
      )}

      {/* ── My Decks tab ── */}
      {tab === "decks" && (
        <div className="space-y-4">
          {showNewDeckForm && (
            <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-5">
              <h3 className="text-white font-semibold mb-4">{editingDeck ? "Edit Deck" : "New Deck"}</h3>
              <div className="space-y-3">
                <input
                  value={newDeckTitle}
                  onChange={(e) => setNewDeckTitle(e.target.value)}
                  placeholder="Deck title *"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 text-sm"
                />
                <input
                  value={newDeckDesc}
                  onChange={(e) => setNewDeckDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full px-3 py-2 bg-neutral-800 border border-neutral-700 rounded-xl text-white placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-red-600/40 text-sm"
                />
                <div className="flex gap-2">
                  <button onClick={handleSaveDeck} disabled={!newDeckTitle.trim()} className="flex-1 py-2 bg-red-600 hover:bg-red-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl">
                    {editingDeck ? "Save" : "Create deck"}
                  </button>
                  <button onClick={() => { setShowNewDeckForm(false); setEditingDeck(null); setNewDeckTitle(""); setNewDeckDesc(""); }} className="px-4 py-2 bg-neutral-800 text-gray-300 text-sm font-semibold rounded-xl border border-neutral-700">
                    Cancel
                  </button>
                </div>
              </div>
            </div>
          )}

          {!showNewDeckForm && (
            store.decks.length >= 5 ? (
              <div className="w-full py-3 border-2 border-dashed border-neutral-800 text-gray-600 rounded-2xl text-sm font-medium text-center">
                Deck limit reached (5/5)
              </div>
            ) : (
              <button
                onClick={() => setShowNewDeckForm(true)}
                className="w-full py-3 border-2 border-dashed border-neutral-700 hover:border-red-800/60 text-gray-500 hover:text-gray-300 rounded-2xl text-sm font-medium transition-colors"
              >
                + New Deck
              </button>
            )
          )}

          {store.decks.length === 0 && !showNewDeckForm && (
            <div className="text-center py-8 text-gray-500">
              <p className="text-4xl mb-3">📦</p>
              <p className="font-medium">No decks yet</p>
              <p className="text-sm mt-1">Create a deck to organize your cards</p>
            </div>
          )}

          {store.decks.map((deck) => (
            <DeckPanel
              key={deck.id}
              deck={deck}
              deckCards={store.getCardsForDeck(deck.id)}
              vocabulary={vocabulary}
              customCards={store.cards}
              onRemoveWord={(cardId, cardType) => store.removeWordFromDeck(deck.id, cardId, cardType)}
              onAddFromBrowse={() => onNavigateToBrowse(deck.id, deck.title)}
              onEdit={() => startEditDeck(deck)}
              onDelete={() => store.deleteDeck(deck.id)}
            />
          ))}
        </div>
      )}

      {/* ── Export / Import ── */}
      <div className="mt-8 border-t border-neutral-800 pt-6">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Data</p>

        {importMode !== null && importJson && (
          <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-4 mb-4">
            <p className="text-white text-sm font-medium mb-3">Import mode</p>
            <div className="flex gap-2 mb-3">
              {(["merge", "replace"] as const).map((m) => (
                <button
                  key={m}
                  onClick={() => setImportMode(m)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border transition-all capitalize ${importMode === m ? "bg-red-600 border-red-500 text-white" : "bg-neutral-800 border-neutral-700 text-gray-400"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            <p className="text-gray-500 text-xs mb-3">
              {importMode === "merge" ? "Keeps your existing cards and adds new ones from the file." : "Replaces all your current cards and decks with the file's contents."}
            </p>
            <div className="flex gap-2">
              <button onClick={confirmImport} className="flex-1 py-2 bg-red-600 hover:bg-red-500 text-white text-sm font-semibold rounded-xl">Confirm import</button>
              <button onClick={() => { setImportJson(null); setImportMode(null); }} className="px-4 py-2 bg-neutral-800 text-gray-300 text-sm rounded-xl border border-neutral-700">Cancel</button>
            </div>
            {importError && <p className="text-red-400 text-xs mt-2">{importError}</p>}
          </div>
        )}

        <div className="flex gap-3">
          <button
            onClick={store.exportData}
            disabled={store.cards.length === 0 && store.decks.length === 0}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 disabled:opacity-40 border border-neutral-800 hover:border-neutral-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Export Cards & Decks
          </button>
          <button
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-4 py-2.5 bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-gray-300 text-sm font-medium rounded-xl transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l4-4m0 0l4 4m-4-4v12" />
            </svg>
            Import
          </button>
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
        </div>
        <p className="text-gray-600 text-xs mt-2">Cards are stored in your browser. Export regularly to back them up.</p>
      </div>
    </div>
  );
}
