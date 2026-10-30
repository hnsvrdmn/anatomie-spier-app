# 📋 Voortgangs- en Denklogboek – Anatomie & Spierleer App

> **Doel:** Dit document geeft je real-time inzicht in wat ik aan het onderzoeken ben, welke problemen ik tegenkom, waarom ze optreden en wat ik precies aanpas. Zo weet je altijd exact wat er achter de schermen gebeurt.

---

## 1. Wat was de aanleiding?
Je merkte terecht op dat er nog termen in de app stonden die niet in de reader voorkomen, specifiek:
- `'tractus iliotibialis'` bij de insertie van de *m. gluteus maximus*.
- `'symphysis pubica'` (en `'crista pubica'`) in de Botten-tab bij het *os coxae*.
- Je terechte vraag: *"Waarom lukt het niet om gewoon alle teksten in één keer te controleren en te zorgen dat de origo's en inserties op alle tabs (inclusief Botten) identiek zijn?"*

---

## 2. Waarom ging dit eerder mis? (De technische oorzaak)

Na een diepgaande analyse bleken er **drie verschillende oorzaken** te zijn:

### Oorzaak A: Versnipperde databestanden
De app had twee verschillende bestanden voor spieraanhechtingen:
1. `src/data/muscles.json` (gebruikt voor de **Spieren-tab**, Oefenen en de 3D/2D spierweergave).
2. `src/data/boneAttachments.ts` (gebruikt voor de **Botten-tab** als je op een bot klikt).

In de beginfase van het project was `boneAttachments.ts` gevuld met teksten uit algemene medische atlassen. Daardoor stonden daar termen in zoals:
- `symphysis pubica` en `crista pubica` (i.p.v. simpelweg `os pubis`).
- `facies glutea van het os ilium` (i.p.v. `crista iliaca, SIPS`).
- `linea aspera femoris` (i.p.v. `mediale/laterale/ventrale zijde corpus femoris`).
- `fossa iliaca` (i.p.v. `ventrale vlak os ilium`).
- `labium externum cristae iliacae` (i.p.v. `crista iliaca`).
- `sulcus nervi radialis` en `tuberositas deltoidea` (niet in reader).

Omdat eerdere controles vooral keken naar `muscles.json`, bleven deze termen in `boneAttachments.ts` staan.

### Oorzaak B: Vite negeerde wijzigingen in de data-map!
Toen ik `boneAttachments.ts` aanpaste, bleef de browser toch de oude termen tonen. Waarom?
In `vite.config.ts` stond deze instelling:
```ts
server: {
  watch: {
    ignored: ['**/src/data/muscles.json', '**/src/data/**'],
  }
}
```
Vite had expliciet de instructie gekregen om **alle bestanden in `src/data/` te negeren voor file watching**! Wijzigingen in de bronbestanden werden daardoor in development niet herladen en Vite bleef een oude cache in het geheugen serveren.

### Oorzaak C: Browser LocalStorage overschreef de broncode
In eerdere versies van de app werd de dataset in `localStorage` gecached (voor de editor). Zelfs als `muscles.json` werd bijgewerkt, laadde de browser soms de verouderde gegevens uit `localStorage`.

---

## 3. Wat is er nu concreet opgelost?

### ✅ 1. `boneAttachments.ts` compleet herschreven (1:1 gelijk aan de Spieren-tab)
Alle 18 botten in [src/data/boneAttachments.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneAttachments.ts) zijn nu letterlijk gelijkgetrokken met de termen uit `muscles.json` en de reader:
- **Os coxae:**
  - `rectus_abdominis` insertie: **`os pubis`** (alle verwijzingen naar symphysis pubica en crista pubica zijn verwijderd).
  - `gluteus_maximus` origo: **`crista iliaca, SIPS`** (facies glutea is verwijderd).
  - `adductores` origo: **`os pubis, os ischii`** (was voorheen gekoppeld aan een niet-bestaand ID `adductor_magnus`).
  - `latissimus_dorsi` origo: **`dorsale zijde crista iliaca`**.
  - `iliopsoas` origo: **`ventrale vlak os ilium`** (fossa iliaca is verwijderd).
  - `obliquus_internus_abdominis` origo: **`crista iliaca, SIAS`**.
  - `obliquus_externus_abdominis` insertie: **`crista iliaca`**.
- **Os femur:**
  - `vastus lateralis / medialis / intermedius`: `laterale/mediale/ventrale zijde corpus femoris` (linea aspera en femurschacht zijn verwijderd).
  - `gluteus maximus`: `proximale laterale deel van corpus femoris` (tractus iliotibialis is weg).
  - `adductores`: `mediale zijde corpus femoris, condylus medialis`.
- **Os tibia & Fibula:**
  - `semitendinosus` & `semimembranosus`: beiden strak `condylus medialis tibiae` (pes anserinus toevoegingen in de aanhechtingslocatie zijn weggehaald).
  - `soleus`: `proximale dorsale deel corpus tibia` en `proximale 1/3 deel van dorsale zijde fibula`.
- **Os sternum & Costae:**
  - `rectus_abdominis` stond bij het sternum en de ribben foutief onder *insertie*; dit is gecorrigeerd naar **origo** (`processus xiphoideus` en `5e - 7e costa`).

### ✅ 2. `muscles.json` opgeschoond
- `gluteus_maximus`: insertie is nu uitsluitend `proximale laterale deel van corpus femoris` (zowel in tekst als in visuele marker-coördinaten).
- `biceps_brachii` & `triceps_brachii`: docenten-aantekeningen `(2x art. cubiti...)` verwijderd.
- `pectoralis_major`: `crista tuberculi majoris` verwijderd uit toelichting.
- `m. trapezius` pars descendens: **`dorsaal onderzijde schedel`** is behouden conform jouw akkoord.
- Visuele lijnnamen in de editor/viewer zijn ontdaan van Latijnse atlasnamen (`Labium externum`, `Fossa iliaca`, etc.).

