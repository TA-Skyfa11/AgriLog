import { z } from 'zod';
import { Role } from '../models/User';

export const registerSchema = z.object({
  name: z
    .string('Họ tên không được để trống')
    .trim()
    .min(2, 'Họ tên phải có ít nhất 2 ký tự')
    .max(100, 'Họ tên không được vượt quá 100 ký tự'),
  email: z
    .string('Email không được để trống')
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng'),
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

export const loginSchema = z.object({
  email: z
    .string('Email không được để trống')
    .trim()
    .toLowerCase()
    .email('Email không đúng định dạng'),
  password: z
    .string('Mật khẩu không được để trống')
    .min(1, 'Vui lòng nhập mật khẩu'),
});

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

export type RegisterInput = z.infer<typeof registerSchema>;
export type LoginInput = z.infer<typeof loginSchema>;
export type ChangePasswordInput = z.infer<typeof changePasswordSchema>;
