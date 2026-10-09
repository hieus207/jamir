# JAMIR Version 1: phong cách và cấu trúc

> Chốt ngày 09/10/2026. Đây là mốc để nâng cấp lên V2: giữ nguyên UX lõi, chỉ mở rộng.
> Kỹ thuật (API, dữ liệu, deploy): xem `docs/ARCHITECTURE.md`.

## 1. Concept

**Social Commerce / Video-first Commerce**: Khám phá → Xem → Tin → Hiểu → Mua.
Mượn TikTok (video, vuốt), Netflix (stories, kệ nội dung), Facebook (bài đăng, người thật), TikTok Shop (video → mua ngay), sàn TMĐT (giá, thông số, giao hàng).
Nguyên tắc: **ngang = khám phá, dọc = tìm hiểu, nút mua luôn trong tầm tay**; checkout không rời trang (điện thoại: kéo từ dưới lên; máy tính: ngăn kéo phải).

## 2. Ngôn ngữ thiết kế

| Thành phần | Quy ước V1 |
|---|---|
| Font | **Be Vietnam Pro** cho toàn site. Riêng landing/Khám phá dùng thêm **Bangers** (nhãn, giá) và **Sedgwick Ave Display** (graffiti); cả hai có dấu tiếng Việt |
| Màu thương hiệu | Tím `#4f46e5 → #7c3aed` (`bg-brand-gradient`), điểm nhấn hồng `#ec4899` |
| Tiêu đề mục | Component `SectionHeading`: 22/28px extrabold, **chữ nhấn gradient** ("Jamir **Stories**", "Video **khám phá**", "Tin tức **mới**", "Gợi ý **cho bạn**"), nút "Xem tất cả" dạng viên thuốc |
| Bo góc | Thẻ 16–18px, khối lớn 24px, nút tròn |
| Khoảng cách trang chủ | `gap-8 / md:gap-10` giữa các mục, nội dung tối đa 1536px |
| Hiệu ứng | Vừa phải: hover nhấc 2px, vòng sóng ▶ trên video, viền phát sáng trên nút mua của landing; tắt khi máy bật "giảm chuyển động" |
| Nhãn sản phẩm | 1 nhãn trên ảnh (Bán chạy…), % giảm nằm cạnh giá cũ; Gợi ý cho bạn tắt nhãn, Sản phẩm liên quan tối đa 2 nhãn (cấu hình) |

### Tông màu theo khu vực (cố ý đối lập)

| Khu vực | Tông | Cảm xúc |
|---|---|---|
| Trang chủ, sản phẩm, tin tức | Sáng, tím thương hiệu | Tin cậy, rõ ràng |
| **Khám phá** (`/explore`) | **Tối, nóng**: nền đen grunge, đỏ `#ff2d3d`, vàng `#ffe52e`, chữ graffiti | Bùng nổ, giải trí |
| **Cộng đồng** (`/cong-dong`) | **Sáng, mát**: nền bạc hà `#f3fbfa`, xanh ngọc `#0d9488`, xanh trời `#0ea5e9` | Gần gũi, thân thiện |
| Landing quảng cáo | Street/graffiti hoặc ảnh thiết kế sẵn | Bán hàng mạnh |

## 3. Cấu trúc trang

**Trang chủ** (thứ tự cố định):
1. Jamir Stories (ô "Xem tất cả" tự phát sau N giây)
2. Video khám phá (dải tối, 5 video)
3. Banner slider
4. 4 ô cam kết (ô "Bảo hành 12 tháng" nổi bật)
5. Tin tức mới (bài ưu tiên 1 thành thẻ lớn)
6. Gợi ý cho bạn
7. Tham gia cộng đồng
8. Footer

**Trang sản phẩm** (5 lớp):
1. Video sản phẩm (tim = Yêu thích, sao, số bình luận, chia sẻ = sao chép link)
2. Video KOL
3. Thông số nổi bật
4. Cảm nhận khách hàng ([điểm + biểu đồ sao | Tóm tắt nhanh] rồi danh sách) và Hỏi đáp mới nhất
5. Cột phải dính: khung mua + 4 icon "Phù hợp với bạn nếu"

**Trang chủ trên điện thoại (< 768px) = bước 1:** feed video sản phẩm toàn màn hình, nền tối. Trên cùng có Jamir, "Đang follow / Khám phá" và tìm kiếm. Cột nút bên phải gồm tim (Yêu thích), bình luận, chia sẻ, Mua. Tên, giá và % giảm đè lên video, phía dưới là dải sản phẩm. Vuốt ←→ hoặc chạm dải để đổi sản phẩm. Vuốt ↑ hoặc chạm "Vuốt lên xem chi tiết" để mở trang sản phẩm ở tab KOL Review; chạm bình luận mở tab Đánh giá, chạm Mua mở tab Đặt hàng. Trang sản phẩm trên điện thoại dùng header "‹ Tên sản phẩm · giỏ" và tab gạch chân, không có dải Stories. Desktop vẫn giữ trang chủ V1.

