import React from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { AlertCircle, CheckCircle, Info, AlertTriangle, X } from 'lucide-react';

export const Toast: React.FC = () => {
  const { toast, hideToast } = useMuscles();

  if (!toast) return null;

  const icons = {
    info: <Info className="w-5 h-5 text-blue-500 shrink-0" />,
    success: <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />,
    warning: <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />,
    error: <AlertCircle className="w-5 h-5 text-rose-500 shrink-0" />,
  };

  const bgStyles = {
    info: 'bg-white border-blue-200 text-clinical-900 shadow-blue-500/10',
    success: 'bg-white border-emerald-200 text-clinical-900 shadow-emerald-500/10',
    warning: 'bg-white border-amber-200 text-clinical-900 shadow-amber-500/10',
    error: 'bg-rose-50 border-rose-200 text-rose-950 shadow-rose-500/15',
  };

  return (
    <div className="fixed bottom-5 right-5 z-50 max-w-md w-full px-4 pointer-events-none transition-all duration-300 animate-in fade-in slide-in-from-bottom-5">
      <div className={`pointer-events-auto p-4 rounded-xl border shadow-xl flex items-start gap-3 ${bgStyles[toast.type]}`}>
        {icons[toast.type]}
        <div className="flex-1 text-xs sm:text-sm font-medium leading-relaxed">
          {toast.message}
        </div>
        <button
          onClick={hideToast}
          className="text-clinical-400 hover:text-clinical-700 p-1 rounded-md transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
