import React, { useState, useRef } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { BookOpen, GraduationCap, Edit3, ListChecks, Activity, Bone, HelpCircle } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';
import { HelpModal } from './HelpModal';

export const Header: React.FC = () => {
  const { appMode, setAppMode, quizPracticeMode, setQuizPracticeMode, triggerQuizOpenOptions } = useMuscles();
  const isMobile = useIsMobile();
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // 3x tikken op het ? icoontje opent verborgen Flashcards modus
  const helpTapCountRef = useRef(0);
  const helpTapTimerRef = useRef<number | null>(null);

  const handleHelpButtonClick = () => {
    helpTapCountRef.current += 1;

    if (helpTapTimerRef.current) {
      window.clearTimeout(helpTapTimerRef.current);
      helpTapTimerRef.current = null;
    }

    if (helpTapCountRef.current >= 3) {
      helpTapCountRef.current = 0;
      setIsHelpOpen(false);
      setAppMode('flashcards');
      return;
    }

    helpTapTimerRef.current = window.setTimeout(() => {
      if (helpTapCountRef.current > 0 && helpTapCountRef.current < 3) {
        setIsHelpOpen(true);
      }
      helpTapCountRef.current = 0;
      helpTapTimerRef.current = null;
    }, 320);
  };

  // Mobiele navigatie: Spieren, Botten, Bewegingen, Oefen, Test (alleen duidelijke iconen)
  const mobileNavItems = [
    {
      id: 'study',
      label: 'Spieren',
      icon: <BookOpen className="w-5 h-5" />,
      isActive: appMode === 'study',
      onClick: () => setAppMode('study'),
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

  // Desktop navigatie: Spieren, Botten, Bewegingen, Oefenen, Testen, Bewerken
  const desktopNavItems = [
    {
      id: 'study',
      label: 'Spieren',
      icon: <BookOpen className="w-4 h-4" />,
      isActive: appMode === 'study',
      onClick: () => setAppMode('study'),
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
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
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

            {/* Hulpknop met ? icoontje rechts in de header (3x tikken opent verborgen Flashcards) */}
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

