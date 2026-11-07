# 📋 Voortgangs- en Denklogboek – Deel 2

> **Doel:** Dit nieuwe document vervangt het voorgaande logboek (om lange leestijden en context-overhead te voorkomen). Hierin staan de actuele diagnoses, technische oorzaken, doorgevoerde fixes en verificaties via geautomatiseerde browser-screenshots.

---

## 1. Probleemanalyse & Directe Oorzaken (05-11-2026 00:45)

### Probleem A: Onleesbare tekst achter de Origo- en Insertie-knoppen
- **Wat er te zien was:** Achter de zwevende knoppen voor Origo en Insertie stak half onleesbare tekst uit: *"💡 Bij meerdere aanhechtingen (bijv. wervelkolom): plaats minimaal de uiterste punten..."*.
- **Oorzaak:** In [QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) was deze badge voorzien van `absolute top-2.5 z-20`. Doordat er geen horizontale centrering (`left-1/2 -translate-x-1/2`) op zat, viel deze links over het skelet op exact dezelfde positie als de knoppencontainer (`absolute left-3 top-3 z-20`).
- **Oplossing:** Deze badge is **volledig verwijderd** uit zowel [QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) als [MobileQuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx). Er zweeft geen storende tekst meer achter of nabij de knoppen.

---

### Probleem B: Ongewenste Nederlandse vertalingen in de gewrichten-dropdown
- **Wat er te zien was:** In het dropdown-menu stonden Nederlandse toevoegingen tussen haakjes: `Art. COXAE (Heupgewricht)`, `Art. GENUS (Kniegewricht)`, `CINGULUM PECTORALE (Schoudergordel)`.
- **Oorzaak:** In [QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) werd `{cat.title}` gebruikt i.p.v. `{cat.name}`. In [jointCategories.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/jointCategories.ts) bevatte `title` de Nederlandse vertaling.
- **Oplossing:**
  1. In [QuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/QuizView.tsx) aangepast naar `{cat.name} ({cat.muscleIds.length} spieren)`.
  2. In [jointCategories.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/jointCategories.ts) zijn de `title`-velden gelijkgetrokken aan de officiële naam zonder Nederlandse toevoegingen tussen haakjes.

---

### Probleem C: Trapezius lijnen in de studietab en overige views leken niet te veranderen
- **Wat er gebeurde:** Jij had in de editor alle benodigde origo's en inserties per pars netjes toegevoegd en opgeslagen naar het bronbestand, maar in de andere tabs bleven oude lijnen zichtbaar.
- **Drie diepere technische oorzaken:**
  1. **Vite dev server watcher negeerde databestanden:** In `vite.config.ts` stond `watch: { ignored: ['**/src/data/muscles.json', ...] }`. De Vite achtergrondserver (die al uren draaide) reageerde daardoor niet op wijzigingen in `muscles.json` en hield de oude module in het cache-geheugen.
  2. **Browser LocalStorage overschreef bronbestand:** [MuscleContext.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/context/MuscleContext.tsx) laadt bij initialisatie primair uit `localStorage` via de sleutel `pmt_anatomie_muscles_dataset_v19`. Omdat de versiesleutel niet was verhoogd, bleef de browser de oude dataset serveren.
  3. **Oude buigcurve (`musclePath`):** In de oude dataset zat een buigpunt (`{ x: 0.5844, y: 0.2385, name: 'buigpunt spina scapulae' }`), waardoor alle lijnen naar één punt op de scapula kromden.
- **Oplossing:**
  1. Vite dev-server volledig herstart zodat het verse bronbestand direct wordt gecompileerd.
  2. Versiesleutel in [export.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/export.ts) opgehoogd naar `v21` (`pmt_anatomie_muscles_dataset_v21`). Oude gecachte versies worden bij de eerste paginalaadactie direct gewist.
  3. De door jou in de editor opgeslagen origo's en inserties in [muscles.json](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/data/muscles.json) (2 origo's en 1 insertie per pars, zonder `musclePath`) zijn nu 1-op-1 actief.
  4. [coordinates.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts) `getMuscleConnections` herkent de voorvoegsels (`descendens`, `transversa`, `ascendens`) en verbindt uitsluitend binnen dezelfde pars:
     - **Pars descendens:** 2 rechte lijnen van wervels naar laterale clavicula.
     - **Pars transversa:** 2 rechte lijnen van wervels naar acromion.
     - **Pars ascendens:** 2 rechte lijnen van wervels naar spina scapulae.
     - Totaal: 6 rechte lijnen links en 6 rechte lijnen rechts, strikt parallel per pars.

