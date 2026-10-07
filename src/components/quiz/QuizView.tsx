import React, { useState, useEffect, useCallback, useMemo } from 'react';
import confetti from 'canvas-confetti';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { ViewToggle } from '../common/ViewToggle';
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
import { getMovementQuestionOptions } from '../../data/muscleMovements';
import { evaluatePointSet, distanceToSegment, projectToSegment, getAccuracy } from '../../utils/coordinates';
import { validateAnatomicalAnswer, AnswerValidationResult } from '../../utils/answerMatching';
import { RefreshCw, Check, Award, CheckCircle2, Shuffle, Square, CheckSquare } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { MobileQuizView } from './MobileQuizView';

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
    setQuizPracticeMode
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
  const [toleranceMode, setToleranceMode] = useState<'normal' | 'strict' | 'expert'>('normal');
  const toleranceValue = toleranceMode === 'expert' ? 0.015 : toleranceMode === 'strict' ? 0.025 : 0.035;

  // Voor 'free' modus: welk quiztype? 'full' (Origo én insertie plaatsen over alle spieren) is de standaard!
  const [freeQuizType, setFreeQuizType] = useState<QuizType | 'all'>('full');

  // Actieve vraag
  const [currentQuestion, setCurrentQuestion] = useState<QuizQuestion | null>(null);

  // Gebruikersinvoer: gescheiden origo's en inserties
  const [userOrigins, setUserOrigins] = useState<Point2D[]>([]);
  const [userInsertions, setUserInsertions] = useState<Point2D[]>([]);

  // Actief intekentool: 'origin' of 'insertion'
  const [activeQuizTool, setActiveQuizTool] = useState<'origin' | 'insertion'>('origin');

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

  // Sessie statistieken per toetstype individueel bijgehouden
  const [statsByType, setStatsByType] = useState<Record<string, QuizStatsData>>({
    joint: initialStats(),
    landmark: initialStats(),
    multiple_choice: initialStats(),
    movements: initialStats(),
    open_question: initialStats(),
    function: initialStats(),
    all: initialStats(),
  });

  const activeStatsKey = practiceMode === 'joint' ? 'joint' : freeQuizType;
  const currentStats = statsByType[activeStatsKey] || initialStats();

  const activeJointCategory = useMemo(() => {
    if (selectedJointId === 'all') {
      return {
        id: 'all',
        code: 'ALL',
        name: 'alle gewrichten & spieren',
        pageInfo: 'Alle spieren',
        title: 'Alle spieren (door elkaar)',
        muscleIds: muscles.map((m) => m.id),
      };
    }
    return getJointCategory(selectedJointId) || JOINT_CATEGORIES[0];
  }, [selectedJointId, muscles]);

  // Spieren behorend tot het actieve gewricht (met optionele shuffle)
  const jointMuscles = useMemo(() => {
    if (!activeJointCategory) return [];
    const base = activeJointCategory.muscleIds
      .map((id) => muscles.find((m) => m.id === id))
      .filter((m): m is Muscle => m !== undefined);

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
  }, [activeJointCategory, muscles, isShuffled, shuffleCounter, selectedJointId]);

  // Aantal verwachte punten per zijde (ondersteunt brede aanhechtingen zoals wervels)
  const getExpectedCounts = useCallback((side: 'left' | 'right' | 'midline') => {
    if (!currentQuestion) return { origins: 1, insertions: 1, rawOrigins: 1, rawInsertions: 1, total: 2, isMultiSpan: false };
    const vis = currentQuestion.muscle.visuals[side] || { origins: [], insertions: [] };
    const rawOrigins = vis.origins?.length || 1;
    const rawInsertions = vis.insertions?.length || 1;
    const origins = rawOrigins > 2 ? 2 : Math.max(1, rawOrigins);
    const insertions = rawInsertions > 2 ? 2 : Math.max(1, rawInsertions);

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

  // Genereer vraag voor het geselecteerde gewricht op positie index
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
  }, [jointMuscles, selectedJointId, setCurrentView]);

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

  // Genereer een nieuwe willekeurige vraag voor de 'free' modus
  const generateNewFreeQuestion = useCallback((typeOverride?: QuizType | 'all') => {
    if (muscles.length === 0) return;

    const targetType = typeOverride !== undefined ? typeOverride : freeQuizType;
    let randMuscle = muscles[Math.floor(Math.random() * muscles.length)];
    let type: QuizType = 'full';

    if (targetType === 'all') {
      const types: QuizType[] = ['full', 'landmark', 'multiple_choice', 'movements', 'open_question'];
      type = types[Math.floor(Math.random() * types.length)];
    } else {
      type = targetType;
    }

    let options: Muscle[] = [];
    let mcKind: 'muscle' | 'origin' | 'insertion' | 'function' | undefined;
    let mcSubtype: 'origin' | 'insertion' | undefined;
    let mcTextOptions: string[] | undefined;
    let correctMcText: string | undefined;

    // Samengevoegde meerkeuzetoets: wisselt willekeurig af tussen identificatie, origo, insertie en functie
    if (type === 'multiple_choice') {
      const kinds: ('muscle' | 'origin' | 'insertion' | 'function')[] = ['muscle', 'origin', 'insertion', 'function'];
      mcKind = kinds[Math.floor(Math.random() * kinds.length)];

      if (mcKind === 'muscle') {
        correctMcText = randMuscle.name;
        const otherMuscles = muscles
          .filter((m) => m.id !== randMuscle.id)
          .map((m) => m.name);
        const shuffledOthers = Array.from(new Set(otherMuscles)).sort(() => 0.5 - Math.random()).slice(0, 3);
        mcTextOptions = [correctMcText, ...shuffledOthers].sort(() => 0.5 - Math.random());
      } else if (mcKind === 'origin') {
        mcSubtype = 'origin';
        correctMcText = randMuscle.originText;
        const otherTexts = muscles
          .filter((m) => m.id !== randMuscle.id)
          .map((m) => m.originText)
          .filter((t): t is string => Boolean(t && t.trim() !== '' && t !== correctMcText));
        const shuffledOthers = Array.from(new Set(otherTexts)).sort(() => 0.5 - Math.random()).slice(0, 3);
        mcTextOptions = [correctMcText, ...shuffledOthers].sort(() => 0.5 - Math.random());
      } else if (mcKind === 'insertion') {
        mcSubtype = 'insertion';
        correctMcText = randMuscle.insertionText;
        const otherTexts = muscles
          .filter((m) => m.id !== randMuscle.id)
          .map((m) => m.insertionText)
          .filter((t): t is string => Boolean(t && t.trim() !== '' && t !== correctMcText));
        const shuffledOthers = Array.from(new Set(otherTexts)).sort(() => 0.5 - Math.random()).slice(0, 3);
        mcTextOptions = [correctMcText, ...shuffledOthers].sort(() => 0.5 - Math.random());
      } else {
        // 'function'
        correctMcText = randMuscle.functionText || getMuscleFunctionDescription(randMuscle) || 'Geen specifieke functie';
        const otherTexts = muscles
          .filter((m) => m.id !== randMuscle.id)
          .map((m) => m.functionText || getMuscleFunctionDescription(m))
          .filter((t): t is string => Boolean(t && t.trim() !== '' && t !== correctMcText));
        const shuffledOthers = Array.from(new Set(otherTexts)).sort(() => 0.5 - Math.random()).slice(0, 3);
        mcTextOptions = [correctMcText, ...shuffledOthers].sort(() => 0.5 - Math.random());
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
        // 'joint'
        const jId = randMuscle.jointCategories?.[0] || 'coxae';
        const jCat = getJointCategory(jId);
        correctOpenAnswer = jCat?.title || jId;
        acceptableAnswers = [
          jCat?.title || '',
          jCat?.name || '',
          jCat?.pageInfo || '',
          jId,
        ].filter(Boolean);
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
        targetLandmarkIndex = Math.floor(Math.random() * pts.length);
        const chosen = pts[targetLandmarkIndex];
        landmarkText = chosen.name || (landmarkType === 'origin' ? randMuscle.originText : randMuscle.insertionText);
      } else {
        targetLandmarkIndex = 0;
        landmarkText = landmarkType === 'origin' ? randMuscle.originText : randMuscle.insertionText;
      }
    }

    setCurrentQuestion({
      id: `${randMuscle.id}-${Date.now()}`,
      muscle: randMuscle,
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
    });

    setUserOrigins([]);
    setUserInsertions([]);
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

    // Schakel automatisch over naar het juiste aanzicht van de spier
    setCurrentView(randMuscle.view);
  }, [muscles, freeQuizType, getMuscleFunctionDescription, setCurrentView]);

  // Initialisatie effect
  useEffect(() => {
    if (practiceMode === 'joint') {
      setJointSessionFinished(false);
      loadJointQuestion(jointMuscleIndex);
    } else {
      generateNewFreeQuestion(freeQuizType);
    }
  }, [practiceMode, selectedJointId, jointMuscleIndex, loadJointQuestion, freeQuizType]);

  // Volgende vraag handler
  const handleNextQuestion = () => {
    if (practiceMode === 'joint') {
      const nextIdx = jointMuscleIndex + 1;
      if (nextIdx < jointMuscles.length) {
        setJointMuscleIndex(nextIdx);
        loadJointQuestion(nextIdx);
      } else {
        setJointSessionFinished(true);
      }
    } else {
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
    if (!currentQuestion) return;

    const muscle = currentQuestion.muscle;
    const isMidline = muscle.symmetryType === 'midline';

    // Bepaal welke zijden getest moeten worden: student mag ALTIJD links OF rechts intekenen!
    const sidesToTest: ('left' | 'right' | 'midline')[] = isMidline ? ['midline'] : ['left', 'right'];

    let bestSide: 'left' | 'right' | 'midline' = isMidline ? 'midline' : 'left';
    let bestMatches: MatchResult[] = [];
    let bestCorrectCount = -1;
    let minDistanceSum = Infinity;
    let bestPassed = false;
    let bestRequired = 1;

    for (const testSide of sidesToTest) {
      const vis: MuscleVisualData = muscle.visuals[testSide] || { origins: [], insertions: [], musclePath: [], attachmentLines: [] };
      const targetOrigins = vis.origins || [];
      const targetInsertions = vis.insertions || [];

      let sideMatches: MatchResult[] = [];
      let sideRequired = 0;
      let sideCorrect = 0;
      let sidePassed = false;

      if (muscle.id === 'erector_spinae' && (currentQuestion.type === 'origins' || currentQuestion.type === 'insertions')) {
        // M. erector spinae: wervelkolomlijn evaluatie voor afzonderlijke origo/insertie vraag
        const spineTop = targetInsertions[0] || { x: testSide === 'right' ? 0.48 : 0.52, y: 0.18 };
        const spineBottom = targetOrigins[0] || { x: testSide === 'right' ? 0.485 : 0.515, y: 0.45 };
        const pts = currentQuestion.type === 'origins' ? originsToEval : insertionsToEval;
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
        const targetPts = currentQuestion.type === 'landmark'
          ? [targetOrigins[currentQuestion.targetLandmarkIndex ?? 0] || targetOrigins[0]].filter(Boolean)
          : targetOrigins;
        const res = evaluatePointSet(originsToEval, targetPts, 'origin', toleranceValue, vis.attachmentLines || []);
        sideMatches = res.matches;
        sideRequired = res.requiredCount;
        sideCorrect = res.correctCount;
        sidePassed = res.isPassed;
      } else if (currentQuestion.type === 'insertions' || (currentQuestion.type === 'landmark' && currentQuestion.landmarkType === 'insertion')) {
        const targetPts = currentQuestion.type === 'landmark'
          ? [targetInsertions[currentQuestion.targetLandmarkIndex ?? 0] || targetInsertions[0]].filter(Boolean)
          : targetInsertions;
        const res = evaluatePointSet(insertionsToEval, targetPts, 'insertion', toleranceValue, vis.attachmentLines || []);
        sideMatches = res.matches;
        sideRequired = res.requiredCount;
        sideCorrect = res.correctCount;
        sidePassed = res.isPassed;
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

        const resOrig = evalPointOnSpine(originsToEval, 'origin');
        const resIns = evalPointOnSpine(insertionsToEval, 'insertion');
        sideMatches = [...resOrig.matches, ...resIns.matches];
        sideRequired = 2;
        sideCorrect = resOrig.correctCount + resIns.correctCount;
        sidePassed = resOrig.isPassed && resIns.isPassed;
      } else {
        // 'full' of 'joint': match origo's en inserties afzonderlijk tegen hun doelen (inclusief aanhechtingslijnen/zones)
        const resOrig = evaluatePointSet(originsToEval, targetOrigins, 'origin', toleranceValue, vis.attachmentLines || []);
        const resIns = evaluatePointSet(insertionsToEval, targetInsertions, 'insertion', toleranceValue, vis.attachmentLines || []);
        sideMatches = [...resOrig.matches, ...resIns.matches];
        sideRequired = resOrig.requiredCount + resIns.requiredCount;
        sideCorrect = resOrig.correctCount + resIns.correctCount;
        sidePassed = resOrig.isPassed && resIns.isPassed;
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
      }
    }

    setEvaluatedSide(bestSide);
    setMatchResults(bestMatches);
    setIsEvaluated(true);
    setIsPlacementSuccess(bestPassed);

    // Zodra het antwoord gecontroleerd is, toon het juiste aanzicht van de spier voor duidelijke visuele feedback
    if (muscle && currentView !== muscle.view) {
      setCurrentView(muscle.view);
    }

    const isSuccess = bestPassed;
    const closeCount = bestMatches.filter((m) => m.accuracy === 'close').length;

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
          incorrectAnswers: current.incorrectAnswers + (!isSuccess && closeCount === 0 ? 1 : 0),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle.id,
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
    if (currentQuestion.type === 'multiple_choice' || currentQuestion.type === 'movements' || currentQuestion.type === 'function') return;

    // Aanzichtvalidatie
    if (currentView !== currentQuestion.muscle.view) {
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

    if (toolToUse === 'origin') {
      nextOrigins = [...userOrigins, point];
      setUserOrigins(nextOrigins);
    } else {
      nextInsertions = [...userInsertions, point];
      setUserInsertions(nextInsertions);
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
        // 'joint'
        if (nextOrigins.length >= 1 && nextInsertions.length >= 1) {
          evaluateAttempt(nextOrigins, nextInsertions);
        } else if (toolToUse === 'origin' && nextOrigins.length >= 1 && nextInsertions.length === 0) {
          setActiveQuizTool('insertion');
        }
      }
    }
  };

  // Verslepen van geplaatste punten indien net verkeerd neergezet
  const handleUpdateUserPoint = (pointType: 'origin' | 'insertion', index: number, newPoint: Point2D) => {
    if (isEvaluated) return;
    if (pointType === 'origin') {
      setUserOrigins(prev => {
        const next = [...prev];
        next[index] = newPoint;
        return next;
      });
    } else {
      setUserInsertions(prev => {
        const next = [...prev];
        next[index] = newPoint;
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
      : chosenTextOrId === currentQuestion.muscle.id;

    setIsMultipleChoiceSuccess(isSuccess);
    setIsPlacementSuccess(isSuccess);

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
              muscleId: currentQuestion.muscle.id,
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
              muscleId: currentQuestion.muscle.id,
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

    const official = currentQuestion.correctOpenAnswer || currentQuestion.muscle.name;
    const result = validateAnatomicalAnswer(
      userOpenAnswer,
      official,
      currentQuestion.acceptableAnswers || []
    );

    setOpenAnswerFeedback(result);
    setIsEvaluated(true);
    const isSuccess = result.isCorrect;
    setIsPlacementSuccess(isSuccess);

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
          incorrectAnswers: current.incorrectAnswers + (!isSuccess && !result.isClose ? 1 : 0),
          streak: isSuccess ? current.streak + 1 : 0,
          history: [
            ...current.history,
            {
              questionId: currentQuestion.id,
              muscleId: currentQuestion.muscle.id,
              type: 'open_question',
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
        muscle={muscle}
        type={type}
        currentView={currentView}
        setCurrentView={setCurrentView}
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

          {/* Midden: Aanzichtschakelaar [Ventraal] [Dorsaal] */}
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={muscle.view}
            />
          </div>

          {/* Rechterzijde: Controleer knop */}
          <div className="flex items-center justify-end flex-1 min-w-0">
            {!isEvaluated && canEvaluateManual && (
              <button
                type="button"
                onClick={() => evaluateAttempt(userOrigins, userInsertions)}
                className="py-1 px-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold shadow-xs transition flex items-center gap-1.5"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Controleer</span>
              </button>
            )}
          </div>
        </div>

        {/* Skelet Container met SVG Overlay (vaste stabiele hoogte, beweegt NOOIT naar beneden) */}
        <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden relative">
          {/* Origo & Insertie knoppen links naast het hoofd van het skelet, onder elkaar */}
          {!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && (
            <div className="absolute left-3 sm:left-5 top-3 sm:top-5 z-20 flex flex-col gap-2">
              <button
                type="button"
                onClick={() => setActiveQuizTool('origin')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs transition-all ${
                  activeQuizTool === 'origin'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400'
                    : 'bg-white text-blue-800 border-blue-200 hover:bg-blue-50'
                }`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${activeQuizTool === 'origin' ? 'bg-white' : 'bg-blue-600'}`} />
                <span>Origo ({userOrigins.length})</span>
              </button>

              <button
                type="button"
                onClick={() => setActiveQuizTool('insertion')}
                className={`py-1.5 px-3 rounded-xl text-xs font-bold flex items-center gap-2 border shadow-xs transition-all ${
                  activeQuizTool === 'insertion'
                    ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-400'
                    : 'bg-white text-rose-800 border-rose-200 hover:bg-rose-50'
                } ${isScalingInsertion ? 'animate-subtle-scale' : ''}`}
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-red-600'}`} />
                <span>Insertie ({userInsertions.length})</span>
              </button>
            </div>
          )}

          <SkeletonViewer
            currentView={currentView}
            activeMuscle={
              type === 'multiple_choice' || type === 'movements' || type === 'function' || type === 'open_question' || isEvaluated
                ? muscle
                : undefined
            }
            activeSide={evaluatedSide}
            interactive={!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question'}
            onSkeletonClick={handleSkeletonClick}
            onUpdateUserPoint={handleUpdateUserPoint}
            onDeleteUserPoint={handleDeleteUserPoint}
            quizMatches={matchResults}
            showReferenceGhost={showReferenceGhost}
            userOrigins={userOrigins}
            userInsertions={userInsertions}
          />
        </div>

        {/* Onderbalk met status & instructies (vaste h-8) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-between pt-2 border-t border-clinical-100 text-xs text-clinical-600 gap-2">
          <div className="flex items-center gap-2 font-medium">
            {type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && (
              <>
                {type === 'landmark' ? (
                  <span className="font-bold text-slate-700">
                    {currentQuestion.landmarkType === 'origin' ? 'Origo' : 'Insertie'}: {(currentQuestion.landmarkType === 'origin' ? userOrigins.length : userInsertions.length)} geplaatst
                  </span>
                ) : (
                  <>
                    <span className="text-blue-700 font-bold">Origo: {userOrigins.length} geplaatst</span>
                    <span className="text-clinical-300">•</span>
                    <span className="text-rose-700 font-bold">Insertie: {userInsertions.length} geplaatst</span>
                  </>
                )}
              </>
            )}
          </div>
          {!isEvaluated && (userOrigins.length > 0 || userInsertions.length > 0) && (
            <button
              type="button"
              onClick={() => {
                setUserOrigins([]);
                setUserInsertions([]);
                setActiveQuizTool(currentQuestion.landmarkType === 'insertion' ? 'insertion' : 'origin');
              }}
              className="text-xs text-rose-600 hover:text-rose-800 font-semibold underline"
            >
              Wis geplaatste punten
            </button>
          )}
        </div>
      </div>

      {/* Rechter Zijpaneel: Modus, Vraag & Voortgang */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0">
        {/* Enkele Toetstype Selector */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-bold text-clinical-700 uppercase tracking-wider">
              Kies Toetstype
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
            <select
              value={selectedJointId}
              onChange={(e) => {
                setSelectedJointId(e.target.value);
                setShuffleCounter((prev) => prev + 1);
                setJointMuscleIndex(0);
                setJointSessionFinished(false);
              }}
              className="w-full px-3 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs sm:text-sm font-semibold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              {JOINT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.title} ({cat.muscleIds.length} spieren)
                </option>
              ))}
            </select>
          ) : (
            <select
              value={freeQuizType}
              onChange={(e) => {
                const nextType = e.target.value as QuizType;
                setFreeQuizType(nextType);
                generateNewFreeQuestion(nextType);
              }}
              className="w-full px-3 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs sm:text-sm font-semibold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
            >
              <option value="full">Origo én insertie plaatsen (alle spieren)</option>
              <option value="landmark">Vind aanhechtingspunt (origo / insertie)</option>
              <option value="multiple_choice">Meerkeuze toets (MC)</option>
              <option value="open_question">Open invultoets</option>
              <option value="movements">Bewegingen per spier</option>
            </select>
          )}

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
        {type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && (
          <div className="bg-white px-3.5 py-2.5 rounded-2xl border border-clinical-200/90 shadow-sm flex items-center justify-between gap-1 text-[11px]">
            <span className="font-bold text-slate-700">Tolerantie:</span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => setToleranceMode('normal')}
                className={`px-2 py-1 rounded-lg font-bold transition text-[10px] ${
                  toleranceMode === 'normal'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Normaal: 3.5% marge"
              >
                Normaal (3.5%)
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('strict')}
                className={`px-2 py-1 rounded-lg font-bold transition text-[10px] ${
                  toleranceMode === 'strict'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Strikt: 2.5% marge"
              >
                Strikt (2.5%)
              </button>
              <button
                type="button"
                onClick={() => setToleranceMode('expert')}
                className={`px-2 py-1 rounded-lg font-bold transition text-[10px] ${
                  toleranceMode === 'expert'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'bg-clinical-50 text-slate-600 hover:bg-slate-100 border border-slate-200'
                }`}
                title="Zeer strikt: 1.5% marge"
              >
                Zeer strikt (1.5%)
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
              <span className="px-2.5 py-1 rounded-lg font-bold uppercase tracking-wider bg-blue-100 text-blue-800 text-[11px]">
                {practiceMode === 'joint' 
                  ? `Spier ${jointMuscleIndex + 1} van ${jointMuscles.length}`
                  : `Vraag #${currentStats.totalQuestions + 1}`}
              </span>
            </div>

            {/* Vraagtekst met duidelijke hiërarchie (Spiernaam direct in het oog springend) */}
            <div>
              {practiceMode === 'joint' || (type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question') ? (
                <div>
                  <div className="text-xs font-semibold text-clinical-500 uppercase tracking-wider mb-1">
                    Plaats de origo en insertie van:
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight">
                    {muscle.name}
                  </h3>
                </div>
              ) : type === 'open_question' ? (
                <div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    {currentQuestion.openKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.openKind === 'origin'
                      ? `Wat is de juiste origo van de ${muscle.name}?`
                      : currentQuestion.openKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${muscle.name}?`
                      : `Over welk gewricht (articulatio) loopt de ${muscle.name} voornamelijk?`}
                  </h3>
                </div>
              ) : type === 'movements' ? (
                <div>
                  <div className="text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
                    Bewegingen & functies
                  </div>
                  <h3 className="text-xl sm:text-2xl font-black text-blue-950 tracking-tight mb-1.5">
                    {muscle.name}
                  </h3>
                  <p className="text-xs text-clinical-600">
                    Welke bewegingen verzorgt deze spier? Vink alle juiste opties aan (meerdere antwoorden mogelijk).
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
                      : 'Functie & werking'}
                  </div>
                  <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                    {currentQuestion.mcKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.mcKind === 'origin'
                      ? `Wat is de juiste origo van de ${muscle.name}?`
                      : currentQuestion.mcKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${muscle.name}?`
                      : `Wat is de juiste werking/functie van de ${muscle.name}?`}
                  </h3>
                </div>
              ) : (
                <h3 className="text-base sm:text-lg font-black text-clinical-900 leading-snug">
                  {type === 'landmark'
                    ? 'Wijs dit aanhechtingspunt aan op het skelet:'
                    : `Plaats de origo en insertie van de ${muscle.name}`}
                </h3>
              )}

              {type === 'landmark' && (
                <div className="mt-2.5 p-3.5 bg-blue-50/90 rounded-2xl border border-blue-200/90 space-y-1">
                  <div className="text-[11px] font-bold text-blue-700 uppercase tracking-wider">
                    {currentQuestion.landmarkType === 'origin' ? 'Origo' : 'Insertie'}:
                  </div>
                  <div className="text-sm sm:text-base font-extrabold text-blue-950">
                    📍 {currentQuestion.landmarkText}
                  </div>
                  {isEvaluated && (
                    <div className="text-xs text-clinical-600 font-semibold pt-1 border-t border-blue-200/60 mt-1.5">
                      Behoort bij: <span className="text-clinical-900 font-bold">{muscle.name}</span>
                    </div>
                  )}
                </div>
              )}

              {type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && expectedCounts.isMultiSpan && (
                <p className="text-xs text-amber-800 bg-amber-50 p-2.5 rounded-xl border border-amber-200 mt-2 font-medium">
                  💡 Bij meerdere aanhechtingen (bijv. wervelkolom): plaats minimaal de uiterste punten (hoogste en laagste).
                </p>
              )}
            </div>

            {/* DUIDELIJK ZICHTBARE TOGGLE: ORIGO / INSERTIE INTEKENEN (zonder overbodig label) */}
            {!isEvaluated && type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'landmark' && type !== 'open_question' && (
              <div className="pt-1">
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveQuizTool('origin')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      activeQuizTool === 'origin'
                        ? 'bg-blue-600 text-white border-blue-600 shadow-xs ring-2 ring-blue-400'
                        : 'bg-blue-50/70 text-blue-800 border-blue-200 hover:bg-blue-100'
                    }`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeQuizTool === 'origin' ? 'bg-white' : 'bg-blue-600'}`} />
                    <span>Origo ({userOrigins.length})</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setActiveQuizTool('insertion')}
                    className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition-all ${
                      activeQuizTool === 'insertion'
                        ? 'bg-red-600 text-white border-red-600 shadow-xs ring-2 ring-red-400'
                        : 'bg-rose-50/70 text-rose-800 border-rose-200 hover:bg-rose-100'
                    } ${isScalingInsertion ? 'animate-subtle-scale' : ''}`}
                  >
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-red-600'}`} />
                    <span>Insertie ({userInsertions.length})</span>
                  </button>
                </div>
              </div>
            )}

            {/* Controleer knop (wanneer punten geplaatst zijn) */}
            {!isEvaluated && canEvaluateManual && (
              <button
                type="button"
                onClick={() => evaluateAttempt(userOrigins, userInsertions)}
                className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Controleer antwoord</span>
              </button>
            )}

            {/* Meerkeuze Opties: Samengevoegd (Identificatie, Origo, Insertie of Functie) */}
            {type === 'multiple_choice' && currentQuestion.mcTextOptions && (
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
            {type === 'open_question' && (
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
                    placeholder="Typ jouw antwoord..."
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
