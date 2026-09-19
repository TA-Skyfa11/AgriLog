import { z } from 'zod';

export const objectIdSchema = z
  .string('ID không được để trống')
  .regex(/^[0-9a-fA-F]{24}$/, 'ID không đúng định dạng MongoDB ObjectId');

export const idParamSchema = z.object({
  id: objectIdSchema,
});

export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(10),
});
