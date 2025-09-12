import { type ListingFilters as BaseListingFilters, ListingCategory } from "@marketplace/shared-types"
import React, { useEffect, useState } from "react"
import { useSearchParams } from "react-router-dom"
import { ListingsGrid } from "../components/listings"
import { AdvancedFilters, AISearchBox } from "../components/search"
import { useListings } from "../lib/query"

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
}

// Convert extended filters to base filters for API
const convertToBaseFilters = (filters: ExtendedListingFilters): BaseListingFilters => {
  const baseFilters: BaseListingFilters = {}

  // Convert category string to enum if needed
  if (filters.category) {
    if (typeof filters.category === "string") {
      // Try to match string to enum value
      const categoryValue = Object.values(ListingCategory).find(
        (cat) => cat === filters.category || cat.toLowerCase() === filters.category?.toLowerCase(),
      )
      if (categoryValue) {
        baseFilters.category = categoryValue
      }
    } else {
      baseFilters.category = filters.category
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
      city: filters.city,
      region: filters.province,
      country: "TH", // Default to Thailand
    }
  }

  // Map amenities from tags
  if (filters.tags && filters.tags.length > 0) {
    baseFilters.amenities = filters.tags
  }

  return baseFilters
}

export const ListingsPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams()
  const [showAdvancedFilters, setShowAdvancedFilters] = useState(false)
  const [filters, setFilters] = useState<ExtendedListingFilters>({
    query: searchParams.get("q") || "",
    category: searchParams.get("category") || undefined,
    province: searchParams.get("province") || undefined,
    city: searchParams.get("city") || undefined,
    minPrice: searchParams.get("minPrice") ? parseFloat(searchParams.get("minPrice")!) : undefined,
    maxPrice: searchParams.get("maxPrice") ? parseFloat(searchParams.get("maxPrice")!) : undefined,
    status: searchParams.get("status") || undefined,
    featured: searchParams.get("featured") === "true" || undefined,
    sortBy: searchParams.get("sortBy") || "createdAt:desc",
  })

  const {
    data: listingsData,
    isLoading,
    error,
    refetch,
  } = useListings({
    ...convertToBaseFilters(filters),
    page: 1,
    limit: 12,
  })

  // Update URL when filters change
  useEffect(() => {
    const params = new URLSearchParams()

    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        params.set(key, value.toString())
      }
    })

    setSearchParams(params)
  }, [filters, setSearchParams])

  const handleFiltersChange = (newFilters: ExtendedListingFilters) => {
    setFilters(newFilters)
  }

  const handleSearch = (query?: string) => {
    if (query !== undefined) {
      setFilters((prev: ExtendedListingFilters) => ({ ...prev, query }))
    }
    refetch()
  }

  const handleAdvancedFiltersApply = () => {
    refetch()
    setShowAdvancedFilters(false)
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-display font-bold text-gray-900">Browse Listings</h1>
        <p className="mt-2 text-gray-600">Discover amazing properties, vehicles, and services in Thailand</p>
      </div>

      {/* AI-Enhanced Search */}
      <div className="mb-6">
        <AISearchBox
          onSearch={handleSearch}
          placeholder="Search for properties, services, vehicles... (AI-powered)"
          className="mb-4"
        />

        <div className="flex items-center justify-between">
          <button
            onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
            className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500"
          >
            <svg className="h-4 w-4 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4"
              />
            </svg>
            {showAdvancedFilters ? "Hide" : "Show"} Advanced Filters
          </button>

          <div className="flex items-center space-x-2">
            <select
              value={filters.sortBy || "createdAt:desc"}
              onChange={(e) => setFilters((prev: ExtendedListingFilters) => ({ ...prev, sortBy: e.target.value }))}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              <option value="createdAt:desc">Newest First</option>
              <option value="createdAt:asc">Oldest First</option>
              <option value="price:asc">Price: Low to High</option>
              <option value="price:desc">Price: High to Low</option>
              <option value="title:asc">Title: A to Z</option>
              <option value="title:desc">Title: Z to A</option>
            </select>
          </div>
        </div>
      </div>

      {/* Advanced Filters */}
      {showAdvancedFilters && (
        <AdvancedFilters
          filters={filters}
          onFiltersChange={handleFiltersChange}
          onApplyFilters={handleAdvancedFiltersApply}
          className="mb-6"
        />
      )}

      {/* Results Summary */}
      {listingsData && (
        <div className="mb-6 flex items-center justify-between">
          <div className="text-sm text-gray-600">
            Showing {listingsData.listings.length} of {listingsData.total} results
            {filters.query && <span> for "{filters.query}"</span>}
          </div>

          {listingsData.total > 0 && (
            <div className="text-sm text-gray-600">
              Page {listingsData.page} of {Math.ceil(listingsData.total / (listingsData.limit || 12))}
            </div>
          )}
        </div>
      )}

      {/* Listings Grid */}
      <ListingsGrid
        listings={listingsData?.listings || []}
        loading={isLoading}
        error={error?.message || null}
        emptyMessage={
          filters.query
            ? `No listings found for "${filters.query}". Try adjusting your search criteria.`
            : "No listings available at the moment."
        }
      />

      {/* Pagination */}
      {listingsData && listingsData.total > (listingsData.limit || 12) && (
        <div className="mt-8 flex items-center justify-center space-x-2">
          <button
            disabled={listingsData.page <= 1}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Previous
          </button>

          <div className="flex space-x-1">
            {Array.from({ length: Math.min(5, Math.ceil(listingsData.total / (listingsData.limit || 12))) }).map(
              (_, index) => {
                const pageNumber = index + 1
                const isActive = pageNumber === listingsData.page

                return (
                  <button
                    key={pageNumber}
                    className={`px-3 py-2 text-sm font-medium rounded-md ${
                      isActive
                        ? "bg-primary-600 text-white"
                        : "text-gray-500 bg-white border border-gray-300 hover:bg-gray-50"
                    }`}
                  >
                    {pageNumber}
                  </button>
                )
              },
            )}
          </div>

          <button
            disabled={listingsData.page >= Math.ceil(listingsData.total / (listingsData.limit || 12))}
            className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </div>
  )
}
