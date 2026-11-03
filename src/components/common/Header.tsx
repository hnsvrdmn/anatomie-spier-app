import React, { useState, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { BookOpen, GraduationCap, Edit3, ListChecks, Activity, Bone, Layers, HelpCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { HelpModal } from './HelpModal';

export const Header: React.FC = () => {
  const { appMode, setAppMode, quizPracticeMode, setQuizPracticeMode, triggerQuizOpenOptions } = useMuscles();
  const isMobile = useIsMobile();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 3x tikken op de Study ('Spieren') knop opent het verborgen Spel-gedeelte (#game)
  const studyTapCountRef = useRef(0);
  const studyTapTimerRef = useRef<number | null>(null);

  const handleStudyButtonClick = () => {
    setAppMode('study');
    studyTapCountRef.current += 1;

    if (studyTapTimerRef.current) {
      window.clearTimeout(studyTapTimerRef.current);
      studyTapTimerRef.current = null;
    }

    if (studyTapCountRef.current >= 3) {
      studyTapCountRef.current = 0;
      window.location.hash = '#game';
      return;
    }

    studyTapTimerRef.current = window.setTimeout(() => {
      studyTapCountRef.current = 0;
      studyTapTimerRef.current = null;
    }, 350);
  };

  const handleHelpButtonClick = () => {
    setIsHelpOpen(true);
  };

  // Mobiele navigatie: Spieren, Botten, Bewegingen, Flashcards, Oefen, Test
  const mobileNavItems = [
    {
      id: 'study',
      label: 'Spieren',
      icon: <BookOpen className="w-5 h-5" />,
      isActive: appMode === 'study',
      onClick: handleStudyButtonClick,
    },
    {
      id: 'bones',
      label: 'Botten',
      icon: <Bone className="w-5 h-5" />,
      isActive: appMode === 'bones',
      onClick: () => setAppMode('bones'),
    },
    {
      id: 'movements',
      label: 'Bewegingen',
      icon: <Activity className="w-5 h-5" />,
      isActive: appMode === 'movements',
      onClick: () => setAppMode('movements'),
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: <Layers className="w-5 h-5" />,
      isActive: appMode === 'flashcards',
      onClick: () => setAppMode('flashcards'),
    },
    {
      id: 'quiz-joint',
      label: 'Oefen',
      icon: <GraduationCap className="w-5 h-5" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'joint',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('joint');
        triggerQuizOpenOptions();
      },
    },
    {
      id: 'quiz-free',
      label: 'Test',
      icon: <ListChecks className="w-5 h-5" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'free',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('free');
        triggerQuizOpenOptions();
      },
    },
  ];

  // Desktop navigatie: Spieren, Botten, Bewegingen, Flashcards, Oefenen, Testen, Bewerken
  const desktopNavItems = [
    {
      id: 'study',
      label: 'Spieren',
      icon: <BookOpen className="w-4 h-4" />,
      isActive: appMode === 'study',
      onClick: handleStudyButtonClick,
    },
    {
      id: 'bones',
      label: 'Botten',
      icon: <Bone className="w-4 h-4" />,
      isActive: appMode === 'bones',
      onClick: () => setAppMode('bones'),
    },
    {
      id: 'movements',
      label: 'Bewegingen',
      icon: <Activity className="w-4 h-4" />,
      isActive: appMode === 'movements',
      onClick: () => setAppMode('movements'),
    },
    {
      id: 'flashcards',
      label: 'Flashcards',
      icon: <Layers className="w-4 h-4" />,
      isActive: appMode === 'flashcards',
      onClick: () => setAppMode('flashcards'),
    },
    {
      id: 'quiz-joint',
      label: 'Oefenen',
      icon: <GraduationCap className="w-4 h-4" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'joint',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('joint');
      },
    },
    {
      id: 'quiz-free',
      label: 'Testen',
      icon: <ListChecks className="w-4 h-4" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'free',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('free');
      },
    },
    {
      id: 'editor',
      label: 'Bewerken',
      icon: <Edit3 className="w-4 h-4" />,
      isActive: appMode === 'editor',
      onClick: () => setAppMode('editor'),
    },
  ];

  return (
    <>
      <header className="bg-clinical-900 text-white border-b border-clinical-800 shadow-md sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
          <div className="relative flex items-center justify-center h-14 sm:h-16">
            {/* Modus Selectie (Gecentreerd) */}
            <nav className="flex items-center bg-clinical-950 p-1 rounded-xl border border-clinical-800 shadow-inner gap-1">
              {isMobile ? (
                mobileNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    title={item.label}
                    aria-label={item.label}
                    className={`flex items-center justify-center p-2 rounded-lg transition-all ${
                      item.isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'text-clinical-400 hover:text-white hover:bg-clinical-800/60'
                    }`}
                  >
                    {item.icon}
                  </button>
                ))
              ) : (
                desktopNavItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className={`flex items-center gap-1.5 sm:gap-2 px-2.5 sm:px-3.5 lg:px-4 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      item.isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'text-clinical-400 hover:text-white hover:bg-clinical-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                ))
              )}
            </nav>

            {/* Hulpknop met ? icoontje rechts in de header (3x tikken = geheime toegang flashcards) */}
            <div className="absolute right-1 sm:right-2 flex items-center">
              <button
                type="button"
                onClick={handleHelpButtonClick}
                className="p-1.5 sm:p-2 rounded-xl text-clinical-300 hover:text-white hover:bg-clinical-800 transition active:scale-95"
                title="Hulp & Uitleg (?)"
                aria-label="Hulp & Uitleg"
              >
                <HelpCircle className="w-5 h-5 text-clinical-300 hover:text-white" />
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Interactief Hulpvenster */}
      <HelpModal isOpen={isHelpOpen} onClose={() => setIsHelpOpen(false)} />
    </>
  );
};

