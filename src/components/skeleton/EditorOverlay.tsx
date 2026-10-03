import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  Muscle, 
  Point2D, 
  EditorTool, 
  EditSymmetrySide, 
  MuscleVisualData 
} from '../../types/anatomy';
import { clientToNormalized, getMuscleConnections } from '../../utils/coordinates';
import { SVG_WIDTH, SVG_HEIGHT } from './MuscleMarkers';
import { useZoom, usePanMode } from './SkeletonViewer';

interface EditorOverlayProps {
  muscle: Muscle;
  activeSide: EditSymmetrySide;
  activeTool: EditorTool;
  containerRef: React.RefObject<HTMLDivElement>;
  selectedPoint: { point: Point2D; type: 'origin' | 'insertion' | 'path' | 'line_point'; index: number; lineIndex?: number } | null;
  onSelectPoint: (item: { point: Point2D; type: 'origin' | 'insertion' | 'path' | 'line_point'; index: number; lineIndex?: number } | null) => void;
  onUpdateVisuals: (newVisuals: MuscleVisualData) => void;
  onPointAdded?: (type: 'origin' | 'insertion' | 'path', point: Point2D) => void;
  showTooltip?: boolean;
}

export const EditorOverlay: React.FC<EditorOverlayProps> = ({
  muscle,
  activeSide,
  activeTool,
  containerRef,
  selectedPoint,
  onSelectPoint,
  onUpdateVisuals,
  onPointAdded,
  showTooltip = true,
}) => {
  const zoom = useZoom();
  const panMode = usePanMode();
  const currentVisuals: MuscleVisualData = muscle.visuals[activeSide] || {
    origins: [],
    insertions: [],
    musclePath: [],
    attachmentLines: [],
  };

  const [draggedItem, setDraggedItem] = useState<{
    type: 'origin' | 'insertion' | 'path' | 'line_point';
    index: number;
    lineIndex?: number;
    startPoint: Point2D;
  } | null>(null);

  const [hoveredPoint, setHoveredPoint] = useState<{
    point: Point2D;
    type: 'origin' | 'insertion' | 'path' | 'line_point';
    index: number;
    lineIndex?: number;
    lineName?: string;
  } | null>(null);
  const isDraggingRef = useRef(false);

  const toSvgX = (x: number) => x * SVG_WIDTH;
  const toSvgY = (y: number) => y * SVG_HEIGHT;

  // Pointer move handler voor slepen
  const handlePointerMove = useCallback((e: PointerEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const currentNorm = clientToNormalized(e.clientX, e.clientY, rect);

    if (draggedItem && isDraggingRef.current) {
      const type = draggedItem.type;
      const idx = draggedItem.index;

      const newOrigins = [...currentVisuals.origins];
      const newInsertions = [...currentVisuals.insertions];

      if (type === 'origin') {
        const existingName = currentVisuals.origins[idx]?.name;
        const updatedPoint: Point2D = { ...currentNorm, name: existingName };
        newOrigins[idx] = updatedPoint;
        onUpdateVisuals({
          ...currentVisuals,
          origins: newOrigins,
        });
        onSelectPoint({
          point: updatedPoint,
          type,
          index: idx,
        });
      } else if (type === 'insertion') {
        const existingName = currentVisuals.insertions[idx]?.name;
        const updatedPoint: Point2D = { ...currentNorm, name: existingName };
        newInsertions[idx] = updatedPoint;
        onUpdateVisuals({
          ...currentVisuals,
          insertions: newInsertions,
        });
        onSelectPoint({
          point: updatedPoint,
          type,
          index: idx,
        });
      } else if (type === 'path') {
        const newPath = [...(currentVisuals.musclePath || [])];
        const existingName = newPath[idx]?.name;
        const updatedPoint: Point2D = { ...currentNorm, name: existingName };
        newPath[idx] = updatedPoint;
        onUpdateVisuals({
          ...currentVisuals,
          musclePath: newPath,
        });
        onSelectPoint({
          point: updatedPoint,
          type,
          index: idx,
        });
      } else if (type === 'line_point' && draggedItem.lineIndex !== undefined) {
        const newLines = [...(currentVisuals.attachmentLines || [])];
        const lineIdx = draggedItem.lineIndex;
        if (newLines[lineIdx]) {
          const line = { ...newLines[lineIdx] };
          const pts = [...line.points];
          pts[idx] = { ...currentNorm, name: pts[idx]?.name };
          line.points = pts;
          newLines[lineIdx] = line;
          onUpdateVisuals({
            ...currentVisuals,
            attachmentLines: newLines,
          });
          onSelectPoint({
            point: pts[idx],
            type: 'line_point',
            index: idx,
            lineIndex: lineIdx,
          });
        }
      }
    }
  }, [containerRef, draggedItem, currentVisuals, onUpdateVisuals, onSelectPoint]);

  // Pointer up handler om slepen te beëindigen
  const handlePointerUp = useCallback(() => {
    if (draggedItem) {
      setTimeout(() => {
        isDraggingRef.current = false;
        setDraggedItem(null);
      }, 50);
    }
  }, [draggedItem]);

  useEffect(() => {
    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
    return () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };
  }, [handlePointerMove, handlePointerUp]);

  // Klik op het canvas om een punt toe te voegen in de actieve modus (niet in versleep/pan modus!)
  const handleSvgClick = (e: React.MouseEvent<SVGSVGElement>) => {
    if (panMode) return;
    if (e.button !== 0) return;
    if (isDraggingRef.current) return;
    if (!containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const norm = clientToNormalized(e.clientX, e.clientY, rect);

    if (activeTool === 'origin') {
      const pointWithName: Point2D = {
        ...norm,
        name: currentVisuals.origins.length === 0 ? muscle.originText : `Origo ${currentVisuals.origins.length + 1}`
      };
      const newOrigins = [...currentVisuals.origins, pointWithName];
      onUpdateVisuals({
        ...currentVisuals,
        origins: newOrigins,
      });
      onSelectPoint({ point: pointWithName, type: 'origin', index: newOrigins.length - 1 });
      onPointAdded?.('origin', pointWithName);
    } else if (activeTool === 'insertion') {
      const pointWithName: Point2D = {
        ...norm,
        name: currentVisuals.insertions.length === 0 ? muscle.insertionText : `Insertie ${currentVisuals.insertions.length + 1}`
      };
      const newInsertions = [...currentVisuals.insertions, pointWithName];
      onUpdateVisuals({
        ...currentVisuals,
        insertions: newInsertions,
      });
      onSelectPoint({ point: pointWithName, type: 'insertion', index: newInsertions.length - 1 });
      onPointAdded?.('insertion', pointWithName);
    } else if (activeTool === 'origin_line' || activeTool === 'insertion_line') {
      const lineType = activeTool === 'origin_line' ? 'origin' : 'insertion';
      const existingLines = [...(currentVisuals.attachmentLines || [])];
      
      // Zoek of er al een actieve lijn van dit type geselecteerd is, of pak de laatste lijn van dit type
      let targetLineIndex = -1;
      if (selectedPoint?.type === 'line_point' && selectedPoint.lineIndex !== undefined && existingLines[selectedPoint.lineIndex]?.type === lineType) {
        targetLineIndex = selectedPoint.lineIndex;
      } else {
        targetLineIndex = existingLines.map((l, i) => ({ l, i })).reverse().find(({ l }) => l.type === lineType)?.i ?? -1;
      }

      if (targetLineIndex === -1) {
        // Maak een nieuwe lijn
        const defaultName = lineType === 'origin'
          ? (muscle.originText || 'Origo-lijn (zone)')
          : (muscle.insertionText || 'Insertie-lijn (zone)');
        const newLine = {
          id: `line-${lineType}-${Date.now()}`,
          type: lineType as 'origin' | 'insertion',
          name: defaultName,
          points: [norm],
          tolerance: 0.045,
        };
        existingLines.push(newLine);
        onUpdateVisuals({
          ...currentVisuals,
          attachmentLines: existingLines,
        });
        onSelectPoint({
          point: norm,
          type: 'line_point',
          index: 0,
          lineIndex: existingLines.length - 1,
        });
        onPointAdded?.(lineType === 'origin' ? 'origin' : 'insertion', norm);
      } else {
        const targetLine = { ...existingLines[targetLineIndex] };
        targetLine.points = [...targetLine.points, norm];
        existingLines[targetLineIndex] = targetLine;
        onUpdateVisuals({
          ...currentVisuals,
          attachmentLines: existingLines,
        });
        onSelectPoint({
          point: norm,
          type: 'line_point',
          index: targetLine.points.length - 1,
          lineIndex: targetLineIndex,
        });
        onPointAdded?.(lineType === 'origin' ? 'origin' : 'insertion', norm);
      }
    } else if (activeTool === 'path') {
      const currentPath = currentVisuals.musclePath || [];
      const pointWithName: Point2D = {
        ...norm,
        name: `Curve-punt ${currentPath.length + 1}`
      };
      const newPath = [...currentPath, pointWithName];
      onUpdateVisuals({
        ...currentVisuals,
        musclePath: newPath,
      });
      onSelectPoint({ point: pointWithName, type: 'path', index: newPath.length - 1 });
      onPointAdded?.('path', pointWithName);
    } else if (activeTool === 'select') {
      onSelectPoint(null);
    }
  };

  // Pointerdown op een marker om slepen te starten
  const startDrag = (
    e: React.PointerEvent,
    type: 'origin' | 'insertion' | 'path',
    index: number,
    point: Point2D
  ) => {
    e.stopPropagation();
    e.preventDefault();
    isDraggingRef.current = true;
    setDraggedItem({ type, index, startPoint: point });
    onSelectPoint({ point, type, index });
  };

  return (
    <>
      <svg
        viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
        preserveAspectRatio="none"
        onClick={handleSvgClick}
        className={`absolute inset-0 w-full h-full touch-canvas z-20 ${
          panMode ? 'pointer-events-none' : 'cursor-crosshair'
        }`}
      >
      {/* 0. Aanhechtingslijnen / Tolerantie-zones (Linea alba, crista iliaca, wervelkolom) */}
      {(currentVisuals.attachmentLines || []).map((line, lineIdx) => {
        const isOrigin = line.type === 'origin';
        const strokeColor = isOrigin ? '#2563eb' : '#dc2626';
        const haloColor = isOrigin ? '#3b82f6' : '#ef4444';
        const pts = line.points || [];
        if (pts.length === 0) return null;

        const pathD = pts.length >= 2
          ? `M ${toSvgX(pts[0].x)} ${toSvgY(pts[0].y)} ` + pts.slice(1).map(p => `L ${toSvgX(p.x)} ${toSvgY(p.y)}`).join(' ')
          : '';

        return (
          <g key={`attach-line-${line.id || lineIdx}`}>
            {/* Halo representeert de anatomische tolerantiezone (~4.5 cm / wervelbreedte) */}
            {pts.length >= 2 && (
              <path
                d={pathD}
                fill="none"
                stroke={haloColor}
                strokeWidth={36}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.28"
                className="pointer-events-none"
              />
            )}
            {/* Gestreepte hartlijn van de zone */}
            {pts.length >= 2 && (
              <path
                d={pathD}
                fill="none"
                stroke={strokeColor}
                strokeWidth={3.5 / zoom}
                strokeDasharray={`${6 / zoom} ${4 / zoom}`}
                strokeLinecap="round"
                strokeLinejoin="round"
                opacity="0.92"
                className="pointer-events-none"
              />
            )}
            {/* Handvatten op de knikpunten van de zone */}
            {pts.map((pt, ptIdx) => {
              const cx = toSvgX(pt.x);
              const cy = toSvgY(pt.y);
              const isSelected = selectedPoint?.type === 'line_point' &&
                selectedPoint?.lineIndex === lineIdx &&
                selectedPoint?.index === ptIdx;

              return (
                <g
                  key={`attach-pt-${lineIdx}-${ptIdx}`}
                  onPointerDown={(e) => {
                    e.stopPropagation();
                    e.preventDefault();
                    isDraggingRef.current = true;
                    setDraggedItem({ type: 'line_point', index: ptIdx, lineIndex: lineIdx, startPoint: pt });
                    onSelectPoint({ point: pt, type: 'line_point', index: ptIdx, lineIndex: lineIdx });
                  }}
                  onPointerEnter={() => setHoveredPoint({
                    point: pt,
                    type: 'line_point',
                    index: ptIdx,
                    lineIndex: lineIdx,
                    lineName: line.name
                  })}
                  onPointerLeave={() => setHoveredPoint(null)}
                  className="cursor-move group"
                >
                  <title>{`${line.name} (Punt ${ptIdx + 1})`}</title>
                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={22 / zoom}
                      fill="none"
                      stroke={strokeColor}
                      strokeWidth={3.5 / zoom}
                      className="animate-pulse"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={(isSelected ? 13 : 9) / zoom}
                    fill="#ffffff"
                    stroke={strokeColor}
                    strokeWidth={3 / zoom}
                  />
                  <circle cx={cx} cy={cy} r={3 / zoom} fill={strokeColor} />
                  <text
                    x={cx + (15 / zoom)}
                    y={cy + (4 / zoom)}
                    fill="#ffffff"
                    stroke="#0f172a"
                    strokeWidth={3 / zoom}
                    paintOrder="stroke fill"
                    fontSize={Math.round(11 / zoom)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    {isOrigin ? `O-zone ${lineIdx + 1}.${ptIdx + 1}` : `I-zone ${lineIdx + 1}.${ptIdx + 1}`}
                  </text>
                </g>
              );
            })}
          </g>
        );
      })}

      {/* 1. Spierverloop (rechte lijnen of curves tussen alle origo's en inserties) */}
      {(() => {
        const pathPoints = currentVisuals.musclePath || [];
        const connections = getMuscleConnections(currentVisuals.origins, currentVisuals.insertions);
        return connections.map(({ orig, ins, oIdx, iIdx }) => {
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
            <path
              key={`editor-line-${oIdx}-${iIdx}`}
              d={pathD}
              fill="none"
              stroke="#e11d48"
              strokeWidth={Math.max(1, 7 / zoom)}
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.88"
            />
          );
        });
      })()}

      {/* 2. Origo's */}
      {currentVisuals.origins.map((origin, idx) => {
        const cx = toSvgX(origin.x);
        const cy = toSvgY(origin.y);
        const isSelected = selectedPoint?.type === 'origin' && selectedPoint?.index === idx;
        const ptName = origin.name || muscle.originText || `Origo ${idx + 1}`;

        return (
          <g
            key={`orig-${idx}`}
            onPointerDown={(e) => startDrag(e, 'origin', idx, origin)}
            onPointerEnter={() => setHoveredPoint({ point: origin, type: 'origin', index: idx })}
            onPointerLeave={() => setHoveredPoint(null)}
            className="cursor-move group"
          >
            <title>{`${muscle.name} (Origo ${idx + 1}: ${ptName})`}</title>
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={28 / zoom}
                fill="none"
                stroke="#3b82f6"
                strokeWidth={4 / zoom}
                className="animate-pulse"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={(isSelected ? 20 : 16) / zoom}
              fill="#2563eb"
              stroke="#ffffff"
              strokeWidth={4 / zoom}
            />
            <circle cx={cx} cy={cy} r={5 / zoom} fill="#ffffff" />
            <text
              x={cx + (24 / zoom)}
              y={cy + (5 / zoom)}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={3.5 / zoom}
              paintOrder="stroke fill"
              fontSize={Math.round(14 / zoom)}
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              O{idx + 1}
            </text>
          </g>
        );
      })}

      {/* 3. Inserties */}
      {currentVisuals.insertions.map((ins, idx) => {
        const cx = toSvgX(ins.x);
        const cy = toSvgY(ins.y);
        const isSelected = selectedPoint?.type === 'insertion' && selectedPoint?.index === idx;
        const ptName = ins.name || muscle.insertionText || `Insertie ${idx + 1}`;

        return (
          <g
            key={`ins-${idx}`}
            onPointerDown={(e) => startDrag(e, 'insertion', idx, ins)}
            onPointerEnter={() => setHoveredPoint({ point: ins, type: 'insertion', index: idx })}
            onPointerLeave={() => setHoveredPoint(null)}
            className="cursor-move group"
          >
            <title>{`${muscle.name} (Insertie ${idx + 1}: ${ptName})`}</title>
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={28 / zoom}
                fill="none"
                stroke="#ef4444"
                strokeWidth={4 / zoom}
                className="animate-pulse"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={(isSelected ? 20 : 16) / zoom}
              fill="#dc2626"
              stroke="#ffffff"
              strokeWidth={4 / zoom}
            />
            <rect
              x={cx - (4 / zoom)}
              y={cy - (4 / zoom)}
              width={8 / zoom}
              height={8 / zoom}
              fill="#ffffff"
              transform={`rotate(45 ${cx} ${cy})`}
            />
            <text
              x={cx + (24 / zoom)}
              y={cy + (5 / zoom)}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={3.5 / zoom}
              paintOrder="stroke fill"
              fontSize={Math.round(14 / zoom)}
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              I{idx + 1}
            </text>
          </g>
        );
      })}

      {/* 4. Verlooppunten / Waypoints (Curve controlepunten) */}
      {currentVisuals.musclePath?.map((wpt, idx) => {
        const cx = toSvgX(wpt.x);
        const cy = toSvgY(wpt.y);
        const isSelected = selectedPoint?.type === 'path' && selectedPoint?.index === idx;
        const ptName = wpt.name || `Curve-punt ${idx + 1}`;

        return (
          <g
            key={`wpt-${idx}`}
            onPointerDown={(e) => startDrag(e, 'path', idx, wpt)}
            onPointerEnter={() => setHoveredPoint({ point: wpt, type: 'path', index: idx })}
            onPointerLeave={() => setHoveredPoint(null)}
            className="cursor-move group"
          >
            <title>{`${muscle.name} (${ptName})`}</title>
            {isSelected && (
              <circle
                cx={cx}
                cy={cy}
                r={28 / zoom}
                fill="none"
                stroke="#f59e0b"
                strokeWidth={4 / zoom}
                className="animate-pulse"
              />
            )}
            <circle
              cx={cx}
              cy={cy}
              r={(isSelected ? 20 : 16) / zoom}
              fill="#d97706"
              stroke="#ffffff"
              strokeWidth={4 / zoom}
            />
            <circle cx={cx} cy={cy} r={4 / zoom} fill="#ffffff" />
            <text
              x={cx + (24 / zoom)}
              y={cy + (5 / zoom)}
              fill="#ffffff"
              stroke="#0f172a"
              strokeWidth={3.5 / zoom}
              paintOrder="stroke fill"
              fontSize={Math.round(14 / zoom)}
              fontWeight="bold"
              className="pointer-events-none select-none"
            >
              C{idx + 1}
            </text>
          </g>
        );
      })}

    </svg>

    {/* 5. Grote, duidelijke en uitschakelbare HTML Tooltip bij hover over een punt */}
    {showTooltip && hoveredPoint && (
      <div
        style={{
          position: 'absolute',
          left: `${hoveredPoint.point.x * 100}%`,
          top: `${hoveredPoint.point.y * 100}%`,
          transform: `translate(-50%, -125%) scale(${1 / zoom})`,
          transformOrigin: 'bottom center',
        }}
        className="z-50 pointer-events-none select-none transition-all duration-75"
      >
        <div className="bg-slate-900/95 text-white px-3.5 py-2.5 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex flex-col items-center gap-1 min-w-[200px] max-w-[340px] text-center">
          <div className="flex items-center gap-2">
            <span className={`w-3 h-3 rounded-full shrink-0 ${
              hoveredPoint.type === 'origin' ? 'bg-blue-500 ring-2 ring-blue-400/50' :
              hoveredPoint.type === 'insertion' ? 'bg-red-500 ring-2 ring-red-400/50' :
              hoveredPoint.type === 'line_point' ? 'bg-indigo-400 ring-2 ring-indigo-300/50' :
              'bg-amber-400 ring-2 ring-amber-300/50'
            }`} />
            <span className="text-sm font-bold text-white tracking-wide">
              {hoveredPoint.point.name || (
                hoveredPoint.type === 'origin' ? (muscle.originText || 'Origo') :
                hoveredPoint.type === 'insertion' ? (muscle.insertionText || 'Insertie') :
                hoveredPoint.type === 'line_point' ? (hoveredPoint.lineName || 'Aanhechtingslijn / Zone') :
                'Curve-punt'
              )}
            </span>
          </div>
          <div className="text-xs text-slate-300 font-mono flex items-center gap-1.5">
            <span className="font-semibold text-slate-200">
              {hoveredPoint.type === 'origin' ? 'Origo' :
               hoveredPoint.type === 'insertion' ? 'Insertie' :
               hoveredPoint.type === 'line_point' ? `Zone #${(hoveredPoint.lineIndex ?? 0) + 1} Punt` :
               'Curve'} #{hoveredPoint.index + 1}
            </span>
          </div>
        </div>
        <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900/95 mx-auto -mt-0.5" />
      </div>
    )}
  </>
  );
};