**Mobile và tablet (< 1024px), luồng 7 bước:** 1 Video + tổng quan (tên, giá) → 2 KOL Review → 3 Đánh giá → 4 Thông số → 5 Phù hợp với ai (icon kèm mô tả) → 6 Thông tin đặt hàng → 7 Checkout dạng bottom sheet. Vuốt ↑↓ để đi sâu vào sản phẩm đang xem. Thanh bước dính dưới header, tự sáng theo vị trí cuộn, chạm để nhảy tới bước. Vuốt ←→, hoặc chạm dải ‹ ● › phía trên CTA, để đổi sang sản phẩm trước/sau. CTA "Đặt hàng ngay" luôn dính đáy và có tính vùng an toàn iOS. Desktop giữ thứ tự V1.

Cuối trang là sản phẩm liên quan (tối đa 4).

**Story mode**: "Xem tất cả" chạy qua từng trang sản phẩm theo thời gian cấu hình; thanh story kiểu Facebook; tự dừng khi cuộn hoặc mở hộp thoại.

**Khám phá**: lọc TikTok / YouTube / Facebook / Local, mỗi video có thẻ sản phẩm và tim.

**Cộng đồng**:
- Hero "Khoảnh khắc của tuần" (Netflix).
- 4 chip lọc (YouTube).
- Mỗi tuần một kệ có số tuần to; tuần mới nhất có nhãn MỚI NHẤT.
- 2–4 bài/tuần, dạng bài đăng Facebook, không gắn nhãn.
- Tim = Yêu thích.

**Landing** `/uu-dai/:slug`, 4 giao diện:
- Collage street.
- Poster một màn hình.
- Lướt kiểu TikTok.
- Ảnh thiết kế: ảnh up sẵn, vùng bấm vẽ trong admin. Vùng video phát 1 clip trong popup; vùng mua nhấp nháy.

**Popup sự kiện**: 3 kiểu (banner, poster graffiti, ảnh tự thiết kế); chỉnh được chiều rộng; có xem trước.

## 4. URL và SEO

| Trang | URL |
|---|---|
| Sản phẩm | `/san-pham/:slug` |
| Tin tức | `/tin-tuc`, `/tin-tuc/:slug` |
| Landing quảng cáo | `/uu-dai/:slug` (giữ nguyên `?utm_…`) |
| Cộng đồng | `/cong-dong` |
| Link cũ | `/product`, `/news`, `/lp`, `/community` → **301** sang URL mới |

- Server chèn sẵn `<title>`, description, canonical, Open Graph (ảnh share Facebook/Zalo) và JSON-LD (Product, NewsArticle, Organization, WebSite có ô tìm kiếm).
- Có `/sitemap.xml` và `/robots.txt` (chặn `/admin`, `/account`, `/api`).
- Mỗi trang đúng 1 thẻ h1, tiêu đề dưới khoảng 65 ký tự.

## 5. Quy tắc nội dung

- Đánh giá: chỉ người đã mua (hoặc admin); **mỗi tài khoản 1 lượt** (cấu hình `reviewLimit`). Hiển thị tên đầy đủ / biệt danh / ẩn danh (che 3 ký tự cuối); không ảnh thì hiện chữ cái đầu. Nhãn "Đã mua hàng" đang tắt (`SHOW_PURCHASE_BADGE`).
- Đánh giá demo (feeder) luôn có cờ `seeded`, không bao giờ mang nhãn "Đã mua", xoá được bằng một nút.
- Không hiển thị số liệu bịa (số thành viên, lượt thích giả).

## 6. Cấu hình trong admin (không cần sửa code)

Logo, chữ gợi ý ô tìm kiếm, 4 ô cam kết, banner trang chủ, cấu hình stories (thời gian, tự phát, ảnh ô "Xem tất cả"), nhãn trên thẻ sản phẩm, giới hạn đánh giá, chống spam đơn, liên hệ và cộng đồng, landing page, popup, mã khuyến mại, toàn bộ nội dung.
Form chỉ hiện những ô dùng cho giao diện/kiểu đang chọn.

## 7. Định hướng V2 (không đổi UX lõi)

1. **Feed cá nhân hoá**: ghi hành vi xem/thích/mua, sắp xếp stories và gợi ý theo người dùng.
2. **Trợ lý mua sắm AI**: ô "AI tìm kiếm sản phẩm" đã có chỗ sẵn; tư vấn, so sánh, mở thẳng checkout.
3. **Creator + social commerce**: tài khoản creator, theo dõi, bình luận nhiều tầng, livestream, hoa hồng theo link.

Hạ tầng cho V2: chuyển JSON sang MariaDB (giữ interface `Store`), có domain + HTTPS, CDN cho `/media`, xử lý video (thumbnail, HLS).
