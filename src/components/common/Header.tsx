import React from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { AppMode } from '../../types/anatomy';
import { BookOpen, GraduationCap, Edit3, ListChecks } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

export const Header: React.FC = () => {
  const { appMode, setAppMode, quizPracticeMode, setQuizPracticeMode } = useMuscles();
  const isMobile = useIsMobile();

  // Mobiele navigatie: Studeer, Oefen, Toets
  const mobileNavItems = [
    {
      id: 'study',
      label: 'Studeer',
      icon: <BookOpen className="w-3.5 h-3.5" />,
      isActive: appMode === 'study',
      onClick: () => setAppMode('study'),
    },
    {
      id: 'quiz-joint',
      label: 'Oefen',
      icon: <GraduationCap className="w-3.5 h-3.5" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'joint',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('joint');
      },
    },
    {
      id: 'quiz-free',
      label: 'Toets',
      icon: <ListChecks className="w-3.5 h-3.5" />,
      isActive: appMode === 'quiz' && quizPracticeMode === 'free',
      onClick: () => {
        setAppMode('quiz');
        setQuizPracticeMode('free');
      },
    },
  ];

  const desktopNavItems: { mode: AppMode; label: string; icon: React.ReactNode }[] = [
    {
      mode: 'study',
      label: 'Studiemodus',
      icon: <BookOpen className="w-4 h-4" />,
    },
    {
      mode: 'quiz',
      label: 'Toetsmodus',
      icon: <GraduationCap className="w-4 h-4" />,
    },
    {
      mode: 'editor',
      label: 'Bewerkmodus',
      icon: <Edit3 className="w-4 h-4" />,
    },
  ];

  return (
    <header className="bg-clinical-900 text-white border-b border-clinical-800 shadow-md sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-2 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center h-14 sm:h-16">
          {/* Modus Selectie (Gecentreerd) */}
          <nav className="flex items-center bg-clinical-950 p-1 rounded-xl border border-clinical-800 shadow-inner">
            {isMobile ? (
              mobileNavItems.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    item.isActive
                      ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                      : 'text-clinical-400 hover:text-white hover:bg-clinical-800/60'
                  }`}
                >
                  {item.icon}
                  <span>{item.label}</span>
                </button>
              ))
            ) : (
              desktopNavItems.map((item) => {
                const isActive = appMode === item.mode;
                return (
                  <button
                    key={item.mode}
                    onClick={() => setAppMode(item.mode)}
                    className={`flex items-center gap-1.5 sm:gap-2 px-3 sm:px-5 py-1.5 rounded-lg text-xs sm:text-sm font-semibold transition-all ${
                      isActive
                        ? 'bg-blue-600 text-white shadow-sm ring-1 ring-blue-400'
                        : 'text-clinical-400 hover:text-white hover:bg-clinical-800/60'
                    }`}
                  >
                    {item.icon}
                    <span>{item.label}</span>
                  </button>
                );
              })
            )}
          </nav>
        </div>
      </div>
    </header>
  );
};

