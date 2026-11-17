import React, { useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  LIGAMENT_SECTIONS,
  LIGAMENT_SYNOVIAL_QUESTIONS,
  LigamentCategoryId,
  LigamentSynovialQuestion,
} from '../../data/ligamentsSynovialData';
import { validateAnatomicalAnswer, AnswerValidationResult } from '../../utils/answerMatching';
import {
  BookOpen,
  ListChecks,
  Eye,
  EyeOff,
  ZoomIn,
  X,
  CheckCircle2,
  XCircle,
  Shuffle,
  RotateCcw,
  ChevronRight,
  ChevronLeft,
} from 'lucide-react';

type ViewMode = 'learn' | 'test';
type TestCategoryFilter = LigamentCategoryId | 'all';
type QuestionInputMode = 'mc' | 'open';

function resolveAssetUrl(url?: string): string | undefined {
  if (!url) return undefined;
  if (url.startsWith('http://') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }
  const base = import.meta.env.BASE_URL || '/';
  return `${base.replace(/\/$/, '')}/${url.replace(/^\//, '')}`;
}

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const LigamentsSynovialView: React.FC = () => {
  const [mode, setMode] = useState<ViewMode>('learn');

  // Leren-state
  const [selectedLearnCategory, setSelectedLearnCategory] = useState<LigamentCategoryId>('genus');
  const [hideAnswers, setHideAnswers] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [activeNumber, setActiveNumber] = useState<number | null>(null);
  const [zoomedImage, setZoomedImage] = useState<{ url: string; caption: string } | null>(null);

  // Testen-state
  const [testCategory, setTestCategory] = useState<TestCategoryFilter>('all');
  const [questionFormat, setQuestionFormat] = useState<'mixed' | QuestionInputMode>('mc');
  const [shuffledDeck, setShuffledDeck] = useState<LigamentSynovialQuestion[]>(() =>
    shuffleArray(LIGAMENT_SYNOVIAL_QUESTIONS)
  );
  const [currentIdx, setCurrentIdx] = useState(0);
  const [currentInputFormat, setCurrentInputFormat] = useState<QuestionInputMode>('mc');
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [openInput, setOpenInput] = useState('');
  const [openResult, setOpenResult] = useState<AnswerValidationResult | null>(null);
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [correctCount, setCorrectCount] = useState(0);
  const [incorrectCount, setIncorrectCount] = useState(0);
  const [wrongQuestions, setWrongQuestions] = useState<LigamentSynovialQuestion[]>([]);

  const activeLearnSection = useMemo(
    () => LIGAMENT_SECTIONS.find((s) => s.id === selectedLearnCategory) || LIGAMENT_SECTIONS[0],
    [selectedLearnCategory]
  );

  const toggleRevealItem = (key: string) => {
    setRevealedKeys((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const resetTestSession = useCallback(
    (category: TestCategoryFilter, format: 'mixed' | QuestionInputMode, customList?: LigamentSynovialQuestion[]) => {
      const pool = customList
        ? customList
        : category === 'all'
        ? LIGAMENT_SYNOVIAL_QUESTIONS
        : LIGAMENT_SYNOVIAL_QUESTIONS.filter((q) => q.category === category);
      const deck = shuffleArray(pool);
      setShuffledDeck(deck);
      setCurrentIdx(0);
      setSelectedOption(null);
      setOpenInput('');
      setOpenResult(null);
      setIsEvaluated(false);
      setIsCorrect(false);
      if (!customList) {
        setCorrectCount(0);
        setIncorrectCount(0);
        setWrongQuestions([]);
      }
      if (format === 'mixed') {
        setCurrentInputFormat(Math.random() < 0.5 ? 'mc' : 'open');
      } else {
        setCurrentInputFormat(format);
      }
    },
    []
  );

  const currentQuestion: LigamentSynovialQuestion | undefined = shuffledDeck[currentIdx];
  const isFinished = shuffledDeck.length > 0 && currentIdx >= shuffledDeck.length;

  const shuffledOptions = useMemo(() => {
    if (!currentQuestion) return [];
    return shuffleArray(currentQuestion.options);
  }, [currentQuestion]);

  const handleSelectOption = (option: string) => {
    if (isEvaluated || !currentQuestion) return;
    setSelectedOption(option);
    const success = option === currentQuestion.correctAnswer;
    setIsEvaluated(true);
    setIsCorrect(success);
    if (success) {
      setCorrectCount((c) => c + 1);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
      } catch {}
    } else {
      setIncorrectCount((c) => c + 1);
      setWrongQuestions((prev) =>
        prev.some((w) => w.id === currentQuestion.id) ? prev : [...prev, currentQuestion]
      );
    }
  };

  const handleOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isEvaluated || !currentQuestion || !openInput.trim()) return;
    const res = validateAnatomicalAnswer(
      openInput,
      currentQuestion.correctAnswer,
      currentQuestion.acceptableAnswers
    );
    setOpenResult(res);
    setIsEvaluated(true);
    setIsCorrect(res.isCorrect);
    if (res.isCorrect) {
      setCorrectCount((c) => c + 1);
      try {
        confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
      } catch {}
    } else {
      setIncorrectCount((c) => c + 1);
      setWrongQuestions((prev) =>
        prev.some((w) => w.id === currentQuestion.id) ? prev : [...prev, currentQuestion]
      );
    }
  };

  const handleNextQuestion = () => {
    setCurrentIdx((idx) => idx + 1);
    setSelectedOption(null);
    setOpenInput('');
    setOpenResult(null);
    setIsEvaluated(false);
    setIsCorrect(false);
    if (questionFormat === 'mixed') {
      setCurrentInputFormat(Math.random() < 0.5 ? 'mc' : 'open');
    } else {
      setCurrentInputFormat(questionFormat);
    }
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4">
      {/* Compacte topbalk: Titel links, Leren/Testen switcher rechts */}
      <div className="bg-white rounded-2xl border border-clinical-200/90 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-clinical-950 tracking-tight">
            Ligamenten, Synoviaal Gewricht, Richtingen & Assen
          </h1>
          <p className="text-xs text-clinical-500">
            Moduulboek & reader-overzicht (art. genus, art. pedis, synoviaal, vertebrae, richtingen & assen)
          </p>
        </div>

        <div className="flex items-center bg-clinical-100 p-1 rounded-xl border border-clinical-200 gap-1">
          <button
            type="button"
            onClick={() => setMode('learn')}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'learn'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-clinical-700 hover:text-clinical-950 hover:bg-white/60'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Leren</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setMode('test');
              resetTestSession(testCategory, questionFormat);
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'test'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-clinical-700 hover:text-clinical-950 hover:bg-white/60'
            }`}
          >
            <ListChecks className="w-3.5 h-3.5" />
            <span>Testen</span>
          </button>
        </div>
      </div>

      {/* ============================================================ */}
      {/* MODUS 1: LEREN                                               */}
      {/* ============================================================ */}
      {mode === 'learn' && (
        <div className="flex flex-col gap-4">
          {/* Categorie tabs & Zelf-overhoor toggle */}
          <div className="flex flex-wrap items-center justify-between gap-2 bg-white rounded-2xl border border-clinical-200/90 shadow-xs p-2.5">
            <div className="flex flex-wrap items-center gap-1.5">
              {LIGAMENT_SECTIONS.map((sec) => {
                const isActive = sec.id === activeLearnSection.id;
                return (
                  <button
                    key={sec.id}
                    type="button"
                    onClick={() => {
                      setSelectedLearnCategory(sec.id);
                      setActiveNumber(null);
                      setRevealedKeys({});
                    }}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'bg-clinical-50 text-clinical-700 hover:bg-clinical-100 border border-clinical-200/70'
                    }`}
                  >
                    {sec.shortTitle}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              onClick={() => {
                setHideAnswers((prev) => !prev);
                setRevealedKeys({});
              }}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold flex items-center gap-1.5 border transition ${
                hideAnswers
                  ? 'bg-amber-50 text-amber-900 border-amber-300'
                  : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
              }`}
            >
              {hideAnswers ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
              <span>{hideAnswers ? 'Toon alle antwoorden' : 'Verberg antwoorden'}</span>
            </button>
          </div>

          {/* Hoofdinhoud: Afbeeldingen links, Structurenlijst rechts */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
            {/* Reader-screenshots */}
            <div className="lg:col-span-6 bg-white rounded-2xl border border-clinical-200/90 shadow-sm p-3.5 sm:p-4 space-y-3 lg:sticky lg:top-20">
              <div className="flex items-center justify-between gap-2 border-b border-clinical-100 pb-2">
                <div>
                  <h2 className="text-sm font-black text-clinical-900">{activeLearnSection.title}</h2>
                  <p className="text-[11px] text-clinical-500">{activeLearnSection.subtitle}</p>
                </div>
              </div>

              {activeLearnSection.generalInfo && (
                <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200/80 rounded-xl p-2.5 leading-relaxed">
                  {activeLearnSection.generalInfo}
                </p>
              )}

              <div className="space-y-3">
                {activeLearnSection.images.map((img, i) => {
                  const resolved = resolveAssetUrl(img.imageUrl) || img.imageUrl;
                  return (
                    <div
                      key={i}
                      className="rounded-xl border border-slate-200 bg-slate-50/70 p-2 space-y-1.5"
                    >
                      <button
                        type="button"
                        onClick={() => setZoomedImage({ url: resolved, caption: img.caption })}
                        className="w-full relative group block rounded-lg overflow-hidden bg-white cursor-zoom-in"
                        title="Klik om te vergroten"
                      >
                        <img
                          src={resolved}
                          alt={img.caption}
                          className="w-full h-auto max-h-[340px] object-contain mx-auto"
                        />
                        <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white opacity-80 group-hover:opacity-100 transition">
                          <ZoomIn className="w-3.5 h-3.5" />
                        </span>
                      </button>
                      <div className="text-[11px] font-semibold text-slate-600 text-center">
                        {img.caption}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Nummer snel-kiezer */}
              {activeLearnSection.items.some((it) => typeof it.number === 'number') && (
                <div className="pt-1 flex flex-wrap items-center gap-1.5">
                  <span className="text-[11px] font-bold text-slate-500 mr-1">Nummer:</span>
                  {activeLearnSection.items
                    .filter((it) => typeof it.number === 'number')
                    .map((it) => (
                      <button
                        key={it.number}
                        type="button"
                        onClick={() =>
                          setActiveNumber((prev) => (prev === it.number ? null : it.number!))
                        }
                        className={`w-7 h-7 rounded-lg text-xs font-black transition ${
                          activeNumber === it.number
                            ? 'bg-blue-600 text-white shadow-xs'
                            : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                        }`}
                      >
                        {it.number}
                      </button>
                    ))}
                </div>
              )}
            </div>

            {/* Structuren en functies */}
            <div className="lg:col-span-6 space-y-2.5">
              {activeLearnSection.items.map((item, idx) => {
                const itemKey = `${activeLearnSection.id}-${idx}`;
                const isRevealed = !hideAnswers || Boolean(revealedKeys[itemKey]);
                const isHighlighted =
                  activeNumber !== null && item.number === activeNumber;

                return (
                  <div
                    key={itemKey}
                    onClick={() => {
                      if (hideAnswers) toggleRevealItem(itemKey);
                      if (typeof item.number === 'number') {
                        setActiveNumber(item.number);
                      }
                    }}
                    className={`bg-white rounded-2xl border p-3.5 transition ${
                      isHighlighted
                        ? 'border-blue-500 ring-2 ring-blue-200 shadow-sm'
                        : 'border-clinical-200/90 shadow-2xs hover:border-clinical-300'
                    } ${hideAnswers ? 'cursor-pointer select-none' : ''}`}
                  >
                    <div className="flex items-start gap-3">
                      {typeof item.number === 'number' && (
                        <span
                          className={`w-7 h-7 rounded-lg text-xs font-black flex items-center justify-center shrink-0 mt-0.5 ${
                            isHighlighted
                              ? 'bg-blue-600 text-white'
                              : 'bg-blue-50 text-blue-800 border border-blue-200'
                          }`}
                        >
                          {item.number}
                        </span>
                      )}
                      <div className="flex-1 min-w-0">
                        {isRevealed ? (
                          <>
                            <div className="flex flex-wrap items-baseline justify-between gap-2">
                              <h3 className="text-sm font-black text-clinical-950">{item.name}</h3>
                              {item.location && (
                                <span className="text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                                  {item.location}
                                </span>
                              )}
                            </div>
                            {item.altName && (
                              <div className="text-[11px] font-medium text-slate-500 mt-0.5">
                                {item.altName}
                              </div>
                            )}
                            <p className="text-xs text-slate-700 mt-1.5 leading-relaxed">
                              {item.functionText}
                            </p>
                          </>
                        ) : (
                          <div className="flex items-center justify-between py-1 text-xs font-semibold text-slate-400">
                            <span>Tik of klik om het antwoord voor nr. {item.number ?? idx + 1} te tonen</span>
                            <Eye className="w-4 h-4 text-slate-400 shrink-0" />
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODUS 2: TESTEN                                              */}
      {/* ============================================================ */}
      {mode === 'test' && (
        <div className="flex flex-col gap-4">
          {/* Testopties & Score */}
          <div className="bg-white rounded-2xl border border-clinical-200/90 shadow-xs p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-1.5">
              {(
                [
                  { id: 'all', label: 'Alles (Mix)' },
                  { id: 'genus', label: 'Art. genus' },
                  { id: 'pedis', label: 'Art. pedis' },
                  { id: 'synovial_opbouw', label: 'Opbouw (1–12)' },
                  { id: 'synovial_typen', label: 'Gewrichtstypen' },
                  { id: 'vertebrae', label: 'Vertebrae (1–8)' },
                  { id: 'richtingen', label: 'Richtingen' },
                  { id: 'assen_vlakken', label: 'Assen & Vlakken' },
                ] as const
              ).map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => {
                    setTestCategory(cat.id);
                    resetTestSession(cat.id, questionFormat);
                  }}
                  className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition ${
                    testCategory === cat.id
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-clinical-50 text-clinical-700 hover:bg-clinical-100 border border-clinical-200/70'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                {(
                  [
                    { id: 'mc', label: 'Meerkeuze' },
                    { id: 'open', label: 'Open' },
                    { id: 'mixed', label: 'Mix' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setQuestionFormat(fmt.id);
                      resetTestSession(testCategory, fmt.id);
                    }}
                    className={`px-2.5 py-1 rounded-md transition ${
                      questionFormat === fmt.id
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>

              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold">
                <span className="text-emerald-600">{correctCount} goed</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600">{incorrectCount} fout</span>
              </div>

              <button
                type="button"
                onClick={() => resetTestSession(testCategory, questionFormat)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                title="Opnieuw beginnen & husselen"
              >
                <Shuffle className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Einde van de ronde */}
          {isFinished ? (
            <div className="bg-white rounded-3xl border border-clinical-200 shadow-sm p-6 sm:p-8 text-center max-w-xl mx-auto w-full space-y-4">
              <h2 className="text-xl font-black text-clinical-950">Ronde afgerond</h2>
              <p className="text-sm text-slate-600">
                Score: <strong className="text-emerald-700">{correctCount} goed</strong> en{' '}
                <strong className="text-rose-600">{incorrectCount} fout</strong> (totaal{' '}
                {shuffledDeck.length} vragen).
              </p>
              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {wrongQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() => resetTestSession(testCategory, questionFormat, wrongQuestions)}
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Oefen {wrongQuestions.length} foute opnieuw</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => resetTestSession(testCategory, questionFormat)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <Shuffle className="w-3.5 h-3.5" />
                  <span>Nieuwe volledige ronde</span>
                </button>
              </div>
            </div>
          ) : currentQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Afbeelding bij vraag (indien beschikbaar) */}
              {currentQuestion.imageUrl && (
                <div className="lg:col-span-6 bg-white rounded-2xl border border-clinical-200/90 shadow-sm p-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      setZoomedImage({
                        url: resolveAssetUrl(currentQuestion.imageUrl) || currentQuestion.imageUrl!,
                        caption: currentQuestion.question,
                      })
                    }
                    className="w-full relative group block rounded-xl overflow-hidden bg-white cursor-zoom-in"
                    title="Klik om te vergroten"
                  >
                    <img
                      src={resolveAssetUrl(currentQuestion.imageUrl)}
                      alt={currentQuestion.question}
                      className="w-full h-auto max-h-[380px] object-contain mx-auto"
                    />
                    <span className="absolute top-2 right-2 p-1.5 rounded-lg bg-slate-900/70 text-white opacity-80 group-hover:opacity-100 transition">
                      <ZoomIn className="w-3.5 h-3.5" />
                    </span>
                  </button>
                </div>
              )}

              {/* Vraagkaart */}
              <div
                className={`${
                  currentQuestion.imageUrl ? 'lg:col-span-6' : 'lg:col-span-12 max-w-2xl mx-auto w-full'
                } bg-white rounded-2xl border border-clinical-200/90 shadow-sm p-4 sm:p-5 space-y-4`}
              >
                <div className="flex items-center justify-between text-xs">
                  <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                    Vraag {currentIdx + 1} van {shuffledDeck.length}
                  </span>
                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={currentIdx === 0}
                      onClick={() => {
                        if (currentIdx > 0) {
                          setCurrentIdx((i) => i - 1);
                          setSelectedOption(null);
                          setOpenInput('');
                          setOpenResult(null);
                          setIsEvaluated(false);
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                      title="Vorige vraag"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="Sla over / volgende"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-black text-clinical-950 leading-snug">
                  {currentQuestion.question}
                </h2>

                {currentInputFormat === 'mc' ? (
                  <div className="space-y-2">
                    {shuffledOptions.map((opt, i) => {
                      const isPicked = selectedOption === opt;
                      const isRightOption = opt === currentQuestion.correctAnswer;
                      let btnStyle =
                        'border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-slate-800';
                      if (isEvaluated) {
                        if (isRightOption) {
                          btnStyle = 'border-emerald-500 bg-emerald-50 text-emerald-950 font-bold';
                        } else if (isPicked && !isRightOption) {
                          btnStyle = 'border-rose-500 bg-rose-50 text-rose-950';
                        } else {
                          btnStyle = 'border-slate-200 bg-slate-50 text-slate-400';
                        }
                      }

                      return (
                        <button
                          key={opt}
                          type="button"
                          disabled={isEvaluated}
                          onClick={() => handleSelectOption(opt)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {isEvaluated && isRightOption && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {isEvaluated && isPicked && !isRightOption && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <form onSubmit={handleOpenSubmit} className="space-y-2.5">
                    <input
                      type="text"
                      value={openInput}
                      onChange={(e) => setOpenInput(e.target.value)}
                      disabled={isEvaluated}
                      placeholder="Typ de Latijnse of Nederlandse benaming..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-900"
                    />
                    {!isEvaluated && (
                      <button
                        type="submit"
                        disabled={!openInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-xs"
                      >
                        Controleer antwoord
                      </button>
                    )}
                  </form>
                )}

                {isEvaluated && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      isCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        {isCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>Goed!</span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Niet helemaal — Juiste antwoord: {currentQuestion.correctAnswer}</span>
                          </>
                        )}
                      </span>
                    </div>
                    {openResult?.feedbackNote && (
                      <p className="text-xs font-semibold text-blue-900">{openResult.feedbackNote}</p>
                    )}
                    <p className="text-xs leading-relaxed opacity-90">{currentQuestion.explanation}</p>
                    <button
                      type="button"
                      onClick={handleNextQuestion}
                      className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition mt-1"
                    >
                      <span>Volgende vraag</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>
            </div>
          ) : null}
        </div>
      )}

      {/* Lightbox voor vergrote afbeelding */}
      {zoomedImage && (
        <div
          className="fixed inset-0 z-[110] bg-slate-950/85 backdrop-blur-xs flex items-center justify-center p-3 sm:p-6"
          onClick={() => setZoomedImage(null)}
        >
          <div
            className="relative max-w-4xl w-full bg-white rounded-2xl p-3 sm:p-4 shadow-2xl space-y-2"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between gap-2 pb-1 border-b border-slate-100">
              <span className="text-xs font-bold text-slate-700 truncate">{zoomedImage.caption}</span>
              <button
                type="button"
                onClick={() => setZoomedImage(null)}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition"
                aria-label="Sluit afbeelding"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <img
              src={zoomedImage.url}
              alt={zoomedImage.caption}
              className="w-full max-h-[80vh] object-contain mx-auto"
            />
          </div>
        </div>
      )}
    </div>
  );
};
