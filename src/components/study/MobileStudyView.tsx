import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { MuscleDetail } from './MuscleDetail';
import { RotateCw, ChevronUp, ChevronDown, ChevronLeft, ChevronRight, Search, X } from 'lucide-react';
import { MUSCLE_MOVEMENTS } from '../../data/muscleMovements';

export const MobileStudyView: React.FC = () => {
  const { 
    muscles, 
    currentView, 
    setCurrentView, 
    selectedMuscle, 
    selectedMuscles, 
    symmetrySide, 
    selectMuscle,
    setMultipleMuscles
  } = useMuscles();

  const [selectedJointId, setSelectedJointId] = useState<string>('all');
  const [isDrawerOpen, setIsDrawerOpen] = useState<boolean>(false);
  const [drawerHeight, setDrawerHeight] = useState<number | null>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const [isSearching, setIsSearching] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const searchInputRef = useRef<HTMLInputElement>(null);
  const prevMuscleIdRef = useRef<string | undefined>(undefined);

  // Drag handling voor de uitschuifbare lade onderin
  const dragStartYRef = useRef<number | null>(null);
  const dragStartHeightRef = useRef<number>(0);
  const isDraggingRef = useRef<boolean>(false);
  const hasDraggedRef = useRef<boolean>(false);

  const handlePointerDown = (e: React.PointerEvent) => {
    dragStartYRef.current = e.clientY;
    const rect = drawerRef.current?.getBoundingClientRect();
    dragStartHeightRef.current = rect ? rect.height : (drawerHeight || Math.round(window.innerHeight * 0.5));
    isDraggingRef.current = true;
    hasDraggedRef.current = false;
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || dragStartYRef.current === null) return;
    const deltaY = e.clientY - dragStartYRef.current;
    if (Math.abs(deltaY) > 6) {
      hasDraggedRef.current = true;
    }
    // Omhoog draggen (deltaY < 0) vergroot het frame, omlaag draggen (deltaY > 0) verkleint het
    const maxHeight = Math.max(280, window.innerHeight - 110); // Blijft altijd onder de top dropdown!
    const minHeight = 110;
    const targetHeight = Math.max(minHeight, Math.min(maxHeight, dragStartHeightRef.current - deltaY));
    setDrawerHeight(targetHeight);
    if (targetHeight > 180) {
      setIsDrawerOpen(true);
    } else {
      setIsDrawerOpen(false);
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
    if (hasDraggedRef.current) {
      if (drawerHeight !== null && drawerHeight < 170) {
        setIsDrawerOpen(false);
        setDrawerHeight(null);
      } else {
        setIsDrawerOpen(true);
      }
    }
  };

  const handleClickHandle = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasDraggedRef.current) {
      hasDraggedRef.current = false;
      return;
    }
    if (isDrawerOpen) {
      setIsDrawerOpen(false);
      setDrawerHeight(null);
    } else {
      setIsDrawerOpen(true);
      // Standaard openen tot 50% van het beeldscherm!
      setDrawerHeight(Math.round(window.innerHeight * 0.50));
    }
  };

  // Gefilterde spieren op basis van gekozen gewricht
  const filteredMuscles = useMemo(() => {
    if (selectedJointId === 'all') return muscles;
    return muscles.filter(m => m.jointCategories && m.jointCategories.includes(selectedJointId));
  }, [muscles, selectedJointId]);

  // De spier die op dit moment actief is
  const activeMuscle = selectedMuscle || selectedMuscles[0] || filteredMuscles[0] || muscles[0];

  // Automatisch wisselen naar het juiste aanzicht van de geselecteerde spier
  // ALLEEN wanneer er daadwerkelijk een nieuwe spier geselecteerd wordt. Hierna is de gebruiker vrij zelf te wisselen.
  const isFirstMount = useRef(true);
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      prevMuscleIdRef.current = activeMuscle?.id;
      return;
    }
    const currentId = activeMuscle?.id;
    if (currentId && currentId !== prevMuscleIdRef.current) {
      prevMuscleIdRef.current = currentId;
      if (activeMuscle?.view) {
        setCurrentView(activeMuscle.view);
      }
    }
  }, [activeMuscle?.id, activeMuscle?.view, setCurrentView]);

  // Nauwkeurige spiertelling per gewricht
  const jointCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    JOINT_CATEGORIES.forEach(cat => {
      counts[cat.id] = muscles.filter(m => m.jointCategories && m.jointCategories.includes(cat.id)).length;
    });
    return counts;
  }, [muscles]);

  // Wissel gewrichtskeuze
  const handleJointChange = (jointId: string) => {
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
  };

  // Vorige / Volgende spier skippen (< en >)
  const handlePrevMuscle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = filteredMuscles.length > 0 ? filteredMuscles : muscles;
    if (list.length === 0) return;
    const currentId = activeMuscle?.id;
    const idx = list.findIndex(m => m.id === currentId);
    const prevIdx = (idx - 1 + list.length) % list.length;
    selectMuscle(list[prevIdx].id, true);
  };

  const handleNextMuscle = (e: React.MouseEvent) => {
    e.stopPropagation();
    const list = filteredMuscles.length > 0 ? filteredMuscles : muscles;
    if (list.length === 0) return;
    const currentId = activeMuscle?.id;
    const idx = list.findIndex(m => m.id === currentId);
    const nextIdx = (idx + 1) % list.length;
    selectMuscle(list[nextIdx].id, true);
  };

  // Gefilterde spieren voor zoekfunctie
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return muscles;
    const q = searchQuery.toLowerCase().trim();
    return muscles.filter(m => 
      m.name.toLowerCase().includes(q) ||
      m.originText?.toLowerCase().includes(q) ||
      m.insertionText?.toLowerCase().includes(q) ||
      m.functionText?.toLowerCase().includes(q)
    );
  }, [muscles, searchQuery]);

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
      
      {/* 1. MENUUTJE BOVENIN: 2 DROPDOWNS (GEWRICHT + DAARONDER SPIEREN DIE BIJ DAT GEWRICHT HOREN) */}
      <div className="w-full px-3 py-2 bg-white/95 backdrop-blur-md border-b border-clinical-200 shrink-0 relative z-50 shadow-xs pointer-events-auto box-border space-y-1.5">
        {!isSearching ? (
          <>
            {/* Bovenste dropdown: Gewricht kiezen met correct aantal spieren */}
            <div className="flex items-center gap-2 w-full">
              <select
                value={selectedJointId}
                onChange={(e) => handleJointChange(e.target.value)}
                className="flex-1 min-w-0 max-w-full px-3 py-1.5 bg-clinical-50 hover:bg-clinical-100 border border-clinical-300 rounded-xl text-xs font-bold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition cursor-pointer truncate"
              >
                <option value="all">Alle Gewrichten ({muscles.length})</option>
                {JOINT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ')} ({jointCounts[cat.id] || 0})
                  </option>
                ))}
              </select>

              <button
                type="button"
                onClick={() => {
                  setIsSearching(true);
                  setTimeout(() => searchInputRef.current?.focus(), 50);
                }}
                className="shrink-0 p-1.5 rounded-xl bg-clinical-50 hover:bg-clinical-100 border border-clinical-300 text-clinical-700 hover:text-blue-600 transition shadow-xs flex items-center justify-center active:scale-95"
                title="Zoek spier"
                aria-label="Zoek spier"
              >
                <Search className="w-4 h-4 text-clinical-700" />
              </button>
            </div>

            {/* Onderste dropdown: Spieren behorend bij het gekozen gewricht */}
            <div className="flex items-center gap-2 w-full">
              <select
                value={activeMuscle?.id || ''}
                onChange={(e) => selectMuscle(e.target.value, true)}
                className="w-full min-w-0 max-w-full px-3 py-1.5 bg-blue-50/70 hover:bg-blue-100/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-950 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs transition cursor-pointer truncate"
              >
                {filteredMuscles.map((m) => (
                  <option key={m.id} value={m.id}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>
          </>
        ) : (
          <div className="relative flex items-center gap-2 w-full">
            <div className="relative flex-1 min-w-0">
              <Search className="w-3.5 h-3.5 text-clinical-400 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                ref={searchInputRef}
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek spier (bijv. rectus, biceps)..."
                className="w-full pl-8 pr-7 py-1.5 bg-clinical-50 border border-clinical-300 rounded-xl text-xs font-semibold text-clinical-900 placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-blue-500 shadow-xs"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-700 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="shrink-0 px-2.5 py-1.5 rounded-xl text-xs font-bold text-clinical-600 hover:text-clinical-900 hover:bg-clinical-100 transition active:scale-95"
            >
              Sluit
            </button>
          </div>
        )}

        {/* Backdrop voor zoekresultaten om te sluiten bij tikken buiten het menu */}
        {isSearching && (
          <div 
            className="fixed inset-0 z-40 bg-black/15 backdrop-blur-[1px]" 
            onClick={() => {
              setIsSearching(false);
              setSearchQuery('');
            }}
          />
        )}

        {/* Zoekresultaten dropdown lijst */}
        {isSearching && (
          <div className="absolute top-full left-0 right-0 mt-1 mx-3 bg-white/98 backdrop-blur-md border border-clinical-200 rounded-2xl shadow-xl max-h-64 overflow-y-auto z-50 p-1 divide-y divide-clinical-100 custom-scrollbar animate-in fade-in slide-in-from-top-1 duration-150">
            {searchResults.length === 0 ? (
              <div className="py-3 px-3 text-center text-xs text-clinical-400 italic">
                Geen spieren gevonden voor "{searchQuery}"
              </div>
            ) : (
              searchResults.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => {
                    const targetJoint = selectedJointId !== 'all' && m.jointCategories?.includes(selectedJointId)
                      ? selectedJointId
                      : (m.jointCategories?.[0] || 'all');
                    setSelectedJointId(targetJoint);
                    if (targetJoint === 'all') {
                      setMultipleMuscles(muscles.map(x => x.id));
                    } else {
                      const jMuscles = muscles.filter(x => x.jointCategories?.includes(targetJoint));
                      setMultipleMuscles(jMuscles.map(x => x.id));
                    }
                    selectMuscle(m.id, true);
                    setIsSearching(false);
                    setSearchQuery('');
                  }}
                  className="w-full text-left px-3 py-2 rounded-xl hover:bg-blue-50 flex items-center justify-between text-xs transition-colors group cursor-pointer"
                >
                  <div className="min-w-0 pr-2">
                    <div className="font-bold text-clinical-900 group-hover:text-blue-600 truncate">
                      {m.name}
                    </div>
                    {m.originText && (
                      <div className="text-[10px] text-clinical-500 truncate mt-0.5">
                        O: {m.originText}
                      </div>
                    )}
                  </div>
                  <span className={`shrink-0 text-[10px] font-semibold px-1.5 py-0.5 rounded-md ${
                    m.view === 'ventral' ? 'bg-blue-100 text-blue-700' : 'bg-indigo-100 text-indigo-700'
                  }`}>
                    {m.view === 'ventral' ? 'Ventraal' : 'Dorsaal'}
                  </span>
                </button>
              ))
            )}
          </div>
        )}
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
          autoCenterMuscle={true}
        />
      </div>

      {/* 3. UITSCHUIFBARE LADE ONDERIN: DYNAMISCH EN MET VEILIGE MAX HOOGTE */}
      <div 
        ref={drawerRef}
        style={
          isDrawerOpen && drawerHeight
            ? { height: `${drawerHeight}px`, maxHeight: 'calc(100dvh - 7rem)' }
            : undefined
        }
        className={`fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-clinical-200 shadow-[0_-8px_30px_rgba(0,0,0,0.15)] rounded-t-3xl ${
          isDraggingRef.current ? '' : 'transition-all duration-200'
        } pointer-events-auto flex flex-col ${
          isDrawerOpen 
            ? (!drawerHeight ? 'max-h-[50vh]' : '')
            : 'h-auto max-h-[220px]'
        }`}
      >
        {/* SLEEPHENDEL: DEDICATED HIT-AREA VOOR HET '-' STREEPJE */}
        <div 
          onPointerDown={handlePointerDown}
          onPointerMove={handlePointerMove}
          onPointerUp={handlePointerUp}
          onPointerCancel={handlePointerUp}
          onClick={handleClickHandle}
          className="w-full flex items-center justify-center cursor-grab active:cursor-grabbing py-2.5 touch-none select-none -mt-1 mb-0.5 active:opacity-70 group"
          title={isDrawerOpen ? "Tik of sleep omlaag voor minimale weergave" : "Tik op '-' of sleep omhoog om details te openen"}
          aria-label={isDrawerOpen ? "Sluit details" : "Open details"}
          role="button"
          tabIndex={0}
        >
          <div className="w-12 h-1.5 bg-slate-300 group-hover:bg-slate-500 rounded-full transition-colors active:scale-95" />
        </div>

        {/* HEADER RIJ MET SPIERNAAM EN < > KNOPPEN (GEEN DRAWER TOGGLE OP DEZE RIJ!) */}
        <div className="w-full px-3.5 pb-2.5 shrink-0 border-b border-clinical-100 flex flex-col justify-center">
          <div className="flex items-center justify-between gap-1 w-full">
            <button
              type="button"
              onClick={handlePrevMuscle}
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
              onClick={handleNextMuscle}
              className="p-1.5 rounded-xl hover:bg-slate-100 active:bg-slate-200 text-clinical-700 transition pointer-events-auto"
              title="Volgende spier"
              aria-label="Volgende spier"
            >
              <ChevronRight className="w-5 h-5 text-clinical-700" />
            </button>

            <button
              type="button"
              onClick={handleClickHandle}
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
