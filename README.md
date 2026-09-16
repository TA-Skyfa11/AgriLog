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
- **Cổng thanh toán tự động SePay (Ngân hàng TMCP Quân đội - MBBank)**:
  - Tích hợp thanh toán mua và nâng cấp gói cước dịch vụ (`BASIC`, `STANDARD`, `PREMIUM`) qua tài khoản ngân hàng kết nối SePay.
  - Sinh mã VietQR SePay động chứa đúng số tiền và nội dung chuyển khoản duy nhất cho từng lệnh (`AGRIxxxxxx`).
  - **Tự động nhận diện giao dịch thành công**:
    - Tiếp nhận Webhook tức thì từ SePay (`POST /api/payment/sepay-webhook`) khi có biến động số dư tiền vào.
    - Chủ động đối soát qua SePay API v2 để tự động phát hiện thanh toán ngay cả trên môi trường local.
  - **Tự động mở gói & gia hạn**: Ngay khi nhận tiền, hệ thống tự động cập nhật gói cước trong `FarmProfile`, gia hạn 30 ngày (cộng dồn nếu gói còn hạn), lưu lịch sử giao dịch và gửi thông báo in-app `Notification`.
  - **Giao diện thanh toán hiện đại**: Nút sao chép 1-chạm (STK, Số tiền, Nội dung), đồng hồ đếm ngược 15 phút, trạng thái chờ nhấp nháy real-time, nút kiểm tra ngay và chế độ mô phỏng thanh toán (Dev Simulation).
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
   R2_ACCOUNT_ID=your_cloudflare_account_id
   R2_ENDPOINT=https://<your_account_id>.r2.cloudflarestorage.com
   R2_ACCESS_KEY_ID=your_cloudflare_r2_access_key_id
   R2_SECRET_ACCESS_KEY=your_cloudflare_r2_secret_access_key
   R2_BUCKET_NAME=agrilog
   R2_PUBLIC_URL=

   # SePay Payment Gateway Configuration
   SEPAY_API_KEY=your_sepay_api_token
   SEPAY_ACC_NUMBER=your_bank_account_number
   SEPAY_BANK=MBBank
   SEPAY_ACC_NAME=YOUR_ACCOUNT_NAME
   SEPAY_WEBHOOK_KEY=
   ```
   > **Lưu ý về Cloudflare R2:**
   > - `R2_ACCESS_KEY_ID` và `R2_SECRET_ACCESS_KEY`: Lấy từ mục *Cloudflare Dashboard -> R2 -> Manage R2 API Tokens*.
   > - `R2_BUCKET_NAME`: Tên bucket trên R2 (mặc định là `agrilog`).
   > - `R2_PUBLIC_URL`: Để trống nếu sử dụng cơ chế streaming proxy mặc định qua API backend, hoặc điền Public Domain của Bucket (ví dụ: `https://pub-xxxx.r2.dev`) nếu đã bật tính năng R2 Public Bucket.
   >
   > **Lưu ý về Cổng thanh toán SePay:**
   > - `SEPAY_API_KEY`: API Token lấy từ trang quản trị [my.sepay.vn](https://my.sepay.vn) (Company Settings -> API Access) dùng để chủ động đối soát biến động số dư qua SePay API v2.
   > - `SEPAY_ACC_NUMBER`: Số tài khoản ngân hàng thụ hưởng của bạn.
   > - `SEPAY_BANK`: Tên ngân hàng thụ hưởng (ví dụ: `MBBank`, `Vietcombank`, `Techcombank`...).
   > - `SEPAY_ACC_NAME`: Tên chủ tài khoản thụ hưởng (chữ in hoa không dấu).
   > - `SEPAY_WEBHOOK_KEY`: Chuỗi bí mật xác thực webhook (tùy chọn).

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

## 💳 Hướng dẫn cấu hình SePay Webhook (Khi đưa lên Server)

Khi triển khai hệ thống lên máy chủ thực tế (Production) hoặc thử nghiệm qua kênh Tunnel (Ngrok / Cloudflare Tunnel):
1. Đăng nhập vào trang quản trị [my.sepay.vn](https://my.sepay.vn).
2. Vào menu **Webhooks** -> chọn **Thêm Webhook**.
3. Cấu hình các thông tin:
   - **URL Webhook**: `https://<ten-mien-cua-ban>/api/payment/sepay-webhook`
   - **Tài khoản**: Chọn tài khoản ngân hàng của bạn đã kết nối trên SePay.
   - **Sự kiện kích hoạt**: Khi có biến động số dư tiền vào (`in`).
4. Bấm **Lưu**. Bất cứ khi nào phát sinh giao dịch chuyển khoản vào tài khoản ngân hàng với nội dung `AGRIxxxxxx`, SePay sẽ tự động gọi webhook và hệ thống AgriLog sẽ kích hoạt gói cước ngay lập tức.

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
  - Truy cập mục **Gói dịch vụ** (`/billing`) để trải nghiệm cổng thanh toán tự động **SePay**:
    - Chọn nâng cấp gói cước (`STANDARD` hoặc `PREMIUM`) để xem mã VietQR SePay động được tạo tự động với đầy đủ thông tin thanh toán.
    - Sử dụng các nút sao chép tiện lợi (STK, Số tiền, Nội dung).
    - Thử nghiệm nút **"⚡ Mô phỏng thanh toán (Dev Test)"** hoặc quét mã thanh toán thật để hệ thống tự động kích hoạt gói cước và gia hạn 30 ngày ngay lập tức.
