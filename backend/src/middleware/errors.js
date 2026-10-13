import { ZodError } from 'zod';

export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

export const asyncHandler = (handler) => (req, res, next) => Promise.resolve(handler(req, res, next)).catch(next);

export const notFound = (req, _res, next) => next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));

export function errorHandler(error, _req, res, _next) {
  if (error instanceof ZodError) {
    const first = error.issues[0];
    const field = first.path.join('.');
    return res.status(400).json({
      message: field ? `${field}: ${first.message}` : first.message,
      errors: error.issues.map((issue) => ({ field: issue.path.join('.'), message: issue.message }))
    });
  }
  if (error.type === 'entity.parse.failed') {
    return res.status(400).json({ message: 'Request body must be valid JSON' });
  }
  if (error.code === '23505') {
    return res.status(409).json({ message: 'That value is already in use' });
  }
  if (error.code === '23503') {
    return res.status(400).json({ message: 'A related record does not exist' });
  }
  const status = error.status || 500;
  if (status >= 500) console.error(error);
  res.status(status).json({ message: status >= 500 ? 'Something went wrong on our side' : error.message });
}
