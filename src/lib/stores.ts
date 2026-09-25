// ============================================================================
// Die zwei Studios dieses Betriebs. Umschalten passiert im Tab „Cài đặt" und in
// der Kopfzeile; jedes Studio hat seine eigene Zeile in der gemeinsamen
// Supabase-Tabelle (Schlüssel = id) und seinen eigenen LocalStorage-Schlüssel.
//
// Beide liegen in Braunschweig (Niedersachsen, gleiche Feiertage), haben aber
// UNTERSCHIEDLICHE Öffnungszeiten, eigene Besetzungsregeln und eigene Teams.
// ============================================================================

import type { Employee, Schedule } from "../types";
import { arkadenEmployees, papenstiegEmployees } from "./sampleData";
import { DAY_WEIGHTS, type WeekdayKey } from "./demand";
import { ARKADEN_STAFFING_RULES, PAPENSTIEG_STAFFING_RULES, type StaffingRule } from "./staffing";
import { ARKADEN_WORK_HOURS, PAPENSTIEG_WORK_HOURS, type WorkHoursConfig } from "./workHours";

export type StoreConfig = {
  /** Schlüssel der Zeile in store_data – nach dem Anlegen NICHT mehr ändern. */
  id: string;
  name: string;
  /** Kurzname für den Umschalter in der Kopfzeile. */
  shortName: string;
  address: string;
  /** Telefon des Studios (nur Anzeige/Dokumentation). */
  phone: string;
  /** Öffnungszeiten dieses Studios. */
  workHours: WorkHoursConfig;
  /** Belegschaft beim allerersten Öffnen. */
  sampleEmployees: () => Employee[];
  /** Welche Wochentage stark sind (Kundenandrang) – steuert die Stundenverteilung. */
  dayWeights: Record<WeekdayKey, number>;
  /** Wie viele Leute wann im Studio sein sollen. */
  staffingRules: readonly StaffingRule[];
};

export const STORES: StoreConfig[] = [
  {
    id: "arkaden",
    name: "King Nail Schloss Arkaden",
    shortName: "Arkaden",
    address: "Platz am Ritterbrunnen 1, 38100 Braunschweig",
    phone: "0531 88532798",
    workHours: ARKADEN_WORK_HOURS,
    sampleEmployees: arkadenEmployees,
    dayWeights: DAY_WEIGHTS,
    staffingRules: ARKADEN_STAFFING_RULES,
  },
  {
    id: "papenstieg",
    name: "King Nail Papenstieg",
    shortName: "Papenstieg",
    address: "Papenstieg 8, 38100 Braunschweig",
    phone: "+49 531 34967521",
    workHours: PAPENSTIEG_WORK_HOURS,
    sampleEmployees: papenstiegEmployees,
    dayWeights: DAY_WEIGHTS,
    staffingRules: PAPENSTIEG_STAFFING_RULES,
  },
];

export const DEFAULT_STORE_ID = STORES[0].id;

/** Merkt sich die zuletzt gewählte Filiale auf diesem Gerät. */
const STORE_KEY = "stundenzettel-app:store";

export function loadStoreId(): string {
  try {
    const saved = localStorage.getItem(STORE_KEY);
    if (saved && STORES.some((s) => s.id === saved)) return saved;
  } catch {
    /* ignorieren */
  }
  return DEFAULT_STORE_ID;
}

export function saveStoreId(id: string): void {
  try {
    localStorage.setItem(STORE_KEY, id);
  } catch {
    /* ignorieren */
  }
}

export function storeById(id: string): StoreConfig {
  return STORES.find((s) => s.id === id) ?? STORES[0];
}

/** Startstand eines Studios: September 2026 mit der Belegschaft aus der Angabe. */
export function initialScheduleFor(store: StoreConfig): Schedule {
  return {
    companyName: store.name,
    address: store.address,
    year: 2026,
    month: 9,
    workHours: structuredClone(store.workHours),
    dateOverrides: [],
    employees: store.sampleEmployees(),
    shifts: [],
  };
}
