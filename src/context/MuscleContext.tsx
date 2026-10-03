import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
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
  resetLocalStorage 
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

const MuscleContext = createContext<MuscleContextType | undefined>(undefined);

export const MuscleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [muscles, setMuscles] = useState<Muscle[]>(() => {
    const saved = loadMusclesFromLocalStorage();
    return saved || (initialMusclesData as unknown as Muscle[]);
  });

  const [selectedMuscleIds, setSelectedMuscleIds] = useState<string[]>(() => {
    const firstId = initialMusclesData[0]?.id;
    return firstId ? [firstId] : [];
  });

  const [focusedMuscleId, setFocusedMuscleId] = useState<string>(() => {
    return initialMusclesData[0]?.id || '';
  });

  const selectedMuscleId = (selectedMuscleIds.includes(focusedMuscleId) ? focusedMuscleId : selectedMuscleIds[selectedMuscleIds.length - 1]) || '';

  const [currentView, setCurrentView] = useState<AnatomicalView>('ventral');
  const [symmetrySide, setSymmetrySide] = useState<SymmetrySide>('both');
  const [appMode, setAppMode] = useState<AppMode>('study');
  const [quizPracticeMode, setQuizPracticeMode] = useState<'joint' | 'free'>('joint');
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

  // Selectie wissen (terugzetten naar de eerste spier)
  const clearSelectedMuscles = useCallback(() => {
    if (muscles.length > 0) {
      setSelectedMuscleIds([muscles[0].id]);
    }
  }, [muscles]);

  // Navigatie: volgende spier
  const nextMuscle = useCallback(() => {
    const idx = muscles.findIndex(m => m.id === selectedMuscleId);
    if (idx === -1) return;
    const nextIdx = (idx + 1) % muscles.length;
    const nextM = muscles[nextIdx];
    setSelectedMuscleIds([nextM.id]);
    if (appMode !== 'quiz') {
      setCurrentView(nextM.view);
    }
  }, [muscles, selectedMuscleId, appMode]);

  // Navigatie: vorige spier
  const prevMuscle = useCallback(() => {
    const idx = muscles.findIndex(m => m.id === selectedMuscleId);
    if (idx === -1) return;
    const prevIdx = (idx - 1 + muscles.length) % muscles.length;
    const prevM = muscles[prevIdx];
    setSelectedMuscleIds([prevM.id]);
    if (appMode !== 'quiz') {
      setCurrentView(prevM.view);
    }
  }, [muscles, selectedMuscleId, appMode]);

  // Helper om te controleren of twee landmarknamen letterlijk hetzelfde anatomische punt betreffen
  const isSameLandmark = (nameA?: string, nameB?: string): boolean => {
    if (!nameA || !nameB) return false;
    const a = nameA.trim().toLowerCase().replace(/^[-–—•\s]+/, '');
    const b = nameB.trim().toLowerCase().replace(/^[-–—•\s]+/, '');
    if (!a || !b) return false;
    // Sluit generieke placeholders uit (zoals "Origo 1", "Insertie 2", "Punt 1")
    if (/^(origo|insertie|curve|punt|curve-punt)\s*\d*$/i.test(a) || /^(origo|insertie|curve|punt|curve-punt)\s*\d*$/i.test(b)) {
      return false;
    }
    return a === b;
  };

  // Werk visualisaties (origo's, inserties, pad) bij voor een spier
  // Indien een punt wordt aangepast, worden ALLEEN punten met LETTERLIJK DEZELFDE NAAM gesynchroniseerd!
  const updateMuscleVisuals = useCallback((
    muscleId: string, 
    side: 'left' | 'right' | 'midline', 
    newVisuals: MuscleVisualData
  ) => {
    setMuscles(prev => {
      const currentMuscle = prev.find(m => m.id === muscleId);
      if (!currentMuscle) return prev;

      const oldVisuals = currentMuscle.visuals[side];
      let movedOldPoint: Point2D | null = null;
      let movedNewPoint: Point2D | null = null;
      let renamedOldName: string | null = null;
      let renamedNewName: string | null = null;

      // Detecteer welk punt gewijzigd/verplaatst of hernoemd is
      if (oldVisuals) {
        if (oldVisuals.origins.length === newVisuals.origins.length) {
          for (let i = 0; i < newVisuals.origins.length; i++) {
            const op = oldVisuals.origins[i];
            const np = newVisuals.origins[i];
            if (op.x !== np.x || op.y !== np.y) {
              movedOldPoint = op;
              movedNewPoint = np;
              break;
            }
            if (op.name && np.name && op.name !== np.name && !isSameLandmark(op.name, np.name)) {
              renamedOldName = op.name;
              renamedNewName = np.name;
            }
          }
        }
        if (!movedOldPoint && oldVisuals.insertions.length === newVisuals.insertions.length) {
          for (let i = 0; i < newVisuals.insertions.length; i++) {
            const op = oldVisuals.insertions[i];
            const np = newVisuals.insertions[i];
            if (op.x !== np.x || op.y !== np.y) {
              movedOldPoint = op;
              movedNewPoint = np;
              break;
            }
            if (op.name && np.name && op.name !== np.name && !isSameLandmark(op.name, np.name)) {
              renamedOldName = op.name;
              renamedNewName = np.name;
            }
          }
        }
      }

      let synchronizedCount = 0;

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
                  musclePath: mirrorPoints(newVisuals.musclePath || [])
                }
              } : {})
            }
          };
        }

        // Alleen synchroniseren als het een ANDERE spier is op HETZELFDE aanzicht (ventraal vs dorsaal)
        // én als de aanhechtingspunten LETTERLIJK dezelfde naam hebben!
        if (m.id !== muscleId && m.view === currentMuscle.view) {
          const targetVisuals = m.visuals[side];
          if (!targetVisuals) return m;

          let changed = false;

          // 1. Coördinaten synchroniseren als naam letterlijk overeenkomt
          let updatedOrigins = targetVisuals.origins;
          let updatedInsertions = targetVisuals.insertions;

          if (movedOldPoint && movedNewPoint && movedOldPoint.name) {
            updatedOrigins = targetVisuals.origins.map(pt => {
              if (isSameLandmark(pt.name, movedOldPoint!.name)) {
                changed = true;
                return { ...pt, x: movedNewPoint!.x, y: movedNewPoint!.y };
              }
              return pt;
            });

            updatedInsertions = targetVisuals.insertions.map(pt => {
              if (isSameLandmark(pt.name, movedOldPoint!.name)) {
                changed = true;
                return { ...pt, x: movedNewPoint!.x, y: movedNewPoint!.y };
              }
              return pt;
            });
          }

          // 2. Naam synchroniseren als naam hernoemd is en letterlijk hetzelfde was
          if (renamedOldName && renamedNewName) {
            updatedOrigins = updatedOrigins.map(pt => {
              if (isSameLandmark(pt.name, renamedOldName)) {
                changed = true;
                return { ...pt, name: renamedNewName! };
              }
              return pt;
            });
            updatedInsertions = updatedInsertions.map(pt => {
              if (isSameLandmark(pt.name, renamedOldName)) {
                changed = true;
                return { ...pt, name: renamedNewName! };
              }
              return pt;
            });
          }

          if (changed) {
            synchronizedCount++;
            const newTargetVisuals: MuscleVisualData = {
              ...targetVisuals,
              origins: updatedOrigins,
              insertions: updatedInsertions,
            };
            const otherSide = side === 'left' ? 'right' : side === 'right' ? 'left' : null;
            const isBilateral = m.symmetryType === 'bilateral';

            return {
              ...m,
              visuals: {
                ...m.visuals,
                [side]: newTargetVisuals,
                ...(isBilateral && otherSide ? {
                  [otherSide]: {
                    origins: mirrorPoints(newTargetVisuals.origins),
                    insertions: mirrorPoints(newTargetVisuals.insertions),
                    musclePath: mirrorPoints(newTargetVisuals.musclePath || [])
                  }
                } : {})
              }
            };
          }
        }

        return m;
      });

      saveMusclesToLocalStorage(updated);
      return updated;
    });
  }, []);

  // Update overige spiergegevens (zoals aanzicht, functies, extra info)
  const updateMuscleDetails = useCallback((muscleId: string, updates: Partial<Muscle>) => {
    setMuscles(prev => {
      const updated = prev.map(m => m.id === muscleId ? { ...m, ...updates } : m);
      saveMusclesToLocalStorage(updated);
      return updated;
    });
  }, []);

  // Spiegel een zijde naar de overkant (x_nieuw = 1.0 - x_oud)
  const mirrorMuscleSide = useCallback((muscleId: string, fromSide: 'left' | 'right') => {
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
      return updated;
    });
    showToast(`Punten succesvol gespiegeld van ${fromSide === 'left' ? 'links' : 'rechts'} naar ${toSide === 'left' ? 'links' : 'rechts'}!`, 'success');
  }, [showToast]);

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
    setMuscles(newMuscles);
    saveMusclesToLocalStorage(newMuscles);
    const saved = await saveMusclesToDisk(newMuscles);
    if (saved) {
      showToast(`${newMuscles.length} spieren geïmporteerd én permanent opgeslagen op schijf!`, 'success');
    } else {
      showToast(`${newMuscles.length} spieren succesvol geïmporteerd in browser!`, 'success');
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
