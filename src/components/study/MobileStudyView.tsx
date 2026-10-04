import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { MuscleDetail } from './MuscleDetail';
import { Search, X, ChevronUp, ChevronDown, CheckSquare, Square, RefreshCcw, ChevronLeft, ChevronRight } from 'lucide-react';

export const MobileStudyView: React.FC = () => {
  const { 
    muscles, 
    currentView, 
    setCurrentView, 
    selectedMuscle, 
    selectedMuscles, 
    selectedMuscleIds,
    toggleMuscleSelection,
    clearSelectedMuscles,
    symmetrySide, 
    selectMuscle,
    setMultipleMuscles
  } = useMuscles();

  const [selectedJointId, setSelectedJointId] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState<string>('');
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

  // Gefilterde spieren op basis van gewricht en zoekterm
  const filteredMuscles = useMemo(() => {
    return muscles.filter((m) => {
      // 1. Zoekfilter
      const matchesSearch =
        !searchTerm.trim() ||
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.originText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.insertionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.functionText && m.functionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.otherFunctions && m.otherFunctions.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.primaryMovements && m.primaryMovements.some((p) => `${p.joint} ${p.movement}`.toLowerCase().includes(searchTerm.toLowerCase())));

      if (!matchesSearch) return false;

      // 2. Gewricht filter
      if (selectedJointId === 'all') return true;
      return m.jointCategories && m.jointCategories.includes(selectedJointId);
    });
  }, [muscles, searchTerm, selectedJointId]);

  // Wissel van gewricht: selecteer automatisch ALLE spieren uit dat gewricht
  const handleJointChange = (jointId: string) => {
    setSelectedJointId(jointId);
    if (jointId === 'all') {
      if (muscles.length > 0) {
        setMultipleMuscles(muscles.map(m => m.id));
      }
    } else {
      const jointMuscles = muscles.filter(m => m.jointCategories?.includes(jointId));
      if (jointMuscles.length > 0) {
        setMultipleMuscles(jointMuscles.map(m => m.id));
      }
    }
  };

  // Status van meervoudige selectie binnen het huidige filter
  const areAllFilteredSelected = filteredMuscles.length > 0 && filteredMuscles.every(m => selectedMuscleIds.includes(m.id));
  const hasMultipleSelected = selectedMuscleIds.length > 1;

  const handleClearSelection = () => {
    if (filteredMuscles.length > 0) {
      selectMuscle(filteredMuscles[0].id, true);
    } else {
      clearSelectedMuscles();
    }
  };

  const handleSelectAll = () => {
    setMultipleMuscles(filteredMuscles.map(m => m.id));
  };

  // Bij initialisatie van studiemodus: automatisch alle spieren van het gewricht selecteren
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
      
      {/* 1. GEWRICHT SELECTEREN IN DROPDOWN BOVEN DE AFBEELDING (PAST PRECIES OP HET SCHERM) */}
      <div className="w-full px-3 py-2 bg-white/95 backdrop-blur-md border-b border-clinical-200 shrink-0 relative z-50 shadow-xs pointer-events-auto box-border">
        <select
          value={selectedJointId}
          onChange={(e) => handleJointChange(e.target.value)}
          className="w-full min-w-0 max-w-full px-3 py-2 bg-clinical-50 hover:bg-clinical-100 border border-clinical-300 rounded-xl text-xs font-bold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition cursor-pointer truncate"
        >
          <option value="all">Alle gewrichten ({muscles.length} spieren)</option>
          <optgroup label="Per gewricht">
            {JOINT_CATEGORIES.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.title} ({cat.muscleIds.length} spieren)
              </option>
            ))}
          </optgroup>
        </select>
      </div>

      {/* 2. DE GROTE AFBEELDING MET WITTE ACHTERGROND (VOLLEDIG SCHERM, ZONDER VERGROOTGLAS) */}
      <div className="flex-1 w-full h-full bg-white relative flex items-center justify-center overflow-hidden pb-14">
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

      {/* 3. UITSCHUIFBARE LADE ONDERIN: KLAPT UIT TOT IETS ONDER DE DROPDOWN ZODAT DEZE VOLLEDIG BEREIKBAAR BLIJFT */}
      <div 
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-clinical-200 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-3xl transition-all duration-300 pointer-events-auto flex flex-col ${
          isDrawerOpen ? 'max-h-[calc(100dvh-7.5rem)]' : 'max-h-14'
        }`}
      >
        {/* SLEEPHENDEL & PIJL: Tik of sleep omhoog om het paneel te openen */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          onClick={() => setIsDrawerOpen(prev => !prev)}
          className="w-full h-14 px-4 flex items-center justify-between cursor-grab active:cursor-grabbing touch-none select-none shrink-0"
        >
          {/* Links: Geselecteerde spiernaam of aantal geselecteerde spieren */}
          <div className="flex items-center gap-2 min-w-0 flex-1 items-center">
  <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0 shadow-xs" />
  {selectedMuscle ? (
    <>
      <button
        type="button"
        onClick={() => {
          const idx = filteredMuscles.findIndex(m => m.id === selectedMuscle.id);
          const prev = filteredMuscles[(idx - 1 + filteredMuscles.length) % filteredMuscles.length];
          selectMuscle(prev.id, true);
        }}
        className="p-1 text-clinical-600 hover:text-clinical-900"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>
      <span className="text-xs font-black text-clinical-900 truncate">
        {selectedMuscle.name}
      </span>
      <button
        type="button"
        onClick={() => {
          const idx = filteredMuscles.findIndex(m => m.id === selectedMuscle.id);
          const next = filteredMuscles[(idx + 1) % filteredMuscles.length];
          selectMuscle(next.id, true);
        }}
        className="p-1 text-clinical-600 hover:text-clinical-900"
      >
        <ChevronRight className="w-4 h-4" />
      </button>
      <span className="ml-2 text-xs text-clinical-700">
        {selectedMuscle.originText} → {selectedMuscle.insertionText}
      </span>
    </>
  ) : (
    <span className="text-xs font-black text-clinical-900 truncate">Selecteer een spier</span>
  )}
</div>

          </div>

          {/* Midden: Sleeppil (-) */}
          <div className="w-12 h-1.5 bg-slate-300 rounded-full shrink-0" />

          {/* Rechts: Pijl die open/dicht aangeeft */}
          <div className="flex items-center justify-end flex-1 pl-2 text-blue-600 font-bold">
            {isDrawerOpen ? (
              <div className="flex items-center gap-1 text-[11px] text-slate-500">
                <ChevronDown className="w-4 h-4 text-slate-600" />
                <span>Sluit</span>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-[11px] text-blue-600">
                <span>Details</span>
                <ChevronUp className="w-4 h-4" />
              </div>
            )}
          </div>
        </div>

        {/* INHOUD VAN DE LADE: PAS ZICHTBAAR NA OMHOOG SLEPEN / AANTIKKEN */}
        {isDrawerOpen && (
          <div className="p-4 pt-1 space-y-4 overflow-y-auto custom-scrollbar pb-8 animate-in fade-in duration-200">
            
            {/* A. VIEW SWITCH BUTTON (VENTRAL / DORSAL) */}
            <div className="flex items-center justify-center pb-3 border-b border-clinical-100">
              <button
                type="button"
                onClick={() => setCurrentView(currentView === 'ventral' ? 'dorsal' : 'ventral')}
                className="flex h-8 px-3.5 rounded-xl bg-clinical-100 text-clinical-900 hover:bg-clinical-200 transition flex items-center justify-center gap-1.5"
              >
                <RefreshCcw className="w-4 h-4 text-blue-600" />
              </button>
            </div>

            {/* B. SPECIFIEKE SPIER SELECTEREN OP NAAM */}
            <div className="space-y-2">
              <div className="relative">
                <Search className="w-4 h-4 text-clinical-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Zoek spier op naam..."
                  className="w-full pl-9 pr-8 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs font-bold text-clinical-900 placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white"
                />
                {searchTerm && (
                  <button
                    type="button"
                    onClick={() => setSearchTerm('')}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-700"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              {/* Spierknoppen met checkboxes (volledig binnen kader, geen horizontaal scrollen) */}
              <div className="space-y-1.5">
                <div className="flex items-center justify-between pb-0.5">
                  <span className="text-[10px] font-bold text-clinical-500 uppercase tracking-wider">
                    Spieren ({filteredMuscles.length})
                  </span>
                  <div className="flex items-center gap-2.5">
                    {!areAllFilteredSelected && (
                      <button
                        type="button"
                        onClick={handleSelectAll}
                        className="text-[11px] font-bold text-blue-600 hover:text-blue-800"
                      >
                        Selecteer alle ({filteredMuscles.length})
                      </button>
                    )}
                    {hasMultipleSelected && (
                      <button
                        type="button"
                        onClick={handleClearSelection}
                        className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline transition"
                        title="Wis meervoudige selectie"
                      >
                        Wis selectie
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5">
                  {filteredMuscles.map((m) => {
                    const isChecked = selectedMuscleIds.includes(m.id);
                    return (
                      <button
                        key={m.id}
                        type="button"
                        onClick={() => toggleMuscleSelection(m.id)}
                        className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 border shadow-2xs ${
                          isChecked
                            ? 'bg-blue-50 border-blue-400 text-blue-950 font-black ring-1 ring-blue-300'
                            : 'bg-clinical-50 border-clinical-200 text-clinical-700 hover:bg-clinical-100'
                        }`}
                      >
                        {isChecked ? (
                          <CheckSquare className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        ) : (
                          <Square className="w-3.5 h-3.5 text-clinical-400 shrink-0" />
                        )}
                        <span className="text-left">{m.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* C. SPIERDETAILS: ORIGO, INSERTIE & FUNCTIE */}
            <div className="pt-2 border-t border-clinical-100">
              <MuscleDetail />
            </div>

          </div>
        )}
      </div>


  );
};
