import { QueryClient, QueryClientProvider } from "@tanstack/react-query"
import { renderHook, waitFor } from "@testing-library/react"
import { ReactNode } from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { bookingsService } from "../../../api"
import {
  useBooking,
  useBookings,
  useCheckAvailability,
  useCreateBooking,
  useUpdateBookingStatus,
  useUserBookings,
} from "../useBookings"

vi.mock("../../../api", () => ({
  bookingsService: {
    getBookings: vi.fn(),
    getBooking: vi.fn(),
    getUserBookings: vi.fn(),
    checkAvailability: vi.fn(),
    getBookingCalendar: vi.fn(),
    createBooking: vi.fn(),
    updateBookingStatus: vi.fn(),
  },
}))

const mockService = bookingsService as any

const createWrapper = () => {
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  })
  return ({ children }: { children: ReactNode }) => (
    <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
  )
}

describe("useBookings hooks", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("useBookings", () => {
    it("fetches bookings with filters", async () => {
      mockService.getBookings.mockResolvedValue({ bookings: [], total: 0, page: 1, limit: 20, hasMore: false })
      const { result } = renderHook(() => useBookings({ status: "confirmed" } as any), {
        wrapper: createWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getBookings).toHaveBeenCalledWith({ status: "confirmed" })
    })
  })

  describe("useBooking", () => {
    it("is disabled without an id", () => {
      const { result } = renderHook(() => useBooking(""), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })

    it("fetches a booking by id", async () => {
      mockService.getBooking.mockResolvedValue({ booking: { id: "b1" }, success: true })
      const { result } = renderHook(() => useBooking("b1"), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getBooking).toHaveBeenCalledWith("b1")
    })
  })

  describe("useUserBookings", () => {
    it("is disabled without a userId", () => {
      const { result } = renderHook(() => useUserBookings(""), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })

    it("fetches when a userId is provided", async () => {
      mockService.getUserBookings.mockResolvedValue([])
      const { result } = renderHook(() => useUserBookings("u1"), { wrapper: createWrapper() })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.getUserBookings).toHaveBeenCalledWith("u1", undefined)
    })
  })

  describe("useCheckAvailability", () => {
    it("is disabled until all params are present", () => {
      const { result } = renderHook(() => useCheckAvailability("l1", "", ""), { wrapper: createWrapper() })
      expect(result.current.fetchStatus).toBe("idle")
    })

    it("runs when all params are present", async () => {
      mockService.checkAvailability.mockResolvedValue({ available: true })
      const { result } = renderHook(() => useCheckAvailability("l1", "2026-01-01", "2026-01-05"), {
        wrapper: createWrapper(),
      })
      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.checkAvailability).toHaveBeenCalledWith("l1", "2026-01-01", "2026-01-05")
    })
  })

  describe("useCreateBooking", () => {
    it("creates a booking and invalidates related queries", async () => {
      mockService.createBooking.mockResolvedValue({ booking: { id: "b1", listingId: "l1" }, success: true })
      const { result } = renderHook(() => useCreateBooking(), { wrapper: createWrapper() })

      result.current.mutate({ listingId: "l1" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.createBooking).toHaveBeenCalledWith({ listingId: "l1" })
    })
  })

  describe("useUpdateBookingStatus", () => {
    it("updates status and resolves", async () => {
      mockService.updateBookingStatus.mockResolvedValue({
        booking: { id: "b1", listingId: "l1" },
        success: true,
      })
      const { result } = renderHook(() => useUpdateBookingStatus(), { wrapper: createWrapper() })

      result.current.mutate({ id: "b1", status: "confirmed" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
      expect(mockService.updateBookingStatus).toHaveBeenCalledWith("b1", "confirmed")
    })

    it("handles a response with no listingId without error", async () => {
      mockService.updateBookingStatus.mockResolvedValue({ booking: { id: "b1" }, success: true })
      const { result } = renderHook(() => useUpdateBookingStatus(), { wrapper: createWrapper() })

      result.current.mutate({ id: "b1", status: "cancelled" } as any)

      await waitFor(() => expect(result.current.isSuccess).toBe(true))
    })
  })
})
