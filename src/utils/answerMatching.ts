/**
 * Anatomische antwoordnormalisatie en slimme controle voor open invultoetsen.
 * 
 * Houdt rekening met:
 * - 'Art.' vs 'Articulatio' vs compleet weglaten van het woordje art./articulatio
 * - 'm.' vs 'musculus' vs compleet weglaten van het woordje m./musculus
 * - Hoofd-/kleine letters en accenten (bijv. glenoïdalis vs glenoidalis)
 * - Leestekens, haakjes en optionele toevoegingen
 * - Kleine spelfoutjes (Levenshtein tolerantie)
 */

export function stripDiacritics(str: string): string {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '');
}

/**
 * Normaliseert een anatomische term naar een zuivere vergelijkbare kern-string
 */
export function normalizeAnatomyText(text: string): string {
  if (!text) return '';

  let s = stripDiacritics(text.toLowerCase());

  // Verwijder optionele toevoegingen tussen haakjes, zoals (MP: peronaeus brevis)
  s = s.replace(/\([^)]*\)/g, ' ');

  // Verwijder nummering aan het begin (bijv. "1. m. latissimus dorsi" -> "m. latissimus dorsi")
  s = s.replace(/^\s*\d+[\.\)]\s*/, '');

  // Verwijder leestekens
  s = s.replace(/[\.,\/#!$%\^&\*;:{}=\-_`~()\[\]]/g, ' ');

  // Verwijder voorvoegsels die studenten vaak variëren of weglaten:
  // - articulatio, articulationes, art
  // - musculus, musculi, mm, m
  const words = s.split(/\s+/).filter(Boolean);
  const filteredWords = words.filter(w => {
    return !['art', 'articulatio', 'articulationes', 'm', 'mm', 'musculus', 'musculi', 'de', 'het', 'een', 'van'].includes(w);
  });

  return filteredWords.join(' ').trim();
}

/**
 * Berekent de Levenshtein bewerkingsafstand tussen twee strings
 */
export function levenshteinDistance(a: string, b: string): number {
  if (a.length === 0) return b.length;
  if (b.length === 0) return a.length;

  const matrix: number[][] = [];

  for (let i = 0; i <= b.length; i++) {
    matrix[i] = [i];
  }
  for (let j = 0; j <= a.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= b.length; i++) {
    for (let j = 1; j <= a.length; j++) {
      if (b.charAt(i - 1) === a.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1, // vervanging
          matrix[i][j - 1] + 1,     // invoegen
          matrix[i - 1][j] + 1      // verwijderen
        );
      }
    }
  }

  return matrix[b.length][a.length];
}

export interface AnswerValidationResult {
  isCorrect: boolean;
  isClose: boolean;
  score: number; // 0, 75, 100
  normalizedUser: string;
  matchedAnswer: string;
  officialAnswer: string;
  feedbackNote?: string;
}

/**
 * Valideert de open invoer van een student tegen het juiste antwoord en eventuele synoniemen
 */
export function validateAnatomicalAnswer(
  userInput: string,
  officialAnswer: string,
  acceptableAnswers: string[] = []
): AnswerValidationResult {
  const normUser = normalizeAnatomyText(userInput);

  const targets = [officialAnswer, ...acceptableAnswers];
  let bestMatch = officialAnswer;
  let bestScore = 0;
  let isTypoClose = false;

  for (const target of targets) {
    const normTarget = normalizeAnatomyText(target);
    if (!normTarget || !normUser) continue;

    // 1. Exacte match na normalisatie (zonder 'art.', 'm.', accenten en leestekens)
    if (normUser === normTarget) {
      return {
        isCorrect: true,
        isClose: false,
        score: 100,
        normalizedUser: normUser,
        matchedAnswer: target,
        officialAnswer,
      };
    }

    // 2. Bevat-match (bijv. "latissimus dorsi" bevat "latissimus" of omgekeerd bij lange zinnen)
    if (normUser.length >= 5 && normTarget.includes(normUser) && normUser.length / normTarget.length > 0.7) {
      bestScore = Math.max(bestScore, 100);
      bestMatch = target;
      break;
    }

    // 3. Kleine typfoutcontrole met Levenshtein
    const dist = levenshteinDistance(normUser, normTarget);
    const maxAllowedDist = normTarget.length <= 6 ? 1 : normTarget.length <= 12 ? 2 : 3;

    if (dist <= maxAllowedDist) {
      bestScore = Math.max(bestScore, 100);
      bestMatch = target;
      isTypoClose = true;
      break;
    } else if (dist <= maxAllowedDist + 1) {
      bestScore = Math.max(bestScore, 75);
      bestMatch = target;
    }
  }

  if (bestScore === 100) {
    const userLower = userInput.toLowerCase();
    const targetLower = officialAnswer.toLowerCase();
    let note = isTypoClose ? `Goed gerekend! Officiële schrijfwijze: ${officialAnswer}` : undefined;

    if (!note) {
      const hasPrefixInTarget = /\b(art|articulatio|m|musculus)\b/i.test(targetLower);
      const hasPrefixInUser = /\b(art|articulatio|m|musculus)\b/i.test(userLower);
      if (hasPrefixInTarget && !hasPrefixInUser) {
        note = "Correct! Het weglaten of variëren van 'Art.' / 'articulatio' of 'm.' / 'musculus' is prima.";
      }
    }

    return {
      isCorrect: true,
      isClose: false,
      score: 100,
      normalizedUser: normUser,
      matchedAnswer: bestMatch,
      officialAnswer,
      feedbackNote: note,
    };
  }

  if (bestScore === 75) {
    return {
      isCorrect: false,
      isClose: true,
      score: 75,
      normalizedUser: normUser,
      matchedAnswer: bestMatch,
      officialAnswer,
      feedbackNote: `Bijna goed! Let op de spelling: ${officialAnswer}`,
    };
  }

  return {
    isCorrect: false,
    isClose: false,
    score: 0,
    normalizedUser: normUser,
    matchedAnswer: officialAnswer,
    officialAnswer,
  };
}
