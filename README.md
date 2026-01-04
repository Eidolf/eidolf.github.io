# Modern Portfolio Template

Ein modernes, dunkles Portfolio-Template mit Glasseffekt, das automatisch Projektinformationen von GitHub Pages URLs lädt.

## Features
- **Design**: Modernes "Glassmorphism" Design, Dunkler Modus, Responsive.
- **Auto-Fetch**: List einfach deine URLs in `projects.json` auf. Das Skript lädt automatisch Titel, Beschreibung und Vorschaubild (Open Graph Tags).
- **Einfache Wartung**: Keine HTML-Kenntnisse für neue Projekte nötig.

## Installation / Nutzung

1. **Dateien hochladen**: Lade den gesamten Inhalt dieses Ordners in dein GitHub Repository (z.B. `username.github.io`).
2. **Projekte konfigurieren**: Bearbeite die Datei `projects.json`:
   ```json
   [
     "https://eidolf.github.io/ER-Startseite/",
     "https://eidolf.github.io/ER-MusicTagManager/",
     "https://deine-neue-url.com"
   ]
   ```
3. **Fertig**: Github Pages aktiviert die Seite automatisch.

## Lokales Testen
Da moderne Browser aus Sicherheitsgründen (CORS) das Laden von externen Webseiten blockieren, wenn man die Datei einfach per Doppelklick öffnet (`file://...`), nutze einen lokalen Server:

### Mit Python
```bash
python3 -m http.server
```
Dann öffne `http://localhost:8000` im Browser.

## Anpassung
- **Hintergrund**: In `css/style.css` kannst du die Farben der "Blobs" ändern.
- **Texte**: Bearbeite `index.html` für Titel und Untertitel.
