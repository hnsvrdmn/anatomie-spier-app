import React, { useState, useRef } from 'react';
import { useBones } from '../../context/BoneContext';
import { useMuscles } from '../../context/MuscleContext';
import { Bone } from '../../data/bonesData';
import { getBoneAttachments } from '../../data/boneAttachments';
import { AnatomicalView } from '../../types/anatomy';
import { BoneSkeletonViewer } from './BoneSkeletonViewer';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { useIsMobile } from '../../hooks/useIsMobile';
import { RotateCw, X, ArrowRight, ChevronUp, ChevronLeft, ChevronRight } from 'lucide-react';

interface BoneAttachmentsCardProps {
  boneId: string;
  onSelectMuscle?: (muscleId: string) => void;
}

const BoneAttachmentsCard: React.FC<BoneAttachmentsCardProps> = ({ boneId, onSelectMuscle }) => {
  const data = getBoneAttachments(boneId);
  if (!data) return null;

  const hasOrigins = data.origins && data.origins.length > 0;
  const hasInsertions = data.insertions && data.insertions.length > 0;
  const hasContent = hasOrigins || hasInsertions || Boolean(data.note);

  if (!hasContent) return null;

  return (
    <div className="flex flex-col gap-3 pt-3 border-t border-clinical-100">
      <div className="flex items-center justify-between">
        <h3 className="text-xs font-black uppercase tracking-wider text-slate-800">
          Aanhechtende spieren
        </h3>
        <span className="text-[10px] text-slate-500 font-semibold lowercase">
          {[
            hasOrigins ? `${data.origins.length} origo` : null,
            hasInsertions ? `${data.insertions.length} insertie` : null,
          ].filter(Boolean).join(' • ')}
        </span>
      </div>

      {data.note && (
        <div className="text-xs text-amber-900 bg-amber-50 p-2.5 rounded-xl border border-amber-200/80 leading-relaxed font-medium">
          💡 {data.note}
        </div>
      )}

      {/* Origo lijst */}
      {hasOrigins && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-blue-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
            <span>Origo:</span>
          </div>
          <div className="space-y-1.5">
            {data.origins.map((att, idx) => (
              <div
                key={`${att.muscleId}-${idx}`}
                onClick={() => onSelectMuscle?.(att.muscleId)}
                className={`p-2.5 rounded-xl bg-blue-50/70 border border-blue-200/70 text-xs transition flex flex-col gap-0.5 group ${
                  onSelectMuscle ? 'hover:bg-blue-100/80 hover:border-blue-300 cursor-pointer' : ''
                }`}
                title={onSelectMuscle ? `Bekijk ${att.muscleName} in de spierenatlas` : undefined}
              >
                <div className="font-black text-blue-950 flex items-center justify-between">
                  <span>{att.muscleName}</span>
                  <div className="flex items-center gap-1">
                    {att.part && (
                      <span className="text-[10px] font-semibold text-blue-800 bg-blue-100 px-1.5 py-0.5 rounded-md">
                        {att.part}
                      </span>
                    )}
                    {onSelectMuscle && (
                      <ArrowRight className="w-3 h-3 text-blue-400 group-hover:text-blue-700 transition transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium leading-snug">
                  📍 {att.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Insertie lijst */}
      {hasInsertions && (
        <div className="space-y-1.5">
          <div className="text-[11px] font-bold text-rose-800 flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-red-600 shrink-0" />
            <span>Insertie:</span>
          </div>
          <div className="space-y-1.5">
            {data.insertions.map((att, idx) => (
              <div
                key={`${att.muscleId}-${idx}`}
                onClick={() => onSelectMuscle?.(att.muscleId)}
                className={`p-2.5 rounded-xl bg-rose-50/70 border border-rose-200/70 text-xs transition flex flex-col gap-0.5 group ${
                  onSelectMuscle ? 'hover:bg-rose-100/80 hover:border-rose-300 cursor-pointer' : ''
                }`}
                title={onSelectMuscle ? `Bekijk ${att.muscleName} in de spierenatlas` : undefined}
              >
                <div className="font-black text-rose-950 flex items-center justify-between">
                  <span>{att.muscleName}</span>
                  <div className="flex items-center gap-1">
                    {att.part && (
                      <span className="text-[10px] font-semibold text-rose-800 bg-rose-100 px-1.5 py-0.5 rounded-md">
                        {att.part}
                      </span>
                    )}
                    {onSelectMuscle && (
                      <ArrowRight className="w-3 h-3 text-rose-400 group-hover:text-rose-700 transition transform group-hover:translate-x-0.5" />
                    )}
                  </div>
                </div>
                <div className="text-[11px] text-slate-600 font-medium leading-snug">
                  📍 {att.location}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export const BonesView: React.FC = () => {
  const isMobile = useIsMobile();
  const { bones } = useBones();
  const { selectMuscle, setAppMode } = useMuscles();

  // Weergave (Ventraal of Dorsaal)
  const [currentView, setCurrentView] = useState<AnatomicalView>('ventral');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('ventral');

  // Geselecteerd bot
  const [selectedBone, setSelectedBone] = useState<Bone | null>(null);

  // Uitschuifbaar paneel onderin (mobiel)
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

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

  // Vorige / Volgende bot selecteren op mobiel
  const handlePrevBone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bones.length === 0) return;
    const currentId = selectedBone?.id;
    const idx = bones.findIndex((b) => b.id === currentId);
    const prevIdx = idx >= 0 ? (idx - 1 + bones.length) % bones.length : bones.length - 1;
    handleSelectBone(bones[prevIdx]);
  };

  const handleNextBone = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (bones.length === 0) return;
    const currentId = selectedBone?.id;
    const idx = bones.findIndex((b) => b.id === currentId);
    const nextIdx = idx >= 0 ? (idx + 1) % bones.length : 0;
    handleSelectBone(bones[nextIdx]);
  };

  // Drag handlers voor de onderste lade
  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {}
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (deltaY < -20 && !isDrawerOpen) {
      setIsDrawerOpen(true);
      isDraggingRef.current = false;
    } else if (deltaY > 20 && isDrawerOpen) {
      setIsDrawerOpen(false);
      isDraggingRef.current = false;
    }
  };

  const handlePointerUp = () => {
    isDraggingRef.current = false;
    dragStartYRef.current = null;
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const deltaY = e.touches[0].clientY - dragStartYRef.current;
    if (deltaY < -20 && !isDrawerOpen) {
      setIsDrawerOpen(true);
      dragStartYRef.current = null;
    } else if (deltaY > 20 && isDrawerOpen) {
      setIsDrawerOpen(false);
      dragStartYRef.current = null;
    }
  };

  const handleTouchEnd = () => {
    dragStartYRef.current = null;
  };

  // Doorklikken naar de spier in de studie atlas
  const handleSelectMuscle = (muscleId: string) => {
    selectMuscle(muscleId);
    setAppMode('study');
  };

  // Telling aanhechtingen voor het actieve bot
  const currentAttachments = selectedBone ? getBoneAttachments(selectedBone.id) : null;
  const countsBadge = currentAttachments
    ? [
        currentAttachments.origins.length > 0 ? `${currentAttachments.origins.length} origo` : null,
        currentAttachments.insertions.length > 0 ? `${currentAttachments.insertions.length} insertie` : null,
      ].filter(Boolean).join(' • ')
    : '';

  // =========================================================================
  // MOBIELE WEERGAVE (Identiek in comfort en structuur aan de Spieren Tab)
  // =========================================================================
  if (isMobile) {
    return (
      <div className="relative w-full h-[calc(100dvh-3.5rem)] bg-white flex flex-col overflow-hidden select-none">
        {/* 1. Volledig scherm skelet met pinch-to-zoom en pan (wordt NOOIT verkleind!) */}
        <div className="flex-1 w-full h-full bg-white relative flex items-center justify-center overflow-hidden pb-24">
          {/* Draaiknop linksboven over het skelet */}
          <button
            type="button"
            onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
            className="absolute top-2.5 left-2.5 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-clinical-200 shadow-sm flex items-center justify-center text-clinical-700 active:scale-90 hover:text-clinical-950 transition pointer-events-auto"
            title={`Draai skelet (${currentView === 'ventral' ? 'Dorsaal' : 'Ventraal'})`}
            aria-label="Draai skelet"
          >
            <RotateCw className="w-4 h-4 text-clinical-700" />
          </button>

          <BoneSkeletonViewer
            currentView={currentView}
            bones={bones}
            selectedBone={selectedBone}
            onSelectBone={handleSelectBone}
            isMobile={true}
          />
        </div>

        {/* 2. In- en Uitklapbare Lade onderin (zwevend z-40, drukt het skelet niet weg) */}
        <div
          className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-clinical-200 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-3xl transition-all duration-300 pointer-events-auto flex flex-col ${
            isDrawerOpen
              ? 'max-h-[calc(100dvh-5.5rem)]'
              : 'h-auto max-h-[140px]'
          }`}
        >
          {/* SLEEPHENDEL & COMPACT HEADER: Tik of sleep omhoog/omlaag */}
          <div
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
            onClick={() => setIsDrawerOpen((prev) => !prev)}
            className="w-full px-3.5 py-2.5 cursor-grab active:cursor-grabbing touch-none select-none shrink-0 border-b border-clinical-100 flex flex-col justify-center"
          >
            {/* Sleeppilletje (-) */}
            <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto mb-1.5 shrink-0" />

            {/* Bovenste rij: [<] Botnaam [>] + toggle */}
            <div className="flex items-center justify-between gap-1 w-full">
              <button
                type="button"
                onClick={handlePrevBone}
                className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-clinical-700 transition pointer-events-auto"
                title="Vorig bot"
                aria-label="Vorig bot"
              >
                <ChevronLeft className="w-5 h-5 text-clinical-700" />
              </button>

              <div className="flex-1 min-w-0 text-center px-1">
                <span className="font-black text-sm sm:text-base text-clinical-950 truncate block tracking-tight">
                  {selectedBone ? selectedBone.latinName : 'Kies een bot'}
                </span>
                <span className="text-[11px] font-bold text-sky-700 truncate block">
                  {selectedBone ? selectedBone.dutchName : 'Tik op een punt op het skelet'}
                </span>
              </div>

              <button
                type="button"
                onClick={handleNextBone}
                className="p-1.5 -mr-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-clinical-700 transition pointer-events-auto"
                title="Volgend bot"
                aria-label="Volgend bot"
              >
                <ChevronRight className="w-5 h-5 text-clinical-700" />
              </button>
            </div>

            {/* Indicatorbadge & Uitklappijltje */}
            <div className="flex items-center justify-center gap-2 mt-1">
              {countsBadge && (
                <span className="text-[10px] font-bold text-slate-600 bg-slate-100 px-2 py-0.5 rounded-full border border-slate-200/80">
                  {countsBadge}
                </span>
              )}
              <ChevronUp
                className={`w-3.5 h-3.5 text-slate-400 transition-transform duration-200 ${
                  isDrawerOpen ? 'rotate-180' : ''
                }`}
              />
            </div>
          </div>

          {/* UITGEKLAPTE DETAILS: Alleen zichtbaar bij geopende lade */}
          {isDrawerOpen && (
            <div className="p-4 overflow-y-auto space-y-3 max-h-[calc(100dvh-12rem)] animate-in fade-in duration-150">
              {selectedBone ? (
                <>
                  {selectedBone.typesSubtitle && (
                    <div className="text-xs text-slate-800 bg-sky-50 p-2.5 rounded-xl border border-sky-200/80 font-medium leading-snug">
                      {selectedBone.typesSubtitle}
                    </div>
                  )}
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {selectedBone.description}
                  </p>

                  {/* Relevante botstructuren uit de reader */}
                  {selectedBone.structures && selectedBone.structures.length > 0 && (
                    <div className="space-y-2 pt-2 border-t border-clinical-100">
                      <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                        <span>Relevante botstructuren:</span>
                        <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full font-bold">
                          {selectedBone.structures.length} {selectedBone.structures.length === 1 ? 'structuur' : 'structuren'}
                        </span>
                      </div>
                      <div className="grid grid-cols-1 gap-1.5">
                        {selectedBone.structures.map((struct, idx) => (
                          <div
                            key={idx}
                            className="text-xs font-semibold text-slate-800 bg-slate-50/90 border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex items-center gap-2"
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                            <span>{struct}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Aanhechtende origo's en inserties */}
                  <BoneAttachmentsCard
                    boneId={selectedBone.id}
                    onSelectMuscle={handleSelectMuscle}
                  />
                </>
              ) : (
                <div className="text-center py-6 text-slate-400 text-xs">
                  Tik op een bolletje op het skelet om de volledige beschrijving en aanhechtende spieren te bekijken.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    );
  }

  // =========================================================================
  // DESKTOP WEERGAVE
  // =========================================================================
  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6 flex flex-col lg:flex-row gap-6 items-start">
      {/* Linker kolom: Skelet met Vaste Weergave */}
      <div className="w-full lg:flex-1 lg:sticky lg:top-4 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk met gecentreerde Aanzichtwissel */}
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
              <BoneSkeletonViewer
                currentView="ventral"
                bones={bones}
                selectedBone={selectedBone}
                onSelectBone={handleSelectBone}
                isMobile={false}
              />
            </div>
            <div className="relative w-full h-full flex flex-col items-center justify-center pl-2">
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

      {/* Rechter kolom: Alleen info wanneer op een bot gedrukt wordt (scrollbaar) */}
      <div className="w-full lg:w-[440px] flex flex-col gap-4 overflow-y-auto max-h-[92vh]">
        {selectedBone ? (
          <div className="bg-white rounded-3xl p-6 border border-clinical-200/90 shadow-sm flex flex-col gap-3.5 animate-in fade-in duration-150">
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

            <p className="text-xs sm:text-sm leading-relaxed text-slate-700">
              {selectedBone.description}
            </p>

            {/* Relevante botstructuren uit de reader */}
            {selectedBone.structures && selectedBone.structures.length > 0 && (
              <div className="space-y-2 pt-2 border-t border-clinical-100">
                <div className="text-xs font-black uppercase tracking-wider text-slate-800 flex items-center justify-between">
                  <span>Relevante botstructuren:</span>
                  <span className="text-[10px] text-sky-700 bg-sky-50 border border-sky-200/80 px-2 py-0.5 rounded-full font-bold">
                    {selectedBone.structures.length} {selectedBone.structures.length === 1 ? 'structuur' : 'structuren'}
                  </span>
                </div>
                <div className="grid grid-cols-1 gap-1.5">
                  {selectedBone.structures.map((struct, idx) => (
                    <div
                      key={idx}
                      className="text-xs font-semibold text-slate-800 bg-slate-50/90 border border-slate-200/90 rounded-xl px-2.5 py-1.5 flex items-center gap-2"
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-sky-500 shrink-0" />
                      <span>{struct}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Aanhechtende origo's en inserties */}
            <BoneAttachmentsCard
              boneId={selectedBone.id}
              onSelectMuscle={handleSelectMuscle}
            />
          </div>
        ) : (
          <div className="bg-white rounded-3xl p-8 border border-clinical-200/90 shadow-sm flex flex-col items-center justify-center text-center py-16 text-slate-400">
            <div className="w-12 h-12 rounded-2xl bg-clinical-50 flex items-center justify-center text-clinical-400 mb-3 border border-clinical-200/60">
              <span className="text-xl font-black">🦴</span>
            </div>
            <h3 className="text-sm font-bold text-slate-700 mb-1">Geen bot geselecteerd</h3>
            <p className="text-xs text-slate-500 max-w-[260px] leading-relaxed">
              Beweeg over de punten op het skelet om de botten te zien, of klik op een punt voor de beschrijving en aanhechtende origo&apos;s en inserties.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
