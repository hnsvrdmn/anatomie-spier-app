import React from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { ChevronLeft, ChevronRight, Pin, ArrowDownRight } from 'lucide-react';

export const MuscleDetail: React.FC = () => {
  const { 
    selectedMuscle, 
    selectedMuscles,
    nextMuscle, 
    prevMuscle 
  } = useMuscles();

  if (!selectedMuscle && selectedMuscles.length === 0) {
    return (
      <div className="p-6 text-center text-clinical-400 bg-white rounded-2xl border border-clinical-200">
        Geen spier geselecteerd.
      </div>
    );
  }

  // De spier die nu in detail bekeken wordt
  const displayedMuscle = selectedMuscle || selectedMuscles[0];
  const isMulti = selectedMuscles.length > 1;

  const jointName = displayedMuscle.jointCategories
    ?.map(catId => {
      const found = JOINT_CATEGORIES.find(c => c.id === catId);
      return found ? found.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ') : catId;
    })
    .join(' & ') || 'Algemeen';

  return (
    <div className="bg-white p-5 rounded-2xl border border-clinical-200/90 shadow-sm space-y-4">
      {/* Header met naam van de getoonde spier */}
      <div>
        <div className="flex items-center justify-between mb-1">
          <span className="text-xs font-bold text-blue-700 uppercase tracking-wider">
            {jointName}
          </span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-clinical-900 tracking-tight">
          {displayedMuscle.name}
        </h2>
      </div>

      {/* Anatomische Aanhechtingen & Functie */}
      <div className="space-y-2.5 pt-1 border-t border-clinical-100">
        {/* Origo */}
        <div className="p-3.5 rounded-xl bg-blue-50/70 border border-blue-100 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-blue-600 shrink-0 shadow-xs" />
            <h3 className="text-xs font-bold text-blue-950 uppercase tracking-wider flex items-center gap-1">
              <Pin className="w-3 h-3 text-blue-600 rotate-45" />
              Origo
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-blue-950 font-medium leading-relaxed pl-5">
            {displayedMuscle.originText}
          </p>
        </div>

        {/* Insertie */}
        <div className="p-3.5 rounded-xl bg-rose-50/70 border border-rose-100 space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-red-600 shrink-0 shadow-xs" />
            <h3 className="text-xs font-bold text-rose-950 uppercase tracking-wider flex items-center gap-1">
              <ArrowDownRight className="w-3.5 h-3.5 text-red-600" />
              Insertie
            </h3>
          </div>
          <p className="text-xs sm:text-sm text-rose-950 font-medium leading-relaxed pl-5">
            {displayedMuscle.insertionText}
          </p>
        </div>

        {/* Primaire Bewegingen per gewricht */}
        {displayedMuscle.primaryMovements && displayedMuscle.primaryMovements.length > 0 && (
          <div className="p-3.5 rounded-xl bg-emerald-50/70 border border-emerald-100 space-y-2">
            <h3 className="text-xs font-bold text-emerald-950 uppercase tracking-wider flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Primaire Bewegingen
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
              {displayedMuscle.primaryMovements.map((pm, idx) => (
                <div key={idx} className="bg-white/80 border border-emerald-200/60 rounded-lg p-2 text-xs">
                  <span className="font-bold text-emerald-900 capitalize block">{pm.joint}</span>
                  <span className="text-emerald-700 font-medium">{pm.movement}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Secundaire & Stabilisatiefuncties */}
        {displayedMuscle.otherFunctions && (
          <div className="p-3.5 rounded-xl bg-amber-50/70 border border-amber-100 space-y-1">
            <h3 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Extra info (hoef je niet te leren)
            </h3>
            <p className="text-xs sm:text-sm text-amber-950 font-medium leading-relaxed">
              {displayedMuscle.otherFunctions}
            </p>
          </div>
        )}
      </div>

      {/* Navigatieknoppen: [Vorige spier] en [Volgende spier] */}
      {!isMulti && (
        <div className="flex items-center gap-2 pt-2 border-t border-clinical-100">
          <button
            type="button"
            onClick={prevMuscle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl border border-clinical-200 text-clinical-700 bg-clinical-50 hover:bg-clinical-100 hover:text-clinical-900 font-semibold text-xs transition"
          >
            <ChevronLeft className="w-4 h-4" />
            <span>Vorige spier</span>
          </button>
          <button
            type="button"
            onClick={nextMuscle}
            className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition"
          >
            <span>Volgende spier</span>
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
};
