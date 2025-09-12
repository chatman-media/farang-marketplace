import { ListingCategory } from "@marketplace/shared-types"

// Configuration for enabled/disabled listing categories
export interface CategoryConfig {
  enabled: boolean
  label: string
  description: string
  icon?: string
  comingSoon?: boolean
}

export const CATEGORY_CONFIG: Partial<Record<ListingCategory, CategoryConfig>> = {
  [ListingCategory.TRANSPORTATION]: {
    enabled: true,
    label: "Transportation",
    description: "Cars, motorcycles, boats, and other vehicles for rent or sale",
    icon: "🚗",
  },
  [ListingCategory.TOURS]: {
    enabled: false, // Disabled for now
    label: "Tours & Experiences",
    description: "Guided tours, experiences, and activities",
    icon: "🗺️",
    comingSoon: true,
  },
  [ListingCategory.SERVICES]: {
    enabled: true,
    label: "Services",
    description: "Professional services, consultations, and assistance",
    icon: "🛠️",
  },
  [ListingCategory.VEHICLES]: {
    enabled: true,
    label: "Vehicles",
    description: "Cars, motorcycles, boats for rent or purchase",
    icon: "🚙",
  },
  [ListingCategory.PRODUCTS]: {
    enabled: false, // Disabled for now
    label: "Products",
    description: "Physical products for sale or rent",
    icon: "📦",
    comingSoon: true,
  },
}

// Helper functions
export const getEnabledCategories = (): ListingCategory[] => {
  return Object.entries(CATEGORY_CONFIG)
    .filter(([_, config]) => config.enabled)
    .map(([category, _]) => category as ListingCategory)
}

export const isCategoryEnabled = (category: ListingCategory): boolean => {
  return CATEGORY_CONFIG[category]?.enabled ?? false
}

export const getCategoryConfig = (category: ListingCategory): CategoryConfig | undefined => {
  return CATEGORY_CONFIG[category]
}

export const getAvailableCategories = (): Array<{ category: ListingCategory; config: CategoryConfig }> => {
  return Object.entries(CATEGORY_CONFIG).map(([category, config]) => ({
    category: category as ListingCategory,
    config,
  }))
}
