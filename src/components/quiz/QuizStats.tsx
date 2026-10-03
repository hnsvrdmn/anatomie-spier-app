import React from 'react';
import { QuizStatsData } from '../../types/anatomy';
import { Trophy, CheckCircle, AlertTriangle, XCircle, Flame, RotateCcw } from 'lucide-react';

interface QuizStatsProps {
  stats: QuizStatsData;
  onResetStats: () => void;
}

export const QuizStats: React.FC<QuizStatsProps> = ({ stats, onResetStats }) => {
  const percentage = stats.totalQuestions > 0 
    ? Math.round(((stats.correctAnswers + stats.closeAnswers * 0.5) / stats.totalQuestions) * 100)
    : 0;

  return (
    <div className="bg-white p-4 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-bold text-clinical-700 uppercase tracking-wider flex items-center gap-1.5">
          <Trophy className="w-4 h-4 text-amber-500" />
          <span>Sessie Statistieken</span>
        </h3>
        <button
          type="button"
          onClick={onResetStats}
          title="Herstart toetssessie"
          className="text-clinical-400 hover:text-clinical-700 p-1 text-xs flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Reset</span>
        </button>
      </div>

      {/* Score percentage & voortgangsbalk */}
      <div className="space-y-1.5">
        <div className="flex items-baseline justify-between text-xs">
          <span className="font-semibold text-clinical-600">Behaalde score</span>
          <span className="text-lg font-black text-clinical-900">{percentage}%</span>
        </div>
        <div className="w-full h-2 bg-clinical-100 rounded-full overflow-hidden">
          <div
            className={`h-full transition-all duration-500 ${
              percentage >= 75
                ? 'bg-emerald-500'
                : percentage >= 50
                ? 'bg-amber-500'
                : 'bg-blue-600'
            }`}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>

      {/* Grid met getallen */}
      <div className="grid grid-cols-4 gap-2 pt-1">
        <div className="bg-clinical-50 p-2 rounded-xl text-center border border-clinical-100">
          <div className="text-[10px] text-clinical-500 uppercase font-semibold">Totaal</div>
          <div className="text-sm font-bold text-clinical-900">{stats.totalQuestions}</div>
        </div>

        <div className="bg-emerald-50/70 p-2 rounded-xl text-center border border-emerald-100">
          <div className="text-[10px] text-emerald-700 uppercase font-semibold flex items-center justify-center gap-0.5">
            <CheckCircle className="w-2.5 h-2.5" />
            <span>Goed</span>
          </div>
          <div className="text-sm font-bold text-emerald-800">{stats.correctAnswers}</div>
        </div>

        <div className="bg-amber-50/70 p-2 rounded-xl text-center border border-amber-100">
          <div className="text-[10px] text-amber-700 uppercase font-semibold flex items-center justify-center gap-0.5">
            <AlertTriangle className="w-2.5 h-2.5" />
            <span>Dichtbij</span>
          </div>
          <div className="text-sm font-bold text-amber-800">{stats.closeAnswers}</div>
        </div>

        <div className="bg-rose-50/70 p-2 rounded-xl text-center border border-rose-100">
          <div className="text-[10px] text-rose-700 uppercase font-semibold flex items-center justify-center gap-0.5">
            <XCircle className="w-2.5 h-2.5" />
            <span>Fout</span>
          </div>
          <div className="text-sm font-bold text-rose-800">{stats.incorrectAnswers}</div>
        </div>
      </div>

      {/* Reeks / Streak indicator */}
      {stats.streak > 1 && (
        <div className="flex items-center justify-center gap-1.5 py-1 px-3 bg-amber-50 border border-amber-200 text-amber-900 rounded-xl text-xs font-bold animate-pulse">
          <Flame className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
          <span>{stats.streak} op een rij correct!</span>
        </div>
      )}
    </div>
  );
};
