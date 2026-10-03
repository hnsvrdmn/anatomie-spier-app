import React, { useState, useMemo } from 'react';
import { useMuscles } from '../../context/MuscleContext';
import { JOINT_CATEGORIES } from '../../data/jointCategories';
import { MULTI_MUSCLE_COLORS } from '../skeleton/MuscleMarkers';
import { Search, X, Check, Square, CheckSquare } from 'lucide-react';

export const MuscleSearch: React.FC = () => {
  const { 
    muscles, 
    selectedMuscleId, 
    selectedMuscleIds, 
    selectMuscle, 
    toggleMuscleSelection, 
    setMultipleMuscles,
    clearSelectedMuscles,
    currentView,
    setCurrentView
  } = useMuscles();

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedJointId, setSelectedJointId] = useState<string>('all');

  const filteredMuscles = useMemo(() => {
    return muscles.filter((m) => {
      // 1. Zoekfilter
      const matchesSearch =
        m.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.originText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        m.insertionText.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (m.functionText && m.functionText.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.otherFunctions && m.otherFunctions.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (m.primaryMovements && m.primaryMovements.some((p) => `${p.joint} ${p.movement}`.toLowerCase().includes(searchTerm.toLowerCase())));

      if (!matchesSearch) return false;

      // 2. Gewricht filter
      if (selectedJointId === 'all') return true;
      return m.jointCategories && m.jointCategories.includes(selectedJointId);
    });
  }, [muscles, searchTerm, selectedJointId]);

  // Selecteer alle gefilterde spieren tegelijk
  const handleSelectAllFiltered = () => {
    if (filteredMuscles.length === 0) return;
    setMultipleMuscles(filteredMuscles.map(m => m.id));
  };

  return (
    <div className="flex flex-col space-y-3 bg-white p-3 sm:p-4 rounded-2xl border border-clinical-200/90 shadow-sm">
      {/* Zoekbalk */}
      <div className="relative">
        <Search className="w-4 h-4 text-clinical-400 absolute left-3 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Zoek spier (bijv. rectus femoris, deltoideus)..."
          className="w-full pl-9 pr-8 py-2 bg-clinical-50 border border-clinical-200 rounded-xl text-xs sm:text-sm text-clinical-900 placeholder:text-clinical-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:bg-white transition"
        />
        {searchTerm && (
          <button
            onClick={() => setSearchTerm('')}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-700 p-0.5"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </div>

      {/* Gewricht filterknoppen */}
      <div className="flex flex-wrap gap-1">
        <button
          onClick={() => setSelectedJointId('all')}
          className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all ${
            selectedJointId === 'all'
              ? 'bg-clinical-900 text-white shadow-xs'
              : 'bg-clinical-100 text-clinical-600 hover:bg-clinical-200'
          }`}
        >
          Alle Gewrichten
        </button>
        {JOINT_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            onClick={() => {
              setSelectedJointId(cat.id);
              const jointMuscles = muscles.filter(m => m.jointCategories?.includes(cat.id));
              if (jointMuscles.length > 0) {
                setMultipleMuscles(jointMuscles.map(m => m.id));
              }
            }}
            title={cat.title}
            className={`px-2 py-1 rounded-lg text-[11px] font-semibold transition-all ${
              selectedJointId === cat.id
                ? 'bg-blue-600 text-white shadow-xs'
                : 'bg-clinical-100 text-clinical-700 hover:bg-clinical-200'
            }`}
          >
            {cat.name.replace('ARTICULATIO ', 'Art. ').replace('ARTICULATIONES ', 'Art. ')}
          </button>
        ))}
      </div>

      {/* Werkbalk: Wis selectie zodra > 1 spier is geselecteerd, anders Selecteer alles */}
      <div className="flex items-center justify-between pt-1 border-t border-clinical-100 text-xs">
        <span className="text-[11px] font-medium text-slate-500">
          {selectedMuscleIds.length > 1
            ? `${selectedMuscleIds.length} spieren actief`
            : `${filteredMuscles.length} ${filteredMuscles.length === 1 ? 'spier' : 'spieren'}`}
        </span>

        {selectedMuscleIds.length > 1 ? (
          <button
            type="button"
            onClick={clearSelectedMuscles}
            className="text-[11px] font-bold text-rose-600 hover:text-rose-800 underline transition"
            title="Wis meervoudige selectie"
          >
            Wis selectie
          </button>
        ) : (
          <button
            type="button"
            onClick={handleSelectAllFiltered}
            className="text-[11px] font-semibold text-blue-600 hover:text-blue-800 underline transition"
            title="Selecteer alle spieren in de huidige selectie/filter"
          >
            Selecteer alles ({filteredMuscles.length})
          </button>
        )}
      </div>

      {/* Selectielijst */}
      <div className="max-h-56 sm:max-h-64 overflow-y-auto space-y-1 pr-1 border-t border-clinical-100 pt-2 custom-scrollbar">
        {filteredMuscles.length === 0 ? (
          <div className="py-4 text-center text-xs text-clinical-400 italic">
            Geen spieren gevonden voor de selectie
          </div>
        ) : (
          filteredMuscles.map((m) => {
            const isSelected = selectedMuscleIds.includes(m.id);
            const isPrimary = m.id === selectedMuscleId;
            const selIndex = selectedMuscleIds.indexOf(m.id);
            const color = selIndex !== -1 ? MULTI_MUSCLE_COLORS[selIndex % MULTI_MUSCLE_COLORS.length] : undefined;

            return (
              <div
                key={m.id}
                onClick={() => {
                  // Klikken op de rij zelf selecteert/focust deze spier en schakelt direct naar het juiste aanzicht
                  selectMuscle(m.id, true);
                  if (currentView !== m.view) {
                    setCurrentView(m.view);
                  }
                }}
                className={`w-full cursor-pointer px-3 py-2 rounded-xl flex items-center justify-between text-xs transition-all ${
                  isSelected
                    ? 'bg-blue-50 border border-blue-200 text-blue-900 font-bold shadow-xs'
                    : 'hover:bg-clinical-50 text-clinical-700 border border-transparent'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  {/* Checkbox: aanvinken onthoudt meervoudige selectie */}
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      toggleMuscleSelection(m.id);
                    }}
                    className="shrink-0 p-0.5 rounded text-clinical-400 hover:text-blue-600 transition"
                    title={isSelected ? 'Verwijder uit selectie' : 'Voeg toe aan selectie'}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4 text-slate-300 hover:text-slate-400" />
                    )}
                  </button>

                  {isSelected && selectedMuscleIds.length > 1 && (
                    <span
                      className="w-2.5 h-2.5 rounded-full inline-block border-2 border-white shadow-xs shrink-0"
                      style={{ backgroundColor: color || '#2563eb' }}
                    />
                  )}

                  <span className="font-semibold truncate text-xs sm:text-sm">
                    {m.name}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 shrink-0 ml-2">
                  {isPrimary && selectedMuscleIds.length > 1 && (
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.2 rounded bg-blue-200 text-blue-800">
                      Focus
                    </span>
                  )}
                  {isSelected && <Check className="w-4 h-4 text-blue-600 shrink-0" />}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
};

