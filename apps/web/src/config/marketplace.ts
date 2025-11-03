export interface CategoryConfig {
  id: string
  name: string
  description: string
  icon: string
  enabled: boolean
  color: "primary" | "secondary" | "success" | "warning" | "error"
  badge?: string
  route: string
}

export const CATEGORIES_CONFIG: CategoryConfig[] = [
  {
    id: "transportation",
    name: "Transportation",
    description: "Rent scooters, motorcycles, cars, bicycles, boats, and ATVs for your travels.",
    icon: "🛵",
    enabled: true,
    color: "primary",
    badge: "Popular",
    route: "/transportation",
  },
  {
    id: "tours",
    name: "Tours",
    description: "Discover amazing tours, excursions, activities, and guides across Thailand.",
    icon: "🗺️",
    enabled: true,
    color: "success",
    badge: "Book Now",
    route: "/tours",
  },
  {
    id: "services",
    name: "Services",
    description: "Individual, corporate, agency, and freelance services for all your needs.",
    icon: "🛠️",
    enabled: true,
    color: "warning",
    badge: "Verified",
    route: "/services",
  },
  {
    id: "vehicles",
    name: "Vehicles",
    description: "Full vehicle management with maintenance tracking and long-term rentals.",
    icon: "🚗",
    enabled: true,
    color: "secondary",
    badge: "Managed",
    route: "/vehicles",
  },
  {
    id: "products",
    name: "Products",
    description: "Electronics, clothing, sports equipment, home and garden items for rent or purchase.",
    icon: "📱",
    enabled: true,
    color: "primary",
    badge: "Latest Tech",
    route: "/products",
  },
]

// Helper functions
export const getEnabledCategories = (): CategoryConfig[] => {
  return CATEGORIES_CONFIG.filter((category) => category.enabled)
}

export const getCategoryById = (id: string): CategoryConfig | undefined => {
  return CATEGORIES_CONFIG.find((category) => category.id === id)
}

export const getCategoryByRoute = (route: string): CategoryConfig | undefined => {
  return CATEGORIES_CONFIG.find((category) => category.route === route)
}

// Category management functions
export const enableCategory = (categoryId: string): void => {
  const category = getCategoryById(categoryId)
  if (category) {
    category.enabled = true
  }
}

export const disableCategory = (categoryId: string): void => {
  const category = getCategoryById(categoryId)
  if (category) {
    category.enabled = false
  }
}

export const toggleCategory = (categoryId: string): void => {
  const category = getCategoryById(categoryId)
  if (category) {
    category.enabled = !category.enabled
  }
}

// Check if category is enabled
export const isCategoryEnabled = (categoryId: string): boolean => {
  const category = getCategoryById(categoryId)
  return category?.enabled ?? false
}

// Navigation items based on enabled categories
export const getNavigationItems = () => {
  const homeItem = { name: "Home", href: "/", id: "home" }
  const categoryItems = getEnabledCategories().map((category) => ({
    name: category.name,
    href: category.route,
    id: category.id,
  }))

  return [homeItem, ...categoryItems]
}

// Main page hero section config
export const HERO_CONFIG = {
  title: "Thailand Marketplace",
  subtitle: "Your gateway to transportation, tours, services, and more in Thailand",
  description:
    "Find everything you need for your life in Thailand - from daily transportation and exciting tours to professional services and quality products.",
  primaryButton: {
    text: "Explore Categories",
    href: "/transportation",
  },
  secondaryButton: {
    text: "Learn More",
    href: "/about",
  },
}

// Feature highlights for main page
export const FEATURES_CONFIG = [
  {
    icon: "✅",
    title: "Verified Providers",
    description: "All service providers are verified for your safety and peace of mind.",
  },
  {
    icon: "💰",
    title: "Best Prices",
    description: "Compare prices and find the best deals across all categories.",
  },
  {
    icon: "🌍",
    title: "Local Expertise",
    description: "Get insider knowledge from locals who know Thailand best.",
  },
  {
    icon: "📱",
    title: "Easy Booking",
    description: "Book services and rentals quickly through our user-friendly platform.",
  },
  {
    icon: "🔒",
    title: "Secure Payments",
    description: "Safe and secure payment processing for all transactions.",
  },
  {
    icon: "🎯",
    title: "Personalized",
    description: "Get recommendations tailored to your needs and preferences.",
  },
]
