import React, { useState, useRef, useCallback, useEffect } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { SkeletonViewer } from '../skeleton/SkeletonViewer';
import { EditorOverlay } from '../skeleton/EditorOverlay';
import { ViewToggle } from '../common/ViewToggle';
import { EditorControls } from './EditorControls';
import { 
  EditorTool, 
  EditSymmetrySide, 
  Point2D, 
  MuscleVisualData 
} from '../../types/anatomy';

export const EditorView: React.FC = () => {
  const { 
    currentView, 
    setCurrentView, 
    selectedMuscle, 
    updateMuscleVisuals,
    showToast
  } = useMuscles();

  // Automatisch wisselen naar het juiste aanzicht van de geselecteerde spier in bewerkmodus
  useEffect(() => {
    if (selectedMuscle && currentView !== selectedMuscle.view) {
      setCurrentView(selectedMuscle.view);
    }
  }, [selectedMuscle?.id, selectedMuscle?.view, setCurrentView]);

  // Selecteer/sleep is nu standaard geselecteerd
  const [activeTool, setActiveTool] = useState<EditorTool>('select');
  const [activeSide] = useState<EditSymmetrySide>('left');
  const [selectedPoint, setSelectedPoint] = useState<{
    point: Point2D;
    type: 'origin' | 'insertion' | 'path' | 'line_point';
    index: number;
    lineIndex?: number;
  } | null>(null);

  // Undo geschiedenis
  const [history, setHistory] = useState<MuscleVisualData[]>([]);
  const [showTooltip, setShowTooltip] = useState(true);

  const skeletonContentRef = useRef<HTMLDivElement>(null);

  // Huidige visuele data voor de geselecteerde zijde
  const currentVisuals: MuscleVisualData = selectedMuscle?.visuals[activeSide] || {
    origins: [],
    insertions: [],
    musclePath: [],
    attachmentLines: [],
  };

  // Bewaar snapshot voor 'ongedaan maken'
  const pushToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-15), JSON.parse(JSON.stringify(currentVisuals))]);
  }, [currentVisuals]);

  // Werk visuals bij en sla geschiedenis op
  const handleUpdateVisuals = (newVisuals: MuscleVisualData) => {
    if (!selectedMuscle) return;
    updateMuscleVisuals(selectedMuscle.id, activeSide, newVisuals);
  };

  // Point added callback
  const handlePointAdded = (type: 'origin' | 'insertion' | 'path') => {
    pushToHistory();
    const typeNames = { origin: 'Origo', insertion: 'Insertie', path: 'Punt' };
    showToast(`${typeNames[type] || 'Marker'} geplaatst en gespiegeld`, 'info');
  };

  // Ongedaan maken
  const handleUndo = () => {
    if (history.length === 0 || !selectedMuscle) return;
    const previous = history[history.length - 1];
    setHistory(prev => prev.slice(0, -1));
    updateMuscleVisuals(selectedMuscle.id, activeSide, previous);
    setSelectedPoint(null);
    showToast('Laatste bewerking ongedaan gemaakt', 'info');
  };

  // Verwijder geselecteerd punt
  const handleDeleteSelected = () => {
    if (!selectedPoint || !selectedMuscle) return;
    pushToHistory();

    const { type, index, lineIndex } = selectedPoint;
    const newVisuals = { ...currentVisuals };

    if (type === 'origin') {
      newVisuals.origins = newVisuals.origins.filter((_, i) => i !== index);
    } else if (type === 'insertion') {
      newVisuals.insertions = newVisuals.insertions.filter((_, i) => i !== index);
    } else if (type === 'path') {
      newVisuals.musclePath = (newVisuals.musclePath || []).filter((_, i) => i !== index);
    } else if (type === 'line_point' && lineIndex !== undefined) {
      const lines = [...(newVisuals.attachmentLines || [])];
      if (lines[lineIndex]) {
        const line = { ...lines[lineIndex] };
        line.points = line.points.filter((_, i) => i !== index);
        if (line.points.length === 0) {
          newVisuals.attachmentLines = lines.filter((_, i) => i !== lineIndex);
        } else {
          lines[lineIndex] = line;
          newVisuals.attachmentLines = lines;
        }
      }
    }

    updateMuscleVisuals(selectedMuscle.id, activeSide, newVisuals);
    setSelectedPoint(null);
    showToast('Marker/zonepunt verwijderd', 'info');
  };

  // Hernoem een punt of aanhechtingslijn
  const handleRenamePoint = (type: 'origin' | 'insertion' | 'path' | 'line_point', index: number, newName: string, lineIndex?: number) => {
    if (!selectedMuscle) return;
    pushToHistory();
    const newVisuals = { ...currentVisuals };
    if (type === 'origin' && newVisuals.origins[index]) {
      newVisuals.origins[index] = { ...newVisuals.origins[index], name: newName };
    } else if (type === 'insertion' && newVisuals.insertions[index]) {
      newVisuals.insertions[index] = { ...newVisuals.insertions[index], name: newName };
    } else if (type === 'path' && newVisuals.musclePath && newVisuals.musclePath[index]) {
      newVisuals.musclePath[index] = { ...newVisuals.musclePath[index], name: newName };
    } else if (type === 'line_point' && lineIndex !== undefined && newVisuals.attachmentLines && newVisuals.attachmentLines[lineIndex]) {
      const lines = [...newVisuals.attachmentLines];
      lines[lineIndex] = { ...lines[lineIndex], name: newName };
      newVisuals.attachmentLines = lines;
    }
    updateMuscleVisuals(selectedMuscle.id, activeSide, newVisuals);
    if (selectedPoint && selectedPoint.type === type && selectedPoint.index === index) {
      setSelectedPoint({
        ...selectedPoint,
        point: { ...selectedPoint.point, name: newName }
      });
    }
  };

  // Verwijder punt op index
  const handleDeletePointByIndex = (type: 'origin' | 'insertion' | 'path' | 'line_point', index: number, lineIndex?: number) => {
    if (!selectedMuscle) return;
    pushToHistory();
    const newVisuals = { ...currentVisuals };
    if (type === 'origin') {
      newVisuals.origins = newVisuals.origins.filter((_, i) => i !== index);
    } else if (type === 'insertion') {
      newVisuals.insertions = newVisuals.insertions.filter((_, i) => i !== index);
    } else if (type === 'path') {
      newVisuals.musclePath = (newVisuals.musclePath || []).filter((_, i) => i !== index);
    } else if (type === 'line_point' && lineIndex !== undefined) {
      const lines = [...(newVisuals.attachmentLines || [])];
      if (lines[lineIndex]) {
        const line = { ...lines[lineIndex] };
        line.points = line.points.filter((_, i) => i !== index);
        if (line.points.length === 0) {
          newVisuals.attachmentLines = lines.filter((_, i) => i !== lineIndex);
        } else {
          lines[lineIndex] = line;
          newVisuals.attachmentLines = lines;
        }
      }
    }
    updateMuscleVisuals(selectedMuscle.id, activeSide, newVisuals);
    if (selectedPoint && selectedPoint.type === type && selectedPoint.index === index) {
      setSelectedPoint(null);
    }
    showToast('Punt verwijderd', 'info');
  };

  // Voeg bestaand aanhechtingspunt toe
  const handleAddExistingLandmark = (landmark: { name: string; point: Point2D }, asType: 'origin' | 'insertion') => {
    if (!selectedMuscle) return;
    pushToHistory();
    const newVisuals = { ...currentVisuals };
    const pt: Point2D = {
      x: landmark.point.x,
      y: landmark.point.y,
      name: landmark.name
    };
    if (asType === 'origin') {
      newVisuals.origins = [...newVisuals.origins, pt];
      setSelectedPoint({ point: pt, type: 'origin', index: newVisuals.origins.length - 1 });
    } else {
      newVisuals.insertions = [...newVisuals.insertions, pt];
      setSelectedPoint({ point: pt, type: 'insertion', index: newVisuals.insertions.length - 1 });
    }
    updateMuscleVisuals(selectedMuscle.id, activeSide, newVisuals);
    showToast(`Aanhechtingspunt "${landmark.name}" toegevoegd als ${asType === 'origin' ? 'origo' : 'insertie'}!`, 'success');
  };

  // Wis acties
  const handleClearOrigins = () => {
    if (!selectedMuscle) return;
    pushToHistory();
    updateMuscleVisuals(selectedMuscle.id, activeSide, { ...currentVisuals, origins: [] });
    setSelectedPoint(null);
    showToast("Origo's gewist", 'info');
  };

  const handleClearInsertions = () => {
    if (!selectedMuscle) return;
    pushToHistory();
    updateMuscleVisuals(selectedMuscle.id, activeSide, { ...currentVisuals, insertions: [] });
    setSelectedPoint(null);
    showToast('Inserties gewist', 'info');
  };

  if (!selectedMuscle) {
    return (
      <div className="p-10 text-center text-clinical-400">
        Selecteer eerst een spier om te bewerken.
      </div>
    );
  }

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-2 sm:px-4 lg:px-8 py-3 sm:py-6 flex flex-col lg:flex-row gap-4 lg:gap-6 items-stretch">
      {/* Linker/Midden kolom: Skelet met Vaste Hoogte (exact gelijk aan studie- en toetsmodus) */}
      <div className="w-full lg:flex-1 flex flex-col items-center justify-between bg-white rounded-3xl p-3 sm:p-4 border border-clinical-200/90 shadow-sm relative h-[92vh] min-h-[760px] max-h-[1020px]">
        {/* Bovenbalk: Aanzichtschakelaar mooi gecentreerd (vaste hoogte h-12) */}
        <div className="w-full h-12 shrink-0 flex items-center justify-between pb-2 border-b border-clinical-100 px-1">
          <div className="flex-1 min-w-0" />
          <div className="shrink-0">
            <ViewToggle
              currentView={currentView}
              onViewChange={setCurrentView}
              recommendedView={selectedMuscle.view}
            />
          </div>
          <div className="flex-1 min-w-0" />
        </div>

        {/* Skelet & Overlay Container */}
        <div className="flex-1 min-h-0 w-full h-full flex items-center justify-center py-1 overflow-hidden">
          <SkeletonViewer
            currentView={currentView}
            activeMuscle={selectedMuscle}
            activeSide="right"
            markersOpacity={0.75}
            interactive={false}
            innerRef={skeletonContentRef}
            showTooltip={showTooltip}
            onToggleTooltip={setShowTooltip}
          >
            {/* De interactieve editor overlay laag met pointer-events en drag controls */}
            <EditorOverlay
              muscle={selectedMuscle}
              activeSide={activeSide}
              activeTool={activeTool}
              containerRef={skeletonContentRef}
              selectedPoint={selectedPoint}
              onSelectPoint={setSelectedPoint}
              onUpdateVisuals={handleUpdateVisuals}
              onPointAdded={handlePointAdded}
              showTooltip={showTooltip}
            />
          </SkeletonViewer>
        </div>

        {/* Onderbalk met instructies (vaste h-8) */}
        <div className="w-full h-8 shrink-0 flex items-center justify-between pt-2 border-t border-clinical-100 text-xs text-clinical-500">
          <span>
            {activeTool === 'origin' && "💡 Klik op het skelet om een blauwe Origo toe te voegen."}
            {activeTool === 'insertion' && "💡 Klik op het skelet om een rode Insertie toe te voegen."}
            {activeTool === 'origin_line' && "💡 Klik op het skelet om punten aan de Origo-lijn toe te voegen (bijv. Linea alba of wervelkolom)."}
            {activeTool === 'insertion_line' && "💡 Klik op het skelet om punten aan de Insertie-lijn (zone) toe te voegen."}
            {activeTool === 'path' && "💡 Klik op het skelet om een curve-/verlooppunt toe te voegen."}
          </span>
          <span className="font-mono text-[11px] text-clinical-400">
            {currentVisuals.origins.length} O | {currentVisuals.insertions.length} I | {(currentVisuals.attachmentLines || []).length} Zone(s)
          </span>
        </div>
      </div>

      {/* Rechter Zijpaneel: Editor Bedieningselementen */}
      <div className="w-full lg:w-96 flex flex-col space-y-4 shrink-0">
        <EditorControls
          activeTool={activeTool}
          setActiveTool={setActiveTool}
          activeSide={activeSide}
          selectedPoint={selectedPoint}
          onSelectPoint={setSelectedPoint}
          canUndo={history.length > 0}
          onUndo={handleUndo}
          onDeleteSelected={handleDeleteSelected}
          onClearOrigins={handleClearOrigins}
          onClearInsertions={handleClearInsertions}
          onRenamePoint={handleRenamePoint}
          onDeletePointByIndex={handleDeletePointByIndex}
          onAddExistingLandmark={handleAddExistingLandmark}
          showTooltip={showTooltip}
          onToggleTooltip={() => setShowTooltip(v => !v)}
        />
      </div>
    </div>
  );
};
