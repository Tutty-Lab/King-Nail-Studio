# Quy tắc giờ làm & nghỉ

Hai nhóm quy tắc: **(1) LUẬT** (không được vi phạm) và **(2) quy tắc app/quán**
(đổi được tuỳ quán). Thuật toán xếp lịch và phần nghiệm thu đều đối chiếu theo đây.

---

## 1. Giờ làm & nghỉ — quán ăn Đức (LUẬT, bản gọn)

- **Tối đa 10h/ngày** (bình thường **8h**) — không hơn, kể cả làm thêm.
- **Tối đa 6 ngày/tuần**, phải có **1 ngày nghỉ**.
- Làm **> 6h → nghỉ 30 phút**; làm **> 8h → nghỉ 60 phút** (nghỉ **không tính lương**).
- **Nghỉ ≥ 11h** giữa hai ca.
- **Làm đêm / Chủ Nhật / lễ → có phụ cấp** (đêm **~25%**).
- **Dưới 18 tuổi**: tối đa **8h/ngày**, **không làm sau 22h**.
- **Ghi giờ làm và giữ ≥ 2 năm** — dùng **Stundenzettel xuất PDF hàng tháng** là đủ.

> Đây là bản rút gọn để kiểm nhanh. Không thay thế tư vấn pháp lý; khi quán có
> tình huống đặc biệt (ca đêm dài, người < 18, hợp đồng riêng) thì kiểm với kế
> toán/luật.

### Suy ra cho thuật toán (phải luôn đúng)
- Không xếp ai **> 10h/ngày**.
- Không xếp ai **> 6 ngày liên tiếp** (phải chèn ngày nghỉ).
- **Pause** tự tính theo ngưỡng 6h/8h và **trừ khỏi giờ trả lương**.
- Khoảng cách hai ca của cùng người **≥ 11h**.

---

## 2. Quy tắc app / tiệm — KHÔNG phải luật (đổi được tuỳ tiệm)

Hai cơ sở chung chủ ở Braunschweig (Niedersachsen): **Schloss Arkaden** (Platz am
Ritterbrunnen 1) và **Papenstieg** (Papenstieg 8). Chung luật giờ làm và chung hệ
số ngày, nhưng **giờ mở khác nhau**; dữ liệu tách riêng theo từng cơ sở.

- **Giờ mở (mở liên tục, không nghỉ trưa):**
  - Arkaden: **T2–T7 09:30–20:00**.
  - Papenstieg: **T2–T6 09:00–19:00**, **T7 09:00–18:00**.
  - **Chủ nhật và ngày lễ đóng cửa** (ngày lễ theo **Niedersachsen**, 10 ngày,
    có Reformationstag 31.10.).
- **Phủ kín giờ mở cửa** — mọi phút mở cửa luôn có **ít nhất 1 người** (quy tắc cứng).
- **Cao điểm:** T2–T6 **15:00–19:00**, T7 **11:00–19:00**.
  - Arkaden: cao điểm T2–T6 **2–5 người**, T7 **3–6 người**.
  - Papenstieg: cao điểm **T2–T6 2–4 người**, T7 (11:00–18:00) **2–4 người**.
- **Hệ số ngày (cả hai cơ sở):** T2 1,2 · T3 1,0 · T4 1,2 · T5 1,2 · **T6 2,0 · T7 2,0**.
- **Mọi người tối đa 5 ngày/tuần** (đặt ở tab Nhân viên, ô „Số ngày/tuần"):
  - Người nhiều giờ (Manh, Nhã, Huy ở Arkaden; Thắng ở Papenstieg) nhờ vậy có
    **lịch lặp lại giống nhau** giữa các tuần đầy đủ.
  - Người ít giờ: nếu không giới hạn, app rải 3 giờ mỗi ngày suốt 6 ngày (có bạn
    làm đủ 25/25 ngày mở). Giới hạn 5 ngày làm ca dài hơn, rơi đúng cao điểm hơn
    — Papenstieg giảm từ 57 xuống 34 ô thiếu mỗi năm — và ai cũng có thêm một
    ngày nghỉ ngoài Chủ nhật.
- **Ngày làm 3–8 giờ công** (thấp hơn mức luật 10h). Tiệm mở liên tục nên **mỗi
  ngày mỗi người chỉ một ca**, không có ca gãy; ca không dưới 3h.
- **Mọi giờ nằm trên mốc 30 phút**; phần lẻ của tuần đầu/cuối tháng dồn sang tuần
  kề thay vì tạo ca 1–2 giờ.
- **Cách chia giờ mỗi ngày (2 bước):** trước hết mỗi ngày mở được cấp đủ
  **sàn** = số giờ để thoả mức người tối thiểu của ngày đó (Papenstieg ngày
  thường: phủ 09:00–19:00 10h + người thứ hai 15:00–19:00 4h = 14h; T7 16h).
  Phần **còn lại** mới chia theo hệ số ngày. Nhờ vậy ngày vắng không bị thiếu
  giờ để phủ, ngày đông không nhận dư.
- **Tráo giờ giữa hai người:** khi một ngày đủ tổng giờ nhưng vẫn hụt người cao
  điểm (giờ nằm nhầm người), app chuyển 30 phút tới nguyên một ca từ A sang B ở
  ngày đó và **trả lại ở một ngày khác cùng tuần** — tổng giờ tuần/tháng của cả
  hai không đổi.
- **Giới hạn đã biết:** mức 2 người không phải lúc nào cũng đủ giờ để trả. Ở
  Papenstieg riêng mức tối thiểu đã ngốn ~86h trong 101h mỗi tuần. Đo cả năm
  2026 (sau tối ưu): Arkaden thiếu **23 ô 30 phút** (chỉ T7, người thứ ba),
  Papenstieg **34 ô** (chủ yếu T2) — trước tối ưu là 108 ô. Báo cáo
  **Độ phủ** hiện đỏ chỗ đó; việc **phủ kín (≥ 1 người) thì luôn đúng** —
  trong thuật toán, để tiệm trống bị phạt gấp 10 lần thiếu người cao điểm.
- **Đánh đổi ở Papenstieg:** vì sát mức tối thiểu, mọi ngày đều ~2 người lúc 17h
  và T6/T7 chỉ nhiều hơn T3 khoảng **1,16 lần** về giờ (Arkaden 1,55 lần, T7 gần
  5 người lúc 17h). Muốn T6/T7 ở Papenstieg đông hơn thấy rõ thì phải tăng giờ
  hợp đồng (~2h/tuần là hết cả phần đỏ).

> Các quy tắc này là vận hành của tiệm, không phải luật — có thể chỉnh theo từng
> cơ sở (số người tối thiểu, khung giờ cao điểm, số ngày mở…). Khi đổi, nhớ
> cập nhật lại phần **"trước khi giao khách"** trong [`nghiem-thu.md`](nghiem-thu.md).
