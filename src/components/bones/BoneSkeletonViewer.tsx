import React, { useRef, useState, useMemo } from 'react';
import { AnatomicalView } from '../../types/anatomy';
import { Bone, BoneMarker } from '../../data/bonesData';
import { SKELETON_WIDTH, SKELETON_HEIGHT } from '../../utils/coordinates';

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
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const scrollWrapperRef = useRef<HTMLDivElement>(null);

  // Hover state
  const [hoveredInfo, setHoveredInfo] = useState<{ bone: Bone; marker: BoneMarker } | null>(null);

  // Markers voor het huidige aanzicht
  const markersToRender = useMemo(() => {
    const list: { bone: Bone; marker: BoneMarker; isSelected: boolean }[] = [];

    bones.forEach(bone => {
      bone.markers.forEach(marker => {
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
      className="relative w-full h-full overflow-hidden flex items-center justify-center select-none bg-white"
    >
      {/* Vaste, niet-vervormende skelet container (behoudt te allen tijde 542:1287 aspect ratio) */}
      <div
        ref={containerRef}
        style={{
          aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
        }}
        className="relative h-full max-h-full max-w-full mx-auto"
      >
        {/* Skelet Ventraal */}
        <img
          src={`${import.meta.env.BASE_URL}images/skeleton_ventral.png`}
          alt="Skelet - Ventraal aanzicht"
          width={SKELETON_WIDTH}
          height={SKELETON_HEIGHT}
          className={`absolute inset-0 w-full h-full object-contain block select-none pointer-events-none transition-opacity duration-200 ${
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
          className={`absolute inset-0 w-full h-full object-contain block select-none pointer-events-none transition-opacity duration-200 ${
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

            const radius = isSelected ? 18 : isHovered ? 15 : 11;
            const hitRadius = 38;

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
                }}
                onMouseEnter={() => setHoveredInfo({ bone, marker })}
                onMouseLeave={() => setHoveredInfo(null)}
              >
                {/* Onzichtbaar ruim klikgebied voor comfortabele selectie */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={hitRadius}
                  fill="transparent"
                />

                {/* Pulserende buitenring bij geselecteerd bot */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.9}
                    fill="none"
                    stroke="#0284c7"
                    strokeWidth={3}
                    opacity="0.6"
                    className="animate-ping"
                    style={{ transformOrigin: `${cx}px ${cy}px` }}
                  />
                )}

                {/* Oplichtende gloed bij selectie */}
                {isSelected && (
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius * 1.5}
                    fill="#38bdf8"
                    opacity="0.35"
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
                  className="transition-all duration-150"
                />

                {/* Wit centrum */}
                <circle
                  cx={cx}
                  cy={cy}
                  r={radius * 0.35}
                  fill="#ffffff"
                />
              </g>
            );
          })}
        </svg>

        {/* Grote, duidelijke muisover tekst (tooltip) */}
        {hoveredInfo && (() => {
          const isNearTop = hoveredInfo.marker.y < 0.18;
          return (
            <div
              style={{
                position: 'absolute',
                left: `${hoveredInfo.marker.x * 100}%`,
                top: `${hoveredInfo.marker.y * 100}%`,
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
                  {hoveredInfo.bone.latinName}
                </div>
                <div className="text-base font-bold text-sky-300">
                  {hoveredInfo.bone.dutchName}
                </div>
                {hoveredInfo.marker.subpart && (
                  <div className="text-sm font-extrabold text-amber-300 bg-amber-950/90 px-3 py-1 rounded-lg border border-amber-500/40 mt-1">
                    {hoveredInfo.marker.subpart}
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
