import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { authService } from "../../../api"
import { useLogin, useLogout, useProfile, useUpdateProfile, useUser } from "../useAuth"

vi.mock("../../../api", () => ({
  authService: {
    getCurrentUser: vi.fn(),
    isAuthenticated: vi.fn(),
    getProfile: vi.fn(),
    getSocialAccounts: vi.fn(),
    login: vi.fn(),
    logout: vi.fn(),
    updateProfile: vi.fn(),
  },
}))

const mockAuth = authService as any

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useAuth hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useUser", () => {
    it("is disabled when not authenticated", () => {
      mockAuth.isAuthenticated.mockReturnValue(false)
      const { result } = renderHook(() => useUser(), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })

    it("returns the current user when authenticated", async () => {
      mockAuth.isAuthenticated.mockReturnValue(true)
      mockAuth.getCurrentUser.mockReturnValue({ id: "u1" })
      const { result } = renderHook(() => useUser(), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual({ id: "u1" })
    })

    it("errors when authenticated but no user is stored", async () => {
      mockAuth.isAuthenticated.mockReturnValue(true)
      mockAuth.getCurrentUser.mockReturnValue(null)
      const { result } = renderHook(() => useUser(), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe("No authenticated user")
    })
  })

  describe("useProfile", () => {
    it("fetches the profile when authenticated", async () => {
      mockAuth.isAuthenticated.mockReturnValue(true)
      mockAuth.getProfile.mockResolvedValue({ id: "u1", email: "a@b.com" })
      const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockAuth.getProfile).toHaveBeenCalled()
    })

    it("is disabled when not authenticated", () => {
      mockAuth.isAuthenticated.mockReturnValue(false)
      const { result } = renderHook(() => useProfile(), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })
  })

  describe("useLogin", () => {
    it("logs in and resolves with the auth response", async () => {
      const authResponse = { accessToken: "a", refreshToken: "r", user: { id: "u1" } }
      mockAuth.login.mockResolvedValue(authResponse)
      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

      result.current.mutate({ email: "a@b.com", password: "pw" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockAuth.login).toHaveBeenCalledWith({ email: "a@b.com", password: "pw" })
      expect(result.current.data).toEqual(authResponse)
    })

    it("exposes login errors", async () => {
      mockAuth.login.mockRejectedValue(new Error("bad creds"))
      const { result } = renderHook(() => useLogin(), { wrapper: createWrapper() })

      result.current.mutate({ email: "a@b.com", password: "x" } as any)

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe("bad creds")
    })
  })

  describe("useLogout", () => {
    it("logs out and resolves", async () => {
      mockAuth.logout.mockResolvedValue(undefined)
      const { result } = renderHook(() => useLogout(), { wrapper: createWrapper() })

      result.current.mutate()

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockAuth.logout).toHaveBeenCalled()
    })
  })

  describe("useUpdateProfile", () => {
    it("updates the profile and resolves with the new user", async () => {
      mockAuth.updateProfile.mockResolvedValue({ id: "u1", name: "New" })
      const { result } = renderHook(() => useUpdateProfile(), { wrapper: createWrapper() })

      result.current.mutate({ name: "New" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockAuth.updateProfile).toHaveBeenCalledWith({ name: "New" })
      expect(result.current.data).toEqual({ id: "u1", name: "New" })
    })
  })
})
