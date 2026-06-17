import { beforeEach, describe, expect, it, vi } from "vitest"

// Mock the underlying api wrapper so we test URL building + transforms only.
vi.mock("../../client", () => ({
  api: {
    get: vi.fn(),
    post: vi.fn(),
    put: vi.fn(),
    delete: vi.fn(),
  },
}))

import { api } from "../../client"
import { listingsService, serviceListingsService } from "../listings"

const mockApi = api as unknown as {
  get: ReturnType<typeof vi.fn>
  post: ReturnType<typeof vi.fn>
  put: ReturnType<typeof vi.fn>
  delete: ReturnType<typeof vi.fn>
}

const pagedApiResponse = {
  success: true,
  data: {
    listings: [{ id: "l1" }, { id: "l2" }],
    pagination: { total: 2, page: 1, limit: 20, totalPages: 1 },
  },
}

describe("listingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getListings", () => {
    it("transforms the paginated API shape into ListingsPageResponse", async () => {
      mockApi.get.mockResolvedValue(pagedApiResponse)

      const result = await listingsService.getListings()

      expect(result).toEqual({
        listings: [{ id: "l1" }, { id: "l2" }],
        total: 2,
        page: 1,
        limit: 20,
        hasMore: false, // page 1 of 1
      })
    })

    it("computes hasMore=true when more pages remain", async () => {
      mockApi.get.mockResolvedValue({
        success: true,
        data: { listings: [], pagination: { total: 50, page: 1, limit: 20, totalPages: 3 } },
      })

      const result = await listingsService.getListings()
      expect(result.hasMore).toBe(true)
    })

    it("serializes scalar filters into query params", async () => {
      mockApi.get.mockResolvedValue(pagedApiResponse)

      await listingsService.getListings({ page: 2, limit: 10, category: "vehicle" } as any)

      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("page=2")
      expect(url).toContain("limit=10")
      expect(url).toContain("category=vehicle")
    })

    it("JSON-stringifies object filter values", async () => {
      mockApi.get.mockResolvedValue(pagedApiResponse)

      await listingsService.getListings({ priceRange: { min: 1, max: 5 } } as any)

      const url = mockApi.get.mock.calls[0][0] as string
      // URLSearchParams encodes the JSON; decode to verify.
      expect(decodeURIComponent(url)).toContain('priceRange={"min":1,"max":5}')
    })

    it("skips undefined and null filter values", async () => {
      mockApi.get.mockResolvedValue(pagedApiResponse)

      await listingsService.getListings({ category: undefined, city: null } as any)

      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).not.toContain("category")
      expect(url).not.toContain("city")
    })
  })

  describe("getListing", () => {
    it("requests the by-id endpoint", async () => {
      mockApi.get.mockResolvedValue({ id: "l9" })
      const result = await listingsService.getListing("l9")
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/l9")
      expect(result).toEqual({ id: "l9" })
    })
  })

  describe("createListing / updateListing / deleteListing", () => {
    it("createListing posts to the base endpoint", async () => {
      mockApi.post.mockResolvedValue({ id: "new" })
      await listingsService.createListing({ title: "t" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/listings", { title: "t" })
    })

    it("updateListing puts to the by-id endpoint", async () => {
      mockApi.put.mockResolvedValue({ id: "l1" })
      await listingsService.updateListing("l1", { title: "u" } as any)
      expect(mockApi.put).toHaveBeenCalledWith("/api/listings/l1", { title: "u" })
    })

    it("deleteListing deletes the by-id endpoint", async () => {
      mockApi.delete.mockResolvedValue({ success: true, message: "ok" })
      const result = await listingsService.deleteListing("l1")
      expect(mockApi.delete).toHaveBeenCalledWith("/api/listings/l1")
      expect(result.success).toBe(true)
    })
  })

  describe("searchListings", () => {
    it("adds the query param and serializes filters", async () => {
      mockApi.get.mockResolvedValue({ listings: [] })
      await listingsService.searchListings("scooter", { category: "vehicle" } as any)
      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("/api/listings/search")
      expect(url).toContain("q=scooter")
      expect(url).toContain("category=vehicle")
    })
  })

  describe("getFeaturedListings", () => {
    it("appends the limit when provided", async () => {
      mockApi.get.mockResolvedValue([])
      await listingsService.getFeaturedListings(5)
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/featured?limit=5")
    })

    it("omits the limit param when not provided", async () => {
      mockApi.get.mockResolvedValue([])
      await listingsService.getFeaturedListings()
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/featured")
    })
  })

  describe("getUserListings", () => {
    it("requests the user listings endpoint", async () => {
      mockApi.get.mockResolvedValue([])
      await listingsService.getUserListings("u1")
      expect(mockApi.get).toHaveBeenCalledWith("/api/listings/user/u1")
    })
  })

  describe("uploadImages / deleteImage", () => {
    it("uploadImages posts a FormData with multipart headers", async () => {
      mockApi.post.mockResolvedValue({ success: true, images: ["/uploads/a.webp"] })
      const files = [new File(["x"], "a.png", { type: "image/png" })]

      const result = await listingsService.uploadImages(files)

      expect(result.images).toEqual(["/uploads/a.webp"])
      const [url, formData, opts] = mockApi.post.mock.calls[0]
      expect(url).toBe("/api/listings/images")
      expect(formData).toBeInstanceOf(FormData)
      expect(opts.headers["Content-Type"]).toBe("multipart/form-data")
    })

    it("deleteImage sends the path in the request body", async () => {
      mockApi.delete.mockResolvedValue({ success: true })
      await listingsService.deleteImage("/uploads/a.webp")
      expect(mockApi.delete).toHaveBeenCalledWith("/api/listings/images", {
        data: { path: "/uploads/a.webp" },
      })
    })
  })

  describe("uploadListingImages (legacy)", () => {
    it("posts indexed images to the per-listing endpoint", async () => {
      mockApi.post.mockResolvedValue({ images: [] })
      const files = [new File(["1"], "1.png"), new File(["2"], "2.png")]

      await listingsService.uploadListingImages("l1", files)

      const [url, formData] = mockApi.post.mock.calls[0]
      expect(url).toBe("/api/listings/l1/images")
      expect(formData).toBeInstanceOf(FormData)
    })
  })
})

