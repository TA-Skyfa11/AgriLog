#!/usr/bin/env bash
set -e

echo "====================================================================="
echo "🚀 [AgriLog] Bắt đầu triển khai trên Linux Server (Docker Compose)..."
echo "====================================================================="

# Di chuyển về thư mục gốc dự án
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

# 1. Kiểm tra môi trường Docker
echo "🔍 [Bước 1/5] Kiểm tra môi trường Docker..."
if ! command -v docker &> /dev/null; then
  echo "❌ Docker chưa được cài đặt. Vui lòng cài đặt Docker Engine trước."
  exit 1
fi

if ! docker info &> /dev/null; then
  echo "❌ Docker daemon không hoạt động. Vui lòng chạy lệnh: sudo systemctl start docker"
  exit 1
fi

# Kiểm tra file .env
if [ ! -f ".env" ]; then
  if [ -f ".env.docker.example" ]; then
    echo "⚠️ Không tìm thấy .env. Tự động sao chép từ .env.docker.example..."
    cp .env.docker.example .env
    echo "⚠️ Vui lòng cấu hình các biến MONGO_URI Atlas và JWT_SECRET trong .env!"
  else
    echo "❌ Bắt buộc phải có file .env ở thư mục gốc để chạy triển khai!"
    exit 1
  fi
fi

# 2. Cập nhật mã nguồn mới nhất
echo "📥 [Bước 2/5] Kéo mã nguồn mới nhất từ nhánh main..."
git fetch origin main
git reset --hard origin/main

# 3. Dừng các tiến trình PM2 cũ nếu có (để giải phóng cổng 3000 & 5000)
echo "🧹 [Bước 3/5] Dọn dẹp tiến trình PM2 cũ nếu đang chạy..."
if command -v pm2 &> /dev/null; then
  pm2 stop agrilog-backend agrilog-frontend 2>/dev/null || true
  pm2 delete agrilog-backend agrilog-frontend 2>/dev/null || true
  pm2 save 2>/dev/null || true
fi

# 4. Build và khởi chạy container với Docker Compose
echo "🐳 [Bước 4/5] Build và khởi động containers với Docker Compose..."
# Chỉ chạy backend + frontend trỏ trực tiếp Atlas (mongo local nằm trong profile local-db)
docker compose up -d --build --remove-orphans

# Dọn dẹp image dangling để tiết kiệm dung lượng ổ cứng VPS
docker image prune -f || true

# 5. Kiểm tra trạng thái dịch vụ
echo "🩺 [Bước 5/5] Kiểm tra trạng thái dịch vụ sau khởi động..."
sleep 5
docker compose ps

echo "====================================================================="
echo "✅ [AgriLog] Triển khai thành công trên Linux Server!"
echo "🌐 Frontend : http://localhost:3000"
echo "🔌 Backend  : http://localhost:5000/api"
echo "🍃 Database : Kết nối trực tiếp MongoDB Atlas Cloud"
echo "====================================================================="
