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
        location: 'Dorsale zijde crista iliaca (darmbeenkam)',
      },
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'Facies glutea van het os ilium en achterste deel crista iliaca',
      },
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. rectus femoris',
        location: 'Spina iliaca anterior inferior (SIAI)',
      },
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        part: 'Caput longum',
        location: 'Tuber ischiadicum (zitbeenknobbel)',
      },
      {
        muscleId: 'semitendinosus',
        muscleName: 'm. semitendinosus',
        location: 'Tuber ischiadicum (zitbeenknobbel)',
      },
      {
        muscleId: 'semimembranosus',
        muscleName: 'm. semimembranosus',
        location: 'Tuber ischiadicum (zitbeenknobbel)',
      },
      {
        muscleId: 'adductor_magnus',
        muscleName: 'm. adductor longus, brevis & magnus',
        location: 'Os pubis (schaambeen) en ramus van het os ischium',
      },
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        part: 'm. iliacus',
        location: 'Fossa iliaca (binnenzijde darmbeenvleugel)',
      },
      {
        muscleId: 'obliquus_internus_abdominis',
        muscleName: 'm. obliquus internus abdominis',
        location: 'Crista iliaca (ventrale 2/3 deel)',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'Dorsale zijde crista iliaca',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: 'Crista pubica en symphysis pubica (schaambeen)',
      },
      {
        muscleId: 'obliquus_externus_abdominis',
        muscleName: 'm. obliquus externus abdominis',
        location: 'Labium externum van de crista iliaca',
      },
    ],
  },

  os_femur: {
    origins: [
      {
        muscleId: 'vastus_lateralis',
        muscleName: 'm. vastus lateralis',
        location: 'Trochanter major en laterale lip van de linea aspera',
      },
      {
        muscleId: 'vastus_medialis',
        muscleName: 'm. vastus medialis',
        location: 'Mediale lip van de linea aspera femoris',
      },
      {
        muscleId: 'vastus_intermedius',
        muscleName: 'm. vastus intermedius',
        location: 'Ventrale en laterale zijde van de femurschacht',
      },
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        part: 'Caput breve',
        location: 'Middelste derde deel van de linea aspera femoris',
      },
      {
        muscleId: 'gastrocnemius',
        muscleName: 'm. gastrocnemius',
        location: 'Epicondylus medialis en lateralis femoris',
      },
    ],
    insertions: [
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        location: 'Trochanter minor femoris (kleine draaier)',
      },
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'Tuberositas glutea femoris (onder trochanter major)',
      },
      {
        muscleId: 'adductor_magnus',
        muscleName: 'm. adductor longus, brevis & magnus',
        location: 'Linea aspera van het corpus femoris',
      },
    ],
  },

  os_patella: {
    origins: [],
    insertions: [
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. rectus femoris',
        location: 'Basis patellae (bovenzijde knieschijf)',
      },
      {
        muscleId: 'vastus_lateralis',
        muscleName: 'm. vastus lateralis',
        location: 'Basis en laterale rand van de patella',
      },
      {
        muscleId: 'vastus_medialis',
        muscleName: 'm. vastus medialis',
        location: 'Basis en mediale rand van de patella',
      },
      {
        muscleId: 'vastus_intermedius',
        muscleName: 'm. vastus intermedius',
        location: 'Basis patellae (diepe laag)',
      },
    ],
    note: 'De patella is een sesambeen in de quadricepspees die de trekkracht via het ligamentum patellae overbrengt naar de tuberositas tibiae.',
  },

  os_tibia: {
    origins: [
      {
        muscleId: 'tibialis_anterior',
        muscleName: 'm. tibialis anterior',
        location: 'Facies lateralis tibiae (bovenzijde scheenbeenschacht)',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'Linea musculi solei aan de dorsale zijde van de tibia',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_femoris',
        muscleName: 'm. quadriceps femoris (rectus femoris & vasti)',
        location: 'Tuberositas tibiae (via het ligamentum patellae)',
      },
      {
        muscleId: 'semitendinosus',
        muscleName: 'm. semitendinosus',
        location: 'Pes anserinus superficialis aan de mediale zijde van de tibia',
      },
      {
        muscleId: 'semimembranosus',
        muscleName: 'm. semimembranosus',
        location: 'Dorsale zijde van de condylus medialis tibiae',
      },
    ],
  },

  os_fibula: {
    origins: [
      {
        muscleId: 'fibularis_longus',
        muscleName: 'm. fibularis longus',
        location: 'Caput fibulae en proximale 2/3 laterale vlak kuitbeen',
      },
      {
        muscleId: 'fibularis_brevis',
        muscleName: 'm. fibularis brevis',
        location: 'Distale 2/3 laterale vlak kuitbeenschacht',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'Caput fibulae en dorsale zijde collum fibulae',
      },
    ],
    insertions: [
      {
        muscleId: 'biceps_femoris',
        muscleName: 'm. biceps femoris',
        location: 'Caput fibulae (kuitbeenkopje)',
      },
    ],
  },

  os_talus: {
    origins: [],
    insertions: [],
    note: 'Geen directe spieraanhechtingen. De talus is vrijwel geheel bekleed met hyalien gewrichtskraakbeen en draagt het lichaamsgewicht over van de enkelvork naar de voetwortel.',
  },

  os_calcaneus: {
    origins: [],
    insertions: [
      {
        muscleId: 'gastrocnemius',
        muscleName: 'm. gastrocnemius',
        location: 'Tuber calcanei via de tendo calcaneus (achillespees)',
      },
      {
        muscleId: 'soleus',
        muscleName: 'm. soleus',
        location: 'Tuber calcanei via de tendo calcaneus (achillespees)',
      },
    ],
  },

  os_naviculare: {
    origins: [],
    insertions: [],
    note: 'Onderdeel van het voorste deel van het onderste spronggewricht (articulatio talo-calcaneo-navicularis) samen met de talus en het calcaneus.',
  },

  os_humerus: {
    origins: [
      {
        muscleId: 'brachialis',
        muscleName: 'm. brachialis',
        location: 'Distale ventrale helft van de humerusschacht',
      },
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        part: 'Caput mediale & Caput laterale',
        location: 'Dorsale vlak van de humerusschacht (boven en onder sulcus n. radialis)',
      },
    ],
    insertions: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        location: 'Tuberositas deltoidea humeri (laterale schachtzijde)',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'Crista tuberculi majoris humeri',
      },
      {
        muscleId: 'latissimus_dorsi',
        muscleName: 'm. latissimus dorsi',
        location: 'Crista tuberculi minoris / tuberculum minus humeri',
      },
      {
        muscleId: 'teres_major',
        muscleName: 'm. teres major',
        location: 'Crista tuberculi minoris humeri',
      },
      {
        muscleId: 'teres_minor',
        muscleName: 'm. teres minor',
        location: 'Tuberculum majus humeri (onderste facet)',
      },
    ],
  },

  os_scapula: {
    origins: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        part: 'Pars acromialis & Pars spinalis',
        location: 'Acromion en spina scapulae',
      },
      {
        muscleId: 'biceps_brachii',
        muscleName: 'm. biceps brachii',
        part: 'Caput breve & Caput longum',
        location: 'Processus coracoïdeus (kort) en bovenzijde cavitas glenoidalis (lang)',
      },
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        part: 'Caput longum',
        location: 'Onderzijde cavitas glenoidalis van de scapula',
      },
      {
        muscleId: 'teres_major',
        muscleName: 'm. teres major',
        location: 'Angulus inferior en margo lateralis scapulae',
      },
      {
        muscleId: 'teres_minor',
        muscleName: 'm. teres minor',
        location: 'Margo lateralis scapulae (dorsale zijde)',
      },
    ],
    insertions: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        location: 'Spina scapulae en acromion (bovenrand)',
      },
      {
        muscleId: 'serratus_anterior',
        muscleName: 'm. serratus anterior',
        location: 'Margo medialis scapulae (ventrale zijde, van angulus superior tot inferior)',
      },
      {
        muscleId: 'rhomboidei',
        muscleName: 'm. rhomboidei',
        location: 'Margo medialis scapulae (dorsale zijde)',
      },
      {
        muscleId: 'levator_scapulae',
        muscleName: 'm. levator scapulae',
        location: 'Angulus superior en margo medialis scapulae',
      },
    ],
  },

  os_clavicula: {
    origins: [
      {
        muscleId: 'deltoideus',
        muscleName: 'm. deltoideus',
        part: 'Pars clavicularis',
        location: 'Laterale derde deel van de clavicula',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        part: 'Pars clavicularis',
        location: 'Mediale helft van de voorzijde clavicula',
      },
    ],
    insertions: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        part: 'Pars descendens',
        location: 'Laterale derde deel van de clavicula (achterrand)',
      },
    ],
  },

  os_ulna: {
    origins: [],
    insertions: [
      {
        muscleId: 'triceps_brachii',
        muscleName: 'm. triceps brachii',
        location: 'Olecranon ulnae (harde achterpunt van de elleboog)',
      },
      {
        muscleId: 'brachialis',
        muscleName: 'm. brachialis',
        location: 'Tuberositas ulnae',
      },
    ],
  },

  os_radius: {
    origins: [],
    insertions: [
      {
        muscleId: 'biceps_brachii',
        muscleName: 'm. biceps brachii',
        location: 'Tuberositas radii (mediale zijde onder het spaakbeenkopje)',
      },
    ],
  },

  os_sternum: {
    origins: [
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        part: 'Pars sternocostalis',
        location: 'Ventrale vlak van het manubrium en corpus sterni',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: 'Processus xiphoideus (zwaardvormig aanhangsel)',
      },
    ],
  },

  os_sacrum: {
    origins: [
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'Dorsale en laterale zijde van het heiligbeen',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'Dorsale zijde os sacrum (crista sacralis mediana)',
      },
    ],
    insertions: [],
  },

  os_coccygis: {
    origins: [
      {
        muscleId: 'gluteus_maximus',
        muscleName: 'm. gluteus maximus',
        location: 'Laterale rand van het os coccygis (staartbeen)',
      },
    ],
    insertions: [],
  },

  os_costa: {
    origins: [
      {
        muscleId: 'serratus_anterior',
        muscleName: 'm. serratus anterior',
        location: 'Buitenzijde van de 1e tot en met 9e rib',
      },
      {
        muscleId: 'pectoralis_major',
        muscleName: 'm. pectoralis major',
        location: 'Kraakbeen van de 2e tot en met 6e rib (cartilago costalis)',
      },
      {
        muscleId: 'obliquus_externus_abdominis',
        muscleName: 'm. obliquus externus abdominis',
        location: 'Buitenzijde van de 5e tot en met 12e rib',
      },
    ],
    insertions: [
      {
        muscleId: 'rectus_abdominis',
        muscleName: 'm. rectus abdominis',
        location: 'Buitenzijde van het ribkraakbeen van de 5e, 6e en 7e rib',
      },
      {
        muscleId: 'obliquus_internus_abdominis',
        muscleName: 'm. obliquus internus abdominis',
        location: 'Onderrand van de onderste 3 tot 4 ribben (costae 9-12)',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'Angulus costae van de ribben (achterzijde borstkas)',
      },
    ],
  },

  os_vertebra: {
    origins: [
      {
        muscleId: 'trapezius',
        muscleName: 'm. trapezius',
        location: 'Processus spinosus van C1 t/m Th12',
      },
      {
        muscleId: 'latissimus_dorsi',
        muscleName: 'm. latissimus dorsi',
        location: 'Processus spinosus Th7 t/m Th12 en lumbale wervels L1 t/m L5',
      },
      {
        muscleId: 'rhomboidei',
        muscleName: 'm. rhomboidei',
        location: 'Processus spinosus C6 t/m Th4',
      },
      {
        muscleId: 'levator_scapulae',
        muscleName: 'm. levator scapulae',
        location: 'Processus transversus van halswervels C1 t/m C4',
      },
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'Processus spinosus en transversus van lumbale en thoracale wervels',
      },
      {
        muscleId: 'iliopsoas',
        muscleName: 'm. iliopsoas',
        part: 'm. psoas major',
        location: 'Wervellichamen en processus costales van Th12 t/m L5',
      },
    ],
    insertions: [
      {
        muscleId: 'erector_spinae',
        muscleName: 'm. erector spinae',
        location: 'Processus spinosus en transversus van thoracale en cervicale wervels',
      },
    ],
  },
};

export function getBoneAttachments(boneId: string): BoneAttachmentsData | undefined {
  return BONE_ATTACHMENTS[boneId];
}
