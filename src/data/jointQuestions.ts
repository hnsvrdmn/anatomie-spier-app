/**
 * Vragen over gewrichten voor de PMT Anatomie & Spierleer applicatie.
 * 
 * Bevat uitsluitend de gewrichten, gewrichtstypen en assen uit de PMT-reader:
 * - Articulatio coxae (Heupgewricht)
 * - Articulatio genus (Kniegewricht)
 * - Articulatio talocruralis (Bovenste spronggewricht / BSG)
 * - Articulatio subtalaris (Onderste spronggewricht, achterste deel / OSG)
 * - Articulatio talo-calcaneo-navicularis (Onderste spronggewricht, voorste deel / OSG)
 * - Articulatio cubiti (Ellebooggewricht)
 * - Articulatio humeri (Schoudergewricht)
 * - Cingulum pectorale (Schoudergordel: art. sterno-clavicularis & art. acromio-clavicularis)
 * - Deelgewrichten & overige:
 *   * Articulatio humero-ulnaris
 *   * Articulatio humero-radialis
 *   * Articulatio radio-ulnaris proximalis
 *   * Articulatio radio-ulnaris distalis
 *   * Articulationes intervertebrales
 * - Synoviale gewrichtstypen:
 *   * Articulatio ginglymus (scharniergewricht)
 *   * Articulatio trochoidea (rolgewricht)
 *   * Articulatio sellaris (zadelgewricht)
 *   * Articulatio spheroidea (bolgewricht / kogelgewricht)
 *   * Articulatio plana (vlakgewricht)
 *   * Articulatio ellipsoidea (ellipsoïd / eivormig gewricht)
 */

export interface JointQuizItem {
  id: string;
  category: 'type' | 'subjoint' | 'axis' | 'degrees' | 'movement';
  topic: string;
  question: string;
  shortPrompt: string;
  correctAnswer: string;
  acceptableAnswers: string[];
  distractors: string[];
  explanation: string;
  jointId?: string;
}

