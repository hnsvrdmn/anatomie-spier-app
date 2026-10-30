import { Muscle } from '../types/anatomy';
import { mirrorPoints } from './coordinates';
import initialMusclesData from '../data/muscles.json';

const LOCAL_STORAGE_KEY = 'pmt_anatomie_muscles_dataset_v12';

/**
 * Filtert spieren die niet in het PMT-curriculum / de reader horen
 * (zoals m. tensor fascia latae en m. gluteus medius).
 * Let op: m. vastus intermedius hoort WEL in het curriculum en wordt behouden.
 */
export function isForbiddenMuscle(m: { id?: string; name?: string; latinName?: string }): boolean {
  const idLower = (m.id || '').toLowerCase();
  const nameLower = (m.name || '').toLowerCase();
  const latinLower = (m.latinName || '').toLowerCase();

  const isTensor = idLower.includes('tensor') || nameLower.includes('tensor') || latinLower.includes('tensor');
  const isGluteusMedius = (idLower.includes('medius') || nameLower.includes('medius') || latinLower.includes('medius'))
    && !(idLower.includes('intermedius') || nameLower.includes('intermedius') || latinLower.includes('intermedius'));

  return isTensor || isGluteusMedius;
}

/**
 * Downloadt de actuele spieren dataset als muscles.json
 */
export function downloadMusclesJson(muscles: Muscle[], filename = 'muscles.json'): void {
  const cleanMuscles = muscles.filter(m => !isForbiddenMuscle(m));
  const jsonStr = JSON.stringify(cleanMuscles, null, 2);
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
    const cleanMuscles = muscles.filter(m => !isForbiddenMuscle(m));
    const res = await fetch('/api/save-muscles', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(cleanMuscles),
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
    const cleanMuscles = muscles.filter(m => !isForbiddenMuscle(m));
    localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(cleanMuscles));
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
    // Schoon alle voorgaande versies op zodat eventuele verouderde spieren (zoals tensor of gluteus medius) direct verdwijnen
    try {
      localStorage.removeItem('pmt_anatomie_muscles_dataset');
      localStorage.removeItem('pmt_anatomie_muscles_dataset_v10');
      localStorage.removeItem('pmt_anatomie_muscles_dataset_v11');
    } catch {}

    const data = localStorage.getItem(LOCAL_STORAGE_KEY);
    if (!data) return null;
    const parsed = JSON.parse(data);
    if (Array.isArray(parsed) && parsed.length > 0) {
      const filtered = (parsed as Muscle[]).filter(m => !isForbiddenMuscle(m));
      const baseMap = new Map((initialMusclesData as unknown as Muscle[]).map(m => [m.id, m]));
      return filtered.map((m) => {
        let name = m.name;
        if (m.id === 'fibularis_brevis') name = 'm. fibularis brevis';
        if (m.id === 'fibularis_longus') name = 'm. fibularis longus';

        const base = baseMap.get(m.id);
        const jointCategories = base?.jointCategories ?? m.jointCategories;
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
            jointCategories,
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
          jointCategories,
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
