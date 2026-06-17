import { afterEach, beforeEach, describe, expect, it } from "vitest"
import {
  CATEGORIES_CONFIG,
  disableCategory,
  enableCategory,
  FEATURES_CONFIG,
  getCategoryById,
  getCategoryByRoute,
  getEnabledCategories,
  getNavigationItems,
  HERO_CONFIG,
  isCategoryEnabled,
  toggleCategory,
} from "../marketplace"

// The category config module keeps mutable `enabled` state, so snapshot the
// original state and restore it after each test to keep tests isolated.
describe("marketplace config", () => {
  let originalEnabled: Record<string, boolean>

  beforeEach(() => {
    originalEnabled = {}
    for (const c of CATEGORIES_CONFIG) {
      originalEnabled[c.id] = c.enabled
    }
  })

  afterEach(() => {
    for (const c of CATEGORIES_CONFIG) {
      c.enabled = originalEnabled[c.id]
    }
  })

  describe("CATEGORIES_CONFIG", () => {
    it("contains all five expected categories", () => {
      const ids = CATEGORIES_CONFIG.map((c) => c.id)
      expect(ids).toEqual(["transportation", "tours", "services", "vehicles", "products"])
    })

    it("every category has required fields", () => {
      for (const category of CATEGORIES_CONFIG) {
        expect(category).toHaveProperty("id")
        expect(category).toHaveProperty("name")
        expect(category).toHaveProperty("description")
        expect(category).toHaveProperty("icon")
        expect(category).toHaveProperty("route")
        expect(typeof category.enabled).toBe("boolean")
      }
    })
  })

  describe("getEnabledCategories", () => {
    it("returns only enabled categories", () => {
      disableCategory("tours")
      const enabled = getEnabledCategories()
      expect(enabled.find((c) => c.id === "tours")).toBeUndefined()
      expect(enabled.every((c) => c.enabled)).toBe(true)
    })

    it("returns all categories when all are enabled", () => {
      expect(getEnabledCategories()).toHaveLength(CATEGORIES_CONFIG.length)
    })
  })

  describe("getCategoryById", () => {
    it("returns the matching category", () => {
      const cat = getCategoryById("services")
      expect(cat?.name).toBe("Services")
    })

    it("returns undefined for an unknown id", () => {
      expect(getCategoryById("does-not-exist")).toBeUndefined()
    })
  })

  describe("getCategoryByRoute", () => {
    it("returns the matching category by route", () => {
      const cat = getCategoryByRoute("/transportation")
      expect(cat?.id).toBe("transportation")
    })

    it("returns undefined for an unknown route", () => {
      expect(getCategoryByRoute("/nope")).toBeUndefined()
    })
  })

  describe("enable/disable/toggle category", () => {
    it("enableCategory sets enabled to true", () => {
      disableCategory("vehicles")
      expect(isCategoryEnabled("vehicles")).toBe(false)
      enableCategory("vehicles")
      expect(isCategoryEnabled("vehicles")).toBe(true)
    })

    it("disableCategory sets enabled to false", () => {
      disableCategory("products")
      expect(isCategoryEnabled("products")).toBe(false)
    })

    it("toggleCategory flips the enabled state", () => {
      const before = isCategoryEnabled("tours")
      toggleCategory("tours")
      expect(isCategoryEnabled("tours")).toBe(!before)
      toggleCategory("tours")
      expect(isCategoryEnabled("tours")).toBe(before)
    })

    it("mutation helpers are no-ops for unknown ids", () => {
      expect(() => enableCategory("unknown")).not.toThrow()
      expect(() => disableCategory("unknown")).not.toThrow()
      expect(() => toggleCategory("unknown")).not.toThrow()
    })
  })

  describe("isCategoryEnabled", () => {
    it("returns false for unknown categories", () => {
      expect(isCategoryEnabled("unknown")).toBe(false)
    })
  })

  describe("getNavigationItems", () => {
    it("always includes the Home item first", () => {
      const items = getNavigationItems()
      expect(items[0]).toEqual({ name: "Home", href: "/", id: "home" })
    })

    it("includes one nav item per enabled category", () => {
      const items = getNavigationItems()
      // home + all enabled categories
      expect(items).toHaveLength(1 + getEnabledCategories().length)
      const transport = items.find((i) => i.id === "transportation")
      expect(transport).toEqual({ name: "Transportation", href: "/transportation", id: "transportation" })
    })

    it("excludes disabled categories from navigation", () => {
      disableCategory("services")
      const items = getNavigationItems()
      expect(items.find((i) => i.id === "services")).toBeUndefined()
    })
  })

  describe("static config objects", () => {
    it("HERO_CONFIG has title and buttons", () => {
      expect(HERO_CONFIG.title).toBe("Thailand Marketplace")
      expect(HERO_CONFIG.primaryButton.href).toBe("/transportation")
      expect(HERO_CONFIG.secondaryButton.text).toBe("Learn More")
    })

    it("FEATURES_CONFIG has six features each with a title", () => {
      expect(FEATURES_CONFIG).toHaveLength(6)
      for (const feature of FEATURES_CONFIG) {
        expect(feature.title.length).toBeGreaterThan(0)
        expect(feature.description.length).toBeGreaterThan(0)
      }
    })
  })
})
