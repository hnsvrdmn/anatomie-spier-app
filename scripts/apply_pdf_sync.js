import fs from 'fs';

const musclesPath = 'src/data/muscles.json';
const muscles = JSON.parse(fs.readFileSync(musclesPath, 'utf8'));

// Updates strictly according to the syllabus PDF
const pdfDataUpdates = {
  latissimus_dorsi: {
    originText: "processus spinosus 7e-12 thoracale wervels, processus spinosus alle lumbale wervels, dorsale zijde crista iliaca",
    insertionText: "tuberculum minus (pees komt van dorsaal en hecht aan de ventrale zijde van de humerus aan)",
    functionText: "Adductie, Endorotatie, Retroflexie (art. humeri) / Detractie schoudergordel (cingulum pectorale)"
  },
  deltoideus: {
    originText: "Pars clavicularis: laterale 1/3 deel clavicula | Pars acromialis: acromion | Pars spinalis: spina scapula",
    insertionText: "lateraal op humerus (op 1/3 deel van corpus)",
    functionText: "Abductie, Anteflexie (pars clav.), Retroflexie (pars spin.)"
  },
  pectoralis_major: {
    originText: "mediale ⅓ deel clavicula, sternum, kraakbeen van 2e-6e rib",
    insertionText: "tuberculum majus",
    functionText: "Adductie, Endorotatie"
  },
  teres_major: {
    originText: "Angulus inferior scapula",
    insertionText: "Proximaal ventraal op humerus",
    functionText: "Endorotatie, Retroflexie"
  },
  teres_minor: {
    originText: "Margo lateralis scapula",
    insertionText: "Dorsale gedeelte tuberculum majus",
    functionText: "Exorotatie, Retroflexie"
  },
  trapezius: {
    originText: "Pars descendens (dalend): dorsaal onderzijde schedel, processus spinosus van 1e tot 6e vertebra cervicales | Pars transversa (dwars): processus spinosus 7e vertebra cervicales en 1e tot 3e vertebra thoracales | Pars ascendens (stijgend): processus spinosus van de 3e tot 12e vertebra thoracales",
    insertionText: "Pars descendens: laterale 1/3 deel van clavicula | Pars transversa: acromion | Pars ascendens: spina scapula",
    functionText: "Elevatie os scapula (descendens), Retractie os scapula (transversa), Detractie os scapula (ascendens)"
  },
  levator_scapulae: {
    name: "m. levator scapula",
    originText: "processus transversus van bovenste 4 vertebra cervicales",
    insertionText: "angulus superior scapula",
    functionText: "Elevatie os scapula"
  },
  serratus_anterior: {
    originText: "1e tot 9e costa (rib)",
    insertionText: "margo medialis scapula, angulus superior scapula, angulus inferior scapula",
    functionText: "Protractie en laterorotatie os scapula"
  },
  rhomboidei: {
    name: "mm. Rhomboideii",
    originText: "processus spinosus 7e cervicale en 1-5 thoracale vertebra",
    insertionText: "margo medialis scapula",
    functionText: "Mediorotatie en retractie van het os scapula"
  },
  biceps_brachii: {
    originText: "caput breve: processus coracoideus (= op schouderblad) | caput longum: net boven gewrichtskom schoudergewricht (= op schouderblad)",
    insertionText: "tuberositas radii (2x art. cubiti, 1x(!) art. humeri)",
    functionText: "Flexie en supinatie art. cubiti, abductie in art. humeri"
  },
  brachialis: {
    originText: "distale helft ventrale zijde humerus",
    insertionText: "tuberositas ulna",
    functionText: "Flexie art. cubiti"
  },
  triceps_brachii: {
    originText: "caput longum: net onder gewrichtskom schoudergewricht (= op schouderblad) | caput mediale: mediaal op dorsale vlak van os humerus | caput laterale: lateraal op dorsale vlak van os humerus",
    insertionText: "olecranon (1x art. cubiti, 1x art. humeri)",
    functionText: "Extensie art. cubiti, Retroflexie art. humeri (caput longum)"
  },
  rectus_abdominis: {
    originText: "5e - 7e costa, processus xiphoideus",
    insertionText: "os pubis",
    functionText: "Flexie van de wervelkolom"
  },
  obliquus_internus_abdominis: {
    originText: "crista iliaca, SIAS",
    insertionText: "kraakbeen v.d. laatste 3 costae, linea alba",
    functionText: "Rotatie naar zelfde zijde, Lateroflexie van de wervelkolom"
  },
  obliquus_externus_abdominis: {
    originText: "5e tot 12e costa",
    insertionText: "crista iliaca, linea alba",
    functionText: "Rotatie naar tegenovergestelde zijde, Lateroflexie van de wervelkolom"
  },
  erector_spinae: {
    originText: "alle wervels, os sacrum",
    insertionText: "alle wervels, os sacrum",
    functionText: "(Hyper)extensie van de wervelkolom"
  },
  iliopsoas: {
    name: "m. iliopsoas (MP: m. iliacus en m. psoas major)",
    originText: "12e vertebra thoracalis, 1e-5e vertebrae lumbales, ventrale vlak os ilium / Laatste thoracale en lumbale vertebrae, Binnenzijde os ilium",
    insertionText: "trochanter minor / trochanter minor femoris",
    functionText: "Flexie van de wervelkolom & Anteflexie en exorotatie van art. coxae"
  },
  rectus_femoris: {
    name: "m. rectus femoris (deel v. m. quadriceps femoris)",
    originText: "SIAI",
    insertionText: "via patellapees aan tuberositas tibiae",
    functionText: "anteflexie art. coxae, extensie art. genus"
  },
  biceps_femoris: {
    originText: "tuber ischiadicum (caput longum), middelste derde dorsale deel van femur (caput brevis)",
    insertionText: "caput fibulae",
    functionText: "retroflexie art. coxae, flexie in het art. genus, exorotatie in het art. genus"
  },
  semimembranosus: {
    originText: "tuber ischiadicum",
    insertionText: "condylus medialis tibiae",
    functionText: "(retroflexie art. coxae), flexie art. genus, endorotatie art. genus"
  },
  semitendinosus: {
    originText: "tuber ischiadicum",
    insertionText: "condylus medialis tibiae",
    functionText: "(retroflexie art. coxae), flexie art. genus, endorotatie art. genus"
  },
  tensor_fasciae_latae: {
    name: "m. tensor fascia latae",
    originText: "SIAS",
    insertionText: "condylus lateralis tibiae (via tractus iliotibialis)",
    functionText: "Abductie art. coxae"
  },
  gluteus_medius: {
    originText: "dorso-lateraal op os ilium",
    insertionText: "trochanter major",
    functionText: "Abductie art. coxae"
  },
  adductores: {
    name: "mm. adductor (MP: m. adductor magnus, m. adductor longus en m. adductor brevis)",
    originText: "os pubis, os ischii",
    insertionText: "mediale zijde corpus femoris, condylus medialis",
    functionText: "Adductie art. coxae"
  },
  gluteus_maximus: {
    originText: "crista iliaca, SIPS, os sacrum, os coccygis",
    insertionText: "proximale laterale deel van corpus femoris, tractus iliotibialis",
    functionText: "Retroflexie art. coxae, Exorotatie art. coxae"
  },
  vastus_lateralis: {
    name: "m. vastus lateralis (deel v. m. quadriceps femoris)",
    originText: "laterale zijde corpus femoris",
    insertionText: "via patellapees aan tuberositas tibiae",
    functionText: "Extensie art. genus"
  },
  vastus_intermedius: {
    name: "m. vastus intermedius (deel v. m. quadriceps femoris)",
    originText: "ventrale zijde corpus femoris",
    insertionText: "via patellapees aan tuberositas tibiae",
    functionText: "Extensie art. genus"
  },
  vastus_medialis: {
    name: "m. vastus medialis (deel v. m. quadriceps femoris)",
    originText: "mediale zijde corpus femoris",
    insertionText: "via patellapees aan tuberositas tibiae",
    functionText: "Extensie art. genus"
  },
  tibialis_anterior: {
    originText: "Laterale ventrale vlak corpus tibia, Condylus lateralis tibiae",
    insertionText: "Mediale voetrand",
    functionText: "dorsaalflexie art. talocruralis, inversie (supinatie) in het art. talo-calcaneo-navicularis"
  },
  fibularis_brevis: {
    name: "m. fibularis brevis (MP: peronaeus brevis)",
    originText: "Laterale vlak corpus fibula",
    insertionText: "Laterale voetrand",
    functionText: "Eversie (pronatie) art. talo-calcaneo-navicularis"
  },
  fibularis_longus: {
    name: "m. fibularis longus (MP: peronaeus longus)",
    originText: "Proximale laterale deel van de corpus fibula",
    insertionText: "mediale voetrand (onder de voet door)",
    functionText: "Eversie (pronatie) art. talo-calcaneo-navicularis"
  },
  gastrocnemius: {
    originText: "Condylus medialis/lateralis femoris",
    insertionText: "Via achillespees aan tuber calcanei",
    functionText: "plantairflexie art. talocruralis, flexie art. genus"
  },
  soleus: {
    originText: "Proximale 1/3 deel van dorsale zijde fibula, proximale dorsale deel corpus tibia",
    insertionText: "Via achillespees aan tuber calcanei",
    functionText: "plantairflexie in het art. talocruralis"
  }
};

let changesCount = 0;
muscles.forEach(m => {
  const update = pdfDataUpdates[m.id];
  if (update) {
    for (const [key, val] of Object.entries(update)) {
      if (m[key] !== val) {
        console.log(`Updated ${m.id}.${key}:\n  OLD: "${m[key]}"\n  NEW: "${val}"`);
        m[key] = val;
        changesCount++;
      }
    }
  }
});

fs.writeFileSync(musclesPath, JSON.stringify(muscles, null, 2), 'utf8');
console.log(`\nSuccessfully applied ${changesCount} field updates to muscles.json based on PDF!`);
