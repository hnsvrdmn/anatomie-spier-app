import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AnatomicalView } from '../../types/anatomy';
import { Bone, BoneMarker } from '../../data/bonesData';
import { useBones } from '../../context/BoneContext';
import { BoneStructurePoint } from '../../data/boneStructures';
import { SKELETON_WIDTH, SKELETON_HEIGHT } from '../../utils/coordinates';
import { RotateCcw, ZoomIn, ZoomOut, Hand, MousePointer, Eye, EyeOff } from 'lucide-react';

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 2374.54;

interface BoneSkeletonViewerProps {
  currentView: AnatomicalView;
  bones: Bone[];
  selectedBone?: Bone | null;
  onSelectBone?: (bone: Bone) => void;
  isMobile?: boolean;
  highlightedStructureName?: string | null;
  onHoverStructure?: (structureName: string | null) => void;
}

export const BoneSkeletonViewer: React.FC<BoneSkeletonViewerProps> = ({
  currentView,
  bones,
  selectedBone,
  onSelectBone,
  isMobile = false,
  highlightedStructureName,
  onHoverStructure,
}) => {
  const { getStructuresForBone } = useBones();
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan toestand
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [isDraggingPan, setIsDraggingPan] = useState(false);
  const dragStartRef = useRef<{ x: number; y: number; panX: number; panY: number } | null>(null);

  // Hover/Selectie state voor tooltip van botten en structuren
  const [hoveredInfo, setHoveredInfo] = useState<{ bone: Bone; marker: BoneMarker } | null>(null);
  const [hoveredStructure, setHoveredStructure] = useState<BoneStructurePoint | null>(null);
  // Tooltip weergave toggle (oogje in de navigator)
  const [showTooltip, setShowTooltip] = useState<boolean>(true);

  // Touch tracking voor pinch-to-zoom en soepele pan (mobiel)
  const touchStateRef = useRef<{
    isPinching: boolean;
    startDistance: number;
    startZoom: number;
    startMidX: number;
    startMidY: number;
    startPanX: number;
    startPanY: number;
    singleTouchStart: { x: number; y: number; startPanX: number; startPanY: number } | null;
    hasMoved: boolean;
    lastTapTime: number;
  }>({
    isPinching: false,
    startDistance: 0,
    startZoom: 1,
    startMidX: 0,
    startMidY: 0,
    startPanX: 0,
    startPanY: 0,
    singleTouchStart: null,
    hasMoved: false,
    lastTapTime: 0,
  });

  // Muiswiel zoomen op desktop
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = -Math.sign(e.deltaY) * 0.25;
    setZoom((z) => {
      const next = Math.max(1.0, Math.min(3.5, Number((z + delta).toFixed(2))));
      if (next === 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  // Muisverslepen (pan mode) op desktop
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    if (!panMode && zoom <= 1.0) return;
    setIsDraggingPan(true);
    dragStartRef.current = {
      x: e.clientX,
      y: e.clientY,
      panX: pan.x,
      panY: pan.y,
    };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingPan || !dragStartRef.current) return;
    const dx = e.clientX - dragStartRef.current.x;
    const dy = e.clientY - dragStartRef.current.y;
    setPan({
      x: dragStartRef.current.panX + dx,
      y: dragStartRef.current.panY + dy,
    });
  };

  const handleMouseUp = () => {
    setIsDraggingPan(false);
    dragStartRef.current = null;
  };

  // Automatisch soepel centreren en inzoomen rondom het geselecteerde bot op mobiel
  useEffect(() => {
    if (!isMobile || !selectedBone) return;

    const marker = selectedBone.markers.find((m) => m.view === currentView || m.view === 'both') || selectedBone.markers[0];
    if (!marker) return;

    const container = containerRef.current;
    const W = container?.clientWidth || 250;
    const H = container?.clientHeight || 600;

    const targetZoom = 1.35;
    const desiredScreenY = 0.33;
    const targetPanX = Math.round((0.5 - marker.x) * W * targetZoom);
    const targetPanY = Math.round((desiredScreenY - 0.5) * H - (marker.y - 0.5) * H * targetZoom);

    setZoom(targetZoom);
    setPan({ x: targetPanX, y: targetPanY });
  }, [isMobile, selectedBone?.id, currentView]);

  // Touch handlers voor pinch-to-zoom en single-finger drag/pan op mobiel
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      touchStateRef.current.isPinching = true;
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      touchStateRef.current.startDistance = dist;
      touchStateRef.current.startZoom = zoom;
      touchStateRef.current.startMidX = (t1.clientX + t2.clientX) / 2;
      touchStateRef.current.startMidY = (t1.clientY + t2.clientY) / 2;
      touchStateRef.current.startPanX = pan.x;
      touchStateRef.current.startPanY = pan.y;
      touchStateRef.current.singleTouchStart = null;
      touchStateRef.current.hasMoved = true;
    } else if (e.touches.length === 1) {
      touchStateRef.current.isPinching = false;
      touchStateRef.current.hasMoved = false;
      touchStateRef.current.singleTouchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
        startPanX: pan.x,
        startPanY: pan.y,
      };
    }
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2 && touchStateRef.current.isPinching) {
      const t1 = e.touches[0];
      const t2 = e.touches[1];
      const dist = Math.hypot(t1.clientX - t2.clientX, t1.clientY - t2.clientY);
      if (touchStateRef.current.startDistance > 0) {
        const scale = dist / touchStateRef.current.startDistance;
        const nextZoom = Math.max(1.0, Math.min(3.5, Number((touchStateRef.current.startZoom * scale).toFixed(2))));
        setZoom(nextZoom);

        const midX = (t1.clientX + t2.clientX) / 2;
        const midY = (t1.clientY + t2.clientY) / 2;
        const deltaX = midX - touchStateRef.current.startMidX;
        const deltaY = midY - touchStateRef.current.startMidY;

        if (nextZoom > 1.0) {
          setPan({
            x: touchStateRef.current.startPanX + deltaX,
            y: touchStateRef.current.startPanY + deltaY,
          });
        } else {
          setPan({ x: 0, y: 0 });
        }
      }
    } else if (e.touches.length === 1 && touchStateRef.current.singleTouchStart) {
      const dx = e.touches[0].clientX - touchStateRef.current.singleTouchStart.x;
      const dy = e.touches[0].clientY - touchStateRef.current.singleTouchStart.y;
      const dist = Math.hypot(dx, dy);
      if (dist > 8) {
        touchStateRef.current.hasMoved = true;
        setPan({
          x: touchStateRef.current.singleTouchStart.startPanX + dx,
          y: touchStateRef.current.singleTouchStart.startPanY + dy,
        });
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchStateRef.current.isPinching) {
      setTimeout(() => {
        touchStateRef.current.isPinching = false;
      }, 50);
    }
    touchStateRef.current.singleTouchStart = null;
  };

  // Verzamel alle zichtbare markers voor het huidige aanzicht
  const markersToRender = useMemo(() => {
    const list: Array<{ bone: Bone; marker: BoneMarker; isSelected: boolean }> = [];
    bones.forEach((bone) => {
      const isSelected = selectedBone?.id === bone.id;
      bone.markers.forEach((m) => {
        if (m.view === currentView || m.view === 'both') {
          list.push({ bone, marker: m, isSelected });
        }
      });
    });
    // Geselecteerd bot als laatste tekenen zodat het bovenop ligt
    return list.sort((a, b) => (a.isSelected === b.isSelected ? 0 : a.isSelected ? 1 : -1));
  }, [bones, currentView, selectedBone?.id]);

  // Verzamel relevante botstructuren wanneer een bot geselecteerd is
  const structuresToRender = useMemo(() => {
    if (!selectedBone) return [];
    return getStructuresForBone(selectedBone.id, currentView);
  }, [selectedBone, currentView, getStructuresForBone]);

  return (
    <div
      ref={scrollWrapperRef}
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${
        panMode ? 'cursor-grab active:cursor-grabbing' : ''
      }`}
      style={{ touchAction: 'none' }}
    >
      {/* Vaste container die schaalt en pant met perfect behoud van aspect-ratio (geen rekken) */}
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
          transform: `translate3d(${pan.x}px, ${pan.y}px, 0px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: touchStateRef.current.isPinching || isDraggingPan ? 'none' : 'transform 0.15s ease-out',
        }}
        className="relative max-h-full max-w-full w-auto h-auto mx-auto pointer-events-auto flex items-center justify-center"
      >
        {/* Skelet Afbeelding (in flow met object-contain zodat de container exact 1000/2374.54 verhouding aanhoudt zonder te strekken) */}
        <img
          src={
            currentView === 'ventral'
              ? `${import.meta.env.BASE_URL}images/skeleton_ventral.png`
              : `${import.meta.env.BASE_URL}images/skeleton_dorsal.png`
          }
          alt={`Skelet - ${currentView === 'ventral' ? 'Ventraal' : 'Dorsaal'} aanzicht`}
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className="max-h-full max-w-full w-auto h-auto object-contain block select-none pointer-events-none"
          draggable={false}
        />

        {/* SVG Marker Overlay */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        >
          {/* 1. Botstructuren (kleine grijze bolletjes, half zo groot als de hoofdbolletjes, zonder witte punt) */}
          {structuresToRender.map((s) => {
            const cx = s.x * SVG_WIDTH;
            const cy = s.y * SVG_HEIGHT;
            const isHovered = hoveredStructure?.id === s.id;
            const isTargetedFromList = Boolean(
              highlightedStructureName &&
                (() => {
                  const hl = highlightedStructureName.toLowerCase();
                  const sName = s.name.toLowerCase();
                  const sFull = (s.fullName || '').toLowerCase();
                  const sParent = (s.parentStructure || '').toLowerCase();
                  return (
                    hl === sName ||
                    hl === sFull ||
                    hl === sParent ||
                    hl.includes(sName) ||
                    (sFull && hl.includes(sFull)) ||
                    (sParent && hl.includes(sParent)) ||
                    sName.includes(hl) ||
                    (sFull && sFull.includes(hl))
                  );
                })()
            );
            const isHighlighted = isHovered || isTargetedFromList;

            // Half zo groot als de reguliere bolletjes (~6-7 vs 12-14)
            const baseR = 6.5;
            const radius = isHighlighted ? 9.5 : baseR;
            const hitR = 26;

            return (
              <g
                key={`struct-marker-${s.id}`}
                className="cursor-pointer pointer-events-auto"
                onMouseEnter={() => {
                  setHoveredStructure(s);
                  onHoverStructure?.(s.parentStructure || s.fullName || s.name);
                }}
                onMouseLeave={() => {
                  setHoveredStructure(null);
                  onHoverStructure?.(null);
                }}
              >
                {/* Ruim klik/hovergebied */}
                <circle cx={cx} cy={cy} r={hitR} fill="transparent" />

                {/* Subtiele glow/pulse bij highlight */}
                {isHighlighted && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.8}
                    fill="rgba(2, 132, 199, 0.2)"
                    stroke="#0284c7"
                    strokeWidth={1.5}
                    className="animate-pulse"
                  />
                )}

                {/* Grijs bolletje met dunne witte outline voor optimaal contrast, ZONDER witte binnenpunt */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={isHighlighted ? '#0284c7' : '#64748b'}
                  stroke="#ffffff"
                  strokeWidth={isHighlighted ? 2 : 1.25}
                  className="transition-all duration-150"
                  style={{
                    filter: isHighlighted
                      ? 'drop-shadow(0px 2px 4px rgba(2, 132, 199, 0.45))'
                      : 'drop-shadow(0px 1px 2px rgba(0, 0, 0, 0.25))',
                  }}
                />
              </g>
            );
          })}

          {/* 2. Hoofdmarkers voor botten */}
          {markersToRender.map(({ bone, marker, isSelected }, idx) => {
            const cx = marker.x * SVG_WIDTH;
            const cy = marker.y * SVG_HEIGHT;
            const isHovered = hoveredInfo?.bone.id === bone.id;

            const radius = isSelected ? 13.5 : isHovered ? 13 : 11;
            const hitRadius = 36;

            const fillColor = isSelected ? '#1993f2' : isHovered ? '#0ea5e9' : '#64748b';
            const strokeColor = '#ffffff';
            const strokeWidth = isSelected ? 3.5 : 3;

            return (
              <g
                key={`bone-marker-${bone.id}-${idx}`}
                className="cursor-pointer pointer-events-auto"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectBone?.(bone);
                  setHoveredInfo({ bone, marker });
                }}
                onMouseEnter={() => setHoveredInfo({ bone, marker })}
                onMouseLeave={() => setHoveredInfo(null)}
              >
                {/* Onzichtbaar ruim klikgebied voor touch comfort */}
                <circle cx={cx} cy={cy} r={hitRadius} fill="transparent" />



                {/* Hoofdmarker cirkel met contrastomranding en zachte schaduw */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={strokeWidth}
                  className="transition-all duration-150"
                  style={isSelected ? { filter: 'drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.35))' } : undefined}
                />

                {/* Scherp wit centrum */}
                <circle cx={cx} cy={cy} r={radius * 0.35} fill="#ffffff" />
              </g>
            );
          })}
        </svg>

        {/* Tooltip voor Botstructuur (even groot als de botnaam tooltip!) */}
        {showTooltip && hoveredStructure && (() => {
          const isNearTop = hoveredStructure.y < 0.38;
          const clampedX = Math.max(22, Math.min(78, hoveredStructure.x * 100));

          return (
            <div
              style={{
                position: 'absolute',
                left: `${clampedX}%`,
                top: `${hoveredStructure.y * 100}%`,
                transform: `${
                  isNearTop ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))'
                } scale(${1 / Math.max(1, zoom)})`,
                transformOrigin: isNearTop ? 'top center' : 'bottom center',
              }}
              className="z-50 pointer-events-none select-none transition-all duration-75 max-w-[85vw] sm:max-w-[340px]"
            >
              {isNearTop && (
                <div className="w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-slate-900/95 mx-auto" />
              )}
              <div className="bg-slate-900/95 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl border border-sky-400/60 backdrop-blur-md flex flex-col items-center gap-0.5 text-center">
                <div className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                  {hoveredStructure.fullName || hoveredStructure.name}
                </div>
                {selectedBone && (
                  <div className="text-xs sm:text-sm font-bold text-sky-300 leading-tight">
                    Botstructuur • {selectedBone.latinName}
                  </div>
                )}
              </div>
              {!isNearTop && (
                <div className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900/95 mx-auto" />
              )}
            </div>
          );
        })()}

        {/* Muisover / Tap tekst (tooltip voor botten) */}
        {showTooltip && !hoveredStructure && hoveredInfo && (() => {
          const isNearTop = hoveredInfo.marker.y < 0.38;
          const clampedX = Math.max(22, Math.min(78, hoveredInfo.marker.x * 100));

          return (
            <div
              style={{
                position: 'absolute',
                left: `${clampedX}%`,
                top: `${hoveredInfo.marker.y * 100}%`,
                transform: `${
                  isNearTop ? 'translate(-50%, 14px)' : 'translate(-50%, calc(-100% - 14px))'
                } scale(${1 / Math.max(1, zoom)})`,
                transformOrigin: isNearTop ? 'top center' : 'bottom center',
              }}
              className="z-50 pointer-events-none select-none transition-all duration-75 max-w-[85vw] sm:max-w-[340px]"
            >
              {isNearTop && (
                <div className="w-0 h-0 border-x-6 border-x-transparent border-b-6 border-b-slate-900/95 mx-auto" />
              )}
              <div className="bg-slate-900/95 text-white px-3.5 sm:px-4 py-2 sm:py-2.5 rounded-2xl shadow-2xl border border-sky-400/60 backdrop-blur-md flex flex-col items-center gap-0.5 text-center">
                <div className="text-sm sm:text-base font-black text-white tracking-wide leading-tight">
                  {hoveredInfo.bone.latinName}
                </div>
                <div className="text-xs sm:text-sm font-bold text-sky-300 leading-tight">
                  {hoveredInfo.bone.dutchName}
                </div>
                {hoveredInfo.marker.subpart && (
                  <div className="text-[11px] font-extrabold text-amber-300 bg-amber-950/90 px-2 py-0.5 rounded-md border border-amber-500/40 mt-1">
                    {hoveredInfo.marker.subpart}
                  </div>
                )}
              </div>
              {!isNearTop && (
                <div className="w-0 h-0 border-x-6 border-x-transparent border-t-6 border-t-slate-900/95 mx-auto" />
              )}
            </div>
          );
        })()}
      </div>

      {/* Mobiel Reset knopje */}
      {isMobile && zoom > 1.05 && (
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="absolute top-2.5 right-14 z-30 px-2.5 py-1 bg-white/95 backdrop-blur-md rounded-full border border-slate-200/90 shadow-md text-[11px] font-bold text-slate-700 flex items-center gap-1 active:scale-95 transition pointer-events-auto"
          title="Skelet weergave herstellen"
        >
          <RotateCcw className="w-3 h-3 text-slate-600" />
          <span>{Math.round(zoom * 100)}% Reset</span>
        </button>
      )}

      {/* Desktop Navigator Toolbar (Inzoomen, Uitzoomen, Reset, Versleep) */}
      {!isMobile && (
        <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md text-slate-700 pointer-events-auto">
          <button
            type="button"
            onClick={() => setZoom((z) => Math.min(3.5, Number((z + 0.35).toFixed(2))))}
            title="Inzoomen (+)"
            className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700"
          >
            <ZoomIn className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => {
              setZoom(1);
              setPan({ x: 0, y: 0 });
              setPanMode(false);
            }}
            title="Klik om te resetten naar 100%"
            className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors text-slate-700 min-w-[46px] text-center font-mono"
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
            className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700"
          >
            <ZoomOut className="w-4 h-4" />
          </button>

          <div className="w-[1px] h-4 bg-slate-200" />
          <button
            type="button"
            onClick={() => setShowTooltip((s) => !s)}
            title={showTooltip ? 'Verberg pop-up (informatievenster)' : 'Toon pop-up'}
            className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
              !showTooltip ? 'bg-amber-100 text-amber-700' : 'hover:bg-slate-100 text-slate-600'
            }`}
          >
            {!showTooltip ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
          </button>

          {zoom > 1.0 && (
            <>
              <div className="w-[1px] h-4 bg-slate-200" />
              <button
                type="button"
                onClick={() => setPanMode((p) => !p)}
                title={panMode ? 'Klik om terug te keren naar de normale cursor' : 'Skelet verslepen'}
                className={`p-1.5 rounded-lg transition-colors flex items-center justify-center ${
                  panMode
                    ? 'bg-slate-200 text-slate-900 font-semibold'
                    : 'hover:bg-slate-100 text-slate-600 font-medium'
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
                title="Reset weergave naar 100%"
                className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
              >
                <RotateCcw className="w-3.5 h-3.5" />
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
};
