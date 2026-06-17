import { ListingCategory } from "@marketplace/shared-types"
import type { FastifyReply } from "fastify"
import { describe, expect, it, vi } from "vitest"
import {
  getAvailableCategories,
  getCategoryConfig,
  getEnabledCategories,
  isCategoryEnabled,
} from "../config/categories"
import {
  type CategoryValidationRequest,
  filterEnabledCategories,
  validateCategoryEnabled,
} from "../middleware/categoryValidation"

// A minimal Fastify reply double that records the chosen status code and payload.
function makeReply() {
  const reply = {
    statusCode: 200 as number | undefined,
    payload: undefined as unknown,
    code: vi.fn(function (this: any, c: number) {
      this.statusCode = c
      return this
    }),
    send: vi.fn(function (this: any, p: unknown) {
      this.payload = p
      return this
    }),
  }
  return reply as unknown as FastifyReply & {
    statusCode: number
    payload: any
    code: ReturnType<typeof vi.fn>
    send: ReturnType<typeof vi.fn>
  }
}

function makeRequest(parts: Partial<CategoryValidationRequest>): CategoryValidationRequest {
  return {
    body: parts.body ?? {},
    params: parts.params ?? {},
    query: parts.query ?? {},
  } as CategoryValidationRequest
}

describe("config/categories", () => {
  it("getEnabledCategories returns only enabled categories", () => {
    const enabled = getEnabledCategories()
    expect(enabled).toContain(ListingCategory.TRANSPORTATION)
    expect(enabled).toContain(ListingCategory.SERVICES)
    expect(enabled).toContain(ListingCategory.VEHICLES)
    // TOURS and PRODUCTS are flagged comingSoon / disabled.
    expect(enabled).not.toContain(ListingCategory.TOURS)
    expect(enabled).not.toContain(ListingCategory.PRODUCTS)
  })

  it("isCategoryEnabled reflects the config flags", () => {
    expect(isCategoryEnabled(ListingCategory.TRANSPORTATION)).toBe(true)
    expect(isCategoryEnabled(ListingCategory.TOURS)).toBe(false)
    expect(isCategoryEnabled(ListingCategory.PRODUCTS)).toBe(false)
  })

  it("isCategoryEnabled defaults to false for an unconfigured category", () => {
    expect(isCategoryEnabled("nonexistent" as ListingCategory)).toBe(false)
  })

  it("getCategoryConfig returns the config for a known category and undefined otherwise", () => {
    const transport = getCategoryConfig(ListingCategory.TRANSPORTATION)
    expect(transport?.label).toBe("Transportation")
    expect(transport?.enabled).toBe(true)

    const tours = getCategoryConfig(ListingCategory.TOURS)
    expect(tours?.comingSoon).toBe(true)

    expect(getCategoryConfig("unknown" as ListingCategory)).toBeUndefined()
  })

  it("getAvailableCategories returns every configured category with its config", () => {
    const all = getAvailableCategories()
    const categoryKeys = all.map((c) => c.category)
    expect(categoryKeys).toContain(ListingCategory.TRANSPORTATION)
    expect(categoryKeys).toContain(ListingCategory.TOURS)
    expect(categoryKeys).toContain(ListingCategory.PRODUCTS)
    for (const entry of all) {
      expect(entry.config).toHaveProperty("enabled")
      expect(entry.config).toHaveProperty("label")
    }
  })
})

describe("middleware/categoryValidation - validateCategoryEnabled", () => {
  it("continues (no reply) when no category is present", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({}), reply)
    expect(reply.code).not.toHaveBeenCalled()
    expect(reply.send).not.toHaveBeenCalled()
  })

  it("reads category from body and allows an enabled one", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({ body: { category: ListingCategory.VEHICLES } }), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it("reads category from params", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({ params: { category: ListingCategory.SERVICES } }), reply)
    expect(reply.code).not.toHaveBeenCalled()
  })

  it("reads category from a query array (first element)", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(
      makeRequest({ query: { category: [ListingCategory.TRANSPORTATION, ListingCategory.VEHICLES] } }),
      reply,
    )
    expect(reply.code).not.toHaveBeenCalled()
  })

  it("returns 400 with available categories for an invalid category", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({ body: { category: "spaceships" as ListingCategory } }), reply)
    expect(reply.code).toHaveBeenCalledWith(400)
    expect(reply.payload.success).toBe(false)
    expect(reply.payload.message).toContain("Invalid category")
    expect(reply.payload.availableCategories).toEqual(Object.values(ListingCategory))
  })

  it("returns 403 with comingSoon=true for a disabled coming-soon category", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({ query: { category: ListingCategory.TOURS } }), reply)
    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.payload.comingSoon).toBe(true)
    expect(reply.payload.message).toContain("coming soon")
    expect(reply.payload.category).toBe(ListingCategory.TOURS)
  })

  it("returns 403 for PRODUCTS (disabled, coming soon)", async () => {
    const reply = makeReply()
    await validateCategoryEnabled(makeRequest({ body: { category: ListingCategory.PRODUCTS } }), reply)
    expect(reply.code).toHaveBeenCalledWith(403)
    expect(reply.payload.comingSoon).toBe(true)
  })
})

describe("middleware/categoryValidation - filterEnabledCategories", () => {
  it("drops invalid and disabled categories, keeping only enabled ones", () => {
    const result = filterEnabledCategories([
      ListingCategory.TRANSPORTATION,
      ListingCategory.TOURS, // disabled
      "garbage", // invalid
      ListingCategory.VEHICLES,
      ListingCategory.PRODUCTS, // disabled
    ])
    expect(result).toEqual([ListingCategory.TRANSPORTATION, ListingCategory.VEHICLES])
  })

  it("returns an empty array when nothing is enabled", () => {
    expect(filterEnabledCategories([ListingCategory.TOURS, "nope"])).toEqual([])
  })
})
