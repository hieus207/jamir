# Deploy JAMIR

## VPS đang chạy (cập nhật code)

```bash
ssh <vps> 'cd /home/jamir/src && git pull && bash scripts/deploy-vps.sh'   # thêm --web-only nếu chỉ đổi giao diện
```

`deploy-vps.sh` build bằng Node 22 (`/opt/node22`), chép web vào `/home/jamir/site`, API vào `/home/jamir/api`, khởi động lại dịch vụ `jamir-api`. Không đụng tới `data/`, `uploads/`, `api.env`.

## VPS mới (Ubuntu 22.04 / 24.04, quyền root)

```bash
ssh root@<ip-moi>
curl -fsSL https://raw.githubusercontent.com/hieus207/jamir/main/scripts/setup-new-vps.sh | bash -s -- jamir.vn   # bỏ "jamir.vn" nếu chưa có domain
```

Script làm những việc sau: cài nginx và Node 22, clone code, sinh `api.env` (mật khẩu admin và khoá phiên ngẫu nhiên), tạo dịch vụ systemd và cấu hình nginx, build và chạy. Có domain thì cài thêm HTTPS (Let's Encrypt); DNS phải trỏ về IP mới trước khi chạy.

## Chuyển dữ liệu từ VPS cũ

Nội dung **không nằm trong git**. Chạy các lệnh sau trên VPS mới, sau khi setup xong:

```bash
OLD=root@66.42.60.90
systemctl stop jamir-api
rsync -az $OLD:/home/jamir/data/    /home/jamir/data/      # sản phẩm, đơn hàng, khách, đánh giá, cấu hình…
rsync -az $OLD:/home/jamir/uploads/ /home/jamir/uploads/   # ảnh/video up trong admin
rsync -az $OLD:/home/jamir/site/media/ /home/jamir/site/media/   # ảnh/video sản phẩm gốc
# giữ mật khẩu admin và khoá phiên cũ (khách không bị đăng xuất):
rsync -az $OLD:/home/jamir/api.env /home/jamir/api.env
systemctl start jamir-api
```

Nếu domain khác IP cũ, sửa `PUBLIC_URL=https://<domain>` trong `/home/jamir/api.env` rồi chạy `systemctl restart jamir-api`.

## Kiểm tra sau khi deploy

- `curl -s http://127.0.0.1:3001/api/health` trả về `{"ok":true}`
- Trang chủ, `/san-pham/<slug>`, `/uu-dai/<slug>`, `/cong-dong`, `/sitemap.xml` đều trả 200
- `curl -s https://<domain>/ | grep og:image` có ảnh share
- Đăng nhập `/admin` bằng tài khoản trong `api.env`
