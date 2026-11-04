import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Navigation, 
  MousePointer, 
  Layers, 
  Edit3, 
  Smartphone, 
  Monitor, 
  Gamepad2, 
  Activity, 
  CheckCircle2,
  Sparkles,
  RotateCcw,
  Sliders
} from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'navigation' | 'controls' | 'quiz' | 'cards_games' | 'kinesiology' | 'editor'>('navigation');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4 bg-slate-950/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[92vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header van het hulpvenster */}
        <div className="px-5 py-3.5 bg-clinical-900 text-white border-b border-clinical-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-xl shadow-xs">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Hulp & Uitleg
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Volledige gids voor navigatie, toetsen, spellen, kinesiologie en bewerken
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-xl text-slate-300 hover:text-white hover:bg-clinical-800 transition"
            title="Sluiten"
            aria-label="Sluit hulpvenster"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabbladen kiezer */}
        <div className="px-3 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1 overflow-x-auto text-xs shrink-0 custom-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('navigation')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'navigation'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Navigation className="w-3.5 h-3.5" />
            <span>Overzicht</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('controls')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'controls'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <MousePointer className="w-3.5 h-3.5" />
            <span>Bediening</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('quiz')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'quiz'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Toetsen & Intekenen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('cards_games')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'cards_games'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Gamepad2 className="w-3.5 h-3.5" />
            <span>Flashcards & Spellen</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('kinesiology')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'kinesiology'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>Kinesiologie</span>
          </button>

          {!isMobile && (
            <button
              type="button"
              onClick={() => setActiveTab('editor')}
              className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
                activeTab === 'editor'
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
              }`}
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Bewerken (PC)</span>
            </button>
          )}
        </div>

        {/* Inhoud van de actieve tab */}
        <div className="p-4 sm:p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed custom-scrollbar">
          
          {/* TAB 1: OVERZICHT & NAVIGATIE */}
          {activeTab === 'navigation' && (
            <div className="space-y-3.5">
              <p className="text-slate-600">
                De app bundelt alle theorie, atlasweergaven, oefentoetsen en spelvormen voor de spierleer en functionele anatomie:
              </p>

              <div className="grid gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>1. Spieren (Interactieve Atlas)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Bekijk alle spieren uit het curriculum in ventraal en dorsaal aanzicht. Filter direct per gewricht (art. humeri, genus, coxae, cingulum, etc.) of zoek op naam. Tik op een spier om direct de origo, insertie, primaire en secundaire functies en anatomische markers te bestuderen.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-sky-500" />
                    <span>2. Botten (Skelet & Landmarks)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Interactief skelet met alle botten. Tik op een bot om de relevante botstructuren (zoals SIAS, Tuberculum majus, Epicondylus medialis, etc.) en alle aanhechtende spieren te zien. Schakel tussen ventraal en dorsaal aanzicht met de draaiknop.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500" />
                    <span>3. Bewegingen (Functionele Kinesiologie)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Overzicht van alle gewrichtsbewegingen (flexie, extensie, rotatie, etc.). Tik op een beweging om direct te zien welke spieren hier primair en secundair verantwoordelijk voor zijn.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-indigo-500" />
                    <span>4. Oefenen & Testen (Toetsmodule)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Oefen gericht per gewricht of start een vrije toets met gevarieerde vraagtypen: spierpunten intekenen op het skelet, botten benoemen, meerkeuzevragen, gewrichtseigenschappen en open vragen.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-amber-500" />
                    <span>5. Flashcards (Spaced Repetition)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Studeer met slimme digitale flitskaarten verdeeld over thema's (Botten, Spieren, Gewrichten, Cingulum, Algemeen) of kies voor de snelle 'Random flashcards'. Kaarten passen hun herhalingsmoment automatisch aan op basis van jouw zelfbeoordeling.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-purple-600" />
                    <span>6. Spellen (Minigames)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Vier interactieve spellen om spelenderwijs anatomische connecties te automatiseren: Queens Grid, Skeleton Puzzle, Muscle Guess en Connections.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: BEDIENING & GEBAREN */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                <div className="font-black text-blue-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Bediening op Mobiel / Tablet (Touchscreen)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>1 vinger vegen (swipe):</strong> beweegt het beeld (pannen) soepel mee. Er wordt dan <em>nooit</em> per ongeluk een punt geplaatst.
                  </li>
                  <li>
                    <strong>1 vinger kort tikken (tap):</strong> plaatst direct een Origo (blauw) of Insertie (oranje) op de aangetikte plek.
                  </li>
                  <li>
                    <strong>2 vingers knijpen/spreiden:</strong> soepel in- en uitzoomen (pinch-to-zoom) tot 3.5× vergroting.
                  </li>
                  <li>
                    <strong>Dubbeltik:</strong> herstelt de weergave direct naar 100% (reset zoom en positie).
                  </li>
                  <li>
                    <strong>Zwevende O en I knoppen (linksboven):</strong> tik op <em>O</em> voor blauwe origo's of <em>I</em> voor oranje inserties.
                  </li>
                  <li>
                    <strong>Zwevende Trapezius knoppen:</strong> bij de <em>m. trapezius</em> verschijnen bovenin direct de 3 knoppen (<em>1. Desc.</em>, <em>2. Transv.</em>, <em>3. Ascend.</em>) zodat je tijdens het tekenen met één tik schakelt.
                  </li>
                  <li>
                    <strong>Uitschuifpaneel onderin:</strong> tik of sleep het paneel omhoog voor gewrichts- en testkeuze, en handige switches (Roteren, Zoomen, Switch, Alle wervels).
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-700" />
                  <span>Bediening op Desktop / PC (Muis & Toetsenbord)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Linkermuisknop:</strong> plaatst het actieve type punt (blauw voor origo of oranje voor insertie).
                  </li>
                  <li>
                    <strong>Rechtermuisknop:</strong> plaatst direct het <em>tegenovergestelde</em> type punt (bijv. direct een insertie plaatsen terwijl origo actief staat). Ideaal om razendsnel te tekenen zonder knoppen aan te klikken!
                  </li>
                  <li>
                    <strong>Muiswiel:</strong> in- en uitzoomen op de exacte positie van de muiscursor.
                  </li>
                  <li>
                    <strong>Muis slepen:</strong> wanneer ingezoomd, sleep met de muis om over het skelet te bewegen.
                  </li>
                  <li>
                    <strong>Spatiebalk:</strong> ingedrukt houden activeert de pan-modus om te slepen zonder punten te plaatsen.
                  </li>
                  <li>
                    <strong>Sneltoetsen:</strong> <em>1 / 2 / 3</em> voor de trapezius partes of moeilijkheidsgraad bij flashcards, <em>Enter / Spatie</em> voor Controleer of Volgende, en <em>Backspace</em> om geplaatste punten te wissen.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: TOETSEN & INTEKENEN */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              {/* Belangrijke regels voor Origo & Insertie */}
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/90 space-y-3">
                <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                  <Sparkles className="w-4 h-4 text-blue-600" />
                  <h4>Regels voor het Intekenen van Spieren</h4>
                </div>

                <div className="grid gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200/60 space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span>Standaard spieren (1 origo en 1 insertie):</span>
                    </div>
                    <p className="text-slate-600 pl-3.5">
                      Plaats eerst de blauwe origo. De selectie verspringt automatisch naar oranje (insertie). Plaats vervolgens de insertie en de app controleert direct automatisch je score.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-1">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Meervoudige koppen of brede wervelaanhechtingen:</span>
                    </div>
                    <p className="text-slate-700 pl-3.5">
                      Heeft een spier meerdere koppen (zoals <em>biceps</em> of <em>triceps</em>) of loopt hij over meerdere wervels? Dan verspringt de app bewust <strong>niet</strong> na de 1e klik, zodat je rustig alle origopunten kunt plaatsen. Schakel zelf naar de insertieknop en rond af met de groene knop <strong>Controleer</strong>.
                    </p>
                  </div>
                </div>
              </div>

              {/* De nieuwe wervelkolom en trapezius regels */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2.5">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  <span>Specifieke Toetsregels & Curriculum</span>
                </h4>
                
                <ul className="text-xs text-slate-700 space-y-2 list-disc pl-5">
                  <li>
                    <strong>Wervelkolom regel (multi-span spieren):</strong> Bij spieren die over een wervelrij lopen (zoals <em>m. latissimus dorsi</em>, <em>m. trapezius</em>, <em>m. erector spinae</em>, <em>mm. rhomboidei</em>, <em>m. iliopsoas</em>) moet je <strong>minimaal de eerste én de laatste wervel</strong> uit de rij aanklikken. Meer mag (alle tussenliggende wervels aanklikken mag gerust), minder niet.
                  </li>
                  <li>
                    <strong>Toggle 'Wervels' (Alle wervels vereisen):</strong> In de balk met switches vind je de toggle <em>Wervels</em> (standaard <strong>UIT</strong>). Zet je deze aan, dan moet je élke individuele wervel in het traject aanklikken om de vraag goed te rekenen.
                  </li>
                  <li>
                    <strong>M. trapezius (unieke spier per pars):</strong> De trapezius wordt in één vraag getoetst. Boven het skelet kies je via de 3 knoppen welke pars je tekent: <em>1. Descendens</em>, <em>2. Transversa</em> of <em>3. Ascendens</em>. De punten worden anatomisch zuiver per pars gekoppeld aan de juiste insertie.
                  </li>
                  <li>
                    <strong>Curriculum-updates:</strong> <em>M. serratus anterior</em> en <em>m. levator scapulae</em> hoeven niet meer geleerd te worden en zijn uit de app verwijderd. De botstructuur <em>tuberculum minus</em> hoeft niet als botstructuur gekend te worden; de aanhechting van de <em>m. latissimus dorsi</em> heet <em>proximaal ventraal op de humerus</em>.
                  </li>
                  <li>
                    <strong>Beide lichaamshelften:</strong> Je mag naar keuze links of rechts intekenen; het nakijksysteem evalueert automatisch beide zijden en kent de hoogste score toe.
                  </li>
                  <li>
                    <strong>Tolerantie-instelling:</strong> In het optiepaneel kun je de tolerantie instellen op <em>Ruim</em> (3.5% marge), <em>Medium</em> (2.5%) of <em>Strikt</em> (1.5%).
                  </li>
                </ul>
              </div>

              {/* Toggles overzicht */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>Snelle Opties (Toggles in het Paneel)</span>
                </h4>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Roteren (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Draait het skelet automatisch naar het juiste aanzicht bij een nieuwe vraag.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Zoomen (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Zoomt automatisch in op het relevante lichaamsdeel van de actieve spier.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Switch (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Schakelt automatisch van origo naar insertie zodra de origo compleet is.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Wervels (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Vereist alle individuele wervels i.p.v. minimaal de eerste en laatste wervel.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FLASHCARDS & SPELLEN */}
          {activeTab === 'cards_games' && (
            <div className="space-y-4">
              {/* Flashcards */}
              <div className="p-3.5 bg-amber-50/70 rounded-2xl border border-amber-200 space-y-2">
                <div className="font-black text-amber-950 flex items-center gap-2">
                  <RotateCcw className="w-4 h-4 text-amber-600" />
                  <span>Flashcards (Spaced Repetition Studie)</span>
                </div>
                <p className="text-xs text-slate-700">
                  De flashcards maken gebruik van wetenschappelijk bewezen gespreide herhaling (spaced repetition).
                </p>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Kaart draaien:</strong> Tik op de kaart (of druk op de <em>spatiebalk</em>) om het antwoord op de achterkant te onthullen.
                  </li>
                  <li>
                    <strong>Zelfevaluatie (1 t/m 4):</strong> Geef eerlijk aan hoe goed je het wist via de 4 knoppen:
                    <span className="block mt-1 pl-2 text-slate-600">
                      • <strong>Opnieuw (rood):</strong> kaart komt direct in dezelfde sessie terug.<br />
                      • <strong>Moeilijk (oranje):</strong> korte herhaalinterval.<br />
                      • <strong>Goed (blauw):</strong> standaard herhaalinterval.<br />
                      • <strong>Makkelijk (groen):</strong> lange herhaalinterval (kaart wordt als geleerd gemarkeerd).
                    </span>
                  </li>
                  <li>
                    <strong>Kaarten omkeren:</strong> Wissel vraag en antwoord om te trainen in beide richtingen (bijv. van Nederlandse term naar Latijnse term).
                  </li>
                  <li>
                    <strong>Random flashcards:</strong> Kies de blauwe knop in het set-overzicht voor een snelle, gemengde oefensessie over alle onderwerpen.
                  </li>
                </ul>
              </div>

              {/* Minigames */}
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                <div className="font-black text-purple-950 flex items-center gap-2">
                  <Gamepad2 className="w-4 h-4 text-purple-600" />
                  <span>De 4 Anatomische Spelletjes</span>
                </div>
                <div className="grid gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200/70">
                    <span className="font-bold text-purple-900 block mb-0.5">1. Queens Grid</span>
                    <span className="text-slate-600">
                      Logische puzzel gebaseerd op het bekende damesspel. Plaats anatomische iconen zo in het raster dat rijen, kolommen en kleurvlakken elkaar niet doorkruisen.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200/70">
                    <span className="font-bold text-purple-900 block mb-0.5">2. Skeleton Puzzle</span>
                    <span className="text-slate-600">
                      Sleep botten, gewrichten en spieren naar de juiste plek op het skelet voordat de tijd om is.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200/70">
                    <span className="font-bold text-purple-900 block mb-0.5">3. Muscle Guess ("Wie ben ik?")</span>
                    <span className="text-slate-600">
                      Ontvang stapsgewijs cryptische hints over origo, insertie, werking en gewrichten. Raad de spier in zo min mogelijk pogingen!
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-purple-200/70">
                    <span className="font-bold text-purple-900 block mb-0.5">4. Connections Game</span>
                    <span className="text-slate-600">
                      Zoek vier groepen van vier begrippen die een anatomisch verband delen (bijv. 4 adductoren, 4 pezen van de pes anserinus/omgeving, 4 structuren van het os coxae).
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 5: KINESIOLOGIE & ASSEN */}
          {activeTab === 'kinesiology' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-emerald-50/70 rounded-2xl border border-emerald-200 space-y-2">
                <div className="font-black text-emerald-950 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" />
                  <span>Vlakken en Assen van het Menselijk Lichaam</span>
                </div>
                <p className="text-xs text-slate-700">
                  Alle bewegingen vinden plaats in een anatomisch vlak rondom een loodrechte bewegingsas vanuit de anatomische nulstand:
                </p>
                
                <div className="grid gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/70">
                    <strong className="text-emerald-900 block">1. Sagittaal vlak (loopt van voor naar achter)</strong>
                    <span className="text-slate-600">
                      Draait om de <strong>transversale (frontale) as</strong>. <br />
                      <em>Bewegingen:</em> Flexie / Extensie, Anteflexie / Retroflexie.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/70">
                    <strong className="text-emerald-900 block">2. Frontaal vlak (loopt van links naar rechts)</strong>
                    <span className="text-slate-600">
                      Draait om de <strong>sagittale (sagittotransversale) as</strong>. <br />
                      <em>Bewegingen:</em> Abductie / Adductie, Lateroflexie van de wervelkolom.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-emerald-200/70">
                    <strong className="text-emerald-900 block">3. Transversaal vlak (horizontaal doorsnedevlak)</strong>
                    <span className="text-slate-600">
                      Draait om de <strong>longitudinale (verticale) as</strong>. <br />
                      <em>Bewegingen:</em> Endorotatie / Exorotatie, Horizontale abductie / adductie van de schouder.
                    </span>
                  </div>
                </div>
              </div>

              {/* Bewegingsanalyse in fasen */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900">
                  Bewegingsanalyse in 3 Fasen
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li><strong>Fase 1 (Uitgangshouding):</strong> De statische beginstand van de gewrichten (bijv. heup in flexie/anteflexie).</li>
                  <li><strong>Fase 2 (Beweging & Spierwerk):</strong> De dynamische overgang. Let op het spierwerk: <em>concentrisch</em> (spier verkort tijdens krachtlevering), <em>excentrisch</em> (spier verlengt gecontroleerd tegen de zwaartekracht in) of <em>isometrisch/statisch</em> (kracht zonder lengteverandering).</li>
                  <li><strong>Fase 3 (Eindstand / Terugkeer):</strong> De bereikte eindpositie of stabilisatie.</li>
                </ul>
              </div>

              {/* Belangrijke toetstips & Inconsequenties */}
              <div className="p-3.5 bg-amber-50/80 rounded-2xl border border-amber-200 space-y-1.5">
                <h4 className="font-black text-amber-950">
                  💡 Let op bij de Toets (Inconsequenties Moduleboek vs. Antwoorden)
                </h4>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li><strong>Stand heup:</strong> Het antwoordenblad rekent <em>anteflexie</em> goed bij de stand van de heup (ook al is het strikt genomen flexie).</li>
                  <li><strong>Kop en kom art. genus:</strong> Condyli femoris (kop) en condyli tibiae + menisci (kom).</li>
                  <li><strong>Richtingstermen romp:</strong> Lateroflexie en rotatie van de romp geven de richting aan met <em>dextra</em> (rechts) en <em>sinistra</em> (links).</li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 6: BEWERKEN (ALLEEN PC) */}
          {!isMobile && activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                <h4 className="font-black text-purple-950 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-700" />
                  <span>Geavanceerde Editor (Uitsluitend op Desktop)</span>
                </h4>
                <p className="text-xs text-slate-700">
                  De bewerkmodus stelt je in staat om alle spieren, botten, landmarks, wervels en ribben visueel te kalibreren.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>Wervels & Ribben Tab (Nieuw)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Onder <em>Botten bewerken</em> vind je de speciale knop <strong>Wervels & Ribben</strong>. Het skelet zoomt automatisch in op de romp (zoom: 2.2). Hier kun je alle 24 individuele wervels (C1 t/m C7, Th1 t/m Th12, L1 t/m L5) en alle 12 individuele ribbenparen (Costa 1 t/m 12) als losse puntjes verslepen en finetunen.
                </p>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>Opslaan naar Bronbestand</span>
                </div>
                <p className="text-xs text-slate-600">
                  Verplaatsingen worden direct in je browser onthouden. Klik op de groene knop <strong>Opslaan naar bronbestand</strong> om je wijzigingen permanent weg te schrijven naar de projectcode.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Begrepen
          </button>
        </div>
      </div>
    </div>
  );
};
