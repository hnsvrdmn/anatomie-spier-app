import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import confetti from 'canvas-confetti';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { QuizStats } from './QuizStats';
import { QuizFeedback } from './QuizFeedback';
import { 
  QuizType, 
  QuizQuestion, 
  Point2D, 
  MatchResult, 
  QuizStatsData, 
  Muscle,
  MuscleVisualData
} from '../../types/anatomy';
import { JOINT_CATEGORIES, getJointCategory } from '../../data/jointCategories';
import { getMovementQuestionOptions, MUSCLE_MOVEMENTS } from '../../data/muscleMovements';
import { READER_BONES } from '../../data/bonesData';
import { getRandomJointQuestion, getJointMCOptions, JointQuizItem, getJointLocation, JOINT_QUIZ_ITEMS } from '../../data/jointQuestions';
import { evaluatePointSet, distanceToSegment, projectToSegment, getAccuracy, getDistinctTargetCount, isTrapeziusPointAccurate } from '../../utils/coordinates';
import { validateAnatomicalAnswer, AnswerValidationResult } from '../../utils/answerMatching';
import { isForbiddenMuscle } from '../../utils/export';
import { MovementIcon } from '../common/MovementIcon';
import { RefreshCw, Check, Award, CheckCircle2, Shuffle, Square, CheckSquare, GraduationCap, ListChecks, Undo2, Trash2 } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileQuizView } from './MobileQuizView';

// Schoon spiernaam op zodat eventuele tekst tussen haakjes (zoals MP: of deel v.) het antwoord niet verraadt
const cleanMuscleName = (name: string): string => {
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

// Schoon functie/werkingstekst op: geen gewrichtsnamen (art. ...) en geen tekst tussen haakjes
const cleanFunctionText = (muscleId: string, fallback?: string): string => {
  const movs = MUSCLE_MOVEMENTS[muscleId];
  if (movs && movs.length > 0) {
    return movs.map((m) => m.replace(/\s*\([^)]*\)/g, '').trim()).join(', ');
  }
  if (fallback) {
    return fallback
      .replace(/\b(in\s+)?(het\s+)?art(\.|iculatio)?\s+[a-z\-]+/gi, '')
      .replace(/\([^)]*\)/g, '')
      .replace(/\s*[,/\\|]\s*[,/\\|]+/g, ',')
      .replace(/^[,/\\|\s]+|[,/\\|\s]+$/g, '')
      .replace(/\s\s+/g, ' ')
      .trim();
  }
  return 'Geen specifieke werking';
};

// Schoon origo- en insertietekst op: verwijdert verklarende tekst tussen haakjes of gelijktekens die het antwoord weggeven
const cleanAttachmentText = (text?: string): string => {
  if (!text) return '';
  return text
    .replace(/\([^)]*\)/g, '')
    .replace(/\s*(=[^,|;]+)/g, '')
    .replace(/\s*[,/\\|]\s*[,/\\|]+/g, ', ')
    .replace(/^[,/\\|\s]+|[,/\\|\s]+$/g, '')
    .replace(/\s\s+/g, ' ')
    .trim();
};

// Selecteer afleiders bij voorkeur uit hetzelfde gewricht / dezelfde regio om de toets uitdagender te maken
const getRelatedDistractorMuscles = (target: Muscle, pool: Muscle[], count = 3): Muscle[] => {
  const targetJoints = target.jointCategories || [];
  const sameJointMuscles = pool.filter(
    (m) => m.id !== target.id && m.jointCategories && m.jointCategories.some((j) => targetJoints.includes(j))
  );

  const shuffledSameJoint = [...sameJointMuscles].sort(() => 0.5 - Math.random());
  if (shuffledSameJoint.length >= count) {
    return shuffledSameJoint.slice(0, count);
  }

  const otherMuscles = pool.filter(
    (m) => m.id !== target.id && !shuffledSameJoint.some((sj) => sj.id === m.id)
  );
  const shuffledOthers = [...otherMuscles].sort(() => 0.5 - Math.random());
  return [...shuffledSameJoint, ...shuffledOthers].slice(0, count);
};

const initialStats = (): QuizStatsData => ({
  totalQuestions: 0,
  correctAnswers: 0,
  closeAnswers: 0,
  incorrectAnswers: 0,
  streak: 0,
  history: [],
});

