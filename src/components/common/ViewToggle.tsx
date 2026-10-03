import React from 'react';
import { AnatomicalView } from '../../types/anatomy';
import { Eye } from 'lucide-react';

interface ViewToggleProps {
  currentView: AnatomicalView;
  onViewChange: (view: AnatomicalView) => void;
  recommendedView?: AnatomicalView;
  disabled?: boolean;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  recommendedView,
  disabled = false,
}) => {
  return (
    <div className="flex items-center gap-1.5 bg-clinical-100 p-1 rounded-xl border border-clinical-200">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onViewChange('ventral')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
          currentView === 'ventral'
            ? 'bg-white text-clinical-900 shadow-sm border border-clinical-200/80 font-bold'
            : 'text-clinical-600 hover:text-clinical-900 hover:bg-white/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Eye className="w-3.5 h-3.5 text-blue-600" />
        <span>Ventraal</span>
        {recommendedView === 'ventral' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Aanbevolen aanzicht voor huidige spier" />
        )}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => onViewChange('dorsal')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
          currentView === 'dorsal'
            ? 'bg-white text-clinical-900 shadow-sm border border-clinical-200/80 font-bold'
            : 'text-clinical-600 hover:text-clinical-900 hover:bg-white/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Eye className="w-3.5 h-3.5 text-indigo-600" />
        <span>Dorsaal</span>
        {recommendedView === 'dorsal' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Aanbevolen aanzicht voor huidige spier" />
        )}
      </button>
    </div>
  );
};
