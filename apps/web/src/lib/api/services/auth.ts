import type {
  AuthResponse,
  LinkSocialAccountRequest,
  LoginRequest,
  OAuthLoginRequest,
  RefreshRequest,
  RegisterRequest,
  SocialAccountsResponse,
  UnlinkSocialAccountRequest,
  User,
} from "@marketplace/shared-types"
import { api, TokenManager } from "../client"
import { getApiConfig } from "../config"

const config = getApiConfig()

export const authService = {
  // Login with email and password
  login: async (credentials: LoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(config.ENDPOINTS.AUTH.LOGIN, credentials)

    // Store tokens and user data
    TokenManager.setToken(response.accessToken)
    TokenManager.setRefreshToken(response.refreshToken)
    TokenManager.setUserData(response.user)

    return response
  },

  // Register new user
  register: async (userData: RegisterRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(config.ENDPOINTS.AUTH.REGISTER, userData)

    // Store tokens and user data
    TokenManager.setToken(response.accessToken)
    TokenManager.setRefreshToken(response.refreshToken)
    TokenManager.setUserData(response.user)

    return response
  },

  // OAuth login
  oauthLogin: async (oauthData: OAuthLoginRequest): Promise<AuthResponse> => {
    const response = await api.post<AuthResponse>(`${config.ENDPOINTS.AUTH.LOGIN}/oauth`, oauthData)

    // Store tokens and user data
    TokenManager.setToken(response.accessToken)
    TokenManager.setRefreshToken(response.refreshToken)
    TokenManager.setUserData(response.user)

    return response
  },

  // Refresh access token
  refresh: async (): Promise<AuthResponse> => {
    const refreshToken = TokenManager.getRefreshToken()
    if (!refreshToken) {
      throw new Error("No refresh token available")
    }

    const refreshData: RefreshRequest = { refreshToken }
    const response = await api.post<AuthResponse>(config.ENDPOINTS.AUTH.REFRESH, refreshData)

    // Update stored tokens
    TokenManager.setToken(response.accessToken)
    if (response.refreshToken) {
      TokenManager.setRefreshToken(response.refreshToken)
    }
    TokenManager.setUserData(response.user)

    return response
  },

  // Logout
  logout: async (): Promise<void> => {
    try {
      await api.post(config.ENDPOINTS.AUTH.LOGOUT)
    } catch (error) {
      // Even if logout fails on server, clear local tokens
      console.warn("Logout request failed:", error)
    } finally {
      TokenManager.clearTokens()
    }
  },

  // Get current user profile
  getProfile: async (): Promise<User> => {
    return await api.get<User>(config.ENDPOINTS.AUTH.PROFILE)
  },

  // Update user profile
  updateProfile: async (profileData: Partial<User>): Promise<User> => {
    const response = await api.patch<User>(config.ENDPOINTS.AUTH.PROFILE, profileData)

    // Update stored user data
    TokenManager.setUserData(response)

    return response
  },

  // Link social account
  linkSocialAccount: async (linkData: LinkSocialAccountRequest): Promise<SocialAccountsResponse> => {
    return await api.post<SocialAccountsResponse>(`${config.ENDPOINTS.AUTH.PROFILE}/social/link`, linkData)
  },

  // Unlink social account
  unlinkSocialAccount: async (unlinkData: UnlinkSocialAccountRequest): Promise<SocialAccountsResponse> => {
    return await api.post<SocialAccountsResponse>(`${config.ENDPOINTS.AUTH.PROFILE}/social/unlink`, unlinkData)
  },

  // Get linked social accounts
  getSocialAccounts: async (): Promise<SocialAccountsResponse> => {
    return await api.get<SocialAccountsResponse>(`${config.ENDPOINTS.AUTH.PROFILE}/social`)
  },

  // Check if user is authenticated
  isAuthenticated: (): boolean => {
    return !!TokenManager.getToken()
  },

  // Get current user from local storage
  getCurrentUser: (): User | null => {
    return TokenManager.getUserData()
  },

  // Clear authentication data
  clearAuth: (): void => {
    TokenManager.clearTokens()
  },

  // Password reset request
  requestPasswordReset: async (email: string): Promise<{ message: string }> => {
    return await api.post<{ message: string }>(`${config.ENDPOINTS.AUTH.LOGIN}/forgot-password`, { email })
  },

  // Reset password with token
  resetPassword: async (token: string, newPassword: string): Promise<{ message: string }> => {
    return await api.post<{ message: string }>(`${config.ENDPOINTS.AUTH.LOGIN}/reset-password`, {
      token,
      password: newPassword,
    })
  },

  // Verify email
  verifyEmail: async (token: string): Promise<{ message: string }> => {
    return await api.post<{ message: string }>(`${config.ENDPOINTS.AUTH.LOGIN}/verify-email`, { token })
  },

  // Resend verification email
  resendVerificationEmail: async (): Promise<{ message: string }> => {
    return await api.post<{ message: string }>(`${config.ENDPOINTS.AUTH.PROFILE}/resend-verification`)
  },
}
