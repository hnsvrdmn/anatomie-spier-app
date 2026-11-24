import React, { useState, useMemo, useCallback } from 'react';
import confetti from 'canvas-confetti';
import {
  LIGAMENT_SECTIONS,
  LIGAMENT_SYNOVIAL_QUESTIONS,
  LigamentCategoryId,
  LigamentSynovialQuestion,
} from '../../data/ligamentsSynovialData';
import {
  PROEFTOETS_QUESTIONS,
  PROEFTOETS_TOPIC_LABELS,
  ProeftoetsQuestion,
  ProeftoetsTopicId,
} from '../../data/proeftoetsData';
import { validateAnatomicalAnswer, AnswerValidationResult } from '../../utils/answerMatching';
import {
  BookOpen,
  ListChecks,
  GraduationCap,
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
  Check,
  Award,
} from 'lucide-react';

type ViewMode = 'learn' | 'test' | 'exam';
type TestCategoryFilter = LigamentCategoryId | 'all';
type ExamTopicFilter = ProeftoetsTopicId | 'all';
type QuestionInputMode = 'mc' | 'open';

function pickQuestionFormat(format: 'mixed' | QuestionInputMode): QuestionInputMode {
  return format === 'mixed' ? (Math.random() < 0.5 ? 'mc' : 'open') : format;
}

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

  // Uitgebreide Proeftoets (60 vragen) state
  const [examTopic, setExamTopic] = useState<ExamTopicFilter>('all');
  const [examFormat, setExamFormat] = useState<'mixed' | QuestionInputMode>('open');
  const [examDeck, setExamDeck] = useState<ProeftoetsQuestion[]>(() => [...PROEFTOETS_QUESTIONS]);
  const [examIdx, setExamIdx] = useState(0);
  const [examCurrentFormat, setExamCurrentFormat] = useState<QuestionInputMode>('open');
  const [examSelectedOption, setExamSelectedOption] = useState<string | null>(null);
  const [examOpenInput, setExamOpenInput] = useState('');
  const [examOpenResult, setExamOpenResult] = useState<AnswerValidationResult | null>(null);
  const [examEvaluated, setExamEvaluated] = useState(false);
  const [examIsCorrect, setExamIsCorrect] = useState(false);
  const [examForcedCorrect, setExamForcedCorrect] = useState(false);
  const [examFinishEarly, setExamFinishEarly] = useState(false);
  const [examCorrectCount, setExamCorrectCount] = useState(0);
  const [examIncorrectCount, setExamIncorrectCount] = useState(0);
  const [examWrongQuestions, setExamWrongQuestions] = useState<ProeftoetsQuestion[]>([]);
  const [examTopicStats, setExamTopicStats] = useState<
    Partial<Record<ProeftoetsTopicId, { correct: number; total: number }>>
  >({});

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
      setCurrentInputFormat(pickQuestionFormat(format));
    },
    []
  );

  const resetExamSession = useCallback(
    (
      topic: ExamTopicFilter,
      format: 'mixed' | QuestionInputMode,
      shuffleOrder = false,
      customList?: ProeftoetsQuestion[]
    ) => {
      const pool = customList
        ? [...customList]
        : topic === 'all'
        ? [...PROEFTOETS_QUESTIONS]
        : PROEFTOETS_QUESTIONS.filter((q) => q.topic === topic);
      const deck = shuffleOrder || customList ? shuffleArray(pool) : pool;
      setExamDeck(deck);
      setExamIdx(0);
      setExamSelectedOption(null);
      setExamOpenInput('');
      setExamOpenResult(null);
      setExamEvaluated(false);
      setExamIsCorrect(false);
      setExamForcedCorrect(false);
      setExamFinishEarly(false);
      if (!customList) {
        setExamCorrectCount(0);
        setExamIncorrectCount(0);
        setExamWrongQuestions([]);
        setExamTopicStats({});
      }
      setExamCurrentFormat(pickQuestionFormat(format));
    },
    []
  );

  const currentExamQuestion: ProeftoetsQuestion | undefined = examDeck[examIdx];
  const examFinished =
    examFinishEarly || (examDeck.length > 0 && examIdx >= examDeck.length);

  const shuffledExamOptions = useMemo(() => {
    if (!currentExamQuestion) return [];
    return shuffleArray(currentExamQuestion.options);
  }, [currentExamQuestion]);

  const recordExamOutcome = useCallback(
    (question: ProeftoetsQuestion, success: boolean) => {
      setExamEvaluated(true);
      setExamIsCorrect(success);
      setExamForcedCorrect(false);
      setExamTopicStats((prev) => {
        const cur = prev[question.topic] || { correct: 0, total: 0 };
        return {
          ...prev,
          [question.topic]: {
            correct: cur.correct + (success ? 1 : 0),
            total: cur.total + 1,
          },
        };
      });
      if (success) {
        setExamCorrectCount((c) => c + 1);
        try {
          confetti({ particleCount: 50, spread: 60, origin: { y: 0.65 } });
        } catch {}
      } else {
        setExamIncorrectCount((c) => c + 1);
        setExamWrongQuestions((prev) =>
          prev.some((w) => w.id === question.id) ? prev : [...prev, question]
        );
      }
    },
    []
  );

  const handleExamSelectOption = (option: string) => {
    if (examEvaluated || !currentExamQuestion) return;
    setExamSelectedOption(option);
    recordExamOutcome(currentExamQuestion, option === currentExamQuestion.correctAnswer);
  };

  const handleExamOpenSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (examEvaluated || !currentExamQuestion || !examOpenInput.trim()) return;
    const res = validateAnatomicalAnswer(
      examOpenInput,
      currentExamQuestion.correctAnswer,
      currentExamQuestion.acceptableAnswers
    );
    setExamOpenResult(res);
    recordExamOutcome(currentExamQuestion, res.isCorrect);
  };

  const handleExamForceCorrect = () => {
    if (!examEvaluated || examIsCorrect || examForcedCorrect || !currentExamQuestion) return;
    setExamIsCorrect(true);
    setExamForcedCorrect(true);
    setExamCorrectCount((c) => c + 1);
    setExamIncorrectCount((c) => Math.max(0, c - 1));
    setExamWrongQuestions((prev) => prev.filter((w) => w.id !== currentExamQuestion.id));
    setExamTopicStats((prev) => {
      const cur = prev[currentExamQuestion.topic] || { correct: 0, total: 1 };
      return {
        ...prev,
        [currentExamQuestion.topic]: {
          ...cur,
          correct: cur.correct + 1,
        },
      };
    });
    try {
      confetti({ particleCount: 40, spread: 50, origin: { y: 0.65 } });
    } catch {}
  };

  const resetCurrentExamQuestionState = useCallback(() => {
    setExamSelectedOption(null);
    setExamOpenInput('');
    setExamOpenResult(null);
    setExamEvaluated(false);
    setExamIsCorrect(false);
    setExamForcedCorrect(false);
    setExamCurrentFormat(pickQuestionFormat(examFormat));
  }, [examFormat]);

  const handleExamNextQuestion = () => {
    setExamIdx((idx) => idx + 1);
    resetCurrentExamQuestionState();
  };

  const examTotalAnswered = examCorrectCount + examIncorrectCount;
  const examPercentage =
    examTotalAnswered > 0 ? Math.round((examCorrectCount / examTotalAnswered) * 100) : 0;
  const examGrade =
    examTotalAnswered > 0
      ? (1 + 9 * (examCorrectCount / examTotalAnswered)).toFixed(1).replace('.', ',')
      : '1,0';

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
    setCurrentInputFormat(pickQuestionFormat(questionFormat));
  };

  return (
    <div className="flex-1 w-full max-w-6xl mx-auto px-3 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col gap-4">
      {/* Compacte topbalk: Titel links, Leren/Testen/Proeftoets switcher rechts */}
      <div className="bg-white rounded-2xl border border-clinical-200/90 shadow-sm px-4 py-3 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-base sm:text-lg font-black text-clinical-950 tracking-tight">
            Ligamenten, Synoviaal Gewricht, Richtingen & Assen
          </h1>
          <p className="text-xs text-clinical-500">
            Moduulboek & reader-overzicht (art. genus, art. pedis, synoviaal, vertebrae, richtingen, assen & proeftoets 60 vragen)
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
          <button
            type="button"
            onClick={() => {
              setMode('exam');
              if (examDeck.length === 0) {
                resetExamSession(examTopic, examFormat);
              }
            }}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
              mode === 'exam'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-clinical-700 hover:text-clinical-950 hover:bg-white/60'
            }`}
          >
            <GraduationCap className="w-3.5 h-3.5" />
            <span>Proeftoets (60)</span>
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
                      placeholder="Typ je antwoord..."
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

      {/* ============================================================ */}
      {/* MODUS 3: UITGEBREIDE PROEFTOETS (60 VRAGEN)                  */}
      {/* ============================================================ */}
      {mode === 'exam' && (
        <div className="flex flex-col gap-4">
          {/* Proeftoets controls & live score */}
          <div className="bg-white rounded-2xl border border-clinical-200/90 shadow-xs p-3 flex flex-wrap items-center justify-between gap-3">
            <div className="flex flex-wrap items-center gap-2">
              <select
                value={examTopic}
                onChange={(e) => {
                  const nextTopic = e.target.value as ExamTopicFilter;
                  setExamTopic(nextTopic);
                  resetExamSession(nextTopic, examFormat);
                }}
                aria-label="Kies proeftoets onderdeel"
                className="px-3 py-1.5 rounded-xl border border-clinical-200 bg-clinical-50 text-xs font-bold text-clinical-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="all">Volledige proeftoets (60 vragen)</option>
                {(Object.keys(PROEFTOETS_TOPIC_LABELS) as ProeftoetsTopicId[]).map((topicId) => {
                  const count = PROEFTOETS_QUESTIONS.filter((q) => q.topic === topicId).length;
                  return (
                    <option key={topicId} value={topicId}>
                      {PROEFTOETS_TOPIC_LABELS[topicId]} ({count})
                    </option>
                  );
                })}
              </select>

              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-[11px] font-bold">
                {(
                  [
                    { id: 'open', label: 'Open (echte toets)' },
                    { id: 'mc', label: 'Meerkeuze' },
                    { id: 'mixed', label: 'Mix' },
                  ] as const
                ).map((fmt) => (
                  <button
                    key={fmt.id}
                    type="button"
                    onClick={() => {
                      setExamFormat(fmt.id);
                      setExamCurrentFormat(pickQuestionFormat(fmt.id));
                    }}
                    className={`px-2.5 py-1 rounded-md transition ${
                      examFormat === fmt.id
                        ? 'bg-white text-blue-700 shadow-2xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {fmt.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="flex items-center gap-2 px-2.5 py-1 rounded-lg bg-slate-50 border border-slate-200 text-xs font-mono font-bold">
                <span className="text-emerald-600">{examCorrectCount} goed</span>
                <span className="text-slate-300">|</span>
                <span className="text-rose-600">{examIncorrectCount} fout</span>
              </div>

              {!examFinished && examTotalAnswered > 0 && (
                <button
                  type="button"
                  onClick={() => setExamFinishEarly(true)}
                  className="px-2.5 py-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-800 text-xs font-bold transition"
                >
                  Afronden & uitslag
                </button>
              )}

              <button
                type="button"
                onClick={() => resetExamSession(examTopic, examFormat, true)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                title="Hussel volgorde & begin opnieuw"
              >
                <Shuffle className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => resetExamSession(examTopic, examFormat, false)}
                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 transition"
                title="Opnieuw beginnen (vraag 1 t/m 60)"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Voortgangsbalk */}
          {!examFinished && examDeck.length > 0 && (
            <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
              <div
                className="h-full bg-blue-600 transition-all duration-300"
                style={{
                  width: `${Math.min(100, Math.round(((examIdx + (examEvaluated ? 1 : 0)) / examDeck.length) * 100))}%`,
                }}
              />
            </div>
          )}

          {/* Uitslag / Overzicht */}
          {examFinished ? (
            <div className="bg-white rounded-3xl border border-clinical-200 shadow-sm p-6 sm:p-8 max-w-3xl mx-auto w-full space-y-5">
              <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 border border-blue-200 mb-1">
                  <Award className="w-6 h-6" />
                </div>
                <h2 className="text-xl font-black text-clinical-950">Proeftoets afgerond</h2>
                <p className="text-sm text-slate-600">
                  Beantwoord: <strong>{examTotalAnswered}</strong> van {examDeck.length} vragen ·{' '}
                  <strong className="text-emerald-700">{examCorrectCount} goed</strong> en{' '}
                  <strong className="text-rose-600">{examIncorrectCount} fout</strong> ({examPercentage}%)
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-xl bg-slate-100 border border-slate-200 text-sm font-black text-clinical-900">
                  <span>Indicatief cijfer:</span>
                  <span className={Number(examGrade.replace(',', '.')) >= 5.5 ? 'text-emerald-700' : 'text-rose-600'}>
                    {examGrade}
                  </span>
                </div>
              </div>

              {/* Score per onderdeel */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-2">
                {(Object.keys(PROEFTOETS_TOPIC_LABELS) as ProeftoetsTopicId[]).map((topicId) => {
                  const stat = examTopicStats[topicId];
                  if (!stat || stat.total === 0) return null;
                  const pct = Math.round((stat.correct / stat.total) * 100);
                  return (
                    <div
                      key={topicId}
                      className="flex items-center justify-between px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50/70 text-xs"
                    >
                      <span className="font-bold text-slate-800">{PROEFTOETS_TOPIC_LABELS[topicId]}</span>
                      <span
                        className={`font-mono font-black ${
                          pct >= 55 ? 'text-emerald-700' : 'text-rose-600'
                        }`}
                      >
                        {stat.correct}/{stat.total} ({pct}%)
                      </span>
                    </div>
                  );
                })}
              </div>

              <div className="flex flex-wrap items-center justify-center gap-2.5 pt-2">
                {examWrongQuestions.length > 0 && (
                  <button
                    type="button"
                    onClick={() =>
                      resetExamSession(examTopic, examFormat, true, examWrongQuestions)
                    }
                    className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Oefen {examWrongQuestions.length} foute vragen opnieuw</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => resetExamSession(examTopic, examFormat, false)}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold flex items-center gap-1.5 shadow-xs transition"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Start nieuwe proeftoets (60)</span>
                </button>
              </div>
            </div>
          ) : currentExamQuestion ? (
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start">
              {/* Afbeelding bij vraag (indien beschikbaar) */}
              {currentExamQuestion.imageUrl && (
                <div className="lg:col-span-6 bg-white rounded-2xl border border-clinical-200/90 shadow-sm p-3.5">
                  <button
                    type="button"
                    onClick={() =>
                      setZoomedImage({
                        url:
                          resolveAssetUrl(currentExamQuestion.imageUrl) ||
                          currentExamQuestion.imageUrl!,
                        caption: `Vraag ${currentExamQuestion.number}: ${currentExamQuestion.question}`,
                      })
                    }
                    className="w-full relative group block rounded-xl overflow-hidden bg-white cursor-zoom-in"
                    title="Klik om te vergroten"
                  >
                    <img
                      src={resolveAssetUrl(currentExamQuestion.imageUrl)}
                      alt={currentExamQuestion.question}
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
                  currentExamQuestion.imageUrl
                    ? 'lg:col-span-6'
                    : 'lg:col-span-12 max-w-2xl mx-auto w-full'
                } bg-white rounded-2xl border border-clinical-200/90 shadow-sm p-4 sm:p-5 space-y-4`}
              >
                <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-800 border border-blue-200 font-bold">
                      Vraag {examIdx + 1} van {examDeck.length}
                    </span>
                    <span className="px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 border border-slate-200 font-semibold">
                      {PROEFTOETS_TOPIC_LABELS[currentExamQuestion.topic]}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      type="button"
                      disabled={examIdx === 0}
                      onClick={() => {
                        if (examIdx > 0) {
                          setExamIdx((i) => i - 1);
                          resetCurrentExamQuestionState();
                        }
                      }}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 disabled:opacity-30 hover:bg-slate-50"
                      title="Vorige vraag"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleExamNextQuestion}
                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50"
                      title="Sla over / volgende"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                <h2 className="text-base sm:text-lg font-black text-clinical-950 leading-snug">
                  {currentExamQuestion.question}
                </h2>

                {examCurrentFormat === 'mc' ? (
                  <div className="space-y-2">
                    {shuffledExamOptions.map((opt, i) => {
                      const isPicked = examSelectedOption === opt;
                      const isRightOption = opt === currentExamQuestion.correctAnswer;
                      let btnStyle =
                        'border-slate-200 bg-slate-50/70 hover:bg-blue-50 hover:border-blue-300 text-slate-800';
                      if (examEvaluated) {
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
                          disabled={examEvaluated}
                          onClick={() => handleExamSelectOption(opt)}
                          className={`w-full text-left p-3 rounded-xl border text-xs sm:text-sm transition flex items-center justify-between gap-2 ${btnStyle}`}
                        >
                          <div className="flex items-start gap-2.5 min-w-0">
                            <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                              {['A', 'B', 'C', 'D'][i]}
                            </span>
                            <span className="leading-snug">{opt}</span>
                          </div>
                          {examEvaluated && isRightOption && (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                          )}
                          {examEvaluated && isPicked && !isRightOption && (
                            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                          )}
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <form onSubmit={handleExamOpenSubmit} className="space-y-2.5">
                    <input
                      type="text"
                      value={examOpenInput}
                      onChange={(e) => setExamOpenInput(e.target.value)}
                      disabled={examEvaluated}
                      placeholder="Typ je korte antwoord (net als op het tentamen)..."
                      className="w-full px-3.5 py-2.5 rounded-xl border border-slate-300 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm font-semibold text-slate-900"
                    />
                    {!examEvaluated && (
                      <button
                        type="submit"
                        disabled={!examOpenInput.trim()}
                        className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white text-xs font-bold transition shadow-xs"
                      >
                        Controleer antwoord
                      </button>
                    )}
                  </form>
                )}

                {examEvaluated && (
                  <div
                    className={`p-3.5 rounded-xl border space-y-2 ${
                      examIsCorrect
                        ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
                        : 'bg-rose-50 border-rose-200 text-rose-950'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="text-xs font-black flex items-center gap-1.5">
                        {examIsCorrect ? (
                          <>
                            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                            <span>
                              {examForcedCorrect
                                ? `Goed gerekend — Antwoordmodel: ${currentExamQuestion.correctAnswer}`
                                : `Goed! Antwoordmodel: ${currentExamQuestion.correctAnswer}`}
                            </span>
                          </>
                        ) : (
                          <>
                            <XCircle className="w-4 h-4 text-rose-600" />
                            <span>Niet helemaal — Juiste antwoord: {currentExamQuestion.correctAnswer}</span>
                          </>
                        )}
                      </span>

                      {!examIsCorrect && examCurrentFormat === 'open' && !examForcedCorrect && (
                        <button
                          type="button"
                          onClick={handleExamForceCorrect}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 border border-emerald-300 text-emerald-800 text-[11px] font-bold flex items-center gap-1 transition"
                        >
                          <Check className="w-3 h-3" />
                          <span>Toch goed rekenen</span>
                        </button>
                      )}
                    </div>
                    {examOpenResult?.feedbackNote && (
                      <p className="text-xs font-semibold text-blue-900">{examOpenResult.feedbackNote}</p>
                    )}
                    <p className="text-xs leading-relaxed opacity-90">{currentExamQuestion.explanation}</p>
                    <button
                      type="button"
                      onClick={handleExamNextQuestion}
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
