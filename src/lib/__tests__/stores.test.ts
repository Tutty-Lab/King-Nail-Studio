// ============================================================================
// Die Vorgaben des Betriebs für BEIDE Studios (Schloss Arkaden, Papenstieg):
//   - Sonntag und gesetzliche Feiertage geschlossen
//   - jede Filiale hat ihre EIGENEN Öffnungszeiten, und die müssen von der
//     ersten bis zur letzten Minute besetzt sein (nie null Personen)
//   - in der Hauptzeit mehr Leute, am stärksten freitags und samstags
//   - höchstens 8 h bezahlt am Tag, höchstens 6 Tage am Stück
//   - jeder Monatsvertrag wird auf die halbe Stunde genau erfüllt
//   - die Vollzeitkräfte haben einen festen Wochenrhythmus (max. 5 Tage)
// ============================================================================

import { describe, expect, it } from "vitest";
import type { Employee, Shift } from "../../types";
import { generateSchedule } from "../scheduler";
import { validateSchedule } from "../validation";
import { analyzeSchedule } from "../analyze";
import { STORES, initialScheduleFor, storeById, type StoreConfig } from "../stores";
import { resolveDay } from "../workHours";
import { publicHolidays } from "../holidays";
import { datesOfMonth, parseIsoDate, weekdayKeyOf } from "../demand";
import { staffingWindows, workingAt } from "../staffing";
import { maxConsecutiveRun } from "../consecutive";
import { weekStartOf } from "../weeks";

const MONTHS = [2, 6, 9, 12];
/** Jede Filiale mit ihrer Belegschaft – die Regeln gelten für beide gleich. */
const TEAMS = STORES.map((store) => [store.shortName, store] as const);

function openDatesOf(year: number, month: number, store: StoreConfig): string[] {
  const holidays = publicHolidays(year);
  return datesOfMonth(year, month).filter((d) => !resolveDay(store.workHours, d, holidays, {}).closed);
}

function teamOf(store: StoreConfig): Employee[] {
  return store.sampleEmployees();
}

function planOf(year: number, month: number, store: StoreConfig, employees = teamOf(store)): Shift[] {
  return generateSchedule({
    year,
    month,
    workHours: store.workHours,
    employees,
    rules: store.staffingRules,
    weights: store.dayWeights,
    storeTag: store.id,
  });
}

/** Wie viele Leute sind zu dieser Minute im Studio? */
const staffAt = (shifts: Shift[], minute: number): number =>
  new Set(shifts.filter((s) => workingAt(s, minute)).map((s) => s.employeeId)).size;

/**
 * Eine ISO-Woche liegt GANZ im Monat, wenn alle sechs Öffnungstage im Monat
 * liegen und kein Feiertag dazwischen ausfällt. Nur solche Wochen dürfen
 * miteinander verglichen werden (Randwochen haben weniger Stunden).
 */
function fullWeeksOf(dates: string[]): Map<string, string[]> {
  const byWeek = new Map<string, string[]>();
  for (const date of dates) byWeek.set(weekStartOf(date), [...(byWeek.get(weekStartOf(date)) ?? []), date]);
  return new Map([...byWeek].filter(([, days]) => days.length === 6));
}

