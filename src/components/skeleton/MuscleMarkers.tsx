import React from 'react';
import { Muscle, Point2D, MatchResult } from '../../types/anatomy';
import { getMuscleConnections, mirrorPoint } from '../../utils/coordinates';
import { useZoom } from './SkeletonViewer';

interface MuscleMarkersProps {
  muscle: Muscle;
  activeSide: 'left' | 'right' | 'both' | 'midline';
  highlightedPoint?: Point2D | null;
  // Optionele quizresultaten
  quizMatches?: MatchResult[];
  showReferenceGhost?: boolean;
  color?: string;
  isDimmed?: boolean;
  isOppositeView?: boolean;
  opacity?: number;
  onSelectMuscle?: (muscleId: string) => void;
  isInteractive?: boolean;
  onHoverPoint?: (info: { point: Point2D; type: 'origin' | 'insertion' | 'line'; muscle: Muscle; label?: string } | null) => void;
}

export const SVG_WIDTH = 1000;
export const SVG_HEIGHT = 2374.54;

export const MULTI_MUSCLE_COLORS = [
  '#2563eb', // Blauw
  '#e11d48', // Rood/Rose
  '#059669', // Smaragdgroen
  '#d97706', // Amber/Goud
  '#7c3aed', // Paars
  '#0891b2', // Cyaan
  '#ea580c', // Oranje
  '#db2777', // Roze
  '#4f46e5', // Indigo
  '#0d9488', // Teal
];

