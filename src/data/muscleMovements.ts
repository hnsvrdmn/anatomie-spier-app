export const ALL_MOVEMENT_OPTIONS = [
  'Flexie',
  'Extensie',
  'Abductie',
  'Adductie',
  'Anteflexie',
  'Retroflexie',
  'Endorotatie',
  'Exorotatie',
  'Pronatie (eversie)',
  'Supinatie (inversie)',
  'Dorsaalflexie',
  'Plantairflexie',
  'Lateroflexie',
  'Rotatie',
  'Elevatie',
  'Detractie',
  'Retractie',
  'Protractie',
];

export const MUSCLE_MOVEMENTS: Record<string, string[]> = {
  latissimus_dorsi: ['Adductie', 'Endorotatie', 'Retroflexie', 'Detractie'],
  deltoideus: ['Abductie', 'Anteflexie', 'Retroflexie'],
  pectoralis_major: ['Adductie', 'Endorotatie'],
  teres_major: ['Endorotatie', 'Retroflexie'],
  teres_minor: ['Exorotatie', 'Retroflexie'],
  trapezius: ['Elevatie', 'Retractie', 'Detractie'],
  levator_scapulae: ['Elevatie'],
  serratus_anterior: ['Protractie'],
  rhomboidei: ['Retractie'],
  biceps_brachii: ['Flexie', 'Supinatie (inversie)', 'Abductie'],
  brachialis: ['Flexie'],
  triceps_brachii: ['Extensie', 'Retroflexie'],
  rectus_abdominis: ['Flexie'],
  obliquus_internus_abdominis: ['Rotatie', 'Lateroflexie'],
  obliquus_externus_abdominis: ['Rotatie', 'Lateroflexie'],
  erector_spinae: ['Extensie'],
  iliopsoas: ['Flexie', 'Anteflexie', 'Exorotatie'],
  rectus_femoris: ['Anteflexie', 'Extensie'],
  biceps_femoris: ['Retroflexie', 'Flexie', 'Exorotatie'],
  semimembranosus: ['Retroflexie', 'Flexie', 'Endorotatie'],
  semitendinosus: ['Retroflexie', 'Flexie', 'Endorotatie'],
  tensor_fasciae_latae: ['Abductie'],
  gluteus_medius: ['Abductie'],
  adductores: ['Adductie'],
  gluteus_maximus: ['Retroflexie', 'Exorotatie'],
  vastus_lateralis: ['Extensie'],
  vastus_intermedius: ['Extensie'],
  vastus_medialis: ['Extensie'],
  tibialis_anterior: ['Dorsaalflexie', 'Supinatie (inversie)'],
  fibularis_brevis: ['Pronatie (eversie)'],
  fibularis_longus: ['Pronatie (eversie)'],
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
