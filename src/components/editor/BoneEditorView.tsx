import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useBones } from '../../context/BoneContext';
import { useMuscles } from '../../context/MuscleContext';
import { BoneStructurePoint } from '../../data/boneStructures';
import { SKELETON_WIDTH, SKELETON_HEIGHT } from '../../utils/coordinates';
import {
  RotateCcw,
  Download,
  Upload,
  Save,
  Filter,
  Eye,
  EyeOff,
  ZoomIn,
  ZoomOut,
  Hand,
  MousePointer,
  Plus,
  Trash2,
  X,
} from 'lucide-react';

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 2374.54;

interface EditablePoint {
  id: string;
  name: string;
  rawName?: string;
  subName?: string;
  x: number;
  y: number;
  type: 'bone' | 'structure';
  boneId: string;
  markerIndex?: number;
  side?: 'left' | 'right' | 'midline';
  view?: 'ventral' | 'dorsal' | 'both';
}

interface DraggableSkeletonProps {
  view: 'ventral' | 'dorsal';
  points: EditablePoint[];
  hidePopup?: boolean;
  onToggleHidePopup?: () => void;
  onDragStart?: (point: EditablePoint) => void;
  onUpdatePoint: (point: EditablePoint, x: number, y: number, deltaX: number, deltaY: number) => void;
  onDragEnd?: () => void;
  isPlacingPoint?: boolean;
  onPlacePoint?: (view: 'ventral' | 'dorsal', x: number, y: number) => void;
  onDeleteStructure?: (structureName: string, boneId: string) => void;
}

