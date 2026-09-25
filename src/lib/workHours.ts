// ============================================================================
// Öffnungszeiten je Wochentag. King Nail hat DURCHGEHEND offen (kein Block in
// der Mitte), sonntags und an Feiertagen ist zu. Jede Filiale bringt ihre
// eigenen Zeiten mit (stores.ts) – im Einkaufszentrum wird länger geöffnet als
// im Ladengeschäft.
// ============================================================================

import { parseIsoDate, weekdayKeyOf, type WeekdayKey } from "./demand";

export type DayWindow = { startMinutes: number; endMinutes: number };

/**
 * Ein Arbeitstag kann aus mehreren Blöcken bestehen; hier ist es immer genau
 * einer, weil durchgehend geöffnet ist.
 */
export type DayBlocks = DayWindow[];

export type WorkHoursConfig = {
  perWeekday: Record<WeekdayKey, DayBlocks>;
  holiday: DayBlocks;
  /** Wochentage, an denen grundsätzlich geschlossen ist (hier: Sonntag). */
  closedWeekdays: Record<WeekdayKey, boolean>;
  /** true = an gesetzlichen Feiertagen geschlossen (Ladenschluss). */
  holidayClosed?: boolean;
};

/**
 * Ausnahme für ein konkretes Datum (überschreibt Wochentag/Feiertag).
 * closed = an diesem Tag wird nicht geplant (z.B. Betriebsruhe);
 * window = abweichende Arbeitszeiten (z.B. halber Tag).
 */
export type DateOverride = {
  date: string; // ISO yyyy-MM-dd
  closed: boolean;
  window?: DayWindow;
  note?: string;
};

export type OverrideMap = Record<string, DateOverride>;

export type ResolvedDay = {
  closed: boolean;
  /** Die tatsächlichen Öffnungsblöcke, aufsteigend und ohne Überlappung. */
  blocks: DayBlocks;
  /** Äußerer Rahmen (erster Anfang bis letztes Ende) – für Anzeige und Summen. */
  window: DayWindow;
};

/** Rahmen um eine Liste von Blöcken. Leere Liste => 0-Fenster. */
export function frameOf(blocks: DayBlocks): DayWindow {
  if (blocks.length === 0) return { startMinutes: 0, endMinutes: 0 };
  return {
    startMinutes: Math.min(...blocks.map((b) => b.startMinutes)),
    endMinutes: Math.max(...blocks.map((b) => b.endMinutes)),
  };
}

/** Längster einzelner Block – so lang darf eine Schicht höchstens sein. */
export function longestBlock(blocks: DayBlocks): number {
  let max = 0;
  for (const b of blocks) max = Math.max(max, b.endMinutes - b.startMinutes);
  return max;
}

const w = (start: number, end: number): DayWindow => ({ startMinutes: start, endMinutes: end });
const copy = (blocks: DayBlocks): DayBlocks => blocks.map((b) => ({ ...b }));

const CLOSED_SUNDAY: Record<WeekdayKey, boolean> = {
  monday: false,
  tuesday: false,
  wednesday: false,
  thursday: false,
  friday: false,
  saturday: false,
  sunday: true,
};

// Cơ sở 1 – Schloss Arkaden: T2–T7 09:30–20:00, CN nghỉ.
const ARKADEN_TAG: DayBlocks = [w(9 * 60 + 30, 20 * 60)];

export const ARKADEN_WORK_HOURS: WorkHoursConfig = {
  perWeekday: {
    monday: copy(ARKADEN_TAG),
    tuesday: copy(ARKADEN_TAG),
    wednesday: copy(ARKADEN_TAG),
    thursday: copy(ARKADEN_TAG),
    friday: copy(ARKADEN_TAG),
    saturday: copy(ARKADEN_TAG),
    sunday: copy(ARKADEN_TAG), // geschlossen, nur als Rückfall
  },
  holiday: copy(ARKADEN_TAG), // wird durch holidayClosed nicht benutzt
  closedWeekdays: { ...CLOSED_SUNDAY },
  holidayClosed: true,
};

// Cơ sở 2 – Papenstieg: T2–T6 09:00–19:00, T7 09:00–18:00, CN nghỉ.
const PAPEN_WERKTAG: DayBlocks = [w(9 * 60, 19 * 60)];
const PAPEN_SAMSTAG: DayBlocks = [w(9 * 60, 18 * 60)];

export const PAPENSTIEG_WORK_HOURS: WorkHoursConfig = {
  perWeekday: {
    monday: copy(PAPEN_WERKTAG),
    tuesday: copy(PAPEN_WERKTAG),
    wednesday: copy(PAPEN_WERKTAG),
    thursday: copy(PAPEN_WERKTAG),
    friday: copy(PAPEN_WERKTAG),
    saturday: copy(PAPEN_SAMSTAG),
    sunday: copy(PAPEN_WERKTAG), // geschlossen, nur als Rückfall
  },
  holiday: copy(PAPEN_WERKTAG),
  closedWeekdays: { ...CLOSED_SUNDAY },
  holidayClosed: true,
};

