import React, { useState } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { 
  EditorTool, 
  EditSymmetrySide, 
  Point2D,
  AnatomicalView
} from '../../types/anatomy';
import { 
  Undo2, 
  Trash2, 
  Download, 
  Upload,
  Save,
  MousePointer, 
  Sparkles, 
  RotateCcw, 
  Plus, 
  BookmarkPlus, 
  MapPin,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Settings2
} from 'lucide-react';

interface EditorControlsProps {
  activeTool: EditorTool;
  setActiveTool: (tool: EditorTool) => void;
  activeSide: EditSymmetrySide;
  selectedPoint: { point: Point2D; type: 'origin' | 'insertion' | 'path' | 'line_point'; index: number; lineIndex?: number } | null;
  onSelectPoint?: (item: { point: Point2D; type: 'origin' | 'insertion' | 'path' | 'line_point'; index: number; lineIndex?: number } | null) => void;
  canUndo: boolean;
  onUndo: () => void;
  onDeleteSelected: () => void;
  onClearOrigins?: () => void;
  onClearInsertions?: () => void;
  onRenamePoint?: (type: 'origin' | 'insertion' | 'path' | 'line_point', index: number, newName: string, lineIndex?: number) => void;
  onDeletePointByIndex?: (type: 'origin' | 'insertion' | 'path' | 'line_point', index: number, lineIndex?: number) => void;
  onAddExistingLandmark?: (landmark: { name: string; point: Point2D }, asType: 'origin' | 'insertion') => void;
  showTooltip?: boolean;
  onToggleTooltip?: () => void;
}

