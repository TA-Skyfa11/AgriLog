/**
 * Chuẩn hóa URL hình ảnh an toàn, hỗ trợ:
 * 1. Cloudflare R2 proxy URL (/api/upload/file/images/...)
 * 2. Tự động khắc phục các URL bị lỗi chuỗi (ví dụ: http://localhost:5000agrilog.io.vn/images/...)
 * 3. Chuẩn hóa đường dẫn tương đối (/uploads/..., /api/upload/...) theo NEXT_PUBLIC_API_URL
 * 4. Chuyển đổi localhost:5000 / 127.0.0.1:5000 sang hostname hiện tại khi chạy trên môi trường khác
 * 5. Giữ nguyên URL ảnh CDN bên ngoài (Unsplash, Cloudinary, Imgur, ...)
 */
export const getSafeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000/api';
  const baseUrl = apiUrl.replace(/\/api$/, '');

  // 1. Khắc phục URL bị dính chuỗi tên miền agrilog.io.vn/images/...
  if (trimmed.includes('agrilog.io.vn/images/')) {
    const key = trimmed.split('agrilog.io.vn/')[1];
    return `${baseUrl}/api/upload/file/${key}`;
  }

  // 2. Chuyển đổi địa chỉ localhost:5000 / 127.0.0.1:5000 cứng sang baseUrl hiện tại
  if (trimmed.startsWith('http://localhost:5000') || trimmed.startsWith('http://127.0.0.1:5000')) {
    const pathPart = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/, '');
    return `${baseUrl}${pathPart.startsWith('/') ? '' : '/'}${pathPart}`;
  }

  // 3. Đường dẫn tương đối bắt đầu bằng /
  if (trimmed.startsWith('/')) {
    return `${baseUrl}${trimmed}`;
  }

  // 4. Nếu là key của R2 (images/...)
  if (trimmed.startsWith('images/')) {
    return `${baseUrl}/api/upload/file/${trimmed}`;
  }

  // 5. Nếu là thư mục uploads/
  if (trimmed.startsWith('uploads/')) {
    return `${baseUrl}/${trimmed}`;
  }

  // 6. URL tuyệt đối bên ngoài hợp lệ (http://, https://)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return `${baseUrl}/${trimmed}`;
};
