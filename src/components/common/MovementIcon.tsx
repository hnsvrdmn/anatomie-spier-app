import React from 'react';

interface MovementIconProps {
  movement: string;
  className?: string;
}

export const MovementIcon: React.FC<MovementIconProps> = ({ movement, className = 'w-4 h-4' }) => {
  const norm = movement.trim().toLowerCase();

  // 1. Flexie (buiging, gehoekte pijl naar binnen)
  if (norm.startsWith('flexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 19L11 12L7 8" />
        <path d="M11 12L19 12" />
        <polyline points="15 8 19 12 15 16" />
      </svg>
    );
  }

  // 2. Extensie (strekking, rechte pijl)
  if (norm.startsWith('extensie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12h14" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    );
  }

  // 3. Abductie (van lichaam af, pijl naar buiten/boven)
  if (norm.startsWith('abductie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="6" y1="18" x2="18" y2="6" />
        <polyline points="9 6 18 6 18 15" />
      </svg>
    );
  }

  // 4. Adductie (naar lichaam toe, pijl naar binnen/beneden)
  if (norm.startsWith('adductie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="18" y1="6" x2="6" y2="18" />
        <polyline points="15 18 6 18 6 9" />
      </svg>
    );
  }

  // 5. Anteflexie (voorwaarts heffen, omhoog gerichte pijl)
  if (norm.startsWith('anteflexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="6 11 12 5 18 11" />
      </svg>
    );
  }

  // 6. Retroflexie (achterwaarts heffen, pijl naar achter/onder)
  if (norm.startsWith('retroflexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 8c0 4.4-3.6 8-8 8H5" />
        <polyline points="9 12 5 16 9 20" />
      </svg>
    );
  }

  // 7. Endorotatie (naar binnen draaien, halve boogpijl naar binnen)
  if (norm.startsWith('endorotatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 12a7 7 0 0 0-11-5.7" />
        <polyline points="8 3 8 7 12 7" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // 8. Exorotatie (naar buiten draaien, halve boogpijl naar buiten)
  if (norm.startsWith('exorotatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 12a7 7 0 0 1 11-5.7" />
        <polyline points="16 3 16 7 12 7" />
        <circle cx="12" cy="12" r="1.5" fill="currentColor" />
      </svg>
    );
  }

  // 9. Supinatie (open draaien van handpalm/onderarm, kommetje)
  if (norm === 'supinatie') {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M4 14a8 8 0 0 0 16 0" />
        <polyline points="16 10 20 14 16 18" />
        <line x1="8" y1="6" x2="16" y2="6" />
      </svg>
    );
  }

  // 10. Eversie (pronatie) (buitenrand voet omhoog, pijl naar lateraal-boven)
  if (norm.includes('eversie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M5 17h10a4 4 0 0 0 4-4V7" />
        <polyline points="15 10 19 6 23 10" />
      </svg>
    );
  }

  // 11. Inversie (supinatie) (binnenrand voet omhoog, pijl naar mediaal-boven)
  if (norm.includes('inversie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M19 17H9a4 4 0 0 1-4-4V7" />
        <polyline points="9 10 5 6 1 10" />
      </svg>
    );
  }

  // 12. Dorsaalflexie (tenen omhoog, opwaartse teenhoek)
  if (norm.startsWith('dorsaalflexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18h8a4 4 0 0 0 4-4V6" />
        <polyline points="14 10 18 6 22 10" />
      </svg>
    );
  }

  // 13. Plantairflexie (tenen omlaag / op tenen staan)
  if (norm.startsWith('plantairflexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 6h8a4 4 0 0 1 4 4v8" />
        <polyline points="14 14 18 18 22 14" />
      </svg>
    );
  }

  // 14. Lateroflexie (zijwaartse buiging wervelkolom)
  if (norm.startsWith('lateroflexie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 20C6 11 12 5 18 5" />
        <polyline points="14 9 18 5 14 1" />
      </svg>
    );
  }

  // 15. Rotatie (draaiing wervelkolom)
  if (norm.startsWith('rotatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M21 12a9 9 0 1 1-3.3-7" />
        <polyline points="21 5 21 10 16 10" />
      </svg>
    );
  }

  // 16. Elevatie (schouder optrekken, dubbele pijl omhoog)
  if (norm.startsWith('elevatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7 11 12 6 17 11" />
        <polyline points="7 17 12 12 17 17" />
      </svg>
    );
  }

  // 17. Detractie (schouder omlaag duwen, dubbele pijl omlaag)
  if (norm.startsWith('detractie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <polyline points="7 7 12 12 17 7" />
        <polyline points="7 13 12 18 17 13" />
      </svg>
    );
  }

  // 18. Retractie (schouders naar achteren trekken, pijl naar achteren)
  if (norm.startsWith('retractie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="11 6 5 12 11 18" />
      </svg>
    );
  }

  // 19. Protractie (schouders naar voren duwen, pijl naar voren)
  if (norm.startsWith('protractie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    );
  }

  // 20. Laterorotatie (draaiing van scapula naar buiten/boven)
  if (norm.startsWith('laterorotatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M6 18a9 9 0 0 1 12-8" />
        <polyline points="18 4 18 10 12 10" />
      </svg>
    );
  }

  // 21. Mediorotatie (terugdraaiing van scapula naar binnen/beneden)
  if (norm.startsWith('mediorotatie')) {
    return (
      <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M18 18a9 9 0 0 0-12-8" />
        <polyline points="6 4 6 10 12 10" />
      </svg>
    );
  }

  // Default fallback icon
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
  );
};
