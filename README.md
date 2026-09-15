# AgriLog - Nền tảng số hóa nhật ký canh tác

Dự án AgriLog là một nền tảng quản lý nông trại toàn diện, giúp số hóa nhật ký canh tác, quản lý vật tư, lịch trình công việc và tích hợp sàn giao dịch (Marketplace) nông sản/vật tư nông nghiệp.

Hệ thống bao gồm 3 vai trò chính:
- **FARM** (Quản lý Nông trại): Quản lý mùa vụ, ghi chép nhật ký canh tác (canh tác, phân bón, thuốc bảo vệ thực vật), quản lý kho vật tư, lịch công việc định kỳ, mua sắm vật tư.
- **COMPANY** (Doanh nghiệp): Quản lý và đăng bán các sản phẩm/vật tư nông nghiệp trên Marketplace, quản lý đơn hàng.
- **ADMIN** (Quản trị Hệ thống): Quản lý người dùng, duyệt sản phẩm doanh nghiệp, thống kê báo cáo hệ thống.

---

## 🌟 Các tính năng nổi bật
- **Hệ thống xác thực & Phân quyền**: Đăng nhập, đăng ký an toàn với JWT, phân quyền chi tiết (FARM, COMPANY, ADMIN).
- **Đồng bộ hóa Nhật ký Canh tác**: 
  - Khi tạo một bảng canh tác mới, hệ thống tự động khởi tạo bảng bón phân và phun thuốc tương ứng.
  - Khi người dùng thêm hoặc sửa một hàng nhật ký ở bất kỳ bảng nào (canh tác, bón phân, phun thuốc), hệ thống tự động đồng bộ hàng đó sang các bảng còn lại dựa theo thời gian.
- **Lịch công việc định kỳ (Recurring Tasks)**: 
  - Quản lý công việc linh hoạt trên giao diện Calendar.
  - Cho phép người dùng cấu hình lặp lại công việc: theo ngày, hàng tuần, hàng tháng hoặc tùy chỉnh sau mỗi N ngày/tuần/tháng (với tùy chọn ngày kết thúc hoặc số lần lặp).
- **Lưu trữ hình ảnh Cloudflare R2 (Object Storage)**:
  - Tích hợp chuẩn S3 API kết nối trực tiếp với Cloudflare R2.
  - Upload file nhanh chóng qua bộ nhớ đệm (RAM) mà không tốn dung lượng ổ đĩa máy chủ.
  - Hỗ trợ streaming proxy endpoint `/api/upload/file/...` giúp xem lại ảnh mượt mà ngay cả khi bucket R2 ở chế độ Private.
  - Hỗ trợ domain public/custom CDN qua biến `R2_PUBLIC_URL`.
  - Cơ chế dự phòng (Fallback) an toàn: nếu R2 chưa được cấu hình hoặc gặp sự cố, hệ thống tự động chuyển sang lưu trữ cục bộ tại thư mục `uploads/`.
- **Xuất tài liệu PDF chất lượng cao (Puppeteer)**:
  - Sử dụng Puppeteer (Headless Chromium) trên backend để kết xuất tài liệu PDF chuẩn in ấn A4 (Landscape/Portrait).
  - Hỗ trợ đầy đủ tiếng Việt Unicode có dấu, typography sắc nét, màu sắc nhận diện riêng biệt cho từng loại nhật ký.
  - Tự động tích hợp thông tin nông trại (Tên, địa chỉ, SĐT) cùng khung chữ ký xác nhận ("Người lập biểu", "Chủ trang trại / Cán bộ kỹ thuật").
  - Áp dụng cho: Nhật ký Canh tác, Nhật ký Bón phân, Nhật ký Thuốc BVTV và Báo cáo hoạt động nông trại theo tháng.
- **Sàn giao dịch (Marketplace)**: Farm tìm kiếm, xem chi tiết và đặt hàng vật tư nông nghiệp; Company quản lý danh mục và tồn kho; Admin kiểm duyệt.
- **Cài đặt & Thông báo**: Cấu hình hồ sơ, thông báo (Push/Email qua Resend), giao diện Sáng/Tối, gói cước giới hạn upload hình ảnh.
- **Tích hợp Thời tiết (OpenWeatherMap)**: Hiển thị thời tiết thời gian thực trên Dashboard và tự động ghi nhận thời tiết vào các bảng nhật ký.

