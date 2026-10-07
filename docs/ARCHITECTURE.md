# JAMIR: kiến trúc và hướng mở rộng

> Jamir V1 = Social Commerce / Video-first Commerce
> Khám phá → Xem → Tin → Hiểu → Mua

Tài liệu cho người phát triển tiếp. Mục tiêu là đổi được từng tầng (DB, backend, frontend, thiết bị) mà không phải viết lại phần còn lại.

## 1. Tổng quan

```
Trình duyệt (React SPA)  ──/api──▶  nginx  ──▶  API Node (server/)  ──▶  Store (JSON files)
         │                             │                                   └─ sau này: MariaDB / Postgres
         └── /media, /assets ◀─────────┘ (file tĩnh + ảnh/video upload)
```

| Tầng | Thư mục | Đổi được sang |
|---|---|---|
| Giao diện | `src/` (React 19, Vite, Tailwind 4, TanStack Query, Zustand) | Next.js, React Native (dùng lại `types` + `services`) |
| API | `server/src/` (Node, không framework) | Python FastAPI, Spring Boot: chỉ cần giữ đúng hợp đồng API ở mục 4 |
| Lưu trữ | `server/src/store.ts` (interface `Store`) + `/home/jamir/data/*.json` | MariaDB: viết `createSqlStore()` cùng interface |

**Hợp đồng chung:** `src/types/domain.ts` là nguồn sự thật cho mọi kiểu dữ liệu, dùng chung cho frontend và server. Backend mới (kể cả Python) phải trả JSON đúng các kiểu này.

## 2. Dữ liệu (mỗi bảng một file JSON)

| File | Kiểu | Ghi chú |
|---|---|---|
| `products.json` | `Product` | video (`src` hoặc `embedUrl` + `source`), `chapters`, `gifts` (có `hidden`) |
| `stories.json` | `{ config: StoriesConfig, items: Story[] }` | `intervalSeconds`, `idleSeconds`, `order`; story có `gift` |
| `kol-reviews.json` / `kols.json` | `KolVideoRecord` / `User` | video tải lên hoặc nhúng YouTube/TikTok/Facebook |
| `reviews.json` | `ReviewRecord` | `author.display`: full / nickname / anonymous; `likedBy`, `reply`, `hidden` |
| `faqs.json` | `Faq` | `status: pending` = câu hỏi khách chờ trả lời |
| `news.json` | `NewsArticle` | `priority` (1 = nổi bật), `labels` |
| `promotions.json` | `Promotion` | `usageLimit` / `used` (huỷ đơn thì hoàn lượt) |
| `landing-pages.json` | `LandingPage` | trang quảng cáo `/lp/:slug` |
| `events.json` | `SiteEvent` | popup theo ngày, `target` = product / news / video / url |
| `users.json` | `CustomerRecord` | mật khẩu scrypt, `googleSub`; không bao giờ trả ra ngoài nguyên bản |
| `orders.json` | `Order` | `clientIp` dùng cho chống spam (chỉ admin thấy) |
| `settings.json` | `SiteSettings` | liên hệ, cộng đồng, `orderLimit` |

**Chuyển sang MariaDB:** mỗi file thành một bảng; các trường lồng nhau (`colors`, `specs`, `chapters`, `gifts`, `media`…) để dạng cột `JSON` ở V2, tách bảng khi cần truy vấn. Interface `Collection<T>` (`list / get / find / insert / update / remove`) giữ nguyên, nên route không phải sửa. Khi thêm bảng mới, server tự tạo file từ `server/seed/` lúc khởi động.

## 3. Quy tắc nghiệp vụ (đặt ở server, không tin client)

- **Giá:** server tính lại từ catalogue khi tạo đơn.
- **Mã giảm giá:** kiểm tra hạn, lượt, đơn tối thiểu, phạm vi sản phẩm; đặt thành công thì `used + 1`, admin huỷ đơn thì `used − 1`.
- **Chống spam đơn:** quá `orderLimit.max` đơn (mặc định 5) trong `windowHours` (mặc định 8) theo tài khoản, SĐT hoặc IP thì trả `429` và chặn tới 8 giờ sau đơn gần nhất. Admin không bị giới hạn.
- **Đánh giá / thích:** chỉ khách có đơn (không huỷ) chứa sản phẩm, hoặc admin; mỗi khách một đánh giá cho mỗi sản phẩm, mỗi khách một lượt thích.
- **Câu hỏi:** mọi tài khoản đã đăng nhập (tối đa 10 câu/ngày); chỉ hiện công khai khi admin đã trả lời. Khách chưa đăng nhập hỏi qua Zalo.
- **Ẩn danh:** server che 3 ký tự cuối của tên, không trả avatar.

## 4. API (tiền tố `/api`)

