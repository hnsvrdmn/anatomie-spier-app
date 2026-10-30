export interface SubJointInfo {
  name: string;
  dutchName?: string;
  description?: string;
}

export interface JointMovementInfo {
  movement: string;
  muscleIds: string[];
  note?: string;
}

export interface JointDetail {
  id: string;
  name: string;
  latinName: string;
  dutchName: string;
  jointType: string;
  subJoints?: SubJointInfo[];
  description?: string;
  defaultView: 'ventral' | 'dorsal';
  movements: JointMovementInfo[];
}

export interface SynovialJointType {
  dutchName: string;
  latinName: string;
  shapeDescription: string;
  degreesOfFreedom: string;
  examples: string[];
}

/**
 * 2. De 6 algemene typen synoviale gewrichten naar vorm (p. 27 van het moduulboek)
 */
export const SYNOVIAL_JOINT_TYPES: SynovialJointType[] = [
  {
    dutchName: 'Scharniergewricht',
    latinName: 'Art. ginglymus',
    shapeDescription: 'Cilindrisch gewrichtsvlak passend in een holle goot. Laat beweging om één as toe.',
    degreesOfFreedom: '1 vrijheidsgraad (uni-axiaal)',
    examples: ['Art. humero-ulnaris (elleboog)', 'Art. talocruralis (BSG)'],
  },
  {
    dutchName: 'Rolgewricht',
    latinName: 'Art. trochoidea',
    shapeDescription: 'Ronde cilinder die roteert binnen een ring van bot en bindweefsel/ligament.',
    degreesOfFreedom: '1 vrijheidsgraad (uni-axiaal)',
    examples: ['Art. radio-ulnaris proximalis', 'Art. radio-ulnaris distalis'],
  },
  {
    dutchName: 'Zadelgewricht',
    latinName: 'Art. sellaris',
    shapeDescription: 'Twee zadelvormige oppervlakken die concaaf en convex in elkaar grijpen.',
    degreesOfFreedom: '2 vrijheidsgraden (bi-axiaal)',
    examples: ['Art. sterno-clavicularis (SC-gewricht)'],
  },
  {
    dutchName: 'Bolgewricht',
    latinName: 'Art. spheroidea',
    shapeDescription: 'Bolvormige gewrichtskop (caput) passend in een komvormige gewrichtsholte (fossa).',
    degreesOfFreedom: '3 vrijheidsgraden (multi-axiaal / kogelgewricht)',
    examples: ['Art. humeri (schoudergewricht)', 'Art. coxae (heupgewricht)', 'Art. humero-radialis (naar vorm)'],
  },
  {
    dutchName: 'Vlak gewricht',
    latinName: 'Art. plana',
    shapeDescription: 'Platte gewrichtsvlakken die een geringe glijbeweging ten opzichte van elkaar toelaten.',
    degreesOfFreedom: 'Translatie / meervoudig glijden',
    examples: ['Art. acromio-clavicularis (AC-gewricht)', 'Articulationes intervertebrales (wervelgewrichten)'],
  },
  {
    dutchName: 'Ellipsoïd gewricht',
    latinName: 'Art. ellipsoidea',
    shapeDescription: 'Ovale eivormige kop passend in een ovale holte (ellipsvormig). Laat beweging om twee assen toe.',
    degreesOfFreedom: '2 vrijheidsgraden (bi-axiaal)',
    examples: ['Art. ellipsoidea (ellipsoïd / eivormig gewricht naar vormindeling)'],
  },
];

/**
 * 1. Gewrichtstypes en bewegingen per anatomisch gewricht
 */
