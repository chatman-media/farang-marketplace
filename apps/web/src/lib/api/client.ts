import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse, AxiosError } from "axios"
import { getApiConfig } from "./config"

const config = getApiConfig()

// Create axios instance
const apiClient: AxiosInstance = axios.create({
  baseURL: config.BASE_URL,
  timeout: config.TIMEOUT,
  headers: config.DEFAULT_HEADERS,
})

// Token management
class TokenManager {
  static getToken(): string | null {
    return localStorage.getItem(config.AUTH.TOKEN_KEY)
  }

  static setToken(token: string): void {
    localStorage.setItem(config.AUTH.TOKEN_KEY, token)
  }

  static getRefreshToken(): string | null {
    return localStorage.getItem(config.AUTH.REFRESH_TOKEN_KEY)
  }

  static setRefreshToken(token: string): void {
    localStorage.setItem(config.AUTH.REFRESH_TOKEN_KEY, token)
  }

  static clearTokens(): void {
    localStorage.removeItem(config.AUTH.TOKEN_KEY)
    localStorage.removeItem(config.AUTH.REFRESH_TOKEN_KEY)
    localStorage.removeItem(config.AUTH.USER_KEY)
  }

  static getUserData(): any {
    const userData = localStorage.getItem(config.AUTH.USER_KEY)
    return userData ? JSON.parse(userData) : null
  }

  static setUserData(user: any): void {
    localStorage.setItem(config.AUTH.USER_KEY, JSON.stringify(user))
  }
}

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = TokenManager.getToken()
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => {
    return Promise.reject(error)
  },
)

// Response interceptor for error handling and token refresh
apiClient.interceptors.response.use(
  (response: AxiosResponse) => {
    return response
  },
  async (error: AxiosError) => {
    const originalRequest = error.config as AxiosRequestConfig & { _retry?: boolean }

    // Handle 401 errors (unauthorized)
    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true

      try {
        const refreshToken = TokenManager.getRefreshToken()
        if (refreshToken) {
          const response = await axios.post(`${config.BASE_URL}${config.ENDPOINTS.AUTH.REFRESH}`, { refreshToken })

          const { accessToken, refreshToken: newRefreshToken } = response.data
          TokenManager.setToken(accessToken)
          if (newRefreshToken) {
            TokenManager.setRefreshToken(newRefreshToken)
          }

          // Retry the original request with new token
          if (originalRequest.headers) {
            originalRequest.headers.Authorization = `Bearer ${accessToken}`
          }
          return apiClient(originalRequest)
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        TokenManager.clearTokens()
        window.location.href = "/login"
        return Promise.reject(refreshError)
      }
    }

    return Promise.reject(error)
  },
)

// API Error types
export interface ApiError {
  message: string
  code?: string
  status?: number
  details?: any
}

// Error handler
export const handleApiError = (error: AxiosError): ApiError => {
  if (error.response) {
    // Server responded with error status
    const { status, data } = error.response
    return {
      message: (data as any)?.message || "An error occurred",
      code: (data as any)?.error || "UNKNOWN_ERROR",
      status,
      details: data,
    }
  } else if (error.request) {
    // Request was made but no response received
    return {
      message: "Network error. Please check your connection.",
      code: "NETWORK_ERROR",
    }
  } else {
    // Something else happened
    return {
      message: error.message || "An unexpected error occurred",
      code: "UNKNOWN_ERROR",
    }
  }
}

// Generic API methods
export const api = {
  // GET request
  get: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.get<T>(url, config)
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },

  // POST request
  post: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.post<T>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },

  // PUT request
  put: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.put<T>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },

  // PATCH request
  patch: async <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.patch<T>(url, data, config)
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },

  // DELETE request
  delete: async <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    try {
      const response = await apiClient.delete<T>(url, config)
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },

  // Upload file
  upload: async <T = any>(url: string, file: File, onProgress?: (progress: number) => void): Promise<T> => {
    const formData = new FormData()
    formData.append("file", file)

    try {
      const response = await apiClient.post<T>(url, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onProgress && progressEvent.total) {
            const progress = Math.round((progressEvent.loaded * 100) / progressEvent.total)
            onProgress(progress)
          }
        },
      })
      return response.data
    } catch (error) {
      throw handleApiError(error as AxiosError)
    }
  },
}

// Export token manager for use in other parts of the app
export { TokenManager }

// Export the axios instance for direct use if needed
export { apiClient }
