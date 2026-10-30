import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bone, BoneMarker, READER_BONES } from '../data/bonesData';

const BONES_LOCAL_STORAGE_KEY = 'pmt_anatomie_bones_reader_v1';

// Ruim oude versies op
try {
  localStorage.removeItem('pmt_anatomie_bones_custom_v1');
  localStorage.removeItem('pmt_anatomie_bones_custom_v2');
} catch {}

interface BoneContextType {
  bones: Bone[];
  selectedBoneId: string;
  selectedBone: Bone | undefined;
  selectBone: (id: string) => void;
  updateBoneMarkers: (boneId: string, markers: BoneMarker[]) => void;
  updateBonePoint: (boneId: string, markerIndex: number, updatedMarker: Partial<BoneMarker>) => void;
  addBonePoint: (boneId: string, marker: BoneMarker) => void;
  deleteBonePoint: (boneId: string, markerIndex: number) => void;
  resetBones: () => void;
  exportBonesJson: () => void;
  importBonesJson: (importedBones: Bone[]) => void;
}

const BoneContext = createContext<BoneContextType | undefined>(undefined);

export const BoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [bones, setBones] = useState<Bone[]>(() => {
    try {
      const saved = localStorage.getItem(BONES_LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length === READER_BONES.length) {
          return parsed;
        }
      }
    } catch (e) {
      console.warn('Kon opgeslagen botten niet laden:', e);
    }
    return READER_BONES;
  });

  const [selectedBoneId, setSelectedBoneId] = useState<string>(() => {
    return bones[0]?.id || 'os_coxae';
  });

  const selectedBone = bones.find(b => b.id === selectedBoneId) || bones[0];

  const selectBone = useCallback((id: string) => {
    setSelectedBoneId(id);
  }, []);

  const saveBones = useCallback((newBones: Bone[]) => {
    setBones(newBones);
    try {
      localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(newBones));
    } catch (e) {
      console.error('Fout bij opslaan botten in localStorage:', e);
    }
    // Slaat direct permanent op naar het bronbestand src/data/bonesData.ts
    try {
      fetch('/api/save-bones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newBones),
      }).catch(() => {
        // Negeer als dev server offline is
      });
    } catch {
      // ignore
    }
  }, []);

  const updateBoneMarkers = useCallback((boneId: string, markers: BoneMarker[]) => {
    const updated = bones.map(b => (b.id === boneId ? { ...b, markers } : b));
    saveBones(updated);
  }, [bones, saveBones]);

  const updateBonePoint = useCallback((boneId: string, markerIndex: number, updatedMarker: Partial<BoneMarker>) => {
    const updated = bones.map(b => {
      if (b.id !== boneId) return b;
      const newMarkers = [...b.markers];
      if (newMarkers[markerIndex]) {
        newMarkers[markerIndex] = { ...newMarkers[markerIndex], ...updatedMarker };
      }
      return { ...b, markers: newMarkers };
    });
    saveBones(updated);
  }, [bones, saveBones]);

  const addBonePoint = useCallback((boneId: string, marker: BoneMarker) => {
    const updated = bones.map(b => {
      if (b.id !== boneId) return b;
      return { ...b, markers: [...b.markers, marker] };
    });
    saveBones(updated);
  }, [bones, saveBones]);

  const deleteBonePoint = useCallback((boneId: string, markerIndex: number) => {
    const updated = bones.map(b => {
      if (b.id !== boneId) return b;
      return { ...b, markers: b.markers.filter((_, i) => i !== markerIndex) };
    });
    saveBones(updated);
  }, [bones, saveBones]);

  const resetBones = useCallback(() => {
    try {
      localStorage.removeItem(BONES_LOCAL_STORAGE_KEY);
    } catch {
      // ignore
    }
    setBones(READER_BONES);
    try {
      fetch('/api/save-bones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(READER_BONES),
      }).catch(() => {});
    } catch {
      // ignore
    }
  }, []);

  const exportBonesJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(bones, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmt_anatomie_botten_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [bones]);

  const importBonesJson = useCallback((importedBones: Bone[]) => {
    saveBones(importedBones);
  }, [saveBones]);

  return (
    <BoneContext.Provider
      value={{
        bones,
        selectedBoneId,
        selectedBone,
        selectBone,
        updateBoneMarkers,
        updateBonePoint,
        addBonePoint,
        deleteBonePoint,
        resetBones,
        exportBonesJson,
        importBonesJson,
      }}
    >
      {children}
    </BoneContext.Provider>
  );
};

export const useBones = (): BoneContextType => {
  const context = useContext(BoneContext);
  if (!context) {
    throw new Error('useBones moet binnen BoneProvider gebruikt worden');
  }
  return context;
};
