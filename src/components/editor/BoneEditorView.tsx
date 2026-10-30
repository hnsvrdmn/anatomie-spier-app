import React, { useState, useRef, useMemo, useCallback } from 'react';
import { useBones } from '../../context/BoneContext';
import { useMuscles } from '../../context/MuscleContext';
import { BoneMarker } from '../../data/bonesData';
import { SKELETON_WIDTH, SKELETON_HEIGHT, clientToNormalized } from '../../utils/coordinates';
import { RotateCcw, Download, Upload, Save } from 'lucide-react';

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 2374.54;

interface DraggableBoneMarker extends BoneMarker {
  boneId: string;
  boneName: string;
  dutchName: string;
  markerIndex: number;
}

interface DraggableSkeletonProps {
  view: 'ventral' | 'dorsal';
  markers: DraggableBoneMarker[];
  onUpdateMarker: (boneId: string, markerIndex: number, x: number, y: number) => void;
}

const DraggableSkeleton: React.FC<DraggableSkeletonProps> = ({
  view,
  markers,
  onUpdateMarker,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [draggingMarker, setDraggingMarker] = useState<DraggableBoneMarker | null>(null);
  const [hoveredMarker, setHoveredMarker] = useState<DraggableBoneMarker | null>(null);
  const isDraggingRef = useRef(false);
  const activeMarkerRef = useRef<DraggableBoneMarker | null>(null);

  const handlePointerDown = (e: React.PointerEvent, marker: DraggableBoneMarker) => {
    e.stopPropagation();
    isDraggingRef.current = true;
    activeMarkerRef.current = marker;
    setDraggingMarker(marker);
    setHoveredMarker(marker);
    try {
      (e.currentTarget as HTMLElement).setPointerCapture(e.pointerId);
    } catch {
      // fallback
    }
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !activeMarkerRef.current || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const norm = clientToNormalized(e.clientX, e.clientY, rect);

    const clampedX = Math.max(0.05, Math.min(0.95, Number(norm.x.toFixed(3))));
    const clampedY = Math.max(0.02, Math.min(0.99, Number(norm.y.toFixed(3))));

    onUpdateMarker(activeMarkerRef.current.boneId, activeMarkerRef.current.markerIndex, clampedX, clampedY);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    if (isDraggingRef.current) {
      isDraggingRef.current = false;
      activeMarkerRef.current = null;
      setDraggingMarker(null);
      try {
        (e.currentTarget as HTMLElement).releasePointerCapture(e.pointerId);
      } catch {
        // ignore
      }
    }
  };

  return (
    <div
      className="relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-white"
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
    >
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
        }}
        className="relative h-full max-h-full max-w-full mx-auto"
      >
        {/* Skelet afbeelding */}
        <img
          src={view === 'ventral' 
            ? `${import.meta.env.BASE_URL}images/skeleton_ventral.png`
            : `${import.meta.env.BASE_URL}images/skeleton_dorsal.png`}
          alt={`Skelet - ${view === 'ventral' ? 'Ventraal' : 'Dorsaal'}`}
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className="absolute inset-0 w-full h-full object-fill block select-none pointer-events-none"
          draggable={false}
        />

        {/* SVG Markerlaag met alle sleepbare punten */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        >
          {markers.map((marker) => {
            const cx = marker.x * SVG_WIDTH;
            const cy = marker.y * SVG_HEIGHT;
            const isDragging = draggingMarker?.boneId === marker.boneId && draggingMarker?.markerIndex === marker.markerIndex;
            const isHovered = hoveredMarker?.boneId === marker.boneId && hoveredMarker?.markerIndex === marker.markerIndex;

            const radius = isDragging ? 17 : isHovered ? 14 : 10;
            const hitRadius = 34;

            const fillColor = isDragging ? '#0284c7' : isHovered ? '#0ea5e9' : '#334155';
            const strokeColor = '#ffffff';
            const strokeWidth = isDragging ? 4 : 3;

            return (
              <g
                key={`${marker.boneId}-${marker.markerIndex}`}
                className="pointer-events-auto cursor-grab active:cursor-grabbing"
                onPointerDown={(e) => handlePointerDown(e, marker)}
                onMouseEnter={() => setHoveredMarker(marker)}
                onMouseLeave={() => {
                  if (!isDraggingRef.current) setHoveredMarker(null);
                }}
              >
                {/* Ruim klik- en sleepgebied */}
                <circle cx={cx} cy={cy} r={hitRadius} fill="transparent" />

                {/* Oplichtende ring bij verslepen of hover */}
                {(isDragging || isHovered) && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.8}
                    fill="#38bdf8"
                    opacity="0.3"
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
                />

                {/* Wit centrum */}
                <circle cx={cx} cy={cy} r={radius * 0.35} fill="#ffffff" />
              </g>
            );
          })}
        </svg>

        {/* Grote, duidelijke muisover pop-up */}
        {hoveredMarker && (() => {
          const isNearTop = hoveredMarker.y < 0.18;
          return (
            <div
              style={{
                position: 'absolute',
                left: `${hoveredMarker.x * 100}%`,
                top: `${hoveredMarker.y * 100}%`,
                transform: isNearTop ? 'translate(-50%, 18px)' : 'translate(-50%, calc(-100% - 18px))',
                transformOrigin: isNearTop ? 'top center' : 'bottom center',
              }}
              className="z-50 pointer-events-none select-none transition-all duration-75"
            >
              {isNearTop && (
                <div className="w-0 h-0 border-x-8 border-x-transparent border-b-8 border-b-slate-900/95 mx-auto" />
              )}
              <div className="bg-slate-900/95 text-white px-5 py-3 rounded-2xl shadow-2xl border border-sky-400/60 backdrop-blur-md flex flex-col items-center gap-1 min-w-[220px] max-w-[380px] text-center">
                <div className="text-xl font-black text-white tracking-wide">
                  {hoveredMarker.boneName}
                </div>
                <div className="text-base font-bold text-sky-300">
                  {hoveredMarker.dutchName}
                </div>
                {hoveredMarker.subpart && (
                  <div className="text-sm font-extrabold text-amber-300 bg-amber-950/90 px-3 py-1 rounded-lg border border-amber-500/40 mt-1">
                    {hoveredMarker.subpart}
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
  const { bones, updateBonePoint, resetBones, exportBonesJson, importBonesJson, saveBonesToDisk } = useBones();
  const { showToast } = useMuscles();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSaving, setIsSaving] = useState(false);

  const handleSaveToDisk = async () => {
    setIsSaving(true);
    const ok = await saveBonesToDisk();
    setIsSaving(false);
    if (ok) {
      showToast('Botposities permanent opgeslagen in src/data/bonesData.ts op schijf!', 'success');
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
          importBonesJson(parsed);
          showToast('Botten dataset succesvol geïmporteerd!', 'success');
        } else {
          showToast('Ongeldig JSON-formaat voor botten dataset.', 'error');
        }
      } catch {
        showToast('Fout bij importeren van JSON-bestand.', 'error');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Alle markers voor het ventrale aanzicht
  const ventralMarkers = useMemo(() => {
    return bones.flatMap(bone =>
      bone.markers
        .map((marker, markerIndex) => ({
          ...marker,
          boneId: bone.id,
          boneName: bone.latinName,
          dutchName: bone.dutchName,
          markerIndex,
        }))
        .filter(m => m.view === 'ventral')
    );
  }, [bones]);

  // Alle markers voor het dorsale aanzicht
  const dorsalMarkers = useMemo(() => {
    return bones.flatMap(bone =>
      bone.markers
        .map((marker, markerIndex) => ({
          ...marker,
          boneId: bone.id,
          boneName: bone.latinName,
          dutchName: bone.dutchName,
          markerIndex,
        }))
        .filter(m => m.view === 'dorsal')
    );
  }, [bones]);

  const handleUpdateMarker = useCallback((boneId: string, markerIndex: number, x: number, y: number) => {
    updateBonePoint(boneId, markerIndex, { x, y });
  }, [updateBonePoint]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 py-2 flex flex-col h-[calc(100vh-8.5rem)] min-h-[680px]">
      {/* Subtiele instructiebalk met herstel & export opties */}
      <div className="w-full flex items-center justify-between pb-2 mb-2 border-b border-clinical-100 text-xs">
        <div className="flex items-center gap-2 text-slate-700 font-semibold">
          <span className="w-2.5 h-2.5 rounded-full bg-sky-500 animate-pulse" />
          <span>
            Beide weergaven naast elkaar. Sleep een willekeurig punt om de positie direct aan te passen.
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isSaving}
            onClick={handleSaveToDisk}
            className="px-3.5 py-1.5 rounded-xl border border-emerald-300 bg-emerald-600 hover:bg-emerald-700 text-white font-bold transition flex items-center gap-1.5 shadow-sm active:scale-95"
            title="Sla huidige botposities permanent op in src/data/bonesData.ts op schijf"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSaving ? 'Opslaan...' : 'Opslaan naar bronbestand'}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              if (confirm('Weet je zeker dat je alle botpunten wilt herstellen naar de standaardwaarden?')) {
                resetBones();
                showToast('Standaardpunten hersteld', 'info');
              }
            }}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Standaardpunten herstellen</span>
          </button>

          <button
            type="button"
            onClick={exportBonesJson}
            className="px-3 py-1.5 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-slate-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Download huidige botten data als JSON bestand"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Exporteer JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="px-3 py-1.5 rounded-xl border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-bold transition flex items-center gap-1.5 shadow-2xs"
            title="Upload een eerder opgeslagen botten JSON bestand"
          >
            <Upload className="w-3.5 h-3.5" />
            <span>Importeer JSON</span>
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

      {/* Beide views naast elkaar: Ventraal links, Dorsaal rechts */}
      <div className="flex-1 min-h-0 w-full bg-white rounded-3xl p-3 border border-clinical-200/90 shadow-sm grid grid-cols-1 md:grid-cols-2 gap-4 overflow-hidden">
        {/* Ventraal links */}
        <div className="relative w-full h-full flex flex-col items-center justify-center border-b md:border-b-0 md:border-r border-slate-100 pr-0 md:pr-2">
          <span className="absolute top-2 left-3 text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md z-20 shadow-2xs">
            Ventraal ({ventralMarkers.length} punten)
          </span>
          <DraggableSkeleton
            view="ventral"
            markers={ventralMarkers}
            onUpdateMarker={handleUpdateMarker}
          />
        </div>

        {/* Dorsaal rechts */}
        <div className="relative w-full h-full flex flex-col items-center justify-center pl-0 md:pl-2">
          <span className="absolute top-2 left-3 text-[11px] font-black uppercase tracking-wider text-slate-500 bg-slate-100/90 px-2.5 py-1 rounded-md z-20 shadow-2xs">
            Dorsaal ({dorsalMarkers.length} punten)
          </span>
          <DraggableSkeleton
            view="dorsal"
            markers={dorsalMarkers}
            onUpdateMarker={handleUpdateMarker}
          />
        </div>
      </div>
    </div>
  );
};
