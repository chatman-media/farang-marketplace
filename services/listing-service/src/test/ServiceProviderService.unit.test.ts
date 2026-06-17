import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

// ---------------------------------------------------------------------------
// Mock the DB connection. ServiceProviderService imports { db, schema } from
// "../db/connection". We replace `db` with a chainable query-builder double whose
// terminal result is queued per-test, so no real Postgres connection is needed.
// Everything the hoisted vi.mock factory touches must be created via vi.hoisted.
// ---------------------------------------------------------------------------
const { dbResultQueue, db } = vi.hoisted(() => {
  const dbResultQueue: unknown[][] = []
  const nextResult = (): unknown[] => (dbResultQueue.length > 0 ? (dbResultQueue.shift() as unknown[]) : [])

  // A thenable chain: every builder method returns the same object; awaiting it
  // (or calling a terminal like .returning()) resolves to the next queued result.
  const makeChain = () => {
    const chain: any = {
      then: (resolve: (v: unknown) => unknown) => Promise.resolve(nextResult()).then(resolve),
    }
    for (const m of ["values", "where", "limit", "offset", "orderBy", "set", "from"]) {
      chain[m] = vi.fn(() => chain)
    }
    chain.returning = vi.fn(() => Promise.resolve(nextResult()))
    return chain
  }

  const db = {
    insert: vi.fn(() => makeChain()),
    select: vi.fn(() => makeChain()),
    update: vi.fn(() => makeChain()),
    delete: vi.fn(() => makeChain()),
  }
  return { dbResultQueue, db }
})

vi.mock("../db/connection", () => ({
  db,
  schema: {
    serviceProviders: {
      id: "id",
      userId: "userId",
      businessType: "businessType",
      city: "city",
      verificationLevel: "verificationLevel",
      metadata: "metadata",
      createdAt: "createdAt",
    },
  },
}))

// database-schema's sql/eq/and/etc. helpers are pure; the real module is fine, but
// stub it to avoid pulling a DB driver in. Returns opaque markers.
vi.mock("@marketplace/database-schema", () => {
  const tag = (name: string) => Object.assign((..._args: unknown[]) => ({ __op: name }), { __op: name })
  return {
    and: tag("and"),
    asc: tag("asc"),
    desc: tag("desc"),
    eq: tag("eq"),
    sql: Object.assign((..._args: unknown[]) => ({ __op: "sql" }), { raw: tag("sqlraw") }),
  }
})

import { ServiceProviderService } from "../services/ServiceProviderService"

// A row shaped like what mapToServiceProviderProfile expects.
function makeRow(overrides: Record<string, unknown> = {}) {
  return {
    id: "sp-1",
    userId: "owner-1",
    businessName: "Thai Rentals",
    averageRating: "4.5",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    updatedAt: new Date("2024-01-02T00:00:00.000Z"),
    ...overrides,
  }
}

const baseCreateInput = {
  ownerId: "owner-1",
  businessName: "Thai Rentals",
  businessType: "company" as const,
  description: "A scooter rental business in Bangkok",
  services: [
    {
      name: "Scooter Rental",
      category: "transportation",
      price: 300,
      currency: "THB",
      priceType: "daily" as const,
    },
  ],
  contactInfo: { phone: "+66812345678", email: "a@b.com" },
  location: { address: "123 Road", city: "Bangkok", region: "Bangkok", country: "Thailand" },
}

