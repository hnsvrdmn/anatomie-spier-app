import { Point2D, MatchAccuracy, MatchResult, AttachmentLine } from '../types/anatomy';

// Toleranties volgens PMT-specificaties (afgestemd op de getekende botcontouren zoals condyli en tuberositates)
export const TOLERANCE_CORRECT = 0.020; // ~3.4 cm op een 170 cm skelet (dekt precies een getekende condylus/tuberositas)
export const TOLERANCE_CLOSE = 0.035;   // ~5.9 cm op een 170 cm skelet

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
  missingVertebraeTip?: string;
}

export interface DistinctTarget {
  key: string;
  name: string;
  points: Point2D[];
  line?: AttachmentLine;
  lines?: AttachmentLine[];
  zoneId: string;
  isZone: boolean;
}

/**
 * Bepaalt de overkoepelende anatomische zone voor een aanhechtingspunt of lijn.
 * Dit groepeert bijv. thoracale en lumbale wervels tot één wervelzone,
 * en ribsegmenten tot één ribzone, zodat een student flexibel meerdere of minder
 * punten langs een zone mag zetten zolang elke unieke zone maar minimaal 1x geraakt is.
 */
export function resolveZoneKey(name: string = '', lineName?: string, explicitZone?: string): string {
  if (explicitZone) return explicitZone.toLowerCase().trim();

  const text = `${name} ${lineName || ''}`.toLowerCase();

  // Trapezius onderdelen hebben elk hun eigen anatomische zone
  if (text.includes('pars descendens')) return 'zone_trapezius_descendens';
  if (text.includes('pars transversa')) return 'zone_trapezius_transversa';
  if (text.includes('pars ascendens')) return 'zone_trapezius_ascendens';

  // Wervels & wervelkolom (cervicaal, thoracaal, lumbaal, wervels, proc. spinosus, proc. transversus)
  if (
    text.includes('wervel') ||
    text.includes('vertebra') ||
    text.includes('spinosus') ||
    text.includes('transversus van') ||
    text.includes('cervica') ||
    text.includes('thoraca') ||
    text.includes('lumba') ||
    text.includes('t1-') ||
    text.includes('t3-') ||
    text.includes('t7') ||
    text.includes('t12') ||
    text.includes('th1') ||
    text.includes('th7') ||
    text.includes('l1-') ||
    text.includes('l5')
  ) {
    return 'zone_vertebrae';
  }
  // Os ilium / fossa iliaca
  if (text.includes('os ilium') || text.includes('fossa iliaca') || text.includes('ventrale vlak os ilium')) {
    return 'zone_os_ilium';
  }
  // Sacrum & coccygis afzonderlijk (twee verschillende botstructuren)
  if (text.includes('coccyg') || text.includes('stuit')) {
    return 'zone_os_coccygis';
  }
  if (text.includes('sacrum') || text.includes('heiligbeen')) {
    return 'zone_os_sacrum';
  }
  // Crista iliaca
  if (text.includes('crista iliaca')) {
    return 'zone_crista_iliaca';
  }
  // SIAS / SIAI / SIPS
  if (text.includes('sias')) return 'zone_sias';
  if (text.includes('siai')) return 'zone_siai';
  if (text.includes('sips')) return 'zone_sips';
  // Ribben (costae)
  if (text.includes('costa') || text.includes('rib')) {
    return 'zone_costae';
  }
  // Linea alba
  if (text.includes('linea alba')) {
    return 'zone_linea_alba';
  }
  // Scapula hoeken & rand afzonderlijk
  if (text.includes('angulus superior')) return 'zone_angulus_superior_scapula';
  if (text.includes('angulus inferior')) return 'zone_angulus_inferior_scapula';
  if (text.includes('margo medialis')) return 'zone_margo_medialis_scapula';
  // Os pubis
  if (text.includes('os pubis')) return 'zone_os_pubis';
  // Os ischii / tuber ischiadicum
  if (text.includes('tuber ischiadicum')) return 'zone_tuber_ischiadicum';
  if (text.includes('os ischii')) return 'zone_os_ischii';
  // Corpus femoris & trochanters
  if (text.includes('corpus femoris')) return 'zone_corpus_femoris';
  if (text.includes('trochanter major')) return 'zone_trochanter_major';
  if (text.includes('trochanter minor')) return 'zone_trochanter_minor';
  // Corpus fibula & corpus tibia
  if (text.includes('corpus fibula') || text.includes('zijde fibula') || text.includes('vlak corpus fibula')) {
    return 'zone_corpus_fibula';
  }
  if (text.includes('corpus tibia') || text.includes('zijde tibia') || text.includes('vlak corpus tibia')) {
    return 'zone_corpus_tibia';
  }
  // Clavicula / Sternum / Acromion / Spina scapula
  if (text.includes('clavicula')) return 'zone_clavicula';
  if (text.includes('sternum')) return 'zone_sternum';
  if (text.includes('acromion')) return 'zone_acromion';
  if (text.includes('spina scapula')) return 'zone_spina_scapula';

  // Standaard fallback: de genormaliseerde lijnsnaam of puntnaam
  return lineName ? lineName.toLowerCase().trim() : name.toLowerCase().trim();
}

