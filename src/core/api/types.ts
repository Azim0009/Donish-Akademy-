/** Единый конверт ответа API: { data, error, meta } */
export interface ApiResponse<T> {
  data: T;
  error: ApiError | null;
  meta: PageMeta | null;
}

export interface ApiError {
  code: ApiErrorCode;
  message: string;
  fields?: Record<string, string>;
  traceId?: string;
}

export type ApiErrorCode =
  | 'VALIDATION_ERROR'
  | 'CONFLICT'
  | 'UNAUTHORIZED'
  | 'FORBIDDEN'
  | 'BRANCH_ACCESS_DENIED'
  | 'ENTITY_NOT_FOUND'
  | 'EMAIL_ALREADY_EXISTS'
  | 'BRANCH_CODE_ALREADY_EXISTS'
  | 'ACCOUNT_BLOCKED'
  | 'CONCURRENCY_CONFLICT';

export interface PageMeta {
  page: number;
  pageSize: number;
  total: number;
}

/** Единый контракт для списков: пагинация, поиск, сортировка */
export interface ListParams {
  page?: number;
  pageSize?: number;
  search?: string;
  status?: string;
  sortBy?: string;
  sortDirection?: 'asc' | 'desc';
}
