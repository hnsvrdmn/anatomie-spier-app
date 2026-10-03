# Anatomie & Spierleer App — Audit & Inzichtsdocument

Dit document biedt een heldere evaluatie van de applicatie, welke onlogische punten zijn opgelost, hoe de 3 hoofdmodi functioneren en welke eventuele functionaliteiten in de toekomst nog waardevol kunnen zijn.

---

## 1. Huidige Architectuur & De Drie Hoofdmodi

### A. Studiemodus (Leren & Verkennen)
* **Categorisering per gewricht**: Spieren zijn gecategoriseerd volgens het studieboek (A t/m G: Art. Coxae, Art. Genus, Art. Pedis, Art. Cubiti, Art. Humeri, Cingulum Membri Superioris, Romp & Wervelkolom).
* **Alle spieren van een gewricht bekijken**: Met één klik op `👁️ Toon alle ... spieren van dit gewricht op het skelet` worden alle spieren gelijktijdig weergegeven.
* **Filter op actieve zijde**: Op het ventrale aanzicht worden alleen de ventrale spieren getekend; zodra u wisselt naar dorsaal, verschijnen de dorsale spieren.
* **Interactief skelet (Direct klikken)**: U kunt rechtstreeks op een spierlijn of een aanhechtingspunt (origo/insertie) op het skelet klikken. De app focust direct op die specifieke spier en toont rechts alle details (naam, origo, insertie, primaire bewegingen en secundaire functies).
* **Multi-spier selectiechips**: Meerdere spieren kunnen tegelijk worden aangevinkt, waarbij elke spier een eigen kleurcode krijgt die overeenkomt met de lijn op het skelet.
* **Rustig en professioneel**: Geen storende elementen meer (zoals pulserende cirkels, verouderde labels als '(Oorsprong)' of overbodige 'Zijde weergave' knoppen).

---

### B. Toetsmodus (Kennis Toetsen & Feedback)
1. **Oefenen per gewricht**: Doorloopt alle spieren van een gekozen gewricht met een voortgangsbalk en een afrondingsscherm.
2. **Vrije Toets — 4 Toetsvormen**:
   * **Volledige spier (origo + insertie)**: Vraagt de student om beide polen te plaatsen. Zodra de origo is geplaatst, schakelt de app automatisch soepel door naar insertie.
   * **Vind aanhechtingspunt (origo / insertie)**: De student krijgt **enkel** de naam van het anatomische aanhechtingspunt (bijv. `📍 SIAI (Spina Iliaca Anterior Inferior)`) zonder dat de spiernaam verklapt wordt.
   * **Meerkeuze identificatie (raad de spier)**: Een spier wordt in kleur getoond op het skelet, en de student kiest uit 4 opties (A, B, C, D).
   * **Willekeurig gemengd**: Een gevarieerde combinatie van de bovenstaande vraagvormen.
3. **Automatische antwoordcontrole**: Zodra het benodigde aantal punten is geplaatst, controleert de app het antwoord direct (met confetti bij een goed antwoord). De handmatige knop *"Controleer antwoord"* blijft als extra vangnet aanwezig.
4. **Intelligente hints**: De instructie voor meervoudige aanhechtingen (hoogste en laagste uiterste) verschijnt **alleen** bij spieren waar dit daadwerkelijk van toepassing is (>2 aanhechtingspunten).
5. **Tweezijdige herkenning**: De student mag altijd vrij links of rechts intekenen; beide zijden worden herkend en goed gerekend.

---

### C. Bewerkingsmodus / Editor (Data & Coördinaten Aanpassen)
* **Strakke rechte verbindingslijnen**: De handmatige functie *"VERLOOP TEKENEN"* is verwijderd; het verloop wordt automatisch berekend.
* **Spieren toevoegen & verwijderen**:
  * Knop **`+ Nieuw`**: Opent een formulier om een nieuwe spier toe te voegen aan de database (inclusief naam, gewricht, aanzicht, origo en insertie).
  * Knop **`Verwijder`**: Verwijdert de geselecteerde spier met bevestiging.
* **Ingetekende puntenlijst**: Onder *"Actieve Plaatsingsmodus"* staat een duidelijk overzicht van alle reeds ingetekende origo's en inserties, inclusief coördinaten en individuele verwijderknoppen per punt.
* **Benoemen & hergebruiken van aanhechtingspunten**:
  * Een punt kan van een eigen naam worden voorzien (bijv. `Tuber ischiadicum`).
  * Knop **`+ Bestaand punt`**: Hiermee kan een reeds bekend anatomisch punt direct aan een andere spier worden toegevoegd op exact dezelfde coördinaten.
