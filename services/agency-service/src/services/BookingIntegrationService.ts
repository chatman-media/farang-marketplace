import { AgencyService } from "./AgencyService"
import { AgencyServiceService } from "./AgencyServiceService"
import { ServiceAssignmentService } from "./ServiceAssignmentService"

export interface BookingServiceRequest {
  bookingId: string
  listingId: string
  userId: string
  serviceType: string
  requestedDate: Date
  location: {
    address: string
    city: string
    coordinates?: {
      latitude: number
      longitude: number
    }
  }
  requirements?: string[]
  budget?: {
    min: number
    max: number
    currency: string
  }
}

export interface AgencyServiceMatch {
  agencyId: string
  agencyName: string
  serviceId: string
  serviceName: string
  basePrice: number
  commissionRate: number
  estimatedTotal: number
  commissionAmount: number
  distance?: number
  rating: number
  responseTime: number
  availability: boolean
  matchScore: number
}

export interface ServiceAssignmentResult {
  assignmentId: string
  agencyId: string
  serviceId: string
  estimatedPrice: number
  commissionAmount: number
  status: "pending" | "confirmed" | "rejected"
  estimatedCompletion?: Date
}

export class BookingIntegrationService {
  private serviceAssignmentService: ServiceAssignmentService
  private agencyServiceService: AgencyServiceService
  private agencyService: AgencyService

  constructor() {
    this.serviceAssignmentService = new ServiceAssignmentService()
    this.agencyServiceService = new AgencyServiceService()
    this.agencyService = new AgencyService()
  }

  /**
   * Find matching agencies for a booking request
   */
  async findMatchingAgencies(request: BookingServiceRequest): Promise<AgencyServiceMatch[]> {
    try {
      // Search for services matching the request
      const serviceResults = await this.agencyServiceService.searchServices(
        {
          category: request.serviceType as any,
          isActive: true,
          search: request.requirements?.join(" "),
        },
        {
          page: 1,
          limit: 50,
          sortBy: "basePrice",
          sortOrder: "asc",
        },
      )

      const matches: AgencyServiceMatch[] = []

      for (const service of serviceResults.services) {
        if (!service.agencyName) continue

        // Get agency details
        const agency = await this.agencyService.getAgencyById(service.agencyId)
        if (!agency || agency.status !== "active" || !agency.isVerified) {
          continue
        }

        // Calculate pricing
        const basePrice = Number(service.basePrice)
        const commissionRate = Number(agency.commissionRate)
        const commissionAmount = basePrice * commissionRate
        const estimatedTotal = basePrice + commissionAmount

        // Check budget constraints
        if (request.budget) {
          if (estimatedTotal < request.budget.min || estimatedTotal > request.budget.max) {
            continue
          }
        }

        // Calculate distance (simplified - in real implementation would use geolocation)
        const distance = this.calculateDistance(
          request.location.coordinates,
          (agency.primaryLocation as any)?.coordinates,
        )

        // Calculate match score
        const matchScore = this.calculateMatchScore({
          service,
          agency,
          request,
          distance,
          price: estimatedTotal,
        })

        matches.push({
          agencyId: agency.id,
          agencyName: agency.name,
          serviceId: service.id,
          serviceName: service.name,
          basePrice,
          commissionRate,
          estimatedTotal,
          commissionAmount,
          distance,
          rating: Number(agency.rating),
          responseTime: 2, // Mock response time in hours
          availability: true, // Mock availability
          matchScore,
        })
      }

      // Sort by match score (highest first)
      return matches.sort((a, b) => b.matchScore - a.matchScore)
    } catch (error) {
      console.error("Error finding matching agencies:", error)
      throw new Error("Failed to find matching agencies")
    }
  }

  /**
   * Assign service to agency
   */
  async assignServiceToAgency(
    bookingRequest: BookingServiceRequest,
    agencyMatch: AgencyServiceMatch,
  ): Promise<ServiceAssignmentResult> {
    try {
      // Create service assignment
      const assignment = await this.serviceAssignmentService.createAssignment({
        agencyId: agencyMatch.agencyId,
        agencyServiceId: agencyMatch.serviceId,
        listingId: bookingRequest.listingId,
        bookingId: bookingRequest.bookingId,
        servicePrice: agencyMatch.estimatedTotal,
        commissionRate: agencyMatch.commissionRate,
        currency: bookingRequest.budget?.currency || "THB",
      })

      return {
        assignmentId: assignment.id,
        agencyId: agencyMatch.agencyId,
        serviceId: agencyMatch.serviceId,
        estimatedPrice: agencyMatch.estimatedTotal,
        commissionAmount: agencyMatch.commissionAmount,
        status: "pending",
        estimatedCompletion: this.calculateEstimatedCompletion(bookingRequest.requestedDate),
      }
    } catch (error) {
      console.error("Error assigning service to agency:", error)
      throw new Error("Failed to assign service to agency")
    }
  }

