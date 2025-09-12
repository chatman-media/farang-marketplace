# Marketplace Configuration

This directory contains configuration files for the Thailand Marketplace
frontend application.

## Categories Configuration (`marketplace.ts`)

### Overview

The categories configuration allows you to manage which categories are displayed
in the marketplace. This includes navigation items, main page cards, and
routing.

### Category Structure

Each category has the following properties:

```typescript
interface CategoryConfig {
  id: string // Unique identifier
  name: string // Display name
  description: string // Description for cards
  icon: string // Emoji icon
  enabled: boolean // Whether category is active
  color: "primary" | "secondary" | "success" | "warning" | "error"
  badge?: string // Optional badge text
  route: string // URL route
}
```

### Available Categories

Based on the design document, the marketplace supports:

1. **Transportation** - Rent scooters, motorcycles, cars, bicycles, boats, and
   ATVs
2. **Tours** - Discover tours, excursions, activities, and guides
3. **Services** - Individual, corporate, agency, and freelance services
4. **Vehicles** - Full vehicle management with maintenance tracking
5. **Products** - Electronics, clothing, sports equipment, home and garden items

### Enabling/Disabling Categories

#### Method 1: Direct Configuration

Edit the `CATEGORIES_CONFIG` array in `marketplace.ts`:

```typescript
{
  id: "products",
  name: "Products",
  // ... other properties
  enabled: false,  // Set to false to disable
}
```

#### Method 2: Programmatic Control

Use the helper functions:

```typescript
import {
  enableCategory,
  disableCategory,
  toggleCategory,
} from "./config/marketplace"

// Disable a category
disableCategory("products")

// Enable a category
enableCategory("products")

// Toggle a category
toggleCategory("products")
```

### Effects of Disabling Categories

When a category is disabled (`enabled: false`):

- ❌ Removed from navigation menu
- ❌ Hidden from main page category cards
- ❌ Route still exists but not accessible via UI
- ✅ Direct URL access still works

### Hero Section Configuration

The main page hero section is configurable via `HERO_CONFIG`:

```typescript
export const HERO_CONFIG = {
  title: "Thailand Marketplace",
  subtitle: "Your gateway to transportation, tours, services, and more",
  description: "Find everything you need for your life in Thailand...",
  primaryButton: {
    text: "Explore Categories",
    href: "/transportation",
  },
  secondaryButton: {
    text: "Learn More",
    href: "/about",
  },
}
```

### Features Section

The features/benefits section is configured via `FEATURES_CONFIG`:

```typescript
export const FEATURES_CONFIG = [
  {
    icon: "✅",
    title: "Verified Providers",
    description: "All service providers are verified...",
  },
  // ... more features
]
```

### Helper Functions

- `getEnabledCategories()` - Returns only enabled categories
- `getCategoryById(id)` - Find category by ID
- `getCategoryByRoute(route)` - Find category by route
- `getNavigationItems()` - Returns navigation items for header
- `isCategoryEnabled(id)` - Check if category is enabled

### Usage Examples

#### Custom Navigation

```typescript
import { getNavigationItems } from "./config/marketplace"

const navigation = getNavigationItems()
// Returns: [{ name: "Home", href: "/" }, { name: "Transportation", href: "/transportation" }, ...]
```

#### Category-Specific Logic

```typescript
import { isCategoryEnabled } from "./config/marketplace"

if (isCategoryEnabled("products")) {
  // Show products-specific UI
}
```

#### Dynamic Category Management

```typescript
import { toggleCategory, getEnabledCategories } from "./config/marketplace"

// Toggle category based on user preference
const handleCategoryToggle = (categoryId: string) => {
  toggleCategory(categoryId)
  // Re-render navigation
}
```

### Best Practices

1. **Consistent Naming**: Use consistent category IDs across frontend and
   backend
2. **Icon Selection**: Use appropriate emoji icons that represent the category
3. **Color Coordination**: Use Tailwind color variants consistently
4. **Route Naming**: Keep routes simple and SEO-friendly
5. **Description Length**: Keep descriptions concise but informative

### Integration with Backend

The category IDs should match the `ListingCategory` enum in the shared types:

```typescript
// packages/shared-types/src/listing.ts
export enum ListingCategory {
  TRANSPORTATION = "transportation",
  TOURS = "tours",
  SERVICES = "services",
  VEHICLES = "vehicles",
  PRODUCTS = "products",
}
```

This ensures consistency between frontend configuration and backend data models.