export const MuscleMarkers: React.FC<MuscleMarkersProps> = ({
  muscle,
  activeSide,
  highlightedPoint = null,
  quizMatches,
  showReferenceGhost = false,
  color,
  isDimmed = false,
  isOppositeView = false,
  opacity,
  onSelectMuscle,
  isInteractive = false,
  onHoverPoint,
}) => {
  const zoom = useZoom();

  const sidesToRender: ('left' | 'right' | 'midline')[] = [];

  if (muscle.symmetryType === 'midline') {
    sidesToRender.push('midline');
  } else {
    if (activeSide === 'left' || activeSide === 'both') sidesToRender.push('left');
    if (activeSide === 'right' || activeSide === 'both') sidesToRender.push('right');
  }

  // Hulpfunctie om genormaliseerde coördinaten naar SVG viewBox te schalen
  const toSvgX = (x: number) => x * SVG_WIDTH;
  const toSvgY = (y: number) => y * SVG_HEIGHT;

  const tooltipText = isOppositeView
    ? `${muscle.name} (klik om te draaien)\nOrigo: ${muscle.originText}\nInsertie: ${muscle.insertionText}`
    : `${muscle.name}\nOrigo: ${muscle.originText}\nInsertie: ${muscle.insertionText}`;

  // Bepaal de effectieve groep-opacity:
  // Als de spier op het andere aanzicht ligt, geven we hem een subtiele doorschijnende opacity (0.42)
  const effectiveGroupOpacity = isDimmed
    ? (isOppositeView ? 0.16 : 0.22)
    : (isOppositeView ? 0.45 : (opacity !== undefined ? opacity : 1.0));

  return (
    <g className={`muscle-markers-group ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'} transition-opacity duration-300`} opacity={effectiveGroupOpacity}>
      {/* 0. Aanhechtingslijnen / Zones (in leermodus als rode of blauwe stippellijn onder het verloop en de punten) */}
      {sidesToRender.map((side) => {
        const visual = muscle.visuals[side];
        if (!visual || !visual.attachmentLines || visual.attachmentLines.length === 0) return null;

        return visual.attachmentLines.map((line, lIdx) => {
          const rawPts = line.points || [];
          if (rawPts.length < 2) return null;

          const pts = isOppositeView ? rawPts.map(mirrorPoint) : rawPts;
          const isOrigin = line.type === 'origin';
          const strokeColor = isOrigin ? '#2563eb' : '#dc2626';

          const pathD = `M ${toSvgX(pts[0].x)} ${toSvgY(pts[0].y)} ` +
            pts.slice(1).map(p => `L ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ');

          return (
            <g key={`marker-attach-line-${side}-${line.id || lIdx}`}>
              {/* Witte contour eronder voor maximaal contrast en leesbaarheid tegen skelet */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth={5 / zoom}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isOppositeView ? 0.45 : 0.85}
                className="pointer-events-none"
              />
              {/* Rode of blauwe stippellijn */}
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={3 / zoom}
                strokeDasharray={`${5 / zoom} ${4 / zoom}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isOppositeView ? 0.6 : 0.95}
                className={isInteractive || onHoverPoint ? 'cursor-pointer pointer-events-auto' : 'pointer-events-none'}
                onPointerEnter={() => onHoverPoint?.({
                  point: pts[Math.floor(pts.length / 2)],
                  type: 'line',
                  muscle,
                  label: `${muscle.name} (${line.name || (isOrigin ? 'Origo-zone' : 'Insertie-zone')})`,
                })}
                onPointerLeave={() => onHoverPoint?.(null)}
                onClick={(e) => {
                  if (isInteractive && onSelectMuscle) {
                    e.stopPropagation();
                    onSelectMuscle(muscle.id);
                  }
                }}
              >
                <title>{`${muscle.name}: ${line.name || (isOrigin ? 'Origo-lijn' : 'Insertie-lijn')}`}</title>
              </path>
            </g>
          );
        });
      })}

      {/* 1. Spierverloop (rechte lijnen of curves tussen alle origo's en inserties) */}
      {sidesToRender.map((side) => {
        const visual = muscle.visuals[side];
        if (!visual || !visual.origins?.length || !visual.insertions?.length) return null;

        // Als de spier op het andere aanzicht ligt (bijv. dorsaal bekeken vanaf ventraal),
        // projecteren we de punten door het sagittale vlak heen (x = 1.0 - x)
        const origins = isOppositeView
          ? visual.origins.map(mirrorPoint)
          : visual.origins;
        const insertions = isOppositeView
          ? visual.insertions.map(mirrorPoint)
          : visual.insertions;
        const pathPoints = isOppositeView
          ? (visual.musclePath || []).map(mirrorPoint)
          : (visual.musclePath || []);

        const connections = getMuscleConnections(origins, insertions);

        return (
          <g key={`lines-${side}`} className="transition-opacity duration-200">
            {connections.map(({ orig, ins, oIdx, iIdx }) => {
              let pathD = '';
              if (pathPoints.length === 1) {
                const ctrl = pathPoints[0];
                pathD = `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} Q ${toSvgX(ctrl.x)} ${toSvgY(ctrl.y)} ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
              } else if (pathPoints.length === 2) {
                const c1 = pathPoints[0];
                const c2 = pathPoints[1];
                pathD = `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} C ${toSvgX(c1.x)} ${toSvgY(c1.y)} ${toSvgX(c2.x)} ${toSvgY(c2.y)} ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
              } else if (pathPoints.length > 2) {
                pathD = `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} ` +
                  pathPoints.map(p => `L ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ') +
                  ` L ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
              } else {
                pathD = `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} L ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
              }

              return (
                <React.Fragment key={`line-frag-${side}-${oIdx}-${iIdx}`}>
                  {/* Brede onzichtbare klikzone voor nauwkeurige respons */}
                  {isInteractive && onSelectMuscle && (
                    <path
                      d={pathD}
                      fill="none"
                      stroke="transparent"
                      strokeWidth="32"
                      className="cursor-pointer pointer-events-auto"
                      onPointerEnter={() => onHoverPoint?.({ 
                        point: { x: (orig.x + ins.x) / 2, y: (orig.y + ins.y) / 2 }, 
                        type: 'line', 
                        muscle,
                        label: muscle.name
                      })}
                      onPointerLeave={() => onHoverPoint?.(null)}
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectMuscle(muscle.id);
                      }}
                    >
                      <title>{tooltipText}</title>
                    </path>
                  )}
                  <path
                    key={`line-${side}-${oIdx}-${iIdx}`}
                    d={pathD}
                    fill="none"
                    stroke={color || '#e11d48'}
                    strokeWidth={(isOppositeView ? 4.5 : 6) / zoom}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    opacity={isOppositeView ? 0.6 : (showReferenceGhost ? 0.5 : 0.88)}
                    strokeDasharray={isOppositeView ? '7 5' : (showReferenceGhost ? '10 6' : 'none')}
                    className={isInteractive || onHoverPoint ? 'cursor-pointer pointer-events-auto hover:opacity-100 hover:stroke-[8] transition-all' : ''}
                    onPointerEnter={() => onHoverPoint?.({ 
                      point: { x: (orig.x + ins.x) / 2, y: (orig.y + ins.y) / 2 }, 
                      type: 'line', 
                      muscle,
                      label: muscle.name
                    })}
                    onPointerLeave={() => onHoverPoint?.(null)}
                    onClick={(e) => {
                      if (isInteractive && onSelectMuscle) {
                        e.stopPropagation();
                        onSelectMuscle(muscle.id);
                      }
                    }}
                  >
                    <title>{tooltipText}</title>
                  </path>
                </React.Fragment>
              );
            })}
          </g>
        );
      })}

      {/* 2. Origo's (Cirkels met O aanduiding, in de spierkleur bij meervoudige selectie) */}
      {sidesToRender.map((side) => {
        const visual = muscle.visuals[side];
        if (!visual || !visual.origins) return null;

        const origins = isOppositeView
          ? visual.origins.map(mirrorPoint)
          : visual.origins;

        return origins.map((origin, idx) => {
          const cx = toSvgX(origin.x);
          const cy = toSvgY(origin.y);
          const isHighlighted = highlightedPoint?.x === origin.x && highlightedPoint?.y === origin.y;
          const origName = origin.name || muscle.originText;
          const markerColor = color || '#2563eb';

          return (
            <g
              key={`origin-${side}-${idx}`}
              className={`group ${isInteractive || onHoverPoint ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
              onPointerEnter={() => onHoverPoint?.({ 
                point: origin, 
                type: 'origin', 
                muscle, 
                label: origName 
              })}
              onPointerLeave={() => onHoverPoint?.(null)}
              onClick={(e) => {
                if (isInteractive && onSelectMuscle) {
                  e.stopPropagation();
                  onSelectMuscle(muscle.id);
                }
              }}
            >
              <title>{`${muscle.name} (Origo: ${origName})`}</title>
              {/* Buitenste pulserende ring wanneer het juiste antwoord getoond wordt */}
              {showReferenceGhost && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={26 / zoom}
                  fill="rgba(37, 99, 235, 0.25)"
                  stroke="#3b82f6"
                  strokeWidth={2.5 / zoom}
                  className="animate-pulse"
                />
              )}
              {/* Buitenste cirkel */}
              <circle
                cx={cx}
                cy={cy}
                r={(isHighlighted || showReferenceGhost ? 18 : 14) / zoom}
                fill={showReferenceGhost ? '#2563eb' : markerColor}
                fillOpacity={isOppositeView ? 0.75 : 1.0}
                stroke="#ffffff"
                strokeWidth={(isOppositeView ? 2.5 : (showReferenceGhost ? 4 : 3.5)) / zoom}
                strokeDasharray={isOppositeView ? "4 2" : "none"}
              />

              {/* Binnenste O letter */}
              <text
                x={cx}
                y={cy + (1 / zoom)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.round((showReferenceGhost ? 12 : 11) / zoom)}
                fontWeight="black"
                className="select-none pointer-events-none"
              >
                O
              </text>
            </g>
          );
        });
      })}

      {/* 3. Inserties (Cirkels met I aanduiding, in de spierkleur bij meervoudige selectie) */}
      {sidesToRender.map((side) => {
        const visual = muscle.visuals[side];
        if (!visual || !visual.insertions) return null;

        const insertions = isOppositeView
          ? visual.insertions.map(mirrorPoint)
          : visual.insertions;

        return insertions.map((insertion, idx) => {
          const cx = toSvgX(insertion.x);
          const cy = toSvgY(insertion.y);
          const isHighlighted = highlightedPoint?.x === insertion.x && highlightedPoint?.y === insertion.y;
          const insName = insertion.name || muscle.insertionText;
          const markerColor = color || '#dc2626';

          return (
            <g
              key={`insertion-${side}-${idx}`}
              className={`group ${isInteractive || onHoverPoint ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}`}
              onPointerEnter={() => onHoverPoint?.({ 
                point: insertion, 
                type: 'insertion', 
                muscle, 
                label: insName 
              })}
              onPointerLeave={() => onHoverPoint?.(null)}
              onClick={(e) => {
                if (isInteractive && onSelectMuscle) {
                  e.stopPropagation();
                  onSelectMuscle(muscle.id);
                }
              }}
            >
              <title>{`${muscle.name} (Insertie: ${insName})`}</title>
              {/* Buitenste pulserende ring wanneer het juiste antwoord getoond wordt */}
              {showReferenceGhost && (
                <circle
                  cx={cx}
                  cy={cy}
                  r={26 / zoom}
                  fill="rgba(220, 38, 38, 0.25)"
                  stroke="#ef4444"
                  strokeWidth={2.5 / zoom}
                  className="animate-pulse"
                />
              )}
              {/* Buitenste cirkel */}
              <circle
                cx={cx}
                cy={cy}
                r={(isHighlighted || showReferenceGhost ? 18 : 14) / zoom}
                fill={showReferenceGhost ? '#dc2626' : markerColor}
                fillOpacity={isOppositeView ? 0.75 : 1.0}
                stroke="#ffffff"
                strokeWidth={(isOppositeView ? 2.5 : (showReferenceGhost ? 4 : 3.5)) / zoom}
                strokeDasharray={isOppositeView ? "4 2" : "none"}
              />

              {/* Binnenste I letter */}
              <text
                x={cx}
                y={cy + (1 / zoom)}
                textAnchor="middle"
                dominantBaseline="middle"
                fill="#ffffff"
                fontSize={Math.round((showReferenceGhost ? 12 : 11) / zoom)}
                fontWeight="black"
                className="select-none pointer-events-none"
              >
                I
              </text>
            </g>
          );
        });
      })}

      {/* 4. Quiz resultaten overlays (indien aanwezig) */}
      {quizMatches && quizMatches.map((m, idx) => {
        const cx = toSvgX(m.userPoint.x);
        const cy = toSvgY(m.userPoint.y);

        let color = '#dc2626'; // incorrect
        let text = '✗';
        if (m.accuracy === 'correct') {
          color = '#16a34a';
          text = '✓';
        } else if (m.accuracy === 'close') {
          color = '#eab308';
          text = '~';
        }

        return (
          <g key={`quiz-match-${idx}`} className="animate-in zoom-in-50 duration-200">
            {/* Tolerantiecirkel rond het punt */}
            <circle
              cx={cx}
              cy={cy}
              r={TOLERANCE_VISUAL_RADIUS(m.accuracy)}
              fill={color}
              opacity="0.2"
            />
            {/* Marker punt */}
            <circle
              cx={cx}
              cy={cy}
              r={16 / zoom}
              fill={color}
              stroke="#ffffff"
              strokeWidth={3 / zoom}
            />
            {/* Symbool */}
            <text
              x={cx}
              y={cy + (1 / zoom)}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="#ffffff"
              fontSize={Math.round(14 / zoom)}
              fontWeight="900"
            >
              {text}
            </text>
          </g>
        );
      })}
    </g>
  );
};

function TOLERANCE_VISUAL_RADIUS(accuracy: 'correct' | 'close' | 'incorrect'): number {
  if (accuracy === 'correct') return 35;
  if (accuracy === 'close') return 70;
  return 25;
}
