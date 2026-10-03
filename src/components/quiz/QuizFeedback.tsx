import React from 'react';
import { MatchResult, Muscle, QuizType } from '../../types/anatomy';
import { SKELETON_REAL_HEIGHT_CM } from '../../utils/coordinates';
import { AnswerValidationResult } from '../../utils/answerMatching';
import { CheckCircle, AlertTriangle, XCircle, ArrowRight, Info, Activity } from 'lucide-react';

interface QuizFeedbackProps {
  muscle: Muscle;
  matches: MatchResult[];
  targetCount: number;
  showReferenceGhost?: boolean;
  onToggleReference?: () => void;
  onNextQuestion: () => void;
  quizType?: QuizType;
  mcKind?: 'muscle' | 'origin' | 'insertion' | 'function' | 'joint';
  landmarkType?: 'origin' | 'insertion';
  isMultipleChoiceSuccess?: boolean;
  isPlacementSuccess?: boolean;
  correctAnswerText?: string;
  isMovementSuccess?: boolean;
  correctMovements?: string[];
  correctMovementsText?: string;
  userOpenAnswer?: string;
  openValidationResult?: AnswerValidationResult | null;
}

export const QuizFeedback: React.FC<QuizFeedbackProps> = ({
  muscle,
  matches,
  targetCount,
  onNextQuestion,
  quizType,
  mcKind,
  landmarkType,
  isMultipleChoiceSuccess = false,
  isPlacementSuccess = false,
  correctAnswerText,
  isMovementSuccess = false,
  correctMovements,
  correctMovementsText,
  userOpenAnswer,
  openValidationResult,
}) => {
  const isOpenQuestion = quizType === 'open_question';
  const isMultipleChoice = quizType === 'multiple_choice';
  const isFunctionChoice = quizType === 'function';
  const isMovements = quizType === 'movements';
  const isChoiceQuestion = isMultipleChoice || isFunctionChoice || isMovements;
  const isTextOrChoice = isChoiceQuestion || isOpenQuestion;

  const correctCount = matches.filter((m) => m.accuracy === 'correct').length;
  const closeCount = matches.filter((m) => m.accuracy === 'close').length;

  const isFullSuccess = isOpenQuestion
    ? (openValidationResult?.isCorrect || false)
    : isMovements
    ? isMovementSuccess
    : isChoiceQuestion
    ? isMultipleChoiceSuccess
    : isPlacementSuccess;

  // Bepaal exact welke referentiekaarten relevant zijn voor de specifieke quiz
  const showOriginCard =
    quizType === 'joint' ||
    quizType === 'full' ||
    quizType === 'origins' ||
    (quizType === 'landmark' && landmarkType === 'origin') ||
    ((isMultipleChoice || isOpenQuestion) && (mcKind === 'origin' || mcKind === 'muscle'));

  const showInsertionCard =
    quizType === 'joint' ||
    quizType === 'full' ||
    quizType === 'insertions' ||
    (quizType === 'landmark' && landmarkType === 'insertion') ||
    ((isMultipleChoice || isOpenQuestion) && (mcKind === 'insertion' || mcKind === 'muscle'));

  const showMovementCard =
    isMovements ||
    (isMultipleChoice && mcKind === 'function') ||
    quizType === 'function';

  return (
    <div className="bg-white p-4 sm:p-5 rounded-2xl border border-clinical-200/90 shadow-sm space-y-4 animate-in fade-in slide-in-from-bottom-2 duration-200">
      {/* 1. Duidelijke Resultaat Banner */}
      <div
        className={`p-3.5 rounded-xl border flex items-start gap-3 ${
          isFullSuccess
            ? 'bg-emerald-50 border-emerald-200 text-emerald-950'
            : isOpenQuestion && openValidationResult?.isClose
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : !isTextOrChoice && (correctCount > 0 || closeCount > 0)
            ? 'bg-amber-50 border-amber-200 text-amber-950'
            : 'bg-rose-50 border-rose-200 text-rose-950'
        }`}
      >
        {isFullSuccess ? (
          <CheckCircle className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
        ) : (isOpenQuestion && openValidationResult?.isClose) || (!isTextOrChoice && (correctCount > 0 || closeCount > 0)) ? (
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        ) : (
          <XCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
        )}

        <div className="space-y-1">
          <h4 className="text-sm font-extrabold">
            {isFullSuccess
              ? 'Uitstekend! Correct beantwoord'
              : isOpenQuestion && openValidationResult?.isClose
              ? 'Bijna goed (spelfoutje)'
              : !isTextOrChoice && correctCount > 0
              ? 'Gedeeltelijk correct'
              : 'Helaas niet juist'}
          </h4>
          <p className="text-xs leading-relaxed font-medium">
            {isOpenQuestion ? (
              isFullSuccess
                ? 'Je hebt het juiste antwoord ingevuld!'
                : openValidationResult?.isClose
                ? 'Je antwoord leek heel sterk op het juiste antwoord, let nog even op de spelling.'
                : `Het juiste antwoord was: ${correctAnswerText || muscle.name}.`
            ) : isMovements ? (
              isFullSuccess
                ? `Je hebt alle juiste bewegingen geselecteerd voor de ${muscle.name}.`
                : `Niet alle juiste bewegingen waren gekozen.`
            ) : isChoiceQuestion ? (
              isFullSuccess
                ? `Je hebt het juiste antwoord gekozen voor de ${muscle.name}.`
                : `Het juiste antwoord was: ${correctAnswerText || muscle.name}.`
            ) : (
              <>
                {correctCount}/{targetCount} punten exact geplaatst (&lt; 0.035 afstand).
                {closeCount > 0 && ` (${closeCount} bijna goed binnen 0.070).`}
              </>
            )}
          </p>
        </div>
      </div>

      {/* 1b. Open vraag antwoordkaart */}
      {isOpenQuestion && (
        <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200 space-y-2 text-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-slate-200">
            <span className="text-slate-500 font-semibold">Jouw antwoord:</span>
            <span className={`font-bold ${isFullSuccess ? 'text-emerald-700' : 'text-slate-800'}`}>
              "{userOpenAnswer || '(geen antwoord ingevuld)'}"
            </span>
          </div>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1">
            <span className="text-slate-500 font-semibold">Verwacht antwoord:</span>
            <span className="font-extrabold text-blue-900">
              {correctAnswerText || muscle.name}
            </span>
          </div>
          {openValidationResult?.feedbackNote && (
            <div className="pt-2 border-t border-slate-200 text-[11px] font-semibold text-blue-800 flex items-center gap-1.5">
              <span>💡</span>
              <span>{openValidationResult.feedbackNote}</span>
            </div>
          )}
        </div>
      )}

      {/* 2. Bewegingen Test Feedback: Overzichtelijke losse blokken zoals in studiemodus */}
      {showMovementCard && (
        <div className="space-y-2 pt-1 border-t border-clinical-100">
          <div className="font-bold text-xs text-clinical-800 uppercase tracking-wide flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-emerald-600" />
            <span>Juiste bewegingen van de {muscle.name}:</span>
          </div>

          {muscle.primaryMovements && muscle.primaryMovements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {muscle.primaryMovements.map((pm, idx) => (
                <div key={idx} className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3 shadow-xs">
                  <span className="font-bold text-emerald-900 capitalize block text-[11px] tracking-wide">
                    {pm.joint}
                  </span>
                  <span className="text-emerald-950 font-black text-sm block mt-0.5">
                    {pm.movement}
                  </span>
                </div>
              ))}
            </div>
          ) : correctMovements && correctMovements.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {correctMovements.map((mov, idx) => (
                <div key={idx} className="bg-emerald-50/90 border border-emerald-200/90 rounded-xl p-3 shadow-xs">
                  <span className="text-emerald-950 font-black text-sm capitalize block">
                    {mov}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-3 bg-emerald-50/90 border border-emerald-200 rounded-xl text-xs font-bold text-emerald-950">
              {correctMovementsText || muscle.functionText || 'Geen specifieke functie'}
            </div>
          )}
        </div>
      )}

      {/* 3. Relevante Origo & Insertie kaarten (alleen getoond indien relevant voor het toetstype) */}
      {(showOriginCard || showInsertionCard) && (
        <div className="space-y-2 pt-1 border-t border-clinical-100">
          <div className="font-bold text-xs text-clinical-800 uppercase tracking-wide flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-blue-500" />
            <span>Referentie {muscle.name}</span>
          </div>

          {/* Origo kaart (blauw) */}
          {showOriginCard && (
            <div className="p-3 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-blue-950 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                <span>Origo</span>
              </div>
              <p className="text-xs text-blue-950 font-medium leading-relaxed pl-4">
                {muscle.originText}
              </p>
            </div>
          )}

          {/* Insertie kaart (rood) */}
          {showInsertionCard && (
            <div className="p-3 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-rose-950 uppercase tracking-wider">
                <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                <span>Insertie</span>
              </div>
              <p className="text-xs text-rose-950 font-medium leading-relaxed pl-4">
                {muscle.insertionText}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 4. Puntenverdeling & Afstanden (alleen bij tekenvragen) */}
      {!isChoiceQuestion && matches.length > 0 && (
        <div className="space-y-1.5 pt-1 border-t border-clinical-100">
          <label className="text-[11px] font-bold text-clinical-600 uppercase tracking-wider">
            Meting & Afwijking
          </label>
          <div className="max-h-36 overflow-y-auto space-y-1">
            {matches.map((m, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between text-xs px-2.5 py-1.5 rounded-lg bg-clinical-50 border border-clinical-100"
              >
                <div className="flex items-center gap-2">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      m.accuracy === 'correct'
                        ? 'bg-emerald-500'
                        : m.accuracy === 'close'
                        ? 'bg-amber-500'
                        : 'bg-rose-500'
                    }`}
                  />
                  <span className="font-medium text-clinical-800">
                    {m.targetType === 'origin' ? 'Origo' : m.targetType === 'insertion' ? 'Insertie' : 'Punt'} {idx + 1}
                  </span>
                </div>
                <div className="flex items-center gap-2 font-mono text-[11px]">
                  <span className="text-slate-600 font-semibold">
                    {m.targetPoint
                      ? `${(m.distance * SKELETON_REAL_HEIGHT_CM).toFixed(1)} cm`
                      : '> 25 cm'}
                  </span>
                  <span
                    className={`font-semibold px-1.5 py-0.5 rounded text-[10px] ${
                      m.accuracy === 'correct'
                        ? 'bg-emerald-100 text-emerald-800'
                        : m.accuracy === 'close'
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {m.accuracy === 'correct'
                      ? 'Correct'
                      : m.accuracy === 'close'
                      ? 'Bijna goed'
                      : 'Afwijkend'}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. Volgende vraag knop */}
      <div className="pt-2 border-t border-clinical-100">
        <button
          type="button"
          onClick={onNextQuestion}
          className="w-full flex items-center justify-center gap-2 py-2.5 px-4 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs sm:text-sm font-bold shadow-sm transition"
        >
          <span>Volgende Vraag</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
