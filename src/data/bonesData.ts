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
  typesSubtitle?: string;
  description: string;
  primaryView: 'ventral' | 'dorsal' | 'both';
  markers: BoneMarker[];
}

export const READER_BONES: Bone[] = [
  {
    id: 'os_coxae',
    latinName: 'Os coxae',
    dutchName: 'Heupbeen',
    typesSubtitle: 'Bestaat uit: Os ilium (darmbeen), Os ischii (zitbeen) & Os pubis (schaambeen)',
    description: 'Vormt samen met het os sacrum het bekken (pelvis). Bevat het acetabulum (heupkom) waarin de kop van het os femur scharniert.',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.380, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'right', view: 'ventral', x: 0.620, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'left', view: 'dorsal', x: 0.385, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'right', view: 'dorsal', x: 0.615, y: 0.425, subpart: 'Os ilium (darmbeen)' },
      { side: 'left', view: 'ventral', x: 0.480, y: 0.476, subpart: 'Os pubis (schaambeen)' },
      { side: 'right', view: 'ventral', x: 0.520, y: 0.476, subpart: 'Os pubis (schaambeen)' },
      { side: 'left', view: 'dorsal', x: 0.440, y: 0.510, subpart: 'Os ischii (zitbeen)' },
      { side: 'right', view: 'dorsal', x: 0.560, y: 0.510, subpart: 'Os ischii (zitbeen)' },
      { side: 'left', view: 'ventral', x: 0.440, y: 0.510, subpart: 'Os ischii (zitbeen)' },
      { side: 'right', view: 'ventral', x: 0.560, y: 0.510, subpart: 'Os ischii (zitbeen)' }
    ]
  },
  {
    id: 'os_femur',
    latinName: 'Os femur',
    dutchName: 'Dijbeen',
    description: 'Het langste en sterkste pijpbeen van het lichaam. Scharniert proximaal in het heupgewricht (art. coxae) en distaal in het kniegewricht (art. genus).',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.380, y: 0.600 },
      { side: 'right', view: 'ventral', x: 0.620, y: 0.600 },
      { side: 'left', view: 'dorsal', x: 0.380, y: 0.600 },
      { side: 'right', view: 'dorsal', x: 0.620, y: 0.600 }
    ]
  },
  {
    id: 'os_patella',
    latinName: 'Os patella',
    dutchName: 'Knieschijf',
    description: 'Grootste sesambeen van het menselijk lichaam, ingebed in de pees van de m. quadriceps femoris ter bescherming en hefboomwerking van het kniegewricht.',
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.418, y: 0.720 },
      { side: 'right', view: 'ventral', x: 0.582, y: 0.720 }
    ]
  },
  {
    id: 'os_tibia',
    latinName: 'Os tibia',
    dutchName: 'Scheenbeen',
    description: 'Het zwaarste dragende bot aan de mediale zijde van het onderbeen. Vormt distaal de binnenenkel (malleolus medialis).',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.428, y: 0.835 },
      { side: 'right', view: 'ventral', x: 0.572, y: 0.835 },
      { side: 'left', view: 'dorsal', x: 0.428, y: 0.835 },
      { side: 'right', view: 'dorsal', x: 0.572, y: 0.835 }
    ]
  },
  {
    id: 'os_fibula',
    latinName: 'Os fibula',
    dutchName: 'Kuitbeen',
    description: 'Slank bot aan de laterale zijde van het onderbeen. Vormt distaal de buitenenkel (malleolus lateralis) van de enkelvork.',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.368, y: 0.835 },
      { side: 'right', view: 'ventral', x: 0.632, y: 0.835 },
      { side: 'left', view: 'dorsal', x: 0.368, y: 0.835 },
      { side: 'right', view: 'dorsal', x: 0.632, y: 0.835 }
    ]
  },
  {
    id: 'os_talus',
    latinName: 'Os talus',
    dutchName: 'Sprongbeen',
    description: 'Bovenste voetwortelbeen dat direct in de enkelvork (art. talocruralis) articuleert en het lichaamsgewicht verdeelt over de voet.',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.442, y: 0.928 },
      { side: 'right', view: 'ventral', x: 0.558, y: 0.928 },
      { side: 'left', view: 'dorsal', x: 0.442, y: 0.928 },
      { side: 'right', view: 'dorsal', x: 0.558, y: 0.928 }
    ]
  },
  {
    id: 'os_calcaneus',
    latinName: 'Os calcaneus',
    dutchName: 'Hielbeen',
    description: 'Grootste voetwortelbeen, vormt het hielbeenuitsteeksel (tuber calcanei) waar de achillespees (tendo calcaneus) op aanhecht.',
    primaryView: 'dorsal',
    markers: [
      { side: 'left', view: 'dorsal', x: 0.435, y: 0.952 },
      { side: 'right', view: 'dorsal', x: 0.565, y: 0.952 },
      { side: 'left', view: 'ventral', x: 0.435, y: 0.952 },
      { side: 'right', view: 'ventral', x: 0.565, y: 0.952 }
    ]
  },
  {
    id: 'os_naviculare',
    latinName: 'Os naviculare',
    dutchName: 'Scheepvormig been',
    description: 'Bootvormig voetwortelbeen aan de mediale zijde van de voet, gelegen distaal van de talus en proximaal van de ossa cuneiformia.',
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.450, y: 0.945 },
      { side: 'right', view: 'ventral', x: 0.550, y: 0.945 }
    ]
  },
  {
    id: 'os_humerus',
    latinName: 'Os humerus',
    dutchName: 'Opperarmbeen',
    description: 'Groot pijpbeen van de bovenarm. Scharniert proximaal in het schoudergewricht (art. humeri) en distaal in het ellebooggewricht (art. cubiti).',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.245, y: 0.285 },
      { side: 'right', view: 'ventral', x: 0.755, y: 0.285 },
      { side: 'left', view: 'dorsal', x: 0.245, y: 0.285 },
      { side: 'right', view: 'dorsal', x: 0.755, y: 0.285 }
    ]
  },
  {
    id: 'os_scapula',
    latinName: 'Os scapula',
    dutchName: 'Schouderblad',
    description: 'Plat driehoekig bot aan de dorsale zijde van de borstkas. Vormt de schouderkom (cavitas glenoidalis) en bezit het acromion en spina scapulae.',
    primaryView: 'dorsal',
    markers: [
      { side: 'left', view: 'dorsal', x: 0.355, y: 0.240 },
      { side: 'right', view: 'dorsal', x: 0.645, y: 0.240 },
      { side: 'left', view: 'ventral', x: 0.355, y: 0.240 },
      { side: 'right', view: 'ventral', x: 0.645, y: 0.240 }
    ]
  },
  {
    id: 'os_clavicula',
    latinName: 'Os clavicula',
    dutchName: 'Sleutelbeen',
    description: 'S-vormig bot dat de schoudergordel verbindt met het borstbeen (art. sternoclavicularis) en schouderblad (art. acromioclavicularis).',
    primaryView: 'ventral',
    markers: [
      { side: 'left', view: 'ventral', x: 0.370, y: 0.196 },
      { side: 'right', view: 'ventral', x: 0.630, y: 0.196 }
    ]
  },
  {
    id: 'os_ulna',
    latinName: 'Os ulna',
    dutchName: 'Ellepijp',
    description: 'Bot aan de mediale (pink)zijde van de onderarm. Vormt met het olecranon de harde punt van de elleboog.',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.250, y: 0.415 },
      { side: 'right', view: 'ventral', x: 0.750, y: 0.415 },
      { side: 'left', view: 'dorsal', x: 0.250, y: 0.415 },
      { side: 'right', view: 'dorsal', x: 0.750, y: 0.415 }
    ]
  },
  {
    id: 'os_radius',
    latinName: 'Os radius',
    dutchName: 'Spaakbeen',
    description: 'Bot aan de laterale (duim)zijde van de onderarm. Roteert om de ulna bij supinatie en pronatie.',
    primaryView: 'both',
    markers: [
      { side: 'left', view: 'ventral', x: 0.200, y: 0.415 },
      { side: 'right', view: 'ventral', x: 0.800, y: 0.415 },
      { side: 'left', view: 'dorsal', x: 0.200, y: 0.415 },
      { side: 'right', view: 'dorsal', x: 0.800, y: 0.415 }
    ]
  },
  {
    id: 'os_sternum',
    latinName: 'Os sternum',
    dutchName: 'Borstbeen',
    description: 'Plat bot midden op de borstkas bestaande uit manubrium, corpus en processus xiphoideus.',
    primaryView: 'ventral',
    markers: [
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.250 }
    ]
  },
  {
    id: 'os_sacrum',
    latinName: 'Os sacrum',
    dutchName: 'Heiligbeen',
    description: 'Driehoekig bot van vijf vergroeide sacrale wervels tussen de heupbeenderen, vormt de achterwand van het bekken.',
    primaryView: 'dorsal',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.440 },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.440 }
    ]
  },
  {
    id: 'os_coccygis',
    latinName: 'Os coccygis',
    dutchName: 'Staartbeen',
    description: 'Klein driehoekig botje aan het uiteinde van de wervelkolom, gevormd door vergroeiing van 3-5 rudimentaire staartwervels.',
    primaryView: 'dorsal',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.478 }
    ]
  },
  {
    id: 'os_costa',
    latinName: 'Os costa / Costae',
    dutchName: 'Ribben',
    typesSubtitle: 'Bestaat uit 3 types: Costae verae (ware ribben 1-7), Costae spuriae (valse ribben 8-10) en Costae fluctuantes (zwevende ribben 11-12)',
    description: '12 paar gebogen beenderen die samen de borstkas (thorax) vormen ter bescherming van hart en longen.',
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
      { side: 'right', view: 'ventral', x: 0.565, y: 0.355, subpart: 'Costae fluctuantes (zwevende ribben 11-12)' }
    ]
  },
  {
    id: 'os_vertebra',
    latinName: 'Os vertebra / Vertebrae',
    dutchName: 'Wervels',
    typesSubtitle: 'Bestaat uit 3 types: Vertebrae cervicales (C1-C7), Vertebrae thoracicae (Th1-Th12) en Vertebrae lumbales (L1-L5)',
    description: 'De wervels van de wervelkolom (columna vertebralis) dragen het gewicht van het lichaam en omsluiten het ruggenmerg.',
    primaryView: 'both',
    markers: [
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.138, subpart: 'Vertebrae cervicales (halswervels C1-C7)' },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.138, subpart: 'Vertebrae cervicales (halswervels C1-C7)' },
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.255, subpart: 'Vertebrae thoracicae (borstwervels Th1-Th12)' },
      { side: 'midline', view: 'dorsal', x: 0.500, y: 0.368, subpart: 'Vertebrae lumbales (lendenwervels L1-L5)' },
      { side: 'midline', view: 'ventral', x: 0.500, y: 0.368, subpart: 'Vertebrae lumbales (lendenwervels L1-L5)' }
    ]
  }
];

export const BONES_DATA = READER_BONES;

export function getBoneById(id: string): Bone | undefined {
  return READER_BONES.find(b => b.id === id);
}