/**
 * Schoon een aanhechtingsnaam op door toevoegingen zoals (craniaal), (caudaal), (boven), (onder) etc. te strippen.
 * Hierdoor worden punten met dezelfde basisnaam (bijv. "margo medialis scapula") als hetzelfde doel herkend.
 */
export function getBaseAttachmentName(name?: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .trim()
    .replace(/\s*\([^)]*\)/g, '')
    .replace(/^[-–—•\s]+/, '')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Berekent de unieke groeperingssleutel voor een aanhechtingspunt.
 * Punten die anatomisch of qua naam bij elkaar horen (of letterlijk dezelfde naam hebben)
 * delen dezelfde sleutel. Hierdoor hoeft de student er maar één van te plaatsen!
 */
export function getAttachmentGroupingKey(pt: Point2D, lineName?: string): string {
  const zone = resolveZoneKey(pt.name || '', lineName, pt.zone);
  if (zone && zone.startsWith('zone_')) {
    return zone;
  }
  const baseName = getBaseAttachmentName(pt.name || lineName || '');
  if (baseName) {
    return `name_${baseName}`;
  }
  return `pt_${(pt.name || '').trim().toLowerCase()}`;
}

/**
 * Groepeert doelpunten en aanhechtingslijnen tot unieke anatomische doelen.
 * Als meerdere origo's of inserties dezelfde naam of zone hebben, worden ze
 * samengevoegd in één DistinctTarget. De student hoeft er dan maar één van te plaatsen!
 */
export function getDistinctTargets(
  targetPoints: Point2D[] = [],
  attachmentLines: AttachmentLine[] = [],
  targetType: 'origin' | 'insertion' | 'path' = 'origin'
): DistinctTarget[] {
  const matchingLines = (attachmentLines || []).filter(
    (l) => l.type === targetType && l.points && l.points.length >= 2
  );

  const targetMap = new Map<string, DistinctTarget>();

  targetPoints.forEach((pt) => {
    const rawName = (pt.name || '').trim();
    const basePtName = getBaseAttachmentName(rawName);
    const matchedLinesForPt = rawName
      ? matchingLines.filter((l) => {
          const lName = (l.name || '').trim().toLowerCase();
          const baseLName = getBaseAttachmentName(l.name);
          return (
            lName === rawName.toLowerCase() ||
            (basePtName.length > 0 && baseLName === basePtName)
          );
        })
      : [];
    const matchedLine = matchedLinesForPt[0];
    const groupingKey = getAttachmentGroupingKey(pt, matchedLine?.name);
    const zoneId = resolveZoneKey(rawName, matchedLine?.name, pt.zone);
    const isZone = matchedLinesForPt.length > 0 || !!pt.zone || zoneId.startsWith('zone_');

    if (targetMap.has(groupingKey)) {
      const existing = targetMap.get(groupingKey)!;
      existing.points.push(pt);
      if (matchedLinesForPt.length > 0) {
        if (!existing.lines) existing.lines = existing.line ? [existing.line] : [];
        for (const ml of matchedLinesForPt) {
          if (!existing.lines.some((l) => l.id === ml.id)) {
            existing.lines.push(ml);
          }
        }
        if (!existing.line) existing.line = matchedLinesForPt[0];
        existing.isZone = true;
      }
    } else {
      targetMap.set(groupingKey, {
        key: groupingKey,
        name: rawName,
        points: [pt],
        line: matchedLine,
        lines: [...matchedLinesForPt],
        zoneId,
        isZone,
      });
    }
  });

  const targets: DistinctTarget[] = Array.from(targetMap.values());

  // Indien er slechts 1 uniek doelpunt is en 1 lijn van hetzelfde type zonder exacte naammatch, koppel ze
  if (targets.length === 1 && !targets[0].line && matchingLines.length === 1) {
    targets[0].line = matchingLines[0];
    targets[0].lines = [matchingLines[0]];
    targets[0].isZone = true;
    targets[0].zoneId = resolveZoneKey(targets[0].name, matchingLines[0].name, targets[0].points[0]?.zone);
  }

  // Voor werveldoelen met >= 2 discrete punten maar zonder gekoppelde lijn (zoals m. trapezius partes):
  // genereer automatisch een doorlopende wervellijn tussen de wervelpunten zodat ook tussenliggende wervels geldig zijn.
  targets.forEach((t) => {
    const hasValidLine = (t.lines && t.lines.some((l) => l.points && l.points.length >= 2)) || (t.line && t.line.points && t.line.points.length >= 2);
    const isVert =
      t.zoneId === 'zone_vertebrae' ||
      t.zoneId.startsWith('zone_trapezius_') ||
      (t.name && (t.name.toLowerCase().includes('wervel') || t.name.toLowerCase().includes('spinosus') || t.name.toLowerCase().includes('vertebra')));
    if (isVert && !hasValidLine && t.points.length >= 2 && (targetType === 'origin' || targetType === 'insertion')) {
      const sortedPts = [...t.points].sort((a, b) => a.y - b.y);
      const virtualLine: AttachmentLine = {
        id: `virtual-spine-${t.key}`,
        name: t.name,
        type: targetType,
        points: sortedPts,
        tolerance: 0.026,
      };
      t.line = virtualLine;
      t.lines = [virtualLine];
      t.isZone = true;
    }
  });

  // Indien er geen discrete punten zijn maar wel lijnen
  if (targets.length === 0 && matchingLines.length > 0) {
    matchingLines.forEach((line, idx) => {
      const rawName = (line.name || '').trim();
      const key = `__line_${idx}`;
      const zoneId = resolveZoneKey(rawName, line.name);
      targets.push({
        key,
        name: rawName,
        points: [],
        line,
        lines: [line],
        zoneId,
        isZone: true,
      });
    });
  }

  return targets;
}

