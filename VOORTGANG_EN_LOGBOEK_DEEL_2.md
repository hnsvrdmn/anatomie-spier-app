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
- **Git Push Beleid:** Er wordt **niet** meer automatisch naar GitHub gepusht. Wijzigingen blijven lokaal gecommit.
- **Nieuw Logboek:** Alle nieuwe denkstappen, analyses en updates worden exclusief in dit document bijgehouden (`VOORTGANG_EN_LOGBOEK_DEEL_2.md`).

