import React, { useRef, useState, useEffect, useMemo } from 'react';
import { AnatomicalView } from '../../types/anatomy';
import { Bone, BoneMarker } from '../../data/bonesData';
import { SKELETON_WIDTH, SKELETON_HEIGHT } from '../../utils/coordinates';
import { RotateCcw } from 'lucide-react';

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 2374.54;

interface BoneSkeletonViewerProps {
  currentView: AnatomicalView;
  bones: Bone[];
  selectedBone?: Bone | null;
  onSelectBone?: (bone: Bone) => void;
  isMobile?: boolean;
}

export const BoneSkeletonViewer: React.FC<BoneSkeletonViewerProps> = ({
  currentView,
  bones,
  selectedBone,
  onSelectBone,
  isMobile = false,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // Zoom & Pan toestand (alleen actief op mobiel)
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });

  // Hover/Selectie state voor tooltip
  const [hoveredInfo, setHoveredInfo] = useState<{ bone: Bone; marker: BoneMarker } | null>(null);

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

  // Op PC is inzoomen niet nodig en uitgeschakeld. Bij wisselen naar desktop reset zoom.
  useEffect(() => {
    if (!isMobile) {
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [isMobile]);

  // Automatisch soepel centreren en inzoomen rondom het geselecteerde bot op mobiel
  // Zorgt ervoor dat lage stippen (onderbeen / voeten) ALTIJD ruim boven de onderste lade in beeld staan!
  useEffect(() => {
    if (!isMobile || !selectedBone) return;

    // Zoek de marker voor het huidige aanzicht
    const marker = selectedBone.markers.find((m) => m.view === currentView || m.view === 'both') || selectedBone.markers[0];
    if (!marker) return;

    const container = containerRef.current;
    const W = container?.clientWidth || 250;
    const H = container?.clientHeight || 600;

    // Doelpositie Y op het scherm: 33% vanaf de bovenkant.
    // Hierdoor vallen onderbeen/voetbotten NOOIT achter de zwevende lade onderin!
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
      }, 100);
      return;
    }

    if (!touchStateRef.current.hasMoved && touchStateRef.current.singleTouchStart) {
      const now = Date.now();
      // Dubbeltik reset naar 100%
      if (now - touchStateRef.current.lastTapTime < 300) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        touchStateRef.current.lastTapTime = 0;
        return;
      }
      touchStateRef.current.lastTapTime = now;
    }
  };

  // Markers voor het huidige aanzicht
  const markersToRender = useMemo(() => {
    const list: { bone: Bone; marker: BoneMarker; isSelected: boolean }[] = [];

    bones.forEach((bone) => {
      bone.markers.forEach((marker) => {
        if (marker.view === currentView || marker.view === 'both') {
          const isSelected = selectedBone?.id === bone.id;
          list.push({ bone, marker, isSelected });
        }
      });
    });

    return list;
  }, [bones, currentView, selectedBone?.id]);

  return (
    <div
      ref={scrollWrapperRef}
      onTouchStart={isMobile ? handleTouchStart : undefined}
      onTouchMove={isMobile ? handleTouchMove : undefined}
      onTouchEnd={isMobile ? handleTouchEnd : undefined}
      className="relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-white"
    >
      {/* Mobiele zoom reset indicatorknop wanneer ingezoomd */}
      {isMobile && zoom > 1.05 && (
        <button
          type="button"
          onClick={() => {
            setZoom(1);
            setPan({ x: 0, y: 0 });
          }}
          className="absolute top-2.5 right-2.5 z-30 px-2.5 py-1.5 rounded-full bg-slate-900/80 backdrop-blur-md text-white text-[11px] font-bold shadow-md flex items-center gap-1 border border-slate-700 active:scale-90 transition pointer-events-auto"
        >
          <RotateCcw className="w-3 h-3" />
          <span>{Math.round(zoom * 100)}% Reset</span>
        </button>
      )}

      {/* Vaste, schaalbare skelet container */}
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
          transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
          transformOrigin: 'center center',
          transition: touchStateRef.current.isPinching || touchStateRef.current.hasMoved
            ? 'none'
            : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
        }}
        className="relative h-full max-h-full max-w-full mx-auto"
      >
        {/* Skelet Ventraal */}
        <img
          src={`${import.meta.env.BASE_URL}images/skeleton_ventral.png`}
          alt="Skelet - Ventraal aanzicht"
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className={`absolute inset-0 w-full h-full object-fill block select-none pointer-events-none transition-opacity duration-200 ${
            currentView === 'ventral' ? 'opacity-100 z-0' : 'opacity-0 z-0'
          }`}
          draggable={false}
        />

        {/* Skelet Dorsaal */}
        <img
          src={`${import.meta.env.BASE_URL}images/skeleton_dorsal.png`}
          alt="Skelet - Dorsaal aanzicht"
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className={`absolute inset-0 w-full h-full object-fill block select-none pointer-events-none transition-opacity duration-200 ${
            currentView === 'dorsal' ? 'opacity-100 z-0' : 'opacity-0 z-0'
          }`}
          draggable={false}
        />

        {/* SVG Marker Overlay */}
        <svg
          viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
          preserveAspectRatio="none"
          className="absolute inset-0 z-10 w-full h-full pointer-events-none"
        >
          {markersToRender.map(({ bone, marker, isSelected }, idx) => {
            const cx = marker.x * SVG_WIDTH;
            const cy = marker.y * SVG_HEIGHT;
            const isHovered = hoveredInfo?.bone.id === bone.id;

            const radius = isSelected ? 20 : isHovered ? 16 : 12;
            const hitRadius = 42;

            const fillColor = isSelected ? '#0284c7' : isHovered ? '#0ea5e9' : '#334155';
            const strokeColor = '#ffffff';
            const strokeWidth = isSelected ? 4.5 : 3.5;

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

                {/* 1. Subtiel ademende ring bij geselecteerd bot (rustig, minimalistisch, strak) */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.8}
                    fill="rgba(37, 99, 235, 0.16)"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    className="animate-pulse"
                  />
                )}

                {/* 2. Fijne witte accentring voor scherp contrast */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.35}
                    fill="none"
                    stroke="#ffffff"
                    strokeWidth={1.5}
                    opacity="0.9"
                  />
                )}

                {/* 3. Hoofdmarker cirkel met contrastomranding en zachte schaduw */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius}
                  fill={isSelected ? '#2563eb' : fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 4 : strokeWidth}
                  className="transition-all duration-150"
                  style={isSelected ? { filter: 'drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.35))' } : undefined}
                />

                {/* 4. Scherp wit centrum */}
                <circle cx={cx} cy={cy} r={radius * 0.35} fill="#ffffff" />
              </g>
            );
          })}
        </svg>

        {/* Muisover / Tap tekst (tooltip): ALTIJD zichtbaar binnen scherm, nooit afgesneden */}
        {hoveredInfo && (() => {
          // Plaats onder het punt als het punt zich in de bovenste 38% bevindt, anders erboven
          const isNearTop = hoveredInfo.marker.y < 0.38;
          // Klem X tussen 20% en 80% zodat de tooltip links of rechts nooit het scherm verlaat
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
    </div>
  );
};
