// ============================================================================
// Die Vorgaben des Betriebs (Shin und Coco) als Test – beide Läden haben
// dieselben Öffnungszeiten und Regeln, nur andere Belegschaft:
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
import { makeEmployee } from "../sampleData";
import { STORES, initialScheduleFor, storeById } from "../stores";
import { DEFAULT_WORK_HOURS, resolveDay } from "../workHours";
import { publicHolidays, publicHolidayNames } from "../holidays";
import { datesOfMonth, parseIsoDate, weekdayKeyOf } from "../demand";
import { workingAt } from "../staffing";
import { maxConsecutiveRun } from "../consecutive";

const MONTHS = [2, 8, 9, 12];

/** Belegschaft je Filiale – die Regeln gelten für beide gleich. */
const TEAMS = STORES.map((store) => [store.shortName, store.sampleEmployees()] as const);

function openDatesOf(year: number, month: number): string[] {
  const holidays = publicHolidays(year);
  return datesOfMonth(year, month).filter((d) => !resolveDay(DEFAULT_WORK_HOURS, d, holidays, {}).closed);
}

function planOf(year: number, month: number, employees: Employee[] = storeById("shin").sampleEmployees()): Shift[] {
  return generateSchedule({ year, month, workHours: DEFAULT_WORK_HOURS, employees });
}

describe("Öffnungszeiten und Ruhetag", () => {
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

describe("Harte Regeln (beide Filialen)", () => {
  it.each(TEAMS)("%s: hält jeden Tag jemanden bis 15:00 und bis 22:00 im Dienst", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      for (const date of openDatesOf(2026, month)) {
        const onDay = shifts.filter((s) => s.date === date);
        expect(onDay.some((s) => workingAt(s, 14 * 60 + 45)), `${date} 14:45`).toBe(true);
        expect(onDay.some((s) => workingAt(s, 21 * 60 + 45)), `${date} 21:45`).toBe(true);
      }
    }
  });

  it.each(TEAMS)("%s: bleibt bei höchstens 8 bezahlten Stunden je Tag und 6 Tagen am Stück", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      const perDay = new Map<string, number>();
      for (const s of shifts) {
        const key = `${s.employeeId}#${s.date}`;
        perDay.set(key, (perDay.get(key) ?? 0) + s.paidMinutes);
      }
      for (const [key, minutes] of perDay) expect(minutes, key).toBeLessThanOrEqual(8 * 60);
      for (const employee of team) {
        const dates = new Set(shifts.filter((s) => s.employeeId === employee.id).map((s) => s.date));
        expect(maxConsecutiveRun(dates), `${employee.name} ${month}`).toBeLessThanOrEqual(6);
      }
    }
  });

  it.each(TEAMS)("%s: erfüllt jeden Monatsvertrag auf die halbe Stunde genau", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      const result = validateSchedule(team, shifts, 2026, openDatesOf(2026, month), DEFAULT_WORK_HOURS);
      expect(result.errors.filter((e) => e.severity !== "warning"), `Monat ${month}`).toEqual([]);
      for (const summary of result.summaries) {
        // 40,2 h lassen sich im 30-Minuten-Raster nicht exakt treffen.
        expect(Math.abs(summary.diffMinutes), `${summary.employee.name} ${month}`).toBeLessThanOrEqual(75);
      }
    }
  });
});