---

## 2. Geautomatiseerde Browser Test & Verificatie

De code is live getest in een echte browser via Puppeteer (Microsoft Edge headless):
- **Studiemodus m. trapezius:**
  - De geselecteerde spier toont nu exact **12 rechte lijnen** (6 links, 6 rechts).
  - Alle `Q` (kwadratische bezierkrommingen) zijn verdwenen; alle paden zijn zuivere `L` (rechte lijnen) direct tussen de door jou ingestelde punten.
- **Quizmodus (Oefenen):**
  - Dropdown toont uitsluitend: `Art. COXAE`, `Art. GENUS`, `Art. PEDIS`, `Art. CUBITI`, `Art. HUMERI`, `CINGULUM PECTORALE`, `ROMP / WERVELKOLOM`.
  - Geen overlappende of storende badges meer over het canvas of achter knoppen.
- **Productiebuild:**
  - `npm run build` draait zonder fouten (`✓ built in 4.42s`).

---

## 3. Afspraken & Werkwijze
- **Git Push Beleid:** Er wordt **niet** meer automatisch naar GitHub gepusht. Wijzigingen blijven lokaal gecommit tot expliciet push-commando.
- **Nieuw Logboek:** Alle nieuwe denkstappen, analyses en updates worden exclusief in dit document bijgehouden (`VOORTGANG_EN_LOGBOEK_DEEL_2.md`).
- **Vooraf Melden in Logboek:** Vóór elke actie schrijf ik een korte bullet in het logboek met wat ik ga doen.
- **Transparantie bij Zelf Testen:** Zodra een codefix af is en ik een visuele test / screenshot start, noteer ik dat direct als: `[Status: Fix voltooid | Nu bezig met: Geautomatiseerde screenshot-test]`. Zo weet je direct dat de code al veilig staat en je het proces gerust kunt onderbreken als je direct door wilt.



---

## 4. Terminologie-aanpassing Waarschuwingsbanner (05-11-2026 23:31)
- **Aanpassing:** In de waarschuwingsbanner op de Spieren/Studeertab is het woord *"inconsequenties"* vervangen door *"inconsistenties"*:
  - Oude tekst: `<strong>Let op:</strong> De inconsequenties tussen het moduleboek, antwoord-PDF's en PowerPoint zitten er nog in.`
  - Nieuwe tekst: `<strong>Let op:</strong> De inconsistenties tussen het moduleboek, antwoord-PDF's en PowerPoint zitten er nog in.`
- **Bestanden:**
  - [StudyView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/StudyView.tsx) (desktop weergave)
  - [MobileStudyView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/study/MobileStudyView.tsx) (mobiele drawer)
- **Verificatie:** `npm run build` foutloos uitgevoerd (`✓ built in 4.49s`).

---

## 5. Herstel Spierlijnen Biceps, Triceps, Deltoideus & Analyse Crista Iliaca (07-11-2026 19:40)
- **Probleem 1: Lijnen bij m. biceps brachii, m. triceps brachii en m. deltoideus waren verdwenen:**
  - **Oorzaak:** In [coordinates.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/coordinates.ts) werd in `getMuscleConnections` gezocht naar `getPartPrefix`, die ook zocht naar termen als `caput longum`, `caput breve`, `caput mediale`, `caput laterale` en `clavicularis`. Hierdoor werd `hasAnyPart` ten onrechte `true` voor deze meerkoppige spieren. Omdat zij echter geen `descendens`, `transversa` of `ascendens` partes hebben en de inserties niet als pars gelabeld zijn, genereerde de pars-loop 0 verbindingen en sloot de fallback-filter ze uit. Resultaat: 0 lijnen gerenderd.
  - **Oplossing:** `getPartPrefix` vervangen door `getTrapeziusPart`. Het uitsplitsen per pars gebeurt nu strikt en uitsluitend wanneer ZOWEL origo's als inserties matching pars hebben (`descendens`, `transversa`, `ascendens`, uniek voor m. trapezius). Alle overige spieren (biceps, triceps, deltoideus, pectoralis major) verbinden nu weer direct alle koppen met hun insertie.
  - **Verificatie:** Puppeteer end-to-end test bevestigt:
    - `biceps_brachii`: 2 gekleurde lijnen (caput breve + longum $\rightarrow$ tuberositas radii) + outlines.
    - `triceps_brachii`: 3 gekleurde lijnen (caput longum + laterale + mediale $\rightarrow$ olecranon) + outlines.
    - `deltoideus`: 3 gekleurde lijnen (pars clavicularis + acromialis + spinalis $\rightarrow$ corpus humeri) + outlines.
