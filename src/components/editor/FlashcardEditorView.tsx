import React, { useState, useMemo, useRef } from 'react';
import { useFlashcards } from '../../context/FlashcardContext';
import { useMuscles } from '../../context/MuscleContext';
import {
  Plus,
  Trash2,
  Copy,
  Save,
  Download,
  Upload,
  RotateCcw,
  Search,
  Image as ImageIcon,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  FileQuestion,
} from 'lucide-react';
import { FlashcardItem } from '../../data/flashcardsData';

// Lijst van alle beschikbare flashcard afbeeldingen in public/images/flashcards/
const AVAILABLE_FLASHCARD_IMAGES = [
  'assen_vlakken_3assen.png',
  'assen_vlakken_3vlakken.png',
  'bewegingen_cingulum.png',
  'bewegingen_coxae.png',
  'bewegingen_pedis.png',
  'bewegingen_romp.png',
  'bewegingsanalyse_1_2_3.png',
  'bewegingsanalyse_streksprong.png',
  'cingulum_scapulahumeraal.png',
  'cingulum_spieren_fig.png',
  'cingulum_sternum_clavicula.png',
  'coxae_botten_1_15.png',
  'coxae_spieren_fig.png',
  'cubiti_botten_1_13.png',
  'cubiti_spieren_fig.png',
  'genus_botten_1_9.png',
  'genus_ligamenten_1_8.png',
  'genus_spieren_fig.png',
  'gewrichten_3soorten.png',
  'humeri_bewegingen_fig.png',
  'humeri_botten_1_10.png',
  'humeri_spieren_fig.png',
  'manus_botten_1_10.png',
  'manus_spieren_fig.png',
  'pedis_botten_1_12.png',
  'pedis_ligamenten_1_4.png',
  'pedis_spieren_fig.png',
  'richtingen_1_14.png',
  'richtingen_os_coxae.png',
  'romp_buikspieren_fig.png',
  'romp_wervel_1_8.png',
  'romp_wervelkolom_1_10.png',
  'streksprong_opwaarts.png',
  'streksprong_stand.png',
  'streksprong_voorbereiding.png',
  'voorbereidingsfase_sprong.png',
  'wervel_cwervel.png',
  'wervelkolom_gebogen.png',
];

