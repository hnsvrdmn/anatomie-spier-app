import React, { useState } from 'react';
import { X, HelpCircle, Navigation, MousePointer, Layers, Edit3, Smartphone, Monitor } from 'lucide-react';
import { useIsMobile } from '../../hooks/useIsMobile';

interface HelpModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const HelpModal: React.FC<HelpModalProps> = ({ isOpen, onClose }) => {
  const isMobile = useIsMobile();
  const [activeTab, setActiveTab] = useState<'navigation' | 'controls' | 'points' | 'editor'>('navigation');

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        className="relative w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-200 flex flex-col max-h-[90vh] overflow-hidden animate-in zoom-in-95 duration-200"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header van het hulpvenster */}
        <div className="px-5 py-4 bg-clinical-900 text-white border-b border-clinical-800 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-1.5 bg-blue-600 rounded-xl">
              <HelpCircle className="w-5 h-5 text-white" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight leading-tight">
                Hulp & Uitleg
              </h2>
              <p className="text-[11px] text-slate-300 font-medium">
                Alles over navigatie, bediening en beoordeling
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
        <div className="px-4 py-2 bg-slate-50 border-b border-slate-200 flex items-center gap-1.5 overflow-x-auto text-xs shrink-0">
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
            <span>Navigatie</span>
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
            onClick={() => setActiveTab('points')}
            className={`px-3 py-1.5 rounded-xl font-bold transition flex items-center gap-1.5 shrink-0 ${
              activeTab === 'points'
                ? 'bg-blue-600 text-white shadow-xs'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-200/60'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Origo & Insertie</span>
          </button>

          {/* Bewerken is alleen relevant en zichtbaar op PC */}
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

        {/* Inhoud van de actieve tab (scrollbaar) */}
        <div className="p-5 overflow-y-auto space-y-4 text-slate-700 text-xs sm:text-sm leading-relaxed">
          {/* TAB 1: NAVIGATIE */}
          {activeTab === 'navigation' && (
            <div className="space-y-3.5">
              <p className="text-slate-600">
                De app is opgedeeld in de volgende onderdelen, te bereiken via de bovenbalk:
              </p>

              <div className="grid gap-2.5">
                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-blue-600" />
                    <span>Spieren</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Interactieve anatomische atlas. Bekijk spieren per aanzicht (ventraal en dorsaal), filter op gewricht en bekijk direct de bijbehorende origo, insertie en functies.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-sky-500" />
                    <span>Botten</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Skeletanatomie met Latijnse en Nederlandse benamingen. Tik op een botmarker om gedetailleerde informatie en botstructuren te zien. Wissel snel van aanzicht met de draaiknop.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                    <span>Bewegingen</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Overzicht van gewrichtsbewegingen (flexie, extensie, rotatie, etc.). Tik op een beweging om direct te zien welke spieren deze actie primair aansturen.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-indigo-500" />
                    <span>Oefenen</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Oefen gericht per specifiek gewricht (art. coxae, genus, humeri, etc.). Je krijgt directe feedback na elke vraag en kunt vragen husselen.
                  </p>
                </div>

                <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                    <span className="w-2 h-2 rounded-full bg-amber-500" />
                    <span>Testen</span>
                  </div>
                  <p className="text-xs text-slate-600">
                    Vrije testmodus over de gehele dataset met diverse testtypen: bot benoemen, origo en insertie intekenen, gewrichten (typen, assen, deelgewrichten en bewegingen), meerkeuze, open invultest en spierbewegingen.
                  </p>
                </div>

                {!isMobile && (
                  <div className="p-3 bg-slate-50 rounded-2xl border border-slate-200">
                    <div className="font-black text-slate-900 flex items-center gap-2 mb-1">
                      <span className="w-2 h-2 rounded-full bg-purple-600" />
                      <span>Bewerken (alleen op PC)</span>
                    </div>
                    <p className="text-xs text-slate-600">
                      Geavanceerde visuele editor om spierlijnen, origo&apos;s, inserties en botmarkers rechtstreeks aan te passen en te exporteren/importeren als JSON.
                    </p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: BEDIENING & GEBAREN */}
          {activeTab === 'controls' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-blue-50/70 rounded-2xl border border-blue-200 space-y-2">
                <div className="font-black text-blue-950 flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-blue-600" />
                  <span>Bediening op Telefoon (Touchscreen)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>1 vinger vegen (swipe):</strong> beweegt het beeld (pannen) soepel mee. Er wordt dan <em>nooit</em> per ongeluk een punt geplaatst.
                  </li>
                  <li>
                    <strong>1 vinger kort tikken (tap):</strong> plaatst direct een Origo (blauw) of Insertie (rood) op de aangetikte plek.
                  </li>
                  <li>
                    <strong>2 vingers knijpen/spreiden:</strong> in- en uitzoomen (pinch-to-zoom) tot 3.5× vergroting.
                  </li>
                  <li>
                    <strong>Dubbeltik:</strong> herstelt de weergave direct naar 100% (reset zoom en positie).
                  </li>
                  <li>
                    <strong>O en I knoppen (linksboven):</strong> tik op <em>O</em> voor blauwe origo&apos;s of <em>I</em> voor rode inserties. Bij spieren met meerdere punten wissel je handmatig tussen O en I en bevestig je na afloop met <em>Controleer</em>.
                  </li>
                  <li>
                    <strong>Onderste paneel:</strong> tik of sleep het paneel omhoog om gewricht, testtype of nauwkeurigheid (tolerantiegrens) in te stellen.
                  </li>
                </ul>
              </div>

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <div className="font-black text-slate-900 flex items-center gap-2">
                  <Monitor className="w-4 h-4 text-slate-700" />
                  <span>Bediening op PC (Muis & Toetsenbord)</span>
                </div>
                <ul className="text-xs text-slate-700 space-y-1.5 list-disc pl-5">
                  <li>
                    <strong>Linkermuisknop:</strong> plaatst het actieve type punt (blauw voor origo of rood voor insertie).
                  </li>
                  <li>
                    <strong>Rechtermuisknop:</strong> plaatst direct het <em>tegenovergestelde</em> type punt (bijv. direct een rode insertie plaatsen terwijl origo actief staat). Ideaal om snel te wisselen bij meervoudige spieren!
                  </li>
                  <li>
                    <strong>Muiswiel:</strong> soepel in- en uitzoomen op de positie van de muiscursor.
                  </li>
                  <li>
                    <strong>Muis slepen:</strong> wanneer ingezoomd, sleep met de muis om over het skelet te bewegen.
                  </li>
                  <li>
                    <strong>Spatiebalk ingedrukt houden:</strong> activeert de hand/pan modus om te slepen zonder punten te plaatsen.
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 3: LOGICA VAN ORIGO & INSERTIE */}
          {activeTab === 'points' && (
            <div className="space-y-4">
              {/* Belangrijke toelichting: Automatisch verspringen vs. Meerdere punten plaatsen */}
              <div className="p-4 bg-blue-50/80 rounded-2xl border border-blue-200/90 space-y-2.5">
                <div className="flex items-center gap-2 text-blue-950 font-black text-sm">
                  <span className="p-1 bg-blue-600 text-white rounded-lg text-xs leading-none">⚡</span>
                  <h4>Waarom verspringt de knop soms wel en soms niet automatisch?</h4>
                </div>
                <p className="text-xs text-slate-700 leading-relaxed">
                  Tijdens het intekenen van een spier houdt de app rekening met de anatomie van de gevraagde spier:
                </p>
                <div className="grid gap-2 text-xs">
                  <div className="p-2.5 bg-white rounded-xl border border-blue-200/60 space-y-1">
                    <div className="font-bold text-blue-900 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-blue-600 shrink-0" />
                      <span>Bij standaard spieren (1 origo en 1 insertie):</span>
                    </div>
                    <p className="text-slate-600 leading-relaxed pl-3.5">
                      Je start standaard met <strong>Origo</strong> (blauw). Zodra je het origopunt op het skelet klikt of tikt, verspringt de selectie <strong>automatisch naar Insertie</strong> (rood). Plaats je daarna de insertie, dan controleert de app jouw antwoord direct automatisch.
                    </p>
                  </div>

                  <div className="p-2.5 bg-white rounded-xl border border-amber-200/80 bg-amber-50/40 space-y-1">
                    <div className="font-bold text-amber-950 flex items-center gap-1.5">
                      <span className="w-2 h-2 rounded-full bg-amber-500 shrink-0" />
                      <span>Bij spieren met meerdere origo&apos;s of meerdere inserties:</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed pl-3.5">
                      Heeft een spier meerdere koppen (zoals <em>m. biceps</em>, <em>m. triceps</em>) of een brede aanhechting over meerdere wervels (zoals <em>m. trapezius</em>, <em>m. latissimus dorsi</em>, <em>m. erector spinae</em>)? Dan verspringt de app <strong>bewust NIET automatisch</strong> na de eerste klik.
                    </p>
                    <ul className="text-slate-600 space-y-1.5 list-disc pl-8 pt-1">
                      <li>
                        <strong>Waarom niet automatisch?</strong> Zo kun je eerst rustig alle benodigde blauwe origopunten achter elkaar plaatsen zonder dat de app tussentijds ongewenst naar rood overschakelt.
                      </li>
                      <li>
                        <strong>Hoe ga je verder naar Insertie?</strong> Schakel zelf handmatig over door op de knop <strong>&quot;Insertie&quot;</strong> (of de rode knop <strong>&quot;I&quot;</strong> op mobiel) te tikken. <em>(Handige PC-tip: met de rechtermuisknop plaats je direct een insertie!).</em>
                      </li>
                      <li>
                        <strong>Controleren:</strong> Omdat de app niet kan raden hoeveel punten je exact wilt plaatsen, rond je de vraag af door zelf op de groene knop <strong>&quot;Controleer&quot;</strong> te klikken.
                      </li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Goedkeuringsregels & Beoordeling */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
                <h4 className="font-black text-slate-900">
                  Hoe worden meerdere origo&apos;s of inserties goedgekeurd?
                </h4>
                <p className="text-xs text-slate-600">
                  Veel spieren hebben meerdere koppen of een waaiervormige aanhechting. De nakijkmodule beoordeelt je punten aan de hand van de volgende regels:
                </p>
                <ul className="text-xs text-slate-700 space-y-2 list-disc pl-5">
                  <li>
                    <strong>Afstands- en segmentkoppeling:</strong> Elk geplaatst punt wordt gekoppeld aan het dichtstbijzijnde doelpunt of geprojecteerd op de anatomische aanhechtingslijn (zoals de crista iliaca of de wervelkolom).
                  </li>
                  <li>
                    <strong>Uiterste punten (multi-span spieren):</strong> Bij spieren die over meerdere wervels lopen hoef je niet elke individuele wervel aan te stippen; het plaatsen van minimaal de hoogste en laagste uiterste aanhechtingspunten is voldoende.
                  </li>
                  <li>
                    <strong>Volgorde is vrij:</strong> Het maakt niet uit of je eerst de proximale of distale punten intekent, of in welke volgorde je de koppen aanklikt.
                  </li>
                  <li>
                    <strong>Beide lichaamshelften toegestaan:</strong> Je mag een spier naar keuze aan de linker- óf rechterzijde intekenen; het nakijksysteem evalueert automatisch beide zijden en kiest de zijde met jouw hoogste score.
                  </li>
                  <li>
                    <strong>Strikte aanzicht controle:</strong> Teken altijd in het anatomisch juiste aanzicht (ventraal of dorsaal). Punten die op het verkeerde aanzicht zijn geplaatst worden als fout gerekend.
                  </li>
                  <li>
                    <strong>Instelbare nauwkeurigheid (tolerantie):</strong> In het testpaneel kun je de tolerantie naar wens instellen op:
                    <span className="block mt-1 pl-2 text-slate-600">
                      • <strong>Laag</strong> (3.5% marge) – ruime marge, ideaal bij snelle oriëntatie op touchscreens.<br />
                      • <strong>Medium</strong> (2.5% marge) – evenwichtige academische standaard.<br />
                      • <strong>Strikt</strong> (1.5% marge) – zeer nauwkeurige test op precieze botrichels en tuberositas.
                    </span>
                  </li>
                </ul>
              </div>
            </div>
          )}

          {/* TAB 4: BEWERKEN (ALLEEN PC) */}
          {!isMobile && activeTab === 'editor' && (
            <div className="space-y-4">
              <div className="p-3.5 bg-purple-50/70 rounded-2xl border border-purple-200 space-y-2">
                <h4 className="font-black text-purple-950 flex items-center gap-2">
                  <Edit3 className="w-4 h-4 text-purple-700" />
                  <span>Geavanceerde Editor (Uitsluitend op Desktop)</span>
                </h4>
                <p className="text-xs text-slate-700">
                  De bewerkmodus is ontworpen om de gehele anatomische dataset visueel te kalibreren, verfijnen en beheren.
                </p>
              </div>

              {/* 1. Punten plaatsen & verslepen */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-blue-600" />
                  <span>1. Punten Selecteren, Verslepen & Verwijderen</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                  <li><strong>Klik op een bolletje</strong> om het te activeren. Sleep het punt met de muis naar de gewenste positie op het bot.</li>
                  <li><strong>Klik op het skelet</strong> om een nieuw punt toe te voegen (origo in blauw, insertie in rood).</li>
                  <li><strong>Rechtermuisknop op een punt</strong> verwijdert het punt direct. Je kunt ook het rode prullenbak-icoontje in het zijpaneel gebruiken.</li>
                  <li>Alle coördinaten worden genormaliseerd opgeslagen (0.0 tot 1.0) zodat ze op elk schermformaat en resolutie 100% schaalvast blijven.</li>
                </ul>
              </div>

              {/* 2. Spierbuik & Verloop (Splines) */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-indigo-600" />
                  <span>2. Spierverloop & Peesbanen (Muscle Path)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Tussen de origo en insertie berekent de app een vloeiende curve (spline). In de editor kun je tussenliggende controlepunten toevoegen om pezen om gewrichten te buigen (bijvoorbeeld rond de patella, de margo medialis van de scapula of het olecranon van de elleboog).
                </p>
              </div>

              {/* 3. Symmetrie & Spiegelen */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-600" />
                  <span>3. Symmetrie & Spiegelen (Bilateral vs Midline)</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                  <li><strong>Bilaterale spieren (links & rechts):</strong> Bewerk uitsluitend de linkerhelft. Klik vervolgens in het paneel op <em>&quot;Spiegel naar rechts&quot;</em>. Alle origo&apos;s, inserties, curves en aanhechtingslijnen worden wiskundig exact gespiegeld over de x-as (x = 0.50).</li>
                  <li><strong>Mediaanspieren (Midline):</strong> Spieren die op de middenlijn liggen (zoals <em>m. erector spinae</em>). Deze hebben één centrale as en worden niet gespiegeld.</li>
                </ul>
              </div>

              {/* 4. Aanhechtingslijnen & Brede Zones */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-amber-600" />
                  <span>4. Continue Aanhechtingslijnen (Attachment Polylines)</span>
                </div>
                <p className="text-xs text-slate-600">
                  Brede aanhechtingen (zoals de crista iliaca, ribbenbogen of schedelbasis) kunnen als continue lijnen worden gemodelleerd. Wanneer een student in de toets een punt plaatst binnen de tolerantiezone van deze polygoonlijn, wordt dit automatisch goedgekeurd.
                </p>
              </div>

              {/* 5. Botten Editor */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-sky-600" />
                  <span>5. Botmarkers & Landmarks Bewerken</span>
                </div>
                <p className="text-xs text-slate-600">
                  Onder het tabblad <em>&quot;Botten bewerken&quot;</em> worden het ventrale en dorsale aanzicht overzichtelijk naast elkaar getoond. Je kunt botmarkers direct verslepen naar de juiste anatomische botdelen, en Latijnse of Nederlandse synoniemen aanpassen.
                </p>
              </div>

              {/* 6. Opslaan, Importeren & Exporteren */}
              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 space-y-1.5">
                <div className="font-bold text-slate-900 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-rose-600" />
                  <span>6. Gegevensbeheer, Exporteren & Importeren</span>
                </div>
                <ul className="text-xs text-slate-600 space-y-1 list-disc pl-5">
                  <li><strong>Opslaan naar schijf (Server Sync):</strong> Schrijft alle aanpassingen direct weg naar de projectbestanden op de lokale ontwikkelserver.</li>
                  <li><strong>JSON Exporteren:</strong> Downloadt een complete offline JSON-backup naar jouw downloads-map.</li>
                  <li><strong>JSON Importeren:</strong> Laad een eerder opgeslagen JSON-bestand in om aangepaste datasets te herstellen of uit te wisselen met collega&apos;s.</li>
                  <li><strong>Reset naar Standaard:</strong> Herstelt de officiële anatomische dataset volgens het reader-curriculum.</li>
                </ul>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 flex justify-end shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-xs"
          >
            Begrepen
          </button>
        </div>
      </div>
    </div>
  );
};
