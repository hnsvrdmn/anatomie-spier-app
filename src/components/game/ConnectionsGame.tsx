import React, { useState, useMemo, useEffect } from 'react';
import { RotateCcw, Shuffle, Check } from 'lucide-react';

export interface ConnectionGroup {
  id: string;
  title: string;
  tier: 1 | 2 | 3 | 4; // 1 = Geel, 2 = Groen, 3 = Blauw, 4 = Paars
  items: [string, string, string, string];
}

export interface ConnectionsPreset {
  id: string;
  name: string;
  groups: [ConnectionGroup, ConnectionGroup, ConnectionGroup, ConnectionGroup];
}

const ALL_GROUPS: ConnectionGroup[] = [
  // 1. Onderste extremiteit spieren & aanhechtingen
  {
    id: 'quadriceps_insertie',
    title: 'Insertie op tuberositas tibiae',
    tier: 1,
    items: [
      'm. rectus femoris',
      'm. vastus lateralis',
      'm. vastus medialis',
      'm. vastus intermedius',
    ],
  },
  {
    id: 'coxae_retroflexie',
    title: 'Retroflexie in art. coxae',
    tier: 2,
    items: [
      'm. gluteus maximus',
      'm. biceps femoris',
      'm. semimembranosus',
      'm. semitendinosus',
    ],
  },
  {
    id: 'spina_iliaca',
    title: 'Uitsteeksels op het os ilium (Spina iliaca)',
    tier: 3,
    items: ['SIAS', 'SIAI', 'SIPS', 'SIPI'],
  },
  {
    id: 'coxae_onderdelen',
    title: 'Onderdelen van het os coxae',
    tier: 4,
    items: ['Os ilium', 'Os ischii', 'Os pubis', 'Acetabulum'],
  },

  // 2. Enkel & Onderbeen (Reader Art. pedis)
  {
    id: 'pedis_ligamenten',
    title: 'Ligamenten van art. pedis',
    tier: 2,
    items: [
      'Lig. deltoideum',
      'Lig. calcaneofibulare',
      'Lig. talofibulare anterior',
      'Lig. talofibulare posterior',
    ],
  },
  {
    id: 'pedis_botten',
    title: 'Samenstellende botten van art. pedis',
    tier: 1,
    items: ['Os talus', 'Os calcaneus', 'Os naviculare', 'Os fibula'],
  },
  {
    id: 'pedis_spieren',
    title: 'Spieren over art. pedis',
    tier: 3,
    items: [
      'm. tibialis anterior',
      'm. fibularis longus',
      'm. fibularis brevis',
      'm. soleus',
    ],
  },
  {
    id: 'bi_articulair',
    title: 'Bi-articulaire spieren (over 2 gewrichten)',
    tier: 4,
    items: [
      'm. gastrocnemius',
      'm. biceps brachii',
      'm. triceps brachii',
      'm. rectus femoris',
    ],
  },

  // 3. Assen, vlakken & bewegingen (Reader Assen & Vlakken)
  {
    id: 'sagittaal_vlak',
    title: 'Bewegingen in het sagittale vlak (transversale as)',
    tier: 1,
    items: ['Anteflexie', 'Retroflexie', 'Plantairflexie', 'Dorsaalflexie'],
  },
  {
    id: 'transversaal_vlak',
    title: 'Bewegingen om de longitudinale as',
    tier: 2,
    items: ['Endorotatie', 'Exorotatie', 'Pronatie', 'Supinatie'],
  },
  {
    id: 'cingulum_bewegingen',
    title: 'Bewegingen van het cingulum pectorale',
    tier: 3,
    items: ['Protractie', 'Retractie', 'Elevatie', 'Laterorotatie'],
  },
  {
    id: 'synoviaal_1_as',
    title: 'Synoviale gewrichtstypen met 1 as',
    tier: 4,
    items: ['Art. ginglymus', 'Art. trochoidea', 'Art. plana', 'Art. ellipsoidea'],
  },

  // 4. Schouder, Arm & Scapula (Reader Art. humeri & cubiti)
  {
    id: 'scapula_structuren',
    title: 'Botstructuren op het os scapula',
    tier: 1,
    items: [
      'Acromion',
      'Processus coracoideus',
      'Cavitas glenoidalis',
      'Spina scapula',
    ],
  },
  {
    id: 'humerus_structuren',
    title: 'Botstructuren op het os humerus',
    tier: 2,
    items: [
      'Tuberculum majus',
      'Tuberculum minus',
      'Trochlea humeri',
      'Capitulum humeri',
    ],
  },
  {
    id: 'cubiti_deelgewrichten',
    title: 'Deelgewrichten van art. cubiti & cingulum',
    tier: 3,
    items: [
      'Art. humero-ulnaris',
      'Art. humero-radialis',
      'Art. radio-ulnaris proximalis',
      'Art. acromio-clavicularis',
    ],
  },
  {
    id: 'scapula_insertie_spieren',
    title: 'Hechten aan op margo of angulus van os scapula',
    tier: 4,
    items: [
      'm. levator scapulae',
      'm. serratus anterior',
      'mm. rhomboidei',
      'm. teres major',
    ],
  },

  // 5. Romp, Wervelkolom & Gewrichtsopbouw (Reader Romp & Synoviaal)
  {
    id: 'vertebra_structuren',
    title: 'Onderdelen van een vertebra (wervel)',
    tier: 1,
    items: [
      'Corpus vertebra',
      'Arcus vertebra',
      'Processus spinosus',
      'Processus transversus',
    ],
  },
  {
    id: 'costae_soorten',
    title: 'Indeling van de thorax & wervelkolom',
    tier: 2,
    items: [
      'Costae verae (7)',
      'Costae spuriae (3)',
      'Costae fluctuantes (2)',
      'Discus intervertebralis',
    ],
  },
  {
    id: 'synoviaal_onderdelen',
    title: 'Onderdelen van een synoviaal gewricht',
    tier: 3,
    items: [
      'Gewrichtskapsel',
      'Synoviaal membraan',
      'Hyalien kraakbeen',
      'Bursa',
    ],
  },
  {
    id: 'buikspieren_romp',
    title: 'Spieren voor flexie of rotatie van de romp',
    tier: 4,
    items: [
      'm. rectus abdominis',
      'm. obliquus internus abdominis',
      'm. obliquus externus abdominis',
      'm. iliopsoas',
    ],
  },

  // 6. Botpunten & Origo-combinaties (Reader Anatomie)
  {
    id: 'origo_tuber_ischiadicum',
    title: 'Origo op het tuber ischiadicum',
    tier: 1,
    items: [
      'm. biceps femoris (caput longum)',
      'm. semimembranosus',
      'm. semitendinosus',
      'mm. adductor (os ischii)',
    ],
  },
  {
    id: 'insertie_achilles_medial',
    title: 'Insertie op de voet (tuber calcanei / voetrand)',
    tier: 2,
    items: [
      'Tuber calcanei (achillespees)',
      'Mediale voetrand',
      'Laterale voetrand',
      'Onder de voet door',
    ],
  },
  {
    id: 'radius_ulna_structuren',
    title: 'Botstructuren op os radius & os ulna',
    tier: 3,
    items: [
      'Olecranon',
      'Tuberositas ulnae',
      'Caput radii',
      'Tuberositas radii',
    ],
  },
  {
    id: 'sternum_clavicula_structuren',
    title: 'Botstructuren op os sternum & os clavicula',
    tier: 4,
    items: [
      'Manubrium sterni',
      'Processus xiphoideus',
      'Extremitas sternalis',
      'Extremitas acromialis',
    ],
  },

  // 7. Synoviaal Gewrichten (PDF: ANTWOORDEN synoviaal gewrichten.pdf)
  {
    id: 'synoviaal_wrijving_smering',
    title: 'Voorkomen wrijving of druk in een synoviaal gewricht',
    tier: 1,
    items: [
      'Gewrichtsruimte met synovia',
      'Peesschede',
      'Synoviaal membraan',
      'Bursa (slijmbeurs)',
    ],
  },
  {
    id: 'synoviaal_meerassig',
    title: 'Synoviale gewrichten met 2 of 3 vrijheidsgraden (assen)',
    tier: 2,
    items: [
      'Art. spheroidea (3 assen)',
      'Art. sellaris (2 assen)',
      'Art. trocho-ginglymus (2 assen)',
      'Cingulum pectorale (2 assen)',
    ],
  },
  {
    id: 'gewrichtskoppen_pdf',
    title: 'Gewrichtskoppen uit de werkcolleges',
    tier: 3,
    items: [
      'Caput femoris',
      'Caput humeri',
      'Condylus medialis/lateralis femur',
      'Capitulum & trochlea humeri',
    ],
  },
  {
    id: 'onderste_bovenste_spronggewricht',
    title: 'Onderdelen van de spronggewrichten (art. pedis)',
    tier: 4,
    items: [
      'Art. talocruralis (BSG)',
      'Art. subtalaris (voorste OSG)',
      'Art. talocalcaneonavicularis',
      'Malleolus medialis & lateralis',
    ],
  },

  // 8. Vlakken, Assen & Bewegingen (PDF: ANTWOORDEN assen vlakken en bewegingen.pdf)
  {
    id: 'bewegingen_nvt_vlak_as',
    title: 'Bewegingen waarbij vlak & as "n.v.t." zijn (PDF)',
    tier: 1,
    items: [
      'Eversie & Inversie',
      'Horizontale ab- & adductie',
      'Elevatie & Depressie',
      'Protractie & Retractie',
    ],
  },
  {
    id: 'frontaal_sagittaal_fs',
    title: 'Frontaal vlak (F) & Sagittale as (S)',
    tier: 2,
    items: [
      'Abductie art. coxae',
      'Adductie art. humeri',
      'Lateroflexie dextra',
      'Lateroflexie sinistra',
    ],
  },
  {
    id: 'sagittaal_transversaal_st',
    title: 'Sagittaal vlak (S) & Transversale as (T)',
    tier: 3,
    items: [
      'Flexie & Extensie art. genus',
      'Anteflexie & Retroflexie',
      'Plantair- & Dorsaalflexie',
      'Flexie & Extensie romp',
    ],
  },
  {
    id: 'transversaal_longitudinaal_tl',
    title: 'Transversaal vlak (T) & Longitudinale as (L)',
    tier: 4,
    items: [
      'Exo- & Endorotatie art. coxae',
      'Exo- & Endorotatie art. genus',
      'Pronatie & Supinatie',
      'Rotatie van de romp',
    ],
  },

  // 9. Richtingen & Knie-ligamenten (PDF: ANTWOORDEN richtingen & Art. genus)
  {
    id: 'genus_ligamenten_menisci',
    title: 'Ligamenten & menisci van het art. genus',
    tier: 1,
    items: [
      'Lig. cruciatum anterior',
      'Lig. cruciatum posterior',
      'Lig. collaterale medialis',
      'Lig. collaterale lateralis',
    ],
  },
  {
    id: 'richtingen_aanzicht_herkenning',
    title: 'Herkenningspunten voor aanzicht (Richtingen PDF)',
    tier: 2,
    items: [
      'Patella (ventraal)',
      'Spina scapula (dorsaal)',
      'Fossa olecranon (dorsaal)',
      'Margo medialis & lateralis',
    ],
  },
  {
    id: 'richtingen_voor_boven_binnen',
    title: 'Richtingsbegrippen: voor, boven, midden, dichtbij',
    tier: 3,
    items: ['Anterior / Ventraal', 'Superior', 'Mediaal', 'Proximaal'],
  },
  {
    id: 'richtingen_achter_onder_buiten',
    title: 'Richtingsbegrippen: achter, onder, buiten, veraf',
    tier: 4,
    items: ['Posterior / Dorsaal', 'Inferior', 'Lateraal', 'Distaal'],
  },
];

