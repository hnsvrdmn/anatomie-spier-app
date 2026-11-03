import React, { createContext, useContext, useState, useCallback, useMemo } from 'react';
import { FLASHCARD_SETS, FlashcardItem, FlashcardSet } from '../data/flashcardsData';
import customSavedSets from '../data/flashcardsCustom.json';

const FLASHCARDS_STORAGE_KEY = 'pmt_anatomie_flashcards_custom_v7';

interface FlashcardContextType {
  flashcardSets: FlashcardSet[];
  activeSetId: string;
  setActiveSetId: (id: string) => void;
  activeSet: FlashcardSet | undefined;
  updateCard: (setId: string, cardId: string, updated: Partial<FlashcardItem>) => void;
  addCard: (setId: string, card: Omit<FlashcardItem, 'id' | 'setId'>) => FlashcardItem;
  deleteCard: (setId: string, cardId: string) => void;
  duplicateCard: (setId: string, cardId: string) => FlashcardItem | undefined;
  resetFlashcards: () => void;
  exportFlashcardsJson: () => void;
  importFlashcardsJson: (importedSets: FlashcardSet[]) => boolean;
  saveFlashcardsToDisk: () => Promise<{ success: boolean; message: string }>;
  isCustomized: boolean;
}

const FlashcardContext = createContext<FlashcardContextType | undefined>(undefined);

function getInitialSets(): FlashcardSet[] {
  // 1. Probeer vanuit localStorage
  try {
    const saved = localStorage.getItem(FLASHCARDS_STORAGE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (Array.isArray(parsed) && parsed.length > 0) {
        return parsed;
      }
    }
  } catch (e) {
    console.warn('Kon opgeslagen flashcards niet laden uit localStorage:', e);
  }

  // 2. Probeer vanuit flashcardsCustom.json indien gevuld
  if (Array.isArray(customSavedSets) && customSavedSets.length > 0) {
    return customSavedSets as FlashcardSet[];
  }

  // 3. Val terug op standaard data
  return FLASHCARD_SETS;
}

export const FlashcardProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [flashcardSets, setFlashcardSets] = useState<FlashcardSet[]>(getInitialSets);
  const [activeSetId, setActiveSetId] = useState<string>(() => {
    return flashcardSets[0]?.id || 'richtingen_vlakken';
  });

  const activeSet = useMemo(() => {
    return flashcardSets.find((s) => s.id === activeSetId) || flashcardSets[0];
  }, [flashcardSets, activeSetId]);

  const persistSets = useCallback((newSets: FlashcardSet[]) => {
    setFlashcardSets(newSets);
    try {
      localStorage.setItem(FLASHCARDS_STORAGE_KEY, JSON.stringify(newSets));
    } catch (e) {
      console.error('Fout bij opslaan flashcards in localStorage:', e);
    }
  }, []);

  const updateCard = useCallback(
    (setId: string, cardId: string, updated: Partial<FlashcardItem>) => {
      persistSets(
        flashcardSets.map((s) => {
          if (s.id !== setId) return s;
          return {
            ...s,
            cards: s.cards.map((c) => {
              if (c.id !== cardId) return c;
              return {
                ...c,
                ...updated,
              };
            }),
          };
        })
      );
    },
    [flashcardSets, persistSets]
  );

  const addCard = useCallback(
    (setId: string, cardData: Omit<FlashcardItem, 'id' | 'setId'>): FlashcardItem => {
      const newId = `${setId}-${Date.now()}`;
      const newCard: FlashcardItem = {
        ...cardData,
        id: newId,
        setId,
      };

      persistSets(
        flashcardSets.map((s) => {
          if (s.id !== setId) return s;
          return {
            ...s,
            cards: [...s.cards, newCard],
          };
        })
      );

      return newCard;
    },
    [flashcardSets, persistSets]
  );

  const deleteCard = useCallback(
    (setId: string, cardId: string) => {
      persistSets(
        flashcardSets.map((s) => {
          if (s.id !== setId) return s;
          return {
            ...s,
            cards: s.cards.filter((c) => c.id !== cardId),
          };
        })
      );
    },
    [flashcardSets, persistSets]
  );

  const duplicateCard = useCallback(
    (setId: string, cardId: string): FlashcardItem | undefined => {
      const targetSet = flashcardSets.find((s) => s.id === setId);
      if (!targetSet) return undefined;
      const targetIndex = targetSet.cards.findIndex((c) => c.id === cardId);
      if (targetIndex === -1) return undefined;

      const original = targetSet.cards[targetIndex];
      const duplicated: FlashcardItem = {
        ...original,
        id: `${setId}-copy-${Date.now()}`,
        question: `${original.question} (kopie)`,
      };

      const newCards = [...targetSet.cards];
      newCards.splice(targetIndex + 1, 0, duplicated);

      persistSets(
        flashcardSets.map((s) => {
          if (s.id !== setId) return s;
          return {
            ...s,
            cards: newCards,
          };
        })
      );

      return duplicated;
    },
    [flashcardSets, persistSets]
  );

  const resetFlashcards = useCallback(() => {
    try {
      localStorage.removeItem(FLASHCARDS_STORAGE_KEY);
    } catch {}
    setFlashcardSets(FLASHCARD_SETS);
  }, []);

  const exportFlashcardsJson = useCallback(() => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(flashcardSets, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `flashcards_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  }, [flashcardSets]);

  const importFlashcardsJson = useCallback((imported: any): boolean => {
    if (!Array.isArray(imported) || imported.length === 0) return false;
    const isValid = imported.every((s) => s && typeof s.id === 'string' && Array.isArray(s.cards));
    if (!isValid) return false;
    persistSets(imported as FlashcardSet[]);
    return true;
  }, [persistSets]);

  const saveFlashcardsToDisk = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    try {
      const res = await fetch('/api/save-flashcards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(flashcardSets),
      });

      if (!res.ok) {
        const text = await res.text();
        return { success: false, message: `Server fout (${res.status}): ${text}` };
      }

      const json = await res.json();
      return {
        success: true,
        message: `Succesvol opgeslagen! ${json.totalCards || 'Alle'} kaarten opgeslagen naar flashcardsCustom.json`,
      };
    } catch (e: any) {
      return {
        success: false,
        message: `Kon niet opslaan naar schijf: ${e?.message || 'Is de Vite dev server actief?'}. Data is wel bewaard in localStorage.`,
      };
    }
  }, [flashcardSets]);

  const isCustomized = useMemo(() => {
    try {
      return localStorage.getItem(FLASHCARDS_STORAGE_KEY) !== null;
    } catch {
      return false;
    }
  }, [flashcardSets]);

  return (
    <FlashcardContext.Provider
      value={{
        flashcardSets,
        activeSetId,
        setActiveSetId,
        activeSet,
        updateCard,
        addCard,
        deleteCard,
        duplicateCard,
        resetFlashcards,
        exportFlashcardsJson,
        importFlashcardsJson,
        saveFlashcardsToDisk,
        isCustomized,
      }}
    >
      {children}
    </FlashcardContext.Provider>
  );
};

export const useFlashcards = (): FlashcardContextType => {
  const context = useContext(FlashcardContext);
  if (!context) {
    throw new Error('useFlashcards must be used within a FlashcardProvider');
  }
  return context;
};

