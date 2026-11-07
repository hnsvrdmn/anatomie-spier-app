# 📜 Ontwikkelregels en Werkafspraken – Anatomie Spier App

> Dit document bundelt alle gemaakte werkafspraken, communicatieregels, git-richtlijnen, anatomische standaarden en UI-principes voor het ontwikkelen van deze applicatie.

---

## 1. Communicatie, Denkproces & Logboek

1. **Vooraf melden in het logboek:**
   - Vóór elke actie of code-wijziging wordt direct een korte notitie in het actuele logboek ([VOORTGANG_EN_LOGBOEK_DEEL_2.md](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/VOORTGANG_EN_LOGBOEK_DEEL_2.md)) geschreven.
   - Geen lange lappen tekst achteraf, maar continue, korte updates (bullet points) tijdens het proces.

2. **Transparantie bij visuele tests & screenshots:**
   - Zodra een codefix voltooid is en er een verificatietest of screenshot wordt gestart, wordt direct in het logboek genoteerd:
     `[Status: Fix voltooid | Nu bezig met: Geautomatiseerde verificatietest]`.
   - Hierdoor weet de gebruiker direct dat de code al veilig en werkend klaarstaat, en kan de test zonder risico worden onderbroken als er snel doorgepakt moet worden.

3. **Strikte scope-discipline:**
   - Geen ongevraagde 'extra features', badges of automatische vertalingen toevoegen.
   - Focus uitsluitend en secuur op wat de gebruiker expliciet vraagt.

4. **Nieuw logboek bijhouden:**
   - Alle nieuwe voortgang en analyses worden exclusief bijgehouden in [VOORTGANG_EN_LOGBOEK_DEEL_2.md](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/VOORTGANG_EN_LOGBOEK_DEEL_2.md) (om lange leestijden van het oorspronkelijke logboek te voorkomen).

---

## 2. Git & Versionering

1. **NOOIT automatisch pushen:**
   - Wijzigingen worden altijd lokaal gecommit met een duidelijke, beschrijvende commit-boodschap.
   - Er wordt **uitsluitend** naar `origin main` gepusht wanneer de gebruiker hier expliciet opdracht toe geeft (bijv. *"push maar"*, *"ja graag"*).

2. **Schone commits:**
   - Geen tijdelijke scratch-bestanden of screenshots committen naar de Git repository.
   - Voor elke commit controleren via `git status`.

---

## 3. Anatomische Data, Coördinaten & Cache

1. **Integriteit van handmatige aanpassingen:**
   - Punten die door de gebruiker handmatig in de Botstructuren- of Spiereneditor zijn geplaatst of gecorrigeerd (zoals wervelhoogtes, crista iliaca bij *m. gluteus maximus*, etc.) mogen **nooit** worden overschreven, teruggedraaid of gewist door automatische scripts.

2. **Dataset-versiebeheer (`localStorage` buster):**
   - Bij wijzigingen in de bron-datasets (`muscles.json` of botstructuren) moet altijd de versiesleutel in [export.ts](file:///c:/Users/TOMMY/Documents/anatomie-spier-app/src/utils/export.ts) worden opgehoogd (bijv. `pmt_anatomie_muscles_dataset_v22` $\rightarrow$ `v23`).
   - Dit voorkomt dat de browser de verouderde gecachte dataset blijft serveren.

3. **Trapezius structuur:**
   - De *m. trapezius* heeft 3 partes (`descendens`, `transversa`, `ascendens`).
   - Verbindingslijnen lopen **strikt per pars** (rechte lijnen tussen de bijbehorende origo's en insertie van die pars, zonder kriskras-overlappingen of gedwongen bezier-curves).
   - Bij het intekenen van de wervelkolom volstaat het plaatsen van minimaal de uiterste punten (hoogste en laagste wervel van die pars).

4. **Meerkoppige spieren:**
   - Spieren met meerdere koppen (*m. biceps brachii*, *m. triceps brachii*, *m. deltoideus*, *m. pectoralis major*) verbinden al hun koppen met de betreffende insertie(s).

5. **Terminologie:**
   - In de waarschuwingsbanner over onderwijsmaterialen wordt altijd het woord **"inconsistenties"** gebruikt (niet *"inconsequenties"*):
     *`Let op: De inconsistenties tussen het moduleboek, antwoord-PDF's en PowerPoint zitten er nog in.`*
   - In gewrichtsdropdowns uitsluitend de officiële anatomische Latijnse benaming tonen (geen Nederlandse vertalingen tussen haakjes erbij plakken).

---

## 4. UI & Mobiele Richtlijnen

1. **Geen botsingen met de navigator:**
   - Zwevende interactieknoppen mogen **nooit** overlappen met de navigator rechtsboven (de `Reset`-zoomknop en de `Draaiknop`).

2. **Knoppencontainer linksboven op mobiel:**
   - **Regel 1:** Gereedschap `[ O | I ]` en (indien punten geplaatst) `[ Undo | Trash ]` (totale breedte max ~135px).
   - **Regel 2:** Eventuele partes-knoppen (`Desc.`, `Transv.`, `Ascend.`) direct daaronder (vanaf `top: ~50px`).
   - Dit garandeert dat de navigator rechtsboven altijd 100% vrij en bereikbaar blijft.

3. **Geen vinkjes, wel focus-animatie:**
   - Geen statische vinkjes (`✓`) op de knoppen van afgeronde partes.
   - De subtiele hop-animatie (`animate-subtle-hop` met focusring) begeleidt de gebruiker naar de eerstvolgende vereiste knop.

4. **Tekenvrijheid & Zichtbaarheid:**
   - Het skelet en het anatomische werkgebied moeten op zowel PC als mobiel maximaal zichtbaar blijven. Geen storende tekstvakken of disclaimers over het canvas heen plaatsen.

---

## 5. Build & Code-kwaliteit

1. **Build-verificatie:**
   - Vóór elke afronding van een taak moet `npm run build` foutloos draaien (`tsc && vite build`).
2. **Line-endings:**
   - Let op CRLF/LF consistentie bij het bewerken van bronbestanden op Windows.