const PRESET_BOARDS: ConnectionsPreset[] = [
  {
    id: 'bord_1',
    name: '1. Heup & Knie',
    groups: [ALL_GROUPS[0], ALL_GROUPS[1], ALL_GROUPS[2], ALL_GROUPS[3]],
  },
  {
    id: 'bord_2',
    name: '2. Enkel & Spieren',
    groups: [ALL_GROUPS[4], ALL_GROUPS[5], ALL_GROUPS[6], ALL_GROUPS[7]],
  },
  {
    id: 'bord_3',
    name: '3. Assen & Gewrichten',
    groups: [ALL_GROUPS[8], ALL_GROUPS[9], ALL_GROUPS[10], ALL_GROUPS[11]],
  },
  {
    id: 'bord_4',
    name: '4. Schouder & Arm',
    groups: [ALL_GROUPS[12], ALL_GROUPS[13], ALL_GROUPS[14], ALL_GROUPS[15]],
  },
  {
    id: 'bord_5',
    name: '5. Romp & Wervel',
    groups: [ALL_GROUPS[16], ALL_GROUPS[17], ALL_GROUPS[18], ALL_GROUPS[19]],
  },
  {
    id: 'bord_6',
    name: '6. Botten & Origo',
    groups: [ALL_GROUPS[20], ALL_GROUPS[21], ALL_GROUPS[22], ALL_GROUPS[23]],
  },
  {
    id: 'bord_7',
    name: '7. Synoviaal (PDF)',
    groups: [ALL_GROUPS[24], ALL_GROUPS[25], ALL_GROUPS[26], ALL_GROUPS[27]],
  },
  {
    id: 'bord_8',
    name: '8. Vlak & As (PDF)',
    groups: [ALL_GROUPS[28], ALL_GROUPS[29], ALL_GROUPS[30], ALL_GROUPS[31]],
  },
  {
    id: 'bord_9',
    name: '9. Richtingen & Knie',
    groups: [ALL_GROUPS[32], ALL_GROUPS[33], ALL_GROUPS[34], ALL_GROUPS[35]],
  },
];

