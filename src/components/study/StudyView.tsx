import React, { useEffect, useState, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { MuscleSearch } from './MuscleSearch';
import { MuscleDetail } from './MuscleDetail';
import { MobileStudyView } from './MobileStudyView';
import { useIsMobile } from '../../hooks/useIsMobile';
import { AlertTriangle } from 'lucide-react';

export const StudyView: React.FC = () => {
  const isMobile = useIsMobile();
  const { muscles, currentView, setCurrentView, selectedMuscle, selectedMuscles, symmetrySide, selectMuscle } = useMuscles();
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('ventral');
  const prevMuscleIdRef = useRef<string | undefined>(selectedMuscle?.id);
  const isFirstMount = useRef(true);

  // Automatisch wisselen naar het juiste aanzicht van de geselecteerde spier in studiemodus
  // Alleen wanneer er daadwerkelijk een nieuwe spier geselecteerd wordt. Hierna is de gebruiker vrij zelf te wisselen.
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevMuscleIdRef.current = selectedMuscle?.id;
      return;
    }
    if (selectedMuscle && selectedMuscle.id !== prevMuscleIdRef.current) {
      prevMuscleIdRef.current = selectedMuscle.id;
      if (viewLayout !== 'both') {
        setCurrentView(selectedMuscle.view);
      }
    }
  }, [selectedMuscle?.id, selectedMuscle?.view, viewLayout, setCurrentView]);

  // Mobiele weergave: geoptimaliseerde layout met gewrichtsdropdown boven afbeelding,
  // ventraal/dorsaal eronder, spierselectie daaronder en vergrootglas verwijderd
  if (isMobile) {
    return <MobileStudyView />;
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 items-start">
      {/* Linker/Midden kolom: Skelet met Vaste Weergave (volledig ontkoppeld van zijpaneelhoogte, verspringt NOOIT) */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-4 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk met gecentreerde Aanzichtwissel (vaste hoogte h-12 gelijk aan toetsmodus) */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1">
          <div className="flex-1 min-w-0" />
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={selectedMuscle?.view}
              showBothOption={true}
              activeLayout={viewLayout}
              onLayoutChange={setViewLayout}
            />
          </div>
          <div className="flex-1 min-w-0" />
        </div>

        {/* Skelet Container met SVG Overlay (vaste stabiele hoogte, verspringt niet) */}
        {viewLayout === 'both' ? (
          <div className="flex-1 min-h-0 w-full h-full grid grid-cols-2 gap-4 py-1 overflow-hidden">
            <div className="relative w-full h-full flex flex-col items-center justify-center border-r border-slate-100 pr-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Ventraal
              </span>
              <SkeletonViewer
                currentView="ventral"
                activeMuscle={selectedMuscle}
                activeMuscles={selectedMuscles}
                activeSide={symmetrySide}
                interactive={false}
                onSelectMuscle={(id) => selectMuscle(id, true)}
                resetOnMuscleChange={false}
              />
            </div>
            <div className="relative w-full h-full flex flex-col items-center justify-center pl-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Dorsaal
              </span>
              <SkeletonViewer
                currentView="dorsal"
                activeMuscle={selectedMuscle}
                activeMuscles={selectedMuscles}
                activeSide={symmetrySide}
                interactive={false}
                onSelectMuscle={(id) => selectMuscle(id, true)}
                resetOnMuscleChange={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden">
            <SkeletonViewer
              currentView={currentView}
              activeMuscle={selectedMuscle}
              activeMuscles={selectedMuscles}
              activeSide={symmetrySide}
              interactive={false}
              resetOnMuscleChange={false}
              onSelectMuscle={(id) => {
                const target = muscles.find(m => m.id === id);
                if (target && currentView !== target.view) {
                  setCurrentView(target.view);
                }
                selectMuscle(id, true);
              }}
            />
          </div>
        )}

        {/* Onderbalk met anatomische legenda (origo en insertie) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-center gap-6 pt-2 border-t border-clinical-100 text-xs text-clinical-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: '#1993f2' }} />
            <span className="font-semibold text-clinical-700">Origo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full shadow-xs" style={{ backgroundColor: '#ea580c' }} />
            <span className="font-semibold text-clinical-700">Insertie</span>
          </div>
        </div>
      </div>

      {/* Rechter Zijpaneel: Zoeken & Spierdetails */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0">
        <div className="w-full bg-amber-50 border border-amber-200/90 rounded-xl px-3 py-2 flex items-start gap-2 text-amber-900 text-xs font-medium shadow-2xs">
          <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
          <span className="leading-snug">
            <strong>Let op:</strong> De inconsistenties tussen het moduleboek, antwoord-PDF's en PowerPoint zitten er nog in.
          </span>
        </div>
        <MuscleSearch />
        <MuscleDetail />
      </div>
    </div>
  );
};
