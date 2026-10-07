import React from 'react';
import { AnatomicalView } from '../../types/anatomy';
import { Eye, Columns2 } from 'lucide-react';

export type ViewLayoutMode = 'ventral' | 'dorsal' | 'both';

interface ViewToggleProps {
  currentView: AnatomicalView;
  onViewChange: (view: AnatomicalView) => void;
  recommendedView?: AnatomicalView;
  disabled?: boolean;
  showBothOption?: boolean;
  activeLayout?: ViewLayoutMode;
  onLayoutChange?: (layout: ViewLayoutMode) => void;
}

export const ViewToggle: React.FC<ViewToggleProps> = ({
  currentView,
  onViewChange,
  recommendedView,
  disabled = false,
  showBothOption = false,
  activeLayout,
  onLayoutChange,
}) => {
  const currentActive = activeLayout || currentView;

  const handleSelect = (mode: ViewLayoutMode) => {
    if (disabled) return;
    if (mode === 'both') {
      onLayoutChange?.('both');
    } else {
      onLayoutChange?.(mode);
      onViewChange(mode);
    }
  };

  return (
    <div className="flex items-center gap-1.5 bg-clinical-100 p-1 rounded-xl border border-clinical-200">
      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect('ventral')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
          currentActive === 'ventral'
            ? 'bg-white text-clinical-900 shadow-sm border border-clinical-200/80 font-bold'
            : 'text-clinical-600 hover:text-clinical-900 hover:bg-white/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Eye className="w-3.5 h-3.5 text-blue-600" />
        <span>Ventraal</span>
        {recommendedView === 'ventral' && currentActive !== 'both' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Aanbevolen aanzicht voor huidige spier" />
        )}
      </button>

      <button
        type="button"
        disabled={disabled}
        onClick={() => handleSelect('dorsal')}
        className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
          currentActive === 'dorsal'
            ? 'bg-white text-clinical-900 shadow-sm border border-clinical-200/80 font-bold'
            : 'text-clinical-600 hover:text-clinical-900 hover:bg-white/60'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <Eye className="w-3.5 h-3.5 text-indigo-600" />
        <span>Dorsaal</span>
        {recommendedView === 'dorsal' && currentActive !== 'both' && (
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse ml-0.5" title="Aanbevolen aanzicht voor huidige spier" />
        )}
      </button>

      {showBothOption && (
        <button
          type="button"
          disabled={disabled}
          onClick={() => handleSelect('both')}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all relative ${
            currentActive === 'both'
              ? 'bg-white text-clinical-900 shadow-sm border border-clinical-200/80 font-bold'
              : 'text-clinical-600 hover:text-clinical-900 hover:bg-white/60'
          } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
        >
          <Columns2 className="w-3.5 h-3.5 text-emerald-600" />
          <span>Naast elkaar</span>
        </button>
      )}
    </div>
  );
};
