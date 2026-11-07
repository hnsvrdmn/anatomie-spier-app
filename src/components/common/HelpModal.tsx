import React, { useState } from 'react';
import { 
  X, 
  HelpCircle, 
  Navigation, 
  Smartphone, 
  Monitor, 
  Layers, 
  Edit3,
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
  const [activeTab, setActiveTab] = useState<'navigation' | 'controls' | 'quiz' | 'flashcards' | 'editor'>('navigation');

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
                Volledige gids voor navigatie, bediening, toetsen en bewerken
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
            <Smartphone className="w-3.5 h-3.5" />
            <span>Bediening & Gebaren</span>
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
            onClick={() => setActiveTab('flashcards')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'flashcards'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Flashcards</span>
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

        {/* Scrollbare inhoud per tabblad */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4 text-xs sm:text-sm text-slate-700 leading-relaxed custom-scrollbar">
          {/* TAB 1: OVERZICHT */}
          {activeTab === 'navigation' && (
            <div className="space-y-3.5">
              <p className="text-slate-600">
                De app bundelt alle theorie, atlasweergaven, oefentoetsen en leertools voor spierleer en anatomie:
              </p>

              <div className="grid gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full bg-blue-600" />
                    <span>1. Spieren (Interactieve Atlas)</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Bekijk alle spieren uit het curriculum in ventraal en dorsaal aanzicht. Filter direct per gewricht (art. humeri, genus, coxae, cingulum, etc.) of zoek op naam. Tik op een spier om direct de origo, insertie, functies en anatomische markers te bestuderen.
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
                    <span>3. Bewegingen</span>
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
                    <strong>1 vinger over het skelet vegen (swipe):</strong> beweegt het skeletbeeld (pannen) soepel mee. Er wordt dan <em>nooit</em> per ongeluk een punt geplaatst.
                  </li>
                  <li>
                    <strong>1 vinger kort tikken (tap):</strong> plaatst direct een Origo (blauw) of Insertie (oranje) op de aangetikte plek.
                  </li>
                  <li>
                    <strong>Punten verplaatsen (verslepen):</strong> Houd je vinger op een reeds geplaatst bolletje (origo of insertie) om het nauwkeurig te verslepen. Het beeld van het skelet blijft dan automatisch roerloos op zijn plek staan zodat je precies kunt richten.
                  </li>
                  <li>
                    <strong>Onderste bedieningsframe openen & sluiten:</strong>
                    <span className="block mt-0.5 pl-2 text-slate-600">
                      • <strong>Sluiten (inklappen):</strong> veeg met je vinger omlaag over de grijpbalk bovenin het onderste paneel (of tik op het pijltje). Het frame zakt naar de bodem zodat je maximaal vrij zicht hebt op het skelet.<br />
                      • <strong>Openen (uitklappen):</strong> veeg omhoog over de balk of tik onderin op de balk om alle instellingen, gewrichtskeuze en handige toggles (Roteren, Zoomen, Switch, Alle wervels) direct te tonen.
                    </span>
                  </li>
                  <li>
                    <strong>2 vingers knijpen/spreiden:</strong> soepel in- en uitzoomen (pinch-to-zoom) tot 3.5× vergroting.
                  </li>
                  <li>
                    <strong>Dubbeltik op skelet:</strong> herstelt de weergave direct naar 100% (reset zoom en positie).
                  </li>
                  <li>
                    <strong>Zwevende O en I knoppen (linksboven):</strong> tik op <em>O</em> voor blauwe origo's of <em>I</em> voor oranje inserties.
                  </li>
                  <li>
                    <strong>Zwevende Trapezius knoppen:</strong> bij de <em>m. trapezius</em> verschijnen bovenin direct de partes (<em>Desc.</em>, <em>Transv.</em>, <em>Ascend.</em>) zodat je tijdens het tekenen met één tik schakelt.
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
                    <strong>Linkermuisknop:</strong> plaatst een nieuw aanhechtingspunt op het skelet.
                  </li>
                  <li>
                    <strong>Punten verslepen (verplaatsen):</strong> klik met de linkermuisknop op een reeds geplaatst punt en sleep het soepel naar de gewenste plek op het bot om de positie te corrigeren.
                  </li>
                  <li>
                    <strong>Rechtermuisknop op geplaatst punt:</strong> verwijdert het punt direct.
                  </li>
                  <li>
                    <strong>Rechtermuisknop op leeg skelet:</strong> in I/O modus snelle sneltoets voor insertie (plaatst direct een oranje insertie).
                  </li>
                  <li>
                    <strong>Muiswiel:</strong> in- en uitzoomen op de positie van je cursor.
                  </li>
                  <li>
                    <strong>Slepen met muis:</strong> wanneer ingezoomd, sleep met de muis (of houd de middelmuisknop/spatiebalk ingedrukt) om het beeld te verplaatsen.
                  </li>
                  <li>
                    <strong>Sneltoetsen:</strong>
                    <span className="block mt-1 pl-2 text-slate-600 font-mono text-[11px]">
                      • 1 / O = Schakel naar Origo (in I/O modus)<br />
                      • 2 / I = Schakel naar Insertie (in I/O modus)<br />
                      • Ctrl+Z = Laatste punt ongedaan maken<br />
                      • Enter / Spatie = Controleer antwoord of volgende vraag
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: TOETSEN & INTEKENEN */}
          {activeTab === 'quiz' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-indigo-50/70 rounded-2xl border border-indigo-200 space-y-2">
                <div className="font-black text-indigo-950 flex items-center gap-2">
                  <Layers className="w-4 h-4 text-indigo-600" />
                  <span>Vraagtypen & Intekenregels</span>
                </div>
                <p className="text-xs text-slate-700">
                  De toetsmodule bevat 5 verschillende leervormen:
                </p>
                <div className="grid gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">1. Vrij intekenen (Potloodmodus – Standaard)</span>
                    <span className="text-slate-600">
                      Teken alle aanhechtingspunten rustig in met één medische blauwe kleur, net als op een papieren anatomietoets met potlood. De volgorde waarin je de punten zet maakt niet uit! De app herkent op de achtergrond automatisch welke punten bij de origo en welke bij de insertie horen.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">2. I/O intekenen & Autoswitch I/O</span>
                    <span className="text-slate-600">
                      In deze handmatige modus wissel je zelf tussen Origo (blauw) en Insertie (oranje). Met de checkbox <strong>Autoswitch I/O</strong> kun je instellen of de app automatisch naar Insertie springt zodra alle origo's compleet zijn.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">3. Punten verslepen & corrigeren</span>
                    <span className="text-slate-600">
                      Ieder geplaatst punt kan direct met de linkermuisknop (of je vinger op mobiel) worden opgepakt en versleept naar de juiste anatomische locatie. Verkeerd geplaatste punten kun je ook wissen met de prullenbak of rechtermuisknop.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">4. Spieren met een brede wervelrij</span>
                    <span className="text-slate-600">
                      Bij spieren die langs een wervelrij lopen (zoals m. latissimus dorsi of mm. rhomboidei) hoef je standaard <strong>alleen de eerste en de laatste wervel</strong> uit de rij aan te stippen (meer mag altijd). Met de switch <em>Alle wervels</em> kun je instellen dat je verplicht alle wervels moet aankruisen.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">5. M. Trapezius (Partes los intekenen)</span>
                    <span className="text-slate-600">
                      De <em>m. trapezius</em> teken je in één vraag in per pars: gebruik de knoppen boven het skelet om te schakelen tussen <em>Descendens</em>, <em>Transversa</em> en <em>Ascendens</em>.
                    </span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-200/70">
                    <span className="font-bold text-indigo-900 block mb-0.5">6. Botten, Meerkeuze, Bewegingen & Gewrichten</span>
                    <span className="text-slate-600">
                      Benoem botten met gele landmarks, beantwoord theorie- en meerkeuzevragen, of test welke spieren specifieke gewrichtsbewegingen uitvoeren.
                    </span>
                  </div>
                </div>
              </div>

              {/* De 4 Compacte Toggles */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Sliders className="w-4 h-4 text-slate-700" />
                  <span>De 4 Handige Switches</span>
                </div>
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Roteren (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Draait het skelet automatisch naar het aanbevolen aanzicht bij een nieuwe vraag.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Zoomen (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Zoomt automatisch in op de regio van de te testen spier.</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Vrij intekenen / I/O intekenen</span>
                    <span className="text-slate-500 text-[11px]">Schakelt tussen de ontspannen potloodmodus (één kleur) en handmatig O/I plaatsen (met Autoswitch checkbox).</span>
                  </div>
                  <div className="p-2 bg-white rounded-xl border border-slate-200">
                    <span className="font-bold text-slate-900 block">Alle wervels (Aan/Uit)</span>
                    <span className="text-slate-500 text-[11px]">Vereist alle individuele wervels i.p.v. minimaal de eerste en laatste wervel.</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* TAB 4: FLASHCARDS */}
          {activeTab === 'flashcards' && (
            <div className="space-y-4">
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
            </div>
          )}

          {/* TAB 5: BEWERKEN (ALLEEN PC) */}
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
