import React from 'react';
import { SYNOVIAL_JOINT_TYPES } from '../../data/jointTypesData';
import { X, BookOpen } from 'lucide-react';

interface SynovialTypesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const SynovialTypesModal: React.FC<SynovialTypesModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 py-4 bg-slate-900 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-400/40 flex items-center justify-center text-blue-400">
              <BookOpen className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-black tracking-tight">
                6 Typen Synoviale Gewrichten naar Vorm
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Moduulboek Anatomie & Kinesiologie (p. 27)
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white flex items-center justify-center transition active:scale-90"
            title="Sluiten"
            aria-label="Sluiten"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content list */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-3 custom-scrollbar">
          {SYNOVIAL_JOINT_TYPES.map((type, idx) => (
            <div
              key={type.latinName}
              className="p-3.5 sm:p-4 rounded-2xl bg-slate-50 border border-slate-200/90 hover:border-blue-300 hover:bg-blue-50/30 transition"
            >
              <div className="flex items-start justify-between gap-2 mb-1.5">
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="w-5 h-5 rounded-full bg-blue-600 text-white text-[11px] font-black flex items-center justify-center shrink-0">
                    {idx + 1}
                  </span>
                  <h3 className="font-black text-slate-900 text-xs sm:text-sm">
                    {type.dutchName}
                  </h3>
                  <span className="text-xs text-blue-600 font-bold bg-blue-100/70 px-2 py-0.5 rounded-md">
                    {type.latinName}
                  </span>
                </div>
                <span className="text-[10px] sm:text-xs font-bold text-slate-500 bg-white border border-slate-200 px-2 py-0.5 rounded-lg shrink-0">
                  {type.degreesOfFreedom}
                </span>
              </div>

              <p className="text-xs text-slate-700 font-medium leading-relaxed mb-2">
                {type.shapeDescription}
              </p>

              <div className="text-[11px] text-slate-600 bg-white/80 p-2 rounded-xl border border-slate-200/60">
                <span className="font-bold text-slate-800">Voorbeelden: </span>
                {type.examples.join(' • ')}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-100 border-t border-slate-200 flex items-center justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Begrepen
          </button>
        </div>
      </div>
    </div>
  );
};
