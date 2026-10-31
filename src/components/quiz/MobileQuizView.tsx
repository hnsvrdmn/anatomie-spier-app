import React, { useState, useRef, useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { 
  QuizQuestion, 
  Point2D, 
  MatchResult, 
  Muscle, 
  AnatomicalView, 
  QuizType 
} from '../../types/anatomy';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { getJointLocation } from '../../data/jointQuestions';
import { MovementIcon } from '../common/MovementIcon';
import { AnswerValidationResult } from '../../utils/answerMatching';
import { 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  ChevronRight,
  Trash2, 
  CheckSquare, 
  Square, 
  Shuffle, 
  RotateCcw,
  GraduationCap,
  ListChecks
} from 'lucide-react';

// Schoon spiernaam op zodat tekst tussen haakjes het antwoord niet verklapt
const cleanMuscleName = (name?: string): string => {
  if (!name) return '';
  return name.replace(/\s*\([^)]*\)/g, '').trim();
};

// Schoon aanhechtingstekst op: geen verklarende tekst tussen haakjes
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

interface MobileQuizViewProps {
  currentQuestion: QuizQuestion;
  muscle?: Muscle;
  type: string;
  currentView: AnatomicalView;
  setCurrentView: (view: AnatomicalView) => void;
  evaluatedSide: 'left' | 'right' | 'midline';
  isEvaluated: boolean;
  isPlacementSuccess: boolean;
  matchResults: MatchResult[];
  showReferenceGhost: boolean;
  setShowReferenceGhost?: (val: boolean) => void;
  userOrigins: Point2D[];
  userInsertions: Point2D[];
  setUserOrigins?: React.Dispatch<React.SetStateAction<Point2D[]>>;
  setUserInsertions?: React.Dispatch<React.SetStateAction<Point2D[]>>;
  activeQuizTool: 'origin' | 'insertion';
  setActiveQuizTool: (tool: 'origin' | 'insertion') => void;
  handleSkeletonClick: (pt: Point2D, isRightClick?: boolean) => void;
  handleUpdateUserPoint: (type: 'origin' | 'insertion', index: number, pt: Point2D) => void;
  handleDeleteUserPoint: (type: 'origin' | 'insertion', index: number) => void;
  evaluateAttempt: (origins: Point2D[], insertions: Point2D[]) => void;
  handleNextQuestion: () => void;
  canEvaluateManual: boolean;
  expectedCounts?: { origins: number; insertions: number; total: number };
  practiceMode: 'joint' | 'free';
  setPracticeMode?: (m: 'joint' | 'free') => void;
  selectedJointId: string;
  setSelectedJointId: (val: string) => void;
  isShuffled: boolean;
  setIsShuffled: (val: boolean) => void;
  freeQuizType: QuizType | 'all';
  setFreeQuizType: (val: QuizType | 'all') => void;
  jointMuscleIndex: number;
  jointMusclesCount: number;
  jointCategoryName: string;
  selectedMultipleChoiceId: string | null;
  handleMultipleChoiceSelect: (val: string) => void;
  selectedMovements: string[];
  handleToggleMovement: (mov: string) => void;
  handleMovementSubmit: () => void;
  userOpenAnswer: string;
  setUserOpenAnswer: (val: string) => void;
  handleOpenAnswerSubmit: () => void;
  openAnswerFeedback: AnswerValidationResult | null;
  toleranceMode?: 'normal' | 'strict' | 'expert';
  setToleranceMode?: (val: 'normal' | 'strict' | 'expert') => void;
  correctCount?: number;
  incorrectCount?: number;
  autoRotateView?: boolean;
  onToggleAutoRotate?: () => void;
  autoZoom?: boolean;
  onToggleAutoZoom?: () => void;
}

