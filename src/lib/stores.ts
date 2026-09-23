// ============================================================================
// Die zwei Filialen dieses Betriebs. Umschalten passiert im Tab „Cài đặt" und
// in der Kopfzeile; jede Filiale hat ihre eigene Zeile in der gemeinsamen
// Supabase-Tabelle (Schlüssel = id) und ihren eigenen LocalStorage-Schlüssel.
//
// Beide Läden haben dieselben Öffnungszeiten, dieselben Besetzungsregeln und
// liegen in Baden-Württemberg (gleiche Feiertage) – unterschiedlich sind Name,
// Anschrift und Belegschaft.
// ============================================================================

import type { Employee, Schedule } from "../types";
import { cocoEmployees, shinEmployees } from "./sampleData";
import { DEFAULT_WORK_HOURS } from "./workHours";

export type StoreConfig = {
  /** Schlüssel der Zeile in store_data – nach dem Anlegen NICHT mehr ändern. */
  id: string;
  name: string;
  /** Kurzname für den Umschalter in der Kopfzeile. */
  shortName: string;
  address: string;
  /** Belegschaft beim allerersten Öffnen. */
  sampleEmployees: () => Employee[];
};

export const STORES: StoreConfig[] = [
  {
    id: "shin",
    name: "Shin Restaurant",
    shortName: "Shin",
    address: "Hans-Thoma-Str. 2, 76448 Durmersheim",
    sampleEmployees: shinEmployees,
  },
  {
    id: "coco",
    name: "Coco Restaurant",
    shortName: "Coco",
    address: "Bernhäuser Hauptstraße 17, 70794 Filderstadt",
    sampleEmployees: cocoEmployees,
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

/** Startstand einer Filiale: September 2026 mit der Belegschaft aus der Angabe. */
export function initialScheduleFor(store: StoreConfig): Schedule {
  return {
    companyName: store.name,
    address: store.address,
    year: 2026,
    month: 9,
    workHours: structuredClone(DEFAULT_WORK_HOURS),
    dateOverrides: [],
    employees: store.sampleEmployees(),
    shifts: [],
  };
}