export const JOINTS_LEARNING_DATA: Record<string, JointDetail> = {
  coxae: {
    id: 'coxae',
    name: 'Articulatio coxae',
    latinName: 'Articulatio coxae',
    dutchName: 'Heupgewricht',
    jointType: 'Art. spheroidea (bolgewricht)',
    defaultView: 'ventral',
    description: 'Kogelgewricht tussen caput femoris en acetabulum van het os coxae. 3 vrijheidsgraden.',
    movements: [
      {
        movement: 'Anteflexie',
        muscleIds: ['iliopsoas', 'rectus_femoris'],
        note: 'Buiging naar voren in de heup',
      },
      {
        movement: 'Retroflexie',
        muscleIds: ['gluteus_maximus', 'biceps_femoris'],
        note: 'Strekking naar achteren in de heup',
      },
      {
        movement: 'Adductie',
        muscleIds: ['adductores'],
        note: 'Naar binnen bewegen van het been',
      },
      {
        movement: 'Endorotatie',
        muscleIds: ['semimembranosus', 'semitendinosus'],
        note: 'Binnenwaartse draaiing van het dijbeen in het art. coxae',
      },
      {
        movement: 'Exorotatie',
        muscleIds: ['gluteus_maximus', 'iliopsoas'],
        note: 'Buitenwaartse draaiing van het dijbeen in het art. coxae',
      },
    ],
  },

  genus: {
    id: 'genus',
    name: 'Articulatio genus',
    latinName: 'Articulatio genus',
    dutchName: 'Kniegewricht',
    jointType: 'Art. trocho-ginglymus (rol-scharniergewricht)',
    defaultView: 'ventral',
    description: 'Gecompliceerd rol-scharniergewricht tussen femur, tibia en patella. Scharniert primair en roteert licht bij gebogen knie.',
    movements: [
      {
        movement: 'Extensie',
        muscleIds: ['rectus_femoris', 'vastus_lateralis', 'vastus_intermedius', 'vastus_medialis'],
        note: 'Strekking van het onderbeen via m. quadriceps femoris',
      },
      {
        movement: 'Flexie',
        muscleIds: ['biceps_femoris', 'semimembranosus', 'semitendinosus', 'gastrocnemius'],
        note: 'Buiging van de knie door hamstrings en m. gastrocnemius',
      },
      {
        movement: 'Endorotatie',
        muscleIds: ['semimembranosus', 'semitendinosus'],
        note: 'Binnenwaartse rotatie van het onderbeen (bij gebogen knie)',
      },
      {
        movement: 'Exorotatie',
        muscleIds: ['biceps_femoris'],
        note: 'Buitenwaartse rotatie van het onderbeen (bij gebogen knie)',
      },
    ],
  },

  pedis: {
    id: 'pedis',
    name: 'Articulationes pedis',
    latinName: 'Articulationes pedis',
    dutchName: 'Voet- en enkelgewrichten',
    jointType: 'Samengesteld gewricht',
    defaultView: 'ventral',
    description: 'Samengesteld gewrichtssysteem voor loopstabiliteit en voetafwikkeling.',
    subJoints: [
      {
        name: 'Art. talocruralis',
        dutchName: 'Bovenste spronggewricht (BSG)',
        description: 'Scharniergewricht voor dorsaalflexie en plantairflexie.',
      },
      {
        name: 'Art. subtalaris',
        dutchName: 'Achterste gedeelte van het onderste spronggewricht (OSG)',
        description: 'Gewricht tussen talus en calcaneus voor inversie/eversie.',
      },
      {
        name: 'Art. talo-calcaneo-navicularis',
        dutchName: 'Voorste gedeelte van het onderste spronggewricht (OSG)',
        description: 'Gewricht tussen talus, calcaneus en os naviculare voor inversie/eversie.',
      },
    ],
    movements: [
      {
        movement: 'Dorsaalflexie',
        muscleIds: ['tibialis_anterior'],
        note: 'Art. talocruralis (BSG) - tenen omhoog naar scheenbeen',
      },
      {
        movement: 'Plantairflexie',
        muscleIds: ['gastrocnemius', 'soleus'],
        note: 'Art. talocruralis (BSG) - tenen naar beneden (op de tenen staan)',
      },
      {
        movement: 'Eversie',
        muscleIds: ['fibularis_brevis', 'fibularis_longus'],
        note: 'Art. talo-calcaneo-navicularis (OSG) - buitenrand van de voet omhoog',
      },
      {
        movement: 'Inversie',
        muscleIds: ['tibialis_anterior'],
        note: 'Art. talo-calcaneo-navicularis (OSG) - binnenrand van de voet omhoog',
      },
    ],
  },

  cubiti: {
    id: 'cubiti',
    name: 'Articulatio cubiti',
    latinName: 'Articulatio cubiti',
    dutchName: 'Ellebooggewricht',
    jointType: 'Art. trocho-ginglymus',
    defaultView: 'ventral',
    description: 'Samengesteld rol-scharniergewricht bestaande uit drie deelgewrichten binnen één gewrichtskapsel.',
    subJoints: [
      {
        name: 'Art. humero-ulnaris',
        dutchName: 'Mediale gewricht',
        description: 'Scharniergewricht tussen trochlea humeri en incisura trochlearis ulnae (flexie/extensie).',
      },
      {
        name: 'Art. humero-radialis',
        dutchName: 'Laterale gewricht',
        description: 'Kogelgewricht naar vorm, maar functioneel beperkt door ulna (flexie/extensie en rotatie).',
      },
      {
        name: 'Art. radio-ulnaris proximalis',
        dutchName: 'Gewricht tussen radius en ulna',
        description: 'Rolgewricht voor pronatie en supinatie van de onderarm.',
      },
    ],
    movements: [
      {
        movement: 'Flexie',
        muscleIds: ['biceps_brachii', 'brachialis'],
        note: 'Buiging van de onderarm in het art. humero-ulnaris & humero-radialis',
      },
      {
        movement: 'Extensie',
        muscleIds: ['triceps_brachii'],
        note: 'Strekking van de onderarm naar het olecranon',
      },
      {
        movement: 'Supinatie',
        muscleIds: ['biceps_brachii'],
        note: 'Draaiing van de handpalm naar boven/ventraal via art. radio-ulnaris',
      },
    ],
  },

  humeri: {
    id: 'humeri',
    name: 'Articulatio humeri',
    latinName: 'Articulatio humeri',
    dutchName: 'Schoudergewricht',
    jointType: 'Art. spheroidea (bolgewricht)',
    defaultView: 'dorsal',
    description: 'Bolgewricht tussen caput humeri en cavitas glenoidalis van de scapula. Zeer beweeglijk kogelgewricht.',
    movements: [
      {
        movement: 'Abductie',
        muscleIds: ['deltoideus'],
        note: 'Zijwaarts heffen van de arm (tot 90° in art. humeri door pars acromialis)',
      },
      {
        movement: 'Adductie',
        muscleIds: ['latissimus_dorsi', 'pectoralis_major', 'teres_major', 'triceps_brachii'],
        note: 'Naar het lichaam toe trekken van de arm',
      },
      {
        movement: 'Anteflexie',
        muscleIds: ['deltoideus'],
        note: 'Voorwaarts heffen van de arm (pars clavicularis)',
      },
      {
        movement: 'Retroflexie',
        muscleIds: ['deltoideus'],
        note: 'Achterwaarts bewegen van de arm (pars spinalis)',
      },
      {
        movement: 'Endorotatie',
        muscleIds: ['latissimus_dorsi', 'pectoralis_major', 'teres_major'],
        note: 'Binnenwaartse rotatie van de bovenarm',
      },
      {
        movement: 'Exorotatie',
        muscleIds: ['teres_minor'],
        note: 'Buitenwaartse rotatie van de bovenarm',
      },
    ],
  },

  cingulum: {
    id: 'cingulum',
    name: 'Cingulum pectorale',
    latinName: 'Cingulum pectorale',
    dutchName: 'Schoudergordel',
    jointType: 'Schoudergordel (SC & AC)',
    defaultView: 'dorsal',
    description: 'Schoudergordel gevormd door het art. sterno-clavicularis (SC) en art. acromio-clavicularis (AC).',
    subJoints: [
      {
        name: 'Art. sterno-clavicularis',
        dutchName: 'SC-gewricht (zadelgewricht)',
        description: 'Gewricht tussen sternum en clavicula.',
      },
      {
        name: 'Art. acromio-clavicularis',
        dutchName: 'AC-gewricht (vlak gewricht)',
        description: 'Gewricht tussen acromion en clavicula.',
      },
    ],
    movements: [
      {
        movement: 'Elevatie',
        muscleIds: ['trapezius', 'levator_scapulae'],
        note: 'Omhoog trekken van het schouderblad (schouders ophalen)',
      },
      {
        movement: 'Depressie',
        muscleIds: ['trapezius'],
        note: 'Omlaag trekken van het schouderblad (pars ascendens)',
      },
      {
        movement: 'Retractie',
        muscleIds: ['trapezius', 'rhomboidei'],
        note: 'Naar elkaar toe trekken van de schouderbladen naar de wervelkolom',
      },
      {
        movement: 'Protractie',
        muscleIds: ['serratus_anterior'],
        note: 'Naar voren en opzij trekken van het schouderblad rond de ribbenkast',
      },
      {
        movement: 'Laterorotatie',
        muscleIds: ['serratus_anterior'],
        note: 'Draaiing van de scapulapunt naar lateraal-boven (voor abductie boven 90°)',
      },
      {
        movement: 'Mediorotatie',
        muscleIds: ['rhomboidei'],
        note: 'Draaiing van de scapulapunt naar mediaal',
      },
    ],
  },

  romp: {
    id: 'romp',
    name: 'Romp en Wervelkolom',
    latinName: 'Columna vertebralis & abdomen',
    dutchName: 'Romp / Wervelkolom',
    jointType: 'Diverse',
    defaultView: 'ventral',
    description: 'Wervelkolom (met articulationes intervertebrales) en de buikwand.',
    movements: [
      {
        movement: 'Flexie',
        muscleIds: ['rectus_abdominis', 'iliopsoas'],
        note: 'Voorwaartse buiging van de romp',
      },
      {
        movement: 'Extensie',
        muscleIds: ['erector_spinae'],
        note: '(Hyper)extensie / oprichten van de wervelkolom',
      },
      {
        movement: 'Lateroflexie',
        muscleIds: ['obliquus_internus_abdominis', 'obliquus_externus_abdominis'],
        note: 'Zijwaartse buiging van de wervelkolom',
      },
      {
        movement: 'Rotatie',
        muscleIds: ['obliquus_internus_abdominis', 'obliquus_externus_abdominis'],
        note: 'Draaiing van de romp door schuine buikspieren',
      },
    ],
  },
};
