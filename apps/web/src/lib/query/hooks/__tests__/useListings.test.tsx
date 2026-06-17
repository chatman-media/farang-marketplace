import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { listingsService } from "../../../api"
import {
  useCreateListing,
  useFeaturedListings,
  useListing,
  useListings,
  useSearchListings,
  useUserListings,
} from "../useListings"

vi.mock("../../../api", () => ({
  listingsService: {
    getListings: vi.fn(),
    getListing: vi.fn(),
    getFeaturedListings: vi.fn(),
    searchListings: vi.fn(),
    getUserListings: vi.fn(),
    createListing: vi.fn(),
  },
  serviceListingsService: {},
}))

const mockService = listingsService as any

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useListings hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useListings", () => {
    it("fetches listings and forwards filters", async () => {
      const page = { listings: [{ id: "l1" }], total: 1, page: 1, limit: 20, hasMore: false }
      mockService.getListings.mockResolvedValue(page)

      const { result } = renderHook(() => useListings({ page: 1 } as any), { wrapper: createWrapper() })

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(result.current.data).toEqual(page)
      expect(mockService.getListings).toHaveBeenCalledWith({ page: 1 })
    })

    it("surfaces errors", async () => {
      mockService.getListings.mockRejectedValue(new Error("boom"))
      const { result } = renderHook(() => useListings(), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe("boom")
    })
  })

  describe("useListing", () => {
    it("is disabled when no id is provided", () => {
      const { result } = renderHook(() => useListing(""), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
      expect(mockService.getListing).not.toHaveBeenCalled()
    })

    it("fetches a single listing when an id is provided", async () => {
      mockService.getListing.mockResolvedValue({ id: "l9" })
      const { result } = renderHook(() => useListing("l9"), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getListing).toHaveBeenCalledWith("l9")
    })
  })

  describe("useFeaturedListings", () => {
    it("passes the limit through", async () => {
      mockService.getFeaturedListings.mockResolvedValue([])
      const { result } = renderHook(() => useFeaturedListings(3), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getFeaturedListings).toHaveBeenCalledWith(3)
    })
  })

  describe("useSearchListings", () => {
    it("is disabled for an empty/whitespace query", () => {
      const { result } = renderHook(() => useSearchListings("   "), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
      expect(mockService.searchListings).not.toHaveBeenCalled()
    })

    it("runs when a query is provided", async () => {
      mockService.searchListings.mockResolvedValue({ listings: [] })
      const { result } = renderHook(() => useSearchListings("scooter"), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.searchListings).toHaveBeenCalledWith("scooter", undefined)
    })
  })

  describe("useUserListings", () => {
    it("is disabled without a userId", () => {
      const { result } = renderHook(() => useUserListings(""), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })

    it("fetches when a userId is provided", async () => {
      mockService.getUserListings.mockResolvedValue([])
      const { result } = renderHook(() => useUserListings("u1"), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getUserListings).toHaveBeenCalledWith("u1")
    })
  })

  describe("useCreateListing", () => {
    it("calls the service on mutate and resolves", async () => {
      mockService.createListing.mockResolvedValue({ id: "new" })
      const { result } = renderHook(() => useCreateListing(), { wrapper: createWrapper() })

      result.current.mutate({ title: "t" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.createListing).toHaveBeenCalledWith({ title: "t" })
      expect(result.current.data).toEqual({ id: "new" })
    })

    it("exposes the error when the mutation fails", async () => {
      mockService.createListing.mockRejectedValue(new Error("nope"))
      const { result } = renderHook(() => useCreateListing(), { wrapper: createWrapper() })

      result.current.mutate({ title: "t" } as any)

      await waitFor(() => expect(result.current.isError).toBe(true))
      expect(result.current.error?.message).toBe("nope")
    })
  })
})
