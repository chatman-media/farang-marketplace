import { describe, expect, it } from "vitest"
import { queryClient, queryKeys } from "../client"

describe("query client defaults", () => {
  const queryDefaults = queryClient.getDefaultOptions().queries as {
    retry: (failureCount: number, error: unknown) => boolean
    retryDelay: (attemptIndex: number) => number
    staleTime?: number
    gcTime?: number
    refetchOnWindowFocus?: boolean
    refetchOnReconnect?: boolean
  }
  const mutationDefaults = queryClient.getDefaultOptions().mutations as {
    retry: (failureCount: number, error: unknown) => boolean
  }

  describe("query retry predicate", () => {
    it("does not retry on 4xx client errors", () => {
      expect(queryDefaults.retry(0, { status: 404 })).toBe(false)
      expect(queryDefaults.retry(0, { status: 400 })).toBe(false)
    })

    it("retries on 5xx server errors up to 3 times", () => {
      expect(queryDefaults.retry(0, { status: 500 })).toBe(true)
      expect(queryDefaults.retry(2, { status: 503 })).toBe(true)
      expect(queryDefaults.retry(3, { status: 503 })).toBe(false)
    })

    it("retries on errors without a status (e.g. network)", () => {
      expect(queryDefaults.retry(0, new Error("network"))).toBe(true)
      expect(queryDefaults.retry(3, new Error("network"))).toBe(false)
    })

    it("retries when error is null", () => {
      expect(queryDefaults.retry(0, null)).toBe(true)
    })
  })

  describe("query retryDelay", () => {
    it("uses exponential backoff capped at 30s", () => {
      expect(queryDefaults.retryDelay(0)).toBe(1000)
      expect(queryDefaults.retryDelay(1)).toBe(2000)
      expect(queryDefaults.retryDelay(2)).toBe(4000)
      // 1000 * 2^10 = 1,024,000 -> capped at 30,000
      expect(queryDefaults.retryDelay(10)).toBe(30000)
    })
  })

  describe("other query defaults", () => {
    it("disables refetch on window focus and enables on reconnect", () => {
      expect(queryDefaults.refetchOnWindowFocus).toBe(false)
      expect(queryDefaults.refetchOnReconnect).toBe(true)
    })

    it("sets stale and gc times", () => {
      expect(queryDefaults.staleTime).toBe(5 * 60 * 1000)
      expect(queryDefaults.gcTime).toBe(10 * 60 * 1000)
    })
  })

  describe("mutation retry predicate", () => {
    it("does not retry on 4xx client errors", () => {
      expect(mutationDefaults.retry(0, { status: 422 })).toBe(false)
    })

    it("retries on other errors up to 2 times", () => {
      expect(mutationDefaults.retry(0, { status: 500 })).toBe(true)
      expect(mutationDefaults.retry(1, new Error("x"))).toBe(true)
      expect(mutationDefaults.retry(2, new Error("x"))).toBe(false)
    })
  })
})

describe("queryKeys factory", () => {
  it("builds auth keys", () => {
    expect(queryKeys.auth.user).toEqual(["auth", "user"])
    expect(queryKeys.auth.profile).toEqual(["auth", "profile"])
    expect(queryKeys.auth.socialAccounts).toEqual(["auth", "social-accounts"])
  })

  it("builds listing keys with and without params", () => {
    expect(queryKeys.listings.all).toEqual(["listings"])
    expect(queryKeys.listings.list({ page: 1 })).toEqual(["listings", "list", { page: 1 }])
    expect(queryKeys.listings.detail("l1")).toEqual(["listings", "detail", "l1"])
    expect(queryKeys.listings.featured(5)).toEqual(["listings", "featured", 5])
    expect(queryKeys.listings.search("q", { a: 1 })).toEqual(["listings", "search", "q", { a: 1 }])
    expect(queryKeys.listings.userListings("u1")).toEqual(["listings", "user", "u1"])
  })

  it("builds service listing keys", () => {
    expect(queryKeys.serviceListings.all).toEqual(["service-listings"])
    expect(queryKeys.serviceListings.detail("s1")).toEqual(["service-listings", "detail", "s1"])
  })

  it("builds booking keys including composite availability/calendar keys", () => {
    expect(queryKeys.bookings.detail("b1")).toEqual(["bookings", "detail", "b1"])
    expect(queryKeys.bookings.userBookings("u1", { status: "x" })).toEqual(["bookings", "user", "u1", { status: "x" }])
    expect(queryKeys.bookings.availability("l1", "2026-01-01", "2026-01-05")).toEqual([
      "bookings",
      "availability",
      "l1",
      "2026-01-01",
      "2026-01-05",
    ])
    expect(queryKeys.bookings.calendar("l1", 2026, 6)).toEqual(["bookings", "calendar", "l1", 2026, 6])
  })

  it("builds payment and ai keys", () => {
    expect(queryKeys.payments.methods).toEqual(["payments", "methods"])
    expect(queryKeys.payments.status("p1")).toEqual(["payments", "status", "p1"])
    expect(queryKeys.ai.suggestions("hi")).toEqual(["ai", "suggestions", "hi"])
    expect(queryKeys.ai.recommendations("u1", { a: 1 })).toEqual(["ai", "recommendations", "u1", { a: 1 }])
  })
})
