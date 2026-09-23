import {
  DAY_WEIGHTS,
  WEEKDAY_LABELS_VI,
  WEEKDAY_SHORT_VI,
  type WeekdayKey,
} from "../lib/demand";
import {
  CLOSING_START,
  DEMAND_PROFILE,
  LUNCH_END,
  STAFFING_RULES,
  ruleAppliesOn,
  ruleRange,
  type DemandBand,
} from "../lib/staffing";
import { DEFAULT_WORK_HOURS } from "../lib/workHours";
import type { StoreConfig } from "../lib/stores";
import { SHIFT_LENGTHS } from "../lib/shifts";
import { calculatePause, minutesToTime, presenceFromPaid } from "../lib/time";

const WEEKDAY_ORDER: WeekdayKey[] = [
  "monday", "tuesday", "wednesday", "thursday",
  "friday", "saturday", "sunday",
];

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm sm:p-5">
      <h2 className="mb-2 text-base font-semibold text-slate-900">{title}</h2>
      <div className="space-y-2 text-sm leading-relaxed text-slate-700">{children}</div>
    </section>
  );
}

function WeekdayTable() {
  return (
    <div className="overflow-x-auto">
      <table className="border-collapse text-sm">
        <thead>
          <tr>
            {WEEKDAY_ORDER.map((key) => (
              <th key={key} className={`border border-slate-200 px-3 py-1 font-medium ${DAY_WEIGHTS[key] > 1 ? "bg-amber-50 text-amber-900" : "bg-slate-50 text-slate-600"}`}>
                {WEEKDAY_LABELS_VI[key]}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr>
            {WEEKDAY_ORDER.map((key) => (
              <td key={key} className="border border-slate-200 px-3 py-1 text-center font-semibold">
                {DEFAULT_WORK_HOURS.closedWeekdays[key] ? "nghỉ" : DAY_WEIGHTS[key].toFixed(1).replace(".", ",")}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    </div>
  );
}

const fmtWeight = (weight: number) => weight.toFixed(1).replace(".", ",");
const fmtRange = (min: number, max: number) => (Number.isFinite(max) ? `${min}–${max}` : `${min}+`);

/** Ngày mở cửa gom theo hệ số: [{ weight: 1, days: [T3,T4] }, { weight: 1,5, days: [T5–CN] }]. */
function weightGroups(): { weight: number; days: WeekdayKey[] }[] {
  const groups = new Map<number, WeekdayKey[]>();
  for (const key of WEEKDAY_ORDER) {
    if (DEFAULT_WORK_HOURS.closedWeekdays[key]) continue;
    groups.set(DAY_WEIGHTS[key], [...(groups.get(DAY_WEIGHTS[key]) ?? []), key]);
  }
  return [...groups].sort((a, b) => a[0] - b[0]).map(([weight, days]) => ({ weight, days }));
}

const daysLabel = (days: WeekdayKey[]) =>
  days.length > 1 ? `${WEEKDAY_SHORT_VI[days[0]]}–${WEEKDAY_SHORT_VI[days[days.length - 1]]}` : WEEKDAY_SHORT_VI[days[0]];

/** Đường nhu cầu trong ngày – lấy thẳng từ DEMAND_PROFILE, cùng nguồn với thuật toán. */
function DemandCurve() {
  const column = (title: string, bands: readonly DemandBand[]) => (
    <div className="min-w-0 flex-1">
      <div className="mb-1 text-xs font-semibold text-slate-600">{title}</div>
      <ul className="space-y-1">
        {bands.map((b) => (
          <li key={b.startMinutes} className="grid grid-cols-[6.5rem_1fr_2.5rem] items-center gap-2 text-xs">
            <span className="tabular-nums text-slate-600">{minutesToTime(b.startMinutes)}–{minutesToTime(b.endMinutes)}</span>
            <span className="relative h-4 rounded bg-slate-100" title={b.label}>
              <span
                className={`absolute inset-y-0 left-0 rounded ${b.level >= 1.5 ? "bg-amber-400" : b.level > 1 ? "bg-amber-200" : "bg-teal-300"}`}
                style={{ width: `${(b.level / 1.5) * 100}%` }}
              />
              <span className="absolute inset-0 truncate px-1.5 leading-4 text-slate-800">{b.label}</span>
            </span>
            <span className="text-right font-semibold tabular-nums">{fmtWeight(b.level)}</span>
          </li>
        ))}
      </ul>
    </div>
  );
  return (
    <div className="flex flex-col gap-4 sm:flex-row">
      {column("T3–T4 (ngày thường)", DEMAND_PROFILE.weekday)}
      {column("T5–CN và ngày lễ", DEMAND_PROFILE.sunday)}
    </div>
  );
}

/**
 * Một dòng cho mỗi khung: mốc (hệ số 1,0) và số người thực tế theo từng nhóm hệ số.
 * Lấy thẳng từ STAFFING_RULES – cùng nguồn với thuật toán và báo cáo Độ phủ.
 */
function StaffingRulesTable() {
  const groups = weightGroups();
  const cell = "border border-slate-200 px-3 py-1.5";
  return (
    <div className="overflow-x-auto">
      <table className="w-full min-w-[560px] border-collapse text-sm">
        <thead>
          <tr className="bg-slate-50 text-left text-slate-600">
            <th className={cell}>Khung</th>
            <th className={cell}>Mốc</th>
            <th className={cell}>Theo hệ số?</th>
            {groups.map((group) => (
              <th key={group.weight} className={`${cell} text-center ${group.weight > 1 ? "bg-amber-50 text-amber-900" : ""}`}>
                {daysLabel(group.days)} <span className="font-normal">×{fmtWeight(group.weight)}</span>
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {STAFFING_RULES.map((rule) => (
            <tr key={rule.label}>
              <td className={cell}>
                <div className="font-medium text-slate-900">{rule.label}</div>
                <div className="text-xs text-slate-500">{rule.when}</div>
              </td>
              <td className={`${cell} text-center`}>{fmtRange(rule.minStaff, rule.maxStaff)}</td>
              <td className={`${cell} text-center`}>
                {rule.scaled
                  ? <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs text-amber-800">× hệ số</span>
                  : <span className="text-xs text-slate-500">cố định</span>}
              </td>
              {groups.map((group) => {
                const days = group.days.filter((day) => ruleAppliesOn(rule, day));
                if (days.length === 0) return <td key={group.weight} className={`${cell} text-center text-slate-400`}>—</td>;
                const { minStaff, maxStaff } = ruleRange(rule, days[0]);
                return (
                  <td key={group.weight} className={`${cell} text-center font-semibold`}>
                    {fmtRange(minStaff, maxStaff)}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function DocsTab({ store }: { store: StoreConfig }) {
  const holidayDuty = store.sampleEmployees().find((employee) => employee.requiredOnHolidays);
  const lunch = STAFFING_RULES.find((rule) => rule.label === "Trưa")!;
  const evening = STAFFING_RULES.find((rule) => rule.label === "Tối")!;
  return (
    <div className="max-w-3xl space-y-4">
      <div className="rounded-lg bg-slate-900 p-4 text-white sm:p-5">
        <h1 className="text-lg font-semibold">Tài liệu — nguyên tắc xếp lịch</h1>
        <p className="mt-1 text-sm text-slate-300">
          {store.name} · {store.address}. Hai quán chung một app, chung giờ mở và chung quy tắc; dữ liệu và
          mật khẩu thì tách riêng. Mô tả đúng thuật toán đang chạy: bảng khung giờ, hệ số và đường nhu cầu lấy thẳng từ code –
          đổi code là trang này đổi theo. Thứ tự ưu tiên khi xung đột: <b>luật &amp; hợp đồng</b> → <b>số người
          tối thiểu</b> → <b>đường nhu cầu</b> → <b>độ dài ca ưa thích</b>.
        </p>
      </div>

      <Section title="1. Điều kiện bắt buộc">
        <ul className="list-disc space-y-1 pl-5">
          <li><b>Giờ mở:</b> Thứ Hai nghỉ (trùng ngày lễ vẫn nghỉ; muốn mở thì đặt „giờ riêng" ở Cài đặt). <b>T3–CN và ngày lễ:</b> {minutesToTime(DEFAULT_WORK_HOURS.perWeekday.tuesday[0].startMinutes)}–{minutesToTime(LUNCH_END)} và {minutesToTime(DEFAULT_WORK_HOURS.perWeekday.tuesday[1].startMinutes)}–22:00. Khoảng 15:00–17:00 quán đóng, không tính giờ công.</li>
          <li><b>Luật giờ làm:</b> tối đa <b>8 giờ công/ngày</b> (mức quán tự đặt, thấp hơn luật 10h); tối đa <b>6 ngày liên tiếp</b>. Trên 6h công nghỉ <b>30′</b>, trên 8h nghỉ <b>60′</b> – giờ nghỉ có mốc cụ thể, bắt đầu sau ít nhất 1h vào ca.</li>
          <li><b>Hợp đồng là giới hạn cứng:</b> hai quán ký theo <b>giờ mỗi tháng</b> (xem tab Nhân viên). Không ai bị xếp vượt hợp đồng; thiếu thì báo cảnh báo vàng.</li>
          <li><b>Luôn có người tới 15:00 và tới 22:00</b> — hai khung „Chốt ca trưa" và „Đóng cửa" ở mục 3.</li>
          {holidayDuty && (
            <li><b>Ngày lễ phải có {holidayDuty.name} trong ca</b> — bật ở tab Nhân viên (ô „Trực ngày lễ"), thuật toán giữ chỗ cho người đó trước rồi mới chia phần còn lại.</li>
          )}
          <li><b>Ngày làm {SHIFT_LENGTHS[0]}–{SHIFT_LENGTHS[SHIFT_LENGTHS.length - 1]} giờ công.</b> Mỗi ca nằm gọn trong một khung mở, nên ca trưa dài nhất 3,5h (khung trưa chỉ 11:30–15:00). Một người có thể làm cả trưa lẫn tối trong ngày; khi chia hai ca như vậy, phần ngắn hơn ít nhất <b>2 giờ</b>. Ca đứng một mình không bao giờ dưới 3 giờ.</li>
        </ul>
      </Section>

      <Section title="2. Hệ số ngày và giờ công mỗi ngày">
        <p>
          Betrieb: ngày thường doanh thu ~2.000 €, ngày đông 3.500–4.000 €, ngày lễ 4.500–5.000 €. Vì vậy
          <b> T5, T6, T7, CN = 1,5</b>; T3, T4 = 1,0; ngày lễ tính như Chủ nhật. Giờ công mỗi ngày chia theo
          hệ số, chuẩn hoá trong từng ISO-week:
        </p>
        <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs text-slate-800">{`Giờ công ngày = giờ công cả tuần × (hệ số ngày × giờ mở cửa)
              ÷ Σ (hệ số × giờ mở cửa) các ngày mở trong tuần`}</pre>
        <WeekdayTable />
        <ul className="list-disc space-y-1 pl-5">
          <li>Hợp đồng <b>theo tháng</b> được chia cho các tuần theo số ngày mở, rồi mới chia cho từng ngày theo hệ số.</li>
          <li>Hệ số 1,5 là <b>mục tiêu</b>, không phải tỷ lệ bảo đảm: tổng giờ hợp đồng là cố định và khung tối
          chặn trên 7 người, nên đo thực tế trên dữ liệu hiện tại ngày đông nhiều hơn ngày thường khoảng
          <b>1,4 lần</b> (≈48,5h so với ≈34,5h mỗi ngày ở Shin).</li>
          <li>Mọi giờ đều nằm trên <b>mốc 30 phút</b>. Phần lẻ sau khi làm tròn được <b>bù vào cuối</b>: một ca dài thêm 30′ ở chỗ ít ảnh hưởng nhất. Tuần lẻ ở đầu/cuối tháng nếu chỉ còn dưới 3 giờ thì phần đó <b>dồn sang tuần kề</b>, không tạo ca lẻ 1–2 giờ.</li>
        </ul>
      </Section>

      <Section title="3. Khung giờ và mục tiêu nhân sự">
        <p>
          Mỗi khung có một <b>mốc</b> số người. Thiếu hoặc vượt các khung này bị phạt nặng nhất trong thuật toán
          và hiện đỏ trong báo cáo Độ phủ. Vorgabe của quán: „1 ca khoảng 4–5 người", nên khung trưa là
          {" "}{fmtRange(lunch.minStaff, lunch.maxStaff)} và khung tối {fmtRange(evening.minStaff, evening.maxStaff)} người.
        </p>
        <StaffingRulesTable />
        <p className="text-slate-600">
          „Chốt ca trưa" ({minutesToTime(14 * 60 + 30)}–{minutesToTime(LUNCH_END)}) và „Đóng cửa" ({minutesToTime(CLOSING_START)}–22:00)
          là hai quy tắc <b>cứng</b>: luôn phải còn ít nhất một người.
        </p>
      </Section>

      <Section title="4. Đường nhu cầu trong ngày">
        <p>
          Giờ công của ngày được chia theo đường dưới đây thành <b>số người mục tiêu cho từng 30 phút</b>.
          Ngày đông (T5–CN, ngày lễ) có đỉnh trưa cao hơn hẳn ngày thường.
        </p>
        <pre className="overflow-x-auto rounded bg-slate-100 p-3 text-xs text-slate-800">{`Người mục tiêu (30′) = giờ công ngày × mức ÷ Σ (mức × 30′) cả ngày`}</pre>
        <DemandCurve />
      </Section>

      <Section title="5. Thuật toán xếp lịch – các bước">
        <ol className="list-decimal space-y-1 pl-5">
          <li><b>Giờ tuần của từng người:</b> hợp đồng tháng chia cho các tuần theo số ngày mở (tính từ ngày vào làm).</li>
          <li><b>Giờ công mỗi ngày</b> theo công thức mục 2, rồi <b>số người mục tiêu mỗi 30′</b> theo đường nhu cầu mục 4.</li>
          <li><b>Chọn ngày và độ dài ca cho từng người trong tuần</b> sao cho đúng giờ tuần; ai phải trực ngày lễ thì ngày đó được giữ trước.</li>
          <li><b>Đặt ca</b> ở mọi mốc 30′ trong khung. Chấm điểm theo thứ tự nặng → nhẹ: thiếu/thừa người so với khung mục 3 → lệch số người mục tiêu (bình phương) → lệch giờ công ngày → ca gãy (phạt nhẹ).</li>
          <li><b>Bù giờ lẻ:</b> phần còn thiếu do làm tròn được thêm 30′ vào ca ít ảnh hưởng nhất, không vượt 8h/ngày và không vượt hợp đồng.</li>
          <li><b>Tinh chỉnh từng ngày:</b> dời giờ vào/ra và dời <b>giờ nghỉ</b> theo số người thực tế.</li>
          <li><b>Kiểm tra</b>: luật, hợp đồng, ca, nghỉ, trực ngày lễ và độ phủ; lỗi đỏ chặn, cảnh báo vàng không chặn xuất PDF.</li>
        </ol>
      </Section>

      <Section title="6. Giờ nghỉ giữa ca">
        <p>
          Giờ nghỉ là khoảng thời gian cụ thể trong ca: trên 6 giờ công nghỉ 30 phút, trên 8 giờ nghỉ 60 phút.
          Khoảng nghỉ kéo dài thời gian có mặt nhưng không tính vào giờ công. Khoảng 15:00–17:00 giữa hai khung
          mở <b>không phải</b> giờ nghỉ giữa ca – lúc đó quán đóng cửa.
        </p>
        <div className="overflow-x-auto">
          <table className="border-collapse text-sm">
            <thead><tr className="bg-slate-50"><th className="border border-slate-200 px-3 py-1">Giờ công</th><th className="border border-slate-200 px-3 py-1">Nghỉ</th><th className="border border-slate-200 px-3 py-1">Có mặt</th></tr></thead>
            <tbody>{SHIFT_LENGTHS.map((hours) => (
              <tr key={hours}>
                <td className="border border-slate-200 px-3 py-1">{hours}h</td>
                <td className="border border-slate-200 px-3 py-1">{calculatePause(hours * 60)}′</td>
                <td className="border border-slate-200 px-3 py-1">{(presenceFromPaid(hours * 60) / 60).toFixed(2).replace(".", ",")}h</td>
              </tr>
            ))}</tbody>
          </table>
        </div>
      </Section>

      <Section title="7. Ngày đặc biệt và kiểm tra">
        <ul className="list-disc space-y-1 pl-5">
          <li>Ngày lễ theo <b>Baden-Württemberg</b> (Durmersheim và Filderstadt): có Heilige Drei Könige, Fronleichnam và Allerheiligen; không có Mariä Himmelfahrt.</li>
          <li>Ngày đặc biệt (override) có thể đóng cả ngày hoặc đặt khung giờ riêng; bấm <b>Tạo lịch</b> lại sau khi thêm.</li>
          <li>Sửa tay một ca vẫn phải giữ hợp đồng, tối đa 8 giờ/ngày, 6 ngày liên tiếp, khung ca và giờ nghỉ – ca sửa tay được đánh dấu <b>Đã sửa tay</b>.</li>
          <li>Báo cáo Độ phủ ghi <b>số người thực tế / yêu cầu</b> từng 30′; thiếu hoặc vượt khung hiện viền đỏ.</li>
        </ul>
      </Section>

      <Section title="8. Cách dùng">
        <ol className="list-decimal space-y-1 pl-5">
          <li>Kiểm tra giờ mở, ngày lễ và ngày đặc biệt trong <b>Cài đặt</b>.</li>
          <li>Kiểm tra giờ hợp đồng (theo tháng), ngày vào làm và ô trực ngày lễ trong <b>Nhân viên</b>.</li>
          <li>Bấm <b>Tạo lịch làm việc</b>, xem <b>Độ phủ</b> và các cảnh báo (i) trước khi xuất PDF.</li>
          <li>Sau khi sửa tay, xem lại Độ phủ và cảnh báo rồi mới xuất bản in.</li>
        </ol>
      </Section>
    </div>
  );
}
