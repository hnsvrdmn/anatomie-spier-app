import React, { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import initialMusclesData from '../data/muscles.json';
import { 
  Muscle, 
  AnatomicalView, 
  SymmetrySide, 
  AppMode, 
  MuscleVisualData,
  Point2D
} from '../types/anatomy';
import { 
  downloadMusclesJson, 
  saveMusclesToLocalStorage, 
  saveMusclesToDisk,
  loadMusclesFromLocalStorage, 
  resetLocalStorage,
  isForbiddenMuscle
} from '../utils/export';
import { mirrorPoints } from '../utils/coordinates';

export interface ToastMessage {
  id: number;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
}

interface MuscleContextType {
  muscles: Muscle[];
  selectedMuscleId: string;
  selectedMuscleIds: string[];
  selectedMuscle: Muscle | undefined;
  selectedMuscles: Muscle[];
  currentView: AnatomicalView;
  symmetrySide: SymmetrySide;
  appMode: AppMode;
  quizPracticeMode: 'joint' | 'free';
  setQuizPracticeMode: (mode: 'joint' | 'free') => void;
  quizOpenOptionsTrigger: number;
  triggerQuizOpenOptions: () => void;
  jointPracticeType: 'attachments' | 'movements';
  setJointPracticeType: (type: 'attachments' | 'movements') => void;
  requireAllVertebrae: boolean;
  setRequireAllVertebrae: (val: boolean) => void;
  toast: ToastMessage | null;
  selectMuscle: (id: string, autoSwitchView?: boolean) => void;
  toggleMuscleSelection: (id: string) => void;
  setMultipleMuscles: (ids: string[]) => void;
  selectAllInJoint: (jointMuscleIds: string[]) => void;
  clearSelectedMuscles: () => void;
  nextMuscle: () => void;
  prevMuscle: () => void;
  setCurrentView: (view: AnatomicalView) => void;
  setSymmetrySide: (side: SymmetrySide) => void;
  setAppMode: (mode: AppMode) => void;
  updateMuscleVisuals: (
    muscleId: string, 
    side: 'left' | 'right' | 'midline', 
    newVisuals: MuscleVisualData
  ) => void;
  updateMuscleDetails: (muscleId: string, updates: Partial<Muscle>) => void;
  mirrorMuscleSide: (muscleId: string, fromSide: 'left' | 'right') => void;
  addMuscle: (muscle: Omit<Muscle, 'id'> & { id?: string }) => Muscle;
  deleteMuscle: (muscleId: string) => void;
  allKnownLandmarks: { name: string; point: Point2D; side: 'left' | 'right' | 'midline' }[];
  exportDataset: () => void;
  importDataset: (muscles: Muscle[]) => void;
  saveToDisk: () => Promise<boolean>;
  resetDataset: () => void;
  showToast: (message: string, type?: 'info' | 'success' | 'warning' | 'error') => void;
  hideToast: () => void;
}

const FOCUSED_MUSCLE_KEY = 'pmt_anatomie_focused_muscle_id';

const MuscleContext = createContext<MuscleContextType | undefined>(undefined);

export const MuscleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  
  const [muscles, setMuscles] = useState<Muscle[]>(() => {
    const saved = loadMusclesFromLocalStorage();
    const source = saved || (initialMusclesData as unknown as Muscle[]);
    return source.filter((m) => !isForbiddenMuscle(m));
  });

  const [focusedMuscleId, setFocusedMuscleIdState] = useState<string>(() => {
    try {
      const savedFocus = localStorage.getItem(FOCUSED_MUSCLE_KEY);
      if (savedFocus) {
        const saved = loadMusclesFromLocalStorage();
        const source = (saved || (initialMusclesData as unknown as Muscle[])).filter((m) => !isForbiddenMuscle(m));
        if (source.some((m) => m.id === savedFocus)) {
          return savedFocus;
        }
      }
    } catch {}
    const saved = loadMusclesFromLocalStorage();
    const source = (saved || (initialMusclesData as unknown as Muscle[])).filter((m) => !isForbiddenMuscle(m));
    const ventral = source.find((m) => m.view === 'ventral');
    return ventral?.id || source[0]?.id || '';
  });

  const setFocusedMuscleId = useCallback((id: string) => {
    setFocusedMuscleIdState(id);
    try {
      if (id) {
        localStorage.setItem(FOCUSED_MUSCLE_KEY, id);
      }
    } catch {}
  }, []);

  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>(() => {
    try {
      const savedFocus = localStorage.getItem(FOCUSED_MUSCLE_KEY);
      if (savedFocus) {
        const saved = loadMusclesFromLocalStorage();
        const source = (saved || (initialMusclesData as unknown as Muscle[])).filter((m) => !isForbiddenMuscle(m));
        if (source.some((m) => m.id === savedFocus)) {
          return [savedFocus];
        }
      }
    } catch {}
    const saved = loadMusclesFromLocalStorage();
    const source = (saved || (initialMusclesData as unknown as Muscle[])).filter((m) => !isForbiddenMuscle(m));
    return source.map((m) => m.id);
  });

  const selectedMuscleId = (selectedMuscleIds.includes(focusedMuscleId) ? focusedMuscleId : selectedMuscleIds[selectedMuscleIds.length - 1]) || focusedMuscleId || '';

  const [currentView, setCurrentView] = useState<AnatomicalView>(() => {
    try {
      const savedFocus = localStorage.getItem(FOCUSED_MUSCLE_KEY);
      if (savedFocus) {
        const saved = loadMusclesFromLocalStorage();
        const source = (saved || (initialMusclesData as unknown as Muscle[])).filter((m) => !isForbiddenMuscle(m));
        const found = source.find((m) => m.id === savedFocus);
        if (found) return found.view;
      }
    } catch {}
    return 'ventral';
  });
  const [symmetrySide, setSymmetrySide] = useState<SymmetrySide>('both');
  const [appMode, setAppModeState] = useState<AppMode>(() => {
    try {
      const h = window.location.hash.replace('#', '') as AppMode;
      if (h && ['study', 'movements', 'bones', 'quiz', 'flashcards', 'editor'].includes(h)) return h;
      const p = new URLSearchParams(window.location.search);
      const m = p.get('mode') as AppMode;
      if (m && ['study', 'movements', 'bones', 'quiz', 'flashcards', 'editor'].includes(m)) return m;
    } catch {
      // fallback
    }
    return 'study';
  });

  const setAppMode = useCallback((mode: AppMode) => {
    setAppModeState(mode);
    try {
      window.location.hash = mode;
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const handleHash = () => {
      try {
        const h = window.location.hash.replace('#', '') as AppMode;
        if (h && ['study', 'movements', 'bones', 'quiz', 'flashcards', 'editor'].includes(h)) {
          setAppModeState(h);
        }
      } catch {
        // fallback
      }
    };
    window.addEventListener('hashchange', handleHash);
    return () => window.removeEventListener('hashchange', handleHash);
  }, []);
  const [quizPracticeMode, setQuizPracticeMode] = useState<'joint' | 'free'>('joint');
  const [quizOpenOptionsTrigger, setQuizOpenOptionsTrigger] = useState(0);
  const triggerQuizOpenOptions = useCallback(() => {
    setQuizOpenOptionsTrigger((c) => c + 1);
  }, []);
  const [jointPracticeType, setJointPracticeType] = useState<'attachments' | 'movements'>('attachments');
  const [requireAllVertebrae, setRequireAllVertebraeState] = useState<boolean>(() => {
    try {
      return localStorage.getItem('pmt_require_all_vertebrae') === 'true';
    } catch {
      return false;
    }
  });
  const setRequireAllVertebrae = useCallback((val: boolean) => {
    setRequireAllVertebraeState(val);
    try {
      localStorage.setItem('pmt_require_all_vertebrae', String(val));
    } catch {}
  }, []);
  const [toast, setToast] = useState<ToastMessage | null>(null);

  const selectedMuscle = useMemo(() => {
    return muscles.find(m => m.id === selectedMuscleId);
  }, [muscles, selectedMuscleId]);

  const selectedMuscles = useMemo(() => {
    return selectedMuscleIds
      .map(id => muscles.find(m => m.id === id))
      .filter((m): m is Muscle => m !== undefined);
  }, [muscles, selectedMuscleIds]);

  // Toon een educatieve notificatie
  const showToast = useCallback((message: string, type: 'info' | 'success' | 'warning' | 'error' = 'info') => {
    const newToast: ToastMessage = {
      id: Date.now(),
      message,
      type
    };
    setToast(newToast);
  }, []);

  const hideToast = useCallback(() => {
    setToast(null);
  }, []);

  // Automatisch wegfaden van toast na 5 seconden
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 5000);
    return () => clearTimeout(timer);
  }, [toast]);

  // Selecteer een enkele spier of focus binnen een actieve meervoudige selectie
  const selectMuscle = useCallback((id: string, autoSwitchView = true) => {
    setFocusedMuscleId(id);
    setSelectedMuscleIds(prev => {
      if (prev.length > 1 && prev.includes(id)) {
        // Meerdere spieren actief: behoud de selectie, focus enkel op deze spier!
        return [...prev];
      }
      return [id];
    });
    const m = muscles.find(item => item.id === id);
    if (m && autoSwitchView) {
      setCurrentView(m.view);
    }
  }, [muscles]);

  // Schakel een spier in of uit bij meervoudige selectie
  const toggleMuscleSelection = useCallback((id: string) => {
    setSelectedMuscleIds(prev => {
      if (prev.includes(id)) {
        if (prev.length <= 1) return prev; // behoud minimaal 1 spier
        const filtered = prev.filter(mId => mId !== id);
        const nextFocus = filtered[0] || '';
        setFocusedMuscleId(nextFocus);
        const m = muscles.find(item => item.id === nextFocus);
        if (m) setCurrentView(m.view);
        return filtered;
      } else {
        const next = [...prev, id];
        setFocusedMuscleId(id);
        const m = muscles.find(item => item.id === id);
        if (m) setCurrentView(m.view);
        return next;
      }
    });
  }, [muscles]);

  // Meerdere spieren direct instellen
  const setMultipleMuscles = useCallback((ids: string[]) => {
    if (ids.length === 0) return;
    setSelectedMuscleIds(ids);
    // Behoud het huidige aanzicht als er een spier in de set zit die op het huidige aanzicht ligt,
    // en focus op die spier. Alleen als GEEN enkele spier op het huidige aanzicht ligt, switchen we.
    const matchingMuscle = ids.map(id => muscles.find(m => m.id === id)).find(m => m && m.view === currentView);
    const focusId = matchingMuscle ? matchingMuscle.id : ids[0];
    setFocusedMuscleId(focusId);
    if (!matchingMuscle) {
      const firstMuscle = muscles.find(item => item.id === ids[0]);
      if (firstMuscle) setCurrentView(firstMuscle.view);
    }
  }, [muscles, currentView]);

  // Alle spieren in het huidige gewricht selecteren
  const selectAllInJoint = useCallback((jointMuscleIds: string[]) => {
    if (jointMuscleIds.length === 0) return;
    setSelectedMuscleIds(jointMuscleIds);
    const matchingMuscle = jointMuscleIds.map(id => muscles.find(m => m.id === id)).find(m => m && m.view === currentView);
    const focusId = matchingMuscle ? matchingMuscle.id : jointMuscleIds[0];
    setFocusedMuscleId(focusId);
    if (!matchingMuscle) {
      const firstMuscle = muscles.find(item => item.id === jointMuscleIds[0]);
      if (firstMuscle) setCurrentView(firstMuscle.view);
    }
  }, [muscles, currentView]);

  // Selectie wissen (terugzetten naar de huidige gefocuste spier of eerste ventrale spier)
  const clearSelectedMuscles = useCallback(() => {
    if (selectedMuscleId) {
      setSelectedMuscleIds([selectedMuscleId]);
      setFocusedMuscleId(selectedMuscleId);
    } else if (muscles.length > 0) {
      const ventral = muscles.find(m => m.view === 'ventral') || muscles[0];
      setSelectedMuscleIds([ventral.id]);
      setFocusedMuscleId(ventral.id);
    }
  }, [muscles, selectedMuscleId, setFocusedMuscleId]);

  // Navigatie: volgende spier
  const nextMuscle = useCallback(() => {
    const idx = muscles.findIndex(m => m.id === selectedMuscleId);
    if (idx === -1) return;
    const nextIdx = (idx + 1) % muscles.length;
    const nextM = muscles[nextIdx];
    setSelectedMuscleIds([nextM.id]);
    setFocusedMuscleId(nextM.id);
    if (appMode !== 'quiz') {
      setCurrentView(nextM.view);
    }
  }, [muscles, selectedMuscleId, appMode, setFocusedMuscleId]);

  // Navigatie: vorige spier
  const prevMuscle = useCallback(() => {
    const idx = muscles.findIndex(m => m.id === selectedMuscleId);
    if (idx === -1) return;
    const prevIdx = (idx - 1 + muscles.length) % muscles.length;
    const prevM = muscles[prevIdx];
    setSelectedMuscleIds([prevM.id]);
    setFocusedMuscleId(prevM.id);
    if (appMode !== 'quiz') {
      setCurrentView(prevM.view);
    }
  }, [muscles, selectedMuscleId, appMode, setFocusedMuscleId]);

  // Helper om aanhechtingslijnen (zones) te spiegelen naar de tegenoverliggende lichaamszijde
  const mirrorAttachmentLines = useCallback((lines?: any[]): any[] => {
    if (!lines || lines.length === 0) return [];
    return lines.map((l) => ({
      ...l,
      id: l.id.includes('-right')
        ? l.id.replace('-right', '-left')
        : l.id.includes('-left')
        ? l.id.replace('-left', '-right')
        : `${l.id}-mirrored`,
      points: mirrorPoints(l.points || []),
    }));
  }, []);

  // Debounce ref voor saveMusclesToDisk zodat frequente updates (zoals slepen) niet continu schijftoegang forceren
  const saveDiskTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const debouncedSaveToDisk = useCallback((updatedMuscles: Muscle[]) => {
    if (saveDiskTimerRef.current) {
      clearTimeout(saveDiskTimerRef.current);
    }
    saveDiskTimerRef.current = setTimeout(() => {
      saveMusclesToDisk(updatedMuscles);
    }, 400);
  }, []);

  // Werk visualisaties (origo's, inserties, pad) bij voor een spier
  // Indien een punt wordt aangepast, worden ALLEEN punten met LETTERLIJK DEZELFDE NAAM gesynchroniseerd!
  const updateMuscleVisuals = useCallback((
    muscleId: string, 
    side: 'left' | 'right' | 'midline', 
    newVisuals: MuscleVisualData
  ) => {
    setFocusedMuscleId(muscleId);
    setMuscles(prev => {
      const currentMuscle = prev.find(m => m.id === muscleId);
      if (!currentMuscle) return prev;

      const updated = prev.map(m => {
        if (m.id === muscleId) {
          const otherSide = side === 'left' ? 'right' : side === 'right' ? 'left' : null;
          const isBilateral = m.symmetryType === 'bilateral';

          return {
            ...m,
            visuals: {
              ...m.visuals,
              [side]: newVisuals,
              ...(isBilateral && otherSide ? {
                [otherSide]: {
                  origins: mirrorPoints(newVisuals.origins),
                  insertions: mirrorPoints(newVisuals.insertions),
                  musclePath: mirrorPoints(newVisuals.musclePath || []),
                  attachmentLines: mirrorAttachmentLines(newVisuals.attachmentLines),
                }
              } : {})
            }
          };
        }

        return m;
      });

      saveMusclesToLocalStorage(updated);
      debouncedSaveToDisk(updated);
      return updated;
    });
  }, [setFocusedMuscleId, mirrorAttachmentLines, debouncedSaveToDisk]);

  // Update overige spiergegevens (zoals aanzicht, functies, extra info)
  const updateMuscleDetails = useCallback((muscleId: string, updates: Partial<Muscle>) => {
    setFocusedMuscleId(muscleId);
    setMuscles(prev => {
      const updated = prev.map(m => m.id === muscleId ? { ...m, ...updates } : m);
      saveMusclesToLocalStorage(updated);
      debouncedSaveToDisk(updated);
      return updated;
    });
  }, [setFocusedMuscleId, debouncedSaveToDisk]);

  // Spiegel een zijde naar de overkant (x_nieuw = 1.0 - x_oud)
  const mirrorMuscleSide = useCallback((muscleId: string, fromSide: 'left' | 'right') => {
    setFocusedMuscleId(muscleId);
    const toSide = fromSide === 'left' ? 'right' : 'left';
    setMuscles(prev => {
      const updated = prev.map(m => {
        if (m.id !== muscleId) return m;
        const sourceData = m.visuals[fromSide];
        if (!sourceData) return m;

        const mirroredData: MuscleVisualData = {
          origins: mirrorPoints(sourceData.origins),
          insertions: mirrorPoints(sourceData.insertions),
          musclePath: mirrorPoints(sourceData.musclePath),
          attachmentLines: sourceData.attachmentLines?.map((al) => ({
            ...al,
            points: mirrorPoints(al.points),
          })),
        };

        return {
          ...m,
          visuals: {
            ...m.visuals,
            [toSide]: mirroredData
          }
        };
      });
      saveMusclesToLocalStorage(updated);
      debouncedSaveToDisk(updated);
      return updated;
    });
    showToast(`Punten succesvol gespiegeld van ${fromSide === 'left' ? 'links' : 'rechts'} naar ${toSide === 'left' ? 'links' : 'rechts'}!`, 'success');
  }, [showToast, setFocusedMuscleId, debouncedSaveToDisk]);
  // Alle unieke bekende aanhechtingspunten over alle spieren
  const allKnownLandmarks = useMemo(() => {
    const map = new Map<string, { name: string; point: Point2D; side: 'left' | 'right' | 'midline' }>();
    muscles.forEach((m) => {
      (['left', 'right', 'midline'] as const).forEach((side) => {
        const vis = m.visuals[side];
        if (!vis) return;
        vis.origins?.forEach((pt) => {
          const name = pt.name?.trim() || m.originText?.trim();
          if (name && !map.has(`${name}-${side}`)) {
            map.set(`${name}-${side}`, { name, point: pt, side });
          }
        });
        vis.insertions?.forEach((pt) => {
          const name = pt.name?.trim() || m.insertionText?.trim();
          if (name && !map.has(`${name}-${side}`)) {
            map.set(`${name}-${side}`, { name, point: pt, side });
          }
        });
      });
    });
    return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [muscles]);

  // Voeg een nieuwe spier toe
  const addMuscle = useCallback((newMuscleData: Omit<Muscle, 'id'> & { id?: string }) => {
    const id = newMuscleData.id || `muscle-${Date.now()}`;
    const newMuscle: Muscle = {
      ...newMuscleData,
      id,
      visuals: newMuscleData.visuals || {
        left: { origins: [], insertions: [], musclePath: [] },
        right: { origins: [], insertions: [], musclePath: [] },
      }
    };
    setMuscles((prev) => {
      const updated = [...prev, newMuscle];
      saveMusclesToLocalStorage(updated);
      saveMusclesToDisk(updated);
      return updated;
    });
    setSelectedMuscleIds([id]);
    showToast(`Spier "${newMuscle.name}" succesvol aangemaakt!`, 'success');
    return newMuscle;
  }, [showToast]);

  // Verwijder een spier
  const deleteMuscle = useCallback((muscleId: string) => {
    setMuscles((prev) => {
      const target = prev.find((m) => m.id === muscleId);
      const name = target ? target.name : 'Spier';
      const updated = prev.filter((m) => m.id !== muscleId);
      saveMusclesToLocalStorage(updated);
      saveMusclesToDisk(updated);
      showToast(`${name} succesvol verwijderd`, 'info');
      return updated;
    });
    setSelectedMuscleIds((prev) => {
      const remaining = prev.filter((id) => id !== muscleId);
      if (remaining.length > 0) return remaining;
      const other = muscles.find((m) => m.id !== muscleId);
      return other ? [other.id] : [];
    });
  }, [muscles, showToast]);

  // Exporteer actuele dataset als muscles.json
  const exportDataset = useCallback(() => {
    downloadMusclesJson(muscles);
    showToast('Dataset succesvol geëxporteerd als muscles.json', 'success');
  }, [muscles, showToast]);

  // Sla huidige spieren permanent op naar src/data/muscles.json
  const saveToDisk = useCallback(async () => {
    const success = await saveMusclesToDisk(muscles);
    if (success) {
      showToast('Permanent opgeslagen in src/data/muscles.json op schijf!', 'success');
      return true;
    } else {
      showToast('Opslaan naar schijf mislukt. Draait de lokale ontwikkelserver?', 'error');
      return false;
    }
  }, [muscles, showToast]);

  // Importeer geëxporteerde dataset
  const importDataset = useCallback(async (newMuscles: Muscle[]) => {
    if (!Array.isArray(newMuscles) || newMuscles.length === 0) {
      showToast('Ongeldig JSON-bestand: geen spieren gevonden', 'error');
      return;
    }
    const cleanMuscles = newMuscles.filter(m => !isForbiddenMuscle(m));
    setMuscles(cleanMuscles);
    saveMusclesToLocalStorage(cleanMuscles);
    const saved = await saveMusclesToDisk(cleanMuscles);
    if (saved) {
      showToast(`${cleanMuscles.length} spieren geïmporteerd én permanent opgeslagen op schijf!`, 'success');
    } else {
      showToast(`${cleanMuscles.length} spieren succesvol geïmporteerd in browser!`, 'success');
    }
  }, [showToast]);

  // Reset naar initiële dataset
  const resetDataset = useCallback(() => {
    resetLocalStorage();
    setMuscles(initialMusclesData as unknown as Muscle[]);
    saveMusclesToDisk(initialMusclesData as unknown as Muscle[]);
    showToast('Dataset hersteld naar standaardwaarden', 'info');
  }, [showToast]);

  return (
    <MuscleContext.Provider
      value={{
        muscles,
        selectedMuscleId,
        selectedMuscleIds,
        selectedMuscle,
        selectedMuscles,
        currentView,
        symmetrySide,
        appMode,
        quizPracticeMode,
        setQuizPracticeMode,
        quizOpenOptionsTrigger,
        triggerQuizOpenOptions,
        jointPracticeType,
        setJointPracticeType,
        requireAllVertebrae,
        setRequireAllVertebrae,
        toast,
        selectMuscle,
        toggleMuscleSelection,
        setMultipleMuscles,
        selectAllInJoint,
        clearSelectedMuscles,
        nextMuscle,
        prevMuscle,
        setCurrentView,
        setSymmetrySide,
        setAppMode,
        updateMuscleVisuals,
        updateMuscleDetails,
        mirrorMuscleSide,
        addMuscle,
        deleteMuscle,
        allKnownLandmarks,
        exportDataset,
        importDataset,
        saveToDisk,
        resetDataset,
        showToast,
        hideToast
      }}
    >
      {children}
    </MuscleContext.Provider>
  );
};

export const useMuscles = (): MuscleContextType => {
  const context = useContext(MuscleContext);
  if (!context) {
    throw new Error('useMuscles moet binnen een MuscleProvider worden gebruikt');
  }
  return context;
};