describe("Öffnungszeiten je Filiale", () => {
  it.each(TEAMS)("%s: plant nie sonntags, nie an Feiertagen, und jeder Dienst liegt im Öffnungsfenster", (_name, store) => {
    const holidays = publicHolidays(2026);
    for (const month of MONTHS) {
      for (const shift of planOf(2026, month, store)) {
        const day = resolveDay(store.workHours, shift.date, holidays, {});
        expect(weekdayKeyOf(parseIsoDate(shift.date)), shift.date).not.toBe("sunday");
        expect(holidays.has(shift.date), shift.date).toBe(false);
        expect(day.closed, shift.date).toBe(false);
        expect(
          day.blocks.some((b) => shift.startMinutes >= b.startMinutes && shift.endMinutes <= b.endMinutes),
          `${shift.date} ${shift.startMinutes}`,
        ).toBe(true);
      }
    }
  });

  it("die beiden Studios haben unterschiedliche Zeiten: Arkaden 09:30–20:00, Papenstieg 09:00–19:00 (Sa 18:00)", () => {
    const arkaden = storeById("arkaden").workHours;
    expect(arkaden.perWeekday.tuesday).toEqual([{ startMinutes: 9 * 60 + 30, endMinutes: 20 * 60 }]);
    expect(arkaden.perWeekday.saturday).toEqual([{ startMinutes: 9 * 60 + 30, endMinutes: 20 * 60 }]);
    const papen = storeById("papenstieg").workHours;
    expect(papen.perWeekday.tuesday).toEqual([{ startMinutes: 9 * 60, endMinutes: 19 * 60 }]);
    expect(papen.perWeekday.saturday).toEqual([{ startMinutes: 9 * 60, endMinutes: 18 * 60 }]);
    for (const store of STORES) {
      expect(store.workHours.closedWeekdays.sunday).toBe(true);
      expect(store.workHours.closedWeekdays.monday).toBe(false);
      expect(store.workHours.holidayClosed).toBe(true);
    }
  });
});

