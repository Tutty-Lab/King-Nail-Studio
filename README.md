# Dienstplan & Stundenzettel — Shin Restaurant

Hans-Thoma-Str. 2, 76448 Durmersheim (Baden-Württemberg). React-Anwendung für
die Monatsplanung und die deutschen Stundenaufzeichnungen. Die Oberfläche ist
auf Vietnamesisch.

## Öffnungszeiten

- **Montag Ruhetag**, auch an einem Feiertag. Nur eine Datumsausnahme mit
  eigenen Zeiten öffnet den Tag.
- **Dienstag–Sonntag und Feiertage:** 11:30–15:00 und 17:00–22:00. Die Zeit
  dazwischen ist **geschlossen** – keine bezahlte Pause, sondern zu.
- Feiertage richten sich nach **Baden-Württemberg** (`src/lib/holidays.ts`).

## Vorgaben des Betriebs

- **Immer jemand bis 15:00 und bis 22:00 im Dienst** – zwei harte Regeln
  (`Chốt ca trưa`, `Đóng cửa` in `src/lib/staffing.ts`).
- **Eine Schicht besetzt etwa 4–5 Leute**: mittags 3–7, abends 4–7 Personen.
- **Donnerstag bis Sonntag ist stärker** (Umsatz ~3.500–4.000 € gegenüber
  ~2.000 € an normalen Tagen, Feiertage 4.500–5.000 €). Tagesgewicht 1,5
  gegenüber 1,0; Feiertage zählen wie Sonntag.
- **Schichtlängen 3–8 Stunden**, höchstens **8 bezahlte Stunden am Tag** und
  höchstens 6 Tage am Stück.
- **An Feiertagen ist Bá Việt Nguyen im Dienst** (`requiredOnHolidays` am
  Mitarbeiter, im Tab „Nhân viên" als „Trực ngày lễ" anzukreuzen).

## Belegschaft (Angabe des Betriebs, Stunden je MONAT)

| Mitarbeiter | Stunden/Monat |
|---|---|
| Ba Viet Nguyen (Feiertagsdienst) | 169 |
| Quoc Tu Tran | 173 |
| Quoc Minh Tran | 169 |
| Van Dang Tran | 160 |
| Tuyet Trinh Tran | 180 |
| Ba Nhat Nguyen | 86 |
| Nhu Manh Cao | 169 |
| Minh Vuong Vu | 40,2 (603 h ÷ 15 Monate) |

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

Persistenz über LocalStorage und optional Supabase (`store_data`, `store_id` =
`shin`), konfiguriert mit `VITE_SUPABASE_URL` und `VITE_SUPABASE_ANON_KEY`.
Die Passwortsperre im Client ersetzt keine Zugriffskontrolle.