---

## 🛠 Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Database**: MongoDB (Local hoặc MongoDB Atlas)
- **Cloud Storage**: Cloudflare R2 (hoặc lưu trữ local dự phòng)
- **PackageManager**: `npm` hoặc `yarn`

---

## 📁 Cấu trúc dự án
Dự án được chia làm hai phần tách biệt:
- `agrilog-backend/`: Máy chủ API viết bằng Node.js, Express 5, TypeScript, Mongoose, AWS S3 Client SDK.
- `agrilog-frontend/`: Ứng dụng Web viết bằng Next.js 14+ (App Router), TypeScript, CSS Modules, Lucide Icons, React Hot Toast.

---

## 🚀 Hướng dẫn cài đặt & chạy Backend

1. **Di chuyển vào thư mục Backend**
   ```bash
   cd agrilog-backend
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env`)**
   - Tạo hoặc chỉnh sửa file `.env` ở thư mục gốc của `agrilog-backend`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/agrilog?retryWrites=true&w=majority
   JWT_SECRET=mot_chuoi_bi_mat_bat_ky_cho_jwt
   FRONTEND_URL=http://localhost:3000
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   RESEND_API_KEY=your_resend_api_key

   # Cloudflare R2 Storage Configuration
   R2_ACCOUNT_ID=d83b40f9ba48c1a0952568b9620ee62f
   R2_ENDPOINT=https://d83b40f9ba48c1a0952568b9620ee62f.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your_cloudflare_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_cloudflare_r2_secret_access_key
   R2_BUCKET_NAME=agrilog
   R2_PUBLIC_URL=
   ```
   > **Lưu ý về Cloudflare R2:**
   > - `R2_ACCESS_KEY_ID` và `R2_SECRET_ACCESS_KEY`: Lấy từ mục *Cloudflare Dashboard -> R2 -> Manage R2 API Tokens*.
   > - `R2_BUCKET_NAME`: Tên bucket trên R2 (mặc định là `agrilog`).
   > - `R2_PUBLIC_URL`: Để trống nếu sử dụng cơ chế streaming proxy mặc định qua API backend, hoặc điền Public Domain của Bucket (ví dụ: `https://pub-xxxx.r2.dev`) nếu đã bật tính năng R2 Public Bucket.

4. **Tạo dữ liệu mẫu ban đầu (Seeder)**
   ```bash
   npx ts-node src/seeder.ts
   npx ts-node src/seedMarketplace.ts
   ```
   *Lệnh `seeder.ts` sẽ tạo ra các tài khoản mặc định:*
   - **ADMIN**: Email: `admin@agrilog.com` | Mật khẩu: `123456`
   - **FARM**: Email: `farm@agrilog.com` | Mật khẩu: `123456`
   - **COMPANY**: Email: `company@agrilog.com` | Mật khẩu: `123456`

5. **Khởi động Backend Server**
   ```bash
   npm run dev
   ```
   Backend sẽ hoạt động tại `http://localhost:5000`

---

## 💻 Hướng dẫn cài đặt & chạy Frontend

1. **Mở một cửa sổ Terminal mới** và di chuyển vào thư mục Frontend:
   ```bash
   cd agrilog-frontend
   ```

2. **Cài đặt các gói phụ thuộc (Dependencies)**
   ```bash
   npm install
   ```

3. **Cấu hình biến môi trường (`.env.local`) (Tùy chọn)**
   - Mặc định Frontend gọi API tới `http://localhost:5000/api`. Nếu cần thay đổi:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Khởi động Frontend Server**
   ```bash
   npm run dev
   ```
   Frontend sẽ hoạt động tại `http://localhost:3000`

---

## 🎯 Trải nghiệm hệ thống
- Mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**
- Đăng nhập bằng tài khoản **FARM** (`farm@agrilog.com` / `123456`) để:
  - Thử nghiệm tạo nhật ký canh tác và kiểm tra tính năng tự động đồng bộ sang bảng bón phân, phun thuốc.
  - Tải lên ảnh tại cột "Đính kèm ảnh" để kiểm tra tải ảnh trực tiếp lên **Cloudflare R2** và phóng to ảnh (Lightbox preview).
  - Thử nghiệm tạo lịch công việc với tùy chọn lặp lại định kỳ (Hàng tuần, Hàng tháng, Tùy chỉnh).
