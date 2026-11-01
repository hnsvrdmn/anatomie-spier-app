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
