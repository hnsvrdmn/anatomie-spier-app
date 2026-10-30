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

---
*Dit document wordt bij elke stap bijgewerkt zodat je altijd precies weet wat er gebeurt.*
