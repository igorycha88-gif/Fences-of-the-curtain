import { toast } from 'react-hot-toast';

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  status?: number;
  details?: any;
}

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';

interface FetchOptions extends RequestInit {
  params?: Record<string, string | number | boolean | undefined>;
  body?: any;
  showToast?: boolean;
  successMessage?: string;
  errorMessage?: string;
}

class ApiClient {
  private baseUrl: string;

  constructor(baseUrl: string = '') {
    this.baseUrl = baseUrl;
  }

  private async request<T>(
    method: HttpMethod,
    endpoint: string,
    options: FetchOptions = {}
  ): Promise<ApiResponse<T>> {
    const {
      params,
      body,
      showToast = false,
      successMessage,
      errorMessage,
      ...fetchOptions
    } = options;

    let url = `${this.baseUrl}${endpoint}`;

    if (params) {
      const searchParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        if (value !== undefined && value !== null) {
          searchParams.append(key, String(value));
        }
      });
      const queryString = searchParams.toString();
      if (queryString) {
        url += `?${queryString}`;
      }
    }

    const fetchConfig: RequestInit = {
      method,
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...fetchOptions.headers,
      },
      ...fetchOptions,
    };

    if (body && method !== 'GET') {
      fetchConfig.body = JSON.stringify(body);
    }

    try {
      const response = await fetch(url, fetchConfig);
      const data = await response.json().catch(() => ({}));

      if (!response.ok) {
        const errorMsg = data.error || data.message || `Error ${response.status}`;

        if (showToast) {
          toast.error(errorMessage || errorMsg);
        }

        return {
          error: errorMsg,
          status: response.status,
          details: data.details,
        };
      }

      if (showToast && successMessage) {
        toast.success(successMessage);
      }

      return {
        data,
        status: response.status,
      };
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Network error';

      if (showToast) {
        toast.error(errorMessage || errorMsg);
      }

      return {
        error: errorMsg,
        status: 0,
      };
    }
  }

  async get<T>(endpoint: string, options: Omit<FetchOptions, 'body'> = {}): Promise<ApiResponse<T>> {
    return this.request<T>('GET', endpoint, options);
  }

  async post<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('POST', endpoint, options);
  }

  async put<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PUT', endpoint, options);
  }

  async patch<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('PATCH', endpoint, options);
  }

  async delete<T>(endpoint: string, options: FetchOptions = {}): Promise<ApiResponse<T>> {
    return this.request<T>('DELETE', endpoint, options);
  }
}

export const apiClient = new ApiClient();
export const adminApiClient = new ApiClient('/api/admin');