/** Rückfall, wenn keine Filiale angegeben ist (Tests, Standardparameter). */
export const DEFAULT_WORK_HOURS: WorkHoursConfig = ARKADEN_WORK_HOURS;

/**
 * Für Nachfrage und Besetzung maßgeblicher Wochentag. Feiertage sind hier
 * geschlossen, deshalb bleibt es beim echten Wochentag.
 */
export function effectiveWeekdayKey(isoDate: string, _holidays: Set<string>): WeekdayKey {
  return weekdayKeyOf(parseIsoDate(isoDate));
}

/** Öffnungsblöcke für ein konkretes Datum (berücksichtigt Feiertage). */
export function resolveWorkBlocks(
  config: WorkHoursConfig,
  isoDate: string,
  holidays: Set<string>,
): DayBlocks {
  if (holidays.has(isoDate)) return config.holiday;
  return config.perWeekday[weekdayKeyOf(parseIsoDate(isoDate))];
}

const CLOSED: ResolvedDay = {
  closed: true,
  blocks: [],
  window: { startMinutes: 0, endMinutes: 0 },
};

const open = (blocks: DayBlocks): ResolvedDay => ({
  closed: false,
  blocks: [...blocks].sort((a, b) => a.startMinutes - b.startMinutes),
  window: frameOf(blocks),
});

/**
 * Vollständige Auflösung eines Tages inkl. Ausnahmen:
 * Ausnahme geschlossen > Ausnahme eigene Zeiten > geschlossener Wochentag
 * (Sonntag) > Feiertag (zu) > Wochentag.
 */
export function resolveDay(
  config: WorkHoursConfig,
  isoDate: string,
  holidays: Set<string>,
  overrides: OverrideMap = {},
): ResolvedDay {
  const ov = overrides[isoDate];
  if (ov?.closed) return CLOSED;
  // Ein Override mit eigenen Zeiten öffnet den Tag auch dann, wenn sonst zu wäre.
  if (ov?.window) return open([ov.window]);
  const weekday = weekdayKeyOf(parseIsoDate(isoDate));
  if (config.closedWeekdays?.[weekday]) return CLOSED;
  if (config.holidayClosed !== false && holidays.has(isoDate)) return CLOSED;
  return open(resolveWorkBlocks(config, isoDate, holidays));
}

/** Ist der Laden an diesem Datum geschlossen? (für die Anzeige in der UI). */
export function isDayClosed(
  config: WorkHoursConfig,
  isoDate: string,
  holidays: Set<string>,
  overrides: OverrideMap = {},
): boolean {
  return resolveDay(config, isoDate, holidays, overrides).closed;
}

/** Ein einzelner Eintrag aus einem gespeicherten Stand als Blockliste. */
function blocksFrom(value: unknown, fallback: DayBlocks): DayBlocks {
  if (Array.isArray(value)) {
    const out = value.filter(
      (b): b is DayWindow =>
        !!b && typeof b.startMinutes === "number" && typeof b.endMinutes === "number",
    );
    if (out.length > 0) return out.map((b) => ({ ...b }));
    return copy(fallback);
  }
  // Alter Stand: EIN Fenster als Objekt – wird zu einer Liste mit einem Block.
  const one = value as DayWindow | undefined;
  if (one && typeof one.startMinutes === "number" && typeof one.endMinutes === "number") {
    return [{ startMinutes: one.startMinutes, endMinutes: one.endMinutes }];
  }
  return copy(fallback);
}

/** Tiefe Kopie mit Auffüllen fehlender Felder aus den Zeiten der Filiale. */
export function normalizeWorkHours(
  partial: Partial<WorkHoursConfig> | undefined,
  base: WorkHoursConfig = DEFAULT_WORK_HOURS,
): WorkHoursConfig {
  const perWeekday = {} as Record<WeekdayKey, DayBlocks>;
  for (const key of Object.keys(base.perWeekday) as WeekdayKey[]) {
    perWeekday[key] = blocksFrom(partial?.perWeekday?.[key], base.perWeekday[key]);
  }
  const holiday = blocksFrom(partial?.holiday, base.holiday);

  const closedWeekdays = { ...base.closedWeekdays };
  if (partial?.closedWeekdays) {
    for (const key of Object.keys(closedWeekdays) as WeekdayKey[]) {
      const v = partial.closedWeekdays[key];
      if (typeof v === "boolean") closedWeekdays[key] = v;
    }
  }
  const holidayClosed =
    typeof partial?.holidayClosed === "boolean" ? partial.holidayClosed : base.holidayClosed !== false;
  return { perWeekday, holiday, closedWeekdays, holidayClosed };
}
