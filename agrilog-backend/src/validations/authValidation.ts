import { z } from 'zod';
import { Role } from '../models/User';

export const registerSchema = z.object({
  name: z
    .string('Họ tên không được để trống')
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  phone: z
    .string('Số điện thoại không được để trống')
    .trim()
    .min(1, 'Số điện thoại không được để trống')
    .refine((val) => {
      const cleaned = val.replace(/[\s.-]/g, '');
      return /^(0|\+84)[0-9]{9}$/.test(cleaned);
    }, {
      message: 'Số điện thoại không hợp lệ (gồm 10 chữ số, ví dụ: 0987654321)',
    }),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng')
    .optional()
    .or(z.literal(''))
    .nullable(),
  password: z
    .string('Mật khẩu không được để trống')
    .min(6, 'Mật khẩu phải có ít nhất 6 ký tự'),
  role: z
    .enum([Role.FARM, Role.COMPANY], {
      message: 'Vai trò chỉ có thể là FARM hoặc COMPANY',
    })
    .optional()
    .default(Role.FARM),
});

export const loginSchema = z
  .object({
    identifier: z.string().trim().optional(),
    email: z.string().trim().optional(),
    phone: z.string().trim().optional(),
    password: z
      .string('Mật khẩu không được để trống')
      .min(1, 'Vui lòng nhập mật khẩu'),
  })
  .refine(
    (data) => {
      const val = data.identifier || data.email || data.phone;
      return typeof val === 'string' && val.trim().length > 0;
    },
    {
      message: 'Vui lòng nhập email hoặc số điện thoại',
      path: ['identifier'],
    }
  );

export const verifyMfaSchema = z.object({
  email: z
    .string('Email không được để trống')
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng'),
  code: z
    .string('Mã xác thực OTP không được để trống')
    .trim()
    .length(6, 'Mã xác thực OTP phải gồm 6 chữ số'),
});

export const forgotPasswordSchema = z.object({
  email: z
    .string('Email không được để trống')
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng'),
});

export const resetPasswordSchema = z.object({
  token: z
    .string('Mã token khôi phục không được để trống')
    .trim()
    .min(1, 'Token khôi phục không hợp lệ'),
  newPassword: z
    .string('Mật khẩu mới không được để trống')
    .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
});

export const changePasswordSchema = z
  .object({
    currentPassword: z
      .string('Vui lòng nhập mật khẩu hiện tại')
      .min(1, 'Vui lòng nhập mật khẩu hiện tại'),
    newPassword: z
      .string('Vui lòng nhập mật khẩu mới')
      .min(6, 'Mật khẩu mới phải có ít nhất 6 ký tự'),
  })
  .refine((data) => data.currentPassword !== data.newPassword, {
    message: 'Mật khẩu mới không được trùng với mật khẩu hiện tại',
    path: ['newPassword'],
  });

export const googleAuthSchema = z.object({
  email: z.string().trim().toLowerCase().email().optional(),
  name: z.string().trim().optional(),
  googleId: z.string().trim().optional(),
  avatar: z.string().trim().optional(),
  role: z.enum([Role.FARM, Role.COMPANY]).optional().default(Role.FARM),
  supabaseToken: z.string().trim().optional(),
  idToken: z.string().trim().optional(),
});

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
export type GoogleAuthInput = z.infer<typeof googleAuthSchema>;