* **Kruislingse coördinatensynchronisatie**: Als een origo of insertie wordt versleept, worden alle andere spieren die datzelfde anatomische punt delen automatisch mee verplaatst.
* **Duidelijke tooltips bij hover**: Bewegen over een punt op het skelet toont direct een zwevende kaart met de naam van het aanhechtingspunt en de exacte coördinaten.
* **Export & Herstel**: Wijzigingen worden bewaard in de browser (`localStorage`) en kunnen met één klik worden geëxporteerd als `muscles.json`.

---

## 2. Wat was onlogisch en is nu gecorrigeerd?

| Onderdeel | Oude / Onlogische situatie | Gecorrigeerde situatie |
| :--- | :--- | :--- |
| **Meerkeuze identificatie** | Gaf bij een goed antwoord de melding: *"Helaas niet juist. 0/2 punten exact geplaatst"* omdat er geen punten op het skelet waren geklikt. | Herkent nu direct de meerkeuzevraag: toont direct *"Uitstekend! Correct beantwoord"* en verbergt de irrelevante coördinaten-meettabel. |
| **Toets Type dropdown** | Reageerde traag of vertoonde een dubbele herlaad-lus waardoor opties leken te verspringen. | `useEffect` ontkoppeld van `freeQuizType`; selectie schakelt direct en stabiel om. |
| **Vind aanhechtingspunten** | Toonde de spiernaam in de vraag, waardoor de student de vraag al half cadeau kreeg. | Toont nu enkel `📍 [Naam aanhechtingspunt]`. De spiernaam wordt pas onthuld ná het beantwoorden. |
| **Instructieteksten** | Tekst *"Vrij links of rechts intekenen"* en de wervelkolomhint stonden overal, ook bij simpele spieren met 1 punt. | Overbodige teksten verwijderd; wervelkolomhint verschijnt alleen bij spieren met >2 punten. |
| **Studiemodus interactie** | Geen optie om een spier op het skelet aan te klikken; alle gewrichtsspieren tegelijk tonen was omslachtig. | Knop toegevoegd om alle spieren van een gewricht te tonen; klikken op een spier op het skelet toont direct alle details. |
| **Ventraal / Dorsaal bij multi-spier** | Dorsale spieren werden over het ventrale skelet getekend als je alle spieren van een gewricht selecteerde. | Het skelet filtert nu automatisch: ventrale spieren op ventraal, dorsale spieren op dorsaal. |
| **Editor: Verloop tekenen** | Er was een aparte knop om verloop te tekenen, terwijl dit al automatisch strak berekend werd. | *"VERLOOP TEKENEN"* en *"Wis verloop"* zijn verwijderd. |
| **Editor: Puntenbeheer** | Je kon niet zien welke punten al stonden en kon punten niet benoemen of hergebruiken voor andere spieren. | Puntenlijst toegevoegd, punten kunnen worden benoemd, hergebruikt (`+ Bestaand punt`) en gesynchroniseerd. |

---

## 3. Status van Aanvullende Suggesties

1. **Toetsing op Functie / Beweging** — ✅ **GEÏMPLEMENTEERD**:
   * Toegevoegd als toetsmodus: *"Spierwerking & functie (meerkeuze)"*.
   * Toont 4 duidelijke meerkeuze opties (A t/m D) gebaseerd op de daadwerkelijke gewrichtsbewegingen van de spier uit de database.
   * Directe antwoordevaluatie met feedbackkaart en confetti.
2. **Kleine apparaten / Mobiele optimalisatie** — ✅ **GEÏMPLEMENTEERD**:
   * Volledig responsive gemaakt voor mobiele telefoons en tablets.
   * Voorzien van een 1-tap weergaveschakelaar (`[ 🦴 Skelet Model ]` / `[ 📝 Vraag & Opties ]` of `[ 📖 Spieren & Details ]`).
   * Skeletcontainer schaalt dynamisch mee op mobiele schermen (`h-[56vh] min-h-[360px]`), zodat studenten niet eindeloos verticaal hoeven te scrollen.
   * Op desktops (`lg:`) blijft de vertrouwde dubbelkoloms lay-out actief.
3. **Spierrichting / Pijlindicatie**:
   * Optioneel voor latere uitbreiding: subtiele contractiepijlen van insertie naar origo.
4. **Toetsresultaten exporteren**:
   * Optioneel voor latere uitbreiding: scores exporteren als PDF/afbeelding.
