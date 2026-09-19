import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';

type RequestLocation = 'body' | 'query' | 'params';

interface RequestValidationConfig {
  body?: ZodSchema;
  query?: ZodSchema;
  params?: ZodSchema;
}

const formatZodErrors = (error: ZodError): Record<string, string> => {
  const formatted: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.length > 0 ? issue.path.join('.') : '_general';
    // Only keep the first error message per field for cleaner output
    if (!formatted[key]) {
      formatted[key] = issue.message;
    }
  }
  return formatted;
};

/**
 * Middleware validating a specific part of the request (default is 'body')
 */
export const validate = (schema: ZodSchema, source: RequestLocation = 'body') => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      const parsed = await schema.parseAsync(req[source]);
      // Assign sanitized and coerced data back to request
      (req as any)[source] = parsed;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: formatZodErrors(error),
        });
      }
      return next(error);
    }
  };
};

/**
 * Convenience shortcuts
 */
export const validateBody = (schema: ZodSchema) => validate(schema, 'body');
export const validateQuery = (schema: ZodSchema) => validate(schema, 'query');
export const validateParams = (schema: ZodSchema) => validate(schema, 'params');

/**
 * Validate multiple parts (body, query, params) in a single middleware call
 */
export const validateRequest = (schemas: RequestValidationConfig) => {
  return async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (schemas.params) {
        req.params = (await schemas.params.parseAsync(req.params)) as any;
      }
      if (schemas.query) {
        req.query = (await schemas.query.parseAsync(req.query)) as any;
      }
      if (schemas.body) {
        req.body = await schemas.body.parseAsync(req.body);
      }
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        return res.status(400).json({
          success: false,
          message: 'Dữ liệu không hợp lệ',
          errors: formatZodErrors(error),
        });
      }
      return next(error);
    }
  };
};
