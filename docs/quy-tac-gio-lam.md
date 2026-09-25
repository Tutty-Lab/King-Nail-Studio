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
- **Lịch cố định cho người nhiều giờ:** Nguyen Xuan Manh, Pham Van Nha, Nguyen
  Quang Huy (Arkaden) và Pham Duy Thang (Papenstieg) **tối đa 5 ngày/tuần**; các
  tuần đầy đủ trong tháng lặp lại đúng những thứ đó. Người ít giờ dùng để bù cao
  điểm và ngày đông.
- **Ngày làm 3–8 giờ công** (thấp hơn mức luật 10h). Tiệm mở liên tục nên **mỗi
  ngày mỗi người chỉ một ca**, không có ca gãy; ca không dưới 3h.
- **Mọi giờ nằm trên mốc 30 phút**; phần lẻ của tuần đầu/cuối tháng dồn sang tuần
  kề thay vì tạo ca 1–2 giờ.
- **Giới hạn đã biết:** mức 2 người không phải lúc nào cũng đủ giờ để trả.
  Ngân sách giờ của một ngày do hợp đồng quyết định: ở Papenstieg thứ Ba chỉ có
  ~12,3h, trong khi phủ 09:00–19:00 đã hết 10h, thêm người thứ hai 15:00–19:00
  là 14h. Đo cả năm 2026: Arkaden thiếu 24 ô 30 phút (chỉ T7, người thứ ba),
  Papenstieg 108 ô (chủ yếu T2 và T3). Tuần bị cắt ở đầu/cuối tháng cũng vậy.
  Báo cáo **Độ phủ** hiện đỏ chỗ đó; việc **phủ kín (≥ 1 người) thì luôn đúng** —
  trong thuật toán, để tiệm trống bị phạt gấp 10 lần thiếu người cao điểm.
  Muốn hết đỏ: tăng giờ hợp đồng ở Papenstieg, hoặc rút mức 2 người của thứ Ba
  còn 17:00–19:00, hoặc bỏ hẳn mức 2 người của thứ Ba (còn 74 ô).

> Các quy tắc này là vận hành của tiệm, không phải luật — có thể chỉnh theo từng
> cơ sở (số người tối thiểu, khung giờ cao điểm, số ngày mở…). Khi đổi, nhớ
> cập nhật lại phần **"trước khi giao khách"** trong [`nghiem-thu.md`](nghiem-thu.md).
