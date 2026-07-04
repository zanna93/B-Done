export type Result<T, E> = { ok: true; value: T } | { ok: false; errors: E[] };

export function ok<T>(value: T): Result<T, never> {
  return { ok: true, value };
}

export function err<E>(errors: E | E[]): Result<never, E> {
  return { ok: false, errors: Array.isArray(errors) ? errors : [errors] };
}
