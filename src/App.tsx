import React, { useState, useEffect } from 'react';
import { MuscleProvider, useMuscles } from './context/MuscleContext';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';
import { StudyView } from './components/study/StudyView';
import { MovementsView } from './components/movements/MovementsView';
import { QuizView } from './components/quiz/QuizView';
import { BonesView } from './components/bones/BonesView';
import { EditorView } from './components/editor/EditorView';
import { FlashcardsView } from './components/flashcards/FlashcardsView';
import { BoneProvider } from './context/BoneContext';
import { SkeletonPuzzleGame } from './components/game/SkeletonPuzzleGame';
import { ConnectionsGame } from './components/game/ConnectionsGame';
import { QueensGridGame } from './components/game/QueensGridGame';
import { MuscleGuessGame } from './components/game/MuscleGuessGame';

function checkIsSecretGame(): boolean {
  if (typeof window === 'undefined') return false;
  const params = new URLSearchParams(window.location.search);
  return params.has('game') || window.location.hash === '#game';
}

const AppContent: React.FC = () => {
  const { appMode } = useMuscles();
  const [isGame, setIsGame] = useState<boolean>(checkIsSecretGame);
  const [activeGameTab, setActiveGameTab] = useState<
    'skeleton' | 'connections' | 'queens' | 'guess'
  >('skeleton');

  useEffect(() => {
    const onUrlChange = () => setIsGame(checkIsSecretGame());
    window.addEventListener('hashchange', onUrlChange);
    window.addEventListener('popstate', onUrlChange);
    return () => {
      window.removeEventListener('hashchange', onUrlChange);
      window.removeEventListener('popstate', onUrlChange);
    };
  }, []);

  if (isGame) {
    return (
      <div className="h-[100dvh] w-full flex flex-col bg-slate-50 text-slate-900 overflow-hidden select-none">
        <div className="shrink-0 h-10 px-2 bg-slate-900 text-white flex items-center justify-center gap-1 overflow-x-auto no-scrollbar">
          {(
            [
              { id: 'skeleton', label: '1. Skelet Puzzel' },
              { id: 'connections', label: '2. Connections' },
              { id: 'queens', label: '3. Eliminatie Rooster' },
              { id: 'guess', label: '4. Raad de Spier' },
            ] as const
          ).map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveGameTab(tab.id)}
              className={`px-2.5 py-1 rounded-md text-xs font-semibold whitespace-nowrap transition-colors ${
                activeGameTab === tab.id
                  ? 'bg-white text-slate-900'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
        {activeGameTab === 'skeleton' && <SkeletonPuzzleGame />}
        {activeGameTab === 'connections' && <ConnectionsGame />}
        {activeGameTab === 'queens' && <QueensGridGame />}
        {activeGameTab === 'guess' && <MuscleGuessGame />}
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-clinical-900">
      {/* Vaste Klinische Header */}
      <Header />

      {/* Hoofdsectie per geselecteerde modus */}
      <main className="flex-1 flex flex-col">
        {appMode === 'study' && <StudyView />}
        {appMode === 'bones' && <BonesView />}
        {appMode === 'movements' && <MovementsView />}
        {appMode === 'quiz' && <QuizView />}
        {appMode === 'flashcards' && <FlashcardsView />}
        {appMode === 'editor' && <EditorView />}
      </main>

      {/* Educatieve feedback & Notificaties */}
      <Toast />
    </div>
  );
};

export function App() {
  return (
    <MuscleProvider>
      <BoneProvider>
        <AppContent />
      </BoneProvider>
    </MuscleProvider>
  );
}

export default App;