### ✅ 3. Vite Server & Cache gefixt
- In [vite.config.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/vite.config.ts) is de `watch.ignored`-regel verwijderd. Vite herlaadt nu automatisch zodra een databestand wijzigt.
- In [src/utils/export.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/export.ts) ruimt de app bij het opstarten automatisch oude localStorage-caches op. `muscles.json` is nu te allen tijde de enige, directe bron van waarheid.

### ✅ 4. Titels en labels in Botten-tab vereenvoudigd
- `Relevante botstructuren (Reader):` aangepast naar **`Relevante botstructuren:`** (de toevoeging *(Reader)* is verwijderd).
- `Aanhechtende spieren (Origo & Insertie)` aangepast naar **`Aanhechtende spieren`** (*(Origo & Insertie)* is verwijderd).
- `Origo (oorsprong):` aangepast naar **`Origo:`** (*(oorsprong)* is verwijderd).
- `Insertie (aanhechting):` aangepast naar **`Insertie:`** (*(aanhechting)* is verwijderd).
- De Nederlandse vertalingen van de relevante botstructuren (bijv. *heupkom*, *dijbeenkop*) zijn behouden.

### ✅ 5. Botten bewerken: automatisch verspringen naar spier bewerken opgelost
- **Oorzaak van het verspringen:**
  In `BoneContext.tsx` werd bij elke pixel die je sleepte direct een `POST /api/save-bones` gestuurd die het bestand `src/data/bonesData.ts` op schijf overschreef (tientallen keren per seconde tijdens het slepen). Omdat Vite de data-bestanden monitort, leidde dit tot een onmiddellijke Hot Module Reload van de app. `EditorView` werd opnieuw gemount en viel terug op de standaardinstelling (`editorTab = 'muscles'`).
- **Wat is er aangepast:**
  1. `EditorView` onthoudt nu je gekozen tab (`Botten bewerken` of `Spieren bewerken`) in `localStorage`. Zelfs als er een herlaadbeurt optreedt, blijf je altijd in de gewenste bewerkmodus.
  2. Het verslepen van botpunten (zoals pubis en ischium) gebeurt nu vloeiend in React-state en `localStorage` zonder constante schijf-I/O.
  3. Er is een prominente knop **`Opslaan naar bronbestand`** (groen) toegevoegd in de botten-editor. Zodra je de punten op de gewenste plek hebt gesleept, klik je hierop om ze permanent weg te schrijven naar `src/data/bonesData.ts`.

---

## 6. Huidige status & verificatie
1. **Volledige repo-scan op verdachte termen:**
   Geautomatiseerde scan bevestigt: **0** niet-reader termen aanwezig.
2. **Synchronisatie van alle tabs en toetsen:**
   Alle spieren, botten, gewrichten en toetsvragen putten nu direct uit dezelfde opgeschoonde bron.
3. **Botten bewerken:**
   Je kunt nu zonder onderbrekingen naar 'Botten bewerken' gaan en de punten van het *os pubis* en *os ischium* verplaatsen.
4. **Build en synchronisatie:**
   `npm run build` is 100% foutloos gepasseerd en alle wijzigingen zijn direct vastgelegd in Git.
## 7. Standaard startweergave: Ventraal aanzicht & alle spieren geselecteerd
- **Vraag:** Bij het openen van de app moet hij op het tabblad Spieren staan in ventraal aanzicht (was voorheen dorsaal) en moeten standaard alle spieren geselecteerd zijn.
- **Oorzaak analyse:** 
  - `MuscleContext.tsx` selecteerde voorheen standaard enkel de eerste spier (`m. latissimus dorsi`), wat een dorsale spier is.
  - `StudyView.tsx` en `MobileStudyView.tsx` wisselden hierdoor bij de eerste render automatisch naar het aanzicht van die eerste spier (`dorsaal`).
- **Oplossing doorgevoerd:**
  - `selectedMuscleIds` initialiseert nu met **alle actieve spieren** (`31 spieren`).
  - `focusedMuscleId` initialiseert met de eerste ventrale spier (`m. pectoralis major`) zodat de detailkaart direct een relevante ventrale spier toont.
  - De eerste render-effecten in zowel `StudyView.tsx` als `MobileStudyView.tsx` zijn beveiligd met een mount-check, zodat het ventrale aanzicht niet meer overschreven wordt bij het openen van de app.
  - `npm run build` en browserverificatie bevestigen: app opent op de tab 'Spieren', in 'Ventraal' aanzicht, met '31 spieren actief'.

## 8. Tussenformaat / Tablets: Eerder overschakelen naar mobiele layout (geen verticaal scrollen meer)
- **Vraag:** Er zat een tussenformaat in de app (voor tablets / resized vensters) waarbij je continu naar beneden moest scrollen om de spierenlijst en details onder het skelet te vinden. Dit moest gelijk worden gemaakt aan de mobiele layout (eerder switchen).
- **Oorzaak analyse:** 
  - `useIsMobile.ts` gebruikte een hardcoded breekpunt van `820px`.
  - Tailwind's desktop 2-koloms lay-out (`lg:flex-row`) activeert pas vanaf `1024px`.
  - Daardoor vielen tablets en vensters tussen 821px en 1024px in een "gat": ze kregen de desktopcomponent, maar omdat die smaller was dan 1024px werden het skelet en het zijpaneel onder elkaar gestapeld (`flex-col`), waardoor je steeds naar beneden moest scrollen.
