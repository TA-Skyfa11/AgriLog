#!/usr/bin/env bash
set -e

echo "🚀 [AgriLog] Bắt đầu triển khai trên Linux Server..."

# Di chuyển về thư mục gốc dự án
ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

echo "📥 1. Kéo mã nguồn mới nhất từ nhánh main..."
git fetch origin main
git reset --hard origin/main

echo "🔨 2. Cài đặt và build Backend..."
cd agrilog-backend
npm install --legacy-peer-deps
npm run build

echo "🎨 3. Cài đặt và build Frontend..."
cd ../agrilog-frontend
npm install --legacy-peer-deps
npm run build

echo "⚡ 4. Khởi động / Tải lại tiến trình với PM2..."
cd ..
if command -v pm2 &> /dev/null; then
  pm2 reload ecosystem.config.js --update-env || pm2 start ecosystem.config.js
  pm2 save
else
  npx pm2 reload ecosystem.config.js --update-env || npx pm2 start ecosystem.config.js
  npx pm2 save
fi

echo "✅ [AgriLog] Triển khai thành công trên Linux!"
