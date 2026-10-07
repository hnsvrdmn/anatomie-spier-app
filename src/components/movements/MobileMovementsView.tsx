import React, { useState, useMemo, useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { JOINTS_LEARNING_DATA } from '../../data/jointTypesData';
import { MovementIcon } from '../common/MovementIcon';
import { RotateCw, ChevronDown } from 'lucide-react';

export const MobileMovementsView: React.FC = () => {
  const { muscles, currentView, setCurrentView } = useMuscles();

  const [selectedJointId, setSelectedJointId] = useState<string>('coxae');
  const [activeMovementName, setActiveMovementName] = useState<string>('Anteflexie');
  const [showSubJoints, setShowSubJoints] = useState<boolean>(false);

  const activeJoint = JOINTS_LEARNING_DATA[selectedJointId] || JOINTS_LEARNING_DATA.coxae;

  // Wanneer een nieuw gewricht gekozen wordt, stel de eerste beweging en het standaard aanzicht in
  useEffect(() => {
    if (activeJoint.movements.length > 0) {
      setActiveMovementName(activeJoint.movements[0].movement);
    }
    if (activeJoint.defaultView) {
      setCurrentView(activeJoint.defaultView);
    }
  }, [selectedJointId, activeJoint, setCurrentView]);

  // Actieve bewegingsinformatie binnen het geselecteerde gewricht
  const activeMovementInfo = useMemo(() => {
    return (
      activeJoint.movements.find((m) => m.movement === activeMovementName) ||
      activeJoint.movements[0]
    );
  }, [activeJoint, activeMovementName]);

  // Alleen de spieren die binnen dit gewricht bij deze beweging horen!
  const selectedMuscles = useMemo(() => {
    if (!activeMovementInfo) return [];
    return muscles.filter((m) => activeMovementInfo.muscleIds.includes(m.id));
  }, [muscles, activeMovementInfo]);

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] flex flex-col bg-slate-900 overflow-hidden select-none">
      
      {/* 1. COMPACTE BOVENBALK: GEWRICHT KIEZEN */}
      <div className="w-full px-3 py-2 bg-slate-950/90 backdrop-blur-md border-b border-slate-800 z-20 shrink-0">
        <select
          value={selectedJointId}
          onChange={(e) => setSelectedJointId(e.target.value)}
          className="w-full px-3 py-1.5 bg-slate-800 border border-slate-700 rounded-xl text-xs font-bold text-white focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer truncate"
        >
          <option value="coxae">Art. COXAE (Heup)</option>
          <option value="genus">Art. GENUS (Knie)</option>
          <option value="pedis">Art. PEDIS (Enkel/Voet)</option>
          <option value="cubiti">Art. CUBITI (Elleboog)</option>
          <option value="humeri">Art. HUMERI (Schouder)</option>
          <option value="cingulum">Cingulum (Schoudergordel)</option>
          <option value="romp">Romp / Wervelkolom</option>
        </select>
      </div>

      {/* 2. HET SKELET (Vult automatisch de overgebleven ruimte boven het frame) */}
      <div className="flex-1 min-h-0 w-full flex items-center justify-center relative overflow-hidden bg-slate-900">
        {/* Draaiknop met draai-icoontje linksboven op de afbeelding */}
        <button
          type="button"
          onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
          className="absolute top-2.5 left-2.5 z-30 w-9 h-9 bg-white/95 backdrop-blur-md rounded-full border border-slate-200 shadow-md flex items-center justify-center text-slate-700 active:scale-90 hover:text-slate-950 transition pointer-events-auto"
          title={`Draai skelet (${currentView === 'ventral' ? 'Dorsaal' : 'Ventraal'})`}
          aria-label="Draai aanzicht"
        >
          <RotateCw className="w-4 h-4 text-slate-700" />
        </button>

        <SkeletonViewer
          currentView={currentView}
          activeMuscles={selectedMuscles}
          activeSide="both"
          interactive={false}
          hideZoomToolbar={true}
          isMobile={true}
        />
      </div>

      {/* 3. ONDERSTE FRAME: PAST ZICH DYNAMISCH AAN IN HOOGTE ZODAT ALLE SPIEREN PASSEN */}
      <div className="w-full shrink-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-[0_-8px_30px_rgba(0,0,0,0.2)] rounded-t-3xl px-3.5 pt-2.5 pb-4 pointer-events-auto flex flex-col space-y-2">
        {/* Bovenste regel van het frame: Gewrichtstype aanduiding + Deelgewrichten indien aanwezig */}
        <div className="flex items-center justify-between gap-2 w-full">
          <div className="flex items-center gap-1.5 min-w-0 flex-1">
            <span className="text-[10px] uppercase font-black tracking-wider text-slate-400 shrink-0">
              Type:
            </span>
            <span 
              className="text-[11px] font-black text-blue-900 bg-blue-50 border border-blue-200/80 px-2 py-0.5 rounded-lg truncate block"
              title={activeJoint.jointType}
            >
              {activeJoint.jointType}
            </span>
          </div>

          {activeJoint.subJoints && activeJoint.subJoints.length > 0 && (
            <button
              type="button"
              onClick={() => setShowSubJoints(!showSubJoints)}
              className="text-[10px] font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 border border-slate-200 px-2 py-0.5 rounded-lg flex items-center gap-1 transition shrink-0 active:scale-95"
            >
              <span>Deelgewrichten</span>
              <ChevronDown className={`w-3 h-3 transition-transform ${showSubJoints ? 'rotate-180' : ''}`} />
            </button>
          )}
        </div>

        {/* Uitklapbare sub-gewrichten indien opengeklikt */}
        {showSubJoints && activeJoint.subJoints && (
          <div className="p-2 bg-slate-50 border border-slate-200 rounded-xl space-y-1 text-[11px] animate-in fade-in duration-150">
            {activeJoint.subJoints.map((sub) => (
              <div key={sub.name} className="leading-tight">
                <span className="font-bold text-slate-900">{sub.name}: </span>
                <span className="text-slate-600">{sub.dutchName || sub.description}</span>
              </div>
            ))}
          </div>
        )}

        {/* ONDERIN KNOPPEN VAN DE BEWEGINGEN (Flexie, Extensie, Abductie etc.) */}
        <div>
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">
            Kies beweging:
          </div>
          <div className="flex items-center gap-1.5 overflow-x-auto pb-0.5 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
            {activeJoint.movements.map((mov) => {
              const isActive = mov.movement === activeMovementName;
              return (
                <button
                  key={mov.movement}
                  type="button"
                  onClick={() => setActiveMovementName(mov.movement)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-black whitespace-nowrap transition-all flex items-center gap-1.5 active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  <MovementIcon movement={mov.movement} className={`w-3.5 h-3.5 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{mov.movement}</span>
                  <span
                    className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold ${
                      isActive ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-600'
                    }`}
                  >
                    {mov.muscleIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* GESELECTEERDE SPIEREN DIE BIJ DEZE BEWEGING HOREN (Geen scrollbar: frame past zich aan) */}
        <div className="pt-1 border-t border-slate-100">
          <div className="flex items-center justify-between text-[11px] mb-1">
            <span className="font-bold text-slate-800">
              Spieren voor {activeMovementName} ({selectedMuscles.length}):
            </span>
            {activeMovementInfo?.note && (
              <span className="text-[10px] text-slate-500 italic truncate max-w-[180px]">
                {activeMovementInfo.note}
              </span>
            )}
          </div>
          <div className="flex items-center gap-1.5 flex-wrap">
            {selectedMuscles.map((muscle) => (
              <span
                key={muscle.id}
                className="inline-flex items-center px-2 py-0.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-950 font-bold text-[11px]"
              >
                {muscle.name}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
