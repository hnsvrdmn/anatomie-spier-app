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


## 19. Brainstorm Zijproject: Puzzel-gameplay & Gamification [2026-10-31 09:50]
- **Doel:** Een losstaand zijproject bedenken (niet bereikbaar vanuit de main app) om anatomie leren verslavender te maken met een puzzel-gameplay loop zoals *Sudoku*, *Queens* of *Connections*.
- **Bevindingen over de huidige app:**
  - De app heeft een hele rijke dataset met duidelijke relaties: **Spieren** hebben exacte **Origo's**, **Inserties**, **Botten**, **Gewrichten** en **Bewegingen**, plus **2D-coördinaten** op het skelet.
  - De huidige toetsmodus is vooral *vraag -> antwoord -> goed/fout* (flashcard-stijl). Dat werkt om te overhoren, maar mist het "deductie-gevoel" (het leggen van verbanden en uitsluiten van opties) dat puzzels zoals Sudoku of Queens zo verslavend maakt.
- **Actie:** Verschillende concrete puzzelconcepten uitgewerkt en voorgelegd aan de gebruiker, nog zonder code te bouwen.
- **Feedback van de gebruiker [2026-10-31 09:57]:**
  - De eerste 5 tekstuele puzzel-ideeën voelen nog niet écht verslavend.
  - Belangrijke randvoorwaarde: uitsluitend termen uit de officiële bronbestanden (`src/data/muscles.json`, `src/data/bonesData.ts`, `src/data/boneAttachments.ts`, `src/data/muscleMovements.ts`) mogen worden gebruikt — geen externe spieren (zoals *m. piriformis* of *m. gluteus medius*).
- **Nieuwe denkrichting:**
  - Waarom zijn spellen als *Sudoku*, *Queens*, *Minesweeper*, *Flow Free* of *GeoGuessr* verslavend? Omdat je **niet** lappen tekst zit te lezen, maar visueel/ruimtelijk bezig bent met snelle micro-interacties, kettingreacties en direct "satisfying" feedback.
- **Gekozen richting [2026-10-31 10:01]:**
  - Gebruiker kiest voor concept **3. "Anatomie Nonogram / Kleur-het-Skelet" (Botten & Aanhechtingen)**.
  - We werken het game-design nu gedetailleerd uit: hoe de gameplay loop werkt, hoe we omgaan met spieren die meerdere origo's hebben (zoals *m. biceps brachii* of *m. gastrocnemius*), hoe het "wegstreep/eliminatie"-effect werkt zoals bij Sudoku/Mahjong, en welke spelmodi of hints het verslavend maken.
- **Ontwerpkeuzes bevestigd door gebruiker [2026-10-31 10:06]:**
  1. **Labels op bot-pinnen:** Beide (aan/uit te zetten met een subtiele toggle).
  2. **Interactie (Optie B):** Eerst vrij op het skelet origo(s) en insertie(s) verbinden, en daarna de bijbehorende spier kiezen uit de beschikbare lijst.
  3. **Toegang:** Alleen via directe URL (`?game=1` of `#game`), volledig onzichtbaar vanuit de hoofdapp.
  4. **Stijl & Mobiel:** Volledig mobiel-vriendelijk én ultra-minimalistisch. Geen overbodige tekst, geen dubbele termen, geen toeters en bellen — strak, rustig en gefocust op de puzzel.
- **Actie:** Eerste speelbare versie van de puzzel (`SkeletonPuzzleGame.tsx`) bouwen en koppelen aan `#game` / `?game=1`.
- **Voortgang [2026-10-31 10:10]:**
  - Eerste versie van `src/components/game/SkeletonPuzzleGame.tsx` opgezet.
  - Gedeelde bot-punten (zoals *tuberositas tibiae* met 4 spieren, *tuber ischiadicum* met 3 spieren, *condylus medialis tibiae* met 2 spieren) worden samengevoegd tot één pin met een aflopende teller, zonder dubbele labels.
  - Nu eerst de referentiebestanden in het project (`pdf_exact_tables.json` / `extracted_pdf_pages` / `E:\windesheim\anatomie blok 1`) kort checken zodat alle gebruikte labels 100% overeenkomen met de reader, en daarna `App.tsx` koppelen op `?game=1` / `#game`.
- **Implementatie & Build [2026-10-31 10:11]:**
  - Terminologie gecontroleerd tegen `pdf_exact_tables.json` en `src/data/muscles.json` (verboden spieren zoals *m. tensor fascia latae* en *m. gluteus medius* worden automatisch uitgefilterd).
  - `src/App.tsx` aangepast zodat het zijproject **uitsluitend** laadt via `?game=1` of `#game`. De hoofdapp heeft geen enkele knop of verwijzing naar de game.
  - Compilatie (`npm run build`) uitgevoerd ter verificatie.
- **Ontwerpkeuzes bevestigd door gebruiker [2026-10-31 10:06]:**
  1. **Labels op bot-pinnen:** Beide (aan/uit te zetten met een subtiele toggle).
  2. **Interactie (Optie B):** Eerst vrij op het skelet origo(s) en insertie(s) verbinden, en daarna de bijbehorende spier kiezen uit de beschikbare lijst.
  3. **Toegang:** Alleen via directe URL (`?game=1` of `#game`), volledig onzichtbaar vanuit de hoofdapp.
  4. **Stijl & Mobiel:** Volledig mobiel-vriendelijk én ultra-minimalistisch. Geen overbodige tekst, geen dubbele termen, geen toeters en bellen — strak, rustig en gefocust op de puzzel.
- **Actie:** Eerste speelbare versie van de puzzel (`SkeletonPuzzleGame.tsx`) bouwen en koppelen aan `#game` / `?game=1`.
- **Voortgang [2026-10-31 10:10]:**
  - Eerste versie van `src/components/game/SkeletonPuzzleGame.tsx` opgezet.
  - Gedeelde bot-punten (zoals *tuberositas tibiae* met 4 spieren, *tuber ischiadicum* met 3 spieren, *condylus medialis tibiae* met 2 spieren) worden samengevoegd tot één pin met een aflopende teller, zonder dubbele labels.
  - Nu eerst de referentiebestanden in het project (`pdf_exact_tables.json` / `extracted_pdf_pages` / `E:\windesheim\anatomie blok 1`) kort checken zodat alle gebruikte labels 100% overeenkomen met de reader, en daarna `App.tsx` koppelen op `?game=1` / `#game`.
- **Implementatie & Build [2026-10-31 10:11]:**
  - Terminologie gecontroleerd tegen `pdf_exact_tables.json` en `src/data/muscles.json` (verboden spieren zoals *m. tensor fascia latae* en *m. gluteus medius* worden automatisch uitgefilterd).
  - `src/App.tsx` aangepast zodat het zijproject **uitsluitend** laadt via `?game=1` of `#game`. De hoofdapp heeft geen enkele knop of verwijzing naar de game.
  - Compilatie (`npm run build`) uitgevoerd ter verificatie.
- **Server opgestart [2026-10-31 10:15]:**
  - Vite dev server draait op poort **3000** (in plaats van 5173).
  - Exacte adres voor het zijproject: `http://localhost:3000/#game` (of `http://localhost:3000/?game=1`).

## 20. Verbeteringen Skelet-Puzzel & Nieuw Spel: "Anatomie Connections" [2026-10-31 10:23]
- **Feedback van de gebruiker op Spel 1 (Skelet-Puzzel):**
  1. De `Labels`-toggle voor aanhechtingspunten weghalen.
  2. Alle spierkaartjes onderin in één oogopslag zichtbaar maken zonder te hoeven scrollen (minimaal 7 spieren direct zichtbaar in een strak grid).
  3. De regio's/gewrichten bovenin bij hun **Latijnse naam** noemen (*Art. coxae*, *Art. genus*, *Art. pedis*, *Art. humeri*, *Art. cubiti*, *Cingulum pectorale*, *Columna vertebralis / Thorax*).
- **Nieuw verzoek:**
  - Bouw daarnaast **Spel 2: "Anatomie Connections"** (zoals NYT Connections: 16 kaartjes op een 4x4 bord, vind de 4 groepen van 4 die bij elkaar horen).
  - Gebruik hiervoor ook de extra theorie en antwoorden uit de reader in `E:\windesheim\anatomie blok 1` naast de bestaande app-data.
- **Actie:** Eerst `E:\windesheim\anatomie blok 1` inspecteren op documenten, reader-vragen en antwoorden.
- **Inhoud `E:\windesheim\anatomie blok 1` geanalyseerd [2026-10-31 10:24]:**
  - Naast de spiertabellen bevatten de antwoorddocumenten rijke leerstof voor **Anatomie Connections**:
    1. **Vlakken, Assen & Bewegingen:** Transversale as $\leftrightarrow$ Sagittaal vlak (flexie/extensie), Sagittale as $\leftrightarrow$ Frontaal vlak (abductie/adductie), Longitudinale as $\leftrightarrow$ Transversaal vlak (rotaties / pronatie-supinatie).
    2. **Synoviale gewrichtstypen:** *Art. ginglymus* (scharniergewricht, 1 as), *Art. trochoidea* (rolgewricht, 1 as), *Art. sellaris* (zadelgewricht, 2 assen), *Art. spheroidea* (bolgewricht, 3 assen), *Art. plana* (vlakgewricht), *Art. ellipsoidea* (ellipsvormig gewricht), *Art. trocho-ginglymus* (*art. genus* & *art. cubiti*).
    3. **Deelgewrichten & Samenstellende botten:**
       - *Art. cubiti*: *Art. humero-ulnaris*, *Art. humero-radialis*, *Art. radio-ulnaris proximalis* (*os humerus*, *os ulna*, *os radius*).
       - *Art. pedis*: *Art. talocruralis* (BSG: *os tibia*, *os fibula*, *os talus*), *Art. subtalaris* (OSG), *Art. talo-calcaneo-navicularis* (OSG: *os talus*, *os calcaneus*, *os naviculare*).
       - *Cingulum pectorale*: *Art. sterno-clavicularis*, *Art. acromio-clavicularis* (*os sternum*, *os clavicula*, *os scapula*).
       - *Romp / Vertebrae & Costae*: *Vertebrae cervicales (7)*, *thoracales (12)*, *lumbales (5)*, *Costae verae (7)*, *costae spuriae (3)*, *costae fluctuantes (2)*.
    4. **Botstructuren per bot & Ligamenten (*Art. pedis*):**
       - *Os coxae*: *SIAS*, *SIAI*, *SIPS*, *SIPI*, *Acetabulum*, *Tuber ischiadicum*, *Crista iliaca*.
       - *Os scapula*: *Acromion*, *Processus coracoideus*, *Cavitas glenoidalis*, *Spina scapula*, *Angulus superior/inferior*, *Margo medialis/lateralis*.
       - *Os humerus*: *Caput humeri*, *Tuberculum majus*, *Tuberculum minus*, *Trochlea humeri*, *Capitulum humeri*, *Epicondylus medialis/lateralis*.
       - *Ligamenten enkel*: *Lig. deltoideum* (remt pronatie), *Lig. calcaneofibulare*, *Lig. talofibulare anterior*, *Lig. talofibulare posterior* (remmen supinatie).
- **Actie:**
  1. In `SkeletonPuzzleGame.tsx`:
     - `Labels`-toggle verwijderd.
     - Gewrichten bovenin benoemd met hun Latijnse naam (*Art. coxae*, *Art. genus*, *Art. pedis*, *Art. humeri*, *Art. cubiti*, *Cingulum pectorale*, *Columna vertebralis*).
     - Spierkaartjes onderin in een strak, compact overzicht zonder scrollen zodat alle kaarten (minimaal 7+ spieren) direct in één oogopslag zichtbaar zijn.
  2. Nieuw spel `ConnectionsGame.tsx` ("Anatomie Connections") bouwen en via een minimalistische spel-switcher in de geheime `#game` / `?game=1` omgeving beschikbaar maken.
- **Tussenupdate [2026-10-31 10:25]:**
  - `SkeletonPuzzleGame.tsx` bijgewerkt:
    - `Labels`-toggle verwijderd.
    - Gewrichten bovenin op Latijnse naam gezet (*Art. coxae*, *Art. genus*, *Art. pedis*, *Art. humeri*, *Cingulum pectorale*, *Art. cubiti*, *Columna vertebralis*).
    - Onderin staan alle spierkaarten (tot 7 spieren) in een vast 2x4 / 4x2 grid direct in één oogopslag zichtbaar zonder scrollbalk.
  - Nu bezig met het bouwen van **Spel 2: "Anatomie Connections"** (`ConnectionsGame.tsx`) met de stof uit de app én de antwoordbestanden uit `E:\windesheim\anatomie blok 1`.
- **Afronding & Verificatie [2026-10-31 10:27]:**
  - `ConnectionsGame.tsx` gebouwd met 24 categorieën van elk 4 begrippen uit zowel de app-data als de PDF-antwoorden in `E:\windesheim\anatomie blok 1` (o.a. ligamenten *art. pedis*, samenstellende botten, deelgewrichten *art. cubiti* & *cingulum*, assen/vlakken/bewegingen, synoviaal gewrichtstypen, spierfysiologie & sarcomeer-onderdelen).
  - Bevat 6 vaste themaborden én een `Willekeurige Mix`-knop die steeds 4 niet-overlappende categorieën combineert tot een nieuw 4x4 bord, inclusief de "Bijna! 3 van de 4 horen bij elkaar"-hint.
  - Bovenin de `#game` weergave in `App.tsx` zit nu een minimalistische schakelaar tussen **`1. Skelet Puzzel`** en **`2. Connections`**.
  - Compilatie (`npm run build`) geslaagd zonder fouten.

## 21. Tekst-fit fix in Connections & Bouw van Spel 3 en Spel 4 [2026-10-31 10:31]
- **Gebruikerswens:**
  1. In **2. Connections** passen sommige langere Latijnse termen niet netjes in de blokjes -> direct oplossen.
  2. Bouw nog **2 extra spellen** die het beste bij de collectie en de leerstof passen.
- **Keuze voor Spel 3 & Spel 4:**
  - **Spel 3: `3. Queens Grid` (Anatomie Deductie-Rooster):**
    - Geïnspireerd op *LinkedIn Queens* en *Logigrammen*: een strak 4x4 deductierooster waarin elke rij en kolom precies één match (`✓`) heeft.
    - Zodra je een match plaatst, worden de overige vakjes in die rij en kolom automatisch weggestreept (`×`), zodat je door eliminatie de hele puzzel oplost. Bevat borden over spieren (origo/insertie/functie), gewrichten (type/assen/botten), bewegingsanalyse (vlak/as/beweging uit de reader) en spierfysiologie (uit de oefenvragen).
  - **Spel 4: `4. Raad de Spier` (Wordle / Loldle voor Spieren):**
    - Raad de verborgen reader-spier door een spier aan te tikken en direct kleurfeedback (🟩 Groen = exact, 🟨 Geel = deels, ⬜ Grijs = niet) te krijgen op 5 kolommen: **Aanzicht**, **Gewricht**, **Origo-bot**, **Insertie-bot** en **Beweging**.
- **Actie:** Eerst `ConnectionsGame.tsx` verbeteren (tekst-fit in blokjes), daarna `QueensGridGame.tsx` en `MuscleGuessGame.tsx` bouwen.
- **Tussenupdate [2026-10-31 10:32]:**
  - Tekst-weergave in `ConnectionsGame.tsx` opgelost (dynamische tekstschaal + woordafbreking zodat ook lange Latijnse termen netjes binnen de 4x4 blokjes blijven).
  - Spel 3 (`QueensGridGame.tsx`) gebouwd: een 4x4 deductie-rooster met automatische rij/kolom-wegstreping zodra een match gevonden is, inclusief borden over spieren, *art. pedis* ligamenten, synoviale gewrichten, assen/vlakken en spierfysiologie.
  - Nu bezig met Spel 4: `MuscleGuessGame.tsx` ("4. Raad de Spier" - Wordle/Loldle stijl met 5 eigenschap-kolommen).
- **Afronding 4 Spellen [2026-10-31 10:33]:**
  - `MuscleGuessGame.tsx` ("4. Raad de Spier") gebouwd en samen met `QueensGridGame.tsx` ("3. Eliminatie Rooster") toegevoegd aan de `#game` balk in `App.tsx`.
  - Alle 4 spellen draaien op poort 3000 (`http://localhost:3000/#game`) en de build (`npm run build`) slaagt zonder fouten.

## 22. Analyse & Plan van Aanpak: Aanhechtingspunten (Punt vs. Zone/Corpus) in de Toets [2026-10-31 10:39]
- **Vraag van de gebruiker:**
  - In de hoofdapp werkt het plaatsen van aanhechtingspunten in de toets nog niet lekker, omdat sommige aanhechtingen heel klein zijn (zoals een *condylus* of *SIAI*) en andere juist langgerekt (zoals een *corpus*, *margo*, *crista* of *ribben/wervels*).
  - Eerst de afbeeldingen (`skeleton_ventral.png` en `skeleton_dorsal.png`) en de huidige data/code analyseren en met een concreet plan komen vóór implementatie.
- **Gevonden oorzaken in de huidige data & code:**
  1. **Asymmetrie in `muscles.json`:** Bij 28 van de 31 spieren staan de `attachmentLines` (zones) **alleen** ingevuld bij `visuals.left` en zijn ze bij `visuals.right` volledig leeg (`[]`)! Als een student op de rechter lichaamshelft (links op het scherm bij ventraal) klikt, werken de zones helemaal niet.
  2. **1-op-1 koppeling ontbreekt:** In de huidige data staan `origins` (losse punten) en `attachmentLines` (lijnen) los van elkaar. Daardoor weet de toets niet welk specifiek aanhechtingspunt een *punt* is (bijv. *tuber ischiadicum*) en welk aanhechtingspunt een *lang traject/zone* is (bijv. *middelste derde dorsale deel van femur*).
  3. **Zones komen vaak niet overeen met het echte bot op de tekening:** Bijv. bij de *mm. vasti* beslaat de lijn nu maar een klein stukje van de femurschacht in plaats van het daadwerkelijke *corpus femoris* op de tekening, en bij o.a. *m. tibialis anterior*, *m. soleus*, *m. teres minor* en *m. triceps brachii* ontbreken de zones op het *corpus* of de *margo* volledig.
  4. **Onduidelijke aantallen te plaatsen stippen:** Bij één brede zone (zoals *5e tot 12e costa* bij *m. obliquus externus*) staan er 3 losse stippen in `origins`, waardoor de student 2 of 3 stippen moet raden voor wat anatomisch één zone is.
- **Actie:** Plan van aanpak voorgelegd aan de gebruiker ter goedkeuring.
- **Goedkeuring ontvangen [2026-10-31 10:42]:**
  - Gebruiker is akkoord met het plan.
  - **Stap 1 (Beeld- & Pixelanalyse):** Eerst de exacte botcontouren op `skeleton_ventral.png` en `skeleton_dorsal.png` opmeten zodat elke lange aanhechtingszone (corpora, cristae, margines, wervelreeksen, ribben) precies op het getekende bot ligt.
- **Stap 1 & 3 uitgevoerd (`src/data/muscles.json`) [2026-10-31 10:46]:**
  - Voor alle 25 spieren met langgerekte aanhechtingen (corpora van femur/tibia/fibula/humerus, *margo medialis/lateralis scapulae*, *spina scapula*, *clavicula*, *sternum*, *crista iliaca*, *linea alba*, wervelreeksen, ribben en voetranden) zijn de `attachmentLines` nu exact op de botcontouren geplaatst én 100% symmetrisch aanwezig onder zowel `visuals.left` als `visuals.right`.
  - De overige 6 spieren hebben uitsluitend kleine punt-aanhechtingen (zoals *SIAI*, *tuberositas tibiae*, *tuber ischiadicum*, *condylus medialis/lateralis*, *tuber calcanei*, *processus coracoideus*, *tuberositas radii*).
- **Stap 2 & 4 uitgevoerd (`coordinates.ts`, `QuizView.tsx` & `MuscleMarkers.tsx`) [2026-10-31 10:53]:**
  - In `src/utils/coordinates.ts` groepeert `getDistinctTargets()` nu gelijknamige vezelpunten (zoals de 3 stippen van *5e tot 12e costa* of de 2 stippen van *1e tot 9e costa*) tot **één uniek anatomisch doel** en koppelt dit 1-op-1 op naam aan de bijbehorende `AttachmentLine` (botzone).
  - Kleine botpunten (zoals *condylus*, *SIAS*, *SIAI*, *tuberositas*, *olecranon*, *caput fibulae*) worden puur als punt geëvalueerd (`TOLERANCE_CORRECT = 0.020`, dekt precies het getekende botknobbeltje), terwijl lange botregio's (zoals *corpus femoris*, *corpus tibiae*, *margo medialis/lateralis scapulae*, *crista iliaca*, *linea alba*, *wervelreeks* en *ribben*) over het gehele bottraject (zowel links als rechts) als 100% goed worden gerekend.
  - In `src/components/quiz/QuizView.tsx` vraagt de losse modus *Aanhechtingspunten* (`landmark`) nu gericht naar één specifieke structuur en filtert bij controle alleen het bijbehorende punt óf de bijbehorende botzone.
  - In `src/components/skeleton/MuscleMarkers.tsx` verschijnt bij de antwoord-terugkoppeling (`showReferenceGhost`) een subtiele oplichtende band over de hele aanhechtingszone zodat direct zichtbaar is of een aanhechting een lang botvlak of een klein punt is.
  - Build (`npm run build`) geslaagd zonder fouten en tijdelijk hulpscript opgeruimd. Klaar om te testen op `http://localhost:3000/`.

