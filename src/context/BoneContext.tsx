import React, { createContext, useContext, useState, useCallback } from 'react';
import { Bone, BoneMarker, READER_BONES } from '../data/bonesData';
import { BoneStructurePoint, BONE_STRUCTURES } from '../data/boneStructures';
import { AnatomicalView } from '../types/anatomy';

const BONES_LOCAL_STORAGE_KEY = 'pmt_anatomie_bones_reader_v3';
const STRUCTURES_LOCAL_STORAGE_KEY = 'pmt_anatomie_bone_structures_v6';

// Ruim oude versies op
try {
  localStorage.removeItem('pmt_anatomie_bones_reader_v1');
  localStorage.removeItem('pmt_anatomie_bones_custom_v1');
  localStorage.removeItem('pmt_anatomie_bones_custom_v2');
  localStorage.removeItem('pmt_anatomie_bone_structures_v1');
  localStorage.removeItem('pmt_anatomie_bone_structures_v2');
  localStorage.removeItem('pmt_anatomie_bone_structures_v3');
  localStorage.removeItem('pmt_anatomie_bone_structures_v4');
  localStorage.removeItem('pmt_anatomie_bone_structures_v5');
} catch {}

interface BoneContextType {
  bones: Bone[];
  selectedBoneId: string;
  selectedBone: Bone | undefined;
  selectBone: (id: string) => void;
  updateBoneMarkers: (boneId: string, markers: BoneMarker[]) => void;
  updateBonePoint: (boneId: string, markerIndex: number, updatedMarker: Partial<BoneMarker>) => void;
  updateBonePoints: (updates: Array<{ boneId: string; markerIndex: number; x: number; y: number }>) => void;
  addBonePoint: (boneId: string, marker: BoneMarker) => void;
  deleteBonePoint: (boneId: string, markerIndex: number) => void;
  resetBones: () => void;
  exportBonesJson: () => void;
  importBonesJson: (importedBones: Bone[]) => void;
  saveBonesToDisk: () => Promise<boolean>;
  mirrorBoneSides: (boneId: string, view: 'ventral' | 'dorsal' | 'all', sourceSide: 'left' | 'right') => void;
  copyBoneView: (sourceView: 'ventral' | 'dorsal', boneId?: string) => void;

  // Botstructuren (relevante structuren zoals SIAS, Trochanter major, Acromion, etc.)
  structures: BoneStructurePoint[];
  getStructuresForBone: (boneId: string, view: AnatomicalView) => BoneStructurePoint[];
  updateStructurePoint: (id: string, x: number, y: number) => void;
  updateStructurePoints: (updates: Array<{ id: string; x: number; y: number }>) => void;
  addStructurePoint: (point: BoneStructurePoint) => void;
  addStructurePoints: (newPoints: BoneStructurePoint[], structureName?: string, boneId?: string) => void;
  deleteStructurePoint: (id: string) => void;
  deleteStructurePoints: (structureName: string, boneId: string) => void;
  renameStructure: (oldName: string, newName: string, boneId: string) => void;
  resetStructures: () => void;
  saveStructuresToDisk: () => Promise<boolean>;
  exportStructuresJson: () => void;
  importStructuresJson: (imported: BoneStructurePoint[]) => void;
  copyStructureView: (sourceView: 'ventral' | 'dorsal', boneId?: string) => void;
  mirrorStructureSides: (boneId: string, view: 'ventral' | 'dorsal' | 'all', sourceSide: 'left' | 'right') => void;
  mirrorStructurePoint: (id: string) => void;
}

const BoneContext = createContext<BoneContextType | undefined>(undefined);