/**
 * Geeft het aantal unieke anatomische aanhechtingsdoelen voor een zijde terug.
 * Als meerdere punten dezelfde naam of zone hebben, telt dit als 1 doel.
 */
export function getDistinctTargetCount(
  points?: Point2D[],
  attachmentLines?: AttachmentLine[],
  targetType?: 'origin' | 'insertion' | 'path'
): number {
  if (!points || points.length === 0) return 1;
  const targets = getDistinctTargets(points, attachmentLines || [], targetType || 'origin');
  return Math.max(1, targets.length);
}

/**
 * Evalueert een set gebruikerspunten tegen unieke anatomische doelen en zones:
 * - Korte/kleine botpunten (zoals condylus, SIAS, SIAI, tuberositas, olecranon) worden als punt geëvalueerd.
 * - Lange botregio's en zones (zoals wervels, crista iliaca, ribben, linea alba, margo medialis scapulae)
 *   staan toe dat een student flexibel één of meerdere punten plaatst.
 * - ZOLANG ELKE UNIEKE ANATOMISCHE ZONE MAAR MINIMAAL 1x CORRECT IS GERAAKT
 *   (bijv. bij m. iliopsoas: minimaal 1 punt op wervels EN minimaal 1 punt op os ilium).
 */
export function evaluatePointSet(
  userPoints: Point2D[],
  targetPoints: Point2D[],
  targetType: 'origin' | 'insertion' | 'path',
  toleranceCorrect: number = TOLERANCE_CORRECT,
  attachmentLines?: AttachmentLine[],
  requireAllVertebrae: boolean = false
): EvaluationSetResult {
  const distinctTargets = getDistinctTargets(targetPoints, attachmentLines || [], targetType);

  if (distinctTargets.length === 0) {
    return {
      matches: [],
      requiredCount: 0,
      correctCount: 0,
      closeCount: 0,
      isPassed: true,
    };
  }

  // Bepaal alle overkoepelende anatomische zones die geraakt moeten worden
  const requiredZones = new Set<string>();
  distinctTargets.forEach((t) => {
    requiredZones.add(t.zoneId || t.key);
  });
  const requiredCount = requiredZones.size;

  const ptTolCorrect = toleranceCorrect;
  const ptTolClose = Math.max(TOLERANCE_CLOSE, toleranceCorrect * 1.6);

  // Hulpfunctie om één gebruikerspunt te testen tegen één DistinctTarget (punt + optionele botzone)
  const evalAgainstTarget = (upt: Point2D, target: DistinctTarget): MatchResult => {
    let bestDist = Infinity;
    let bestTargetPt: Point2D = target.points[0] || { ...upt };
    let bestAcc: MatchAccuracy = 'incorrect';
    let bestNormScore = Infinity; // distance / tolCorrect (voor eerlijke vergelijking tussen punt en zone)
    let matchedLineName: string | undefined;

    for (const pt of target.points) {
      const d = calculateDistance(upt, pt);
      const acc = getAccuracy(d, ptTolCorrect, ptTolClose);
      const norm = d / ptTolCorrect;
      if (norm < bestNormScore) {
        bestNormScore = norm;
        bestDist = d;
        bestTargetPt = pt;
        bestAcc = acc;
        matchedLineName = undefined;
      }
    }

    const linesToEval = (target.lines && target.lines.length > 0)
      ? target.lines
      : (target.line ? [target.line] : []);

    for (const line of linesToEval) {
      if (line.points && line.points.length >= 2) {
        // Gebruik de specifieke lijntolerantie (of de gekozen modus-tolerantie) zonder kunstmatig opblazen
        const lineTolCorrect = line.tolerance ? Math.min(line.tolerance, toleranceCorrect) : toleranceCorrect;
        const lineTolClose = lineTolCorrect * 1.5;
        const polyRes = distanceToPolyline(upt, line.points);
        const lineAcc = getAccuracy(polyRes.distance, lineTolCorrect, lineTolClose);
        const norm = polyRes.distance / lineTolCorrect;

        // Geef voorrang aan de zone als deze een betere accuracy geeft of relatief dichterbij ligt
        const accRank = (a: MatchAccuracy) => (a === 'correct' ? 0 : a === 'close' ? 1 : 2);
        if (
          accRank(lineAcc) < accRank(bestAcc) ||
          (accRank(lineAcc) === accRank(bestAcc) && norm < bestNormScore)
        ) {
          bestNormScore = norm;
          bestDist = polyRes.distance;
          bestTargetPt = polyRes.projection;
          bestAcc = lineAcc;
          matchedLineName = line.name;
        }
      }
    }

    return {
      userPoint: upt,
      targetPoint: bestTargetPt,
      distance: bestDist,
      accuracy: bestAcc,
      targetType,
      matchedLineName,
    };
  };

  // Koppel gebruikerspunten optimaal aan doelen
  const matchedUserIndices = new Set<number>();
  const matchedTargetIndices = new Set<number>();
  const satisfiedZones = new Set<string>();
  const resultsByUserIdx = new Map<number, MatchResult>();

  // Bereken alle mogelijke paren (userIdx, targetIdx)
  interface CandidatePair {
    uIdx: number;
    tIdx: number;
    res: MatchResult;
    rank: number;
  }

  const pairs: CandidatePair[] = [];
  for (let uIdx = 0; uIdx < userPoints.length; uIdx++) {
    for (let tIdx = 0; tIdx < distinctTargets.length; tIdx++) {
      const res = evalAgainstTarget(userPoints[uIdx], distinctTargets[tIdx]);
      const rank = res.accuracy === 'correct' ? 0 : res.accuracy === 'close' ? 1 : 2;
      pairs.push({ uIdx, tIdx, res, rank });
    }
  }

  // Sorteer op beste accuracy (correct -> close -> incorrect) en daarbinnen kleinste afstand
  pairs.sort((a, b) => {
    if (a.rank !== b.rank) return a.rank - b.rank;
    return a.res.distance - b.res.distance;
  });

  // Pas 1: 1-op-1 toewijzing om zoveel mogelijk unieke doelen en zones te dekken
  for (const pair of pairs) {
    if (matchedUserIndices.has(pair.uIdx) || matchedTargetIndices.has(pair.tIdx)) continue;
    matchedUserIndices.add(pair.uIdx);
    matchedTargetIndices.add(pair.tIdx);
    resultsByUserIdx.set(pair.uIdx, pair.res);
    if (pair.res.accuracy === 'correct') {
      const tgt = distinctTargets[pair.tIdx];
      satisfiedZones.add(tgt.zoneId || tgt.key);
    }
  }

  // Pas 2: voor resterende geplaatste punten (bijv. student heeft meerdere punten langs dezelfde zone gezet)
  for (let uIdx = 0; uIdx < userPoints.length; uIdx++) {
    if (matchedUserIndices.has(uIdx)) continue;

    // Test of dit extra punt binnen een geldige zone (met lijn of isZone) valt
    let bestZoneRes: MatchResult | null = null;
    let bestZoneDist = Infinity;
    let matchedZoneTarget: DistinctTarget | null = null;

    for (let tIdx = 0; tIdx < distinctTargets.length; tIdx++) {
      const tgt = distinctTargets[tIdx];
      if (tgt.isZone || tgt.line) {
        const res = evalAgainstTarget(userPoints[uIdx], tgt);
        if (res.accuracy === 'correct' || res.accuracy === 'close') {
          if (res.distance < bestZoneDist) {
            bestZoneDist = res.distance;
            bestZoneRes = res;
            matchedZoneTarget = tgt;
          }
        }
      }
    }

    if (bestZoneRes && matchedZoneTarget) {
      // Dit extra punt ligt netjes op een geldige zone (bijv. extra wervelpunt of extra ribpunt)!
      matchedUserIndices.add(uIdx);
      resultsByUserIdx.set(uIdx, bestZoneRes);
      if (bestZoneRes.accuracy === 'correct') {
        satisfiedZones.add(matchedZoneTarget.zoneId || matchedZoneTarget.key);
      }
    } else {
      // Test of het punt binnen een vergevingsgezinde zonebuffer valt (bijv. net naast de rand van rib of wervel)
      let fallbackZoneRes: MatchResult | null = null;
      for (let tIdx = 0; tIdx < distinctTargets.length; tIdx++) {
        const tgt = distinctTargets[tIdx];
        if (tgt.line || tgt.isZone) {
          const res = evalAgainstTarget(userPoints[uIdx], tgt);
          if (res.distance <= ptTolClose) {
            fallbackZoneRes = {
              ...res,
              accuracy: 'close',
            };
            break;
          }
        }
      }

      if (fallbackZoneRes) {
        matchedUserIndices.add(uIdx);
        resultsByUserIdx.set(uIdx, fallbackZoneRes);
      } else {
        // Het punt valt buiten alle geldige doelen en zones: telt als incorrect/fout
        let closestRes: MatchResult | null = null;
        for (let tIdx = 0; tIdx < distinctTargets.length; tIdx++) {
          const res = evalAgainstTarget(userPoints[uIdx], distinctTargets[tIdx]);
          if (!closestRes || res.distance < closestRes.distance) {
            closestRes = res;
          }
        }
        resultsByUserIdx.set(uIdx, {
          userPoint: userPoints[uIdx],
          targetPoint: closestRes ? closestRes.targetPoint : userPoints[uIdx],
          distance: closestRes ? closestRes.distance : 1.0,
          accuracy: 'incorrect',
          targetType,
          matchedLineName: closestRes?.matchedLineName,
        });
      }
    }
  }

  const matches: MatchResult[] = [];
  let correctCount = 0;
  let closeCount = 0;

  for (let uIdx = 0; uIdx < userPoints.length; uIdx++) {
    const m = resultsByUserIdx.get(uIdx)!;
    matches.push(m);
    if (m.accuracy === 'correct') correctCount++;
    else if (m.accuracy === 'close') closeCount++;
  }

  // Slaagconditie:
  // 1. Alle unieke anatomische zones moeten minimaal 1x correct geraakt zijn
  //    (bijv. bij iliopsoas: minimaal 1 op wervels én minimaal 1 op os ilium).
  // 2. Er mogen géén flagrant foute punten buiten de anatomische zones geplaatst zijn.
  //    Bij uitgebreide aanhechtingen (>= 4 punten, zoals serratus anterior langs ribben of trapezius langs wervels)
  //    wordt 1 klein randpuntje vergeven mits alle verplichte zones gedekt zijn en correctCount >= requiredCount.
  // Wervelrij validatie: minimaal eerste én laatste wervel (of alle wervels als toggle aan staat)
  let missingVertebraeTip: string | undefined;
  let vertebraeConditionMet = true;

  for (const t of distinctTargets) {
    const allNamesLower = [t.name, ...t.points.map((p) => p.name || '')].join(' ').toLowerCase();
    const isVertebral =
      (t.zoneId && (t.zoneId.startsWith('zone_vertebrae') || t.zoneId.startsWith('zone_trapezius_'))) ||
      allNamesLower.includes('wervel') ||
      allNamesLower.includes('spinosus') ||
      allNamesLower.includes('vertebra');
    if (!isVertebral) continue;

    // Controleer of dit daadwerkelijk een reeks/meervoud van wervels is, en NIET één losse wervel
    // (zoals bij een landmark-vraag voor enkel 'processus spinosus 7e cervicale vertebra' of '12e vertebra thoracalis')
    const isMultiVertebraSeries =
      t.points.length >= 2 ||
      allNamesLower.includes('wervels') ||
      allNamesLower.includes('vertebrae') ||
      allNamesLower.includes('alle') ||
      /\d+\s*e?\s*[-–tot]+\s*\d+/.test(allNamesLower);
    if (!isMultiVertebraSeries) continue;

    const lines = (t.lines && t.lines.length > 0) ? t.lines : (t.line ? [t.line] : []);
    const validLines = lines.filter((l) => l.points && l.points.length >= 2);
    if (validLines.length === 0) continue;

    // Verzamel alle punten van zowel de doorlopende lijnen als de discrete doelpunten in dit wervelsegment
    const allLinePts = validLines.flatMap((l) => l.points || []);
    const sortedLinePts = [...allLinePts].sort((a, b) => a.y - b.y);
    const firstLinePt = sortedLinePts[0];
    const lastLinePt = sortedLinePts[sortedLinePts.length - 1];

    const sortedTargetPts = [...t.points].sort((a, b) => a.y - b.y);
    const firstTargetPt = sortedTargetPts[0] || firstLinePt;
    const lastTargetPt = sortedTargetPts[sortedTargetPts.length - 1] || lastLinePt;

    const minY = Math.min(firstLinePt.y, firstTargetPt.y);
    const maxY = Math.max(lastLinePt.y, lastTargetPt.y);
    const span = maxY - minY;
    if (span < 0.035) continue; // Geen doorlopende rij wervels, maar een enkele wervel

    // Belangrijk: filter gebruikerspunten op de specifieke pars (indien van toepassing bij m. trapezius)
    // zodat punten van pars transversa niet per ongeluk als first/last van pars descendens meetellen!
    let partKey: string | undefined;
    if (allNamesLower.includes('descendens')) partKey = 'descendens';
    else if (allNamesLower.includes('transversa')) partKey = 'transversa';
    else if (allNamesLower.includes('ascendens')) partKey = 'ascendens';

    const candidateUserPoints = partKey
      ? userPoints.filter((up) => (up.name || '').toLowerCase().includes(partKey!))
      : userPoints;

    // Punten die vallen op één van de geldige wervellijnen of discrete werveldoelpunten
    const matchedPts = candidateUserPoints.filter((up) => {
      const onLine = validLines.some((l) => {
        const poly = distanceToPolyline(up, l.points!);
        return poly.distance <= Math.max(l.tolerance || 0.030, ptTolClose * 1.3);
      });
      const onTargetPt = t.points.some((tp) => calculateDistance(up, tp) <= ptTolClose * 1.2);
      return onLine || onTargetPt;
    });

    if (requireAllVertebrae) {
      const expectedCount = partKey === 'descendens'
        ? 5
        : partKey === 'transversa'
        ? 3
        : partKey === 'ascendens'
        ? 7
        : Math.max(2, Math.round(span / 0.024));
      if (matchedPts.length < expectedCount) {
        vertebraeConditionMet = false;
        satisfiedZones.delete(t.zoneId || t.key);
        missingVertebraeTip = `Optie 'Alle wervels vereisen' staat aan: plaats minimaal ${expectedCount} punten langs de wervelkolom (${t.name}).`;
      }
    } else {
      // Zorg dat zowel het lijnuiteinde (firstLinePt/lastLinePt) als het discrete doelpunt (firstTargetPt/lastTargetPt)
      // voor de eerste en laatste wervel als geldig eindpunt wordt geaccepteerd!
      const tolEnd = Math.max(0.020, Math.min(0.026, span * 0.30));
      const hasMultipleTargetPts = sortedTargetPts.length >= 2;
      const topLimitY = (hasMultipleTargetPts ? Math.max(firstLinePt.y, firstTargetPt.y) : firstLinePt.y) + tolEnd;
      const bottomLimitY = (hasMultipleTargetPts ? Math.min(lastLinePt.y, lastTargetPt.y) : lastLinePt.y) - tolEnd;

      const hasFirst = matchedPts.some((up) =>
        calculateDistance(up, firstLinePt) <= tolEnd ||
        (hasMultipleTargetPts && calculateDistance(up, firstTargetPt) <= tolEnd) ||
        (up.y >= minY - tolEnd && up.y <= topLimitY)
      );
      const hasLast = matchedPts.some((up) =>
        calculateDistance(up, lastLinePt) <= tolEnd ||
        (hasMultipleTargetPts && calculateDistance(up, lastTargetPt) <= tolEnd) ||
        (up.y >= bottomLimitY && up.y <= maxY + tolEnd)
      );

      // Vereis daarnaast minimaal 2 geplaatste punten op de wervelrij met een reële onderlinge spreiding
      const ys = matchedPts.map((p) => p.y);
      const userSpan = ys.length >= 2 ? Math.max(...ys) - Math.min(...ys) : 0;
      const minRequiredSpan = partKey === 'transversa' ? 0.016 : partKey === 'descendens' ? 0.022 : Math.min(0.030, span * 0.35);

      if (!hasFirst || !hasLast || matchedPts.length < 2 || userSpan < minRequiredSpan) {
        vertebraeConditionMet = false;
        satisfiedZones.delete(t.zoneId || t.key);
        missingVertebraeTip = `Bij een wervelrij (${t.name}): klik minimaal de eerste én de laatste wervel aan (meer mag, minder niet).`;
      }
    }
  }

  const allZonesSatisfied = Array.from(requiredZones).every((z) => satisfiedZones.has(z));
  const incorrectCount = matches.filter((m) => m.accuracy === 'incorrect').length;
  // Geen foutieve (rood) of net-fout/rand (geel) punten toegestaan: fout is fout!
  const hasNoFlaws = incorrectCount === 0 && closeCount === 0;
  const isPassed = allZonesSatisfied && hasNoFlaws && vertebraeConditionMet && userPoints.length > 0;

  return {
    matches,
    requiredCount,
    correctCount,
    closeCount,
    isPassed,
    missingVertebraeTip,
  };
}

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

