import React, { useRef, useState, useEffect, useMemo, createContext, useContext } from 'react';
import { AnatomicalView, Muscle, SymmetrySide, Point2D, MatchResult } from '../../types/anatomy';
import { MuscleMarkers, SVG_WIDTH, SVG_HEIGHT, MULTI_MUSCLE_COLORS } from './MuscleMarkers';
import { SKELETON_WIDTH, SKELETON_HEIGHT, clientToNormalized, getMuscleConnections } from '../../utils/coordinates';
import { ZoomIn, ZoomOut, RotateCcw, Hand, Eye, EyeOff, MousePointer } from 'lucide-react';

export interface ViewerContextValue {
  zoom: number;
  panMode: boolean;
}
export const ViewerContext = createContext<ViewerContextValue>({ zoom: 1, panMode: false });
export const useViewer = () => useContext(ViewerContext);
export const useZoom = () => useContext(ViewerContext).zoom;
export const usePanMode = () => useContext(ViewerContext).panMode;
export const ZoomContext = ViewerContext;

interface SkeletonViewerProps {
  currentView: AnatomicalView;
  activeMuscle?: Muscle;
  activeMuscles?: Muscle[];
  activeSide?: SymmetrySide | 'midline';
  markersOpacity?: number;
  interactive?: boolean;
  onSkeletonClick?: (point: Point2D, isRightClick?: boolean) => void;
  onUpdateUserPoint?: (type: 'origin' | 'insertion', index: number, newPoint: Point2D) => void;
  onDeleteUserPoint?: (type: 'origin' | 'insertion', index: number) => void;
  // Quiz gerelateerde props
  quizMatches?: MatchResult[];
  showReferenceGhost?: boolean;
  userQuizPoints?: Point2D[];
  userOrigins?: Point2D[];
  userInsertions?: Point2D[];
  // Extra interactieve selectie (bijv. in Studiemodus)
  onSelectMuscle?: (muscleId: string) => void;
  // Extra overlay kinderen (bijv. EditorOverlay)
  children?: React.ReactNode;
  // Gedeelde ref voor zoom/coördinatensynchronisatie
  innerRef?: React.RefObject<HTMLDivElement>;
  // Tooltip zichtbaarheid van buitenaf
  showTooltip?: boolean;
  onToggleTooltip?: (show: boolean) => void;
  hideZoomToolbar?: boolean;
  isMobile?: boolean;
  autoCenterMuscle?: boolean;
}