Public: `GET /products`, `/products/:slug`, `/products/:slug/neighbors`, `/products/:id/{kol-reviews,reviews,rating-summary,faqs,related,bought-together}`, `/kol-reviews`, `/stories`, `/categories`, `/search`, `/news`, `/news/:slug`, `/settings`, `/promotions?productId=`, `/landing/:slug`, `/events/active`, `/recommendations/for-you`, `/community/feed`.

Tài khoản: `POST /auth/{register,login,google}`, `GET /auth/config`, `GET /me`, `GET /me/orders`, `POST /orders`, `POST /promotions/validate`, `GET /products/:id/review-eligibility`, `POST /products/:id/reviews`, `POST /reviews/:id/like`, `POST /products/:id/questions`.

Admin (token role `admin`): `GET/POST/PUT/DELETE /admin/c/:collection[/:id]` cho products, categories, stories, kols, kol-reviews, reviews, faqs, news, promotions, orders, landing-pages, events; `GET/PUT /admin/doc/{settings,stories-config,recommendations}`; `GET /admin/{overview,customers}`; `POST /admin/stories/import`; `POST /admin/upload?filename=` (body là file thô).

Xác thực: `Authorization: Bearer <token>` (HMAC, 30 ngày). Lỗi trả về dạng `{ "error": "thông báo tiếng Việt" }` kèm mã HTTP.

## 5. Frontend

```
src/
  types/domain.ts      hợp đồng dữ liệu
  services/*           gọi API (chỉ chỗ này biết URL)
  hooks/queries.ts     TanStack Query: cache, key tập trung trong `qk`
  stores/*             Zustand: giỏ hàng, checkout, chọn màu, giao diện
  components/ui/*      primitive (Base UI): button, dialog, drawer, sheet…
  components/jamir/*   theo tính năng: stories, product, review, checkout, news…
  components/admin/*   CRUD dùng chung (ResourcePanel + fields) + cấu hình từng bảng
  pages/*              route, lazy-load
```

**Thêm một bảng quản trị mới:** khai báo collection ở `server/src/store.ts` và `adminRoutes` (với `prepare` để validate), sau đó thêm `ResourceConfig` (cột + trường) trong `src/components/admin/resources.tsx` và một mục trong `AdminPage`. Form, JSON, upload, tìm kiếm đã có sẵn.

**Thiết bị (responsive):** mobile < 768px (bottom nav, checkout bottom sheet, sticky CTA), tablet 768–1023px, desktop ≥ 1024px (cột mua hàng dính bên phải, checkout ngăn kéo phải), nội dung tối đa 1536px. Tablet/iPad dùng chung layout desktop-lite qua các breakpoint `md` / `lg`. Lên app (React Native/Expo) thì dùng lại `types` và `services` y nguyên.

## 6. Bản đồ UX V1

| Giai đoạn | Thành phần |
|---|---|
| Khám phá (ngang = Discover) | Jamir Stories → chế độ "Xem tất cả" chạy qua từng trang sản phẩm, vuốt trái/phải giữa sản phẩm |
| Lớp 1 Cảm xúc | Video sản phẩm + chương |
| Lớp 2 Niềm tin | Video KOL, đánh giá khách dạng bài đăng (chỉ người mua) |
| Lớp 3 Lý trí | Thông số |
| Lớp 4 Cá nhân hoá | Phù hợp với ai |
| Lớp 5 Hành động (Sticky CTA = Buy) | Panel mua dính bên phải / thanh mua dưới màn hình; checkout không rời trang |
| Kéo traffic | Landing page `/lp/:slug`, popup sự kiện, tin tức (nổi bật + nhãn) |

## 7. Hướng V2 (không đổi UX lõi)

1. **Personalized Feed:** ghi sự kiện xem/thích/mua (bảng `events_log`), xếp stories và gợi ý theo người dùng.
2. **AI Shopping Assistant:** chat tư vấn dựa trên `products` + `reviews` + `faqs`, trả về thẻ sản phẩm và mở thẳng checkout.
3. **Creator + Social Commerce:** tài khoản creator, follow, bình luận nhiều cấp, livestream, hoa hồng theo link creator.

Hạ tầng cho V2: chuyển store sang MariaDB, thêm hàng đợi xử lý video (cắt thumbnail, HLS), CDN cho `/media`.

## 8. Deploy

Code chính nằm trên VPS tại `/home/jamir/src`. Chạy `bash scripts/deploy-vps.sh` để build bằng Node 22 (`/opt/node22`), publish web vào `/home/jamir/site` và API vào `/home/jamir/api` (systemd `jamir-api`). Thêm `--web-only` nếu chỉ đổi giao diện. Dữ liệu (`/home/jamir/data`), file upload (`/home/jamir/uploads`) và `api.env` không bao giờ bị ghi đè.
