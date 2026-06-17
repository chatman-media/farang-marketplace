import type { AxiosError } from "axios"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// A fake axios instance whose verb methods we can control per-test.
// Declared via vi.hoisted so it exists before the hoisted vi.mock factory runs.
const mockInstance = vi.hoisted(() => ({
  get: vi.fn(),
  post: vi.fn(),
  put: vi.fn(),
  patch: vi.fn(),
  delete: vi.fn(),
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
}))

vi.mock("axios", () => {
  const create = vi.fn(() => mockInstance)
  return {
    default: { create, post: vi.fn() },
    create,
  }
})

import { installLocalStorageMock } from "../../../test/local-storage-mock"
// Import after mocking so the module-level axios.create() picks up the mock.
import { api, handleApiError, TokenManager } from "../client"

installLocalStorageMock()

describe("api client", () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe("TokenManager", () => {
    it("stores and retrieves the access token", () => {
      expect(TokenManager.getToken()).toBeNull()
      TokenManager.setToken("abc123")
      expect(TokenManager.getToken()).toBe("abc123")
    })

    it("stores and retrieves the refresh token", () => {
      TokenManager.setRefreshToken("refresh-xyz")
      expect(TokenManager.getRefreshToken()).toBe("refresh-xyz")
    })

    it("serializes and parses user data", () => {
      expect(TokenManager.getUserData()).toBeNull()
      TokenManager.setUserData({ id: "u1", name: "Ann" })
      expect(TokenManager.getUserData()).toEqual({ id: "u1", name: "Ann" })
    })

    it("clearTokens removes all stored auth data", () => {
      TokenManager.setToken("t")
      TokenManager.setRefreshToken("r")
      TokenManager.setUserData({ id: "u" })

      TokenManager.clearTokens()

      expect(TokenManager.getToken()).toBeNull()
      expect(TokenManager.getRefreshToken()).toBeNull()
      expect(TokenManager.getUserData()).toBeNull()
    })
  })

  describe("handleApiError", () => {
    it("maps a server error response", () => {
      const error = {
        response: {
          status: 422,
          data: { message: "Validation failed", error: "VALIDATION_ERROR" },
        },
      } as AxiosError

      const result = handleApiError(error)
      expect(result).toEqual({
        message: "Validation failed",
        code: "VALIDATION_ERROR",
        status: 422,
        details: { message: "Validation failed", error: "VALIDATION_ERROR" },
      })
    })

    it("uses fallback message and code when response data is empty", () => {
      const error = { response: { status: 500, data: {} } } as AxiosError
      const result = handleApiError(error)
      expect(result.message).toBe("An error occurred")
      expect(result.code).toBe("UNKNOWN_ERROR")
      expect(result.status).toBe(500)
    })

    it("maps a network error (request made, no response)", () => {
      const error = { request: {} } as AxiosError
      const result = handleApiError(error)
      expect(result.code).toBe("NETWORK_ERROR")
      expect(result.message).toContain("Network error")
    })

    it("maps an unexpected error (no response, no request)", () => {
      const error = { message: "boom" } as AxiosError
      const result = handleApiError(error)
      expect(result.code).toBe("UNKNOWN_ERROR")
      expect(result.message).toBe("boom")
    })

    it("uses a generic message when no message is provided", () => {
      const error = {} as AxiosError
      const result = handleApiError(error)
      expect(result.message).toBe("An unexpected error occurred")
    })
  })

  describe("api verb wrappers", () => {
    it("get returns response.data on success", async () => {
      mockInstance.get.mockResolvedValue({ data: { ok: true } })
      const result = await api.get("/foo")
      expect(result).toEqual({ ok: true })
      expect(mockInstance.get).toHaveBeenCalledWith("/foo", undefined)
    })

    it("post forwards data and returns response.data", async () => {
      mockInstance.post.mockResolvedValue({ data: { id: 1 } })
      const result = await api.post("/foo", { a: 1 })
      expect(result).toEqual({ id: 1 })
      expect(mockInstance.post).toHaveBeenCalledWith("/foo", { a: 1 }, undefined)
    })

    it("put returns response.data", async () => {
      mockInstance.put.mockResolvedValue({ data: { updated: true } })
      expect(await api.put("/foo/1", { a: 2 })).toEqual({ updated: true })
    })

    it("patch returns response.data", async () => {
      mockInstance.patch.mockResolvedValue({ data: { patched: true } })
      expect(await api.patch("/foo/1", { a: 3 })).toEqual({ patched: true })
    })

    it("delete returns response.data", async () => {
      mockInstance.delete.mockResolvedValue({ data: { deleted: true } })
      expect(await api.delete("/foo/1")).toEqual({ deleted: true })
    })

    it("rethrows a normalized ApiError on failure", async () => {
      mockInstance.get.mockRejectedValue({
        response: { status: 404, data: { message: "Not found", error: "NOT_FOUND" } },
      })

      await expect(api.get("/missing")).rejects.toMatchObject({
        message: "Not found",
        code: "NOT_FOUND",
        status: 404,
      })
    })

    it("upload posts multipart form data and returns response.data", async () => {
      mockInstance.post.mockResolvedValue({ data: { url: "/uploads/x.png" } })
      const file = new File(["content"], "x.png", { type: "image/png" })

      const result = await api.upload("/upload", file)

      expect(result).toEqual({ url: "/uploads/x.png" })
      const [url, formData, opts] = mockInstance.post.mock.calls[0]
      expect(url).toBe("/upload")
      expect(formData).toBeInstanceOf(FormData)
      expect(opts.headers["Content-Type"]).toBe("multipart/form-data")
    })

    it("upload reports progress via the callback", async () => {
      mockInstance.post.mockImplementation((_url: string, _data: unknown, opts: any) => {
        opts.onUploadProgress({ loaded: 50, total: 100 })
        return Promise.resolve({ data: { ok: true } })
      })
      const onProgress = vi.fn()
      const file = new File(["c"], "y.png", { type: "image/png" })

      await api.upload("/upload", file, onProgress)

      expect(onProgress).toHaveBeenCalledWith(50)
    })
  })
})