export const FlashcardEditorView: React.FC = () => {
  const {
    flashcardSets,
    activeSetId,
    setActiveSetId,
    activeSet,
    updateCard,
    addCard,
    deleteCard,
    duplicateCard,
    resetFlashcards,
    exportFlashcardsJson,
    importFlashcardsJson,
    saveFlashcardsToDisk,
  } = useFlashcards();

  const { showToast } = useMuscles();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCardId, setSelectedCardId] = useState<string | null>(() => {
    return activeSet?.cards[0]?.id || null;
  });

  const [isFlippedPreview, setIsFlippedPreview] = useState(false);
  const [isSavingDisk, setIsSavingDisk] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Gefilterde kaarten in de actieve set
  const filteredCards = useMemo(() => {
    if (!activeSet) return [];
    if (!searchQuery.trim()) return activeSet.cards;
    const q = searchQuery.toLowerCase();
    return activeSet.cards.filter(
      (c) =>
        c.question.toLowerCase().includes(q) ||
        c.answer.toLowerCase().includes(q) ||
        c.categoryLabel.toLowerCase().includes(q)
    );
  }, [activeSet, searchQuery]);

  // Geselecteerde kaart
  const selectedCard = useMemo(() => {
    if (!activeSet) return null;
    return activeSet.cards.find((c) => c.id === selectedCardId) || activeSet.cards[0] || null;
  }, [activeSet, selectedCardId]);

  // Index van de geselecteerde kaart binnen de set
  const selectedCardIndex = useMemo(() => {
    if (!activeSet || !selectedCard) return -1;
    return activeSet.cards.findIndex((c) => c.id === selectedCard.id);
  }, [activeSet, selectedCard]);

  // Unieke categorieën in deze set (als handige suggestiechips)
  const existingCategories = useMemo(() => {
    if (!activeSet) return [];
    const set = new Set<string>();
    activeSet.cards.forEach((c) => {
      if (c.categoryLabel?.trim()) set.add(c.categoryLabel.trim());
    });
    return Array.from(set);
  }, [activeSet]);

  // Navigatie
  const handleSelectCard = (id: string) => {
    setSelectedCardId(id);
    setIsFlippedPreview(false);
  };

  const handlePrevCard = () => {
    if (!activeSet || selectedCardIndex <= 0) return;
    const prev = activeSet.cards[selectedCardIndex - 1];
    if (prev) handleSelectCard(prev.id);
  };

  const handleNextCard = () => {
    if (!activeSet || selectedCardIndex >= activeSet.cards.length - 1) return;
    const next = activeSet.cards[selectedCardIndex + 1];
    if (next) handleSelectCard(next.id);
  };

  // Nieuwe kaart toevoegen
  const handleAddNewCard = () => {
    if (!activeSet) return;
    const newCard = addCard(activeSet.id, {
      categoryLabel: existingCategories[0] || 'Algemeen',
      question: 'Nieuwe vraag...',
      answer: 'Antwoord hier invullen...',
    });
    setSelectedCardId(newCard.id);
    setIsFlippedPreview(false);
    showToast('Nieuwe kaart toegevoegd aan deze set', 'success');
  };

  // Kaart dupliceren
  const handleDuplicate = () => {
    if (!activeSet || !selectedCard) return;
    const dup = duplicateCard(activeSet.id, selectedCard.id);
    if (dup) {
      setSelectedCardId(dup.id);
      showToast('Kaart gedupliceerd', 'info');
    }
  };

  // Kaart verwijderen
  const handleDeleteCard = (card: FlashcardItem) => {
    if (!activeSet) return;
    if (window.confirm(`Weet u zeker dat u deze kaart wilt verwijderen?\n\n"${card.question.slice(0, 60)}..."`)) {
      deleteCard(activeSet.id, card.id);
      showToast('Kaart verwijderd', 'info');
      // Selecteer een andere kaart
      const nextCard = activeSet.cards.find((c) => c.id !== card.id);
      setSelectedCardId(nextCard?.id || null);
    }
  };

  // Opslaan naar schijf
  const handleSaveToDisk = async () => {
    setIsSavingDisk(true);
    const res = await saveFlashcardsToDisk();
    setIsSavingDisk(false);
    if (res.success) {
      showToast(res.message, 'success');
    } else {
      showToast(res.message, 'error');
    }
  };

  // Resetten naar standaard
  const handleReset = () => {
    if (
      window.confirm(
        'Weet u zeker dat u alle flashcards wilt terugzetten naar de oorspronkelijke standaard?\n\nAl uw handmatige bewerkingen in de browser gaan verloren.'
      )
    ) {
      resetFlashcards();
      showToast('Flashcards hersteld naar standaard!', 'info');
    }
  };

  // Importeren JSON
  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        const ok = importFlashcardsJson(json);
        if (ok) {
          showToast('Flashcards succesvol geïmporteerd!', 'success');
        } else {
          showToast('Ongeldig flashcard JSON bestand.', 'error');
        }
      } catch (err: any) {
        showToast('Fout bij inlezen JSON: ' + err.message, 'error');
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Totale kaarten telling over alle sets
  const totalCardsAllSets = useMemo(() => {
    return flashcardSets.reduce((sum, s) => sum + s.cards.length, 0);
  }, [flashcardSets]);

  return (
    <div className="flex-1 w-full max-w-7xl mx-auto px-3 sm:px-6 lg:px-8 py-4 flex flex-col gap-4">
      {/* Top Header & Actiebalk */}
      <div className="bg-white rounded-2xl p-4 border border-clinical-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-indigo-50 text-indigo-600 border border-indigo-100">
            <FileQuestion className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold text-clinical-950 flex items-center gap-2">
              <span>Flashcards Editor</span>
              <span className="text-xs px-2 py-0.5 rounded-full font-bold bg-indigo-100 text-indigo-700">
                PC Modus
              </span>
            </h1>
            <p className="text-xs text-clinical-600">
              Beheer alle {totalCardsAllSets} flashcards over {flashcardSets.length} sets. Wijzig vragen, antwoorden en afbeeldingen.
            </p>
          </div>
        </div>

        {/* Globale actieknoppen */}
        <div className="flex items-center gap-2 flex-wrap">
          <button
            type="button"
            onClick={handleSaveToDisk}
            disabled={isSavingDisk}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition active:scale-95 disabled:opacity-50"
            title="Sla direct op naar flashcardsCustom.json op de schijf"
          >
            <Save className="w-3.5 h-3.5" />
            <span>{isSavingDisk ? 'Opslaan...' : 'Opslaan naar schijf'}</span>
          </button>

          <button
            type="button"
            onClick={exportFlashcardsJson}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-clinical-50 hover:bg-clinical-100 text-clinical-800 border border-clinical-200 transition active:scale-95"
            title="Download een JSON back-up van alle flashcards"
          >
            <Download className="w-3.5 h-3.5 text-clinical-600" />
            <span>Exporteer JSON</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold bg-clinical-50 hover:bg-clinical-100 text-clinical-800 border border-clinical-200 transition active:scale-95"
            title="Importeer een JSON back-up van flashcards"
          >
            <Upload className="w-3.5 h-3.5 text-clinical-600" />
            <span>Importeer JSON</span>
          </button>
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileImport}
            accept=".json"
            className="hidden"
          />

          <button
            type="button"
            onClick={handleReset}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold text-rose-600 hover:bg-rose-50 border border-rose-200/80 transition active:scale-95"
            title="Zet alle flashcards terug naar de standaardversie"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Standaard herstellen</span>
          </button>
        </div>
      </div>

      {/* Set Selector Tabs / Dropdown */}
      <div className="bg-white rounded-2xl p-3 border border-clinical-200 shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-1 min-w-[280px]">
          <span className="text-xs font-bold text-clinical-700 whitespace-nowrap">Selecteer Set:</span>
          <select
            value={activeSetId}
            onChange={(e) => {
              setActiveSetId(e.target.value);
              const target = flashcardSets.find((s) => s.id === e.target.value);
              if (target && target.cards.length > 0) {
                setSelectedCardId(target.cards[0].id);
              } else {
                setSelectedCardId(null);
              }
              setIsFlippedPreview(false);
            }}
            className="flex-1 px-3 py-1.5 rounded-xl text-xs font-semibold bg-clinical-50 border border-clinical-200 text-clinical-950 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 cursor-pointer"
          >
            {flashcardSets.map((s) => (
              <option key={s.id} value={s.id}>
                {s.title} ({s.cards.length} kaarten)
              </option>
            ))}
          </select>
        </div>

        {activeSet && (
          <div className="flex items-center gap-2 text-xs text-clinical-500">
            <span className="font-semibold text-clinical-700">{activeSet.cards.length}</span> kaarten in deze set
            {activeSet.pdfSource && (
              <span className="hidden sm:inline bg-clinical-100 text-clinical-600 px-2 py-0.5 rounded-md font-medium text-[11px]">
                Bron: {activeSet.pdfSource}
              </span>
            )}
          </div>
        )}
      </div>

      {/* Twee-koloms bewerker: Links kaartenlijst, Rechts bewerkingsformulier & live preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-4 items-start min-h-[650px]">
        {/* Linker kolom: Kaartenlijst (4 kolommen op breed scherm) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-clinical-200 shadow-xs flex flex-col h-[750px] overflow-hidden">
          {/* Zoekbalk & Toevoegen knop */}
          <div className="p-3 border-b border-clinical-100 flex flex-col gap-2 shrink-0">
            <div className="relative">
              <Search className="w-3.5 h-3.5 text-clinical-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Zoek kaart in deze set..."
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 placeholder:text-clinical-400 focus:outline-hidden focus:ring-2 focus:ring-indigo-500"
              />
              {searchQuery && (
                <button
                  type="button"
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-clinical-400 hover:text-clinical-700"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <button
              type="button"
              onClick={handleAddNewCard}
              className="w-full py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 shadow-xs transition active:scale-98"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Nieuwe kaart toevoegen</span>
            </button>
          </div>

          {/* Scrollbare lijst met kaarten */}
          <div className="flex-1 overflow-y-auto divide-y divide-clinical-100 p-1">
            {filteredCards.length === 0 ? (
              <div className="p-6 text-center text-xs text-clinical-400">
                Geen kaarten gevonden met &quot;{searchQuery}&quot;.
              </div>
            ) : (
              filteredCards.map((card, idx) => {
                const isSelected = card.id === selectedCard?.id;
                const realIndex = activeSet ? activeSet.cards.findIndex((c) => c.id === card.id) + 1 : idx + 1;

                return (
                  <div
                    key={card.id}
                    onClick={() => handleSelectCard(card.id)}
                    className={`p-2.5 rounded-xl cursor-pointer transition-all flex items-start gap-2.5 text-left ${
                      isSelected
                        ? 'bg-indigo-50/90 border border-indigo-200 shadow-xs'
                        : 'hover:bg-clinical-50 border border-transparent'
                    }`}
                  >
                    {/* Index badge */}
                    <span
                      className={`shrink-0 w-6 h-6 rounded-lg text-[11px] font-bold flex items-center justify-center ${
                        isSelected
                          ? 'bg-indigo-600 text-white'
                          : 'bg-clinical-100 text-clinical-600'
                      }`}
                    >
                      {realIndex}
                    </span>

                    {/* Kaart snippet */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-1 flex-wrap">
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-clinical-100 text-clinical-700 truncate max-w-[140px]">
                          {card.categoryLabel || 'Algemeen'}
                        </span>
                        {card.imageUrl && (
                          <span
                            className="text-[10px] flex items-center gap-0.5 text-sky-600 bg-sky-50 px-1 py-0.5 rounded font-medium"
                            title="Heeft gekoppelde afbeelding"
                          >
                            <ImageIcon className="w-2.5 h-2.5" />
                            <span>Afbeelding</span>
                          </span>
                        )}
                      </div>
                      <p className="text-xs font-semibold text-clinical-900 line-clamp-2 leading-snug">
                        {card.question}
                      </p>
                    </div>

                    {/* Verwijder icoon */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteCard(card);
                      }}
                      className="shrink-0 p-1 text-clinical-300 hover:text-rose-600 rounded-lg hover:bg-rose-50 transition"
                      title="Verwijder kaart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Rechter kolom: Kaart Detail Bewerker & Live Preview (8 kolommen op breed scherm) */}
        <div className="lg:col-span-8 flex flex-col gap-4">
          {selectedCard && activeSet ? (
            <>
              {/* Formulier Card */}
              <div className="bg-white rounded-2xl p-5 border border-clinical-200 shadow-xs flex flex-col gap-4">
                {/* Bovenbalk van de kaart */}
                <div className="flex items-center justify-between pb-3 border-b border-clinical-100">
                  <div className="flex items-center gap-2">
                    <span className="px-2.5 py-1 rounded-lg bg-indigo-600 text-white font-bold text-xs">
                      Kaart #{selectedCardIndex + 1}
                    </span>
                    <span className="text-xs text-clinical-500">
                      van de {activeSet.cards.length} in &quot;{activeSet.shortTitle}&quot;
                    </span>
                  </div>

                  {/* Navigatie & acties */}
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={handlePrevCard}
                      disabled={selectedCardIndex <= 0}
                      className="p-1.5 rounded-lg border border-clinical-200 text-clinical-600 hover:bg-clinical-50 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Vorige kaart"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      type="button"
                      onClick={handleNextCard}
                      disabled={selectedCardIndex >= activeSet.cards.length - 1}
                      className="p-1.5 rounded-lg border border-clinical-200 text-clinical-600 hover:bg-clinical-50 disabled:opacity-30 disabled:pointer-events-none transition"
                      title="Volgende kaart"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    <div className="h-4 w-px bg-clinical-200 mx-1" />

                    <button
                      type="button"
                      onClick={handleDuplicate}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-clinical-200 text-xs font-semibold text-clinical-700 hover:bg-clinical-50 transition"
                      title="Dupliceer deze kaart"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Dupliceer</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleDeleteCard(selectedCard)}
                      className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg border border-rose-200 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition"
                      title="Verwijder deze kaart"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Verwijder</span>
                    </button>
                  </div>
                </div>

                {/* Categorie Veld & Suggestiechips */}
                <div>
                  <label className="block text-xs font-bold text-clinical-800 mb-1">
                    Categorie / Label:
                  </label>
                  <input
                    type="text"
                    value={selectedCard.categoryLabel}
                    onChange={(e) =>
                      updateCard(activeSet.id, selectedCard.id, {
                        categoryLabel: e.target.value,
                      })
                    }
                    placeholder="Bijv. Anatomische stand, Gewrichten, Spieren..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium"
                  />

                  {/* Suggestiechips */}
                  {existingCategories.length > 0 && (
                    <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                      <span className="text-[10px] text-clinical-400 font-semibold">Veelgebruikt:</span>
                      {existingCategories.slice(0, 6).map((cat) => (
                        <button
                          key={cat}
                          type="button"
                          onClick={() =>
                            updateCard(activeSet.id, selectedCard.id, {
                              categoryLabel: cat,
                            })
                          }
                          className={`text-[10px] px-2 py-0.5 rounded-md font-semibold transition ${
                            selectedCard.categoryLabel === cat
                              ? 'bg-indigo-600 text-white'
                              : 'bg-clinical-100 hover:bg-clinical-200 text-clinical-700'
                          }`}
                        >
                          {cat}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Vraag Veld */}
                <div>
                  <label className="block text-xs font-bold text-clinical-800 mb-1">
                    Vraag:
                  </label>
                  <textarea
                    rows={3}
                    value={selectedCard.question}
                    onChange={(e) =>
                      updateCard(activeSet.id, selectedCard.id, {
                        question: e.target.value,
                      })
                    }
                    placeholder="Typ de vraag hier..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed"
                  />
                </div>

                {/* Antwoord Veld */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-clinical-800">
                      Antwoord:
                    </label>
                    <span className="text-[10px] text-clinical-400">
                      Gebruik opsommingstekens (•) of nieuwe regels voor overzichtelijkheid
                    </span>
                  </div>
                  <textarea
                    rows={4}
                    value={selectedCard.answer}
                    onChange={(e) =>
                      updateCard(activeSet.id, selectedCard.id, {
                        answer: e.target.value,
                      })
                    }
                    placeholder="Typ het antwoord hier..."
                    className="w-full px-3 py-2 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium leading-relaxed font-mono"
                  />
                </div>

                {/* Afbeelding Koppelveld */}
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-xs font-bold text-clinical-800 flex items-center gap-1.5">
                      <ImageIcon className="w-3.5 h-3.5 text-sky-600" />
                      <span>Koppel Afbeelding:</span>
                    </label>
                    {selectedCard.imageUrl && (
                      <button
                        type="button"
                        onClick={() =>
                          updateCard(activeSet.id, selectedCard.id, {
                            imageUrl: undefined,
                          })
                        }
                        className="text-[11px] text-rose-600 hover:underline font-semibold"
                      >
                        Afbeelding ontkoppelen
                      </button>
                    )}
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <select
                      value={
                        selectedCard.imageUrl
                          ? selectedCard.imageUrl.replace('/images/flashcards/', '')
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        updateCard(activeSet.id, selectedCard.id, {
                          imageUrl: val ? `/images/flashcards/${val}` : undefined,
                        });
                      }}
                      className="flex-1 px-3 py-2 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-medium cursor-pointer"
                    >
                      <option value="">(Geen afbeelding)</option>
                      {AVAILABLE_FLASHCARD_IMAGES.map((imgName) => (
                        <option key={imgName} value={imgName}>
                          {imgName}
                        </option>
                      ))}
                    </select>

                    {/* Vrije URL/pad invoer voor eventuele eigen uploads */}
                    <input
                      type="text"
                      value={selectedCard.imageUrl || ''}
                      onChange={(e) =>
                        updateCard(activeSet.id, selectedCard.id, {
                          imageUrl: e.target.value || undefined,
                        })
                      }
                      placeholder="Of typ eigen URL/pad..."
                      className="sm:w-60 px-3 py-2 text-xs rounded-xl bg-clinical-50 border border-clinical-200 text-clinical-900 focus:outline-hidden focus:ring-2 focus:ring-indigo-500 font-mono text-[11px]"
                    />
                  </div>

                  {/* Thumbnail & Preview van gekoppelde afbeelding */}
                  {selectedCard.imageUrl && (
                    <div className="mt-3 p-3 bg-clinical-50 rounded-xl border border-clinical-200 flex items-center gap-4">
                      <div className="w-24 h-24 rounded-lg bg-white border border-clinical-200 overflow-hidden flex items-center justify-center shrink-0 p-1">
                        <img
                          src={selectedCard.imageUrl}
                          alt="Gekoppelde afbeelding preview"
                          className="max-h-full max-w-full object-contain"
                          onError={(e) => {
                            (e.target as HTMLElement).style.display = 'none';
                          }}
                        />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold text-clinical-900 truncate">
                          {selectedCard.imageUrl}
                        </p>
                        <p className="text-[11px] text-clinical-500 mt-0.5">
                          Deze afbeelding wordt getoond bij de vraag en kan door de student worden vergroot.
                        </p>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Interactieve Live Preview Card (hoe de student hem ziet) */}
              <div className="bg-clinical-900/5 rounded-2xl p-4 border border-clinical-200/80">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-clinical-700 flex items-center gap-1.5">
                    <Eye className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Live Preview (klik om om te draaien):</span>
                  </span>
                  <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-white text-clinical-600 border border-clinical-200">
                    {isFlippedPreview ? 'Zichtbaar: Antwoord' : 'Zichtbaar: Vraag'}
                  </span>
                </div>

                <div
                  onClick={() => setIsFlippedPreview(!isFlippedPreview)}
                  className="bg-white rounded-2xl p-6 border border-clinical-200 shadow-sm cursor-pointer hover:border-indigo-300 transition-all min-h-[180px] flex flex-col justify-between"
                >
                  <div className="flex items-center justify-between text-xs mb-3">
                    <span className="px-2.5 py-0.5 rounded-full font-bold bg-indigo-50 text-indigo-700 text-[11px]">
                      {selectedCard.categoryLabel || 'Algemeen'}
                    </span>
                    <span className="text-clinical-400 text-[11px] italic">
                      Klik om te {isFlippedPreview ? 'keren naar vraag' : 'onthullen'}
                    </span>
                  </div>

                  {!isFlippedPreview ? (
                    <div>
                      <h3 className="text-base font-bold text-clinical-950 leading-relaxed mb-3">
                        {selectedCard.question}
                      </h3>
                      {selectedCard.imageUrl && (
                        <div className="mt-2 max-h-48 overflow-hidden rounded-xl border border-clinical-100 bg-clinical-50/50 p-2 flex justify-center">
                          <img
                            src={selectedCard.imageUrl}
                            alt="Voorbeeld figuur"
                            className="max-h-44 object-contain"
                          />
                        </div>
                      )}
                    </div>
                  ) : (
                    <div>
                      <p className="text-xs font-bold text-emerald-700 mb-1.5 uppercase tracking-wider">
                        Antwoord:
                      </p>
                      <div className="text-sm font-semibold text-clinical-900 whitespace-pre-line leading-relaxed">
                        {selectedCard.answer}
                      </div>
                    </div>
                  )}

                  <div className="pt-3 mt-3 border-t border-clinical-100 flex items-center justify-between text-[11px] text-clinical-400">
                    <span>{activeSet.title}</span>
                    <span>Kaart {selectedCardIndex + 1} / {activeSet.cards.length}</span>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="bg-white rounded-2xl p-12 border border-clinical-200 text-center flex flex-col items-center justify-center gap-3">
              <FileQuestion className="w-12 h-12 text-clinical-300" />
              <h3 className="text-base font-bold text-clinical-800">Geen kaart geselecteerd</h3>
              <p className="text-xs text-clinical-500 max-w-sm">
                Selecteer een kaart uit de linkerlijst of voeg een nieuwe kaart toe aan deze set.
              </p>
              <button
                type="button"
                onClick={handleAddNewCard}
                className="mt-2 px-4 py-2 bg-emerald-600 text-white font-bold text-xs rounded-xl flex items-center gap-1.5 shadow-xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Nieuwe kaart toevoegen</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
