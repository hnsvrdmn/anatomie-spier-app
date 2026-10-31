import React, { useState, useMemo } from 'react';
import { RotateCcw, Check } from 'lucide-react';

export interface MuscleProfile {
  id: string;
  name: string;
  region: 'onder' | 'boven';
  view: 'Ventraal' | 'Dorsaal';
  joints: string[];
  originBones: string[];
  insertionBone: string;
  insertionStructure: string;
  movements: string[];
}

const MUSCLE_PROFILES: MuscleProfile[] = [
  // Onderste extremiteit & Heup
  {
    id: 'rectus_femoris',
    name: 'm. rectus femoris',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. coxae', 'Art. genus'],
    originBones: ['Os coxae'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Tuberositas tibiae',
    movements: ['Anteflexie', 'Extensie'],
  },
  {
    id: 'vastus_lateralis',
    name: 'm. vastus lateralis',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. genus'],
    originBones: ['Os femur'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Tuberositas tibiae',
    movements: ['Extensie'],
  },
  {
    id: 'vastus_intermedius',
    name: 'm. vastus intermedius',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. genus'],
    originBones: ['Os femur'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Tuberositas tibiae',
    movements: ['Extensie'],
  },
  {
    id: 'vastus_medialis',
    name: 'm. vastus medialis',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. genus'],
    originBones: ['Os femur'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Tuberositas tibiae',
    movements: ['Extensie'],
  },
  {
    id: 'iliopsoas',
    name: 'm. iliopsoas',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. coxae', 'Columna'],
    originBones: ['Vertebrae', 'Os coxae'],
    insertionBone: 'Os femur',
    insertionStructure: 'Trochanter minor',
    movements: ['Anteflexie', 'Exorotatie', 'Flexie'],
  },
  {
    id: 'adductores',
    name: 'mm. adductor',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. coxae'],
    originBones: ['Os coxae'],
    insertionBone: 'Os femur',
    insertionStructure: 'Mediale zijde femur',
    movements: ['Adductie'],
  },
  {
    id: 'gluteus_maximus',
    name: 'm. gluteus maximus',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. coxae'],
    originBones: ['Os coxae', 'Os sacrum'],
    insertionBone: 'Os femur',
    insertionStructure: 'Proximale laterale femur',
    movements: ['Retroflexie', 'Exorotatie'],
  },
  {
    id: 'biceps_femoris',
    name: 'm. biceps femoris',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. coxae', 'Art. genus'],
    originBones: ['Os coxae', 'Os femur'],
    insertionBone: 'Os fibula',
    insertionStructure: 'Caput fibulae',
    movements: ['Retroflexie', 'Flexie', 'Exorotatie'],
  },
  {
    id: 'semimembranosus',
    name: 'm. semimembranosus',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. coxae', 'Art. genus'],
    originBones: ['Os coxae'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Condylus medialis tibiae',
    movements: ['Retroflexie', 'Flexie', 'Endorotatie'],
  },
  {
    id: 'semitendinosus',
    name: 'm. semitendinosus',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. coxae', 'Art. genus'],
    originBones: ['Os coxae'],
    insertionBone: 'Os tibia',
    insertionStructure: 'Condylus medialis tibiae',
    movements: ['Retroflexie', 'Flexie', 'Endorotatie'],
  },
  {
    id: 'tibialis_anterior',
    name: 'm. tibialis anterior',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. pedis'],
    originBones: ['Os tibia'],
    insertionBone: 'Voet',
    insertionStructure: 'Mediale voetrand',
    movements: ['Dorsaalflexie', 'Inversie'],
  },
  {
    id: 'fibularis_longus',
    name: 'm. fibularis longus',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. pedis'],
    originBones: ['Os fibula'],
    insertionBone: 'Voet',
    insertionStructure: 'Mediale voetrand',
    movements: ['Eversie'],
  },
  {
    id: 'fibularis_brevis',
    name: 'm. fibularis brevis',
    region: 'onder',
    view: 'Ventraal',
    joints: ['Art. pedis'],
    originBones: ['Os fibula'],
    insertionBone: 'Voet',
    insertionStructure: 'Laterale voetrand',
    movements: ['Eversie'],
  },
  {
    id: 'gastrocnemius',
    name: 'm. gastrocnemius',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. pedis', 'Art. genus'],
    originBones: ['Os femur'],
    insertionBone: 'Voet',
    insertionStructure: 'Tuber calcanei',
    movements: ['Plantairflexie', 'Flexie'],
  },
  {
    id: 'soleus',
    name: 'm. soleus',
    region: 'onder',
    view: 'Dorsaal',
    joints: ['Art. pedis'],
    originBones: ['Os tibia', 'Os fibula'],
    insertionBone: 'Voet',
    insertionStructure: 'Tuber calcanei',
    movements: ['Plantairflexie'],
  },

  // Bovenlichaam, Schouder, Arm & Romp
  {
    id: 'latissimus_dorsi',
    name: 'm. latissimus dorsi',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Art. humeri', 'Cingulum'],
    originBones: ['Vertebrae', 'Os coxae'],
    insertionBone: 'Os humerus',
    insertionStructure: 'Tuberculum minus',
    movements: ['Adductie', 'Endorotatie', 'Retroflexie', 'Detractie'],
  },
  {
    id: 'deltoideus',
    name: 'm. deltoideus',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Art. humeri'],
    originBones: ['Os clavicula', 'Os scapula'],
    insertionBone: 'Os humerus',
    insertionStructure: 'Lateraal op humerus',
    movements: ['Abductie', 'Anteflexie', 'Retroflexie'],
  },
  {
    id: 'pectoralis_major',
    name: 'm. pectoralis major',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Art. humeri'],
    originBones: ['Os clavicula', 'Os sternum', 'Costae'],
    insertionBone: 'Os humerus',
    insertionStructure: 'Tuberculum majus',
    movements: ['Adductie', 'Endorotatie'],
  },
  {
    id: 'teres_major',
    name: 'm. teres major',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Art. humeri'],
    originBones: ['Os scapula'],
    insertionBone: 'Os humerus',
    insertionStructure: 'Proximaal ventraal humerus',
    movements: ['Endorotatie', 'Retroflexie'],
  },
  {
    id: 'teres_minor',
    name: 'm. teres minor',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Art. humeri'],
    originBones: ['Os scapula'],
    insertionBone: 'Os humerus',
    insertionStructure: 'Tuberculum majus (dorsaal)',
    movements: ['Exorotatie', 'Retroflexie'],
  },
  {
    id: 'trapezius',
    name: 'm. trapezius',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Cingulum'],
    originBones: ['Schedel', 'Vertebrae'],
    insertionBone: 'Os scapula',
    insertionStructure: 'Clavicula, acromion & spina',
    movements: ['Elevatie', 'Retractie', 'Detractie'],
  },
  {
    id: 'levator_scapulae',
    name: 'm. levator scapulae',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Cingulum'],
    originBones: ['Vertebrae'],
    insertionBone: 'Os scapula',
    insertionStructure: 'Angulus superior',
    movements: ['Elevatie'],
  },
  {
    id: 'serratus_anterior',
    name: 'm. serratus anterior',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Cingulum'],
    originBones: ['Costae'],
    insertionBone: 'Os scapula',
    insertionStructure: 'Margo medialis & anguli',
    movements: ['Protractie', 'Laterorotatie'],
  },
  {
    id: 'rhomboidei',
    name: 'mm. rhomboidei',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Cingulum'],
    originBones: ['Vertebrae'],
    insertionBone: 'Os scapula',
    insertionStructure: 'Margo medialis',
    movements: ['Retractie', 'Mediorotatie'],
  },
  {
    id: 'biceps_brachii',
    name: 'm. biceps brachii',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Art. cubiti', 'Art. humeri'],
    originBones: ['Os scapula'],
    insertionBone: 'Os radius',
    insertionStructure: 'Tuberositas radii',
    movements: ['Flexie', 'Supinatie', 'Abductie'],
  },
  {
    id: 'brachialis',
    name: 'm. brachialis',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Art. cubiti'],
    originBones: ['Os humerus'],
    insertionBone: 'Os ulna',
    insertionStructure: 'Tuberositas ulnae',
    movements: ['Flexie'],
  },
  {
    id: 'triceps_brachii',
    name: 'm. triceps brachii',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Art. cubiti', 'Art. humeri'],
    originBones: ['Os scapula', 'Os humerus'],
    insertionBone: 'Os ulna',
    insertionStructure: 'Olecranon',
    movements: ['Extensie', 'Retroflexie'],
  },
  {
    id: 'rectus_abdominis',
    name: 'm. rectus abdominis',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Columna'],
    originBones: ['Costae', 'Os sternum'],
    insertionBone: 'Os coxae',
    insertionStructure: 'Os pubis',
    movements: ['Flexie'],
  },
  {
    id: 'obliquus_internus_abdominis',
    name: 'm. obliquus internus',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Columna'],
    originBones: ['Os coxae'],
    insertionBone: 'Costae',
    insertionStructure: 'Costae & linea alba',
    movements: ['Rotatie', 'Lateroflexie'],
  },
  {
    id: 'obliquus_externus_abdominis',
    name: 'm. obliquus externus',
    region: 'boven',
    view: 'Ventraal',
    joints: ['Columna'],
    originBones: ['Costae'],
    insertionBone: 'Os coxae',
    insertionStructure: 'Crista iliaca & linea alba',
    movements: ['Rotatie', 'Lateroflexie'],
  },
  {
    id: 'erector_spinae',
    name: 'm. erector spinae',
    region: 'boven',
    view: 'Dorsaal',
    joints: ['Columna'],
    originBones: ['Vertebrae', 'Os sacrum'],
    insertionBone: 'Vertebrae',
    insertionStructure: 'Alle wervels & sacrum',
    movements: ['Extensie'],
  },
];

export interface JointMovementProfile {
  id: string;
  name: string;
  jointType: string;
  axesCount: string;
  plane: string;
  axis: string;
  bones: string[];
}

const JOINT_MOVEMENT_PROFILES: JointMovementProfile[] = [
  {
    id: 'coxae_ante_retro',
    name: 'Art. coxae: Anteflexie & Retroflexie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Os coxae', 'Os femur'],
  },
  {
    id: 'coxae_ab_ad',
    name: 'Art. coxae: Abductie & Adductie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Frontaal (F)',
    axis: 'Sagittaal (S)',
    bones: ['Os coxae', 'Os femur'],
  },
  {
    id: 'coxae_exo_endo',
    name: 'Art. coxae: Exorotatie & Endorotatie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Transversaal (T)',
    axis: 'Longitudinaal (L)',
    bones: ['Os coxae', 'Os femur'],
  },
  {
    id: 'genus_flex_ext',
    name: 'Art. genus: Flexie & Extensie',
    jointType: 'Art. trocho-ginglymus',
    axesCount: '2 assen',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Os femur', 'Os tibia', 'Os patella'],
  },
  {
    id: 'genus_exo_endo',
    name: 'Art. genus: Exorotatie & Endorotatie',
    jointType: 'Art. trocho-ginglymus',
    axesCount: '2 assen',
    plane: 'Transversaal (T)',
    axis: 'Longitudinaal (L)',
    bones: ['Os femur', 'Os tibia', 'Os patella'],
  },
  {
    id: 'pedis_plant_dors',
    name: 'Art. pedis (BSG): Plantair- & Dorsaalflexie',
    jointType: 'Art. ginglymus',
    axesCount: '1 as',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Os tibia', 'Os fibula', 'Os talus'],
  },
  {
    id: 'pedis_ev_inv',
    name: 'Art. pedis (OSG): Eversie & Inversie',
    jointType: 'Samengesteld (OSG)',
    axesCount: '1 as (compromis)',
    plane: 'n.v.t.',
    axis: 'n.v.t.',
    bones: ['Os talus', 'Os calcaneus', 'Os naviculare'],
  },
  {
    id: 'humeri_ante_retro',
    name: 'Art. humeri: Anteflexie & Retroflexie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Os humerus', 'Os scapula'],
  },
  {
    id: 'humeri_ab_ad',
    name: 'Art. humeri: Abductie & Adductie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Frontaal (F)',
    axis: 'Sagittaal (S)',
    bones: ['Os humerus', 'Os scapula'],
  },
  {
    id: 'humeri_endo_exo',
    name: 'Art. humeri: Endorotatie & Exorotatie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'Transversaal (T)',
    axis: 'Longitudinaal (L)',
    bones: ['Os humerus', 'Os scapula'],
  },
  {
    id: 'humeri_hor_abad',
    name: 'Art. humeri: Horizontale ab- & adductie',
    jointType: 'Art. spheroidea',
    axesCount: '3 assen',
    plane: 'n.v.t.',
    axis: 'n.v.t.',
    bones: ['Os humerus', 'Os scapula'],
  },
  {
    id: 'cubiti_flex_ext',
    name: 'Art. cubiti: Flexie & Extensie',
    jointType: 'Art. trocho-ginglymus',
    axesCount: '2 assen',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Os humerus', 'Os ulna', 'Os radius'],
  },
  {
    id: 'cubiti_pro_sup',
    name: 'Art. cubiti: Pronatie & Supinatie',
    jointType: 'Art. trocho-ginglymus',
    axesCount: '2 assen',
    plane: 'Transversaal (T)',
    axis: 'Longitudinaal (L)',
    bones: ['Os humerus', 'Os ulna', 'Os radius'],
  },
  {
    id: 'cingulum_elev_dep',
    name: 'Cingulum pectorale: Elevatie & Depressie',
    jointType: 'Diverse (gordel)',
    axesCount: '2 assen',
    plane: 'n.v.t.',
    axis: 'n.v.t.',
    bones: ['Os sternum', 'Os clavicula', 'Os scapula'],
  },
  {
    id: 'cingulum_pro_ret',
    name: 'Cingulum pectorale: Protractie & Retractie',
    jointType: 'Diverse (gordel)',
    axesCount: '2 assen',
    plane: 'n.v.t.',
    axis: 'n.v.t.',
    bones: ['Os sternum', 'Os clavicula', 'Os scapula'],
  },
  {
    id: 'cingulum_lat_med',
    name: 'Cingulum pectorale: Latero- & Mediorotatie',
    jointType: 'Diverse (gordel)',
    axesCount: '2 assen',
    plane: 'n.v.t.',
    axis: 'n.v.t.',
    bones: ['Os sternum', 'Os clavicula', 'Os scapula'],
  },
  {
    id: 'romp_flex_ext',
    name: 'Romp: Flexie & Extensie',
    jointType: 'Diverse (wervelkolom)',
    axesCount: '3 assen',
    plane: 'Sagittaal (S)',
    axis: 'Transversaal (T)',
    bones: ['Vertebrae', 'Costae', 'Os sternum', 'Os coxae'],
  },
  {
    id: 'romp_lateroflexie',
    name: 'Romp: Lateroflexie (dextra / sinistra)',
    jointType: 'Diverse (wervelkolom)',
    axesCount: '3 assen',
    plane: 'Frontaal (F)',
    axis: 'Sagittaal (S)',
    bones: ['Vertebrae', 'Costae', 'Os sternum', 'Os coxae'],
  },
  {
    id: 'romp_rotatie',
    name: 'Romp: Rotatie (dextra / sinistra)',
    jointType: 'Diverse (wervelkolom)',
    axesCount: '3 assen',
    plane: 'Transversaal (T)',
    axis: 'Longitudinaal (L)',
    bones: ['Vertebrae', 'Costae', 'Os sternum', 'Os coxae'],
  },
];

type MatchLevel = 'exact' | 'partial' | 'none';

function compareSet(guessArr: string[], targetArr: string[]): MatchLevel {
  const sameLength = guessArr.length === targetArr.length;
  const allMatch = sameLength && guessArr.every((x) => targetArr.includes(x));
  if (allMatch) return 'exact';
  const someMatch = guessArr.some((x) => targetArr.includes(x));
  return someMatch ? 'partial' : 'none';
}

function getBadgeStyle(level: MatchLevel): string {
  if (level === 'exact') return 'bg-emerald-500 text-white border-emerald-600';
  if (level === 'partial') return 'bg-amber-400 text-slate-950 border-amber-500';
  return 'bg-slate-200 text-slate-600 border-slate-300';
}

export const MuscleGuessGame: React.FC = () => {
  const [regionFilter, setRegionFilter] = useState<'all' | 'onder' | 'boven' | 'joints_pdf'>('all');
  const [targetMuscle, setTargetMuscle] = useState<MuscleProfile>(
    () => MUSCLE_PROFILES[Math.floor(Math.random() * MUSCLE_PROFILES.length)]
  );
  const [guesses, setGuesses] = useState<MuscleProfile[]>([]);

  const [targetJointMov, setTargetJointMov] = useState<JointMovementProfile>(
    () => JOINT_MOVEMENT_PROFILES[Math.floor(Math.random() * JOINT_MOVEMENT_PROFILES.length)]
  );
  const [jointMovGuesses, setJointMovGuesses] = useState<JointMovementProfile[]>([]);

  const startNewRound = (filter = regionFilter) => {
    if (filter === 'joints_pdf') {
      const next =
        JOINT_MOVEMENT_PROFILES[Math.floor(Math.random() * JOINT_MOVEMENT_PROFILES.length)];
      setTargetJointMov(next);
      setJointMovGuesses([]);
      return;
    }
    const pool =
      filter === 'all'
        ? MUSCLE_PROFILES
        : MUSCLE_PROFILES.filter((m) => m.region === filter);
    const next = pool[Math.floor(Math.random() * pool.length)];
    setTargetMuscle(next);
    setGuesses([]);
  };

  const isJointMode = regionFilter === 'joints_pdf';
  const isSolved = isJointMode
    ? jointMovGuesses.some((g) => g.id === targetJointMov.id)
    : guesses.some((g) => g.id === targetMuscle.id);

  const visiblePickerMuscles = useMemo(() => {
    if (regionFilter === 'all' || regionFilter === 'joints_pdf') return MUSCLE_PROFILES;
    return MUSCLE_PROFILES.filter((m) => m.region === regionFilter);
  }, [regionFilter]);

  const handleGuess = (m: MuscleProfile) => {
    if (isSolved) return;
    if (guesses.some((g) => g.id === m.id)) return;
    setGuesses((prev) => [m, ...prev]);
  };

  const handleGuessJointMov = (jm: JointMovementProfile) => {
    if (isSolved) return;
    if (jointMovGuesses.some((g) => g.id === jm.id)) return;
    setJointMovGuesses((prev) => [jm, ...prev]);
  };

  const activeGuessCount = isJointMode ? jointMovGuesses.length : guesses.length;

  return (
    <div className="flex-1 w-full flex flex-col bg-slate-50 text-slate-900 select-none overflow-hidden">
      {/* 1. Subbalk met regiofilter + Gewrichten & Vlak/As (PDF) */}
      <div className="shrink-0 h-10 px-3 bg-white border-b border-slate-200 flex items-center justify-between gap-2">
        <div className="flex items-center gap-1 overflow-x-auto no-scrollbar py-1">
          {(
            [
              { id: 'all', label: 'Alle spieren (31)' },
              { id: 'onder', label: 'Onderlichaam (15)' },
              { id: 'boven', label: 'Bovenlichaam (16)' },
              { id: 'joints_pdf', label: 'Gewrichten & Vlak/As (PDF)' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                setRegionFilter(tab.id);
                startNewRound(tab.id);
              }}
              className={`px-2.5 py-1 rounded-md text-xs font-medium whitespace-nowrap transition-colors ${
                regionFilter === tab.id
                  ? 'bg-slate-900 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-xs font-semibold text-slate-500 tabular-nums">
            Pogingen: {activeGuessCount}
          </span>
          <button
            onClick={() => startNewRound()}
            title="Nieuwe ronde"
            className="p-1.5 rounded-md bg-white border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Vergelijkingstabel met Gokken (Groen = Exact, Geel = Deels, Grijs = Niet) */}
      <div className="flex-1 overflow-y-auto p-2.5 sm:p-4 max-w-4xl w-full mx-auto flex flex-col gap-2">
        {/* Kolomkoppen */}
        {isJointMode ? (
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5 px-1 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            <div className="text-left">Gewricht & Beweging</div>
            <div>Type</div>
            <div>Assen</div>
            <div>Vlak</div>
            <div>As</div>
            <div>Botten</div>
          </div>
        ) : (
          <div className="grid grid-cols-6 gap-1 sm:gap-1.5 px-1 text-[10px] sm:text-[11px] font-bold text-slate-400 uppercase tracking-wider text-center">
            <div className="text-left">Spier</div>
            <div>Aanzicht</div>
            <div>Gewricht</div>
            <div>Origo bot</div>
            <div>Insertie</div>
            <div>Functie</div>
          </div>
        )}

        {activeGuessCount === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center text-slate-400 text-xs gap-1 py-8">
            <p className="font-medium text-slate-600">
              {isJointMode
                ? 'Raad het verborgen gewricht & beweging (uit de PDF\'s) door onderin een optie aan te tikken'
                : 'Raad de verborgen spier door onderin een spier aan te tikken'}
            </p>
            <p>Groen = exact gelijk · Geel = gedeeltelijke overlap · Grijs = geen match</p>
          </div>
        ) : isJointMode ? (
          <div className="flex flex-col gap-1.5">
            {jointMovGuesses.map((g) => {
              const typeMatch: MatchLevel =
                g.jointType === targetJointMov.jointType ? 'exact' : 'none';
              const axesMatch: MatchLevel =
                g.axesCount === targetJointMov.axesCount
                  ? 'exact'
                  : g.axesCount[0] === targetJointMov.axesCount[0]
                  ? 'partial'
                  : 'none';
              const planeMatch: MatchLevel =
                g.plane === targetJointMov.plane ? 'exact' : 'none';
              const axisMatch: MatchLevel =
                g.axis === targetJointMov.axis ? 'exact' : 'none';
              const bonesMatch = compareSet(g.bones, targetJointMov.bones);

              return (
                <div
                  key={g.id}
                  className="grid grid-cols-6 gap-1 sm:gap-1.5 items-stretch"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-800 flex items-center leading-tight break-words hyphens-auto">
                    {g.name}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words hyphens-auto ${getBadgeStyle(
                      typeMatch
                    )}`}
                  >
                    {g.jointType}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight ${getBadgeStyle(
                      axesMatch
                    )}`}
                  >
                    {g.axesCount}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight ${getBadgeStyle(
                      planeMatch
                    )}`}
                  >
                    {g.plane}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight ${getBadgeStyle(
                      axisMatch
                    )}`}
                  >
                    {g.axis}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words hyphens-auto ${getBadgeStyle(
                      bonesMatch
                    )}`}
                  >
                    {g.bones.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="flex flex-col gap-1.5">
            {guesses.map((g) => {
              const viewMatch: MatchLevel =
                g.view === targetMuscle.view ? 'exact' : 'none';
              const jointMatch = compareSet(g.joints, targetMuscle.joints);
              const origMatch = compareSet(g.originBones, targetMuscle.originBones);
              const insMatch: MatchLevel =
                g.insertionStructure === targetMuscle.insertionStructure
                  ? 'exact'
                  : g.insertionBone === targetMuscle.insertionBone
                  ? 'partial'
                  : 'none';
              const movMatch = compareSet(g.movements, targetMuscle.movements);

              return (
                <div
                  key={g.id}
                  className="grid grid-cols-6 gap-1 sm:gap-1.5 items-stretch"
                >
                  <div className="p-1.5 sm:p-2 rounded-lg bg-white border border-slate-200 text-[10px] sm:text-xs font-bold text-slate-800 flex items-center leading-tight break-words hyphens-auto">
                    {g.name}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight ${getBadgeStyle(
                      viewMatch
                    )}`}
                  >
                    {g.view}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words ${getBadgeStyle(
                      jointMatch
                    )}`}
                  >
                    {g.joints.join(', ')}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words ${getBadgeStyle(
                      origMatch
                    )}`}
                  >
                    {g.originBones.join(', ')}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words hyphens-auto ${getBadgeStyle(
                      insMatch
                    )}`}
                  >
                    {g.insertionStructure}
                  </div>

                  <div
                    className={`p-1.5 sm:p-2 rounded-lg border text-[10px] sm:text-xs font-semibold flex items-center justify-center text-center leading-tight break-words hyphens-auto ${getBadgeStyle(
                      movMatch
                    )}`}
                  >
                    {g.movements.join(', ')}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 3. Onderbalk: Kiezer */}
      <div className="shrink-0 bg-white border-t border-slate-200 px-2.5 py-2">
        {isSolved ? (
          <div className="max-w-xl mx-auto flex items-center justify-between py-1">
            <div className="flex items-center gap-2 text-emerald-700 font-semibold text-xs sm:text-sm">
              <Check className="w-4 h-4" />
              <span>
                Gevonden in {activeGuessCount}{' '}
                {activeGuessCount === 1 ? 'poging' : 'pogingen'}:{' '}
                {isJointMode ? targetJointMov.name : targetMuscle.name}
              </span>
            </div>
            <button
              onClick={() => startNewRound()}
              className="px-3.5 py-1.5 rounded-lg bg-slate-900 text-white text-xs font-semibold hover:bg-slate-800"
            >
              Volgende
            </button>
          </div>
        ) : isJointMode ? (
          <div className="max-w-4xl mx-auto grid grid-cols-1 sm:grid-cols-3 gap-1 max-h-44 overflow-y-auto">
            {JOINT_MOVEMENT_PROFILES.map((jm) => {
              const alreadyGuessed = jointMovGuesses.some((g) => g.id === jm.id);
              return (
                <button
                  key={jm.id}
                  disabled={alreadyGuessed}
                  onClick={() => handleGuessJointMov(jm)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left truncate transition-colors ${
                    alreadyGuessed
                      ? 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-default'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {jm.name}
                </button>
              );
            })}
          </div>
        ) : (
          <div className="max-w-4xl mx-auto grid grid-cols-2 sm:grid-cols-4 gap-1 max-h-44 overflow-y-auto">
            {visiblePickerMuscles.map((m) => {
              const alreadyGuessed = guesses.some((g) => g.id === m.id);
              return (
                <button
                  key={m.id}
                  disabled={alreadyGuessed}
                  onClick={() => handleGuess(m)}
                  className={`px-2 py-1.5 rounded-lg text-[11px] font-medium border text-left truncate transition-colors ${
                    alreadyGuessed
                      ? 'bg-slate-50 border-slate-100 text-slate-300 line-through cursor-default'
                      : 'bg-white border-slate-200 text-slate-800 hover:bg-slate-100 hover:border-slate-300'
                  }`}
                >
                  {m.name}
                </button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

