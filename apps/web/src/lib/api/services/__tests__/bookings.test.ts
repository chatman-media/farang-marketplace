import { beforeEach, describe, expect, it, vi } from "vitest"

vi.mock("../../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    patch: vi.fn(),
  },
}))

import { api } from "../../client"
import { bookingsService } from "../bookings"

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  patch: ReturnType<typeof vi.fn>
}

describe("bookingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getBookings", () => {
    it("requests the base endpoint with no filters", async () => {
      mockApi.get.mockResolvedValue({ bookings: [] })
      await bookingsService.getBookings()
      expect(mockApi.get).toHaveBeenCalledWith("/api/bookings?")
    })

    it("serializes scalar filters and skips nullish values", async () => {
      mockApi.get.mockResolvedValue({ bookings: [] })
      await bookingsService.getBookings({ status: "confirmed", listingId: undefined, page: 2 } as any)
      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("status=confirmed")
      expect(url).toContain("page=2")
      expect(url).not.toContain("listingId")
    })
  })

  describe("getBooking", () => {
    it("requests the by-id endpoint", async () => {
      mockApi.get.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.getBooking("b1")
      expect(mockApi.get).toHaveBeenCalledWith("/api/bookings/b1")
    })
  })

  describe("createBooking", () => {
    it("posts to the create endpoint", async () => {
      mockApi.post.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.createBooking({ listingId: "l1" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/bookings", { listingId: "l1" })
    })
  })

  describe("updateBooking", () => {
    it("puts to the by-id endpoint", async () => {
      mockApi.put.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.updateBooking("b1", { notes: "x" } as any)
      expect(mockApi.put).toHaveBeenCalledWith("/api/bookings/b1", { notes: "x" })
    })
  })

  describe("updateBookingStatus", () => {
    it("patches the status endpoint with the new status", async () => {
      mockApi.patch.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.updateBookingStatus("b1", "confirmed" as any)
      expect(mockApi.patch).toHaveBeenCalledWith("/api/bookings/b1/status", { status: "confirmed" })
    })
  })

  describe("cancelBooking", () => {
    it("patches with cancelled status and reason", async () => {
      mockApi.patch.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.cancelBooking("b1", "changed plans")
      expect(mockApi.patch).toHaveBeenCalledWith("/api/bookings/b1/status", {
        status: "cancelled",
        cancellationReason: "changed plans",
      })
    })

    it("allows an undefined reason", async () => {
      mockApi.patch.mockResolvedValue({ booking: { id: "b1" }, success: true })
      await bookingsService.cancelBooking("b1")
      expect(mockApi.patch).toHaveBeenCalledWith("/api/bookings/b1/status", {
        status: "cancelled",
        cancellationReason: undefined,
      })
    })
  })

  describe("getUserBookings", () => {
    it("requests the user bookings endpoint with serialized filters", async () => {
      mockApi.get.mockResolvedValue([])
      await bookingsService.getUserBookings("u1", { status: "pending" } as any)
      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("/api/bookings/user/u1")
      expect(url).toContain("status=pending")
    })

    it("works without filters", async () => {
      mockApi.get.mockResolvedValue([])
      await bookingsService.getUserBookings("u1")
      expect(mockApi.get).toHaveBeenCalledWith("/api/bookings/user/u1?")
    })
  })

  describe("checkAvailability", () => {
    it("builds the availability URL with date params", async () => {
      mockApi.get.mockResolvedValue({ available: true })
      const result = await bookingsService.checkAvailability("l1", "2026-01-01", "2026-01-05")
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/l1/availability?startDate=2026-01-01&endDate=2026-01-05")
      expect(result.available).toBe(true)
    })
  })

  describe("getBookingCalendar", () => {
    it("builds the calendar URL with year and month", async () => {
      mockApi.get.mockResolvedValue({ calendar: [] })
      await bookingsService.getBookingCalendar("l1", 2026, 6)
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/l1/calendar?year=2026&month=6")
    })
  })
})