export const JOINT_QUIZ_ITEMS: JointQuizItem[] = [
  // 1. Scharniergewricht in cubiti
  {
    id: 'cubiti-hinge',
    category: 'subjoint',
    topic: 'Deelgewricht (Elleboog)',
    question: 'Wat is het zuivere scharniergewricht binnen het ellebooggewricht (art. cubiti)?',
    shortPrompt: 'Scharniergewricht in art. cubiti',
    correctAnswer: 'Art. humero-ulnaris',
    acceptableAnswers: [
      'Art. humero-ulnaris',
      'Art. humeroulnaris',
      'humero-ulnaris',
      'humeroulnaris',
      'art humero ulnaris',
      'humeroulnair gewricht',
      'articulatio humero-ulnaris',
    ],
    distractors: [
      'Art. humero-radialis',
      'Art. radio-ulnaris proximalis',
      'Art. radio-ulnaris distalis',
    ],
    explanation: 'Het art. humero-ulnaris vormt het zuivere scharniergewricht tussen trochlea humeri en incisura trochlearis ulnae (alleen flexie en extensie).',
    jointId: 'cubiti',
  },

  // 2. Rolgewricht in cubiti
  {
    id: 'cubiti-pivot',
    category: 'subjoint',
    topic: 'Deelgewricht (Elleboog)',
    question: 'Welk deelgewricht in het ellebooggewricht (art. cubiti) is een rolgewricht (voor pronatie en supinatie)?',
    shortPrompt: 'Rolgewricht in art. cubiti',
    correctAnswer: 'Art. radio-ulnaris proximalis',
    acceptableAnswers: [
      'Art. radio-ulnaris proximalis',
      'Art. radioulnaris proximalis',
      'radio-ulnaris proximalis',
      'radioulnaris proximalis',
      'art radio ulnaris proximalis',
      'proximaal radioulnair gewricht',
      'articulatio radio-ulnaris proximalis',
    ],
    distractors: [
      'Art. humero-ulnaris',
      'Art. humero-radialis',
      'Art. radio-ulnaris distalis',
    ],
    explanation: 'Het art. radio-ulnaris proximalis is een rolgewricht (art. trochoidea) waarin het caput radii draait in de incisura radialis ulnae.',
    jointId: 'cubiti',
  },

  // 3. Kogelvormig deelgewricht in cubiti
  {
    id: 'cubiti-ball',
    category: 'subjoint',
    topic: 'Deelgewricht (Elleboog)',
    question: 'Welk deelgewricht in de elleboog (art. cubiti) is naar vorm een kogelgewricht (tussen bovenarm en spaakbeen)?',
    shortPrompt: 'Kogelvormig deelgewricht in art. cubiti',
    correctAnswer: 'Art. humero-radialis',
    acceptableAnswers: [
      'Art. humero-radialis',
      'Art. humeroradialis',
      'humero-radialis',
      'humeroradialis',
      'art humero radialis',
      'articulatio humero-radialis',
    ],
    distractors: [
      'Art. humero-ulnaris',
      'Art. radio-ulnaris proximalis',
      'Art. radio-ulnaris distalis',
    ],
    explanation: 'Het art. humero-radialis (capitulum humeri - fovea capitis radii) is naar vorm een kogelgewricht, maar beweegt functioneel mee met de ulna.',
    jointId: 'cubiti',
  },

  // 4. Bovenste spronggewricht (BSG)
  {
    id: 'pedis-bsg',
    category: 'subjoint',
    topic: 'Deelgewricht (Enkel)',
    question: 'Welk gewricht vormt het bovenste spronggewricht (BSG)?',
    shortPrompt: 'Bovenste spronggewricht (BSG)',
    correctAnswer: 'Art. talocruralis',
    acceptableAnswers: [
      'Art. talocruralis',
      'talocruralis',
      'art talocruralis',
      'Articulatio talocruralis',
      'talocruraal gewricht',
    ],
    distractors: [
      'Art. subtalaris',
      'Art. talo-calcaneo-navicularis',
      'Art. genus',
    ],
    explanation: 'Het art. talocruralis (malleolusvork van tibia en fibula om de trochlea tali) vormt het bovenste spronggewricht.',
    jointId: 'pedis',
  },

  // 5. Onderste spronggewricht (OSG) voorste deel
  {
    id: 'pedis-osg-anterior',
    category: 'subjoint',
    topic: 'Deelgewricht (Enkel/Voet)',
    question: 'Welk gewricht vormt het voorste gedeelte van het onderste spronggewricht (OSG)?',
    shortPrompt: 'Voorste deel van het OSG',
    correctAnswer: 'Art. talo-calcaneo-navicularis',
    acceptableAnswers: [
      'Art. talo-calcaneo-navicularis',
      'Art. talocalcaneonavicularis',
      'talo-calcaneo-navicularis',
      'talocalcaneonavicularis',
      'talo calcaneo navicularis',
      'art talo calcaneo navicularis',
      'articulatio talo-calcaneo-navicularis',
    ],
    distractors: [
      'Art. talocruralis',
      'Art. subtalaris',
      'Art. coxae',
    ],
    explanation: 'Het art. talo-calcaneo-navicularis vormt het voorste deel van het onderste spronggewricht (OSG).',
    jointId: 'pedis',
  },

  // 6. Onderste spronggewricht (OSG) achterste deel
  {
    id: 'pedis-osg-posterior',
    category: 'subjoint',
    topic: 'Deelgewricht (Enkel/Voet)',
    question: 'Welk gewricht vormt het achterste gedeelte van het onderste spronggewricht (OSG)?',
    shortPrompt: 'Achterste deel van het OSG',
    correctAnswer: 'Art. subtalaris',
    acceptableAnswers: [
      'Art. subtalaris',
      'subtalaris',
      'art subtalaris',
      'Articulatio subtalaris',
      'subtalair gewricht',
    ],
    distractors: [
      'Art. talocruralis',
      'Art. talo-calcaneo-navicularis',
      'Art. genus',
    ],
    explanation: 'Het art. subtalaris (tussen talus en calcaneus) vormt het achterste deel van het onderste spronggewricht (OSG).',
    jointId: 'pedis',
  },

  // 7. Onderste spronggewricht samenstelling
  {
    id: 'pedis-osg-combo',
    category: 'subjoint',
    topic: 'Deelgewricht (Enkel/Voet)',
    question: 'Welke gewrichten vormen samen het onderste spronggewricht (OSG)?',
    shortPrompt: 'Samenstelling van het OSG',
    correctAnswer: 'Art. subtalaris en art. talo-calcaneo-navicularis',
    acceptableAnswers: [
      'Art. subtalaris en art. talo-calcaneo-navicularis',
      'subtalaris en talo-calcaneo-navicularis',
      'art. subtalaris en art. talocalcaneonavicularis',
      'subtalaris en talocalcaneonavicularis',
      'art subtalaris en art talo calcaneo navicularis',
    ],
    distractors: [
      'Art. talocruralis en art. subtalaris',
      'Art. talocruralis en art. talo-calcaneo-navicularis',
      'Art. sterno-clavicularis en art. acromio-clavicularis',
    ],
    explanation: 'Het OSG bestaat functioneel uit twee delen: het art. subtalaris (achter) en het art. talo-calcaneo-navicularis (voor).',
    jointId: 'pedis',
  },

  // 8. Schoudergordel (Cingulum pectorale) samenstelling
  {
    id: 'cingulum-combo',
    category: 'subjoint',
    topic: 'Schoudergordel',
    question: 'Welke twee gewrichten vormen samen de benige verbindingen van de schoudergordel (cingulum pectorale)?',
    shortPrompt: 'Gewrichten van de schoudergordel',
    correctAnswer: 'Art. sterno-clavicularis en art. acromio-clavicularis',
    acceptableAnswers: [
      'Art. sterno-clavicularis en art. acromio-clavicularis',
      'sterno-clavicularis en acromio-clavicularis',
      'SC-gewricht en AC-gewricht',
      'SC en AC',
      'art. sternoclavicularis en art. acromioclavicularis',
      'art sterno clavicularis en art acromio clavicularis',
    ],
    distractors: [
      'Art. humeri en art. cubiti',
      'Art. humero-ulnaris en art. humero-radialis',
      'Art. radio-ulnaris proximalis en art. radio-ulnaris distalis',
    ],
    explanation: 'De schoudergordel (cingulum pectorale) wordt gevormd door het SC-gewricht (art. sterno-clavicularis) en het AC-gewricht (art. acromio-clavicularis).',
    jointId: 'cingulum',
  },

  // 9. SC-gewricht
  {
    id: 'sc-joint',
    category: 'subjoint',
    topic: 'Schoudergordel',
    question: 'Welk gewricht in de schoudergordel verbindt het borstbeen (sternum) met het sleutelbeen (clavicula)?',
    shortPrompt: 'Verbinding borstbeen en sleutelbeen',
    correctAnswer: 'Art. sterno-clavicularis (SC-gewricht)',
    acceptableAnswers: [
      'Art. sterno-clavicularis',
      'Art. sternoclavicularis',
      'sterno-clavicularis',
      'sternoclavicularis',
      'SC-gewricht',
      'SC gewricht',
      'art sterno clavicularis',
      'articulatio sterno-clavicularis',
    ],
    distractors: [
      'Art. acromio-clavicularis (AC-gewricht)',
      'Art. humeri',
      'Art. humero-ulnaris',
    ],
    explanation: 'Het art. sterno-clavicularis (SC-gewricht) verbindt het sternum met het mediale uiteinde van de clavicula.',
    jointId: 'cingulum',
  },

  // 10. AC-gewricht
  {
    id: 'ac-joint',
    category: 'subjoint',
    topic: 'Schoudergordel',
    question: 'Welk gewricht in de schoudergordel verbindt het acromion van het schouderblad met het sleutelbeen?',
    shortPrompt: 'Verbinding acromion en clavicula',
    correctAnswer: 'Art. acromio-clavicularis (AC-gewricht)',
    acceptableAnswers: [
      'Art. acromio-clavicularis',
      'Art. acromioclavicularis',
      'acromio-clavicularis',
      'acromioclavicularis',
      'AC-gewricht',
      'AC gewricht',
      'art acromio clavicularis',
      'articulatio acromio-clavicularis',
    ],
    distractors: [
      'Art. sterno-clavicularis (SC-gewricht)',
      'Art. humeri',
      'Art. radio-ulnaris proximalis',
    ],
    explanation: 'Het art. acromio-clavicularis (AC-gewricht) vormt de verbinding tussen het acromion van de scapula en de laterale clavicula.',
    jointId: 'cingulum',
  },

  // 11. Distaal radio-ulnair gewricht
  {
    id: 'distal-radioulnar',
    category: 'subjoint',
    topic: 'Deelgewricht (Onderarm)',
    question: 'Welk gewricht bevindt zich distaal tussen het spaakbeen (radius) en de ellepijp (ulna)?',
    shortPrompt: 'Distaal gewricht tussen radius en ulna',
    correctAnswer: 'Art. radio-ulnaris distalis',
    acceptableAnswers: [
      'Art. radio-ulnaris distalis',
      'Art. radioulnaris distalis',
      'radio-ulnaris distalis',
      'radioulnaris distalis',
      'art radio ulnaris distalis',
      'articulatio radio-ulnaris distalis',
    ],
    distractors: [
      'Art. radio-ulnaris proximalis',
      'Art. humero-radialis',
      'Art. humero-ulnaris',
    ],
    explanation: 'Het art. radio-ulnaris distalis is het distale rolgewricht nabij de pols tussen radius en ulna, dat samenwerkt met het proximale gewricht bij pronatie en supinatie.',
    jointId: 'cubiti',
  },

  // 12. Wervelgewrichten
  {
    id: 'spine-intervertebral',
    category: 'subjoint',
    topic: 'Wervelkolom',
    question: 'Hoe heten de gewrichten die de wervelbogen onderling met elkaar verbinden in de wervelkolom?',
    shortPrompt: 'Wervelgewrichten benaming',
    correctAnswer: 'Articulationes intervertebrales',
    acceptableAnswers: [
      'Articulationes intervertebrales',
      'Art. intervertebrales',
      'intervertebrales',
      'wervelgewrichten',
      'art intervertebrales',
      'articulationes intervertebrales',
    ],
    distractors: [
      'Art. sterno-clavicularis',
      'Art. acromio-clavicularis',
      'Art. radio-ulnaris distalis',
    ],
    explanation: 'De articulationes intervertebrales (wervelgewrichten) zijn vlakke gewrichten (art. plana) tussen de gewrichtsuitsteeksels van opeenvolgende wervels.',
    jointId: 'romp',
  },

  // 13. Type gewricht heup (art. coxae)
  {
    id: 'type-coxae',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het heupgewricht (art. coxae)?',
    shortPrompt: 'Gewrichtstype van art. coxae',
    correctAnswer: 'Bolgewricht (kogelgewricht / art. spheroidea)',
    acceptableAnswers: [
      'Bolgewricht',
      'Kogelgewricht',
      'Art. spheroidea',
      'spheroidea',
      'Articulatio spheroidea',
      'kogel',
    ],
    distractors: [
      'Rol-scharniergewricht (art. trocho-ginglymus)',
      'Scharniergewricht (art. ginglymus)',
      'Rolgewricht (art. trochoidea)',
    ],
    explanation: 'Het heupgewricht is een kogelgewricht (art. spheroidea) met 3 vrijheidsgraden.',
    jointId: 'coxae',
  },

  // 14. Type gewricht schouder (art. humeri)
  {
    id: 'type-humeri',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het schoudergewricht (art. humeri)?',
    shortPrompt: 'Gewrichtstype van art. humeri',
    correctAnswer: 'Bolgewricht (kogelgewricht / art. spheroidea)',
    acceptableAnswers: [
      'Bolgewricht',
      'Kogelgewricht',
      'Art. spheroidea',
      'spheroidea',
      'Articulatio spheroidea',
      'kogel',
    ],
    distractors: [
      'Scharniergewricht (art. ginglymus)',
      'Rolgewricht (art. trochoidea)',
      'Zadelgewricht (art. sellaris)',
    ],
    explanation: 'Het art. humeri is een uiterst beweeglijk kogelgewricht (art. spheroidea) met 3 vrijheidsgraden.',
    jointId: 'humeri',
  },

  // 15. Type gewricht knie (art. genus)
  {
    id: 'type-genus',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het kniegewricht (art. genus)?',
    shortPrompt: 'Gewrichtstype van art. genus',
    correctAnswer: 'Rol-scharniergewricht (art. trocho-ginglymus)',
    acceptableAnswers: [
      'Rol-scharniergewricht',
      'Rolscharniergewricht',
      'Art. trocho-ginglymus',
      'trochoginglymus',
      'trocho-ginglymus',
      'rolscharnier',
    ],
    distractors: [
      'Zuiver scharniergewricht (art. ginglymus)',
      'Bolgewricht (art. spheroidea)',
      'Zadelgewricht (art. sellaris)',
    ],
    explanation: 'Het kniegewricht is een gecompliceerd rol-scharniergewricht (art. trocho-ginglymus): het scharniert primair en roteert licht bij gebogen stand.',
    jointId: 'genus',
  },

  // 16. Type gewricht BSG (art. talocruralis)
  {
    id: 'type-bsg',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het bovenste spronggewricht (art. talocruralis)?',
    shortPrompt: 'Gewrichtstype van art. talocruralis',
    correctAnswer: 'Scharniergewricht (art. ginglymus)',
    acceptableAnswers: [
      'Scharniergewricht',
      'Art. ginglymus',
      'ginglymus',
      'scharnier',
      'Articulatio ginglymus',
    ],
    distractors: [
      'Rolgewricht (art. trochoidea)',
      'Zadelgewricht (art. sellaris)',
      'Vlak gewricht (art. plana)',
    ],
    explanation: 'Het art. talocruralis is een eenassig scharniergewricht (art. ginglymus) dat dorsaalflexie en plantairflexie mogelijk maakt.',
    jointId: 'pedis',
  },

  // 17. Type gewricht art. humero-ulnaris
  {
    id: 'type-humeroulnaris',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat voor type gewricht is het art. humero-ulnaris in de elleboog?',
    shortPrompt: 'Gewrichtstype van art. humero-ulnaris',
    correctAnswer: 'Scharniergewricht (art. ginglymus)',
    acceptableAnswers: [
      'Scharniergewricht',
      'Art. ginglymus',
      'ginglymus',
      'scharnier',
      'Articulatio ginglymus',
    ],
    distractors: [
      'Rolgewricht (art. trochoidea)',
      'Bolgewricht (art. spheroidea)',
      'Zadelgewricht (art. sellaris)',
    ],
    explanation: 'Het art. humero-ulnaris is een typisch scharniergewricht (art. ginglymus) voor flexie en extensie.',
    jointId: 'cubiti',
  },

  // 18. Type gewricht art. radio-ulnaris proximalis
  {
    id: 'type-radioulnaris-prox',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het art. radio-ulnaris proximalis?',
    shortPrompt: 'Gewrichtstype van art. radio-ulnaris proximalis',
    correctAnswer: 'Rolgewricht (art. trochoidea)',
    acceptableAnswers: [
      'Rolgewricht',
      'Art. trochoidea',
      'trochoidea',
      'draaigewricht',
      'Articulatio trochoidea',
    ],
    distractors: [
      'Scharniergewricht (art. ginglymus)',
      'Zadelgewricht (art. sellaris)',
      'Vlak gewricht (art. plana)',
    ],
    explanation: 'Het art. radio-ulnaris proximalis is een rolgewricht (art. trochoidea) waarin het spaakbeen draait ten opzichte van de ellepijp.',
    jointId: 'cubiti',
  },

  // 19. Type gewricht art. radio-ulnaris distalis
  {
    id: 'type-radioulnaris-dist',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het art. radio-ulnaris distalis?',
    shortPrompt: 'Gewrichtstype van art. radio-ulnaris distalis',
    correctAnswer: 'Rolgewricht (art. trochoidea)',
    acceptableAnswers: [
      'Rolgewricht',
      'Art. trochoidea',
      'trochoidea',
      'draaigewricht',
      'Articulatio trochoidea',
    ],
    distractors: [
      'Scharniergewricht (art. ginglymus)',
      'Bolgewricht (art. spheroidea)',
      'Vlak gewricht (art. plana)',
    ],
    explanation: 'Net als het proximale deelgewricht is ook het art. radio-ulnaris distalis een rolgewricht (art. trochoidea).',
    jointId: 'cubiti',
  },

  // 20. Type gewricht SC-gewricht (art. sterno-clavicularis)
  {
    id: 'type-sc',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het art. sterno-clavicularis (SC-gewricht)?',
    shortPrompt: 'Gewrichtstype van het SC-gewricht',
    correctAnswer: 'Zadelgewricht (art. sellaris)',
    acceptableAnswers: [
      'Zadelgewricht',
      'Art. sellaris',
      'sellaris',
      'zadel',
      'Articulatio sellaris',
    ],
    distractors: [
      'Vlak gewricht (art. plana)',
      'Scharniergewricht (art. ginglymus)',
      'Bolgewricht (art. spheroidea)',
    ],
    explanation: 'Het art. sterno-clavicularis is een zadelgewricht (art. sellaris) met 2 vrijheidsgraden.',
    jointId: 'cingulum',
  },

  // 21. Type gewricht AC-gewricht (art. acromio-clavicularis)
  {
    id: 'type-ac',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het type gewricht van het art. acromio-clavicularis (AC-gewricht)?',
    shortPrompt: 'Gewrichtstype van het AC-gewricht',
    correctAnswer: 'Vlak gewricht (art. plana)',
    acceptableAnswers: [
      'Vlak gewricht',
      'Art. plana',
      'plana',
      'vlak',
      'Articulatio plana',
    ],
    distractors: [
      'Bolgewricht (art. spheroidea)',
      'Scharniergewricht (art. ginglymus)',
      'Rolgewricht (art. trochoidea)',
    ],
    explanation: 'Het AC-gewricht heeft vlakke gewrichtsvlakken (art. plana) die geringe glijbewegingen toelaten.',
    jointId: 'cingulum',
  },

  // 22. Type gewricht wervelgewrichten (articulationes intervertebrales)
  {
    id: 'type-intervertebrales',
    category: 'type',
    topic: 'Gewrichtstype',
    question: 'Wat is het gewrichtstype van de wervelgewrichten (articulationes intervertebrales)?',
    shortPrompt: 'Gewrichtstype wervelgewrichten',
    correctAnswer: 'Vlak gewricht (art. plana)',
    acceptableAnswers: [
      'Vlak gewricht',
      'Art. plana',
      'plana',
      'vlak',
      'Articulatio plana',
    ],
    distractors: [
      'Rolgewricht (art. trochoidea)',
      'Scharniergewricht (art. ginglymus)',
      'Zadelgewricht (art. sellaris)',
    ],
    explanation: 'De articulationes intervertebrales zijn vlakke gewrichten (art. plana) die onderling glijden toestaan.',
    jointId: 'romp',
  },

  // 23. Latijnse term Scharniergewricht
  {
    id: 'latin-ginglymus',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een scharniergewricht?',
    shortPrompt: 'Latijnse term voor scharniergewricht',
    correctAnswer: 'Articulatio ginglymus',
    acceptableAnswers: [
      'Articulatio ginglymus',
      'Art. ginglymus',
      'ginglymus',
    ],
    distractors: [
      'Articulatio trochoidea',
      'Articulatio sellaris',
      'Articulatio spheroidea',
    ],
    explanation: 'Een scharniergewricht wordt Latijns aangeduid als articulatio ginglymus.',
  },

  // 24. Latijnse term Rolgewricht
  {
    id: 'latin-trochoidea',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een rolgewricht?',
    shortPrompt: 'Latijnse term voor rolgewricht',
    correctAnswer: 'Articulatio trochoidea',
    acceptableAnswers: [
      'Articulatio trochoidea',
      'Art. trochoidea',
      'trochoidea',
    ],
    distractors: [
      'Articulatio ginglymus',
      'Articulatio plana',
      'Articulatio ellipsoidea',
    ],
    explanation: 'Een rolgewricht wordt aangeduid als articulatio trochoidea.',
  },

  // 25. Latijnse term Zadelgewricht
  {
    id: 'latin-sellaris',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een zadelgewricht?',
    shortPrompt: 'Latijnse term voor zadelgewricht',
    correctAnswer: 'Articulatio sellaris',
    acceptableAnswers: [
      'Articulatio sellaris',
      'Art. sellaris',
      'sellaris',
    ],
    distractors: [
      'Articulatio spheroidea',
      'Articulatio plana',
      'Articulatio ginglymus',
    ],
    explanation: 'Een zadelgewricht heet in de anatomie een articulatio sellaris.',
  },

  // 26. Latijnse term Bolgewricht / kogelgewricht
  {
    id: 'latin-spheroidea',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een bolgewricht (kogelgewricht)?',
    shortPrompt: 'Latijnse term voor bolgewricht',
    correctAnswer: 'Articulatio spheroidea',
    acceptableAnswers: [
      'Articulatio spheroidea',
      'Art. spheroidea',
      'spheroidea',
    ],
    distractors: [
      'Articulatio ellipsoidea',
      'Articulatio ginglymus',
      'Articulatio trochoidea',
    ],
    explanation: 'Een bolgewricht of kogelgewricht heet een articulatio spheroidea.',
  },

  // 27. Latijnse term Vlak gewricht
  {
    id: 'latin-plana',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een vlak gewricht?',
    shortPrompt: 'Latijnse term voor vlak gewricht',
    correctAnswer: 'Articulatio plana',
    acceptableAnswers: [
      'Articulatio plana',
      'Art. plana',
      'plana',
    ],
    distractors: [
      'Articulatio sellaris',
      'Articulatio trochoidea',
      'Articulatio ellipsoidea',
    ],
    explanation: 'Een vlak gewricht wordt aangeduid als articulatio plana.',
  },

  // 28. Latijnse term Ellipsoïd gewricht
  {
    id: 'latin-ellipsoidea',
    category: 'type',
    topic: 'Vormindeling',
    question: 'Welke Latijnse benaming hoort bij een ellipsoïd (eivormig) gewricht?',
    shortPrompt: 'Latijnse term voor ellipsoïd gewricht',
    correctAnswer: 'Articulatio ellipsoidea',
    acceptableAnswers: [
      'Articulatio ellipsoidea',
      'Art. ellipsoidea',
      'ellipsoidea',
    ],
    distractors: [
      'Articulatio spheroidea',
      'Articulatio ginglymus',
      'Articulatio plana',
    ],
    explanation: 'Een ellipsoïd of eivormig gewricht heet een articulatio ellipsoidea.',
  },

  // 29. As voor flexie en extensie
  {
    id: 'axis-flexion-extension',
    category: 'axis',
    topic: 'Bewegingsas',
    question: 'Om welke as vindt flexie en extensie (ante-/retroflexie) plaats in een gewricht?',
    shortPrompt: 'Bewegingsas voor flexie en extensie',
    correctAnswer: 'Transversale as',
    acceptableAnswers: [
      'Transversale as',
      'Transversaal',
      'Transversale',
      'Horizontale as',
    ],
    distractors: [
      'Sagittale as',
      'Longitudinale as',
    ],
    explanation: 'Flexie en extensie bewegen in het sagittale vlak om een transversale (horizontale links-rechts) as.',
  },

  // 30. As voor abductie en adductie
  {
    id: 'axis-abduction-adduction',
    category: 'axis',
    topic: 'Bewegingsas',
    question: 'Om welke as vindt abductie en adductie plaats in een gewricht?',
    shortPrompt: 'Bewegingsas voor abductie en adductie',
    correctAnswer: 'Sagittale as',
    acceptableAnswers: [
      'Sagittale as',
      'Sagittaal',
      'Sagittale',
    ],
    distractors: [
      'Transversale as',
      'Longitudinale as',
    ],
    explanation: 'Abductie en adductie bewegen in het frontale vlak om een sagittale (voor-achterwaartse) as.',
  },

  // 31. As voor rotaties
  {
    id: 'axis-rotation',
    category: 'axis',
    topic: 'Bewegingsas',
    question: 'Om welke as vindt rotatie (endo-/exorotatie, supinatie/pronatie) plaats in een gewricht?',
    shortPrompt: 'Bewegingsas voor rotaties',
    correctAnswer: 'Longitudinale as',
    acceptableAnswers: [
      'Longitudinale as',
      'Longitudinaal',
      'Longitudinale',
      'Verticale as',
    ],
    distractors: [
      'Transversale as',
      'Sagittale as',
    ],
    explanation: 'Rotaties vinden plaats om de lengte-as of longitudinale (verticale) as van het bewegende lichaamsdeel.',
  },

  // 32. As van elleboogscharnier
  {
    id: 'axis-cubiti-hinge',
    category: 'axis',
    topic: 'Bewegingsas (Elleboog)',
    question: 'Om welke as draait het scharniergewricht van de elleboog (art. humero-ulnaris)?',
    shortPrompt: 'As van art. humero-ulnaris',
    correctAnswer: 'Transversale as',
    acceptableAnswers: [
      'Transversale as',
      'Transversaal',
      'Transversale',
      'Horizontale as',
    ],
    distractors: [
      'Longitudinale as',
      'Sagittale as',
    ],
    explanation: 'Het buigen en strekken (flexie/extensie) in het art. humero-ulnaris gebeurt om een transversale as.',
    jointId: 'cubiti',
  },

  // 33. As van radio-ulnair gewricht
  {
    id: 'axis-radioulnaris',
    category: 'axis',
    topic: 'Bewegingsas (Onderarm)',
    question: 'Om welke as draait het proximale en distale radio-ulnaire gewricht bij pronatie en supinatie?',
    shortPrompt: 'As van art. radio-ulnaris',
    correctAnswer: 'Longitudinale as',
    acceptableAnswers: [
      'Longitudinale as',
      'Longitudinaal',
      'Longitudinale',
      'Verticale as',
    ],
    distractors: [
      'Transversale as',
      'Sagittale as',
    ],
    explanation: 'Pronatie en supinatie zijn rotaties van het spaakbeen om de longitudinale as van de onderarm.',
    jointId: 'cubiti',
  },

  // 34. Vrijheidsgraden kogelgewricht
  {
    id: 'degrees-spheroidea',
    category: 'degrees',
    topic: 'Vrijheidsgraden',
    question: 'Hoeveel vrijheidsgraden (assen) heeft een kogelgewricht (zoals art. humeri of art. coxae)?',
    shortPrompt: 'Vrijheidsgraden van kogelgewricht',
    correctAnswer: '3 vrijheidsgraden (multi-axiaal)',
    acceptableAnswers: [
      '3',
      '3 vrijheidsgraden',
      'drie',
      'drie vrijheidsgraden',
      'multi-axiaal',
      'multiaxiaal',
    ],
    distractors: [
      '1 vrijheidsgraad (uni-axiaal)',
      '2 vrijheidsgraden (bi-axiaal)',
    ],
    explanation: 'Een kogelgewricht kan bewegen om drie loodrecht op elkaar staande assen (transversaal, sagittaal en longitudinaal).',
  },

  // 35. Vrijheidsgraden scharniergewricht
  {
    id: 'degrees-ginglymus',
    category: 'degrees',
    topic: 'Vrijheidsgraden',
    question: 'Hoeveel vrijheidsgraden (assen) heeft een zuiver scharniergewricht (art. ginglymus)?',
    shortPrompt: 'Vrijheidsgraden van scharniergewricht',
    correctAnswer: '1 vrijheidsgraad (uni-axiaal)',
    acceptableAnswers: [
      '1',
      '1 vrijheidsgraad',
      'een',
      'één',
      'één vrijheidsgraad',
      'uni-axiaal',
      'uniaxiaal',
    ],
    distractors: [
      '2 vrijheidsgraden (bi-axiaal)',
      '3 vrijheidsgraden (multi-axiaal)',
    ],
    explanation: 'Een scharniergewricht laat uitsluitend beweging toe om één transversale as (1 vrijheidsgraad).',
  },

  // 36. Vrijheidsgraden zadelgewricht
  {
    id: 'degrees-sellaris',
    category: 'degrees',
    topic: 'Vrijheidsgraden',
    question: 'Hoeveel vrijheidsgraden (assen) heeft een zadelgewricht (art. sellaris, zoals het SC-gewricht)?',
    shortPrompt: 'Vrijheidsgraden van zadelgewricht',
    correctAnswer: '2 vrijheidsgraden (bi-axiaal)',
    acceptableAnswers: [
      '2',
      '2 vrijheidsgraden',
      'twee',
      'twee vrijheidsgraden',
      'bi-axiaal',
      'biaxiaal',
    ],
    distractors: [
      '1 vrijheidsgraad (uni-axiaal)',
      '3 vrijheidsgraden (multi-axiaal)',
    ],
    explanation: 'Een zadelgewricht heeft twee loodrecht op elkaar staande assen (2 vrijheidsgraden).',
  },

  // 37. Vrijheidsgraden rolgewricht
  {
    id: 'degrees-trochoidea',
    category: 'degrees',
    topic: 'Vrijheidsgraden',
    question: 'Hoeveel vrijheidsgraden (assen) heeft een rolgewricht (art. trochoidea, zoals het art. radio-ulnaris)?',
    shortPrompt: 'Vrijheidsgraden van rolgewricht',
    correctAnswer: '1 vrijheidsgraad (uni-axiaal)',
    acceptableAnswers: [
      '1',
      '1 vrijheidsgraad',
      'een',
      'één',
      'één vrijheidsgraad',
      'uni-axiaal',
      'uniaxiaal',
    ],
    distractors: [
      '2 vrijheidsgraden (bi-axiaal)',
      '3 vrijheidsgraden (multi-axiaal)',
    ],
    explanation: 'Een rolgewricht roteert om één longitudinale as (1 vrijheidsgraad).',
  },

  // 38. Bewegingen in BSG
  {
    id: 'movements-bsg',
    category: 'movement',
    topic: 'Gewrichtsbeweging (Enkel)',
    question: 'Welke bewegingen vinden plaats in het bovenste spronggewricht (art. talocruralis)?',
    shortPrompt: 'Bewegingen in art. talocruralis (BSG)',
    correctAnswer: 'Dorsaalflexie en plantairflexie',
    acceptableAnswers: [
      'Dorsaalflexie en plantairflexie',
      'Dorsaalflexie, plantairflexie',
      'Plantairflexie en dorsaalflexie',
      'dorsaalflexie plantairflexie',
    ],
    distractors: [
      'Inversie en eversie',
      'Pronatie en supinatie',
      'Anteflexie en retroflexie',
    ],
    explanation: 'Het BSG is een eenassig scharniergewricht voor dorsaalflexie (tenen omhoog) en plantairflexie (tenen omlaag).',
    jointId: 'pedis',
  },

  // 39. Bewegingen in OSG
  {
    id: 'movements-osg',
    category: 'movement',
    topic: 'Gewrichtsbeweging (Voet/Enkel)',
    question: 'Welke bewegingen vinden primair plaats in het onderste spronggewricht (art. subtalaris en art. talo-calcaneo-navicularis)?',
    shortPrompt: 'Bewegingen in het OSG',
    correctAnswer: 'Inversie en eversie',
    acceptableAnswers: [
      'Inversie en eversie',
      'Inversie, eversie',
      'Pronatie en supinatie',
      'Eversie en inversie',
      'inversie eversie',
    ],
    distractors: [
      'Dorsaalflexie en plantairflexie',
      'Flexie en extensie',
      'Anteflexie en retroflexie',
    ],
    explanation: 'Inversie (voetzool naar binnen kantelen) en eversie (voetzool naar buiten kantelen) vinden plaats in het OSG.',
    jointId: 'pedis',
  },

  // 40. Bewegingen in radio-ulnaris proximalis en distalis
  {
    id: 'movements-radioulnaris',
    category: 'movement',
    topic: 'Gewrichtsbeweging (Onderarm)',
    question: 'Welke bewegingen verzorgen de radio-ulnaire gewrichten (art. radio-ulnaris proximalis en distalis) in de onderarm?',
    shortPrompt: 'Bewegingen in art. radio-ulnaris',
    correctAnswer: 'Pronatie en supinatie',
    acceptableAnswers: [
      'Pronatie en supinatie',
      'Pronatie, supinatie',
      'Supinatie en pronatie',
      'pronatie supinatie',
    ],
    distractors: [
      'Flexie en extensie',
      'Abductie en adductie',
      'Anteflexie en retroflexie',
    ],
    explanation: 'De proximale en distale radio-ulnaire gewrichten laten het spaakbeen rond de ellepijp draaien (pronatie en supinatie van de onderarm).',
    jointId: 'cubiti',
  },
];

/**
 * Haal een willekeurige gewrichtsvraag op
 */
export function getRandomJointQuestion(): JointQuizItem {
  const index = Math.floor(Math.random() * JOINT_QUIZ_ITEMS.length);
  return JOINT_QUIZ_ITEMS[index];
}

/**
 * Genereer geschudde meerkeuze-opties voor een gewrichtsvraag
 */
export function getJointMCOptions(item: JointQuizItem): string[] {
  const options = [item.correctAnswer, ...item.distractors];
  return options.sort(() => 0.5 - Math.random());
}
