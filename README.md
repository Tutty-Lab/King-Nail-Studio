# Dienstplan & Stundenzettel — Shin & Coco

Eine App für zwei Restaurants desselben Betreibers in Baden-Württemberg. Die
Oberfläche ist auf Vietnamesisch; umgeschaltet wird im Tab „Cài đặt" (Feld
„Cửa hàng") oder in der Kopfzeile. Jede Filiale hat eigene Mitarbeiter, eigene
Pläne, ein eigenes Passwort und eine eigene Zeile in Supabase.

| Filiale | `store_id` | Anschrift |
|---|---|---|
| Shin Restaurant | `shin` | Hans-Thoma-Str. 2, 76448 Durmersheim |
| Coco Restaurant | `coco` | Bernhäuser Hauptstraße 17, 70794 Filderstadt |

## Öffnungszeiten (für beide gleich)

- **Montag Ruhetag**, auch an einem Feiertag. Nur eine Datumsausnahme mit
  eigenen Zeiten öffnet den Tag.
- **Dienstag–Sonntag und Feiertage:** 11:30–15:00 und 17:00–22:00. Die Zeit
  dazwischen ist **geschlossen** – keine bezahlte Pause, sondern zu.
- Feiertage nach **Baden-Württemberg** (`src/lib/holidays.ts`).

## Vorgaben des Betriebs

- **Immer jemand bis 15:00 und bis 22:00 im Dienst** – zwei harte Regeln
  (`Chốt ca trưa`, `Đóng cửa` in `src/lib/staffing.ts`).
- **Eine Schicht besetzt etwa 4–5 Leute**: mittags 3–7, abends 4–7 Personen.
- **Donnerstag bis Sonntag ist stärker** (Umsatz ~3.500–4.000 € gegenüber
  ~2.000–2.500 € an normalen Tagen, Feiertage 4.500–5.000 €). Tagesgewicht 1,5
  gegenüber 1,0; Feiertage zählen wie Sonntag.
- **Schichtlängen 3–8 Stunden**, höchstens **8 bezahlte Stunden am Tag** und
  höchstens 6 Tage am Stück.
- **Shin: an Feiertagen ist Bá Việt Nguyen im Dienst** (`requiredOnHolidays`,
  im Tab „Nhân viên" als „Trực ngày lễ" anzukreuzen). Coco hat keine solche
  Vorgabe.

## Belegschaft (Angabe des Betriebs, Stunden je MONAT)

**Shin:** Ba Viet Nguyen 169 (Feiertagsdienst), Quoc Tu Tran 173, Quoc Minh
Tran 169, Van Dang Tran 160, Tuyet Trinh Tran 180, Ba Nhat Nguyen 86, Nhu Manh
Cao 169, Minh Vuong Vu 40,2 (603 h ÷ 15 Monate).

**Coco:** Nguyen Thu Van 173, Nguyen Thi Minh Tam 173, Duy Phuong Do 173, Dinh
Trong Huy 156, Ba Anh Nguyen 130, Viet Trung Nguyen 152, Thi Huong Nguyen 39,
Viet An Bui 43.

Die Verträge laufen über **Monatsstunden**; im Tab „Nhân viên" lässt sich je
Person zwischen Monats- und Wochenvertrag umschalten.

## Planung

`src/lib/weeklyScheduler.ts` verteilt das Monats-Soll auf die ISO-Wochen, dann
auf die Tage (Tagesgewicht × Öffnungsdauer) und sucht je Woche die Kombination
aus Arbeitstagen und Schichtlängen, die das Soll exakt trifft und der
Nachfragekurve am nächsten kommt. Danach:

- **Feiertagsdienst** wird vor allem anderen gehalten.
- **Nachschlag (`topUpShortfalls`)**: Reste aus der 30-Minuten-Rundung hängen
  sich an den Dienst, der der Besetzung am wenigsten schadet – dadurch trifft
  fast jeder Vertrag auf die halbe Stunde genau.
- **Feinschliff je Tag**: Lage der Dienste und der Pausen nach der echten
  Besetzung.

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
