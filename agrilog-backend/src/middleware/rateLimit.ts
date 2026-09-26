import { Request } from 'express';
import rateLimit from 'express-rate-limit';

/**
 * Trích xuất và chuẩn hóa địa chỉ IP client an toàn, tương thích reverse proxy (Nginx, IIS, Cloudflare)
 * Tự động loại bỏ cổng (port) đính kèm trong các chuỗi IP như "171.244.35.2:38052"
 */
export function getClientIp(req: Request): string {
  const forwarded = req.headers['x-forwarded-for'];
  let rawIp = '';

  if (typeof forwarded === 'string') {
    rawIp = forwarded.split(',')[0].trim();
  } else if (Array.isArray(forwarded) && forwarded.length > 0) {
    rawIp = forwarded[0].split(',')[0].trim();
  } else if (typeof req.headers['x-real-ip'] === 'string') {
    rawIp = req.headers['x-real-ip'].trim();
  } else {
    rawIp = req.ip || req.socket?.remoteAddress || '127.0.0.1';
  }

  // Loại bỏ port nếu có trong IPv4 (ví dụ: "171.244.35.2:38052" -> "171.244.35.2")
  const ipv4Match = rawIp.match(/^(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})(:\d+)?$/);
  if (ipv4Match) {
    return ipv4Match[1];
  }

  // Loại bỏ port trong IPv6 có ngoặc vuông (ví dụ: "[::1]:8080" -> "::1")
  const ipv6Match = rawIp.match(/^\[([a-fA-F0-9:]+)\](:\d+)?$/);
  if (ipv6Match) {
    return ipv6Match[1];
  }

  // Chuẩn hóa dạng IPv4-mapped IPv6: "::ffff:171.244.35.2" -> "171.244.35.2"
  if (rawIp.startsWith('::ffff:')) {
    return rawIp.substring(7);
  }

  return rawIp || '127.0.0.1';
}

export const loginRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Giới hạn 5 lần đăng nhập sai từ 1 IP trong 15 phút
  message: {
    success: false,
    message: 'Quá nhiều yêu cầu đăng nhập từ IP này, vui lòng thử lại sau 15 phút.'
  },
  keyGenerator: (req) => getClientIp(req),
  validate: {
    ip: false, // Tránh ném lỗi ERR_ERL_INVALID_IP_ADDRESS khi proxy chuyển tiếp port
    xForwardedForHeader: false,
    default: false,
  },
  standardHeaders: true, // Trả thông tin rate limit qua header `RateLimit-*`
  legacyHeaders: false, // Vô hiệu hóa các header `X-RateLimit-*` cũ
});