export const SkeletonViewer: React.FC<SkeletonViewerProps> = ({
  currentView,
  activeMuscle,
  activeMuscles,
  activeSide = 'both',
  markersOpacity,
  interactive = false,
  onSkeletonClick,
  onUpdateUserPoint,
  onDeleteUserPoint,
  onSelectMuscle,
  quizMatches,
  showReferenceGhost = false,
  userQuizPoints,
  userOrigins,
  userInsertions,
  children,
  innerRef,
  showTooltip: externalShowTooltip,
  onToggleTooltip,
  hideZoomToolbar = false,
  isMobile = false,
  autoCenterMuscle = false,
}) => {
  const localContainerRef = useRef<HTMLDivElement>(null);
  const containerRef = innerRef || localContainerRef;
  const scrollWrapperRef = useRef<HTMLDivElement>(null);
  const isDraggingPointRef = useRef(false);
  const isSpaceDownRef = useRef(false);
  const hasMovedRef = useRef(false);
  const lastTouchHandledTimeRef = useRef<number>(0);

  // Touch gebaren voor telefoon (pinch-to-zoom, 2-vinger pan, bescherming tegen per ongeluk plaatsen)
  const touchStateRef = useRef<{
    isPinching: boolean;
    startDistance: number;
    startZoom: number;
    startMidX: number;
    startMidY: number;
    startPanX: number;
    startPanY: number;
    singleTouchStart: { x: number; y: number } | null;
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

  // Zoom & Pan toestanden
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [panMode, setPanMode] = useState(false);
  const [internalShowTooltip, setInternalShowTooltip] = useState(true);

  const effectiveShowTooltip = externalShowTooltip !== undefined ? externalShowTooltip : internalShowTooltip;

  const handleToggleTooltip = () => {
    if (onToggleTooltip) {
      onToggleTooltip(!effectiveShowTooltip);
    } else {
      setInternalShowTooltip(v => !v);
    }
  };

  // Hover item toestand voor studiemodus
  const [hoveredInfo, setHoveredInfo] = useState<{
    point: Point2D;
    type: 'origin' | 'insertion' | 'line';
    muscle: Muscle;
    label?: string;
  } | null>(null);

  // Direct zoomen met het muiswiel (ook zonder Ctrl-toets)
  useEffect(() => {
    const el = scrollWrapperRef.current;
    if (!el) return;

    const handleNativeWheel = (e: WheelEvent) => {
      e.preventDefault();
      e.stopPropagation();
      const delta = -Math.sign(e.deltaY) * 0.25;
      setZoom(z => {
        const next = Math.max(1.0, Math.min(3.5, Number((z + delta).toFixed(2))));
        if (next === 1.0) setPan({ x: 0, y: 0 });
        return next;
      });
    };

    el.addEventListener('wheel', handleNativeWheel, { passive: false });
    return () => {
      el.removeEventListener('wheel', handleNativeWheel);
    };
  }, []);

  // Luister naar spatiebalk voor snelle 'hand'-modus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' && !['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) {
        isSpaceDownRef.current = true;
      }
    };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.code === 'Space') {
        isSpaceDownRef.current = false;
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, []);

  // Automatisch centreren en inzoomen op de getoonde spier (vooral op mobiel bij toetsvragen)
  useEffect(() => {
    if (!autoCenterMuscle) return;

    if (activeMuscle) {
      const pts: Point2D[] = [];
      const sides: ('left' | 'right' | 'midline')[] =
        activeMuscle.symmetryType === 'midline'
          ? ['midline']
          : activeSide === 'both'
          ? ['left', 'right']
          : [activeSide === 'midline' ? 'left' : activeSide];

      sides.forEach((s) => {
        const v = activeMuscle.visuals[s];
        if (!v) return;
        (v.origins || []).forEach((p) => pts.push(p));
        (v.insertions || []).forEach((p) => pts.push(p));
        (v.musclePath || []).forEach((p) => pts.push(p));
        (v.attachmentLines || []).forEach((l) => (l.points || []).forEach((p) => pts.push(p)));
      });

      if (pts.length === 0) {
        (['left', 'right', 'midline'] as const).forEach((s) => {
          const v = activeMuscle.visuals[s];
          if (!v) return;
          (v.origins || []).forEach((p) => pts.push(p));
          (v.insertions || []).forEach((p) => pts.push(p));
          (v.musclePath || []).forEach((p) => pts.push(p));
          (v.attachmentLines || []).forEach((l) => (l.points || []).forEach((p) => pts.push(p)));
        });
      }

      if (pts.length > 0) {
        let minX = 1, maxX = 0, minY = 1, maxY = 0;
        pts.forEach((p) => {
          if (p.x < minX) minX = p.x;
          if (p.x > maxX) maxX = p.x;
          if (p.y < minY) minY = p.y;
          if (p.y > maxY) maxY = p.y;
        });

        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const spanY = maxY - minY;

        // Bepaal zoomniveau: comfortabele zoom waarbij de hele spier en marges ruim in beeld blijven
        const targetZoom = Math.max(1.25, Math.min(1.8, 0.36 / Math.max(spanY, 0.12)));
        const container = containerRef.current;
        const W = container?.clientWidth || 250;
        const H = container?.clientHeight || 600;

        // Positioneer spier veilig in het bovenste deel (rond 28%-32%) zodat de uitschuifbare lade onderin er NOOIT overheen valt
        const desiredScreenY = spanY > 0.28 ? 0.32 : 0.28;
        const targetPanX = (0.5 - centerX) * W * targetZoom;
        const targetPanY = (desiredScreenY - 0.5) * H - (centerY - 0.5) * H * targetZoom;

        setZoom(Number(targetZoom.toFixed(2)));
        setPan({ x: Math.round(targetPanX), y: Math.round(targetPanY) });
        return;
      }
    } else {
      // Geen actieve spier (bijv. leeg canvas voor handmatig tekenen): herstel volledig skelet
      setZoom(1);
      setPan({ x: 0, y: 0 });
    }
  }, [autoCenterMuscle, activeMuscle?.id, activeSide, currentView]);

  const handleClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (Date.now() - lastTouchHandledTimeRef.current < 500) return; // Voorkom dubbele trigger door gesynthetiseerde muiskliks op touch
    if (e.button !== 0) return;
    if (hasMovedRef.current) return;
    if (panMode) return;
    if (!interactive || !onSkeletonClick) return;
    if (!containerRef.current) return;
    if (isDraggingPointRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const normalized = clientToNormalized(e.clientX, e.clientY, rect);
    onSkeletonClick(normalized, false);
  };

  // Touch handlers voor telefoon (pinch zoom & 2-vinger pan)
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches.length === 2) {
      // 2 vingers: pinch-to-zoom en pan
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
      touchStateRef.current.hasMoved = true; // Nooit een punt plaatsen bij 2 vingers
    } else if (e.touches.length === 1) {
      // 1 vinger: tap om punt te plaatsen, mits de vinger niet bewogen wordt
      touchStateRef.current.isPinching = false;
      touchStateRef.current.hasMoved = false;
      touchStateRef.current.singleTouchStart = {
        x: e.touches[0].clientX,
        y: e.touches[0].clientY,
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

        // 2-vinger pan: verschuif mee met het middenpunt van de twee vingers
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
      if (Math.hypot(dx, dy) > 10) {
        touchStateRef.current.hasMoved = true; // Bewogen, dus niet per ongeluk een punt plaatsen
      }
    }
  };

  const handleTouchEnd = (e: React.TouchEvent<HTMLDivElement>) => {
    if (touchStateRef.current.isPinching) {
      if (e.touches.length === 0) {
        setTimeout(() => {
          touchStateRef.current.isPinching = false;
        }, 120);
      }
      return;
    }

    if (!touchStateRef.current.hasMoved && touchStateRef.current.singleTouchStart) {
      const now = Date.now();
      // Dubbele tik: reset weergave direct naar 100%
      if (now - touchStateRef.current.lastTapTime < 300) {
        setZoom(1);
        setPan({ x: 0, y: 0 });
        touchStateRef.current.lastTapTime = 0;
        return;
      }
      touchStateRef.current.lastTapTime = now;

      // Enkele tik zonder bewegen: zet punt
      if (interactive && onSkeletonClick && containerRef.current && !isDraggingPointRef.current) {
        const rect = containerRef.current.getBoundingClientRect();
        const normalized = clientToNormalized(
          touchStateRef.current.singleTouchStart.x,
          touchStateRef.current.singleTouchStart.y,
          rect
        );
        lastTouchHandledTimeRef.current = Date.now();
        onSkeletonClick(normalized, false);
      }
    }
    touchStateRef.current.singleTouchStart = null;
    touchStateRef.current.hasMoved = false;
  };

  const handleContextMenu = (e: React.MouseEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (hasMovedRef.current) return;
    if (panMode) return;
    if (!interactive || !onSkeletonClick) return;
    if (!containerRef.current) return;
    if (isDraggingPointRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const normalized = clientToNormalized(e.clientX, e.clientY, rect);
    onSkeletonClick(normalized, true);
  };

  // Pan slepen wanneer panMode actief is, met muis op PC, of via middelmuisknop/spatiebalk
  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    // Touch events op mobiel worden exclusief door handleTouchStart (2-vinger pan) afgehandeld
    if (e.pointerType === 'touch') return;

    const isMouse = e.pointerType === 'mouse';
    const isPanIntent = panMode || e.button === 1 || e.button === 2 || isSpaceDownRef.current;

    // Muis kan altijd slepen om te pannen wanneer ingezoomd (zoom > 1) of wanneer pan gewenst is
    if (isMouse && (zoom > 1 || isPanIntent)) {
      hasMovedRef.current = false;
      const startX = e.clientX;
      const startY = e.clientY;
      const startPanX = pan.x;
      const startPanY = pan.y;

      const handlePointerMove = (moveEv: PointerEvent) => {
        const dx = moveEv.clientX - startX;
        const dy = moveEv.clientY - startY;
        if (Math.hypot(dx, dy) > 4) {
          hasMovedRef.current = true;
          setPan({
            x: startPanX + dx,
            y: startPanY + dy,
          });
        }
      };

      const handlePointerUp = () => {
        window.removeEventListener('pointermove', handlePointerMove);
        window.removeEventListener('pointerup', handlePointerUp);
        setTimeout(() => {
          hasMovedRef.current = false;
        }, 60);
      };

      window.addEventListener('pointermove', handlePointerMove);
      window.addEventListener('pointerup', handlePointerUp);
    }
  };

  // Muiswiel zoomen (in- en uitzoomen met het scrollwiel)
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const delta = -Math.sign(e.deltaY) * 0.25;
    setZoom(z => {
      const next = Math.max(1.0, Math.min(3.5, Number((z + delta).toFixed(2))));
      if (next === 1.0) setPan({ x: 0, y: 0 });
      return next;
    });
  };

  const handleStartDrag = (e: React.PointerEvent, type: 'origin' | 'insertion', index: number) => {
    if (!interactive || !onUpdateUserPoint) return;
    if (e.button !== 0) return; // Alleen met linkermuisknop verslepen
    e.stopPropagation();
    e.preventDefault();

    isDraggingPointRef.current = true;

    const handlePointerMove = (moveEv: PointerEvent) => {
      if (!containerRef.current) return;
      const rect = containerRef.current.getBoundingClientRect();
      const normalized = clientToNormalized(moveEv.clientX, moveEv.clientY, rect);
      onUpdateUserPoint(type, index, normalized);
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      setTimeout(() => {
        isDraggingPointRef.current = false;
      }, 60);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  // Normaliseer actieve spieren: toon alle geselecteerde spieren (ook van het andere aanzicht via doorschijning!)
  const musclesToRender = useMemo(() => {
    const list = activeMuscles && activeMuscles.length > 0
      ? activeMuscles
      : (activeMuscle ? [activeMuscle] : []);

    // Sorteer zodat spieren van het tegenovergestelde aanzicht eerst (onderop) worden getekend
    return [...list].sort((a, b) => {
      const aOpp = a.view !== currentView ? 0 : 1;
      const bOpp = b.view !== currentView ? 0 : 1;
      return aOpp - bOpp;
    });
  }, [activeMuscles, activeMuscle, currentView]);

  // Normaliseer gebruikerspunten
  const effectiveOrigins = userOrigins || (userQuizPoints && userQuizPoints.length > 0 ? [userQuizPoints[0]] : []);
  const effectiveInsertions = userInsertions || (userQuizPoints && userQuizPoints.length > 1 ? userQuizPoints.slice(1) : []);
  const canDragPoints = interactive && !quizMatches?.length && !!onUpdateUserPoint;

  return (
    <ViewerContext.Provider value={{ zoom, panMode }}>
      <div 
        ref={scrollWrapperRef}
        onWheel={handleWheel}
        className="relative flex flex-col items-center justify-center w-full h-full p-0 select-none overflow-hidden"
        onContextMenu={(e) => e.preventDefault()}
      >
      {/* Vaste verhoudingscontainer die verbreedt bij inzoomen */}
      <div
        onWheel={handleWheel}
        style={{
          aspectRatio: zoom === 1 ? `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}` : undefined,
        }}
        className={`relative h-full max-h-full rounded-2xl overflow-hidden shadow-lg bg-white border border-slate-200 transition-[width] duration-200 ${
          zoom > 1 ? 'w-full max-w-5xl' : 'w-auto'
        }`}
      >
        {/* Transformeerbare zoom/pan laag */}
        <div
          ref={containerRef}
          onClick={handleClick}
          onContextMenu={handleContextMenu}
          onPointerDown={handlePointerDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
            touchAction: 'none',
            transition: touchStateRef.current.isPinching || isDraggingPointRef.current || hasMovedRef.current
              ? 'none'
              : 'transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)',
          }}
          className={`relative h-full mx-auto ${
            panMode ? 'cursor-grab active:cursor-grabbing' : (interactive ? 'cursor-crosshair' : 'cursor-default')
          }`}
        >
          {/* 1. Vaste rasterafbeeldingen van het skelet */}
          <img
            src={`${import.meta.env.BASE_URL}images/skeleton_ventral.png`}
            alt="Anatomisch skelet - Ventraal aanzicht"
            width={SKELETON_WIDTH}
            height={SKELETON_HEIGHT}
            className={`absolute inset-0 w-full h-full object-fill block select-none pointer-events-none ${
              currentView === 'ventral' ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            draggable={false}
          />
          <img
            src={`${import.meta.env.BASE_URL}images/skeleton_dorsal.png`}
            alt="Anatomisch skelet - Dorsaal aanzicht"
            width={SKELETON_WIDTH}
            height={SKELETON_HEIGHT}
            className={`absolute inset-0 w-full h-full object-fill block select-none pointer-events-none ${
              currentView === 'dorsal' ? 'opacity-100 z-0' : 'opacity-0 z-0'
            }`}
            draggable={false}
          />

          {/* 2. Interactieve SVG-laag exact bovenop de rasterafbeelding */}
          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 z-10 w-full h-full pointer-events-none"
          >
            {/* Geef actieve spiermarkeringen weer */}
            {musclesToRender.map((m, mIdx) => {
              const hasMultiple = (activeMuscles?.length || 0) > 1;
              const isFocused = activeMuscle?.id === m.id;
              const isOppositeView = m.view !== currentView;
              const isDimmed = hasMultiple && !!activeMuscle && !isFocused && !isOppositeView;
              
              // Behoud consistente kleuring op basis van de index in de originele selectielijst
              const originalIndex = activeMuscles ? activeMuscles.findIndex(x => x.id === m.id) : mIdx;
              const muscleColor = hasMultiple 
                ? MULTI_MUSCLE_COLORS[(originalIndex >= 0 ? originalIndex : mIdx) % MULTI_MUSCLE_COLORS.length] 
                : undefined;

              return (
                <MuscleMarkers
                  key={m.id}
                  muscle={m}
                  activeSide={activeSide}
                  quizMatches={mIdx === 0 ? quizMatches : undefined}
                  showReferenceGhost={showReferenceGhost}
                  color={muscleColor}
                  isDimmed={isDimmed}
                  isOppositeView={isOppositeView}
                  opacity={markersOpacity}
                  onSelectMuscle={onSelectMuscle}
                  isInteractive={!!onSelectMuscle}
                  onHoverPoint={setHoveredInfo}
                />
              );
            })}

            {/* Rechte verbindingslijnen tussen de geplaatste origo's en inserties (netjes parallel) */}
            {effectiveOrigins.length > 0 && effectiveInsertions.length > 0 && (
              <g>
                {getMuscleConnections(effectiveOrigins, effectiveInsertions).map(({ orig, ins, oIdx, iIdx }) => (
                  <line
                    key={`user-line-${oIdx}-${iIdx}`}
                    x1={orig.x * SVG_WIDTH}
                    y1={orig.y * SVG_HEIGHT}
                    x2={ins.x * SVG_WIDTH}
                    y2={ins.y * SVG_HEIGHT}
                    stroke="#e11d48"
                    strokeWidth={Math.max(1, 7 / zoom)}
                    strokeLinecap="round"
                    opacity="0.9"
                  />
                ))}
              </g>
            )}

            {/* Gebruikerspunten: Origo's */}
            {effectiveOrigins.map((pt, idx) => {
              const cx = pt.x * SVG_WIDTH;
              const cy = pt.y * SVG_HEIGHT;
              return (
                <g 
                  key={`user-orig-${idx}`}
                  className={canDragPoints ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"}
                  onPointerDown={(e) => canDragPoints && handleStartDrag(e, 'origin', idx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onDeleteUserPoint) onDeleteUserPoint('origin', idx);
                  }}
                >
                  {canDragPoints && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={26 / zoom}
                      fill="transparent"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={15 / zoom}
                    fill="#2563eb"
                    stroke="#ffffff"
                    strokeWidth={3.5 / zoom}
                  />
                  <text
                    x={cx}
                    y={cy + (1 / zoom)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={Math.round(12 / zoom)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    O{effectiveOrigins.length > 1 ? idx + 1 : ''}
                  </text>
                </g>
              );
            })}

            {/* Gebruikerspunten: Inserties */}
            {effectiveInsertions.map((pt, idx) => {
              const cx = pt.x * SVG_WIDTH;
              const cy = pt.y * SVG_HEIGHT;
              return (
                <g 
                  key={`user-ins-${idx}`}
                  className={canDragPoints ? "pointer-events-auto cursor-grab active:cursor-grabbing" : "pointer-events-none"}
                  onPointerDown={(e) => canDragPoints && handleStartDrag(e, 'insertion', idx)}
                  onContextMenu={(e) => {
                    e.preventDefault();
                    e.stopPropagation();
                    if (onDeleteUserPoint) onDeleteUserPoint('insertion', idx);
                  }}
                >
                  {canDragPoints && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={26 / zoom}
                      fill="transparent"
                    />
                  )}
                  <circle
                    cx={cx}
                    cy={cy}
                    r={15 / zoom}
                    fill="#dc2626"
                    stroke="#ffffff"
                    strokeWidth={3.5 / zoom}
                  />
                  <text
                    x={cx}
                    y={cy + (1 / zoom)}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={Math.round(12 / zoom)}
                    fontWeight="bold"
                    className="pointer-events-none select-none"
                  >
                    I{effectiveInsertions.length > 1 ? idx + 1 : ''}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* 3. Eventuele extra overlay componenten (bijv. EditorOverlay) */}
          {children}

          {/* 4. Grote, duidelijke HTML hover overlay voor Studiemodus (zonder coördinaten!) */}
          {effectiveShowTooltip && hoveredInfo && !children && (
            <div
              style={{
                position: 'absolute',
                left: `${hoveredInfo.point.x * 100}%`,
                top: `${hoveredInfo.point.y * 100}%`,
                transform: `translate(-50%, -125%) scale(${1 / zoom})`,
                transformOrigin: 'bottom center',
              }}
              className="z-50 pointer-events-none select-none transition-all duration-75"
            >
              <div className="bg-slate-900/95 text-white px-4 py-2 rounded-xl shadow-2xl border border-slate-700 backdrop-blur-md flex flex-col items-center gap-1 min-w-[180px] max-w-[340px] text-center">
                <div className="text-sm font-extrabold text-amber-300 tracking-wide">
                  {hoveredInfo.muscle.name}
                </div>
                {hoveredInfo.type !== 'line' && (
                  <div className="flex items-center gap-2 text-xs text-slate-200 font-medium">
                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${
                      hoveredInfo.type === 'origin' ? 'bg-blue-500 ring-2 ring-blue-400/50' :
                      'bg-red-500 ring-2 ring-red-400/50'
                    }`} />
                    <span className="leading-snug">
                      {hoveredInfo.type === 'origin' && `Origo: ${hoveredInfo.label || hoveredInfo.muscle.originText}`}
                      {hoveredInfo.type === 'insertion' && `Insertie: ${hoveredInfo.label || hoveredInfo.muscle.insertionText}`}
                    </span>
                  </div>
                )}
              </div>
              <div className="w-0 h-0 border-x-8 border-x-transparent border-t-8 border-t-slate-900/95 mx-auto -mt-0.5" />
            </div>
          )}
        </div>

        {/* 5. Vaste Zwevende Zoom & Weergave Toolbar (buiten transform, altijd direct bereikbaar) */}
        {!hideZoomToolbar && !isMobile && (
          <div className="absolute top-3 right-3 z-30 flex items-center gap-1 bg-white/95 backdrop-blur-md p-1 rounded-xl border border-slate-200/90 shadow-md text-slate-700">
            <button
              type="button"
              onClick={() => setZoom(z => Math.min(3.5, Number((z + 0.35).toFixed(2))))}
              title="Inzoomen (+)"
              className="p-1.5 rounded-lg hover:bg-slate-100 active:bg-slate-200 transition-colors text-slate-700"
            >
              <ZoomIn className="w-4 h-4" />
            </button>
            <button
              type="button"
              onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setPanMode(false); }}
              title="Klik om te resetten naar 100%"
              className="px-2 py-1 text-xs font-bold rounded-lg hover:bg-slate-100 transition-colors text-slate-700 min-w-[46px] text-center font-mono"
            >
              {Math.round(zoom * 100)}%
            </button>
            <button
              type="button"
              onClick={() => {
                setZoom(z => {
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

            {zoom > 1.0 && (
              <>
                <div className="w-[1px] h-4 bg-slate-200" />
                <button
                  type="button"
                  onClick={() => setPanMode(p => !p)}
                  title={panMode ? "Klik om terug te keren naar de normale cursor" : "Skelet verslepen"}
                  className={`px-2 py-1 text-xs rounded-lg transition-colors flex items-center gap-1 ${
                    panMode
                      ? 'bg-slate-200 text-slate-900 font-semibold'
                      : 'hover:bg-slate-100 text-slate-600 font-medium'
                  }`}
                >
                  {panMode ? (
                    <>
                      <MousePointer className="w-3.5 h-3.5" />
                      <span>Cursor</span>
                    </>
                  ) : (
                    <>
                      <Hand className="w-3.5 h-3.5" />
                      <span>Versleep</span>
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }); setPanMode(false); }}
                  title="Reset weergave naar 100%"
                  className="p-1.5 rounded-lg hover:bg-slate-100 text-slate-600 transition-colors"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                </button>
              </>
            )}

            <div className="w-[1px] h-4 bg-slate-200" />
            <button
              type="button"
              onClick={handleToggleTooltip}
              title={effectiveShowTooltip ? "Hover-informatie verbergen" : "Hover-informatie tonen"}
              className={`p-1.5 rounded-lg transition-colors ${
                effectiveShowTooltip ? 'text-blue-600 bg-blue-50' : 'text-slate-400 hover:bg-slate-100'
              }`}
            >
              {effectiveShowTooltip ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
          </div>
        )}
      </div>
      </div>
    </ViewerContext.Provider>
  );
};
