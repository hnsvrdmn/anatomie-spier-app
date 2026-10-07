import React, { useState, useRef, useEffect } from 'react';
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
import { MovementIcon } from '../common/MovementIcon';
import { AnswerValidationResult } from '../../utils/answerMatching';
import { useMuscles } from '../../context/MuscleContext';
import { 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  ChevronUp, 
  ChevronRight,
  Trash2, 
  CheckSquare, 
  Square, 
  Shuffle, 
  RotateCcw 
} from 'lucide-react';

interface MobileQuizViewProps {
  currentQuestion: QuizQuestion;
  muscle: Muscle;
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
}) => {
  const { jointPracticeType, setJointPracticeType } = useMuscles();
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  // Zorg dat het paneel uitschuift zodra de vraag is beantwoord
  useEffect(() => {
    if (isEvaluated) {
      setIsPanelExpanded(true);
    }
  }, [isEvaluated]);



  const isDrawingType = type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question';
  const hasPlacedPoints = userOrigins.length > 0 || userInsertions.length > 0;

  // Pointer drag handlers voor uitschuiven / inschuiven van het paneel
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
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
    if (deltaY < -20 && !isPanelExpanded) {
      setIsPanelExpanded(true);
      isDraggingRef.current = false;
    } else if (deltaY > 20 && isPanelExpanded) {
      setIsPanelExpanded(false);
      isDraggingRef.current = false;
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

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartYRef.current;
    if (deltaY < -20 && !isPanelExpanded) {
      setIsPanelExpanded(true);
      dragStartYRef.current = null;
    } else if (deltaY > 20 && isPanelExpanded) {
      setIsPanelExpanded(false);
      dragStartYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    dragStartYRef.current = null;
  };

  // Beknopte weergave van het juiste antwoord voor de compacte feedbackbalk
  const correctSummaryText = 
    type === 'multiple_choice'
      ? (currentQuestion.correctMcText || muscle.name)
      : type === 'open_question'
      ? (currentQuestion.correctOpenAnswer || muscle.name)
      : type === 'movements'
      ? (currentQuestion.correctMovements?.join(', ') || muscle.functionText || 'Zie details')
      : currentQuestion.landmarkText 
      ? `${currentQuestion.landmarkType === 'origin' ? 'Origo: ' : 'Insertie: '}${currentQuestion.landmarkText}`
      : type === 'origins'
      ? `Origo: ${muscle.originText}`
      : type === 'insertions'
      ? `Insertie: ${muscle.insertionText}`
      : `${muscle.name} (O: ${muscle.originText} | I: ${muscle.insertionText})`;

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

        {/* Origo / Insertie knoppen linksboven voor tekentoetsen */}
        {isDrawingType && !isEvaluated && (
          <div className="absolute top-2.5 left-2.5 z-30 flex items-center gap-1.5 pointer-events-auto">
            <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl">
              <button
                type="button"
                onClick={() => setActiveQuizTool('origin')}
                className={`h-8 px-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeQuizTool === 'origin'
                    ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                    : 'text-blue-300 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${activeQuizTool === 'origin' ? 'bg-white' : 'bg-blue-500'}`} />
                <span>Origo ({userOrigins.length})</span>
              </button>
              <button
                type="button"
                onClick={() => setActiveQuizTool('insertion')}
                className={`h-8 px-2.5 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                  activeQuizTool === 'insertion'
                    ? 'bg-red-600 text-white shadow-md ring-2 ring-rose-400'
                    : 'text-rose-300 hover:bg-slate-800'
                }`}
              >
                <span className={`w-2.5 h-2.5 rounded-full ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-red-500'}`} />
                <span>Insertie ({userInsertions.length})</span>
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
                className="h-8 w-8 bg-rose-950/90 backdrop-blur-md border border-rose-800/80 text-rose-300 hover:bg-rose-900 rounded-xl shadow-xl flex items-center justify-center transition active:scale-95"
                title="Wis punten"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-300" />
              </button>
            )}
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
          interactive={!isEvaluated && isDrawingType}
          onSkeletonClick={handleSkeletonClick}
          onUpdateUserPoint={handleUpdateUserPoint}
          onDeleteUserPoint={handleDeleteUserPoint}
          quizMatches={matchResults}
          showReferenceGhost={showReferenceGhost || isEvaluated}
          userOrigins={userOrigins}
          userInsertions={userInsertions}
          hideZoomToolbar={true}
          isMobile={true}
          autoCenterMuscle={true}
        />
      </div>

      {/* 2. VASTE ONDERKAART: COMPACT EN NAAR BENEDEN TE SCHUIVEN */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] rounded-t-3xl transition-all duration-300 pointer-events-auto flex flex-col ${
          isEvaluated
            ? isPanelExpanded
              ? 'px-3.5 pt-2 pb-3 max-h-[45vh]'
              : 'px-4 py-2 max-h-[34px] cursor-pointer'
            : isPanelExpanded
            ? 'px-3.5 pt-2 pb-3 max-h-[85vh]'
            : 'px-3.5 pt-2 pb-3 max-h-[55vh]'
        }`}
      >
        {/* SLEEPHENDEL: Tik of sleep omhoog/omlaag */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsPanelExpanded(prev => !prev)}
          className={`w-full flex items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none active:opacity-70 ${
            isEvaluated && !isPanelExpanded ? 'h-full py-0.5' : 'h-5 -mt-1 mb-1'
          }`}
          title="Tik of sleep om paneel in/uit te klappen"
        >
          <div className="w-12 h-1.5 bg-slate-400 hover:bg-slate-500 rounded-full transition-colors" />
        </div>

        {/* UITKLAPBARE INSTELMENUUTJE: ALLEEN ZICHTBAAR BIJ UITGESCHOVEN PANEEL VÓÓR CONTROLE */}
        {isPanelExpanded && !isEvaluated && (
          <div className="pb-3 border-b border-slate-200 mb-2 space-y-2 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                {practiceMode === 'joint' ? 'Kies Gewricht' : 'Kies Toetstype'}
              </span>
              <button
                type="button"
                onClick={() => setIsPanelExpanded(false)}
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
                      setIsPanelExpanded(false);
                    }}
                    className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                  >
                    {JOINT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ')} ({cat.muscleIds.length} spieren)
                      </option>
                    ))}
                  </select>

                  {/* Keuze tussen Aanhechtingspunten of Bewegingen oefenen */}
                  <div className="grid grid-cols-2 gap-1.5 p-1 bg-slate-200/80 rounded-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setJointPracticeType('attachments');
                        setIsPanelExpanded(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        jointPracticeType === 'attachments'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <span>📌 Origo & Insertie</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setJointPracticeType('movements');
                        setIsPanelExpanded(false);
                      }}
                      className={`py-1.5 px-2 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1 ${
                        jointPracticeType === 'movements'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-700 hover:text-slate-900'
                      }`}
                    >
                      <span>⚡ Bewegingen</span>
                    </button>
                  </div>

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
                    setIsPanelExpanded(false);
                  }}
                  className="w-full px-3 py-2 bg-slate-100 border border-slate-300 rounded-xl text-xs font-bold text-slate-900 focus:bg-white cursor-pointer"
                >
                  <option value="full">Origo én insertie plaatsen (alle spieren)</option>
                  <option value="landmark">Vind aanhechtingspunt (origo / insertie)</option>
                  <option value="multiple_choice">Meerkeuze toets (MC)</option>
                  <option value="open_question">Open invultoets</option>
                  <option value="movements">Bewegingen per spier</option>
                </select>
              )}
            </div>
          </div>
        )}

        {/* A. VRAAGTITEL & VRAAGSTELLING (ALTIJD DUIDELIJK & VOLLEDIG LEESBAAR) */}
        {!isEvaluated && (
          <div className="flex items-start justify-between gap-2 mb-1">
            <div className="min-w-0 flex-1">
              <button
                type="button"
                onClick={() => setIsPanelExpanded(prev => !prev)}
                className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:underline"
              >
                <span>
                  {selectedJointId === 'all' && practiceMode === 'joint'
                    ? `${jointPracticeType === 'movements' ? 'Bewegingen' : 'Origo & Insertie'} • ${jointMuscleIndex + 1}/${jointMusclesCount}`
                    : practiceMode === 'joint'
                    ? `${jointCategoryName} • ${jointPracticeType === 'movements' ? 'Bewegingen' : 'Origo/Insertie'} • ${jointMuscleIndex + 1}/${jointMusclesCount}`
                    : freeQuizType === 'multiple_choice'
                    ? 'Meerkeuze Toets'
                    : freeQuizType === 'open_question'
                    ? 'Open Vraag'
                    : freeQuizType === 'movements'
                    ? 'Bewegingen'
                    : 'Aanhechtingspunt'}
                </span>
                <ChevronUp className={`w-3 h-3 transition-transform ${isPanelExpanded ? 'rotate-180' : ''}`} />
              </button>

              {/* Duidelijke vraagstelling per toetstype */}
              <div className="mt-0.5">
                {type === 'multiple_choice' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {currentQuestion.mcKind === 'muscle'
                      ? 'Welke spier is hier gemarkeerd?'
                      : currentQuestion.mcKind === 'origin'
                      ? `Wat is de juiste origo van de ${muscle.name}?`
                      : currentQuestion.mcKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${muscle.name}?`
                      : `Wat is de werking/functie van de ${muscle.name}?`}
                  </h2>
                ) : type === 'open_question' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {currentQuestion.openKind === 'muscle'
                      ? 'Welke spier is hier op het skelet gemarkeerd?'
                      : currentQuestion.openKind === 'origin'
                      ? `Wat is de juiste origo van de ${muscle.name}?`
                      : currentQuestion.openKind === 'insertion'
                      ? `Wat is de juiste insertie van de ${muscle.name}?`
                      : `Over welk gewricht loopt de ${muscle.name}?`}
                  </h2>
                ) : type === 'movements' ? (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    {practiceMode === 'joint'
                      ? `Welke bewegingen in dit gewricht: ${muscle.name}`
                      : `Vink alle bewegingen aan van de ${muscle.name}:`}
                  </h2>
                ) : type === 'landmark' ? (
                  <div>
                    <span className="text-[10px] font-bold text-blue-600 block">
                      {currentQuestion.landmarkType === 'origin' ? 'Plaats origo:' : 'Plaats insertie:'}
                    </span>
                    <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                      {currentQuestion.landmarkText || muscle.name}
                    </h2>
                  </div>
                ) : (
                  <h2 className="text-xs sm:text-sm font-black text-slate-900 leading-snug">
                    Plaats origo & insertie: {muscle.name}
                  </h2>
                )}
              </div>
            </div>

            {/* Snel overslaan */}
            <button
              type="button"
              onClick={handleNextQuestion}
              className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl transition shrink-0"
              title="Volgende / Overslaan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
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
        {type === 'multiple_choice' && currentQuestion.mcTextOptions && !isEvaluated && (
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

        {/* 4. Open vraag */}
        {type === 'open_question' && !isEvaluated && (
          <div className="space-y-1.5 pt-1">
            <input
              type="text"
              value={userOpenAnswer}
              onChange={(e) => setUserOpenAnswer(e.target.value)}
              placeholder="Typ je antwoord..."
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

        {/* C. NA BEANTWOORDING: ALTIJD VOLLEDIG LEESBAAR + INGEKLAPT ALLEEN HET STREEPJE */}
        {isEvaluated && isPanelExpanded && (
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
              {type === 'multiple_choice' ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Juiste antwoord:</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">
                    {correctSummaryText}
                  </p>
                </div>
              ) : type === 'open_question' ? (
                <div className="space-y-0.5">
                  <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">Juiste antwoord:</span>
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">
                    {currentQuestion.correctOpenAnswer}
                  </p>
                  {openAnswerFeedback?.feedbackNote && (
                    <p className="text-[11px] text-blue-800 font-semibold leading-tight pt-0.5 break-words">
                      💡 {openAnswerFeedback.feedbackNote}
                    </p>
                  )}
                </div>
              ) : type === 'movements' ? (
                <div className="space-y-0.5">
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-snug break-words">{muscle.name}</p>
                  <p className="text-[11px] sm:text-xs text-emerald-900 font-semibold leading-snug break-words">
                    <span className="font-bold text-emerald-700">Bewegingen: </span>
                    {currentQuestion.correctMovements?.join(', ')}
                  </p>
                </div>
              ) : (
                <div className="space-y-1">
                  <p className="text-xs sm:text-sm font-black text-slate-900 leading-tight">{muscle.name}</p>
                  <p className="text-[11px] sm:text-xs text-blue-950 leading-snug break-words">
                    <span className="font-bold text-blue-700">Origo: </span>
                    {muscle.originText}
                  </p>
                  <p className="text-[11px] sm:text-xs text-rose-950 leading-snug break-words">
                    <span className="font-bold text-rose-700">Insertie: </span>
                    {muscle.insertionText}
                  </p>
                </div>
              )}
            </div>

            {/* 3. Simpele blauwe > knop voor volgende vraag */}
            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-11 h-11 bg-blue-600 hover:bg-blue-700 active:scale-90 text-white rounded-2xl shadow-md flex items-center justify-center shrink-0 transition"
              title="Volgende vraag"
              aria-label="Volgende vraag"
            >
              <ChevronRight className="w-6 h-6 text-white stroke-[2.5]" />
            </button>
          </div>
        )}
      </div>

    </div>
  );
};
