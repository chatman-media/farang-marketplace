import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    patch: vi.fn(),
  },
  TokenManager: {
    setToken: vi.fn(),
    setRefreshToken: vi.fn(),
    setUserData: vi.fn(),
    getToken: vi.fn(),
    getRefreshToken: vi.fn(),
    getUserData: vi.fn(),
    clearTokens: vi.fn(),
  },
}))

import { api, TokenManager } from "../../client"
import { authService } from "../auth"

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
}
const mockToken = TokenManager as unknown as Record<string, ReturnType<typeof vi.fn>>

const authResponse = {
  accessToken: "access-1",
  refreshToken: "refresh-1",
  user: { id: "u1", email: "a@b.com" },
}

describe("authService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("login", () => {
    it("posts credentials and persists tokens + user", async () => {
      mockApi.post.mockResolvedValue(authResponse)

      const result = await authService.login({ email: "a@b.com", password: "pw" } as any)

      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login", { email: "a@b.com", password: "pw" })
      expect(mockToken.setToken).toHaveBeenCalledWith("access-1")
      expect(mockToken.setRefreshToken).toHaveBeenCalledWith("refresh-1")
      expect(mockToken.setUserData).toHaveBeenCalledWith(authResponse.user)
      expect(result).toEqual(authResponse)
    })
  })

  describe("register", () => {
    it("posts user data and persists tokens", async () => {
      mockApi.post.mockResolvedValue(authResponse)
      await authService.register({ email: "a@b.com", password: "pw" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/register", { email: "a@b.com", password: "pw" })
      expect(mockToken.setToken).toHaveBeenCalledWith("access-1")
    })
  })

  describe("oauthLogin", () => {
    it("posts to the oauth endpoint", async () => {
      mockApi.post.mockResolvedValue(authResponse)
      await authService.oauthLogin({ provider: "google", token: "g" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login/oauth", { provider: "google", token: "g" })
    })
  })

  describe("refresh", () => {
    it("throws when no refresh token is stored", async () => {
      mockToken.getRefreshToken.mockReturnValue(null)
      await expect(authService.refresh()).rejects.toThrow("No refresh token available")
      expect(mockApi.post).not.toHaveBeenCalled()
    })

    it("posts the stored refresh token and updates tokens", async () => {
      mockToken.getRefreshToken.mockReturnValue("refresh-old")
      mockApi.post.mockResolvedValue(authResponse)

      await authService.refresh()

      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/refresh", { refreshToken: "refresh-old" })
      expect(mockToken.setToken).toHaveBeenCalledWith("access-1")
      expect(mockToken.setRefreshToken).toHaveBeenCalledWith("refresh-1")
    })

    it("does not overwrite the refresh token when the response omits it", async () => {
      mockToken.getRefreshToken.mockReturnValue("refresh-old")
      mockApi.post.mockResolvedValue({ accessToken: "a2", user: { id: "u1" } })

      await authService.refresh()

      expect(mockToken.setRefreshToken).not.toHaveBeenCalled()
      expect(mockToken.setToken).toHaveBeenCalledWith("a2")
    })
  })

  describe("logout", () => {
    it("clears tokens after a successful server logout", async () => {
      mockApi.post.mockResolvedValue(undefined)
      await authService.logout()
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/logout")
      expect(mockToken.clearTokens).toHaveBeenCalled()
    })

    it("still clears tokens when the server logout fails", async () => {
      mockApi.post.mockRejectedValue(new Error("network"))
      const warn = vi.spyOn(console, "warn").mockImplementation(() => {})

      await authService.logout()

      expect(mockToken.clearTokens).toHaveBeenCalled()
      warn.mockRestore()
    })
  })

  describe("getProfile / updateProfile", () => {
    it("getProfile fetches the profile endpoint", async () => {
      mockApi.get.mockResolvedValue({ id: "u1" })
      const result = await authService.getProfile()
      expect(mockApi.get).toHaveBeenCalledWith("/api/auth/profile")
      expect(result).toEqual({ id: "u1" })
    })

    it("updateProfile patches and refreshes stored user data", async () => {
      mockApi.patch.mockResolvedValue({ id: "u1", name: "New" })
      const result = await authService.updateProfile({ name: "New" } as any)
      expect(mockApi.patch).toHaveBeenCalledWith("/api/auth/profile", { name: "New" })
      expect(mockToken.setUserData).toHaveBeenCalledWith({ id: "u1", name: "New" })
      expect(result).toEqual({ id: "u1", name: "New" })
    })
  })

  describe("social account helpers", () => {
    it("linkSocialAccount posts to the link endpoint", async () => {
      mockApi.post.mockResolvedValue({ accounts: [] })
      await authService.linkSocialAccount({ provider: "google" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/profile/social/link", { provider: "google" })
    })

    it("unlinkSocialAccount posts to the unlink endpoint", async () => {
      mockApi.post.mockResolvedValue({ accounts: [] })
      await authService.unlinkSocialAccount({ provider: "google" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/profile/social/unlink", { provider: "google" })
    })

    it("getSocialAccounts fetches the social endpoint", async () => {
      mockApi.get.mockResolvedValue({ accounts: [] })
      await authService.getSocialAccounts()
      expect(mockApi.get).toHaveBeenCalledWith("/api/auth/profile/social")
    })
  })

  describe("local auth helpers", () => {
    it("isAuthenticated reflects the presence of a token", () => {
      mockToken.getToken.mockReturnValue("t")
      expect(authService.isAuthenticated()).toBe(true)
      mockToken.getToken.mockReturnValue(null)
      expect(authService.isAuthenticated()).toBe(false)
    })

    it("getCurrentUser returns stored user data", () => {
      mockToken.getUserData.mockReturnValue({ id: "u1" })
      expect(authService.getCurrentUser()).toEqual({ id: "u1" })
    })

    it("clearAuth clears tokens", () => {
      authService.clearAuth()
      expect(mockToken.clearTokens).toHaveBeenCalled()
    })
  })

  describe("password and email flows", () => {
    it("requestPasswordReset posts the email", async () => {
      mockApi.post.mockResolvedValue({ message: "sent" })
      await authService.requestPasswordReset("a@b.com")
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login/forgot-password", { email: "a@b.com" })
    })

    it("resetPassword posts token and new password", async () => {
      mockApi.post.mockResolvedValue({ message: "ok" })
      await authService.resetPassword("tok", "newpw")
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login/reset-password", {
        token: "tok",
        password: "newpw",
      })
    })

    it("verifyEmail posts the token", async () => {
      mockApi.post.mockResolvedValue({ message: "verified" })
      await authService.verifyEmail("vtok")
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/login/verify-email", { token: "vtok" })
    })

    it("resendVerificationEmail posts to the resend endpoint", async () => {
      mockApi.post.mockResolvedValue({ message: "resent" })
      await authService.resendVerificationEmail()
      expect(mockApi.post).toHaveBeenCalledWith("/api/auth/profile/resend-verification")
    })
  })
})
