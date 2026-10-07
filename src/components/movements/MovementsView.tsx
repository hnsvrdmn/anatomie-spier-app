import React, { useState, useMemo, useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { MovementIcon } from '../common/MovementIcon';
import { JOINTS_LEARNING_DATA } from '../../data/jointTypesData';
import { MobileMovementsView } from './MobileMovementsView';
import { useIsMobile } from '../../hooks/useIsMobile';
import { Layers } from 'lucide-react';

export const MovementsView: React.FC = () => {
  const isMobile = useIsMobile();
  const { muscles, currentView, setCurrentView, selectMuscle } = useMuscles();

  const [selectedJointId, setSelectedJointId] = useState<string>('coxae');
  const [activeMovementName, setActiveMovementName] = useState<string>('Anteflexie');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('both');

  const activeJoint = JOINTS_LEARNING_DATA[selectedJointId] || JOINTS_LEARNING_DATA.coxae;

  // Wanneer gewricht wisselt, kies de eerste beweging en standaard aanzicht
  useEffect(() => {
    if (activeJoint.movements.length > 0) {
      setActiveMovementName(activeJoint.movements[0].movement);
    }
    if (activeJoint.defaultView) {
      setCurrentView(activeJoint.defaultView);
    }
  }, [selectedJointId, activeJoint, setCurrentView]);

  // Actieve bewegingsinformatie
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

  // Mobiele weergave
  if (isMobile) {
    return <MobileMovementsView />;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 items-start">
      
      {/* LINKER/MIDDEN KOLOM: SKELET MET ONDERIN DE BEWEGINGSKNOPPEN */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-4 flex flex-col items-center justify-between bg-white rounded-3xl p-4 sm:p-5 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        
        {/* Bovenbalk met gewrichtsnaam en aanzichtwissel */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-black text-slate-500 uppercase tracking-wider">
              {activeJoint.dutchName} ({activeJoint.latinName})
            </span>
          </div>

          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={activeJoint.defaultView}
              showBothOption={true}
              activeLayout={viewLayout}
              onLayoutChange={setViewLayout}
            />
          </div>
        </div>

        {/* Skeletweergave: toont precies de actieve spieren voor deze beweging */}
        {viewLayout === 'both' ? (
          <div className="flex-1 min-h-0 w-full h-full grid grid-cols-2 gap-4 py-2 overflow-hidden">
            <div className="relative w-full h-full flex flex-col items-center justify-center border-r border-slate-100 pr-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Ventraal
              </span>
              <SkeletonViewer
                currentView="ventral"
                activeMuscles={selectedMuscles}
                activeSide="both"
                interactive={false}
              />
            </div>
            <div className="relative w-full h-full flex flex-col items-center justify-center pl-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Dorsaal
              </span>
              <SkeletonViewer
                currentView="dorsal"
                activeMuscles={selectedMuscles}
                activeSide="both"
                interactive={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-2 overflow-hidden">
            <SkeletonViewer
              currentView={currentView}
              activeMuscles={selectedMuscles}
              activeSide="both"
              interactive={false}
            />
          </div>
        )}

        {/* ONDERIN KNOPPEN VAN DE BEWEGINGEN (Flexie, Extensie etc.) */}
        <div className="w-full shrink-0 pt-3 border-t border-clinical-100 flex flex-col space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-600">
            <span className="uppercase tracking-wider text-[11px] text-slate-400">
              Kies beweging in dit gewricht:
            </span>
            <span className="text-blue-700">
              {selectedMuscles.length} {selectedMuscles.length === 1 ? 'spier' : 'spieren'} actief
            </span>
          </div>

          <div className="flex items-center gap-2 flex-wrap justify-center">
            {activeJoint.movements.map((mov) => {
              const isActive = mov.movement === activeMovementName;
              return (
                <button
                  key={mov.movement}
                  type="button"
                  onClick={() => setActiveMovementName(mov.movement)}
                  className={`px-4 py-2 rounded-xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-2xs active:scale-95 ${
                    isActive
                      ? 'bg-blue-600 text-white shadow-md ring-2 ring-blue-400'
                      : 'bg-clinical-50 hover:bg-clinical-100 border border-clinical-200 text-slate-800'
                  }`}
                >
                  <MovementIcon movement={mov.movement} className={`w-4 h-4 ${isActive ? 'text-white' : 'text-blue-600'}`} />
                  <span>{mov.movement}</span>
                  <span
                    className={`text-xs px-2 py-0.5 rounded-full font-bold ${
                      isActive ? 'bg-white/30 text-white' : 'bg-slate-200 text-slate-700'
                    }`}
                  >
                    {mov.muscleIds.length}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* RECHTER ZIJPANEEL: GEWRICHT KIEZEN + GEWRICHTSTYPE INFORMATIE & SPIERDETAILS */}
      <div className="w-full lg:w-[450px] xl:w-[470px] max-h-[92vh] overflow-y-auto custom-scrollbar pr-1 flex flex-col space-y-4 shrink-0">
        
        {/* 1. Gewrichtskeuze Dropdown */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/90 shadow-sm space-y-2">
          <label className="text-xs font-black text-slate-500 uppercase tracking-wider block">
            Selecteer Gewricht
          </label>
          <select
            value={selectedJointId}
            onChange={(e) => setSelectedJointId(e.target.value)}
            className="w-full px-3.5 py-2.5 bg-clinical-50 border border-clinical-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer"
          >
            <option value="coxae">Art. COXAE (Heupgewricht)</option>
            <option value="genus">Art. GENUS (Kniegewricht)</option>
            <option value="pedis">Art. PEDIS (Enkel- & Voetgewrichten)</option>
            <option value="cubiti">Art. CUBITI (Ellebooggewricht)</option>
            <option value="humeri">Art. HUMERI (Schoudergewricht)</option>
            <option value="cingulum">CINGULUM PECTORALE (Schoudergordel)</option>
            <option value="romp">ROMP / WERVELKOLOM</option>
          </select>
        </div>

        {/* 2. Gewrichtsinformatie & Type (Bolgewricht, Rol-scharnier, etc.) */}
        <div className="bg-white p-5 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
          <div>
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-600 block mb-0.5">
              Gewrichtstype Informatie
            </span>
            <h3 className="text-lg font-black text-slate-900 leading-tight">
              {activeJoint.latinName}
            </h3>
            <p className="text-xs text-slate-500 font-semibold">{activeJoint.dutchName}</p>
          </div>

          {/* Gewrichtstype Badge */}
          <div className="p-3 bg-blue-50/70 border border-blue-200/80 rounded-xl space-y-1">
            <span className="text-[10px] font-black uppercase tracking-wider text-blue-800 block">
              Type gewricht:
            </span>
            <p className="text-sm font-black text-blue-950">
              {activeJoint.jointType}
            </p>
          </div>

          {activeJoint.description && (
            <p className="text-xs text-slate-600 leading-relaxed font-medium">
              {activeJoint.description}
            </p>
          )}

          {/* Deelgewrichten breakdown (bijv. Art. pedis BSG/OSG of Art. cubiti) */}
          {activeJoint.subJoints && activeJoint.subJoints.length > 0 && (
            <div className="pt-2 border-t border-slate-100 space-y-2">
              <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Layers className="w-3.5 h-3.5 text-blue-600" />
                <span>Onderverdeeld in deelgewrichten:</span>
              </span>
              <div className="space-y-1.5">
                {activeJoint.subJoints.map((sub) => (
                  <div key={sub.name} className="p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-xs">
                    <span className="font-black text-slate-900 block">{sub.name}</span>
                    {sub.dutchName && (
                      <span className="text-[11px] font-bold text-blue-700 block">{sub.dutchName}</span>
                    )}
                    {sub.description && (
                      <span className="text-[11px] text-slate-600 font-medium block pt-0.5">{sub.description}</span>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Geselecteerde Beweging & Betrokken Spieren */}
        <div className="bg-white p-5 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 block">
                Actieve Beweging
              </span>
              <h4 className="text-base font-black text-slate-900">
                {activeMovementName}
              </h4>
            </div>
            <span className="px-2.5 py-1 rounded-xl bg-emerald-100 text-emerald-900 font-black text-xs">
              {selectedMuscles.length} spieren
            </span>
          </div>

          {activeMovementInfo?.note && (
            <p className="text-xs text-slate-600 font-medium bg-slate-50 p-2.5 rounded-xl border border-slate-200/60 leading-relaxed">
              {activeMovementInfo.note}
            </p>
          )}

          <div className="space-y-2">
            <span className="text-xs font-bold text-slate-700 block">
              Betrokken spieren in {activeJoint.dutchName}:
            </span>
            <div className="space-y-2">
              {selectedMuscles.map((muscle) => (
                <div
                  key={muscle.id}
                  onClick={() => selectMuscle(muscle.id, true)}
                  className="p-3 rounded-xl bg-slate-50 hover:bg-emerald-50/70 border border-slate-200/80 hover:border-emerald-300 transition cursor-pointer"
                >
                  <div className="flex items-center justify-between gap-2 mb-1">
                    <span className="font-black text-xs sm:text-sm text-slate-900">{muscle.name}</span>
                    <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider px-2 py-0.5 bg-white rounded border border-slate-200 shrink-0">
                      {muscle.view}
                    </span>
                  </div>
                  <div className="mt-1 space-y-1 text-xs text-slate-700 leading-relaxed font-medium">
                    <div className="break-words">
                      <span className="font-bold text-blue-700">Origo: </span>
                      {muscle.originText}
                    </div>
                    <div className="break-words">
                      <span className="font-bold text-rose-600">Insertie: </span>
                      {muscle.insertionText}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};
