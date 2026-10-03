import React from 'react';
import { MuscleProvider, useMuscles } from './context/MuscleContext';
import { Header } from './components/common/Header';
import { Toast } from './components/common/Toast';
import { StudyView } from './components/study/StudyView';
import { QuizView } from './components/quiz/QuizView';
import { EditorView } from './components/editor/EditorView';

const AppContent: React.FC = () => {
  const { appMode } = useMuscles();

  return (
    <div className="min-h-screen flex flex-col bg-slate-100 text-clinical-900">
      {/* Vaste Klinische Header */}
      <Header />

      {/* Hoofdsectie per geselecteerde modus */}
      <main className="flex-1 flex flex-col">
        {appMode === 'study' && <StudyView />}
        {appMode === 'quiz' && <QuizView />}
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
      <AppContent />
    </MuscleProvider>
  );
}

export default App;