describe("Harte Regeln (beide Filialen)", () => {
  it.each(TEAMS)("%s: es ist von der ersten bis zur letzten Minute jemand im Studio", (_name, store) => {
    const holidays = publicHolidays(2026);
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, store);
      for (const date of openDatesOf(2026, month, store)) {
        const onDay = shifts.filter((s) => s.date === date);
        const day = resolveDay(store.workHours, date, holidays, {});
        for (const block of day.blocks) {
          for (let m = block.startMinutes; m < block.endMinutes; m += 30) {
            expect(staffAt(onDay, m), `${date} ${m}`).toBeGreaterThanOrEqual(1);
          }
        }
      }
    }
  });

  it.each(TEAMS)("%s: bleibt bei höchstens 8 bezahlten Stunden je Tag und 6 Tagen am Stück", (_name, store) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, store);
      const perDay = new Map<string, number>();
      for (const s of shifts) {
        const key = `${s.employeeId}#${s.date}`;
        perDay.set(key, (perDay.get(key) ?? 0) + s.paidMinutes);
      }
      for (const [key, minutes] of perDay) expect(minutes, key).toBeLessThanOrEqual(8 * 60);
      for (const employee of teamOf(store)) {
        const dates = new Set(shifts.filter((s) => s.employeeId === employee.id).map((s) => s.date));
        expect(maxConsecutiveRun(dates), `${employee.name} ${month}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it.each(TEAMS)("%s: erfüllt jeden Monatsvertrag auf die halbe Stunde genau", (_name, store) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, store);
      const team = teamOf(store);
      const result = validateSchedule(team, shifts, 2026, openDatesOf(2026, month, store), store.workHours);
      expect(result.errors.filter((e) => e.severity !== "warning"), `Monat ${month}`).toEqual([]);
      for (const summary of result.summaries) {
        expect(Math.abs(summary.diffMinutes), `${summary.employee.name} ${month}`).toBeLessThanOrEqual(30);
        expect(summary.assignedMinutes, `${summary.employee.name} ${month}`).toBeLessThanOrEqual(summary.targetMinutes);
      }
    }
  });
});

describe("Hauptzeit", () => {
  /**
   * Die Untergrenzen der Hauptzeit (Arkaden 2 bzw. samstags 3, Papenstieg 2 an
   * Fr/Sa) werden an allen Tagen eingehalten – AUSSER in einer angebrochenen
   * Woche am Monatsrand: dort gehört nur ein Teil der Woche zum Monat, das
   * Stundenbudget des Tages ist entsprechend klein und reicht rechnerisch nicht
   * immer für die zweite Person über die volle Spanne. Der Bericht „Độ phủ"
   * zeigt solche Stellen rot an.
   */
  it.each(TEAMS)("%s: hält die Untergrenzen – Lücken höchstens in der Randwoche", (_name, store) => {
    const holidays = publicHolidays(2026);
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, store);
      const open = openDatesOf(2026, month, store);
      const voll = fullWeeksOf(open);
      for (const date of open) {
        const onDay = shifts.filter((s) => s.date === date);
        const day = resolveDay(store.workHours, date, holidays, {});
        const weekday = weekdayKeyOf(parseIsoDate(date));
        const randwoche = !voll.has(weekStartOf(date));
        for (const w of staffingWindows(day.blocks, weekday, store.staffingRules)) {
          if (w.minStaff < 2) continue; // die Abdeckung selbst prüft der Test oben
          for (let m = w.startMinutes; m < w.endMinutes; m += 30) {
            const staff = staffAt(onDay, m);
            if (randwoche) expect(staff, `${date} ${m}`).toBeGreaterThanOrEqual(1);
            else expect(staff, `${date} ${m} ${w.label}`).toBeGreaterThanOrEqual(w.minStaff);
          }
        }
      }
    }
  });

  it.each(TEAMS)("%s: überschreitet nie die Obergrenze einer Spanne", (_name, store) => {
    for (const month of MONTHS) {
      const analysis = analyzeSchedule({
        year: 2026, month, workHours: store.workHours, employees: teamOf(store),
        shifts: planOf(2026, month, store), rules: store.staffingRules, weights: store.dayWeights,
      });
      for (const day of analysis.days) {
        for (const peak of day.peaks) {
          expect(peak.maxStaff, `${day.date} ${peak.label}`).toBeLessThanOrEqual(peak.allowed);
        }
      }
    }
  });

  it.each(TEAMS)("%s: mittags/nachmittags stehen mehr Leute als direkt nach dem Öffnen", (_name, store) => {
    const shifts = planOf(2026, 9, store);
    const open = openDatesOf(2026, 9, store);
    const avg = (minute: number) =>
      open.reduce((sum, date) => sum + staffAt(shifts.filter((s) => s.date === date), minute), 0) / open.length;
    expect(avg(16 * 60)).toBeGreaterThan(avg(10 * 60));
    expect(avg(17 * 60 + 30)).toBeGreaterThan(avg(10 * 60));
  });
});

describe("Tagesgewichte", () => {
  it("Freitag und Samstag sind die stärksten Tage, Dienstag der schwächste", () => {
    for (const store of STORES) {
      expect(store.dayWeights.friday).toBe(2);
      expect(store.dayWeights.saturday).toBe(2);
      expect(store.dayWeights.tuesday).toBe(1);
      expect(store.dayWeights.monday).toBe(1.2);
      expect(store.dayWeights.wednesday).toBe(1.2);
      expect(store.dayWeights.thursday).toBe(1.2);
    }
  });

  it.each(TEAMS)("%s: legt freitags und samstags deutlich mehr Stunden als dienstags", (_name, store) => {
    const shifts = planOf(2026, 9, store);
    const hoursOn = (weekdays: string[]) => {
      const days = new Map<string, number>();
      for (const s of shifts) {
        if (!weekdays.includes(weekdayKeyOf(parseIsoDate(s.date)))) continue;
        days.set(s.date, (days.get(s.date) ?? 0) + s.paidMinutes);
      }
      return [...days.values()].reduce((sum, m) => sum + m, 0) / days.size;
    };
    expect(hoursOn(["friday", "saturday"]) / hoursOn(["tuesday"])).toBeGreaterThan(1.4);
  });
});

describe("Feste Wochen für die Vollzeitkräfte", () => {
  it.each(TEAMS)("%s: höchstens 5 Arbeitstage je Woche, und der Rhythmus wiederholt sich", (_name, store) => {
    const shifts = planOf(2026, 9, store);
    const voll = fullWeeksOf(openDatesOf(2026, 9, store));
    for (const employee of teamOf(store).filter((e) => e.maxDaysPerWeek)) {
      const muster = new Set<string>();
      for (const [week, days] of voll) {
        const worked = days.filter((date) => shifts.some((s) => s.employeeId === employee.id && s.date === date));
        expect(worked.length, `${employee.name} ${week}`).toBeLessThanOrEqual(employee.maxDaysPerWeek!);
        muster.add(worked.map((date) => weekdayKeyOf(parseIsoDate(date))).join(","));
      }
      // Alle vollen Wochen des Monats haben dieselben Arbeitstage.
      expect([...muster], employee.name).toHaveLength(1);
    }
  });
});

describe("Zwei Filialen", () => {
  it("führt jede Filiale getrennt: eigene Anschrift, eigene Belegschaft, eigene Ids", () => {
    expect(STORES.map((s) => s.id)).toEqual(["arkaden", "papenstieg"]);
    const all = STORES.flatMap((store) => initialScheduleFor(store).employees);
    expect(new Set(all.map((e) => e.id)).size).toBe(all.length);
    expect(initialScheduleFor(storeById("arkaden")).address).toContain("Ritterbrunnen");
    expect(initialScheduleFor(storeById("papenstieg")).address).toContain("Papenstieg");
    expect(initialScheduleFor(storeById("arkaden")).employees).toHaveLength(7);
    expect(initialScheduleFor(storeById("papenstieg")).employees).toHaveLength(5);
  });

  it("die Vertragsstunden stimmen mit der Angabe des Betriebs überein", () => {
    const hours = (store: StoreConfig) =>
      store.sampleEmployees().map((e) => e.targetMinutes / 60).sort((a, b) => a - b);
    expect(hours(storeById("arkaden"))).toEqual([43, 55, 58, 72, 130, 150, 150]);
    expect(hours(storeById("papenstieg"))).toEqual([43, 64, 86, 86, 160]);
  });

  it("niemand arbeitet in beiden Studios (keine Doppelbelegung nötig)", () => {
    const names = STORES.flatMap((store) => store.sampleEmployees().map((e) => e.name));
    expect(new Set(names).size).toBe(names.length);
    expect(STORES.flatMap((s) => s.sampleEmployees()).filter((e) => e.personKey)).toEqual([]);
  });
});

describe("Schichtzuschnitt", () => {
  it.each(TEAMS)("%s: jede Uhrzeit liegt auf dem 30-Minuten-Raster", (_name, store) => {
    for (const month of MONTHS) {
      for (const shift of planOf(2026, month, store)) {
        expect(shift.startMinutes % 30, `${shift.date} ${shift.startMinutes}`).toBe(0);
        expect(shift.endMinutes % 30, `${shift.date} ${shift.endMinutes}`).toBe(0);
      }
    }
  });

  it.each(TEAMS)("%s: ein Dienst ist nie kürzer als 3 h, und niemand hat zwei Dienste am Tag", (_name, store) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, store);
      for (const shift of shifts) {
        const sameDay = shifts.filter((s) => s.employeeId === shift.employeeId && s.date === shift.date);
        // Das Studio hat durchgehend offen – es gibt keinen geteilten Tag.
        expect(sameDay, `${shift.date} ${shift.employeeId}`).toHaveLength(1);
        expect(shift.paidMinutes, `${shift.date} ${shift.employeeId}`).toBeGreaterThanOrEqual(180);
      }
    }
  });

  it("verschiebt einen Rest unter 3 h aus der Randwoche in die Nachbarwoche", () => {
    for (const store of STORES) {
      const shifts = planOf(2026, 1, store);
      expect(shifts.filter((shift) => shift.paidMinutes < 180), store.shortName).toEqual([]);
    }
  });
});
