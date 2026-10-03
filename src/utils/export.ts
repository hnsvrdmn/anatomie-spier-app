import { Muscle } from '../types/anatomy';
import { mirrorPoints } from './coordinates';
import initialMusclesData from '../data/muscles.json';

const LOCAL_STORAGE_KEY = 'pmt_anatomie_muscles_dataset_v8';

/**
 * Downloadt de actuele spieren dataset als muscles.json
 */
export function downloadMusclesJson(muscles: Muscle[], filename = 'muscles.json'): void {
  const jsonStr = JSON.stringify(muscles, null, 2);
  const blob = new Blob([jsonStr], { type: 'application/json;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Slaat bewerkte spieren direct permanent op naar src/data/muscles.json via de lokale dev server API
 */
export async function saveMusclesToDisk(muscles: Muscle[]): Promise<boolean> {
  try {
    const res = await fetch('/api/save-muscles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(muscles),
    });
    if (res.ok) {
      return true;
    }
  } catch (err) {
    console.warn('Opslaan naar schijf via server API niet beschikbaar:', err);
  }
  return false;
}

/**
 * Slaat bewerkte spieren op in de lokale browseropslag
 */
export function saveMusclesToLocalStorage(muscles: Muscle[]): void {
  try {
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(muscles));
  } catch (err) {
    console.error('Fout bij opslaan in LocalStorage:', err);
  }
}

/**
 * Laadt spieren uit de lokale browseropslag (indien aanwezig)
 * Zorgt ervoor dat alle bilaterale spieren altijd 100% symmetrisch zijn en behoudt altijd de nieuwste aanhechtingszones
 */
export function loadMusclesFromLocalStorage(): Muscle[] | null {
  try {
    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const baseMap = new Map((initialMusclesData as unknown as Muscle[]).map(m => [m.id, m]));
      return (parsed as Muscle[]).map((m) => {
        let name = m.name;
        if (m.id === 'fibularis_brevis') name = 'm. fibularis brevis';
        if (m.id === 'fibularis_longus') name = 'm. fibularis longus';

        const base = baseMap.get(m.id);
        const leftLines = (base?.visuals?.left?.attachmentLines?.length)
          ? base.visuals.left.attachmentLines
          : (m.visuals?.left?.attachmentLines || []);

        const rightLines = (base?.visuals?.right?.attachmentLines?.length)
          ? base.visuals.right.attachmentLines
          : (m.visuals?.right?.attachmentLines || []);

        if (m.symmetryType === 'bilateral' && m.visuals?.left) {
          return {
            ...m,
            name,
            visuals: {
              ...m.visuals,
              left: {
                ...m.visuals.left,
                attachmentLines: leftLines,
              },
              right: {
                origins: mirrorPoints(m.visuals.left.origins),
                insertions: mirrorPoints(m.visuals.left.insertions),
                musclePath: mirrorPoints(m.visuals.left.musclePath || []),
                attachmentLines: leftLines.length > 0 ? leftLines.map((al) => ({
                  ...al,
                  id: al.id.replace('-left', '-right'),
                  points: mirrorPoints(al.points),
                })) : rightLines,
              }
            }
          };
        }
        return {
          ...m,
          name,
          visuals: {
            ...m.visuals,
            left: { ...(m.visuals?.left || { origins: [], insertions: [], musclePath: [] }), attachmentLines: leftLines },
            right: { ...(m.visuals?.right || { origins: [], insertions: [], musclePath: [] }), attachmentLines: rightLines },
          }
        };
      });
    }
  } catch (err) {
    console.error('Fout bij laden uit LocalStorage:', err);
  }
  return null;
}

/**
 * Reset de lokale opslag naar de oorspronkelijke dataset
 */
export function resetLocalStorage(): void {
  try {
    localStorage.removeItem(LOCAL_STORAGE_KEY);
  } catch (err) {
    console.error('Fout bij resetten LocalStorage:', err);
  }
}
