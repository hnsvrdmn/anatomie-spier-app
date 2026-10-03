import React, { useState, useRef } from 'react';
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
import { AnswerValidationResult } from '../../utils/answerMatching';
import { 
  Check, 
  CheckCircle2, 
  RefreshCw, 
  ChevronUp, 
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
  setShowReferenceGhost: (show: boolean) => void;
  userOrigins: Point2D[];
  userInsertions: Point2D[];
  setUserOrigins: React.Dispatch<React.SetStateAction<Point2D[]>>;
  setUserInsertions: React.Dispatch<React.SetStateAction<Point2D[]>>;
  activeQuizTool: 'origin' | 'insertion';
  setActiveQuizTool: (tool: 'origin' | 'insertion') => void;
  handleSkeletonClick: (point: Point2D, isRightClick?: boolean) => void;
  handleUpdateUserPoint: (type: 'origin' | 'insertion', index: number, point: Point2D) => void;
  handleDeleteUserPoint: (type: 'origin' | 'insertion', index: number) => void;
  evaluateAttempt: (origins: Point2D[], insertions: Point2D[]) => void;
  handleNextQuestion: () => void;
  canEvaluateManual: boolean;
  expectedCounts: {
    origins: number;
    insertions: number;
    total: number;
    isMultiSpan?: boolean;
  };
  practiceMode: 'joint' | 'free';
  setPracticeMode: (mode: 'joint' | 'free') => void;
  selectedJointId: string;
  setSelectedJointId: (id: string) => void;
  isShuffled: boolean;
  setIsShuffled: (shuf: boolean) => void;
  freeQuizType: QuizType | 'all';
  setFreeQuizType: (type: QuizType | 'all') => void;
  jointMuscleIndex: number;
  jointMusclesCount: number;
  jointCategoryName: string;
  // Multiple Choice, Movements, Open Question
  selectedMultipleChoiceId: string | null;
  handleMultipleChoiceSelect: (text: string) => void;
  selectedMovements: string[];
  handleToggleMovement: (movement: string) => void;
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
  expectedCounts,
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
}) => {
  const [isPanelExpanded, setIsPanelExpanded] = useState(false);
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const isDrawingType = type !== 'multiple_choice' && type !== 'movements' && type !== 'function' && type !== 'open_question';
  const hasPlacedPoints = userOrigins.length > 0 || userInsertions.length > 0;

  // Bereken score percentage indien geëvalueerd
  const correctCount = matchResults.filter(m => m.accuracy === 'correct').length;
  const scorePercent = expectedCounts.total > 0 ? Math.round((correctCount / expectedCounts.total) * 100) : (isPlacementSuccess ? 100 : 0);

  // Universele Pointer drag handlers voor soepel omhoog/omlaag slepen van het paneel op touch & muis
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // fallback
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

  // Touch fallback handlers voor mobiel
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

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] flex flex-col bg-slate-900 overflow-hidden select-none">
      
      {/* 1. VASTE NAVIGATIE LINKSBOVEN: Origo / Insertie Schakelaar */}
      <div className="absolute top-3 left-3 z-30 flex items-center gap-1.5 pointer-events-auto">
        {isDrawingType && !isEvaluated && (
          <div className="flex items-center bg-slate-950/90 backdrop-blur-md p-1 rounded-2xl border border-slate-700/80 shadow-xl">
            <button
              type="button"
              onClick={() => setActiveQuizTool('origin')}
              className={`h-9 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
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
              className={`h-9 px-3 rounded-xl text-xs font-black transition-all flex items-center gap-1.5 ${
                activeQuizTool === 'insertion'
                  ? 'bg-red-600 text-white shadow-md ring-2 ring-rose-400'
                  : 'text-rose-300 hover:bg-slate-800'
              }`}
            >
              <span className={`w-2.5 h-2.5 rounded-full ${activeQuizTool === 'insertion' ? 'bg-white' : 'bg-red-500'}`} />
              <span>Insertie ({userInsertions.length})</span>
            </button>
          </div>
        )}

        {/* Wis geplaatste punten knop indien punten geplaatst zijn */}
        {isDrawingType && !isEvaluated && hasPlacedPoints && (
          <button
            type="button"
            onClick={() => {
              setUserOrigins([]);
              setUserInsertions([]);
              setActiveQuizTool(currentQuestion.landmarkType === 'insertion' ? 'insertion' : 'origin');
            }}
            className="h-10 w-10 bg-rose-950/90 backdrop-blur-md border border-rose-800/80 text-rose-300 hover:bg-rose-900 rounded-2xl shadow-xl flex items-center justify-center transition active:scale-95"
            title="Wis punten"
          >
            <Trash2 className="w-4 h-4 text-rose-300" />
          </button>
        )}
      </div>

      {/* 2. VASTE NAVIGATIE RECHTSBOVEN: Eén compacte draaiknop voor Ventraal / Dorsaal (kan nooit overlappen) */}
      <div className="absolute top-3 right-3 z-30 pointer-events-auto">
        <button
          type="button"
          onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
          className="h-9 px-3 bg-slate-950/90 hover:bg-slate-900 active:scale-95 backdrop-blur-md rounded-2xl border border-slate-700/80 shadow-2xl flex items-center gap-1.5 text-xs font-black text-white transition-all ring-1 ring-white/10"
          title="Draai aanzicht om (Ventraal / Dorsaal)"
        >
          <RotateCcw className="w-3.5 h-3.5 text-blue-400" />
          <span>{currentView === 'ventral' ? 'Ventraal' : 'Dorsaal'}</span>
          {muscle.view !== currentView && (
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-ping ml-0.5" />
          )}
        </button>
      </div>

      {/* 2. HET SKELET (Volledig scherm, pinch to zoom & 2-vinger pan) */}
      <div className="flex-1 w-full h-full pb-36 pt-16 flex items-center justify-center relative">
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

      {/* 3. VASTE ONDERKAART: OMHOOG SLEPEN VOOR GEWRICHTSELECTIE / OVERIGE TOETSEN */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/90 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] rounded-t-3xl p-4 transition-all duration-300 pointer-events-auto flex flex-col ${
          isPanelExpanded ? 'max-h-[85vh]' : 'max-h-[55vh]'
        }`}
      >
        {/* SLEEPHENDEL: Sleep omhoog of tik om gewricht / toetstype te kiezen */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsPanelExpanded(prev => !prev)}
          className="w-full h-8 -mt-2 mb-1 flex flex-col items-center justify-center cursor-grab active:cursor-grabbing touch-none select-none active:opacity-70"
          title="Sleep omhoog om gewricht te kiezen"
        >
          <div className="w-14 h-1.5 bg-slate-300 hover:bg-slate-400 active:bg-slate-500 rounded-full transition-colors" />
        </div>

        {/* UITKLAPBAAR PANEEL: DIRECT ONDER DE HENDEL DE DROPDOWN VOOR GEWRICHTTYPE OF ALLE SPIEREN */}
        {isPanelExpanded && (
          <div className="pb-3 border-b border-slate-200 mb-3 space-y-3 animate-in fade-in duration-200">
            <div className="flex items-center justify-between text-xs">
              <span className="font-black text-slate-800 uppercase tracking-wider text-[11px]">
                {practiceMode === 'joint' ? 'Selecteer Gewricht of Alle Spieren' : 'Kies Toetstype'}
              </span>
              <button
                type="button"
                onClick={() => setIsPanelExpanded(false)}
                className="text-slate-500 hover:text-slate-800 font-bold px-2 py-0.5 text-xs bg-slate-100 rounded-lg"
              >
                Sluiten ✕
              </button>
            </div>

            {/* Wissel tussen 'Per gewricht' en 'Overige toetsen' */}
            <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
              <button
                type="button"
                onClick={() => setPracticeMode('joint')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                  practiceMode === 'joint' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Per gewricht
              </button>
              <button
                type="button"
                onClick={() => setPracticeMode('free')}
                className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition ${
                  practiceMode === 'free' ? 'bg-white text-blue-700 shadow-xs' : 'text-slate-600'
                }`}
              >
                Overige toetsen
              </button>
            </div>

            {/* Dropdown met opties voor gewrichttype of alle spieren */}
            {practiceMode === 'joint' ? (
              <div className="space-y-2">
                <select
                  value={selectedJointId}
                  onChange={(e) => {
                    setSelectedJointId(e.target.value);
                    setIsPanelExpanded(false);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-100 hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  <option value="all">Alle spieren (door elkaar)</option>
                  <optgroup label="Per gewricht">
                    {JOINT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.title}
                      </option>
                    ))}
                  </optgroup>
                </select>

                <div className="flex items-center justify-between pt-1">
                  <button
                    type="button"
                    onClick={() => setIsShuffled(!isShuffled)}
                    className={`px-3 py-2 rounded-xl text-xs font-bold flex items-center gap-2 border transition shadow-xs ${
                      isShuffled
                        ? 'bg-blue-50 border-blue-300 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-700'
                    }`}
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                    <span>Shuffle {isShuffled ? 'Aan' : 'Uit'}</span>
                  </button>
                  <span className="text-xs font-bold text-slate-600 bg-slate-100 px-2.5 py-1.5 rounded-lg">
                    Spier {jointMuscleIndex + 1} van {jointMusclesCount}
                  </span>
                </div>
              </div>
            ) : (
              <div className="space-y-2">
                <select
                  value={freeQuizType}
                  onChange={(e) => {
                    setFreeQuizType(e.target.value as QuizType | 'all');
                    setIsPanelExpanded(false);
                  }}
                  className="w-full px-3 py-2.5 bg-slate-100 hover:bg-slate-50 border border-slate-300 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
                >
                  <option value="landmark">Vind aanhechtingspunt (origo / insertie)</option>
                  <option value="multiple_choice">Meerkeuze toets</option>
                  <option value="open_question">Open invultoets</option>
                  <option value="movements">Bewegingen per spier</option>
                  <option value="all">Willekeurig gemengd</option>
                </select>
              </div>
            )}
          </div>
        )}

        {/* A. VRAAGTITEL & GEWRICHTSTATUS */}
        <div className="flex items-center justify-between gap-2">
          <div className="min-w-0 flex-1">
            <button
              type="button"
              onClick={() => setIsPanelExpanded(prev => !prev)}
              className="text-[10px] font-bold text-blue-600 uppercase tracking-wider flex items-center gap-1 hover:underline truncate"
            >
              <span>{practiceMode === 'joint' ? `${jointCategoryName} • ${jointMuscleIndex + 1}/${jointMusclesCount}` : 'Vrije Toets'}</span>
              <ChevronUp className={`w-3 h-3 transition-transform ${isPanelExpanded ? 'rotate-180' : ''}`} />
            </button>
            <h2 className="text-lg sm:text-xl font-black text-slate-900 truncate leading-tight mt-0.5">
              {muscle.name}
            </h2>
          </div>

          {/* Snel overslaan indien niet geëvalueerd */}
          {!isEvaluated && (
            <button
              type="button"
              onClick={handleNextQuestion}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl transition"
              title="Volgende / Overslaan"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* B. ACTIE & BEANTWOORDING PER VRAAGTYPE */}
        
        {/* 1. Tekenvraag (Origo & Insertie plaatsen) */}
        {isDrawingType && !isEvaluated && (
          <div className="pt-2">
            {canEvaluateManual ? (
              <button
                type="button"
                onClick={() => evaluateAttempt(userOrigins, userInsertions)}
                className="w-full h-11 bg-emerald-600 hover:bg-emerald-700 active:scale-[0.98] text-white rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-5 h-5" />
                <span>Controleer antwoord</span>
              </button>
            ) : (
              <div className="text-xs text-slate-500 font-medium py-1 text-center">
                {currentQuestion.landmarkType === 'origin' && 'Plaats de origo'}
                {currentQuestion.landmarkType === 'insertion' && 'Plaats de insertie'}
                {!currentQuestion.landmarkType && 'Plaats origo (blauw) en insertie (rood)'}
              </div>
            )}
          </div>
        )}

        {/* 2. Meerkeuze vraag */}
        {type === 'multiple_choice' && currentQuestion.mcTextOptions && !isEvaluated && (
          <div className="grid grid-cols-1 gap-1.5 pt-2">
            {currentQuestion.mcTextOptions.map((optText, idx) => {
              const isSelected = selectedMultipleChoiceId === optText;
              return (
                <button
                  key={idx}
                  onClick={() => handleMultipleChoiceSelect(optText)}
                  className={`w-full py-2.5 px-3 text-left rounded-xl border text-xs font-semibold transition flex items-center justify-between shadow-xs ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 text-blue-900 font-bold'
                      : 'border-slate-200 bg-slate-50 hover:bg-blue-50 text-slate-900'
                  }`}
                >
                  <div className="flex items-center gap-2 truncate">
                    <span className="w-5 h-5 rounded-md bg-white border border-slate-300 text-[11px] font-bold flex items-center justify-center shrink-0">
                      {['A', 'B', 'C', 'D'][idx]}
                    </span>
                    <span className="truncate">{optText}</span>
                  </div>
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </button>
              );
            })}
          </div>
        )}

        {/* 3. Bewegingen per spier (Checkboxes) */}
        {type === 'movements' && currentQuestion.movementOptions && !isEvaluated && (
          <div className="space-y-2 pt-2">
            <div className="grid grid-cols-2 gap-1.5 max-h-36 overflow-y-auto pr-1">
              {currentQuestion.movementOptions.map((mov) => {
                const isChecked = selectedMovements.includes(mov);
                return (
                  <button
                    key={mov}
                    type="button"
                    onClick={() => handleToggleMovement(mov)}
                    className={`p-2 rounded-xl border text-xs transition flex items-center gap-1.5 text-left ${
                      isChecked
                        ? 'bg-blue-50 border-blue-400 text-blue-950 font-bold'
                        : 'bg-slate-50 border-slate-200 text-slate-700'
                    }`}
                  >
                    {isChecked ? <CheckSquare className="w-4 h-4 text-blue-600 shrink-0" /> : <Square className="w-4 h-4 text-slate-400 shrink-0" />}
                    <span className="truncate capitalize">{mov}</span>
                  </button>
                );
              })}
            </div>
            <button
              type="button"
              onClick={handleMovementSubmit}
              disabled={selectedMovements.length === 0}
              className={`w-full h-11 rounded-xl text-sm font-bold shadow-md transition flex items-center justify-center gap-2 ${
                selectedMovements.length > 0 ? 'bg-emerald-600 text-white' : 'bg-slate-200 text-slate-400'
              }`}
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Controleer</span>
            </button>
          </div>
        )}

        {/* 4. Open vraag */}
        {type === 'open_question' && !isEvaluated && (
          <div className="space-y-2 pt-2">
            <input
              type="text"
              value={userOpenAnswer}
              onChange={(e) => setUserOpenAnswer(e.target.value)}
              placeholder="Typ je antwoord..."
              className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:bg-white"
            />
            <button
              type="button"
              disabled={!userOpenAnswer.trim()}
              onClick={handleOpenAnswerSubmit}
              className="w-full h-11 bg-blue-600 text-white rounded-xl text-sm font-bold shadow-md flex items-center justify-center gap-2"
            >
              <CheckCircle2 className="w-5 h-5" />
              <span>Controleer</span>
            </button>
          </div>
        )}

        {/* C. NA CONTROLE: DIRECT STATUS (GOED / FOUT) + VOLGENDE VRAAG KNOP */}
        {isEvaluated && (
          <div className="space-y-2.5 pt-2">
            {/* Statusbanner */}
            <div className={`p-3 rounded-2xl flex items-center justify-between border ${
              isPlacementSuccess
                ? 'bg-emerald-50 border-emerald-300 text-emerald-900'
                : 'bg-rose-50 border-rose-300 text-rose-900'
            }`}>
              <div className="flex items-center gap-2 font-black text-base">
                {isPlacementSuccess ? (
                  <>
                    <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                    <span>Goed!</span>
                  </>
                ) : (
                  <>
                    <span className="text-rose-600 text-lg">✕</span>
                    <span>Niet helemaal correct</span>
                  </>
                )}
              </div>
              <span className="text-xs font-bold opacity-80">{scorePercent}%</span>
            </div>

            {/* Grote, duidelijke "Volgende vraag" knop */}
            <button
              type="button"
              onClick={handleNextQuestion}
              className="w-full h-12 bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white rounded-2xl text-base font-black shadow-lg shadow-blue-500/25 transition flex items-center justify-center gap-2"
            >
              <span>Volgende vraag</span>
              <span>→</span>
            </button>

            {/* Scrollbare 'Meer info' sectie (voor meer info moet je naar beneden scrollen) */}
            <div className="max-h-[30vh] overflow-y-auto space-y-2 pt-2 border-t border-slate-200 text-xs custom-scrollbar">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
                Meer info ↓
              </div>
              
              {!isPlacementSuccess ? (
                /* FOUT BEANTWOORD: TOON DIRECT HET JUISTE ANTWOORD */
                <div className="bg-rose-50/90 p-3 rounded-xl border border-rose-200 space-y-2">
                  <div className="flex items-center gap-1.5 text-rose-800 font-black uppercase text-[11px] tracking-wide">
                    <span>✕</span>
                    <span>Juiste antwoord:</span>
                  </div>

                  {type === 'multiple_choice' && (
                    <div className="space-y-1">
                      <p className="text-rose-950 font-black text-sm">
                        {currentQuestion.correctMcText || muscle.name}
                      </p>
                      {selectedMultipleChoiceId && (
                        <p className="text-rose-700/80 text-[11px] pt-1 border-t border-rose-200/80">
                          Jouw keuze: <span className="line-through">{selectedMultipleChoiceId}</span>
                        </p>
                      )}
                    </div>
                  )}

                  {type === 'movements' && (
                    <div className="space-y-1.5">
                      <span className="text-[11px] text-rose-800 font-bold block">
                        Juiste bewegingen van de {muscle.name}:
                      </span>
                      {currentQuestion.correctMovements && currentQuestion.correctMovements.length > 0 ? (
                        <div className="flex flex-wrap gap-1 pt-0.5">
                          {currentQuestion.correctMovements.map((mov, idx) => (
                            <span key={idx} className="px-2 py-0.5 bg-white border border-rose-300 rounded-md text-rose-950 font-bold text-xs shadow-xs capitalize">
                              ✓ {mov}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <p className="text-rose-950 font-medium text-xs">
                          {muscle.functionText || 'Geen specifieke beweging'}
                        </p>
                      )}
                    </div>
                  )}

                  {type === 'open_question' && (
                    <div className="space-y-1">
                      <p className="text-rose-950 font-black text-sm">
                        {currentQuestion.correctOpenAnswer || muscle.name}
                      </p>
                      {userOpenAnswer && (
                        <p className="text-rose-700/80 text-[11px] pt-1 border-t border-rose-200/80">
                          Jouw antwoord: <span className="font-semibold">{userOpenAnswer}</span>
                        </p>
                      )}
                      {openAnswerFeedback?.feedbackNote && (
                        <p className="text-blue-900 font-semibold text-[11px] pt-1">
                          💡 {openAnswerFeedback.feedbackNote}
                        </p>
                      )}
                    </div>
                  )}

                  {type === 'landmark' && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 block">
                        Gevraagde {currentQuestion.landmarkType === 'origin' ? 'Origo' : 'Insertie'}:
                      </span>
                      <p className="text-rose-950 font-bold text-xs">
                        {currentQuestion.landmarkText || (currentQuestion.landmarkType === 'origin' ? muscle.originText : muscle.insertionText)}
                      </p>
                    </div>
                  )}

                  {type === 'origins' && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 block">Juiste origo:</span>
                      <p className="text-rose-950 font-medium text-xs">{muscle.originText || 'Geen tekst'}</p>
                    </div>
                  )}

                  {type === 'insertions' && (
                    <div className="space-y-1">
                      <span className="text-[11px] font-bold text-rose-800 block">Juiste insertie:</span>
                      <p className="text-rose-950 font-medium text-xs">{muscle.insertionText || 'Geen tekst'}</p>
                    </div>
                  )}

                  {(type === 'full' || type === 'joint') && (
                    <div className="space-y-1.5 pt-0.5">
                      <div>
                        <span className="font-bold text-blue-700 block text-[11px]">Origo (blauw):</span>
                        <p className="text-rose-950 font-medium text-xs">{muscle.originText || 'Geen tekst'}</p>
                      </div>
                      <div>
                        <span className="font-bold text-rose-700 block text-[11px]">Insertie (rood):</span>
                        <p className="text-rose-950 font-medium text-xs">{muscle.insertionText || 'Geen tekst'}</p>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                /* GOED BEANTWOORD: TOON VOLLEDIGE REFERENTIE-INFORMATIE */
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-2">
                  <div>
                    <span className="font-bold text-blue-700 block">Origo:</span>
                    <p className="text-slate-700">{muscle.originText || 'Geen tekst'}</p>
                  </div>
                  <div>
                    <span className="font-bold text-rose-700 block">Insertie:</span>
                    <p className="text-slate-700">{muscle.insertionText || 'Geen tekst'}</p>
                  </div>
                  {muscle.functionText && (
                    <div>
                      <span className="font-bold text-slate-800 block">Functie / Bewegingen:</span>
                      <p className="text-slate-700">{muscle.functionText}</p>
                    </div>
                  )}
                  {openAnswerFeedback && openAnswerFeedback.feedbackNote && (
                    <div className="p-2 rounded-lg bg-blue-50 border border-blue-200 text-blue-900 font-medium">
                      {openAnswerFeedback.feedbackNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        )}
      </div>

    </div>
  );
};
