import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Check, X } from 'lucide-react';

export interface GridPair {
  rowLabel: string;
  colLabel: string;
}

export interface GridPuzzleDef {
  id: string;
  title: string;
  rowHeader: string;
  colHeader: string;
  pairs: [GridPair, GridPair, GridPair, GridPair];
}

const GRID_PUZZLES: GridPuzzleDef[] = [
  {
    id: 'coxae_inserties',
    title: 'Art. coxae & genus',
    rowHeader: 'Spier',
    colHeader: 'Aanhechting',
    pairs: [
      { rowLabel: 'm. rectus femoris', colLabel: 'SIAI → tuberositas tibiae' },
      { rowLabel: 'm. iliopsoas', colLabel: 'Trochanter minor' },
      { rowLabel: 'm. biceps femoris', colLabel: 'Caput fibulae' },
      { rowLabel: 'm. semitendinosus', colLabel: 'Condylus medialis tibiae' },
    ],
  },
  {
    id: 'pedis_functie',
    title: 'Art. pedis',
    rowHeader: 'Spier / Band',
    colHeader: 'Functie / Aanhechting',
    pairs: [
      { rowLabel: 'm. tibialis anterior', colLabel: 'Dorsaalflexie + inversie' },
      { rowLabel: 'm. fibularis longus', colLabel: 'Eversie (mediale voetrand)' },
      { rowLabel: 'm. gastrocnemius', colLabel: 'Plantairflexie + flexie knie' },
      { rowLabel: 'Lig. deltoideum', colLabel: 'Remt extreme pronatiestand' },
    ],
  },
  {
    id: 'humeri_cubiti',
    title: 'Art. humeri & cubiti',
    rowHeader: 'Spier',
    colHeader: 'Insertie',
    pairs: [
      { rowLabel: 'm. latissimus dorsi', colLabel: 'Tuberculum minus' },
      { rowLabel: 'm. pectoralis major', colLabel: 'Tuberculum majus' },
      { rowLabel: 'm. biceps brachii', colLabel: 'Tuberositas radii' },
      { rowLabel: 'm. brachialis', colLabel: 'Tuberositas ulnae' },
    ],
  },
  {
    id: 'cingulum_functie',
    title: 'Cingulum pectorale',
    rowHeader: 'Spier',
    colHeader: 'Werking op os scapula',
    pairs: [
      { rowLabel: 'm. serratus anterior', colLabel: 'Protractie + laterorotatie' },
      { rowLabel: 'mm. rhomboidei', colLabel: 'Retractie + mediorotatie' },
      { rowLabel: 'm. levator scapulae', colLabel: 'Elevatie (angulus superior)' },
      { rowLabel: 'm. trapezius (ascendens)', colLabel: 'Detractie (spina scapula)' },
    ],
  },
  {
    id: 'synoviaal_typen',
    title: 'Synoviale gewrichten',
    rowHeader: 'Gewrichtstype',
    colHeader: 'Eigenschap / Voorbeeld',
    pairs: [
      { rowLabel: 'Art. ginglymus', colLabel: '1 as: flexie & extensie (art. humero-ulnaris)' },
      { rowLabel: 'Art. trochoidea', colLabel: '1 as: rotaties (art. radio-ulnaris)' },
      { rowLabel: 'Art. sellaris', colLabel: '2 assen: zadelgewricht' },
      { rowLabel: 'Art. spheroidea', colLabel: '3 assen: bolgewricht (art. coxae)' },
    ],
  },
  {
    id: 'assen_vlakken',
    title: 'Assen & Vlakken',
    rowHeader: 'Beweging / Gewricht',
    colHeader: 'Vlak & As',
    pairs: [
      { rowLabel: 'Anteflexie & retroflexie', colLabel: 'Sagittaal vlak · Transversale as' },
      { rowLabel: 'Abductie & adductie', colLabel: 'Frontaal vlak · Sagittale as' },
      { rowLabel: 'Endorotatie & exorotatie', colLabel: 'Transversaal vlak · Longitudinale as' },
      { rowLabel: 'Pronatie & supinatie (voet)', colLabel: 'Onderste spronggewricht · Compromis-as' },
    ],
  },
  {
    id: 'synoviaal_structuren_pdf',
    title: 'Gewrichtsopbouw (PDF)',
    rowHeader: 'Structuur',
    colHeader: 'Functie (Synoviaal PDF)',
    pairs: [
      { rowLabel: 'Gewrichtskraakbeen (hyalien)', colLabel: 'Voorkomt wrijving tussen botstukken' },
      { rowLabel: 'Synoviaal membraan', colLabel: 'Produceert synovia (gewrichtsvocht)' },
      { rowLabel: 'Peesschede', colLabel: 'Voorkomt beschadiging aan pees a.g.v. wrijving' },
      { rowLabel: 'Bursa (slijmbeurs)', colLabel: 'Voorkomt drukbelasting in het gewricht' },
    ],
  },
  {
    id: 'bewegingen_pdf',
    title: 'Vlak, As & Beweging',
    rowHeader: 'Beweging (PDF)',
    colHeader: 'Vlak, As & Omschrijving',
    pairs: [
      { rowLabel: 'Plantair- & dorsaalflexie', colLabel: 'Vlak: S · As: T (bovenste spronggewricht)' },
      { rowLabel: 'Eversie & inversie', colLabel: 'Vlak: n.v.t. · As: n.v.t. (onderste spronggewricht)' },
      { rowLabel: 'Lateroflexie (romp)', colLabel: 'Vlak: F · As: S (zijwaarts buigen romp)' },
      { rowLabel: 'Pronatie & supinatie (arm)', colLabel: 'Vlak: T · As: L (roteren van de onderarm)' },
    ],
  },
  {
    id: 'genus_ligamenten_pdf',
    title: 'Banden Art. genus',
    rowHeader: 'Structuur',
    colHeader: 'Functie (Art. genus PDF)',
    pairs: [
      { rowLabel: 'Lig. cruciatum anterior', colLabel: 'Voorkomt naar voren schuiven os tibia' },
      { rowLabel: 'Lig. cruciatum posterior', colLabel: 'Voorkomt naar achter schuiven os tibia' },
      { rowLabel: 'Lig. collaterale medialis', colLabel: 'Voorkomt X-benen (valgusstand)' },
      { rowLabel: 'Lig. collaterale lateralis', colLabel: 'Voorkomt O-benen (varusstand)' },
    ],
  },
  {
    id: 'romp_wervel_pdf',
    title: 'Romp & Wervel (PDF)',
    rowHeader: 'Structuur',
    colHeader: 'Vertaling / Functie (Romp PDF)',
    pairs: [
      { rowLabel: 'Corpus vertebra', colLabel: 'Wervellichaam' },
      { rowLabel: 'Arcus vertebra', colLabel: 'Wervelboog' },
      { rowLabel: 'Processus spinosus', colLabel: 'Doornuitsteeksel' },
      { rowLabel: 'Processus transversus', colLabel: 'Dwarsuitsteeksel' },
    ],
  },
];

