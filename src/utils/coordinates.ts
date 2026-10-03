import { Point2D, MatchAccuracy, MatchResult, AttachmentLine } from '../types/anatomy';

// Toleranties volgens PMT-specificaties
export const TOLERANCE_CORRECT = 0.035;
export const TOLERANCE_CLOSE = 0.070;

// Skelet rasterafbeelding verhouding (skeleton_ventral en skeleton_dorsal zijn 542 x 1287)
export const SKELETON_WIDTH = 542;
export const SKELETON_HEIGHT = 1287;
export const SKELETON_ASPECT_RATIO = SKELETON_WIDTH / SKELETON_HEIGHT; // ~0.42113
export const SKELETON_REAL_HEIGHT_CM = 170; // Totale anatomische lengte van het skelet in werkelijkheid (~170 cm)

/**
 * Berekent de werkelijke geometrische afstand tussen twee genormaliseerde 2D-punten,
 * gecorrigeerd voor de skeletbeeldverhouding (542 x 1287) zodat afstanden isotroop zijn.
 * De resulterende afstand is uitgedrukt als fractie van de skelethoogte (1.0 = 170 cm).
 */
export function calculateDistance(p1: Point2D, p2: Point2D): number {
  const dx = (p1.x - p2.x) * SKELETON_ASPECT_RATIO;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Converteert een genormaliseerde afstand (op basis van skelethoogte) naar centimeters.
 */
export function distanceToCm(distance: number): number {
  return distance * SKELETON_REAL_HEIGHT_CM;
}

/**
 * Bepaalt de nauwkeurigheidsstatus op basis van de afstand
 */
export function getAccuracy(
  distance: number,
  toleranceCorrect: number = TOLERANCE_CORRECT,
  toleranceClose: number = toleranceCorrect * 2
): MatchAccuracy {
  if (distance < toleranceCorrect) {
    return 'correct';
  }
  if (distance <= toleranceClose) {
    return 'close';
  }
  return 'incorrect';
}

/**
 * Spiegelt een punt horizontaal (sagittaal vlak): x_nieuw = 1.0 - x_oud
 */
export function mirrorPoint(p: Point2D): Point2D {
  return {
    ...p,
    x: Number((1.0 - p.x).toFixed(4)),
    y: Number(p.y.toFixed(4)),
  };
}

/**
 * Spiegelt een reeks punten horizontaal
 */
export function mirrorPoints(points: Point2D[]): Point2D[] {
  return points.map(mirrorPoint);
}

/**
 * Berekent het dichtstbijzijnde doelpunt en koppelt gebruikerskliks ongeacht de volgorde (greedy bipartite matching)
 */
export function matchPointsGreedy(
  userPoints: Point2D[],
  targetPoints: Point2D[],
  targetType: 'origin' | 'insertion' | 'path',
  toleranceCorrect: number = TOLERANCE_CORRECT
): { matches: MatchResult[]; unmatchedTargets: Point2D[] } {
  const availableTargets = [...targetPoints];
  const matches: MatchResult[] = [];

  for (const userPt of userPoints) {
    if (availableTargets.length === 0) {
      // Geen doelen meer over, telt als te veel geklikt / incorrect
      matches.push({
        userPoint: userPt,
        distance: 1.0,
        accuracy: 'incorrect',
        targetType,
      });
      continue;
    }

    let minDistance = Infinity;
    let closestIndex = -1;

    for (let i = 0; i < availableTargets.length; i++) {
      const dist = calculateDistance(userPt, availableTargets[i]);
      if (dist < minDistance) {
        minDistance = dist;
        closestIndex = i;
      }
    }

    const matchedTarget = availableTargets[closestIndex];
    availableTargets.splice(closestIndex, 1);

    matches.push({
      userPoint: userPt,
      targetPoint: matchedTarget,
      distance: minDistance,
      accuracy: getAccuracy(minDistance, toleranceCorrect),
      targetType,
    });
  }

  return {
    matches,
    unmatchedTargets: availableTargets,
  };
}

/**
 * Berekent de kortste isotrope afstand van een punt p tot een lijnsegment tussen p1 en p2,
 * gecorrigeerd voor de skeletbeeldverhouding (542 x 1287).
 */
export function distanceToSegment(p: Point2D, p1: Point2D, p2: Point2D): number {
  const aspect = SKELETON_ASPECT_RATIO;
  const px = p.x * aspect;
  const py = p.y;
  const p1x = p1.x * aspect;
  const p1y = p1.y;
  const p2x = p2.x * aspect;
  const p2y = p2.y;

  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return calculateDistance(p, p1);

  const t = Math.max(0, Math.min(1, ((px - p1x) * dx + (py - p1y) * dy) / lengthSq));
  const projIsoX = p1x + t * dx;
  const projY = p1y + t * dy;

  const diffX = px - projIsoX;
  const diffY = py - projY;
  return Math.sqrt(diffX * diffX + diffY * diffY);
}

/**
 * Berekent het dichtstbijzijnde punt (projectie) op een lijnsegment in genormaliseerde coördinaten.
 */
export function projectToSegment(p: Point2D, p1: Point2D, p2: Point2D): Point2D {
  const aspect = SKELETON_ASPECT_RATIO;
  const px = p.x * aspect;
  const py = p.y;
  const p1x = p1.x * aspect;
  const p1y = p1.y;
  const p2x = p2.x * aspect;
  const p2y = p2.y;

  const dx = p2x - p1x;
  const dy = p2y - p1y;
  const lengthSq = dx * dx + dy * dy;
  if (lengthSq === 0) return { ...p1 };

  const t = Math.max(0, Math.min(1, ((px - p1x) * dx + (py - p1y) * dy) / lengthSq));
  return {
    x: Number(((p1x + t * dx) / aspect).toFixed(4)),
    y: Number((p1y + t * dy).toFixed(4)),
  };
}

/**
 * Berekent de minimale afstand van een punt tot een polyline (serie aaneengesloten punten/lijnen)
 * en geeft de geprojecteerde coördinaat op de lijn terug.
 */
export function distanceToPolyline(
  p: Point2D,
  polyline: Point2D[]
): { distance: number; projection: Point2D } {
  if (polyline.length === 0) {
    return { distance: Infinity, projection: { ...p } };
  }
  if (polyline.length === 1) {
    return { distance: calculateDistance(p, polyline[0]), projection: { ...polyline[0] } };
  }

  let minDistance = Infinity;
  let bestProj = { ...polyline[0] };

  for (let i = 0; i < polyline.length - 1; i++) {
    const p1 = polyline[i];
    const p2 = polyline[i + 1];
    const d = distanceToSegment(p, p1, p2);
    if (d < minDistance) {
      minDistance = d;
      bestProj = projectToSegment(p, p1, p2);
    }
  }

  return { distance: minDistance, projection: bestProj };
}

export interface EvaluationSetResult {
  matches: MatchResult[];
  requiredCount: number;
  correctCount: number;
  closeCount: number;
  isPassed: boolean;
}

/**
 * Evalueert een set gebruikerspunten tegen doelpunten én continue aanhechtingslijnen
 * (zoals de linea alba, crista iliaca, wervelkolom of margo medialis scapulae).
 * Een punt dat waar dan ook langs een geldige aanhechtingslijn wordt geplaatst,
 * wordt als 100% correct gerekend!
 */
export function evaluatePointSet(
  userPoints: Point2D[],
  targetPoints: Point2D[],
  targetType: 'origin' | 'insertion' | 'path',
  toleranceCorrect: number = TOLERANCE_CORRECT,
  attachmentLines?: AttachmentLine[]
): EvaluationSetResult {
  const toleranceClose = toleranceCorrect * 2;
  const matchingLines = (attachmentLines || []).filter(
    (l) => l.type === targetType && l.points && l.points.length >= 2
  );

  // Indien er geen discrete targetPoints zijn, maar wel een aanhechtingslijn:
  if (targetPoints.length === 0 && matchingLines.length > 0) {
    const matches: MatchResult[] = [];
    let correctCount = 0;
    let closeCount = 0;

    for (const upt of userPoints) {
      let bestDist = Infinity;
      let bestProj = { ...upt };
      let matchedName = matchingLines[0].name;

      let bestTolCorrect = 0.016;
      let bestTolClose = 0.024;

      for (const line of matchingLines) {
        const lineTolCorrect = line.tolerance || 0.016;
        const lineTolClose = lineTolCorrect * 1.5;
        const res = distanceToPolyline(upt, line.points);
        if (res.distance < bestDist) {
          bestDist = res.distance;
          bestProj = res.projection;
          matchedName = line.name;
          bestTolCorrect = lineTolCorrect;
          bestTolClose = lineTolClose;
        }
      }

      if (bestDist < bestTolCorrect) {
        matches.push({
          userPoint: upt,
          targetPoint: bestProj,
          distance: bestDist,
          accuracy: 'correct',
          targetType,
          matchedLineName: matchedName,
        });
        correctCount++;
      } else if (bestDist <= bestTolClose) {
        matches.push({
          userPoint: upt,
          targetPoint: bestProj,
          distance: bestDist,
          accuracy: 'close',
          targetType,
          matchedLineName: matchedName,
        });
        closeCount++;
      } else {
        matches.push({
          userPoint: upt,
          distance: bestDist,
          accuracy: 'incorrect',
          targetType,
        });
      }
    }

    return {
      matches,
      requiredCount: 1,
      correctCount,
      closeCount,
      isPassed: correctCount >= 1,
    };
  }

  if (targetPoints.length === 0) {
    return {
      matches: [],
      requiredCount: 0,
      correctCount: 0,
      closeCount: 0,
      isPassed: true,
    };
  }

  // Ondersteun brede aanhechtingszones (zoals wervelkolom of meerdere ribben):
  const isMultiSpan = targetPoints.length > 2 || (targetPoints.length === 2 && Math.abs(targetPoints[0].y - targetPoints[1].y) > 0.08) || matchingLines.length > 0;
  const requiredCount = isMultiSpan ? Math.min(2, targetPoints.length) : targetPoints.length;

  // Standaard greedy bipartite matching uitvoeren op de discrete punten
  const greedyResult = matchPointsGreedy(userPoints, targetPoints, targetType, toleranceCorrect);
  const matches: MatchResult[] = [];

  let correctCount = 0;
  let closeCount = 0;

  const sortedTargets = [...targetPoints].sort((a, b) => a.y - b.y);
  const topTarget = sortedTargets[0];
  const bottomTarget = sortedTargets[sortedTargets.length - 1];

  for (const match of greedyResult.matches) {
    if (match.accuracy === 'correct') {
      matches.push(match);
      correctCount++;
    } else if (match.accuracy === 'close') {
      matches.push(match);
      closeCount++;
    } else {
      // 1. Controleer eerst of het punt langs een van de gedefinieerde aanhechtingslijnen ligt (bijv. Linea alba)
      let lineMatched = false;
      for (const line of matchingLines) {
        const lineTolCorrect = line.tolerance || 0.016;
        const lineTolClose = lineTolCorrect * 1.5;
        const polyRes = distanceToPolyline(match.userPoint, line.points);
        if (polyRes.distance < lineTolCorrect) {
          matches.push({
            userPoint: match.userPoint,
            targetPoint: polyRes.projection,
            distance: polyRes.distance,
            accuracy: 'correct',
            targetType,
            matchedLineName: line.name,
          });
          correctCount++;
          lineMatched = true;
          break;
        } else if (polyRes.distance <= lineTolClose) {
          matches.push({
            userPoint: match.userPoint,
            targetPoint: polyRes.projection,
            distance: polyRes.distance,
            accuracy: 'close',
            targetType,
            matchedLineName: line.name,
          });
          closeCount++;
          lineMatched = true;
          break;
        }
      }

      if (lineMatched) continue;

      // 2. Controleer of dit punt op het span-traject tussen boven- en ondergrens ligt
      if (targetPoints.length >= 2) {
        const distToSpan = distanceToSegment(match.userPoint, topTarget, bottomTarget);
        const proj = projectToSegment(match.userPoint, topTarget, bottomTarget);
        if (distToSpan < toleranceCorrect) {
          matches.push({
            userPoint: match.userPoint,
            targetPoint: proj,
            distance: distToSpan,
            accuracy: 'correct',
            targetType,
          });
          correctCount++;
          continue;
        } else if (distToSpan <= toleranceClose) {
          matches.push({
            userPoint: match.userPoint,
            targetPoint: proj,
            distance: distToSpan,
            accuracy: 'close',
            targetType,
          });
          closeCount++;
          continue;
        }
      }

      matches.push(match);
    }
  }

  const isPassed = correctCount >= requiredCount;

  return {
    matches,
    requiredCount,
    correctCount,
    closeCount,
    isPassed,
  };
}

/**
 * Converteert client (scherm) coördinaten van een PointerEvent naar genormaliseerde coördinaten (0.0 tot 1.0)
 * gebaseerd op de bounding client rect van de skeletcontainer.
 */
export function clientToNormalized(
  clientX: number,
  clientY: number,
  containerRect: DOMRect
): Point2D {
  const rawX = (clientX - containerRect.left) / containerRect.width;
  const rawY = (clientY - containerRect.top) / containerRect.height;

  // Clampt netjes binnen [0, 1] en rondt af op 4 decimalen
  const clampedX = Math.max(0, Math.min(1, rawX));
  const clampedY = Math.max(0, Math.min(1, rawY));

  return {
    x: Number(clampedX.toFixed(4)),
    y: Number(clampedY.toFixed(4)),
  };
}

/**
 * Berekent de SVG 'd' string voor een vloeiend of recht spierverloop pad
 */
export function pointsToSvgPath(points: Point2D[], scaleX: number = 1000, scaleY: number = 2374.54): string {
  if (points.length === 0) return '';
  if (points.length === 1) {
    const x = points[0].x * scaleX;
    const y = points[0].y * scaleY;
    return `M ${x} ${y} L ${x + 0.1} ${y + 0.1}`;
  }

  // Bouw een rechte of soepele polylijn
  let d = `M ${points[0].x * scaleX} ${points[0].y * scaleY}`;
  for (let i = 1; i < points.length; i++) {
    d += ` L ${points[i].x * scaleX} ${points[i].y * scaleY}`;
  }
  return d;
}

export interface MuscleConnection {
  orig: Point2D;
  ins: Point2D;
  oIdx: number;
  iIdx: number;
}

function getPartPrefix(name?: string): string | null {
  if (!name) return null;
  const nameLower = name.toLowerCase();
  const prefixes = [
    'pars descendens',
    'pars transversa',
    'pars ascendens',
    'caput longum',
    'caput breve',
    'caput mediale',
    'caput laterale',
  ];
  for (const p of prefixes) {
    if (nameLower.startsWith(p) || nameLower.includes(p)) {
      return p;
    }
  }
  return null;
}

function calcEuclideanDist(p1: Point2D, p2: Point2D): number {
  const dx = (p1.x - p2.x) * SKELETON_ASPECT_RATIO;
  const dy = p1.y - p2.y;
  return Math.sqrt(dx * dx + dy * dy);
}

/**
 * Berekent de verbindingen tussen origo's en inserties.
 * Maakt gebruik van een globaal optimalisatie-algoritme (min-sum bipartite matching)
 * in plaats van lokaal greedy:
 * Hierdoor wordt de totale / gemiddelde lengte van alle spierlijnen geminimaliseerd,
 * waardoor lijnen netjes evenwijdig lopen en niet kriskras over elkaar heen kruisen
 * (bijv. bij m. obliquus externus abdominis).
 */
export function getMuscleConnections(origins: Point2D[], insertions: Point2D[]): MuscleConnection[] {
  if (!origins || !insertions || origins.length === 0 || insertions.length === 0) {
    return [];
  }

  // Eenvoudige spieren met 1 origo of 1 insertie
  if (origins.length === 1) {
    return insertions.map((ins, iIdx) => ({ orig: origins[0], ins, oIdx: 0, iIdx }));
  }
  if (insertions.length === 1) {
    return origins.map((orig, oIdx) => ({ orig, ins: insertions[0], oIdx, iIdx: 0 }));
  }

  const connections: MuscleConnection[] = [];
  const matchedO = new Set<number>();
  const matchedI = new Set<number>();

  // 1. Anatomische part matching (bijv. Pars descendens -> Pars descendens)
  for (let o = 0; o < origins.length; o++) {
    const oPref = getPartPrefix(origins[o].name);
    if (!oPref) continue;
    for (let i = 0; i < insertions.length; i++) {
      if (matchedI.has(i)) continue;
      const iPref = getPartPrefix(insertions[i].name);
      if (oPref === iPref) {
        matchedO.add(o);
        matchedI.add(i);
        connections.push({
          orig: origins[o],
          ins: insertions[i],
          oIdx: o,
          iIdx: i,
        });
        break;
      }
    }
  }

  const remO: number[] = [];
  for (let o = 0; o < origins.length; o++) {
    if (!matchedO.has(o)) remO.push(o);
  }

  const remI: number[] = [];
  for (let i = 0; i < insertions.length; i++) {
    if (!matchedI.has(i)) remI.push(i);
  }

  if (remO.length === 0 || remI.length === 0) {
    return connections;
  }

  const M = remO.length;
  const N = remI.length;

  if (M <= N) {
    // Elk van de N inserties wordt gekoppeld aan een origo (0..M-1),
    // zodanig dat alle M origo's minimaal 1x worden gebruikt en de totale som van afstanden minimaal is.
    let bestAssignment: number[] = [];
    let bestCost = Infinity;

    const currentAssignment: number[] = new Array(N).fill(0);
    const usedCount: number[] = new Array(M).fill(0);

    const search = (pos: number, currentSum: number) => {
      if (currentSum >= bestCost) return;
      if (pos === N) {
        for (let m = 0; m < M; m++) {
          if (usedCount[m] === 0) return;
        }
        bestCost = currentSum;
        bestAssignment = [...currentAssignment];
        return;
      }

      for (let m = 0; m < M; m++) {
        const d = calcEuclideanDist(origins[remO[m]], insertions[remI[pos]]);
        currentAssignment[pos] = m;
        usedCount[m]++;
        search(pos + 1, currentSum + d);
        usedCount[m]--;
      }
    };

    search(0, 0);

    for (let pos = 0; pos < N; pos++) {
      const oIdx = remO[bestAssignment[pos]];
      const iIdx = remI[pos];
      connections.push({
        orig: origins[oIdx],
        ins: insertions[iIdx],
        oIdx,
        iIdx,
      });
    }
  } else {
    // M > N: Elk van de M origo's wordt gekoppeld aan een insertie (0..N-1),
    // zodanig dat alle N inserties minimaal 1x worden gebruikt en de totale som minimaal is.
    let bestAssignment: number[] = [];
    let bestCost = Infinity;

    const currentAssignment: number[] = new Array(M).fill(0);
    const usedCount: number[] = new Array(N).fill(0);

    const search = (pos: number, currentSum: number) => {
      if (currentSum >= bestCost) return;
      if (pos === M) {
        for (let n = 0; n < N; n++) {
          if (usedCount[n] === 0) return;
        }
        bestCost = currentSum;
        bestAssignment = [...currentAssignment];
        return;
      }

      for (let n = 0; n < N; n++) {
        const d = calcEuclideanDist(origins[remO[pos]], insertions[remI[n]]);
        currentAssignment[pos] = n;
        usedCount[n]++;
        search(pos + 1, currentSum + d);
        usedCount[n]--;
      }
    };

    search(0, 0);

    for (let pos = 0; pos < M; pos++) {
      const oIdx = remO[pos];
      const iIdx = remI[bestAssignment[pos]];
      connections.push({
        orig: origins[oIdx],
        ins: insertions[iIdx],
        oIdx,
        iIdx,
      });
    }
  }

  return connections;
}