const DraggableSkeleton: React.FC<DraggableSkeletonProps> = ({
  view,
  points,
  hidePopup = false,
  onToggleHidePopup,
  onDragStart,
  onUpdatePoint,
  onDragEnd,
  isPlacingPoint = false,
  onPlacePoint,
  onDeleteStructure,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  const [draggingPoint, setDraggingPoint] = useState<EditablePoint | null>(null);
  const [hoveredPoint, setHoveredPoint] = useState<EditablePoint | null>(null);

  const isDraggingMarkerRef = useRef(false);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ clientX: number; clientY: number; panX: number; panY: number } | null>(null);
  const dragStartRef = useRef<{
    point: EditablePoint;
    startX: number;
    startY: number;
  } | null>(null);
  const activePointRef = useRef<EditablePoint | null>(null);

  // Direct zoomen met het muiswiel (zonder verplichte Ctrl)
  useEffect(() => {
    const el = viewportRef.current;
    if (!el) return;

    const handleWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -Math.sign(e.deltaY) * 0.25;
      setZoom((z) => {
        const next = Math.max(1.0, Math.min(3.5, Number((z + delta).toFixed(2))));
        if (next === 1.0) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, []);

  // Marker drag start
  const handlePointerDownMarker = (e: React.PointerEvent, pt: EditablePoint) => {
    if (isPlacingPoint) return;
    e.stopPropagation();
    isDraggingMarkerRef.current = true;
    dragStartRef.current = {
      point: pt,
      startX: pt.x,
      startY: pt.y,
    };
    activePointRef.current = pt;
    setDraggingPoint(pt);
    setHoveredPoint(pt);
    onDragStart?.(pt);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  // Viewport pan start / punt plaatsen
  const handlePointerDownViewport = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    if (isPlacingPoint) {
      if (containerRef.current && onPlacePoint) {
        const rect = containerRef.current.getBoundingClientRect();
        const normX = (e.clientX - rect.left) / rect.width;
        const normY = (e.clientY - rect.top) / rect.height;
        const clampedX = Math.max(0.02, Math.min(0.98, Number(normX.toFixed(4))));
        const clampedY = Math.max(0.01, Math.min(0.99, Number(normY.toFixed(4))));
        onPlacePoint(view, clampedX, clampedY);
      }
      return;
    }
    if (panMode || zoom > 1.0) {
      isPanningRef.current = true;
      panStartRef.current = {
        clientX: e.clientX,
        clientY: e.clientY,
        panX: pan.x,
        panY: pan.y,
      };
      try {
        (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
      } catch {
        // fallback
      }
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    // 1. Marker verslepen
    if (isDraggingMarkerRef.current && dragStartRef.current && containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      const normX = (e.clientX - rect.left) / rect.width;
      const normY = (e.clientY - rect.top) / rect.height;

      const clampedX = Math.max(0.02, Math.min(0.98, Number(normX.toFixed(4))));
      const clampedY = Math.max(0.01, Math.min(0.99, Number(normY.toFixed(4))));

      const deltaX = Number((clampedX - dragStartRef.current.startX).toFixed(4));
      const deltaY = Number((clampedY - dragStartRef.current.startY).toFixed(4));

      onUpdatePoint(dragStartRef.current.point, clampedX, clampedY, deltaX, deltaY);
      return;
    }

    // 2. Viewport pannen
    if (isPanningRef.current && panStartRef.current) {
      const dx = e.clientX - panStartRef.current.clientX;
      const dy = e.clientY - panStartRef.current.clientY;
      setPan({
        x: panStartRef.current.panX + dx,
        y: panStartRef.current.panY + dy,
      });
    }
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingMarkerRef.current) {
      isDraggingMarkerRef.current = false;
      dragStartRef.current = null;
      activePointRef.current = null;
      setDraggingPoint(null);
      onDragEnd?.();
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
    if (isPanningRef.current) {
      isPanningRef.current = false;
      panStartRef.current = null;
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      ref={viewportRef}
      className={`relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-white ${
        isPlacingPoint
          ? 'cursor-crosshair ring-2 ring-inset ring-sky-400'
          : panMode || (zoom > 1.0 && !isDraggingMarkerRef.current)
          ? 'cursor-grab active:cursor-grabbing'
          : 'cursor-default'
      }`}
      onPointerDown={handlePointerDownViewport}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      {/* Zwevende Navigator Toolbar rechtsboven per paneel */}
      <div className="absolute top-2.5 right-2.5 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md text-slate-700 pointer-events-auto">
        <button
          type="button"
          onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.35).toFixed(2))))}
          title="Inzoomen (+)"
          className="p-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700"
        >
          <ZoomIn className="w-3.5 h-3.5" />
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
            setPanMode(false);
          }}
          title="Klik om te resetten naar 100%"
          className="px-1.5 py-0.5 text-[11px] font-bold rounded-lg hover:bg-slate-100 transition-colors text-slate-700 min-w-[40px] text-center font-mono"
        >
          {Math.round(zoom * 100)}%
        </button>
        <button
          type="button"
          onClick={() => {
            setZoom((z) => {
              const next = Math.max(1.0, Number((z - 0.35).toFixed(2)));
              if (next === 1.0) setPan({ x: 0, y: 0 });
              return next;
            });
          }}
          title="Uitzoomen (-)"
          className="p-1 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700"
        >
          <ZoomOut className="w-3.5 h-3.5" />
        </button>

        <div className="w-[1px] h-3.5 bg-slate-200" />
        <button
          type="button"
          onClick={onToggleHidePopup}
          title={hidePopup ? "Toon pop-up informatie" : "Verberg pop-up (markers blijven altijd zichtbaar)"}
          className={`p-1 rounded-lg transition-colors flex items-center justify-center ${
            hidePopup ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-600'
          }`}
        >
          {hidePopup ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
        </button>

        {zoom > 1.0 && (
          <>
            <div className="w-[1px] h-3.5 bg-slate-200" />
            <button
              type="button"
              onClick={() => setPanMode((p) => !p)}
              title={panMode ? 'Skelet verslepen actief' : 'Activeer versleep modus'}
              className={`p-1 rounded-lg transition-colors ${
                panMode ? 'bg-slate-200 text-slate-900' : 'hover:bg-slate-100 text-slate-600'
              }`}
            >
              {panMode ? <MousePointer className="w-3.5 h-3.5" /> : <Hand className="w-3.5 h-3.5" />}
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
                setPanMode(false);
              }}
              title="Volledige weergave herstellen"
              className="p-1 rounded-lg hover:bg-slate-100 text-slate-600"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>
          </>
        )}
      </div>

      {/* Geometrische Skeletcontainer (geschaald & getransleerd bij zoom/pan met perfecte verhouding) */}
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: isPanningRef.current ? 'none' : 'transform 0.08s ease-out',
        }}
        className="relative max-h-full max-w-full w-auto h-auto mx-auto pointer-events-auto flex items-center justify-center"
      >
        {/* Richtinggevende badge bij het plaatsen van een nieuw punt */}
        {isPlacingPoint && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-sky-600 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1.5 pointer-events-none animate-pulse whitespace-nowrap">
            <Plus className="w-3.5 h-3.5" />
            <span>Klik op skelet om te plaatsen</span>
          </div>
        )}

        {/* Skelet afbeelding (in flow met object-contain) */}
        <img
          src={
            view === 'ventral'
              ? `${import.meta.env.BASE_URL}images/skeleton_ventral.png`
              : `${import.meta.env.BASE_URL}images/skeleton_dorsal.png`
          }
          alt={`Skelet - ${view === 'ventral' ? 'Ventraal' : 'Dorsaal'}`}
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className="max-h-full max-w-full w-auto h-auto object-contain block select-none pointer-events-none"
          draggable={false}
        />

        {/* SVG Markerlaag met alle sleepbare punten */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 w-full h-full pointer-events-none transition-opacity duration-200"
        >
          {points.map((pt) => {
            const cx = pt.x * SVG_WIDTH;
            const cy = pt.y * SVG_HEIGHT;
            const isDragging = draggingPoint?.id === pt.id;
            const isHovered = hoveredPoint?.id === pt.id;
            const isStructure = pt.type === 'structure';

            // Subtiele, strakke grootte (niet te groot bij aanklikken, geen pulserend cirkeltje)
            const baseRadius = isStructure ? 6 : 9;
            const radius = (isDragging ? baseRadius + 1.5 : isHovered ? baseRadius + 1 : baseRadius) / zoom;
            const hitRadius = (isStructure ? 26 : 34) / zoom;

            const fillColor = isDragging
              ? '#0284c7'
              : isHovered
              ? '#0ea5e9'
              : isStructure
              ? '#64748b'
              : '#1993f2';
            const strokeColor = '#ffffff';
            const strokeWidth = (isDragging ? 2.5 : isStructure ? 1.5 : 2.5) / zoom;

            return (
              <g
                key={pt.id}
                className={isPlacingPoint ? 'pointer-events-none' : 'pointer-events-auto cursor-grab active:cursor-grabbing'}
                onPointerDown={(e) => handlePointerDownMarker(e, pt)}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => {
                  if (!isDraggingMarkerRef.current) setHoveredPoint(null);
                }}
              >
                {/* Ruim klik- en sleepgebied */}
                <circle cx={cx} cy={cy} r={hitRadius} fill="transparent" />

                {/* Hoofdmarker cirkel */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-colors duration-150"
                  style={{
                    filter:
                      isDragging || isHovered
                        ? 'drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.35))'
                        : 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25))',
                  }}
                />

                {/* Wit centrum ALLEEN voor hoofd-botten (structuren blijven egaal zonder witte stip) */}
                {!isStructure && <circle cx={cx} cy={cy} r={radius * 0.35} fill="#ffffff" />}
              </g>
            );
          })}
        </svg>

        {/* Grote, duidelijke muisover pop-up */}
        {!hidePopup &&
          hoveredPoint &&
          (() => {
            const isNearTop = hoveredPoint.y < 0.18;
            return (
              <div
                style={{
                  position: 'absolute',
                  left: `${hoveredPoint.x * 100}%`,
                  top: `${hoveredPoint.y * 100}%`,
                  transform: `${
                    isNearTop ? 'translate(-50%, 18px)' : 'translate(-50%, calc(-100% - 18px))'
                  } scale(${1 / zoom})`,
                  transformOrigin: isNearTop ? 'top center' : 'bottom center',
                }}
                className="z-50 pointer-events-auto select-none transition-all duration-75"
              >
                {isNearTop && (
                  <div className="w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-900/95 mx-auto" />
                )}
                <div className="bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-400/60 backdrop-blur-md flex flex-col items-center gap-1 min-w-[220px] max-w-[380px] text-center">
                  <div className="text-lg sm:text-xl font-black text-white tracking-wide leading-tight">
                    {hoveredPoint.name}
                  </div>
                  {hoveredPoint.subName && (
                    <div className="text-xs sm:text-sm font-bold text-sky-300 leading-tight">
                      {hoveredPoint.subName}
                    </div>
                  )}
                  <div className="text-[11px] font-mono text-slate-300 bg-slate-800/90 px-2 py-0.5 rounded-md mt-1 border border-slate-700">
                    x: {hoveredPoint.x.toFixed(4)}, y: {hoveredPoint.y.toFixed(4)} • {hoveredPoint.side || 'midline'}
                  </div>
                  {hoveredPoint.type === 'structure' && onDeleteStructure && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm(`Weet je zeker dat je structuur '${hoveredPoint.name}' wilt verwijderen (links én rechts)?`)) {
                          onDeleteStructure(hoveredPoint.rawName || hoveredPoint.name, hoveredPoint.boneId);
                          setHoveredPoint(null);
                        }
                      }}
                      className="mt-1.5 px-2.5 py-1 rounded-lg bg-rose-500/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 text-[11px] font-bold transition flex items-center gap-1 active:scale-95 cursor-pointer"
                      title="Verwijder deze structuur (L + R)"
                    >
                      <Trash2 className="w-3 h-3" />
                      <span>Verwijder (L + R)</span>
                    </button>
                  )}
                </div>
                {!isNearTop && (
                  <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900/95 mx-auto" />
                )}
              </div>
            );
          })()}
      </div>
    </div>
  );
};

