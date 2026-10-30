export interface BoneMarker {
  side: 'left' | 'right' | 'midline';
  view: 'ventral' | 'dorsal' | 'both';
  x: number;
  y: number;
  subpart?: string;
}

export interface Bone {
  id: string;
  latinName: string;
  dutchName: string;
  category: 'onderste_extremiteit' | 'bovenste_extremiteit' | 'romp';
  typesSubtitle?: string;
  description: string;
  structures?: string[];
  primaryView: 'ventral' | 'dorsal' | 'both';
  markers: BoneMarker[];
}

export const READER_BONES: Bone[] = [
  {
    id: 'os_coxae',
    latinName: 'Os coxae',
    dutchName: 'Heupbeen',
    category: 'romp',
    typesSubtitle: 'Bestaat uit: Os ilium (darmbeen), Os ischium (zitbeen) & Os pubis (schaambeen)',
    description: 'Vormt samen met het os sacrum het bekken (pelvis). Bevat het acetabulum (heupkom) waarin de kop van het os femur scharniert.',
    structures: [
      'Acetabulum (heupkom)',
      'Os pubis (schaambeen)',
      'Os ilium (darmbeen) met: SIAS, SIAI, SIPS, SIPI & crista iliaca',
      'Os ischium (zitbeen) met: tuber ischiadicum',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.380, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'right', view: 'ventral', x: 0.620, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'left', view: 'dorsal', x: 0.385, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'right', view: 'dorsal', x: 0.615, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'left', view: 'ventral', x: 0.480, y: 0.476, subpart: 'Os pubis (schaambeen)' },
      { side: 'right', view: 'ventral', x: 0.520, y: 0.476, subpart: 'Os pubis (schaambeen)' },
      { side: 'left', view: 'dorsal', x: 0.440, y: 0.510, subpart: 'Os ischium (zitbeen)' },
      { side: 'right', view: 'dorsal', x: 0.560, y: 0.510, subpart: 'Os ischium (zitbeen)' },
      { side: 'left', view: 'ventral', x: 0.440, y: 0.510, subpart: 'Os ischium (zitbeen)' },
      { side: 'right', view: 'ventral', x: 0.560, y: 0.510, subpart: 'Os ischium (zitbeen)' },
    ],
  },
  {
    id: 'os_femur',
    latinName: 'Os femur',
    dutchName: 'Dijbeen',
    category: 'onderste_extremiteit',
    description: 'Het langste en sterkste pijpbeen van het lichaam. Scharniert proximaal in het heupgewricht (art. coxae) en distaal in het kniegewricht (art. genus).',
    structures: [
      'Caput femoris (dijbeenkop)',
      'Collum femoris (dijbeenhals)',
      'Corpus femoris (dijbeenschacht)',
      'Trochanter major (grote draaier)',
      'Trochanter minor (kleine draaier)',
      'Condylus medialis (binneste gewrichtsknobbel)',
      'Condylus lateralis (buitenste gewrichtsknobbel)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.380, y: 0.600 },
      { side: 'right', view: 'ventral', x: 0.620, y: 0.600 },
      { side: 'left', view: 'dorsal', x: 0.380, y: 0.600 },
      { side: 'right', view: 'dorsal', x: 0.620, y: 0.600 },
    ],
  },
  {
    id: 'os_patella',
    latinName: 'Os patella',
    dutchName: 'Knieschijf',
    category: 'onderste_extremiteit',
    description: 'Grootste sesambeen van het menselijk lichaam, ingebed in de pees van de m. quadriceps femoris ter bescherming en hefboomwerking van het kniegewricht (art. genus).',
    structures: [],
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.418, y: 0.720 },
      { side: 'right', view: 'ventral', x: 0.582, y: 0.720 },
    ],
  },
  {
    id: 'os_tibia',
    latinName: 'Os tibia',
    dutchName: 'Scheenbeen',
    category: 'onderste_extremiteit',
    description: 'Het dragende bot aan de mediale zijde van het onderbeen. Vormt distaal de binnenenkel (malleolus medialis).',
    structures: [
      'Corpus tibiae (scheenbeenschacht)',
      'Condylus medialis (mediale scheenbeenplateau)',
      'Condylus lateralis (laterale scheenbeenplateau)',
      'Tuberositas tibiae (ruwheid voor kniepees)',
      'Malleolus medialis (binnenenkel)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.428, y: 0.835 },
      { side: 'right', view: 'ventral', x: 0.572, y: 0.835 },
      { side: 'left', view: 'dorsal', x: 0.428, y: 0.835 },
      { side: 'right', view: 'dorsal', x: 0.572, y: 0.835 },
    ],
  },
  {
    id: 'os_fibula',
    latinName: 'Os fibula',
    dutchName: 'Kuitbeen',
    category: 'onderste_extremiteit',
    description: 'Slank bot aan de laterale zijde van het onderbeen. Vormt distaal de buitenenkel (malleolus lateralis) van het bovenste spronggewricht (art. talocruralis).',
    structures: [
      'Caput fibulae (kuitbeenkopje)',
      'Corpus fibulae (kuitbeenschacht)',
      'Malleolus lateralis (buitenenkel)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.368, y: 0.835 },
      { side: 'right', view: 'ventral', x: 0.632, y: 0.835 },
      { side: 'left', view: 'dorsal', x: 0.368, y: 0.835 },
      { side: 'right', view: 'dorsal', x: 0.632, y: 0.835 },
    ],
  },
  {
    id: 'os_talus',
    latinName: 'Os talus',
    dutchName: 'Sprongbeen',
    category: 'onderste_extremiteit',
    description: 'Bovenste voetwortelbeen dat articuleert in de enkelvork (art. talocruralis) en het onderste spronggewricht (art. subtalaris en art. talo-calcaneo-navicularis).',
    structures: [],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.442, y: 0.928 },
      { side: 'right', view: 'ventral', x: 0.558, y: 0.928 },
      { side: 'left', view: 'dorsal', x: 0.442, y: 0.928 },
      { side: 'right', view: 'dorsal', x: 0.558, y: 0.928 },
    ],
  },
  {
    id: 'os_calcaneus',
    latinName: 'Os calcaneus',
    dutchName: 'Hielbeen',
    category: 'onderste_extremiteit',
    description: 'Grootste voetwortelbeen van de achtervoet, bezit het tuber calcanei waar de tendo calcaneus (achillespees) op aanhecht.',
    structures: [
      'Tuber calcanei (hielbeenknobbel)',
    ],
    primaryView: 'dorsal',
    markers: [
      { side: 'left', view: 'dorsal', x: 0.435, y: 0.952 },
      { side: 'right', view: 'dorsal', x: 0.565, y: 0.952 },
      { side: 'left', view: 'ventral', x: 0.435, y: 0.952 },
      { side: 'right', view: 'ventral', x: 0.565, y: 0.952 },
    ],
  },
  {
    id: 'os_naviculare',
    latinName: 'Os naviculare',
    dutchName: 'Scheepvormig been',
    category: 'onderste_extremiteit',
    description: 'Bootvormig voetwortelbeen aan de mediale zijde van de voet, articuleert proximaal met de talus in het voorste deel van het onderste spronggewricht (art. talo-calcaneo-navicularis).',
    structures: [],
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.450, y: 0.945 },
      { side: 'right', view: 'ventral', x: 0.550, y: 0.945 },
    ],
  },
  {
    id: 'os_humerus',
    latinName: 'Os humerus',
    dutchName: 'Opperarmbeen',
    category: 'bovenste_extremiteit',
    description: 'Groot pijpbeen van de bovenarm. Scharniert proximaal in het schoudergewricht (art. humeri) en distaal in het ellebooggewricht (art. cubiti).',
    structures: [
      'Caput humeri (opperarmbeenkop)',
      'Corpus humeri (opperarmbeenschacht)',
      'Tuberculum majus (grote knobbel)',
      'Tuberculum minus (kleine knobbel)',
      'Epicondylus medialis (binneste elleboogknobbel)',
      'Epicondylus lateralis (buitenste elleboogknobbel)',
      'Trochlea humeri (katrol voor ellepijp)',
      'Capitulum humeri (kopje voor spaakbeen)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.245, y: 0.285 },
      { side: 'right', view: 'ventral', x: 0.755, y: 0.285 },
      { side: 'left', view: 'dorsal', x: 0.245, y: 0.285 },
      { side: 'right', view: 'dorsal', x: 0.755, y: 0.285 },
    ],
  },
  {
    id: 'os_scapula',
    latinName: 'Os scapula',
    dutchName: 'Schouderblad',
    category: 'bovenste_extremiteit',
    description: 'Plat driehoekig bot aan de dorsale zijde van de thorax. Vormt de gewrichtskom (cavitas glenoidalis) voor het art. humeri en bezit het acromion en de spina scapulae.',
    structures: [
      'Acromion (schouderdak)',
      'Processus coracoïdeus (ravenbekuitsteeksel)',
      'Spina scapulae (schouderbladkam)',
      'Margo medialis (mediale rand)',
      'Margo lateralis (laterale rand)',
      'Angulus inferior (onderste punt)',
      'Angulus superior (bovenste punt)',
      'Cavitas glenoidalis (schouderkom)',
    ],
    primaryView: 'dorsal',
    markers: [
      { side: 'left', view: 'dorsal', x: 0.355, y: 0.240 },
      { side: 'right', view: 'dorsal', x: 0.645, y: 0.240 },
      { side: 'left', view: 'ventral', x: 0.355, y: 0.240 },
      { side: 'right', view: 'ventral', x: 0.645, y: 0.240 },
    ],
  },
  {
    id: 'os_clavicula',
    latinName: 'Os clavicula',
    dutchName: 'Sleutelbeen',
    category: 'bovenste_extremiteit',
    description: 'S-vormig bot dat deel uitmaakt van de schoudergordel (cingulum pectorale) en het borstbeen met de schouder verbindt.',
    structures: [
      'Extremitas clavicularis (acromiaal uiteinde)',
      'Corpus claviculae (sleutelbeenschacht)',
      'Extremitas sternalis (borstbeenuiteinde)',
    ],
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.370, y: 0.196 },
      { side: 'right', view: 'ventral', x: 0.630, y: 0.196 },
    ],
  },
  {
    id: 'os_ulna',
    latinName: 'Os ulna',
    dutchName: 'Ellepijp',
    category: 'bovenste_extremiteit',
    description: 'Bot aan de mediale (pink)zijde van de onderarm. Vormt met het olecranon de harde punt van de elleboog in het art. cubiti.',
    structures: [
      'Olecranon (elleboogpunt)',
      'Corpus ulnae (ellepijpschacht)',
      'Tuberositas ulnae (ruwheid voor m. brachialis)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.250, y: 0.415 },
      { side: 'right', view: 'ventral', x: 0.750, y: 0.415 },
      { side: 'left', view: 'dorsal', x: 0.250, y: 0.415 },
      { side: 'right', view: 'dorsal', x: 0.750, y: 0.415 },
    ],
  },
  {
    id: 'os_radius',
    latinName: 'Os radius',
    dutchName: 'Spaakbeen',
    category: 'bovenste_extremiteit',
    description: 'Bot aan de laterale (duim)zijde van de onderarm. Roteert om de ulna bij supinatie en pronatie.',
    structures: [
      'Caput radii (spaakbeenkopje)',
      'Corpus radii (spaakbeenschacht)',
      'Tuberositas radii (ruwheid voor m. biceps brachii)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.200, y: 0.415 },
      { side: 'right', view: 'ventral', x: 0.800, y: 0.415 },
      { side: 'left', view: 'dorsal', x: 0.200, y: 0.415 },
      { side: 'right', view: 'dorsal', x: 0.800, y: 0.415 },
    ],
  },
  {
    id: 'os_sternum',
    latinName: 'Os sternum',
    dutchName: 'Borstbeen',
    category: 'romp',
    description: 'Plat bot midden op de borstkas bestaande uit manubrium sterni, corpus sterni en het processus xiphoideus.',
    structures: [
      'Manubrium sterni (bovendeel)',
      'Corpus sterni (borstbeenlichaam)',
      'Processus xiphoideus (zwaardvormig aanhangsel)',
    ],
    primaryView: 'ventral',
    markers: [
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.250 },
    ],
  },
  {
    id: 'os_sacrum',
    latinName: 'Os sacrum',
    dutchName: 'Heiligbeen',
    category: 'romp',
    description: 'Driehoekig bot van vijf vergroeide sacrale wervels tussen de heupbeenderen, vormt de achterwand van het bekken.',
    structures: [],
    primaryView: 'dorsal',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.440 },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.440 },
    ],
  },
  {
    id: 'os_coccygis',
    latinName: 'Os coccygis',
    dutchName: 'Staartbeen',
    category: 'romp',
    description: 'Klein driehoekig botje aan het uiteinde van de wervelkolom, gevormd door vergroeiing van rudimentaire staartwervels.',
    structures: [],
    primaryView: 'dorsal',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.478 },
    ],
  },
  {
    id: 'os_costa',
    latinName: 'Costae (12x)',
    dutchName: 'Ribben',
    category: 'romp',
    typesSubtitle: 'Bestaat uit: Costae verae (7x), Costae spuriae (3x) en Costae fluctuantes (2x)',
    description: '12 paar gebogen beenderen die samen de borstkas (thorax) vormen ter bescherming van hart en longen.',
    structures: [
      'Costae verae (ware ribben 1-7, 7x)',
      'Costae spuriae (valse ribben 8-10, 3x)',
      'Costae fluctuantes (zwevende ribben 11-12, 2x)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.420, y: 0.245, subpart: 'Costae verae (ware ribben 1-7)' },
      { side: 'right', view: 'ventral', x: 0.580, y: 0.245, subpart: 'Costae verae (ware ribben 1-7)' },
      { side: 'left', view: 'dorsal', x: 0.420, y: 0.245, subpart: 'Costae verae (ware ribben 1-7)' },
      { side: 'right', view: 'dorsal', x: 0.580, y: 0.245, subpart: 'Costae verae (ware ribben 1-7)' },
      { side: 'left', view: 'ventral', x: 0.405, y: 0.315, subpart: 'Costae spuriae (valse ribben 8-10)' },
      { side: 'right', view: 'ventral', x: 0.595, y: 0.315, subpart: 'Costae spuriae (valse ribben 8-10)' },
      { side: 'left', view: 'dorsal', x: 0.405, y: 0.315, subpart: 'Costae spuriae (valse ribben 8-10)' },
      { side: 'right', view: 'dorsal', x: 0.595, y: 0.315, subpart: 'Costae spuriae (valse ribben 8-10)' },
      { side: 'left', view: 'dorsal', x: 0.435, y: 0.355, subpart: 'Costae fluctuantes (zwevende ribben 11-12)' },
      { side: 'right', view: 'dorsal', x: 0.565, y: 0.355, subpart: 'Costae fluctuantes (zwevende ribben 11-12)' },
      { side: 'left', view: 'ventral', x: 0.435, y: 0.355, subpart: 'Costae fluctuantes (zwevende ribben 11-12)' },
      { side: 'right', view: 'ventral', x: 0.565, y: 0.355, subpart: 'Costae fluctuantes (zwevende ribben 11-12)' },
    ],
  },
  {
    id: 'os_vertebra',
    latinName: 'Os vertebrae / Vertebrae',
    dutchName: 'Wervels',
    category: 'romp',
    typesSubtitle: 'Bestaat uit: Vertebrae cervicales, Vertebrae thoracicae en Vertebrae lumbales',
    description: 'De wervels van de wervelkolom (columna vertebralis) dragen het gewicht van het lichaam en omsluiten het ruggenmerg.',
    structures: [
      'Vertebrae cervicales (halswervels C1-C7)',
      'Vertebrae thoracicae (borstwervels Th1-Th12)',
      'Vertebrae lumbales (lendenwervels L1-L5)',
      'Corpus vertebrae (wervellichaam)',
      'Processus spinosus (doornuitsteeksel)',
      'Processus transversus (dwarsuitsteeksel)',
      'Processus articularis (gewrichtsuitsteeksel)',
      'Discus intervertebralis (tussenwervelschijf)',
    ],
    primaryView: 'both',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.138, subpart: 'Vertebrae cervicales (halswervels C1-C7)' },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.138, subpart: 'Vertebrae cervicales (halswervels C1-C7)' },
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.255, subpart: 'Vertebrae thoracicae (borstwervels Th1-Th12)' },
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.368, subpart: 'Vertebrae lumbales (lendenwervels L1-L5)' },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.368, subpart: 'Vertebrae lumbales (lendenwervels L1-L5)' },
    ],
  },
];

export const BONES_DATA = READER_BONES;

export function getBoneById(id: string): Bone | undefined {
  return READER_BONES.find((b) => b.id === id);
}
