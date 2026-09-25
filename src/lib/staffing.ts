import type { Shift } from "../types";
import { DAY_WEIGHTS, type WeekdayKey } from "./demand";
import type { DayBlocks, DayWindow } from "./workHours";

export type StaffingWindow = {
  label: string;
  startMinutes: number;
  endMinutes: number;
  minStaff: number;
  maxStaff: number;
};

/** Anfang der Hauptzeit an Werktagen (Mo–Fr): ab hier wird es voll. */
export const PEAK_START = 15 * 60;
/** Ende der Hauptzeit – danach läuft der Tag aus. */
export const PEAK_END = 19 * 60;
/** Samstags geht die Hauptzeit schon am späten Vormittag los. */
export const SATURDAY_PEAK_START = 11 * 60;

/**
 * Eine Besetzungsregel: WO (Zeitspanne je Öffnungsblock) und WIE VIELE.
 *
 * minStaff/maxStaff sind der Wert eines Normaltags (Gewicht 1,0). Bei
 * scaled = true werden sie mit dem Tagesgewicht (DAY_WEIGHTS) multipliziert und
 * aufgerundet – starke Tage tragen so automatisch mehr.
 *
 * Einzige Quelle für Scheduler, Độ phủ-Bericht und Tab „Tài liệu": wer die
 * Besetzung eines Studios ändert, ändert nur diese Liste.
 */
export type StaffingRule = {
  label: string;
  /** Kurzbeschreibung der Zeitspanne für den Tab „Tài liệu". */
  when: string;
  minStaff: number;
  maxStaff: number;
  scaled: boolean;
  /** Nur an diesen (effektiven) Wochentagen; fehlt = an jedem offenen Tag. */
  weekdays?: readonly WeekdayKey[];
  windows: (blocks: DayBlocks) => DayWindow[];
};

/** Schneidet eine feste Uhrzeitspanne mit jedem Öffnungsblock. */
export const clip = (from: number, to: number) => (blocks: DayBlocks): DayWindow[] =>
  blocks
    .map((block) => ({ startMinutes: Math.max(from, block.startMinutes), endMinutes: Math.min(to, block.endMinutes) }))
    .filter((window) => window.endMinutes > window.startMinutes);

/** Die ganze Öffnungszeit – es ist IMMER jemand im Studio. */
export const wholeDay = (blocks: DayBlocks): DayWindow[] =>
  blocks.map((block) => ({ startMinutes: block.startMinutes, endMinutes: block.endMinutes }));

const WERKTAGE: readonly WeekdayKey[] = ["monday", "tuesday", "wednesday", "thursday", "friday"];

/**
 * Cơ sở 1 – Schloss Arkaden (658 Vertragsstunden im Monat, offen 09:30–20:00).
 *
 *  - „Phải phủ kín giờ mở cửa" – harte Regel: nie null Personen.
 *  - „Peak T2–T6 15:00–19:00, T7 11:00–19:00" – dort die höhere Untergrenze.
 *    Samstag ist der stärkste Tag (Gewicht 2,0) und trägt deshalb drei Leute.
 *
 * Die Untergrenzen sind gegen das Stundenbudget gerechnet: der schwächste Tag
 * (Dienstag) hat rund 17,7 h – Abdeckung 09:30–20:00 plus eine zweite Person
 * von 15 bis 19 Uhr kostet 14,5 h, passt also. Samstag hat rund 35 h, drei
 * Personen von 11 bis 19 Uhr kosten etwa 31 h.
 */
export const ARKADEN_STAFFING_RULES: readonly StaffingRule[] = [
  {
    label: "Trong giờ mở cửa", when: "suốt giờ mở cửa", minStaff: 1, maxStaff: Infinity, scaled: false,
    windows: wholeDay,
  },
  {
    label: "Cao điểm T2–T6", when: "15:00–19:00", minStaff: 2, maxStaff: 5, scaled: false,
    weekdays: WERKTAGE, windows: clip(PEAK_START, PEAK_END),
  },
  {
    label: "Cao điểm T7", when: "11:00–19:00", minStaff: 3, maxStaff: 6, scaled: false,
    weekdays: ["saturday"], windows: clip(SATURDAY_PEAK_START, PEAK_END),
  },
];