const TIER_STYLES: Record<1 | 2 | 3 | 4, string> = {
  1: 'bg-amber-100 border-amber-300 text-amber-950',
  2: 'bg-emerald-100 border-emerald-300 text-emerald-950',
  3: 'bg-sky-100 border-sky-300 text-sky-950',
  4: 'bg-purple-100 border-purple-300 text-purple-950',
};

function shuffleArray<T>(arr: T[]): T[] {
  const copy = [...arr];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j], copy[i]];
  }
  return copy;
}

export const ConnectionsGame: React.FC = () => {
  const [boardIndex, setBoardIndex] = useState<number>(0);
  const [customGroups, setCustomGroups] = useState<ConnectionGroup[] | null>(null);
  const [tiles, setTiles] = useState<string[]>([]);
  const [selectedTiles, setSelectedTiles] = useState<string[]>([]);
  const [solvedGroups, setSolvedGroups] = useState<ConnectionGroup[]>([]);
  const [mistakes, setMistakes] = useState<number>(0);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [isShaking, setIsShaking] = useState<boolean>(false);

  const MAX_MISTAKES = 4;

  const activeGroups = useMemo(() => {
    if (customGroups && customGroups.length === 4) return customGroups;
    return PRESET_BOARDS[boardIndex % PRESET_BOARDS.length].groups;
  }, [boardIndex, customGroups]);

  const initBoard = (groups: ConnectionGroup[]) => {
    const allItems = groups.flatMap((g) => g.items);
    setTiles(shuffleArray(allItems));
    setSelectedTiles([]);
    setSolvedGroups([]);
    setMistakes(0);
    setStatusMessage(null);
  };

  useEffect(() => {
    initBoard(activeGroups);
  }, [activeGroups]);

  // Genereer een willekeurig gemengd bord uit alle 24 reader-categorieën zonder dubbele termen
  const handleRandomMixBoard = () => {
    const shuffledGroups = shuffleArray(ALL_GROUPS);
    const chosen: ConnectionGroup[] = [];
    const usedTerms = new Set<string>();

    for (const g of shuffledGroups) {
      if (g.items.some((item) => usedTerms.has(item.toLowerCase()))) continue;
      chosen.push({
        ...g,
        tier: ((chosen.length % 4) + 1) as 1 | 2 | 3 | 4,
      });
      g.items.forEach((item) => usedTerms.add(item.toLowerCase()));
      if (chosen.length === 4) break;
    }

    setCustomGroups(chosen);
  };

  const handleToggleTile = (item: string) => {
    if (mistakes >= MAX_MISTAKES) return;
    setStatusMessage(null);

    if (selectedTiles.includes(item)) {
      setSelectedTiles((prev) => prev.filter((x) => x !== item));
    } else if (selectedTiles.length < 4) {
      setSelectedTiles((prev) => [...prev, item]);
    }
  };

  const handleSubmit = () => {
    if (selectedTiles.length !== 4) return;

    const remainingGroups = activeGroups.filter(
      (g) => !solvedGroups.some((sg) => sg.id === g.id)
    );

    // 1. Controleer of alle 4 bij dezelfde categorie horen
    const matchedGroup = remainingGroups.find((g) =>
      g.items.every((item) => selectedTiles.includes(item))
    );

    if (matchedGroup) {
      setSolvedGroups((prev) => [...prev, matchedGroup]);
      setTiles((prev) => prev.filter((t) => !selectedTiles.includes(t)));
      setSelectedTiles([]);
      setStatusMessage(null);
      return;
    }

    // 2. Controleer of er 3 van de 4 kloppen ("Één ervan!")
    const oneAway = remainingGroups.some(
      (g) => g.items.filter((item) => selectedTiles.includes(item)).length === 3
    );

    const nextMistakes = mistakes + 1;
    setMistakes(nextMistakes);
    setIsShaking(true);
    setTimeout(() => setIsShaking(false), 450);

    if (nextMistakes >= MAX_MISTAKES) {
      // Toon na 4 fouten de resterende groepen
      setStatusMessage('Helaas, geen pogingen meer');
      setSolvedGroups(activeGroups);
      setTiles([]);
      setSelectedTiles([]);
    } else if (oneAway) {
      setStatusMessage('Bijna! 3 van de 4 horen bij elkaar');
    } else {
      setStatusMessage('Niet één groep');
    }
  };

  const isComplete = solvedGroups.length === 4;

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-hidden">
      {/* 1. Compacte subbalk met borden en Mix-knop */}
      <div className="shrink-0 h-10 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {PRESET_BOARDS.map((b, idx) => {
            const active = !customGroups && boardIndex === idx;
            return (
              <button
                key={b.id}
                onClick={() => {
                  setCustomGroups(null);
                  setBoardIndex(idx);
                }}
                className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                  active
                    ? 'bg-slate-900 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                }`}
              >
                {b.name}
              </button>
            );
          })}
          <button
            onClick={handleRandomMixBoard}
            className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
              customGroups
                ? 'bg-slate-900 text-white'
                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
            }`}
          >
            Willekeurige Mix
          </button>
        </div>

        <button
          onClick={() => initBoard(activeGroups)}
          title="Reset bord"
          className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 shrink-0"
        >
          <RotateCcw className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* 2. Het 4x4 Connections Speelveld */}
      <div className="flex-1 flex flex-col items-center justify-center p-3 max-w-2xl w-full mx-auto gap-2.5 overflow-y-auto">
        {/* Subtiele statusmelding ("Bijna! 3 van de 4...") */}
        <div className="h-6 flex items-center justify-center">
          {statusMessage ? (
            <span className="px-3 py-0.5 rounded-full bg-slate-900 text-white text-xs font-medium">
              {statusMessage}
            </span>
          ) : (
            <span className="text-xs text-slate-500">
              Vind 4 groepen van 4 begrippen die bij elkaar horen
            </span>
          )}
        </div>

        {/* Opgeloste rijen + Resterende 4x4 tegels */}
        <div className="w-full flex flex-col gap-2">
          {solvedGroups.map((group) => (
            <div
              key={group.id}
              className={`w-full rounded-xl border px-3 py-2.5 text-center transition-all ${TIER_STYLES[group.tier]}`}
            >
              <div className="text-xs font-bold uppercase tracking-wide">
                {group.title}
              </div>
              <div className="text-xs font-medium mt-0.5 opacity-90">
                {group.items.join(' · ')}
              </div>
            </div>
          ))}

          {tiles.length > 0 && (
            <div className="grid grid-cols-4 gap-1.5 sm:gap-2 w-full">
              {tiles.map((item) => {
                const isSelected = selectedTiles.includes(item);
                const maxWordLen = Math.max(...item.split(/\s+/).map((w) => w.length));
                const sizeClass =
                  maxWordLen >= 13 || item.length >= 22
                    ? 'text-[9.5px] sm:text-[11px] leading-tight tracking-tight'
                    : maxWordLen >= 10 || item.length >= 15
                    ? 'text-[10.5px] sm:text-xs leading-tight'
                    : 'text-xs sm:text-[13px] leading-snug';

                return (
                  <button
                    key={item}
                    onClick={() => handleToggleTile(item)}
                    className={`min-h-[68px] sm:min-h-[78px] px-1.5 py-1.5 sm:p-2 rounded-xl border font-semibold flex items-center justify-center text-center overflow-hidden transition-all ${sizeClass} ${
                      isSelected && isShaking
                        ? 'bg-rose-600 border-rose-600 text-white animate-pulse'
                        : isSelected
                        ? 'bg-slate-900 border-slate-900 text-white shadow-sm scale-[0.98]'
                        : 'bg-white border-slate-200 text-slate-800 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                  >
                    <span className="w-full break-words hyphens-auto">{item}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>

        {/* Levens-stipjes & Actieknoppen */}
        <div className="w-full flex items-center justify-between pt-2">
          <div className="flex items-center gap-1.5">
            <span className="text-xs text-slate-500">Levens:</span>
            <div className="flex items-center gap-1">
              {Array.from({ length: MAX_MISTAKES }).map((_, i) => (
                <span
                  key={i}
                  className={`w-2.5 h-2.5 rounded-full transition-colors ${
                    i < MAX_MISTAKES - mistakes ? 'bg-slate-800' : 'bg-slate-200'
                  }`}
                />
              ))}
            </div>
          </div>

          {isComplete ? (
            <button
              onClick={() => {
                if (customGroups) {
                  handleRandomMixBoard();
                } else {
                  setBoardIndex((i) => (i + 1) % PRESET_BOARDS.length);
                }
              }}
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Volgend bord</span>
            </button>
          ) : (
            <div className="flex items-center gap-1.5">
              <button
                onClick={() => setTiles((prev) => shuffleArray(prev))}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 flex items-center gap-1"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Hussel</span>
              </button>

              <button
                disabled={selectedTiles.length === 0}
                onClick={() => setSelectedTiles([])}
                className="px-3 py-2 rounded-xl bg-white border border-slate-200 text-slate-700 text-xs font-medium hover:bg-slate-50 disabled:opacity-40"
              >
                Wis
              </button>

              <button
                disabled={selectedTiles.length !== 4}
                onClick={handleSubmit}
                className="px-4 py-2 rounded-xl bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800 disabled:opacity-30 transition-opacity"
              >
                Controleer
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