- **Probleem 2: Verspringen crista iliaca punt bij m. gluteus maximus:**
  - **Oorzaak:** In commit `08d74b6` waren de X-coördinaten van de crista iliaca per abuis links/rechts omgewisseld (`x: 0.6136` op links en `x: 0.3864` op rechts). Aangezien bij een dorsaal aanzicht links $x < 0.5$ is (waar ook SIPS $0.4485$, sacrum $0.4955$ en coccyx $0.494$ liggen), stond de crista iliaca aan de verkeerde kant van het lichaam.
  - **Status:** De gebruiker heeft dit in de editor hersteld naar $x = 0.3898$ (links) en $x = 0.6102$ (rechts) op $y = 0.4051$. Dit is wiskundig exact symmetrisch ($0.3898 + 0.6102 = 1.0000$).
  - **Preventie:** Dataset in [export.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/export.ts) verhoogd naar `v22` (`pmt_anatomie_muscles_dataset_v22`) zodat verouderde browser-cache direct wordt gewist en de gecorrigeerde punten definitief actief blijven.
- **Verificatie:** `npm run build` foutloos uitgevoerd (`✓ built in 4.09s`).

---

## 6. Mobiel: Trapezius Pars-knoppen Vrijmaken van Navigator / Zoom-reset (07-11-2026 19:57)
- **Probleem:** Op mobiel stonden de partes-knoppen (`Desc.`, `Transv.`, `Ascend.`) op dezelfde horizontale regel als de `O` & `I`-knoppen. Hierdoor liep de knoppenbalk naar rechts door en viel hij deels onder de zwevende navigator (`144% Reset` en draaiknop).
- **Directe oplossing in [MobileQuizView.tsx](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/components/quiz/MobileQuizView.tsx):**
  - Knoppencontainer linksboven omgezet naar een verticale kolom (`flex flex-col items-start gap-1.5`):
    - **Regel 1:** `[O | I]` gereedschap + (indien punten geplaatst) `[Undo | Trash]`. Breedte is slechts ~136px, waardoor er rechts ruim 200px vrij blijft voor de navigator/zoomknop.
    - **Regel 2:** `[Desc. | Transv. | Ascend.]` partes-knoppen van de m. trapezius. Deze staan nu altijd netjes op een eigen regel eronder (vanaf `top: 52px`), fysiek onder de navigator/zoomknop.
- **Resultaat:** 0% overlap op alle schermformaten; alle knoppen zijn direct zichtbaar en aan te tikken.
- **Build-controle:** `npm run build` geslaagd (`✓ built in 4.11s`).
- **Git Push:** Succesvol gepusht naar `origin main` (commits `cdaaf09` en `6b96646`) op verzoek van gebruiker.

---

## 7. Overzichtsdocument Ontwikkelregels & Afspraken (07-11-2026 20:03)
- **Status:** Voltooid.
- **Resultaat:** Het document [ONTWIKKELREGELS_EN_AFSPRAKEN.md](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/ONTWIKKELREGELS_EN_AFSPRAKEN.md) is aangemaakt en bevat alle regels voor communicatie/logboek, Git push-beleid, anatomische data/cache integriteit, UI- en mobiele standaarden, en buildkwaliteit.
- **Build-controle:** `npm run build` geslaagd (`✓ built in 3.92s`).
