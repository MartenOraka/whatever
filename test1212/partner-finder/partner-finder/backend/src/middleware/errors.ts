import { NextFunction, Request, RequestHandler, Response } from 'express';
import { ZodError } from 'zod';

// Express 4 does not catch async errors by itself, so wrap every async handler.
export const wrap = (fn: (req: Request, res: Response, next: NextFunction) => Promise<unknown>): RequestHandler =>
  (req, res, next) => { fn(req, res, next).catch(next); };

export function errorHandler(err: any, _req: Request, res: Response, _next: NextFunction) {
  if (err instanceof ZodError) {
    return res.status(400).json({ error: 'Validation failed', details: err.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) });
  }
  if (err?.name === 'MulterError') {
    return res.status(400).json({ error: err.code === 'LIMIT_FILE_SIZE' ? 'Image is too large (avatar max 2 MB, banner max 4 MB)' : 'Upload failed' });
  }
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
}