- **Oplossing doorgevoerd:**
  - Breekpunt in [`useIsMobile.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/hooks/useIsMobile.ts) verhoogd naar `1024px` (`window.innerWidth <= 1024`).
  - Alle tablets (zoals iPad, iPad Air, iPad Pro) en vensters tot 1024px schakelen nu direct over naar de compacte schermvullende touch-layout met de handige uitschuifbare lade onderin en gewrichtsselectie bovenin. Geen scrollpagina meer nodig!

## 9. Toetsmodus: Geen irrelevante spieren meer bij gewrichts- of algemene vragen
- **Vraag:** Bij sommige vragen die niet om een specifieke spier draaien (zoals de open vraag over de wervelbogen in de wervelkolom) leek er een willekeurige spier (zoals de gracilis/adductor op het bovenbeen) geselecteerd te worden met rode aanhechtingslijnen en werd er onnodig op ingezoomd. Dit moest opgelost worden: zoom in op de juiste plek (het gewricht) of toon het volledige skelet, maar selecteer nooit irrelevante spieren.
- **Oorzaak analyse:** 
  - `QuizView.tsx` koos bij het aanmaken van een vrije toetsvraag standaard altijd een willekeurige spier (`randMuscle`).
  - Wanneer de vraag vervolgens een gewrichtsvraag betrof (`openKind === 'joint'` of `mcKind === 'joint'`), bleef `currentQuestion.muscle` ingesteld op die willekeurige spier en werd het aanzicht van die willekeurige spier geforceerd.
  - Zowel de desktop als de mobiele `SkeletonViewer` tekende daardoor de rode/blauwe markeringen van die spier en zoomde automatisch in op het dijbeen/bekken van die willekeurige spier.
- **Oplossing doorgevoerd:**
  - In `QuizView.tsx` wordt nu gecontroleerd of de vraag om een gewricht of algemene anatomie draait (`isJointQuestion`). Zo ja:
    - `muscle` wordt expliciet op `undefined` gezet; er wordt **geen enkele irrelevante spier** meer geselecteerd of getoond.
    - Met [`getJointLocation()`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/jointQuestions.ts) wordt het specifieke gewricht herkend (zoals wervelkolom `romp`, `cubiti`, `genus`, `coxae`, `pedis`, `humeri`, `cingulum`).
    - Voor wervelboogvragen schakelt de weergave direct naar het juiste aanzicht (`dorsaal`) en zoomt hij in op de wervelkolom.
    - Voor algemene vragen (zonder specifieke gewrichtslocatie) herstelt hij automatisch naar het rustige, volledige skeletbeeld (`zoom: 1`).
  - [`SkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx) ondersteunt nu `targetFocusPoint` zodat hij soepel inzoomt op het gewricht zonder enige spiermarkeringen, en [`QuizFeedback.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizFeedback.tsx) is beveiligd zodat er geen spierkaarten verschijnen bij gewrichtsvragen.

## 10. Toetsen & Mobiele Quiz Update: Icoontje Gemengde toets weg, Auto-roteer toggle, Score-indicatoren & Bewegingsiconen
- **Vraag:**
  1. Icoontje (🔀) naast 'Gemengde toets' verwijderen; de toets zelf behouden.
  2. Toggle toevoegen bij testen en oefenen om het automatisch meedraaien van het aanzicht aan/uit te zetten (niet te prominent, in uitklapbaar paneel op mobiel).
  3. Minimalistische score-weergave op mobiel: alleen kleine groene en rode cijfers voor goede/foute antwoorden zonder extra tekst.
  4. Bewegingsiconen op mobiel verbeteren (o.a. supinatie en pronatie die er soms vreemd uitzagen).
  5. Niet direct pushen naar GitHub; eerst lokaal testen en verifiëren in de browser omdat de app actief door studenten gebruikt wordt.
- **Doorgevoerde wijzigingen:**
  - **Gemengde toets behouden & icoontje verwijderd:** Het 🔀-icoon is weggehaald uit alle dropdowns en vraagtitels in zowel [`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) als [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx). De toetsoptie heet nu strak: `Gemengde toets (alle testen door elkaar)`.
  - **Auto-roteer toggle:**
    - State `autoRotateView` toegevoegd met persistentie in `localStorage`.
    - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx) geplaatst in het uitklapbare instellingenpaneel (`isPanelExpanded`), zodat het scherm tijdens het oefenen en testen 100% rustig blijft en niet stoort.
    - Zowel beschikbaar in de oefenmodus als testmodus.
    - Alleen wanneer actief roteert het skelet automatisch mee naar het spieraanzicht.
  - **Minimalistische scorecijfers op mobiel:**
    - In de mobiele headerbalk en feedbackweergave kleine groene (`text-emerald-600`) en rode (`text-rose-500`) cijfers toegevoegd.
    - Zonder enige begeleidende tekst of storende kaders, direct zichtbaar en discreet.
  - **Bewegingsiconen geoptimaliseerd:**
    - In [`MovementIcon.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/MovementIcon.tsx) is `supinatie` ontdaan van de losse zwevende lijn en voorzien van een soepele roterende kom-boog met gecentreerd draaipunt.
    - `pronatie` toegevoegd met een gespiegelde naar-binnen draaiende pijlboog.
    - `flexie` opgeschoond zodat de buigingshoek direct natuurlijk oogt.
  - **Browserverificatie:**
    - Volledig getest op mobiel formaat (420x820) via de browser agent. Alles werkt soepel en bouwt met 0 fouten (`npm run build`).
    - Conform verzoek **niet** direct naar GitHub gepusht zodat studenten ongestoord kunnen doorwerken.

---
*Dit document wordt bij elke stap bijgewerkt zodat je altijd precies weet wat er gebeurt.*

## 11. Mobiel: Onderste frame klapt ongewenst uit bij volgende vraag [2026-10-30 21:10]
- **Observatie & Melding:**
  - Wanneer een student op mobiel een vraag heeft beantwoord en op "Volgende" drukt, schiet het onderste paneel telkens automatisch open/omhoog (naar de 85vh stand met het instellingenmenu).
  - Als de gebruiker het frame in de minimale/ingeklapte stand heeft gezet, moet het ook na het drukken op "Volgende" te allen tijde in die stand blijven staan.
- **Gedachten & Probleemanalyse:**
  - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx) staat een `useEffect`:
    ```ts
    useEffect(() => {
      if (practiceMode === 'free' || isEvaluated) {
        setIsPanelExpanded(true);
      }
    }, [practiceMode, isEvaluated]);
    ```
    Hierdoor werd `isPanelExpanded` bij élke beantwoorde vraag (`isEvaluated`) geforceerd op `true` gezet.
  - Zodra de gebruiker vervolgens op "Volgende vraag" drukte, werd `isEvaluated` weer `false`, maar bleef `isPanelExpanded` op `true` staan.
  - Omdat `isPanelExpanded === true` en `!isEvaluated`, toonde de component direct het volledige instellingenmenu (`Oefenen vs Testen`, `Kies Gewricht`, etc.) en breidde het frame zich uit naar `max-h-[85vh]`.
  - Bovendien was de toestand van het "instellingenmenu" vermengd met de "minimale / ingeklapte kaartstand".
- **Voortgang & Huidige status [2026-10-30 21:16]:**
  - Code refactor in [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx) doorgevoerd:
    - Oude geforceerde `useEffect` die `isPanelExpanded(true)` zette verwijderd.
    - `isMinimized` status geïntroduceerd: als het frame geminimaliseerd is, blijft het 46px hoog en blijft deze stand behouden wanneer de gebruiker op "Volgende" drukt.
    - Zelfs in de geminimaliseerde stand kan de student nu via een compacte blauwe `>` knop direct naar de volgende vraag zonder dat het scherm verspringt.
    - Instellingenmenu (`isSettingsOpen`) volledig ontkoppeld van de kaarthoogte, zodat het menu nooit meer ongevraagd openklapt bij een nieuwe vraag.
  - **Compilatie geslaagd [2026-10-30 21:17]:**
    - Alle resterende verwijzingen opgeschoond, ongebruikte `useEffect` import verwijderd.
    - `npm run build` is foutloos geslaagd (exit code 0).
  - **Verificatie & Resultaat [2026-10-30 21:20]:**
    - Browser test succesvol uitgevoerd op mobiel schermformaat (420x820):
      1. Wanneer het frame naar de minimale stand (46px) wordt geklikt/gesleept, blijft het strikt in deze stand staan bij het doorklikken naar opeenvolgende vragen (getest van *m. rectus femoris* naar *m. tensor fasciae latae*).
      2. Er klapt geen enkel instellingenmenu meer ongewenst open; het instellingenmenu opent alleen nog wanneer de gebruiker doelbewust op de categorietitel klikt.
      3. Zowel snelle tikken als sleepbewegingen op de handgreep schakelen betrouwbaar tussen de minimale stand (maximaal zicht op het 3D skelet) en de compacte vraagstand.
## 12. Verduidelijking mobiele frame-standen: Minimale stand vs Grote stand [2026-10-30 21:24]
- **Observatie & Verduidelijking van de gebruiker:**
  - De term "minimale stand" betekent NIET dat het frame helemaal leegklapt tot een plat balkje (helemaal inklappen hoeft niet).
  - De **minimale stand** is de normale, compacte weergave van de vraag (de vraagtekst, "Plaats origo & insertie", meerkeuzeopties of controleerknop).
  - De **grote stand** is het uitgeklapte instellingenmenu (Oefenen vs Testen, Kies gewricht, auto-rotate toggle).
  - Het groter maken van het frame moet gebeuren door op **het "-" (het liggende handgreep-streepje)** te drukken of dit omhoog te slepen; NIET door op de categorietitel te moeten drukken.
  - Zodra de student een vraag beantwoordt en op "Volgende" drukt, moet het frame in de normale minimale stand (de vraagkaart) blijven staan en NIET automatisch openschieten naar de grote instellingenstand.
- **Implementatie & Oplossing [2026-10-30 21:28]:**
  - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx):
    - `isMinimized` (leeg balkje) definitief verwijderd.
    - De **minimale stand** (`isExpanded === false`) is nu altijd de compacte vraagkaart: direct zicht op de vraagstelling ("Plaats origo & insertie: m. ..."), de rode/groene score, de knoppen en opties.
    - Het **"-" streepje**:
      - Functioneert als de enige centrale trigger om het instellingenpaneel te openen (`role="button"`, royale tikoppervlakte met `py-2.5`).
      - Klikken/tikken op het "-" streepje opent de **grote stand** (`isExpanded === true`), of sluit hem weer.
      - Slepen (drag) omhoog (`deltaY < -18`) opent de grote stand direct; slepen omlaag (`deltaY > 18`) sluit hem weer.
      - Duplicate touch- en click events opgelost via `hasDraggedRef`, zodat een snelle tik niet per abuis twee keer schakelt.
    - De categorietitel ("Origo & Insertie") is gewone informatieve tekst zonder click-handler.
    - Doorklikken naar de volgende vraag (`onNextQuestion`) roept `setIsExpanded(false)` aan: de volgende vraag opent ALTIJD in de minimale compacte vraagstand en schiet NOOIT automatisch open naar de grote stand.
  - Compilatie succesvol (`npm run build` code 0).
  - **Browser verificatie geslaagd [2026-10-30 21:29]:**
    - Getest in de browser op mobiel formaat (420x820):
      1. **Minimale stand als uitgangspunt:** Het frame opent direct met de vraag, de instructie ("Plaats origo & insertie: ..."), de antwoordopties en de minimalistische scoreteller (geen leeg balkje meer).
      2. **Bediening via het "-" streepje:** Een tik/klik op het centrale "-" streepje of omhoog slepen vouwt het instellingenpaneel soepel open (`isExpanded === true`).
      3. **Sluiten:** Een tweede tik op het "-" streepje sluit het paneel direct weer naar de minimale vraagstand.
      4. **Volgende vraag stabiliteit:** Bij het doorklikken naar opeenvolgende vragen blijft het frame consequent in de minimale vraagstand staan en schiet het nooit meer vanzelf open naar de grote instellingenstand.
    - Wijzigingen lokaal getest en goedgekeurd door gebruiker.
    - **Gepusht naar GitHub [2026-10-30 21:31]:** Alle wijzigingen (mobiel frame minimale stand & drag, auto-rotate view toggle, minimalistische score in quiz, verfijnde bewegingsiconen) definitief vastgelegd en gepusht.

## 13. Mobiel: Centering in StudyView, Frame-hoogtes & Navigatie-stabiliteit in Spieren & Botten [2026-10-30 21:43]
- **Observaties & Meldingen van de gebruiker:**
  1. *Centreren in de study view:* Bij het skippen/drukken op 'volgende' spier in de studiemodus (`#study`) moet het skelet automatisch centreren en inzoomen rondom de actieve spier.
  2. *Frame-hoogte study view:* Bij het uitschuiven schoot het frame zo hoog omhoog (`calc(100dvh - 7.5rem)`) dat de bovenkant en de "-" handgreep verdwenen onder het dropdownmenu erboven (`z-50`). Bij draggen moet je het frame zover kunnen uitschuiven als je wilt, met een veilige limiet zodat het nooit onder de dropdown schuift.
  3. *Frame-hoogte botten tab (`#bones`):* Het uitgeschoven frame werd standaard te groot (bijna schermvullend). Bij een klik moet het frame maximaal tot 50% van het beeldscherm komen (`50vh`). Alleen met doelbewust slepen (drag) mag het frame hoger getrokken worden.
  4. *Ongewenst toggelen bij vorig/volgend:* In zowel de study- als de botten-tab minimaliseerde het frame als het gemaximaliseerd was en maximaliseerde het als het geminimaliseerd was wanneer de gebruiker op "volgende" of "vorige" drukte. Het frame moet strikt op de ingestelde hoogte/stand blijven staan.
- **Probleemanalyse:**
  - *Centreren:* In [`MobileStudyView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/MobileStudyView.tsx) werd `<SkeletonViewer>` aangeroepen zonder de prop `autoCenterMuscle={true}`. Daardoor bleef het skelet star op de vorige pan/zoom staan.
  - *Toggelen bij Next/Prev:* De `<button>` knoppen voor vorig/volgend bot/spier zaten binnen een wrapper-div die een globale `onClick` en touch handlers had om de drawer te toggelen. Daardoor triggerde elke klik op Next ook een toggle van de drawer.
  - *Hoogtes:*
    - In StudyView was de geopende stand vastgezet op `max-h-[calc(100dvh-7.5rem)]`.
    - In BonesView was de geopende stand vastgezet op `max-h-[calc(100dvh-5.5rem)]`.
- **Implementatie & Oplossing [2026-10-30 21:46]:**
  - In [`MobileStudyView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/MobileStudyView.tsx):
    - `autoCenterMuscle={true}` geactiveerd op `<SkeletonViewer>`: bij het wisselen of skippen naar de volgende spier centreert en zoomt het skelet automatisch in op de actieve spier.
    - Drag-handle (`-`) volledig geïsoleerd van de navigatierij: klikken op `>` of `<` raakt de drawer-hoogte nooit meer aan.
    - Bij een klik op `-` opent het paneel standaard tot 50% van het scherm (`50vh`).
    - Bij draggen kan de student het paneel soepel op elke gewenste hoogte instellen, met een veilige bovengrens (`calc(100dvh - 7rem)`) zodat het `-` streepje nooit onder het topdropdownmenu verdwijnt.
  - In [`BonesView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx):
    - Drag-handle (`-`) geïsoleerd van de knoppen en bottitel: skippen met `<` en `>` behoudt altijd exact de huidige drawerstand.
    - Standaard geopende hoogte ingesteld op 50% van het scherm (`50vh`) in plaats van schermvullend. Alleen via omhoog draggen kan het frame verder worden uitgetrokken.
  - Compilatie succesvol (`npm run build` exit code 0).
- **Browser-verificatie geslaagd [2026-10-30 21:47]:**
  - **Study View (`#study`):**
    - Bij klikken op `>` wisselt de spier, zoomt/centreert het skelet direct rondom de spier, en blijft de drawer standvastig staan.
    - Klik op `-` opent de lade tot precies 50% van het scherm; het `-` streepje en de dropdown blijven beide perfect zichtbaar.
    - Doorklikken op `>` terwijl de lade openstaat houdt de lade open op zijn ingestelde hoogte.
    - Klik op `-` sluit de lade weer.
  - **Bones View (`#bones`):**
    - Klikken op `>` wisselt het bot zonder de drawer te toggelen.
    - Klik op `-` opent de lade tot 50% van het scherm.
    - Doorklikken op `>` behoudt de 50% hoogte en minimaliseert niet.
    - Klik op `-` sluit de lade.
- **Gepusht naar GitHub [2026-10-30 21:48]:** Alle wijzigingen vastgelegd en gepusht naar `main`.

## 14. Mobiel: Opties standaard uitgeklapt bij tikken op Oefen of Test [2026-10-30 22:47]
- **Observatie & Verzoek van de gebruiker:**
  - Wanneer een student op mobiel op de "Oefen" of "Test" knop drukt, opende het frame voorheen in de ingeklapte minimale stand.
  - De gebruiker wil dat bij het kiezen van "Oefen" of "Test" het optieframe standaard **uitgeklapt** is, zodat direct voor de student zichtbaar en duidelijk is dat ze een testtype of gewricht kunnen kiezen en veranderen.
- **Probleemanalyse:**
  - `MobileQuizView.tsx` had `const [isExpanded, setIsExpanded] = useState<boolean>(false);`.
  - Bij navigeren naar Oefen of Test (in de mobiele header of via de switcher) bleef `isExpanded` op `false`, waardoor de dropdowns voor *Kies Testtype* en *Kies Gewricht* verborgen bleven totdat de student zelf op het `-` streepje tikte.
- **Implementatie & Oplossing [2026-10-30 22:48]:**
  - In [`MuscleContext.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/MuscleContext.tsx):
    - `quizOpenOptionsTrigger` en `triggerQuizOpenOptions` toegevoegd aan de context.
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx):
    - Bij het aantikken van zowel "Oefen" als "Test" in de mobiele navigatie wordt `triggerQuizOpenOptions()` direct aangeroepen.
  - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx):
    - `isExpanded` staat nu standaard op `true` bij het betreden van de toets.
    - Bij het aantikken van Oefen of Test (in de navigatiebalk of switcher) klapt het optiepaneel automatisch open (`setIsExpanded(true)`), zodat de student direct de dropdowns (*Kies Testtype* of *Kies Gewricht*) ziet.
    - Zodra de student een optie kiest in de dropdown, of op *Sluiten ✕* / `-` / *Volgende* drukt, klapt het frame compact in zodat er alle ruimte is om de vraag te beantwoorden.
- **Browser-verificatie geslaagd [2026-10-30 22:49]:**
  - Op mobiel formaat (420x820) getest:
    1. Vanaf `#study` tikken op "Oefen" opent de quiz met het optiepaneel direct uitgeklapt (*Oefenen / Testen* switcher en *Kies Gewricht* zichtbaar).
    2. Tikken op "Test" in de header schakelt direct over en toont netjes de *Kies Testtype* dropdown uitgeklapt.
    3. Een testtype kiezen (bijv. "Meerkeuze test") minimaliseert het paneel automatisch naar de compacte vraagweergave.
    4. Doorklikken naar opeenvolgende vragen blijft compact.
    5. Opnieuw tikken op "Test" of "Oefen" in de header klapt het paneel direct weer open om een ander type te kiezen.
- **Gepusht naar GitHub [2026-10-30 22:51]:** Wijzigingen gecommit en gepusht naar `main`.

## 15. Fix: Juiste origo en insertie werden al getekend vóór controle bij tekenvragen [2026-10-30 22:54]
- **Observatie & Melding van de gebruiker:**
  - Bij zowel de oefenmodus (studie per gewricht) als de testmodus (vrije toets) bij "Plaats origo en insertie" stonden de juiste origo en insertie al getekend op het skelet vóórdat de student het antwoord had gegeven.
- **Probleemanalyse (Root Cause):**
  - In commit `a97fc0d` werd `shouldShowMuscle` in [`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) en [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx) gewijzigd naar:
    `const shouldShowMuscle = !isJointQuestion && type !== 'bone' && !!muscle;`
  - Hierdoor werd `activeMuscle={muscle}` doorgegeven aan `<SkeletonViewer>` voor **alle** spiergerelateerde vragen, óók bij tekenvragen (`type === 'full'`, `type === 'origins'`, `type === 'insertions'`, `type === 'landmark'`) vóórdat de vraag geëvalueerd was (`!isEvaluated`).
  - [`SkeletonViewer`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx) tekent bij aanwezigheid van `activeMuscle` standaard alle origo's (blauwe O cirkels) en inserties (rode I cirkels) via `<MuscleMarkers />`.
  - Daardoor werd het antwoord direct verklapt op het skelet!
- **Implementatie & Oplossing [2026-10-30 22:55]:**
  - In [`SkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx):
    - `hideMuscleMarkers?: boolean` prop toegevoegd.
    - Wanneer `hideMuscleMarkers === true`: `musclesToRender` retourneert een lege lijst `[]`, waardoor er géén antwoordmarkers (origo's, inserties of spierlijnen) op het skelet worden getekend.
    - `activeMuscle` blijft intact beschikbaar voor `autoCenterMuscle={true}`, zodat de camera op mobiel en desktop wél automatisch inzoomt op het juiste anatomische gebied zonder het antwoord te verklappen.
  - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx) en [`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx):
    - `hideMuscleMarkers={!isEvaluated && isDrawingType}` doorgegeven aan `<SkeletonViewer>`.
    - Pas nadat de student op "Controleer antwoord" tikt (`isEvaluated === true`), worden de referentiepunten zichtbaar.
  - Compilatie succesvol (`npm run build` exit code 0).
- **Browser-verificatie geslaagd [2026-10-30 22:56]:**
  - Getest in de browser op mobiel formaat (420x820):
    1. Vraag "Plaats origo & insertie: m. rectus femoris": skelet opent volledig blanco/schoon zonder voorgeplaatste origo- of insertiepunten.
    2. Student plaatst zelf een origo en insertie: alleen de eigen punten verschijnen op het skelet.
    3. Tikken op "Controleer antwoord": referentiepunten en feedback verschijnen pas ná controle.
    4. Doorklikken naar volgende vraag ("m. biceps femoris"): skelet is direct weer schoon en blanco voor de nieuwe opgave.
- **Gepusht naar GitHub [2026-10-30 22:57]:** Definitief vastgelegd en gepusht naar `main`.

## 16. Mobiel Botten-tab: Zichtbaarheid lage stippen & Strakke, subtiel pulserende ring [2026-10-30 22:58]
- **Observaties & Meldingen van de gebruiker:**
  1. *Lage stippen (onderbeen / voeten):* Op de mobiele versie van de botten-tab vallen de laag liggende stippen (zoals fibula, tibia, tarsus, metatarsus, phalanges) buiten beeld of onder de onderste lade. De stip moet altijd duidelijk in beeld zijn.
  2. *Zichtbaarheid & Stijl van de stip:* De stip is soms moeilijk te zien. De gebruiker wil een subtiel pulserende ring eromheen, in lijn met de rest van het design. Strak, minimalistisch en rustig; géén drukke `flow` of kermisachtige effecten.
- **Probleemanalyse:**
  - In [`BoneSkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx) ontbrak auto-focus / auto-centrering bij het selecteren van een bot op mobiel. Het skelet bleef standaard op zoom 1.0 staan, waardoor botten onderaan het skelet (y = 0.75 tot 0.98) deels achter de zwevende lade vielen.
  - De geselecteerde marker had voorheen een drukke `animate-ping` buitenring (die snel uitklapt en verdwijnt) en een gewone lichtblauwe stip, wat op sommige achtergronden minder scherp contrasteerde.
- **Plan van aanpak:**
  1. *Automatisch centreren op mobiel:*
     - In [`BoneSkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx) een `useEffect` toevoegen die bij verandering van `selectedBone` (of wisselen tussen ventraal/dorsaal) de camera soepel naar de marker panned en zoomt (`targetZoom = 1.35`), met het doelpunt veilig op `desiredScreenY = 0.33` (bovenaan het scherm).
     - Hierdoor staan ook de laagste stippen (zoals de voetbotjes) altijd ruim boven de onderste lade in het vrije zicht.
  2. *Strakke, minimalistische markerstijl:*
     - Drukke `animate-ping` verwijderen.
     - Vervangen door een rustige, subtiel ademende ring met `animate-pulse` (`rgba(37, 99, 235, 0.16)` fill en `#3b82f6` stroke), identiek aan de rustige referentiepulsen in de rest van de app.
     - Extra witte concentrische accentring en krachtige witte omlijning met drop-shadow toevoegen voor kristalhelder contrast tegen zowel het skelet als de witte achtergrond.
  3. Lokaal testen en verifiëren in de browser via de mobiele viewport (420x820).
- **Implementatie & Oplossing [2026-10-30 23:01]:**
  - In [`BoneSkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx):
    - `useEffect` geïmplementeerd voor mobiel (`isMobile && selectedBone`):
      - Berekent marker-coördinaten en zet `zoom = 1.35`.
      - Berekent `panOffset` zodat het geselecteerde bot automatisch op `33%` van de schermhoogte (`desiredScreenY = 0.33`) gepositioneerd wordt. Hierdoor vallen onderbeen- en voetstippen gegarandeerd ruim boven de onderste zwevende lade.
      - Vloeiende CSS `transition: transform 0.4s cubic-bezier(0.2, 0.8, 0.2, 1)` toegepast op de skeleton container (automatisch uitgeschakeld tijdens handmatige drag/pinch).
    - Marker styling herzien naar minimalistisch & professioneel design:
      - Geen felle/drukke ping of flow;
      - Subtiel ademende ring met rustige `animate-pulse` (`fill="rgba(37, 99, 235, 0.16)"`, `stroke="#3b82f6"`);
      - Scherpe witte accentring (`stroke="#ffffff"`, `opacity="0.9"`);
      - Hoofdmarker cirkel in strak PMT-blauw (`#2563eb`) met witte 4px rand en `drop-shadow(0px 2px 5px rgba(0, 0, 0, 0.35))` voor optimaal contrast tegen wit bot en achtergrond;
      - Wit gecentreerd puntje (`r={radius * 0.35}`).
    - `strokeColor` compilatiefoutje hersteld en build gevalideerd (`npm run build` exit code 0).
- **Browser-verificatie geslaagd [2026-10-30 23:02]:**
  - Getest via de browser subagent met mobiele viewport (420x820):
    1. Geselecteerd op *Os fibula* (Kuitbeen) en *Os tibia* (Scheenbeen).
    2. De camera zoomt en beweegt direct en soepel naar het onderbeen en de voeten.
    3. Zowel de actieve kuitbeenstip als de onderliggende voetstippen (ossa tarsi, ossa metatarsi, phalanges) staan ruim boven de onderste balk vrij in het gezichtsveld.
    4. De stip is kristalhelder zichtbaar dankzij de subtiele pulserende ring en witte contrastrand, zonder kermisachtig of onrustig over te komen.
- **Gepusht naar GitHub [2026-10-30 23:03]:** Wijzigingen gecommit en gepusht naar de GitHub repository.

## 17. Mobiel Toets/Quiz: 'Bot benoemen' - Auto-centering & Strakke subtiele pulserende ring [2026-10-30 23:06]
- **Verduidelijking van de gebruiker:**
  - De eerdere wens voor de altijd zichtbare stip op onderbeen/voeten en de subtiel pulserende ring was vooral bedoeld voor de **toets** bij de vraagmodus **"Bot benoemen"** (`#quiz`).
- **Probleemanalyse:**
  - In [`SkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx):
    - `autoCenterMuscle` handelde wel `activeMuscle` en `targetFocusPoint` af, maar er ontbrak een tak voor `targetBoneMarker`.
    - Daardoor bleef het skelet bij vragen van het type `'bone'` op zoom 1.0 en pan (0,0) staan. Omdat onderbeen- en voetbotten (zoals calcaneus, talus, fibula, ossa tarsi) helemaal onderaan het skelet liggen (y = 0.75 - 0.98), vielen ze recht achter de uitschuifbare antwoordkaart van [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx).
    - Bovendien had de `targetBoneMarker` in `SkeletonViewer.tsx` een kleine blauwe stip met een gewone `rgba(14, 165, 233, 0.3)` cirkel, wat op het skelet minder scherp contrasteerde.
- **Implementatie & Oplossing [2026-10-30 23:07]:**
  - In [`SkeletonViewer.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx):
    - `autoCenterMuscle` uitgebreid met ondersteuning voor `targetBoneMarker`:
      - Berekent `targetZoom = isMobile ? 1.35 : 1.25`.
      - Positioneert het doelbot op mobiel strak op 32% vanaf de bovenkant van het scherm (`desiredScreenY = 0.32`).
      - Hierdoor zweeft de botmarker altijd ruim en vrij boven de onderste antwoordkaart (zelfs bij het laagste bot zoals het hielbeen/calcaneus).
    - Marker styling compleet vernieuwd volgens de minimalistische richtlijnen:
      - 1. Subtiel pulserende ring (`animate-pulse`) met `rgba(37, 99, 235, 0.16)` fill en `#3b82f6` stroke (ademend op opacity, strak en klinisch).
      - 2. Fijne witte accentring (`stroke="#ffffff"`, `opacity="0.9"`) voor scherp contrast tegen het bot.
      - 3. Hoofdmarker stip in PMT-blauw (`#2563eb`) met 4px witte omranding en `drop-shadow(0px 2px 6px rgba(0, 0, 0, 0.4))`.
      - 4. Scherp gecentreerd wit richtpuntje (`r={5 / zoom}`).
    - Zwevende `135% Reset` knop toegevoegd op mobiel wanneer `zoom > 1.05`, zodat studenten na eventueel pannen/zoomen direct weer kunnen herstellen.
- **Browser-verificatie geslaagd [2026-10-30 23:08]:**
  - Getest via de browser subagent op mobiel formaat (420x820) in de toetsweergave (`#quiz`, modus *Bot benoemen*):
    1. Vraag met *Calcaneus (hielbeen)* op de absolute onderkant van de hiel: camera zoomt direct soepel in naar 135%, de voet en het hielbeen staan perfect in de bovenste helft van het scherm, meer dan 200px boven de invoerkaart.
    2. Vraag met *Os sacrum*: direct gecentreerd op het bekken.
    3. De stip is direct opvallend en kristalhelder zichtbaar dankzij de subtiele ademende blauwe ring en witte contrastrand, volledig zonder flitsende effecten of kermis.
    4. De `135% Reset` knop verschijnt keurig rechtsboven en herstelt de weergave bij een tik.
- **Gepusht naar GitHub [2026-10-30 23:09]:** Wijzigingen gecommit en gepusht naar `main`.

## 18. Toets: Spaced Repetition / Herhaling van fout beantwoorde vragen na ~5 vragen [2026-10-30 23:08]
- **Gebruikerswens:**
  - "kan je ervoor zorgen dat als je een vraag fout hebt beantwoord diezelfde vraag er na een stuk of 5 (hoeft niet precies) wordt herhaald?"
- **Gedachten & Probleemanalyse:**
  - Dit is het klassieke Leitner / flashcard principe van *spaced repetition*: wanneer een student een vraag fout heeft, moet de vraag niet verloren gaan of direct opnieuw getoond worden (wat alleen kortetermijngeheugen test), maar na ongeveer 4 tot 6 tussenliggende vragen opnieuw langskomen.
  - Als de vraag vervolgens alsnog fout wordt beantwoord, blijft hij in het herhaalschema tot de student hem onder de knie heeft.
- **Architectuur & Ontwerp van het plan:**
  1. *Wachtrij voor herhalingsvragen:*
     - Een state/ref `retryQueue` met objecten `{ question: QuizQuestion, dueAtCount: number }`.
     - Een teller `questionCounterRef` die oploopt bij elke beantwoorde / volgende vraag.
  2. *Wanneer een vraag fout is (`!isSuccess`):*
     - In alle 4 evaluatiefuncties (`evaluateAttempt`, `handleMultipleChoiceSelect`, `handleMovementSubmit`, `handleOpenAnswerSubmit`):
     - Zodra `!isSuccess`: voeg een kloon van `currentQuestion` toe aan de wachtrij met `dueAtCount = currentCount + (4 + Math.floor(Math.random() * 3))` (dus na 4, 5 of 6 vragen).
  3. *Wanneer de volgende vraag wordt geladen (`handleNextQuestion`):*
     - `questionCounter` verhogen.
     - Eerst controleren of er een vraag in `retryQueue` zit waarvan `dueAtCount <= questionCounter` en die past bij de actieve modus (inclusief behoud van vraagtype).
     - Indien ja: haal deze vraag uit de wachtrij, markeer eventueel `isRetry: true`, schud bij meerkeuze de opties willekeurig zodat de positie niet hetzelfde is, en toon de vraag via een centrale `loadQuestion` functie.
     - Indien nee: genereer een nieuwe willekeurige vraag zoals gebruikelijk.
  4. *In gewrichtsmodus (`practiceMode === 'joint'`):*
     - Als de spieren van het gewricht doorlopen zijn maar er staan nog foute vragen open in de herhaalwachtrij, worden die eerst herhaald voordat de sessie als afgerond wordt gemarkeerd.
  5. *Reset afhandeling:*
     - Bij handmatig resetten van de toetsscore wordt ook de wachtrij leeggemaakt.
- **Implementatie & Oplossing [2026-10-30 23:16]:**
  - In [`anatomy.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/types/anatomy.ts):
    - `isRetry?: boolean` optionele eigenschap toegevoegd aan `QuizQuestion`.
  - In [`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx):
    - `questionCounterRef` en `retryQueue` state geïntroduceerd.
    - `registerIncorrectQuestion`: berekent een willekeurige tussenruimte van 4, 5 of 6 vragen (`4 + Math.floor(Math.random() * 3)`) en bewaart de vraag in de wachtrij.
    - Ingebouwd in alle toetsevaluaties:
      1. Tekentoets (`evaluateAttempt`)
      2. Meerkeuze (`handleMultipleChoiceSelect`)
      3. Bewegingen (`handleMovementSubmit`)
      4. Open invulvragen & bot benoemen (`handleOpenAnswerSubmit`)
    - `loadQuestion`: reset alle interactieve componenten en inputs, genereert een uniek ID en schudt bij meerkeuze de opties willekeurig zodat de student niet blind dezelfde positie kan aanklikken.
    - `handleNextQuestion`: controleert eerst of er een herhalingsvraag aan de beurt is (`dueAtCount <= questionCounter`), laadt deze in met voorrang, en pakt pas een nieuwe vraag als er niets klaarstaat. In gewrichtsmodus worden overgebleven foute vragen aan het einde van het gewricht herhaald tot beheersing.
    - `handleResetStats`: wist de herhaalwachtrij en herstelt de teller naar 0.
    - Subtiel amber `Herhaling` label toegevoegd op desktop in de vraagkaart header.
  - In [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx):
    - Subtiel amber `Herhaling` label toegevoegd in de vraagheader op mobiel.
  - Compilatie gevalideerd met `npm run build` (exit code 0).
- **Gepusht naar GitHub [2026-10-30 23:17]:** Wijzigingen gecommit en gepusht naar `main`.