// Grote pool voor het genereren van willekeurige 4x4 spier-roosters
const RANDOM_MUSCLE_POOL: GridPair[] = [
  { rowLabel: 'm. rectus femoris', colLabel: 'Origo: SIAI · Insertie: tuberositas tibiae' },
  { rowLabel: 'm. vastus lateralis', colLabel: 'Origo: laterale zijde corpus femoris' },
  { rowLabel: 'm. vastus medialis', colLabel: 'Origo: mediale zijde corpus femoris' },
  { rowLabel: 'm. biceps femoris', colLabel: 'Insertie: caput fibulae (exorotatie knie)' },
  { rowLabel: 'm. semimembranosus', colLabel: 'Origo: tuber ischiadicum · Endorotatie knie' },
  { rowLabel: 'm. iliopsoas', colLabel: 'Insertie: trochanter minor' },
  { rowLabel: 'm. gluteus maximus', colLabel: 'Insertie: proximale laterale deel corpus femoris' },
  { rowLabel: 'm. tibialis anterior', colLabel: 'Dorsaalflexie BSG + inversie OSG' },
  { rowLabel: 'm. fibularis brevis', colLabel: 'Insertie: laterale voetrand (eversie)' },
  { rowLabel: 'm. fibularis longus', colLabel: 'Insertie: mediale voetrand (onder voet door)' },
  { rowLabel: 'm. soleus', colLabel: 'Origo: proximale deel tibia & fibula → calcaneus' },
  { rowLabel: 'm. deltoideus', colLabel: 'Insertie: lateraal op humerus (1/3 deel corpus)' },
  { rowLabel: 'm. teres major', colLabel: 'Origo: angulus inferior scapula (endorotatie)' },
  { rowLabel: 'm. teres minor', colLabel: 'Origo: margo lateralis scapula (exorotatie)' },
  { rowLabel: 'm. triceps brachii', colLabel: 'Insertie: olecranon (extensie art. cubiti)' },
  { rowLabel: 'm. rectus abdominis', colLabel: 'Origo: 5e-7e costa & proc. xiphoideus → os pubis' },
  { rowLabel: 'm. obliquus externus', colLabel: 'Rotatie romp naar tegenovergestelde zijde' },
  { rowLabel: 'm. obliquus internus', colLabel: 'Rotatie romp naar dezelfde zijde' },
];