/**
 * Cơ sở 2 – Papenstieg (439 Vertragsstunden, offen 09:00–19:00, Sa bis 18:00).
 *
 * Kleineres Team, deshalb niedrigere Untergrenzen: Mo–Do reicht das Budget
 * NICHT für zwei Personen über die volle Hauptzeit (Dienstag rund 11,7 h,
 * die Abdeckung allein kostet schon 10 h). Zwei Personen sind daher an den
 * starken Tagen Freitag und Samstag verlangt; an den übrigen Tagen sorgt die
 * Nachfragekurve dafür, dass die Leute trotzdem in die Hauptzeit fallen.
 */
export const PAPENSTIEG_STAFFING_RULES: readonly StaffingRule[] = [
  {
    label: "Trong giờ mở cửa", when: "suốt giờ mở cửa", minStaff: 1, maxStaff: Infinity, scaled: false,
    windows: wholeDay,
  },
  {
    label: "Cao điểm T6", when: "15:00–19:00", minStaff: 2, maxStaff: 4, scaled: false,
    weekdays: ["friday"], windows: clip(PEAK_START, PEAK_END),
  },
  {
    label: "Cao điểm T7", when: "11:00–18:00", minStaff: 2, maxStaff: 4, scaled: false,
    weekdays: ["saturday"], windows: clip(SATURDAY_PEAK_START, 18 * 60),
  },
];

/** Rückfall für Tests und Altaufrufe. */
export const STAFFING_RULES = ARKADEN_STAFFING_RULES;

/** Mindest-/Höchstzahl einer Regel an einem Wochentag (Gewicht angewandt, aufgerundet). */
export function ruleRange(rule: StaffingRule, weekday: WeekdayKey): { minStaff: number; maxStaff: number } {
  const weight = rule.scaled ? DAY_WEIGHTS[weekday] : 1;
  return {
    minStaff: Math.ceil(rule.minStaff * weight),
    maxStaff: Number.isFinite(rule.maxStaff) ? Math.ceil(rule.maxStaff * weight) : Infinity,
  };
}

export function ruleAppliesOn(rule: StaffingRule, weekday: WeekdayKey): boolean {
  return !rule.weekdays || rule.weekdays.includes(weekday);
}

export function staffingWindows(
  blocks: DayBlocks,
  weekday: WeekdayKey,
  rules: readonly StaffingRule[] = STAFFING_RULES,
): StaffingWindow[] {
  return rules.filter((rule) => ruleAppliesOn(rule, weekday)).flatMap((rule) => {
    const range = ruleRange(rule, weekday);
    return rule.windows(blocks).map((window) => ({ label: rule.label, ...window, ...range }));
  });
}

// ── Đường nhu cầu trong ngày ────────────────────────────────────────────────
/**
 * Nhu cầu tương đối theo giờ (1,0 = bình thường) – dạng „ngọn núi": mở cửa
 * vắng, trưa nhích lên, cao điểm 15:00–19:00, cuối ngày vãn. Thuật toán chia
 * GIỜ CÔNG CỦA NGÀY (đã nhân hệ số ngày) theo đường này thành số người mục tiêu
 * cho từng 30 phút, rồi phạt độ lệch theo bình phương – nhờ vậy số người lên
 * xuống mượt, không dồn cục.
 *
 * Tiệm nail mở LIÊN TỤC cả ngày (không nghỉ trưa). Thứ Bảy khách tới sớm nên
 * cao điểm kéo dài từ 11:00 (cột phải).
 */
export type DemandBand = { startMinutes: number; endMinutes: number; level: number; label: string };

const band = (from: string, to: string, level: number, label: string): DemandBand => {
  const toMinutes = (value: string) => Number(value.slice(0, 2)) * 60 + Number(value.slice(3));
  return { startMinutes: toMinutes(from), endMinutes: toMinutes(to), level, label };
};

