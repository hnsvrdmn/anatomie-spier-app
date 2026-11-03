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
  uniformColor?: string;
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
  '#1993f2', // Blauw
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
  uniformColor,
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

  // Bepaal of deze specifieke spier niet geselecteerd is en aan de achterkant/andere kant ligt
  const isOppositeUnselected = isDimmed && isOppositeView;

  // Bepaal de effectieve groep-opacity:
  // Geselecteerde spier staat altijd scherp en op de voorgrond (1.0).
  // Niet-geselecteerde spieren zijn zacht getoond zonder storende desaturatie.
  const effectiveGroupOpacity = isDimmed
    ? (isOppositeView ? 0.38 : 0.65)
    : (isOppositeView ? 0.6 : (opacity !== undefined ? opacity : 1.0));

  const isSelectedMuscle = !isDimmed;
  const useGradient = !uniformColor && (isSelectedMuscle || showReferenceGhost) && !isOppositeUnselected;

  // Afmetingen: bolletjes net een tikje kleiner en fijne naadloze outline
  const rBase = (highlightedPoint || showReferenceGhost ? 11.5 : 10) / zoom;
  const outlinePadding = 1.6 / zoom;
  const outlineR = rBase + outlinePadding;

  const lineWidth = (isOppositeView ? 4.5 : (showReferenceGhost ? 8.5 : (isSelectedMuscle ? 7.5 : 4.5))) / zoom;
  const outlineLineWidth = lineWidth + (outlinePadding * 2);

  // Kleurbepaling:
  // 1. In bewegingstab (uniformColor): ALLES zuiver uniformColor (#1993f2)
  // 2. In study tab voor niet-geselecteerde spieren (isDimmed): strak grijs (#94a3b8)
  // 3. Voor geselecteerde spier: origo blauw (#1993f2) en insertie oranje (#ea580c)
  const defaultGray = '#94a3b8';
  const origColor = uniformColor
    ? uniformColor
    : isDimmed
    ? defaultGray
    : isOppositeUnselected
    ? defaultGray
    : (!isDimmed || showReferenceGhost ? '#1993f2' : (color || '#1993f2'));

  const insColor = uniformColor
    ? uniformColor
    : isDimmed
    ? defaultGray
    : isOppositeUnselected
    ? defaultGray
    : (!isDimmed || showReferenceGhost ? '#ea580c' : (color || '#ea580c'));

  // Bereken alle geometrische elementen per zijde
  const sideData = sidesToRender.map((side) => {
    const visual = muscle.visuals[side];
    if (!visual || !visual.origins?.length || !visual.insertions?.length) return null;

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

    const pathDList = connections.map(({ orig, ins }) => {
      if (pathPoints.length === 1) {
        const ctrl = pathPoints[0];
        return `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} Q ${toSvgX(ctrl.x)} ${toSvgY(ctrl.y)} ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
      } else if (pathPoints.length === 2) {
        const c1 = pathPoints[0];
        const c2 = pathPoints[1];
        return `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} C ${toSvgX(c1.x)} ${toSvgY(c1.y)} ${toSvgX(c2.x)} ${toSvgY(c2.y)} ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
      } else if (pathPoints.length > 2) {
        return `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} ` +
          pathPoints.map(p => `L ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ') +
          ` L ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
      } else {
        return `M ${toSvgX(orig.x)} ${toSvgY(orig.y)} L ${toSvgX(ins.x)} ${toSvgY(ins.y)}`;
      }
    });

    return {
      side,
      visual,
      origins,
      insertions,
      pathPoints,
      connections,
      pathDList,
    };
  }).filter(Boolean) as {
    side: 'left' | 'right' | 'midline';
    visual: NonNullable<Muscle['visuals']['left']>;
    origins: Point2D[];
    insertions: Point2D[];
    pathPoints: Point2D[];
    connections: ReturnType<typeof getMuscleConnections>;
    pathDList: string[];
  }[];

  return (
    <g className={`muscle-markers-group ${isInteractive ? 'pointer-events-auto' : 'pointer-events-none'} transition-opacity duration-300`} opacity={effectiveGroupOpacity}>
      {/* 0. Linea alba zone blijft conform verzoek altijd zichtbaar als anatomische referentielijn */}
      {sidesToRender.map((side) => {
        const visual = muscle.visuals[side];
        if (!visual || !visual.attachmentLines || visual.attachmentLines.length === 0) return null;

        const visibleLines = visual.attachmentLines.filter((line) =>
          (line.name || '').toLowerCase().includes('linea alba') ||
          (line.id || '').toLowerCase().includes('linea')
        );
        if (visibleLines.length === 0) return null;

        return visibleLines.map((line, lIdx) => {
          const rawPts = line.points || [];
          if (rawPts.length < 2) return null;

          const pts = isOppositeView ? rawPts.map(mirrorPoint) : rawPts;
          const isOrigin = line.type === 'origin';
          const strokeColor = uniformColor
            ? uniformColor
            : isDimmed
            ? defaultGray
            : isOppositeUnselected
            ? defaultGray
            : (isOrigin ? '#1993f2' : '#ea580c');

          const pathD = `M ${toSvgX(pts[0].x)} ${toSvgY(pts[0].y)} ` +
            pts.slice(1).map(p => `L ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ');

          return (
            <g key={`marker-attach-line-${side}-${line.id || lIdx}`}>
              {showReferenceGhost && (
                <path
                  d={pathD}
                  fill="none"
                  stroke={isOrigin ? '#1993f2' : '#ea580c'}
                  strokeWidth={22 / zoom}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.22}
                  className="pointer-events-none animate-pulse"
                />
              )}
              {/* Witte contour eronder voor maximaal contrast en leesbaarheid tegen skelet */}
              <path
                d={pathD}
                fill="none"
                stroke="#ffffff"
                strokeWidth={(showReferenceGhost ? 6.5 : 5) / zoom}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isOppositeView ? 0.45 : 0.85}
                className="pointer-events-none"
              />
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={(showReferenceGhost ? 4.2 : 3) / zoom}
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

      {/* Gradiënten voor de spierverlooplijnen */}
      <defs>
        {sideData.map(({ side, connections }) =>
          connections.map(({ orig, ins, oIdx, iIdx }) => {
            const gradId = `muscle-line-grad-${muscle.id}-${side}-${oIdx}-${iIdx}`;
            return (
              <linearGradient
                key={gradId}
                id={gradId}
                x1={toSvgX(orig.x)}
                y1={toSvgY(orig.y)}
                x2={toSvgX(ins.x)}
                y2={toSvgY(ins.y)}
                gradientUnits="userSpaceOnUse"
              >
                <stop offset="0%" stopColor="#1993f2" />
                <stop offset="100%" stopColor="#ea580c" />
              </linearGradient>
            );
          })
        )}
      </defs>

      {/* Halo's bij tonen van het juiste antwoord (ghost evaluatie) */}
      {showReferenceGhost && (
        <g className="pointer-events-none">
          {sideData.map(({ side, connections, origins, insertions, pathDList }) => (
            <React.Fragment key={`ghost-${side}`}>
              {connections.map((_, cIdx) => (
                <path
                  key={`ghost-line-${side}-${cIdx}`}
                  d={pathDList[cIdx]}
                  fill="none"
                  stroke="#ea580c"
                  strokeWidth={14 / zoom}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={0.25}
                  className="animate-pulse"
                />
              ))}
              {origins.map((orig, idx) => (
                <circle
                  key={`ghost-orig-${side}-${idx}`}
                  cx={toSvgX(orig.x)}
                  cy={toSvgY(orig.y)}
                  r={22 / zoom}
                  fill="rgba(25, 147, 242, 0.22)"
                  stroke="#1993f2"
                  strokeWidth={1.5 / zoom}
                  className="animate-pulse"
                />
              ))}
              {insertions.map((ins, idx) => (
                <circle
                  key={`ghost-ins-${side}-${idx}`}
                  cx={toSvgX(ins.x)}
                  cy={toSvgY(ins.y)}
                  r={22 / zoom}
                  fill="rgba(234, 88, 12, 0.22)"
                  stroke="#ea580c"
                  strokeWidth={1.5 / zoom}
                  className="animate-pulse"
                />
              ))}
            </React.Fragment>
          ))}
        </g>
      )}

      {/* LAAG 1: Volledig doorlopende witte outline achter de hele spier (lijnen EN bolletjes)
          Doordat alle witte lijnen en cirkels in één laag vóór alle kleuren getekend worden,
          ontstaat één naadloos silhouet om de gehele spier en overlappen er NOOIT witte lijnen intern! */}
      <g className="pointer-events-none transition-opacity duration-200">
        {sideData.map(({ side, connections, origins, insertions, pathDList }) => (
          <React.Fragment key={`outline-${side}`}>
            {/* Lijnen outline */}
            {connections.map((_, cIdx) => (
              <path
                key={`outline-line-${side}-${cIdx}`}
                d={pathDList[cIdx]}
                fill="none"
                stroke="#ffffff"
                strokeWidth={outlineLineWidth}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity={isOppositeView ? 0.6 : 0.95}
              />
            ))}
            {/* Origo cirkels outline */}
            {origins.map((origin, idx) => (
              <circle
                key={`outline-orig-${side}-${idx}`}
                cx={toSvgX(origin.x)}
                cy={toSvgY(origin.y)}
                r={outlineR}
                fill="#ffffff"
                fillOpacity={isOppositeView ? 0.75 : 1.0}
              />
            ))}
            {/* Insertie cirkels outline */}
            {insertions.map((insertion, idx) => (
              <circle
                key={`outline-ins-${side}-${idx}`}
                cx={toSvgX(insertion.x)}
                cy={toSvgY(insertion.y)}
                r={outlineR}
                fill="#ffffff"
                fillOpacity={isOppositeView ? 0.75 : 1.0}
              />
            ))}
          </React.Fragment>
        ))}
      </g>

      {/* LAAG 2: Gekleurde vulling van de spier (lijnen en bolletjes)
          Ligt bovenop de witte silhouette; lijnen vloeien direct naadloos over in de aanhechtingspunten */}
      <g className="transition-opacity duration-200">
        {sideData.map(({ side, connections, origins, insertions, pathDList }) => (
          <React.Fragment key={`fill-${side}`}>
            {/* Gekleurde verbindingslijnen */}
            {connections.map(({ oIdx, iIdx }, cIdx) => {
              const gradId = `muscle-line-grad-${muscle.id}-${side}-${oIdx}-${iIdx}`;
              const lineStroke = uniformColor
                ? uniformColor
                : isDimmed
                ? defaultGray
                : isOppositeUnselected
                ? defaultGray
                : useGradient
                ? `url(#${gradId})`
                : (color || defaultGray);

              return (
                <path
                  key={`fill-line-${side}-${cIdx}`}
                  d={pathDList[cIdx]}
                  fill="none"
                  stroke={lineStroke}
                  strokeWidth={lineWidth}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  opacity={isOppositeView ? 0.6 : (showReferenceGhost ? 0.95 : 0.92)}
                  strokeDasharray={isOppositeView ? '7 5' : 'none'}
                  className="pointer-events-none"
                />
              );
            })}

            {/* Origo bolletjes (blauw #1993f2 of paletkleur bij meervoudige selectie) */}
            {origins.map((origin, idx) => {
              const cx = toSvgX(origin.x);
              const cy = toSvgY(origin.y);
              return (
                <circle
                  key={`fill-orig-${side}-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={rBase}
                  fill={showReferenceGhost ? '#1993f2' : origColor}
                  fillOpacity={isOppositeView ? 0.75 : 1.0}
                  stroke={isOppositeView ? '#ffffff' : 'none'}
                  strokeWidth={isOppositeView ? 1.5 / zoom : 0}
                  strokeDasharray={isOppositeView ? "3 2" : "none"}
                  className="pointer-events-none"
                />
              );
            })}

            {/* Insertie bolletjes (oranje #ea580c of paletkleur bij meervoudige selectie) */}
            {insertions.map((insertion, idx) => {
              const cx = toSvgX(insertion.x);
              const cy = toSvgY(insertion.y);
              return (
                <circle
                  key={`fill-ins-${side}-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={rBase}
                  fill={showReferenceGhost ? '#ea580c' : insColor}
                  fillOpacity={isOppositeView ? 0.75 : 1.0}
                  stroke={isOppositeView ? '#ffffff' : 'none'}
                  strokeWidth={isOppositeView ? 1.5 / zoom : 0}
                  strokeDasharray={isOppositeView ? "3 2" : "none"}
                  className="pointer-events-none"
                />
              );
            })}
          </React.Fragment>
        ))}
      </g>

      {/* LAAG 3: Interactieve klikzones, tooltips en hover handlers */}
      <g>
        {sideData.map(({ side, connections, origins, insertions, pathDList }) => (
          <React.Fragment key={`hit-${side}`}>
            {/* Klikzones voor spierverlooplijnen */}
            {isInteractive && connections.map(({ orig, ins }, cIdx) => (
              <path
                key={`hit-line-${side}-${cIdx}`}
                d={pathDList[cIdx]}
                fill="none"
                stroke="transparent"
                strokeWidth={Math.max(28, 36 / zoom)}
                strokeLinecap="round"
                strokeLinejoin="round"
                className="cursor-pointer pointer-events-auto"
                onPointerEnter={() => onHoverPoint?.({
                  point: { x: (orig.x + ins.x) / 2, y: (orig.y + ins.y) / 2 },
                  type: 'line',
                  muscle,
                  label: muscle.name,
                })}
                onPointerLeave={() => onHoverPoint?.(null)}
                onClick={(e) => {
                  if (onSelectMuscle) {
                    e.stopPropagation();
                    onSelectMuscle(muscle.id);
                  }
                }}
              >
                <title>{tooltipText}</title>
              </path>
            ))}

            {/* Klikzones en hover voor Origo's */}
            {origins.map((origin, idx) => {
              const cx = toSvgX(origin.x);
              const cy = toSvgY(origin.y);
              const origName = origin.name || muscle.originText;
              return (
                <circle
                  key={`hit-orig-${side}-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={Math.max(22, 26 / zoom)}
                  fill="transparent"
                  className={isInteractive || onHoverPoint ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                  onPointerEnter={() => onHoverPoint?.({
                    point: origin,
                    type: 'origin',
                    muscle,
                    label: origName,
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
                </circle>
              );
            })}

            {/* Klikzones en hover voor Inserties */}
            {insertions.map((insertion, idx) => {
              const cx = toSvgX(insertion.x);
              const cy = toSvgY(insertion.y);
              const insName = insertion.name || muscle.insertionText;
              return (
                <circle
                  key={`hit-ins-${side}-${idx}`}
                  cx={cx}
                  cy={cy}
                  r={Math.max(22, 26 / zoom)}
                  fill="transparent"
                  className={isInteractive || onHoverPoint ? 'pointer-events-auto cursor-pointer' : 'pointer-events-none'}
                  onPointerEnter={() => onHoverPoint?.({
                    point: insertion,
                    type: 'insertion',
                    muscle,
                    label: insName,
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
                </circle>
              );
            })}
          </React.Fragment>
        ))}
      </g>

      {/* 4. Quiz resultaten overlays (indien aanwezig) */}
      {quizMatches && quizMatches.map((m, idx) => {
        const cx = toSvgX(m.userPoint.x);
        const cy = toSvgY(m.userPoint.y);

        let color = '#dc2626'; // incorrect
        if (m.accuracy === 'correct') {
          color = '#16a34a';
        } else if (m.accuracy === 'close') {
          color = '#eab308';
        }

        return (
          <g key={`quiz-match-${idx}`} className="animate-in zoom-in-50 duration-200">
            {/* Tolerantiecirkel rond het punt */}
            <circle
              cx={cx}
              cy={cy}
              r={TOLERANCE_VISUAL_RADIUS(m.accuracy)}
              fill={color}
              opacity="0.16"
              className="pointer-events-none"
            />
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