function getTrapeziusPart(name?: string): 'descendens' | 'transversa' | 'ascendens' | null {
  if (!name) return null;
  const nameLower = name.toLowerCase();
  if (nameLower.includes('descendens')) return 'descendens';
  if (nameLower.includes('transversa')) return 'transversa';
  if (nameLower.includes('ascendens')) return 'ascendens';
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

  // Als er sprake is van m. trapezius waarbij ZOWEL origo's als inserties zijn gelabeld per pars
  // (descendens, transversa, ascendens), koppel dan uitsluitend binnen dezelfde pars!
  const hasMatchingTrapeziusParts =
    origins.some(o => getTrapeziusPart(o.name)) &&
    insertions.some(i => getTrapeziusPart(i.name));

  if (hasMatchingTrapeziusParts) {
    const connections: MuscleConnection[] = [];
    const partes = ['descendens', 'transversa', 'ascendens'] as const;

    for (const part of partes) {
      const partOrigins: Array<{ orig: Point2D; oIdx: number }> = [];
      origins.forEach((orig, oIdx) => {
        if (getTrapeziusPart(orig.name) === part) {
          partOrigins.push({ orig, oIdx });
        }
      });

      const partInsertions: Array<{ ins: Point2D; iIdx: number }> = [];
      insertions.forEach((ins, iIdx) => {
        if (getTrapeziusPart(ins.name) === part) {
          partInsertions.push({ ins, iIdx });
        }
      });

      if (partOrigins.length === 0 || partInsertions.length === 0) {
        continue;
      }

      if (partInsertions.length === 1) {
        partOrigins.forEach(({ orig, oIdx }) => {
          connections.push({
            orig,
            ins: partInsertions[0].ins,
            oIdx,
            iIdx: partInsertions[0].iIdx,
          });
        });
      } else if (partOrigins.length === 1) {
        partInsertions.forEach(({ ins, iIdx }) => {
          connections.push({
            orig: partOrigins[0].orig,
            ins,
            oIdx: partOrigins[0].oIdx,
            iIdx,
          });
        });
      } else {
        partOrigins.forEach(({ orig, oIdx }) => {
          let closestIns = partInsertions[0];
          let minDist = calcEuclideanDist(orig, closestIns.ins);
          for (let k = 1; k < partInsertions.length; k++) {
            const d = calcEuclideanDist(orig, partInsertions[k].ins);
            if (d < minDist) {
              minDist = d;
              closestIns = partInsertions[k];
            }
          }
          connections.push({
            orig,
            ins: closestIns.ins,
            oIdx,
            iIdx: closestIns.iIdx,
          });
        });
      }
    }

    return connections;
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
    const oPref = getTrapeziusPart(origins[o].name);
    if (!oPref) continue;
    for (let i = 0; i < insertions.length; i++) {
      if (matchedI.has(i)) continue;
      const iPref = getTrapeziusPart(insertions[i].name);
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


/**
 * Controleert of een geplaatst punt voor m. trapezius anatomisch correct is
 * voor de geselecteerde pars (descendens, transversa, ascendens).
 */
export function isTrapeziusPointAccurate(
  pt: Point2D,
  type: 'origin' | 'insertion',
  part: 'descendens' | 'transversa' | 'ascendens'
): boolean {
  if (type === 'origin') {
    // Origo's liggen dorsaal mediaal op de wervelkolom (x ≈ 0.50)
    const isMidline = Math.abs(pt.x - 0.50) <= 0.095;
    if (!isMidline) return false;
    if (part === 'descendens') return pt.y >= 0.07 && pt.y <= 0.195;
    if (part === 'transversa') return pt.y >= 0.150 && pt.y <= 0.235;
    if (part === 'ascendens') return pt.y >= 0.200 && pt.y <= 0.365;
    return false;
  } else {
    // Insertie ligt lateraal op clavicula, acromion of spina scapulae (links of rechts)
    if (part === 'descendens') {
      const isLeft = Math.hypot((pt.x - 0.31) * SKELETON_ASPECT_RATIO, pt.y - 0.20) <= 0.105;
      const isRight = Math.hypot((pt.x - 0.69) * SKELETON_ASPECT_RATIO, pt.y - 0.20) <= 0.105;
      return isLeft || isRight;
    }
    if (part === 'transversa') {
      const isLeft = Math.hypot((pt.x - 0.275) * SKELETON_ASPECT_RATIO, pt.y - 0.205) <= 0.105;
      const isRight = Math.hypot((pt.x - 0.725) * SKELETON_ASPECT_RATIO, pt.y - 0.205) <= 0.105;
      return isLeft || isRight;
    }
    if (part === 'ascendens') {
      const isLeft = Math.hypot((pt.x - 0.36) * SKELETON_ASPECT_RATIO, pt.y - 0.21) <= 0.105;
      const isRight = Math.hypot((pt.x - 0.64) * SKELETON_ASPECT_RATIO, pt.y - 0.21) <= 0.105;
      return isLeft || isRight;
    }
    return false;
  }
}

/**
 * Spiegelt een lijst van AttachmentLines horizontaal naar de andere lichaamszijde (x -> 1.0 - x).
 */
export function mirrorAttachmentLines(lines?: AttachmentLine[]): AttachmentLine[] {
  if (!lines || lines.length === 0) return [];
  return lines.map((l) => ({
    ...l,
    id: l.id.includes('-right')
      ? l.id.replace('-right', '-left')
      : l.id.includes('-left')
      ? l.id.replace('-left', '-right')
      : `${l.id}-mirrored`,
    points: mirrorPoints(l.points || []),
  }));
}

/**
 * Verdeelt geplaatste gebruikerspunten in Vrije Intekenmodus over origo en insertie
 * op basis van minimale afstand tot de dichtstbijzijnde doelstructuur (punten en aanhechtingslijnen).
 */
export function partitionFreePoints(
  userPoints: Point2D[],
  targetOrigins: Point2D[] = [],
  targetInsertions: Point2D[] = [],
  attachmentLines: AttachmentLine[] = []
): { assignedOrigins: Point2D[]; assignedInsertions: Point2D[] } {
  if (targetOrigins.length === 0) {
    return { assignedOrigins: [], assignedInsertions: [...userPoints] };
  }
  if (targetInsertions.length === 0) {
    return { assignedOrigins: [...userPoints], assignedInsertions: [] };
  }

  const origLines = (attachmentLines || []).filter(
    (l) => l.type === 'origin' && l.points && l.points.length >= 2
  );
  const insLines = (attachmentLines || []).filter(
    (l) => l.type === 'insertion' && l.points && l.points.length >= 2
  );

  const getMinDistToTargets = (pt: Point2D, targets: Point2D[], lines: AttachmentLine[]): number => {
    let minD = Infinity;
    for (const t of targets) {
      const d = calculateDistance(pt, t);
      if (d < minD) minD = d;
    }
    for (const l of lines) {
      const poly = distanceToPolyline(pt, l.points!);
      if (poly.distance < minD) minD = poly.distance;
    }
    return minD;
  };

  const assignedOrigins: Point2D[] = [];
  const assignedInsertions: Point2D[] = [];

  for (const pt of userPoints) {
    const distOrig = getMinDistToTargets(pt, targetOrigins, origLines);
    const distIns = getMinDistToTargets(pt, targetInsertions, insLines);

    if (distOrig <= distIns) {
      assignedOrigins.push(pt);
    } else {
      assignedInsertions.push(pt);
    }
  }

  return { assignedOrigins, assignedInsertions };
}
