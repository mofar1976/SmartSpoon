# Lokale Zutaten-Erkennung – Prototyp

Schritt 1: Fotoanalyse ausprobieren, noch keine NestJS-/Angular-Anbindung.

## Start auf macOS

Ollama installieren (`brew install ollama`). In einem eigenen Terminal starten:

```sh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
```

In einem zweiten Terminal:

```sh
ollama pull qwen3-vl:4b-instruct
cd Backend/prototypes/ingredient-recognition
python3 -m venv .venv
.venv/bin/python -m pip install -r requirements.txt
.venv/bin/python recognize.py /absoluter/pfad/lebensmittel.jpg
```

JPEG, PNG und WebP bis 10 MiB. Bilder werden anhand ihres Inhalts geöffnet,
ausgerichtet und auf höchstens 1280 Pixel Kantenlänge verkleinert. EXIF-Metadaten
werden beim erneuten Kodieren entfernt. HEIC vorher konvertieren.
Fotos werden im Arbeitsspeicher verarbeitet und an die lokale Ollama-Adresse
übertragen. Keine Gemini-Aufrufe. Gewichte bleiben im Ollama-Modellverzeichnis.
Das Modell bleibt nach einem Aufruf zwei Minuten geladen;
`ollama stop qwen3-vl:4b-instruct` entlädt es sofort.

## Auswertung

Die Ausgabe enthält `ingredients` mit sichtbarem Beleg und `uncertainItems`.
`requiresConfirmation` bleibt immer wahr. Mengen, Allergene, Haltbarkeit und genaue
Produktidentität werden nicht zugesichert. Nutzer müssen die Liste prüfen.

`metrics` enthält Anfrage- und Ladezeit, lokale Tokenzahlen, Bildgröße und die von
Ollama gemeldete Modell-/GPU-Speichergröße. Diese ist kein Peak-RAM des gesamten
Prozesses. Auch lokale Modelle verarbeiten Tokens, ohne Gemini-Abrechnung.

Mehrere Fotos mit jeweils zwei Durchläufen vergleichen:

```sh
mkdir -p results
.venv/bin/python benchmark.py photos/produkte.jpg photos/ohne-lebensmittel.jpg > results/vergleich.json
```

Der erste Aufruf enthält die Modellladezeit, sofern das Modell noch nicht geladen ist.
Eigene Fotos loser Zutaten, lesbarer Verpackungen, verdeckter Produkte und einer
Szene ohne Lebensmittel nutzen. Erwartete Zutaten vorher notieren, fehlende und
fälschlich ergänzte Zutaten vergleichen. Kleine Stichproben erlauben keine
allgemeine Genauigkeitsangabe. `photos/` und `results/` sind gitignoriert.

## Tests

```sh
.venv/bin/python -m unittest -v
```

Tests für Bildprüfung, Größenreduktion, Antwortvalidierung, lokale Zieladressen
und den HTTP-Vertrag gegen einen Testserver;
keine Messung der Modellqualität.

## Quellen

- https://ollama.com/library/qwen3-vl:4b-instruct (Apache-2.0, ca. 3,3 GB Download)
- https://docs.ollama.com/api/chat
- https://docs.ollama.com/api/ps

Die lokal vorbereiteten Beispielbilder (nicht versioniert) stammen aus:

- Banane: https://upload.wikimedia.org/wikipedia/commons/8/8a/Banana-Single.jpg
- Küchenszene: https://s3.amazonaws.com/images.cocodataset.org/val2017/000000397133.jpg
- Ohne Lebensmittel: https://s3.amazonaws.com/images.cocodataset.org/val2017/000000039769.jpg

Diese Beispiele sind ein technischer Smoke-Test. Insbesondere sind sie kein Test
der Erkennung gemischter Supermarktverpackungen oder ihrer deutschen Etiketten.

## Erste lokale Messung – 10. Oktober 2026

Hardware: Apple M5, 16 GiB RAM; Ollama 0.40.2; Modell-ID ee4b975b58c1.
Nach Entladen des Modells und mit dem überarbeiteten deutschen Prompt:

| Beispiel | Ergebnis | Erster Aufruf | Wiederholung |
|---|---|---:|---:|
| Banane | Banane erkannt, beide Durchläufe | 6,513 s | 1,388 s |
| Katzen auf Sofa | Keine Lebensmittel, beide Durchläufe | 3,243 s | 0,368 s |
| Küche mit Teig/Pizzazubereitung | Sichtbare Lebensmittel übersehen, leere Liste | 3,318 s | 0,359 s |

Ollama meldete 3.533.113.917 Bytes (ca. 3,29 GiB) Modell-/GPU-Speicher.
Wiederholungen desselben Fotos nutzten den Prompt-Cache, sind also keine
Laufzeitprognose für neue Fotos. Der erste Bananenaufruf enthielt 1,037 s Modellladezeit.
Die Rohdaten liegen lokal in `results/final-benchmark.json` und sind gitignoriert.

Der erste ausführliche englische Prompt ließ auch die Banane aus und erzeugte bei
der Küche wiederholte unsichere Einträge. Der kürzere deutsche Prompt verbessert
den einfachen Positivtest, löst aber die komplexe Szene nicht. Das Modell ist daher
noch nicht für eine verlässliche automatische Erkennung bestätigt. Als Nächstes
sind eigene gemischte Zutatenfotos, Verpackungen und weitere Prompt-/Modellvergleiche
nötig. Die Zutatenbestätigung bleibt verpflichtend.
