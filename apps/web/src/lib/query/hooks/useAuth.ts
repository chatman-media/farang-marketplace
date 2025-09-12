import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { authService } from "../../api"
import { queryKeys } from "../client"
import type {
  LoginRequest,
  RegisterRequest,
  AuthResponse,
  User,
  OAuthLoginRequest,
  LinkSocialAccountRequest,
  UnlinkSocialAccountRequest,
  SocialAccountsResponse,
} from "@marketplace/shared-types"

// Get current user
export const useUser = () => {
  return useQuery({
    queryKey: queryKeys.auth.user,
    queryFn: () => {
      const user = authService.getCurrentUser()
      if (!user) {
        throw new Error("No authenticated user")
      }
      return user
    },
    enabled: authService.isAuthenticated(),
    staleTime: Infinity, // User data doesn't change often
  })
}

// Get user profile
export const useProfile = () => {
  return useQuery({
    queryKey: queryKeys.auth.profile,
    queryFn: authService.getProfile,
    enabled: authService.isAuthenticated(),
  })
}

// Get social accounts
export const useSocialAccounts = () => {
  return useQuery({
    queryKey: queryKeys.auth.socialAccounts,
    queryFn: authService.getSocialAccounts,
    enabled: authService.isAuthenticated(),
  })
}

// Login mutation
export const useLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (credentials: LoginRequest) => authService.login(credentials),
    onSuccess: (data: AuthResponse) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user)
      queryClient.setQueryData(queryKeys.auth.profile, data.user)

      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries()
    },
  })
}

// Register mutation
export const useRegister = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (userData: RegisterRequest) => authService.register(userData),
    onSuccess: (data: AuthResponse) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user)
      queryClient.setQueryData(queryKeys.auth.profile, data.user)

      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries()
    },
  })
}

// OAuth login mutation
export const useOAuthLogin = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (oauthData: OAuthLoginRequest) => authService.oauthLogin(oauthData),
    onSuccess: (data: AuthResponse) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, data.user)
      queryClient.setQueryData(queryKeys.auth.profile, data.user)

      // Invalidate all queries to refetch with new auth
      queryClient.invalidateQueries()
    },
  })
}

// Logout mutation
export const useLogout = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: authService.logout,
    onSuccess: () => {
      // Clear all cached data
      queryClient.clear()
    },
  })
}

// Update profile mutation
export const useUpdateProfile = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (profileData: Partial<User>) => authService.updateProfile(profileData),
    onSuccess: (updatedUser: User) => {
      // Update user cache
      queryClient.setQueryData(queryKeys.auth.user, updatedUser)
      queryClient.setQueryData(queryKeys.auth.profile, updatedUser)
    },
  })
}

// Link social account mutation
export const useLinkSocialAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (linkData: LinkSocialAccountRequest) => authService.linkSocialAccount(linkData),
    onSuccess: () => {
      // Invalidate social accounts and profile
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.socialAccounts })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile })
    },
  })
}

// Unlink social account mutation
export const useUnlinkSocialAccount = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (unlinkData: UnlinkSocialAccountRequest) => authService.unlinkSocialAccount(unlinkData),
    onSuccess: () => {
      // Invalidate social accounts and profile
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.socialAccounts })
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile })
    },
  })
}

// Password reset request mutation
export const useRequestPasswordReset = () => {
  return useMutation({
    mutationFn: (email: string) => authService.requestPasswordReset(email),
  })
}

// Reset password mutation
export const useResetPassword = () => {
  return useMutation({
    mutationFn: ({ token, newPassword }: { token: string; newPassword: string }) =>
      authService.resetPassword(token, newPassword),
  })
}

// Verify email mutation
export const useVerifyEmail = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (token: string) => authService.verifyEmail(token),
    onSuccess: () => {
      // Invalidate profile to get updated verification status
      queryClient.invalidateQueries({ queryKey: queryKeys.auth.profile })
    },
  })
}

// Resend verification email mutation
export const useResendVerificationEmail = () => {
  return useMutation({
    mutationFn: authService.resendVerificationEmail,
  })
}
