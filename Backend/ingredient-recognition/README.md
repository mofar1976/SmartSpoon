# Interner Foto-Erkennungsdienst

Python-HTTP-Dienst für die lokale Bildanalyse, angebunden über NestJS und Angular. Die gemeinsame Erkennungslogik liegt in recognition.py;
der CLI-Prototyp verwendet dieselbe Implementierung.

## Start

Auf dem Mac Ollama nativ starten, damit es die Apple-GPU verwenden kann:

```sh
OLLAMA_NO_CLOUD=1 OLLAMA_HOST=127.0.0.1:11434 ollama serve
ollama pull qwen3-vl:4b-instruct
```

In Backend/.env muss INGREDIENT_RECOGNITION_TOKEN mindestens 32 Zeichen lang sein.
Ein zufälliger Token wurde bei der Einrichtung lokal ergänzt; niemals committen.
Weitere Werte stehen in .env.example. Dann aus Backend/:

```sh
docker compose --profile vision up --build -d ingredient-recognition
```

Das optionale Profil vision lässt den bestehenden Standardstack ohne Bilderkennung
starten. Dienst lokal: http://127.0.0.1:8090; für andere Compose-Container:
http://ingredient-recognition:8090. Ollama wird über host.docker.internal erreicht.
Kein automatischer Cloud-Fallback; Ollama muss mit OLLAMA_NO_CLOUD=1 laufen.
Die Modellgewichte sind nicht Bestandteil des Containers.

## HTTP-Vertrag

- GET /health: Prozess erreichbar (200).
- GET /health/ready: Ollama erreichbar und konfiguriertes Vision-Modell vorhanden
  (200), andernfalls 503. Dies bestätigt nicht die Erkennungsqualität.
- POST /recognize: roher Bildinhalt, kein Multipart, kein Dateipfad und keine Bild-URL.
  Authorization: Bearer <INGREDIENT_RECOGNITION_TOKEN>.
  Content-Type: image/jpeg, image/png oder image/webp; Content-Length erforderlich.
  Höchstens 10 MiB und 20 Millionen Pixel; tatsächlicher Bildinhalt wird geprüft.

Antwort: model, requiresConfirmation (immer true), ingredients (name/evidence),
uncertainItems und metrics. Fotos werden nur im Speicher verarbeitet, EXIF-Metadaten
entfernt. Keine Fotos oder Erkennungsergebnisse in Logs oder persistentem Speicher.

Fehlercodes: 401 UNAUTHORIZED, 411 CONTENT_LENGTH_REQUIRED, 413 IMAGE_SIZE_LIMIT,
415 UNSUPPORTED_IMAGE_TYPE, 422 INVALID_IMAGE, 429 RECOGNITION_BUSY,
502 INVALID_MODEL_RESULT, 503 MODEL_UNAVAILABLE, 504 RECOGNITION_TIMEOUT.
Eine Fotoanalyse gleichzeitig; weitere Anfragen werden abgewiesen statt aufgestaut.
Ungültige oder abgeschnittene Modellantworten erhalten höchstens einen Korrekturversuch.
Das Gesamtlaufzeitlimit gilt für beide Versuche gemeinsam. Das Modell hat 8192 Kontexttokens
und maximal 2048 Ausgabetokens im ersten bzw. 3072 im Korrekturversuch.
Logs enthalten ausschließlich feste Fehlerkategorien (abgeschnitten, ungültiges JSON,
ungültiges Schema), niemals Fotos, Modellantworten oder erkannte Zutaten.
Das Modellzeitlimit beträgt standardmäßig 180 Sekunden. Ein clientseitiger Abbruch
stoppt die bereits laufende Modellberechnung nicht garantiert.

Dieser Dienst ist intern; Browser sprechen ausschließlich die authentifizierte
NestJS-API an. Der interne Zugriffstoken ersetzt keine Nutzeranmeldung.

## Tests

Aus Backend/ mit der bestehenden Prototyp-Umgebung:

```sh
prototypes/ingredient-recognition/.venv/bin/python -m unittest discover -s ingredient-recognition -v
cd prototypes/ingredient-recognition
.venv/bin/python -m unittest -v
```

Die bekannten Modellgrenzen und ersten Messwerte stehen im Prototyp-README.
Komplexe Szenen werden noch nicht zuverlässig erkannt; Zutaten immer bestätigen.
