// Review and Rating System Types

export enum ReviewType {
  LISTING = "listing",
  SERVICE = "service",
  USER = "user",
  PROVIDER = "provider",
}

export enum ReviewStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  FLAGGED = "flagged",
  HIDDEN = "hidden",
}

export enum RatingCategory {
  OVERALL = "overall",
  CLEANLINESS = "cleanliness",
  ACCURACY = "accuracy",
  COMMUNICATION = "communication",
  LOCATION = "location",
  VALUE = "value",
  SERVICE_QUALITY = "service_quality",
  PROFESSIONALISM = "professionalism",
  TIMELINESS = "timeliness",
  EXPERTISE = "expertise",
}

export enum ReportReason {
  INAPPROPRIATE_CONTENT = "inappropriate_content",
  SPAM = "spam",
  FAKE_REVIEW = "fake_review",
  PERSONAL_ATTACK = "personal_attack",
  DISCRIMINATION = "discrimination",
  COPYRIGHT_VIOLATION = "copyright_violation",
  OTHER = "other",
}

// Core Review Interface
export interface Review {
  id: string
  type: ReviewType
  targetId: string // ID of listing, service, user, or provider
  reviewerId: string
  reviewerName: string
  reviewerAvatar?: string
  bookingId?: string
  rating: number // 1-5 scale
  title?: string
  content: string
  ratings: Record<RatingCategory, number>
  photos?: string[]
  isVerified: boolean
  isAnonymous: boolean
  status: ReviewStatus
  helpfulCount: number
  reportCount: number
  response?: ReviewResponse
  createdAt: string
  updatedAt: string
  moderatedAt?: string
  moderatedBy?: string
}

// Review Response from Host/Provider
export interface ReviewResponse {
  id: string
  reviewId: string
  responderId: string
  responderName: string
  content: string
  createdAt: string
  updatedAt: string
}

// Rating Summary
export interface RatingSummary {
  targetId: string
  targetType: ReviewType
  averageRating: number
  totalReviews: number
  ratingDistribution: Record<number, number> // rating -> count
  categoryAverages: Record<RatingCategory, number>
  verifiedReviewsCount: number
  recentReviewsCount: number // last 30 days
}

// Review Filters
export interface ReviewFilters {
  type?: ReviewType
  status?: ReviewStatus
  rating?: {
    min: number
    max: number
  }
  isVerified?: boolean
  hasPhotos?: boolean
  dateRange?: {
    startDate: string
    endDate: string
  }
  reviewerId?: string
  targetId?: string
  sortBy?: "newest" | "oldest" | "highest_rating" | "lowest_rating" | "most_helpful"
}

// Create Review Request
export interface CreateReviewRequest {
  type: ReviewType
  targetId: string
  bookingId?: string
  rating: number
  title?: string
  content: string
  ratings: Record<RatingCategory, number>
  photos?: string[]
  isAnonymous?: boolean
}

// Update Review Request
export interface UpdateReviewRequest {
  id: string
  rating?: number
  title?: string
  content?: string
  ratings?: Partial<Record<RatingCategory, number>>
  photos?: string[]
}

// Review Response Request
export interface CreateReviewResponseRequest {
  reviewId: string
  content: string
}

export interface UpdateReviewResponseRequest {
  id: string
  content: string
}

// Review Report
export interface ReviewReport {
  id: string
  reviewId: string
  reporterId: string
  reason: ReportReason
  description?: string
  status: "pending" | "reviewed" | "resolved" | "dismissed"
  createdAt: string
  resolvedAt?: string
  resolvedBy?: string
}

export interface CreateReviewReportRequest {
  reviewId: string
  reason: ReportReason
  description?: string
}

// Review Moderation
export interface ReviewModerationAction {
  id: string
  reviewId: string
  moderatorId: string
  action: "approve" | "reject" | "flag" | "hide" | "edit"
  reason?: string
  notes?: string
  createdAt: string
}

export interface ModerateReviewRequest {
  reviewId: string
  action: "approve" | "reject" | "flag" | "hide"
  reason?: string
  notes?: string
}

// Review Analytics
export interface ReviewAnalytics {
  targetId: string
  targetType: ReviewType
  totalReviews: number
  averageRating: number
  ratingTrend: {
    period: string
    averageRating: number
    reviewCount: number
  }[]
  categoryBreakdown: Record<
    RatingCategory,
    {
      average: number
      count: number
    }
  >
  sentimentAnalysis?: {
    positive: number
    neutral: number
    negative: number
  }
  commonKeywords?: {
    keyword: string
    frequency: number
    sentiment: "positive" | "neutral" | "negative"
  }[]
}

// Response Types
export interface ReviewApiResponse {
  review: Review
  success: boolean
  message?: string
}

export interface ReviewsListResponse {
  reviews: Review[]
  summary: RatingSummary
  total: number
  page: number
  limit: number
  hasMore: boolean
}

export interface ReviewResponseApiResponse {
  response: ReviewResponse
  success: boolean
  message?: string
}

export interface ReviewReportApiResponse {
  report: ReviewReport
  success: boolean
  message?: string
}

// Helpful Vote
export interface ReviewHelpfulVote {
  id: string
  reviewId: string
  userId: string
  isHelpful: boolean
  createdAt: string
}

export interface VoteReviewHelpfulRequest {
  reviewId: string
  isHelpful: boolean
}

// Validation Constants
export const REVIEW_VALIDATION = {
  RATING: {
    MIN: 1,
    MAX: 5,
  },
  TITLE: {
    MIN_LENGTH: 5,
    MAX_LENGTH: 100,
  },
  CONTENT: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 2000,
  },
  PHOTOS: {
    MAX_COUNT: 10,
    MAX_SIZE_MB: 5,
  },
  RESPONSE: {
    MIN_LENGTH: 10,
    MAX_LENGTH: 1000,
  },
  REPORT_DESCRIPTION: {
    MAX_LENGTH: 500,
  },
  MODERATION_NOTES: {
    MAX_LENGTH: 1000,
  },
} as const

// Review Permissions
export interface ReviewPermissions {
  canCreate: boolean
  canEdit: boolean
  canDelete: boolean
  canRespond: boolean
  canReport: boolean
  canModerate: boolean
  canVoteHelpful: boolean
}

// Review Notification Settings
export interface ReviewNotificationSettings {
  newReview: boolean
  reviewResponse: boolean
  helpfulVote: boolean
  reviewModerated: boolean
  reviewReported: boolean
}
