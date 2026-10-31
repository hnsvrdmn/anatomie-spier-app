import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import {
  FLASHCARD_SETS,
  FlashcardItem,
  FlashcardSet,
} from '../../data/flashcardsData';
import {
  RotateCcw,
  Shuffle,
  Check,
  X,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ZoomIn,
  Repeat,
  LayoutGrid,
} from 'lucide-react';

type CardResult = 'correct' | 'incorrect';

interface SavedSetProgress {
  results: Record<string, CardResult>;
  activeQueueIds?: string[];
  currentIndex?: number;
  isRetryMode?: boolean;
}

const STORAGE_KEY_PROGRESS = 'pmt_flashcards_progress_v1';

export const FlashcardsView: React.FC = () => {
  // Start altijd op de landingspagina (null) zodat je eerst zelf een set kiest
  const [activeSetId, setActiveSetId] = useState<string | null>(null);

  const [progressBySet, setProgressBySet] = useState<Record<string, SavedSetProgress>>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY_PROGRESS);
      if (raw) return JSON.parse(raw);
    } catch {
      // ignore
    }
    return {};
  });

  const activeSet: FlashcardSet = useMemo(
    () => FLASHCARD_SETS.find((s) => s.id === activeSetId) || FLASHCARD_SETS[0],
    [activeSetId]
  );

  const [isFlipped, setIsFlipped] = useState(false);
  const [exitDirection, setExitDirection] = useState<'left' | 'right' | null>(null);
  const [enterAnimation, setEnterAnimation] = useState(false);
  const [dragOffset, setDragOffset] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const touchStartRef = useRef<{ x: number; y: number } | null>(null);

  const [zoomedImage, setZoomedImage] = useState<string | null>(null);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY_PROGRESS, JSON.stringify(progressBySet));
    } catch {
      // ignore
    }
  }, [progressBySet]);

  const currentSetProgress: SavedSetProgress = useMemo(() => {
    const existing = progressBySet[activeSet.id];
    if (existing && existing.activeQueueIds && existing.activeQueueIds.length > 0) {
      return existing;
    }
    return {
      results: existing?.results || {},
      activeQueueIds: activeSet.cards.map((c) => c.id),
      currentIndex: 0,
      isRetryMode: false,
    };
  }, [progressBySet, activeSet]);

  const activeQueueIds = currentSetProgress.activeQueueIds || activeSet.cards.map((c) => c.id);
  const currentIndex = currentSetProgress.currentIndex ?? 0;
  const results = currentSetProgress.results || {};
  const isRetryMode = Boolean(currentSetProgress.isRetryMode);

  const activeDeck: FlashcardItem[] = useMemo(() => {
    const cardMap = new Map(activeSet.cards.map((c) => [c.id, c]));
    const list = activeQueueIds
      .map((id) => cardMap.get(id))
      .filter((c): c is FlashcardItem => Boolean(c));
    return list.length > 0 ? list : activeSet.cards;
  }, [activeSet, activeQueueIds]);

  const isFinished = currentIndex >= activeDeck.length;
  const currentCard: FlashcardItem | undefined = !isFinished
    ? activeDeck[currentIndex]
    : undefined;
  const nextCardPreview: FlashcardItem | undefined =
    currentIndex + 1 < activeDeck.length ? activeDeck[currentIndex + 1] : undefined;

  const stats = useMemo(() => {
    let roundCorrect = 0;
    let roundIncorrect = 0;
    const roundIncorrectIds: string[] = [];

    activeDeck.forEach((c) => {
      const r = results[c.id];
      if (r === 'correct') roundCorrect++;
      else if (r === 'incorrect') {
        roundIncorrect++;
        roundIncorrectIds.push(c.id);
      }
    });

    const allSetIncorrectIds: string[] = [];
    activeSet.cards.forEach((c) => {
      if (results[c.id] === 'incorrect') {
        allSetIncorrectIds.push(c.id);
      }
    });

    return {
      roundCorrect,
      roundIncorrect,
      roundIncorrectIds,
      allSetIncorrectIds,
    };
  }, [activeDeck, activeSet.cards, results]);

  const updateActiveSetProgress = useCallback(
    (updater: (prev: SavedSetProgress) => SavedSetProgress) => {
      setProgressBySet((prevAll) => {
        const current = prevAll[activeSet.id] || {
          results: {},
          activeQueueIds: activeSet.cards.map((c) => c.id),
          currentIndex: 0,
          isRetryMode: false,
        };
        return {
          ...prevAll,
          [activeSet.id]: updater(current),
        };
      });
    },
    [activeSet]
  );

  const handleSelectSet = (setId: string) => {
    setIsFlipped(false);
    setExitDirection(null);
    setDragOffset({ x: 0, y: 0 });
    setActiveSetId(setId);
    setIsDropdownOpen(false);
  };

  const handleBackToLanding = () => {
    setIsFlipped(false);
    setExitDirection(null);
    setDragOffset({ x: 0, y: 0 });
    setIsDropdownOpen(false);
    setActiveSetId(null);
  };

  const handleGradeCard = useCallback(
    (grade: CardResult) => {
      if (!currentCard || exitDirection) return;

      setExitDirection(grade === 'correct' ? 'right' : 'left');
      setDragOffset({ x: 0, y: 0 });

      setTimeout(() => {
        setIsFlipped(false);
        updateActiveSetProgress((prev) => ({
          ...prev,
          results: {
            ...prev.results,
            [currentCard.id]: grade,
          },
          currentIndex: (prev.currentIndex ?? 0) + 1,
        }));
        setExitDirection(null);
        setEnterAnimation(true);
        setTimeout(() => setEnterAnimation(false), 240);
      }, 200);
    },
    [currentCard, exitDirection, updateActiveSetProgress]
  );

  const handlePrevCard = useCallback(() => {
    if (currentIndex <= 0 || exitDirection) return;
    setIsFlipped(false);
    setDragOffset({ x: 0, y: 0 });
    updateActiveSetProgress((prev) => ({
      ...prev,
      currentIndex: Math.max(0, (prev.currentIndex ?? 0) - 1),
    }));
  }, [currentIndex, exitDirection, updateActiveSetProgress]);

  const handleRetryIncorrect = useCallback(() => {
    const targetIds =
      stats.allSetIncorrectIds.length > 0
        ? stats.allSetIncorrectIds
        : stats.roundIncorrectIds;
    if (targetIds.length === 0) return;

    setIsFlipped(false);
    setExitDirection(null);
    setDragOffset({ x: 0, y: 0 });

    updateActiveSetProgress((prev) => {
      const cleanedResults = { ...prev.results };
      targetIds.forEach((id) => {
        delete cleanedResults[id];
      });
      return {
        results: cleanedResults,
        activeQueueIds: [...targetIds],
        currentIndex: 0,
        isRetryMode: true,
      };
    });
  }, [stats.allSetIncorrectIds, stats.roundIncorrectIds, updateActiveSetProgress]);

  const handleRestartFullSet = useCallback(
    (shuffleCards = false) => {
      setIsFlipped(false);
      setExitDirection(null);
      setDragOffset({ x: 0, y: 0 });

      const allIds = activeSet.cards.map((c) => c.id);
      if (shuffleCards) {
        for (let i = allIds.length - 1; i > 0; i--) {
          const j = Math.floor(Math.random() * (i + 1));
          [allIds[i], allIds[j]] = [allIds[j], allIds[i]];
        }
      }

      updateActiveSetProgress(() => ({
        results: {},
        activeQueueIds: allIds,
        currentIndex: 0,
        isRetryMode: false,
      }));
    },
    [activeSet.cards, updateActiveSetProgress]
  );

  const handleShuffleRemaining = useCallback(() => {
    if (isFinished) {
      handleRestartFullSet(true);
      return;
    }
    setIsFlipped(false);
    updateActiveSetProgress((prev) => {
      const queue = [...(prev.activeQueueIds || activeSet.cards.map((c) => c.id))];
      const idx = prev.currentIndex ?? 0;
      const donePart = queue.slice(0, idx);
      const remainingPart = queue.slice(idx);
      for (let i = remainingPart.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [remainingPart[i], remainingPart[j]] = [remainingPart[j], remainingPart[i]];
      }
      return {
        ...prev,
        activeQueueIds: [...donePart, ...remainingPart],
      };
    });
  }, [isFinished, handleRestartFullSet, updateActiveSetProgress, activeSet.cards]);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (!activeSetId) return;
      if (zoomedImage) {
        if (e.key === 'Escape') setZoomedImage(null);
        return;
      }
      if (isDropdownOpen) {
        if (e.key === 'Escape') setIsDropdownOpen(false);
        return;
      }
      if (isFinished) return;

      if (e.key === ' ' || e.key === 'Enter' || e.key === 'ArrowUp' || e.key === 'ArrowDown') {
        e.preventDefault();
        setIsFlipped((f) => !f);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        handleGradeCard('correct');
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        handleGradeCard('incorrect');
      } else if (e.key === 'Backspace') {
        e.preventDefault();
        handlePrevCard();
      }
    };
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, [activeSetId, zoomedImage, isDropdownOpen, isFinished, handleGradeCard, handlePrevCard]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (exitDirection || isFinished) return;
    const touch = e.touches[0];
    touchStartRef.current = {
      x: touch.clientX,
      y: touch.clientY,
    };
    setIsDragging(true);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchStartRef.current || !isDragging) return;
    const touch = e.touches[0];
    const dx = touch.clientX - touchStartRef.current.x;
    const dy = touch.clientY - touchStartRef.current.y;

    if (Math.abs(dx) > Math.abs(dy) * 0.8) {
      setDragOffset({ x: dx, y: dy * 0.25 });
    }
  };

  const handleTouchEnd = () => {
    if (!touchStartRef.current) return;
    const dx = dragOffset.x;
    setIsDragging(false);
    touchStartRef.current = null;

    const SWIPE_THRESHOLD = 75;
    if (dx > SWIPE_THRESHOLD) {
      handleGradeCard('correct');
    } else if (dx < -SWIPE_THRESHOLD) {
      handleGradeCard('incorrect');
    } else {
      setDragOffset({ x: 0, y: 0 });
    }
  };

  const getCardTransformStyle = (): React.CSSProperties => {
    if (exitDirection === 'right') {
      return {
        transform: 'translate3d(125%, -10px, 0) rotate(12deg)',
        opacity: 0,
        transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out',
      };
    }
    if (exitDirection === 'left') {
      return {
        transform: 'translate3d(-125%, -10px, 0) rotate(-12deg)',
        opacity: 0,
        transition: 'transform 200ms cubic-bezier(0.22, 1, 0.36, 1), opacity 180ms ease-out',
      };
    }
    if (isDragging && Math.abs(dragOffset.x) > 4) {
      const rotate = Math.max(-10, Math.min(10, dragOffset.x * 0.045));
      return {
        transform: `translate3d(${dragOffset.x}px, ${dragOffset.y}px, 0) rotate(${rotate}deg)`,
        transition: 'none',
      };
    }
    return {
      transform: enterAnimation
        ? 'scale(0.97) translateY(5px)'
        : 'translate3d(0, 0, 0) rotate(0deg) scale(1)',
      opacity: 1,
      transition: 'transform 240ms cubic-bezier(0.22, 1, 0.36, 1), opacity 200ms ease-out',
    };
  };

  const swipeFeedbackIntensity = Math.min(1, Math.abs(dragOffset.x) / 90);
  const swipeFeedbackType: 'correct' | 'incorrect' | null =
    dragOffset.x > 25 ? 'correct' : dragOffset.x < -25 ? 'incorrect' : null;

  const progressPercentage =
    activeDeck.length > 0 ? Math.round((currentIndex / activeDeck.length) * 100) : 0;

  // ==========================================================================
  // LANDINGSPAGINA: KIES EEN FLASHCARD-SET
  // ==========================================================================
  if (!activeSetId) {
    return (
      <div className="w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col bg-slate-100 text-slate-900 select-none overflow-y-auto">
        <div className="max-w-2xl w-full mx-auto px-3 sm:px-6 py-3 sm:py-5 flex flex-col gap-2.5">
          <div className="px-1">
            <h1 className="text-base sm:text-lg font-extrabold text-slate-900">
              Kies een flashcard-set
            </h1>
          </div>

          <div className="grid grid-cols-1 gap-2 pb-4">
            {FLASHCARD_SETS.map((set) => {
              const setRes = progressBySet[set.id]?.results || {};
              const correctCount = set.cards.filter((c) => setRes[c.id] === 'correct').length;
              const incorrectCount = set.cards.filter((c) => setRes[c.id] === 'incorrect').length;
              const answeredCount = correctCount + incorrectCount;
              const pct =
                set.cards.length > 0 ? Math.round((answeredCount / set.cards.length) * 100) : 0;

              return (
                <button
                  key={set.id}
                  type="button"
                  onClick={() => handleSelectSet(set.id)}
                  className="group w-full text-left bg-white hover:bg-blue-50/50 active:scale-[0.99] border border-slate-200 hover:border-blue-300 rounded-2xl px-3.5 py-3 shadow-2xs transition flex flex-col gap-2"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-xs sm:text-sm font-bold text-slate-900 group-hover:text-blue-900 truncate">
                      {set.title}
                    </span>

                    <div className="flex items-center gap-1.5 shrink-0">
                      {correctCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">
                          {correctCount}
                        </span>
                      )}
                      {incorrectCount > 0 && (
                        <span className="px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 text-[11px] font-extrabold">
                          {incorrectCount}
                        </span>
                      )}
                      <span className="px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 text-[11px] font-semibold">
                        {set.cards.length}
                      </span>
                      <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-600 transition-transform group-hover:translate-x-0.5" />
                    </div>
                  </div>

                  {answeredCount > 0 && (
                    <div className="w-full h-1 bg-slate-100 rounded-full overflow-hidden flex">
                      <div
                        className="h-full bg-emerald-500 transition-all"
                        style={{
                          width: `${Math.round((correctCount / set.cards.length) * 100)}%`,
                        }}
                      />
                      <div
                        className="h-full bg-rose-500 transition-all"
                        style={{
                          width: `${Math.round((incorrectCount / set.cards.length) * 100)}%`,
                        }}
                      />
                      {pct === 0 && <div className="h-full w-0" />}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // ==========================================================================
  // ACTIEVE FLASHCARD-SET
  // ==========================================================================
  return (
    <div className="w-full h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] flex flex-col bg-slate-100 text-slate-900 select-none overflow-hidden">
      <div className="flex-1 min-h-0 max-w-2xl w-full mx-auto px-3 sm:px-6 py-2 sm:py-3 flex flex-col justify-between gap-2">
        {/* BOVENBALK: Terug naar overzicht + Hoofdstuk-dropdown + acties (shrink-0) */}
        <div className="shrink-0 flex flex-col gap-1.5">
          <div className="flex items-center gap-1.5">
            {/* Knop terug naar landingspagina (Overzicht alle sets) */}
            <button
              type="button"
              onClick={handleBackToLanding}
              className="shrink-0 w-9 h-9 rounded-xl bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 active:scale-95 transition flex items-center justify-center shadow-2xs"
              title="Alle sets"
            >
              <LayoutGrid className="w-4 h-4" />
            </button>

            {/* Gecombineerde Hoofdstuk-dropdown */}
            <div className="relative flex-1 min-w-0">
              <button
                type="button"
                onClick={() => setIsDropdownOpen((o) => !o)}
                className="w-full h-9 px-3 bg-white hover:bg-slate-50 border border-slate-200 rounded-xl shadow-2xs flex items-center justify-between gap-2 text-xs sm:text-sm font-bold text-slate-900 transition"
              >
                <span className="truncate">{activeSet.title}</span>
                <ChevronDown
                  className={`w-4 h-4 text-slate-500 shrink-0 transition-transform ${
                    isDropdownOpen ? 'rotate-180' : ''
                  }`}
                />
              </button>

              {isDropdownOpen && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setIsDropdownOpen(false)}
                  />
                  <div className="absolute left-0 right-0 top-full mt-1 z-40 bg-white border border-slate-200 rounded-2xl shadow-xl max-h-[65dvh] overflow-y-auto p-1.5 space-y-1">
                    {FLASHCARD_SETS.map((set) => {
                      const isSelected = set.id === activeSet.id;
                      const setRes = progressBySet[set.id]?.results || {};
                      const correctCount = set.cards.filter(
                        (c) => setRes[c.id] === 'correct'
                      ).length;
                      const incorrectCount = set.cards.filter(
                        (c) => setRes[c.id] === 'incorrect'
                      ).length;

                      return (
                        <button
                          key={set.id}
                          type="button"
                          onClick={() => handleSelectSet(set.id)}
                          className={`w-full text-left px-3 py-2 rounded-xl flex items-center justify-between gap-2 text-xs font-bold transition ${
                            isSelected
                              ? 'bg-blue-50 text-blue-900 ring-1 ring-blue-300'
                              : 'text-slate-700 hover:bg-slate-100'
                          }`}
                        >
                          <span className="truncate">{set.title}</span>
                          <div className="flex items-center gap-1.5 shrink-0">
                            {correctCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-emerald-100 text-emerald-700 text-[11px] font-extrabold">
                                {correctCount}
                              </span>
                            )}
                            {incorrectCount > 0 && (
                              <span className="px-1.5 py-0.5 rounded-md bg-rose-100 text-rose-700 text-[11px] font-extrabold">
                                {incorrectCount}
                              </span>
                            )}
                            <span className="px-1.5 py-0.5 rounded-md bg-slate-100 text-slate-500 text-[11px] font-semibold">
                              {set.cards.length}
                            </span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </>
              )}
            </div>

            {/* Minimalistische icoonknoppen: Foute herhalen, Shuffle, Reset */}
            {stats.allSetIncorrectIds.length > 0 && !isFinished && (
              <button
                type="button"
                onClick={handleRetryIncorrect}
                className="shrink-0 h-9 px-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 active:scale-95 transition flex items-center gap-1 text-xs font-extrabold"
                title="Alleen foute kaarten"
              >
                <Repeat className="w-3.5 h-3.5" />
                <span>{stats.allSetIncorrectIds.length}</span>
              </button>
            )}
            <button
              type="button"
              onClick={handleShuffleRemaining}
              className="shrink-0 w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:scale-95 transition flex items-center justify-center shadow-2xs"
              title="Hussel"
            >
              <Shuffle className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => handleRestartFullSet(false)}
              className="shrink-0 w-9 h-9 rounded-xl bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 active:scale-95 transition flex items-center justify-center shadow-2xs"
              title="Reset"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          </div>

          {/* Minimalistische score- & tellerrij + geïntegreerde voortgangslijn */}
          <div className="flex items-center justify-between gap-3 px-0.5">
            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-rose-100 text-rose-700 font-extrabold text-[11px]">
              {stats.roundIncorrect}
            </span>

            <div className="flex-1 flex flex-col items-center gap-1 max-w-xs">
              <span className="text-[11px] font-bold text-slate-500 leading-none">
                {isFinished
                  ? `${activeDeck.length} / ${activeDeck.length}`
                  : `${currentIndex + 1} / ${activeDeck.length}`}
                {isRetryMode ? ' • ↻' : ''}
              </span>
              <div className="w-full h-1 bg-slate-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-600 transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>

            <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 font-extrabold text-[11px]">
              {stats.roundCorrect}
            </span>
          </div>
        </div>

        {/* MIDDEN: De Flipcard (flex-1 min-h-0 zodat deze ALTIJD exact past op elk schermformaat) */}
        {!isFinished && currentCard ? (
          <div className="relative flex-1 min-h-0 w-full flex flex-col items-center justify-center py-0.5">
            {nextCardPreview && (
              <div
                aria-hidden="true"
                className="absolute inset-x-3 sm:inset-x-5 top-2 bottom-0 rounded-3xl bg-white/75 border border-slate-200/80 shadow-2xs pointer-events-none transform translate-y-1.5 scale-[0.97]"
              />
            )}

            <div
              style={getCardTransformStyle()}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              onTouchEnd={handleTouchEnd}
              className="relative w-full h-full flex-1 min-h-0 flex flex-col z-10"
            >
              {/* Kleur-indicator bij swipen (enkel icoon + kleur) */}
              {swipeFeedbackType && (
                <div
                  style={{ opacity: swipeFeedbackIntensity }}
                  className={`pointer-events-none absolute top-3.5 z-30 w-9 h-9 rounded-2xl flex items-center justify-center shadow-md ${
                    swipeFeedbackType === 'correct'
                      ? 'left-3.5 bg-emerald-500 text-white'
                      : 'right-3.5 bg-rose-500 text-white'
                  }`}
                >
                  {swipeFeedbackType === 'correct' ? (
                    <Check className="w-5 h-5 stroke-[3]" />
                  ) : (
                    <X className="w-5 h-5 stroke-[3]" />
                  )}
                </div>
              )}

              <div
                style={{ perspective: '1400px' }}
                className="w-full h-full flex-1 min-h-0 flex flex-col cursor-pointer"
                onClick={() => {
                  if (Math.abs(dragOffset.x) < 8) {
                    setIsFlipped((f) => !f);
                  }
                }}
              >
                <div
                  style={{
                    transformStyle: 'preserve-3d',
                    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
                    transition: 'transform 0.5s cubic-bezier(0.22, 1, 0.36, 1)',
                  }}
                  className="relative w-full h-full flex-1 min-h-0 rounded-3xl shadow-md border border-slate-200/90 bg-white"
                >
                  {/* VOORKANT (VRAAG) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                    }}
                    className="absolute inset-0 rounded-3xl bg-white p-3.5 sm:p-6 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="flex items-center justify-between shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-100 text-slate-600 truncate max-w-full">
                        {currentCard.categoryLabel}
                      </span>
                    </div>

                    <div className="flex-1 min-h-0 py-2 flex flex-col items-center justify-center gap-2.5 text-center overflow-y-auto">
                      <p
                        className={`font-bold text-slate-900 leading-snug whitespace-pre-line shrink-0 ${
                          currentCard.imageUrl
                            ? 'text-xs sm:text-base max-w-xl'
                            : 'text-sm sm:text-xl max-w-xl'
                        }`}
                      >
                        {currentCard.question}
                      </p>

                      {currentCard.imageUrl && (
                        <div className="relative flex-1 min-h-[110px] max-h-52 sm:max-h-64 w-full max-w-md mx-auto flex items-center justify-center bg-slate-50 border border-slate-200/80 rounded-2xl p-1.5 overflow-hidden">
                          <img
                            src={currentCard.imageUrl}
                            alt=""
                            className="max-h-full max-w-full w-auto h-auto object-contain rounded-xl select-none"
                            draggable={false}
                          />
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              setZoomedImage(currentCard.imageUrl!);
                            }}
                            className="absolute bottom-1.5 right-1.5 w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-900/80 text-white flex items-center justify-center shadow-sm hover:bg-slate-900 active:scale-95 transition"
                            title="Vergroot"
                          >
                            <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* ACHTERKANT (ANTWOORD) */}
                  <div
                    style={{
                      backfaceVisibility: 'hidden',
                      WebkitBackfaceVisibility: 'hidden',
                      transform: 'rotateY(180deg)',
                    }}
                    className="absolute inset-0 rounded-3xl bg-slate-900 text-white p-4 sm:p-6 flex flex-col justify-between overflow-hidden"
                  >
                    <div className="flex items-center justify-between shrink-0">
                      <span className="px-2.5 py-0.5 rounded-full text-[11px] font-bold bg-slate-800 text-slate-300 truncate">
                        {currentCard.categoryLabel}
                      </span>
                      {currentCard.imageUrl && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            setZoomedImage(currentCard.imageUrl!);
                          }}
                          className="w-7 h-7 sm:w-8 sm:h-8 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 flex items-center justify-center transition shrink-0"
                          title="Figuur"
                        >
                          <ZoomIn className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 min-h-0 py-2 flex items-center justify-center overflow-y-auto">
                      <p className="text-xs sm:text-base md:text-lg font-semibold text-white leading-relaxed whitespace-pre-line text-left max-w-xl my-auto">
                        {currentCard.answer}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* EINDSCHERM (MINIMALISTISCH) */
          <div className="flex-1 min-h-0 flex flex-col items-center justify-center">
            <div className="w-full bg-white rounded-3xl border border-slate-200 shadow-md p-5 sm:p-8 text-center flex flex-col items-center gap-4">
              <div className="grid grid-cols-3 gap-2.5 w-full max-w-sm">
                <div className="bg-emerald-50 border border-emerald-200 rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-emerald-700">
                    {stats.roundCorrect}
                  </span>
                </div>
                <div className="bg-rose-50 border border-rose-200 rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-rose-700">
                    {stats.roundIncorrect}
                  </span>
                </div>
                <div className="bg-blue-50 border border-blue-200 rounded-2xl py-3 px-2 flex flex-col items-center justify-center">
                  <span className="text-xl sm:text-2xl font-black text-blue-700">
                    {activeDeck.length > 0
                      ? Math.round((stats.roundCorrect / activeDeck.length) * 100)
                      : 100}
                    %
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 w-full max-w-sm">
                {stats.allSetIncorrectIds.length > 0 && (
                  <button
                    type="button"
                    onClick={handleRetryIncorrect}
                    className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-98 transition"
                  >
                    <Repeat className="w-4 h-4" />
                    <span>Foute ({stats.allSetIncorrectIds.length})</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={() => handleRestartFullSet(false)}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm shadow-xs flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Opnieuw</span>
                </button>

                <button
                  type="button"
                  onClick={handleBackToLanding}
                  className="w-full sm:flex-1 py-3 px-4 rounded-2xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-extrabold text-sm flex items-center justify-center gap-2 active:scale-98 transition"
                >
                  <LayoutGrid className="w-4 h-4" />
                  <span>Sets</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ONDERBALK: Alleen Vorige, Rood (Fout) en Groen (Goed) (shrink-0, altijd in beeld) */}
        {!isFinished && currentCard && (
          <div className="shrink-0 grid grid-cols-11 gap-2 items-center pt-0.5 pb-1">
            <button
              type="button"
              onClick={handlePrevCard}
              disabled={currentIndex === 0}
              className={`col-span-2 h-11 rounded-2xl border flex items-center justify-center transition ${
                currentIndex === 0
                  ? 'bg-slate-100 text-slate-300 border-slate-200 cursor-not-allowed'
                  : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50 active:scale-95 shadow-2xs'
              }`}
              title="Vorige"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            <button
              type="button"
              onClick={() => handleGradeCard('incorrect')}
              className="col-span-4 h-11 rounded-2xl bg-rose-50 hover:bg-rose-100 text-rose-600 border-2 border-rose-200 font-extrabold flex items-center justify-center shadow-2xs active:scale-95 transition"
              title="Fout"
            >
              <X className="w-5 h-5 stroke-[2.75]" />
            </button>

            <button
              type="button"
              onClick={() => handleGradeCard('correct')}
              className="col-span-5 h-11 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white border-2 border-emerald-600 font-extrabold flex items-center justify-center shadow-xs active:scale-95 transition"
              title="Goed"
            >
              <Check className="w-5 h-5 stroke-[2.75]" />
            </button>
          </div>
        )}
      </div>

      {/* LIGHTBOX MODAL VOOR AFBEELDING */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[100] bg-slate-950/90 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-3xl p-3 sm:p-4 shadow-2xl flex flex-col items-center"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              type="button"
              onClick={() => setZoomedImage(null)}
              className="self-end mb-2 p-1.5 rounded-xl bg-slate-900 text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
            <div className="w-full max-h-[78dvh] overflow-auto flex items-center justify-center bg-slate-50 rounded-2xl p-2">
              <img
                src={zoomedImage}
                alt=""
                className="max-h-[74dvh] w-auto object-contain rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
