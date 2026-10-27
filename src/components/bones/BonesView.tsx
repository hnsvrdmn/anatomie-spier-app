import React, { useState } from 'react';
import { useBones } from '../../context/BoneContext';
import { Bone } from '../../data/bonesData';
import { AnatomicalView } from '../../types/anatomy';
import { BoneSkeletonViewer } from './BoneSkeletonViewer';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { useIsMobile } from '../../hooks/useIsMobile';
import { RotateCw, X } from 'lucide-react';

export const BonesView: React.FC = () => {
  const isMobile = useIsMobile();
  const { bones } = useBones();

  // Weergave (Ventraal of Dorsaal)
  const [currentView, setCurrentView] = useState<AnatomicalView>('ventral');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('ventral');

  // Geselecteerd bot (wanneer op een punt geklikt wordt)
  const [selectedBone, setSelectedBone] = useState<Bone | null>(null);

  // Klik op een botmarker
  const handleSelectBone = (bone: Bone) => {
    setSelectedBone(bone);
    if (viewLayout !== 'both') {
      if (bone.primaryView === 'ventral' && currentView !== 'ventral') {
        setCurrentView('ventral');
      } else if (bone.primaryView === 'dorsal' && currentView !== 'dorsal') {
        setCurrentView('dorsal');
      }
    }
  };

  // =========================================================================
  // MOBIELE WEERGAVE
  // =========================================================================
  if (isMobile) {
    return (
      <div className="relative w-full h-[calc(100dvh-3.5rem)] bg-white flex flex-col overflow-hidden select-none">
        {/* Bovenbalk met aanzichtwissel (zoals bij de andere tabs) */}
        <div className="w-full px-3 py-2 bg-white border-b border-clinical-200 shrink-0 flex items-center justify-between">
          <div className="flex-1 min-w-0" />
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={selectedBone?.primaryView === 'both' ? undefined : selectedBone?.primaryView}
            />
          </div>
          <div className="flex-1 min-w-0 flex justify-end">
            <button
              type="button"
              onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
              className="p-1.5 rounded-xl border border-clinical-200 text-clinical-700 hover:bg-clinical-50 transition"
              title="Draai aanzicht"
            >
              <RotateCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Skelet afbeelding (witte achtergrond, behoudt vaste verhouding) */}
        <div className="flex-1 w-full bg-white relative flex items-center justify-center overflow-hidden p-2">
          <BoneSkeletonViewer
            currentView={currentView}
            bones={bones}
            selectedBone={selectedBone}
            onSelectBone={handleSelectBone}
            isMobile={true}
          />
        </div>

        {/* Detailkaart onderin wanneer een bot geselecteerd is */}
        {selectedBone && (
          <div className="w-full bg-white border-t border-clinical-200 shadow-lg p-4 flex flex-col gap-1.5 shrink-0 animate-in slide-in-from-bottom-2 duration-150">
            <div className="flex items-start justify-between">
              <div>
                <h2 className="text-base font-black text-clinical-950">{selectedBone.latinName}</h2>
                <div className="text-xs font-bold text-sky-700">{selectedBone.dutchName}</div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBone(null)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            {selectedBone.typesSubtitle && (
              <div className="text-xs text-slate-800 bg-sky-50 p-2 rounded-lg border border-sky-200 font-medium leading-snug">
                {selectedBone.typesSubtitle}
              </div>
            )}
            <p className="text-xs text-slate-600 leading-relaxed">
              {selectedBone.description}
            </p>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // DESKTOP WEERGAVE
  // =========================================================================
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 items-start">
      {/* Linker kolom: Skelet met Vaste Weergave (identiek aan StudyView) */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-4 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk met gecentreerde Aanzichtwissel (exact zoals bij andere tabs) */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1">
          <div className="flex-1 min-w-0" />
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={selectedBone?.primaryView === 'both' ? undefined : selectedBone?.primaryView}
              showBothOption={true}
              activeLayout={viewLayout}
              onLayoutChange={setViewLayout}
            />
          </div>
          <div className="flex-1 min-w-0" />
        </div>

        {/* Skelet Container met witte achtergrond (beide weergaven of enkelvoudig) */}
        {viewLayout === 'both' ? (
          <div className="flex-1 min-h-0 w-full h-full grid grid-cols-2 gap-4 py-1 overflow-hidden bg-white">
            <div className="relative w-full h-full flex flex-col items-center justify-center border-r border-slate-100 pr-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Ventraal
              </span>
              <BoneSkeletonViewer
                currentView="ventral"
                bones={bones}
                selectedBone={selectedBone}
                onSelectBone={handleSelectBone}
                isMobile={false}
              />
            </div>
            <div className="relative w-full h-full flex flex-col items-center justify-center pl-2">
              <span className="absolute top-1 left-2 text-[10px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2 py-0.5 rounded-md z-10 shadow-2xs">
                Dorsaal
              </span>
              <BoneSkeletonViewer
                currentView="dorsal"
                bones={bones}
                selectedBone={selectedBone}
                onSelectBone={handleSelectBone}
                isMobile={false}
              />
            </div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden bg-white">
            <BoneSkeletonViewer
              currentView={currentView}
              bones={bones}
              selectedBone={selectedBone}
              onSelectBone={handleSelectBone}
              isMobile={false}
            />
          </div>
        )}
      </div>

      {/* Rechter kolom: Alleen info wanneer op een bot gedrukt wordt */}
      <div className="w-full lg:w-[420px] flex flex-col gap-4">
        {selectedBone ? (
          <div className="bg-white rounded-3xl p-6 border border-clinical-200/90 shadow-sm flex flex-col gap-3 animate-in fade-in duration-150">
            <div className="flex items-start justify-between border-b border-clinical-100 pb-3">
              <div>
                <h2 className="text-2xl font-black text-clinical-950 tracking-tight">
                  {selectedBone.latinName}
                </h2>
                <div className="text-base font-bold text-sky-700 mt-0.5">
                  {selectedBone.dutchName}
                </div>
              </div>
              <button
                type="button"
                onClick={() => setSelectedBone(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50 transition"
                title="Sluit infovenster"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {selectedBone.typesSubtitle && (
              <div className="text-xs font-semibold text-slate-800 bg-sky-50 p-3 rounded-2xl border border-sky-200/80 leading-relaxed">
                {selectedBone.typesSubtitle}
              </div>
            )}

            <p className="text-sm leading-relaxed text-slate-700 mt-1">
              {selectedBone.description}
            </p>
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-clinical-200/90 shadow-sm flex flex-col items-center justify-center text-center py-16 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-clinical-50 flex items-center justify-center text-clinical-400 mb-3 border border-clinical-200/60">
              <span className="text-xl font-black">🦴</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Geen bot geselecteerd</h3>
            <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
              Beweeg met de muis over de punten op het skelet om de botten te zien, of klik op een punt voor meer informatie.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
