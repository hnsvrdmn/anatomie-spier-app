import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { MuscleDetail } from './MuscleDetail';
import { RotateCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight } from 'lucide-react';
import { MUSCLE_MOVEMENTS } from '../../data/muscleMovements';

export const MobileStudyView: React.FC = () => {
  const { 
    muscles, 
    currentView, 
    setCurrentView, 
    selectedMuscle, 
    selectedMuscles, 
    selectedMuscleIds,
    symmetrySide, 
    selectMuscle,
    setMultipleMuscles
  } = useMuscles();

  const [selectedJointId, setSelectedJointId] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);

  // Drag handling voor de uitschuifbare lade onderin
  const dragStartYRef = useRef<number | null>(null);
  const isDraggingRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    isDraggingRef.current = true;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
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

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    dragStartYRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {
      // ignore
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    dragStartYRef.current = e.touches[0].clientY;
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragStartYRef.current === null) return;
    const currentY = e.touches[0].clientY;
    const deltaY = currentY - dragStartYRef.current;
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

  // Automatisch wisselen naar het juiste aanzicht van de geselecteerde spier
  useEffect(() => {
    if (selectedMuscle && currentView !== selectedMuscle.view) {
      setCurrentView(selectedMuscle.view);
    }
  }, [selectedMuscle?.id, selectedMuscle?.view, setCurrentView]);

  // Gefilterde spieren op basis van gekozen gewricht
  const filteredMuscles = useMemo(() => {
    if (selectedJointId === 'all') return muscles;
    return muscles.filter(m => m.jointCategories && m.jointCategories.includes(selectedJointId));
  }, [muscles, selectedJointId]);

  // De spier die op dit moment actief is
  const activeMuscle = selectedMuscle || selectedMuscles[0] || filteredMuscles[0] || muscles[0];

  // Wissel dropdown keuze: kan een gewrichtsgroep zijn of een specifieke spier
  const handleDropdownChange = (value: string) => {
    if (value.startsWith('joint:')) {
      const jointId = value.replace('joint:', '');
      setSelectedJointId(jointId);
      if (jointId === 'all') {
        if (muscles.length > 0) {
          setMultipleMuscles(muscles.map(m => m.id));
          selectMuscle(muscles[0].id, true);
        }
      } else {
        const jointMuscles = muscles.filter(m => m.jointCategories?.includes(jointId));
        if (jointMuscles.length > 0) {
          setMultipleMuscles(jointMuscles.map(m => m.id));
          selectMuscle(jointMuscles[0].id, true);
        }
      }
    } else if (value.startsWith('muscle:')) {
      const muscleId = value.replace('muscle:', '');
      selectMuscle(muscleId, true);
    }
  };

  // Vorige / Volgende spier skippen (< en >)
  const handlePrevMuscle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = selectedJointId !== 'all' && filteredMuscles.length > 0 ? filteredMuscles : muscles;
    if (list.length === 0) return;
    const currentId = activeMuscle?.id;
    const idx = list.findIndex(m => m.id === currentId);
    const prevIdx = (idx - 1 + list.length) % list.length;
    selectMuscle(list[prevIdx].id, true);
  };

  const handleNextMuscle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = selectedJointId !== 'all' && filteredMuscles.length > 0 ? filteredMuscles : muscles;
    if (list.length === 0) return;
    const currentId = activeMuscle?.id;
    const idx = list.findIndex(m => m.id === currentId);
    const nextIdx = (idx + 1) % list.length;
    selectMuscle(list[nextIdx].id, true);
  };

  // Bepaal de huidige waarde van het menuutje bovenin
  const currentDropdownValue = useMemo(() => {
    if (selectedMuscleIds.length === 1 && activeMuscle) {
      return `muscle:${activeMuscle.id}`;
    }
    return `joint:${selectedJointId}`;
  }, [selectedMuscleIds.length, activeMuscle?.id, selectedJointId]);

  // Bij initialisatie: alle spieren van gekozen gewricht selecteren
  useEffect(() => {
    if (selectedJointId === 'all') {
      if (muscles.length > 0 && selectedMuscles.length <= 1) {
        setMultipleMuscles(muscles.map(m => m.id));
      }
    } else {
      const jointMuscles = muscles.filter(m => m.jointCategories?.includes(selectedJointId));
      if (jointMuscles.length > 0) {
        setMultipleMuscles(jointMuscles.map(m => m.id));
      }
    }
  }, []);

  return (
    <div className="relative w-full h-[calc(100dvh-3.5rem)] bg-white flex flex-col overflow-hidden select-none">
      
      {/* 1. MENUUTJE BOVENIN: GEWRICHT OF SPECIFIEKE SPIER KIEZEN */}
      <div className="w-full px-3 py-2 bg-white/95 backdrop-blur-md border-b border-clinical-200 shrink-0 relative z-50 shadow-xs pointer-events-auto box-border">
        <select
          value={currentDropdownValue}
          onChange={(e) => handleDropdownChange(e.target.value)}
          className="w-full min-w-0 max-w-full px-3 py-1.5 bg-clinical-50 hover:bg-clinical-100 border border-clinical-300 rounded-xl text-xs font-bold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition cursor-pointer truncate"
        >
          <optgroup label="Gewrichten">
            {JOINT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={`joint:${cat.id}`}>
                {cat.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ')} ({cat.muscleIds.length})
              </option>
            ))}
          </optgroup>
          <optgroup label="Spieren">
            {muscles.map((m) => (
              <option key={m.id} value={`muscle:${m.id}`}>
                {m.name}
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 2. DE GROTE AFBEELDING MET WITTE ACHTERGROND */}
      <div className="flex-1 w-full h-full bg-white relative flex items-center justify-center overflow-hidden pb-8">
        {/* Minimalistische draaiknop met ALLEEN het draai-icoontje linksboven op de skeletafbeelding */}
        <button
          type="button"
          onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
          className="absolute top-2.5 left-2.5 z-30 w-9 h-9 rounded-full bg-white/95 backdrop-blur-md border border-clinical-200 shadow-sm flex items-center justify-center text-clinical-700 active:scale-90 hover:text-clinical-950 transition pointer-events-auto"
          title={`Draai skelet (${currentView === 'ventral' ? 'Dorsaal' : 'Ventraal'})`}
          aria-label="Draai aanzicht"
        >
          <RotateCw className="w-4 h-4 text-clinical-700" />
        </button>

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
          hideZoomToolbar={true}
          isMobile={true}
        />
      </div>

      {/* 3. UITSCHUIFBARE LADE ONDERIN: INGEVOUWEN MET GROTERE NAAM EN VOLLEDIGE LEESBARE ORIGO & INSERTIE */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-clinical-200 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-3xl transition-all duration-300 pointer-events-auto flex flex-col ${
          isDrawerOpen ? 'max-h-[calc(100dvh-7.5rem)]' : 'h-auto max-h-[220px]'
        }`}
      >
        {/* SLEEPHENDEL & HEADER MET ACTIEVE SPIER, ORIGO, INSERTIE & < > KNOPPEN */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsDrawerOpen(prev => !prev)}
          className="w-full px-3.5 py-2.5 cursor-grab active:cursor-grabbing touch-none select-none shrink-0 border-b border-clinical-100 flex flex-col justify-center"
        >
          {/* Midden: klein subtiel sleeppilletje (-) */}
          <div className="w-8 h-1 bg-slate-300 rounded-full mx-auto mb-1.5 shrink-0" />

          {/* Bovenste rij: [<] Actieve Spiernaam [>] + open/dicht pijl */}
          <div className="flex items-center justify-between gap-1 w-full">
            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handlePrevMuscle(e);
              }}
              className="p-1.5 -ml-1 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-clinical-700 transition pointer-events-auto"
              title="Vorige spier"
              aria-label="Vorige spier"
            >
              <ChevronLeft className="w-5 h-5 text-clinical-700" />
            </button>

            <div className="flex-1 min-w-0 text-center px-1">
              <span className="font-black text-sm sm:text-base text-clinical-950 truncate block tracking-tight">
                {activeMuscle ? activeMuscle.name : 'Geen spier geselecteerd'}
              </span>
            </div>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                handleNextMuscle(e);
              }}
              className="p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-clinical-700 transition pointer-events-auto"
              title="Volgende spier"
              aria-label="Volgende spier"
            >
              <ChevronRight className="w-5 h-5 text-clinical-700" />
            </button>

            <button
              type="button"
              onPointerDown={(e) => e.stopPropagation()}
              onTouchStart={(e) => e.stopPropagation()}
              onClick={(e) => {
                e.stopPropagation();
                setIsDrawerOpen(prev => !prev);
              }}
              className="flex items-center text-blue-600 font-bold p-1 ml-0.5 shrink-0 pointer-events-auto"
              title={isDrawerOpen ? "Sluit details" : "Open details"}
            >
              {isDrawerOpen ? (
                <ChevronDown className="w-4 h-4 text-slate-500" />
              ) : (
                <ChevronUp className="w-4 h-4 text-blue-600" />
              )}
            </button>
          </div>

          {/* Onderste regels: Volledige Origo (O), Insertie (I) en Bewegingen (ALLEEN zichtbaar wanneer lade ingeklapt is!) */}
          {!isDrawerOpen && activeMuscle && (
            <div className="mt-2 space-y-1 text-xs leading-snug px-1">
              <div className="flex items-start gap-1.5 text-slate-800">
                <span className="font-bold text-blue-700 text-xs shrink-0 mt-0.5">O:</span>
                <span className="text-slate-700 font-medium break-words leading-tight">{activeMuscle.originText}</span>
              </div>
              <div className="flex items-start gap-1.5 text-slate-800">
                <span className="font-bold text-rose-600 text-xs shrink-0 mt-0.5">I:</span>
                <span className="text-slate-700 font-medium break-words leading-tight">{activeMuscle.insertionText}</span>
              </div>
              {(() => {
                const movs = MUSCLE_MOVEMENTS[activeMuscle.id] || [];
                const movText = movs.length > 0 ? movs.join(', ') : (activeMuscle.functionText || '');
                if (!movText) return null;
                return (
                  <div className="flex items-start gap-1.5 text-slate-800 pt-0.5">
                    <span className="font-bold text-emerald-700 text-xs shrink-0 mt-0.5">Bewegingen:</span>
                    <span className="text-slate-700 font-medium break-words leading-tight">{movText}</span>
                  </div>
                );
              })()}
            </div>
          )}
        </div>

        {/* INHOUD VAN DE LADE (UITGESCHOVEN): VOLLEDIGE SPIERDETAILS INCLUSIEF DE GROENE BEWEGINGENBOX */}
        {isDrawerOpen && (
          <div className="p-3 pt-2 space-y-3 overflow-y-auto custom-scrollbar pb-8 animate-in fade-in duration-200">
            <MuscleDetail />
          </div>
        )}
      </div>

    </div>
  );
};
