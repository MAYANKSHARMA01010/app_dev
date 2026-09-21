// ---------------------------------------------------------------------------
// Collector Result
// A generic wrapper around the result of a single data-collection operation.
// Every collector must return one of these statuses so callers can handle
// partial data, missing permissions, and unsupported platforms gracefully.
// ---------------------------------------------------------------------------
export type CollectorStatus =
  | 'success'
  | 'partial'
  | 'permission_denied'
  | 'unsupported'
  | 'error';

export interface CollectorResult<T> {
  /** Normalized data — may be partial if status is 'partial' */
  data: T | null;
  /** Collection outcome */
  status: CollectorStatus;
  /** Human-readable message for logs / findings */
  message?: string;
  /** Original error, if any */
  error?: Error;
}

/** Helper: create a success result */
export function ok<T>(data: T, message?: string): CollectorResult<T> {
  return { data, status: 'success', message };
}

/** Helper: create a partial result */
export function partial<T>(data: T, message: string): CollectorResult<T> {
  return { data, status: 'partial', message };
}

/** Helper: create a permission-denied result */
export function permissionDenied<T>(message: string): CollectorResult<T> {
  return { data: null, status: 'permission_denied', message };
}

/** Helper: create an unsupported result */
export function unsupported<T>(message: string): CollectorResult<T> {
  return { data: null, status: 'unsupported', message };
}

/** Helper: create an error result */
export function failed<T>(error: Error, message?: string): CollectorResult<T> {
  return { data: null, status: 'error', message: message ?? error.message, error };
}