export const MobileQuizView: React.FC<MobileQuizViewProps> = ({
  currentQuestion,
  muscle,
  type,
  currentView,
  setCurrentView,
  evaluatedSide,
  isEvaluated,
  isPlacementSuccess,
  matchResults,
  showReferenceGhost,
  userOrigins,
  userInsertions,
  setUserOrigins,
  setUserInsertions,
  activeQuizTool,
  setActiveQuizTool,
  handleSkeletonClick,
  handleUpdateUserPoint,
  handleDeleteUserPoint,
  evaluateAttempt,
  handleNextQuestion,
  canEvaluateManual,
  practiceMode,
  setPracticeMode,
  selectedJointId,
  setSelectedJointId,
  isShuffled,
  setIsShuffled,
  freeQuizType,
  setFreeQuizType,
  jointMuscleIndex,
  jointMusclesCount,
  jointCategoryName,
  selectedMultipleChoiceId,
  handleMultipleChoiceSelect,
  selectedMovements,
  handleToggleMovement,
  handleMovementSubmit,
  userOpenAnswer,
  setUserOpenAnswer,
  handleOpenAnswerSubmit,
  openAnswerFeedback,
  toleranceMode = 'normal',
  setToleranceMode,
  correctCount = 0,
  incorrectCount = 0,
  autoRotateView = true,
  onToggleAutoRotate,
  autoZoom = true,
  onToggleAutoZoom,
}) => {
  const { quizOpenOptionsTrigger } = useMuscles();

  // Stand van het frame:
  // - false (minimale stand): toont altijd de vraag, origo & insertie, en antwoordknoppen.
  // - true (grote stand): toont het instellingenmenu (oefenen vs testen, gewricht/testtype kiezen, auto-rotate).
  // Standaard UITGEKLAPT (true) bij openen van de toets of tikken op Oefen/Test, zodat direct zichtbaar is dat je testtype/gewricht kunt wijzigen!
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Wanneer de student op Oefen of Test tikt (in header of switcher): frame automatisch uitklappen!
  const prevPracticeModeRef = useRef(practiceMode);
  useEffect(() => {
    if (prevPracticeModeRef.current !== practiceMode) {
      prevPracticeModeRef.current = practiceMode;
      setIsExpanded(true);
    }
  }, [practiceMode]);

  useEffect(() => {
    if (quizOpenOptionsTrigger > 0) {
      setIsExpanded(true);
    }
  }, [quizOpenOptionsTrigger]);

  // Volgende vraag: zorgt dat het frame altijd in de minimale vraagstand blijft!
  const onNextQuestion = () => {
    setIsExpanded(false);
    handleNextQuestion();
  };

  const isDrawingType = type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question' && type !== 'bone' && type !== 'joints';
  const hasPlacedPoints = userOrigins.length > 0 || userInsertions.length > 0;

  // Pointer drag handlers voor het "-" streepje
  const hasDraggedRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    hasDraggedRef.current = false;
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (deltaY < -18) {
      // Omhoog draggen -> frame groter maken
      setIsExpanded(true);
      hasDraggedRef.current = true;
      dragStartYRef.current = e.clientY;
    } else if (deltaY > 18) {
      // Omlaag draggen -> frame terug naar minimale view
      setIsExpanded(false);
      hasDraggedRef.current = true;
      dragStartYRef.current = e.clientY;
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragStartYRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleClickHandle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    setIsExpanded((prev) => !prev);
  };

  // Beknopte weergave van het juiste antwoord voor de compacte feedbackbalk
  const correctSummaryText = 
    type === 'bone'
      ? (currentQuestion.correctOpenAnswer || 'Bot')
      : type === 'joints'
      ? (currentQuestion.correctMcText || currentQuestion.correctOpenAnswer || 'Gewricht')
      : type === 'multiple_choice'
      ? (currentQuestion.correctMcText || muscle?.name || '')
      : type === 'open_question'
      ? (currentQuestion.correctOpenAnswer || muscle?.name || '')
      : type === 'movements'
      ? (currentQuestion.correctMovements?.join(', ') || muscle?.functionText || 'Zie details')
      : currentQuestion.landmarkText 
      ? `${currentQuestion.landmarkType === 'origin' ? 'Origo: ' : 'Insertie: '}${currentQuestion.landmarkText}`
      : type === 'origins'
      ? `Origo: ${muscle?.originText || ''}`
      : type === 'insertions'
      ? `Insertie: ${muscle?.insertionText || ''}`
      : `${muscle?.name || ''} (O: ${muscle?.originText || ''} | I: ${muscle?.insertionText || ''})`;

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] flex flex-col bg-slate-900 overflow-hidden select-none">
      
      {/* 1. HET SKELET (Volledig scherm tot aan het frame onderin) */}
      <div className="flex-1 w-full h-full pb-[36px] pt-0 flex items-center justify-center relative overflow-hidden bg-slate-900">
        
        {/* Minimalistische draaiknop direct OVER het skelet rechtsboven (optimaal schermgebruik) */}
        <button
          type="button"
          onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
          className="absolute top-2.5 right-2.5 z-30 w-9 h-9 bg-white/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md flex items-center justify-center text-slate-700 active:scale-90 hover:text-slate-950 transition pointer-events-auto"
          title={`Draai skelet (${currentView === 'ventral' ? 'Dorsaal' : 'Ventraal'})`}
          aria-label="Draai skelet"
        >
          <RotateCcw className="w-4 h-4 text-slate-700" />
        </button>

        {/* Compacte O (Origo, blauw) en I (Insertie, rood) knoppen */}
        {isDrawingType && !isEvaluated && (
          <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
            <div className="flex items-center gap-1 bg-slate-950/80 backdrop-blur-md p-1 rounded-xl border border-slate-700/80 shadow-lg">
              <button
                type="button"
                onClick={() => setActiveQuizTool('origin')}
                title="Plaats Origo (blauw)"
                aria-label="Origo"
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                  activeQuizTool === 'origin'
                    ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400'
                    : 'text-blue-400 hover:bg-slate-800'
                }`}
              >
                O
              </button>
              <button
                type="button"
                onClick={() => setActiveQuizTool('insertion')}
                title="Plaats Insertie (rood)"
                aria-label="Insertie"
                className={`w-7 h-7 rounded-lg text-xs font-black transition-all flex items-center justify-center ${
                  activeQuizTool === 'insertion'
                    ? 'bg-red-600 text-white shadow-sm ring-2 ring-rose-400'
                    : 'text-rose-400 hover:bg-slate-800'
                }`}
              >
                I
              </button>
            </div>

            {hasPlacedPoints && (
              <button
                type="button"
                onClick={() => {
                  if (setUserOrigins) setUserOrigins([]);
                  if (setUserInsertions) setUserInsertions([]);
                  setActiveQuizTool(currentQuestion.landmarkType === 'insertion' ? 'insertion' : 'origin');
                }}
                className="h-7 w-7 bg-rose-950/90 backdrop-blur-md border border-rose-800/80 text-rose-300 hover:bg-rose-900 rounded-lg shadow-lg flex items-center justify-center transition active:scale-95"
                title="Wis geplaatste punten"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              </button>
            )}
          </div>
        )}

        {(() => {
          const isJointQuestion = type === 'joints' || 
                                  currentQuestion.mcKind === 'joint' || 
                                  currentQuestion.openKind === 'joint' || 
                                  Boolean(currentQuestion.jointQuizItem);
          const shouldShowMuscle = !isJointQuestion && type !== 'bone' && !!muscle;
          const jointFocusPoint = isJointQuestion ? (currentQuestion.targetFocusPoint || getJointLocation(currentQuestion.jointQuizItem)) : null;

          return (
            <SkeletonViewer
              currentView={currentView}
              activeMuscle={shouldShowMuscle ? muscle : undefined}
              activeSide={evaluatedSide}
              interactive={!isEvaluated && isDrawingType}
              onSkeletonClick={handleSkeletonClick}
              onUpdateUserPoint={handleUpdateUserPoint}
              onDeleteUserPoint={handleDeleteUserPoint}
              quizMatches={matchResults}
              showReferenceGhost={(showReferenceGhost || isEvaluated) && shouldShowMuscle}
              userOrigins={userOrigins}
              userInsertions={userInsertions}
              targetBoneMarker={currentQuestion?.targetBoneMarker}
              targetFocusPoint={jointFocusPoint}
              hideZoomToolbar={true}
              isMobile={true}
              autoCenterMuscle={autoZoom && (shouldShowMuscle || !!jointFocusPoint || type === 'bone')}
              hideMuscleMarkers={!isEvaluated && isDrawingType}
            />
          );
        })()}
      </div>

      {/* 2. VASTE ONDERKAART: COMPACT (MINIMAAL) OF GROOT (INSTELLINGEN) */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] rounded-t-3xl transition-all duration-300 pointer-events-auto flex flex-col ${
          isExpanded
            ? 'px-3.5 pt-2 pb-3 max-h-[85vh]'
            : isEvaluated
            ? 'px-3.5 pt-2 pb-3 max-h-[45vh]'
            : 'px-3.5 pt-2 pb-3 max-h-[55vh]'
        }`}
      >
        {/* HET "-" STREEPJE: Druk hierop of drag omhoog om frame groter te maken */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClickHandle}
          className="w-full flex items-center justify-center cursor-pointer py-2.5 touch-none select-none -mt-1.5 mb-0.5 active:opacity-70 group"
          title={isExpanded ? "Tik of sleep omlaag voor minimale weergave" : "Tik op het '-' of sleep omhoog om instellingen te openen"}
          aria-label={isExpanded ? "Sluit instellingenpaneel" : "Open instellingenpaneel"}
          role="button"
          tabIndex={0}
        >
          <div className="w-12 h-1.5 bg-slate-400 group-hover:bg-slate-600 rounded-full transition-colors active:scale-95" />
        </div>

        {/* GROTE STAND: UITKLAPBAAR INSTELMENU */}
        {isExpanded && (
          <div className="pb-3 border-b border-slate-200 mb-2 space-y-2 animate-in fade-in duration-200">
            {/* Modus Switcher: Oefenen vs Testen */}
            {setPracticeMode && (
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-100 rounded-xl">
                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode('joint');
                    setIsExpanded(true);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    practiceMode === 'joint'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <GraduationCap className="w-3.5 h-3.5" />
                  <span>Oefenen</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPracticeMode('free');
                    setIsExpanded(true);
                  }}
                  className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 ${
                    practiceMode === 'free'
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  <ListChecks className="w-3.5 h-3.5" />
                  <span>Testen</span>
                </button>
              </div>
            )}

            <div className="flex items-center justify-between text-xs pt-1">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                {practiceMode === 'joint' ? 'Kies Gewricht' : 'Kies Testtype'}
              </span>
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 text-xs bg-slate-100 rounded-lg"
              >
                Sluiten ✕
              </button>
            </div>

            <div className="space-y-1.5">
              {practiceMode === 'joint' ? (
                <>
                  <select
                    value={selectedJointId}
                    onChange={(e) => {
                      setSelectedJointId(e.target.value);
                      setIsExpanded(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    {JOINT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ')} ({cat.muscleIds.length} spieren)
                      </option>
                    ))}
                  </select>

                  <div className="flex items-center justify-between px-1 pt-0.5">
                    <span className="text-xs text-slate-600 font-medium">Volgorde husselen:</span>
                    <button
                      type="button"
                      onClick={() => setIsShuffled(!isShuffled)}
                      className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                        isShuffled ? 'bg-blue-600 text-white' : 'bg-slate-200 text-slate-700'
                      }`}
                    >
                      <Shuffle className="w-3.5 h-3.5" />
                      <span>{isShuffled ? 'Aan' : 'Uit'}</span>
                    </button>
                  </div>
                </>
              ) : (
                <select
                  value={freeQuizType}
                  onChange={(e) => {
                    setFreeQuizType(e.target.value as QuizType);
                    setIsExpanded(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                >
                  <option value="mixed">Gemengde toets (alle testen door elkaar)</option>
                  <option value="bone">Bot benoemen</option>
                  <option value="full">Origo en insertie plaatsen</option>
                  <option value="landmark">Vind aanhechtingspunt</option>
                  <option value="multiple_choice">Meerkeuze test</option>
                  <option value="open_question">Open invultest</option>
                  <option value="movements">Bewegingen per spier</option>
                  <option value="joints">Gewrichten</option>
                </select>
              )}

              {/* Minimale tolerantie / nauwkeurigheid kiezer - alleen relevant bij tekenvragen */}
              {isDrawingType && (
                <div className="flex items-center justify-between px-1 pt-1.5 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Nauwkeurigheid:</span>
                  <div className="flex items-center gap-1 bg-slate-200/80 p-0.5 rounded-lg">
                    {(['normal', 'strict', 'expert'] as const).map((mode) => {
                      const labels = { normal: 'Laag', strict: 'Medium', expert: 'Strikt' };
                      const isSelected = (toleranceMode || 'normal') === mode;
                      return (
                        <button
                          key={mode}
                          type="button"
                          onClick={() => setToleranceMode?.(mode)}
                          className={`px-2 py-0.5 rounded-md text-[11px] font-bold transition ${
                            isSelected
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'text-slate-600 hover:text-slate-900'
                          }`}
                        >
                          {labels[mode]}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Minimalistische toggle voor automatisch roteren van aanzicht */}
              {onToggleAutoRotate && (
                <div className="flex items-center justify-between px-1 pt-1.5 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Aanzicht autom. roteren:</span>
                  <button
                    type="button"
                    onClick={onToggleAutoRotate}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      autoRotateView ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{autoRotateView ? 'Aan' : 'Uit'}</span>
                  </button>
                </div>
              )}

              {/* Minimalistische toggle voor automatisch inzoomen */}
              {onToggleAutoZoom && (
                <div className="flex items-center justify-between px-1 pt-1.5 border-t border-slate-200">
                  <span className="text-xs text-slate-600 font-medium">Automatisch inzoomen:</span>
                  <button
                    type="button"
                    onClick={onToggleAutoZoom}
                    className={`px-2.5 py-1 rounded-lg text-xs font-bold transition flex items-center gap-1.5 ${
                      autoZoom ? 'bg-blue-600 text-white shadow-xs' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    <span>{autoZoom ? 'Aan' : 'Uit'}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* MINIMALE STAND (ALTIJD DIRECT ZICHTBAAR): VRAAGTITEL, VRAAGSTELLING & BEDIENING */}
        {!isEvaluated && (
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <div className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 select-none">
                <span>
                  {selectedJointId === 'all' && practiceMode === 'joint'
                    ? `Origo & Insertie • ${jointMuscleIndex + 1}/${jointMusclesCount}`
                    : practiceMode === 'joint'
                    ? `${jointCategoryName} • ${jointMuscleIndex + 1}/${jointMusclesCount}`
                    : freeQuizType === 'mixed'
                    ? `Gemengde Toets • ${
                        type === 'bone'
                          ? 'Bot benoemen'
                          : type === 'full'
                          ? 'Origo & Insertie'
                          : type === 'multiple_choice'
                          ? 'Meerkeuze Test'
                          : type === 'joints'
                          ? 'Gewrichten'
                          : type === 'open_question'
                          ? 'Open Vraag'
                          : type === 'movements'
                          ? 'Bewegingen'
                          : 'Aanhechtingspunt'
                      }`
                    : freeQuizType === 'bone'
                    ? 'Bot benoemen'
                    : freeQuizType === 'full'
                    ? 'Origo & Insertie'
                    : freeQuizType === 'multiple_choice'
                    ? 'Meerkeuze Test'
                    : freeQuizType === 'joints'
                    ? 'Gewrichten'
                    : freeQuizType === 'open_question'
                    ? 'Open Vraag'
                    : freeQuizType === 'movements'
                    ? 'Bewegingen'
                    : 'Aanhechtingspunt'}
                </span>
                {currentQuestion.isRetry && (
                  <span className="ml-1 px-1.5 py-0.5 bg-amber-100 text-amber-800 border border-amber-300 rounded text-[9px] font-bold">
                    Herhaling
                  </span>
                )}
              </div>

              {/* Duidelijke vraagstelling per toetstype */}
              <div className="mt-0.5">
                {type === 'bone' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    Welk bot is hier gemarkeerd met de stip?
                  </h2>
                ) : type === 'joints' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {currentQuestion.jointQuizItem?.question || 'Beantwoord de vraag over het gewricht:'}
                  </h2>
                ) : type === 'multiple_choice' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {currentQuestion.mcKind === 'muscle'
                      ? 'Welke spier is hier gemarkeerd?'
                      : currentQuestion.mcKind === 'origin'
                      ? `Wat is de juiste origo van de ${cleanMuscleName(muscle?.name)}?`
                      : currentQuestion.mcKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${cleanMuscleName(muscle?.name)}?`
                      : currentQuestion.mcKind === 'joint'
                      ? currentQuestion.jointQuizItem?.question
                      : `Wat is de werking/functie van de ${cleanMuscleName(muscle?.name)}?`}
                  </h2>
                ) : type === 'open_question' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {currentQuestion.openKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.openKind === 'origin'
                      ? `Wat is de juiste origo van de ${cleanMuscleName(muscle?.name)}?`
                      : currentQuestion.openKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${cleanMuscleName(muscle?.name)}?`
                      : currentQuestion.jointQuizItem?.question || `Over welk gewricht loopt de ${cleanMuscleName(muscle?.name)}?`}
                  </h2>
                ) : type === 'movements' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {practiceMode === 'joint'
                      ? `Welke bewegingen in dit gewricht: ${cleanMuscleName(muscle?.name)}`
                      : `Vink alle bewegingen aan van de ${cleanMuscleName(muscle?.name)}:`}
                  </h2>
                ) : type === 'landmark' ? (
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 block">
                      {currentQuestion.landmarkType === 'origin' ? 'Plaats origo:' : 'Plaats insertie:'}
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {cleanAttachmentText(currentQuestion.landmarkText) || cleanMuscleName(muscle?.name)}
                    </h2>
                  </div>
                ) : (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    Plaats origo & insertie: {cleanMuscleName(muscle?.name)}
                  </h2>
                )}
              </div>
            </div>

            {/* Minimalistische score & Snel overslaan */}
            <div className="flex items-center gap-2 shrink-0">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold select-none">
                <span className="text-emerald-600">{correctCount}</span>
                <span className="text-rose-500">{incorrectCount}</span>
              </div>
              <button
                type="button"
                onClick={onNextQuestion}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition"
                title="Volgende / Overslaan"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}

        {/* B. ACTIE & BEANTWOORDING PER VRAAGTYPE */}
        
        {/* 1. Tekenvraag (Origo & Insertie plaatsen) */}
        {isDrawingType && !isEvaluated && (
          <div className="pt-1">
            {canEvaluateManual ? (
              <button
                type="button"
                onClick={() => evaluateAttempt(userOrigins, userInsertions)}
                className="w-full h-10 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-xs font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Controleer antwoord</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 font-medium py-1 text-center">
                {currentQuestion.landmarkType === 'origin' && 'Plaats de origo (blauw)'}
                {currentQuestion.landmarkType === 'insertion' && 'Plaats de insertie (rood)'}
                {!currentQuestion.landmarkType && 'Plaats origo (blauw) en insertie (rood)'}
              </div>
            )}
          </div>
        )}

        {/* 2. Meerkeuze vraag (Vollidige tekst altijd leesbaar, niet afgesneden) */}
        {(type === 'multiple_choice' || type === 'joints') && currentQuestion.mcTextOptions && !isEvaluated && (
          <div className="grid grid-cols-1 gap-1.5 pt-1">
            {currentQuestion.mcTextOptions.map((optText, idx) => {
              const isSelected = selectedMultipleChoiceId === optText;
              return (
                <button
                  key={idx}
                  onClick={() => handleMultipleChoiceSelect(optText)}
                  className={`w-full py-2 px-2.5 text-left rounded-xl border text-xs font-semibold transition flex items-center justify-between shadow-2xs ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold ring-1 ring-blue-300'
                      : 'border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-start gap-2 flex-1 min-w-0 pr-1">
                    <span className="w-4 h-4 rounded-md bg-white border border-slate-300 text-[10px] font-bold flex items-center justify-center shrink-0 mt-0.5">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="text-xs font-medium leading-snug break-words">{optText}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Bewegingen per spier (Compacte 4x2 grid zonder scrollen) */}
        {type === 'movements' && currentQuestion.movementOptions && !isEvaluated && (
          <div className="space-y-1.5 pt-1">
            <div className="grid grid-cols-2 gap-1 w-full">
              {currentQuestion.movementOptions.map((mov) => {
                const isChecked = selectedMovements.includes(mov);
                return (
                  <button
                    key={mov}
                    type="button"
                    onClick={() => handleToggleMovement(mov)}
                    className={`py-1.5 px-2 rounded-lg border text-xs font-semibold transition flex items-center gap-1.5 text-left ${
                      isChecked
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold ring-1 ring-blue-300'
                        : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                    }`}
                  >
                    {isChecked ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                    ) : (
                      <Square className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    )}
                    <MovementIcon movement={mov} className="w-3.5 h-3.5 text-slate-600 shrink-0" />
                    <span className="truncate leading-tight text-[11px]">{mov}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleMovementSubmit}
              disabled={selectedMovements.length === 0}
              className={`w-full h-9 rounded-xl text-xs font-bold shadow-sm transition flex items-center justify-center gap-1.5 ${
                selectedMovements.length > 0 ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Controleer ({selectedMovements.length} gekozen)</span>
            </button>
          </div>
        )}

        {/* 4. Open vraag of Bot benoemen */}
        {(type === 'open_question' || type === 'bone') && !isEvaluated && (
          <div className="space-y-1.5 pt-1">
            <input
              type="text"
              value={userOpenAnswer}
              onChange={(e) => setUserOpenAnswer(e.target.value)}
              placeholder={type === 'bone' ? 'Typ naam van het bot...' : 'Typ je antwoord...'}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white"
            />
            <button
              type="button"
              disabled={!userOpenAnswer.trim()}
              onClick={handleOpenAnswerSubmit}
              className="w-full h-9 bg-blue-600 text-white rounded-xl text-xs font-bold shadow-sm flex items-center justify-center gap-1.5"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Controleer</span>
            </button>
          </div>
        )}

        {/* C. NA BEANTWOORDING: ALTIJD VOLLEDIG LEESBAAR */}
        {isEvaluated && (
          <div className="flex items-center justify-between gap-3 pt-0.5 animate-in fade-in duration-200">
            {/* 1. Goed / Fout badge */}
            <div className="shrink-0">
              {isPlacementSuccess ? (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-100 text-emerald-950 font-black text-xs shadow-2xs">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Goed!</span>
                </span>
              ) : (
                <span className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-rose-100 text-rose-950 font-black text-xs shadow-2xs">
                  <span className="text-rose-600 font-black text-sm leading-none">✕</span>
                  <span>Fout</span>
                </span>
              )}
            </div>

            {/* 2. De naam van de origo & insertie / juiste antwoord (VOLLEDIG LEESBAAR, NOOIT AFGESNEDEN!) */}
            <div className="flex-1 min-w-0 pr-1 max-h-[35vh] overflow-y-auto custom-scrollbar text-left">
              {type === 'multiple_choice' || type === 'joints' ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Juiste antwoord:</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">
                    {correctSummaryText}
                  </p>
                  {currentQuestion.jointQuizItem?.explanation && (
                    <p className="text-[11px] text-blue-800 font-semibold leading-tight pt-0.5 break-words">
                      💡 {currentQuestion.jointQuizItem.explanation}
                    </p>
                  )}
                </div>
              ) : type === 'open_question' || type === 'bone' ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Juiste antwoord:</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">
                    {currentQuestion.correctOpenAnswer}
                  </p>
                  {currentQuestion.jointQuizItem?.explanation ? (
                    <p className="text-[11px] text-blue-800 font-semibold leading-tight pt-0.5 break-words">
                      💡 {currentQuestion.jointQuizItem.explanation}
                    </p>
                  ) : openAnswerFeedback?.feedbackNote ? (
                    <p className="text-[11px] text-blue-800 font-semibold leading-tight pt-0.5 break-words">
                      💡 {openAnswerFeedback.feedbackNote}
                    </p>
                  ) : null}
                </div>
              ) : type === 'movements' ? (
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">{muscle?.name}</p>
                  <p className="text-[11px] sm:text-xs text-emerald-900 font-semibold leading-snug break-words">
                    <span className="font-bold text-emerald-700">Bewegingen: </span>
                    {currentQuestion.correctMovements?.join(', ')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{muscle?.name}</p>
                  <p className="text-[11px] sm:text-xs text-blue-950 leading-snug break-words">
                    <span className="font-bold text-blue-700">Origo: </span>
                    {muscle?.originText}
                  </p>
                  <p className="text-[11px] sm:text-xs text-rose-950 leading-snug break-words">
                    <span className="font-bold text-rose-700">Insertie: </span>
                    {muscle?.insertionText}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Score & Simpele blauwe > knop voor volgende vraag */}
            <div className="flex items-center gap-2.5 shrink-0">
              <div className="flex items-center gap-1.5 font-mono text-xs font-bold select-none">
                <span className="text-emerald-600">{correctCount}</span>
                <span className="text-rose-500">{incorrectCount}</span>
              </div>
              <button
                type="button"
                onClick={onNextQuestion}
                className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-2xl shadow-md flex items-center justify-center shrink-0 transition"
                title="Volgende vraag"
                aria-label="Volgende vraag"
              >
                <ChevronRight className="w-6 h-6 text-white stroke-[2.5]" />
              </button>
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
