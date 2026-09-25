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

## 2. Quy tắc app / quán — KHÔNG phải luật (đổi được tuỳ quán)

Ba quán chung chủ: **Shin** (Durmersheim), **Coco** (Filderstadt) và **Nieu 37** (Aalen) — cùng ở Baden-Württemberg, cùng giờ mở và cùng luật giờ làm; dữ liệu tách riêng theo từng quán.

- **Giờ mở:** T2 nghỉ; T3–CN và ngày lễ 11:30–15:00 và 17:00–22:00 (15:00–17:00 đóng cửa).
- **Luôn có ít nhất 1 người tới 15:00 và tới 22:00** (quy tắc cứng).
- **Mỗi ca khoảng 4–5 người**: Shin/Coco trưa 3–7, tối 4–7; Nieu 37 ít người hơn nên trưa 2–6, tối 3–6.
- **Ngày đông:** Shin và Coco từ **T5–CN**; Nieu 37 từ **T6–CN** (hệ số 1,5). Ngày lễ tính như Chủ nhật.
- **Shin: ngày lễ phải có Bá Việt Nguyen trong ca** (Coco và Nieu 37 không có yêu cầu này).
- **Người làm hai quán** (Bá Việt Nguyen: Vollzeit ở Shin, Minijob ở Nieu 37): app xếp lần lượt từng quán và không xếp trùng ngày — hai quán cách nhau xa.
- **Ngày làm 3–8 giờ công** (thấp hơn mức luật 10h). Ca trưa dài nhất 3,5h vì khung trưa chỉ 11:30–15:00; ai làm cả trưa lẫn tối thì phần ngắn hơn ít nhất 2h. Ca đứng một mình không dưới 3h.
- **Mọi giờ nằm trên mốc 30 phút**; phần lẻ của tuần đầu/cuối tháng dồn sang tuần kề thay vì tạo ca 1–2 giờ.

> Các quy tắc này là vận hành của quán, không phải luật — có thể chỉnh theo từng
> cửa hàng (số người tối thiểu, khung giờ cao điểm, số ngày mở…). Khi đổi, nhớ
> cập nhật lại phần **"trước khi giao khách"** trong [`nghiem-thu.md`](nghiem-thu.md).
