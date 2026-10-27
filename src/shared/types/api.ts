export interface ApiResponse<T = unknown> {
  success: true;
  data: T;
  meta?: {
    timestamp: string;
    requestId?: string;
  };
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
  meta?: {
    timestamp: string;
  };
}

export type ApiResult<T> = ApiResponse<T> | ApiError;