export const QuizView: React.FC = () => {
  const isMobile = useIsMobile();
  const { 
    muscles, 
    currentView, 
    setCurrentView, 
    showToast,
    quizPracticeMode,
    setQuizPracticeMode,
    jointPracticeType,
    requireAllVertebrae,
    setRequireAllVertebrae,
  } = useMuscles();

  // Hoofdmodus binnen de quiz: 'joint' (Oefenen per gewricht) of 'free' (Vrije toets)
  const practiceMode = quizPracticeMode;
  const setPracticeMode = setQuizPracticeMode;

  // Voor 'joint' modus: welk gewricht is geselecteerd?
  const [selectedJointId, setSelectedJointId] = useState<string>('coxae');
  const [jointMuscleIndex, setJointMuscleIndex] = useState<number>(0);
  const [jointSessionFinished, setJointSessionFinished] = useState(false);
  const [isShuffled, setIsShuffled] = useState(false);
  const [shuffleCounter, setShuffleCounter] = useState(0);

  // Nauwkeurigheid tolerantie instelling (oorspronkelijke waarden)
  // Tolerantie & nauwkeurigheidsmodus (standaard Medium: 0.025 / 2.5%, onthoudt keuze in localStorage)
  const [toleranceMode, setToleranceModeState] = useState<'normal' | 'strict' | 'expert'>(() => {
    try {
      const saved = localStorage.getItem('pmt_tolerance_mode');
      if (saved === 'normal' || saved === 'strict' || saved === 'expert') return saved;
    } catch {}
    return 'strict';
  });

  const setToleranceMode = useCallback((mode: 'normal' | 'strict' | 'expert') => {
    setToleranceModeState(mode);
    try {
      localStorage.setItem('pmt_tolerance_mode', mode);
    } catch {}
  }, []);

  const toleranceValue = toleranceMode === 'expert' ? 0.015 : toleranceMode === 'strict' ? 0.025 : 0.035;

  // Automatisch roteren van het aanzicht bij een nieuwe vraag
  const [autoRotateView, setAutoRotateView] = useState<boolean>(() => {
    const saved = localStorage.getItem('pmt_auto_rotate_view');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoRotate = useCallback(() => {
    setAutoRotateView((prev) => {
      const next = !prev;
      localStorage.setItem('pmt_auto_rotate_view', String(next));
      return next;
    });
  }, []);

  // Automatisch inzoomen op het gevraagde element bij een nieuwe vraag
  const [autoZoom, setAutoZoom] = useState<boolean>(() => {
    const saved = localStorage.getItem('pmt_auto_zoom');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoZoom = useCallback(() => {
    setAutoZoom((prev) => {
      const next = !prev;
      localStorage.setItem('pmt_auto_zoom', String(next));
      return next;
    });
  }, []);

  // Automatisch wisselen van intekentool (origo -> insertie) zodra alle origo's zijn geplaatst
  const [autoSwitchPointType, setAutoSwitchPointType] = useState<boolean>(() => {
    const saved = localStorage.getItem('pmt_auto_switch_point_type');
    return saved !== null ? saved === 'true' : true;
  });

  const handleToggleAutoSwitch = useCallback(() => {
    setAutoSwitchPointType((prev) => {
      const next = !prev;
      localStorage.setItem('pmt_auto_switch_point_type', String(next));
      return next;
    });
  }, []);

  // Voor 'free' modus: welk quiztype? 'mixed' (Gemengde toets) is de standaard!
  const [freeQuizType, setFreeQuizType] = useState<QuizType | 'all'>('mixed');

  // Actieve vraag
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  // Gebruikersinvoer: gescheiden origo's en inserties
  const [userOrigins, setUserOrigins] = useState<Point2D[]>([]);
  const [userInsertions, setUserInsertions] = useState<Point2D[]>([]);

  // Actief intekentool: 'origin' of 'insertion'
  const [activeQuizTool, setActiveQuizTool] = useState<'origin' | 'insertion'>('origin');
  const [activeTrapeziusPart, setActiveTrapeziusPart] = useState<'descendens' | 'transversa' | 'ascendens'>('descendens');

  // Meerkeuze gekozen optie
  const [selectedMultipleChoiceId, setSelectedMultipleChoiceId] = useState<string | null>(null);
  const [isMultipleChoiceSuccess, setIsMultipleChoiceSuccess] = useState<boolean>(false);

  // Bewegingen checkbox opties (nieuwe test)
  const [selectedMovements, setSelectedMovements] = useState<string[]>([]);
  const [isMovementSuccess, setIsMovementSuccess] = useState<boolean>(false);

  // Open invultoets gebruikersinvoer en validatie
  const [userOpenAnswer, setUserOpenAnswer] = useState<string>('');
  const [openAnswerFeedback, setOpenAnswerFeedback] = useState<AnswerValidationResult | null>(null);

  // Status van de huidige vraag
  const [isEvaluated, setIsEvaluated] = useState(false);
  const [isPlacementSuccess, setIsPlacementSuccess] = useState(false);
  const [matchResults, setMatchResults] = useState<MatchResult[]>([]);
  const [showReferenceGhost, setShowReferenceGhost] = useState(false);
  const [evaluatedSide, setEvaluatedSide] = useState<'left' | 'right' | 'midline'>('left');

  // Spaced repetition wachtrij voor fout beantwoorde vragen (herhaling na ~5 vragen)
  const questionCounterRef = useRef<number>(0);
  const [retryQueue, setRetryQueue] = useState<{ question: QuizQuestion; dueAtCount: number }[]>([]);

  // Wachtrijen voor sampling without replacement in de 'free' (toets) modus
  // Zorgt dat een vraag NOOIT herhaalt totdat alle andere vragen in de pool minimaal 1x zijn geweest!
  const unaskedMuscleIdsRef = useRef<string[]>([]);
  const unaskedBoneMarkerKeysRef = useRef<string[]>([]);
  const unaskedJointIdsRef = useRef<string[]>([]);

  // Geschiedenis van geplaatste punten voor ongedaan maken (Undo)
  const pointHistoryRef = useRef<Array<'origin' | 'insertion'>>([]);

  const handleUndoLastPoint = useCallback(() => {
    if (pointHistoryRef.current.length === 0) {
      if (userInsertions.length > 0) {
        setUserInsertions((prev) => prev.slice(0, -1));
        return;
      }
      if (userOrigins.length > 0) {
        setUserOrigins((prev) => prev.slice(0, -1));
        return;
      }
      return;
    }
    const lastType = pointHistoryRef.current.pop();
    if (lastType === 'origin') {
      setUserOrigins((prev) => prev.slice(0, -1));
    } else {
      setUserInsertions((prev) => prev.slice(0, -1));
    }
  }, [userOrigins.length, userInsertions.length]);

  const handleClearAllPoints = useCallback(() => {
    setUserOrigins([]);
    setUserInsertions([]);
    pointHistoryRef.current = [];
    completedPartesRef.current = {};
    setHoppingButton(null);
    setActiveTrapeziusPart('descendens');
    setActiveQuizTool(currentQuestion?.landmarkType === 'insertion' ? 'insertion' : 'origin');
  }, [currentQuestion?.landmarkType]);

  // Luister naar Ctrl+Z / Cmd+Z voor ongedaan maken
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if ((e.ctrlKey || e.metaKey) && (e.key === 'z' || e.key === 'Z')) {
        e.preventDefault();
        handleUndoLastPoint();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndoLastPoint]);

  // Subtiele eenmalige hop-animatie voor knoppen bij afronding van origo's of een pars
  const [hoppingButton, setHoppingButton] = useState<string | null>(null);
  const completedPartesRef = useRef<{ [k in 'descendens' | 'transversa' | 'ascendens']?: boolean }>({});
  const hasPromptedInsertionRef = useRef<{ [k: string]: boolean }>({});

  const hasPartOrigins = useCallback((part: 'descendens' | 'transversa' | 'ascendens', origins: Point2D[]) => {
    const partOrigins = origins.filter(p => 
      (p.name || '').toLowerCase().includes(part) &&
      isTrapeziusPointAccurate(p, 'origin', part)
    );
    if (partOrigins.length < 2) return false;
    const ys = partOrigins.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY;

    if (part === 'descendens') {
      return partOrigins.some(p => p.y <= 0.135) && partOrigins.some(p => p.y >= 0.145) && span >= 0.025;
    } else if (part === 'transversa') {
      return partOrigins.some(p => p.y <= 0.188) && partOrigins.some(p => p.y >= 0.198) && span >= 0.018;
    } else if (part === 'ascendens') {
      return partOrigins.some(p => p.y <= 0.245) && partOrigins.some(p => p.y >= 0.295) && span >= 0.045;
    }
    return false;
  }, []);

  const isPartComplete = useCallback((part: 'descendens' | 'transversa' | 'ascendens', origins: Point2D[], insertions: Point2D[]) => {
    const partOrigins = origins.filter(p => 
      (p.name || '').toLowerCase().includes(part) &&
      isTrapeziusPointAccurate(p, 'origin', part)
    );
    const iCount = insertions.filter(p => 
      (p.name || '').toLowerCase().includes(part) &&
      isTrapeziusPointAccurate(p, 'insertion', part)
    ).length;

    if (iCount < 1 || partOrigins.length < 2) return false;

    // Vertebrae validatie per pars: minimaal eerste én laatste wervel in het bereik (meer mag, minder niet)
    const ys = partOrigins.map(p => p.y);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const span = maxY - minY;

    if (part === 'descendens') {
      // Eerste: dorsaal onderzijde schedel / C1-C3 (y <= 0.135)
      // Laatste: C5/C6 (y >= 0.145)
      const hasFirst = partOrigins.some(p => p.y <= 0.135);
      const hasLast = partOrigins.some(p => p.y >= 0.145);
      const minCount = requireAllVertebrae ? 5 : 2;
      return hasFirst && hasLast && span >= 0.025 && partOrigins.length >= minCount;
    } else if (part === 'transversa') {
      // Eerste: C7 / Th1 (y <= 0.188)
      // Laatste: Th2 / Th3 (y >= 0.198)
      const hasFirst = partOrigins.some(p => p.y <= 0.188);
      const hasLast = partOrigins.some(p => p.y >= 0.198);
      const minCount = requireAllVertebrae ? 3 : 2;
      return hasFirst && hasLast && span >= 0.018 && partOrigins.length >= minCount;
    } else if (part === 'ascendens') {
      // Eerste: Th3 / Th4 (y <= 0.245)
      // Laatste: Th10 / Th11 / Th12 (y >= 0.295)
      const hasFirst = partOrigins.some(p => p.y <= 0.245);
      const hasLast = partOrigins.some(p => p.y >= 0.295);
      const minCount = requireAllVertebrae ? 7 : 2;
      return hasFirst && hasLast && span >= 0.045 && partOrigins.length >= minCount;
    }

    return false;
  }, [requireAllVertebrae]);

  useEffect(() => {
    if (currentQuestion?.muscle?.id !== 'trapezius' || isEvaluated) {
      setHoppingButton(null);
      return;
    }

    if (userOrigins.length === 0 && userInsertions.length === 0) {
      completedPartesRef.current = {};
      hasPromptedInsertionRef.current = {};
      setHoppingButton(null);
      return;
    }

    const currentPartInsertions = userInsertions.filter(p => 
      (p.name || '').toLowerCase().includes(activeTrapeziusPart) &&
      isTrapeziusPointAccurate(p, 'insertion', activeTrapeziusPart)
    );

    // 1. Zodra minimale origo's voor de actieve pars zijn geplaatst, licht de Insertie knop op
    const originsComplete = hasPartOrigins(activeTrapeziusPart, userOrigins);
    const promptedForThisPart = hasPromptedInsertionRef.current[activeTrapeziusPart];

    if (originsComplete && currentPartInsertions.length === 0 && !promptedForThisPart) {
      hasPromptedInsertionRef.current[activeTrapeziusPart] = true;
      setHoppingButton('insertion');
      const timer = setTimeout(() => {
        setHoppingButton(null);
      }, 1200);
      return () => clearTimeout(timer);
    }

    // 2. Zodra de actieve pars geheel compleet is (origo EN insertie), licht de volgende pars knop op
    const isCompleteNow = isPartComplete(activeTrapeziusPart, userOrigins, userInsertions);
    const wasComplete = completedPartesRef.current[activeTrapeziusPart];

    if (!wasComplete && isCompleteNow) {
      completedPartesRef.current[activeTrapeziusPart] = true;
      let nextTarget: string | null = null;
      if (activeTrapeziusPart === 'descendens') nextTarget = 'transversa';
      else if (activeTrapeziusPart === 'transversa') nextTarget = 'ascendens';
      else if (activeTrapeziusPart === 'ascendens') nextTarget = 'check';

      if (nextTarget) {
        setHoppingButton(nextTarget);
        const timer = setTimeout(() => {
          setHoppingButton(null);
        }, 1200);
        return () => clearTimeout(timer);
      }
    } else if (wasComplete && !isCompleteNow) {
      completedPartesRef.current[activeTrapeziusPart] = false;
      hasPromptedInsertionRef.current[activeTrapeziusPart] = false;
      setHoppingButton(null);
    }
  }, [currentQuestion?.muscle?.id, isEvaluated, activeTrapeziusPart, userOrigins, userInsertions, hasPartOrigins, isPartComplete]);

  // Desktop weergavemodus: 'both' is verplicht de standaard op desktop!
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('both');

  // Punten gescheiden per aanzicht voor de tweeledige (side-by-side) desktopweergave
  const ventralOrigins = useMemo(
    () => userOrigins.filter((p) => (p.view || currentView) === 'ventral'),
    [userOrigins, currentView]
  );
  const ventralInsertions = useMemo(
    () => userInsertions.filter((p) => (p.view || currentView) === 'ventral'),
    [userInsertions, currentView]
  );
  const dorsalOrigins = useMemo(
    () => userOrigins.filter((p) => (p.view || currentView) === 'dorsal'),
    [userOrigins, currentView]
  );
  const dorsalInsertions = useMemo(
    () => userInsertions.filter((p) => (p.view || currentView) === 'dorsal'),
    [userInsertions, currentView]
  );

  const ventralMatches = useMemo(
    () => matchResults.filter((m) => (m.userPoint.view || currentView) === 'ventral'),
    [matchResults, currentView]
  );
  const dorsalMatches = useMemo(
    () => matchResults.filter((m) => (m.userPoint.view || currentView) === 'dorsal'),
    [matchResults, currentView]
  );

  // Sessie statistieken per toetstype individueel bijgehouden
  const [statsByType, setStatsByType] = useState<Record<string, QuizStatsData>>({
    joint: initialStats(),
    landmark: initialStats(),
    multiple_choice: initialStats(),
    movements: initialStats(),
    open_question: initialStats(),
    bone: initialStats(),
    joints: initialStats(),
    function: initialStats(),
    all: initialStats(),
  });

  const activeStatsKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
  const currentStats = statsByType[activeStatsKey] || initialStats();

  const cleanMuscles = useMemo(() => {
    return muscles.filter((m) => !isForbiddenMuscle(m));
  }, [muscles]);

  const activeJointCategory = useMemo(() => {
    if (selectedJointId === 'all') {
      return {
        id: 'all',
        code: 'ALL',
        name: 'alle gewrichten & spieren',
        pageInfo: 'Alle spieren',
        title: 'Alle spieren (door elkaar)',
        muscleIds: cleanMuscles.map((m) => m.id),
      };
    }
    return getJointCategory(selectedJointId) || JOINT_CATEGORIES[0];
  }, [selectedJointId, cleanMuscles]);

  // Spieren behorend tot het actieve gewricht (met optionele shuffle)
  const jointMuscles = useMemo(() => {
    if (!activeJointCategory) return [];
    const base = activeJointCategory.muscleIds
      .map((id) => cleanMuscles.find((m) => m.id === id))
      .filter((m): m is Muscle => m !== undefined && !isForbiddenMuscle(m));

    if (isShuffled || selectedJointId === 'all') {
      // Shuffled volgorde gebaseerd op Fisher-Yates shuffle
      const copy = [...base];
      for (let i = copy.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [copy[i], copy[j]] = [copy[j], copy[i]];
      }
      return copy;
    }
    return base;
  }, [activeJointCategory, cleanMuscles, isShuffled, shuffleCounter, selectedJointId]);

  // Aantal verwachte punten per zijde (gebaseerd op unieke anatomische structuren/zones)
  const getExpectedCounts = useCallback((side: 'left' | 'right' | 'midline') => {
    if (!currentQuestion || !currentQuestion.muscle) return { origins: 1, insertions: 1, rawOrigins: 1, rawInsertions: 1, total: 2, isMultiSpan: false };
    const vis = currentQuestion.muscle.visuals[side] || { origins: [], insertions: [], attachmentLines: [] };
    const rawOrigins = getDistinctTargetCount(vis.origins, (vis as any).attachmentLines, 'origin');
    const rawInsertions = getDistinctTargetCount(vis.insertions, (vis as any).attachmentLines, 'insertion');
    const origins = Math.max(1, rawOrigins);
    const insertions = Math.max(1, rawInsertions);

    let total = origins + insertions;
    if (currentQuestion.type === 'origins') total = origins;
    else if (currentQuestion.type === 'insertions') total = insertions;
    else if (currentQuestion.type === 'landmark') {
      return {
        origins: currentQuestion.landmarkType === 'origin' ? 1 : 0,
        insertions: currentQuestion.landmarkType === 'insertion' ? 1 : 0,
        rawOrigins: 1,
        rawInsertions: 1,
        isMultiSpan: false,
        total: 1
      };
    }

    return {
      origins,
      insertions,
      rawOrigins,
      rawInsertions,
      isMultiSpan: rawOrigins > 2 || rawInsertions > 2,
      total
    };
  }, [currentQuestion]);

  const expectedCounts = useMemo(() => {
    return getExpectedCounts(evaluatedSide);
  }, [getExpectedCounts, evaluatedSide]);

  // Subtiele eenmalige schaling van de insertieknop wanneer origo's compleet zijn
  const [isScalingInsertion, setIsScalingInsertion] = useState(false);
  const [hasScaledForOrigins, setHasScaledForOrigins] = useState(false);

  useEffect(() => {
    if (
      !isEvaluated &&
      activeQuizTool === 'origin' &&
      expectedCounts.insertions > 0 &&
      userOrigins.length >= expectedCounts.origins &&
      userInsertions.length === 0 &&
      !hasScaledForOrigins
    ) {
      setHasScaledForOrigins(true);
      setIsScalingInsertion(true);
      const timer = setTimeout(() => {
        setIsScalingInsertion(false);
      }, 700);
      return () => clearTimeout(timer);
    }
  }, [isEvaluated, activeQuizTool, expectedCounts, userOrigins.length, userInsertions.length, hasScaledForOrigins]);

  // Laad een specifieke vraag in (bijv. herhalingsvraag uit de retry-wachtrij)
  const loadQuestion = useCallback((q: QuizQuestion) => {
    const freshQuestion: QuizQuestion = {
      ...q,
      id: `${q.id.split('-')[0]}-${q.muscle?.id || q.bone?.id || q.jointQuizItem?.id || 'retry'}-${Date.now()}`,
      isRetry: true,
      // Schud meerkeuze opties opnieuw zodat het antwoord niet op exact dezelfde positie staat
      mcTextOptions: q.mcTextOptions ? [...q.mcTextOptions].sort(() => 0.5 - Math.random()) : undefined,
    };

    setCurrentQuestion(freshQuestion);
    setUserOrigins([]);
    setUserInsertions([]);
    pointHistoryRef.current = [];
    completedPartesRef.current = {};
    setHoppingButton(null);
    setActiveTrapeziusPart('descendens');
    setUserOpenAnswer('');
    setOpenAnswerFeedback(null);
    setActiveQuizTool(
      freshQuestion.landmarkType === 'insertion' || freshQuestion.type === 'insertions'
        ? 'insertion'
        : 'origin'
    );
    setSelectedMultipleChoiceId(null);
    setSelectedMovements([]);
    setIsMultipleChoiceSuccess(false);
    setIsMovementSuccess(false);
    setIsEvaluated(false);
    setIsPlacementSuccess(false);
    setMatchResults([]);
    setShowReferenceGhost(false);
    setEvaluatedSide(freshQuestion.side || 'left');
    setHasScaledForOrigins(false);
    setIsScalingInsertion(false);

    if (autoRotateView) {
      if (freshQuestion.targetBoneMarker?.view) {
        setCurrentView(freshQuestion.targetBoneMarker.view);
      } else if (freshQuestion.muscle?.view) {
        setCurrentView(freshQuestion.muscle.view);
      }
    }
  }, [autoRotateView, setCurrentView]);

  // Registreer een fout beantwoorde vraag in de spaced repetition herhalingswachtrij (na ~4-6 vragen)
  const registerIncorrectQuestion = useCallback((q: QuizQuestion) => {
    // 4 tot 6 vragen later herhalen
    const offset = 4 + Math.floor(Math.random() * 3);
    const dueAtCount = questionCounterRef.current + offset;

    setRetryQueue((prev) => {
      const isAlreadyQueued = prev.some((item) => {
        if (q.muscle?.id && item.question.muscle?.id === q.muscle.id && item.question.type === q.type) {
          return true;
        }
        if (q.bone?.id && item.question.bone?.id === q.bone.id && item.question.type === q.type) {
          return true;
        }
        if (q.jointQuizItem?.id && item.question.jointQuizItem?.id === q.jointQuizItem.id) {
          return true;
        }
        return item.question.id === q.id;
      });

      if (isAlreadyQueued) return prev;
      return [...prev, { question: { ...q }, dueAtCount }];
    });
  }, []);

  // Genereer vraag voor het geselecteerde gewricht op positie index (puur Origo & Insertie)
  const loadJointQuestion = useCallback((mIndex: number) => {
    if (jointMuscles.length === 0) return;
    const muscle = jointMuscles[mIndex];
    if (!muscle) return;

    setCurrentQuestion({
      id: `joint-${selectedJointId}-${muscle.id}-${Date.now()}`,
      muscle,
      type: 'joint',
      side: 'left',
      jointId: selectedJointId,
      jointIndex: mIndex + 1,
      jointTotal: jointMuscles.length,
    });

    setUserOrigins([]);
    setUserInsertions([]);
    setActiveTrapeziusPart('descendens');
    setActiveQuizTool('origin');
    setSelectedMultipleChoiceId(null);
    setSelectedMovements([]);
    setIsMultipleChoiceSuccess(false);
    setIsMovementSuccess(false);
    setIsEvaluated(false);
    setIsPlacementSuccess(false);
    setMatchResults([]);
    setShowReferenceGhost(false);
    setEvaluatedSide('left');
    setHasScaledForOrigins(false);
    setIsScalingInsertion(false);
    if (autoRotateView) {
      setCurrentView(muscle.view);
    }
  }, [jointMuscles, selectedJointId, setCurrentView, autoRotateView]);

  // Helper om een bondige werking/functie beschrijving te genereren ZONDER gewrichtsnamen (puur beweging en functie)
  const getMuscleFunctionDescription = useCallback((m: Muscle): string => {
    if (m.primaryMovements && m.primaryMovements.length > 0) {
      const movements = Array.from(new Set(m.primaryMovements.map(p => p.movement.trim()).filter(Boolean)));
      if (movements.length > 0) {
        return movements.join(' | ');
      }
    }
    return m.functionText || m.otherFunctions || '';
  }, []);

  // Haal de volgende spier op via sampling without replacement (geen herhaling totdat alle spieren zijn geweest)
  const getNextFreeMuscle = useCallback((): Muscle | null => {
    if (cleanMuscles.length === 0) return null;
    if (unaskedMuscleIdsRef.current.length === 0) {
      const ids = cleanMuscles.map((m) => m.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      unaskedMuscleIdsRef.current = ids;
    }
    const nextId = unaskedMuscleIdsRef.current.shift()!;
    return cleanMuscles.find((m) => m.id === nextId) || cleanMuscles[0];
  }, [cleanMuscles]);

  // Haal de volgende botmarker op via sampling without replacement
  const getNextFreeBoneMarker = useCallback((): { bone: typeof READER_BONES[0]; marker: typeof READER_BONES[0]['markers'][0] } | null => {
    const bonesWithMarkers = READER_BONES.filter((b) => b.markers && b.markers.length > 0);
    if (bonesWithMarkers.length === 0) return null;
    if (unaskedBoneMarkerKeysRef.current.length === 0) {
      const keys: string[] = [];
      bonesWithMarkers.forEach((b) => {
        b.markers.forEach((_, idx) => keys.push(`${b.id}:${idx}`));
      });
      for (let i = keys.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [keys[i], keys[j]] = [keys[j], keys[i]];
      }
      unaskedBoneMarkerKeysRef.current = keys;
    }
    const nextKey = unaskedBoneMarkerKeysRef.current.shift()!;
    const [boneId, markerIdxStr] = nextKey.split(':');
    const bone = bonesWithMarkers.find((b) => b.id === boneId) || bonesWithMarkers[0];
    const marker = bone.markers[parseInt(markerIdxStr, 10)] || bone.markers[0];
    return { bone, marker };
  }, []);

  // Haal het volgende gewrichtsitem op via sampling without replacement
  const getNextFreeJointItem = useCallback((): JointQuizItem | null => {
    if (JOINT_QUIZ_ITEMS.length === 0) return null;
    if (unaskedJointIdsRef.current.length === 0) {
      const ids = JOINT_QUIZ_ITEMS.map((item) => item.id);
      for (let i = ids.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [ids[i], ids[j]] = [ids[j], ids[i]];
      }
      unaskedJointIdsRef.current = ids;
    }
    const nextId = unaskedJointIdsRef.current.shift()!;
    return JOINT_QUIZ_ITEMS.find((item) => item.id === nextId) || JOINT_QUIZ_ITEMS[0];
  }, []);

  // Genereer een nieuwe willekeurige vraag voor de 'free' modus
  const generateNewFreeQuestion = useCallback((typeOverride?: QuizType | 'all') => {
    const targetType = typeOverride !== undefined ? typeOverride : freeQuizType;

    // Speciaal type: Bot identificatie (open vraag met stip op skelet zonder tekst)
    if (targetType === 'bone') {
      const boneMarkerObj = getNextFreeBoneMarker();
      if (!boneMarkerObj) return;
      const { bone: randBone, marker: randMarker } = boneMarkerObj;
      const markerView: 'ventral' | 'dorsal' = randMarker.view === 'both'
        ? (Math.random() < 0.5 ? 'ventral' : 'dorsal')
        : randMarker.view;

      const markerPoint: Point2D = {
        x: randMarker.x,
        y: randMarker.y,
        view: markerView,
        side: randMarker.side,
      };

      const officialAnswer = randMarker.subpart
        ? `${randBone.latinName} (${randBone.dutchName}) • ${randMarker.subpart}`
        : `${randBone.latinName} (${randBone.dutchName})`;

      const acceptable: string[] = [
        randBone.latinName,
        randBone.latinName.replace(/^os(sa)?\s+/i, ''),
        randBone.dutchName,
      ];

      if (randMarker.subpart) {
        acceptable.push(randMarker.subpart);
        const match = randMarker.subpart.match(/^([^(]+)(?:\(([^)]+)\))?/);
        if (match) {
          if (match[1]) {
            const p1 = match[1].trim();
            acceptable.push(p1);
            acceptable.push(p1.replace(/^os(sa)?\s+/i, ''));
          }
          if (match[2]) {
            acceptable.push(match[2].trim());
          }
        }
      }

      if (randBone.id === 'os_coxae') {
        acceptable.push('pelvis', 'bekken');
      }

      setCurrentQuestion({
        id: `bone-${randBone.id}-${Date.now()}`,
        type: 'bone',
        bone: randBone,
        boneMarker: randMarker,
        targetBoneMarker: markerPoint,
        correctOpenAnswer: officialAnswer,
        acceptableAnswers: Array.from(new Set(acceptable)),
        side: randMarker.side,
        options: [],
      });

      setUserOrigins([]);
    setUserInsertions([]);
    setActiveTrapeziusPart('descendens');
      setUserOpenAnswer('');
      setOpenAnswerFeedback(null);
      setActiveQuizTool('origin');
      setSelectedMultipleChoiceId(null);
      setSelectedMovements([]);
      setIsMultipleChoiceSuccess(false);
      setIsMovementSuccess(false);
      setIsEvaluated(false);
      setIsPlacementSuccess(false);
      setMatchResults([]);
      setShowReferenceGhost(false);
      setEvaluatedSide(randMarker.side);
      setHasScaledForOrigins(false);
      setIsScalingInsertion(false);

      if (autoRotateView) {
        setCurrentView(markerView);
      }
      return;
    }

    // Speciaal type: Gewrichten (lossen test over gewrichtstypen, assen, deelgewrichten en bewegingen)
    if (targetType === 'joints') {
      const jointItem = getNextFreeJointItem() || getRandomJointQuestion();
      const mcTextOptions = getJointMCOptions(jointItem);

      setCurrentQuestion({
        id: `joints-${jointItem.id}-${Date.now()}`,
        type: 'joints',
        jointQuizItem: jointItem,
        mcTextOptions,
        correctMcText: jointItem.correctAnswer,
        correctOpenAnswer: jointItem.correctAnswer,
        acceptableAnswers: jointItem.acceptableAnswers,
        side: 'left',
        options: [],
      });

      setUserOrigins([]);
    setUserInsertions([]);
    setActiveTrapeziusPart('descendens');
      setUserOpenAnswer('');
      setOpenAnswerFeedback(null);
      setActiveQuizTool('origin');
      setSelectedMultipleChoiceId(null);
      setSelectedMovements([]);
      setIsMultipleChoiceSuccess(false);
      setIsMovementSuccess(false);
      setIsEvaluated(false);
      setIsPlacementSuccess(false);
      setMatchResults([]);
      setShowReferenceGhost(false);
      return;
    }

    if (cleanMuscles.length === 0) return;

    const chosenMuscle = getNextFreeMuscle();
    if (!chosenMuscle) return;
    let randMuscle = chosenMuscle;
    let type: QuizType = 'full';

    if (targetType === 'all' || targetType === 'mixed') {
      const types: QuizType[] = ['bone', 'full', 'landmark', 'multiple_choice', 'movements', 'open_question', 'joints'];
      type = types[Math.floor(Math.random() * types.length)];
      if (type === 'bone') {
        generateNewFreeQuestion('bone');
        return;
      }
      if (type === 'joints') {
        generateNewFreeQuestion('joints');
        return;
      }
    } else {
      type = targetType;
    }

    let options: Muscle[] = [];
    let mcKind: 'muscle' | 'origin' | 'insertion' | 'function' | 'joint' | undefined;
    let mcSubtype: 'origin' | 'insertion' | undefined;
    let mcTextOptions: string[] | undefined;
    let correctMcText: string | undefined;
    let jointQuizItem: JointQuizItem | undefined;

    // Samengevoegde meerkeuzetoets: wisselt willekeurig af tussen identificatie, origo, insertie, functie én gewrichten
    // Vragen zijn uitdagender gemaakt doordat afleiders bij voorkeur uit hetzelfde gewricht / dezelfde regio komen
    if (type === 'multiple_choice') {
      const kinds: ('muscle' | 'origin' | 'insertion' | 'function' | 'joint')[] = ['muscle', 'origin', 'insertion', 'function', 'joint'];
      mcKind = kinds[Math.floor(Math.random() * kinds.length)];
      const relatedDistractors = getRelatedDistractorMuscles(randMuscle, cleanMuscles, 3);

      if (mcKind === 'muscle') {
        correctMcText = cleanMuscleName(randMuscle.name);
        const distractorNames = relatedDistractors.map((m) => cleanMuscleName(m.name));
        const uniqueOthers = Array.from(new Set(distractorNames.filter((t) => t !== correctMcText)));
        while (uniqueOthers.length < 3) {
          const fallback = cleanMuscles[Math.floor(Math.random() * cleanMuscles.length)];
          const cleanName = cleanMuscleName(fallback.name);
          if (cleanName !== correctMcText && !uniqueOthers.includes(cleanName)) {
            uniqueOthers.push(cleanName);
          }
        }
        mcTextOptions = [correctMcText, ...uniqueOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
      } else if (mcKind === 'origin') {
        mcSubtype = 'origin';
        correctMcText = cleanAttachmentText(randMuscle.originText);
        const distractorTexts = relatedDistractors.map((m) => cleanAttachmentText(m.originText));
        const uniqueOthers = Array.from(new Set(distractorTexts.filter((t) => Boolean(t && t.trim() !== '' && t !== correctMcText))));
        while (uniqueOthers.length < 3) {
          const fallback = cleanMuscles[Math.floor(Math.random() * cleanMuscles.length)];
          const cleaned = cleanAttachmentText(fallback.originText);
          if (cleaned && cleaned !== correctMcText && !uniqueOthers.includes(cleaned)) {
            uniqueOthers.push(cleaned);
          }
        }
        mcTextOptions = [correctMcText, ...uniqueOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
      } else if (mcKind === 'insertion') {
        mcSubtype = 'insertion';
        correctMcText = cleanAttachmentText(randMuscle.insertionText);
        const distractorTexts = relatedDistractors.map((m) => cleanAttachmentText(m.insertionText));
        const uniqueOthers = Array.from(new Set(distractorTexts.filter((t) => Boolean(t && t.trim() !== '' && t !== correctMcText))));
        while (uniqueOthers.length < 3) {
          const fallback = cleanMuscles[Math.floor(Math.random() * cleanMuscles.length)];
          const cleaned = cleanAttachmentText(fallback.insertionText);
          if (cleaned && cleaned !== correctMcText && !uniqueOthers.includes(cleaned)) {
            uniqueOthers.push(cleaned);
          }
        }
        mcTextOptions = [correctMcText, ...uniqueOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
      } else if (mcKind === 'joint') {
        jointQuizItem = getRandomJointQuestion();
        correctMcText = jointQuizItem.correctAnswer;
        mcTextOptions = getJointMCOptions(jointQuizItem);
      } else {
        // 'function': zuivere bewegingen zonder 'art.' en zonder spoilers tussen haakjes
        correctMcText = cleanFunctionText(randMuscle.id, randMuscle.functionText);
        const distractorTexts = relatedDistractors.map((m) => cleanFunctionText(m.id, m.functionText));
        const uniqueOthers = Array.from(new Set(distractorTexts.filter((t) => Boolean(t && t.trim() !== '' && t !== correctMcText))));
        while (uniqueOthers.length < 3) {
          const fallback = cleanMuscles[Math.floor(Math.random() * cleanMuscles.length)];
          const fText = cleanFunctionText(fallback.id, fallback.functionText);
          if (fText && fText !== correctMcText && !uniqueOthers.includes(fText)) {
            uniqueOthers.push(fText);
          }
        }
        mcTextOptions = [correctMcText, ...uniqueOthers.slice(0, 3)].sort(() => 0.5 - Math.random());
      }
    }

    // Nieuwe test: Bewegingen per spier (checkboxes, 8 opties, meerdere antwoorden mogelijk)
    let movementOptions: string[] | undefined;
    let correctMovements: string[] | undefined;

    if (type === 'movements') {
      const movData = getMovementQuestionOptions(randMuscle.id, 8);
      movementOptions = movData.options;
      correctMovements = movData.correctMovements;
    }

    // Open invultoets: student typt het antwoord zelf
    let openKind: 'muscle' | 'origin' | 'insertion' | 'joint' | undefined;
    let correctOpenAnswer: string | undefined;
    let acceptableAnswers: string[] | undefined;

    if (type === 'open_question') {
      const openKinds: ('muscle' | 'origin' | 'insertion' | 'joint')[] = ['muscle', 'origin', 'insertion', 'joint'];
      openKind = openKinds[Math.floor(Math.random() * openKinds.length)];

      if (openKind === 'muscle') {
        correctOpenAnswer = randMuscle.name;
        acceptableAnswers = [
          randMuscle.name,
          randMuscle.name.replace(/^m\.\s*/i, ''),
          randMuscle.name.replace(/^musculus\s*/i, ''),
        ];
      } else if (openKind === 'origin') {
        correctOpenAnswer = randMuscle.originText;
        acceptableAnswers = [randMuscle.originText];
      } else if (openKind === 'insertion') {
        correctOpenAnswer = randMuscle.insertionText;
        acceptableAnswers = [randMuscle.insertionText];
      } else {
        // 'joint' vraag: stel een vraag over typen, assen, deelgewrichten of bewegingen
        jointQuizItem = getRandomJointQuestion();
        correctOpenAnswer = jointQuizItem.correctAnswer;
        acceptableAnswers = jointQuizItem.acceptableAnswers;
      }
    }

    let landmarkText: string | undefined;
    let landmarkType: 'origin' | 'insertion' | undefined;
    let targetLandmarkIndex: number | undefined;

    if (type === 'landmark') {
      landmarkType = Math.random() < 0.5 ? 'origin' : 'insertion';
      const pts = (randMuscle.visuals.right?.[landmarkType === 'origin' ? 'origins' : 'insertions'] ||
                   randMuscle.visuals.left?.[landmarkType === 'origin' ? 'origins' : 'insertions'] || []);
      if (pts.length > 0) {
        // Kies eerlijk uit unieke anatomische aanhechtingsnamen
        const uniqueIndices: number[] = [];
        const seenNames = new Set<string>();
        pts.forEach((p, idx) => {
          const key = (p.name || '').trim().toLowerCase() || `__idx_${idx}`;
          if (!seenNames.has(key)) {
            seenNames.add(key);
            uniqueIndices.push(idx);
          }
        });
        targetLandmarkIndex = uniqueIndices[Math.floor(Math.random() * uniqueIndices.length)];
        const chosen = pts[targetLandmarkIndex];
        landmarkText = chosen.name || (landmarkType === 'origin' ? randMuscle.originText : randMuscle.insertionText);
      } else {
        targetLandmarkIndex = 0;
        landmarkText = landmarkType === 'origin' ? randMuscle.originText : randMuscle.insertionText;
      }
    }

    const isJointQuestion = (type as string) === 'joints' || 
                            (type === 'multiple_choice' && mcKind === 'joint') || 
                            (type === 'open_question' && openKind === 'joint');

    const questionMuscle = isJointQuestion ? undefined : randMuscle;
    const jointLoc = isJointQuestion ? getJointLocation(jointQuizItem) : null;

    setCurrentQuestion({
      id: isJointQuestion ? `joint-${jointQuizItem?.id || Date.now()}` : `${randMuscle.id}-${Date.now()}`,
      muscle: questionMuscle,
      type,
      side: 'left',
      options,
      landmarkText,
      landmarkType,
      targetLandmarkIndex,
      mcKind,
      mcSubtype,
      mcTextOptions,
      correctMcText,
      movementOptions,
      correctMovements,
      openKind,
      correctOpenAnswer,
      acceptableAnswers,
      jointQuizItem,
      targetFocusPoint: jointLoc || undefined,
    });

    setUserOrigins([]);
    setUserInsertions([]);
    setActiveTrapeziusPart('descendens');
    setUserOpenAnswer('');
    setOpenAnswerFeedback(null);
    setActiveQuizTool(landmarkType === 'insertion' || type === 'insertions' ? 'insertion' : 'origin');
    setSelectedMultipleChoiceId(null);
    setSelectedMovements([]);
    setIsMultipleChoiceSuccess(false);
    setIsMovementSuccess(false);
    setIsEvaluated(false);
    setIsPlacementSuccess(false);
    setMatchResults([]);
    setShowReferenceGhost(false);
    setEvaluatedSide('left');
    setHasScaledForOrigins(false);
    setIsScalingInsertion(false);

    // Schakel automatisch over naar het juiste aanzicht
    if (autoRotateView) {
      if (isJointQuestion) {
        if (jointLoc) {
          setCurrentView(jointLoc.view);
        } else {
          setCurrentView('ventral');
        }
      } else {
        setCurrentView(randMuscle.view);
      }
    }
  }, [cleanMuscles, freeQuizType, getMuscleFunctionDescription, setCurrentView, autoRotateView]);

  // Initialisatie effect
  useEffect(() => {
    if (practiceMode === 'joint') {
      setJointSessionFinished(false);
      loadJointQuestion(jointMuscleIndex);
    } else {
      generateNewFreeQuestion(freeQuizType);
    }
  }, [practiceMode, selectedJointId, jointPracticeType, jointMuscleIndex, loadJointQuestion, freeQuizType]);

  // Volgende vraag handler met spaced repetition voor foute antwoorden
  const handleNextQuestion = () => {
    questionCounterRef.current += 1;
    const currentCount = questionCounterRef.current;

    // 1. Controleer of er een herhalingsvraag klaarstaat (in zowel joint als free modus)
    const dueIndex = retryQueue.findIndex((item) => {
      if (item.dueAtCount > currentCount) return false;
      if (practiceMode === 'joint') {
        return item.question.jointId === selectedJointId;
      }
      if (freeQuizType === 'all' || freeQuizType === 'mixed') {
        return true;
      }
      return item.question.type === freeQuizType;
    });

    if (dueIndex >= 0) {
      const dueItem = retryQueue[dueIndex];
      setRetryQueue((prev) => prev.filter((_, idx) => idx !== dueIndex));
      loadQuestion(dueItem.question);
      return;
    }

    // 2. Geen herhalingsvraag klaar: normale doorloop
    if (practiceMode === 'joint') {
      const nextIdx = jointMuscleIndex + 1;
      if (nextIdx < jointMuscles.length) {
        setJointMuscleIndex(nextIdx);
        loadJointQuestion(nextIdx);
      } else {
        const remainingJointRetryIndex = retryQueue.findIndex(
          (item) => item.question.jointId === selectedJointId
        );
        if (remainingJointRetryIndex >= 0) {
          const dueItem = retryQueue[remainingJointRetryIndex];
          setRetryQueue((prev) => prev.filter((_, idx) => idx !== remainingJointRetryIndex));
          loadQuestion(dueItem.question);
        } else {
          setJointSessionFinished(true);
        }
      }
    } else {
      // In 'free' (toets) modus: trek altijd de volgende unieke vraag uit de wachtrij
      generateNewFreeQuestion();
    }
  };

  // Verwijder geplaatst gebruikerspunt (bijv. met rechtermuisknop op bolletje)
  const handleDeleteUserPoint = (pointType: 'origin' | 'insertion', index: number) => {
    if (isEvaluated) return;
    if (pointType === 'origin') {
      setUserOrigins(prev => prev.filter((_, i) => i !== index));
    } else {
      setUserInsertions(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Evalueer poging met tweezijdige herkenning (links EN rechts worden geaccepteerd!)
  const evaluateAttempt = (originsToEval: Point2D[], insertionsToEval: Point2D[]) => {
    if (!currentQuestion || !currentQuestion.muscle) return;

    const muscle = currentQuestion.muscle;
    const isMidline = muscle.symmetryType === 'midline';

    // Aanzichtvalidatie: controleer of getekende punten op het juiste aanzicht staan!
    // Punten die op het verkeerde skelet zijn getekend (bijv. ventraal getekend voor een dorsale spier)
    // worden NOOIT goed gerekend.
    const wrongViewOrigins = originsToEval.filter((p) => p.view && p.view !== muscle.view);
    const wrongViewInsertions = insertionsToEval.filter((p) => p.view && p.view !== muscle.view);

    const validOrigins = originsToEval.filter((p) => !p.view || p.view === muscle.view);
    const validInsertions = insertionsToEval.filter((p) => !p.view || p.view === muscle.view);

    const wrongViewMatches: MatchResult[] = [
      ...wrongViewOrigins.map((p) => ({
        userPoint: p,
        targetPoint: { x: p.x, y: p.y },
        distance: 1.0,
        accuracy: 'incorrect' as const,
        targetType: 'origin' as const,
      })),
      ...wrongViewInsertions.map((p) => ({
        userPoint: p,
        targetPoint: { x: p.x, y: p.y },
        distance: 1.0,
        accuracy: 'incorrect' as const,
        targetType: 'insertion' as const,
      })),
    ];

    if (wrongViewMatches.length > 0) {
      showToast(
        `Let op: ${muscle.name} ligt aan het ${muscle.view === 'ventral' ? 'ventrale' : 'dorsale'} aanzicht!`,
        'error'
      );
    }

    // Bepaal welke zijden getest moeten worden: student mag ALTIJD links OF rechts intekenen!
    const sidesToTest: ('left' | 'right' | 'midline')[] = isMidline ? ['midline'] : ['left', 'right'];

    let bestSide: 'left' | 'right' | 'midline' = isMidline ? 'midline' : 'left';
    let bestMatches: MatchResult[] = [];
    let bestCorrectCount = -1;
    let minDistanceSum = Infinity;
    let bestPassed = false;
    let bestRequired = 1;
    let bestVertebraeTip: string | undefined;

    for (const testSide of sidesToTest) {
      const vis: MuscleVisualData = muscle.visuals[testSide] || { origins: [], insertions: [], musclePath: [], attachmentLines: [] };
      const targetOrigins = vis.origins || [];
      const targetInsertions = vis.insertions || [];

      let sideMatches: MatchResult[] = [];
      let sideRequired = 0;
      let sideCorrect = 0;
      let sidePassed = false;
      let sideVertebraeTip: string | undefined;

      if (muscle.id === 'erector_spinae' && (currentQuestion.type === 'origins' || currentQuestion.type === 'insertions')) {
        // M. erector spinae: wervelkolomlijn evaluatie voor afzonderlijke origo/insertie vraag
        const spineTop = targetInsertions[0] || { x: testSide === 'right' ? 0.48 : 0.52, y: 0.18 };
        const spineBottom = targetOrigins[0] || { x: testSide === 'right' ? 0.485 : 0.515, y: 0.45 };
        const pts = currentQuestion.type === 'origins' ? validOrigins : validInsertions;
        const targetType = currentQuestion.type === 'origins' ? 'origin' : 'insertion';
        const matches: MatchResult[] = pts.map((p) => {
          const dist = distanceToSegment(p, spineTop, spineBottom);
          return {
            userPoint: p,
            targetPoint: projectToSegment(p, spineTop, spineBottom),
            distance: dist,
            accuracy: getAccuracy(dist, toleranceValue),
            targetType,
          };
        });
        sideMatches = matches;
        sideCorrect = matches.filter((m) => m.accuracy === 'correct').length;
        sideRequired = 1;
        sidePassed = sideCorrect >= 1;
      } else if (currentQuestion.type === 'origins' || (currentQuestion.type === 'landmark' && currentQuestion.landmarkType === 'origin')) {
        let targetPts = targetOrigins;
        let targetLines = vis.attachmentLines || [];
        if (currentQuestion.type === 'landmark') {
          const chosenPt = targetOrigins[currentQuestion.targetLandmarkIndex ?? 0] || targetOrigins[0];
          const askedKey = (currentQuestion.landmarkText || chosenPt?.name || '').trim().toLowerCase();
          targetPts = askedKey
            ? targetOrigins.filter((p) => (p.name || '').trim().toLowerCase() === askedKey)
            : [chosenPt].filter(Boolean);
          if (targetPts.length === 0 && chosenPt) targetPts = [chosenPt];
          targetLines = (vis.attachmentLines || []).filter(
            (l) => l.type === 'origin' && (l.name || '').trim().toLowerCase() === askedKey
          );
        }
        const res = evaluatePointSet(validOrigins, targetPts, 'origin', toleranceValue, targetLines, requireAllVertebrae);
        sideMatches = res.matches;
        sideRequired = res.requiredCount;
        sideCorrect = res.correctCount;
        sidePassed = res.isPassed;
        sideVertebraeTip = res.missingVertebraeTip;
      } else if (currentQuestion.type === 'insertions' || (currentQuestion.type === 'landmark' && currentQuestion.landmarkType === 'insertion')) {
        let targetPts = targetInsertions;
        let targetLines = vis.attachmentLines || [];
        if (currentQuestion.type === 'landmark') {
          const chosenPt = targetInsertions[currentQuestion.targetLandmarkIndex ?? 0] || targetInsertions[0];
          const askedKey = (currentQuestion.landmarkText || chosenPt?.name || '').trim().toLowerCase();
          targetPts = askedKey
            ? targetInsertions.filter((p) => (p.name || '').trim().toLowerCase() === askedKey)
            : [chosenPt].filter(Boolean);
          if (targetPts.length === 0 && chosenPt) targetPts = [chosenPt];
          targetLines = (vis.attachmentLines || []).filter(
            (l) => l.type === 'insertion' && (l.name || '').trim().toLowerCase() === askedKey
          );
        }
        const res = evaluatePointSet(validInsertions, targetPts, 'insertion', toleranceValue, targetLines, requireAllVertebrae);
        sideMatches = res.matches;
        sideRequired = res.requiredCount;
        sideCorrect = res.correctCount;
        sidePassed = res.isPassed;
        sideVertebraeTip = res.missingVertebraeTip;
      } else if (muscle.id === 'erector_spinae') {
        // M. erector spinae (joint / full vraag):
        // De gehele lijn langs de wervelkolom bestaat uit aaneengeschakelde origo's en inserties.
        // Elk punt over dit gehele traject wordt goedgekeurd.
        const spineTop = targetInsertions[0] || { x: testSide === 'right' ? 0.48 : 0.52, y: 0.18 };
        const spineBottom = targetOrigins[0] || { x: testSide === 'right' ? 0.485 : 0.515, y: 0.45 };

        const evalPointOnSpine = (pts: Point2D[], type: 'origin' | 'insertion') => {
          const matches: MatchResult[] = pts.map((p) => {
            const dist = distanceToSegment(p, spineTop, spineBottom);
            return {
              userPoint: p,
              targetPoint: projectToSegment(p, spineTop, spineBottom),
              distance: dist,
              accuracy: getAccuracy(dist, toleranceValue),
              targetType: type,
            };
          });
          const correctCount = matches.filter((m) => m.accuracy === 'correct').length;
          const closeCount = matches.filter((m) => m.accuracy === 'close').length;
          return {
            matches,
            requiredCount: 1,
            correctCount,
            closeCount,
            isPassed: correctCount >= 1,
          };
        };

        const resOrig = evalPointOnSpine(validOrigins, 'origin');
        const resIns = evalPointOnSpine(validInsertions, 'insertion');
        sideMatches = [...resOrig.matches, ...resIns.matches];
        sideRequired = 2;
        sideCorrect = resOrig.correctCount + resIns.correctCount;
        sidePassed = resOrig.isPassed && resIns.isPassed;
      } else if (muscle.id === 'trapezius') {
        // M. trapezius: evalueer elke pars (descendens, transversa, ascendens) AFZONDERLIJK tegen haar eigen doelen en lijnen!
        // Hierdoor kan een punt dat voor pars descendens is geplaatst (bijv. op T7) NOOIT gematcht worden
        // aan pars ascendens, maar wordt het direct als 'incorrect' (rood) geëvalueerd!
        const descOrigins = validOrigins.filter((p) => (p.name || '').toLowerCase().includes('descendens'));
        const descInsertions = validInsertions.filter((p) => (p.name || '').toLowerCase().includes('descendens'));
        const transOrigins = validOrigins.filter((p) => (p.name || '').toLowerCase().includes('transversa'));
        const transInsertions = validInsertions.filter((p) => (p.name || '').toLowerCase().includes('transversa'));
        const ascOrigins = validOrigins.filter((p) => (p.name || '').toLowerCase().includes('ascendens'));
        const ascInsertions = validInsertions.filter((p) => (p.name || '').toLowerCase().includes('ascendens'));

        // Pars descendens: origo C1-C6, insertie laterale 1/3 clavicula
        const descOrigTarget = targetOrigins.filter((p) => (p.name || '').toLowerCase().includes('descendens'));
        const descInsTarget = targetInsertions.filter((p) => (p.name || '').toLowerCase().includes('descendens'));
        const descLines = (vis.attachmentLines || []).filter((l) => (l.name || '').toLowerCase().includes('descendens') || l.id.includes('desc') || l.id.includes('clav'));

        // Pars transversa: origo C7-T3, insertie acromion
        const transOrigTarget = targetOrigins.filter((p) => (p.name || '').toLowerCase().includes('transversa'));
        const transInsTarget = targetInsertions.filter((p) => (p.name || '').toLowerCase().includes('transversa'));
        const transLines = (vis.attachmentLines || []).filter((l) => (l.name || '').toLowerCase().includes('transversa') || l.id.includes('tran'));

        // Pars ascendens: origo T3-T12, insertie spina scapulae
        const ascOrigTarget = targetOrigins.filter((p) => (p.name || '').toLowerCase().includes('ascendens'));
        const ascInsTarget = targetInsertions.filter((p) => (p.name || '').toLowerCase().includes('ascendens'));
        const ascLines = (vis.attachmentLines || []).filter((l) => (l.name || '').toLowerCase().includes('ascendens') || l.id.includes('asc') || l.id.includes('spina'));

        const resOrigDesc = evaluatePointSet(descOrigins, descOrigTarget, 'origin', toleranceValue, descLines, requireAllVertebrae);
        const resInsDesc = evaluatePointSet(descInsertions, descInsTarget, 'insertion', toleranceValue, descLines, requireAllVertebrae);

        const resOrigTrans = evaluatePointSet(transOrigins, transOrigTarget, 'origin', toleranceValue, transLines, requireAllVertebrae);
        const resInsTrans = evaluatePointSet(transInsertions, transInsTarget, 'insertion', toleranceValue, transLines, requireAllVertebrae);

        const resOrigAsc = evaluatePointSet(ascOrigins, ascOrigTarget, 'origin', toleranceValue, ascLines, requireAllVertebrae);
        const resInsAsc = evaluatePointSet(ascInsertions, ascInsTarget, 'insertion', toleranceValue, ascLines, requireAllVertebrae);

        sideMatches = [
          ...resOrigDesc.matches,
          ...resInsDesc.matches,
          ...resOrigTrans.matches,
          ...resInsTrans.matches,
          ...resOrigAsc.matches,
          ...resInsAsc.matches,
        ];
        sideRequired = resOrigDesc.requiredCount + resInsDesc.requiredCount +
                       resOrigTrans.requiredCount + resInsTrans.requiredCount +
                       resOrigAsc.requiredCount + resInsAsc.requiredCount;
        sideCorrect = resOrigDesc.correctCount + resInsDesc.correctCount +
                      resOrigTrans.correctCount + resInsTrans.correctCount +
                      resOrigAsc.correctCount + resInsAsc.correctCount;
        sidePassed = resOrigDesc.isPassed && resInsDesc.isPassed &&
                     resOrigTrans.isPassed && resInsTrans.isPassed &&
                     resOrigAsc.isPassed && resInsAsc.isPassed;
        sideVertebraeTip = resOrigDesc.missingVertebraeTip || resOrigTrans.missingVertebraeTip || resOrigAsc.missingVertebraeTip;
      } else {
        // 'full' of 'joint': match origo's en inserties afzonderlijk tegen hun doelen (inclusief aanhechtingslijnen/zones)
        const resOrig = evaluatePointSet(validOrigins, targetOrigins, 'origin', toleranceValue, vis.attachmentLines || [], requireAllVertebrae);
        const resIns = evaluatePointSet(validInsertions, targetInsertions, 'insertion', toleranceValue, vis.attachmentLines || [], requireAllVertebrae);
        sideMatches = [...resOrig.matches, ...resIns.matches];
        sideRequired = resOrig.requiredCount + resIns.requiredCount;
        sideCorrect = resOrig.correctCount + resIns.correctCount;
        sidePassed = resOrig.isPassed && resIns.isPassed;
        sideVertebraeTip = resOrig.missingVertebraeTip || resIns.missingVertebraeTip;
      }

      // Voeg eventuele matches op het verkeerde aanzicht toe en blokkeer goedkeuring
      sideMatches = [...sideMatches, ...wrongViewMatches];
      if (wrongViewMatches.length > 0) {
        sidePassed = false;
      }

      const distSum = sideMatches.reduce((acc, m) => acc + m.distance, 0);

      // Kies de zijde met de meeste correcte punten of kleinste afstand
      if (sideCorrect > bestCorrectCount || (sideCorrect === bestCorrectCount && distSum < minDistanceSum)) {
        bestCorrectCount = sideCorrect;
        minDistanceSum = distSum;
        bestSide = testSide;
        bestMatches = sideMatches;
        bestRequired = sideRequired;
        bestPassed = sidePassed;
        bestVertebraeTip = sideVertebraeTip;
      }
    }

    setEvaluatedSide(bestSide);
    setMatchResults(bestMatches);
    setIsEvaluated(true);
    setIsPlacementSuccess(bestPassed);

    // Zodra het antwoord gecontroleerd is, toon het juiste aanzicht van de spier voor duidelijke visuele feedback
    if (autoRotateView && muscle && currentView !== muscle.view && viewLayout !== 'both') {
      setCurrentView(muscle.view);
    }

    const isSuccess = bestPassed;
    const closeCount = bestMatches.filter((m) => m.accuracy === 'close').length;

    if (!isSuccess && currentQuestion) {
      registerIncorrectQuestion(currentQuestion);
      if (bestVertebraeTip) {
        showToast(bestVertebraeTip, 'info');
      }
    }

    if (isSuccess) {
      try {
        confetti({
          particleCount: 75,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    setStatsByType((prev) => {
      const activeKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
      const current = prev[activeKey] || initialStats();
      return {
        ...prev,
        [activeKey]: {
          ...current,
          totalQuestions: current.totalQuestions + 1,
          correctAnswers: current.correctAnswers + (isSuccess ? 1 : 0),
          closeAnswers: current.closeAnswers + (!isSuccess && closeCount > 0 ? 1 : 0),
          incorrectAnswers: current.incorrectAnswers + (isSuccess ? 0 : 1),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle?.id || 'muscle',
              type: currentQuestion.type,
              isCorrect: isSuccess,
              score: Math.round((bestCorrectCount / (bestRequired || 1)) * 100),
              accuracyDetails: `${bestCorrectCount}/${bestRequired} correct`,
            },
          ],
        },
      };
    });
  };

  // Afhandeling klik op skelet (links of rechts) met automatische controle bij eenvoudige spieren
  const handleSkeletonClick = (point: Point2D, isRightClick: boolean = false) => {
    if (isEvaluated || !currentQuestion) return;
    if (
      currentQuestion.type === 'multiple_choice' || 
      currentQuestion.type === 'movements' || 
      currentQuestion.type === 'function' ||
      currentQuestion.type === 'open_question' ||
      currentQuestion.type === 'bone' ||
      !currentQuestion.muscle
    ) return;

    // Aanzichtvalidatie in single-view modus
    if (viewLayout !== 'both' && currentView !== currentQuestion.muscle.view) {
      const sideName = currentQuestion.muscle.view === 'ventral' ? 'ventrale' : 'dorsale';
      showToast(
        `Let op het aanzicht! Dit onderdeel bevindt zich aan de ${sideName}zijde. Wissel eerst van aanzicht.`,
        'error'
      );
      return;
    }

    // Rechtermuisknop zet het tegenovergestelde punt van de actieve selectie
    const toolToUse = isRightClick
      ? (activeQuizTool === 'origin' ? 'insertion' : 'origin')
      : activeQuizTool;

    let nextOrigins = userOrigins;
    let nextInsertions = userInsertions;

    const isTrapezius = currentQuestion?.muscle?.id === 'trapezius';
    const pointWithPart: Point2D = isTrapezius
      ? {
          ...point,
          name:
            activeTrapeziusPart === 'descendens'
              ? 'Pars descendens'
              : activeTrapeziusPart === 'transversa'
              ? 'Pars transversa'
              : 'Pars ascendens',
        }
      : point;

    if (toolToUse === 'origin') {
      nextOrigins = [...userOrigins, pointWithPart];
      setUserOrigins(nextOrigins);
      pointHistoryRef.current.push('origin');
    } else {
      const isTrapeziusIns = currentQuestion?.muscle?.id === 'trapezius';
      const insWithPart: Point2D = isTrapeziusIns
        ? {
            ...point,
            name:
              activeTrapeziusPart === 'descendens'
                ? 'Pars descendens'
                : activeTrapeziusPart === 'transversa'
                ? 'Pars transversa'
                : 'Pars ascendens',
          }
        : point;
      nextInsertions = [...userInsertions, insWithPart];
      setUserInsertions(nextInsertions);
      pointHistoryRef.current.push('insertion');
    }

    // Spieren met meer dan 2 punten (zoals wervelkolom): student mag zelf bepalen en klikt op "Controleer antwoord"
    const isMultiPoint = expectedCounts.isMultiSpan || expectedCounts.total > 2 || expectedCounts.rawOrigins > 2 || expectedCounts.rawInsertions > 2;

    if (!isMultiPoint) {
      if (currentQuestion.type === 'landmark') {
        if (currentQuestion.landmarkType === 'origin' && nextOrigins.length >= expectedCounts.origins) {
          evaluateAttempt(nextOrigins, nextInsertions);
        } else if (currentQuestion.landmarkType === 'insertion' && nextInsertions.length >= expectedCounts.insertions) {
          evaluateAttempt(nextOrigins, nextInsertions);
        }
      } else if (currentQuestion.type === 'origins') {
        if (nextOrigins.length >= expectedCounts.origins) {
          evaluateAttempt(nextOrigins, nextInsertions);
        }
      } else if (currentQuestion.type === 'insertions') {
        if (nextInsertions.length >= expectedCounts.insertions) {
          evaluateAttempt(nextOrigins, nextInsertions);
        }
      } else {
        // 'joint' / 'full'
        if (nextOrigins.length >= expectedCounts.origins && nextInsertions.length >= expectedCounts.insertions) {
          evaluateAttempt(nextOrigins, nextInsertions);
        } else if (
          autoSwitchPointType &&
          !isTrapezius &&
          toolToUse === 'origin' &&
          nextOrigins.length === expectedCounts.origins &&
          nextInsertions.length < expectedCounts.insertions
        ) {
          setActiveQuizTool('insertion');
        }
      }
    } else if (
      autoSwitchPointType &&
      !isTrapezius &&
      toolToUse === 'origin' &&
      expectedCounts.insertions > 0 &&
      nextOrigins.length === expectedCounts.origins &&
      nextInsertions.length < expectedCounts.insertions
    ) {
      // Wissel bij alle spieren (inclusief multi-point zoals serratus anterior, iliopsoas) pas naar insertie
      // zodra EXACT het verwachte aantal origo's is geplaatst
      setActiveQuizTool('insertion');
    }
  };

  // Verslepen van geplaatste punten indien net verkeerd neergezet
  const handleUpdateUserPoint = (pointType: 'origin' | 'insertion', index: number, newPoint: Point2D) => {
    if (isEvaluated) return;
    if (pointType === 'origin') {
      setUserOrigins(prev => {
        const next = [...prev];
        next[index] = { ...prev[index], ...newPoint };
        return next;
      });
    } else {
      setUserInsertions(prev => {
        const next = [...prev];
        next[index] = { ...prev[index], ...newPoint };
        return next;
      });
    }
  };

  // Evalueer meerkeuze vraag (geen popup toast, alleen banner & confetti)
  const handleMultipleChoiceSelect = (chosenTextOrId: string) => {
    if (isEvaluated || !currentQuestion) return;

    setSelectedMultipleChoiceId(chosenTextOrId);
    setIsEvaluated(true);

    const isSuccess = currentQuestion.correctMcText
      ? chosenTextOrId === currentQuestion.correctMcText
      : chosenTextOrId === currentQuestion.muscle?.id;

    setIsMultipleChoiceSuccess(isSuccess);
    setIsPlacementSuccess(isSuccess);

    if (!isSuccess && currentQuestion) {
      registerIncorrectQuestion(currentQuestion);
    }

    if (isSuccess) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    setStatsByType((prev) => {
      const activeKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
      const current = prev[activeKey] || initialStats();
      return {
        ...prev,
        [activeKey]: {
          ...current,
          totalQuestions: current.totalQuestions + 1,
          correctAnswers: current.correctAnswers + (isSuccess ? 1 : 0),
          closeAnswers: current.closeAnswers,
          incorrectAnswers: current.incorrectAnswers + (isSuccess ? 0 : 1),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle?.id || 'muscle',
              type: 'multiple_choice',
              isCorrect: isSuccess,
              score: isSuccess ? 100 : 0,
              accuracyDetails: isSuccess ? '1/1 correct' : '0/1 fout',
            },
          ],
        },
      };
    });
  };

  // Selecteer of deselecteer een bewegingsoptie
  const handleToggleMovement = (movement: string) => {
    if (isEvaluated) return;
    setSelectedMovements((prev) =>
      prev.includes(movement) ? prev.filter((m) => m !== movement) : [...prev, movement]
    );
  };

  // Evalueer bewegingen test
  const handleMovementSubmit = () => {
    if (isEvaluated || !currentQuestion) return;

    const correct = currentQuestion.correctMovements || [];
    const selectedSet = new Set(selectedMovements);
    const correctSet = new Set(correct);

    const isSuccess =
      selectedSet.size === correctSet.size &&
      [...selectedSet].every((m) => correctSet.has(m));

    setIsEvaluated(true);
    setIsMovementSuccess(isSuccess);
    setIsPlacementSuccess(isSuccess);

    if (!isSuccess && currentQuestion) {
      registerIncorrectQuestion(currentQuestion);
    }

    if (isSuccess) {
      try {
        confetti({
          particleCount: 90,
          spread: 80,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    setStatsByType((prev) => {
      const activeKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
      const current = prev[activeKey] || initialStats();
      return {
        ...prev,
        [activeKey]: {
          ...current,
          totalQuestions: current.totalQuestions + 1,
          correctAnswers: current.correctAnswers + (isSuccess ? 1 : 0),
          closeAnswers: current.closeAnswers,
          incorrectAnswers: current.incorrectAnswers + (isSuccess ? 0 : 1),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle?.id || 'muscle',
              type: 'movements',
              isCorrect: isSuccess,
              score: isSuccess ? 100 : 0,
              accuracyDetails: isSuccess ? 'Alle bewegingen correct' : 'Niet alle bewegingen correct',
            },
          ],
        },
      };
    });
  };

  // Evalueer open invultoets
  const handleOpenAnswerSubmit = () => {
    if (isEvaluated || !currentQuestion) return;

    const official = currentQuestion.correctOpenAnswer || currentQuestion.muscle?.name || 'Onbekend';
    const result = validateAnatomicalAnswer(
      userOpenAnswer,
      official,
      currentQuestion.acceptableAnswers || []
    );

    setOpenAnswerFeedback(result);
    setIsEvaluated(true);
    const isSuccess = result.isCorrect;
    setIsPlacementSuccess(isSuccess);

    if (!isSuccess && currentQuestion) {
      registerIncorrectQuestion(currentQuestion);
    }

    if (isSuccess) {
      try {
        confetti({
          particleCount: 85,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    setStatsByType((prev) => {
      const activeKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
      const current = prev[activeKey] || initialStats();
      return {
        ...prev,
        [activeKey]: {
          ...current,
          totalQuestions: current.totalQuestions + 1,
          correctAnswers: current.correctAnswers + (isSuccess ? 1 : 0),
          closeAnswers: current.closeAnswers + (!isSuccess && result.isClose ? 1 : 0),
          incorrectAnswers: current.incorrectAnswers + (isSuccess ? 0 : 1),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle?.id || currentQuestion.bone?.id || 'bone',
              type: currentQuestion.type === 'bone' ? 'bone' : 'open_question',
              isCorrect: isSuccess,
              score: result.score,
              accuracyDetails: isSuccess
                ? 'Correct beantwoord'
                : result.isClose
                ? 'Bijna goed (spelfout)'
                : 'Onjuist',
            },
          ],
        },
      };
    });
  };

  // Reset toetssessie voor de actieve modus/type
  const handleResetStats = () => {
    if (window.confirm('Wilt u de score voor dit toetstype resetten?')) {
      const activeKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
      setStatsByType(prev => ({
        ...prev,
        [activeKey]: initialStats(),
      }));
      setRetryQueue([]);
      questionCounterRef.current = 0;
      if (practiceMode === 'joint') {
        setJointMuscleIndex(0);
        setJointSessionFinished(false);
        loadJointQuestion(0);
      } else {
        generateNewFreeQuestion();
      }
    }
  };

  if (!currentQuestion) {
    return (
      <div className="flex-1 flex items-center justify-center p-12 text-clinical-400">
        Vragen laden...
      </div>
    );
  }

  const { muscle, type } = currentQuestion;
  const canEvaluateManual = !isEvaluated && (
    type === 'origins'
      ? userOrigins.length > 0
      : type === 'insertions'
      ? userInsertions.length > 0
      : type === 'landmark'
      ? (currentQuestion.landmarkType === 'origin' ? userOrigins.length > 0 : userInsertions.length > 0)
      : userOrigins.length > 0 && userInsertions.length > 0
  );

  // Losse interface voor mobiele telefoons (PC interface blijft 100% ongewijzigd)
  if (isMobile) {
    return (
      <MobileQuizView
        currentQuestion={currentQuestion}
        activeTrapeziusPart={activeTrapeziusPart}
        setActiveTrapeziusPart={setActiveTrapeziusPart}
        hoppingButton={hoppingButton}
        requireAllVertebrae={requireAllVertebrae}
        setRequireAllVertebrae={setRequireAllVertebrae}
        onUndoLastPoint={handleUndoLastPoint}
        muscle={muscle}
        type={type}
        currentView={currentView}
        setCurrentView={setCurrentView}
        correctCount={currentStats.correctAnswers}
        incorrectCount={currentStats.incorrectAnswers}
        autoRotateView={autoRotateView}
        onToggleAutoRotate={handleToggleAutoRotate}
        autoZoom={autoZoom}
        onToggleAutoZoom={handleToggleAutoZoom}
        autoSwitchPointType={autoSwitchPointType}
        onToggleAutoSwitch={handleToggleAutoSwitch}
        evaluatedSide={evaluatedSide}
        isEvaluated={isEvaluated}
        isPlacementSuccess={isPlacementSuccess}
        matchResults={matchResults}
        showReferenceGhost={showReferenceGhost}
        setShowReferenceGhost={setShowReferenceGhost}
        userOrigins={userOrigins}
        userInsertions={userInsertions}
        setUserOrigins={setUserOrigins}
        setUserInsertions={setUserInsertions}
        activeQuizTool={activeQuizTool}
        setActiveQuizTool={setActiveQuizTool}
        handleSkeletonClick={handleSkeletonClick}
        handleUpdateUserPoint={handleUpdateUserPoint}
        handleDeleteUserPoint={handleDeleteUserPoint}
        evaluateAttempt={evaluateAttempt}
        handleNextQuestion={handleNextQuestion}
        canEvaluateManual={canEvaluateManual}
        expectedCounts={expectedCounts}
        practiceMode={practiceMode}
        setPracticeMode={setPracticeMode}
        selectedJointId={selectedJointId}
        setSelectedJointId={(val) => {
          setSelectedJointId(val);
          if (val === 'all') setIsShuffled(true);
          else setIsShuffled(false);
          setShuffleCounter(c => c + 1);
          setJointMuscleIndex(0);
          setJointSessionFinished(false);
        }}
        isShuffled={isShuffled}
        setIsShuffled={(shuf) => {
          setIsShuffled(shuf);
          setShuffleCounter(c => c + 1);
          setJointMuscleIndex(0);
          setJointSessionFinished(false);
        }}
        freeQuizType={freeQuizType}
        setFreeQuizType={(nextType) => {
          setFreeQuizType(nextType);
          generateNewFreeQuestion(nextType);
        }}
        jointMuscleIndex={jointMuscleIndex}
        jointMusclesCount={jointMuscles.length}
        jointCategoryName={activeJointCategory.name}
        selectedMultipleChoiceId={selectedMultipleChoiceId}
        handleMultipleChoiceSelect={handleMultipleChoiceSelect}
        selectedMovements={selectedMovements}
        handleToggleMovement={handleToggleMovement}
        handleMovementSubmit={handleMovementSubmit}
        userOpenAnswer={userOpenAnswer}
        setUserOpenAnswer={setUserOpenAnswer}
        handleOpenAnswerSubmit={handleOpenAnswerSubmit}
        openAnswerFeedback={openAnswerFeedback}
        toleranceMode={toleranceMode}
        setToleranceMode={setToleranceMode}
      />
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-start">
      {/* Linker/Midden kolom: Skelet met Vaste Hoogte (volledig stabiel, groot en beweegt NOOIT naar beneden) */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-4 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk: ViewToggle gecentreerd, Controleer rechts (vaste hoogte h-12) */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1 gap-2">
          {/* Linkerzijde: flex spacer zodat ViewToggle gecentreerd blijft */}
          <div className="flex-1 min-w-0" />

          {/* Midden: Aanzichtschakelaar [Ventraal] [Dorsaal] [Naast elkaar] */}
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={muscle?.view || currentView}
              showBothOption={true}
              activeLayout={viewLayout}
              onLayoutChange={setViewLayout}
            />
          </div>

          {/* Rechterzijde: flex spacer zodat ViewToggle gecentreerd blijft */}
          <div className="flex-1 min-w-0" />
        </div>

        {/* Skelet Container met SVG Overlay (vaste stabiele hoogte, beweegt NOOIT naar beneden) */}
        <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden relative">
          {/* Origo & Insertie knoppen links naast het skelet */}
          {!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && type !== 'bone' && (
            <div className="absolute left-3 sm:left-5 top-3 sm:top-5 z-20 flex flex-col gap-2">
              {/* Regel 1: Origo en Insertie */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setActiveQuizTool('origin')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs transition-colors ${
                    activeQuizTool === 'origin'
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400'
                      : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                  }`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${activeQuizTool === 'origin' ? 'bg-white' : 'bg-blue-600'}`} />
                  <span>Origo</span>
                </button>

                <button
                  type="button"
                  onClick={() => setActiveQuizTool('insertion')}
                  className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs transition-colors ${
                    activeQuizTool === 'insertion'
                      ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400'
                      : hoppingButton === 'insertion'
                      ? 'bg-orange-100 text-orange-950 border-orange-400 ring-4 ring-orange-300 ring-offset-1 animate-subtle-hop'
                      : 'bg-white text-orange-800 border-orange-200 hover:bg-orange-50'
                  } ${isScalingInsertion ? 'animate-subtle-scale' : ''}`}
                >
                  <span className={`w-2 h-2 rounded-full shrink-0 ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-orange-600'}`} />
                  <span>Insertie</span>
                </button>
              </div>

              {/* Regel 2: Terug en Verwijder knoppen, met bij de trapezius de pars tabs direct hiernaast */}
              <div className="flex items-center gap-2">
                {(userOrigins.length > 0 || userInsertions.length > 0) && (
                  <div className="flex items-center gap-1 bg-white/90 backdrop-blur-xs p-0.5 rounded-xl border border-slate-200 shadow-xs">
                    <button
                      type="button"
                      onClick={handleUndoLastPoint}
                      title="Laatste punt ongedaan maken"
                      className="p-1.5 bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 rounded-lg transition flex items-center justify-center"
                    >
                      <Undo2 className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleClearAllPoints}
                      title="Alle geplaatste punten wissen"
                      className="p-1.5 bg-rose-50 hover:bg-rose-100 text-rose-600 hover:text-rose-700 rounded-lg transition flex items-center justify-center"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )}

                {muscle?.id === 'trapezius' && !isEvaluated && (
                  <div className="flex items-center gap-1 bg-white/95 backdrop-blur-xs p-1 rounded-xl border border-slate-200 shadow-md">
                    {(['descendens', 'transversa', 'ascendens'] as const).map((partKey) => {
                      const label =
                        partKey === 'descendens'
                          ? 'Descendens'
                          : partKey === 'transversa'
                          ? 'Transversa'
                          : 'Ascendens';
                      const isActive = activeTrapeziusPart === partKey;
                      const isHopping = hoppingButton === partKey;

                      return (
                        <button
                          key={partKey}
                          type="button"
                          onClick={() => {
                            setActiveTrapeziusPart(partKey);
                            setActiveQuizTool('origin');
                          }}
                          className={`py-1 px-2.5 rounded-lg text-xs font-bold transition-colors ${
                            isActive
                              ? isHopping
                                ? 'bg-blue-600 text-white ring-4 ring-blue-300 ring-offset-1 animate-subtle-hop'
                                : 'bg-blue-600 text-white shadow-xs'
                              : isHopping
                              ? 'bg-blue-100 text-blue-900 ring-2 ring-blue-500 shadow-sm animate-subtle-hop'
                              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                          }`}
                        >
                          {label}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          )}

          {(() => {
            const isJointQuestion = type === 'joints' || 
                                    currentQuestion.mcKind === 'joint' || 
                                    currentQuestion.openKind === 'joint' || 
                                    Boolean(currentQuestion.jointQuizItem);
            const shouldShowMuscle = !isJointQuestion && type !== 'bone' && !!muscle;
            const jointFocusPoint = isJointQuestion ? (currentQuestion.targetFocusPoint || getJointLocation(currentQuestion.jointQuizItem)) : null;
            const isDrawingType = type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone' && type !== 'joints';
            const hideMuscleMarkers = !isEvaluated && isDrawingType;

            return viewLayout === 'both' ? (
              <div className="w-full h-full grid grid-cols-2 gap-4">
                {/* Ventraal skelet links */}
                <div className="relative w-full h-full flex flex-col items-center justify-center border-r border-slate-100 pr-2">
                  <SkeletonViewer
                    currentView="ventral"
                    activeMuscle={
                      shouldShowMuscle && muscle?.view === 'ventral'
                        ? muscle
                        : undefined
                    }
                    activeSide={evaluatedSide}
                    interactive={!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone'}
                    onSkeletonClick={(pt, isRight) => handleSkeletonClick({ ...pt, view: 'ventral' }, isRight)}
                    onUpdateUserPoint={handleUpdateUserPoint}
                    onDeleteUserPoint={handleDeleteUserPoint}
                    quizMatches={ventralMatches}
                    showReferenceGhost={showReferenceGhost && shouldShowMuscle && muscle?.view === 'ventral'}
                    userOrigins={ventralOrigins}
                    userInsertions={ventralInsertions}
                    targetBoneMarker={currentQuestion?.targetBoneMarker}
                    targetFocusPoint={jointFocusPoint?.view === 'ventral' ? jointFocusPoint : null}
                    autoCenterMuscle={autoZoom && (shouldShowMuscle || (jointFocusPoint?.view === 'ventral') || type === 'bone')}
                    hideMuscleMarkers={hideMuscleMarkers}
                    activeTrapeziusPart={activeTrapeziusPart}
                  />
                </div>

                {/* Dorsaal skelet rechts */}
                <div className="relative w-full h-full flex flex-col items-center justify-center pl-2">
                  <SkeletonViewer
                    currentView="dorsal"
                    activeMuscle={
                      shouldShowMuscle && muscle?.view === 'dorsal'
                        ? muscle
                        : undefined
                    }
                    activeSide={evaluatedSide}
                    interactive={!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone'}
                    onSkeletonClick={(pt, isRight) => handleSkeletonClick({ ...pt, view: 'dorsal' }, isRight)}
                    onUpdateUserPoint={handleUpdateUserPoint}
                    onDeleteUserPoint={handleDeleteUserPoint}
                    quizMatches={dorsalMatches}
                    showReferenceGhost={showReferenceGhost && shouldShowMuscle && muscle?.view === 'dorsal'}
                    userOrigins={dorsalOrigins}
                    userInsertions={dorsalInsertions}
                    targetBoneMarker={currentQuestion?.targetBoneMarker}
                    targetFocusPoint={jointFocusPoint?.view === 'dorsal' ? jointFocusPoint : null}
                    autoCenterMuscle={autoZoom && (shouldShowMuscle || (jointFocusPoint?.view === 'dorsal') || type === 'bone')}
                    hideMuscleMarkers={hideMuscleMarkers}
                    activeTrapeziusPart={activeTrapeziusPart}
                  />
                </div>
              </div>
            ) : (
              <SkeletonViewer
                currentView={currentView}
                activeMuscle={shouldShowMuscle ? muscle : undefined}
                activeSide={evaluatedSide}
                interactive={!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone'}
                onSkeletonClick={(pt, isRight) => handleSkeletonClick({ ...pt, view: currentView }, isRight)}
                onUpdateUserPoint={handleUpdateUserPoint}
                onDeleteUserPoint={handleDeleteUserPoint}
                quizMatches={matchResults}
                showReferenceGhost={showReferenceGhost && shouldShowMuscle}
                userOrigins={userOrigins}
                userInsertions={userInsertions}
                targetBoneMarker={currentQuestion?.targetBoneMarker}
                targetFocusPoint={jointFocusPoint}
                autoCenterMuscle={autoZoom && (shouldShowMuscle || !!jointFocusPoint || type === 'bone')}
                hideMuscleMarkers={hideMuscleMarkers}
                activeTrapeziusPart={activeTrapeziusPart}
              />
            );
          })()}
        </div>

        {/* Onderbalk met status & instructies (vaste h-8) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-between pt-2 border-t border-clinical-100 text-xs text-clinical-600 gap-2">
          <div className="flex-1 min-w-0" />
        </div>
      </div>

      {/* Rechter Zijpaneel: Modus, Vraag & Voortgang */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0">
        {/* Modus Kiezer: Oefenen per gewricht OF Toetsen (alle spieren) */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
          <div className="grid grid-cols-2 gap-1.5 p-1 bg-clinical-100 rounded-xl border border-clinical-200">
            <button
              type="button"
              onClick={() => {
                setPracticeMode('joint');
                setJointSessionFinished(false);
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                practiceMode === 'joint'
                  ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                  : 'text-clinical-700 hover:text-clinical-950 hover:bg-white/60'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Oefenen</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setPracticeMode('free');
              }}
              className={`py-2 px-2.5 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                practiceMode === 'free'
                  ? 'bg-blue-600 text-white shadow-xs ring-1 ring-blue-400'
                  : 'text-clinical-700 hover:text-clinical-950 hover:bg-white/60'
              }`}
            >
              <ListChecks className="w-3.5 h-3.5" />
              <span>Testen</span>
            </button>
          </div>

          <div className="flex items-center justify-between pt-1 border-t border-clinical-100">
            <label className="text-[11px] font-bold text-clinical-700 uppercase tracking-wider">
              {practiceMode === 'joint' ? 'Selecteer Gewricht' : 'Selecteer Testtype'}
            </label>
            {practiceMode === 'joint' && (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsShuffled(prev => !prev);
                    setShuffleCounter(prev => prev + 1);
                    setJointMuscleIndex(0);
                    setJointSessionFinished(false);
                  }}
                  className={`px-2 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 border transition ${
                    isShuffled
                      ? 'bg-blue-50 border-blue-300 text-blue-700'
                      : 'bg-white border-clinical-200 text-clinical-600 hover:bg-clinical-50'
                  }`}
                  title="Schud de vragen in willekeurige volgorde"
                >
                  <Shuffle className="w-3 h-3" />
                  <span>Shuffle {isShuffled ? 'Aan' : 'Uit'}</span>
                </button>
                <span className="text-xs font-semibold text-blue-600">
                  {jointMuscleIndex + 1} / {jointMuscles.length}
                </span>
              </div>
            )}
          </div>

          {practiceMode === 'joint' ? (
            <div className="space-y-2">
              <select
                value={selectedJointId}
                onChange={(e) => {
                  const val = e.target.value;
                  setSelectedJointId(val);
                  if (val === 'all') setIsShuffled(true);
                  else setIsShuffled(false);
                  setShuffleCounter((prev) => prev + 1);
                  setJointMuscleIndex(0);
                  setJointSessionFinished(false);
                }}
                className="w-full px-3 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs sm:text-sm font-semibold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
              >
                {JOINT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name} ({cat.muscleIds.length} spieren)
                  </option>
                ))}
              </select>
            </div>
          ) : (
            <select
              value={freeQuizType}
              onChange={(e) => {
                const nextType = e.target.value as QuizType | 'all';
                setFreeQuizType(nextType);
                generateNewFreeQuestion(nextType);
              }}
              className="w-full px-3 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs sm:text-sm font-semibold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="mixed">Gemengde toets</option>
              <option value="bone">Bot benoemen</option>
              <option value="full">Origo en insertie plaatsen</option>
              <option value="landmark">Vind aanhechtingspunt</option>
              <option value="multiple_choice">Meerkeuze test</option>
              <option value="open_question">Open invultest</option>
              <option value="movements">Bewegingen per spier</option>
              <option value="joints">Gewrichten</option>
            </select>
          )}

          {/* Compacte balk met switches voor automatisch roteren, inzoomen, type-switch en alle wervels vereisen */}
          <div className="pt-2 border-t border-clinical-100 grid grid-cols-4 gap-1 text-[10px]">
            <button
              type="button"
              onClick={handleToggleAutoRotate}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                autoRotateView
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Aanzicht automatisch roteren bij een nieuwe vraag"
            >
              <span className="font-semibold text-[10px] leading-tight">Roteren</span>
              <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                autoRotateView ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {autoRotateView ? 'Aan' : 'Uit'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleToggleAutoZoom}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                autoZoom
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Automatisch inzoomen op de actieve spierzone"
            >
              <span className="font-semibold text-[10px] leading-tight">Zoomen</span>
              <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                autoZoom ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {autoZoom ? 'Aan' : 'Uit'}
              </span>
            </button>
            <button
              type="button"
              onClick={handleToggleAutoSwitch}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                autoSwitchPointType
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Automatisch wisselen naar insertie zodra alle origo's geplaatst zijn"
            >
              <span className="font-semibold text-[10px] leading-tight">Switch</span>
              <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                autoSwitchPointType ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {autoSwitchPointType ? 'Aan' : 'Uit'}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setRequireAllVertebrae(!requireAllVertebrae)}
              className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition ${
                requireAllVertebrae
                  ? 'bg-blue-50 border-blue-200 text-blue-800'
                  : 'bg-slate-50 border-slate-200 text-slate-500 hover:bg-slate-100'
              }`}
              title="Alle wervels vereisen. Standaard uit: minimaal eerste en laatste wervel (meer mag)"
            >
              <span className="font-semibold text-[10px] leading-tight text-center">Alle<br />wervels</span>
              <span className={`mt-0.5 text-[9px] font-bold px-1.5 py-0.2 rounded ${
                requireAllVertebrae ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-600'
              }`}>
                {requireAllVertebrae ? 'Aan' : 'Uit'}
              </span>
            </button>
          </div>

          {/* Voortgangsbalk bij joint of full_all */}
          {practiceMode === 'joint' && (
            <div className="space-y-1">
              <div className="w-full bg-clinical-100 rounded-full h-2 overflow-hidden">
                <div
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${((jointMuscleIndex + (isEvaluated ? 1 : 0)) / jointMuscles.length) * 100}%`,
                  }}
                />
              </div>
            </div>
          )}
        </div>

        {/* Nauwkeurigheid tolerantie selector - alleen relevant bij tekenvragen */}
        {type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone' && type !== 'joints' && (
          <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-clinical-200/90 shadow-sm flex items-center justify-between gap-1 text-[11px]">
            <span className="font-bold text-slate-700">Tolerantie:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setToleranceMode('normal')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  toleranceMode === 'normal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Ruim: ruime marge (3.5%), vergevingsgezind"
              >
                Ruim
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('strict')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  toleranceMode === 'strict'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Medium: gemiddelde marge (2.5%)"
              >
                Medium
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('expert')}
                className={`px-2.5 py-1 rounded-lg font-bold transition text-[11px] ${
                  toleranceMode === 'expert'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Strikt: nauwe marge (1.5%)"
              >
                Strikt
              </button>
            </div>
          </div>
        )}

        {/* Gewricht sessie voltooid scherm */}
        {jointSessionFinished ? (
          <div className="bg-white p-6 rounded-2xl border border-clinical-200/90 shadow-sm text-center space-y-4 animate-in zoom-in-95 duration-200">
            <div className="w-14 h-14 bg-emerald-100 text-emerald-600 rounded-2xl flex items-center justify-center mx-auto shadow-inner">
              <Award className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-clinical-900">
                {selectedJointId === 'all' ? 'Alle spieren afgerond!' : 'Gewricht afgerond!'}
              </h3>
              <p className="text-xs text-clinical-500 mt-1">
                U heeft alle {jointMuscles.length} spieren van {activeJointCategory.name} geoefend.
              </p>
            </div>
            <div className="pt-2 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => {
                  setJointMuscleIndex(0);
                  setJointSessionFinished(false);
                  loadJointQuestion(0);
                }}
                className="w-full py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
              >
                Opnieuw oefenen
              </button>
              {selectedJointId !== 'all' && JOINT_CATEGORIES.findIndex((c) => c.id === selectedJointId) < JOINT_CATEGORIES.length - 1 && (
                <button
                  type="button"
                  onClick={() => {
                    const currIdx = JOINT_CATEGORIES.findIndex((c) => c.id === selectedJointId);
                    const nextJoint = JOINT_CATEGORIES[currIdx + 1];
                    setSelectedJointId(nextJoint.id);
                    setJointMuscleIndex(0);
                    setJointSessionFinished(false);
                  }}
                  className="w-full py-2 px-3 bg-clinical-100 hover:bg-clinical-200 text-clinical-800 rounded-xl text-xs font-semibold transition"
                >
                  Volgend gewricht →
                </button>
              )}
            </div>
          </div>
        ) : (
          /* Normale vraagkaart */
          <div className="bg-white p-5 rounded-2xl border border-clinical-200/90 shadow-sm space-y-4">
            <div className="flex items-center justify-between text-xs">
              <span className="px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-blue-100 text-blue-800 text-[11px] flex items-center gap-1.5">
                {practiceMode === 'joint' 
                  ? `Spier ${jointMuscleIndex + 1} van ${jointMuscles.length}`
                  : freeQuizType === 'mixed'
                  ? `Gemengde Toets • Vraag #${currentStats.totalQuestions + 1}`
                  : `Vraag #${currentStats.totalQuestions + 1}`}
              </span>
              {currentQuestion.isRetry && (
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-300">
                  Herhaling
                </span>
              )}
            </div>

            {/* Vraagtekst met duidelijke hiërarchie (Spiernaam direct in het oog springend) */}
            <div>
              {type === 'bone' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    Bot benoemen
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    Welk bot is hier gemarkeerd met de stip?
                  </h3>
                  <p className="text-xs text-clinical-500 mt-1">
                    Typ de Latijnse of Nederlandse naam van het bot in het invulveld hieronder.
                  </p>
                </div>
              ) : type === 'joint' || (practiceMode === 'joint' && jointPracticeType === 'attachments') || (type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && type !== 'joints') ? (
                <div>
                  <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wider mb-1">
                    Plaats de origo en insertie van:
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                    {cleanMuscleName(muscle?.name || '')}
                  </h3>
                  {muscle?.id === 'trapezius' && (
                    <p className="text-xs text-slate-500 font-medium mt-1">
                      Teken de verschillende partes (descendens, transversa, ascendens) los na elkaar in met de knoppen boven het skelet.
                    </p>
                  )}
                </div>
              ) : type === 'joints' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    Gewrichten • {currentQuestion.jointQuizItem?.topic || 'Theorie'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    {currentQuestion.jointQuizItem?.question || 'Beantwoord de vraag over het gewricht:'}
                  </h3>
                </div>
              ) : type === 'open_question' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    {currentQuestion.openKind === 'joint'
                      ? `Gewrichten • ${currentQuestion.jointQuizItem?.topic || 'Open Vraag'}`
                      : 'Open Invultest'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    {currentQuestion.openKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.openKind === 'origin'
                      ? `Wat is de juiste origo van de ${cleanMuscleName(muscle?.name || '')}?`
                      : currentQuestion.openKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${cleanMuscleName(muscle?.name || '')}?`
                      : currentQuestion.jointQuizItem?.question || `Over welk gewricht loopt de ${cleanMuscleName(muscle?.name || '')} voornamelijk?`}
                  </h3>
                </div>
              ) : type === 'movements' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    {practiceMode === 'joint' ? `Beweging in ${activeJointCategory.title}` : 'Bewegingen & functies'}
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight mb-1.5">
                    {cleanMuscleName(muscle?.name || '')}
                  </h3>
                  <p className="text-xs text-clinical-600">
                    {practiceMode === 'joint'
                      ? `Welke beweging(en) verzorgt de ${cleanMuscleName(muscle?.name || '')} in dit gewricht? Vink alle juiste opties aan.`
                      : 'Welke bewegingen verzorgt deze spier? Vink alle juiste opties aan (meerdere antwoorden mogelijk).'}
                  </p>
                </div>
              ) : type === 'multiple_choice' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    {currentQuestion.mcKind === 'muscle'
                      ? 'Spier Identificatie'
                      : currentQuestion.mcKind === 'origin'
                      ? 'Origo van de spier'
                      : currentQuestion.mcKind === 'insertion'
                      ? 'Insertie van de spier'
                      : currentQuestion.mcKind === 'joint'
                      ? `Gewrichten • ${currentQuestion.jointQuizItem?.topic || 'Theorie'}`
                      : 'Functie & werking'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    {currentQuestion.mcKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.mcKind === 'origin'
                      ? `Wat is de juiste origo van de ${cleanMuscleName(muscle?.name || '')}?`
                      : currentQuestion.mcKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${cleanMuscleName(muscle?.name || '')}?`
                      : currentQuestion.mcKind === 'joint'
                      ? currentQuestion.jointQuizItem?.question
                      : `Wat is de juiste werking/functie van de ${cleanMuscleName(muscle?.name || '')}?`}
                  </h3>
                </div>
              ) : (
                <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                  {type === 'landmark'
                    ? 'Wijs dit aanhechtingspunt aan op het skelet:'
                    : `Plaats de origo en insertie van de ${cleanMuscleName(muscle?.name || '')}`}
                </h3>
              )}

              {type === 'landmark' && (
                <div className="mt-2.5 p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200/90 space-y-1">
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    {currentQuestion.landmarkType === 'origin' ? 'Origo' : 'Insertie'}:
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-blue-950">
                    📍 {cleanAttachmentText(currentQuestion.landmarkText)}
                  </div>
                  {isEvaluated && (
                    <div className="text-xs text-clinical-600 font-semibold pt-1 border-t border-blue-200/60 mt-1.5">
                      Behoort bij: <span className="text-clinical-900 font-bold">{cleanMuscleName(muscle?.name || '')}</span>
                    </div>
                  )}
                </div>
              )}

            </div>

            {/* DUIDELIJK ZICHTBARE TOGGLE: ORIGO / INSERTIE INTEKENEN (zonder overbodig label) */}
            {!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && type !== 'bone' && type !== 'joints' && (
              <div className="pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveQuizTool('origin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      activeQuizTool === 'origin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400'
                        : 'bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeQuizTool === 'origin' ? 'bg-white' : 'bg-blue-600'}`} />
                    <span>Origo</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQuizTool('insertion')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-colors ${
                      activeQuizTool === 'insertion'
                        ? 'bg-orange-600 text-white border-orange-600 shadow-xs ring-2 ring-orange-400'
                        : hoppingButton === 'insertion'
                        ? 'bg-orange-100 text-orange-950 border-orange-400 ring-4 ring-orange-300 ring-offset-1 animate-subtle-hop'
                        : 'bg-orange-50/70 text-orange-800 border-orange-200 hover:bg-orange-100'
                    } ${isScalingInsertion ? 'animate-subtle-scale' : ''}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-orange-600'}`} />
                    <span>Insertie</span>
                  </button>
                </div>
              </div>
            )}

            {/* Controleer knop (wanneer punten geplaatst zijn) */}
            {!isEvaluated && canEvaluateManual && (
              <button
                type="button"
                onClick={() => evaluateAttempt(userOrigins, userInsertions)}
                className={`w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${hoppingButton === 'check' ? 'ring-4 ring-emerald-300 ring-offset-2 animate-subtle-hop' : ''}`}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Controleer antwoord</span>
              </button>
            )}

            {/* Meerkeuze Opties: Samengevoegd (Identificatie, Origo, Insertie, Functie of Gewrichten) */}
            {(type === 'multiple_choice' || type === 'joints') && currentQuestion.mcTextOptions && (
              <div className="space-y-2 pt-2 border-t border-clinical-100">
                <label className="text-[11px] font-bold text-clinical-600 uppercase tracking-wider block">
                  Kies het juiste antwoord:
                </label>
                {currentQuestion.mcTextOptions.map((optText, idx) => {
                  const letters = ['A', 'B', 'C', 'D'];
                  const isSelected = selectedMultipleChoiceId === optText;
                  const isCorrect = optText === currentQuestion.correctMcText;
                  let btnStyle = 'bg-clinical-50 border-clinical-200 text-clinical-800 hover:bg-blue-50 hover:border-blue-300';

                  if (isEvaluated) {
                    if (isCorrect) {
                      btnStyle = 'bg-emerald-50 border-emerald-400 text-emerald-900 font-bold ring-2 ring-emerald-300';
                    } else if (isSelected) {
                      btnStyle = 'bg-rose-50 border-rose-300 text-rose-900 line-through';
                    }
                  }

                  return (
                    <button
                      key={idx}
                      disabled={isEvaluated}
                      onClick={() => handleMultipleChoiceSelect(optText)}
                      className={`w-full p-3 text-left rounded-xl border text-xs sm:text-sm transition flex items-center justify-between shadow-xs ${btnStyle}`}
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="w-6 h-6 rounded-lg bg-white border border-clinical-200 text-clinical-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {letters[idx] || (idx + 1)}
                        </span>
                        {currentQuestion.mcKind === 'function' && (
                          <div className="flex items-center gap-1 shrink-0">
                            {optText.split('|').map((part, pIdx) => (
                              <MovementIcon key={pIdx} movement={part.trim()} className="w-4 h-4 text-blue-600 shrink-0" />
                            ))}
                          </div>
                        )}
                        <span className="font-semibold leading-relaxed">{optText}</span>
                      </div>
                      {isEvaluated && isCorrect && (
                        <Check className="w-4 h-4 text-emerald-600 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Nieuwe Toets: Bewegingen per spier (Checkboxes, 8 opties, meerdere antwoorden mogelijk) */}
            {type === 'movements' && currentQuestion.movementOptions && (
              <div className="space-y-3 pt-2 border-t border-clinical-100">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {currentQuestion.movementOptions.map((mov) => {
                    const isChecked = selectedMovements.includes(mov);
                    const isActuallyCorrect = (currentQuestion.correctMovements || []).includes(mov);

                    let itemStyle = 'bg-clinical-50 border-clinical-200 text-clinical-800 hover:bg-blue-50/60';
                    if (isChecked && !isEvaluated) {
                      itemStyle = 'bg-blue-50 border-blue-400 text-blue-950 font-bold shadow-xs ring-1 ring-blue-300';
                    }

                    if (isEvaluated) {
                      if (isActuallyCorrect) {
                        itemStyle = isChecked
                          ? 'bg-emerald-50 border-emerald-500 text-emerald-950 font-bold ring-2 ring-emerald-300'
                          : 'bg-emerald-50/60 border-dashed border-emerald-400 text-emerald-800 font-semibold';
                      } else if (isChecked && !isActuallyCorrect) {
                        itemStyle = 'bg-rose-50 border-rose-400 text-rose-900 font-bold line-through';
                      } else {
                        itemStyle = 'bg-clinical-50/50 border-clinical-200 text-clinical-400 opacity-60';
                      }
                    }

                    return (
                      <button
                        key={mov}
                        type="button"
                        disabled={isEvaluated}
                        onClick={() => handleToggleMovement(mov)}
                        className={`p-2.5 rounded-xl border text-xs transition flex items-center gap-2 text-left ${itemStyle}`}
                      >
                        <div className="shrink-0">
                          {isChecked ? (
                            <CheckSquare className="w-4 h-4 text-blue-600" />
                          ) : (
                            <Square className="w-4 h-4 text-clinical-400" />
                          )}
                        </div>
                        <MovementIcon movement={mov} className="w-4 h-4 text-slate-700 shrink-0" />
                        <span className="capitalize font-semibold">{mov}</span>
                      </button>
                    );
                  })}
                </div>

                {!isEvaluated && (
                  <button
                    type="button"
                    onClick={handleMovementSubmit}
                    disabled={selectedMovements.length === 0}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${
                      selectedMovements.length > 0
                        ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                        : 'bg-clinical-200 text-clinical-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Controleer bewegingen</span>
                  </button>
                )}
              </div>
            )}

            {/* Open Invultoets: Zelf typen met soepele vergevingsgezinde controle */}
            {(type === 'open_question' || type === 'bone') && (
              <div className="space-y-3 pt-2 border-t border-clinical-100">
                <div>
                  <input
                    type="text"
                    disabled={isEvaluated}
                    autoFocus
                    value={userOpenAnswer}
                    onChange={(e) => setUserOpenAnswer(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' && !isEvaluated && userOpenAnswer.trim()) {
                        handleOpenAnswerSubmit();
                      }
                    }}
                    placeholder={type === 'bone' ? 'Typ naam van het bot (bijv. Os coxae of Heupbeen)...' : 'Typ jouw antwoord...'}
                    className="w-full px-3.5 py-2.5 bg-clinical-50 border border-clinical-200 rounded-xl text-sm font-bold text-clinical-950 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
                  />
                </div>

                {!isEvaluated && (
                  <button
                    type="button"
                    disabled={!userOpenAnswer.trim()}
                    onClick={handleOpenAnswerSubmit}
                    className={`w-full py-2.5 px-4 rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2 ${
                      userOpenAnswer.trim()
                        ? 'bg-blue-600 hover:bg-blue-700 text-white'
                        : 'bg-clinical-200 text-clinical-400 cursor-not-allowed'
                    }`}
                  >
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Controleer antwoord</span>
                  </button>
                )}
              </div>
            )}

            {/* Actieve feedback na beantwoording */}
            {isEvaluated && (
              <QuizFeedback
                muscle={muscle}
                matches={matchResults}
                targetCount={expectedCounts.total}
                showReferenceGhost={showReferenceGhost}
                onToggleReference={() => setShowReferenceGhost(!showReferenceGhost)}
                onNextQuestion={handleNextQuestion}
                quizType={type}
                mcKind={currentQuestion.mcKind || currentQuestion.openKind}
                landmarkType={currentQuestion.landmarkType}
                isMultipleChoiceSuccess={isMultipleChoiceSuccess}
                correctAnswerText={currentQuestion.correctOpenAnswer || currentQuestion.correctMcText}
                isMovementSuccess={isMovementSuccess}
                correctMovements={currentQuestion.correctMovements}
                correctMovementsText={(currentQuestion.correctMovements || []).join(', ')}
                isPlacementSuccess={isPlacementSuccess}
                userOpenAnswer={userOpenAnswer}
                openValidationResult={openAnswerFeedback}
                jointExplanation={currentQuestion.jointQuizItem?.explanation}
                toleranceValue={toleranceValue}
              />
            )}

            {/* Hulpknop om vraag over te slaan */}
            {!isEvaluated && (
              <div className="pt-2 border-t border-clinical-100 flex items-center justify-between">
                <button
                  type="button"
                  onClick={handleNextQuestion}
                  className="flex items-center gap-1.5 text-xs text-clinical-500 hover:text-clinical-800 transition"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{practiceMode === 'joint' ? 'Spier overslaan' : 'Andere vraag'}</span>
                </button>
              </div>
            )}
          </div>
        )}

        {/* Voortgangs- & Sessiestatistieken per toetstype */}
        <QuizStats stats={currentStats} onResetStats={handleResetStats} />
      </div>
    </div>
  );
};
