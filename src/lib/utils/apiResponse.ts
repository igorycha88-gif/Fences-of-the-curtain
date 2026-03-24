export interface ApiErrorResponse {
  error: string | string[];
}

export interface ApiResponse<T> extends ApiErrorResponse {
  data?: T;
}

export interface ApiListResponse<T> extends ApiErrorResponse {
  items?: T[];
  total?: number;
  page?: number;
  pageSize?: number;
}

export function isApiError(response: any): response is ApiErrorResponse {
  return response && typeof response === 'object' && 'error' in response;
}

export function handleApiListResponse<T>(
  response: any,
  defaultItems: T[] = []
): { items: T[]; total?: number; page?: number; pageSize?: number } {
  if (isApiError(response)) {
    console.error('[API Error]', response.error);
    return { items: defaultItems, total: 0 };
  }
  
  return {
    items: Array.isArray(response.items) ? response.items : Array.isArray(response.panel3d) ? response.panel3d : defaultItems,
    total: response.total || 0,
    page: response.page || 1,
    pageSize: response.pageSize || 20,
  };
}