function shuffle<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

type CellState = 'empty' | 'cross' | 'correct';

export const QueensGridGame: React.FC = () => {
  const [puzzleIdx, setPuzzleIdx] = useState<number>(0);
  const [customPuzzle, setCustomPuzzle] = useState<GridPuzzleDef | null>(null);
  const [toolMode, setToolMode] = useState<'match' | 'cross'>('match');
  const [mistakes, setMistakes] = useState<number>(0);
  const [wrongCellKey, setWrongCellKey] = useState<string | null>(null);

  const activePuzzle = useMemo(() => {
    if (customPuzzle) return customPuzzle;
    return GRID_PUZZLES[puzzleIdx % GRID_PUZZLES.length];
  }, [puzzleIdx, customPuzzle]);

  const [shuffledCols, setShuffledCols] = useState<string[]>([]);
  // Sleutel: `${rowIndex}_${colLabel}`
  const [cellMap, setCellMap] = useState<Record<string, CellState>>({});

  const initGrid = (puz: GridPuzzleDef) => {
    const cols = shuffle(puz.pairs.map((p) => p.colLabel));
    setShuffledCols(cols);
    setCellMap({});
    setMistakes(0);
    setWrongCellKey(null);
  };

  useEffect(() => {
    initGrid(activePuzzle);
  }, [activePuzzle]);

  const handleRandomMix = () => {
    const picked = shuffle(RANDOM_MUSCLE_POOL).slice(0, 4) as [
      GridPair,
      GridPair,
      GridPair,
      GridPair,
    ];
    setCustomPuzzle({
      id: `mix_${Date.now()}`,
      title: 'Willekeurige Mix',
      rowHeader: 'Spier',
      colHeader: 'Eigenschap',
      pairs: picked,
    });
  };

  const handleCellClick = (
    rIdx: number,
    colLabel: string,
    forceCross = false
  ) => {
    const key = `${rIdx}_${colLabel}`;
    const current = cellMap[key] || 'empty';
    if (current === 'correct') return;

    const effectiveTool = forceCross ? 'cross' : toolMode;

    if (effectiveTool === 'cross') {
      setCellMap((prev) => ({
        ...prev,
        [key]: current === 'cross' ? 'empty' : 'cross',
      }));
      return;
    }

    // Speler plaatst een Match (✓): controleer of deze rij en kolom bij elkaar horen
    const expectedCol = activePuzzle.pairs[rIdx].colLabel;
    if (colLabel === expectedCol) {
      // Goed! Zet deze cel op 'correct' én streep automatisch de rest van de rij en kolom weg (Queens-effect!)
      setCellMap((prev) => {
        const next = { ...prev, [key]: 'correct' as CellState };
        for (const c of shuffledCols) {
          if (c !== colLabel) {
            next[`${rIdx}_${c}`] = 'cross';
          }
        }
        for (let r = 0; r < 4; r++) {
          if (r !== rIdx) {
            next[`${r}_${colLabel}`] = 'cross';
          }
        }
        return next;
      });
    } else {
      // Fout! Kost 1 poging en streept dit vakje direct weg als 'cross'
      setMistakes((m) => m + 1);
      setWrongCellKey(key);
      setTimeout(() => setWrongCellKey(null), 400);
      setCellMap((prev) => ({
        ...prev,
        [key]: 'cross',
      }));
    }
  };

  const solvedCount = useMemo(
    () => Object.values(cellMap).filter((v) => v === 'correct').length,
    [cellMap]
  );

  const isComplete = solvedCount === 4;

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-hidden">
      {/* 1. Subbalk met categorieën */}
      <div className="shrink-0 h-10 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {GRID_PUZZLES.map((p, idx) => {
            const active = !customPuzzle && puzzleIdx === idx;
            return (
              <button
                key={p.id}
                onClick={() => {
                  setCustomPuzzle(null);
                  setPuzzleIdx(idx);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {p.title}
              </button>
            );
          })}
          <button
            onClick={handleRandomMix}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              customPuzzle
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Mix
          </button>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            {solvedCount}/4
          </span>
          {mistakes > 0 && (
            <span className="text-xs font-semibold text-rose-600 tabular-nums">
              {mistakes}×
            </span>
          )}
          <button
            onClick={() => initGrid(activePuzzle)}
            title="Reset rooster"
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Het 4x4 Queens / Eliminatie-Rooster */}
      <div className="flex-1 flex flex-col items-center justify-center p-2.5 sm:p-4 max-w-3xl w-full mx-auto gap-3 overflow-y-auto">
        {/* Modus-schakelaar: Match (✓) vs Wegstrepen (×) */}
        <div className="flex items-center justify-between w-full">
          <span className="text-xs text-slate-500">
            Elke rij en kolom heeft exact één match
          </span>

          <div className="flex items-center bg-white border border-slate-200 rounded-lg p-0.5 shadow-sm">
            <button
              onClick={() => setToolMode('match')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                toolMode === 'match'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Check className="w-3.5 h-3.5" />
              <span>Match</span>
            </button>
            <button
              onClick={() => setToolMode('cross')}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold transition-colors ${
                toolMode === 'cross'
                  ? 'bg-slate-900 text-white'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <X className="w-3.5 h-3.5" />
              <span>Kruisje</span>
            </button>
          </div>
        </div>

        {/* Rooster Tabel */}
        <div className="w-full bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="grid grid-cols-5 border-b border-slate-200 bg-slate-50/80">
            <div className="p-2 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-end">
              {activePuzzle.rowHeader}
            </div>
            {shuffledCols.map((col, cIdx) => (
              <div
                key={cIdx}
                className="p-1.5 sm:p-2.5 border-l border-slate-200 text-[10px] sm:text-xs font-semibold text-slate-700 leading-tight flex items-center justify-center text-center break-words hyphens-auto"
              >
                {col}
              </div>
            ))}
          </div>

          {activePuzzle.pairs.map((pair, rIdx) => {
            const isRowSolved = shuffledCols.some(
              (c) => cellMap[`${rIdx}_${c}`] === 'correct'
            );

            return (
              <div
                key={pair.rowLabel}
                className={`grid grid-cols-5 border-b last:border-b-0 border-slate-200 transition-colors ${
                  isRowSolved ? 'bg-emerald-50/20' : 'bg-white'
                }`}
              >
                {/* Rij-label */}
                <div className="p-2 sm:p-3 text-[11px] sm:text-xs font-semibold text-slate-800 flex items-center leading-tight break-words hyphens-auto">
                  {pair.rowLabel}
                </div>

                {/* 4 Cellen */}
                {shuffledCols.map((colLabel, cIdx) => {
                  const key = `${rIdx}_${colLabel}`;
                  const state = cellMap[key] || 'empty';
                  const isWrong = wrongCellKey === key;

                  return (
                    <button
                      key={cIdx}
                      onClick={() => handleCellClick(rIdx, colLabel, false)}
                      onContextMenu={(e) => {
                        e.preventDefault();
                        handleCellClick(rIdx, colLabel, true);
                      }}
                      className={`h-14 sm:h-16 border-l border-slate-200 flex items-center justify-center transition-all ${
                        isWrong
                          ? 'bg-rose-100 text-rose-600 animate-pulse'
                          : state === 'correct'
                          ? 'bg-emerald-500 text-white'
                          : state === 'cross'
                          ? 'bg-slate-50/90 text-slate-300'
                          : 'bg-white hover:bg-slate-50 text-transparent'
                      }`}
                    >
                      {state === 'correct' && <Check className="w-5 h-5 stroke-[2.5]" />}
                      {state === 'cross' && <X className="w-4 h-4 stroke-[2]" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
        </div>

        {/* Onderbalk bij voltooiing */}
        {isComplete && (
          <div className="w-full flex items-center justify-between bg-emerald-50 border border-emerald-200 rounded-xl px-3.5 py-2.5">
            <span className="text-xs font-semibold text-emerald-800">
              Rooster opgelost ({mistakes === 0 ? 'foutloos' : `${mistakes}× fout`})
            </span>
            <button
              onClick={() => {
                if (customPuzzle) {
                  handleRandomMix();
                } else {
                  setPuzzleIdx((i) => (i + 1) % GRID_PUZZLES.length);
                }
              }}
              className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              <span>Volgend rooster</span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
