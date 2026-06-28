import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

export function validate(schema: ZodSchema) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      res.status(400).json({
        error: result.error.flatten().fieldErrors,
        code: 'VALIDATION_ERROR',
      });
      return;
    }
    req.body = result.data;
    next();
  };
}
