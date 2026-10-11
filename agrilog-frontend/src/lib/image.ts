/**
 * Chuẩn hóa URL hình ảnh an toàn, hỗ trợ:
 * 1. Cloudflare R2 proxy URL (/api/upload/file/images/...)
 * 2. Tự động khắc phục các URL bị lỗi chuỗi (ví dụ: http://localhost:5000agrilog.io.vn/images/...)
 * 3. Chuyển đổi localhost:5000 / 127.0.0.1:5000 cứng (cả http:// và https://) sang đường dẫn an toàn
 * 4. Chuẩn hóa đường dẫn tương đối (/uploads/..., /api/upload/...) tránh Mixed Content / SSL Refused
 * 5. Giữ nguyên URL ảnh CDN bên ngoài (Unsplash, Cloudinary, Imgur, ...)
 */
export const getSafeImageUrl = (url?: string | null): string => {
  if (!url || typeof url !== 'string' || !url.trim()) return '';
  const trimmed = url.trim();

  // Xác định base URL nếu cấu hình API trỏ sang domain riêng biệt từ xa (không phải localhost)
  const envApi = process.env.NEXT_PUBLIC_API_URL;
  const isRemoteApi = Boolean(
    envApi &&
    !envApi.includes('localhost') &&
    !envApi.includes('127.0.0.1')
  );
  const remoteBaseUrl = isRemoteApi ? envApi!.replace(/\/api$/, '') : '';

  // 1. Khắc phục URL bị dính chuỗi tên miền agrilog.io.vn/images/...
  if (trimmed.includes('agrilog.io.vn/images/')) {
    const key = trimmed.split('agrilog.io.vn/')[1];
    return isRemoteApi ? `${remoteBaseUrl}/api/upload/file/${key}` : `/api/upload/file/${key}`;
  }

  // 2. Chuyển đổi localhost:5000 / 127.0.0.1:5000 cứng (bất kể http:// hay https://)
  // Khắc phục triệt để lỗi ERR_CONNECTION_REFUSED khi trình duyệt gọi https://localhost:5000
  if (/^https?:\/\/(localhost|127\.0\.0\.1):5000/i.test(trimmed)) {
    const pathPart = trimmed.replace(/^https?:\/\/(localhost|127\.0\.0\.1):5000/i, '');
    const cleanPath = pathPart.startsWith('/') ? pathPart : `/${pathPart}`;
    return isRemoteApi ? `${remoteBaseUrl}${cleanPath}` : cleanPath;
  }

  // 3. Đường dẫn tương đối bắt đầu bằng / (ví dụ: /api/upload/file/..., /uploads/...)
  if (trimmed.startsWith('/')) {
    return isRemoteApi ? `${remoteBaseUrl}${trimmed}` : trimmed;
  }

  // 4. Nếu là key của R2 (images/...)
  if (trimmed.startsWith('images/')) {
    return isRemoteApi ? `${remoteBaseUrl}/api/upload/file/${trimmed}` : `/api/upload/file/${trimmed}`;
  }

  // 5. Nếu là thư mục uploads/
  if (trimmed.startsWith('uploads/')) {
    return isRemoteApi ? `${remoteBaseUrl}/${trimmed}` : `/${trimmed}`;
  }

  // 6. URL tuyệt đối bên ngoài hợp lệ (Unsplash, Cloudinary, Imgur, Public R2 URL...)
  if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
    return trimmed;
  }

  return isRemoteApi ? `${remoteBaseUrl}/${trimmed}` : `/${trimmed}`;
};
