export class ApiError extends Error {
  constructor(public statusCode: number, public code: string, message: string) { super(message); }
}
export function notFound(): never { throw new ApiError(404, 'NOT_FOUND', 'Kayit bulunamadi'); }
export function conflict(message: string): never { throw new ApiError(409, 'CONFLICT', message); }
export function isUniqueViolation(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  if ('code' in error && error.code === '23505') return true;
  return 'cause' in error && isUniqueViolation(error.cause);
}