  /**
   * Auto-assign best matching agency
   */
  async autoAssignBestMatch(request: BookingServiceRequest): Promise<ServiceAssignmentResult | null> {
    try {
      const matches = await this.findMatchingAgencies(request)

      if (matches.length === 0) {
        return null
      }

      // Get the best match (highest score)
      const bestMatch = matches[0]
      if (!bestMatch) {
        return null
      }

      return await this.assignServiceToAgency(request, bestMatch)
    } catch (error) {
      console.error("Error auto-assigning best match:", error)
      throw new Error("Failed to auto-assign service")
    }
  }

  /**
   * Calculate commission for completed service
   */
  async calculateCommission(
    assignmentId: string,
    finalPrice: number,
  ): Promise<{
    commissionAmount: number
    agencyEarnings: number
    platformFee: number
  }> {
    try {
      const assignment = await this.serviceAssignmentService.getAssignmentById(assignmentId)
      if (!assignment) {
        throw new Error("Assignment not found")
      }

      const commissionRate = Number(assignment.commissionRate)
      const commissionAmount = finalPrice * commissionRate
      const agencyEarnings = finalPrice - commissionAmount
      const platformFee = commissionAmount * 0.1 // 10% platform fee

      return {
        commissionAmount,
        agencyEarnings,
        platformFee,
      }
    } catch (error) {
      console.error("Error calculating commission:", error)
      throw new Error("Failed to calculate commission")
    }
  }

  /**
   * Get service assignment status
   */
  async getAssignmentStatus(assignmentId: string): Promise<{
    status: string
    progress: number
    estimatedCompletion?: Date
    actualCompletion?: Date
    customerRating?: number
    agencyNotes?: string
  }> {
    try {
      const assignment = await this.serviceAssignmentService.getAssignmentById(assignmentId)
      if (!assignment) {
        throw new Error("Assignment not found")
      }

      let progress = 0
      switch (assignment.status) {
        case "active":
          progress = 25
          break
        case "paused":
          progress = 50
          break
        case "completed":
          progress = 100
          break
        case "cancelled":
          progress = 0
          break
      }

      return {
        status: assignment.status,
        progress,
        estimatedCompletion: assignment.completedAt || undefined,
        actualCompletion: assignment.completedAt || undefined,
        customerRating: assignment.customerRating ? Number(assignment.customerRating) : undefined,
        agencyNotes: assignment.agencyNotes || undefined,
      }
    } catch (error) {
      console.error("Error getting assignment status:", error)
      throw new Error("Failed to get assignment status")
    }
  }

  /**
   * Calculate distance between two coordinates (simplified)
   */
  private calculateDistance(
    coord1?: { latitude: number; longitude: number },
    coord2?: { latitude: number; longitude: number },
  ): number {
    if (!coord1 || !coord2) return 999 // Default high distance

    const R = 6371 // Earth's radius in km
    const dLat = ((coord2.latitude - coord1.latitude) * Math.PI) / 180
    const dLon = ((coord2.longitude - coord1.longitude) * Math.PI) / 180
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos((coord1.latitude * Math.PI) / 180) *
        Math.cos((coord2.latitude * Math.PI) / 180) *
        Math.sin(dLon / 2) *
        Math.sin(dLon / 2)
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
    return R * c
  }

  /**
   * Calculate match score for agency-service combination
   */
  private calculateMatchScore(params: {
    service: any
    agency: any
    request: BookingServiceRequest
    distance: number
    price: number
  }): number {
    let score = 0

    // Rating weight (40%)
    score += (Number(params.agency.rating) / 5) * 40

    // Distance weight (30%) - closer is better
    const maxDistance = 50 // km
    const distanceScore = Math.max(0, (maxDistance - params.distance) / maxDistance)
    score += distanceScore * 30

    // Price weight (20%) - lower is better (within budget)
    if (params.request.budget) {
      const budgetRange = params.request.budget.max - params.request.budget.min
      const pricePosition = (params.price - params.request.budget.min) / budgetRange
      const priceScore = Math.max(0, 1 - pricePosition)
      score += priceScore * 20
    } else {
      score += 15 // Default score if no budget specified
    }

    // Availability weight (10%)
    score += 10 // Assume available for now

    return Math.round(score)
  }

  /**
   * Calculate estimated completion date
   */
  private calculateEstimatedCompletion(requestedDate: Date): Date {
    const completion = new Date(requestedDate)
    completion.setHours(completion.getHours() + 24) // Add 24 hours
    return completion
  }
}
