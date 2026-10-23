# AgriLog Cloudflare Worker (Hyperdrive)

Module này triển khai Cloudflare Worker chạy trên Edge Network của Cloudflare, sử dụng **Cloudflare Hyperdrive** để tăng tốc độ kết nối và tối ưu hóa connection pooling đến cơ sở dữ liệu PostgreSQL (Supabase) của AgriLog.

---

## 🚀 Tính năng

- **Hyperdrive Connection Pooling**: Tái sử dụng kết nối database giữa các request tại edge node gần nhất, giảm latency kết nối từ 200-500ms xuống chỉ còn vài ms.
- **Tương thích `pg` (node-postgres)**: Chạy thư viện `pg` chuẩn trên Workers nhờ cờ `nodejs_compat`.
- **Hỗ trợ CORS**: Cho phép gọi trực tiếp từ Web Frontend (`agrilog-frontend`) hoặc ứng dụng di động.
- **Tự động đóng kết nối với `ctx.waitUntil(client.end())`**: Đảm bảo giải phóng tài nguyên mà không chặn thời gian phản hồi của client.

---

## 🛠 Hướng dẫn thiết lập & Chạy Worker

### 1. Cài đặt Dependencies

Tại thư mục `agrilog-worker`:
```bash
cd agrilog-worker
npm install
```

### 2. Cấu hình Hyperdrive ID

Mở file `wrangler.toml` và cập nhật ID Hyperdrive bạn vừa tạo trên Cloudflare Dashboard:

```toml
name = "agrilog-worker"
main = "src/index.ts"
compatibility_date = "2024-09-23"
compatibility_flags = ["nodejs_compat"]

[[hyperdrive]]
binding = "HYPERDRIVE"
id = "<ID_HYPERDRIVE_CUA_BAN>"
```

> **Cách lấy ID Hyperdrive:**
> 1. Truy cập **Cloudflare Dashboard** -> **Compute (Workers & Pages)** -> **Hyperdrive**.
> 2. Chọn Hyperdrive database bạn đã tạo và copy trường **Config ID** (chuỗi 32 ký tự).
> 3. Hoặc chạy lệnh: `npx wrangler hyperdrive list`

### 3. Cấu hình biến môi trường Local (Bảo mật)

Sao chép file `.dev.vars.example` thành `.dev.vars` và điền chuỗi kết nối Supabase của bạn:
```bash
cp .dev.vars.example .dev.vars
```
Nội dung file `.dev.vars` (file này đã được đưa vào `.gitignore` để tránh rò rỉ mật khẩu lên Git):
```bash
WRANGLER_HYPERDRIVE_LOCAL_CONNECTION_STRING_HYPERDRIVE="postgresql://postgres.[PROJECT_REF]:[PASSWORD]@[REGION].pooler.supabase.com:5432/postgres"
```

### 4. Chạy thử nghiệm Local (Development)

```bash
npm run dev
```

### 5. Triển khai lên Cloudflare Workers (Production)

```bash
npm run deploy
```

Sau khi deploy thành công, bạn sẽ nhận được URL endpoint dạng:
`https://agrilog-worker.<subdomain>.workers.dev`

---

## 📌 Phân biệt giữa Worker & Backend Express

| Tiêu chí | `agrilog-worker` (Edge Worker) | `agrilog-backend` (Node.js Express) |
|---|---|---|
| **Môi trường chạy** | Cloudflare Edge Network (Serverless) | Node.js Server / Docker / VPS |
| **Cơ chế Pooling** | Cloudflare Hyperdrive (`env.HYPERDRIVE`) | Supabase Pooler (`DATABASE_POOLER_URL` trong `.env`) |
| **Driver DB** | `pg` (Client) | `postgres` (porsager/postgres) |
| **Thích hợp cho** | API phản hồi nhanh toàn cầu, tra cứu dữ liệu edge | Nghiệp vụ backend phức tạp, cron jobs, file upload |
