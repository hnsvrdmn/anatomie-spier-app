export type AnatomicalView = 'ventral' | 'dorsal';

export type SymmetryType = 'bilateral' | 'midline';

export type SymmetrySide = 'left' | 'right' | 'both';

export type EditSymmetrySide = 'left' | 'right' | 'midline';

export interface Point2D {
  x: number; // 0.0 - 1.0 (links naar rechts)
  y: number; // 0.0 - 1.0 (craniaal naar caudaal)
  id?: string;
  name?: string; // Optionele annotatienaam
  view?: AnatomicalView; // Ventraal of dorsaal aanzicht waarin het punt is geplaatst
}

export interface AttachmentLine {
  id: string;
  name: string; // bijv. "Linea alba", "Columna vertebralis T7-L5", "Crista iliaca"
  type: 'origin' | 'insertion';
  points: Point2D[]; // Polyline punten waarbinnen elk punt als correct wordt gerekend
  tolerance?: number; // Afstandsmarge in genormaliseerde eenheden (standaard 0.045)
}

export interface MuscleVisualData {
  origins: Point2D[];
  insertions: Point2D[];
  musclePath: Point2D[];
  attachmentLines?: AttachmentLine[]; // Lijn-gebaseerde tolerantiezones voor origo of insertie
}

export interface MuscleVisuals {
  left?: MuscleVisualData;
  right?: MuscleVisualData;
  midline?: MuscleVisualData;
}

export interface JointCategory {
  id: string; // 'coxae' | 'genus' | 'pedis' | 'cubiti' | 'humeri' | 'cingulum' | 'romp'
  code: string; // 'A' | 'B' | 'C' | 'D' | 'E' | 'F' | 'G'
  name: string; // 'ARTICULATIO COXAE'
  pageInfo: string; // 'Heupgewricht - p. 32'
  title: string; // 'A. ARTICULATIO COXAE (Heupgewricht - p. 32)'
  muscleIds: string[];
}

export interface PrimaryMovement {
  joint: string;
  movement: string;
}

export interface Muscle {
  id: string;
  name: string; // bijv. "m. rectus femoris"
  latinName?: string;
  view: AnatomicalView; // "ventral" | "dorsal"
  originText: string; // bijv. "SIAI (Spina Iliaca Anterior Inferior)"
  insertionText: string; // bijv. "Tuberositas tibiae (via patellapees)"
  functionText?: string; // Optionele werking samenvatting
  primaryMovements?: PrimaryMovement[]; // Primaire bewegingen per gewricht
  otherFunctions?: string; // Secundaire / stabilisatiefuncties
  symmetryType: SymmetryType; // "bilateral" | "midline"
  jointCategories?: string[]; // bijv. ['coxae', 'genus']
  visuals: MuscleVisuals;
}


export type AppMode = 'study' | 'movements' | 'quiz' | 'editor';

export type EditorTool = 'origin' | 'insertion' | 'origin_line' | 'insertion_line' | 'path' | 'select';

export type QuizType = 
  | 'joint'        // Oefenen per gewricht (alle spieren van gekozen gewricht)
  | 'full'         // Volledige spier (origo + insertie)
  | 'origins'      // Vind de origo('s)
  | 'insertions'   // Vind de insertie('s)
  | 'landmark'     // Vind specifiek aanhechtingspunt (origo of insertie)
  | 'multiple_choice' // Meerkeuze toets (identificatie, origo/insertie & functie)
  | 'open_question'   // Open toets: typ zelf het antwoord (naam, origo, insertie of werking)
  | 'function'     // (voor backwards compatibiliteit)
  | 'movements';   // Bewegingen per spier (selecteer alle bijbehorende bewegingen via checkboxes)

export type MatchAccuracy = 'correct' | 'close' | 'incorrect';

export interface MatchResult {
  userPoint: Point2D;
  targetPoint?: Point2D;
  distance: number;
  accuracy: MatchAccuracy;
  targetType: 'origin' | 'insertion' | 'path' | 'origin_line' | 'insertion_line';
  matchedLineName?: string;
}

export interface QuizQuestion {
  id: string;
  muscle: Muscle;
  type: QuizType;
  side: 'left' | 'right' | 'midline';
  jointId?: string; // indien quiztype 'joint'
  jointIndex?: number; // spier X van Y binnen gewricht
  jointTotal?: number;
  options?: Muscle[]; // voor multiple choice
  landmarkText?: string; // naam van het gevraagde aanhechtingspunt (voor type 'landmark')
  landmarkType?: 'origin' | 'insertion';
  targetLandmarkIndex?: number;
  mcKind?: 'muscle' | 'origin' | 'insertion' | 'function';
  mcSubtype?: 'origin' | 'insertion';
  mcTextOptions?: string[];
  correctMcText?: string;
  functionOptions?: string[]; // opties met werking/beweging
  correctFunctionText?: string;
  movementOptions?: string[]; // voor type 'movements': 8 opties
  correctMovements?: string[]; // juiste bewegingen voor de spier
  // Voor type 'open_question' (open invultoets)
  openKind?: 'muscle' | 'origin' | 'insertion' | 'function' | 'joint';
  correctOpenAnswer?: string;
  acceptableAnswers?: string[];
}

export interface QuizAttempt {
  questionId: string;
  muscleId: string;
  type: QuizType;
  isCorrect: boolean;
  score: number; // 0 - 100
  accuracyDetails: string;
}

export interface QuizStatsData {
  totalQuestions: number;
  correctAnswers: number;
  closeAnswers: number;
  incorrectAnswers: number;
  streak: number;
  history: QuizAttempt[];
}

