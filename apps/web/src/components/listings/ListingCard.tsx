import React from "react"
import { Link } from "react-router-dom"
import { Badge, Card } from "../ui"

// Extended type to handle API data structure
interface ApiListing {
  id: string
  title: string
  description: string
  category: string
  type?: string
  price: number | { amount: number; currency: string; period?: string }
  currency?: string
  location: {
    province?: string
    city?: string
    region?: string
    address?: string
  }
  images: string[]
  status?: string
  featured?: boolean
  rating?: number
  reviewCount?: number
  amenities?: string[]
  createdAt: string
  updatedAt?: string
}

interface ListingCardProps {
  listing: ApiListing
  className?: string
}

export const ListingCard: React.FC<ListingCardProps> = ({ listing, className = "" }) => {
  const formatPrice = (
    price: number | { amount: number; currency: string; period?: string },
    currency: string = "THB",
  ) => {
    if (typeof price === "object") {
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: price.currency,
        minimumFractionDigits: 0,
      }).format(price.amount)
    } else {
      return new Intl.NumberFormat("th-TH", {
        style: "currency",
        currency: listing.currency || currency,
        minimumFractionDigits: 0,
      }).format(price)
    }
  }

  const getStatusColor = (status?: string) => {
    return status === "active" ? "success" : "secondary"
  }

  const getPricePeriod = (price: number | { amount: number; currency: string; period?: string }) => {
    return typeof price === "object" ? price.period : undefined
  }

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "property":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
            />
          </svg>
        )
      case "vehicle":
        return (
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
        )
      case "service":
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2-2v2m8 0V6a2 2 0 012 2v6a2 2 0 01-2 2H8a2 2 0 01-2-2V8a2 2 0 012-2V6"
            />
          </svg>
        )
      default:
        return (
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        )
    }
  }

  return (
    <Card className={`group hover:shadow-lg transition-shadow duration-200 ${className}`}>
      <div className="relative">
        {/* Image */}
        <div className="aspect-w-16 aspect-h-9 bg-gray-200 rounded-t-lg overflow-hidden">
          {listing.images && listing.images.length > 0 ? (
            <img
              src={listing.images[0]}
              alt={listing.title}
              className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-200"
            />
          ) : (
            <div className="w-full h-48 bg-gray-200 flex items-center justify-center">
              <svg className="h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                />
              </svg>
            </div>
          )}
        </div>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <Badge variant={getStatusColor(listing.status)} size="sm">
            {listing.status === "active" ? "Active" : "Inactive"}
          </Badge>
        </div>

        {/* Featured Badge */}
        {listing.featured && (
          <div className="absolute top-3 left-3">
            <Badge variant="warning" size="sm">
              <svg className="h-3 w-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              Featured
            </Badge>
          </div>
        )}
      </div>

      <Card.Body>
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center space-x-2">
            <div className="text-gray-500">{getCategoryIcon(listing.category)}</div>
            <span className="text-sm text-gray-500 capitalize">{listing.category}</span>
          </div>
          <div className="text-right">
            <div className="text-lg font-semibold text-gray-900">{formatPrice(listing.price)}</div>
            {getPricePeriod(listing.price) && (
              <div className="text-xs text-gray-500">per {getPricePeriod(listing.price)}</div>
            )}
          </div>
        </div>

        <Link to={`/listings/${listing.id}`} className="block">
          <h3 className="text-lg font-medium text-gray-900 group-hover:text-primary-600 transition-colors duration-200 line-clamp-2 mb-2">
            {listing.title}
          </h3>
        </Link>

        <p className="text-gray-600 text-sm line-clamp-2 mb-3">{listing.description}</p>

        {/* Location */}
        {listing.location && (
          <div className="flex items-center text-sm text-gray-500 mb-3">
            <svg className="h-4 w-4 mr-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
              />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span className="truncate">
              {listing.location.address || `${listing.location.city}, ${listing.location.region}`}
            </span>
          </div>
        )}

        {/* Amenities */}
        {listing.amenities && listing.amenities.length > 0 && (
          <div className="flex flex-wrap gap-1 mb-3">
            {listing.amenities.slice(0, 3).map((amenity, index) => (
              <Badge key={index} variant="secondary" size="xs">
                {amenity}
              </Badge>
            ))}
            {listing.amenities.length > 3 && (
              <Badge variant="secondary" size="xs">
                +{listing.amenities.length - 3}
              </Badge>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-gray-100">
          <div className="flex items-center space-x-2">
            <div className="flex items-center space-x-1">
              <svg className="h-4 w-4 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-sm text-gray-600">
                {listing.rating?.toFixed(1) || "0.0"} ({listing.reviewCount || 0})
              </span>
            </div>
          </div>

          <div className="text-xs text-gray-500">{new Date(listing.createdAt).toLocaleDateString("th-TH")}</div>
        </div>
      </Card.Body>
    </Card>
  )
}
