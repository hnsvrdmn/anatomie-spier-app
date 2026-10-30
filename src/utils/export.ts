import { Muscle } from '../types/anatomy';

const LOCAL_STORAGE_KEY = 'pmt_anatomie_muscles_dataset_v15';

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
 * Zorgt ervoor dat alle teksten en officiële anatomische gegevens altijd synchroon blijven met muscles.json
 */
export function loadMusclesFromLocalStorage(): Muscle[] | null {
  try {
    // Verwijder alle verouderde cache-versies zodat de officiële muscles.json altijd 1:1 leidend is
    const keysToRemove: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('pmt_anatomie_muscles_dataset')) {
        keysToRemove.push(k);
      }
    }
    keysToRemove.forEach(k => localStorage.removeItem(k));
  } catch (err) {
    console.error('Fout bij opschonen LocalStorage:', err);
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
