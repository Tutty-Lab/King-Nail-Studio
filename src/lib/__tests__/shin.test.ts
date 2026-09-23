// ============================================================================
// Die Vorgaben des Betriebs (Shin Restaurant) als Test:
//   - Ruhetag Montag, offen Di–So 11:30–15:00 und 17:00–22:00
//   - immer jemand bis 15:00 UND bis 22:00 im Dienst (hart)
//   - eine Schicht ist höchstens 8 h bezahlt, höchstens 6 Tage am Stück
//   - jeder Vertrag (Monatsstunden) wird auf die halbe Stunde genau erfüllt
//   - an Feiertagen ist Bá Việt Nguyen im Dienst
// ============================================================================

import { describe, expect, it } from "vitest";
import type { Employee, Shift } from "../../types";
import { generateSchedule } from "../scheduler";
import { validateSchedule } from "../validation";
import { analyzeSchedule } from "../analyze";
import { SAMPLE_EMPLOYEES, makeEmployee } from "../sampleData";
import { DEFAULT_WORK_HOURS, resolveDay } from "../workHours";
import { publicHolidays, publicHolidayNames } from "../holidays";
import { datesOfMonth, parseIsoDate, weekdayKeyOf } from "../demand";
import { workingAt } from "../staffing";
import { maxConsecutiveRun } from "../consecutive";

const MONTHS = [2, 8, 9, 12];

function openDatesOf(year: number, month: number): string[] {
  const holidays = publicHolidays(year);
  return datesOfMonth(year, month).filter((d) => !resolveDay(DEFAULT_WORK_HOURS, d, holidays, {}).closed);
}

function planOf(year: number, month: number, employees: Employee[] = SAMPLE_EMPLOYEES): Shift[] {
  return generateSchedule({ year, month, workHours: DEFAULT_WORK_HOURS, employees });
}

describe("Shin – Öffnungszeiten und Ruhetag", () => {
  it("plant montags nie, und jeder Dienst liegt in einem Öffnungsblock", () => {
    for (const month of MONTHS) {
      const holidays = publicHolidays(2026);
      for (const shift of planOf(2026, month)) {
        const day = resolveDay(DEFAULT_WORK_HOURS, shift.date, holidays, {});
        expect(weekdayKeyOf(parseIsoDate(shift.date)), shift.date).not.toBe("monday");
        expect(day.closed, shift.date).toBe(false);
        expect(
          day.blocks.some((b) => shift.startMinutes >= b.startMinutes && shift.endMinutes <= b.endMinutes),
          `${shift.date} ${shift.startMinutes}`,
        ).toBe(true);
      }
    }
  });
});

describe("Shin – harte Regeln", () => {
  it("hält jeden Tag jemanden bis 15:00 und bis 22:00 im Dienst", () => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month);
      for (const date of openDatesOf(2026, month)) {
        const onDay = shifts.filter((s) => s.date === date);
        expect(onDay.some((s) => workingAt(s, 14 * 60 + 45)), `${date} 14:45`).toBe(true);
        expect(onDay.some((s) => workingAt(s, 21 * 60 + 45)), `${date} 21:45`).toBe(true);
      }
    }
  });

  it("bleibt bei höchstens 8 bezahlten Stunden je Tag und 6 Tagen am Stück", () => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month);
      const perDay = new Map<string, number>();
      for (const s of shifts) {
        const key = `${s.employeeId}#${s.date}`;
        perDay.set(key, (perDay.get(key) ?? 0) + s.paidMinutes);
      }
      for (const [key, minutes] of perDay) expect(minutes, key).toBeLessThanOrEqual(8 * 60);
      for (const employee of SAMPLE_EMPLOYEES) {
        const dates = new Set(shifts.filter((s) => s.employeeId === employee.id).map((s) => s.date));
        expect(maxConsecutiveRun(dates), `${employee.name} ${month}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it("erfüllt jeden Monatsvertrag auf die halbe Stunde genau", () => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month);
      const result = validateSchedule(SAMPLE_EMPLOYEES, shifts, 2026, openDatesOf(2026, month), DEFAULT_WORK_HOURS);
      expect(result.errors.filter((e) => e.severity !== "warning"), `Monat ${month}`).toEqual([]);
      for (const summary of result.summaries) {
        // 40,2 h lassen sich im 30-Minuten-Raster nicht exakt treffen.
        expect(Math.abs(summary.diffMinutes), `${summary.employee.name} ${month}`).toBeLessThanOrEqual(75);
      }
    }
  });
});

describe("Shin – Feiertage", () => {
  it("setzt Bá Việt Nguyen an jedem geöffneten Feiertag ein", () => {
    for (const month of [1, 4, 5, 6, 10, 11, 12]) {
      const shifts = planOf(2026, month);
      const open = new Set(openDatesOf(2026, month));
      for (const [date, label] of publicHolidayNames(2026)) {
        if (!open.has(date)) continue;
        expect(shifts.some((s) => s.date === date && s.employeeId === "shin-1"), `${date} ${label}`).toBe(true);
      }
    }
  });

  it("meldet es als Warnung, wenn er an einem Feiertag fehlt", () => {
    const employees = [{ ...makeEmployee("x", "Ba Viet Nguyen", "VOLLZEIT", 20), requiredOnHolidays: true }];
    // 03.10.2026 (Tag der Deutschen Einheit) ist ein Samstag – der Laden hat offen.
    const shifts: Shift[] = [
      {
        id: "s1", employeeId: "x", date: "2026-10-02", startMinutes: 17 * 60, endMinutes: 21 * 60,
        pauseMinutes: 0, paidMinutes: 4 * 60, shiftType: "LATE", generated: false,
      },
    ];
    const result = validateSchedule(employees, shifts, 2026, openDatesOf(2026, 10), DEFAULT_WORK_HOURS);
    const warning = result.errors.find((e) => e.date === "2026-10-03" && e.severity === "warning");
    expect(warning?.message).toContain("ngày lễ");
    // Eine Warnung macht den Plan nicht ungültig.
    expect(result.errors.filter((e) => e.severity !== "warning")).toEqual([]);
  });
});

describe("Shin – Besetzung", () => {
  it("bleibt in den Spannen 3–7 mittags und 4–7 abends", () => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month);
      const analysis = analyzeSchedule({
        year: 2026, month, workHours: DEFAULT_WORK_HOURS, employees: SAMPLE_EMPLOYEES, shifts,
      });
      expect(analysis.peakViolations.map((d) => d.date), `Monat ${month}`).toEqual([]);
    }
  });

  it("legt an starken Tagen (T5–CN) mehr Stunden als an T3/T4", () => {
    const shifts = planOf(2026, 9);
    const perDay = (weekdays: number[]) => {
      const days = new Map<string, number>();
      for (const s of shifts) {
        if (!weekdays.includes(new Date(`${s.date}T12:00:00`).getDay())) continue;
        days.set(s.date, (days.get(s.date) ?? 0) + s.paidMinutes);
      }
      return [...days.values()].reduce((sum, minutes) => sum + minutes, 0) / days.size;
    };
    const busy = perDay([4, 5, 6, 0]); // Do, Fr, Sa, So je Tag
    const normal = perDay([2, 3]); // Di, Mi je Tag
    expect(busy / normal).toBeGreaterThan(1.2);
  });
});
