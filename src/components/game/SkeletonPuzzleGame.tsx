import React, { useState, useMemo, useRef, useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { Muscle, AnatomicalView, Point2D } from '../../types/anatomy';
import { SKELETON_WIDTH, SKELETON_HEIGHT, getMuscleConnections } from '../../utils/coordinates';
import { SVG_WIDTH, SVG_HEIGHT } from '../skeleton/MuscleMarkers';
import { RotateCcw, Check } from 'lucide-react';

interface PuzzleBoardDef {
  id: string;
  title: string;
  muscleIds: string[];
}

const PUZZLE_BOARDS: PuzzleBoardDef[] = [
  {
    id: 'coxae',
    title: 'Art. coxae',
    muscleIds: [
      'rectus_femoris',
      'iliopsoas',
      'adductores',
      'gluteus_maximus',
      'biceps_femoris',
      'semimembranosus',
      'semitendinosus',
    ],
  },
  {
    id: 'genus',
    title: 'Art. genus',
    muscleIds: [
      'rectus_femoris',
      'vastus_lateralis',
      'vastus_intermedius',
      'vastus_medialis',
      'biceps_femoris',
      'semimembranosus',
      'semitendinosus',
    ],
  },
  {
    id: 'pedis',
    title: 'Art. pedis',
    muscleIds: [
      'tibialis_anterior',
      'fibularis_brevis',
      'fibularis_longus',
      'gastrocnemius',
      'soleus',
    ],
  },
  {
    id: 'humeri',
    title: 'Art. humeri',
    muscleIds: [
      'deltoideus',
      'pectoralis_major',
      'biceps_brachii',
      'latissimus_dorsi',
      'teres_major',
      'teres_minor',
      'triceps_brachii',
    ],
  },
  {
    id: 'cingulum',
    title: 'Cingulum pectorale',
    muscleIds: [
      'serratus_anterior',
      'latissimus_dorsi',
      'trapezius',
      'levator_scapulae',
      'rhomboidei',
    ],
  },
  {
    id: 'cubiti',
    title: 'Art. cubiti',
    muscleIds: [
      'biceps_brachii',
      'brachialis',
      'triceps_brachii',
    ],
  },
  {
    id: 'columna',
    title: 'Columna vertebralis',
    muscleIds: [
      'rectus_abdominis',
      'obliquus_internus_abdominis',
      'obliquus_externus_abdominis',
      'iliopsoas',
      'erector_spinae',
    ],
  },
];

function cleanMuscleName(rawName: string): string {
  return rawName.replace(/\s*\(.*?\)\s*/g, '').trim();
}

function canonicalizeLandmark(rawName?: string): { key: string; label: string } {
  const s = (rawName || '').trim();
  const low = s.toLowerCase();

  if (low.includes('tuberositas tibiae')) {
    return { key: 'tuberositas_tibiae', label: 'tuberositas tibiae' };
  }
  if (low.includes('tuber ischiadicum')) {
    return { key: 'tuber_ischiadicum', label: 'tuber ischiadicum' };
  }
  if (low.includes('condylus medialis tibiae')) {
    return { key: 'condylus_medialis_tibiae', label: 'condylus medialis tibiae' };
  }
  if (low.includes('tuber calcanei')) {
    return { key: 'tuber_calcanei', label: 'tuber calcanei' };
  }
  if (low.includes('mediale zijde corpus femoris')) {
    return { key: 'mediale_zijde_corpus_femoris', label: 'mediale zijde corpus femoris' };
  }
  if (low.includes('laterale zijde corpus femoris')) {
    return { key: 'laterale_zijde_corpus_femoris', label: 'laterale zijde corpus femoris' };
  }
  if (low.includes('ventrale zijde corpus femoris')) {
    return { key: 'ventrale_zijde_corpus_femoris', label: 'ventrale zijde corpus femoris' };
  }
  if (low.includes('os pubis')) {
    return { key: 'os_pubis', label: 'os pubis' };
  }
  if (low.includes('os ischii')) {
    return { key: 'os_ischii', label: 'os ischii' };
  }
  if (low.includes('dorsale zijde crista iliaca')) {
    return { key: 'dorsale_crista_iliaca', label: 'dorsale zijde crista iliaca' };
  }
  if (low.includes('crista iliaca')) {
    return { key: 'crista_iliaca', label: 'crista iliaca' };
  }
  if (low.includes('linea alba')) {
    return { key: 'linea_alba', label: 'linea alba' };
  }
  if (low.includes('5e tot 12e costa')) {
    return { key: 'costa_5_12', label: '5e tot 12e costa' };
  }
  if (low.includes('1e tot 9e costa')) {
    return { key: 'costa_1_9', label: '1e tot 9e costa' };
  }
  if (low.includes('5-7 costa') || low.includes('5e - 7e costa')) {
    return { key: 'costa_5_7', label: '5e - 7e costa' };
  }
  if (low.includes('margo medialis scapula')) {
    return { key: 'margo_medialis_scapula', label: 'margo medialis scapula' };
  }
  if (low.includes('angulus superior scapula')) {
    return { key: 'angulus_superior_scapula', label: 'angulus superior scapula' };
  }
  if (low.includes('angulus inferior scapula')) {
    return { key: 'angulus_inferior_scapula', label: 'angulus inferior scapula' };
  }
  if (low.includes('laterale 1/3 deel') && low.includes('clavicula')) {
    return { key: 'laterale_clavicula', label: 'laterale 1/3 deel clavicula' };
  }
  if (low.includes('mediale') && low.includes('clavicula')) {
    return { key: 'mediale_clavicula', label: 'mediale 1/3 deel clavicula' };
  }
  if (low.includes('acromion')) {
    return { key: 'acromion', label: 'acromion' };
  }
  if (low.includes('spina scapula')) {
    return { key: 'spina_scapula', label: 'spina scapula' };
  }
  if (low.includes('processus transversus') && low.includes('cervicales')) {
    return {
      key: 'proc_transversus_cervicales',
      label: 'processus transversus van bovenste 4 vertebra cervicales',
    };
  }
  if (low.includes('dorsale gedeelte tuberculum majus')) {
    return { key: 'tuberculum_majus_dorsaal', label: 'dorsale gedeelte tuberculum majus' };
  }
  if (low.includes('tuberculum majus')) {
    return { key: 'tuberculum_majus', label: 'tuberculum majus' };
  }
  if (low.includes('tuberculum minus')) {
    return { key: 'tuberculum_minus', label: 'tuberculum minus' };
  }
  if (low.includes('mediale voetrand')) {
    return { key: 'mediale_voetrand', label: 'mediale voetrand' };
  }
  if (low.includes('laterale voetrand')) {
    return { key: 'laterale_voetrand', label: 'laterale voetrand' };
  }

  const cleanLabel = s
    .replace(/^pars\s+[^:]+:\s*/i, '')
    .replace(/^caput\s+[^:]+:\s*/i, '')
    .replace(/\s*\(pees komt.*?\)/i, '')
    .trim();

  const key = cleanLabel.toLowerCase().replace(/[^a-z0-9]+/g, '_');
  return { key, label: cleanLabel || s };
}

export interface PuzzleNode {
  id: string;
  label: string;
  view: AnatomicalView;
  x: number;
  y: number;
  originForMuscleIds: string[];
  insertionForMuscleIds: string[];
}

export interface PuzzleMuscleSpec {
  id: string;
  name: string;
  view: AnatomicalView;
  muscle: Muscle;
  originNodeIds: string[];
  insertionNodeIds: string[];
  rawOrigins: Point2D[];
  rawInsertions: Point2D[];
}

export const SkeletonPuzzleGame: React.FC = () => {
  const { muscles } = useMuscles();

  const [boardId, setBoardId] = useState<string>(PUZZLE_BOARDS[0].id);
  const [currentView, setCurrentView] = useState<AnatomicalView>('ventral');
  const [solvedMuscleIds, setSolvedMuscleIds] = useState<string[]>([]);
  const [selectedOriginNodeIds, setSelectedOriginNodeIds] = useState<string[]>([]);
  const [selectedInsertionNodeIds, setSelectedInsertionNodeIds] = useState<string[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [feedbackMsg, setFeedbackMsg] = useState<string | null>(null);
  const [wrongShakeId, setWrongShakeId] = useState<string | null>(null);

  const [zoom, setZoom] = useState<number>(1.3);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const touchRef = useRef<{
    isPinching: boolean;
    startDist: number;
    startZoom: number;
    startPanX: number;
    startPanY: number;
    startX: number;
    startY: number;
    moved: boolean;
  }>({
    isPinching: false,
    startDist: 0,
    startZoom: 1,
    startPanX: 0,
    startPanY: 0,
    startX: 0,
    startY: 0,
    moved: false,
  });

  const activeBoard = useMemo(
    () => PUZZLE_BOARDS.find((b) => b.id === boardId) || PUZZLE_BOARDS[0],
    [boardId]
  );

  // Bouw de spieren en knooppunten per aanzicht (ventral/dorsal) voor het gekozen gewricht
  const { allNodes, muscleSpecs } = useMemo(() => {
    const boardMuscles = activeBoard.muscleIds
      .map((id) => muscles.find((m) => m.id === id))
      .filter((m): m is Muscle => !!m);

    const nodeMap = new Map<
      string,
      {
        id: string;
        label: string;
        view: AnatomicalView;
        xs: number[];
        ys: number[];
        originFor: Set<string>;
        insertionFor: Set<string>;
      }
    >();

    const specs: PuzzleMuscleSpec[] = [];

    for (const m of boardMuscles) {
      const r = m.visuals.right;
      const l = m.visuals.left;
      const mid = m.visuals.midline;

      const getAvgX = (v?: { origins: Point2D[]; insertions: Point2D[] }) => {
        if (!v) return 999;
        const pts = [...(v.origins || []), ...(v.insertions || [])];
        if (!pts.length) return 999;
        return pts.reduce((acc, p) => acc + p.x, 0) / pts.length;
      };

      const chosenVisual =
        (getAvgX(r) <= getAvgX(l) ? r : l) || r || l || mid || { origins: [], insertions: [] };

      const originIds = new Set<string>();
      const insertionIds = new Set<string>();

      for (const pt of chosenVisual.origins || []) {
        const { key: rawKey, label } = canonicalizeLandmark(pt.name);
        const key = `${m.view}_${rawKey}`;
        originIds.add(key);
        const existing = nodeMap.get(key);
        if (existing) {
          existing.xs.push(pt.x);
          existing.ys.push(pt.y);
          existing.originFor.add(m.id);
        } else {
          nodeMap.set(key, {
            id: key,
            label,
            view: m.view,
            xs: [pt.x],
            ys: [pt.y],
            originFor: new Set([m.id]),
            insertionFor: new Set(),
          });
        }
      }

      for (const pt of chosenVisual.insertions || []) {
        const { key: rawKey, label } = canonicalizeLandmark(pt.name);
        const key = `${m.view}_${rawKey}`;
        insertionIds.add(key);
        const existing = nodeMap.get(key);
        if (existing) {
          existing.xs.push(pt.x);
          existing.ys.push(pt.y);
          existing.insertionFor.add(m.id);
        } else {
          nodeMap.set(key, {
            id: key,
            label,
            view: m.view,
            xs: [pt.x],
            ys: [pt.y],
            originFor: new Set(),
            insertionFor: new Set([m.id]),
          });
        }
      }

      specs.push({
        id: m.id,
        name: cleanMuscleName(m.name),
        view: m.view,
        muscle: m,
        originNodeIds: Array.from(originIds),
        insertionNodeIds: Array.from(insertionIds),
        rawOrigins: chosenVisual.origins || [],
        rawInsertions: chosenVisual.insertions || [],
      });
    }

    const rawNodes: PuzzleNode[] = Array.from(nodeMap.values()).map((n) => {
      const avgX = n.xs.reduce((a, b) => a + b, 0) / n.xs.length;
      const avgY = n.ys.reduce((a, b) => a + b, 0) / n.ys.length;
      return {
        id: n.id,
        label: n.label,
        view: n.view,
        x: avgX,
        y: avgY,
        originForMuscleIds: Array.from(n.originFor),
        insertionForMuscleIds: Array.from(n.insertionFor),
      };
    });

    // Anti-overlap per aanzicht
    for (const v of ['ventral', 'dorsal'] as AnatomicalView[]) {
      const viewNodes = rawNodes.filter((n) => n.view === v);
      const minSepX = 0.036;
      const minSepY = 0.022;
      for (let iter = 0; iter < 12; iter++) {
        for (let i = 0; i < viewNodes.length; i++) {
          for (let j = i + 1; j < viewNodes.length; j++) {
            const a = viewNodes[i];
            const b = viewNodes[j];
            const dx = b.x - a.x;
            const dy = (b.y - a.y) * 2.1;
            const dist = Math.hypot(dx, dy);
            if (dist < minSepX && dist > 0.0001) {
              const push = (minSepX - dist) * 0.45;
              const ux = dx / dist;
              const uy = dy / dist / 2.1;
              a.x -= ux * push;
              a.y -= uy * push;
              b.x += ux * push;
              b.y += uy * push;
            } else if (dist <= 0.0001) {
              b.x += minSepX * 0.5;
              b.y += minSepY * 0.3;
            }
          }
        }
      }
    }

    return { allNodes: rawNodes, muscleSpecs: specs };
  }, [activeBoard, muscles]);

  const nodes = useMemo(
    () => allNodes.filter((n) => n.view === currentView),
    [allNodes, currentView]
  );

  const ventralRemainingCount = useMemo(
    () => muscleSpecs.filter((s) => s.view === 'ventral' && !solvedMuscleIds.includes(s.id)).length,
    [muscleSpecs, solvedMuscleIds]
  );

  const dorsalRemainingCount = useMemo(
    () => muscleSpecs.filter((s) => s.view === 'dorsal' && !solvedMuscleIds.includes(s.id)).length,
    [muscleSpecs, solvedMuscleIds]
  );

  // Automatisch draaien naar het andere aanzicht zodra één zijde leeggespeeld is
  useEffect(() => {
    if (currentView === 'ventral' && ventralRemainingCount === 0 && dorsalRemainingCount > 0) {
      setCurrentView('dorsal');
      setSelectedOriginNodeIds([]);
      setSelectedInsertionNodeIds([]);
    } else if (currentView === 'dorsal' && dorsalRemainingCount === 0 && ventralRemainingCount > 0) {
      setCurrentView('ventral');
      setSelectedOriginNodeIds([]);
      setSelectedInsertionNodeIds([]);
    }
  }, [currentView, ventralRemainingCount, dorsalRemainingCount]);

  // Centreer en zoom op actieve pinnen
  const focusOnBoard = useMemo(() => {
    if (!nodes.length) return { zoom: 1.2, midX: 0.4, midY: 0.5 };
    const xs = nodes.map((n) => n.x);
    const ys = nodes.map((n) => n.y);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minY = Math.min(...ys);
    const maxY = Math.max(...ys);
    const spanY = Math.max(0.18, maxY - minY);
    const idealZoom = Math.min(2.1, Math.max(1.15, 0.62 / spanY));
    return {
      zoom: idealZoom,
      midX: (minX + maxX) / 2,
      midY: (minY + maxY) / 2,
    };
  }, [nodes]);

  const applyAutoFocus = () => {
    const el = containerRef.current;
    if (!el) {
      setZoom(focusOnBoard.zoom);
      setPan({ x: 0, y: 0 });
      return;
    }
    const rect = el.getBoundingClientRect();
    const baseW = rect.width / zoom;
    const baseH = rect.height / zoom;
    const z = focusOnBoard.zoom;
    const offsetX = (0.5 - focusOnBoard.midX) * baseW * z * 0.65;
    const offsetY = (0.48 - focusOnBoard.midY) * baseH * z;
    setZoom(z);
    setPan({ x: offsetX, y: offsetY });
  };

  useEffect(() => {
    setSolvedMuscleIds([]);
    setSelectedOriginNodeIds([]);
    setSelectedInsertionNodeIds([]);
    setMistakes(0);
    setFeedbackMsg(null);
    setCurrentView('ventral');
  }, [boardId]);

  useEffect(() => {
    const t = setTimeout(() => {
      applyAutoFocus();
    }, 30);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [boardId, currentView]);

  const handleResetBoard = () => {
    setSolvedMuscleIds([]);
    setSelectedOriginNodeIds([]);
    setSelectedInsertionNodeIds([]);
    setMistakes(0);
    setFeedbackMsg(null);
    setCurrentView('ventral');
    applyAutoFocus();
  };

  const nodeStateMap = useMemo(() => {
    const map = new Map<
      string,
      {
        remainingOrigins: number;
        remainingInsertions: number;
        totalRemaining: number;
      }
    >();

    for (const n of nodes) {
      const remO = n.originForMuscleIds.filter((id) => !solvedMuscleIds.includes(id)).length;
      const remI = n.insertionForMuscleIds.filter((id) => !solvedMuscleIds.includes(id)).length;
      map.set(n.id, {
        remainingOrigins: remO,
        remainingInsertions: remI,
        totalRemaining: remO + remI,
      });
    }
    return map;
  }, [nodes, solvedMuscleIds]);

  const handleNodeTap = (node: PuzzleNode, e: React.MouseEvent | React.TouchEvent) => {
    e.stopPropagation();
    setFeedbackMsg(null);

    const state = nodeStateMap.get(node.id);
    if (!state || state.totalRemaining === 0) return;

    const isSelectedO = selectedOriginNodeIds.includes(node.id);
    const isSelectedI = selectedInsertionNodeIds.includes(node.id);

    if (state.remainingOrigins > 0 && state.remainingInsertions === 0) {
      if (isSelectedO) {
        setSelectedOriginNodeIds((prev) => prev.filter((id) => id !== node.id));
      } else {
        setSelectedOriginNodeIds((prev) => [...prev, node.id]);
      }
      return;
    }

    if (state.remainingInsertions > 0 && state.remainingOrigins === 0) {
      if (isSelectedI) {
        setSelectedInsertionNodeIds((prev) => prev.filter((id) => id !== node.id));
      } else {
        setSelectedInsertionNodeIds((prev) => [...prev, node.id]);
      }
      return;
    }

    if (!isSelectedO && !isSelectedI) {
      if (selectedOriginNodeIds.length === 0) {
        setSelectedOriginNodeIds((prev) => [...prev, node.id]);
      } else {
        setSelectedInsertionNodeIds((prev) => [...prev, node.id]);
      }
    } else if (isSelectedO) {
      setSelectedOriginNodeIds((prev) => prev.filter((id) => id !== node.id));
      setSelectedInsertionNodeIds((prev) => [...prev, node.id]);
    } else {
      setSelectedInsertionNodeIds((prev) => prev.filter((id) => id !== node.id));
    }
  };

  const handleSelectMusclePill = (spec: PuzzleMuscleSpec) => {
    if (solvedMuscleIds.includes(spec.id)) return;

    // Als de spier op het andere aanzicht ligt en de speler heeft nog niets geselecteerd, wissel aanzicht
    if (
      spec.view !== currentView &&
      selectedOriginNodeIds.length === 0 &&
      selectedInsertionNodeIds.length === 0
    ) {
      setCurrentView(spec.view);
      return;
    }

    if (selectedOriginNodeIds.length === 0 || selectedInsertionNodeIds.length === 0) {
      setFeedbackMsg('Tik eerst op het skelet een origo (blauw) en insertie (rood) aan');
      return;
    }

    const sameSet = (a: string[], b: string[]) =>
      a.length === b.length && a.every((x) => b.includes(x));

    const exactOrigins = sameSet(selectedOriginNodeIds, spec.originNodeIds);
    const exactInsertions = sameSet(selectedInsertionNodeIds, spec.insertionNodeIds);

    if (exactOrigins && exactInsertions) {
      setSolvedMuscleIds((prev) => [...prev, spec.id]);
      setSelectedOriginNodeIds([]);
      setSelectedInsertionNodeIds([]);
      setFeedbackMsg(null);
      return;
    }

    const isSubsetO =
      selectedOriginNodeIds.every((id) => spec.originNodeIds.includes(id)) &&
      selectedInsertionNodeIds.every((id) => spec.insertionNodeIds.includes(id));

    if (isSubsetO) {
      setFeedbackMsg(
        `Bijna: selecteer alle ${spec.originNodeIds.length} origo- en ${spec.insertionNodeIds.length} insertie-pinnen`
      );
      return;
    }

    setMistakes((m) => m + 1);
    setWrongShakeId(spec.id);
    setTimeout(() => setWrongShakeId(null), 450);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY < 0 ? 0.16 : -0.16;
    setZoom((z) => Math.min(3.0, Math.max(0.95, +(z + delta).toFixed(2))));
  };

  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.pointerType === 'touch') return;
    if (e.button !== 0) return;
    const startX = e.clientX;
    const startY = e.clientY;
    const startPanX = pan.x;
    const startPanY = pan.y;
    let moved = false;

    const onMove = (me: PointerEvent) => {
      const dx = me.clientX - startX;
      const dy = me.clientY - startY;
      if (Math.hypot(dx, dy) > 4) {
        moved = true;
        setPan({ x: startPanX + dx, y: startPanY + dy });
      }
    };
    const onUp = () => {
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
      if (!moved) {
        setSelectedOriginNodeIds([]);
        setSelectedInsertionNodeIds([]);
        setFeedbackMsg(null);
      }
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      touchRef.current.isPinching = true;
      touchRef.current.startDist = Math.hypot(dx, dy);
      touchRef.current.startZoom = zoom;
    } else if (e.touches.length === 1) {
      touchRef.current.isPinching = false;
      touchRef.current.startX = e.touches[0].clientX;
      touchRef.current.startY = e.touches[0].clientY;
      touchRef.current.startPanX = pan.x;
      touchRef.current.startPanY = pan.y;
      touchRef.current.moved = false;
    }
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 2 && touchRef.current.isPinching) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.hypot(dx, dy);
      if (touchRef.current.startDist > 10) {
        const scale = dist / touchRef.current.startDist;
        setZoom(Math.min(3.0, Math.max(0.95, touchRef.current.startZoom * scale)));
      }
    } else if (e.touches.length === 1 && !touchRef.current.isPinching) {
      const dx = e.touches[0].clientX - touchRef.current.startX;
      const dy = e.touches[0].clientY - touchRef.current.startY;
      if (Math.hypot(dx, dy) > 6) {
        touchRef.current.moved = true;
        setPan({
          x: touchRef.current.startPanX + dx,
          y: touchRef.current.startPanY + dy,
        });
      }
    }
  };

  const solvedSpecs = useMemo(
    () => muscleSpecs.filter((s) => solvedMuscleIds.includes(s.id) && s.view === currentView),
    [muscleSpecs, solvedMuscleIds, currentView]
  );

  const isBoardComplete =
    muscleSpecs.length > 0 && solvedMuscleIds.length === muscleSpecs.length;

  const hasActiveConnection =
    selectedOriginNodeIds.length > 0 && selectedInsertionNodeIds.length > 0;

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-hidden">
      {/* 1. Subbalk met Latijnse gewrichtsnamen */}
      <div className="shrink-0 h-10 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2 z-20">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {PUZZLE_BOARDS.map((b) => {
            const active = b.id === boardId;
            return (
              <button
                key={b.id}
                onClick={() => setBoardId(b.id)}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.title}
              </button>
            );
          })}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {solvedMuscleIds.length}/{muscleSpecs.length}
          </span>

          {mistakes > 0 && (
            <span className="text-xs font-semibold text-rose-600 tabular-nums">
              {mistakes}×
            </span>
          )}

          <button
            onClick={handleResetBoard}
            title="Reset bord"
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Skelet Puzzelveld */}
      <div
        onWheel={handleWheel}
        onPointerDown={handlePointerDown}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        className="relative flex-1 w-full flex items-center justify-center overflow-hidden bg-slate-100/70"
      >
        {/* Minimalistische Ventraal / Dorsaal schakelaar */}
        <div className="absolute top-2.5 right-2.5 z-20 flex bg-white/95 backdrop-blur-sm border border-slate-200 rounded-lg p-0.5 shadow-sm">
          <button
            onClick={() => {
              setCurrentView('ventral');
              setSelectedOriginNodeIds([]);
              setSelectedInsertionNodeIds([]);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'ventral'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Ventraal ({ventralRemainingCount})
          </button>
          <button
            onClick={() => {
              setCurrentView('dorsal');
              setSelectedOriginNodeIds([]);
              setSelectedInsertionNodeIds([]);
            }}
            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
              currentView === 'dorsal'
                ? 'bg-slate-900 text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Dorsaal ({dorsalRemainingCount})
          </button>
        </div>

        <div
          ref={containerRef}
          style={{
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: 'center center',
            aspectRatio: `${SKELETON_WIDTH} / ${SKELETON_HEIGHT}`,
            touchAction: 'none',
          }}
          className="relative h-full max-h-full bg-white shadow-sm border border-slate-200/80 rounded-xl overflow-hidden"
        >
          <img
            src={`${import.meta.env.BASE_URL}images/skeleton_${currentView}.png`}
            alt={currentView}
            width={SKELETON_WIDTH}
            height={SKELETON_HEIGHT}
            className="absolute inset-0 w-full h-full object-fill pointer-events-none select-none"
            draggable={false}
          />

          <svg
            viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`}
            preserveAspectRatio="none"
            className="absolute inset-0 w-full h-full z-10 pointer-events-none"
          >
            {/* Opgeloste spieren */}
            {solvedSpecs.map((spec) => {
              const connections = getMuscleConnections(spec.rawOrigins, spec.rawInsertions);
              return (
                <g key={`solved-${spec.id}`} opacity={0.65}>
                  {connections.map(({ orig, ins, oIdx, iIdx }) => (
                    <line
                      key={`solved-line-${spec.id}-${oIdx}-${iIdx}`}
                      x1={orig.x * SVG_WIDTH}
                      y1={orig.y * SVG_HEIGHT}
                      x2={ins.x * SVG_WIDTH}
                      y2={ins.y * SVG_HEIGHT}
                      stroke="#10b981"
                      strokeWidth={6 / zoom}
                      strokeLinecap="round"
                    />
                  ))}
                </g>
              );
            })}

            {/* Actieve speler-verbindingen */}
            {selectedOriginNodeIds.map((oId) => {
              const oNode = nodes.find((n) => n.id === oId);
              if (!oNode) return null;
              return selectedInsertionNodeIds.map((iId) => {
                const iNode = nodes.find((n) => n.id === iId);
                if (!iNode) return null;
                return (
                  <g key={`active-conn-${oId}-${iId}`}>
                    <line
                      x1={oNode.x * SVG_WIDTH}
                      y1={oNode.y * SVG_HEIGHT}
                      x2={iNode.x * SVG_WIDTH}
                      y2={iNode.y * SVG_HEIGHT}
                      stroke="#ffffff"
                      strokeWidth={9 / zoom}
                      strokeLinecap="round"
                    />
                    <line
                      x1={oNode.x * SVG_WIDTH}
                      y1={oNode.y * SVG_HEIGHT}
                      x2={iNode.x * SVG_WIDTH}
                      y2={iNode.y * SVG_HEIGHT}
                      stroke="#0f172a"
                      strokeWidth={5 / zoom}
                      strokeDasharray={`${10 / zoom} ${7 / zoom}`}
                      strokeLinecap="round"
                    />
                  </g>
                );
              });
            })}

            {/* Knooppunten (uitsluitend de genummerde pinnen, geen tekstlabels) */}
            {nodes.map((node) => {
              const state = nodeStateMap.get(node.id);
              const remaining = state?.totalRemaining || 0;
              const isSolvedNode = remaining === 0;

              const isSelO = selectedOriginNodeIds.includes(node.id);
              const isSelI = selectedInsertionNodeIds.includes(node.id);
              const isSelected = isSelO || isSelI;

              const cx = node.x * SVG_WIDTH;
              const cy = node.y * SVG_HEIGHT;

              const hasO = (state?.remainingOrigins || 0) > 0;
              const hasI = (state?.remainingInsertions || 0) > 0;

              let fillColor = '#2563eb';
              if (isSelO) fillColor = '#1d4ed8';
              else if (isSelI) fillColor = '#b91c1c';
              else if (!hasO && hasI) fillColor = '#dc2626';
              else if (hasO && hasI) fillColor = '#7c3aed';

              if (isSolvedNode) {
                return (
                  <g key={node.id} opacity={0.4}>
                    <circle
                      cx={cx}
                      cy={cy}
                      r={6.5 / zoom}
                      fill="#10b981"
                      stroke="#ffffff"
                      strokeWidth={2 / zoom}
                    />
                  </g>
                );
              }

              const r = (isSelected ? 19 : 15.5) / zoom;

              return (
                <g
                  key={node.id}
                  onClick={(e) => handleNodeTap(node, e)}
                  className="pointer-events-auto cursor-pointer"
                >
                  <circle cx={cx} cy={cy} r={28 / zoom} fill="transparent" />

                  {isSelected && (
                    <circle
                      cx={cx}
                      cy={cy}
                      r={24 / zoom}
                      fill="none"
                      stroke={isSelO ? '#2563eb' : '#dc2626'}
                      strokeWidth={3 / zoom}
                    />
                  )}

                  <circle
                    cx={cx}
                    cy={cy}
                    r={r}
                    fill={fillColor}
                    stroke="#ffffff"
                    strokeWidth={3 / zoom}
                  />

                  <text
                    x={cx}
                    y={cy + 1 / zoom}
                    textAnchor="middle"
                    dominantBaseline="middle"
                    fill="#ffffff"
                    fontSize={Math.round(13 / zoom)}
                    fontWeight="700"
                    className="select-none pointer-events-none"
                  >
                    {remaining}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        {feedbackMsg && (
          <div className="absolute top-2.5 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-slate-900/90 text-white text-xs font-medium shadow-sm pointer-events-none z-20">
            {feedbackMsg}
          </div>
        )}
      </div>

      {/* 3. Onderste Balk: Alle spieren van het gewricht direct zichtbaar in één oogopslag (geen scroll) */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-2.5 py-2 z-20">
        {isBoardComplete ? (
          <div className="flex items-center justify-between py-1 max-w-xl mx-auto">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-sm">
              <Check className="w-4 h-4" />
              <span>{activeBoard.title} voltooid</span>
            </div>
            <button
              onClick={() => {
                const idx = PUZZLE_BOARDS.findIndex((b) => b.id === boardId);
                const next = PUZZLE_BOARDS[(idx + 1) % PUZZLE_BOARDS.length];
                setBoardId(next.id);
              }}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Volgend gewricht
            </button>
          </div>
        ) : (
          <div className="max-w-4xl mx-auto">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
              {muscleSpecs.map((spec) => {
                const isSolved = solvedMuscleIds.includes(spec.id);
                const isShaking = wrongShakeId === spec.id;
                const isCurrentView = spec.view === currentView;
                const countMatches =
                  isCurrentView &&
                  selectedOriginNodeIds.length === spec.originNodeIds.length &&
                  selectedInsertionNodeIds.length === spec.insertionNodeIds.length;

                return (
                  <button
                    key={spec.id}
                    disabled={isSolved}
                    onClick={() => handleSelectMusclePill(spec)}
                    className={`flex items-center justify-between gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-medium border text-left transition-all ${
                      isSolved
                        ? 'bg-emerald-50/60 border-emerald-200/70 text-emerald-700/60 line-through cursor-default'
                        : isShaking
                        ? 'bg-rose-50 border-rose-400 text-rose-700 animate-pulse'
                        : hasActiveConnection && countMatches
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm'
                        : isCurrentView
                        ? 'bg-white border-slate-200 text-slate-800 hover:border-slate-400'
                        : 'bg-slate-50 border-slate-200/70 text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    <span className="truncate">{spec.name}</span>
                    <span className="flex items-center gap-0.5 shrink-0 opacity-85">
                      {spec.originNodeIds.map((_, i) => (
                        <span
                          key={`o-${i}`}
                          className="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block"
                        />
                      ))}
                      <span className="mx-0.5 text-[9px] opacity-40">→</span>
                      {spec.insertionNodeIds.map((_, i) => (
                        <span
                          key={`i-${i}`}
                          className="w-1.5 h-1.5 rounded-full bg-rose-500 inline-block"
                        />
                      ))}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
