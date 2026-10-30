export interface BoneMuscleAttachment {
  muscleId: string;
  muscleName: string;
  part?: string;
  location: string;
}

export interface BoneAttachmentsData {
  origins: BoneMuscleAttachment[];
  insertions: BoneMuscleAttachment[];
  note?: string;
}

export const BONE_ATTACHMENTS: Record<string, BoneAttachmentsData> = {
  os_coxae: {
    origins: [
      {
        muscleId: 'latissimus_dorsi',
        muscleName: 'm. latissimus dorsi',
        location: 'dorsale zijde crista iliaca',
      },
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'crista iliaca, SIPS',
      },
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. rectus femoris',
        location: 'SIAI',
      },
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        part: 'Caput longum',
        location: 'tuber ischiadicum',
      },
      {
        muscleId: 'semitendinosus',
        muscleName: 'm. semitendinosus',
        location: 'tuber ischiadicum',
      },
      {
        muscleId: 'semimembranosus',
        muscleName: 'm. semimembranosus',
        location: 'tuber ischiadicum',
      },
      {
        muscleId: 'adductores',
        muscleName: 'mm. adductor',
        location: 'os pubis, os ischii',
      },
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        part: 'm. iliacus',
        location: 'ventrale vlak os ilium',
      },
      {
        muscleId: 'obliquus_internus_abdominis',
        muscleName: 'm. obliquus internus abdominis',
        location: 'crista iliaca, SIAS',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: 'os pubis',
      },
      {
        muscleId: 'obliquus_externus_abdominis',
        muscleName: 'm. obliquus externus abdominis',
        location: 'crista iliaca',
      },
    ],
  },

  os_femur: {
    origins: [
      {
        muscleId: 'vastus_lateralis',
        muscleName: 'm. vastus lateralis',
        location: 'laterale zijde corpus femoris',
      },
      {
        muscleId: 'vastus_medialis',
        muscleName: 'm. vastus medialis',
        location: 'mediale zijde corpus femoris',
      },
      {
        muscleId: 'vastus_intermedius',
        muscleName: 'm. vastus intermedius',
        location: 'ventrale zijde corpus femoris',
      },
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        part: 'Caput breve',
        location: 'middelste derde dorsale deel van femur',
      },
      {
        muscleId: 'gastrocnemius',
        muscleName: 'm. gastrocnemius',
        location: 'condylus medialis/lateralis femoris',
      },
    ],
    insertions: [
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        location: 'trochanter minor',
      },
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'proximale laterale deel van corpus femoris',
      },
      {
        muscleId: 'adductores',
        muscleName: 'mm. adductor',
        location: 'mediale zijde corpus femoris, condylus medialis',
      },
    ],
  },

  os_patella: {
    origins: [],
    insertions: [
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. rectus femoris',
        location: 'via patellapees aan tuberositas tibiae',
      },
      {
        muscleId: 'vastus_lateralis',
        muscleName: 'm. vastus lateralis',
        location: 'via patellapees aan tuberositas tibiae',
      },
      {
        muscleId: 'vastus_medialis',
        muscleName: 'm. vastus medialis',
        location: 'via patellapees aan tuberositas tibiae',
      },
      {
        muscleId: 'vastus_intermedius',
        muscleName: 'm. vastus intermedius',
        location: 'via patellapees aan tuberositas tibiae',
      },
    ],
    note: 'Sesambeen in de pees van de m. quadriceps femoris dat de trekkracht via de patellapees overbrengt naar de tuberositas tibiae.',
  },

  os_tibia: {
    origins: [
      {
        muscleId: 'tibialis_anterior',
        muscleName: 'm. tibialis anterior',
        location: 'laterale ventrale vlak corpus tibia, condylus lateralis tibiae',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'proximale dorsale deel corpus tibia',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. rectus femoris',
        location: 'tuberositas tibiae (via patellapees)',
      },
      {
        muscleId: 'vastus_lateralis',
        muscleName: 'm. vastus lateralis',
        location: 'tuberositas tibiae (via patellapees)',
      },
      {
        muscleId: 'vastus_medialis',
        muscleName: 'm. vastus medialis',
        location: 'tuberositas tibiae (via patellapees)',
      },
      {
        muscleId: 'vastus_intermedius',
        muscleName: 'm. vastus intermedius',
        location: 'tuberositas tibiae (via patellapees)',
      },
      {
        muscleId: 'semitendinosus',
        muscleName: 'm. semitendinosus',
        location: 'condylus medialis tibiae',
      },
      {
        muscleId: 'semimembranosus',
        muscleName: 'm. semimembranosus',
        location: 'condylus medialis tibiae',
      },
    ],
  },

  os_fibula: {
    origins: [
      {
        muscleId: 'fibularis_longus',
        muscleName: 'm. fibularis longus',
        location: 'proximale laterale deel van de corpus fibula',
      },
      {
        muscleId: 'fibularis_brevis',
        muscleName: 'm. fibularis brevis',
        location: 'laterale vlak corpus fibula',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'proximale 1/3 deel van dorsale zijde fibula',
      },
    ],
    insertions: [
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        location: 'caput fibulae',
      },
    ],
  },

  os_talus: {
    origins: [],
    insertions: [],
    note: 'Het os talus bezit zelf geen directe spieraanhechtingen; het vormt het scharnierpunt in het art. talocruralis (BSG) en art. talo-calcaneo-navicularis (OSG).',
  },

  os_calcaneus: {
    origins: [],
    insertions: [
      {
        muscleId: 'gastrocnemius',
        muscleName: 'm. gastrocnemius',
        location: 'via achillespees aan tuber calcanei',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'via achillespees aan tuber calcanei',
      },
    ],
  },

  os_naviculare: {
    origins: [],
    insertions: [],
    note: 'Voetwortelbeen aan de mediale zijde dat deel uitmaakt van het art. talo-calcaneo-navicularis.',
  },

  os_humerus: {
    origins: [
      {
        muscleId: 'brachialis',
        muscleName: 'm. brachialis',
        location: 'distale helft ventrale zijde humerus',
      },
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        part: 'Caput mediale & laterale',
        location: 'mediaal op dorsale vlak van os humerus (caput mediale) | lateraal op dorsale vlak van os humerus (caput laterale)',
      },
    ],
    insertions: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        location: 'lateraal op humerus (op 1/3 deel van corpus)',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'tuberculum majus',
      },
      {
        muscleId: 'latissimus_dorsi',
        muscleName: 'm. latissimus dorsi',
        location: 'tuberculum minus',
      },
      {
        muscleId: 'teres_major',
        muscleName: 'm. teres major',
        location: 'proximaal ventraal op humerus',
      },
      {
        muscleId: 'teres_minor',
        muscleName: 'm. teres minor',
        location: 'dorsale gedeelte tuberculum majus',
      },
    ],
  },

  os_scapula: {
    origins: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        part: 'Pars acromialis & spinalis',
        location: 'acromion (pars acromialis) | spina scapula (pars spinalis)',
      },
      {
        muscleId: 'biceps_brachii',
        muscleName: 'm. biceps brachii',
        part: 'Caput breve & longum',
        location: 'caput breve: processus coracoideus | caput longum: net boven gewrichtskom schoudergewricht',
      },
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        part: 'Caput longum',
        location: 'net onder gewrichtskom schoudergewricht',
      },
      {
        muscleId: 'teres_major',
        muscleName: 'm. teres major',
        location: 'angulus inferior scapula',
      },
      {
        muscleId: 'teres_minor',
        muscleName: 'm. teres minor',
        location: 'margo lateralis scapula',
      },
    ],
    insertions: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        part: 'Pars transversa & ascendens',
        location: 'acromion (pars transversa) | spina scapula (pars ascendens)',
      },
      {
        muscleId: 'serratus_anterior',
        muscleName: 'm. serratus anterior',
        location: 'margo medialis scapula, angulus superior scapula, angulus inferior scapula',
      },
      {
        muscleId: 'rhomboidei',
        muscleName: 'mm. Rhomboideii',
        location: 'margo medialis scapula',
      },
      {
        muscleId: 'levator_scapulae',
        muscleName: 'm. levator scapula',
        location: 'angulus superior scapula',
      },
    ],
  },

  os_clavicula: {
    origins: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        part: 'Pars clavicularis',
        location: 'laterale 1/3 deel clavicula',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'mediale ⅓ deel clavicula',
      },
    ],
    insertions: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        part: 'Pars descendens',
        location: 'laterale 1/3 deel van clavicula',
      },
    ],
  },

  os_ulna: {
    origins: [],
    insertions: [
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        location: 'olecranon',
      },
      {
        muscleId: 'brachialis',
        muscleName: 'm. brachialis',
        location: 'tuberositas ulna',
      },
    ],
  },

  os_radius: {
    origins: [],
    insertions: [
      {
        muscleId: 'biceps_brachii',
        muscleName: 'm. biceps brachii',
        location: 'tuberositas radii',
      },
    ],
  },

  os_sternum: {
    origins: [
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'sternum',
      },
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: 'processus xiphoideus',
      },
    ],
    insertions: [],
  },

  os_sacrum: {
    origins: [
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'os sacrum',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'os sacrum',
      },
    ],
    insertions: [
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'os sacrum',
      },
    ],
  },

  os_coccygis: {
    origins: [
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'os coccygis',
      },
    ],
    insertions: [],
  },

  os_costa: {
    origins: [
      {
        muscleId: 'serratus_anterior',
        muscleName: 'm. serratus anterior',
        location: '1e tot 9e costa (rib)',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'kraakbeen van 2e-6e rib',
      },
      {
        muscleId: 'obliquus_externus_abdominis',
        muscleName: 'm. obliquus externus abdominis',
        location: '5e tot 12e costa',
      },
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: '5e - 7e costa',
      },
    ],
    insertions: [
      {
        muscleId: 'obliquus_internus_abdominis',
        muscleName: 'm. obliquus internus abdominis',
        location: 'kraakbeen v.d. laatste 3 costae',
      },
    ],
  },

  os_vertebra: {
    origins: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        location: 'dorsaal onderzijde schedel, processus spinosus van 1e tot 6e vertebra cervicales (descendens) | processus spinosus 7e vertebra cervicales en 1e tot 3e vertebra thoracales (transversa) | processus spinosus van de 3e tot 12e vertebra thoracales (ascendens)',
      },
      {
        muscleId: 'latissimus_dorsi',
        muscleName: 'm. latissimus dorsi',
        location: 'processus spinosus 7e-12 thoracale wervels, processus spinosus alle lumbale wervels',
      },
      {
        muscleId: 'rhomboidei',
        muscleName: 'mm. Rhomboideii',
        location: 'processus spinosus 7e cervicale en 1-5 thoracale vertebra',
      },
      {
        muscleId: 'levator_scapulae',
        muscleName: 'm. levator scapula',
        location: 'processus transversus van bovenste 4 vertebra cervicales',
      },
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        location: '12e vertebra thoracalis, 1e-5e vertebrae lumbales',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'alle wervels',
      },
    ],
    insertions: [
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'alle wervels',
      },
    ],
  },
};

export function getBoneAttachments(boneId: string): BoneAttachmentsData | undefined {
  return BONE_ATTACHMENTS[boneId];
}