describe("Shin – Feiertagsdienst", () => {
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

describe("Besetzung", () => {
  it.each(TEAMS)("%s: bleibt in den Spannen 3–7 mittags und 4–7 abends", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      const analysis = analyzeSchedule({
        year: 2026, month, workHours: DEFAULT_WORK_HOURS, employees: team, shifts,
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

describe("Zwei Filialen", () => {
  it("führt Shin und Coco getrennt: eigene Anschrift und eigene Belegschaft", () => {
    const shin = initialScheduleFor(storeById("shin"));
    const coco = initialScheduleFor(storeById("coco"));
    expect(shin.companyName).toBe("Shin Restaurant");
    expect(coco.companyName).toBe("Coco Restaurant");
    expect(coco.address).toContain("Filderstadt");
    expect(shin.employees).toHaveLength(8);
    expect(coco.employees).toHaveLength(8);
    // Keine Id doppelt – sonst würden sich die Pläne beider Läden vermischen.
    const ids = [...shin.employees, ...coco.employees].map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
    // Coco hat keine Feiertagspflicht.
    expect(coco.employees.some((e) => e.requiredOnHolidays)).toBe(false);
    expect(shin.employees.filter((e) => e.requiredOnHolidays)).toHaveLength(1);
  });
});

describe("Schichtzuschnitt", () => {
  it.each(TEAMS)("%s: jede Uhrzeit liegt auf dem 30-Minuten-Raster", (_name, team) => {
    for (const month of MONTHS) {
      for (const shift of planOf(2026, month, team)) {
        expect(shift.startMinutes % 30, `${shift.date} ${shift.startMinutes}`).toBe(0);
        expect(shift.endMinutes % 30, `${shift.date} ${shift.endMinutes}`).toBe(0);
      }
    }
  });

  it.each(TEAMS)("%s: ein EINZELNER Dienst am Tag ist nie kürzer als 3 h", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      for (const shift of shifts) {
        const sameDay = shifts.filter((s) => s.employeeId === shift.employeeId && s.date === shift.date);
        // Ein geteilter Tag (mittags + abends) darf ein kürzeres Stück haben,
        // mindestens aber 2 h; der Tag selbst bleibt über 3 h.
        if (sameDay.length === 1) {
          expect(shift.paidMinutes, `${shift.date} ${shift.employeeId}`).toBeGreaterThanOrEqual(180);
        } else {
          expect(shift.paidMinutes, `${shift.date} ${shift.employeeId}`).toBeGreaterThanOrEqual(120);
          const day = sameDay.reduce((sum, s) => sum + s.paidMinutes, 0);
          expect(day, `${shift.date} ${shift.employeeId}`).toBeGreaterThanOrEqual(180);
        }
      }
    }
  });

  it.each(TEAMS)("%s: niemand wird über den Vertrag hinaus verplant", (_name, team) => {
    for (const month of MONTHS) {
      const shifts = planOf(2026, month, team);
      const result = validateSchedule(team, shifts, 2026, openDatesOf(2026, month), DEFAULT_WORK_HOURS);
      for (const summary of result.summaries) {
        expect(summary.assignedMinutes, `${summary.employee.name} ${month}`).toBeLessThanOrEqual(summary.targetMinutes);
      }
    }
  });

  it("verschiebt einen Rest unter 3 h aus der Randwoche in die Nachbarwoche", () => {
    // Januar 2026 beginnt mitten in der Woche ab 29.12. – dort landete früher
    // ein 1,5-Stunden-Dienst für die kleinen Verträge.
    const team = storeById("shin").sampleEmployees();
    const shifts = planOf(2026, 1, team);
    const single = shifts.filter((shift) => {
      const sameDay = shifts.filter((s) => s.employeeId === shift.employeeId && s.date === shift.date);
      return sameDay.length === 1 && shift.paidMinutes < 180;
    });
    expect(single).toEqual([]);
  });
});

describe("PDF cho cả hai quán", () => {
  it("gộp đúng số trang: mỗi nhân viên một trang, hai quán một file", async () => {
    const { buildStundenzettelPdfFor, buildDienstplanPdfFor } = await import("../pdf");
    const jobs = STORES.map((store) => {
      const schedule = initialScheduleFor(store);
      schedule.shifts = generateSchedule({
        year: schedule.year,
        month: schedule.month,
        workHours: schedule.workHours,
        employees: schedule.employees,
      });
      return { store, schedule };
    });

    const sz = await buildStundenzettelPdfFor(
      jobs.map((job) => ({ schedule: job.schedule, employees: job.schedule.employees })),
    );
    const employees = jobs.reduce((sum, job) => sum + job.schedule.employees.length, 0);
    // Früher lagen ohne onProgress alle Seiten übereinander auf Seite 1.
    expect(sz.getNumberOfPages()).toBe(employees);

    const dates = datesOfMonth(jobs[0].schedule.year, jobs[0].schedule.month);
    const plan = buildDienstplanPdfFor(
      jobs.map((job) => ({ schedule: job.schedule, dates, title: job.store.shortName })),
      "byDate",
    );
    expect(plan.getNumberOfPages()).toBe(jobs.length);
  });
});
