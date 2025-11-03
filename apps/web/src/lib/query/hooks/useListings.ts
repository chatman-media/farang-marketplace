import type {
  CreateListingRequest,
  CreateServiceListingRequest,
  ListingFilters,
  ServiceListingFilters,
  UpdateListingRequest,
  UpdateServiceListingRequest,
} from "@marketplace/shared-types"
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from "@tanstack/react-query"
import { listingsService, serviceListingsService } from "../../api"
import { queryKeys } from "../client"

// Get listings with pagination
export const useListings = (filters?: ListingFilters & { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: () => listingsService.getListings(filters),
  })
}

// Get infinite listings (for infinite scroll)
export const useInfiniteListings = (filters?: ListingFilters & { limit?: number }) => {
  return useInfiniteQuery({
    queryKey: queryKeys.listings.list(filters),
    queryFn: ({ pageParam = 1 }) => listingsService.getListings({ ...filters, page: pageParam }),
    getNextPageParam: (lastPage) => {
      return lastPage.hasMore ? lastPage.page + 1 : undefined
    },
    initialPageParam: 1,
  })
}

// Get single listing
export const useListing = (id: string) => {
  return useQuery({
    queryKey: queryKeys.listings.detail(id),
    queryFn: () => listingsService.getListing(id),
    enabled: !!id,
  })
}

// Get featured listings
export const useFeaturedListings = (limit?: number) => {
  return useQuery({
    queryKey: queryKeys.listings.featured(limit),
    queryFn: () => listingsService.getFeaturedListings(limit),
  })
}

// Search listings
export const useSearchListings = (query: string, filters?: ListingFilters) => {
  return useQuery({
    queryKey: queryKeys.listings.search(query, filters),
    queryFn: () => listingsService.searchListings(query, filters),
    enabled: !!query.trim(),
  })
}

// Get user's listings
export const useUserListings = (userId: string) => {
  return useQuery({
    queryKey: queryKeys.listings.userListings(userId),
    queryFn: () => listingsService.getUserListings(userId),
    enabled: !!userId,
  })
}

// Create listing mutation
export const useCreateListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingData: CreateListingRequest) => listingsService.createListing(listingData),
    onSuccess: () => {
      // Invalidate listings queries
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}

// Update listing mutation
export const useUpdateListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateListingRequest }) => listingsService.updateListing(id, data),
    onSuccess: (_, { id }) => {
      // Invalidate specific listing and lists
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}

// Delete listing mutation
export const useDeleteListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => listingsService.deleteListing(id),
    onSuccess: (_, id) => {
      // Remove from cache and invalidate lists
      queryClient.removeQueries({ queryKey: queryKeys.listings.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.all })
    },
  })
}

// Upload listing images mutation
export const useUploadListingImages = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ listingId, files }: { listingId: string; files: File[] }) =>
      listingsService.uploadListingImages(listingId, files),
    onSuccess: (_, { listingId }) => {
      // Invalidate the specific listing
      queryClient.invalidateQueries({ queryKey: queryKeys.listings.detail(listingId) })
    },
  })
}

// Real estate hooks removed - will be added later when system stabilizes

// Service Listings hooks
export const useServiceListings = (filters?: ServiceListingFilters & { page?: number; limit?: number }) => {
  return useQuery({
    queryKey: queryKeys.serviceListings.list(filters),
    queryFn: () => serviceListingsService.getServiceListings(filters),
  })
}

export const useServiceListing = (id: string) => {
  return useQuery({
    queryKey: queryKeys.serviceListings.detail(id),
    queryFn: () => serviceListingsService.getServiceListing(id),
    enabled: !!id,
  })
}

export const useSearchServiceListings = (query: string, filters?: ServiceListingFilters) => {
  return useQuery({
    queryKey: queryKeys.serviceListings.search(query, filters),
    queryFn: () => serviceListingsService.searchServiceListings(query, filters),
    enabled: !!query.trim(),
  })
}

export const useCreateServiceListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingData: CreateServiceListingRequest) => serviceListingsService.createServiceListing(listingData),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceListings.all })
    },
  })
}

export const useUpdateServiceListing = () => {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (listingData: UpdateServiceListingRequest) => serviceListingsService.updateServiceListing(listingData),
    onSuccess: (_, { id }) => {
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceListings.detail(id) })
      queryClient.invalidateQueries({ queryKey: queryKeys.serviceListings.all })
    },
  })
}