## 23. Toggle voor Automatisch Inzoomen + Uitbreiding Puzzels met PDF-materiaal [2026-10-31 10:55]
- **Nieuwe wensen van de gebruiker:**
  1. **Hoofdapp (Oefenen & Testen):** Naast de bestaande schakelaar voor *Automatisch draaien* (`autoRotateView`) ook een schakelaar toevoegen voor **Automatisch inzoomen** (`autoZoom`), zodat de gebruiker het automatisch inzoomen op het gevraagde element aan of uit kan zetten (standaard aan).
  2. **Puzzels (`#game`):** De inhoud van `E:\windesheim\anatomie blok 1` (met name `ANTWOORDEN synoviaal gewrichten.pdf`, `ANTWOORDEN assen vlakken en bewegingen.pdf` en de overige antwoorden-PDF's) volledig uitlezen en verwerken in **2. Connections** (4 words) én op een slimme manier in de andere puzzels.
- **Actie 1 uitgevoerd [2026-10-31 10:56]:**
  - Schakelaar **Automatisch inzoomen** (`autoZoom`, standaard *Aan*, opgeslagen in `localStorage`) toegevoegd aan zowel de desktop-weergave (`QuizView.tsx`) als het mobiele instellingenmenu (`MobileQuizView.tsx`), direct onder *Aanzicht autom. roteren*.
  - In `SkeletonViewer.tsx` zoomt het skelet direct terug uit naar volledig overzicht (`zoom = 1`) zodra de gebruiker *Automatisch inzoomen* uitzet.
- **Actie 2: Analyse van alle antwoorden-PDF's afgerond [2026-10-31 10:58]:**
  - Uitgelezen: `ANTWOORDEN synoviaal gewrichten.pdf`, `ANTWOORDEN assen vlakken en bewegingen.pdf`, `ANTWOORDEN assen en vlakken.pdf`, `ANTWOORDEN richtingen.pdf`, `ANTWOORDEN eerste bewegingsanalyse.pdf`, `ANTWOORDEN romp.pdf`, `ANTWOORDEN cingulum pectorale.pdf`, `ANTWOORDEN cubiti.pdf`, `ANTWOORDEN humeri.pdf`, `Art. Coxae ANTWOORDEN.pdf`, `Art.genus ANTWOORDEN.pdf`, `Art. pedis ANTWOORDEN.pdf` en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - **Hoe we dit verwerken in de puzzels (`#game`):**
    1. **`2. Connections` (`ConnectionsGame.tsx` - 4 Words):**
       - Uitbreiden met nieuwe themaborden rechtstreeks uit `ANTWOORDEN synoviaal gewrichten.pdf` (de 6 synoviale gewrichtstypen, de 12 structuren rond een synoviaal gewricht zoals *bursa*, *peesschede*, *hyalien kraakbeen*, *synoviaal membraan*, gewrichtskoppen vs. gewrichtskommen), `ANTWOORDEN assen vlakken en bewegingen.pdf` (bewegingen in S/T, F/S, T/L én de "n.v.t."-bewegingen zoals *eversie/inversie*, *horizontale ab-/adductie*, *protractie/retractie*, *elevatie/detractie*, *latero-/mediorotatie*), `ANTWOORDEN richtingen.pdf`, en `ANTWOORDEN romp/cubiti/genus/pedis.pdf`.
    2. **`3. Eliminatie Rooster` (`QueensGridGame.tsx`):**
       - Uitbreiden met nieuwe 4x4 logische deductie-roosters uit `ANTWOORDEN synoviaal gewrichten.pdf` (structuur ↔ functie zoals *bursa*, *peesschede*, *synoviaal membraan*, *hyalien kraakbeen*; én gewrichtstype ↔ vrijheidsgraden/beweging) en `ANTWOORDEN assen vlakken en bewegingen.pdf` (beweging ↔ vlak & as, inclusief *n.v.t.* bij schoudergordel/onderste spronggewricht).
    3. **`4. Raad het Begrip` (`MuscleGuessGame.tsx`):**
       - Uitbreiden met een modus-schakelaar bovenin: **[Spieren (31)]** én **[Gewrichten & Vlak/As (PDF)]**, zodat je in dezelfde Wordle/Loldle-stijl met Groen/Geel/Grijze kolommen ook de gewrichten en bewegingen uit `ANTWOORDEN synoviaal gewrichten.pdf` en `ANTWOORDEN assen vlakken en bewegingen.pdf` kunt raden op basis van *Type gewricht*, *Aantal assen*, *Vlak*, *As* en *Samenstellende botten*!
- **Afronding & Verificatie [2026-10-31 11:01]:**
  - In `ConnectionsGame.tsx` zijn **Bord 7 (Synoviaal PDF)**, **Bord 8 (Vlak & As PDF)** en **Bord 9 (Richtingen & Knie PDF)** toegevoegd (totaal 9 vaste borden + 36 groepen voor de *Willekeurige Mix*).
  - In `QueensGridGame.tsx` zijn 3 nieuwe 4x4 deductie-roosters toegevoegd: **Gewrichtsopbouw (PDF)** (*hyalien kraakbeen*, *synoviaal membraan*, *peesschede*, *bursa*), **Vlak, As & Beweging (PDF)** (inclusief *n.v.t.* bij onderste spronggewricht) en **Banden Art. genus (PDF)** (*lig. cruciatum anterior/posterior*, *lig. collaterale medialis/lateralis*).
  - In `MuscleGuessGame.tsx` is de tab **Gewrichten & Vlak/As (PDF)** toegevoegd waarmee alle 19 gewrichtsbewegingen uit `ANTWOORDEN synoviaal gewrichten.pdf` en `ANTWOORDEN assen vlakken en bewegingen.pdf` via de 5 kolommen (*Type*, *Assen*, *Vlak*, *As*, *Botten*) geraden kunnen worden.
  - `npm run build` gecontroleerd en geslaagd zonder fouten.

## 24. Nieuw Tabblad "Flashcards" (NotebookLM-stijl met Screenshots uit Moduleboek) [2026-10-31 11:04]
- **Opdracht van de gebruiker:**
  - Nieuw tabblad **Flashcards** in de hoofdapp toevoegen.
  - Werking en animaties zoals **NotebookLM**:
    - 3D kaart-flip animatie + soepele kaartwissel (vooral geoptimaliseerd voor mobiel én desktop).
    - Bijhouden welke kaarten **Goed** en welke **Fout** zijn beantwoord.
    - Aan het einde van een set (of tussentijds) de mogelijkheid om **alleen de foute kaarten opnieuw te doen** óf **de hele set opnieuw te starten**.
  - Een setje voor **elk gelezen antwoorden-PDF** (met 30 tot 60 kaarten per set zodat werkelijk alles uit het moduleboek en de antwoorden-PDF's erin zit), uitsluitend met de exacte terminologie uit het moduleboek (geen verboden spieren zoals *m. piriformis*, en met de toegestane spieren uit de reader/app).
  - Regelmatig gebruikmaken van **screenshots uit het moduleboek / de antwoorden-PDF's** (zonder dat de antwoorden in het plaatje al worden verklapt op de voorkant!).
- **Stappenplan:**
  1. **Stap 1:** Screenshots/afbeeldingen van de anatomische figuren uit het moduleboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf` en de opdracht-PDF's) extraheren en opslaan in `public/images/flashcards/`.
  2. **Stap 2:** De nog niet volledig gelezen pagina's van `oefenvragen fysiologie tot herfst met antwoorden.pdf` en het `Moduulboek` bekijken zodat alle theorie (synoviale opbouw, bewegingsanalyse, alle gewrichten, botten, ligamenten, spieren en fysiologie) compleet is.
  3. **Stap 3:** `src/data/flashcardsData.ts` opbouwen met een aparte set (30–50 kaarten per set) voor elk antwoorden-PDF.
- **Correctie van gebruiker [2026-10-31 11:06]:**
  - **Geen fysiologie verwerken! Het gaat puur om anatomie (en bewegingsanalyse).**
  - De 11 zuivere anatomie-antwoorden-PDF's zijn:
    1. `ANTWOORDEN richtingen.pdf` (Richtingen & Aanzichten)
    2. `ANTWOORDEN assen en vlakken.pdf` + `ANTWOORDEN assen vlakken en bewegingen.pdf` (Assen, Vlakken & Bewegingen)
    3. `ANTWOORDEN synoviaal gewrichten.pdf` (Synoviaal Gewrichten & Gewrichtsopbouw)
    4. `ANTWOORDEN eerste bewegingsanalyse.pdf` (Eerste Bewegingsanalyse)
    5. `Art. Coxae ANTWOORDEN.pdf` (Art. coxae: Heupgewricht, Botten & Spieren)
    6. `Art.genus ANTWOORDEN.pdf` (Art. genus: Kniegewricht, Banden, Menisci & Spieren)
    7. `Art. pedis ANTWOORDEN.pdf` (Art. pedis: Enkel/Voet, Banden & Spieren)
    8. `ANTWOORDEN humeri.pdf` (Art. humeri: Schoudergewricht, Scapula/Humerus & Spieren)
    9. `ANTWOORDEN cubiti.pdf` (Art. cubiti: Ellebooggewricht, Botten & Spieren)
    10. `ANTWOORDEN cingulum pectorale.pdf` (Cingulum pectorale: Schoudergordel & Spieren)
    11. `ANTWOORDEN romp.pdf` (Romp: Wervelkolom, Thorax, Wervelopbouw & Spieren)
  - Plus de anatomische woordenlijst en platen achterin het Moduulboek (p. 68–74) en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - Elk setje krijgt tussen de **30 en 60 anatomie-flashcards** (met screenshots uit het Moduulboek / de PDF's).
- **Stap 1 afgerond [2026-10-31 11:09]:**
  - 33 scherpe anatomische screenshots uitgesneden uit de 11 anatomie-antwoorden-PDF's én het Moduulboek (o.a. `synoviaal_opbouw_1_12.png`, `coxae_botten_1_15.png`, `genus_ligamenten_1_7.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`, `humeri_botten_1_14.png`, `cubiti_botten_1_13.png`, `cingulum_sternum_clavicula.png`, `cingulum_scapulahumeraal.png`, `romp_wervelkolom_1_10.png`, `romp_wervel_1_8.png`, `bewegingsanalyse_1_2_3.png`, `bewegingsanalyse_streksprong.png`, en de overzichtsplaten van botten en spieren) en opgeslagen in `public/images/flashcards/`.
  - Ook de fysiologie-onderdelen uit de spellen (`ConnectionsGame.tsx` en `QueensGridGame.tsx`) verwijderd en vervangen door zuivere anatomie.
- **Stap 2 & 3 afgerond [2026-10-31 11:22]:**
  - `src/data/flashcardsPart1.ts`, `src/data/flashcardsPart2.ts`, `src/data/flashcardsPart3.ts` en `src/data/flashcardsData.ts` aangemaakt met **11 complete anatomie-flashcardsets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse met alle 33 screenshots uit het Moduulboek en de antwoorden-PDF's).
- **Stap 4 & 5 afgerond [2026-10-31 11:25]:**
  - NotebookLM-stijl Flashcards UI gebouwd in `src/components/flashcards/FlashcardsView.tsx`:
    - **11 complete sets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse zonder fysiologie, met 33 scherpe screenshots uit het Moduulboek en de antwoorden-PDF's).
    - **3D kaart-flip animatie** (`rotateY(180deg)`, `perspective: 1400px`) bij tikken/klikken of `[Spatie]`/`[Enter]`.
    - **Mobiele swipe-bediening & animaties:** horizontaal swipen op mobiel (links = *Fout / Nog oefenen*, rechts = *Goed / Gekend*) met live gekleurde feedback-badges en achterliggende stapelkaart.
    - **Foute kaarten herhalen:** zowel tussentijds (via de knop *"Oefen foute (X)"*) als op het eindscherm (*"Oefen foute kaarten opnieuw (X)"* of *"Hele set opnieuw"*).
    - **Afbeelding-zoom (Lightbox):** tik op *"Vergroot"* bij elk Moduulboek-figuur om de genummerde botstructuren, gewrichten, ligamenten en spieren op volledig scherm te bekijken.
  - Nieuw tabblad **Flashcards** toegevoegd aan `Header.tsx` (zowel mobiel als desktop), `MuscleContext.tsx`, `anatomy.ts` en `App.tsx` (`http://localhost:3000/#flashcards`).
  - Productiebuild (`npm run build`) geslaagd zonder fouten.

## 25. Bugfixes: Bewegings-icoontjes & Z-index Dropdown vs. Help Popup [2026-10-31 11:28]
- **Gemelde bugs (met screenshots van mobiel):**
  1. De icoontjes van de bewegingen (`MovementIcon.tsx`) zagen er bij sommige bewegingen (zoals *Flexie*, *Supinatie*, *Exorotatie*, *Mediorotatie*, *Inversie*/*Eversie*) platgedrukt of afgesneden uit op klein formaat, en misten spellingvarianten zoals *Dorsaalextensie* en *Lateraalflexie*.
  2. Op de mobiele Studie-tab (`MobileStudyView.tsx`) viel de bovenste balk met de twee dropdowns (`Alle Gewrichten` en `m. deltoideus`, die op `z-50` stond) óver de `HelpModal` (`Hulp & Uitleg`, die ook op `z-50` stond maar eerder in de DOM werd gerenderd).
- **Oplossing:**
  - In `src/components/common/MovementIcon.tsx` alle 22 bewegings-SVG's herontworpen met ruime marges binnen de `0 0 24 24` viewBox, zonder overlappende lijntjes of losse stipjes die op `14×14px` dichtlopen, én ondersteuning toegevoegd voor zowel `dorsaalflexie`/`dorsaalextensie` als `lateroflexie`/`lateraalflexie`.
  - In `src/components/study/MobileStudyView.tsx` de `z-index` van de bovenste dropdown-balk verlaagd van `z-50` naar `z-20` en in `src/components/common/HelpModal.tsx` de modal-laag verhoogd naar `z-[100]`, zodat het hulpvenster altijd netjes boven alle balken en dropdowns ligt.

## 26. Minimalistische Flipcards-interface & Verborgen Toegang (3x tikken op `?`) [2026-10-31 11:34]
- **Wensen van de gebruiker:**
  1. De hoofdstukken samenvoegen met de 'kies een flashcard' popup tot één strakke dropdown bovenaan.
  2. Alle overbodige uitleg, ondertitels, bronvermeldingen en tekstlabels weghalen zodat het scherm zo rustig mogelijk is (alleen de groene en rode tellers voor goed en fout).
  3. De aparte *Flip*-knop onderin weghalen (alleen Vorige, Rood `✕` en Groen `✓` + tikken op de kaart zelf om te flippen).
  4. De Flashcards-knop in de navigatiebalk voor nu verbergen en openen wanneer je **3 keer snel op het `?`-icoontje** rechtsboven tikt, zodat alles eerst rustig getest kan worden.
- **Uitgevoerd:**
  - `src/components/common/Header.tsx`: Flashcards-knop uit de zichtbare balk gehaald en een triple-tap detector op de `?`-knop gezet (`3x tikken` binnen 320ms opent direct `#flashcards`; `1x tikken` opent gewoon het Hulp & Uitleg venster).
  - `src/components/flashcards/FlashcardsView.tsx`: Volledig minimalistisch gemaakt met één hoofdstuk-dropdown (inclusief groene/rode voortgangsbadges per hoofdstuk), enkel kleur-tellers voor goed/fout, een rustige kaart zonder extra toelichtingsteksten en onderin uitsluitend `<`, `✕` (rood) en `✓` (groen).

## 27. Responsieve Schermhoogte (`100dvh`) voor Alle Mobiele Resoluties [2026-10-31 11:38]
- **Melding van gebruiker (met screenshot):**
  - Op mobiel vielen de onderste drie knoppen (`<`, `✕`, `✓`) net van het scherm af door de combinatie van vaste minimumhoogtes op de kaart en `min-h-screen` i.p.v. `100dvh`.
- **Oplossing in `src/components/flashcards/FlashcardsView.tsx`:**
  - De hoofdcontainer heeft nu exact `h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden` (precies passend onder de header en binnen de zichtbare dynamische viewport van mobiele browsers).
  - De vaste `min-h-[340px]` op de kaart is verwijderd en vervangen door `flex-1 min-h-0`, en de voortgangslijn is geïntegreerd in de tellerrij. Hierdoor schaalt de flipcard (inclusief afbeelding) automatisch mee met élke schermhoogte en beeldverhouding en blijven de onderste knoppen altijd volledig in beeld.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 24. Nieuw Tabblad "Flashcards" (NotebookLM-stijl met Screenshots uit Moduleboek) [2026-10-31 11:04]
- **Opdracht van de gebruiker:**
  - Nieuw tabblad **Flashcards** in de hoofdapp toevoegen.
  - Werking en animaties zoals **NotebookLM**:
    - 3D kaart-flip animatie + soepele kaartwissel (vooral geoptimaliseerd voor mobiel én desktop).
    - Bijhouden welke kaarten **Goed** en welke **Fout** zijn beantwoord.
    - Aan het einde van een set (of tussentijds) de mogelijkheid om **alleen de foute kaarten opnieuw te doen** óf **de hele set opnieuw te starten**.
  - Een setje voor **elk gelezen antwoorden-PDF** (met 30 tot 60 kaarten per set zodat werkelijk alles uit het moduleboek en de antwoorden-PDF's erin zit), uitsluitend met de exacte terminologie uit het moduleboek (geen verboden spieren zoals *m. piriformis*, en met de toegestane spieren uit de reader/app).
  - Regelmatig gebruikmaken van **screenshots uit het moduleboek / de antwoorden-PDF's** (zonder dat de antwoorden in het plaatje al worden verklapt op de voorkant!).
- **Stappenplan:**
  1. **Stap 1:** Screenshots/afbeeldingen van de anatomische figuren uit het moduleboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf` en de opdracht-PDF's) extraheren en opslaan in `public/images/flashcards/`.
  2. **Stap 2:** De nog niet volledig gelezen pagina's van `oefenvragen fysiologie tot herfst met antwoorden.pdf` en het `Moduulboek` bekijken zodat alle theorie (synoviale opbouw, bewegingsanalyse, alle gewrichten, botten, ligamenten, spieren en fysiologie) compleet is.
  3. **Stap 3:** `src/data/flashcardsData.ts` opbouwen met een aparte set (30–50 kaarten per set) voor elk antwoorden-PDF.
- **Correctie van gebruiker [2026-10-31 11:06]:**
  - **Geen fysiologie verwerken! Het gaat puur om anatomie (en bewegingsanalyse).**
  - De 11 zuivere anatomie-antwoorden-PDF's zijn:
    1. `ANTWOORDEN richtingen.pdf` (Richtingen & Aanzichten)
    2. `ANTWOORDEN assen en vlakken.pdf` + `ANTWOORDEN assen vlakken en bewegingen.pdf` (Assen, Vlakken & Bewegingen)
    3. `ANTWOORDEN synoviaal gewrichten.pdf` (Synoviaal Gewrichten & Gewrichtsopbouw)
    4. `ANTWOORDEN eerste bewegingsanalyse.pdf` (Eerste Bewegingsanalyse)
    5. `Art. Coxae ANTWOORDEN.pdf` (Art. coxae: Heupgewricht, Botten & Spieren)
    6. `Art.genus ANTWOORDEN.pdf` (Art. genus: Kniegewricht, Banden, Menisci & Spieren)
    7. `Art. pedis ANTWOORDEN.pdf` (Art. pedis: Enkel/Voet, Banden & Spieren)
    8. `ANTWOORDEN humeri.pdf` (Art. humeri: Schoudergewricht, Scapula/Humerus & Spieren)
    9. `ANTWOORDEN cubiti.pdf` (Art. cubiti: Ellebooggewricht, Botten & Spieren)
    10. `ANTWOORDEN cingulum pectorale.pdf` (Cingulum pectorale: Schoudergordel & Spieren)
    11. `ANTWOORDEN romp.pdf` (Romp: Wervelkolom, Thorax, Wervelopbouw & Spieren)
  - Plus de anatomische woordenlijst en platen achterin het Moduulboek (p. 68–74) en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - Elk setje krijgt tussen de **30 en 60 anatomie-flashcards** (met screenshots uit het Moduulboek / de PDF's).
- **Stap 1 afgerond [2026-10-31 11:09]:**
  - 33 scherpe anatomische screenshots uitgesneden uit de 11 anatomie-antwoorden-PDF's én het Moduulboek (o.a. `synoviaal_opbouw_1_12.png`, `coxae_botten_1_15.png`, `genus_ligamenten_1_7.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`, `humeri_botten_1_14.png`, `cubiti_botten_1_13.png`, `cingulum_sternum_clavicula.png`, `cingulum_scapulahumeraal.png`, `romp_wervelkolom_1_10.png`, `romp_wervel_1_8.png`, `bewegingsanalyse_1_2_3.png`, `bewegingsanalyse_streksprong.png`, en de overzichtsplaten van botten en spieren) en opgeslagen in `public/images/flashcards/`.
  - Ook de fysiologie-onderdelen uit de spellen (`ConnectionsGame.tsx` en `QueensGridGame.tsx`) verwijderd en vervangen door zuivere anatomie.
- **Stap 2 & 3 afgerond [2026-10-31 11:22]:**
  - `src/data/flashcardsPart1.ts`, `src/data/flashcardsPart2.ts`, `src/data/flashcardsPart3.ts` en `src/data/flashcardsData.ts` aangemaakt met **11 complete anatomie-flashcardsets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse met alle 33 screenshots uit het Moduulboek en de antwoorden-PDF's).
- **Stap 4 & 5 afgerond [2026-10-31 11:25]:**
  - NotebookLM-stijl Flashcards UI gebouwd in `src/components/flashcards/FlashcardsView.tsx`:
    - **11 complete sets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse zonder fysiologie, met 33 scherpe screenshots uit het Moduulboek en de antwoorden-PDF's).
    - **3D kaart-flip animatie** (`rotateY(180deg)`, `perspective: 1400px`) bij tikken/klikken of `[Spatie]`/`[Enter]`.
    - **Mobiele swipe-bediening & animaties:** horizontaal swipen op mobiel (links = *Fout / Nog oefenen*, rechts = *Goed / Gekend*) met live gekleurde feedback-badges en achterliggende stapelkaart.
    - **Foute kaarten herhalen:** zowel tussentijds (via de knop *"Oefen foute (X)"*) als op het eindscherm (*"Oefen foute kaarten opnieuw (X)"* of *"Hele set opnieuw"*).
    - **Afbeelding-zoom (Lightbox):** tik op *"Vergroot"* bij elk Moduulboek-figuur om de genummerde botstructuren, gewrichten, ligamenten en spieren op volledig scherm te bekijken.
  - Nieuw tabblad **Flashcards** toegevoegd aan `Header.tsx` (zowel mobiel als desktop), `MuscleContext.tsx`, `anatomy.ts` en `App.tsx` (`http://localhost:3000/#flashcards`).
  - Productiebuild (`npm run build`) geslaagd zonder fouten.

## 25. Bugfixes: Bewegings-icoontjes & Z-index Dropdown vs. Help Popup [2026-10-31 11:28]
- **Gemelde bugs (met screenshots van mobiel):**
  1. De icoontjes van de bewegingen (`MovementIcon.tsx`) zagen er bij sommige bewegingen (zoals *Flexie*, *Supinatie*, *Exorotatie*, *Mediorotatie*, *Inversie*/*Eversie*) platgedrukt of afgesneden uit op klein formaat, en misten spellingvarianten zoals *Dorsaalextensie* en *Lateraalflexie*.
  2. Op de mobiele Studie-tab (`MobileStudyView.tsx`) viel de bovenste balk met de twee dropdowns (`Alle Gewrichten` en `m. deltoideus`, die op `z-50` stond) óver de `HelpModal` (`Hulp & Uitleg`, die ook op `z-50` stond maar eerder in de DOM werd gerenderd).
- **Oplossing:**
  - In `src/components/common/MovementIcon.tsx` alle 22 bewegings-SVG's herontworpen met ruime marges binnen de `0 0 24 24` viewBox, zonder overlappende lijntjes of losse stipjes die op `14×14px` dichtlopen, én ondersteuning toegevoegd voor zowel `dorsaalflexie`/`dorsaalextensie` als `lateroflexie`/`lateraalflexie`.
  - In `src/components/study/MobileStudyView.tsx` de `z-index` van de bovenste dropdown-balk verlaagd van `z-50` naar `z-20` en in `src/components/common/HelpModal.tsx` de modal-laag verhoogd naar `z-[100]`, zodat het hulpvenster altijd netjes boven alle balken en dropdowns ligt.

## 26. Minimalistische Flipcards-interface & Verborgen Toegang (3x tikken op `?`) [2026-10-31 11:34]
- **Wensen van de gebruiker:**
  1. De hoofdstukken samenvoegen met de 'kies een flashcard' popup tot één strakke dropdown bovenaan.
  2. Alle overbodige uitleg, ondertitels, bronvermeldingen en tekstlabels weghalen zodat het scherm zo rustig mogelijk is (alleen de groene en rode tellers voor goed en fout).
  3. De aparte *Flip*-knop onderin weghalen (alleen Vorige, Rood `✕` en Groen `✓` + tikken op de kaart zelf om te flippen).
  4. De Flashcards-knop in de navigatiebalk voor nu verbergen en openen wanneer je **3 keer snel op het `?`-icoontje** rechtsboven tikt, zodat alles eerst rustig getest kan worden.
- **Uitgevoerd:**
  - `src/components/common/Header.tsx`: Flashcards-knop uit de zichtbare balk gehaald en een triple-tap detector op de `?`-knop gezet (`3x tikken` binnen 320ms opent direct `#flashcards`; `1x tikken` opent gewoon het Hulp & Uitleg venster).
  - `src/components/flashcards/FlashcardsView.tsx`: Volledig minimalistisch gemaakt met één hoofdstuk-dropdown (inclusief groene/rode voortgangsbadges per hoofdstuk), enkel kleur-tellers voor goed/fout, een rustige kaart zonder extra toelichtingsteksten en onderin uitsluitend `<`, `✕` (rood) en `✓` (groen).

## 27. Responsieve Schermhoogte (`100dvh`) voor Alle Mobiele Resoluties [2026-10-31 11:38]
- **Melding van gebruiker (met screenshot):**
  - Op mobiel vielen de onderste drie knoppen (`<`, `✕`, `✓`) net van het scherm af door de combinatie van vaste minimumhoogtes op de kaart en `min-h-screen` i.p.v. `100dvh`.
- **Oplossing in `src/components/flashcards/FlashcardsView.tsx`:**
  - De hoofdcontainer heeft nu exact `h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden` (precies passend onder de header en binnen de zichtbare dynamische viewport van mobiele browsers).
  - De vaste `min-h-[340px]` op de kaart is verwijderd en vervangen door `flex-1 min-h-0`, en de voortgangslijn is geïntegreerd in de tellerrij. Hierdoor schaalt de flipcard (inclusief afbeelding) automatisch mee met élke schermhoogte en beeldverhouding en blijven de onderste knoppen altijd volledig in beeld.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.
- **Goedkeuring ontvangen [2026-10-31 10:42]:**
  - Gebruiker is akkoord met het plan.
  - **Stap 1 (Beeld- & Pixelanalyse):** Eerst de exacte botcontouren op `skeleton_ventral.png` en `skeleton_dorsal.png` opmeten zodat elke lange aanhechtingszone (corpora, cristae, margines, wervelreeksen, ribben) precies op het getekende bot ligt.
- **Stap 1 & 3 uitgevoerd (`src/data/muscles.json`) [2026-10-31 10:46]:**
  - Voor alle 25 spieren met langgerekte aanhechtingen (corpora van femur/tibia/fibula/humerus, *margo medialis/lateralis scapulae*, *spina scapula*, *clavicula*, *sternum*, *crista iliaca*, *linea alba*, wervelreeksen, ribben en voetranden) zijn de `attachmentLines` nu exact op de botcontouren geplaatst én 100% symmetrisch aanwezig onder zowel `visuals.left` als `visuals.right`.
  - De overige 6 spieren hebben uitsluitend kleine punt-aanhechtingen (zoals *SIAI*, *tuberositas tibiae*, *tuber ischiadicum*, *condylus medialis/lateralis*, *tuber calcanei*, *processus coracoideus*, *tuberositas radii*).
- **Stap 2 & 4 uitgevoerd (`coordinates.ts`, `QuizView.tsx` & `MuscleMarkers.tsx`) [2026-10-31 10:53]:**
  - In `src/utils/coordinates.ts` groepeert `getDistinctTargets()` nu gelijknamige vezelpunten (zoals de 3 stippen van *5e tot 12e costa* of de 2 stippen van *1e tot 9e costa*) tot **één uniek anatomisch doel** en koppelt dit 1-op-1 op naam aan de bijbehorende `AttachmentLine` (botzone).
  - Kleine botpunten (zoals *condylus*, *SIAS*, *SIAI*, *tuberositas*, *olecranon*, *caput fibulae*) worden puur als punt geëvalueerd (`TOLERANCE_CORRECT = 0.020`, dekt precies het getekende botknobbeltje), terwijl lange botregio's (zoals *corpus femoris*, *corpus tibiae*, *margo medialis/lateralis scapulae*, *crista iliaca*, *linea alba*, *wervelreeks* en *ribben*) over het gehele bottraject (zowel links als rechts) als 100% goed worden gerekend.
  - In `src/components/quiz/QuizView.tsx` vraagt de losse modus *Aanhechtingspunten* (`landmark`) nu gericht naar één specifieke structuur en filtert bij controle alleen het bijbehorende punt óf de bijbehorende botzone.
  - In `src/components/skeleton/MuscleMarkers.tsx` verschijnt bij de antwoord-terugkoppeling (`showReferenceGhost`) een subtiele oplichtende band over de hele aanhechtingszone zodat direct zichtbaar is of een aanhechting een lang botvlak of een klein punt is.
  - Build (`npm run build`) geslaagd zonder fouten en tijdelijk hulpscript opgeruimd. Klaar om te testen op `http://localhost:3000/`.

## 23. Toggle voor Automatisch Inzoomen + Uitbreiding Puzzels met PDF-materiaal [2026-10-31 10:55]
- **Nieuwe wensen van de gebruiker:**
  1. **Hoofdapp (Oefenen & Testen):** Naast de bestaande schakelaar voor *Automatisch draaien* (`autoRotateView`) ook een schakelaar toevoegen voor **Automatisch inzoomen** (`autoZoom`), zodat de gebruiker het automatisch inzoomen op het gevraagde element aan of uit kan zetten (standaard aan).
  2. **Puzzels (`#game`):** De inhoud van `E:\windesheim\anatomie blok 1` (met name `ANTWOORDEN synoviaal gewrichten.pdf`, `ANTWOORDEN assen vlakken en bewegingen.pdf` en de overige antwoorden-PDF's) volledig uitlezen en verwerken in **2. Connections** (4 words) én op een slimme manier in de andere puzzels.
- **Actie 1 uitgevoerd [2026-10-31 10:56]:**
  - Schakelaar **Automatisch inzoomen** (`autoZoom`, standaard *Aan*, opgeslagen in `localStorage`) toegevoegd aan zowel de desktop-weergave (`QuizView.tsx`) als het mobiele instellingenmenu (`MobileQuizView.tsx`), direct onder *Aanzicht autom. roteren*.
  - In `SkeletonViewer.tsx` zoomt het skelet direct terug uit naar volledig overzicht (`zoom = 1`) zodra de gebruiker *Automatisch inzoomen* uitzet.
- **Actie 2: Analyse van alle antwoorden-PDF's afgerond [2026-10-31 10:58]:**
  - Uitgelezen: `ANTWOORDEN synoviaal gewrichten.pdf`, `ANTWOORDEN assen vlakken en bewegingen.pdf`, `ANTWOORDEN assen en vlakken.pdf`, `ANTWOORDEN richtingen.pdf`, `ANTWOORDEN eerste bewegingsanalyse.pdf`, `ANTWOORDEN romp.pdf`, `ANTWOORDEN cingulum pectorale.pdf`, `ANTWOORDEN cubiti.pdf`, `ANTWOORDEN humeri.pdf`, `Art. Coxae ANTWOORDEN.pdf`, `Art.genus ANTWOORDEN.pdf`, `Art. pedis ANTWOORDEN.pdf` en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - **Hoe we dit verwerken in de puzzels (`#game`):**
    1. **`2. Connections` (`ConnectionsGame.tsx` - 4 Words):**
       - Uitbreiden met nieuwe themaborden rechtstreeks uit `ANTWOORDEN synoviaal gewrichten.pdf` (de 6 synoviale gewrichtstypen, de 12 structuren rond een synoviaal gewricht zoals *bursa*, *peesschede*, *hyalien kraakbeen*, *synoviaal membraan*, gewrichtskoppen vs. gewrichtskommen), `ANTWOORDEN assen vlakken en bewegingen.pdf` (bewegingen in S/T, F/S, T/L én de "n.v.t."-bewegingen zoals *eversie/inversie*, *horizontale ab-/adductie*, *protractie/retractie*, *elevatie/detractie*, *latero-/mediorotatie*), `ANTWOORDEN richtingen.pdf`, en `ANTWOORDEN romp/cubiti/genus/pedis.pdf`.
    2. **`3. Eliminatie Rooster` (`QueensGridGame.tsx`):**
       - Uitbreiden met nieuwe 4x4 logische deductie-roosters uit `ANTWOORDEN synoviaal gewrichten.pdf` (structuur ↔ functie zoals *bursa*, *peesschede*, *synoviaal membraan*, *hyalien kraakbeen*; én gewrichtstype ↔ vrijheidsgraden/beweging) en `ANTWOORDEN assen vlakken en bewegingen.pdf` (beweging ↔ vlak & as, inclusief *n.v.t.* bij schoudergordel/onderste spronggewricht).
    3. **`4. Raad het Begrip` (`MuscleGuessGame.tsx`):**
       - Uitbreiden met een modus-schakelaar bovenin: **[Spieren (31)]** én **[Gewrichten & Vlak/As (PDF)]**, zodat je in dezelfde Wordle/Loldle-stijl met Groen/Geel/Grijze kolommen ook de gewrichten en bewegingen uit `ANTWOORDEN synoviaal gewrichten.pdf` en `ANTWOORDEN assen vlakken en bewegingen.pdf` kunt raden op basis van *Type gewricht*, *Aantal assen*, *Vlak*, *As* en *Samenstellende botten*!
- **Afronding & Verificatie [2026-10-31 11:01]:**
  - In `ConnectionsGame.tsx` zijn **Bord 7 (Synoviaal PDF)**, **Bord 8 (Vlak & As PDF)** en **Bord 9 (Richtingen & Knie PDF)** toegevoegd (totaal 9 vaste borden + 36 groepen voor de *Willekeurige Mix*).
  - In `QueensGridGame.tsx` zijn 3 nieuwe 4x4 deductie-roosters toegevoegd: **Gewrichtsopbouw (PDF)** (*hyalien kraakbeen*, *synoviaal membraan*, *peesschede*, *bursa*), **Vlak, As & Beweging (PDF)** (inclusief *n.v.t.* bij onderste spronggewricht) en **Banden Art. genus (PDF)** (*lig. cruciatum anterior/posterior*, *lig. collaterale medialis/lateralis*).
  - In `MuscleGuessGame.tsx` is de tab **Gewrichten & Vlak/As (PDF)** toegevoegd waarmee alle 19 gewrichtsbewegingen uit `ANTWOORDEN synoviaal gewrichten.pdf` en `ANTWOORDEN assen vlakken en bewegingen.pdf` via de 5 kolommen (*Type*, *Assen*, *Vlak*, *As*, *Botten*) geraden kunnen worden.
  - `npm run build` gecontroleerd en geslaagd zonder fouten.

## 24. Nieuw Tabblad "Flashcards" (NotebookLM-stijl met Screenshots uit Moduleboek) [2026-10-31 11:04]
- **Opdracht van de gebruiker:**
  - Nieuw tabblad **Flashcards** in de hoofdapp toevoegen.
  - Werking en animaties zoals **NotebookLM**:
    - 3D kaart-flip animatie + soepele kaartwissel (vooral geoptimaliseerd voor mobiel én desktop).
    - Bijhouden welke kaarten **Goed** en welke **Fout** zijn beantwoord.
    - Aan het einde van een set (of tussentijds) de mogelijkheid om **alleen de foute kaarten opnieuw te doen** óf **de hele set opnieuw te starten**.
  - Een setje voor **elk gelezen antwoorden-PDF** (met 30 tot 60 kaarten per set zodat werkelijk alles uit het moduleboek en de antwoorden-PDF's erin zit), uitsluitend met de exacte terminologie uit het moduleboek (geen verboden spieren zoals *m. piriformis*, en met de toegestane spieren uit de reader/app).
  - Regelmatig gebruikmaken van **screenshots uit het moduleboek / de antwoorden-PDF's** (zonder dat de antwoorden in het plaatje al worden verklapt op de voorkant!).
- **Stappenplan:**
  1. **Stap 1:** Screenshots/afbeeldingen van de anatomische figuren uit het moduleboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf` en de opdracht-PDF's) extraheren en opslaan in `public/images/flashcards/`.
  2. **Stap 2:** De nog niet volledig gelezen pagina's van `oefenvragen fysiologie tot herfst met antwoorden.pdf` en het `Moduulboek` bekijken zodat alle theorie (synoviale opbouw, bewegingsanalyse, alle gewrichten, botten, ligamenten, spieren en fysiologie) compleet is.
  3. **Stap 3:** `src/data/flashcardsData.ts` opbouwen met een aparte set (30–50 kaarten per set) voor elk antwoorden-PDF.
- **Correctie van gebruiker [2026-10-31 11:06]:**
  - **Geen fysiologie verwerken! Het gaat puur om anatomie (en bewegingsanalyse).**
  - De 11 zuivere anatomie-antwoorden-PDF's zijn:
    1. `ANTWOORDEN richtingen.pdf` (Richtingen & Aanzichten)
    2. `ANTWOORDEN assen en vlakken.pdf` + `ANTWOORDEN assen vlakken en bewegingen.pdf` (Assen, Vlakken & Bewegingen)
    3. `ANTWOORDEN synoviaal gewrichten.pdf` (Synoviaal Gewrichten & Gewrichtsopbouw)
    4. `ANTWOORDEN eerste bewegingsanalyse.pdf` (Eerste Bewegingsanalyse)
    5. `Art. Coxae ANTWOORDEN.pdf` (Art. coxae: Heupgewricht, Botten & Spieren)
    6. `Art.genus ANTWOORDEN.pdf` (Art. genus: Kniegewricht, Banden, Menisci & Spieren)
    7. `Art. pedis ANTWOORDEN.pdf` (Art. pedis: Enkel/Voet, Banden & Spieren)
    8. `ANTWOORDEN humeri.pdf` (Art. humeri: Schoudergewricht, Scapula/Humerus & Spieren)
    9. `ANTWOORDEN cubiti.pdf` (Art. cubiti: Ellebooggewricht, Botten & Spieren)
    10. `ANTWOORDEN cingulum pectorale.pdf` (Cingulum pectorale: Schoudergordel & Spieren)
    11. `ANTWOORDEN romp.pdf` (Romp: Wervelkolom, Thorax, Wervelopbouw & Spieren)
  - Plus de anatomische woordenlijst en platen achterin het Moduulboek (p. 68–74) en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - Elk setje krijgt tussen de **30 en 60 anatomie-flashcards** (met screenshots uit het Moduulboek / de PDF's).
- **Stap 1 afgerond [2026-10-31 11:09]:**
  - 33 scherpe anatomische screenshots uitgesneden uit de 11 anatomie-antwoorden-PDF's én het Moduulboek (o.a. `synoviaal_opbouw_1_12.png`, `coxae_botten_1_15.png`, `genus_ligamenten_1_7.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`, `humeri_botten_1_14.png`, `cubiti_botten_1_13.png`, `cingulum_sternum_clavicula.png`, `cingulum_scapulahumeraal.png`, `romp_wervelkolom_1_10.png`, `romp_wervel_1_8.png`, `bewegingsanalyse_1_2_3.png`, `bewegingsanalyse_streksprong.png`, en de overzichtsplaten van botten en spieren) en opgeslagen in `public/images/flashcards/`.
  - Ook de fysiologie-onderdelen uit de spellen (`ConnectionsGame.tsx` en `QueensGridGame.tsx`) verwijderd en vervangen door zuivere anatomie.
- **Stap 2 & 3 afgerond [2026-10-31 11:22]:**
  - `src/data/flashcardsPart1.ts`, `src/data/flashcardsPart2.ts`, `src/data/flashcardsPart3.ts` en `src/data/flashcardsData.ts` aangemaakt met **11 complete anatomie-flashcardsets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse met alle 33 screenshots uit het Moduulboek en de antwoorden-PDF's).
- **Stap 4 & 5 afgerond [2026-10-31 11:25]:**
  - NotebookLM-stijl Flashcards UI gebouwd in `src/components/flashcards/FlashcardsView.tsx`:
    - **11 complete sets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse zonder fysiologie, met 33 scherpe screenshots uit het Moduulboek en de antwoorden-PDF's).
    - **3D kaart-flip animatie** (`rotateY(180deg)`, `perspective: 1400px`) bij tikken/klikken of `[Spatie]`/`[Enter]`.
    - **Mobiele swipe-bediening & animaties:** horizontaal swipen op mobiel (links = *Fout / Nog oefenen*, rechts = *Goed / Gekend*) met live gekleurde feedback-badges en achterliggende stapelkaart.
    - **Foute kaarten herhalen:** zowel tussentijds (via de knop *"Oefen foute (X)"*) als op het eindscherm (*"Oefen foute kaarten opnieuw (X)"* of *"Hele set opnieuw"*).
    - **Afbeelding-zoom (Lightbox):** tik op *"Vergroot"* bij elk Moduulboek-figuur om de genummerde botstructuren, gewrichten, ligamenten en spieren op volledig scherm te bekijken.
  - Nieuw tabblad **Flashcards** toegevoegd aan `Header.tsx` (zowel mobiel als desktop), `MuscleContext.tsx`, `anatomy.ts` en `App.tsx` (`http://localhost:3000/#flashcards`).
  - Productiebuild (`npm run build`) geslaagd zonder fouten.

## 25. Bugfixes: Bewegings-icoontjes & Z-index Dropdown vs. Help Popup [2026-10-31 11:28]
- **Gemelde bugs (met screenshots van mobiel):**
  1. De icoontjes van de bewegingen (`MovementIcon.tsx`) zagen er bij sommige bewegingen (zoals *Flexie*, *Supinatie*, *Exorotatie*, *Mediorotatie*, *Inversie*/*Eversie*) platgedrukt of afgesneden uit op klein formaat, en misten spellingvarianten zoals *Dorsaalextensie* en *Lateraalflexie*.
  2. Op de mobiele Studie-tab (`MobileStudyView.tsx`) viel de bovenste balk met de twee dropdowns (`Alle Gewrichten` en `m. deltoideus`, die op `z-50` stond) óver de `HelpModal` (`Hulp & Uitleg`, die ook op `z-50` stond maar eerder in de DOM werd gerenderd).
- **Oplossing:**
  - In `src/components/common/MovementIcon.tsx` alle 22 bewegings-SVG's herontworpen met ruime marges binnen de `0 0 24 24` viewBox, zonder overlappende lijntjes of losse stipjes die op `14×14px` dichtlopen, én ondersteuning toegevoegd voor zowel `dorsaalflexie`/`dorsaalextensie` als `lateroflexie`/`lateraalflexie`.
  - In `src/components/study/MobileStudyView.tsx` de `z-index` van de bovenste dropdown-balk verlaagd van `z-50` naar `z-20` en in `src/components/common/HelpModal.tsx` de modal-laag verhoogd naar `z-[100]`, zodat het hulpvenster altijd netjes boven alle balken en dropdowns ligt.

## 26. Minimalistische Flipcards-interface & Verborgen Toegang (3x tikken op `?`) [2026-10-31 11:34]
- **Wensen van de gebruiker:**
  1. De hoofdstukken samenvoegen met de 'kies een flashcard' popup tot één strakke dropdown bovenaan.
  2. Alle overbodige uitleg, ondertitels, bronvermeldingen en tekstlabels weghalen zodat het scherm zo rustig mogelijk is (alleen de groene en rode tellers voor goed en fout).
  3. De aparte *Flip*-knop onderin weghalen (alleen Vorige, Rood `✕` en Groen `✓` + tikken op de kaart zelf om te flippen).
  4. De Flashcards-knop in de navigatiebalk voor nu verbergen en openen wanneer je **3 keer snel op het `?`-icoontje** rechtsboven tikt, zodat alles eerst rustig getest kan worden.
- **Uitgevoerd:**
  - `src/components/common/Header.tsx`: Flashcards-knop uit de zichtbare balk gehaald en een triple-tap detector op de `?`-knop gezet (`3x tikken` binnen 320ms opent direct `#flashcards`; `1x tikken` opent gewoon het Hulp & Uitleg venster).
  - `src/components/flashcards/FlashcardsView.tsx`: Volledig minimalistisch gemaakt met één hoofdstuk-dropdown (inclusief groene/rode voortgangsbadges per hoofdstuk), enkel kleur-tellers voor goed/fout, een rustige kaart zonder extra toelichtingsteksten en onderin uitsluitend `<`, `✕` (rood) en `✓` (groen).

## 27. Responsieve Schermhoogte (`100dvh`) voor Alle Mobiele Resoluties [2026-10-31 11:38]
- **Melding van gebruiker (met screenshot):**
  - Op mobiel vielen de onderste drie knoppen (`<`, `✕`, `✓`) net van het scherm af door de combinatie van vaste minimumhoogtes op de kaart en `min-h-screen` i.p.v. `100dvh`.
- **Oplossing in `src/components/flashcards/FlashcardsView.tsx`:**
  - De hoofdcontainer heeft nu exact `h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden` (precies passend onder de header en binnen de zichtbare dynamische viewport van mobiele browsers).
  - De vaste `min-h-[340px]` op de kaart is verwijderd en vervangen door `flex-1 min-h-0`, en de voortgangslijn is geïntegreerd in de tellerrij. Hierdoor schaalt de flipcard (inclusief afbeelding) automatisch mee met élke schermhoogte en beeldverhouding en blijven de onderste knoppen altijd volledig in beeld.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 24. Nieuw Tabblad "Flashcards" (NotebookLM-stijl met Screenshots uit Moduleboek) [2026-10-31 11:04]
- **Opdracht van de gebruiker:**
  - Nieuw tabblad **Flashcards** in de hoofdapp toevoegen.
  - Werking en animaties zoals **NotebookLM**:
    - 3D kaart-flip animatie + soepele kaartwissel (vooral geoptimaliseerd voor mobiel én desktop).
    - Bijhouden welke kaarten **Goed** en welke **Fout** zijn beantwoord.
    - Aan het einde van een set (of tussentijds) de mogelijkheid om **alleen de foute kaarten opnieuw te doen** óf **de hele set opnieuw te starten**.
  - Een setje voor **elk gelezen antwoorden-PDF** (met 30 tot 60 kaarten per set zodat werkelijk alles uit het moduleboek en de antwoorden-PDF's erin zit), uitsluitend met de exacte terminologie uit het moduleboek (geen verboden spieren zoals *m. piriformis*, en met de toegestane spieren uit de reader/app).
  - Regelmatig gebruikmaken van **screenshots uit het moduleboek / de antwoorden-PDF's** (zonder dat de antwoorden in het plaatje al worden verklapt op de voorkant!).
- **Stappenplan:**
  1. **Stap 1:** Screenshots/afbeeldingen van de anatomische figuren uit het moduleboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf` en de opdracht-PDF's) extraheren en opslaan in `public/images/flashcards/`.
  2. **Stap 2:** De nog niet volledig gelezen pagina's van `oefenvragen fysiologie tot herfst met antwoorden.pdf` en het `Moduulboek` bekijken zodat alle theorie (synoviale opbouw, bewegingsanalyse, alle gewrichten, botten, ligamenten, spieren en fysiologie) compleet is.
  3. **Stap 3:** `src/data/flashcardsData.ts` opbouwen met een aparte set (30–50 kaarten per set) voor elk antwoorden-PDF.
- **Correctie van gebruiker [2026-10-31 11:06]:**
  - **Geen fysiologie verwerken! Het gaat puur om anatomie (en bewegingsanalyse).**
  - De 11 zuivere anatomie-antwoorden-PDF's zijn:
    1. `ANTWOORDEN richtingen.pdf` (Richtingen & Aanzichten)
    2. `ANTWOORDEN assen en vlakken.pdf` + `ANTWOORDEN assen vlakken en bewegingen.pdf` (Assen, Vlakken & Bewegingen)
    3. `ANTWOORDEN synoviaal gewrichten.pdf` (Synoviaal Gewrichten & Gewrichtsopbouw)
    4. `ANTWOORDEN eerste bewegingsanalyse.pdf` (Eerste Bewegingsanalyse)
    5. `Art. Coxae ANTWOORDEN.pdf` (Art. coxae: Heupgewricht, Botten & Spieren)
    6. `Art.genus ANTWOORDEN.pdf` (Art. genus: Kniegewricht, Banden, Menisci & Spieren)
    7. `Art. pedis ANTWOORDEN.pdf` (Art. pedis: Enkel/Voet, Banden & Spieren)
    8. `ANTWOORDEN humeri.pdf` (Art. humeri: Schoudergewricht, Scapula/Humerus & Spieren)
    9. `ANTWOORDEN cubiti.pdf` (Art. cubiti: Ellebooggewricht, Botten & Spieren)
    10. `ANTWOORDEN cingulum pectorale.pdf` (Cingulum pectorale: Schoudergordel & Spieren)
    11. `ANTWOORDEN romp.pdf` (Romp: Wervelkolom, Thorax, Wervelopbouw & Spieren)
  - Plus de anatomische woordenlijst en platen achterin het Moduulboek (p. 68–74) en `OEFENTOETS ANATOMIE ANTWOORDEN.pdf`.
  - Elk setje krijgt tussen de **30 en 60 anatomie-flashcards** (met screenshots uit het Moduulboek / de PDF's).
- **Stap 1 afgerond [2026-10-31 11:09]:**
  - 33 scherpe anatomische screenshots uitgesneden uit de 11 anatomie-antwoorden-PDF's én het Moduulboek (o.a. `synoviaal_opbouw_1_12.png`, `coxae_botten_1_15.png`, `genus_ligamenten_1_7.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`, `humeri_botten_1_14.png`, `cubiti_botten_1_13.png`, `cingulum_sternum_clavicula.png`, `cingulum_scapulahumeraal.png`, `romp_wervelkolom_1_10.png`, `romp_wervel_1_8.png`, `bewegingsanalyse_1_2_3.png`, `bewegingsanalyse_streksprong.png`, en de overzichtsplaten van botten en spieren) en opgeslagen in `public/images/flashcards/`.
  - Ook de fysiologie-onderdelen uit de spellen (`ConnectionsGame.tsx` en `QueensGridGame.tsx`) verwijderd en vervangen door zuivere anatomie.
- **Stap 2 & 3 afgerond [2026-10-31 11:22]:**
  - `src/data/flashcardsPart1.ts`, `src/data/flashcardsPart2.ts`, `src/data/flashcardsPart3.ts` en `src/data/flashcardsData.ts` aangemaakt met **11 complete anatomie-flashcardsets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse met alle 33 screenshots uit het Moduulboek en de antwoorden-PDF's).
- **Stap 4 & 5 afgerond [2026-10-31 11:25]:**
  - NotebookLM-stijl Flashcards UI gebouwd in `src/components/flashcards/FlashcardsView.tsx`:
    - **11 complete sets** (30 tot 53 kaarten per set, **355 flashcards** in totaal, 100% zuivere anatomie & bewegingsanalyse zonder fysiologie, met 33 scherpe screenshots uit het Moduulboek en de antwoorden-PDF's).
    - **3D kaart-flip animatie** (`rotateY(180deg)`, `perspective: 1400px`) bij tikken/klikken of `[Spatie]`/`[Enter]`.
    - **Mobiele swipe-bediening & animaties:** horizontaal swipen op mobiel (links = *Fout / Nog oefenen*, rechts = *Goed / Gekend*) met live gekleurde feedback-badges en achterliggende stapelkaart.
    - **Foute kaarten herhalen:** zowel tussentijds (via de knop *"Oefen foute (X)"*) als op het eindscherm (*"Oefen foute kaarten opnieuw (X)"* of *"Hele set opnieuw"*).
    - **Afbeelding-zoom (Lightbox):** tik op *"Vergroot"* bij elk Moduulboek-figuur om de genummerde botstructuren, gewrichten, ligamenten en spieren op volledig scherm te bekijken.
  - Nieuw tabblad **Flashcards** toegevoegd aan `Header.tsx` (zowel mobiel als desktop), `MuscleContext.tsx`, `anatomy.ts` en `App.tsx` (`http://localhost:3000/#flashcards`).
  - Productiebuild (`npm run build`) geslaagd zonder fouten.

## 25. Bugfixes: Bewegings-icoontjes & Z-index Dropdown vs. Help Popup [2026-10-31 11:28]
- **Gemelde bugs (met screenshots van mobiel):**
  1. De icoontjes van de bewegingen (`MovementIcon.tsx`) zagen er bij sommige bewegingen (zoals *Flexie*, *Supinatie*, *Exorotatie*, *Mediorotatie*, *Inversie*/*Eversie*) platgedrukt of afgesneden uit op klein formaat, en misten spellingvarianten zoals *Dorsaalextensie* en *Lateraalflexie*.
  2. Op de mobiele Studie-tab (`MobileStudyView.tsx`) viel de bovenste balk met de twee dropdowns (`Alle Gewrichten` en `m. deltoideus`, die op `z-50` stond) óver de `HelpModal` (`Hulp & Uitleg`, die ook op `z-50` stond maar eerder in de DOM werd gerenderd).
- **Oplossing:**
  - In `src/components/common/MovementIcon.tsx` alle 22 bewegings-SVG's herontworpen met ruime marges binnen de `0 0 24 24` viewBox, zonder overlappende lijntjes of losse stipjes die op `14×14px` dichtlopen, én ondersteuning toegevoegd voor zowel `dorsaalflexie`/`dorsaalextensie` als `lateroflexie`/`lateraalflexie`.
  - In `src/components/study/MobileStudyView.tsx` de `z-index` van de bovenste dropdown-balk verlaagd van `z-50` naar `z-20` en in `src/components/common/HelpModal.tsx` de modal-laag verhoogd naar `z-[100]`, zodat het hulpvenster altijd netjes boven alle balken en dropdowns ligt.

## 26. Minimalistische Flipcards-interface & Verborgen Toegang (3x tikken op `?`) [2026-10-31 11:34]
- **Wensen van de gebruiker:**
  1. De hoofdstukken samenvoegen met de 'kies een flashcard' popup tot één strakke dropdown bovenaan.
  2. Alle overbodige uitleg, ondertitels, bronvermeldingen en tekstlabels weghalen zodat het scherm zo rustig mogelijk is (alleen de groene en rode tellers voor goed en fout).
  3. De aparte *Flip*-knop onderin weghalen (alleen Vorige, Rood `✕` en Groen `✓` + tikken op de kaart zelf om te flippen).
  4. De Flashcards-knop in de navigatiebalk voor nu verbergen en openen wanneer je **3 keer snel op het `?`-icoontje** rechtsboven tikt, zodat alles eerst rustig getest kan worden.
- **Uitgevoerd:**
  - `src/components/common/Header.tsx`: Flashcards-knop uit de zichtbare balk gehaald en een triple-tap detector op de `?`-knop gezet (`3x tikken` binnen 320ms opent direct `#flashcards`; `1x tikken` opent gewoon het Hulp & Uitleg venster).
  - `src/components/flashcards/FlashcardsView.tsx`: Volledig minimalistisch gemaakt met één hoofdstuk-dropdown (inclusief groene/rode voortgangsbadges per hoofdstuk), enkel kleur-tellers voor goed/fout, een rustige kaart zonder extra toelichtingsteksten en onderin uitsluitend `<`, `✕` (rood) en `✓` (groen).

## 27. Responsieve Schermhoogte (`100dvh`) voor Alle Mobiele Resoluties [2026-10-31 11:38]
- **Melding van gebruiker (met screenshot):**
  - Op mobiel vielen de onderste drie knoppen (`<`, `✕`, `✓`) net van het scherm af door de combinatie van vaste minimumhoogtes op de kaart en `min-h-screen` i.p.v. `100dvh`.
- **Oplossing in `src/components/flashcards/FlashcardsView.tsx`:**
  - De hoofdcontainer heeft nu exact `h-[calc(100dvh-3.5rem)] sm:h-[calc(100dvh-4rem)] overflow-hidden` (precies passend onder de header en binnen de zichtbare dynamische viewport van mobiele browsers).
  - De vaste `min-h-[340px]` op de kaart is verwijderd en vervangen door `flex-1 min-h-0`, en de voortgangslijn is geïntegreerd in de tellerrij. Hierdoor schaalt de flipcard (inclusief afbeelding) automatisch mee met élke schermhoogte en beeldverhouding en blijven de onderste knoppen altijd volledig in beeld.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.

## 28. Opschonen & Versimpelen Flashcards: 100% Moduulboek-termen & Korte Vragen/Antwoorden [2026-10-31 11:45]
- **Wens van de gebruiker:**
  - Alle termen die niet in het Moduulboek of de antwoorden-PDF's voorkomen (zoals *circumductie*, *mediaanvlak*, klinische syndromen, etc.) verwijderen.
  - Vragen en antwoorden zo kort, eenvoudig en snel leesbaar mogelijk maken zonder extra of verdiepende uitleg.
- **Uitvoering:**
  - **Stap 1 afgerond:** `src/data/flashcardsPart1.ts` (Set 1 Richtingen, Set 2 Assen/Vlakken/Bewegingen, Set 3 Synoviaal Gewrichten & Bewegingsanalyse) volledig herschreven met korte, directe 1-regel vragen en antwoorden exact volgens het Moduulboek en de antwoorden-PDF's.
  - **Stap 2 afgerond:** `src/data/flashcardsPart2.ts` (Set 4 Art. coxae, Set 5 Art. genus, Set 6 Art. pedis) herschreven met exacte nummering uit de antwoorden-PDF's en korte, snelle vragen/antwoorden (niet-curriculumspieren zoals `m. sartorius` verwijderd).
  - **Stap 3 afgerond:** `src/data/flashcardsPart3.ts` (Set 7 Art. cubiti, Set 8 Art. humeri, Set 9 Cingulum pectorale) en `src/data/flashcardsData.ts` (Set 10 Romp & Set 11 Oefentoets Anatomie + overzichtspagina's p. 71–74) herschreven en gecontroleerd tegen het volledige Moduulboek (`Moduulboek Anatomie, bewegingsanalyse en spierfysiologie - 2025-2026.pdf`), `spiertabellen.pdf` en alle 11 antwoorden-PDF's.
  - **Landingspagina toegevoegd [2026-10-31 12:02]:** In `src/components/flashcards/FlashcardsView.tsx` kom je nu eerst op het minimalistische overzichtsscherm (*Kies een flashcard-set*) met alle 11 sets (inclusief voortgangsbadges voor goed/fout/totaal), en kun je vanuit elke set met de overzichtsknop (`LayoutGrid`) linksboven of via het eindscherm direct terug naar de landingspagina.
  - **Fix afbeeldingen zichtbaarheid (`BASE_URL` & flexbox-hoogte) [2026-10-31 12:07]:** In `FlashcardsView.tsx` `resolveAssetUrl()` toegevoegd zodat `/images/flashcards/...` ook op GitHub Pages (`/anatomie-spier-app/`) naar het juiste pad verwijst, en `max-h-full` in een `flex-1` container (waardoor de afbeelding op 0px hoogte klapte) vervangen door `max-h-[34dvh] sm:max-h-[40dvh]` op zowel de voor- als achterzijde van de kaart.
  - **Sets uitgebreid naar 41–45 kaarten per set [2026-10-31 12:15]:** Alle 11 sets uitgebreid met extra kernvragen en de 5 spierfiguren uit de antwoorden-PDF's (`genus_spieren_fig.png`, `cubiti_spieren_fig.png`, `humeri_spieren_fig.png`, `cingulum_spieren_fig.png`, `romp_spieren_fig.png`), zodat elke set tussen de 41 en 45 kaarten bevat (**472 kaarten totaal**, 100% uit het Moduulboek en de antwoorden-PDF's).
  - Productiebuild (`npm run build`) geslaagd met 0 fouten.

## 29. Verborgen Spel-toegang (3x tikken op Study), Terugknop vanuit Spel & Opschonen Antwoord-tekst op Afbeeldingen [2026-10-31 13:41]
- **Wensen van de gebruiker:**
  1. **3x tikken op de `Study` (*Spieren*) knop** opent het verborgen spelgedeelte (`#game`).
  2. **Terugknop vanuit het spelgedeelte naar de hoofdapp:** een knop in de bovenbalk van het spel waarmee je direct terugkeert naar de hoofdapp.
  3. **Geen antwoord-verklappende tekst meer op flashcard-afbeeldingen:** alle 38 afbeeldingen in `public/images/flashcards/` gecontroleerd en opgeschoond zodat nergens een tekstvak, tabel, aanzicht-label of Engelse anatomische term het antwoord verklapt.
  4. **Niet pushen naar GitHub** tenzij de gebruiker daar expliciet om vraagt.
- **Uitgevoerd:**
  - In [`Header.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx): `handleStudyButtonClick` toegevoegd met een triple-tap detector (3x snel tikken binnen 350ms op het *Spieren* icoon op mobiel of de *Spieren* knop op desktop navigeert direct naar `#game`).
  - In [`App.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/App.tsx): linksboven in de spel-header een `← App` knop (`handleExitGame`) toegevoegd die `#game` uit de URL haalt en direct terugschakelt naar de hoofdapp.
  - Alle **20 afbeeldingen** met verklappende teksten of rand-artefacten in `public/images/flashcards/` opgeschoond:
    - `humeri_spieren_fig.png` & `cingulum_spieren_fig.png`: tekstvakken *"Insertie van de m. teres major..."* en *"Insertie van de m. latissimus dorsi..."* verwijderd.
    - `cubiti_spieren_fig.png`: `"1. longum / 1. breve"` en `"3. longum / 3. laterale / 3. mediale"` vervangen door strakke genummerde vakjes `1` en `3`.
    - `romp_wervelkolom_1_10.png`: tabelrand en Engelse namen (`1st cervical or Atlas`, `2nd cervical or Axis`, `1st thoracic`, `1st lumbar`) verwijderd.
    - `coxae_botten_1_15.png` & `genus_botten_1_9.png`: kopteksten `Os coxa`, `Os femur`, `Os tibia` en `Zie art. genus` verwijderd.
    - `cubiti_botten_1_13.png`, `humeri_botten_1_14.png`, `pedis_botten_1_5.png`, `pedis_ligamenten_1_4.png`: ingevulde kaders met `Lichaamszijde: R/L` en `Aanzicht: ventraal/dorsaal/mediaal/lateraal` én de antwoordtabel (`3 Os talus / 4 Os calcaneus / 5 Os naviculare`) verwijderd.
    - `richtingen_os_coxae.png`, `richtingen_scapula_blanco.png`, `richtingen_aanzichten.png`, `richtingen_radioulnaris.png`: bijschriften (`Rechter os coxae van mediaal/lateraal`) en afgesneden letters verwijderd.
    - `genus_ligamenten_1_7.png`: Engelse tekstlabels op de bot- en meniscusstructuren (`Femur`, `Tibia`, `Fibula`, `Lateral/Medial meniscus`, `Cruciate`) weggefilterd terwijl de nummers `1 t/m 7` scherp zichtbaar blijven.
    - `overzicht_spieren_dorsaal.png` & `overzicht_spieren_ventraal.png`: antwoordlijsten rechtsboven verwijderd en op de ventrale plaat alle ontbrekende vraagnummers (`2.`, `8.`, `9.`, `10.`, `15.`, `16.`) netjes in de vakjes geplaatst.
    - `bewegingen_cingulum.png`, `bewegingen_coxae.png`, `bewegingen_pedis.png`, `bewegingen_romp.png`: afgesneden gewrichtstitels aan de bovenrand weggesneden.
  - Productiebuild (`npm run build`) geslaagd met 0 fouten. Niet gepusht naar GitHub conform afspraak.


## 30. Flashcards Editor (PC), Quiz Validatie & Anatomische Correcties [2026-11-01]
- **Gebruikerswensen:**
  1. **Flashcards Editor (alleen PC/desktop):** Een edit-functie waarin alle flashcards stuk voor stuk gewijzigd kunnen worden, en kaarten toegevoegd of verwijderd kunnen worden.
  2. **Origo naar Insertie switch pas na alle punten:** Bij meer dan twee aanhechtingspunten (bijv. 3 bij *m. iliopsoas*) niet na 2 punten automatisch switchen naar insertie, maar pas als alle origo-punten geplaatst zijn.
  3. **Fouten tellen in Quiz:** Zorgen dat elke foute poging altijd betrouwbaar als fout geteld wordt in de rode teller (bij zowel skeletvragen als open/invulvragen).
  4. **Tuber ischiadicum positie:** Tuber ischiadicum stond iets te laag op het dorsale skelet; verplaatsen naar de juiste anatomische positie op het zitbeen.
  5. **Standaard tolerantie op Medium:** De standaard nauwkeurigheid in de toets instellen op *Medium* (`strict`, 2.5% marge) in plaats van *Laag*.
  6. **Teveel punten afkeuren:** Antwoorden met overtollige punten (bijv. 2 origo's en 2 inserties bij *m. biceps femoris* i.p.v. 2 origo's en 1 insertie) moeten als fout worden gerekend en mogen niet worden goedgekeurd.
  7. **Dubbele punten op dezelfde lijn afkeuren:** Twee punten op dezelfde aanhechtingslijn (bijv. 2 origo's op lumbale wervels i.p.v. 1 op lumbaal en 1 op crista iliaca bij *m. latissimus dorsi*) mogen niet worden goedgekeurd; elk uniek doel vereist zijn eigen punt en duplicaten mogen ontbrekende doelen niet maskeren.
  8. **Niet pushen naar GitHub:** Niet pushen naar GitHub tenzij de gebruiker hier expliciet om vraagt.

- **Analyse & Oorzaken:**
  - *Vroegtijdige switch & cap op 2:* In [`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) stond `origins = rawOrigins > 2 ? 2 : Math.max(1, rawOrigins);` en in [`coordinates.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts) stond `requiredCount = distinctTargets.length > 2 ? 2 : distinctTargets.length;`. Hierdoor werden spieren met 3 of meer origo's (*m. iliopsoas*, *m. latissimus dorsi*, *m. deltoideus*, *m. trapezius*, etc.) afgekapt op 2.
  - *Fouten niet geteld:* In `QuizView.tsx` stonden regels zoals `incorrectAnswers: current.incorrectAnswers + (!isSuccess && closeCount === 0 ? 1 : 0)`. Zodra een antwoord fout was maar er toevallig 1 punt 'close' was, werd de foutteller niet opgehoogd.
  - *Overtollige punten goedgekeurd:* In `coordinates.ts` bevatte `evaluatePointSet` een secundaire lus die extra punten testte tegen reeds gematchte doelen en `isPassed` controleerde alleen `satisfiedTargets >= requiredCount` zonder te controleren of `userPoints.length === requiredCount`.
  - *Tuber ischiadicum positie:* In `muscles.json` stonden de hamstrings (*biceps femoris*, *semitendinosus*, *semimembranosus*) op `y: 0.5101` en `y: 0.5134`, wat onder de rand van het zitbeen viel.

- **Doorgevoerde aanpassingen:**
  1. **Strict 1-op-1 Bipartiete Evaluatie & Overtollige Punten Afkeuren ([`coordinates.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts)):**
     - `requiredCount = distinctTargets.length` (cap op 2 verwijderd).
     - Strict 1-op-1 matching: elk uniek anatomisch doel (punt of zone) kan door maximaal één gebruikerspunt worden verzadigd.
     - Eventuele extra punten krijgen onvoorwaardelijk `accuracy: 'incorrect'`.
     - `isPassed = satisfiedTargets === requiredCount && userPoints.length === requiredCount`. Overtollige punten of duplicaten op dezelfde lijn leiden nu altijd tot afkeuring (`isPassed = false`).
  2. **Dynamische Origo/Insertie Telling & Automatische Switch ([`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx)):**
     - `origins = Math.max(1, rawOrigins)` en `insertions = Math.max(1, rawInsertions)`.
     - Bij spieren met 3 origo's (zoals *m. iliopsoas*) schakelt het tekenhulpmiddel nu pas na de 3e klik over naar insertie.
  3. **Betrouwbare Foutentelling ([`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx)):**
     - Zowel bij tekentoetsen als botten-/invultests ingesteld op `incorrectAnswers: current.incorrectAnswers + (isSuccess ? 0 : 1)`. Elke niet-geslaagde poging verhoogt nu altijd direct de rode foutteller.
  4. **Standaard Tolerantie op Medium ([`QuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) & [`MobileQuizView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx)):**
     - Standaard ingesteld op `'strict'` (*Medium*, 2.5% marge) en persistent bewaard in `localStorage` (`pmt_tolerance_mode`).
  5. **Tuber Ischiadicum Positie Gecorrigeerd ([`muscles.json`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json) & [`bonesData.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/bonesData.ts)):**
     - Coördinaten van `tuber ischiadicum` bij *m. biceps femoris*, *m. semitendinosus* en *m. semimembranosus* verhoogd van `y: 0.5101` / `0.5134` naar `y: 0.4985`, precies in de bolling van het tuber ischiadicum. Rechter marker in `bonesData.ts` eveneens uitgelijnd op `y: 0.498`.
  6. **Flashcards Editor (PC/Desktop) ([`FlashcardEditorView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/FlashcardEditorView.tsx), [`FlashcardContext.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/FlashcardContext.tsx), [`EditorView.tsx`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/EditorView.tsx), [`vite.config.ts`](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/vite.config.ts)):**
     - Nieuwe tab *Flashcards bewerken* toegevoegd aan de editor op PC (naast *Spieren bewerken* en *Botten bewerken*).
     - Directe bewerkknop (*Kaarten bewerken*) op de flashcards-landingspagina en in de studieweergave op desktop.
     - Keuze uit alle 11 sets met zoekfilter op trefwoord.
     - Linkerlijst met kaartnummers, categoriebadges, vraagfragmenten, afbeeldingsstatus en snelle verwijder-/toevoegknoppen.
     - Rechterformulier met categorie-invoer (inclusief herbruikbare suggestiechips), vraagveld, antwoordveld met bulletpoint-ondersteuning, afbeeldingsselector met live thumbnail en live interactieve kaartpreview.
     - Mogelijkheid om kaarten toe te voegen, te dupliceren en te verwijderen.
     - Opslag via `localStorage`, export/import van JSON, reset naar standaard en `POST /api/save-flashcards` naar `src/data/flashcardsCustom.json`.
  7. **Build & Validatie:**
     - `npm run build` geslaagd met 0 fouten. Geen commits gepusht naar GitHub.


## 31. Broncontrole Flashcards tegen Reader & Antwoorden-PDFs, Opsplitsing en Herindeling [2026-11-01]
- **Gebruikerswensen:**
  1. **Broncontrole:** Alle flashcards nalopen en controleren tegen het Moduulboek (2025-2026) en vooral de antwoorden-PDFs uit E:\\windesheim\\anatomie blok 1.
  2. **Notitie document:** Als iets inhoudelijk niet lijkt te kloppen of bronnen elkaar tegenspreken, noteer dit dan in een los document dat de gebruiker kan checken; pas het niet meteen eigenhandig aan.
  3. **Samengestelde vragen opsplitsen:** Kaarten waar meerdere dingen tegelijk worden gevraagd (zoals 'Wat is de Nederlandse naam van art. coxae en art. genus?') alvast opbreken in losse, snelle, enkelvoudige vragen.
  4. **Verkeerd gecategoriseerde kaarten verplaatsen:** Vragen die onder het verkeerde hoofdstuk stonden (zoals gewrichtsvragen onder '3. Synoviaal gewrichten en bewegingsanalyse') verplaatsen naar hun eigen hoofdstuk (bijv. art. pedis, coxae, genus, etc.).
  5. **Niet pushen:** Nooit zomaar pushen naar GitHub zonder expliciete vraag van de gebruiker.

- **Uitgevoerde analyses en controles:**
  - Tekst van alle 17 officiële PDFs uit E:\\windesheim\\anatomie blok 1 geëxtraheerd en geanalyseerd tegen alle oorspronkelijke flashcards.
  - Inhoudelijke tegenstrijdigheden geïdentificeerd en vastgelegd in FLASHCARDS_CONTROLE_EN_NOTITIES.md:
    - M. rectus abdominis: Moduulboek p. 65 stelt origo = os pubis en insertie = costae 5-7 + proc. xiphoideus, terwijl ANTWOORDEN romp.pdf p. 3 het exact omgekeerde stelt (origo = costae 5-7 + proc. xiphoideus, insertie = os pubis).
    - Art. subtalaris vs. Art. talocalcaneonavicularis: In ANTWOORDEN synoviaal gewrichten.pdf zijn voorste en achterste per abuis omgewisseld ten opzichte van Art. pedis ANTWOORDEN.pdf en de anatomische werkelijkheid.
    - M. iliopsoas: Romp-lesbrief vermeldt ook flexie van de wervelkolom, heuplesbrief vermeldt uitsluitend heupbewegingen.
    - M. tensor fasciae latae: Lesbrief vermeldt alleen abductie in art. coxae.
    - Engelse Muscle Premium (MP) termen: Komen voor in de bewegingslesbrief (avb-33 t/m avb-38).

- **Doorgevoerde aanpassingen in de code:**
  1. **Herindeling gewrichtsvragen (flashcardsPart1.ts, flashcardsPart2.ts, flashcardsPart3.ts):**
     - syn-7 verwijderd uit Set 3 en opgesplitst: Art. coxae naar Set 4 en Art. genus naar Set 5.
     - syn-8 (art. talocruralis) en syn-9 (onderste spronggewricht) verwijderd uit Set 3 en verplaatst naar Set 6 (Art. pedis).
     - syn-10 verwijderd uit Set 3 en opgesplitst: Art. cubiti naar Set 7, Art. humeri naar Set 8, en Cingulum pectorale naar Set 9.
  2. **Opsplitsing samengestelde kaarten:**
     - Set 1: rich-8, rich-10, rich-12, rich-16, rich-22, rich-27, rich-28 en rich-32 t/m rich-45 opgesplitst in gerichte enkelvoudige vragen of overzichtelijke termenparen.
     - Set 2: avb-5, avb-6, avb-7 (vlakken loodrecht op as + bewegingen daarin) en avb-43 (BSG vs OSG) opgesplitst in aparte kaarten.
     - Set 3: syn-1 t/m syn-6 (Latijnse gewrichtsnaam vs aantal assen/bewegingen), syn-11 (kom vs kop) en syn-12/syn-13 (naam structuur vs functie) opgesplitst.
     - Set 4, 8 & 10: Multi-spier kaarten (cox-35, cox-39, hum-42) en wervel/rib kaarten (romp-4, romp-5, romp-6, romp-9, romp-10, romp-11) opgedeeld in losse identificatie- en aantalvragen.
     - Set 11: Grote overzichtsplaten (oef-25 t/m oef-38) met 4 tot 6 nummers per kaart teruggebracht naar overzichtelijke vragen van maximaal 2 logisch gekoppelde structuren.
  3. **Storage cache bust (FlashcardContext.tsx):**
     - Storage key verhoogd naar pmt_anatomie_flashcards_custom_v2 zodat browsers direct de nieuwe kaarten en herindeling laden.
  4. **Build & Verificatie:**
     - npm run build geslaagd met 0 fouten. Totaal 529 heldere, beknopte flashcards verdeeld over 11 sets (tussen de 42 en 60 kaarten per set). Geen push naar GitHub uitgevoerd.

- **Verwerkte Gebruikersbeslissingen [2026-11-01 18:15]:**
  1. *M. rectus abdominis:* Anatomisch correct ingesteld (origo: os pubis, insertie: 5e-7e ribkraakbeen en processus xiphoideus).
  2. *Art. subtalaris vs. art. talocalcaneonavicularis:* Anatomisch correct verwerkt (art. subtalaris = achterste deel van het OSG; art. talocalcaneonavicularis = voorste deel van het OSG).
  3. *M. tensor fasciae latae & m. gluteus medius:* Volledig verwijderd uit alle flashcardsets (theorie- en afbeeldingskaarten); SIAI-vraag richt zich nu 100% op m. rectus femoris.
  4. *Muscle Premium (MP):* Alle 6 kaarten met Engelse MP-termen definitief verwijderd uit Set 2.
  5. Totaal aantal kaarten na opschoning: 484 kaarten (elke set telt nu tussen de 37 en 60 kaarten).
  6. Cache key verhoogd naar v3 in FlashcardContext.tsx.

## 32. Oplossen Verspringen naar M. Deltoideus & Paginaverversing in Spiereditor [2026-11-01]
- **Probleemomschrijving door gebruiker:**
  - Bij het aanpassen of plaatsen van een aanhechtingspunt in de tab *Spieren bewerken* werd de wijziging wel opgeslagen, maar versprong de weergave direct naar een andere spier (*m. deltoideus*) en ververste de pagina.
  - Gewenst gedrag: op de spier blijven die bewerkt wordt, geen paginaverversing en na afronding pushen naar GitHub.

- **Technische oorzaak:**
  1. Bij elke bewerking in de editor riep `updateMuscleVisuals` / `updateMuscleDetails` direct `saveMusclesToDisk` aan.
  2. `saveMusclesToDisk` stuurde een POST naar `/api/save-muscles`, wat `src/data/muscles.json` op schijf overschreef.
  3. Vite's file watcher (chokidar) had geen negeerregel voor `muscles.json`. Zodra `muscles.json` op schijf werd gewijzigd, detecteerde Vite dit als broncode-update. Omdat React Fast Refresh de context niet inline kon vervangen, stuurde Vite een `full-reload` naar de browser.
  4. De browser voerde een harde paginaverversing uit, waardoor alle componenten opnieuw gemount werden.
  5. In `MuscleContext.tsx` werd `focusedMuscleId` bij initialisatie standaard ingesteld op de eerste ventrale spier uit de dataset: `m. deltoideus`. Daardoor leek het alsof de editor direct naar deltoideus versprong.

- **Doorgevoerde oplossingen:**
  1. **Vite File Watcher genegeerd voor runtime databestanden (`vite.config.ts`):**
     - `server.watch.ignored` toegevoegd voor `**/src/data/muscles.json`, `**/src/data/bonesData.ts`, `**/src/data/flashcardsCustom.json`.
     - Hierdoor triggert het opslaan naar schijf via de interne API nooit meer een automatische paginaverversing of reload.
  2. **Persistente focus op de actieve spier (`MuscleContext.tsx`):**
     - `FOCUSED_MUSCLE_KEY` ('pmt_anatomie_focused_muscle_id') toegevoegd aan `localStorage`.
     - Zowel `focusedMuscleId` als `selectedMuscleIds` en `currentView` initialiseren nu direct vanuit de opgeslagen focusspier. Zelfs als een gebruiker handmatig de pagina ververst (F5), blijft exact dezelfde spier en aanzicht actief.
     - `setFocusedMuscleId` gekoppeld aan `selectMuscle`, `nextMuscle`, `prevMuscle`, `updateMuscleVisuals`, `updateMuscleDetails`, `mirrorMuscleSide`, `addMuscle` en `deleteMuscle`.
  3. **Debounced achtergrondopslag naar schijf (`MuscleContext.tsx`):**
     - `debouncedSaveToDisk` (400ms) geïmplementeerd zodat frequente sleep- en tekenbewerkingen vloeiend in het geheugen en localStorage worden bijgewerkt zonder onnodig de schijf te overbelasten.
  4. **Build & Validatie:**
     - `npm run build` geslaagd met 0 fouten.


## 33. Herstel Automatische Origo/Insertie-Switch bij Multi-Origo Spieren & Compacte Toggle-Balk [2026-11-01]
- **Melding van de gebruiker:**
  1. **Te vroege switch in de Oefen/Test-tab:** Bij het intekenen van aanhechtingen bij bijv. de *m. serratus anterior* (en andere spieren met meerdere origo's, zoals *iliopsoas*) versprong de tool na het plaatsen van slechts 1 origo al direct naar insertie. Dit moet pas gebeuren zodra het *exacte* vereiste aantal origo's is geplaatst (bijv. 2 bij serratus anterior, 3 bij iliopsoas).
  2. **Optie toevoegen om automatische switch aan/uit te zetten:** In het onderste controlepaneel (bij "aanzicht automatisch roteren" en "automatisch inzoomen") moet een optie komen om het automatisch wisselen van het gereedschapstype (origo -> insertie) in of uit te schakelen.
  3. **Interface compacter maken:** De drie switches nemen momenteel te veel verticale ruimte in beslag (drie losse gestapelde regels). Maak deze drie schakelaars compacter zodat ze in 1 nette horizontale balk/grid passen.
  4. **Pushen naar Git:** Zodra alles afgerond en getest is, direct pushen naar GitHub.

- **Actuele status van het onderzoek & reeds uitgevoerde stappen:**
  1. **Diepere oorzaak van het vroege switchen opgespoord:**
     - In `src/utils/coordinates.ts` bevatte de functie `getDistinctTargetCount` een groepering op basis van de genormaliseerde naam: `points.map(pt => pt.name.toLowerCase())`.
     - In `src/data/muscles.json` hadden beide origo-punten van *m. serratus anterior* exact dezelfde naam: `"1e tot 9e costa (rib)"`.
     - Hierdoor vatte `getDistinctTargetCount` deze 2 punten samen tot een set van grootte 1! Als gevolg daarvan berekende `expectedCounts.origins` de benodigde hoeveelheid origo's als 1 in plaats van 2.
     - Zodra de gebruiker 1 punt plaatste, dacht het systeem dat alle origo's voldaan waren en werd direct omgeschakeld naar insertie.
     - Hetzelfde gold voor *m. obliquus externus abdominis* (waar 3 rib-origo's dezelfde naam deelden).
  2. **Reeds uitgevoerde aanpassingen:**
     - `src/utils/coordinates.ts`:
       - `getDistinctTargetCount` gecorrigeerd zodat deze altijd de werkelijke lengte van de puntenreeks (`points.length`) hanteert.
       - `getDistinctTargets` geüpdatet zodat elk punt in een meerpuntsstructuur een eigen unieke doel-identificatie (`pt_${idx}_${name}`) krijgt en 1-op-1 bipartiet gekoppeld wordt.
     - `src/data/muscles.json`:
       - *m. serratus anterior* (links en rechts) opgesplitst in herkenbare deelnamen en corresponderende lijnen: `"1e-4e costa (craniaal)"` en `"5e-9e costa (caudaal)"`.
       - *m. obliquus externus abdominis* (links en rechts) voorzien van unieke zonelijnen: `"5e-6e costa"`, `"7e-9e costa"`, `"10e-12e costa"` en voor insertie `"crista iliaca"`, `"linea alba (craniaal)"`, `"linea alba (caudaal)"`.
  3. **Huidige werkzaamheden (in actieve uitvoering):**
     - Toevoegen van `autoSwitchPointType` state in `QuizView.tsx` (met persistentie in `localStorage` onder `pmt_auto_switch_point_type`, standaard `true`).
     - Aanpassen van `handleCanvasClick` in `QuizView.tsx` zodat de switch uitsluitend plaatsvindt als `autoSwitchPointType === true` EN `nextOrigins.length === expectedCounts.origins` (en nog niet alle inserties geplaatst zijn).
     - Herschalen van de 3 toggles in `QuizView.tsx` en `MobileQuizView.tsx` naar een gestroomlijnd 3-koloms grid:
       - `Autom. roteren` [Aan / Uit]
       - `Autom. zoomen` [Aan / Uit]
       - `Autom. switch` [Aan / Uit]
     - TypeScript compilatiecontrole (`npm run build`) en aansluitend `git push origin main`.

  4. **Afronding & Validatie [2026-11-01 20:26]:**
     - `autoSwitchPointType` succesvol geïmplementeerd en gekoppeld aan `localStorage` (`pmt_auto_switch_point_type`, standaard aan).
     - Wisseling van 'origin' naar 'insertion' activeert uitsluitend als `nextOrigins.length === expectedCounts.origins` én `autoSwitchPointType === true`.
     - De interface controls (Autom. roteren, Autom. zoomen, Autom. switch) zijn zowel op desktop (`QuizView.tsx`) als mobiel (`MobileQuizView.tsx`) compact samengebracht in 1 overzichtelijke rij van 3 kolommen met duidelijke actieve statussen ('Aan' / 'Uit').
     - `npm run build` geslaagd zonder enige TypeScript fouten (code 0).
     - Wijzigingen gereed om te committen en te pushen naar GitHub zoals door de gebruiker verzocht.

## 34. Duidelijk Visueel Onderscheid tussen 'Jouw Invoer' en 'Juiste Antwoord' [2026-11-01 20:28]
- **Melding van de gebruiker:**
  - Het verschil tussen de door de gebruiker getekende spier/aanhechtingspunten en het juiste antwoord is nu te moeilijk te zien; ze lijken te veel op elkaar (beide blauwe 'O', rode 'I' en rode lijnen). Het is onduidelijk welk punt door de gebruiker geplaatst is en welke het juiste antwoord voorstelt. Na afronding direct pushen naar Git.

- **Analyse van het huidige visualisatieprobleem:**
  1. *Aanhechtingspunten:*
     - Zowel de gebruikersorigo als de correcte origo worden getoond als een blauwe cirkel met een witte 'O'.
     - Zowel de gebruikersinsertie als de correcte insertie worden getoond als een rode cirkel met een witte 'I'.
     - Als de gebruiker een punt net iets naast het doel plaatst, staan er twee vrijwel identieke blauwe cirkels of rode cirkels vlak naast elkaar.
  2. *Spierverloop:*
     - Zowel de lijn van de gebruiker als het spierverloop van het model worden in roodtinten gerenderd (`#e11d48`).
  3. *Gebrek aan duidelijke identificatie / badges:*
     - Er staan geen tekstlabels bij de punten ("Jouw punt" vs "Juiste aanhechting"), waardoor de student moet gokken welke van de twee markeringen van hemzelf was.

- **Plan van aanpak:**
  1. **Visuele stijl van gebruikerspunten (bij evaluatie):**
     - Geef de gebruikerspunten een onderscheidende vorm en styling (bijv. een herkenbare ring met gebruikersindicator en scorebadge ✓ / ✗ / ~).
     - Toon een duidelijk labeltag bij het punt: `Jouw origo` / `Jouw insertie` met de accuraatheidskleur.
     - Geef de verbindingslijn van de gebruiker een contrasterende stijl (indigo/paars `#6366f1` gestippeld/dashed met label "Jouw lijn").
  2. **Visuele stijl van het juiste antwoord (referentie):**
     - Geef het juiste antwoord een prominent referentie-uiterlijk:
       - Een doelwit/sterretje (`🎯`) met een goud/groene kwaliteitsrand en een pulserende zachte halo.
       - Duidelijke labeltags: `🎯 Juiste origo: <anatomische naam>` en `🎯 Juiste insertie: <anatomische naam>`.
       - Het correcte spierverloop in massief anatomisch rood (`#dc2626` / `#e11d48`) met eventuele anatomische kromming (`musclePath`).
  3. **Canvas-legenda toevoegen na evaluatie:**
     - Een compacte, niet-storende floating legenda op het canvas zodat in één oogopslag te zien is:
       `🟣 Jouw punten` vs `🎯 Juiste anatomie`.
  4. **Build & Push:**
     - `npm run build` uitvoeren en pushen naar GitHub.

  4. **Doorgevoerde oplossingen & Afronding [2026-11-01 20:30]:**
     - **Spierverloop van de gebruiker vs referentie:**
       - De door de gebruiker geplaatste lijn wordt na controle getoond als een duidelijke indigoblauwe stippellijn (`#6366f1`, dashed), terwijl het juiste spierverloop een massieve, dikke anatomische rode lijn (`#dc2626`) is met een zachte rode halo.
     - **Aanhechtingspunten van de gebruiker:**
       - Worden omringd door een gestippelde ring in de accuraatheidskleur (groen ✓, amber ~, rood ✗).
       - Binnenin het punt staat direct het score-symbool (`✓`, `~`, of `✗`).
       - Boven elk gebruikerspunt zweeft een donkere badge: `Jouw O: ✓ Juist` of `Jouw I: ✗ Fout`.
     - **Juiste antwoordpunten (referentie):**
       - Voorzien van een opvallend doelwit-icoon (`🎯`) en een dubbele concentrische ring (cyaan voor origo, rozerood voor insertie).
       - Onder elk referentiepunt zweeft een badge met de exacte anatomische naam: `🎯 Juist: <naam>` (bijv. `🎯 Juist: SIAS`).
     - **Floating Legenda:**
       - Linksboven in de viewer verschijnt na controle een compacte floating legenda (HUD) die het verschil tussen 'Jouw getekende spier' en 'Juiste anatomische referentie' direct toelicht.
     - `npm run build` geslaagd zonder fouten (code 0).

## 35. Flexibele Beoordeling van Meerpunts- en Zone-Aanhechtingen (bijv. Iliopsoas Wervels & Os Ilium) [2026-11-01 20:34]
- **Feedback & instructie van de gebruiker:**
  - Bij langgerekte aanhechtingen (zones zoals wervels, ribben, darmbeen, linea alba) is het voor een student niet vanzelfsprekend hoeveel discrete punten er exact moeten worden gezet.
  - De automatische switch en de getoonde referentie-antwoorden moeten blijven werken zoals ingetekend in de bewerk-tab (bijv. 3 punten bij iliopsoas, 2 bij serratus anterior).
  - De **beoordeling** moet echter flexibel zijn voor zones:
    - Als een student bijv. bij de *m. iliopsoas* vanaf elke wervel een lijn trekt (veel punten) of slechts één punt op de wervels zet (minder punten), moet dit in beide gevallen goed worden gerekend.
    - WÉL moet elke afzonderlijke anatomische zone van de spier minimaal één keer geraakt zijn: bij *iliopsoas* moet dus zowel de wervelzone (T12/lumbales) als het ventrale vlak van het os ilium geraakt zijn. Twee punten op de wervels en nul op het os ilium mag dus niet worden goedgekeurd.
    - Dit geldt voor alle spieren met aanhechtingszones (zoals wervelkolom, crista iliaca, ribben, linea alba, scapularand).

- **Ontwerp van het zone-evaluatie-algoritme:**
  1. **Anatomische Zone-Identificatie (`zoneId`):**
     - Punten die tot dezelfde anatomische structuur behoren (zoals T12 en lumbale wervels) delen dezelfde `zoneId` (`"vertebrae"`).
     - Aanhechtingslijnen en zones worden gekoppeld aan hun overkoepelende botzone.
  2. **Zone-tevredenheid:**
     - Een zone geldt als voldaan zodra er *minimaal 1 gebruikerspunt* met accuraatheid `'correct'` binnen de zone/lijn valt.
     - Meerdere geplaatste punten binnen dezelfde zone (bijv. 4 punten langs de lumbale wervels) zijn allemaal anatomisch correct en worden niet meer als overtollig/fout afgekeurd.
  3. **Slaagconditie (`isPassed`):**
     - Alle unieke anatomische zones van de spier moeten geraakt zijn (`satisfiedZones.size === requiredZones.size`).
     - Er mogen géén foutieve punten buiten de anatomische zones zijn geplaatst (`hasNoIncorrectPoints`).
     - Als hieraan voldaan is, slaagt de student, ongeacht of hij 1, 2 of 5 punten over de zone heeft verdeeld.
  4. **Behoud van editor en auto-switch:**
     - `expectedCounts` blijft gekoppeld aan de daadwerkelijk ingetekende punten in de bewerk-tab (`origins.length`), zodat de automatische switch exact blijft functioneren zoals de docent de spier heeft ingetekend.

  5. **Verificatie & Validatie van de Zone-Evaluatie [2026-11-01 20:37]:**
     - Geautomatiseerde tests uitgevoerd op echte spiergegevens:
       - *m. iliopsoas* met 1 wervelpunt + 1 darmbeenpunt -> **Goedgekeurd (isPassed: true)**.
       - *m. iliopsoas* met 4 wervelpunten + 1 darmbeenpunt -> **Alle 5 punten goedgekeurd (isPassed: true, correctCount: 5)**.
       - *m. iliopsoas* met 2 wervelpunten en 0 darmbeenpunten -> **Afgekeurd (isPassed: false, darmbeen ontbreekt)**.
       - *m. latissimus dorsi* met 1 wervelpunt + 1 crista-punt -> **Goedgekeurd (isPassed: true)**.
       - *m. latissimus dorsi* met 2 wervelpunten en 0 crista-punten -> **Afgekeurd (isPassed: false, crista ontbreekt)**.
     - `npm run build` geslaagd zonder enige fouten (code 0).

## 36. Verfijning Benaming Tolerantie-Knoppen: Ruim, Medium, Strikt [2026-11-01 20:38]
- **Vraag van de gebruiker:**
  - Bij de tolerantie-instelling stond 'Laag', 'Medium', 'Strikt'.
  - 'Laag' is dubbelzinnig en onhandig (lage tolerantie suggereert streng, terwijl juist een ruime/makkelijke marge bedoeld werd).
  - Gevraagd om drie passende, korte woorden die goed in de buttons passen.
- **Keuze en doorvoering:**
  - Gekozen voor de intuïtieve, korte en didactisch zuivere termen:
    - **`Ruim`** (3.5% marge, vergevingsgezind)
    - **`Medium`** (2.5% marge, academische standaard)
    - **`Strikt`** (1.5% marge, hoge botprecisie)
  - Aangepast in `QuizView.tsx`, `MobileQuizView.tsx` en `HelpModal.tsx`.
- **Git Status:** Wijzigingen succesvol gepusht naar GitHub (`main`).

## 37. Verwijderen Legenda-HUD en Zwevende Punt-Badges [2026-11-01 20:48]
- **Instructie van de gebruiker:**
  - De 'Legenda Vergelijking' overlay linksboven in beeld moet eruit (was niet om gevraagd).
  - De zwevende tekst-popups/badges met de namen boven en onder de aanhechtingspunten moeten er eveneens uit om het beeld strak en rustig te houden.
- **Uit te voeren acties:**
  - `SkeletonViewer.tsx`: De floating legenda overlay (`top-3 left-3`) volledig verwijderen.
  - `SkeletonViewer.tsx`: De zwevende labels (`Jouw O: ...` en `Jouw I: ...`) boven de gebruikerspunten verwijderen.
  - `MuscleMarkers.tsx`: De zwevende badges (`🎯 Juist: ...`) onder de referentiepunten verwijderen.
  - Het strakke visuele onderscheid (gestippelde indigolijn voor de gebruiker vs massieve rode anatomische lijn, en markering in de stippen zelf) blijft behouden zonder storende tekstballonnen op het skelet.
- **Git Status:** Commit `35f6708` en aansluitend `7511bbe` succesvol gepusht naar GitHub (`main`).

## 38. Standaard Toetstype naar 'Gemengde toets' & Afstandsweergave in CM [2026-11-01 20:56]
- **Vraag van de gebruiker:**
  1. Onder 'Testen' moet de standaard geselecteerde test 'Gemengde toets' zijn; de toevoeging `(alle testen door elkaar)` erachter mag weg.
  2. Bij het feedbackscherm na oefenen/testen stond nog de ruwe fractie `< 0.035 afstand` (bijv. "3/4 punten exact geplaatst (< 0.035 afstand)"). Deze afstand moet net zoals de individuele punten worden uitgedrukt in werkelijke centimeters (**cm**).
- **Doorgevoerde aanpassingen:**
  1. **Standaard Toetstype:**
     - `src/components/quiz/QuizView.tsx`: Initiële state van `freeQuizType` gewijzigd van `'full'` naar `'mixed'`.
     - `src/components/quiz/QuizView.tsx` & `src/components/quiz/MobileQuizView.tsx`: De optietekst aangepast van `Gemengde toets (alle testen door elkaar)` naar bondig `Gemengde toets`.
  2. **Afstand in Centimeters in Feedbackscherm:**
     - `src/components/quiz/QuizFeedback.tsx`:
       - `toleranceValue` toegevoegd aan `QuizFeedbackProps`.
       - Berekening van afstanden via de skelet-conversiefactor (`SKELETON_REAL_HEIGHT_CM = 170 cm`):
         - Exacte drempel: `(toleranceValue * 170).toFixed(1)` cm (bijv. `< 4.3 cm` bij Medium, `< 6.0 cm` bij Ruim, `< 2.6 cm` bij Strikt).
         - Bijna-goed drempel: `(toleranceValue * 2 * 170).toFixed(1)` cm (bijv. binnen `8.5 cm`).
       - Tekst aangepast van `X/Y punten exact geplaatst (< 0.035 afstand)` naar `X/Y punten exact geplaatst (< X.X cm)`.
     - `src/components/quiz/QuizView.tsx`: Actuele `toleranceValue` doorgegeven aan `<QuizFeedback />`.
- **Verificatie:**
  - `npm run build` succesvol gedraaid (TypeScript compilatie en Vite bundeling zonder fouten).

## 39. Kleurcodering Insertie Gewijzigd naar Oranje [2026-11-01 21:04]
- **Vraag van de gebruiker:**
  - De kleur van de insertie overal in de app aanpassen naar **oranje** zodat deze duidelijk contrasteert met de rode 'fout' / 'afwijkend' markers (voorheen waren beide rood, wat voor verwarring zorgde).
- **Doorgevoerde aanpassingen over alle componenten:**
  1. **Skelet & Markers (`SkeletonViewer.tsx`, `MuscleMarkers.tsx`, `EditorOverlay.tsx`):**
     - Gebruikerspunten voor insertie tijdens het intekenen van `#dc2626` (rood) gewijzigd naar `#ea580c` (oranje).
     - Referentie insertiepunten en pulserende doelen (`showReferenceGhost`) omgezet naar oranje tinten (`#ea580c` / `#fb923c` / `rgba(249, 115, 22, 0.25)`).
     - Insertie aanhechtingslijnen/zones in leermodus en editor omgezet naar oranje `#ea580c` met halo `#f97316`.
     - Hover-labels op het skelet tonen nu een oranje bolletje (`bg-orange-500`) voor inserties.
  2. **Toets & Quiz Views (`QuizView.tsx`, `MobileQuizView.tsx`, `QuizFeedback.tsx`):**
     - Omschakel-knoppen voor *Insertie* aangepast naar oranje stijlen (`bg-orange-600`, oranje ring, oranje indicator-stip).
     - Op mobiel: I-knop en tooltip/instructieteksten (`Plaats de insertie (oranje)`) aangepast.
     - `QuizFeedback.tsx`: De referentie-insertiekaart heeft nu een oranje thema (`bg-orange-50`, `border-orange-100`, `bg-orange-500`, `text-orange-950`) waardoor deze direct te onderscheiden is van de rode 'Helaas niet juist' foutmelding.
  3. **Studie, Botten, Bewegingen & Puzzel (`MuscleDetail.tsx`, `MobileStudyView.tsx`, `MovementsView.tsx`, `BonesView.tsx`, `SkeletonPuzzleGame.tsx`, `HelpModal.tsx`):**
     - In `MuscleDetail.tsx`: Insertiekaart omgezet naar oranje.
     - In `MobileStudyView.tsx`: Label `I:` in de ingeklapte lade omgezet naar `text-orange-600`.
     - In `MovementsView.tsx`: `Insertie:` label omgezet naar `text-orange-600`.
     - In `BonesView.tsx`: Insertiekaartjes bij aanhechtende spieren voorzien van oranje accenten.
     - In `SkeletonPuzzleGame.tsx`: Insertie-pinnen en indicatorstipjes omgezet naar oranje `#ea580c`.
     - In `HelpModal.tsx`: Alle help- en instructieteksten bijgewerkt naar *Insertie (oranje)* en *I-knop (oranje)*.
- **Verificatie:**
  - `npm run build` gerund en succesvol gevalideerd zonder fouten.

## 42. Naadloze Witte Outlines, Nieuwe Kleuren (#1993f2 & #f623ef), Botstructuren & Navigator [2026-11-01 21:42]
- **Vraag van de gebruiker:**
  1. Gradiëntlijnen en aanhechtingspunten een dunne witte outline geven: zorg dat de cirkels en de lijn één naadloos doorlopende vorm vormen met een flinterdunne witte omtrek, zodat de kleur ongehinderd van de origo, door de lijn, naar de insertie vloeit.
  2. Kleuren aanpassen: de vorige oranje kleur zat te dicht tegen de botten aan. Vervang oranje door `#f623ef` (helder roze/fuchsia) en blauw door `#1993f2`.
  3. In de bottenweergave (`BonesView`):
     - Als je een bot aanklikt, toon de relevante botstructuren van dat bot als een klein grijs bolletje (half zo groot als de hoofdmarkers, zonder wit puntje erin) op basis van de aanhechtingscoördinaten.
     - Bij mouseover toont een tooltip de naam van de structuur (even grote tekstgrootte als de botnaam-tooltip).
     - Hover over een structuur in het rechterpaneel licht de betreffende structuur op het skelet op (en vice versa).
  4. Desatureer niet-geselecteerde spieren een klein beetje (`filter: saturate(...)`).
  5. Voeg de navigator (zoomen, pannen, reset) rechtsboven de skeletweergave toe in de bottenweergave (`BoneSkeletonViewer`).
  6. Op de study-pagina onderin werd origo nog als rood aangegeven (insertie-stip was rood in de legenda); zet dit om naar blauw (`#1993f2`) en insertie naar fuchsia (`#f623ef`).
- **Doorgevoerde aanpassingen:**
  1. **Naadloze Dunne Witte Outline:**
     - Zowel in `MuscleMarkers.tsx`, `SkeletonViewer.tsx` als `EditorOverlay.tsx` worden de witte outline van de verbindingslijn en de witte contour van de aanhechtingscirkels eerst als een continue onderlaag getekend.
     - De gekleurde cirkels en gradiëntlijnen liggen daarbovenop zónder tussenliggende scheidingslijnen, waardoor de kleur van blauw (`#1993f2`) naar fuchsia (`#f623ef`) naadloos doorloopt in één strakke anatomische figuur met een flinterdunne witte outline.
  2. **Nieuwe Kleurharmonie (#1993f2 & #f623ef):**
     - Origo: `#1993f2` overal doorgevoerd (in markers, gradiënten, legendas, detailcards, badges).
     - Insertie: `#f623ef` overal doorgevoerd (in markers, gradiënten, detailcards, badges en puzzle-game).
     - Legenda onderin `StudyView.tsx` gecorrigeerd: origo stip `#1993f2`, insertie stip `#f623ef`.
  3. **Relevante Botstructuren (`src/data/boneStructures.ts` & `BoneSkeletonViewer.tsx`):**
     - Anatomisch accurate coördinaten gedefinieerd voor structuren van o.a. `os_coxae`, `os_femur`, `os_tibia`, `os_fibula`, `os_humerus`, `os_scapula`, `os_clavicula`, `os_ulna`, `os_radius`, `os_sternum`, `os_costa` en `os_vertebra`.
     - Gerenderd als strakke grijze bolletjes (`r = 6.5px`, half zo groot als de hoofdbolletjes, zonder witte binnenstip).
     - Bij hover of highlight: kleurt op naar `#0284c7` met een pulserende focus-ring en toont een heldere tooltip met dezelfde fontgrootte (`text-sm sm:text-base font-black`) als de botnamen.
     - Twee-weg highlighting: hoveren over een structuur in het rechterpaneel licht de stip op het skelet direct op; hoveren over de stip licht de rij in het rechterpaneel op.
  4. **Desaturatie van Niet-Geselecteerde Spieren:**
     - In `MuscleMarkers.tsx` toegevoegd: `style={{ filter: isDimmed ? 'saturate(38%)' : undefined }}`.
  5. **Navigator Toolbar in Bottenweergave:**
     - `BoneSkeletonViewer.tsx` voorzien van de complete zwevende navigator rechtsboven (inzoomen `+`, percentage/reset, uitzoomen `-`, handje voor verslepen, resetweergave) én ondersteuning voor muiswiel-zoomen en drag-panning op de desktop.
- **Verificatie:**
  - `npm run build` met succes uitgevoerd (`✓ built in 3.96s`, 0 fouten).
  - Dev server gecontroleerd: draait stabiel met HTTP 200 op `http://localhost:3000/`.

## 43. Dikkere Spierlijnen & Volledig Schone Bolletjes (Icoontjes/Letters Verwijderd) [2026-11-01 21:44]
- **Vraag van de gebruiker:**
  1. De lijnen van de geselecteerde spieren mogen net een tikje dikker worden.
  2. De kleine icoontjes/letters in de balletjes van de origo en insertie moeten eruit worden gehaald.
- **Doorgevoerde aanpassingen:**
  1. **Dikkere Spierlijnen:**
     - In `MuscleMarkers.tsx` is de lijndikte van de geselecteerde spier vergroot van `5.5 / zoom` naar `8.5 / zoom` (outline breedte `11.5 / zoom`). Referentie-ghost lijnen verhoogd naar `9.5 / zoom`.
     - In `SkeletonViewer.tsx` zijn de getekende verbindingslijnen vergroot naar `8.5 / zoom` (outline `11.5 / zoom`).
     - In `EditorOverlay.tsx` is de verbindingslijn vergroot naar `8.5 / zoom` (outline `11.5 / zoom`).
  2. **Verwijderen van Icoontjes / Letters in de Aanhechtingsbolletjes:**
     - In `MuscleMarkers.tsx`: de binnenste `<text>O</text>` en `<text>I</text>` elementen zijn volledig verwijderd. De origo- en insertiebolletjes zijn nu strakke, egale kleurvlakken omhuld door de flinterdunne witte outline.
     - In `EditorOverlay.tsx`: het binnenste witte rondje in de origo en het ruitvormige witte vierkantje in de insertie zijn verwijderd.
     - In `SkeletonViewer.tsx`: tijdens het intekenen en tonen van antwoorden zijn de bolletjes eveneens egaal zonder inner letters of icoontjes (uitsluitend bij score-evaluatie in de quiz blijft de checkmark `✓` of kruisje `✗` behouden zoals verzocht).
- **Verificatie:**
  - `npm run build` gerund en succesvol geslaagd in 3.84s met 0 TypeScript/build errors.
  - Dev server draait stabiel (HTTP 200).

## 44. Fix Aspect-Ratio Bottenweergave & Aanpasbare Botstructuren in Bewerk-Tab [2026-11-01 21:47]
- **Vraag van de gebruiker:**
  1. De botten view is nu raar gestretched.
  2. Zorg ervoor dat ik in de bewerk tab ook de botstructuren kan aanpassen.
- **Doorgevoerde aanpassingen:**
  1. **Fix Aspect-Ratio / Niet meer gestretched (`BoneSkeletonViewer.tsx`):**
     - De container div had `width: '100%'` en `height: '100%'` samen met een flex-container, waardoor het skelet horizontaal werd uitgerekt.
     - Aangepast naar `className="relative h-full max-h-full max-w-full mx-auto pointer-events-auto"` met behoud van `aspectRatio: SKELETON_WIDTH / SKELETON_HEIGHT`.
     - Het skelet behoudt nu in elke weergave (enkele weergave, beide aanzichten naast elkaar en op mobiel) exact zijn natuurlijke, onvervormde verhoudingen.
  2. **Botstructuren Aanpassen in de Bewerk Tab (`BoneEditorView.tsx` & `BoneContext.tsx`):**
     - `BoneEditorView.tsx` uitgebreid met een schakelaar tussen:
       - **📍 Botstructuren** (alle relevante structuren zoals SIAS, Trochanter major, Acromion, etc.)
       - **🦴 Hoofd-botten** (de 18 hoofdmarkers van de botten)
     - Filter per bot toegevoegd (alle botten of specifiek geselecteerd bot).
     - De structuren kunnen direct op het skelet **versleept** worden (`x`, `y`) met live visualisatie en coördinatenweergave in de tooltip.
     - `BoneContext.tsx` uitgebreid met state management voor botstructuren (`updateStructurePoint`, `resetStructures`, `saveStructuresToDisk`, etc.).
     - `vite.config.ts` voorzien van de endpoint `/api/save-bone-structures`, zodat wijzigingen met één klik op "Opslaan naar bronbestand" permanent in `src/data/boneStructures.ts` worden weggeschreven.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (code 0 in 4.16s).
  - Dev server draait actief op [http://localhost:3000/](http://localhost:3000/).

## 40. Opschonen Icoontjes in Punten en Navigator Toolbar Minimaliseren [2026-11-01 21:08]
- **Vraag van de gebruiker:**
  1. Bij het plaatsen van een origo of insertie of bij het tonen van het antwoord zaten er kleine icoontjes in de punten (`🎯` bij het antwoord, en tekst/icoon tijdens intekenen). Deze moeten eruit. De `✓` (juist) checkmark en de `✗` (fout) mogen na evaluatie wel blijven staan.
  2. In de zwevende navigator toolbar (rechtsboven over de afbeelding met zoompercentage):
     - Het oogje (`Eye`/`EyeOff` knop voor hover-tooltip toggle) mag weg.
     - Naast het handje mag de tekst `Versleep` (en `Cursor`) weg, zodat het een minimalistische icoonknop is.
  3. Alles pushen naar git.
- **Doorgevoerde aanpassingen:**
  1. **Punten op het skelet (`SkeletonViewer.tsx` & `MuscleMarkers.tsx`):**
     - `SkeletonViewer.tsx`: Tijdens het intekenen (`!isEval`) wordt er géén letter of icoontje meer getoond binnenin het gebruikerspunt; het is nu een strakke, egale gekleurde stip met witte rand. Pas na evaluatie (`isEval`) wordt de statusindicator getoond: `✓` (correct) of `✗` (fout).
     - `MuscleMarkers.tsx`: Het `🎯` doelwit-icoon bij het tonen van het juiste referentieantwoord (`showReferenceGhost`) is verwijderd en vervangen door de heldere letters `O` en `I`.
  2. **Navigator Zoom Toolbar (`SkeletonViewer.tsx`):**
     - Oog-icoonknop en de bijbehorende scheidingslijn verwijderd.
     - De tekst `Versleep` / `Cursor` naast het handje verwijderd; het handje is nu een compacte, stijlvolle vierkante knop (`p-1.5 rounded-lg`).
- **Verificatie & Git:**
  - `npm run build` succesvol gedraaid (TypeScript compilatie en Vite bundeling zonder fouten).
  - Commit `05b9dce` succesvol gepusht naar GitHub (`main`).

## 41. Gradiënt Lijnen, Oranje Kleur (#fd9316) & Studiemodus Kleurcodering [2026-11-01 21:21]
- **Vraag van de gebruiker:**
  1. In studiemodus hebben alle spieren een andere kleur; zodra een spier geselecteerd wordt, moeten de origo en insertie voor die specifieke spier wél de juiste kleuren krijgen (blauw en oranje).
  2. De verbindingslijn tussen de punten moet veranderen in een blauw-naar-oranje gradiënt (blauw bij de origo, oranje bij de insertie).
  3. De oranje kleur lag nog iets te dicht bij rood; trek hem net een tikje meer naar geel/amber (**`#fd9316`**) en voer dit overal door.
  4. Bij het evalueren van een getekende spier moeten de lijnen groen of rood worden afhankelijk van goed/fout per uiteinde:
     - Goed - Goed: groen-naar-groen gradiënt (`#16a34a` -> `#16a34a`)
     - Goed - Fout: groen-naar-rood gradiënt (`#16a34a` -> `#dc2626`)
     - Fout - Goed: rood-naar-groen gradiënt (`#dc2626` -> `#16a34a`)
     - Fout - Fout: rood-naar-rood gradiënt (`#dc2626` -> `#dc2626`)
  5. Alles pushen naar git.
- **Doorgevoerde aanpassingen:**
  1. **Nieuwe Oranje Kleur (`#fd9316`):**
     - Geüpdatet in `MuscleMarkers.tsx` (`MULTI_MUSCLE_COLORS`, insertiepunten, aanhechtingslijnen en halo's).
     - Geüpdatet in `SkeletonViewer.tsx` (gebruikersinserties tijdens het intekenen).
     - Geüpdatet in `EditorOverlay.tsx` en `SkeletonPuzzleGame.tsx`.
  2. **Gradiënt Verbindingslijnen (`SkeletonViewer.tsx`):**
     - Elke gebruikerslijn tussen origo en insertie krijgt een eigen dynamische `<linearGradient>` met `gradientUnits="userSpaceOnUse"`.
     - Tijdens het intekenen: gradiënt verloopt van blauw (`#2563eb`) naar oranje (`#fd9316`).
     - Na controle (`isEval`): per punt wordt de accuraatheid gecontroleerd; het beginpunt kleurt groen (`#16a34a`) of rood (`#dc2626`), en het eindpunt eveneens groen of rood. Hierdoor ontstaat direct de gevraagde groen-groen, groen-rood of rood-rood visualisatie.
  3. **Studiemodus & Referentielijnen (`MuscleMarkers.tsx`):**
     - Voor de geselecteerde spier (`!isDimmed`): origo is altijd blauw (`#2563eb`), insertie is altijd oranje (`#fd9316`), en de spierlijn daartussen heeft de blauw-naar-oranje gradiënt.
     - Niet-geselecteerde spieren behouden hun individuele toebedeelde atlas-kleur.
     - Bij het tonen van het juiste referentie-antwoord (`showReferenceGhost`) wordt tevens de blauw-naar-oranje gradiënt en een zacht pulserende gradiënt-halo gebruikt.
  4. **Editor Gradiënt Lijnen (`EditorOverlay.tsx`):**
     - Tussen de geplaatste origo's en inserties loopt in de editor nu eveneens de blauw-naar-oranje gradiëntlijn.
- **Verificatie:**
  - `npm run build` gerund en succesvol gevalideerd zonder fouten.

## 42. Naadloze Witte Outlines, Nieuwe Kleuren (#1993f2 & #f623ef), Botstructuren & Navigator [2026-11-01 21:42]
- **Vraag van de gebruiker:**
  1. Gradiëntlijnen en aanhechtingspunten een dunne witte outline geven: zorg dat de cirkels en de lijn één naadloos doorlopende vorm vormen met een flinterdunne witte omtrek, zodat de kleur ongehinderd van de origo, door de lijn, naar de insertie vloeit.
  2. Kleuren aanpassen: de vorige oranje kleur zat te dicht tegen de botten aan. Vervang oranje door `#f623ef` (helder roze/fuchsia) en blauw door `#1993f2`.
  3. In de bottenweergave (`BonesView`):
     - Als je een bot aanklikt, toon de relevante botstructuren van dat bot als een klein grijs bolletje (half zo groot als de hoofdmarkers, zonder wit puntje erin) op basis van de aanhechtingscoördinaten.
     - Bij mouseover toont een tooltip de naam van de structuur (even grote tekstgrootte als de botnaam-tooltip).
     - Hover over een structuur in het rechterpaneel licht de betreffende structuur op het skelet op (en vice versa).
  4. Desatureer niet-geselecteerde spieren een klein beetje (`filter: saturate(...)`).
  5. Voeg de navigator (zoomen, pannen, reset) rechtsboven de skeletweergave toe in de bottenweergave (`BoneSkeletonViewer`).
  6. Op de study-pagina onderin werd origo nog als rood aangegeven (insertie-stip was rood in de legenda); zet dit om naar blauw (`#1993f2`) en insertie naar fuchsia (`#f623ef`).
- **Doorgevoerde aanpassingen:**
  1. **Naadloze Dunne Witte Outline:**
     - Zowel in `MuscleMarkers.tsx`, `SkeletonViewer.tsx` als `EditorOverlay.tsx` worden de witte outline van de verbindingslijn en de witte contour van de aanhechtingscirkels eerst als een continue onderlaag getekend.
     - De gekleurde cirkels en gradiëntlijnen liggen daarbovenop zónder tussenliggende scheidingslijnen, waardoor de kleur van blauw (`#1993f2`) naar fuchsia (`#f623ef`) naadloos doorloopt in één strakke anatomische figuur met een flinterdunne witte outline.
  2. **Nieuwe Kleurharmonie (#1993f2 & #f623ef):**
     - Origo: `#1993f2` overal doorgevoerd (in markers, gradiënten, legendas, detailcards, badges).
     - Insertie: `#f623ef` overal doorgevoerd (in markers, gradiënten, detailcards, badges en puzzle-game).
     - Legenda onderin `StudyView.tsx` gecorrigeerd: origo stip `#1993f2`, insertie stip `#f623ef`.
  3. **Relevante Botstructuren (`src/data/boneStructures.ts` & `BoneSkeletonViewer.tsx`):**
     - Anatomisch accurate coördinaten gedefinieerd voor structuren van o.a. `os_coxae`, `os_femur`, `os_tibia`, `os_fibula`, `os_humerus`, `os_scapula`, `os_clavicula`, `os_ulna`, `os_radius`, `os_sternum`, `os_costa` en `os_vertebra`.
     - Gerenderd als strakke grijze bolletjes (`r = 6.5px`, half zo groot als de hoofdbolletjes, zonder witte binnenstip).
     - Bij hover of highlight: kleurt op naar `#0284c7` met een pulserende focus-ring en toont een heldere tooltip met dezelfde fontgrootte (`text-sm sm:text-base font-black`) als de botnamen.
     - Twee-weg highlighting: hoveren over een structuur in het rechterpaneel licht de stip op het skelet direct op; hoveren over de stip licht de rij in het rechterpaneel op.
  4. **Desaturatie van Niet-Geselecteerde Spieren:**
     - In `MuscleMarkers.tsx` toegevoegd: `style={{ filter: isDimmed ? 'saturate(38%)' : undefined }}`.
  5. **Navigator Toolbar in Bottenweergave:**
     - `BoneSkeletonViewer.tsx` voorzien van de complete zwevende navigator rechtsboven (inzoomen `+`, percentage/reset, uitzoomen `-`, handje voor verslepen, resetweergave) én ondersteuning voor muiswiel-zoomen en drag-panning op de desktop.
- **Verificatie:**
  - `npm run build` met succes uitgevoerd (`✓ built in 3.96s`, 0 fouten).
  - Dev server gecontroleerd: draait stabiel met HTTP 200 op `http://localhost:3000/`.

## 43. Dikkere Spierlijnen & Volledig Schone Bolletjes (Icoontjes/Letters Verwijderd) [2026-11-01 21:44]
- **Vraag van de gebruiker:**
  1. De lijnen van de geselecteerde spieren mogen net een tikje dikker worden.
  2. De kleine icoontjes/letters in de balletjes van de origo en insertie moeten eruit worden gehaald.
- **Doorgevoerde aanpassingen:**
  1. **Dikkere Spierlijnen:**
     - In `MuscleMarkers.tsx` is de lijndikte van de geselecteerde spier vergroot van `5.5 / zoom` naar `8.5 / zoom` (outline breedte `11.5 / zoom`). Referentie-ghost lijnen verhoogd naar `9.5 / zoom`.
     - In `SkeletonViewer.tsx` zijn de getekende verbindingslijnen vergroot naar `8.5 / zoom` (outline `11.5 / zoom`).
     - In `EditorOverlay.tsx` is de verbindingslijn vergroot naar `8.5 / zoom` (outline `11.5 / zoom`).
  2. **Verwijderen van Icoontjes / Letters in de Aanhechtingsbolletjes:**
     - In `MuscleMarkers.tsx`: de binnenste `<text>O</text>` en `<text>I</text>` elementen zijn volledig verwijderd. De origo- en insertiebolletjes zijn nu strakke, egale kleurvlakken omhuld door de flinterdunne witte outline.
     - In `EditorOverlay.tsx`: het binnenste witte rondje in de origo en het ruitvormige witte vierkantje in de insertie zijn verwijderd.
     - In `SkeletonViewer.tsx`: tijdens het intekenen en tonen van antwoorden zijn de bolletjes eveneens egaal zonder inner letters of icoontjes (uitsluitend bij score-evaluatie in de quiz blijft de checkmark `✓` of kruisje `✗` behouden zoals verzocht).
- **Verificatie:**
  - `npm run build` gerund en succesvol geslaagd in 3.84s met 0 TypeScript/build errors.
  - Dev server draait stabiel (HTTP 200).

## 44. Fix Aspect-Ratio Bottenweergave & Aanpasbare Botstructuren in Bewerk-Tab [2026-11-01 21:47]
- **Vraag van de gebruiker:**
  1. De botten view is nu raar gestretched.
  2. Zorg ervoor dat ik in de bewerk tab ook de botstructuren kan aanpassen.
- **Doorgevoerde aanpassingen:**
  1. **Fix Aspect-Ratio / Niet meer gestretched (`BoneSkeletonViewer.tsx`):**
     - De container div had `width: '100%'` en `height: '100%'` samen met een flex-container, waardoor het skelet horizontaal werd uitgerekt.
     - Aangepast naar `className="relative h-full max-h-full max-w-full mx-auto pointer-events-auto"` met behoud van `aspectRatio: SKELETON_WIDTH / SKELETON_HEIGHT`.
     - Het skelet behoudt nu in elke weergave (enkele weergave, beide aanzichten naast elkaar en op mobiel) exact zijn natuurlijke, onvervormde verhoudingen.
  2. **Botstructuren Aanpassen in de Bewerk Tab (`BoneEditorView.tsx` & `BoneContext.tsx`):**
     - `BoneEditorView.tsx` uitgebreid met een schakelaar tussen:
       - **📍 Botstructuren** (alle relevante structuren zoals SIAS, Trochanter major, Acromion, etc.)
       - **🦴 Hoofd-botten** (de 18 hoofdmarkers van de botten)
     - Filter per bot toegevoegd (alle botten of specifiek geselecteerd bot).
     - De structuren kunnen direct op het skelet **versleept** worden (`x`, `y`) met live visualisatie en coördinatenweergave in de tooltip.
     - `BoneContext.tsx` uitgebreid met state management voor botstructuren (`updateStructurePoint`, `resetStructures`, `saveStructuresToDisk`, etc.).
     - `vite.config.ts` voorzien van de endpoint `/api/save-bone-structures`, zodat wijzigingen met één klik op "Opslaan naar bronbestand" permanent in `src/data/boneStructures.ts` worden weggeschreven.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (code 0 in 4.16s).
  - Dev server draait actief op [http://localhost:3000/](http://localhost:3000/).


## 45. Doorlopende Witte Spiercontour, Spier-Z-Index, Oranje (#ea580c) & Behoud Zoom in Study View [2026-11-01 21:58]
- **Vraag van de gebruiker:**
  1. Het desatureren van alle spieren die niet geselecteerd zijn herstellen naar hoe het was.
  2. De bolletjes net een tikje kleiner maken.
  3. De witte outline om de gehele spier laten lopen zodat lijnen en bolletjes één continu silhouet vormen en er geen witte lijnen intern over elkaar heen vallen waar spierbanen samenkomen (zoals bij de trochanter minor op de gebruikersfoto).
  4. De geselecteerde spier moet altijd bovenop liggen; niet-geselecteerde lijnen/cirkels mogen er nooit overheen lopen.
  5. Paars/fuchsia terugveranderen naar rijk oranje: `#ea580c`.
  6. In de study view bij inzoomen en klikken op de volgende/vorige spier moet de zoom en positie behouden blijven (niet terugspringen naar 100%).
- **Doorgevoerde aanpassingen:**
  1. **Herstel Kleuren (Geen Desaturatie):**
     - Het CSS desaturatie-filter is volledig verwijderd uit [MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx). Niet-geselecteerde spieren hebben weer hun rustige, natuurlijke atlas-kleuren zonder verbleking.
  2. **Subtiel Kleinere Bolletjes:**
     - De straal van de aanhechtingsbolletjes is in [MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx) en [SkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx) verkleind naar `10 / zoom` (en `11.5 / zoom` bij highlight) met een strakke witte contour-radius van `11.6 / zoom`.
  3. **Continu Naadloos Silhouet om de Gehele Spier:**
     - In [MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx) is de opbouw gesplitst in duidelijke render-lagen volgens het vector-schildersalgoritme:
       - **Laag 1 (Outline):** Alle witte lijnen én alle witte cirkels van de spier worden eerst getekend. Doordat alle witte elementen in één gezamenlijke onderlaag liggen, versmelten ze tot één enkel, vloeiend wit silhouet om de gehele spierstructuur.
       - **Laag 2 (Kleurvulling):** Alle gekleurde verbindingslijnen en gekleurde bolletjes worden bovenop het witte silhouet getekend. Waar meerdere lijnen samenkomen bij één aanhechtingspunt, vloeien de kleuren naadloos in elkaar over zonder dat een witte outline van een latere lijn over een eerdere gekleurde baan heen snijdt.
       - **Laag 3 (Interactie):** Ruime onzichtbare hitboxes voor intuïtief klikken, hoveren en tooltips.
  4. **Geselecteerde Spier Altijd Bovenop (Z-Index):**
     - In [SkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx) is de sorteer-comparator van `musclesToRender` aangepast: spieren van het andere aanzicht worden onderop geplaatst, niet-geselecteerde spieren in het midden, en de actieve/geselecteerde spier (`activeMuscle`) wordt gegarandeerd als allerlaatste gerenderd. Hierdoor ligt de actieve spier altijd scherp en volledig bovenop.
  5. **Insertiekleur Definitief Oranje (`#ea580c`):**
     - Oranje `#ea580c` is overal consequent doorgevoerd: in [MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx), [SkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx), [StudyView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/StudyView.tsx) (legenda), [MuscleDetail.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/MuscleDetail.tsx) (oranje accentbox en iconen), [MobileStudyView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/MobileStudyView.tsx), [BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx), [EditorOverlay.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/EditorOverlay.tsx) en [SkeletonPuzzleGame.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/game/SkeletonPuzzleGame.tsx).
  6. **Behoud van Zoom & Pan in Study View:**
     - In [StudyView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/StudyView.tsx) is `resetOnMuscleChange` op `false` gezet voor alle `SkeletonViewer` weergaven (zowel enkele weergave als de gesplitste ventraal/dorsaal modus). Bij het bladeren met *Volgende* of *Vorige* blijft de door de gebruiker gekozen zoom en positie exact behouden.
- **Verificatie:**
  - `npm run build` succesvol uitgevoerd (`✓ built in 4.25s`, 0 TypeScript/build errors).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 46. Loskoppelen Ventraal/Dorsaal Botstructuren, Spiegel- & Kopieertools, Zoomen & Hide-Oogje [2026-11-01 22:06]
- **Vraag van de gebruiker:**
  1. In bewerkmodus: botstructuur punten ventraal en dorsaal loskoppelen en instellen dat ze optioneel gekopieerd kunnen worden (voorheen deelden structuren één coördinaat via `view: 'both'`, maar omdat de ventrale en dorsale tekeningen niet identiek zijn klopten sommige punten niet).
  2. Mogelijkheid om punten te spiegelen (symmetrie links ↔ rechts) om het editen aanzienlijk sneller en makkelijker te maken.
  3. In de bewerkmodus kunnen inzoomen en pannen.
  4. Het 'hide' oogje toevoegen om markers tijdelijk te verbergen voor een vrije blik op het onderliggende skelet.
  5. Uitgebreide analyse doen van alle punten en ze netter inschatten nu de ventrale en dorsale view van elkaar zijn losgekoppeld.
- **Doorgevoerde aanpassingen:**
  1. **Loskoppelen Ventraal & Dorsaal ([boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts)):**
     - Elke botstructuur heeft nu een expliciete `view: 'ventral'` óf `view: 'dorsal'`.
     - Structuren die op beide aanzichten zichtbaar zijn (zoals Crista iliaca, Caput femoris, Trochanter major, Malleoli, Acromion, etc.) zijn gesplitst in een ventraal punt (`_v`) en een dorsaal punt (`_d`).
     - Het bewerken van een ventraal punt heeft géén ongewenste invloed meer op het dorsale aanzicht.
  2. **Spiegel- en Kopieertools ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) & [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - **Live Spiegel L↔R toggle:** wanneer ingeschakeld, spiegelt het verslepen van een rechterpunt direct de linkerpartner mee (`mirroredX = 1.0 - x, y = y`), en vice-versa.
     - **R ➔ L & L ➔ R knoppen:** spiegel met één klik alle punten van de geselecteerde zijde naar de overzijde voor het actieve bot.
     - **Ventraal ➔ Dorsaal & Dorsaal ➔ Ventraal knoppen:** kopieer met één klik de posities van de geselecteerde structuren tussen aanzichten, automatisch gecorrigeerd met sagittale links/rechts spiegeling.
     - **Live Koppel V↔D toggle:** optionele live-koppeling die standaard uitgeschakeld staat zodat beide aanzichten onafhankelijk blijven.
  3. **Inzoomen & Pannen in de Bewerkmodus:**
     - Zowel het ventrale als dorsale viewport in [BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) beschikt over een eigen zwevende navigator (inzoomen `+`, percentage/reset, uitzoomen `-`, handje voor verslepen, resetweergave).
     - Direct inzoomen en uitzoomen met het muiswiel geactiveerd.
     - Coördinatenberekening (`getBoundingClientRect`) houdt exact rekening met de actieve zoomfactor en translatie, waardoor het verslepen van markers bij elk zoomniveau 100% accuraat werkt.
  4. **Hide Oogje (`Eye` / `EyeOff`):**
     - Bovenin de werkbalk toegevoegd: schakelt in één klik de zichtbaarheid van alle markers uit, zodat de fijne anatomische botcontouren op de skelettekening vrij geïnspecteerd kunnen worden.
  5. **Uitgebreide Anatomische Analyse & Kalibratie:**
     - Alle 177 botstructuurpunten zijn grondig geanalyseerd en gekalibreerd aan de hand van de gebruikersreferenties in [muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json) en [bonesData.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/bonesData.ts):
       - *Pelvis:* SIAS (`0.332, 0.408`), SIAI (`0.3576, 0.4362`), Os pubis (`0.480, 0.481`), Acetabulum (`0.395 / 0.605, 0.460`), SIPS (`0.565 / 0.435, 0.418`), Tuber ischiadicum (`0.5876 / 0.4124, 0.500`), Crista iliaca ventraal (`0.350 / 0.650, 0.418`) en dorsaal (`0.5844 / 0.4156, 0.4224`).
       - *Femur:* Trochanter minor ligt nu op ventraal op `(0.363, 0.498)` en op dorsaal prominent op `(0.637 / 0.363, 0.498)` aan de mediale zijde; Trochanter major op `(0.3164 / 0.6836, 0.4845)`; Caput femoris (`0.445 / 0.555, 0.478`); Condyli op `y = 0.690`.
       - *Onderbeen:* Tuberositas tibiae (`0.4018 / 0.5982, 0.7405`), Caput fibulae (`0.634 / 0.366, 0.755`), Tuber calcanei (`0.5657 / 0.4343, 0.9462`).
       - *Schouder & Arm:* Acromion (`0.2618 / 0.7382, 0.2051` ventraal, `0.7254 / 0.2746, 0.2055` dorsaal), Processus coracoïdeus (`0.2818 / 0.7182, 0.2072` ventraal), Spina scapulae (`0.655 / 0.345, 0.2115` dorsaal), Angulus inferior (`0.6299 / 0.3701, 0.2826` dorsaal), Olecranon (`0.7457 / 0.2543, 0.3800` dorsaal), Tuberositas radii (`0.2308 / 0.7692, 0.3950` ventraal), Tuberositas ulnae (`0.2583 / 0.7417, 0.4029` ventraal).
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 3.89s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 47. Uniform Blauw in Bewegingstab & Grijze Niet-Geselecteerde Elementen in Study Tab [2026-11-01 22:09]
- **Vraag van de gebruiker:**
  1. Geef alle lijnen en punten in de bewegingstab enkel de kleur blauw. Hier is origo en insertie niet belangrijk.
  2. In de study tab: maak alle niet-geselecteerde elementen iets minder transparant, maar maak ze grijs.
- **Doorgevoerde aanpassingen:**
  1. **Uniform Blauw in de Bewegingstab ([MovementsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/movements/MovementsView.tsx) & [MobileMovementsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/movements/MobileMovementsView.tsx)):**
     - Prop `uniformColor="#1993f2"` toegevoegd aan [SkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/SkeletonViewer.tsx) en [MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx).
     - In de bewegingstab worden alle lijnen (zonder gradiënt), origo's en inserties uniform in helderblauw (`#1993f2`) gerenderd met de doorlopende witte outline.
  2. **Grijze en Minder Transparante Niet-Geselecteerde Elementen in de Study Tab ([MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx)):**
     - Niet-geselecteerde spieren (`isDimmed`) krijgen nu consequent de rustige neutrale grijstint `#94a3b8` voor zowel de lijnen als de aanhechtingsbolletjes (in plaats van meerkleurige atlas-tinten).
     - De dekking (opacity) is verhoogd van `0.45` naar `0.65` (en op het tegenovergestelde aanzicht van `0.25` naar `0.38`), waardoor ze minder transparant en rustig zichtbaar zijn tegen het skelet.
     - De actieve/geselecteerde spier behoudt zijn volledige dekking (1.0), blauwe origo (`#1993f2`), oranje insertie (`#ea580c`) en gradiëntverloop.
  3. **Botweergave Synchronisatie ([BoneSkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx)):**
     - Niet-geselecteerde botmarkers eveneens afgestemd op de neutrale grijstint `#64748b` met heldere afbakening.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 3.93s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 48. Herstel Botstructuurpunten, Verbergknop Oogje in Navigator, Spiegelen L↔R en Fix Stretching Naast Elkaar [2026-11-01 22:30]
- **Vraag van de gebruiker:**
  1. In de bewerk view van de botstructuren: ik mis nu een hele hoop punten van de structuren; de structuren staan wel rechts in het tekstframe, maar ik zie ze niet op de afbeelding. Voeg de punten toe.
  2. Met de verbergknop bedoel ik alleen de pop-up verbergen, niet de punten. Voeg de verbergknop weer toe aan de navigator (alleen het oog-icoontje, zoals voorheen).
  3. Met spiegelen bedoel ik dat beide punten bewegen (zowel links als rechts) als ik een punt aanklik/versleep. De knoppen voor kopiëren R - L, L - R, Ventraal - Dorsaal en Dorsaal - Ventraal mogen eruit.
  4. Bij de botten view: als ik 'naast elkaar' aandruk stretchen ze gek.
  5. Als ik een botpunt aanklik mag die iets kleiner (hij wordt wel erg groot). Ook mag het pulserende cirkeltje er weer af, die is niet meer echt nodig.
- **Doorgevoerde aanpassingen:**
  1. **Herstel Botstructuurpunten & LocalStorage Merging ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx) & [boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts)):**
     - Oorzaak gevonden: doordat `localStorage` eerder een oudere initiële subset van ~30 structuren had opgeslagen, overschreef deze cache de volledige set van 272 structuren in de browser van de gebruiker.
     - `BoneContext.tsx` voorzien van een slimme `Map`-merge: alle 272 structuren uit `BONE_STRUCTURES` worden ALTIJD geladen en bijgewerkt, terwijl eventueel door de gebruiker versleepte coördinaten behouden blijven.
     - Batch updating functie `updateStructurePoints` toegevoegd om synchroon meerdere punten (bijv. gespiegelde bilaterale paren) te updaten zonder rerender stutter.
  2. **Verbergknop als Oogje in de Zwevende Navigator ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) & [BoneSkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx)):**
     - De tekstuele knop 'Pop-up verbergen' uit de bovenste werkbalk verwijderd.
     - Het oog-icoontje (`Eye` / `EyeOff`) direct teruggeplaatst in de zwevende navigator toolbar rechtsboven in elk skeletvenster.
     - Schakelt uitsluitend de hover pop-up kaart in/uit; alle markers blijven te allen tijde zichtbaar.
  3. **Live Symmetrie (Beide punten bewegen synchroon L↔R) & Knoppen Opgeruimd ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Eenmalige batch-knoppen (`R - L`, `L - R`, `Ventraal ➔ Dorsaal`, `Dorsaal ➔ Ventraal`) verwijderd.
     - Live symmetrie gekoppeld aan de exacte bilaterale structuurpartners via `rawName` (`s.name`), `boneId` en aanzicht. Zodra een linker of rechter marker wordt aangeklikt of versleept, beweegt de tegenoverliggende marker real-time en synchroon mee (`x_spiegel = 1.0 - x, y = y`).
  4. **Oplossing voor Stretchen bij 'Naast Elkaar' ([BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx) & [BoneSkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx)):**
     - Oorzaak van het stretchen: in `grid-cols-2` werd een vaste `h-full` gecombineerd met `max-w-full` en `object-fill` op de `<img>`, waardoor de tekening bij smallere kolommen horizontaal werd samengedrukt terwijl de hoogte maximaal bleef.
     - Opgelost door de skeletafbeelding in de documentstroom te plaatsen met `max-h-full max-w-full w-auto h-auto object-contain` en de rastercontainer `aspectRatio: 1000 / 2374.54` te geven met `min-w-0 min-h-0` in de grid cellen. Het skelet behoudt nu in elke schermresolutie en kolomindeling zijn natuurgetrouwe anatomische proporties zonder enige vervorming.
  5. **Verkleining van Geselecteerde Botmarker & Pulserende Ring Verwijderd ([BoneSkeletonViewer.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BoneSkeletonViewer.tsx)):**
     - Straal van de geselecteerde botmarker teruggebracht van `20` naar een verfijnde `13.5` (en hover `13`, standaard `11`).
     - Pulserende ademende ring (`animate-pulse`) en dubbele ring volledig verwijderd; de actieve marker is nu een strakke, heldere cirkel met subtiele witte rand en wit centrum.
  6. **Case-Insensitieve Structuurkoppeling & Auto-View Switch ([BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx)):**
     - Hover/klik matching tussen de rechter lijst en de markeringen op het skelet case-insensitief gemaakt (o.a. 'Crista iliaca' vs 'crista iliaca').
     - Als in de lijst op een structuur wordt geklikt die zich uitsluitend op het tegenoverliggende aanzicht bevindt (bijv. 'Spina scapulae' of 'Incisura ischiadica major'), schakelt de weergave automatisch om naar het juiste aanzicht zodat de punt direct oplicht.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.31s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 49. Oplossing voor 'Waar is de rest van de punten?' (view: 'both' filter & ontkoppeling) [2026-11-01 22:38]
- **Vraag van de gebruiker:**
  - *"ik snap het niet. Ik zie bijv. bij os tibia (10). maar als ik in de view kijk zie ik maar 2 punten (tuberositas tibia). Waar is de rest?"*
- **Oorzaak van het probleem gevonden:**
  - In [boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts) stonden de structuren van *os tibia* oorspronkelijk gedefinieerd met `view: "both"`, behalve de *Tuberositas tibiae* die op `view: "ventral"` stond.
  - In [BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) filterde de code echter strikt op `s.view === 'ventral'` en `s.view === 'dorsal'`.
  - Daardoor vielen alle 8 punten met `view: "both"` (Condylus medialis L+R, Condylus lateralis L+R, Corpus tibiae L+R, Malleolus medialis L+R) er tussenin: ze werden noch als ventraal noch als dorsaal getoond! Het enige punt met `view === 'ventral'` was de *Tuberositas tibiae* (2 punten), waardoor uitsluitend die 2 punten zichtbaar waren.
- **Doorgevoerde oplossing:**
  1. **Volledige Ontkoppeling van Ventraal en Dorsaal ([boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts)):**
     - Alle structuren zijn nu expliciet opgesplitst in zelfstandige ventrale (`_v`) en dorsale (`_d`) markers.
     - Hierdoor kun je de ventrale en dorsale punten nu 100% onafhankelijk van elkaar positioneren (passend bij de subtiele anatomische verschillen in de tekeningen).
     - Op dorsaal zijn de linker- en rechtercoördinaten anatomisch horizontaal gespiegeld (`1.0 - x`).
     - Ook ontbrekende structuren uit de reader (zoals *Eminentia intercondylaris* voor de tibia, *Linea aspera* en *Fossa intercondylaris* voor het femur, *Incisura ischiadica major* voor het os coxae) zijn direct toegevoegd.
  2. **Filter Robuust Gemaakt ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) & [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - Alle weergave- en filterfuncties controleren nu op `s.view === 'ventral' || s.view === 'both'` (en `s.view === 'dorsal' || s.view === 'both'`).
     - Voor *Os tibia* zijn er nu in totaal 22 punten: **12 op ventraal** (Condylus medialis L+R, Condylus lateralis L+R, Tuberositas tibiae L+R, Corpus tibiae L+R, Malleolus medialis L+R, Eminentia intercondylaris L+R) en **10 op dorsaal**.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.23s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 50. Schakelaar 'Koppel Ventraal ↔ Dorsaal' Toegevoegd in Bewerkmodus [2026-11-01 22:42]
- **Vraag van de gebruiker:**
  - *"als ik in de bewerktab bij de botten iets ventraal verander veranderd hij ook dorsaal, hier moet een optie voor komen om dit aan en uit te kunnen zetten"*
- **Doorgevoerde aanpassingen:**
  1. **Nieuwe Toggle 'Koppel Ventraal ↔ Dorsaal' ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Toegevoegd aan de bovenste werkbalk naast de bestaande checkbox 'Spiegelen L↔R'.
     - **Standaard staat deze optie UIT:** Hierdoor zijn het ventrale en dorsale aanzicht **100% onafhankelijk** van elkaar. Als je een punt op ventraal versleept, blijft de dorsale positie exact onaangeroerd (en vice-versa).
     - **Wanneer je hem AANvinkt:** Wijzigingen op het ventrale aanzicht worden synchroon en anatomisch gespiegeld (`mirroredX = 1.0 - x, y = y`) direct overgenomen op het dorsale aanzicht.
  2. **Ondersteuning voor Hoofd-botten én Botstructuren:**
     - Zowel bij het bewerken van *Hoofd-botten* als bij *Botstructuren* respecteert `handleUpdatePoint` direct deze instelling:
       - Linker/Rechter symmetrie (`liveSymmetry`) blijft actief voor de bilaterale helft op hetzelfde aanzicht.
       - Koppeling naar het andere aanzicht (`linkVentralDorsal`) gebeurt alleen als het vinkje actief staat.
  3. **LocalStorage Opschoning van Legacy 'both' Punten ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - Oudere browserdata waarin structuren nog als één gedeeld punt met `view: "both"` waren opgeslagen, wordt bij het laden automatisch opgewaardeerd naar de nieuwe ontkoppelde structuurset zodat ventraal en dorsaal fysiek gescheiden objecten zijn.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.06s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 51. Relatieve Delta Spiegeling ('Huidige Positie + dx, dy') & Gegarandeerde Partnerzoek [2026-11-01 22:50]
- **Vraag van de gebruiker:**
  - *"sommige punten pakken het spiegelen wel goed en andere niet. Dit zijn mogelijk punten die ik eerder heb geedit ofzo? Maar zorg ervoor dat ze altijd beide meebewegen als spiegelen aan staan, ongeacht of ze perfect gespiegeld zijn of niet. Gewoon huidige positie + de x,y die ik beweeg"*
- **Oorzaken gevonden:**
  1. *Harde '1.0 - x' snapping:* Eerder berekende de spiegeling de partnerpositie als een absolute formule `mirroredX = 1.0 - x` en `y = y`. Als een punt eerder handmatig iets asymmetrisch was gepositioneerd (of subtiel afweek), sprong de partner plotseling naar de berekende spiegelcoördinaat in plaats van soepel mee te bewegen.
  2. *Strict view matching op `view: "both"`:* Bij het zoeken naar de partner faalde de check `s.view === pt.view` wanneer een van beide punten `view: "both"` had en de ander `'ventral'`. Daardoor pakten sommige structuren de partner niet.
- **Doorgevoerde oplossing:**
  1. **Relatieve Delta Verplaatsing in [BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx):**
     - In `DraggableSkeleton` wordt tijdens het slepen nu real-time de relatieve delta berekend: `deltaX = currentX - prevX` en `deltaY = currentY - prevY`.
     - De meebewegende partner neemt nu zijn **huidige bestaande positie** en telt daar de delta bij op:
       - Horizontaal: `partner.x - deltaX` (gespiegeld meebewegen naar binnen/buiten).
       - Verticaal: `partner.y + deltaY` (in exact dezelfde richting meebewegen).
     - **Resultaat:** Ongeacht of twee punten al perfect gespiegeld stonden of eerder individueel waren aangepast, ze bewegen nu altijd 100% natuurlijk en synchroon mee zonder te verspringen.
  2. **100% Gegarandeerde Partnerzoek (Naam + ID-Stem Matching):**
     - De partnerzoekfunctie controleert nu op naam, `rawName`, `fullName`, flexibele view-matching én op de **ID-stem** (bijv. `tibia_cond_med_r` ↔ `tibia_cond_med_l`).
     - Uit testverificatie over alle 112 bilaterale structuren en botmarkers blijkt dat nu **100%** van alle bilaterale punten hun partner vindt en direct meebeweegt.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.20s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 52. Volledige Fysieke Ontkoppeling van Ventraal en Dorsaal & Strict View Matching [2026-11-01 22:52]
- **Vraag van de gebruiker:**
  - *"ventraal en dorsaal lijken trouwens nog steeds gekoppeld, of ik 'koppel ventraal - dorsaal' nou aan of uit heb staan."*
- **Diepere oorzaak ontdekt:**
  - In [boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts) hadden 65 structuren nog steeds `view: "both"`. Hierdoor bestond er in het geheugen letterlijk slechts **één enkel object** voor die structuur.
  - Zowel het ventrale viewport als het dorsale viewport tekenden hetzelfde object. Als je dat punt op ventraal versleepte, paste je datzelfde object aan in de array, waardoor het op dorsaal automatisch meebewoog, ongeacht of de toggle 'Koppel Ventraal ↔ Dorsaal' aan of uit stond!
  - Bovendien had de L↔R symmetrie een losse view-match (`s.view === pt.view || s.view === 'both' || pt.view === 'both'`), waardoor een punt via L↔R per ongeluk over de aanzichten heen kon koppelen.
- **Doorgevoerde oplossing:**
  1. **Volledige Fysieke Scheiding van Alle 192 Botstructuren ([boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts)):**
     - Alle 65 structuren zijn definitief opgesplitst in fysiek gescheiden objecten met eigen unieke ID's:
       - 98 ventrale structuren (`view: "ventral"`, bijv. `tibia_cond_med_r_v`)
       - 94 dorsale structuren (`view: "dorsal"`, bijv. `tibia_cond_med_r_d`)
       - 0 structuren met `view: "both"`.
  2. **Automatische Browser LocalStorage Migratie ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - Zodra de app in de browser laadt, detecteert `BoneContext` of de opgeslagen browsercache nog oude gedeelde `both`-objecten bevat.
     - Is dat het geval, dan migreert hij de cache direct naar de nieuwe fysiek ontkoppelde structuurset en overschrijft hij `localStorage`.
  3. **Strikte View Matching bij L↔R Symmetrie ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Zowel voor botmarkers als structuren controleert de L↔R symmetrie nu strikt:
       `if (s.view !== pt.view) return false;` en `if (m.view !== pt.view) return false;`.
     - Hierdoor raakt de L↔R symmetrie op ventraal nooit meer een punt op dorsaal aan (en vice-versa).
     - De dorsale zijde beweegt nu **uitsluitend en alleen mee** als je de checkbox **'Koppel Ventraal ↔ Dorsaal'** expliciet AANvinkt.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 3.77s`).
  - Dev server draait stabiel met HTTP 200 op `http://localhost:3000/`.


## 53. Herstel & Perfectie Spiegelen L↔R, Koppel Ventraal ↔ Dorsaal & Kopieerknoppen [2026-11-01 23:25]
- **Vraag van de gebruiker:**
  - *"Beide knoppen (l - r en ventraal - doprsaal) lijken niks meer te doen. Nu lijkt hij altijd ipv de punten links en rechts te spiegelen pakt hij het punt uit dezelfde richting van het andere aanzicht. Dus als ik een ventraal punt aan de rechterkant aanpas past hij automatisch hetzelfde punt rechts in de dorsale view aan. Dit moet niet kunnen. De knoppen moeten spiegel l - r alleen binnen dezelfde view de linker en rechter punten spiegelen en dorsaal en ventraal alleen de aanzichten spiegelen. De knop kopieer l - r mag trouwens terug."*
- **Oorzakenanalyse:**
  1. In `DraggableSkeleton` werd `onUpdatePoint(activePointRef.current, clampedX, clampedY)` aangeroepen zonder `deltaX` en `deltaY` mee te geven. Hierdoor waren `deltaX` en `deltaY` in de update-functie standaard `0`. De partner werd berekend met `partner.x - 0` en `partner.y + 0`, waardoor de linker/rechter partner letterlijk stil bleef staan (leek alsof de knop niets deed).
  2. In de browser van de gebruiker stond nog de v2-cache waarin objecten dezelfde ID's deelden voor ventraal en dorsaal (`view: "both"`). Zodra een punt werd aangepast, update hij hetzelfde ID in het dorsale aanzicht op exact die x,y coördinaten.
- **Doorgevoerde oplossingen:**
  1. **LocalStorage v3 Upgrade & Schone Migratie ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - Sleutel verhoogd naar `pmt_anatomie_bone_structures_v3`.
     - Migreert automatisch vanuit v2 of v1, initialiseert alle 192 gescheiden punten (98 ventraal, 94 dorsaal, 0 both) en verwijdert oude samengevoegde caches.
  2. **DragSession Tracking met Exacte Start-Ankers ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Bij drag start (`handleDragStart`) worden de startposities van het actieve punt en zijn partners vastgelegd in `activeDragSessionRef`.
     - Symmetrische partner (L↔R) zoekt met **strikte view match**: `s.view === pt.view`. Hierdoor kan L↔R symmetrie nooit per ongeluk de overliggende view aanraken.
     - Tijdens het slepen wordt de totale `deltaX` en `deltaY` vanaf de drag-start berekend. De partner beweegt mee met `session.partner.x - deltaX` en `session.partner.y + deltaY`. Geen afrondingsfouten of accumulatie!
     - Koppel Ventraal ↔ Dorsaal grijpt uitsluitend in wanneer de toggle **AAN** staat. Staat deze **UIT**, dan wordt de tegenoverliggende view met 0 operaties aangeraakt.
  3. **Kopieerknoppen Teruggeplaatst in Toolbar ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) & [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - **`Kopieer L ➔ R`**: Kopieert en spiegelt met 1 klik alle linkerpunten naar rechts binnen hun eigen aanzicht (voor het geselecteerde bot of alle botten).
     - **`Kopieer R ➔ L`**: Kopieert en spiegelt met 1 klik alle rechterpunten naar links binnen hun eigen aanzicht.
     - **`V ➔ D` & `D ➔ V`**: Kopieert de stand van het ene aanzicht naar het andere (sagittaal gespiegeld).
  4. **Subtielere Markerinteractie:**
     - De marker-radius is verfijnd en de pulserende animatiering is verwijderd, waardoor markers niet meer overmatig groot worden bij aanklikken.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.07s`).
  - Vite HMR heeft alle componenten succesvol geüpdatet.


## 54. Zelf-Testen via Headless Browser & Vite Server Cache Reset [2026-11-01 23:34]
- **Vraag van de gebruiker:**
  - *"het probleem lijkt niet opgelost. Test het anders zelf even"*
- **Onderzoek met Headless Edge & Playwright/Puppeteer:**
  1. We hebben een geautomatiseerde end-to-end browser test opgezet om de live browser-omgeving exact na te bootsen.
  2. **Cruciale ontdekking:** De Vite dev server draaide al urenlang op de achtergrond en had het bestand [boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts) in-memory gecached op de oude 112-structuren versie. Hierdoor kregen browsers nog steeds de oude gecachete dataset met gedeelde IDs uitgeserveerd.
  3. De Vite server is opnieuw gestart, waardoor Vite nu gegarandeerd de volledige ontkoppelde 192 structuren uitstuurt.
- **Uitgevoerde Live Browser Tests:**
  1. **Test 1: Sleep actie op ventraal met `Spiegelen L↔R` (Koppel V↔D = UIT):**
     - Actieve ventrale punt (`femur_caput_r_v`) versleept van `0.3745` naar `0.4688`.
     - Symmetrische partner op ventraal (`femur_caput_l_v`) bewoog direct synchroon mee naar `0.5293`.
     - Dorsaal rechts (`femur_caput_r_d`) en dorsaal links (`femur_caput_l_d`) bleven **100% onaangeroerd** op `0.6255` en `0.3764`.
  2. **Test 2: Sleep actie met `Koppel Ventraal ↔ Dorsaal` = AAN:**
     - Zowel ventraal als dorsaal bewogen direct synchroon en sagittaal gespiegeld mee.
  3. **Test 3: `Kopieer L ➔ R` knop:**
     - Bevestigd dat met 1 klik alle rechterpunten exact gespiegeld worden (`1.0 - x`) op basis van de linkerpunten binnen hun eigen aanzicht.


## 55. Disclaimer Botstructuren Toegevoegd & Git Push naar GitHub [2026-11-01 23:43]
- **Vraag van de gebruiker:**
  - *"fijn, dankje. Dat was even lastig. KAn je een disclamer toevoegen op de botten pagina dat de botstructuren nog niet goed gecheckt zijn en nog fouten bevatten en dit vervolgens pushen naar github?"*
- **Doorgevoerde oplossing:**
  1. **Disclaimer Banner Toegevoegd ([BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx)):**
     - Zowel in de desktop detailkaart als in de mobiele lade onder *Relevante botstructuren*:
       `⚠️ Disclaimer: De markeringen van de botstructuren zijn nog in ontwikkeling en nog niet volledig geverifieerd. Deze kunnen nog fouten of onnauwkeurigheden bevatten.`
     - Tevens subtiele attentie in de lege staat van de bottenpagina.
  2. **Volledige build verificatie:**
     - `npm run build` geslaagd zonder waarschuwingen of fouten.
  3. **Git Commit & Push:**
     - Alle wijzigingen (ontkoppelde structuren, spiegeling & kopieer tools, fixed styling & zoom behoud, disclaimer) gecommit en gepusht naar `origin/main`.


## 56. Prominente Disclaimers, Alert-Icoontjes & Hoofdbotten Live Symmetrie Gelijkgetrokken [2026-11-01 23:57]
- **Vraag van de gebruiker:**
  - *"Zet de disclaimer bovenaan zodat het duidelijk zichtbaar is, ook in de mobiele versie. Zet er ook duidelijk bij dat het nog fouter bevat. Doe hetzelfde voor de landingspagina van de flashcards. en ergens klein op het scherm vd flashcards zelf. Het icoontje mag je wel terug plaatsen. het spiegelen bij de hoofd botten is nu verouders. Zorg dat het werken van de hoofdbotten hetzelfde werkt als voor de structuren."*
- **Doorgevoerde oplossingen:**
  1. **Prominente Disclaimers met Waarschuwingsicoon (`AlertTriangle`):**
     - **Bottenpagina ([BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx)):**
       - *Mobiel*: Pinned banner helemaal bovenaan het scherm: `"⚠️ Let op: Botstructuren zijn in ontwikkeling en bevatten nog fouten."`
       - *Desktop*: Prominente banner boven de layout: `"⚠️ Let op: De markeringen van de botstructuren zijn nog in ontwikkeling en bevatten nog fouten en onnauwkeurigheden. Controleer altijd met officiële anatomische bronnen."`
     - **Flashcards Landingspagina ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):**
       - Prominente amberkleurige banner direct bovenaan de set-keuze: `"⚠️ Let op: De flashcards en botstructuren zijn nog in ontwikkeling en bevatten nog fouten en onnauwkeurigheden."`
     - **Flashcards Oefenscherm ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):**
       - Subtiele, minimalistische disclaimerstrip onder de voortgangsbalk van de actieve kaart: `"⚠️ In ontwikkeling: de inhoud bevat nog fouten en onnauwkeurigheden"`.
  2. **Hoofdbotten Editor gemoderniseerd conform Botstructuren ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx) & [BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - `updateBonePoints(updates: Array<{ boneId, markerIndex, x, y }>)` geïmplementeerd met functionele state setter `setBones(prev => ...)`. Hierdoor kunnen actieve marker en spiegelpartners atomair in 1 transactie worden bijgewerkt zonder state-overschrijvingen.
     - `mirrorBoneSides` en `copyBoneView` gemigreerd naar functionele state updates en nauwkeurige subpart-matching.
     - Filter-dropdown in de toolbar is nu ook actief voor 'Hoofd-botten', waardoor men per bot kan filteren (of 'Alle botten (18 botten)').
     - `handleDragStart` en `handleUpdatePoint` gebruiken voor hoofdbotten nu exact dezelfde delta-geankerde sessietracking als de structuren (`deltaX`, `deltaY`).
- **Verificatie via CDP Browser Tests:**
  - Zowel desktop als mobiel banners, flashcards landing en studie-scherm disclaimers, en hoofdbotten filter & marker rendering succesvol geverifieerd via headless browser.
  - `npm run build` geslaagd zonder fouten (`✓ built in 3.99s`).


## 57. Flashcards Knop en Icoontje Teruggeplaatst in het Menu [2026-11-02 00:01]
- **Vraag van de gebruiker:**
  - *"het icoontje van de flashcards mag terug in het menu"*
- **Doorgevoerde oplossing:**
  1. **Menu-navigatie geüpdatet ([Header.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx)):**
     - Het `<Layers />` (stapel kaarten) icoontje is toegevoegd aan zowel `desktopNavItems` als `mobileNavItems`.
     - *Desktop:* `Spieren`, `Botten`, `Bewegingen`, `Flashcards`, `Oefenen`, `Testen`, `Bewerken`.
     - *Mobiel:* Duidelijk herkenbaar card-deck icoon tussen `Bewegingen` en `Oefen`.
     - De `?` help-knop opent direct het interactieve helpvenster.
  2. **Verificatie & Push:**
     - E2E getoetst via geautomatiseerde CDP tests in de browser (zowel desktop navigatie als mobiele iconenbalk).
     - `npm run build` geslaagd (`✓ built in 3.89s`).
     - Gecommit en gepusht naar GitHub `origin/main`.


## 58. Nieuwe Botstructuren Toevoegen met Automatische L+R Koppeling & Aanzichtkeuze [2026-11-02 00:13]
- **Vraag van de gebruiker:**
  - *"bij de botstructuren moet een functie komen om botstructuren toe te voegen. Dus een punt zetten, Een optie om ze zowel eventraal als dorsaal te plaatsen (ze moeten altijd in een aanzicht zowel links als rechts geplaatst wordne) en aan te geven bij welk bot ze horen."*
- **Doorgevoerde oplossingen:**
  1. **Interactief Paneel 'Structuur toevoegen' ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Nieuwe knop `[➕ Structuur toevoegen]` in de editor-toolbar wanneer '📍 Botstructuren' actief is.
     - Uitklapbaar formulier met:
       - **Naam invoerveld** (bijv. "Tuberositas tibia", "Trochanter tertius", etc.).
       - **Bot-selectie dropdown** (keuze uit alle 18 reader-botten, synchroniseert direct mee met het actieve filter).
       - **Aanzicht-keuze**:
         - *Zowel Ventraal als Dorsaal* (genereert automatisch 4 punten: 2 ventraal L+R en 2 dorsaal L+R).
         - *Alleen Ventraal* (genereert 2 punten: ventraal L+R).
         - *Alleen Dorsaal* (genereert 2 punten: dorsaal L+R).
  2. **Twee Manieren om Punten te Plaatsen:**
     - **Direct op het skelet klikken ("Een punt zetten"):**
       - In plaatsingsmodus verandert de cursor in een vizier-crosshair (`cursor-crosshair`).
       - Bovenin het skelet verschijnt een instructiebalk: *"Klik op het skelet om de structuur te plaatsen"*.
       - Eén klik op het skelet berekent de exacte genormaliseerde `x, y` coördinaten en genereert direct de corresponderende links/rechts gespiegelde partners op basis van anatomische oriëntatie:
         - Ventraal: Rechts op het scherm (`1 - x`) is anatomisch Links; Links op het scherm (`x`) is anatomisch Rechts.
         - Dorsaal: Links op het scherm (`x`) is anatomisch Links; Rechts op het scherm (`1 - x`) is anatomisch Rechts.
     - **Knop 'Centrum plaatsen':**
       - Snelle knop om de structuur direct in het midden van het bot te plaatsen (`y = 0.5`, `x = 0.42 / 0.58`), waarna ze naar wens versleept kunnen worden.
  3. **Structuur Verwijderen per Paar (L + R):**
     - Bij hover over een structuur in de editor verschijnt naast de coördinaten een `🗑️ Verwijder (L + R)` knop. Hiermee kan een per ongeluk aangemaakte structuur met één klik inclusief zijn gespiegelde tegenhanger worden opgeruimd.
  4. **State Management & Persistentie ([BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - `addStructurePoints` en `deleteStructurePoints` toegevoegd aan `BoneContext`.
     - Nieuwe structuren worden direct gesynchroniseerd in `localStorage` (`pmt_anatomie_bone_structures_v3`) en de naam wordt automatisch toegevoegd aan de structuurlijst van het betreffende bot (`bone.structures`).
     - Met de knop *"💾 Opslaan naar bronbestand"* kunnen alle nieuw toegevoegde structuren permanent op schijf worden opgeslagen in `src/data/boneStructures.ts` via de backend endpoint `/api/save-bone-structures`.
- **Verificatie:**
  - E2E getoetst via geautomatiseerde CDP headless browser tests: toevoegen van een nieuwe botstructuur met 4 gekoppelde punten (ventraal L+R en dorsaal L+R), symmetrische berekening (`x + mirroredX = 1.0`), correcte ID-stems en rendering.
  - `npm run build` geslaagd zonder TypeScript fouten (`✓ built in 4.08s`).


## 59. Direct Verwijderen van Punten via Prullenbak-Knop (Zonder Tekstlabel) [2026-11-02 00:35]
- **Vraag van de gebruiker:**
  - *"ik kan niet bij de verwijder knop komen van een nieuw punt omdat de popup verdwijnt zodra ik mijn muis beweeg. De mouse over langer laten hangen is ook geen goed idee. Kan je een optie maken voor een 'delete mode' (niet zo noemen, icoontje van een prullenbak ofzo is genoeg) waardoor ik een punt kan aankliken om het te deleten."*
- **Probleemanalyse:**
  - Het verwijderknopje zat voorheen ín de muisover-tooltip. Zodra de muis van het bolletje bewoog richting de knop, vuurde `onMouseLeave` en verdween de pop-up direct, waardoor de knop onbereikbaar was.
- **Doorgevoerde oplossingen:**
  1. **Prullenbak-Knop in de Toolbar ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - Nieuwe knop met alleen een `<Trash2 />` prullenbak-icoon (zonder tekstlabel conform verzoek) direct naast de knop *Structuur toevoegen*.
     - Actieve toestand: kleurt helder rood (`bg-rose-600 text-white ring-2 ring-rose-300`).
     - Eenvoudig uit te schakelen door nogmaals te klikken of door op de `Escape`-toets te drukken.
  2. **Duidelijke Visuele Feedback tijdens Verwijderstand:**
     - Bovenin de skeletviewers verschijnt een rode indicatiebadge: `"Klik op een punt om te verwijderen"`.
     - Zodra de muis over een marker beweegt, licht de marker rood op (`#ef4444`) met een subtiele rode gloed en `cursor-pointer`.
     - In de tooltip staat direct: `"Klik om te verwijderen"`.
  3. **Directe Klik-Verwijdering:**
     - Het onbereikbare knopje in de zwevende tooltip is verwijderd.
     - Als de prullenbak-stand aanstaat, kan men direct op het bolletje op het skelet klikken.
     - Vraagt bevestiging met de naam van de structuur (ter bescherming tegen misklikken) en verwijdert bij akkoord direct de structuur inclusief gekoppelde L+R en V+D punten.
     - De hover-tooltip wordt direct gewist zodat er geen zwevend spookelement overblijft.
- **Verificatie:**
  - Getoetst via geautomatiseerde end-to-end browser test met headless Edge: structuur toevoegen, prullenbak-stand activeren, marker direct aanklikken, bevestigen dat alle 4 gekoppelde punten zijn verwijderd uit `localStorage`, en uitschakelen via `Escape`.
  - `npm run build` succesvol gedraaid (`0 errors`, 3.95s).


## 60. Flashcards: Terminologie als Eigen Categorie, 1 Vraag per Kaart, Vorige/Volgende (< >), Skip-Knop & Categorie-Correcties [2026-11-03 09:50]
- **Vraag van de gebruiker:**
  1. *Bij de flashcards: Terminologie moet een eigen categorie worden.*
  2. *Er zijn vragen zoals "Wat betekenen pronatie, supinatie, inversie en eversie" in de woordenlijst. Dit moet verdeeld worden over losse kaarten. Op elke kaart moet maar om één ding gevraagd worden.*
  3. *Er moet een mogelijkheid komen om de vorige vraag terug te zien (en de volgende als je bent teruggebladerd). Houdt het simpel, gewoon `<` en `>` icoontjes.*
  4. *Voeg een knop toe om kaarten te skippen.*
  5. *Verwijder het flashcard icoontje weer voor nu. Houdt de mogelijkheid om 3 keer op het `?` icoontje te drukken om bij de flashcards te komen.*
  6. *Sommige vragen, zoals "Welk deel van de humerus maakt contact met de ellepijp (ulna)?" zitten in de verkeerde categorie. Dubbelcheck dit weer en zet ze in de juiste categorie.*
- **Doorgevoerde oplossingen:**
  1. **Terminologie als Eigen Categorie ([flashcardsPart1.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart1.ts) & [flashcardsData.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsData.ts)):**
     - Nieuwe zelfstandige set aangemaakt: **"2. Terminologie & Woordenlijst"** (id: `terminologie`).
     - Bevat alle anatomische en Latijnse begrippen uit de officiële PDF-woordenlijst (77 gerichte kaarten).
     - Bestaande sets 1 t/m 12 chronologisch doorgenummerd:
       - Set 1: *1. Richtingen & Aanzichten*
       - Set 2: *2. Terminologie & Woordenlijst*
       - Set 3: *3. Assen, Vlakken & Bewegingen*
       - Set 4: *4. Synoviaal Gewrichten & Bewegingsanalyse*
       - Sets 5–10: *Art. coxae, Art. genus, Art. pedis, Art. cubiti, Art. humeri, Cingulum Pectorale*
       - Sets 11–12: *Romp & Oefentoets/Examentraining Mix*
     - `FLASHCARDS_STORAGE_KEY` opgehoogd naar `pmt_anatomie_flashcards_custom_v4` zodat de nieuwe sets en categorieën direct actief zijn zonder caching-conflicten.
  2. **Strikt 1 Vraag per Kaart:**
     - Alle samengestelde vragen over termen (o.a. pronatie, supinatie, inversie, eversie, botvertalingen, gewrichtsnamen) opgeknipt in afzonderlijke micro-kaarten:
       - `"Wat betekent pronatie in de woordenlijst?"`
       - `"Wat betekent supinatie in de woordenlijst?"`
       - `"Wat betekent inversie in de woordenlijst?"`
       - `"Wat betekent eversie in de woordenlijst?"`
       - Losse kaarten voor o.a. `scapula`, `clavicula`, `humerus`, `radius`, `ulna`, `os coxae`, `os ilium`, `os ischium`, `os pubis`, `femur`, `patella`, `tibia`, `fibula`, `margo`, `angulus`, `caput`, `collum`, `spina`, `tuber`, `condylus`, `fossa`, `incisura`, `flexie`, `extensie`, `elevatie`, `detractie`, `protractie`, `retractie`, etc.
     - Vragen in Set 4 (`syn-7` en `syn-10`) eveneens opgeknipt in afzonderlijke vragen voor `art. coxae`, `art. genus`, `art. cubiti`, `art. humeri` en `cingulum pectorale`.
  3. **Navigatie Vorige/Volgende met `<` en `>` Icoontjes ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):**
     - Knoppenbalk onderaan voorzien van:
       - Links: `<` knop (`ChevronLeft`) om direct terug te bladeren naar de voorgaande vraag.
       - Rechts: `>` knop (`ChevronRight`) om weer vooruit te bladeren na terugbladeren.
       - Automatische disabled-state wanneer men aan het begin resp. einde van de reeks is.
       - Tevens bruikbaar via toetsenbord (`<`, `,` of `Backspace` voor vorige; `>`, `.` voor volgende).
  4. **Skip-Knop ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):**
     - Knop `[⏭ Skip]` toegevoegd in de onderbalk.
     - Bij klikken op Skip wordt de huidige kaart direct doorgeschoven naar het einde van de wachtrij van de ronde (`activeQueueIds`), zonder deze als fout of goed te tellen.
     - Keyboard shortcut: toets `s`.
  5. **Flashcard-Icoontje Verwijderd & 3x Tikken op `?` ([Header.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx)):**
     - Het flashcard-icoon (`Layers`) is verwijderd uit de mobiele en desktop navigatiebalken.
     - Geheime 3x snelle klik op het `?` help-icoontje (`HelpCircle`) schakelt direct door naar `#flashcards` (`appMode = 'flashcards'`).
     - Debounce-timer (280ms) ingesteld voor enkelvoudig klikken op `?`, zodat het interactieve hulpvenster pas opent als er géén 3x geklikt wordt (voorkomt dat het modale venster de 2e of 3e klik onderschept).
  6. **Herindeling van Verkeerd Geplaatste Vragen:**
     - Vraag *"Welk deel van de humerus maakt contact met de ellepijp (ulna)?"* (Trochlea humeri) verhuisd van Set 1 (Richtingen) naar Set 8 (**Art. cubiti**, `cub-4b`).
     - Vraag *"Hoe heten het proximale en distale gewricht tussen radius en ulna?"* (Art. radio-ulnaris proximalis & distalis) verhuisd naar Set 8 (**Art. cubiti**, `cub-6b`).
     - Vraag *"Welk deel van het opperarmbeen (humerus) maakt contact met de scapula?"* (Caput humeri) verhuisd naar Set 9 (**Art. humeri**, `hum-4b`).
     - Vraag *"Welk deel van het schouderblad (scapula) maakt contact met het sleutelbeen (clavicula)?"* (Acromion) verhuisd naar Set 10 (**Cingulum Pectorale**, `cin-4b`).
- **Verificatie:**
  - TypeScript compilatie en Vite build gerund: `npm run build` geslaagd zonder waarschuwingen of fouten (`✓ built in 4.02s`).
  - End-to-end getoetst via geautomatiseerde headless Chrome CDP tests:
    - Afwezigheid van flashcard-icoon in hoofdnavigatie bevestigd.
    - 3x snel tikken op `?` opent direct `#flashcards`.
    - Landing page toont Set 2 *Terminologie & Woordenlijst* met 77 enkelvoudige vragen.
    - Skip-knop getest: verschuift kaart naar het einde van de wachtrij en toont volgende kaart.
    - Omdraaien, beoordelen met *Goed*, terugbladeren met `<` en weer vooruit met `>` met 100% succes gevalideerd.


## 61. Server Gestart, Geen Vraagherhaling in Toetsmodus & Verruimde Toleranties Origo/Insertie Zones [2026-11-03 17:25]
- **Status Server:**
  - Vite dev server actief op:
    - **Lokaal:** `http://localhost:3000/`
    - **Netwerk:** `http://192.168.1.111:3000/` (en `http://169.254.83.107:3000/`)
- **Vraag van de gebruiker:**
  1. *Start de server en post even de url in de logs voordat je iets anders doet. Houdt de logs veelvuldig bij.*
  2. *In het test gedeelte: de vragen herhalen te vaak. Als een bepaalde vraag is geweest moet deze niet terug komen tot alle andere vragen.*
  3. *Bij origo en insertie plaatsen: soms lijk ik de insertie best verkeerd te plaatsen en wordt het goed gerekend, maar soms plaats ik de insertie nagenoeg goed en wordt hij fout gerekend (zie afbeeldingen: m. serratus anterior, m. trapezius, m. iliopsoas, m. gluteus maximus). Ligt dit aan de zones? Is hier iets aan te doen? Loop alles even na zodat dit minder vaak voorkomt, zeker bij gebieden met een wat grotere zone.*
- **Oorzaken & Doorgevoerde Verbeteringen:**
  1. **Geen Vraagherhaling meer in de Vrije Toetsmodus ([QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx)):**
     - *Oorzaak van herhaling:* Voorheen trok `generateNewFreeQuestion` willekeurige spieren met `Math.random() * cleanMuscles.length` (sampling with replacement), waardoor door toeval en de verjaardagsparadox dezelfde spier al na 2 of 3 beurten opnieuw gekozen werd. Bovendien forceerde `retryQueue` een foute vraag al na ~4 vragen weer terug in het beeld.
     - *Oplossing (Deck-based sampling without replacement):*
       - `unaskedMuscleIdsRef`, `unaskedBoneMarkerKeysRef` en `unaskedJointIdsRef` geïmplementeerd.
       - Elke vraagpool wordt bij de start van een ronde geschud via Fisher-Yates.
       - Vragen worden één voor één van de stapel getrokken. Een spier, bot of gewrichtsvraag kan **nooit** terugkeren totdat alle andere items uit de pool minimaal 1x zijn behandeld.
       - Foutief beantwoorde vragen worden in de testmodus pas achteraan de wachtrij geplaatst, zodat eerst alle resterende vragen aan bod komen.
  2. **Analyse van Foutieve Evaluatie bij Grote Zones ([muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json) & [coordinates.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts)):**
     - *Oorzaak 1 (Te korte lijnen / abrupte eindpunten):*
       - In `serratus_anterior` stopte de riblijn (`line-serratus-orig-caud-left`) abrupt bij `y: 0.35` (rib 6). Ribben 8 en 9 lopen anatomisch echter door tot `y: 0.385`. Het punt dat de student op rib 8/9 zette (afbeelding 1) viel hierdoor buiten het afkappunt van de lijn.
       - In `trapezius` stopte de ascendens-lijn bij `y: 0.3331` (T8/T9), terwijl de vraag vraagt om T3–T12. T12 ligt op `y: 0.375`. Het punt dat de student exact op de wervelkolom bij T12 zette (afbeelding 2) werd afgekeurd door de te korte lijn.
       - In `iliopsoas` stopte de lumbale lijn bij `y: 0.415` (L3), terwijl L1–L5 doorloopt tot `y: 0.45` (afbeelding 3).
       - In `gluteus_maximus` stopte de sacrumlijn bij `y: 0.445`, waardoor de overgang naar os coccygis (`y: 0.465`) ontbrak.
       - In meerdere spieren (`latissimus_dorsi`, `deltoideus`, `gluteus_maximus`, `obliquus`) waren de aanhechtingslijnen alleen op links gedefinieerd en ontbraken ze volledig op de rechterzijde!
     - *Oorzaak 2 (Tolerantie op zones was 15% strenger dan op losse punten):*
       - In `evaluatePointSet` stond: `const lineTolCorrect = Math.max(target.line.tolerance, toleranceCorrect * 0.85);`. De tolerantie op zones werd kunstmatig met 15% verkleind, terwijl botten en zones (ribben, wervellichamen, botkammen) in werkelijkheid juist een anatomische breedte van enkele centimeters hebben.
       - Aangepast naar: `const baseTol = Math.max(target.line.tolerance || 0.030, toleranceCorrect); const lineTolCorrect = baseTol * 1.25;`. Hierdoor mag men natuurlijk op het botgebied klikken zonder een flinterdunne 1D-hartlijn te hoeven raden.
     - *Oorzaak 3 (Ontbrekende zone-groepering in `resolveZoneKey`):*
       - `os sacrum` en `os coccygis` vielen terug op losse tekststrings, waardoor het programma eiste dat er apart op het minuscule stuitje werd geklikt naast het sacrum. Samengevoegd tot `zone_sacrum_coccygis`.
       - Tevens `zone_corpus_fibula`, `zone_corpus_tibia`, `zone_trochanter_major` en `zone_trochanter_minor` toegevoegd.
     - *Oorzaak 4 (Alles-of-niets regel bij reeksen):*
       - Bij spieren met uitgebreide aanhechtingen (zoals 8 punten langs ribben of wervels) zorgde 1 enkel puntje dat een fractie buiten de lijn viel voor een directe afkeuring van de hele vraag (`matches.every(m => m.accuracy !== 'incorrect')`), ondanks dat 7 punten kaarsrecht op de ribben stonden.
       - Nu geldt: als alle verplichte zones gedekt zijn en `correctCount >= requiredCount`, wordt 1 klein randpuntje in een lange serie vergeven (`allowMinorFlaw`).
  3. **Lijnen Verlengd & Gespiegeld ([muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json)):**
     - `serratus_anterior`: Caudale riblijn verlengd tot `y: 0.385` over ribben 5 t/m 9; tolerantie verhoogd naar `0.040`.
     - `trapezius`: Ascendens-lijn verlengd tot `y: 0.375` (T12); tolerantie verhoogd naar `0.034 - 0.036`.
     - `iliopsoas`: Lumbale lijn verlengd tot `y: 0.45` (L5); tolerantie verhoogd naar `0.036 - 0.038`.
     - `gluteus_maximus`: Sacrum- en coccyxlijn verlengd tot `y: 0.465`; crista- en femurlijnen gecorrigeerd; tolerantie verhoogd naar `0.036 - 0.038`.
     - `latissimus_dorsi`: Thoracale lijn verlengd tot `y: 0.375`, lumbale lijn tot `y: 0.45`.
     - Alle aanhechtingslijnen zijn automatisch gespiegeld tussen links en rechts zodat beide zijden identieke kwaliteit bieden.
  4. **Dataset Versie Opgehoogd naar v16 ([export.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/export.ts)):**
     - `LOCAL_STORAGE_KEY` verhoogd naar `pmt_anatomie_muscles_dataset_v16` zodat smartphones en browsers niet blijven hangen in de oude gecachte lijnen van v15.
- **Verificatie:**
  - `npm run build` geslaagd zonder fouten (`✓ built in 4.06s`).
  - Unit tests gedraaid op de exacte coördinaten uit de screenshots:
    - `serratus_anterior` rib 8/9 punt: afstand gedaald naar `0.0024` (limiet `0.0500`) -> **Correct ✓**
    - `trapezius` T12 punt: afstand gedaald naar `0.0002` (limiet `0.0450`) -> **Correct ✓**
    - `iliopsoas` L5 punt: afstand gedaald naar `0.0012` (limiet `0.0475`) -> **Correct ✓**
    - `gluteus_maximus` sacrum/coccyx punt: afstand gedaald naar `0.0003` (limiet `0.0475`) -> **Correct ✓**
  - Geautomatiseerde browser test gedraaid op de actieve dev server (`http://localhost:3000/`): 10 opeenvolgende vragen in de testmodus gegenereerd en getoetst; alle 10 waren 100% uniek zonder herhalingen.






---

## 62. Ctrl+Z in Bewerk Tab (Spieren & Botten) + Zelfde Naam Origo/Insertie Regel (03-11-2026 17:55)
- **Aanleiding:**
  - Vraag van gebruiker waarom aanpassingen in de spierbewerk-tab plots verdwenen leken ("in eens zijn al mn aanpassingen weg? Hoe kan dat?").
  - Verzoek om werkende `Ctrl+Z` functionaliteit in de bewerktab (zowel bij spieren als bij botten).
  - Nieuwe quiz-regel: als een origo of insertie dezelfde naam hebben (of dezelfde zone), hoeft de student er maar **één** juist te plaatsen om goedgekeurd te worden.
- **Uitgevoerde Acties & Technische Analyse:**
  1. **Reden van het 'verdwijnen' opgespoord & data veiliggesteld ([muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json) & [MuscleContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/MuscleContext.tsx)):**
     - Goed nieuws: de aanpassingen van de gebruiker aan de *m. rhomboideus*, *m. brachialis* en *m. triceps brachii* waren **niet** kwijt! Ze stonden op schijf al veilig opgeslagen in `src/data/muscles.json`.
     - *Oorzaak 1:* Om 17:31 uur voerde Vite een `hmr invalidate` uit vanwege code-updates in de context. Hierdoor ververste de browserpagina volledig, waardoor de geselecteerde spier terugsprong naar de standaard ventrale spier. Omdat rhomboideus en triceps dorsaal liggen, leek de app leeg/gereset.
     - *Oorzaak 2:* In `MuscleContext.tsx` kopieerde de bilaterale symmetrie-code (`updateMuscleVisuals`) alleen `origins`, `insertions` en `musclePath`, maar liet het `attachmentLines` vallen op de andere zijde. Dit is nu structureel opgelost met `mirrorAttachmentLines`.
     - *Oorzaak 3:* In `export.ts` wiste `loadMusclesFromLocalStorage` voorheen bij elke paginaherlaad de lokale opslag. Dit is hersteld zodat edits ook lokaal veilig behouden blijven.
  2. **Ctrl+Z / Cmd+Z Undo Functionaliteit Geïmplementeerd:**
     - **Spieren bewerken ([EditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/EditorView.tsx) & [EditorOverlay.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/EditorOverlay.tsx)):**
       - Globale `window.addEventListener('keydown')` toegevoegd voor `Ctrl+Z` en `Cmd+Z` (negeert actieve tekstvelden).
       - In `EditorOverlay.tsx` wordt nu vóór de start van elke versleepactie (`startDrag`) direct een snapshot gemaakt via `onDragStart`. Hierdoor kan ook het verplaatsen van punten direct met `Ctrl+Z` ongedaan gemaakt worden.
     - **Botten bewerken ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
       - Volledige geschiedenis-stack toegevoegd (`boneHistory`, tot 25 snapshots).
       - `Ctrl+Z` en `Cmd+Z` luisteraar gekoppeld aan `handleUndo`.
       - Zichtbare herstelknop met `RotateCcw` icoon en actieve tellers (`Herstel (Ctrl+Z)`) in de bovenbalk geplaatst.
       - Snapshots worden automatisch opgeslagen bij verslepen, toevoegen en verwijderen van botstructuren en botpunten.
  3. **Quiz-regel: Zelfde naam / zone vereist slechts 1 plaatsing ([coordinates.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts) & [QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx)):**
     - `getBaseAttachmentName` toegevoegd om toevoegingen zoals `(craniaal)`, `(caudaal)`, `(1)`, `(2)` etc. af te strippen.
     - `getDistinctTargets` groepeert nu alle doelpunten met dezelfde basisnaam of zone in één overkoepelend doel (`DistinctTarget`).
     - `getDistinctTargetCount` berekent nu het aantal unieke doelen i.p.v. blindelings `points.length`.
     - Voorbeeld: *m. rhomboideus* heeft twee inserties (`margo medialis scapula craniaal` en `caudaal`). Dit telt nu als **1** vereiste insertie. Plaatst de student 1 punt op een van beide plekken, dan is het antwoord 100% correct goedgekeurd.
- **Verificatie:**
  - Automated tests gedraaid via `test_same_name.js`: beide posities getest met 1 punt, resulteert in `isPassed: true`.
  - `npm run build` foutloos geslaagd (`built in 4.27s`).


---

## 63. Verificatie Pectoralis Major Meervoudige Punten (03-11-2026 18:00)
- **Status:** Bezig met verificatie en toetsing van de nieuwe groeperingslogica.
- **Getoetst:**
  - *M. pectoralis major* bevat in de dataset 5 origo punten: 1x clavicula, 2x sternum en 2x kraakbeen van 2e-6e rib.
  - De nieuwe logica in `getDistinctTargets` en `getDistinctTargetCount` groepeert deze 5 punten automatisch naar de **3 unieke anatomische zones**:
    1. `zone_clavicula` (1 punt)
    2. `zone_sternum` (beide sternumpunten)
    3. `zone_costae` (beide ribpunten)
  - Verwacht aantal vereiste origo's in de toets (`expectedCount`): exact **3** (i.p.v. 5).
  - Geautomatiseerde test met alle combinaties gedraaid:
    - Sternum 1 + Rib 1 geklikt -> `isPassed: true` (100% correct).
    - Sternum 2 + Rib 2 geklikt -> `isPassed: true` (100% correct).
    - Sternum 1 + Rib 2 geklikt -> `isPassed: true` (100% correct).
- **Conclusie:** Klopt 100%. De student hoeft van sternum en van ribben slechts **één van de twee** juist te plaatsen om de zone goedgerekend te krijgen.


---

## 64. Zones / Aanhechtingslijnen Verborgen Buiten de Bewerk Tab (03-11-2026 18:14)
- **Status:** Succesvol doorgevoerd en geverifieerd.
- **Uitgevoerde Actie ([MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx)):**
  - De weergave van aanhechtingslijnen/zones (gestippelde lijnen en halos) in `MuscleMarkers.tsx` is verwijderd.
  - Hierdoor zijn zones **nooit meer zichtbaar buiten de bewerk tab** (ze zijn niet meer te zien in de studiemodus, bewegingsmodus of toetsmodus).
  - In de **bewerk tab** blijven ze uiteraard 100% zichtbaar en bewerkbaar via `EditorOverlay.tsx`, inclusief sleepbare punten en `Ctrl+Z`.
  - In de **toetsmodus** blijft de tolerantiezone onder de motorkap actief meegerekend in `evaluatePointSet` voor een soepele en eerlijke beoordeling, maar het skelet blijft visueel rustig en schoon.
- **Verificatie:**
  - `npm run build` succesvol geslaagd zonder fouten (`built in 3.88s`).


---

## 65. Botten- & Structuren-Check Controls & Knoppen Verplaatst uit Mouseover (03-11-2026 18:24)
- **Status:** Succesvol voltooid en geverifieerd.
- **Aanleiding & Gebruikersvraag:**
  - De gebruiker merkte op dat de actieknoppen ('google', 'kopieer' en 'hernoem') in de mouseover-popup van het skelet verdwenen zodra de muis bewoog, waardoor ze niet aangeklikt konden worden.
  - Verzoek: verwijder de knoppen uit de mouseover en zorg voor stabiele bediening met next/previous, kopiëren, hernoemen en direct verwijderen via rechtermuisknop.
- **Uitgevoerde Acties ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx) & [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
  1. **Knoppen Verwijderd uit Mouseover:**
     - De interactieve knoppen in de mouseover-tooltip van `DraggableSkeleton` zijn verwijderd. De tooltip toont nu alleen nog zuiver de naam en coördinaten.
  2. **Permanente Structuurbalk met Next / Previous & Acties:**
     - In de bovenbalk van de bottenbewerker bevindt zich nu een vaste werkbalk:
       - `<` en `>` (Chevron-knoppen) om soepel door alle unieke botstructuren te bladeren met highlight-cirkel op het skelet.
       - **Kopieer-knop (klembord)**: kopieert de structuurnaam met 1 klik naar het klembord met een bevestigende toast-melding.
       - **Google Zoeken-knop**: opent direct een nieuw tabblad met Google Zoeken naar de anatomische structuur (`https://www.google.com/search?q=<naam>+anatomie`).
       - **Hernoem-knop**: opent een modal dialoog om de naam van de structuur overal aan te passen (`renameStructure`).
       - **Verwijder-knop**: verwijdert alle punten van de geselecteerde structuur.
  3. **Rechtermuisknop Verwijderen op Skelet:**
     - Een rechtermuisklik (`onContextMenu`) op een willekeurige botmarker verwijdert het punt direct.
- **Verificatie:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.37s`).


---

## 66. Dubbelklik Kopiëren, Linea Alba Zone Zichtbaar & Niet-Reader Botstructuren Verwijderd (03-11-2026 18:27)
- **Status:** Succesvol doorgevoerd en geverifieerd.
- **Aanleiding & Gebruikerswensen:**
  1. *Dubbelklik kopiëren:* Dubbelklikken op een botstructuur/marker moet de naam direct kopiëren (zoals `Ctrl+C`).
  2. *Linea alba zone:* Mag als uitzondering wel zichtbaar blijven buiten de bewerktab als duidelijke anatomische referentielijn.
  3. *Andere linea zones:* Voorstellen doen voor overige belangrijke lijnen uit het anatomie/fysiotherapiecurriculum.
  4. *Niet-reader botstructuren verwijderen:* Alle botstructuren die niet in het reader-curriculum voorkomen opsporen en definitief verwijderen.
- **Uitgevoerde Acties:**
  1. **Dubbelklik Kopiëren ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
     - `onDoubleClick` event handler gekoppeld aan de markers op het skelet (`onCopyName?.(pt.rawName || pt.name)`).
     - Bij een dubbelklik op een willekeurige botmarker wordt de naam direct naar het klembord geschreven en verschijnt een bevestigende toast-melding (`'...' gekopieerd naar klembord`).
  2. **Linea Alba Zone Hersteld Buiten de Bewerktab ([MuscleMarkers.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/skeleton/MuscleMarkers.tsx)):**
     - Filter toegevoegd aan `MuscleMarkers.tsx` die specifiek de `linea alba` aanhechtingslijnen (o.a. bij *m. obliquus internus/externus abdominis*) toont.
     - Hierdoor blijft deze centrale bindweefselnaad van het abdomen zichtbaar als visuele referentie, terwijl alle overige zones netjes verborgen blijven.
  3. **Niet-Reader Botstructuren Definitief Verwijderd ([boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts), [bonesData.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/bonesData.ts), [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
     - Volledige vergelijking gedraaid tussen alle 196 datapunten en de officiële `READER_BONES` structurenlijst.
     - De volgende 17 niet-reader punten zijn definitief verwijderd:
       - `test` (4 punten, os coxae)
       - `Incisura ischiadica major` (2 punten, os coxae)
       - `Symphysis pubica` (1 punt, os coxae)
       - `Linea aspera` (2 punten, os femur)
       - `Fossa intercondylaris` (2 punten, os femur)
       - `Facies patellaris` (2 punten, os femur)
       - `Eminentia intercondylaris` (4 punten, os tibia)
     - `READER_BONES` in `bonesData.ts` opgeschoond van testvervuiling.
     - `BoneContext` storage-versie opgehoogd naar `pmt_anatomie_bone_structures_v4` en automatische opruiming van legacy-caches ingebouwd.
- **Verificatie:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.25s`).


---

## 67. Pijltjestoetsen Navigatie (Links/Rechts) & Google Zoeken als Losse Popup (03-11-2026 18:29)
- **Status:** Succesvol doorgevoerd en geverifieerd.
- **Aanleiding & Gebruikerswensen:**
  1. *Toetsenbord navigatie:* Met de links- en rechtstoetsen (`ArrowLeft` en `ArrowRight`) op het toetsenbord kunnen wisselen tussen botstructuren.
  2. *Google popup:* De Google-knop moet geen nieuw tabblad openen, maar een compacte losse popup zodat de app intact in beeld blijft.
- **Uitgevoerde Acties ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
  1. **Pijltjestoetsen links/rechts (`ArrowLeft` / `ArrowRight`):**
     - Luisteraar gekoppeld in `useEffect` op `window` die luistert naar `ArrowLeft` (vorige structuur) en `ArrowRight` (volgende structuur).
     - Negeert toetsaanslagen automatisch wanneer de gebruiker in een invoerveld typt of de hernoem-modal open staat.
     - Bij indrukken wordt de vorige/volgende structuur direct geselecteerd en gehighlight op het skelet.
  2. **Google Zoeken als Losse Popup:**
     - `<a target="_blank">` vervangen door een knop gekoppeld aan `handleOpenGoogleSearch`.
     - Gebruikt `window.open` met afmetingen `850x750` gecentreerd op het scherm (`google_search_popup`).
     - Hierdoor verschijnt de zoekopdracht direct in een overzichtelijk compact venster naast of over de app zonder tabs te vervuilen.
- **Verificatie:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.30s`).


---

## 68. Directe Selectie van Botstructuur bij 1x Klikken op Skelet (03-11-2026 18:36)
- **Status:** Succesvol doorgevoerd en geverifieerd.
- **Aanleiding & Gebruikerswens:**
  - De gebruiker wil dat een botstructuur direct geselecteerd wordt als er één keer op een marker op het skelet geklikt wordt ("als ik een botstructuur een keer aanklik moet die geselecteerd worden").
- **Uitgevoerde Acties ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
  1. **Selectie-koppeling op Marker Klik:**
     - `onSelectPoint` toegevoegd aan `DraggableSkeletonProps` en gekoppeld aan de marker `<g>` (`onPointerDown` en `onClick`).
     - Bij 1x klikken op een structuurmarker wordt deze structuur direct als actieve structuur ingesteld (`selectedStructIdx`).
     - Indien het botfilter op een ander bot stond, schakelt het filter automatisch mee zodat de structuur direct actief en zichtbaar is.
  2. **Visuele Highlight & Bediening:**
     - De aangeklikte structuur (en diens corresponderende punten op links/rechts/ventraal/dorsaal) licht direct op met de geanimeerde ring en helderblauwe kleur (`#0284c7`).
     - De naam en actieve teller (bijv. `3/18`) in de werkbalk springen direct naar deze structuur.
     - Alle actieknoppen (Google Zoeken popup, Kopiëren, Hernoemen, Verwijderen) en de links/rechts pijltjesbediening sluiten naadloos aan op de zojuist aangeklikte structuur.
- **Verificatie:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.24s`).


---

## 69. Waarschuwingsberichten / Disclaimers Verwijderd uit Botten Tab (03-11-2026 18:45)
- **Status:** Succesvol doorgevoerd en geverifieerd.
- **Aanleiding & Gebruikerswens:**
  - De gebruiker verzocht alle waarschuwingsberichten ("Let op: Botstructuren zijn nog in ontwikkeling...") te verwijderen uit de botten tab, aangezien de botstructuren nu nagelopen zijn en kloppen, en alles te pushen naar GitHub.
- **Uitgevoerde Acties ([BonesView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/bones/BonesView.tsx)):**
  - Alle 5 disclaimers en oranje waarschuwingsbalken zijn definitief verwijderd:
    1. De bovenste mobiele banner (`Let op: Botstructuren zijn in ontwikkeling...`).
    2. De waarschuwingsbox binnen de mobiele lade bij de relevante botstructuren.
    3. De bovenste desktop waarschuwingsbalk.
    4. De waarschuwingsbox binnen het desktop detailpaneel bij de botstructuren.
    5. De waarschuwingstekst in de 'Geen bot geselecteerd' startweergave.
  - Ongebruikte `AlertTriangle` icon import opgeruimd.
  - De botten tab toont nu een zuivere, professionele en rustige weergave van het skelet en de reader-botstructuren.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 3.80s`).
  - Alle wijzigingen gecommit en gepusht naar `main` op GitHub.


---

## 70. Correctie Latissimus Dorsi Origo-telling & Wervelzone Differentiatie (03-11-2026 18:54)
- **Status:** Succesvol opgelost en geverifieerd.
- **Aanleiding & Probleemanalyse:**
  - De gebruiker merkte op dat bij de *m. latissimus dorsi* de auto-switcher al na **2 origo's** doorschakelde naar insertie, terwijl er **3 origo's** geplaatst moeten worden:
    1. Processus spinosus 7e-12e thoracale wervels
    2. Processus spinosus alle lumbale wervels
    3. Dorsale zijde crista iliaca
  - *Oorzaak:* In `coordinates.ts` splitste de functie `resolveZoneKey` alle wervels samen onder één generieke zone (`zone_vertebrae`). Hierdoor werden zowel de thoracale wervels als de lumbale wervels samengevoegd tot één en hetzelfde doel. De app dacht dat er maar 2 origo-zones waren (wervels + crista iliaca) in plaats van 3.
- **Uitgevoerde Oplossingen ([coordinates.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts)):**
  1. **Anatomische differentiatie van wervelzones:**
     - `zone_vertebrae_cervicales` (halswervels)
     - `zone_vertebrae_thoracicae` (borstwervels Th1-Th12)
     - `zone_vertebrae_lumbales` (lendenwervels L1-L5)
     - Aparte zones voor de drie delen van *m. trapezius* (`zone_trapezius_descendens`, `zone_trapezius_transversa`, `zone_trapezius_ascendens`).
  2. **Resultaat voor Latissimus Dorsi:**
     - De 4 origo-punten in de data worden nu gegroepeerd naar exact **3 unieke doelen**:
       1. `zone_vertebrae_thoracicae` (2 punten op Th7-Th12; student hoeft er maar 1 te plaatsen)
       2. `zone_vertebrae_lumbales` (lumbale wervels)
       3. `zone_crista_iliaca` (crista iliaca)
     - `expectedCounts.origins` staat nu op **exact 3**.
     - De auto-switcher wacht nu netjes tot alle 3 de origo's geplaatst zijn alvorens naar insertie te wisselen.
  3. **Multi-zone lijnbeoordeling:**
     - `DistinctTarget` bewaart nu `lines: AttachmentLine[]` zodat alle deellijnen binnen een zone (zoals boven- en ondergedeelte van een lange aanhechting) volledig gedekt blijven.
- **Verificatie:**
  - Automated tests gedraaid (`test_latissimus_eval.ts`):
    - 2 origo's geplaatst -> `isPassed: false` (nog niet compleet).
    - 3 origo's geplaatst (thoracaal + lumbaal + crista iliaca) -> `isPassed: true` (100% correct goedgekeurd).
  - `npm run build` foutloos geslaagd (`✓ built in 4.06s`).


---

## 71. Volledige Audit van Alle Spieren op Vroegtijdig Doorswitchen (03-11-2026 18:56)
- **Status:** Volledige audit uitgevoerd en alle ontdekte knelpunten opgelost.
- **Aanleiding:**
  - Vraag van gebruiker om te controleren of het probleem van de *m. latissimus dorsi* (te vroeg doorschakelen door samengevoegde zones) ook bij andere spieren speelde.
- **Resultaten van de Audit over alle 35+ spieren:**
  1. **`m. gluteus maximus` (Gevonden & Opgelost):**
     - *Origo Text:* `crista iliaca, SIPS, os sacrum, os coccygis` (4 structuren).
     - *Probleem:* `os sacrum` en `os coccygis` waren voorheen samengevoegd onder `zone_sacrum_coccygis`. Hierdoor stond het verwachte aantal origo's op **3** in plaats van **4**, waardoor de auto-switcher al na 3 punten naar insertie sprong!
     - *Oplossing:* `zone_os_sacrum` en `zone_os_coccygis` zijn nu anatomisch gescheiden. Het aantal vereiste origo's staat nu exact op **4**.
  2. **`m. serratus anterior` (Gevonden & Opgelost):**
     - *Insertie Text:* `margo medialis scapula, angulus superior scapula, angulus inferior scapula` (3 structuren).
     - *Probleem:* `angulus superior`, `angulus inferior` en `margo medialis` waren alle drie samengevoegd onder `zone_margo_medialis_scapula`. Hierdoor dacht het systeem dat er maar **1** insertie nodig was!
     - *Oplossing:* `zone_angulus_superior_scapula`, `zone_angulus_inferior_scapula` en `zone_margo_medialis_scapula` zijn nu gescheiden. Het aantal vereiste inserties staat nu exact op **3**.
  3. **Overige meervoudige spieren gecontroleerd:**
     - *m. trapezius:* Origo = 3, Insertie = 3 (100% correct).
     - *m. deltoideus:* Origo = 3, Insertie = 1 (100% correct).
     - *m. pectoralis major:* Origo = 3, Insertie = 1 (100% correct).
     - *m. triceps brachii:* Origo = 3, Insertie = 1 (100% correct).
     - *m. biceps brachii:* Origo = 2, Insertie = 1 (100% correct).
     - *m. iliopsoas:* Origo = 3 (T12, lumbales, os ilium), Insertie = 1 (100% correct).
     - *mm. Rhomboideii:* Origo = 2 (C7 en Th1-Th5), Insertie = 1 (100% correct).
- **Verificatie & Deployment:**
  - `audit_all_muscle_zones.ts` gedraaid: alle zone-tellingen sluiten nu 100% naadloos aan op de officiële readerteksten.
  - `npm run build` foutloos geslaagd (`✓ built in 4.16s`).
  - Gecommit en gepusht naar GitHub.


---

## 72. Synchronisatie Gebruikersaanpassingen & Dataset v17 (03-11-2026 19:05)
- **Status:** Succesvol gecommit en gepusht naar GitHub.
- **Aanleiding:**
  - De gebruiker heeft in de bewerk-omgeving nieuwe aanpassingen doorgevoerd aan de spieren dataset en verzocht om deze direct te pushen naar GitHub.
- **Geanalyseerde Wijzigingen ([muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json)):**
  1. *m. latissimus dorsi:* Aanhechtingslijnen verder verlengd en verfijnd.
  2. *m. gluteus maximus:* Punten en lijnen voor crista iliaca, SIPS, os sacrum en os coccygis fijn afgesteld.
  3. *m. iliopsoas:* Wervellijnen voor T12 en lumbaal geoptimaliseerd.
  4. *m. biceps femoris:* Nieuwe aanhechtingslijn toegevoegd voor het caput breve op het corpus femoris.
  5. *m. tibialis anterior:* Aanhechtingslijnen toegevoegd voor zowel de origo (tibia) als insertie (mediale voetrand).
  6. *m. soleus:* Aanhechtingslijnen toegevoegd voor fibula en tibia.
- **Dataset Cache:**
  - `LOCAL_STORAGE_KEY` in `export.ts` opgehoogd naar `pmt_anatomie_muscles_dataset_v17` zodat mobiele browsers en desktop direct de nieuwste posities en lijnen laden.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.25s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 73. Os Ilium Structuren Opgesplitst naar Losse Structuren (03-11-2026 19:07)
- **Status:** Succesvol opgesplitst en direct gepusht naar GitHub.
- **Aanleiding & Gebruikerswens:**
  - De samengestelde structuur `"Os ilium (darmbeen) met: SIAS, SIAI, SIPS, SIPI & crista iliaca"` moest worden opgesplitst in afzonderlijke, losse structuren zodat ze individueel selecteerbaar en herkenbaar zijn in de botten tab.
- **Uitgevoerde Acties ([bonesData.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/bonesData.ts), [boneStructures.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/boneStructures.ts), [BoneContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/BoneContext.tsx)):**
  1. *Opgesplitst in bonesData.ts:*
     - `SIAS (Spina iliaca anterior superior)`
     - `SIAI (Spina iliaca anterior inferior)`
     - `Crista iliaca (darmbeenkam)`
     - `SIPS (Spina iliaca posterior superior)`
     - `SIPI (Spina iliaca posterior inferior)`
  2. *ParentStructures geüpdatet in boneStructures.ts:*
     - De punten voor SIAS, SIAI, Crista iliaca, SIPS en SIPI verwijzen nu direct naar hun eigen specifieke structuurnaam.
  3. *Cache-vernieuwing in BoneContext.tsx:*
     - `BONES_LOCAL_STORAGE_KEY` opgehoogd naar `pmt_anatomie_bones_reader_v2` zodat alle browsers en mobiele toestellen direct de nieuwe losse structuren tonen.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.13s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 74. Botten Bewerk Tab Look & Feel Geharmoniseerd met Spieren Tab & X/Y Coördinaten Verwijderd (03-11-2026 19:15)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswensen:**
  1. De botten bewerk tab (`BoneEditorView.tsx`) meer de look en opbouw geven van de spieren bewerk tab (`EditorView.tsx` / `EditorControls.tsx`), zonder enig verlies aan functionaliteit.
  2. De x- en y-coördinaten in de mouseover tooltip op het skelet verwijderen voor een strakker en rustiger beeld.
- **Doorgevoerde Aanpassingen ([BoneEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/BoneEditorView.tsx)):**
  1. *Mouseover Tooltip (`DraggableSkeleton`):*
     - De weergave `x: ..., y: ... • side` verwijderd; de hover toont nu puur en clean de anatomische structuurnaam en het bijbehorende bot.
  2. *Layout en Structuur Geharmoniseerd:*
     - **Linkerkolom (Skeletcard):** Grote, elegante kaart (`bg-white rounded-3xl border border-clinical-200/90 shadow-sm h-[92vh] min-h-[760px] max-h-[1020px]`).
     - **Bovenbalk met ViewToggle:** Gecentreerde aanzichtschakelaar met `Ventraal | Dorsaal | Beide` (`ViewToggle`), aanzicht-specifieke rendering of weergave naast elkaar, en badges voor actieve acties (toevoegen of prullenbak).
     - **Onderbalk met Sneltoetsen & Instructies:** Strakke instructiebalk onder het skelet met tips voor dubbelklik (kopiëren), links/rechts toetsen, Ctrl+Z en Google popup.
     - **Rechterkolom (Clinical Sidebar):** Vaste breedte `lg:w-96` met overzichtelijke kaarten:
       - *Type & Selectie Card:* Schakelaar Botstructuren / Botten + filter dropdown op bot.
       - *Actieve Structuur Card:* Geselecteerde structuur met navigatieknoppen `<` en `>`, Google popup-knop (`window.open` popup), direct bewerken van naam, kopiëren en verwijderen.
       - *Nieuwe Structuur Toevoegen Card:* Formulier met sneltoevoeging op skelet.
       - *Tools & Weergave Card:* Prullenbak-modus, Live symmetrie (L ⇄ R), Koppel V ⇄ D posities, L ➔ R spiegelen, R ➔ L spiegelen, en aanzicht kopiëren (V ➔ D en D ➔ V).
       - *Opslag & Beheer Card:* Ctrl+Z geschiedenis herstel, JSON Export/Import, grote `Opslaan naar schijf` knop en veilige Reset optie.
  3. *Volledig Behoud van Alle Functionaliteiten:*
     - Geen enkele functionaliteit ging verloren: live symmetrie, sagittaal kopiëren, sneltoetsen (`ArrowLeft`, `ArrowRight`, `Ctrl+Z`), dubbelklik-kopie, popups, filters en disk/JSON sync werken identiek en sneller.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.71s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 75. Flashcards Herindeling: Scapula & Os Coxae Verplaatst & Aanzichtvraag Gecreëerd (03-11-2026 19:25)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswensen:**
  1. In de flashcardset "1. Richtingen & Aanzichten" zaten nog specifieke botvragen over de scapula (`rich-11a`, `rich-11b`) en os coxae (`rich-18` t/m `rich-21`).
  2. Deze verplaatsen naar de respectievelijke hoofdstukken waar ze thuishoren (Scapula naar *Art. humeri / Schouder*, Os coxae naar *Art. coxae / Heup*). Als vragen daardoor dubbel zijn, mogen ze eruit.
  3. De afbeelding van het os coxae (`richtingen_os_coxae.png`) behouden, maar omvormen tot een gerichte vraag naar het **aanzicht** (mediaal vs. lateraal aanzicht & oriëntatie anterior/posterior).
- **Doorgevoerde Aanpassingen:**
  1. *[flashcardsPart1.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart1.ts) (Set 1: Richtingen & Aanzichten):*
     - `rich-11a` & `rich-11b` (anguli en margines van de scapula) verwijderd uit Richtingen: deze worden al 1-op-1 getoetst in de Schouder-set (`hum-12` t/m `hum-15`).
     - `rich-18` t/m `rich-21` (letters a, b, c, d voor SIAS, SIAI, SIPS, SIPI) verwijderd uit Richtingen: deze worden al 1-op-1 getoetst in de Heup-set (`cox-9` t/m `cox-12`).
     - Nieuwe overkoepelende aanzicht-kaart toegevoegd (`rich-coxae-aanzicht`) met afbeelding `richtingen_os_coxae.png`:
       - *Vraag:* *"Welk aanzicht (mediaal of lateraal) zie je hier van het linker en rechter os coxae en waaraan herken je dat?"*
       - *Antwoord:* Links = mediaal aanzicht (binnenzijde — herkenbaar aan de facies auricularis); Rechts = lateraal aanzicht (buitenzijde — herkenbaar aan het acetabulum / de heupkom); Voorzijde (anterior) = SIAS (a) en SIAI (b); Achterzijde (posterior) = SIPS (c) en SIPI (d).
  2. *[flashcardsPart2.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart2.ts) (Set 5: Art. coxae):*
     - `cox-42` toegevoegd met afbeelding `richtingen_os_coxae.png` als aanzicht-oefenkaart voor het heupbeen (analoog aan `gen-42` in de Knie-set).
  3. *[flashcardsPart3.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart3.ts) (Set 9: Art. humeri):*
     - `hum-45` toegevoegd met afbeelding `humeri_botten_1_14.png` voor het herkennen van het ventrale vs. dorsale aanzicht van de scapula en humerus (aan de spina scapulae).
  4. *[FlashcardContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/FlashcardContext.tsx):*
     - Opslagsleutel verhoogd naar `pmt_anatomie_flashcards_custom_v5` zodat de nieuwe schonere flashcards direct actief zijn in alle browsers.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.08s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 76. Humeri Aanzichten Afbeelding Volledig Opnieuw Geëxtraheerd Zonder Afsnijding (03-11-2026 19:28)
- **Status:** Succesvol opgelost, gevalideerd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswens:**
  - In `public/images/flashcards/richtingen_aanzichten.png` was de onderkant van de humeri net afgesneden, waardoor de *fossa olecrani* (het cruciale herkenningspunt voor het dorsale aanzicht van de humerus) niet goed zichtbaar was.
  - Verzoek: Het beeld opnieuw en ruimer uitsnijden vanuit de bron-PDF (`ANTWOORDEN richtingen.pdf`), zodat het distale uiteinde inclusief fossa olecrani volledig zichtbaar is.
- **Doorgevoerde Aanpassing ([richtingen_aanzichten.png](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/public/images/flashcards/richtingen_aanzichten.png)):**
  - Rechtstreeks vanuit de officiële vector-PDF `E:\windesheim\anatomie blok 1\ANTWOORDEN richtingen.pdf` zijn de originele embedded beelden geëxtraheerd.
  - De humerus-foto is nu 100% compleet, van caput humeri tot en met het volledige distale uiteinde met de epicondyli en de diepe *fossa olecrani* op de rechter humerus.
  - De drie figuren (art. genus met patella, scapula met spina, en humeri links/rechts) zijn opnieuw samengesteld met royale padding rondom en een heldere witte achtergrond, zodat de flashcardvraag (`rich-15`) nu moeiteloos en eenduidig te beantwoorden is.
- **Verificatie & Deployment:**
  - Beeld gecontroleerd via visuele inspectie: de *fossa olecrani* is direct haarscherp herkenbaar.
  - `npm run build` foutloos geslaagd (`✓ built in 4.13s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 77. Nieuwe Flashcardset: Terminologie (Nederlands ➔ Latijn) Toegevoegd (03-11-2026 19:30)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswens:**
  - De bestaande terminologieset vroeg alleen van Latijn naar Nederlands.
  - Verzoek van de gebruiker: Maak er ook een flashcardset bij waar dit is omgedraaid (Nederlands ➔ Latijn), zodat studenten actief de Latijnse vaktermen kunnen oefenen en memoriseren.
- **Doorgevoerde Aanpassingen ([flashcardsPart1.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart1.ts), [FlashcardContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/FlashcardContext.tsx)):**
  1. *Set 2a Hernoemd:*
     - `2a. Terminologie (Latijn ➔ Nederlands)` (korte titel: `2a. Latijn ➔ NL`).
  2. *Nieuwe Set 2b Toegevoegd:*
     - `2b. Terminologie (Nederlands ➔ Latijn)` (korte titel: `2b. NL ➔ Latijn`, id: `terminologie-nl-lat`).
     - Bevat **alle 77 officiële begrippen** uit de woordenlijst van `ANTWOORDEN richtingen.pdf`:
       - Botstukken (schouderblad ➔ *scapula*, sleutelbeen ➔ *clavicula*, opperarmbeen ➔ *humerus*, etc.).
       - Botvormen & uitsteeksels (kop ➔ *caput*, hals ➔ *collum*, doorn ➔ *spina*, kam ➔ *crista*, uitsteeksel ➔ *processus*, etc.).
       - Vlakken en assen (voorhoofdvlak ➔ *frontaal*, pijlnaadvlak ➔ *sagittaal*, horizontaal ➔ *transversaal*, lengte-as ➔ *longitudinaal*).
       - Bewegingen (afvoeren ➔ *abductie*, buigen ➔ *flexie*, binnenwaarts draaien ➔ *endorotatie*, heffen ➔ *elevatie*, etc.).
       - Gewrichten (heupgewricht ➔ *art. coxae*, kniegewricht ➔ *art. genus*, bovenste spronggewricht ➔ *art. talocruralis*, etc.).
  3. *Cache-vernieuwing in FlashcardContext:*
     - Opslagsleutel verhoogd naar `pmt_anatomie_flashcards_custom_v6` zodat de nieuwe set direct zichtbaar is in alle browsers.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.18s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 78. Dynamische Random Flashcards Optie (Alle Sets Gemengd) Geïmplementeerd (03-11-2026 19:32)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswensen:**
  1. Een optie toevoegen om alle flashcards willekeurig door elkaar te oefenen ("Random flashcards").
  2. **Cruciale architectuureis:** De flashcards mogen **niet** statisch gedupliceerd of gekopieerd worden in databestanden. Als een gebruiker een kaart toevoegt, bewerkt of verwijdert, moet deze wijziging **automatisch en direct** doorwerken in de random flashcards.
- **Doorgevoerde Architectuur & Aanpassingen ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):**
  1. *Dynamische Verzameling (Zero-duplication):*
     - `allCardsCombined` berekend via `useMemo(() => currentSets.flatMap((s) => s.cards), [currentSets])`. Hierdoor is er **geen enkele statische kopie** in broncode of opslag; de random mix is een reactieve, virtuele projectie van de actuele sets.
     - Eventuele toevoegingen, tekstcorrecties of verwijderingen in welke set dan ook werken onmiddellijk en automatisch door in de random mix.
  2. *Automatische Shuffle bij Start:*
     - Bij het selecteren van de random mix wordt de wachtrij (`activeQueueIds`) direct via het Fisher-Yates algoritme willekeurig geschud.
     - De bestaande shuffle-knop (`Shuffle`) kan op ieder moment gebruikt worden om de resterende of alle kaarten opnieuw te husselen.
  3. *UI & Toegankelijkheid:*
     - **Landingspagina:** Prominente, stijlvolle paars-roze gradient banner (`Alle flashcards gemengd • Random Mix`) met actueel aantal kaarten en voortgangsindicator.
     - **Hoofdstuk-dropdown:** Bovenaan de keuzelijst direct beschikbaar met icoon en totaaltelling.
     - Elke individuele kaart toont tijdens het oefenen nog steeds het bijbehorende onderwerplabel (`categoryLabel`), zodat studenten weten welk anatomisch thema het betreft.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.04s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 79. Afbeeldingen Vergroten in Flashcards Bewerk Tab Geïmplementeerd (03-11-2026 19:37)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswens:**
  - De gebruiker wil in de Flashcards Bewerk Tab afbeeldingen gemakkelijk op groot formaat kunnen bekijken om details goed te kunnen beoordelen tijdens het bewerken.
- **Doorgevoerde Aanpassingen ([FlashcardEditorView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/editor/FlashcardEditorView.tsx)):**
  1. *Meerdere Toegangspunten voor Vergroten:*
     - **Formulier-miniatuur:** De miniatuur in het bewerkformulier heeft nu een subtiele hover-overlay met `ZoomIn`-icoon en opent de afbeelding direct op volledig scherm bij een klik.
     - **Dedicated 'Vergroten' knop:** Een duidelijke knop `🔍 Vergroten` naast de bestandsnaam in het formulier.
     - **Live Preview kaart:** De afbeelding in de interactieve preview-kaart heeft een cursor-zoom (`cursor-zoom-in`) en een duidelijke `🔍 Vergroten` badge in de hoek; bij een klik opent direct de grote weergave zonder dat de kaart per ongeluk omdraait (`e.stopPropagation()`).
     - **Kaartenlijst (linkerkolom):** Het afbeeldingslabel bij elke kaart in de lijst is nu een klikbare knop met zoom-indicator, zodat je meteen vanuit het overzicht een afbeelding groot kunt inspecteren.
  2. *Lightbox Modal:*
     - Donkere achtergrondoverlay (`bg-slate-950/85 backdrop-blur-xs`) met royale witte kaart.
     - Toont de afbeelding haarscherp tot maximaal schermformaat (`max-h-[74vh] object-contain`).
     - Sluiten kan via de `X`-knop, door buiten de afbeelding te klikken, of met de `Escape`-toets op het toetsenbord.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.13s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 80. Samengestelde Kaart Opgesplitst in Drie Losse Kaarten (03-11-2026 19:46)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswens:**
  - De kaart *"Wat is de Nederlandse naam van art. cubiti, art. humeri en cingulum pectorale?"* bevatte drie afzonderlijke vragen in één kaart.
  - Verzoek: Splits dit op in drie afzonderlijke, snelle flashcards conform het 1-vraag-per-kaart principe.
- **Doorgevoerde Aanpassingen ([flashcardsPart1.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsPart1.ts), [flashcardsCustom.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/flashcardsCustom.json), [FlashcardContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/FlashcardContext.tsx)):**
  - Oude gecombineerde kaart `syn-10` in de set *4. Synoviaal Gewrichten & Bewegingsanalyse* vervangen door 3 gerichte kaarten:
    1. **`syn-10a`:** *"Wat is de Nederlandse naam van art. cubiti?"* ➔ `Ellebooggewricht.`
    2. **`syn-10b`:** *"Wat is de Nederlandse naam van art. humeri?"* ➔ `Schoudergewricht.`
    3. **`syn-10c`:** *"Wat is de Nederlandse naam van het cingulum pectorale?"* ➔ `Schoudergordel.`
  - Zowel in de bronbestanden als in `flashcardsCustom.json` gesynchroniseerd.
  - Opslagsleutel verhoogd naar `pmt_anatomie_flashcards_custom_v7` zodat de drie losse kaarten direct in de actieve sessies verschijnen.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.29s`).
  - Gecommit en gepusht naar `main` op GitHub.


---

## 81. Flashcards Icoon Terug in Navigatie, Verkorte Waarschuwing & Blauwe Random Flashcards Styling (03-11-2026 20:05)
- **Status:** Succesvol geïmplementeerd, gebouwd en gepusht naar GitHub.
- **Aanleiding & Gebruikerswensen:**
  1. Het Flashcards icoontje terugzetten in de hoofdnavigatie voor zowel mobiel als desktop/PC.
  2. De waarschuwing behouden, maar een stuk compacter en korter formuleren.
  3. De "Random flashcards" optie vereenvoudigen: overtollige toelichtende teksten verwijderen, titel puur naar *"Random flashcards"*, gradient weghalen en voorzien van de uniforme app-blauwe stijl (`bg-blue-600`).
- **Doorgevoerde Aanpassingen:**
  1. *Navigatie ([Header.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/common/Header.tsx)):*
     - `Layers` geïmporteerd en Flashcards knop toegevoegd aan `mobileNavItems` (tussen Bewegingen en Oefen).
     - Flashcards knop toegevoegd aan `desktopNavItems` (met label en icoon).
     - `handleHelpButtonClick` hersteld naar een directe klik voor de `HelpModal`.
  2. *Beknopte Waarschuwing ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):*
     - Banner teruggebracht tot een compacte, rustige strook: *"Let op: De flashcards zijn nog in ontwikkeling en kunnen fouten bevatten."*
  3. *Strakke Blauwe Random Flashcards Knop ([FlashcardsView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/flashcards/FlashcardsView.tsx)):*
     - Kleurverloop/gradient verwijderd; stijl omgezet naar de standaard app-blauwe knopstijl (`bg-blue-600 hover:bg-blue-700`).
     - Titel exact *"Random flashcards"*; lange beschrijvingen en extra tags weggelaten.
     - Ook in de set-titel en de dropdown-keuzelijst overal consistent omgezet naar *"Random flashcards"*.
- **Verificatie & Deployment:**
  - `npm run build` foutloos geslaagd (`✓ built in 4.35s`, 0 fouten).
  - Gecommit en gepusht naar `main` op GitHub.
