import React, { useState } from "react"
import { Button, Input, Card } from "../ui"

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

interface SearchFiltersProps {
  filters: ExtendedListingFilters
  onFiltersChange: (filters: ExtendedListingFilters) => void
  onSearch: () => void
  loading?: boolean
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFiltersChange,
  onSearch,
  loading = false,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false)

  const handleInputChange =
    (field: keyof ExtendedListingFilters) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
      const value = e.target.value
      onFiltersChange({
        ...filters,
        [field]: value === "" ? undefined : value,
      })
    }

  const handlePriceChange = (field: "minPrice" | "maxPrice") => (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value
    onFiltersChange({
      ...filters,
      [field]: value === "" ? undefined : parseFloat(value),
    })
  }

  const clearFilters = () => {
    onFiltersChange({
      query: "",
    })
  }

  const categories = [
    { value: "", label: "All Categories" },
    { value: "property", label: "Properties" },
    { value: "vehicle", label: "Vehicles" },
    { value: "service", label: "Services" },
  ]

  const sortOptions = [
    { value: "createdAt:desc", label: "Newest First" },
    { value: "createdAt:asc", label: "Oldest First" },
    { value: "price:asc", label: "Price: Low to High" },
    { value: "price:desc", label: "Price: High to Low" },
    { value: "title:asc", label: "Title: A to Z" },
    { value: "title:desc", label: "Title: Z to A" },
  ]

  return (
    <Card className="mb-6">
      <Card.Body>
        <div className="space-y-4">
          {/* Main Search */}
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                type="text"
                placeholder="Search listings..."
                value={filters.query || ""}
                onChange={handleInputChange("query")}
                leftIcon={
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                    />
                  </svg>
                }
              />
            </div>
            <Button onClick={onSearch} loading={loading}>
              Search
            </Button>
            <Button variant="outline" onClick={() => setShowAdvanced(!showAdvanced)}>
              {showAdvanced ? "Hide" : "Show"} Filters
            </Button>
          </div>

          {/* Quick Filters */}
          <div className="flex flex-wrap gap-2">
            <select
              value={filters.category || ""}
              onChange={handleInputChange("category")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {categories.map((category) => (
                <option key={category.value} value={category.value}>
                  {category.label}
                </option>
              ))}
            </select>

            <select
              value={filters.sortBy || "createdAt:desc"}
              onChange={handleInputChange("sortBy")}
              className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-primary-500 focus:border-primary-500"
            >
              {sortOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>

            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear All
            </Button>
          </div>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="border-t pt-4 space-y-4">
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

              {/* Additional Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tags</label>
                  <Input
                    type="text"
                    placeholder="Enter tags (comma separated)"
                    value={filters.tags?.join(", ") || ""}
                    onChange={(e) => {
                      const tags = e.target.value
                        .split(",")
                        .map((tag) => tag.trim())
                        .filter((tag) => tag.length > 0)
                      onFiltersChange({
                        ...filters,
                        tags: tags.length > 0 ? tags : undefined,
                      })
                    }}
                  />
                </div>

                <div className="flex items-end">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={filters.featured || false}
                      onChange={(e) =>
                        onFiltersChange({
                          ...filters,
                          featured: e.target.checked || undefined,
                        })
                      }
                      className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
                    />
                    <span className="ml-2 text-sm text-gray-700">Featured only</span>
                  </label>
                </div>
              </div>
            </div>
          )}
        </div>
      </Card.Body>
    </Card>
  )
}
