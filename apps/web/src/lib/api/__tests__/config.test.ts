import { describe, expect, it } from "vitest"
import { API_CONFIG, getApiConfig } from "../config"

describe("API_CONFIG", () => {
  it("exposes a base url and timeout", () => {
    expect(typeof API_CONFIG.BASE_URL).toBe("string")
    expect(API_CONFIG.TIMEOUT).toBe(30000)
  })

  it("has JSON default headers", () => {
    expect(API_CONFIG.DEFAULT_HEADERS["Content-Type"]).toBe("application/json")
    expect(API_CONFIG.DEFAULT_HEADERS.Accept).toBe("application/json")
  })

  it("defines auth storage keys", () => {
    expect(API_CONFIG.AUTH.TOKEN_KEY).toBe("auth_token")
    expect(API_CONFIG.AUTH.REFRESH_TOKEN_KEY).toBe("refresh_token")
    expect(API_CONFIG.AUTH.USER_KEY).toBe("user_data")
  })

  describe("ENDPOINTS", () => {
    it("builds static auth endpoints", () => {
      expect(API_CONFIG.ENDPOINTS.AUTH.LOGIN).toBe("/api/auth/login")
      expect(API_CONFIG.ENDPOINTS.AUTH.REGISTER).toBe("/api/auth/register")
    })

    it("builds parameterized listing endpoints", () => {
      expect(API_CONFIG.ENDPOINTS.LISTINGS.BY_ID("abc")).toBe("/api/listings/abc")
      expect(API_CONFIG.ENDPOINTS.LISTINGS.USER_LISTINGS("u1")).toBe("/api/listings/user/u1")
    })

    it("builds parameterized booking endpoints", () => {
      expect(API_CONFIG.ENDPOINTS.BOOKINGS.BY_ID("b1")).toBe("/api/bookings/b1")
      expect(API_CONFIG.ENDPOINTS.BOOKINGS.UPDATE_STATUS("b1")).toBe("/api/bookings/b1/status")
      expect(API_CONFIG.ENDPOINTS.BOOKINGS.USER_BOOKINGS("u9")).toBe("/api/bookings/user/u9")
    })

    it("builds parameterized service provider endpoints", () => {
      expect(API_CONFIG.ENDPOINTS.SERVICE_PROVIDERS.BY_ID("s1")).toBe("/api/service-providers/s1")
      expect(API_CONFIG.ENDPOINTS.SERVICE_PROVIDERS.SERVICES("s1")).toBe("/api/service-providers/s1/services")
    })

    it("builds parameterized user and payment endpoints", () => {
      expect(API_CONFIG.ENDPOINTS.USERS.PROFILE("u1")).toBe("/api/users/u1/profile")
      expect(API_CONFIG.ENDPOINTS.PAYMENTS.STATUS("p1")).toBe("/api/payments/p1/status")
    })
  })

  describe("getApiConfig", () => {
    it("returns a config object with the expected shape", () => {
      const config = getApiConfig()
      expect(config).toHaveProperty("BASE_URL")
      expect(config).toHaveProperty("ENDPOINTS")
      expect(config).toHaveProperty("AUTH")
      expect(config.TIMEOUT).toBe(30000)
    })

    it("returns a base url that is a non-empty string", () => {
      const config = getApiConfig()
      expect(config.BASE_URL.length).toBeGreaterThan(0)
    })
  })
})
