// ============================================================================
// Startbelegschaft beider Studios. Beide rechnen in MONATSstunden (nicht je Woche).
//
// Schloss Arkaden: 58, 150, 130, 72, 55, 43 und 150 Stunden (zusammen 658 h).
// Papenstieg: 160, 64, 86, 43 und 86 Stunden (zusammen 439 h).
// ============================================================================

import type { Employee, Schedule } from "../types";
import { ARKADEN_WORK_HOURS } from "./workHours";

export function makeEmployee(
  id: string,
  name: string,
  employmentType: Employee["employmentType"],
  targetHours: number,
): Employee {
  return { id, name, employmentType, targetMinutes: Math.round(targetHours * 60) };
}

/** Mitarbeiter mit WOCHENvertrag (hier nicht im Einsatz, bleibt für die Oberfläche). */
export function makeWeekly(
  id: string,
  name: string,
  employmentType: Employee["employmentType"],
  weeklyHours: number,
): Employee {
  return { id, name, employmentType, targetMinutes: 0, weeklyHours };
}

/**
 * Cơ sở 1 – King Nail Schloss Arkaden, Platz am Ritterbrunnen 1, 38100 Braunschweig.
 *
 * ANNAHME zur Anstellungsart (der Betrieb nennt nur Stunden): ab 130 h
 * Vollzeit, 55–86 h Teilzeit, 43 h Minijob – das ändert nur die Beschriftung
 * auf dem Stundenzettel, nicht die Planung.
 *
 * Die Vollzeitkräfte (150/150/130 h) bekommen höchstens FÜNF Arbeitstage je
 * Woche. Weil die Tagesgewichte jede Woche gleich sind, wiederholt sich ihr
 * Rhythmus dadurch von Woche zu Woche – „lịch cố định" wie gewünscht –, und es
 * bleiben Tage frei, an denen die Teilzeitkräfte die Hauptzeit verstärken.
 */
export function arkadenEmployees(): Employee[] {
  return [
    { ...makeEmployee("arkaden-1", "Nguyen Xuan Manh", "VOLLZEIT", 150), maxDaysPerWeek: 5 },
    { ...makeEmployee("arkaden-2", "Pham Van Nha", "VOLLZEIT", 150), maxDaysPerWeek: 5 },
    { ...makeEmployee("arkaden-3", "Nguyen Quang Huy", "VOLLZEIT", 130), maxDaysPerWeek: 5 },
    makeEmployee("arkaden-4", "Nguyen Thi Thu Hang", "TEILZEIT", 72),
    makeEmployee("arkaden-5", "Do Thuy Hang", "TEILZEIT", 58),
    makeEmployee("arkaden-6", "Nguyen Thi Khanh Huyen", "TEILZEIT", 55),
    makeEmployee("arkaden-7", "Dinh Thi Duyen", "MINIJOB", 43),
  ];
}

/**
 * Cơ sở 2 – King Nail Papenstieg, Papenstieg 8, 38100 Braunschweig.
 *
 * Gleiche Annahme zur Anstellungsart. Pham Duy Thang (160 h) ist die feste
 * Vollzeitkraft des Ladens und arbeitet höchstens fünf Tage je Woche.
 */
export function papenstiegEmployees(): Employee[] {
  return [
    { ...makeEmployee("papen-1", "Pham Duy Thang", "VOLLZEIT", 160), maxDaysPerWeek: 5 },
    makeEmployee("papen-2", "Bui Thi Huyen", "TEILZEIT", 86),
    makeEmployee("papen-3", "Nguyen Trong Hanh", "TEILZEIT", 86),
    makeEmployee("papen-4", "Nguyen Tien Long", "TEILZEIT", 64),
    makeEmployee("papen-5", "Tang Thi Nhung", "MINIJOB", 43),
  ];
}

/** Belegschaft der Standard-Filiale – für Tests und Altaufrufe. */
export const SAMPLE_EMPLOYEES: Employee[] = arkadenEmployees();

export function createSampleSchedule(): Schedule {
  return {
    companyName: "King Nail Schloss Arkaden",
    address: "Platz am Ritterbrunnen 1, 38100 Braunschweig",
    year: 2026,
    month: 9,
    workHours: structuredClone(ARKADEN_WORK_HOURS),
    dateOverrides: [],
    employees: arkadenEmployees(),
    shifts: [],
  };
}
