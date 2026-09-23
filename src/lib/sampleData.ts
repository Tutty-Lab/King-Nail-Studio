// ============================================================================
// Beispieldaten: die heutige Besetzung von Shin (8 Personen, MONATSstunden).
//
// Der Betrieb gibt die Verträge in Stunden JE MONAT an (nicht je Woche):
// 169, 173, 169, 160, 180, 86, 169 und 40,2 Stunden. Die 40,2 h sind
// 603 Stunden auf 15 Monate umgelegt.
// ============================================================================

import type { Employee, Schedule } from "../types";
import { DEFAULT_WORK_HOURS } from "./workHours";
import { COMPANY_ADDRESS, COMPANY_NAME } from "./company";

export function makeEmployee(
  id: string,
  name: string,
  employmentType: Employee["employmentType"],
  targetHours: number,
): Employee {
  return { id, name, employmentType, targetMinutes: Math.round(targetHours * 60) };
}

/** Mitarbeiter mit WOCHENvertrag (bei Shin nicht im Einsatz, bleibt für die Oberfläche). */
export function makeWeekly(
  id: string,
  name: string,
  employmentType: Employee["employmentType"],
  weeklyHours: number,
): Employee {
  return { id, name, employmentType, targetMinutes: 0, weeklyHours };
}

/**
 * Belegschaft laut Angabe des Betriebs (Shin Restaurant), 8 Personen.
 *
 * Bá Việt Nguyễn muss an FEIERTAGEN im Dienst sein (ausdrückliche Vorgabe);
 * das steht als requiredOnHolidays am Mitarbeiter und wird beim Planen
 * erzwungen und in der Prüfung kontrolliert.
 *
 * ANNAHME zur Anstellungsart (der Betrieb nennt nur Stunden): ab 160 h Vollzeit,
 * 86 h Teilzeit, 40,2 h Minijob. Das ändert nichts an der Planung, nur an der
 * Beschriftung auf dem Stundenzettel.
 */
export const SAMPLE_EMPLOYEES: Employee[] = [
  { ...makeEmployee("shin-1", "Ba Viet Nguyen", "VOLLZEIT", 169), requiredOnHolidays: true },
  makeEmployee("shin-2", "Quoc Tu Tran", "VOLLZEIT", 173),
  makeEmployee("shin-3", "Quoc Minh Tran", "VOLLZEIT", 169),
  makeEmployee("shin-4", "Van Dang Tran", "VOLLZEIT", 160),
  makeEmployee("shin-5", "Tuyet Trinh Tran", "VOLLZEIT", 180),
  makeEmployee("shin-6", "Ba Nhat Nguyen", "TEILZEIT", 86),
  makeEmployee("shin-7", "Nhu Manh Cao", "VOLLZEIT", 169),
  makeEmployee("shin-8", "Minh Vuong Vu", "MINIJOB", 40.2),
];

export function createSampleSchedule(): Schedule {
  return {
    companyName: COMPANY_NAME,
    address: COMPANY_ADDRESS,
    year: 2026,
    month: 8, // August
    workHours: structuredClone(DEFAULT_WORK_HOURS),
    dateOverrides: [],
    employees: SAMPLE_EMPLOYEES.map((e) => ({ ...e })),
    shifts: [],
  };
}

/** Startbelegschaft, die die App beim allerersten Öffnen zeigt (September 2026). */
export function createInitialSchedule(): Schedule {
  return {
    companyName: COMPANY_NAME,
    address: COMPANY_ADDRESS,
    year: 2026,
    month: 9,
    workHours: structuredClone(DEFAULT_WORK_HOURS),
    dateOverrides: [],
    employees: SAMPLE_EMPLOYEES.map((e) => ({ ...e })),
    shifts: [],
  };
}