describe("ServiceProviderService (mocked DB)", () => {
  let service: ServiceProviderService

  beforeEach(() => {
    dbResultQueue.length = 0
    service = new ServiceProviderService()
    db.insert.mockClear()
    db.select.mockClear()
    db.update.mockClear()
    db.delete.mockClear()
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe("createServiceProvider", () => {
    it("inserts and maps the returned row into a profile", async () => {
      dbResultQueue.push([makeRow()]) // .returning()

      const profile = await service.createServiceProvider(baseCreateInput)

      expect(db.insert).toHaveBeenCalledTimes(1)
      expect(profile.id).toBe("sp-1")
      expect(profile.userId).toBe("owner-1")
      expect(profile.metrics.averageRating).toBe(4.5)
      expect(profile.createdAt).toBe("2024-01-01T00:00:00.000Z")
    })

    it("wraps DB failures in a friendly error", async () => {
      db.insert.mockImplementationOnce(() => {
        throw new Error("db down")
      })
      await expect(service.createServiceProvider(baseCreateInput)).rejects.toThrow("Failed to create service provider")
    })
  })

  describe("getServiceProviderById", () => {
    it("returns a mapped profile when found", async () => {
      dbResultQueue.push([makeRow({ id: "sp-99" })])
      const profile = await service.getServiceProviderById("sp-99")
      expect(profile?.id).toBe("sp-99")
    })

    it("returns null when no row is found", async () => {
      dbResultQueue.push([])
      const profile = await service.getServiceProviderById("missing")
      expect(profile).toBeNull()
    })

    it("throws a friendly error on DB failure", async () => {
      db.select.mockImplementationOnce(() => {
        throw new Error("kaboom")
      })
      await expect(service.getServiceProviderById("x")).rejects.toThrow("Failed to fetch service provider")
    })
  })

  describe("getAllServiceProviders", () => {
    it("returns paginated providers with totals (default rating sort)", async () => {
      dbResultQueue.push([makeRow(), makeRow({ id: "sp-2" })]) // page rows
      dbResultQueue.push([{ count: 2 }]) // count query

      const result = await service.getAllServiceProviders(1, 20)

      expect(result.providers).toHaveLength(2)
      expect(result.total).toBe(2)
      expect(result.page).toBe(1)
      expect(result.totalPages).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it("computes hasMore=true when more pages remain", async () => {
      dbResultQueue.push([makeRow()])
      dbResultQueue.push([{ count: 50 }])
      const result = await service.getAllServiceProviders(1, 20, "created_at", "asc")
      expect(result.hasMore).toBe(true)
      expect(result.totalPages).toBe(3)
    })

    it("supports price and distance sort branches", async () => {
      dbResultQueue.push([makeRow()])
      dbResultQueue.push([{ count: 1 }])
      const byPrice = await service.getAllServiceProviders(1, 10, "price", "asc")
      expect(byPrice.total).toBe(1)

      dbResultQueue.push([makeRow()])
      dbResultQueue.push([{ count: 1 }])
      const byDistance = await service.getAllServiceProviders(1, 10, "distance", "desc")
      expect(byDistance.total).toBe(1)
    })

    it("defaults total to 0 when count query returns nothing", async () => {
      dbResultQueue.push([])
      dbResultQueue.push([])
      const result = await service.getAllServiceProviders()
      expect(result.total).toBe(0)
      expect(result.providers).toEqual([])
    })

    it("throws a friendly error on DB failure", async () => {
      db.select.mockImplementationOnce(() => {
        throw new Error("nope")
      })
      await expect(service.getAllServiceProviders()).rejects.toThrow("Failed to get service providers")
    })
  })

  describe("searchServiceProviders", () => {
    it("applies all filter branches and returns results", async () => {
      dbResultQueue.push([makeRow()])
      dbResultQueue.push([{ count: 1 }])

      const result = await service.searchServiceProviders(
        {
          providerType: "company" as any,
          serviceTypes: ["transportation"] as any,
          location: { city: "Bangkok" } as any,
          verificationLevel: "basic" as any,
          rating: 4 as any,
          priceRange: { min: 100, max: 1000, currency: "THB" } as any,
        },
        1,
        20,
      )

      expect(result.providers).toHaveLength(1)
      expect(result.total).toBe(1)
    })

    it("works with no filters", async () => {
      dbResultQueue.push([])
      dbResultQueue.push([{ count: 0 }])
      const result = await service.searchServiceProviders({} as any)
      expect(result.total).toBe(0)
    })

    it("throws a friendly error on DB failure", async () => {
      db.select.mockImplementationOnce(() => {
        throw new Error("search fail")
      })
      await expect(service.searchServiceProviders({} as any)).rejects.toThrow("Failed to search service providers")
    })
  })

  describe("updateServiceProvider", () => {
    it("returns null when the owner does not match (not found)", async () => {
      dbResultQueue.push([]) // ownership check returns nothing
      const result = await service.updateServiceProvider("sp-1", { businessName: "New" }, "owner-1")
      expect(result).toBeNull()
      expect(db.update).not.toHaveBeenCalled()
    })

    it("updates and maps when the owner matches", async () => {
      dbResultQueue.push([makeRow()]) // ownership check
      dbResultQueue.push([makeRow({ businessName: "Updated Co" })]) // .returning()

      const result = await service.updateServiceProvider(
        "sp-1",
        {
          businessName: "Updated Co",
          description: "Updated description text",
          contactInfo: { phone: "+66800000000", email: "new@b.com", website: "https://x.io" } as any,
          images: ["/uploads/a.webp"],
          services: baseCreateInput.services,
        },
        "owner-1",
      )

      expect(db.update).toHaveBeenCalledTimes(1)
      expect(result?.businessName).toBe("Updated Co")
    })

    it("throws a friendly error on DB failure", async () => {
      db.select.mockImplementationOnce(() => {
        throw new Error("boom")
      })
      await expect(service.updateServiceProvider("sp-1", {}, "owner-1")).rejects.toThrow(
        "Failed to update service provider",
      )
    })
  })

  describe("deleteServiceProvider", () => {
    it("returns true when a row was deleted", async () => {
      dbResultQueue.push([{ id: "sp-1" }]) // .returning()
      const ok = await service.deleteServiceProvider("sp-1", "owner-1")
      expect(ok).toBe(true)
      expect(db.delete).toHaveBeenCalledTimes(1)
    })

    it("returns false when nothing matched", async () => {
      dbResultQueue.push([])
      const ok = await service.deleteServiceProvider("sp-1", "owner-1")
      expect(ok).toBe(false)
    })

    it("throws a friendly error on DB failure", async () => {
      db.delete.mockImplementationOnce(() => {
        throw new Error("boom")
      })
      await expect(service.deleteServiceProvider("sp-1", "owner-1")).rejects.toThrow(
        "Failed to delete service provider",
      )
    })
  })
})
