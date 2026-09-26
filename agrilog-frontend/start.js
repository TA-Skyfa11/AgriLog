/**
 * AgriLog Frontend Production Server Launcher for PM2
 * Tương thích hoàn hảo với cả môi trường Windows Server (PowerShell/CMD) và Linux
 */
const path = require('path');
const fs = require('fs');

const PORT = process.env.PORT || '3000';
process.env.PORT = PORT;
process.env.NODE_ENV = 'production';

// 1. Kiểm tra nếu build bằng Next.js output standalone (hiệu năng cao nhất, ít phụ thuộc)
const standaloneSubServer = path.join(__dirname, '.next', 'standalone', 'agrilog-frontend', 'server.js');
const standaloneRootServer = path.join(__dirname, '.next', 'standalone', 'server.js');

if (fs.existsSync(standaloneSubServer)) {
  console.log(`[AgriLog Frontend] Đang khởi chạy qua Next.js Standalone Server (subfolder) trên cổng ${PORT}...`);
  require(standaloneSubServer);
} else if (fs.existsSync(standaloneRootServer)) {
  console.log(`[AgriLog Frontend] Đang khởi chạy qua Next.js Standalone Server trên cổng ${PORT}...`);
  require(standaloneRootServer);
} else {
  // 2. Chạy qua Next.js CLI tiêu chuẩn
  const nextBin = path.join(__dirname, 'node_modules', 'next', 'dist', 'bin', 'next');
  if (fs.existsSync(nextBin)) {
    console.log(`[AgriLog Frontend] Đang khởi chạy Next.js CLI trên cổng ${PORT}...`);
    process.argv = [process.argv[0], nextBin, 'start', '-p', PORT];
    require(nextBin);
  } else {
    console.error('================================================================================');
    console.error('🚨 [AgriLog Frontend Error] Không tìm thấy thư mục node_modules của Next.js!');
    console.error('Vui lòng thực hiện các bước sau trên VPS:');
    console.error('  1. cd C:\\AgriLog\\agrilog-frontend');
    console.error('  2. npm install --legacy-peer-deps');
    console.error('  3. npm run build');
    console.error('  4. pm2 restart agrilog-frontend');
    console.error('================================================================================');
    process.exit(1);
  }
}
