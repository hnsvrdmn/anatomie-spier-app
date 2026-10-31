import React from 'react';

interface MovementIconProps {
  movement: string;
  className?: string;
}

export const MovementIcon: React.FC<MovementIconProps> = ({
  movement,
  className = 'w-4 h-4',
}) => {
  const norm = movement.trim().toLowerCase();

  // 1. Flexie (buigen: duidelijke opwaartse buigboog vanuit een scharnierpunt)
  if (norm.startsWith('flexie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="18" r="2" fill="currentColor" stroke="none" />
        <path d="M6 18c0-7 5-12 13-12" />
        <polyline points="15 2.5 19.5 6 15 9.5" />
      </svg>
    );
  }

  // 2. Extensie (strekken: rechte uitstrekkende pijl vanuit scharnierpunt)
  if (norm.startsWith('extensie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <circle cx="6" cy="18" r="2" fill="currentColor" stroke="none" />
        <line x1="6" y1="18" x2="18.5" y2="5.5" />
        <polyline points="12.5 5.5 18.5 5.5 18.5 11.5" />
      </svg>
    );
  }

  // 3. Abductie (van de middenlijn van het lichaam af bewegen)
  if (norm.startsWith('abductie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="5" x2="4" y2="19" strokeOpacity="0.55" />
        <line x1="8" y1="12" x2="20" y2="12" />
        <polyline points="15 7 20 12 15 17" />
      </svg>
    );
  }

  // 4. Adductie (naar de middenlijn van het lichaam toe bewegen)
  if (norm.startsWith('adductie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="4" y1="5" x2="4" y2="19" strokeOpacity="0.55" />
        <line x1="20" y1="12" x2="8" y2="12" />
        <polyline points="13 7 8 12 13 17" />
      </svg>
    );
  }

  // 5. Anteflexie (arm/been voorwaarts omhoog heffen)
  if (norm.startsWith('anteflexie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="12" y1="19" x2="12" y2="5" />
        <polyline points="6.5 10.5 12 5 17.5 10.5" />
      </svg>
    );
  }

  // 6. Retroflexie (arm achterwaarts/omlaag bewegen)
  if (norm.startsWith('retroflexie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M18 6v5a6 6 0 0 1-6 6H5" />
        <polyline points="9.5 12.5 5 17 9.5 21.5" />
      </svg>
    );
  }

  // 7. Endorotatie (naar binnen draaien om lengteas: ruime boogpijl naar links/binnen)
  if (norm.startsWith('endorotatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 15A7.5 7.5 0 1 0 6 9" />
        <polyline points="5.5 4 5.5 9.5 11 9.5" />
      </svg>
    );
  }

  // 8. Exorotatie (naar buiten draaien om lengteas: ruime boogpijl naar rechts/buiten)
  if (norm.startsWith('exorotatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 15A7.5 7.5 0 1 1 18 9" />
        <polyline points="18.5 4 18.5 9.5 13 9.5" />
      </svg>
    );
  }

  // 9. Supinatie (open draaien van onderarm/handpalm: komvormige draaipijl omhoog)
  if (norm.startsWith('supinatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M4.5 10.5a8 8 0 0 0 15 0" />
        <polyline points="15 9.5 19.5 10.5 20.5 15" />
      </svg>
    );
  }

  // 10. Pronatie (naar binnen/onder draaien van onderarm: koepelvormige draaipijl omlaag)
  if (norm.startsWith('pronatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19.5 14.5a8 8 0 0 0-15 0" />
        <polyline points="9 15.5 4.5 14.5 3.5 10" />
      </svg>
    );
  }

  // 11. Eversie (buitenrand voet optillen: gekantelde pijl naar rechtsboven)
  if (norm.includes('eversie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 17h8a5 5 0 0 0 5-5V6" />
        <polyline points="14 10 18 6 22 10" />
      </svg>
    );
  }

  // 12. Inversie (binnenrand voet optillen: gekantelde pijl naar linksboven)
  if (norm.includes('inversie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 17h-8a5 5 0 0 1-5-5V6" />
        <polyline points="10 10 6 6 2 10" />
      </svg>
    );
  }

  // 13. Dorsaalflexie / Dorsaalextensie (voetrug/tenen optrekken)
  if (norm.startsWith('dorsaalflexie') || norm.startsWith('dorsaalextensie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 17h7l7-9" />
        <polyline points="13.5 8 19 8 19 13.5" />
      </svg>
    );
  }

  // 14. Plantairflexie (voetzool/tenen naar beneden bewegen)
  if (norm.startsWith('plantairflexie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 7h7l7 9" />
        <polyline points="19 10.5 19 16 13.5 16" />
      </svg>
    );
  }

  // 15. Lateroflexie / Lateraalflexie (zijwaarts buigen van de wervelkolom)
  if (norm.startsWith('lateroflexie') || norm.startsWith('lateraalflexie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M7 20c0-8 4.5-13 12-13" />
        <polyline points="15 3 19 7 15 11" />
      </svg>
    );
  }

  // 16. Rotatie (draaien van de romp om de lengteas)
  if (norm.startsWith('rotatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M20 12a8 8 0 1 1-2.5-5.8" />
        <polyline points="20 4 20 9 15 9" />
      </svg>
    );
  }

  // 17. Elevatie (schoudergordel optrekken: dubbele chevron omhoog)
  if (norm.startsWith('elevatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="7 11 12 6 17 11" />
        <polyline points="7 17.5 12 12.5 17 17.5" />
      </svg>
    );
  }

  // 18. Depressie / Detractie (schoudergordel omlaag trekken: dubbele chevron omlaag)
  if (norm.startsWith('depressie') || norm.startsWith('detractie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <polyline points="7 6.5 12 11.5 17 6.5" />
        <polyline points="7 13 12 18 17 13" />
      </svg>
    );
  }

  // 19. Retractie (schouderbladen naar achteren / naar wervelkolom trekken)
  if (norm.startsWith('retractie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="19" y1="12" x2="5" y2="12" />
        <polyline points="11 6 5 12 11 18" />
      </svg>
    );
  }

  // 20. Protractie (schouderbladen naar voren bewegen)
  if (norm.startsWith('protractie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="5" y1="12" x2="19" y2="12" />
        <polyline points="13 6 19 12 13 18" />
      </svg>
    );
  }

  // 21. Laterorotatie (onderste punt scapula draait naar buiten/boven)
  if (norm.startsWith('laterorotatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M5 17c6 0 12-4.5 12-11" />
        <polyline points="13 10 17 6 21 10" />
      </svg>
    );
  }

  // 22. Mediorotatie (onderste punt scapula draait terug naar binnen/onder)
  if (norm.startsWith('mediorotatie')) {
    return (
      <svg
        className={className}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M19 17c-6 0-12-4.5-12-11" />
        <polyline points="3 10 7 6 11 10" />
      </svg>
    );
  }

  // Default fallback icon
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="3" />
      <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
    </svg>
  );
};
