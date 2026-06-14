/**
 * Public in-process pricing API for the listing module.
 *
 * Consumed directly by other modules (e.g. booking) instead of an HTTP call.
 *
 * NOTE: the listing service does not yet expose real per-listing pricing, so
 * these return sensible THB defaults — the same values booking used to fall
 * back to when the (non-existent) pricing endpoint was unreachable. Replace the
 * bodies with DB-backed lookups when real listing pricing lands; the signatures
 * are the stable contract.
 */

export interface ListingPricing {
  nightlyRate: number
  cleaningFee?: number
  securityDeposit?: number
  hourlyRate?: number
  dailyRate?: number
  weeklyRate?: number
  monthlyRate?: number
  currency: string
}

export interface ServicePricing {
  serviceType: string
  priceType: "hourly" | "fixed" | "daily" | "project"
  basePrice: number
  hourlyRate?: number
  fixedPrice?: number
  dailyRate?: number
  minimumCharge?: number
  currency: string
}

export async function getListingPricing(_listingId: string): Promise<ListingPricing> {
  // TODO: query listing pricing from the database once it exists.
  return {
    nightlyRate: 1500, // default THB per night
    cleaningFee: 300,
    securityDeposit: 2000,
    currency: "THB",
  }
}

export async function getServicePricing(_listingId: string, serviceType: string): Promise<ServicePricing> {
  // TODO: query the service provider's pricing from the database once it exists.
  return {
    serviceType,
    priceType: "hourly",
    basePrice: 800,
    hourlyRate: 800,
    currency: "THB",
  }
}
