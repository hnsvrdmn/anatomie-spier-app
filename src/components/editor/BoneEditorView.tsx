import React, { useState, useRef, useMemo, useCallback, useEffect } from 'react';
import { useBones } from '../../context/BoneContext';
import { useMuscles } from '../../context/MuscleContext';
import { BoneStructurePoint } from '../../data/boneStructures';
import { SKELETON_WIDTH, SKELETON_HEIGHT } from '../../utils/coordinates';
import { ViewToggle, ViewLayoutMode } from '../common/ViewToggle';
import { AnatomicalView } from '../../types/anatomy';
import { RotateCcw, Download, Upload, Save, Eye, EyeOff, ZoomIn, ZoomOut, Hand, MousePointer, Plus, Trash2, X, Copy, ExternalLink, Edit2, ChevronLeft, ChevronRight } from 'lucide-react';

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
  isDeleteMode?: boolean;
  onDeletePoint?: (point: EditablePoint) => void;
  onCopyName?: (name: string) => void;
  onSelectPoint?: (point: EditablePoint) => void;
  highlightedName?: string;
  targetZoom?: number;
  targetPan?: { x: number; y: number };
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
  isDeleteMode = false,
  onDeletePoint,
  onCopyName,
  onSelectPoint,
  highlightedName,
  targetZoom,
  targetPan,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const viewportRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan state
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);

  useEffect(() => {
    if (targetZoom !== undefined) {
      setZoom(targetZoom);
    }
    if (targetPan !== undefined) {
      setPan(targetPan);
    }
  }, [targetZoom, targetPan]);

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

  // Marker drag start of verwijderen in delete-modus
  const handlePointerDownMarker = (e: React.PointerEvent, pt: EditablePoint) => {
    if (isPlacingPoint) return;
    if (isDeleteMode) {
      if (e.button === 0) {
        e.stopPropagation();
        e.preventDefault();
        setHoveredPoint(null);
        onDeletePoint?.(pt);
      }
      return;
    }
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

        {/* Richtinggevende badge bij het verwijderen van een punt */}
        {isDeleteMode && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 z-30 bg-rose-600 text-white px-3 py-1 rounded-full text-[11px] font-bold shadow-md flex items-center gap-1.5 pointer-events-none animate-pulse whitespace-nowrap">
            <Trash2 className="w-3.5 h-3.5" />
            <span>Klik op een punt om te verwijderen</span>
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

            const isSelected = Boolean(highlightedName && (pt.rawName?.toLowerCase() === highlightedName.toLowerCase() || pt.name.toLowerCase() === highlightedName.toLowerCase()));
            const fillColor = isDeleteMode
              ? isHovered
                ? '#ef4444'
                : '#f87171'
              : isDragging
              ? '#0284c7'
              : isSelected
              ? '#0284c7'
              : isHovered
              ? '#0ea5e9'
              : isStructure
              ? '#64748b'
              : '#1993f2';
            const strokeColor = isDeleteMode && isHovered ? '#b91c1c' : '#ffffff';
            const strokeWidth = (isDeleteMode ? (isHovered ? 2.5 : 2) : isDragging ? 2.5 : isStructure ? 1.5 : 2.5) / zoom;

            return (
              <g
                key={pt.id}
                className={
                  isPlacingPoint
                    ? 'pointer-events-none'
                    : isDeleteMode
                    ? 'pointer-events-auto cursor-pointer'
                    : 'pointer-events-auto cursor-grab active:cursor-grabbing'
                }
                onPointerDown={(e) => {
                  handlePointerDownMarker(e, pt);
                  if (!isDeleteMode && e.button === 0) onSelectPoint?.(pt);
                }}
                onClick={(e) => {
                  e.stopPropagation();
                  if (!isDeleteMode) onSelectPoint?.(pt);
                }}
                onContextMenu={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onDeletePoint?.(pt);
                }}
                onDoubleClick={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  onCopyName?.(pt.rawName || pt.name);
                }}
                onMouseEnter={() => setHoveredPoint(pt)}
                onMouseLeave={() => {
                  if (!isDraggingMarkerRef.current) setHoveredPoint(null);
                }}
              >
                {/* Ruim klik- en sleepgebied */}
                <circle cx={cx} cy={cy} r={hitRadius} fill="transparent" />

                {/* Geanimeerde highlight ring indien geselecteerd via Vorige/Volgende */}
                {highlightedName && (pt.rawName?.toLowerCase() === highlightedName.toLowerCase() || pt.name.toLowerCase() === highlightedName.toLowerCase()) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius + 8 / zoom}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth={2.5 / zoom}
                    strokeDasharray={`${4 / zoom} ${3 / zoom}`}
                    className="animate-spin pointer-events-none"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />
                )}

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
                      isDeleteMode && isHovered
                        ? 'drop-shadow(0px 2px 8px rgba(239, 68, 68, 0.6))'
                        : isDragging || isHovered
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

                  {isDeleteMode && (
                    <div className="mt-1.5 px-2.5 py-1 rounded-lg bg-rose-600/30 text-rose-300 border border-rose-500/40 text-[11px] font-bold flex items-center gap-1.5">
                      <Trash2 className="w-3.5 h-3.5 text-rose-400" />
                      <span>Klik om te verwijderen</span>
                    </div>
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
    deleteBonePoint,
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
    renameStructure,
  } = useBones();
  const { showToast } = useMuscles();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [currentView, setCurrentView] = useState<AnatomicalView>('ventral');
  const [viewLayout, setViewLayout] = useState<ViewLayoutMode>('both');

  // Keuze tussen het bewerken van 'bones' (hoofd-botposities) of 'structures' (relevante botstructuren)
  const [editTarget, setEditTarget] = useState<'bones' | 'structures' | 'vertebrae_ribs'>('structures');
  // Optioneel filter per bot wanneer structuren worden bewerkt
  const [selectedFilterBone, setSelectedFilterBone] = useState<string>('all');

  // Toevoegen van nieuwe botstructuren
  const [isAddingStructure, setIsAddingStructure] = useState(false);
  const [newStructName, setNewStructName] = useState('');
  const [newStructBoneId, setNewStructBoneId] = useState<string>('os_coxae');
  const [newStructViewMode, setNewStructViewMode] = useState<'ventral' | 'dorsal' | 'both'>('both');

  // Verwijder-modus via klik op een punt (icoontje van prullenbak)
  const [isDeleteMode, setIsDeleteMode] = useState(false);

  // Undo / Ongedaan maken geschiedenis voor botten en botstructuren
  interface BoneHistorySnapshot {
    bones: typeof bones;
    structures: typeof structures;
  }
  const [boneHistory, setBoneHistory] = useState<BoneHistorySnapshot[]>([]);

  const pushBoneHistory = useCallback(() => {
    setBoneHistory((prev) => [
      ...prev.slice(-25),
      {
        bones: JSON.parse(JSON.stringify(bones)),
        structures: JSON.parse(JSON.stringify(structures)),
      },
    ]);
  }, [bones, structures]);

  // Navigatie door botten (< en >)
  const allBoneFilterOptions = useMemo(() => ['all', ...bones.map((b) => b.id)], [bones]);
  const handlePrevBone = useCallback(() => {
    const idx = allBoneFilterOptions.indexOf(selectedFilterBone);
    const prevIdx = (idx - 1 + allBoneFilterOptions.length) % allBoneFilterOptions.length;
    setSelectedFilterBone(allBoneFilterOptions[prevIdx]);
  }, [allBoneFilterOptions, selectedFilterBone]);

  const handleNextBone = useCallback(() => {
    const idx = allBoneFilterOptions.indexOf(selectedFilterBone);
    const nextIdx = (idx + 1) % allBoneFilterOptions.length;
    setSelectedFilterBone(allBoneFilterOptions[nextIdx]);
  }, [allBoneFilterOptions, selectedFilterBone]);

  // Unieke structuren voor het geselecteerde bot/overzicht
  const activeStructuresList = useMemo(() => {
    if (editTarget === 'vertebrae_ribs') {
      const allowed = new Set(['os_vertebra', 'os_costa', 'os_sternum']);
      if (selectedFilterBone === 'all') {
        return structures.filter((s) => allowed.has(s.boneId));
      }
      return structures.filter((s) => s.boneId === selectedFilterBone);
    }
    if (selectedFilterBone === 'all') return structures;
    return structures.filter((s) => s.boneId === selectedFilterBone);
  }, [structures, selectedFilterBone, editTarget]);

  const uniqueStructures = useMemo(() => {
    const map = new Map<string, BoneStructurePoint>();
    activeStructuresList.forEach((s) => {
      const raw = s.name.toLowerCase().trim();
      if (!map.has(raw)) map.set(raw, s);
    });
    return Array.from(map.values());
  }, [activeStructuresList]);

  const [selectedStructIdx, setSelectedStructIdx] = useState<number>(0);

  // Zorg dat geselecteerde structuur bewaard of geactiveerd wordt bij filterwissel
  const pendingSelectedNameRef = useRef<string | null>(null);

  useEffect(() => {
    if (pendingSelectedNameRef.current) {
      const target = pendingSelectedNameRef.current.toLowerCase().trim();
      const foundIdx = uniqueStructures.findIndex((s) => s.name.toLowerCase().trim() === target);
      if (foundIdx !== -1) {
        setSelectedStructIdx(foundIdx);
      } else {
        setSelectedStructIdx(0);
      }
      pendingSelectedNameRef.current = null;
    } else {
      setSelectedStructIdx(0);
    }
  }, [selectedFilterBone, uniqueStructures, editTarget]);

  // Klikken op een bot- of structuurpunt selecteert direct deze structuur
  const handleSelectPoint = useCallback((pt: EditablePoint) => {
    if (pt.type === 'structure') {
      if (editTarget !== 'vertebrae_ribs') {
        setEditTarget('structures');
      }
      const raw = (pt.rawName || pt.name).trim();
      pendingSelectedNameRef.current = raw;
      if (selectedFilterBone !== 'all' && pt.boneId && selectedFilterBone !== pt.boneId) {
        setSelectedFilterBone(pt.boneId);
      } else {
        const idx = uniqueStructures.findIndex(
          (s) => s.name.toLowerCase().trim() === raw.toLowerCase()
        );
        if (idx !== -1) {
          setSelectedStructIdx(idx);
          pendingSelectedNameRef.current = null;
        }
      }
    } else if (pt.type === 'bone') {
      setSelectedFilterBone(pt.boneId);
    }
  }, [selectedFilterBone, uniqueStructures, editTarget]);

  const currentActiveStructure = uniqueStructures[selectedStructIdx] || null;

  const handlePrevStructure = useCallback(() => {
    if (uniqueStructures.length === 0) return;
    setSelectedStructIdx((prev) => (prev - 1 + uniqueStructures.length) % uniqueStructures.length);
  }, [uniqueStructures.length]);

  const handleNextStructure = useCallback(() => {
    if (uniqueStructures.length === 0) return;
    setSelectedStructIdx((prev) => (prev + 1) % uniqueStructures.length);
  }, [uniqueStructures.length]);

  // Kopiëren van naam naar klembord
  const handleCopyName = useCallback((name: string) => {
    navigator.clipboard.writeText(name);
    showToast(`'${name}' gekopieerd naar klembord`, 'success');
  }, [showToast]);

  // Open Google Zoeken in een compacte losse popup in plaats van een nieuw tabblad
  const handleOpenGoogleSearch = useCallback((name: string) => {
    const url = `https://www.google.com/search?q=${encodeURIComponent(name + ' anatomie')}`;
    const width = 850;
    const height = 750;
    const left = Math.round(window.screen.width / 2 - width / 2);
    const top = Math.round(window.screen.height / 2 - height / 2);
    window.open(
      url,
      'google_search_popup',
      `width=${width},height=${height},top=${top},left=${left},scrollbars=yes,resizable=yes,status=no,location=yes,toolbar=no,menubar=no`
    );
  }, []);

  // Hernoemen van een structuur
  const [editingPoint, setEditingPoint] = useState<EditablePoint | null>(null);
  const [renameInputValue, setRenameInputValue] = useState('');

  const handleStartRename = useCallback((pt: EditablePoint) => {
    setEditingPoint(pt);
    setRenameInputValue(pt.rawName || pt.name);
  }, []);

  const handleConfirmRename = useCallback(() => {
    if (!editingPoint) return;
    const oldName = editingPoint.rawName || editingPoint.name;
    const newName = renameInputValue.trim();
    if (newName && newName !== oldName) {
      pushBoneHistory();
      renameStructure(oldName, newName, editingPoint.boneId);
      showToast(`Structuurnaam gewijzigd naar '${newName}'`, 'success');
    }
    setEditingPoint(null);
    setRenameInputValue('');
  }, [editingPoint, renameInputValue, pushBoneHistory, renameStructure, showToast]);

  const handleUndo = useCallback(() => {
    if (boneHistory.length === 0) return;
    const previous = boneHistory[boneHistory.length - 1];
    setBoneHistory((prev) => prev.slice(0, -1));
    importBonesJson(previous.bones);
    importStructuresJson(previous.structures);
    showToast('Laatste botbewerking ongedaan gemaakt (Ctrl+Z)', 'info');
  }, [boneHistory, importBonesJson, importStructuresJson, showToast]);

  // Luister naar toetsenbord shortcuts: Ctrl+Z (undo) & Pijltjestoetsen links/rechts (vorige/volgende structuur)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const target = e.target as HTMLElement | null;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable)) {
        return;
      }
      if (editingPoint) return;

      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z' && !e.shiftKey) {
        e.preventDefault();
        e.stopPropagation();
        handleUndo();
        return;
      }

      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        e.stopPropagation();
        handlePrevStructure();
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        e.stopPropagation();
        handleNextStructure();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleUndo, handlePrevStructure, handleNextStructure, editingPoint]);

  // Escape toets om delete-modus of toevoegen-paneel te sluiten
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsDeleteMode(false);
        setIsAddingStructure(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

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

  const handleExportJson = () => {
    if (editTarget === 'bones') {
      exportBonesJson();
    } else {
      exportStructuresJson();
    }
  };

  const handleResetAll = () => {
    if (window.confirm(editTarget === 'bones' ? 'Weet je zeker dat je alle botten wilt resetten naar de standaard?' : 'Weet je zeker dat je alle botstructuren wilt resetten naar de standaard?')) {
      if (editTarget === 'bones') {
        resetBones();
      } else {
        resetStructures();
      }
    }
  };

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
    if (editTarget === 'vertebrae_ribs') {
      const allowedBones = new Set(['os_vertebra', 'os_costa', 'os_sternum']);
      return structures
        .filter((s) => s.view === 'ventral' || s.view === 'both')
        .filter((s) => selectedFilterBone === 'all' ? allowedBones.has(s.boneId) : s.boneId === selectedFilterBone)
        .map((s) => {
          const bone = bones.find((b) => b.id === s.boneId);
          return {
            id: s.id,
            name: s.fullName || s.name,
            rawName: s.name,
            subName: bone ? `Romp • ${bone.latinName}` : undefined,
            x: s.x,
            y: s.y,
            type: 'structure' as const,
            boneId: s.boneId,
            side: s.side,
            view: s.view === 'both' ? 'ventral' : s.view,
          };
        });
    } else if (editTarget === 'bones') {
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
    if (editTarget === 'vertebrae_ribs') {
      const allowedBones = new Set(['os_vertebra', 'os_costa', 'os_sternum']);
      return structures
        .filter((s) => s.view === 'dorsal' || s.view === 'both')
        .filter((s) => selectedFilterBone === 'all' ? allowedBones.has(s.boneId) : s.boneId === selectedFilterBone)
        .map((s) => {
          const bone = bones.find((b) => b.id === s.boneId);
          return {
            id: s.id,
            name: s.fullName || s.name,
            rawName: s.name,
            subName: bone ? `Romp • ${bone.latinName}` : undefined,
            x: s.x,
            y: s.y,
            type: 'structure' as const,
            boneId: s.boneId,
            side: s.side,
            view: s.view === 'both' ? 'dorsal' : s.view,
          };
        });
    } else if (editTarget === 'bones') {
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
      pushBoneHistory();
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

      pushBoneHistory();
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

  // Verwijderen van punt via directe klik in de prullenbak-modus
  const handleDeletePoint = useCallback(
    (pt: EditablePoint) => {
      if (pt.type === 'structure') {
        const name = pt.rawName || pt.name;
        if (confirm(`Weet je zeker dat je structuur '${name}' wilt verwijderen (links én rechts)?`)) {
          pushBoneHistory();
          deleteStructurePoints(name, pt.boneId);
          showToast(`Structuur '${name}' verwijderd (L + R)`, 'info');
        }
      } else if (pt.type === 'bone' && pt.markerIndex !== undefined) {
        if (confirm(`Weet je zeker dat je botpunt '${pt.name}' wilt verwijderen?`)) {
          pushBoneHistory();
          deleteBonePoint(pt.boneId, pt.markerIndex);
          showToast(`Botpunt '${pt.name}' verwijderd`, 'info');
        }
      }
    },
    [deleteStructurePoints, deleteBonePoint, showToast]
  );

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch select-none">
      <input
        ref={fileInputRef}
        type="file"
        accept=".json"
        onChange={handleFileUpload}
        className="hidden"
      />

      {/* Linker/Midden kolom: Skelet met Vaste Hoogte (exact gelijk aan Spieren tab) */}
      <div className="w-full lg:flex-1 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk: Aanzichtschakelaar gecentreerd (vaste hoogte h-12) */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1">
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {isAddingStructure && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold animate-pulse shadow-2xs">
                <Plus className="w-3.5 h-3.5 text-emerald-600" />
                <span className="truncate">Klik op skelet om '{newStructName || 'nieuwe structuur'}' te plaatsen</span>
              </span>
            )}
            {isDeleteMode && (
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-bold shadow-2xs">
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Klik op een punt om te verwijderen</span>
              </span>
            )}
          </div>

          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              showBothOption={true}
              activeLayout={viewLayout}
              onLayoutChange={setViewLayout}
            />
          </div>

          <div className="flex-1 min-w-0 flex items-center justify-end gap-1.5">
            <button
              type="button"
              onClick={() => setHidePopup((h) => !h)}
              className={`p-2 rounded-xl border text-xs font-semibold flex items-center gap-1.5 transition ${
                hidePopup
                  ? 'bg-amber-50 text-amber-800 border-amber-300 shadow-2xs'
                  : 'bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border-clinical-200/80'
              }`}
              title={hidePopup ? 'Toon pop-up informatie' : 'Verberg pop-up (markers blijven altijd zichtbaar)'}
            >
              {hidePopup ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        {/* Skelet & Overlay Canvas */}
        <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-2 overflow-hidden">
          {viewLayout === 'both' ? (
            <div className="w-full h-full grid grid-cols-1 md:grid-cols-2 gap-3 overflow-hidden">
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
                  isDeleteMode={isDeleteMode}
                  onDeletePoint={handleDeletePoint}
                  onCopyName={handleCopyName}
                  onSelectPoint={handleSelectPoint}
                  highlightedName={currentActiveStructure?.name}
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
                  isDeleteMode={isDeleteMode}
                  onDeletePoint={handleDeletePoint}
                  onCopyName={handleCopyName}
                  onSelectPoint={handleSelectPoint}
                  highlightedName={currentActiveStructure?.name}
                />
              </div>
            </div>
          ) : viewLayout === 'ventral' ? (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
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
                isDeleteMode={isDeleteMode}
                onDeletePoint={handleDeletePoint}
                onCopyName={handleCopyName}
                onSelectPoint={handleSelectPoint}
                highlightedName={currentActiveStructure?.name}
              />
            </div>
          ) : (
            <div className="relative w-full h-full flex items-center justify-center overflow-hidden">
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
                isDeleteMode={isDeleteMode}
                onDeletePoint={handleDeletePoint}
                onCopyName={handleCopyName}
                onSelectPoint={handleSelectPoint}
                highlightedName={currentActiveStructure?.name}
              />
            </div>
          )}
        </div>

        {/* Onderbalk met instructies (vaste h-8) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-between pt-2 border-t border-clinical-100 text-xs text-clinical-500">
          <span className="truncate">
            💡 Klik = selecteren • Dubbelklik = kopiëren • Pijltjestoetsen = ← / → • Rechtsklik = verwijderen
          </span>
          <span className="font-mono text-[11px] text-clinical-400 shrink-0 ml-2">
            {ventralPoints.length} V | {dorsalPoints.length} D
          </span>
        </div>
      </div>

      {/* Rechter Zijpaneel: Editor Bedieningselementen (exact zoals Spieren tab) */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0 overflow-y-auto max-h-[92vh] pr-1 custom-scrollbar">
        {/* 1. Doel & Bot Selecteren Card */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-clinical-700 uppercase tracking-wider">
              {editTarget === 'structures' ? 'Botstructuren' : editTarget === 'bones' ? 'Botten' : 'Wervels & Ribben'} Selecteren
            </label>
            <div className="inline-flex rounded-xl bg-slate-100 p-0.5 border border-slate-200">
              <button
                type="button"
                onClick={() => setEditTarget('structures')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  editTarget === 'structures'
                    ? 'bg-white text-clinical-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Structuren
              </button>
              <button
                type="button"
                onClick={() => setEditTarget('bones')}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  editTarget === 'bones'
                    ? 'bg-white text-clinical-950 shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Botten
              </button>
              <button
                type="button"
                onClick={() => {
                  setEditTarget('vertebrae_ribs');
                  setSelectedFilterBone('all');
                }}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg transition ${
                  editTarget === 'vertebrae_ribs'
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Wervels & Ribben
              </button>
            </div>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handlePrevBone}
              title="Vorig bot (<)"
              className="p-2 bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border border-clinical-200 rounded-xl transition shrink-0 active:scale-95"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <select
              value={selectedFilterBone}
              onChange={(e) => setSelectedFilterBone(e.target.value)}
              className="flex-1 min-w-0 px-2.5 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs font-bold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition truncate"
            >
              {editTarget === 'vertebrae_ribs' ? (
                <>
                  <option value="all">Alle wervels & ribben ({activeStructuresList.length})</option>
                  <option value="os_vertebra">Wervels (os_vertebra)</option>
                  <option value="os_costa">Ribben (os_costa)</option>
                  <option value="os_sternum">Borstbeen (os_sternum)</option>
                </>
              ) : editTarget === 'structures' ? (
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
            <button
              type="button"
              onClick={handleNextBone}
              title="Volgend bot (>)"
              className="p-2 bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border border-clinical-200 rounded-xl transition shrink-0 active:scale-95"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* 2. Actieve Structuur Card met Navigatie en Actieknoppen */}
        {(editTarget === 'structures' || editTarget === 'vertebrae_ribs') && (
          <div className="bg-white p-4 rounded-2xl border border-clinical-200/80 shadow-xs space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-[11px] font-black text-clinical-700 uppercase tracking-wider flex items-center gap-1.5">
                <span>Actieve Structuur</span>
              </label>
              {uniqueStructures.length > 0 && (
                <span className="text-[10px] font-mono font-bold bg-sky-50 text-sky-700 border border-sky-200/80 px-2 py-0.5 rounded-full">
                  {selectedStructIdx + 1} / {uniqueStructures.length}
                </span>
              )}
            </div>

            {currentActiveStructure ? (
              <div className="space-y-2.5">
                <div className="p-3 bg-sky-50/80 rounded-xl border border-sky-200/80">
                  <div className="text-sm font-black text-slate-900 leading-snug break-words">
                    {currentActiveStructure.name}
                  </div>
                  {currentActiveStructure.fullName && currentActiveStructure.fullName !== currentActiveStructure.name && (
                    <div className="text-[11px] font-semibold text-sky-800 pt-0.5">
                      {currentActiveStructure.fullName}
                    </div>
                  )}
                  <div className="text-[10px] text-slate-500 font-medium pt-1">
                    Bot: {bones.find((b) => b.id === currentActiveStructure.boneId)?.latinName || currentActiveStructure.boneId}
                  </div>
                </div>

                {/* Navigatie Vorige / Volgende (< en >) */}
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={handlePrevStructure}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                    title="Vorige structuur (of druk op ←)"
                  >
                    <ChevronLeft className="w-4 h-4 text-slate-500" />
                    <span>Vorige (←)</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleNextStructure}
                    className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs font-bold text-slate-700 flex items-center justify-center gap-1.5 transition active:scale-95 shadow-2xs"
                    title="Volgende structuur (of druk op →)"
                  >
                    <span>Volgende (→)</span>
                    <ChevronRight className="w-4 h-4 text-slate-500" />
                  </button>
                </div>

                {/* 4 Actieknoppen: Kopieer, Google Popup, Hernoem, Verwijder */}
                <div className="grid grid-cols-2 gap-2 pt-1 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => handleCopyName(currentActiveStructure.name)}
                    className="py-2 px-2.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-900 border border-clinical-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title="Kopieer naam naar klembord (of dubbelklik op marker)"
                  >
                    <Copy className="w-3.5 h-3.5 text-blue-600" />
                    <span>Kopieer</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleOpenGoogleSearch(currentActiveStructure.name)}
                    className="py-2 px-2.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-900 border border-clinical-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title="Zoek op Google in een compact popup venster"
                  >
                    <ExternalLink className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Google</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleStartRename({
                      id: currentActiveStructure.id,
                      name: currentActiveStructure.name,
                      rawName: currentActiveStructure.name,
                      x: currentActiveStructure.x,
                      y: currentActiveStructure.y,
                      type: 'structure',
                      boneId: currentActiveStructure.boneId,
                    })}
                    className="py-2 px-2.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-900 border border-clinical-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title="Naam van structuur aanpassen"
                  >
                    <Edit2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Hernoem</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => handleDeletePoint({
                      id: currentActiveStructure.id,
                      name: currentActiveStructure.name,
                      rawName: currentActiveStructure.name,
                      x: currentActiveStructure.x,
                      y: currentActiveStructure.y,
                      type: 'structure',
                      boneId: currentActiveStructure.boneId,
                    })}
                    className="py-2 px-2.5 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition active:scale-95"
                    title="Verwijder structuur (L + R)"
                  >
                    <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                    <span>Verwijder</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="py-4 text-center text-xs text-slate-400">
                Geen structuren gevonden voor dit bot.
              </div>
            )}
          </div>
        )}

        {/* 3. Nieuwe Structuur Toevoegen Card */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/80 shadow-xs space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-[11px] font-black text-clinical-700 uppercase tracking-wider flex items-center gap-1.5">
              <Plus className="w-3.5 h-3.5 text-blue-600" />
              <span>Nieuwe Structuur</span>
            </label>
            {!isAddingStructure ? (
              <button
                type="button"
                onClick={() => setIsAddingStructure(true)}
                className="py-1 px-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-2xs active:scale-95"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Toevoegen</span>
              </button>
            ) : (
              <button
                type="button"
                onClick={() => setIsAddingStructure(false)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
                title="Sluiten"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {isAddingStructure && (
            <div className="space-y-2.5 pt-1 border-t border-slate-100 animate-in fade-in duration-150">
              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Naam structuur:
                </label>
                <input
                  type="text"
                  autoFocus
                  placeholder="bijv. Tuberositas tibiae..."
                  value={newStructName}
                  onChange={(e) => setNewStructName(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Koppel aan bot:
                </label>
                <select
                  value={newStructBoneId}
                  onChange={(e) => setNewStructBoneId(e.target.value)}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-900 focus:bg-white"
                >
                  {bones.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.latinName}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-600 block mb-1">
                  Aanzicht:
                </label>
                <div className="grid grid-cols-3 gap-1">
                  {(['both', 'ventral', 'dorsal'] as const).map((mode) => (
                    <button
                      key={mode}
                      type="button"
                      onClick={() => setNewStructViewMode(mode)}
                      className={`py-1 text-[11px] font-bold rounded-lg border transition ${
                        newStructViewMode === mode
                          ? 'bg-blue-600 text-white border-blue-600 shadow-2xs'
                          : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                      }`}
                    >
                      {mode === 'both' ? 'Beide' : mode === 'ventral' ? 'Ventraal' : 'Dorsaal'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="p-2.5 bg-emerald-50 rounded-xl border border-emerald-200/80 text-[11px] text-emerald-900 leading-snug">
                👉 <strong>Klik nu op het skelet</strong> om de positie te bepalen. De structuur wordt automatisch symmetrisch op links en rechts geplaatst.
              </div>
            </div>
          )}
        </div>

        {/* 4. Hulpmiddelen & Opties Card */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/80 shadow-xs space-y-2.5">
          <label className="text-[11px] font-black text-clinical-700 uppercase tracking-wider block">
            Hulpmiddelen & Opties
          </label>

          <div className="space-y-1.5">
            <button
              type="button"
              onClick={() => setIsDeleteMode((m) => !m)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                isDeleteMode
                  ? 'bg-rose-600 text-white border-rose-600 shadow-sm'
                  : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
              }`}
            >
              <span className="flex items-center gap-2">
                <Trash2 className="w-4 h-4 text-rose-500" />
                <span>Prullenbak-modus</span>
              </span>
              <span className="text-[10px] font-mono uppercase">
                {isDeleteMode ? 'Aan' : 'Uit'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLiveSymmetry((s) => !s)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                liveSymmetry
                  ? 'bg-clinical-50 text-clinical-900 border-clinical-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span>Live symmetrie (L ⇄ R)</span>
              <span className="text-[10px] font-mono uppercase">
                {liveSymmetry ? 'Aan' : 'Uit'}
              </span>
            </button>

            <button
              type="button"
              onClick={() => setLinkVentralDorsal((l) => !l)}
              className={`w-full py-2 px-3 rounded-xl border text-xs font-bold flex items-center justify-between transition ${
                linkVentralDorsal
                  ? 'bg-clinical-50 text-clinical-900 border-clinical-200'
                  : 'bg-slate-50 text-slate-500 border-slate-200'
              }`}
            >
              <span>Koppel V ⇄ D posities</span>
              <span className="text-[10px] font-mono uppercase">
                {linkVentralDorsal ? 'Aan' : 'Uit'}
              </span>
            </button>

            {/* Spiegel L ⇄ R knoppen */}
            <div className="grid grid-cols-2 gap-2 pt-2 border-t border-clinical-100">
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
                className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 transition text-[11px] text-center"
                title="Kopieer alle punten van Links naar Rechts"
              >
                L ➔ R spiegel
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
                className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 transition text-[11px] text-center"
                title="Kopieer alle punten van Rechts naar Links"
              >
                R ➔ L spiegel
              </button>
            </div>

            {/* Kopieer Aanzicht V ⇄ D knoppen */}
            <div className="grid grid-cols-2 gap-2">
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
                className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 transition text-[11px] text-center"
                title="Kopieer ventrale aanzichtposities naar het dorsale aanzicht"
              >
                V ➔ D kopiëren
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
                className="py-1.5 px-2 rounded-xl bg-slate-50 hover:bg-sky-50 hover:text-sky-700 text-slate-700 font-bold border border-slate-200 transition text-[11px] text-center"
                title="Kopieer dorsale aanzichtposities naar het ventrale aanzicht"
              >
                D ➔ V kopiëren
              </button>
            </div>
          </div>
        </div>

        {/* 5. Geschiedenis, Opslag & Beheer Card */}
        <div className="bg-white p-4 rounded-2xl border border-clinical-200/80 shadow-xs space-y-3">
          <label className="text-[11px] font-black text-clinical-700 uppercase tracking-wider block">
            Opslag & Beheer
          </label>

          <div className="space-y-2">
            {/* Ctrl+Z Herstelknop */}
            <button
              type="button"
              onClick={handleUndo}
              disabled={boneHistory.length === 0}
              className="w-full py-2 px-3 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition disabled:opacity-40 disabled:cursor-not-allowed shadow-2xs"
            >
              <RotateCcw className="w-3.5 h-3.5 text-blue-600" />
              <span>Herstel (Ctrl+Z)</span>
              {boneHistory.length > 0 && (
                <span className="text-[10px] bg-slate-200 text-slate-800 px-1.5 py-0.2 rounded-full font-mono">
                  {boneHistory.length}
                </span>
              )}
            </button>

            {/* Grote Opslaan naar Schijf knop */}
            <button
              type="button"
              onClick={handleSaveToDisk}
              disabled={isSaving}
              className="w-full py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-black shadow-sm flex items-center justify-center gap-2 transition disabled:opacity-50 active:scale-95"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Bezig met opslaan...' : '💾 Opslaan naar schijf'}</span>
            </button>

            {/* JSON Export en Import */}
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleExportJson}
                className="py-1.5 px-2 bg-clinical-50 hover:bg-clinical-100 text-clinical-800 border border-clinical-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                title="Download JSON export"
              >
                <Download className="w-3.5 h-3.5 text-slate-500" />
                <span>Export JSON</span>
              </button>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="py-1.5 px-2 bg-clinical-50 hover:bg-clinical-100 text-clinical-800 border border-clinical-200 rounded-xl text-[11px] font-bold flex items-center justify-center gap-1 transition"
                title="Importeer JSON"
              >
                <Upload className="w-3.5 h-3.5 text-slate-500" />
                <span>Import JSON</span>
              </button>
            </div>

            {/* Reset naar Standaard */}
            <button
              type="button"
              onClick={handleResetAll}
              className="w-full py-1.5 px-2 text-[11px] font-semibold text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-xl transition text-center"
            >
              Reset alles naar standaard
            </button>
          </div>
        </div>
      </div>

      {/* Modal / Dialog voor structuurnaam aanpassen */}
      {editingPoint && (
        <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-5 shadow-2xl border border-slate-200 max-w-md w-full space-y-4 animate-in fade-in zoom-in-95 duration-100">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <Edit2 className="w-4 h-4 text-sky-600" />
                <span>Structuurnaam aanpassen</span>
              </h3>
              <button
                type="button"
                onClick={() => setEditingPoint(null)}
                className="p-1 rounded-lg hover:bg-slate-100 text-slate-500"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div>
              <label className="text-xs text-slate-600 font-semibold mb-1 block">Nieuwe naam:</label>
              <input
                type="text"
                autoFocus
                value={renameInputValue}
                onChange={(e) => setRenameInputValue(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleConfirmRename();
                  if (e.key === 'Escape') setEditingPoint(null);
                }}
                className="w-full px-3 py-2 border border-slate-300 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-sky-500 font-semibold text-slate-800"
              />
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setEditingPoint(null)}
                className="px-3 py-1.5 text-xs font-semibold rounded-xl text-slate-600 hover:bg-slate-100"
              >
                Annuleren
              </button>
              <button
                type="button"
                onClick={handleConfirmRename}
                disabled={!renameInputValue.trim()}
                className="px-3.5 py-1.5 text-xs font-bold rounded-xl bg-sky-600 hover:bg-sky-700 text-white shadow-xs transition disabled:opacity-50"
              >
                Opslaan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