export const DEMAND_PROFILE: { normal: readonly DemandBand[]; saturday: readonly DemandBand[] } = {
  normal: [
    band("09:00", "10:00", 0.7, "Mở cửa, vắng khách"),
    band("10:00", "12:00", 0.9, "Buổi sáng"),
    band("12:00", "14:00", 1.1, "Trưa"),
    band("14:00", "15:00", 1.2, "Vào cao điểm"),
    band("15:00", "17:00", 1.5, "Cao điểm chiều"),
    band("17:00", "19:00", 1.5, "Cao điểm tối"),
    band("19:00", "20:00", 0.9, "Vãn khách, đóng cửa"),
  ],
  // Thứ Bảy: khách đi mua sắm từ trưa, cao điểm kéo dài 11:00–19:00.
  saturday: [
    band("09:00", "10:00", 0.9, "Mở cửa"),
    band("10:00", "11:00", 1.1, "Khách bắt đầu đông"),
    band("11:00", "15:00", 1.5, "Cao điểm trưa"),
    band("15:00", "19:00", 1.5, "Cao điểm chiều"),
    band("19:00", "20:00", 1.0, "Vãn khách, đóng cửa"),
  ],
};

export function demandProfileOf(
  weekday: WeekdayKey,
  _weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
): readonly DemandBand[] {
  // Chỉ thứ Bảy có đường riêng (cao điểm dài). Thứ Sáu cũng đông, nhưng đông
  // vào ĐÚNG khung cao điểm chiều – việc đó đã nằm ở hệ số ngày (2,0).
  return weekday === "saturday" ? DEMAND_PROFILE.saturday : DEMAND_PROFILE.normal;
}

/** Relative workload at a minute (1 outside all bands). */
export function workloadAt(
  minute: number,
  weekday: WeekdayKey,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
): number {
  return demandProfileOf(weekday, weights).find((b) => minute >= b.startMinutes && minute < b.endMinutes)?.level ?? 1;
}

/**
 * Số người mục tiêu cho từng 30 phút mở cửa:
 *   mục tiêu = giờ công của ngày × mức nhu cầu ÷ tổng mức cả ngày (tính theo phút).
 * Trả về [phút bắt đầu, số người mục tiêu].
 */
export function slotTargets(
  blocks: DayBlocks,
  weekday: WeekdayKey,
  targetHours: number,
  slot = 30,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
): [number, number][] {
  const slots: [number, number][] = [];
  for (const block of blocks) {
    for (let minute = block.startMinutes; minute < block.endMinutes; minute += slot) {
      slots.push([minute, workloadAt(minute, weekday, weights)]);
    }
  }
  const levelMinutes = slots.reduce((sum, [, level]) => sum + level * slot, 0);
  const scale = levelMinutes > 0 ? (targetHours * 60) / levelMinutes : 0;
  return slots.map(([minute, level]) => [minute, level * scale]);
}

export function validPause(shift: Shift): boolean {
  const start = shift.pauseStartMinutes;
  return start != null && shift.pauseMinutes > 0 && start > shift.startMinutes &&
    start + shift.pauseMinutes < shift.endMinutes && start - shift.startMinutes <= 360 &&
    shift.endMinutes - start - shift.pauseMinutes <= 360;
}

export function workingAt(shift: Shift, minute: number): boolean {
  return shift.startMinutes <= minute && shift.endMinutes > minute &&
    !(validPause(shift) && minute >= shift.pauseStartMinutes! && minute < shift.pauseStartMinutes! + shift.pauseMinutes);
}

export function coveragePoints(shifts: Shift[], from: number, to: number): number[] {
  return [...new Set([from, to, ...shifts.flatMap((s) => [s.startMinutes, s.endMinutes,
    ...(validPause(s) ? [s.pauseStartMinutes!, s.pauseStartMinutes! + s.pauseMinutes] : []),
  ]).filter((t) => t > from && t < to)])].sort((a, b) => a - b);
}

/**
 * Giờ công mục tiêu mỗi ngày, chuẩn hoá trong từng ISO-week (không mượn giữa các tuần):
 *   giờ ngày = giờ tuần × (hệ số × phút mở) ÷ Σ(hệ số × phút mở)
 * Nhân phút mở để hệ số là MẬT ĐỘ người. Không truyền openMinutesOf => chỉ theo hệ số.
 */
export function weightedDailyTargets(
  dates: string[],
  total: number,
  weekdayOf: (date: string) => WeekdayKey,
  openMinutesOf?: (date: string) => number,
  weights: Record<WeekdayKey, number> = DAY_WEIGHTS,
): Map<string, number> {
  const factor = (date: string) => weights[weekdayOf(date)] * (openMinutesOf ? openMinutesOf(date) : 1);
  const sum = dates.reduce((acc, date) => acc + factor(date), 0);
  return new Map(dates.map((date) => [date, sum > 0 ? total * factor(date) / sum : 0]));
}
