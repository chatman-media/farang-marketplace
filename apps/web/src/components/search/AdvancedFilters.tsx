import React, { useState } from "react"
import { Button, Input, Card, Badge } from "../ui"
import { ListingCategory } from "@marketplace/shared-types"

// Extended filters for the frontend
interface ExtendedListingFilters {
  query?: string
  category?: ListingCategory | string
  minPrice?: number
  maxPrice?: number
  province?: string
  city?: string
  status?: string
  featured?: boolean
  tags?: string[]
  sortBy?: string
  // Base filters
  type?: any
  location?: any
  priceRange?: any
  dateRange?: any
  amenities?: string[]
  rating?: number
  isVerified?: boolean
}

type ListingFilters = ExtendedListingFilters

interface FilterPreset {
  id: string
  name: string
  description: string
  filters: Partial<ListingFilters>
  icon: React.ReactNode
}

interface AdvancedFiltersProps {
  filters: ListingFilters
  onFiltersChange: (filters: ListingFilters) => void
  onApplyFilters: () => void
  className?: string
}

export const AdvancedFilters: React.FC<AdvancedFiltersProps> = ({
  filters,
  onFiltersChange,
  onApplyFilters,
  className = "",
}) => {
  const [activePreset, setActivePreset] = useState<string | null>(null)

  const filterPresets: FilterPreset[] = [
    {
      id: "luxury-vehicles",
      name: "Luxury Vehicles",
      description: "High-end vehicles with premium features",
      filters: {
        category: ListingCategory.VEHICLES,
        minPrice: 50000,
        tags: ["luxury", "premium", "sport"],
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z"
          />
        </svg>
      ),
    },
    {
      id: "budget-friendly",
      name: "Budget Friendly",
      description: "Affordable options under 20,000 THB",
      filters: {
        maxPrice: 20000,
        sortBy: "price:asc",
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"
          />
        </svg>
      ),
    },
    {
      id: "transportation-services",
      name: "Transportation Services",
      description: "Transportation and delivery services",
      filters: {
        category: ListingCategory.TRANSPORTATION,
        tags: ["delivery", "transport", "service"],
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4"
          />
        </svg>
      ),
    },
    {
      id: "pet-friendly",
      name: "Pet Friendly",
      description: "Properties that allow pets",
      filters: {
        tags: ["pet-friendly", "pets-allowed"],
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
          />
        </svg>
      ),
    },
    {
      id: "services-home",
      name: "Home Services",
      description: "Services that come to your location",
      filters: {
        category: ListingCategory.SERVICES,
        tags: ["home-service", "on-site"],
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
          />
        </svg>
      ),
    },
    {
      id: "vehicles-rental",
      name: "Vehicle Rentals",
      description: "Cars and motorcycles for rent",
      filters: {
        category: ListingCategory.VEHICLES,
        tags: ["rental", "daily", "weekly"],
      },
      icon: (
        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10a1 1 0 001 1h1m8-1a1 1 0 01-1 1H9m4-1V8a1 1 0 011-1h2.586a1 1 0 01.707.293l3.414 3.414a1 1 0 01.293.707V16a1 1 0 01-1 1h-1m-6-1a1 1 0 001 1h1M5 17a2 2 0 104 0m-4 0a2 2 0 114 0m6 0a2 2 0 104 0m-4 0a2 2 0 114 0"
          />
        </svg>
      ),
    },
  ]

  const handlePresetClick = (preset: FilterPreset) => {
    setActivePreset(preset.id)
    onFiltersChange({
      ...filters,
      ...preset.filters,
    })
  }

  const clearFilters = () => {
    setActivePreset(null)
    onFiltersChange({
      query: filters.query || "",
    })
  }

  const handleInputChange =
    (field: keyof ListingFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      onFiltersChange({
        ...filters,
        [field]: value === "" ? undefined : value,
      })
      setActivePreset(null) // Clear preset when manually changing filters
    }

  const handlePriceChange = (field: "minPrice" | "maxPrice") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFiltersChange({
      ...filters,
      [field]: value === "" ? undefined : parseFloat(value),
    })
    setActivePreset(null)
  }

  const handleTagsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const tags = e.target.value
      .split(",")
      .map((tag) => tag.trim())
      .filter((tag) => tag.length > 0)
    onFiltersChange({
      ...filters,
      tags: tags.length > 0 ? tags : undefined,
    })
    setActivePreset(null)
  }

  const getActiveFiltersCount = () => {
    const filterKeys = Object.keys(filters).filter(
      (key) => key !== "query" && filters[key as keyof ListingFilters] !== undefined,
    )
    return filterKeys.length
  }

  return (
    <Card className={className}>
      <Card.Header>
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-medium text-gray-900">Advanced Filters</h3>
          <div className="flex items-center space-x-2">
            {getActiveFiltersCount() > 0 && (
              <Badge variant="primary" size="sm">
                {getActiveFiltersCount()} active
              </Badge>
            )}
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>
        </div>
      </Card.Header>

      <Card.Body className="space-y-6">
        {/* AI-Powered Filter Presets */}
        <div>
          <h4 className="text-sm font-medium text-gray-900 mb-3">Smart Filter Presets</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {filterPresets.map((preset) => (
              <button
                key={preset.id}
                onClick={() => handlePresetClick(preset)}
                className={`p-3 rounded-lg border text-left transition-colors ${
                  activePreset === preset.id
                    ? "border-primary-300 bg-primary-50 text-primary-700"
                    : "border-gray-200 hover:border-gray-300 hover:bg-gray-50"
                }`}
              >
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 text-gray-400">{preset.icon}</div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900">{preset.name}</p>
                    <p className="text-xs text-gray-500 mt-1">{preset.description}</p>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* Manual Filters */}
        <div className="border-t pt-6">
          <h4 className="text-sm font-medium text-gray-900 mb-4">Custom Filters</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Price Range */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Price (THB)</label>
              <Input
                type="number"
                placeholder="0"
                value={filters.minPrice || ""}
                onChange={handlePriceChange("minPrice")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Price (THB)</label>
              <Input
                type="number"
                placeholder="No limit"
                value={filters.maxPrice || ""}
                onChange={handlePriceChange("maxPrice")}
              />
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Province</label>
              <Input
                type="text"
                placeholder="Any province"
                value={filters.province || ""}
                onChange={handleInputChange("province")}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">City</label>
              <Input
                type="text"
                placeholder="Any city"
                value={filters.city || ""}
                onChange={handleInputChange("city")}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Tags (comma separated)</label>
              <Input
                type="text"
                placeholder="luxury, pool, gym, pet-friendly"
                value={filters.tags?.join(", ") || ""}
                onChange={handleTagsChange}
              />
            </div>

            {/* Status */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                value={filters.status || ""}
                onChange={handleInputChange("status")}
                className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>

          {/* Additional Options */}
          <div className="flex flex-wrap gap-4 mt-4">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={filters.featured || false}
                onChange={(e) => {
                  onFiltersChange({
                    ...filters,
                    featured: e.target.checked || undefined,
                  })
                  setActivePreset(null)
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <span className="ml-2 text-sm text-gray-700">Featured only</span>
            </label>
          </div>
        </div>

        {/* Apply Filters Button */}
        <div className="border-t pt-4">
          <Button onClick={onApplyFilters} className="w-full">
            Apply Filters ({getActiveFiltersCount()} active)
          </Button>
        </div>
      </Card.Body>
    </Card>
  )
}
