import { z } from 'zod';
import { ProductCategory } from '../models/Product';

export const createProductSchema = z.object({
  name: z
    .string('Tên sản phẩm không được để trống')
    .trim()
    .min(2, 'Tên sản phẩm phải có ít nhất 2 ký tự')
    .max(200, 'Tên sản phẩm không được vượt quá 200 ký tự'),
  description: z
    .string('Mô tả sản phẩm không được để trống')
    .trim()
    .min(5, 'Mô tả sản phẩm phải có ít nhất 5 ký tự'),
  category: z.nativeEnum(ProductCategory, {
    message: 'Danh mục sản phẩm không hợp lệ',
  }),
  price: z.coerce
    .number({ message: 'Giá sản phẩm phải là số' })
    .min(0, 'Giá sản phẩm không được âm'),
  unit: z
    .string('Đơn vị tính không được để trống')
    .trim()
    .min(1, 'Đơn vị tính không được để trống'),
  stock: z.coerce
    .number({ message: 'Số lượng tồn kho phải là số' })
    .int('Số lượng tồn kho phải là số nguyên')
    .min(0, 'Số lượng tồn kho không được âm')
    .default(0),
  images: z.array(z.string().min(1)).optional().default([]),
});

export const updateProductSchema = createProductSchema.partial();

export const rejectProductSchema = z.object({
  reason: z.string().trim().optional().default('Không đạt yêu cầu'),
});

export type CreateProductInput = z.infer<typeof createProductSchema>;
export type UpdateProductInput = z.infer<typeof updateProductSchema>;