export const EditorControls: React.FC<EditorControlsProps> = ({
  activeTool,
  setActiveTool,
  activeSide,
  selectedPoint,
  onSelectPoint,
  canUndo,
  onUndo,
  onDeleteSelected,
  onRenamePoint,
  onDeletePointByIndex,
  onAddExistingLandmark,
}) => {
  const { 
    muscles, 
    selectedMuscleId, 
    selectedMuscle, 
    selectMuscle, 
    exportDataset,
    importDataset,
    saveToDisk,
    resetDataset,
    addMuscle,
    deleteMuscle,
    allKnownLandmarks,
    nextMuscle,
    prevMuscle,
    updateMuscleDetails,
    updateMuscleVisuals,
    setCurrentView
  } = useMuscles();

  const fileInputRef = React.useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        if (Array.isArray(json)) {
          importDataset(json);
        } else {
          alert('Ongeldig bestand: verwacht een JSON array met spieren');
        }
      } catch (err) {
        alert('Fout bij het openen van het JSON bestand');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  // Modal toevoegen spier
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newMuscleName, setNewMuscleName] = useState('');
  const [newMuscleJoint, setNewMuscleJoint] = useState('coxae');
  const [newMuscleView, setNewMuscleView] = useState<AnatomicalView>('ventral');
  const [newMuscleOrigin, setNewMuscleOrigin] = useState('');
  const [newMuscleInsertion, setNewMuscleInsertion] = useState('');
  const [newMuscleFunction, setNewMuscleFunction] = useState('');

  // Dropdown bestaand aanhechtingspunt toevoegen
  const [isLandmarkPickerOpen, setIsLandmarkPickerOpen] = useState(false);
  const [landmarkTargetType, setLandmarkTargetType] = useState<'origin' | 'insertion'>('origin');

  // Huidige visuele data voor deze spier en zijde
  const currentVisuals = selectedMuscle?.visuals[activeSide] || {
    origins: [],
    insertions: [],
    musclePath: [],
    attachmentLines: [],
  };

  const tools: { id: EditorTool; label: string; icon: React.ReactNode; color: string }[] = [
    {
      id: 'origin',
      label: 'Origo',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-blue-600 inline-block shrink-0" />,
      color: 'hover:bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'insertion',
      label: 'Insertie',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-red-600 inline-block shrink-0" />,
      color: 'hover:bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'origin_line',
      label: 'Origo-zone',
      icon: <span className="w-3 h-0.5 border-b-2 border-dashed border-blue-600 inline-block shrink-0" />,
      color: 'hover:bg-blue-50 text-blue-700 border-blue-200',
    },
    {
      id: 'insertion_line',
      label: 'Insertie-zone',
      icon: <span className="w-3 h-0.5 border-b-2 border-dashed border-rose-600 inline-block shrink-0" />,
      color: 'hover:bg-rose-50 text-rose-700 border-rose-200',
    },
    {
      id: 'path',
      label: 'Curve',
      icon: <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block shrink-0" />,
      color: 'hover:bg-amber-50 text-amber-700 border-amber-200',
    },
    {
      id: 'select',
      label: 'Selecteer',
      icon: <MousePointer className="w-3 h-3 text-clinical-600 shrink-0" />,
      color: 'hover:bg-clinical-50 text-clinical-700 border-clinical-200',
    },
  ];

  // Opslaan van een nieuwe spier
  const handleSaveNewMuscle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMuscleName.trim()) return;

    addMuscle({
      name: newMuscleName.trim(),
      view: newMuscleView,
      originText: newMuscleOrigin.trim() || 'Nader te bepalen',
      insertionText: newMuscleInsertion.trim() || 'Nader te bepalen',
      functionText: newMuscleFunction.trim(),
      symmetryType: 'bilateral',
      jointCategories: [newMuscleJoint],
      visuals: {
        left: { origins: [], insertions: [], musclePath: [] },
        right: { origins: [], insertions: [], musclePath: [] },
      }
    });

    setIsAddModalOpen(false);
    setNewMuscleName('');
    setNewMuscleOrigin('');
    setNewMuscleInsertion('');
    setNewMuscleFunction('');
  };

  // Verwijder huidige spier
  const handleDeleteCurrentMuscle = () => {
    if (!selectedMuscle) return;
    if (window.confirm(`Weet u zeker dat u "${selectedMuscle.name}" wilt verwijderen? Dit kan niet ongedaan worden gemaakt.`)) {
      deleteMuscle(selectedMuscle.id);
    }
  };

  return (
    <div className="bg-white p-3.5 sm:p-4 rounded-2xl border border-clinical-200/90 shadow-sm space-y-3">
      {/* 1. Spierselectie & Beheer Knoppen */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-clinical-700 uppercase tracking-wider">
            Spier Selecteren
          </label>
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="py-0.5 px-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
              title="Nieuwe spier toevoegen"
            >
              <Plus className="w-3 h-3" />
              <span>Nieuw</span>
            </button>
            <button
              type="button"
              onClick={handleDeleteCurrentMuscle}
              className="py-0.5 px-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-300 rounded-lg text-[10px] font-bold flex items-center gap-1 transition"
              title="Huidige spier verwijderen"
            >
              <Trash2 className="w-3 h-3" />
              <span>Verwijder</span>
            </button>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={prevMuscle}
            title="Vorige spier (<)"
            className="p-1.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border border-clinical-200 rounded-lg transition shrink-0"
          >
            <ChevronLeft className="w-3.5 h-3.5" />
          </button>
          <select
            value={selectedMuscleId}
            onChange={(e) => selectMuscle(e.target.value, true)}
            className="flex-1 min-w-0 px-2.5 py-1.5 bg-clinical-50 border border-clinical-200 rounded-lg text-xs font-semibold text-clinical-900 focus:outline-none focus:ring-2 focus:ring-blue-500 transition truncate"
          >
            {JOINT_CATEGORIES.map((cat) => {
              const catMuscles = muscles.filter((m) => m.jointCategories?.includes(cat.id));
              if (catMuscles.length === 0) return null;
              return (
                <optgroup key={cat.id} label={cat.title}>
                  {catMuscles.map((m) => (
                    <option key={`${cat.id}-${m.id}`} value={m.id}>
                      {m.name}
                    </option>
                  ))}
                </optgroup>
              );
            })}
          </select>
          <button
            type="button"
            onClick={nextMuscle}
            title="Volgende spier (>)"
            className="p-1.5 bg-clinical-50 hover:bg-clinical-100 text-clinical-700 border border-clinical-200 rounded-lg transition shrink-0"
          >
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Uitschuifbaar paneel: Verander extra's */}
        {selectedMuscle && (
          <details className="group rounded-xl border border-slate-200 bg-slate-50/70 overflow-hidden text-xs">
            <summary className="px-3 py-2 cursor-pointer font-bold text-slate-700 flex items-center justify-between hover:bg-slate-100 transition select-none">
              <span className="flex items-center gap-1.5">
                <Settings2 className="w-3.5 h-3.5 text-blue-600" />
                <span>Verander extra's</span>
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400 group-open:rotate-180 transition-transform" />
            </summary>
            <div className="p-3 bg-white border-t border-slate-200 space-y-2.5">
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Aanzicht ingetekend:
                </label>
                <select
                  value={selectedMuscle.view}
                  onChange={(e) => {
                    const newView = e.target.value as AnatomicalView;
                    updateMuscleDetails(selectedMuscle.id, { view: newView });
                    setCurrentView(newView);
                  }}
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900"
                >
                  <option value="ventral">Ventraal</option>
                  <option value="dorsal">Dorsaal</option>
                </select>
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Bewegingen & functies:
                </label>
                <textarea
                  rows={2}
                  value={selectedMuscle.functionText || ''}
                  onChange={(e) => updateMuscleDetails(selectedMuscle.id, { functionText: e.target.value })}
                  placeholder="bijv. Flexie, abductie..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white resize-none"
                />
              </div>

              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Extra info (hoef je niet te leren):
                </label>
                <textarea
                  rows={2}
                  value={selectedMuscle.otherFunctions || ''}
                  onChange={(e) => updateMuscleDetails(selectedMuscle.id, { otherFunctions: e.target.value })}
                  placeholder="Klinische achtergrond / stabilisatie..."
                  className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-semibold text-slate-900 focus:bg-white resize-none"
                />
              </div>
            </div>
          </details>
        )}
      </div>

      {/* 2. Plaatsingsmodi Toggles */}
      <div className="space-y-1.5">
        <label className="text-[11px] font-bold text-clinical-700 uppercase tracking-wider flex items-center gap-1">
          <Sparkles className="w-3 h-3 text-blue-500" />
          <span>Actieve Plaatsingsmodus</span>
        </label>
        <div className="grid grid-cols-2 gap-1.5">
          {tools.map((t) => {
            const isActive = activeTool === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => setActiveTool(t.id)}
                className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs font-semibold border transition ${
                  isActive
                    ? 'bg-clinical-900 text-white border-clinical-900 shadow-sm ring-1 ring-clinical-900'
                    : `bg-white ${t.color}`
                }`}
              >
                <div className="flex items-center gap-1.5 truncate">
                  {t.icon}
                  <span className="truncate">{t.label}</span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. LIJST MET INGETEKENDE PUNTEN ONDER 'ACTIEVE PLAATSINGSMODUS' */}
      <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/90 space-y-2.5">
        <div className="flex items-center justify-between">
          <label className="text-[11px] font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
            <MapPin className="w-3 h-3 text-blue-600" />
            <span>Ingetekende Punten ({activeSide === 'left' ? 'Links' : 'Rechts'})</span>
          </label>
          <button
            type="button"
            onClick={() => setIsLandmarkPickerOpen(!isLandmarkPickerOpen)}
            className="text-[10px] font-bold text-blue-700 hover:text-blue-900 flex items-center gap-1 underline"
            title="Voeg een reeds bekend anatomisch aanhechtingspunt toe aan deze spier"
          >
            <BookmarkPlus className="w-3 h-3" />
            <span>+ Bestaand punt</span>
          </button>
        </div>

        {/* Popover / Keuzemenu voor toevoegen van bestaand aanhechtingspunt */}
        {isLandmarkPickerOpen && (
          <div className="p-2.5 bg-white rounded-xl border border-blue-200 shadow-md space-y-2 animate-in zoom-in-95 duration-150">
            <div className="text-[11px] font-bold text-slate-700 flex items-center justify-between">
              <span>Kies een bestaand aanhechtingspunt:</span>
              <button
                type="button"
                onClick={() => setIsLandmarkPickerOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-xs"
              >
                ✕
              </button>
            </div>
            <div className="flex items-center gap-2 text-xs">
              <span className="text-slate-500 font-medium">Toevoegen als:</span>
              <button
                type="button"
                onClick={() => setLandmarkTargetType('origin')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  landmarkTargetType === 'origin' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Origo
              </button>
              <button
                type="button"
                onClick={() => setLandmarkTargetType('insertion')}
                className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                  landmarkTargetType === 'insertion' ? 'bg-red-600 text-white' : 'bg-slate-100 text-slate-700'
                }`}
              >
                Insertie
              </button>
            </div>
            <div className="max-h-40 overflow-y-auto space-y-1 pr-1 custom-scrollbar text-xs">
              {allKnownLandmarks
                .filter(l => l.side === activeSide || l.side === 'midline')
                .map((lm, idx) => (
                  <button
                    key={`${lm.name}-${idx}`}
                    type="button"
                    onClick={() => {
                      onAddExistingLandmark?.(lm, landmarkTargetType);
                      setIsLandmarkPickerOpen(false);
                    }}
                    className="w-full text-left px-2 py-1.5 rounded-lg hover:bg-blue-50 text-slate-800 text-xs font-semibold flex items-center justify-between border border-transparent hover:border-blue-200 transition"
                  >
                    <span className="truncate">{lm.name}</span>
                  </button>
                ))}
            </div>
          </div>
        )}

        {/* Origo's lijst */}
        <div className="space-y-1">
          <div className="text-[11px] font-bold text-blue-700 flex items-center justify-between">
            <span>Origo's ({currentVisuals.origins.length})</span>
          </div>
          {currentVisuals.origins.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic py-1">Nog geen origo geplaatst</div>
          ) : (
            currentVisuals.origins.map((orig, idx) => {
              const isSelected = selectedPoint?.type === 'origin' && selectedPoint?.index === idx;
              const ptName = orig.name || (idx === 0 ? selectedMuscle?.originText : `Origo ${idx + 1}`);

              return (
                <div
                  key={`orig-item-${idx}`}
                  onClick={() => onSelectPoint?.({ point: orig, type: 'origin', index: idx })}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition ${
                    isSelected
                      ? 'bg-blue-50 border-blue-400 ring-2 ring-blue-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        O{idx + 1}: {ptName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePointByIndex?.('origin', idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Verwijder deze origo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Inserties lijst */}
        <div className="space-y-1 pt-1 border-t border-slate-200/60">
          <div className="text-[11px] font-bold text-rose-700 flex items-center justify-between">
            <span>Inserties ({currentVisuals.insertions.length})</span>
          </div>
          {currentVisuals.insertions.length === 0 ? (
            <div className="text-[11px] text-slate-400 italic py-1">Nog geen insertie geplaatst</div>
          ) : (
            currentVisuals.insertions.map((ins, idx) => {
              const isSelected = selectedPoint?.type === 'insertion' && selectedPoint?.index === idx;
              const ptName = ins.name || (idx === 0 ? selectedMuscle?.insertionText : `Insertie ${idx + 1}`);

              return (
                <div
                  key={`ins-item-${idx}`}
                  onClick={() => onSelectPoint?.({ point: ins, type: 'insertion', index: idx })}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition ${
                    isSelected
                      ? 'bg-rose-50 border-rose-400 ring-2 ring-rose-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-red-600 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        I{idx + 1}: {ptName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePointByIndex?.('insertion', idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Verwijder deze insertie"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Curve / Verloop controlepunten lijst */}
        <div className="space-y-1 pt-1 border-t border-slate-200/60">
          <div className="text-[11px] font-bold text-amber-700 flex items-center justify-between">
            <span>Curve / Verloop ({currentVisuals.musclePath?.length || 0})</span>
          </div>
          {(!currentVisuals.musclePath || currentVisuals.musclePath.length === 0) ? (
            <div className="text-[11px] text-slate-400 italic py-1">Rechte lijn (geen hoek/curve)</div>
          ) : (
            currentVisuals.musclePath.map((wpt, idx) => {
              const isSelected = selectedPoint?.type === 'path' && selectedPoint?.index === idx;
              const ptName = wpt.name || `Curve-punt ${idx + 1}`;

              return (
                <div
                  key={`wpt-item-${idx}`}
                  onClick={() => onSelectPoint?.({ point: wpt, type: 'path', index: idx })}
                  className={`p-2 rounded-xl text-xs flex items-center justify-between cursor-pointer border transition ${
                    isSelected
                      ? 'bg-amber-50 border-amber-400 ring-2 ring-amber-200 shadow-xs'
                      : 'bg-white border-slate-200 hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500 shrink-0" />
                    <div className="min-w-0">
                      <div className="font-bold text-slate-900 truncate">
                        C{idx + 1}: {ptName}
                      </div>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeletePointByIndex?.('path', idx);
                    }}
                    className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                    title="Verwijder dit curve-punt"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })
          )}
        </div>

        {/* Aanhechtingslijnen / Tolerantie-zones (bijv. Linea alba, Crista iliaca, Wervelkolom) */}
        <div className="space-y-2 pt-2 border-t border-slate-200/80">
          <div className="flex items-center justify-between text-[11px] font-bold text-slate-800">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-0.5 border-b-2 border-dashed border-indigo-600 inline-block" />
              <span>Aanhechtingslijnen / Zones ({(currentVisuals.attachmentLines || []).length})</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  if (!selectedMuscle) return;
                  const newLines = [...(currentVisuals.attachmentLines || [])];
                  newLines.push({
                    id: `line-origin-${Date.now()}`,
                    type: 'origin',
                    name: `${selectedMuscle.originText || 'Origo-zone'}`,
                    points: [],
                    tolerance: 0.045,
                  });
                  updateMuscleVisuals(selectedMuscle.id, activeSide, {
                    ...currentVisuals,
                    attachmentLines: newLines,
                  });
                  setActiveTool('origin_line');
                }}
                className="px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 hover:bg-blue-200 text-[10px] font-bold transition"
                title="Maak een nieuwe Origo-zone aan (bijv. wervels of crista)"
              >
                + O-zone
              </button>
              <button
                type="button"
                onClick={() => {
                  if (!selectedMuscle) return;
                  const newLines = [...(currentVisuals.attachmentLines || [])];
                  newLines.push({
                    id: `line-insertion-${Date.now()}`,
                    type: 'insertion',
                    name: `${selectedMuscle.insertionText || 'Insertie-zone'}`,
                    points: [],
                    tolerance: 0.045,
                  });
                  updateMuscleVisuals(selectedMuscle.id, activeSide, {
                    ...currentVisuals,
                    attachmentLines: newLines,
                  });
                  setActiveTool('insertion_line');
                }}
                className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-800 hover:bg-rose-200 text-[10px] font-bold transition"
                title="Maak een nieuwe Insertie-zone aan (bijv. Linea alba)"
              >
                + I-zone
              </button>
            </div>
          </div>

          {(!currentVisuals.attachmentLines || currentVisuals.attachmentLines.length === 0) ? (
            <div className="text-[11px] text-slate-400 italic py-1">Geen aanhechtingszones (alleen losse punten)</div>
          ) : (
            currentVisuals.attachmentLines.map((line, lIdx) => {
              const isOrig = line.type === 'origin';
              return (
                <div key={line.id || lIdx} className="p-2 bg-white rounded-xl border border-slate-200 space-y-1.5 text-xs shadow-xs">
                  <div className="flex items-center justify-between gap-1">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`px-1.5 py-0.5 rounded text-[10px] font-black uppercase tracking-wider shrink-0 ${
                        isOrig ? 'bg-blue-100 text-blue-800' : 'bg-rose-100 text-rose-800'
                      }`}>
                        {isOrig ? 'Origo-lijn' : 'Insertie-lijn'}
                      </span>
                      <input
                        type="text"
                        value={line.name}
                        onChange={(e) => {
                          if (!selectedMuscle) return;
                          const newLines = [...(currentVisuals.attachmentLines || [])];
                          newLines[lIdx] = { ...line, name: e.target.value };
                          updateMuscleVisuals(selectedMuscle.id, activeSide, {
                            ...currentVisuals,
                            attachmentLines: newLines,
                          });
                        }}
                        className="font-bold text-slate-800 text-[11px] bg-transparent border-b border-transparent hover:border-slate-300 focus:border-blue-500 focus:outline-none min-w-0 flex-1"
                        placeholder="Naam zone (bijv. Linea alba)..."
                      />
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        type="button"
                        onClick={() => {
                          setActiveTool(isOrig ? 'origin_line' : 'insertion_line');
                          if (line.points.length > 0) {
                            onSelectPoint?.({
                              point: line.points[line.points.length - 1],
                              type: 'line_point',
                              index: line.points.length - 1,
                              lineIndex: lIdx,
                            });
                          }
                        }}
                        className="px-1.5 py-0.5 bg-slate-100 hover:bg-blue-50 text-slate-700 hover:text-blue-700 rounded text-[10px] font-semibold transition"
                        title="Klik om extra punten aan deze lijn toe te voegen op het skelet"
                      >
                        + Punt
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (!selectedMuscle) return;
                          const newLines = (currentVisuals.attachmentLines || []).filter((_, i) => i !== lIdx);
                          updateMuscleVisuals(selectedMuscle.id, activeSide, {
                            ...currentVisuals,
                            attachmentLines: newLines,
                          });
                          if (selectedPoint?.type === 'line_point' && selectedPoint.lineIndex === lIdx) {
                            onSelectPoint?.(null);
                          }
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded transition"
                        title="Verwijder deze zone"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Lijst met vertices in deze lijn */}
                  <div className="space-y-1 pl-2 border-l-2 border-slate-200">
                    {line.points.map((pt, pIdx) => {
                      const isPtSelected = selectedPoint?.type === 'line_point' &&
                        selectedPoint.lineIndex === lIdx &&
                        selectedPoint.index === pIdx;
                      return (
                        <div
                          key={`lp-${lIdx}-${pIdx}`}
                          onClick={() => onSelectPoint?.({ point: pt, type: 'line_point', index: pIdx, lineIndex: lIdx })}
                          className={`flex items-center justify-between px-2 py-1 rounded text-[11px] cursor-pointer transition ${
                            isPtSelected
                              ? 'bg-blue-50 border border-blue-300 font-bold text-blue-900'
                              : 'hover:bg-slate-50 text-slate-600'
                          }`}
                        >
                          <span>Knikpunt #{pIdx + 1} (x: {pt.x.toFixed(2)}, y: {pt.y.toFixed(2)})</span>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              if (!selectedMuscle) return;
                              const newLines = [...(currentVisuals.attachmentLines || [])];
                              const updatedPts = line.points.filter((_, i) => i !== pIdx);
                              if (updatedPts.length === 0) {
                                newLines.splice(lIdx, 1);
                              } else {
                                newLines[lIdx] = { ...line, points: updatedPts };
                              }
                              updateMuscleVisuals(selectedMuscle.id, activeSide, {
                                ...currentVisuals,
                                attachmentLines: newLines,
                              });
                              if (isPtSelected) onSelectPoint?.(null);
                            }}
                            className="text-slate-400 hover:text-rose-600 p-0.5"
                            title="Verwijder dit punt uit de lijn"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Inline bewerker voor de geselecteerde marker (naam aanpassen) */}
        {selectedPoint && (
          <div className="mt-2 p-3 bg-blue-50/90 rounded-xl border border-blue-200 space-y-1.5 animate-in fade-in duration-150">
            <div className="flex items-center justify-between text-[11px] font-bold text-blue-900">
              <span>
                Naam {selectedPoint.type === 'origin' ? 'Origo' :
                      selectedPoint.type === 'insertion' ? 'Insertie' :
                      selectedPoint.type === 'line_point' ? `Zone #${(selectedPoint.lineIndex ?? 0) + 1} Punt` :
                      'Curve'} #{selectedPoint.index + 1}:
              </span>
            </div>
            <input
              type="text"
              value={selectedPoint.point.name ?? (
                selectedPoint.type === 'origin' ? (selectedMuscle?.visuals[activeSide]?.origins[selectedPoint.index]?.name || selectedMuscle?.originText) :
                selectedPoint.type === 'insertion' ? (selectedMuscle?.visuals[activeSide]?.insertions[selectedPoint.index]?.name || selectedMuscle?.insertionText) :
                selectedPoint.type === 'line_point' ? (selectedMuscle?.visuals[activeSide]?.attachmentLines?.[selectedPoint.lineIndex ?? 0]?.name || 'Aanhechtingszone') :
                `Curve-punt ${selectedPoint.index + 1}`
              ) ?? ''}
              onChange={(e) => onRenamePoint?.(selectedPoint.type, selectedPoint.index, e.target.value, selectedPoint.lineIndex)}
              placeholder="Typ een annotatie..."
              className="w-full px-2.5 py-1.5 bg-white border border-blue-300 rounded-lg text-xs font-semibold text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-[10px] text-blue-700 leading-tight">
              💡 {selectedPoint.type === 'path' ? 'Dit punt fungeert als buigpunt / bocht in het spierverloop.' :
                  selectedPoint.type === 'line_point' ? 'Dit punt vormt een knikpunt in de continue aanhechtingszone.' :
                  'Aanhechtingspunten met dezelfde naam synchroniseren over alle spieren.'}
            </p>
          </div>
        )}
      </div>

      {/* 5. Bewerkacties (Ongedaan maken & Verwijder selectie) */}
      <div className="space-y-2 pt-1 border-t border-clinical-100">
        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            disabled={!canUndo}
            onClick={onUndo}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
              canUndo
                ? 'bg-clinical-100 hover:bg-clinical-200 text-clinical-800 border-clinical-200'
                : 'bg-clinical-50 text-clinical-300 border-clinical-100 cursor-not-allowed'
            }`}
          >
            <Undo2 className="w-3.5 h-3.5" />
            <span>Ongedaan maken</span>
          </button>

          <button
            type="button"
            disabled={!selectedPoint}
            onClick={onDeleteSelected}
            className={`flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg text-xs font-semibold border transition ${
              selectedPoint
                ? 'bg-rose-50 hover:bg-rose-100 text-rose-700 border-rose-200'
                : 'bg-clinical-50 text-clinical-300 border-clinical-100 cursor-not-allowed'
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Verwijder selectie</span>
          </button>
        </div>
      </div>

      {/* 6. Exporteer / Importeer / Herstel */}
      <div className="pt-2 border-t border-clinical-100 space-y-1.5">
        {import.meta.env.DEV && (
          <button
            type="button"
            onClick={saveToDisk}
            className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-semibold shadow-xs transition"
            title="Sla alle huidige spieren direct op in src/data/muscles.json op schijf"
          >
            <Save className="w-3.5 h-3.5" />
            <span>Opslaan naar bronbestand</span>
          </button>
        )}

        <div className="grid grid-cols-2 gap-1.5">
          <button
            type="button"
            onClick={exportDataset}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-slate-100 hover:bg-slate-200 text-slate-800 border border-slate-200 rounded-lg text-[11px] font-semibold transition"
            title="Download huidige spierdata als muscles.json op je computer"
          >
            <Download className="w-3 h-3" />
            <span>Exporteer JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center justify-center gap-1.5 py-1.5 px-2 bg-blue-50 hover:bg-blue-100 text-blue-800 border border-blue-200 rounded-lg text-[11px] font-semibold transition"
            title="Upload een eerder opgeslagen muscles.json bestand vanaf je computer"
          >
            <Upload className="w-3 h-3" />
            <span>Importeer JSON</span>
          </button>
        </div>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileUpload}
          className="hidden"
        />

        <button
          type="button"
          onClick={() => {
            if (window.confirm('Weet u zeker dat u de dataset wilt herstellen naar de standaardwaarden?')) {
              resetDataset();
            }
          }}
          className="w-full flex items-center justify-center gap-1.5 py-1 px-2.5 text-[11px] text-rose-600 hover:text-rose-800 hover:bg-rose-50 rounded-lg transition"
        >
          <RotateCcw className="w-3 h-3" />
          <span>Herstel dataset naar standaardwaarden</span>
        </button>
      </div>

      {/* MODAL: NIEUWE SPIER TOEVOEGEN */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-md w-full shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                <Plus className="w-4 h-4 text-emerald-600" />
                <span>Nieuwe Spier Toevoegen</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleSaveNewMuscle} className="space-y-3">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Spiernaam (bijv. m. gluteus minimus) *
                </label>
                <input
                  type="text"
                  required
                  value={newMuscleName}
                  onChange={(e) => setNewMuscleName(e.target.value)}
                  placeholder="m. ..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Gewrichtscategorie
                  </label>
                  <select
                    value={newMuscleJoint}
                    onChange={(e) => setNewMuscleJoint(e.target.value)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold text-slate-900"
                  >
                    {JOINT_CATEGORIES.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Aanzicht (Skelet)
                  </label>
                  <select
                    value={newMuscleView}
                    onChange={(e) => setNewMuscleView(e.target.value as AnatomicalView)}
                    className="w-full px-2.5 py-2 border rounded-xl text-xs font-semibold text-slate-900"
                  >
                    <option value="ventral">Ventraal</option>
                    <option value="dorsal">Dorsaal</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Origo Omschrijving
                </label>
                <input
                  type="text"
                  value={newMuscleOrigin}
                  onChange={(e) => setNewMuscleOrigin(e.target.value)}
                  placeholder="bijv. Tuber ischiadicum..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Insertie Omschrijving
                </label>
                <input
                  type="text"
                  value={newMuscleInsertion}
                  onChange={(e) => setNewMuscleInsertion(e.target.value)}
                  placeholder="bijv. Caput fibulae..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Werking / Functie (optioneel)
                </label>
                <input
                  type="text"
                  value={newMuscleFunction}
                  onChange={(e) => setNewMuscleFunction(e.target.value)}
                  placeholder="bijv. Flexie en endorotatie..."
                  className="w-full px-3 py-2 border rounded-xl text-xs font-semibold text-slate-900"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-2 border-t">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="py-2 px-4 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Annuleren
                </button>
                <button
                  type="submit"
                  className="py-2 px-5 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                >
                  Spier Toevoegen
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
