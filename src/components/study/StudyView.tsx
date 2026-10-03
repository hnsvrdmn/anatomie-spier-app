import React, { useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { ViewToggle } from '../common/ViewToggle';
import { MuscleSearch } from './MuscleSearch';
import { MuscleDetail } from './MuscleDetail';
import { MobileStudyView } from './MobileStudyView';
import { useIsMobile } from '../../hooks/useIsMobile';

export const StudyView: React.FC = () => {
  const isMobile = useIsMobile();
  const { muscles, currentView, setCurrentView, selectedMuscle, selectedMuscles, symmetrySide, selectMuscle } = useMuscles();

  // Mobiele weergave: geoptimaliseerde layout met gewrichtsdropdown boven afbeelding,
  // ventraal/dorsaal eronder, spierselectie daaronder en vergrootglas verwijderd
  if (isMobile) {
    return <MobileStudyView />;
  }

  // Automatisch wisselen naar het juiste aanzicht van de geselecteerde spier in studiemodus
  useEffect(() => {
    if (selectedMuscle && currentView !== selectedMuscle.view) {
      setCurrentView(selectedMuscle.view);
    }
  }, [selectedMuscle?.id, selectedMuscle?.view, setCurrentView]);

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
            />
          </div>
          <div className="flex-1 min-w-0" />
        </div>

        {/* Skelet Container met SVG Overlay (vaste stabiele hoogte, verspringt niet) */}
        <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden">
          <SkeletonViewer
            currentView={currentView}
            activeMuscle={selectedMuscle}
            activeMuscles={selectedMuscles}
            activeSide={symmetrySide}
            interactive={false}
            onSelectMuscle={(id) => {
              const target = muscles.find(m => m.id === id);
              if (target && currentView !== target.view) {
                setCurrentView(target.view);
              }
              selectMuscle(id, true);
            }}
          />
        </div>

        {/* Onderbalk met anatomische legenda (origo en insertie) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-center gap-6 pt-2 border-t border-clinical-100 text-xs text-clinical-600">
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-blue-600 shadow-xs" />
            <span className="font-semibold text-clinical-700">Origo</span>
          </div>
          <div className="flex items-center gap-1.5">
            <span className="w-3 h-3 rounded-full bg-red-600 shadow-xs" />
            <span className="font-semibold text-clinical-700">Insertie</span>
          </div>
        </div>
      </div>

      {/* Rechter Zijpaneel: Zoeken & Spierdetails */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0">
        <MuscleSearch />
        <MuscleDetail />
      </div>
    </div>
  );
};