export const BoneEditorView: React.FC = () => {
  const {
    bones,
    updateBonePoints,
    resetBones,
    exportBonesJson,
    importBonesJson,
    saveBonesToDisk,
    mirrorBoneSides,
    copyBoneView,
    structures,
    updateStructurePoints,
    addStructurePoints,
    deleteStructurePoints,
    resetStructures,
    saveStructuresToDisk,
    exportStructuresJson,
    importStructuresJson,
    copyStructureView,
    mirrorStructureSides,
  } = useBones();
  const { showToast } = useMuscles();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Keuze tussen het bewerken van 'bones' (hoofd-botposities) of 'structures' (relevante botstructuren)
  const [editTarget, setEditTarget] = useState<'bones' | 'structures'>('structures');
  // Optioneel filter per bot wanneer structuren worden bewerkt
  const [selectedFilterBone, setSelectedFilterBone] = useState<string>('all');

  // Toevoegen van nieuwe botstructuren
  const [isAddingStructure, setIsAddingStructure] = useState(false);
  const [newStructName, setNewStructName] = useState('');
  const [newStructBoneId, setNewStructBoneId] = useState<string>('os_coxae');
  const [newStructViewMode, setNewStructViewMode] = useState<'ventral' | 'dorsal' | 'both'>('both');

  useEffect(() => {
    if (selectedFilterBone !== 'all') {
      setNewStructBoneId(selectedFilterBone);
    }
  }, [selectedFilterBone]);

  // Weergave- en bewerkopties
  const [hidePopup, setHidePopup] = useState(false);
  const [liveSymmetry, setLiveSymmetry] = useState(true);
  // Optie om aanpassingen tussen ventraal en dorsaal te koppelen (standaard uit: onafhankelijk)
  const [linkVentralDorsal, setLinkVentralDorsal] = useState(false);

  const handleSaveToDisk = async () => {
    setIsSaving(true);
    const okBones = await saveBonesToDisk();
    const okStructures = await saveStructuresToDisk();
    setIsSaving(false);
    if (okBones && okStructures) {
      showToast('Botten en botstructuren permanent opgeslagen in de broncode op schijf!', 'success');
    } else if (okBones || okStructures) {
      showToast('Succesvol opgeslagen op schijf!', 'success');
    } else {
      showToast('Opslaan naar schijf mislukt (alleen beschikbaar via lokale dev server)', 'warning');
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);
        if (Array.isArray(parsed) && parsed.length > 0) {
          if (editTarget === 'bones') {
            importBonesJson(parsed);
            showToast('Botten dataset succesvol geïmporteerd!', 'success');
          } else {
            importStructuresJson(parsed);
            showToast('Botstructuren dataset succesvol geïmporteerd!', 'success');
          }
        } else {
          showToast('Ongeldig JSON-formaat.', 'error');
        }
      } catch {
        showToast('Fout bij importeren van JSON-bestand.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Verzamel ventrale punten afhankelijk van editTarget
  const ventralPoints = useMemo<EditablePoint[]>(() => {
    if (editTarget === 'bones') {
      return bones
        .filter((bone) => selectedFilterBone === 'all' || bone.id === selectedFilterBone)
        .flatMap((bone) =>
          bone.markers
            .map((marker, markerIndex) => ({
              id: `bone-${bone.id}-${markerIndex}`,
              name: bone.latinName,
              subName: bone.dutchName + (marker.subpart ? ` • ${marker.subpart}` : ''),
              x: marker.x,
              y: marker.y,
              type: 'bone' as const,
              boneId: bone.id,
              markerIndex,
              side: marker.side,
              view: marker.view === 'both' ? 'ventral' : marker.view,
            }))
            .filter((_, idx) => {
              const m = bone.markers[idx];
              return m.view === 'ventral' || m.view === 'both';
            })
        );
    } else {
      return structures
        .filter((s) => s.view === 'ventral' || s.view === 'both')
        .filter((s) => selectedFilterBone === 'all' || s.boneId === selectedFilterBone)
        .map((s) => {
          const bone = bones.find((b) => b.id === s.boneId);
          return {
            id: s.id,
            name: s.fullName || s.name,
            rawName: s.name,
            subName: bone ? `Botstructuur • ${bone.latinName}` : undefined,
            x: s.x,
            y: s.y,
            type: 'structure' as const,
            boneId: s.boneId,
            side: s.side,
            view: s.view === 'both' ? 'ventral' : s.view,
          };
        });
    }
  }, [editTarget, bones, structures, selectedFilterBone]);

  // Verzamel dorsale punten afhankelijk van editTarget
  const dorsalPoints = useMemo<EditablePoint[]>(() => {
    if (editTarget === 'bones') {
      return bones
        .filter((bone) => selectedFilterBone === 'all' || bone.id === selectedFilterBone)
        .flatMap((bone) =>
          bone.markers
            .map((marker, markerIndex) => ({
              id: `bone-${bone.id}-${markerIndex}`,
              name: bone.latinName,
              subName: bone.dutchName + (marker.subpart ? ` • ${marker.subpart}` : ''),
              x: marker.x,
              y: marker.y,
              type: 'bone' as const,
              boneId: bone.id,
              markerIndex,
              side: marker.side,
              view: marker.view === 'both' ? 'dorsal' : marker.view,
            }))
            .filter((_, idx) => {
              const m = bone.markers[idx];
              return m.view === 'dorsal' || m.view === 'both';
            })
        );
    } else {
      return structures
        .filter((s) => s.view === 'dorsal' || s.view === 'both')
        .filter((s) => selectedFilterBone === 'all' || s.boneId === selectedFilterBone)
        .map((s) => {
          const bone = bones.find((b) => b.id === s.boneId);
          return {
            id: s.id,
            name: s.fullName || s.name,
            rawName: s.name,
            subName: bone ? `Botstructuur • ${bone.latinName}` : undefined,
            x: s.x,
            y: s.y,
            type: 'structure' as const,
            boneId: s.boneId,
            side: s.side,
            view: s.view === 'both' ? 'dorsal' : s.view,
          };
        });
    }
  }, [editTarget, bones, structures, selectedFilterBone]);

  // Refs voor drag sessie (legt beginposities van symmetrische partners vast bij drag-start)
  interface DragPartnerInfo {
    id: string;
    boneId: string;
    markerIndex?: number;
    x: number;
    y: number;
  }

  interface DragSession {
    pt: EditablePoint;
    partner?: DragPartnerInfo;
    oppPartner?: DragPartnerInfo;
    oppBothPartner?: DragPartnerInfo;
  }

  const activeDragSessionRef = useRef<DragSession | null>(null);

  const handleDragStart = useCallback(
    (pt: EditablePoint) => {
      if (pt.type === 'bone') {
        const bone = bones.find((b) => b.id === pt.boneId);
        if (!bone || pt.markerIndex === undefined) return;
        const ptMarker = bone.markers[pt.markerIndex];

        let partnerInfo: DragPartnerInfo | undefined;
        let oppPartnerInfo: DragPartnerInfo | undefined;
        let oppBothPartnerInfo: DragPartnerInfo | undefined;

        // 1. Symmetrische partner (L <-> R binnen HETZELFDE aanzicht)
        if (liveSymmetry && pt.side && pt.side !== 'midline') {
          const oppSide: 'left' | 'right' = pt.side === 'left' ? 'right' : 'left';
          const partnerIdx = bone.markers.findIndex((m, idx) => {
            if (idx === pt.markerIndex) return false;
            if (m.side !== oppSide) return false;
            if (m.view !== pt.view) return false; // STRICT HETZELFDE AANZICHT!
            if (m.subpart || ptMarker?.subpart) {
              return (m.subpart || '').trim().toLowerCase() === (ptMarker?.subpart || '').trim().toLowerCase();
            }
            return true;
          });
          if (partnerIdx !== -1) {
            const m = bone.markers[partnerIdx];
            partnerInfo = { id: `bone-${pt.boneId}-${partnerIdx}`, boneId: pt.boneId, markerIndex: partnerIdx, x: m.x, y: m.y };
          }
        }

        // 2. Koppel Ventraal <-> Dorsaal (alleen als linkVentralDorsal aan staat!)
        if (linkVentralDorsal && pt.view) {
          const oppView: 'ventral' | 'dorsal' = pt.view === 'ventral' ? 'dorsal' : 'ventral';
          const oppIdx = bone.markers.findIndex((m, idx) => {
            if (idx === pt.markerIndex) return false;
            if (m.view !== oppView) return false;
            if (m.side !== pt.side) return false;
            if (m.subpart || ptMarker?.subpart) {
              return (m.subpart || '').trim().toLowerCase() === (ptMarker?.subpart || '').trim().toLowerCase();
            }
            return true;
          });
          if (oppIdx !== -1) {
            const m = bone.markers[oppIdx];
            oppPartnerInfo = { id: `bone-${pt.boneId}-${oppIdx}`, boneId: pt.boneId, markerIndex: oppIdx, x: m.x, y: m.y };
          }

          if (liveSymmetry && pt.side && pt.side !== 'midline') {
            const oppSide: 'left' | 'right' = pt.side === 'left' ? 'right' : 'left';
            const oppBothIdx = bone.markers.findIndex((m, idx) => {
              if (idx === pt.markerIndex) return false;
              if (m.view !== oppView) return false;
              if (m.side !== oppSide) return false;
              if (m.subpart || ptMarker?.subpart) {
                return (m.subpart || '').trim().toLowerCase() === (ptMarker?.subpart || '').trim().toLowerCase();
              }
              return true;
            });
            if (oppBothIdx !== -1) {
              const m = bone.markers[oppBothIdx];
              oppBothPartnerInfo = { id: `bone-${pt.boneId}-${oppBothIdx}`, boneId: pt.boneId, markerIndex: oppBothIdx, x: m.x, y: m.y };
            }
          }
        }

        activeDragSessionRef.current = {
          pt,
          partner: partnerInfo,
          oppPartner: oppPartnerInfo,
          oppBothPartner: oppBothPartnerInfo,
        };
      } else {
        // STRUCTURES
        let partnerInfo: DragPartnerInfo | undefined;
        let oppPartnerInfo: DragPartnerInfo | undefined;
        let oppBothPartnerInfo: DragPartnerInfo | undefined;

        const ptRaw = (pt.rawName || pt.name).toLowerCase();
        const ptStem = pt.id.replace(/_[lr](?:_[vd])?$/, '');

        // 1. Symmetrische partner (L <-> R binnen HETZELFDE aanzicht!)
        if (liveSymmetry && pt.side && pt.side !== 'midline') {
          const oppSide: 'left' | 'right' = pt.side === 'left' ? 'right' : 'left';
          const partner = structures.find((s) => {
            if (s.id === pt.id) return false;
            if (s.boneId !== pt.boneId) return false;
            if (s.view !== pt.view) return false; // STRICT HETZELFDE AANZICHT!
            if (s.side !== oppSide) return false;
            const sRaw = s.name.toLowerCase();
            const sStem = s.id.replace(/_[lr](?:_[vd])?$/, '');
            return sRaw === ptRaw || sStem === ptStem;
          });
          if (partner) {
            partnerInfo = { id: partner.id, boneId: partner.boneId, x: partner.x, y: partner.y };
          }
        }

        // 2. Koppel Ventraal <-> Dorsaal (alleen als linkVentralDorsal aan staat!)
        if (linkVentralDorsal && pt.view) {
          const oppView: 'ventral' | 'dorsal' = pt.view === 'ventral' ? 'dorsal' : 'ventral';
          const oppPartner = structures.find((s) => {
            if (s.id === pt.id) return false;
            if (s.boneId !== pt.boneId) return false;
            if (s.view !== oppView) return false; // STRICT TEGENOVERGESTELDE VIEW!
            if (s.side !== pt.side) return false; // DEZELFDE KANT!
            const sRaw = s.name.toLowerCase();
            const sStem = s.id.replace(/_[lr]?(?:_[vd])?$/, '');
            return sRaw === ptRaw || sStem === ptStem;
          });
          if (oppPartner) {
            oppPartnerInfo = { id: oppPartner.id, boneId: oppPartner.boneId, x: oppPartner.x, y: oppPartner.y };
          }

          if (liveSymmetry && pt.side && pt.side !== 'midline') {
            const oppSide: 'left' | 'right' = pt.side === 'left' ? 'right' : 'left';
            const oppBothPartner = structures.find((s) => {
              if (s.id === pt.id) return false;
              if (s.boneId !== pt.boneId) return false;
              if (s.view !== oppView) return false;
              if (s.side !== oppSide) return false;
              const sRaw = s.name.toLowerCase();
              const sStem = s.id.replace(/_[lr](?:_[vd])?$/, '');
              return sRaw === ptRaw || sStem === ptStem;
            });
            if (oppBothPartner) {
              oppBothPartnerInfo = { id: oppBothPartner.id, boneId: oppBothPartner.boneId, x: oppBothPartner.x, y: oppBothPartner.y };
            }
          }
        }

        activeDragSessionRef.current = {
          pt,
          partner: partnerInfo,
          oppPartner: oppPartnerInfo,
          oppBothPartner: oppBothPartnerInfo,
        };
      }
    },
    [bones, structures, liveSymmetry, linkVentralDorsal]
  );

  const handleDragEnd = useCallback(() => {
    activeDragSessionRef.current = null;
  }, []);

  // Algemene update handler met relatieve delta (huidige positie + dx, dy)
  const handleUpdatePoint = useCallback(
    (pt: EditablePoint, x: number, y: number, deltaX: number = 0, deltaY: number = 0) => {
      if (pt.type === 'bone') {
        if (pt.markerIndex !== undefined) {
          const updates: Array<{ boneId: string; markerIndex: number; x: number; y: number }> = [
            { boneId: pt.boneId, markerIndex: pt.markerIndex, x, y },
          ];

          const session = activeDragSessionRef.current;
          if (session && session.pt.id === pt.id) {
            // 1. Symmetrische partner (L <-> R binnen HETZELFDE aanzicht)
            if (liveSymmetry && session.partner && session.partner.markerIndex !== undefined) {
              const newPartnerX = Math.max(0.02, Math.min(0.98, Number((session.partner.x - deltaX).toFixed(4))));
              const newPartnerY = Math.max(0.01, Math.min(0.99, Number((session.partner.y + deltaY).toFixed(4))));
              updates.push({
                boneId: session.partner.boneId,
                markerIndex: session.partner.markerIndex,
                x: newPartnerX,
                y: newPartnerY,
              });
            }
            // 2. Koppel Ventraal <-> Dorsaal
            if (linkVentralDorsal && session.oppPartner && session.oppPartner.markerIndex !== undefined) {
              const newOppX = Math.max(0.02, Math.min(0.98, Number((session.oppPartner.x - deltaX).toFixed(4))));
              const newOppY = Math.max(0.01, Math.min(0.99, Number((session.oppPartner.y + deltaY).toFixed(4))));
              updates.push({
                boneId: session.oppPartner.boneId,
                markerIndex: session.oppPartner.markerIndex,
                x: newOppX,
                y: newOppY,
              });
            }
            // 3. Beide aan
            if (
              liveSymmetry &&
              linkVentralDorsal &&
              session.oppBothPartner &&
              session.oppBothPartner.markerIndex !== undefined
            ) {
              const newOppBothX = Math.max(0.02, Math.min(0.98, Number((session.oppBothPartner.x + deltaX).toFixed(4))));
              const newOppBothY = Math.max(0.01, Math.min(0.99, Number((session.oppBothPartner.y + deltaY).toFixed(4))));
              updates.push({
                boneId: session.oppBothPartner.boneId,
                markerIndex: session.oppBothPartner.markerIndex,
                x: newOppBothX,
                y: newOppBothY,
              });
            }
          }

          updateBonePoints(updates);
        }
      } else {
        // STRUCTURES
        const updates: Array<{ id: string; x: number; y: number }> = [{ id: pt.id, x, y }];
        const session = activeDragSessionRef.current;

        if (session && session.pt.id === pt.id) {
          // 1. Live Symmetrie L <-> R (STRIKT BINNEN HETZELFDE AANZICHT!)
          if (liveSymmetry && session.partner) {
            const newPartnerX = Math.max(0.02, Math.min(0.98, Number((session.partner.x - deltaX).toFixed(4))));
            const newPartnerY = Math.max(0.01, Math.min(0.99, Number((session.partner.y + deltaY).toFixed(4))));
            updates.push({ id: session.partner.id, x: newPartnerX, y: newPartnerY });
          }

          // 2. Koppel Ventraal <-> Dorsaal (alleen als linkVentralDorsal aan staat!)
          if (linkVentralDorsal && session.oppPartner) {
            const newOppX = Math.max(0.02, Math.min(0.98, Number((session.oppPartner.x - deltaX).toFixed(4))));
            const newOppY = Math.max(0.01, Math.min(0.99, Number((session.oppPartner.y + deltaY).toFixed(4))));
            updates.push({ id: session.oppPartner.id, x: newOppX, y: newOppY });
          }

          // 3. Beide aan
          if (liveSymmetry && linkVentralDorsal && session.oppBothPartner) {
            const newOppBothX = Math.max(0.02, Math.min(0.98, Number((session.oppBothPartner.x + deltaX).toFixed(4))));
            const newOppBothY = Math.max(0.01, Math.min(0.99, Number((session.oppBothPartner.y + deltaY).toFixed(4))));
            updates.push({ id: session.oppBothPartner.id, x: newOppBothX, y: newOppBothY });
          }
        }

        updateStructurePoints(updates);
      }
    },
    [updateBonePoints, updateStructurePoints, liveSymmetry, linkVentralDorsal]
  );

  // Nieuwe botstructuur toevoegen op aangegeven positie
  const handleCreateStructureAt = useCallback(
    (_view: 'ventral' | 'dorsal', x: number, y: number) => {
      const cleanName = newStructName.trim();
      if (!cleanName) {
        showToast('Vul eerst een naam in voor de nieuwe botstructuur', 'warning');
        return;
      }

      const screenLeftX = Math.min(x, Number((1.0 - x).toFixed(4)));
      const screenRightX = Math.max(x, Number((1.0 - x).toFixed(4)));
      const clampedY = Math.max(0.01, Math.min(0.99, Number(y.toFixed(4))));

      const slug = cleanName
        .toLowerCase()
        .replace(/[^a-z0-9]/g, '_')
        .replace(/_+/g, '_')
        .replace(/^_|_$/g, '');
      const uniqueSuffix = Date.now().toString().slice(-4);
      const stem = `${newStructBoneId}_${slug}_${uniqueSuffix}`;

      const newPoints: BoneStructurePoint[] = [];

      // Ventraal: screenLeftX = anatomisch rechts, screenRightX = anatomisch links
      if (newStructViewMode === 'ventral' || newStructViewMode === 'both') {
        newPoints.push({
          id: `${stem}_r_v`,
          boneId: newStructBoneId,
          name: cleanName,
          fullName: cleanName,
          view: 'ventral',
          side: 'right',
          x: screenLeftX,
          y: clampedY,
        });
        newPoints.push({
          id: `${stem}_l_v`,
          boneId: newStructBoneId,
          name: cleanName,
          fullName: cleanName,
          view: 'ventral',
          side: 'left',
          x: screenRightX,
          y: clampedY,
        });
      }

      // Dorsaal: screenLeftX = anatomisch links, screenRightX = anatomisch rechts
      if (newStructViewMode === 'dorsal' || newStructViewMode === 'both') {
        newPoints.push({
          id: `${stem}_l_d`,
          boneId: newStructBoneId,
          name: cleanName,
          fullName: cleanName,
          view: 'dorsal',
          side: 'left',
          x: screenLeftX,
          y: clampedY,
        });
        newPoints.push({
          id: `${stem}_r_d`,
          boneId: newStructBoneId,
          name: cleanName,
          fullName: cleanName,
          view: 'dorsal',
          side: 'right',
          x: screenRightX,
          y: clampedY,
        });
      }

      addStructurePoints(newPoints, cleanName, newStructBoneId);

      // Zorg dat het actieve filter switcht naar dit bot zodat de nieuwe punten direct zichtbaar zijn
      if (selectedFilterBone !== 'all' && selectedFilterBone !== newStructBoneId) {
        setSelectedFilterBone(newStructBoneId);
      }

      const boneName = bones.find((b) => b.id === newStructBoneId)?.latinName || newStructBoneId;
      showToast(
        `Structuur '${cleanName}' succesvol toegevoegd aan ${boneName} (${newPoints.length} punten, L & R)!`,
        'success'
      );
      setIsAddingStructure(false);
      setNewStructName('');
    },
    [newStructName, newStructBoneId, newStructViewMode, addStructurePoints, selectedFilterBone, bones, showToast]
  );

  const handleDeleteStructure = useCallback(
    (structureName: string, boneId: string) => {
      deleteStructurePoints(structureName, boneId);
      showToast(`Structuur '${structureName}' verwijderd (L + R)`, 'info');
    },
    [deleteStructurePoints, showToast]
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 py-2 flex flex-col h-[calc(100vh-8.5rem)] min-h-[680px]">
      {/* Bovenste werkbalk met tabs, filters, spiegelfuncties en acties */}
      <div className="w-full flex flex-wrap items-center justify-between gap-2 pb-2 mb-2 border-b border-clinical-100 text-xs">
        {/* Linkerzijde: Schakelaar tussen Botten en Botstructuren + Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200 shadow-2xs">
            <button
              type="button"
              onClick={() => setEditTarget('structures')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                editTarget === 'structures'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              📍 Botstructuren ({structures.length})
            </button>
            <button
              type="button"
              onClick={() => setEditTarget('bones')}
              className={`px-3 py-1.5 text-xs font-bold rounded-lg transition ${
                editTarget === 'bones'
                  ? 'bg-white text-sky-950 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              🦴 Hoofd-botten ({bones.length})
            </button>
          </div>

          {/* Filter per bot */}
          <div className="flex items-center gap-1.5 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1">
            <Filter className="w-3.5 h-3.5 text-slate-500" />
            <select
              value={selectedFilterBone}
              onChange={(e) => setSelectedFilterBone(e.target.value)}
              className="text-xs font-semibold text-slate-800 bg-transparent focus:outline-none cursor-pointer"
            >
              {editTarget === 'structures' ? (
                <>
                  <option value="all">Alle botten ({structures.length} structuren)</option>
                  {bones
                    .filter((b) => b.structures && b.structures.length > 0)
                    .map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.latinName} ({structures.filter((s) => s.boneId === b.id).length})
                      </option>
                    ))}
                </>
              ) : (
                <>
                  <option value="all">Alle botten ({bones.length} botten)</option>
                  {bones.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.latinName} ({b.markers.length} markers)
                    </option>
                  ))}
                </>
              )}
            </select>
          </div>

          {/* Knop: Structuur toevoegen */}
          {editTarget === 'structures' && (
            <button
              type="button"
              onClick={() => {
                if (!isAddingStructure && selectedFilterBone !== 'all') {
                  setNewStructBoneId(selectedFilterBone);
                }
                setIsAddingStructure((prev) => !prev);
              }}
              className={`px-2.5 py-1 rounded-xl border font-bold text-xs flex items-center gap-1.5 shadow-2xs transition active:scale-95 ${
                isAddingStructure
                  ? 'bg-sky-600 text-white border-sky-600 ring-2 ring-sky-300'
                  : 'bg-white hover:bg-sky-50 text-sky-700 border-sky-300 hover:border-sky-400'
              }`}
              title="Voeg een nieuwe botstructuur toe (L + R, ventraal en/of dorsaal)"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Structuur toevoegen</span>
            </button>
          )}

        </div>

        {/* Midden tools: Spiegelen L↔R en optionele koppeling Ventraal ↔ Dorsaal */}
        <div className="flex flex-wrap items-center gap-1.5">
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1">
            <label
              className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-slate-700"
              title="Wanneer actief: bij het verslepen van een punt (links of rechts) beweegt het tegenoverliggende punt binnen DITZELFDE aanzicht synchroon mee"
            >
              <input
                type="checkbox"
                checked={liveSymmetry}
                onChange={(e) => setLiveSymmetry(e.target.checked)}
                className="w-3.5 h-3.5 text-sky-600 rounded accent-sky-600"
              />
              <span>Spiegelen L↔R</span>
            </label>
          </div>

          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2.5 py-1">
            <label
              className="flex items-center gap-1.5 cursor-pointer select-none text-[11px] font-bold text-slate-700"
              title="Wanneer UIT (standaard): ventraal en dorsaal zijn 100% onafhankelijk. Wanneer AAN: aanpassingen op ventraal worden ook automatisch gespiegeld naar dorsaal overgenomen."
            >
              <input
                type="checkbox"
                checked={linkVentralDorsal}
                onChange={(e) => setLinkVentralDorsal(e.target.checked)}
                className="w-3.5 h-3.5 text-sky-600 rounded accent-sky-600"
              />
              <span>Koppel Ventraal ↔ Dorsaal</span>
            </label>
          </div>

          {/* Knoppen Kopieer L ➔ R, R ➔ L en aanzichten */}
          <div className="flex items-center gap-1 bg-slate-50 border border-slate-200/90 rounded-xl px-2 py-0.5">
            <button
              type="button"
              onClick={() => {
                if (editTarget === 'structures') {
                  mirrorStructureSides(selectedFilterBone, 'all', 'left');
                  showToast(
                    selectedFilterBone === 'all'
                      ? 'Alle linkerpunten gekopieerd en gespiegeld naar rechts'
                      : `Linkerpunten naar rechts gespiegeld (${bones.find((b) => b.id === selectedFilterBone)?.latinName})`,
                    'success'
                  );
                } else {
                  mirrorBoneSides(selectedFilterBone, 'all', 'left');
                  showToast('Linker botpunten naar rechts gespiegeld', 'success');
                }
              }}
              className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1 text-[11px] active:scale-95"
              title="Kopieer alle punten van Links naar Rechts (horizontaal gespiegeld binnen hun eigen aanzicht)"
            >
              <span>Kopieer L ➔ R</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (editTarget === 'structures') {
                  mirrorStructureSides(selectedFilterBone, 'all', 'right');
                  showToast(
                    selectedFilterBone === 'all'
                      ? 'Alle rechterpunten gekopieerd en gespiegeld naar links'
                      : `Rechterpunten naar links gespiegeld (${bones.find((b) => b.id === selectedFilterBone)?.latinName})`,
                    'success'
                  );
                } else {
                  mirrorBoneSides(selectedFilterBone, 'all', 'right');
                  showToast('Rechter botpunten naar links gespiegeld', 'success');
                }
              }}
              className="px-2 py-1 rounded-lg bg-white hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 shadow-2xs transition flex items-center gap-1 text-[11px] active:scale-95"
              title="Kopieer alle punten van Rechts naar Links (horizontaal gespiegeld binnen hun eigen aanzicht)"
            >
              <span>Kopieer R ➔ L</span>
            </button>

            <div className="w-[1px] h-3.5 bg-slate-300 mx-0.5" />
            <button
              type="button"
              onClick={() => {
                if (editTarget === 'structures') {
                  copyStructureView('ventral', selectedFilterBone);
                  showToast('Ventrale structuren gekopieerd naar dorsaal', 'success');
                } else {
                  copyBoneView('ventral', selectedFilterBone);
                  showToast('Ventrale botten gekopieerd naar dorsaal', 'success');
                }
              }}
              className="px-1.5 py-1 rounded-lg hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-semibold transition text-[10.5px] active:scale-95"
              title="Kopieer ventrale aanzichtposities naar het dorsale aanzicht (sagittaal gespiegeld)"
            >
              <span>V ➔ D</span>
            </button>
            <button
              type="button"
              onClick={() => {
                if (editTarget === 'structures') {
                  copyStructureView('dorsal', selectedFilterBone);
                  showToast('Dorsale structuren gekopieerd naar ventraal', 'success');
                } else {
                  copyBoneView('dorsal', selectedFilterBone);
                  showToast('Dorsale botten gekopieerd naar ventraal', 'success');
                }
              }}
              className="px-1.5 py-1 rounded-lg hover:bg-sky-50 hover:text-sky-700 text-slate-600 font-semibold transition text-[10.5px] active:scale-95"
              title="Kopieer dorsale aanzichtposities naar het ventrale aanzicht (sagittaal gespiegeld)"
            >
              <span>D ➔ V</span>
            </button>
          </div>
        </div>

        {/* Rechterzijde: Knoppen voor Opslaan, Herstellen en JSON */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToDisk}
            className="px-3 py-1.5 rounded-xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Sla huidige posities permanent op in de broncode op schijf"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Opslaan...' : 'Opslaan naar bronbestand'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (
                confirm(
                  editTarget === 'bones'
                    ? 'Weet je zeker dat je alle botpunten wilt herstellen naar de standaardwaarden?'
                    : 'Weet je zeker dat je alle botstructuren wilt herstellen naar de standaardwaarden?'
                )
              ) {
                if (editTarget === 'bones') {
                  resetBones();
                } else {
                  resetStructures();
                }
                showToast('Standaardwaarden hersteld', 'info');
              }
            }}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Herstellen</span>
          </button>

          <button
            type="button"
            onClick={editTarget === 'bones' ? exportBonesJson : exportStructuresJson}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Download huidige data als JSON bestand"
          >
            <Download className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Exporteer</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-2.5 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Upload een eerder opgeslagen JSON bestand"
          >
            <Upload className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Importeer</span>
          </button>

          <input
            ref={fileInputRef}
            type="file"
            accept=".json,application/json"
            onChange={handleFileUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Paneel voor het toevoegen van een nieuwe botstructuur */}
      {isAddingStructure && (
        <div className="w-full bg-sky-50/95 border-2 border-sky-300 rounded-2xl p-2.5 sm:p-3 mb-2 flex flex-wrap items-center justify-between gap-3 text-xs shadow-md animate-in fade-in duration-150 shrink-0">
          <div className="flex flex-wrap items-center gap-2.5">
            {/* 1. Naam van de structuur */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-sky-950">Naam:</label>
              <input
                type="text"
                autoFocus
                value={newStructName}
                onChange={(e) => setNewStructName(e.target.value)}
                placeholder="bijv. Tuberositas tibiae"
                className="px-2.5 py-1.5 rounded-xl bg-white border border-sky-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 w-44 sm:w-56 shadow-2xs"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newStructName.trim()) {
                    handleCreateStructureAt('ventral', 0.42, 0.5);
                  }
                }}
              />
            </div>

            {/* 2. Bij welk bot hoort het */}
            <div className="flex items-center gap-1.5">
              <label className="font-bold text-sky-950">Bot:</label>
              <select
                value={newStructBoneId}
                onChange={(e) => setNewStructBoneId(e.target.value)}
                className="px-2.5 py-1.5 rounded-xl bg-white border border-sky-300 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-sky-500 cursor-pointer shadow-2xs"
              >
                {bones.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.latinName} ({b.dutchName})
                  </option>
                ))}
              </select>
            </div>

            {/* 3. Aanzicht(en): Ventraal, Dorsaal, Zowel */}
            <div className="flex items-center gap-1 bg-white p-0.5 rounded-xl border border-sky-300 shadow-2xs">
              <button
                type="button"
                onClick={() => setNewStructViewMode('both')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  newStructViewMode === 'both' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Plaats zowel op Ventraal (L+R) als op Dorsaal (L+R)"
              >
                Zowel V & D (4 pnt)
              </button>
              <button
                type="button"
                onClick={() => setNewStructViewMode('ventral')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  newStructViewMode === 'ventral' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Alleen op Ventraal (L+R)"
              >
                Ventraal (L+R)
              </button>
              <button
                type="button"
                onClick={() => setNewStructViewMode('dorsal')}
                className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition ${
                  newStructViewMode === 'dorsal' ? 'bg-sky-600 text-white shadow-2xs' : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Alleen op Dorsaal (L+R)"
              >
                Dorsaal (L+R)
              </button>
            </div>
          </div>

          {/* Instructie & Knoppen */}
          <div className="flex items-center gap-2">
            <div className="hidden xl:flex items-center gap-1.5 text-sky-900 font-semibold text-[11px]">
              <span>👉 Klik op skelet om te plaatsen (L & R automatisch gespiegeld) of:</span>
            </div>

            <button
              type="button"
              disabled={!newStructName.trim()}
              onClick={() => handleCreateStructureAt('ventral', 0.42, 0.5)}
              className="px-3 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-700 disabled:opacity-50 text-white font-bold text-xs transition shadow-2xs active:scale-95 flex items-center gap-1"
              title="Plaats direct in centrum"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Centrum plaatsen</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setIsAddingStructure(false);
                setNewStructName('');
              }}
              className="p-1.5 rounded-xl text-slate-500 hover:text-slate-800 hover:bg-sky-200/60 transition"
              title="Annuleren"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Beide views naast elkaar: Ventraal links, Dorsaal rechts (onafhankelijk zoomen & pannen) */}
      <div className="flex-1 min-h-0 w-full bg-white rounded-3xl p-3 border border-clinical-200/90 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        {/* Ventraal links */}
        <div className="relative w-full h-full min-w-0 min-h-0 flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-2 overflow-hidden">
          <span className="absolute top-2 left-3 text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md z-20 shadow-2xs">
            Ventraal ({ventralPoints.length} punten)
          </span>
          <DraggableSkeleton
            view="ventral"
            points={ventralPoints}
            hidePopup={hidePopup}
            onToggleHidePopup={() => setHidePopup((h) => !h)}
            onDragStart={handleDragStart}
            onUpdatePoint={handleUpdatePoint}
            onDragEnd={handleDragEnd}
            isPlacingPoint={isAddingStructure}
            onPlacePoint={handleCreateStructureAt}
            onDeleteStructure={handleDeleteStructure}
          />
        </div>

        {/* Dorsaal rechts */}
        <div className="relative w-full h-full min-w-0 min-h-0 flex flex-col items-center justify-center pl-0 md:pl-2 overflow-hidden">
          <span className="absolute top-2 left-3 text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md z-20 shadow-2xs">
            Dorsaal ({dorsalPoints.length} punten)
          </span>
          <DraggableSkeleton
            view="dorsal"
            points={dorsalPoints}
            hidePopup={hidePopup}
            onToggleHidePopup={() => setHidePopup((h) => !h)}
            onDragStart={handleDragStart}
            onUpdatePoint={handleUpdatePoint}
            onDragEnd={handleDragEnd}
            isPlacingPoint={isAddingStructure}
            onPlacePoint={handleCreateStructureAt}
            onDeleteStructure={handleDeleteStructure}
          />
        </div>
      </div>
    </div>
  );
};