export const BoneProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // 1. Botten state
  const [bones, setBones] = useState<Bone[]>(() => {
    try {
      const saved = localStorage.getItem(BONES_LOCAL_STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) {
          const savedMap = new Map(parsed.map((b: Bone) => [b.id, b]));
          return READER_BONES.map((base) => {
            const userSaved = savedMap.get(base.id);
            if (userSaved && Array.isArray(userSaved.markers)) {
              return {
                ...base,
                markers: userSaved.markers,
              };
            }
            return base;
          });
        }
      }
    } catch (e) {
      console.warn('Kon opgeslagen botten niet laden:', e);
    }
    return READER_BONES;
  });

  // 2. Botstructuren state (met automatische samenvoeging en ontkoppeling van ventraal en dorsaal)
  const [structures, setStructures] = useState<BoneStructurePoint[]>(() => {
    try {
      const savedV3 = localStorage.getItem(STRUCTURES_LOCAL_STORAGE_KEY);
      if (savedV3) {
        const rawParsed = JSON.parse(savedV3);
        const forbidden = new Set(['test', 'incisura ischiadica major', 'symphysis pubica', 'linea aspera', 'fossa intercondylaris', 'facies patellaris', 'eminentia intercondylaris']);
        const parsed = Array.isArray(rawParsed) ? rawParsed.filter((s: BoneStructurePoint) => !forbidden.has((s.name || '').toLowerCase().trim())) : [];
        if (Array.isArray(parsed) && parsed.length > 0) {
          const hasLegacyBoth = parsed.some((s: BoneStructurePoint) => (s.view as string) === 'both');
          if (!hasLegacyBoth) {
            return parsed;
          }
        }
      }

      // Migreer vanuit eerdere versies (bijv. v2)
      const legacyRaw = localStorage.getItem('pmt_anatomie_bone_structures_v2');
      if (legacyRaw) {
        const parsedLegacy = JSON.parse(legacyRaw);
        if (Array.isArray(parsedLegacy) && parsedLegacy.length > 0) {
          const savedMap = new Map<string, BoneStructurePoint>(
            parsedLegacy.map((s: BoneStructurePoint) => [s.id, s])
          );
          const upgraded = BONE_STRUCTURES.map((base) => {
            const exact = savedMap.get(base.id);
            if (exact) return { ...base, x: exact.x, y: exact.y };
            const legacyId = base.id.replace(/_[vd]$/, '');
            const legacy = savedMap.get(legacyId);
            if (legacy) {
              if (base.view === 'ventral') {
                return { ...base, x: legacy.x, y: legacy.y };
              } else if (base.view === 'dorsal') {
                const mirroredX =
                  base.side === 'left' || base.side === 'right'
                    ? Number((1.0 - legacy.x).toFixed(4))
                    : legacy.x;
                return { ...base, x: mirroredX, y: legacy.y };
              }
            }
            return base;
          });

          try {
            localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(upgraded));
            localStorage.removeItem('pmt_anatomie_bone_structures_v2');
          } catch {}
          return upgraded;
        }
      }
    } catch (e) {
      console.warn('Kon opgeslagen botstructuren niet laden:', e);
    }
    return BONE_STRUCTURES;
  });

  const [selectedBoneId, setSelectedBoneId] = useState<string>(() => {
    return bones[0]?.id || 'os_coxae';
  });

  const selectedBone = bones.find((b) => b.id === selectedBoneId) || bones[0];

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
  }, []);

  const saveStructures = useCallback((newStructures: BoneStructurePoint[]) => {
    setStructures(newStructures);
    try {
      localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(newStructures));
    } catch (e) {
      console.error('Fout bij opslaan botstructuren in localStorage:', e);
    }
  }, []);

  const saveBonesToDisk = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/save-bones', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(bones),
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Kon botten niet opslaan naar schijf:', err);
    }
    return false;
  }, [bones]);

  const saveStructuresToDisk = useCallback(async (): Promise<boolean> => {
    try {
      const res = await fetch('/api/save-bone-structures', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(structures),
      });
      if (res.ok) {
        return true;
      }
    } catch (err) {
      console.warn('Kon botstructuren niet opslaan naar schijf:', err);
    }
    return false;
  }, [structures]);

  const updateBoneMarkers = useCallback(
    (boneId: string, markers: BoneMarker[]) => {
      const updated = bones.map((b) => (b.id === boneId ? { ...b, markers } : b));
      saveBones(updated);
    },
    [bones, saveBones]
  );

  const updateBonePoint = useCallback(
    (boneId: string, markerIndex: number, updatedMarker: Partial<BoneMarker>) => {
      setBones((prev) => {
        const updated = prev.map((b) => {
          if (b.id !== boneId) return b;
          const newMarkers = [...b.markers];
          if (newMarkers[markerIndex]) {
            newMarkers[markerIndex] = { ...newMarkers[markerIndex], ...updatedMarker };
          }
          return { ...b, markers: newMarkers };
        });
        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const updateBonePoints = useCallback(
    (updates: Array<{ boneId: string; markerIndex: number; x: number; y: number }>) => {
      setBones((prev) => {
        // Groepeer updates per bot
        const boneMap = new Map<string, Map<number, { x: number; y: number }>>();
        for (const u of updates) {
          if (!boneMap.has(u.boneId)) {
            boneMap.set(u.boneId, new Map());
          }
          boneMap.get(u.boneId)!.set(u.markerIndex, { x: u.x, y: u.y });
        }

        const updated = prev.map((b) => {
          const mUpdates = boneMap.get(b.id);
          if (!mUpdates) return b;
          const newMarkers = b.markers.map((m, idx) => {
            const up = mUpdates.get(idx);
            return up ? { ...m, x: up.x, y: up.y } : m;
          });
          return { ...b, markers: newMarkers };
        });

        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const addBonePoint = useCallback(
    (boneId: string, marker: BoneMarker) => {
      const updated = bones.map((b) => {
        if (b.id !== boneId) return b;
        return { ...b, markers: [...b.markers, marker] };
      });
      saveBones(updated);
    },
    [bones, saveBones]
  );

  const deleteBonePoint = useCallback(
    (boneId: string, markerIndex: number) => {
      const updated = bones.map((b) => {
        if (b.id !== boneId) return b;
        const newMarkers = b.markers.filter((_, idx) => idx !== markerIndex);
        return { ...b, markers: newMarkers };
      });
      saveBones(updated);
    },
    [bones, saveBones]
  );

  const resetBones = useCallback(() => {
    saveBones(READER_BONES);
  }, [saveBones]);

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

  const importBonesJson = useCallback(
    (importedBones: Bone[]) => {
      saveBones(importedBones);
    },
    [saveBones]
  );

  // Botstructuren operaties
  const getStructuresForBone = useCallback(
    (boneId: string, view: AnatomicalView): BoneStructurePoint[] => {
      return structures.filter((s) => s.boneId === boneId && (s.view === view || (s.view as string) === 'both'));
    },
    [structures]
  );

  const updateStructurePoint = useCallback(
    (id: string, x: number, y: number) => {
      const updated = structures.map((s) => (s.id === id ? { ...s, x, y } : s));
      saveStructures(updated);
    },
    [structures, saveStructures]
  );

  const updateStructurePoints = useCallback(
    (updates: Array<{ id: string; x: number; y: number }>) => {
      setStructures((prev) => {
        const updateMap = new Map(updates.map((u) => [u.id, u]));
        const updated = prev.map((s) => {
          const u = updateMap.get(s.id);
          return u ? { ...s, x: u.x, y: u.y } : s;
        });
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });
    },
    []
  );

  const addStructurePoint = useCallback(
    (point: BoneStructurePoint) => {
      setStructures((prev) => {
        const updated = [...prev, point];
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });
    },
    []
  );

  const addStructurePoints = useCallback(
    (newPoints: BoneStructurePoint[], structureName?: string, boneId?: string) => {
      setStructures((prev) => {
        const updated = [...prev, ...newPoints];
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });

      if (structureName && boneId) {
        setBones((prev) => {
          const updated = prev.map((b) => {
            if (b.id !== boneId) return b;
            const currentList = b.structures || [];
            if (!currentList.some((s) => s.toLowerCase().trim() === structureName.toLowerCase().trim())) {
              return { ...b, structures: [...currentList, structureName.trim()] };
            }
            return b;
          });
          try {
            localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
          } catch (e) {
            console.error('Fout bij opslaan botten:', e);
          }
          return updated;
        });
      }
    },
    []
  );

  const deleteStructurePoint = useCallback(
    (id: string) => {
      setStructures((prev) => {
        const updated = prev.filter((s) => s.id !== id);
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });
    },
    []
  );

  const deleteStructurePoints = useCallback(
    (structureName: string, boneId: string) => {
      const raw = structureName.toLowerCase().trim();
      setStructures((prev) => {
        const updated = prev.filter(
          (s) =>
            !(
              s.boneId === boneId &&
              (s.name.toLowerCase().trim() === raw ||
                (s.fullName && s.fullName.toLowerCase().trim() === raw))
            )
        );
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });

      setBones((prev) => {
        const updated = prev.map((b) => {
          if (b.id !== boneId || !b.structures) return b;
          return {
            ...b,
            structures: b.structures.filter((s) => s.toLowerCase().trim() !== raw),
          };
        });
        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const renameStructure = useCallback(
    (oldName: string, newName: string, boneId: string) => {
      const oldRaw = oldName.toLowerCase().trim();
      const cleanNew = newName.trim();
      if (!cleanNew || oldRaw === cleanNew.toLowerCase()) return;

      setStructures((prev) => {
        const updated = prev.map((s) => {
          if (
            s.boneId === boneId &&
            (s.name.toLowerCase().trim() === oldRaw ||
              (s.fullName && s.fullName.toLowerCase().trim() === oldRaw))
          ) {
            return {
              ...s,
              name: cleanNew,
              fullName: cleanNew,
            };
          }
          return s;
        });
        try {
          localStorage.setItem(STRUCTURES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botstructuren:', e);
        }
        return updated;
      });

      setBones((prev) => {
        const updated = prev.map((b) => {
          if (b.id !== boneId || !b.structures) return b;
          return {
            ...b,
            structures: b.structures.map((s) =>
              s.toLowerCase().trim() === oldRaw ? cleanNew : s
            ),
          };
        });
        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const resetStructures = useCallback(() => {
    saveStructures(BONE_STRUCTURES);
  }, [saveStructures]);

  const exportStructuresJson = useCallback(() => {
    const blob = new Blob([JSON.stringify(structures, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pmt_anatomie_botstructuren_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [structures]);

  const importStructuresJson = useCallback(
    (imported: BoneStructurePoint[]) => {
      saveStructures(imported);
    },
    [saveStructures]
  );

  const mirrorBoneSides = useCallback(
    (boneId: string, view: 'ventral' | 'dorsal' | 'all', sourceSide: 'left' | 'right') => {
      const targetSide: 'left' | 'right' = sourceSide === 'left' ? 'right' : 'left';
      setBones((prev) => {
        const updated = prev.map((bone) => {
          if (boneId && boneId !== 'all' && bone.id !== boneId) return bone;
          const newMarkers = bone.markers.map((target) => {
            if ((view !== 'all' && target.view !== view) || target.side !== targetSide) return target;
            const match = bone.markers.find(
              (sp) =>
                sp.view === target.view &&
                sp.side === sourceSide &&
                (sp.subpart || '').trim().toLowerCase() === (target.subpart || '').trim().toLowerCase()
            );
            if (match) {
              return { ...target, x: Number((1.0 - match.x).toFixed(4)), y: match.y };
            }
            return target;
          });
          return { ...bone, markers: newMarkers };
        });
        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const copyBoneView = useCallback(
    (sourceView: 'ventral' | 'dorsal', boneId?: string) => {
      const targetView: 'ventral' | 'dorsal' = sourceView === 'ventral' ? 'dorsal' : 'ventral';
      setBones((prev) => {
        const updated = prev.map((bone) => {
          if (boneId && boneId !== 'all' && bone.id !== boneId) return bone;
          const sourceMarkers = bone.markers.filter((m) => m.view === sourceView);
          const newMarkers = bone.markers.map((target) => {
            if (target.view !== targetView) return target;
            const match = sourceMarkers.find(
              (sp) =>
                sp.side === target.side &&
                (sp.subpart || '').trim().toLowerCase() === (target.subpart || '').trim().toLowerCase()
            );
            if (match) {
              const mirroredX =
                target.side === 'left' || target.side === 'right'
                  ? Number((1.0 - match.x).toFixed(4))
                  : match.x;
              return { ...target, x: mirroredX, y: match.y };
            }
            return target;
          });
          return { ...bone, markers: newMarkers };
        });
        try {
          localStorage.setItem(BONES_LOCAL_STORAGE_KEY, JSON.stringify(updated));
        } catch (e) {
          console.error('Fout bij opslaan botten:', e);
        }
        return updated;
      });
    },
    []
  );

  const copyStructureView = useCallback(
    (sourceView: 'ventral' | 'dorsal', boneId?: string) => {
      const targetView: 'ventral' | 'dorsal' = sourceView === 'ventral' ? 'dorsal' : 'ventral';
      const sourcePoints = structures.filter(
        (s) => s.view === sourceView && (!boneId || boneId === 'all' || s.boneId === boneId)
      );

      const updated = structures.map((target) => {
        if (target.view !== targetView) return target;
        if (boneId && boneId !== 'all' && target.boneId !== boneId) return target;

        const targetRaw = target.name.toLowerCase();
        const targetStem = target.id.replace(/_[lr]?(?:_[vd])?$/, '');

        // Vind de overeenkomstige bronstructuur
        const match = sourcePoints.find((sp) => {
          if (sp.boneId !== target.boneId) return false;
          if (sp.side !== target.side) return false;
          const spRaw = sp.name.toLowerCase();
          const spStem = sp.id.replace(/_[lr]?(?:_[vd])?$/, '');
          return spRaw === targetRaw || spStem === targetStem;
        });

        if (match) {
          // Bij kopiëren van ventraal naar dorsaal (of omgekeerd) flipt links/rechts sagittaal: x = 1 - x
          const mirroredX =
            target.side === 'left' || target.side === 'right'
              ? Number((1.0 - match.x).toFixed(4))
              : match.x;
          return { ...target, x: mirroredX, y: match.y };
        }
        return target;
      });

      saveStructures(updated);
    },
    [structures, saveStructures]
  );

  const mirrorStructureSides = useCallback(
    (boneId: string, view: 'ventral' | 'dorsal' | 'all', sourceSide: 'left' | 'right') => {
      const targetSide: 'left' | 'right' = sourceSide === 'left' ? 'right' : 'left';
      const sourcePoints = structures.filter(
        (s) =>
          (view === 'all' || s.view === view) &&
          s.side === sourceSide &&
          (!boneId || boneId === 'all' || s.boneId === boneId)
      );

      const updated = structures.map((target) => {
        if ((view !== 'all' && target.view !== view) || target.side !== targetSide) return target;
        if (boneId && boneId !== 'all' && target.boneId !== boneId) return target;

        const targetRaw = target.name.toLowerCase();
        const targetStem = target.id.replace(/_[lr](?:_[vd])?$/, '');

        // Match partner binnen hetzelfde aanzicht
        const match = sourcePoints.find((sp) => {
          if (sp.boneId !== target.boneId) return false;
          if (sp.view !== target.view) return false; // STRICT HETZELFDE AANZICHT!
          const spRaw = sp.name.toLowerCase();
          const spStem = sp.id.replace(/_[lr](?:_[vd])?$/, '');
          return spRaw === targetRaw || spStem === targetStem;
        });

        if (match) {
          const mirroredX = Number((1.0 - match.x).toFixed(4));
          return { ...target, x: mirroredX, y: match.y };
        }
        return target;
      });

      saveStructures(updated);
    },
    [structures, saveStructures]
  );

  const mirrorStructurePoint = useCallback(
    (id: string) => {
      const updated = structures.map((s) => {
        if (s.id !== id) return s;
        return { ...s, x: Number((1.0 - s.x).toFixed(4)) };
      });
      saveStructures(updated);
    },
    [structures, saveStructures]
  );

  return (
    <BoneContext.Provider
      value={{
        bones,
        selectedBoneId,
        selectedBone,
        selectBone,
        updateBoneMarkers,
        updateBonePoint,
        updateBonePoints,
        addBonePoint,
        deleteBonePoint,
        resetBones,
        exportBonesJson,
        importBonesJson,
        saveBonesToDisk,
        mirrorBoneSides,
        copyBoneView,

        structures,
        getStructuresForBone,
        updateStructurePoint,
        updateStructurePoints,
        addStructurePoint,
        addStructurePoints,
        deleteStructurePoint,
        deleteStructurePoints,
        renameStructure,
        resetStructures,
        saveStructuresToDisk,
        exportStructuresJson,
        importStructuresJson,
        copyStructureView,
        mirrorStructureSides,
        mirrorStructurePoint,
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
