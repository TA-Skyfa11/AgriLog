# AgriLog - Nền tảng số hóa nhật ký canh tác

Dự án AgriLog là một nền tảng quản lý nông trại, giúp số hóa nhật ký canh tác, vật tư, công việc, và tích hợp sàn giao dịch (Marketplace) nông sản/vật tư. 

Hệ thống bao gồm 3 vai trò chính:
- **FARM** (Quản lý Nông trại): Quản lý mùa vụ, ghi chép nhật ký canh tác (phân bón, thuốc bảo vệ thực vật), quản lý kho, mua sắm vật tư.
- **COMPANY** (Doanh nghiệp): Quản lý và đăng bán các sản phẩm/vật tư nông nghiệp trên Marketplace, quản lý đơn hàng.
- **ADMIN** (Quản trị Hệ thống): Quản lý người dùng, kiểm duyệt sản phẩm, thống kê hệ thống.

---

## 🌟 Các tính năng nổi bật
- **Hệ thống xác thực**: Đăng nhập, đăng ký, phân quyền an toàn với JWT, quản lý lịch sử đăng nhập.
- **Nhật ký canh tác**: Các bảng ghi chép tương tác cho Gieo trồng, Phân bón, và Thuốc bảo vệ thực vật với khả năng đính kèm hình ảnh và cập nhật trực tiếp.
- **Sàn giao dịch (Marketplace)**: Nơi các Farm có thể mua vật tư và Company có thể đăng bán sản phẩm, kèm theo hệ thống kiểm duyệt chặt chẽ của Admin.
- **Cài đặt & Thông báo**: Quản lý hồ sơ, cấu hình thông báo (Push/Email), tuỳ chỉnh giao diện (Theme Sáng/Tối, Ngôn ngữ), và cài đặt bảo mật tài khoản.
- **Tích hợp Thời tiết (OpenWeatherMap)**: Hiển thị thông tin thời tiết, biểu đồ nhiệt độ trực tiếp trên Dashboard. Tự động lấy và ghi nhận thời tiết vào các bảng Nhật ký (Canh tác, Phân bón, Thuốc BVTV) khi thêm dữ liệu mới.

---

## 🛠 Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Database**: MongoDB (Local hoặc MongoDB Atlas)
- **PackageManager**: `npm` hoặc `yarn`

---

## 📁 Cấu trúc dự án
Dự án được chia làm hai phần tách biệt:
- `agrilog-backend/`: Máy chủ API viết bằng Node.js, Express, Mongoose.
- `agrilog-frontend/`: Ứng dụng Web viết bằng Next.js (App Router), TypeScript, CSS Modules, và React Hot Toast.

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

3. **Cấu hình biến môi trường**
   - Tạo một file `.env` ở thư mục gốc của `agrilog-backend`
   - Thêm nội dung sau vào file `.env`:
   ```env
   PORT=5000
   MONGO_URI=mongodb+srv://<username>:<password>@cluster0.mongodb.net/agrilog?retryWrites=true&w=majority
   JWT_SECRET=mot_chuoi_bi_mat_bat_ky_cho_jwt
   FRONTEND_URL=http://localhost:3000
   OPENWEATHERMAP_API_KEY=your_openweathermap_api_key
   RESEND_API_KEY=your_resend_api_key
   ```
   *(Nhớ thay đổi chuỗi `MONGO_URI` thành đường dẫn MongoDB của bạn)*

4. **Tạo dữ liệu mẫu ban đầu (Seeder)**
   - Bước này rất quan trọng để có tài khoản đăng nhập vào hệ thống và dữ liệu giả lập cho sàn giao dịch.
   ```bash
   npx ts-node src/seeder.ts
   npx ts-node src/seedMarketplace.ts
   ```
   *Lệnh `seeder.ts` sẽ tạo ra các tài khoản mặc định:*
   - **ADMIN**: Email: `admin@agrilog.com` | Pass: `123456`
   - **FARM**: Email: `farm@agrilog.com` | Pass: `123456`
   - **COMPANY**: Email: `company@agrilog.com` | Pass: `123456`

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

3. *(Tùy chọn) Cấu hình URL Backend*
   - Mặc định Frontend gọi API tới `http://localhost:5000/api`. Nếu Backend của bạn chạy ở Port khác, hãy cấu hình file `.env.local` cho Frontend:
   ```env
   NEXT_PUBLIC_API_URL=http://localhost:5000/api
   ```

4. **Khởi động Frontend Server**
   ```bash
   npm run dev
   ```
   Frontend sẽ hoạt động tại `http://localhost:3000`

---

## 🎯 Đăng nhập và trải nghiệm
- Hãy mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**
- Đăng nhập bằng các tài khoản đã tạo ở bước Seeder để trải nghiệm các Dashboard tương ứng theo quyền (Admin, Farm, Company).
