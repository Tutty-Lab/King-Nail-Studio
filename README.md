# Dienstplan & Stundenzettel — King Nail Braunschweig

Eine App für die zwei Nagelstudios desselben Betreibers in Braunschweig
(Niedersachsen). Die Oberfläche ist auf Vietnamesisch. Es gibt KEIN Umschalten
zwischen den Filialen: jeder Tab zeigt beide Studios untereinander, jedes mit
eigener Überschrift. Monat und Jahr stehen oben in der Kopfzeile und gelten für
beide. Jedes Studio hat eigene Mitarbeiter, eigene Pläne, ein eigenes Passwort
und eine eigene Zeile in Supabase; „Tạo lịch làm việc" erzeugt beide Pläne, und
die Bảng chấm công gibt EINE PDF mit den Seiten beider Studios aus.

| Filiale | `store_id` | Anschrift | Telefon |
|---|---|---|---|
| King Nail Schloss Arkaden | `arkaden` | Platz am Ritterbrunnen 1, 38100 Braunschweig (EG, neben Vodafone) | 0531 88532798 |
| King Nail Papenstieg | `papenstieg` | Papenstieg 8, 38100 Braunschweig | +49 531 34967521 |

## Öffnungszeiten (je Filiale verschieden, durchgehend offen)

- **Schloss Arkaden:** Mo–Sa 09:30–20:00.
- **Papenstieg:** Mo–Fr 09:00–19:00, Sa 09:00–18:00.
- **Sonntag geschlossen**, ebenso an **gesetzlichen Feiertagen** (Ladenschluss).
  Nur eine Datumsausnahme mit eigenen Zeiten öffnet einen solchen Tag.
- Feiertage nach **Niedersachsen** (`src/lib/holidays.ts`): 10 Tage, mit
  Reformationstag (31.10.), ohne Heilige Drei Könige, Fronleichnam und
  Allerheiligen.

## Vorgaben des Betriebs

- **Die ganze Öffnungszeit ist besetzt** – von der ersten bis zur letzten Minute
  mindestens eine Person (harte Regel `Trong giờ mở cửa` in beiden Studios).
- **Hauptzeit:** Mo–Fr 15:00–19:00, Sa 11:00–19:00. Dort stehen mehr Leute:
  Arkaden 2 Personen (samstags 3), Papenstieg 2 Personen an Fr/Sa.
  In Papenstieg reichen die 439 Vertragsstunden Mo–Do nicht für eine zweite
  Person über die volle Hauptzeit; dort zieht nur die Nachfragekurve.
- **Tagesgewichte** (für beide gleich): Mo 1,2 · Di 1,0 · Mi 1,2 · Do 1,2 ·
  **Fr 2,0 · Sa 2,0**. Freitag und Samstag sind die stärksten Tage.
- **Feste Wochen für die Vollzeitkräfte:** Nguyen Xuan Manh, Pham Van Nha,
  Nguyen Quang Huy (Arkaden) und Pham Duy Thang (Papenstieg) arbeiten höchstens
  **5 Tage je Woche**; ihr Wochenrhythmus wiederholt sich in allen vollen Wochen
  eines Monats. Die übrigen Verträge füllen danach die Hauptzeit und die
  starken Tage auf.
- **Schichtlängen 3–8 Stunden**, höchstens **8 bezahlte Stunden am Tag** und
  höchstens 6 Tage am Stück. Alle Zeiten liegen auf dem 30-Minuten-Raster. Weil
  durchgehend geöffnet ist, gibt es keine geteilten Tage.

## Belegschaft (Angabe des Betriebs, Stunden je MONAT)

**Schloss Arkaden (658 h):** Nguyen Xuan Manh 150, Pham Van Nha 150, Nguyen
Quang Huy 130, Nguyen Thi Thu Hang 72, Do Thuy Hang 58, Nguyen Thi Khanh Huyen
55, Dinh Thi Duyen 43.

**Papenstieg (439 h):** Pham Duy Thang 160, Bui Thi Huyen 86, Nguyen Trong Hanh
86, Nguyen Tien Long 64, Tang Thi Nhung 43.

Die Anstellungsart (Vollzeit/Teilzeit/Minijob) ist aus den Stunden abgeleitet
und betrifft nur die Beschriftung des Stundenzettels, nicht die Planung. Die
Verträge laufen über **Monatsstunden**; im Tab „Nhân viên" lässt sich je Person
zwischen Monats- und Wochenvertrag umschalten.

## Planung

`src/lib/weeklyScheduler.ts` verteilt das Monats-Soll auf die ISO-Wochen, dann
auf die Tage (Tagesgewicht × Öffnungsdauer) und sucht je Woche die Kombination
aus Arbeitstagen und Schichtlängen, die das Soll exakt trifft und der
Nachfragekurve am nächsten kommt. Öffnungszeiten, Tagesgewichte und
Besetzungsregeln kommen je Filiale aus `src/lib/stores.ts`. Danach:

- **Nachschlag (`topUpShortfalls`)**: Reste aus der 30-Minuten-Rundung hängen
  sich an den Dienst, der der Besetzung am wenigsten schadet.
- Ein Wochenrest unter 3 h wandert in die Nachbarwoche, statt einen
  1–2-Stunden-Dienst zu erzeugen.
- **Feinschliff je Tag**: Lage der Dienste und der Pausen nach der echten
  Besetzung; die Pause liegt nie in der Hauptzeit.

Bekannte Grenze: in einer **angebrochenen Woche am Monatsrand** (z. B. ein
einzelner Samstag am Monatsersten) gehört nur ein Teil der Woche zum Monat. Das
Stundenbudget dieses Tages ist entsprechend klein und reicht rechnerisch nicht
immer für die zweite Person über die ganze Hauptzeit; der Bericht „Độ phủ" zeigt
solche halben Stunden rot an. Die Abdeckung (mindestens eine Person) gilt
trotzdem immer.

## PDF

Stundenzettel und Dienstplan werden als **Vektor-PDF** gezeichnet (jsPDF, Text
und Linien) – kein html2canvas, kein Screenshot. Eine A4-Seite je Mitarbeiter,
identisch auf jedem Gerät, wenige Kilobyte je Seite.

## Entwicklung

```bash
npm install
npm run dev
npm run test
npm run build
```

Persistenz über LocalStorage (Schlüssel je Filiale) und optional Supabase
(`store_data`, eine Zeile je `store_id`), konfiguriert mit `VITE_SUPABASE_URL`
und `VITE_SUPABASE_ANON_KEY`. `VITE_STORE_ID_PREFIX` (z. B. `test-`) lenkt lokal
auf Testzeilen um. Die Passwortsperre im Client ersetzt keine Zugriffskontrolle.