describe("serviceListingsService", () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe("getServiceListings", () => {
    it("transforms serviceProviders into listings", async () => {
      mockApi.get.mockResolvedValue({
        success: true,
        data: {
          serviceProviders: [{ id: "sp1" }],
          pagination: { total: 1, page: 1, limit: 20, totalPages: 1 },
        },
      })

      const result = await serviceListingsService.getServiceListings()
      expect(result.listings).toEqual([{ id: "sp1" }])
      expect(result.total).toBe(1)
      expect(result.hasMore).toBe(false)
    })

    it("appends array filter values as repeated params", async () => {
      mockApi.get.mockResolvedValue({
        success: true,
        data: { serviceProviders: [], pagination: { total: 0, page: 1, limit: 20, totalPages: 1 } },
      })

      await serviceListingsService.getServiceListings({ languages: ["en", "th"] } as any)

      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("languages=en")
      expect(url).toContain("languages=th")
    })
  })

  describe("getServiceListing", () => {
    it("requests the by-id endpoint", async () => {
      mockApi.get.mockResolvedValue({ id: "sp9" })
      await serviceListingsService.getServiceListing("sp9")
      expect(mockApi.get).toHaveBeenCalledWith("/api/service-providers/sp9")
    })
  })

  describe("createServiceListing / updateServiceListing", () => {
    it("createServiceListing posts to the base endpoint", async () => {
      mockApi.post.mockResolvedValue({ id: "x" })
      await serviceListingsService.createServiceListing({ title: "t" } as any)
      expect(mockApi.post).toHaveBeenCalledWith("/api/service-providers", { title: "t" })
    })

    it("updateServiceListing puts using the data id", async () => {
      mockApi.put.mockResolvedValue({ id: "sp1" })
      await serviceListingsService.updateServiceListing({ id: "sp1", title: "u" } as any)
      expect(mockApi.put).toHaveBeenCalledWith("/api/service-providers/sp1", { id: "sp1", title: "u" })
    })
  })

  describe("searchServiceListings", () => {
    it("serializes array filters alongside the query", async () => {
      mockApi.get.mockResolvedValue({ listings: [] })
      await serviceListingsService.searchServiceListings("visa", { tags: ["a", "b"] } as any)
      const url = mockApi.get.mock.calls[0][0] as string
      expect(url).toContain("/api/service-providers/search")
      expect(url).toContain("q=visa")
      expect(url).toContain("tags=a")
      expect(url).toContain("tags=b")
    })
  })
})
