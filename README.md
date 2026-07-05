# AgriLog - Nền tảng số hóa nhật ký canh tác

Dự án AgriLog là một nền tảng quản lý nông trại, giúp số hóa nhật ký canh tác, vật tư và công việc. Hệ thống bao gồm 2 vai trò chính: **FARM** (Quản lý Nông trại) và **ADMIN** (Quản trị Hệ thống).

---

## 🛠 Yêu cầu hệ thống
- **Node.js**: Phiên bản 18.x trở lên
- **Database**: MongoDB (Local hoặc MongoDB Atlas)
- **PackageManager**: `npm` hoặc `yarn`

---

## 📁 Cấu trúc dự án
Dự án được chia làm hai phần tách biệt:
- `agrilog-backend/`: Máy chủ API viết bằng Node.js, Express, Mongoose.
- `agrilog-frontend/`: Ứng dụng Web viết bằng Next.js (App Router), TypeScript, CSS Modules.

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
   ```
   *(Nhớ thay đổi chuỗi `MONGO_URI` thành đường dẫn MongoDB của bạn)*

4. **Tạo dữ liệu mẫu ban đầu (Seeder)**
   - Bước này rất quan trọng để có tài khoản đăng nhập vào hệ thống.
   ```bash
   npx ts-node src/seeder.ts
   ```
   *Lệnh này sẽ tạo ra 2 tài khoản mặc định:*
   - **ADMIN**: Email: `admin@agrilog.com` | Pass: `123456`
   - **FARM**: Email: `farm@agrilog.com` | Pass: `123456`

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
   - Mặc định Frontend gọi API tới `http://localhost:5000/api`. Nếu Backend của bạn chạy ở Port khác, hãy cập nhật lại ở file `src/lib/api.ts` hoặc cấu hình `.env.local` cho Frontend.

4. **Khởi động Frontend Server**
   ```bash
   npm run dev
   ```
   Frontend sẽ hoạt động tại `http://localhost:3000`

---

## 🎯 Đăng nhập và trải nghiệm
- Hãy mở trình duyệt và truy cập: **[http://localhost:3000](http://localhost:3000)**
- Dùng tài khoản `farm@agrilog.com` hoặc `admin@agrilog.com` ở bước Seeder để đăng nhập và kiểm tra các chức năng của hệ thống.
