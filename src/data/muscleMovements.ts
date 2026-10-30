export const ALL_MOVEMENT_OPTIONS = [
  'Flexie',
  'Extensie',
  'Abductie',
  'Adductie',
  'Anteflexie',
  'Retroflexie',
  'Endorotatie',
  'Exorotatie',
  'Supinatie',
  'Eversie',
  'Inversie',
  'Dorsaalflexie',
  'Plantairflexie',
  'Lateroflexie',
  'Rotatie',
  'Elevatie',
  'Depressie',
  'Retractie',
  'Protractie',
  'Laterorotatie',
  'Mediorotatie',
];

export const MUSCLE_MOVEMENTS: Record<string, string[]> = {
  latissimus_dorsi: ['Adductie', 'Endorotatie'],
  deltoideus: ['Abductie', 'Anteflexie', 'Retroflexie'],
  pectoralis_major: ['Adductie', 'Endorotatie'],
  teres_major: ['Endorotatie', 'Adductie'],
  teres_minor: ['Exorotatie'],
  trapezius: ['Retractie', 'Elevatie', 'Depressie'],
  levator_scapulae: ['Elevatie'],
  serratus_anterior: ['Protractie', 'Laterorotatie'],
  rhomboidei: ['Mediorotatie', 'Retractie'],
  biceps_brachii: ['Flexie', 'Supinatie'],
  brachialis: ['Flexie'],
  triceps_brachii: ['Extensie', 'Adductie'],
  rectus_abdominis: ['Flexie'],
  obliquus_internus_abdominis: ['Lateroflexie', 'Rotatie'],
  obliquus_externus_abdominis: ['Lateroflexie', 'Rotatie'],
  erector_spinae: ['Extensie'],
  iliopsoas: ['Anteflexie', 'Exorotatie', 'Flexie'],
  rectus_femoris: ['Extensie', 'Anteflexie'],
  biceps_femoris: ['Retroflexie', 'Flexie', 'Exorotatie'],
  semimembranosus: ['Endorotatie', 'Flexie'],
  semitendinosus: ['Endorotatie', 'Flexie'],
  adductores: ['Adductie'],
  gluteus_maximus: ['Retroflexie', 'Exorotatie'],
  vastus_lateralis: ['Extensie'],
  vastus_intermedius: ['Extensie'],
  vastus_medialis: ['Extensie'],
  tibialis_anterior: ['Dorsaalflexie', 'Inversie'],
  fibularis_brevis: ['Eversie'],
  fibularis_longus: ['Eversie'],
  gastrocnemius: ['Plantairflexie', 'Flexie'],
  soleus: ['Plantairflexie'],
};

/**
 * Genereert een set van 8 opties voor de spierbewegingentoets:
 * Bevat alle correcte bewegingen van de spier + willekeurig afwisselende afleiders.
 */
export function getMovementQuestionOptions(muscleId: string, totalOptions = 8): {
  options: string[];
  correctMovements: string[];
} {
  const correct = MUSCLE_MOVEMENTS[muscleId] || [];
  const distractors = ALL_MOVEMENT_OPTIONS.filter((opt) => !correct.includes(opt));

  // Schud afleiders en selecteer het benodigde aantal
  const neededDistractors = Math.max(0, totalOptions - correct.length);
  const shuffledDistractors = [...distractors].sort(() => 0.5 - Math.random()).slice(0, neededDistractors);

  // Combineer en schud de 8 opties
  const allShuffled = [...correct, ...shuffledDistractors].sort(() => 0.5 - Math.random());

  return {
    options: allShuffled,
    correctMovements: correct,
  };
}
