import { Request, Response, NextFunction } from 'express';
import { z, ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: z.flattenError(result.error).fieldErrors,
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
