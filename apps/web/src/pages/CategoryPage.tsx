import { type ListingFilters as BaseListingFilters, ListingCategory } from "@marketplace/shared-types"
import React, { useEffect, useState } from "react"
import { useParams, useSearchParams } from "react-router-dom"

import { ListingsGrid } from "../components/listings"
import { AdvancedFilters, AISearchBox } from "../components/search"
import { useListings } from "../lib/query"

// Extended filters for the frontend
interface ExtendedListingFilters {
  query?: string
  category?: string
  minPrice?: number
  maxPrice?: number
  province?: string
  city?: string
  status?: string
  featured?: boolean
  tags?: string[]
  sortBy?: string
}

// Convert extended filters to base filters for API
const convertToBaseFilters = (filters: ExtendedListingFilters): BaseListingFilters => {
  const baseFilters: BaseListingFilters = {}

  // Convert category string to enum if needed
  if (filters.category) {
    const categoryValue = Object.values(ListingCategory).find(
      (cat) => cat === filters.category || cat.toLowerCase() === filters.category?.toLowerCase(),
    )
    if (categoryValue) {
      baseFilters.category = categoryValue
    }
  }

  // Map price range
  if (filters.minPrice !== undefined || filters.maxPrice !== undefined) {
    baseFilters.priceRange = {
      min: filters.minPrice || 0,
      max: filters.maxPrice || Number.MAX_SAFE_INTEGER,
    }
  }

  // Map location
  if (filters.province || filters.city) {
    baseFilters.location = {
      region: filters.province,
      city: filters.city,
    }
  }

  return baseFilters
}

const getCategoryTitle = (category: string) => {
  switch (category) {
    case "transportation":
      return "Transportation"
    case "tours":
      return "Tours & Experiences"
    case "services":
      return "Services"
    case "vehicles":
      return "Vehicles & Properties"
    case "products":
      return "Products"
    default:
      return "Listings"
  }
}

const getCategoryDescription = (category: string) => {
  switch (category) {
    case "transportation":
      return "Find scooters, motorcycles, cars, and other vehicles for rent"
    case "tours":
      return "Discover amazing tours and experiences across Thailand"
    case "services":
      return "Professional services including visa assistance, legal help, and more"
    case "vehicles":
      return "Apartments, condos, houses, and commercial spaces for rent"
    case "products":
      return "Electronics, gadgets, and other products for rent or purchase"
    default:
      return "Browse all available listings"
  }
}

export const CategoryPage: React.FC = () => {
  const { category } = useParams<{ category: string }>()
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)

  // Initialize filters from URL params
  const [filters, setFilters] = useState<ExtendedListingFilters>(() => {
    const initialFilters: ExtendedListingFilters = {
      category: category || "",
    }

    // Parse URL parameters
    searchParams.forEach((value, key) => {
      if (key === "minPrice" || key === "maxPrice") {
        initialFilters[key] = Number.parseInt(value, 10) || undefined
      } else if (key === "featured") {
        initialFilters[key] = value === "true"
      } else {
        ;(initialFilters as any)[key] = value
      }
    })

    return initialFilters
  })

  const baseFilters = convertToBaseFilters(filters)

  const {
    data: listingsData,
    isLoading,
    error,
    refetch,
  } = useListings({
    ...baseFilters,
    page: 1,
    limit: 12,
  })

  // Update category when route changes
  useEffect(() => {
    if (category) {
      setFilters((prev) => ({ ...prev, category }))
      refetch() // Force refetch when category changes
    }
  }, [category, refetch])

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null && key !== "category") {
        params.set(key, value.toString())
      }
    })

    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFiltersChange = (newFilters: ExtendedListingFilters) => {
    setFilters((prev) => ({ ...prev, ...newFilters }))
  }

  const handleSearch = (query?: string) => {
    if (query !== undefined) {
      setFilters((prev: ExtendedListingFilters) => ({ ...prev, query }))
    }
    refetch()
  }

  const categoryTitle = getCategoryTitle(category || "")
  const categoryDescription = getCategoryDescription(category || "")

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 sm:text-4xl">{categoryTitle}</h1>
            <p className="mt-4 text-xl text-gray-600">{categoryDescription}</p>
          </div>

          {/* Search */}
          <div className="mt-8 max-w-2xl mx-auto">
            <AISearchBox onSearch={handleSearch} placeholder={`Search ${categoryTitle.toLowerCase()}...`} />
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <div className="bg-white border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
            <AdvancedFilters
              filters={filters}
              onFiltersChange={handleFiltersChange}
              onApplyFilters={() => {
                refetch()
                setShowAdvancedFilters(false)
              }}
            />
          </div>
        </div>
      )}

      {/* Results */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-medium text-gray-900">
              {listingsData?.total ? `${listingsData.total} results` : "Results"}
            </h2>
            {filters.query && <p className="text-sm text-gray-500 mt-1">Showing results for "{filters.query}"</p>}
          </div>
        </div>

        <ListingsGrid
          listings={listingsData?.listings || []}
          loading={isLoading}
          error={error?.message}
          emptyMessage={`No ${categoryTitle.toLowerCase()} found. Try adjusting your search criteria.`}
        />
      </div>
    </div>
  )
}
