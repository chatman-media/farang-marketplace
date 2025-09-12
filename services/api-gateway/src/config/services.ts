import { z } from "zod"

// Service configuration schema
export const ServiceConfigSchema = z.object({
  name: z.string(),
  url: z.string().url(),
  healthCheck: z.string(),
  timeout: z.number().default(30000),
  retries: z.number().default(3),
  circuitBreaker: z
    .object({
      enabled: z.boolean().default(true),
      threshold: z.number().default(5),
      timeout: z.number().default(60000),
    })
    .default({
      enabled: true,
      threshold: 5,
      timeout: 60000,
    }),
})

export type ServiceConfig = z.infer<typeof ServiceConfigSchema>

// Service registry configuration
export const servicesConfig: Record<string, ServiceConfig> = {
  "user-service": {
    name: "User Service",
    url: process.env.USER_SERVICE_URL || "http://localhost:3001",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "listing-service": {
    name: "Listing Service",
    url: process.env.LISTING_SERVICE_URL || "http://localhost:3003",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "payment-service": {
    name: "Payment Service",
    url: process.env.PAYMENT_SERVICE_URL || "http://localhost:3004",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "booking-service": {
    name: "Booking Service",
    url: process.env.BOOKING_SERVICE_URL || "http://localhost:3005",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "agency-service": {
    name: "Agency Service",
    url: process.env.AGENCY_SERVICE_URL || "http://localhost:3006",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "ai-service": {
    name: "AI Service",
    url: process.env.AI_SERVICE_URL || "http://localhost:3007",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "voice-service": {
    name: "Voice Service",
    url: process.env.VOICE_SERVICE_URL || "http://localhost:3008",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
  "crm-service": {
    name: "CRM Service",
    url: process.env.CRM_SERVICE_URL || "http://localhost:3009",
    healthCheck: "/health",
    timeout: 30000,
    retries: 3,
    circuitBreaker: {
      enabled: true,
      threshold: 5,
      timeout: 60000,
    },
  },
}

// Route mapping configuration
export const routeMapping: Record<string, string> = {
  "/api/auth/*": "user-service",
  "/api/users/*": "user-service",
  "/api/listings/*": "listing-service",
  "/api/real-estate/*": "listing-service",
  "/api/service-providers/*": "listing-service",
  "/api/payments/*": "payment-service",
  "/api/webhooks/payment/*": "payment-service",
  "/api/bookings/*": "booking-service",
  "/api/agencies/*": "agency-service",
  "/api/agency-services/*": "agency-service",
  "/api/ai/*": "ai-service",
  "/api/recommendations/*": "ai-service",
  "/api/voice/*": "voice-service",
  "/api/speech/*": "voice-service",
  "/api/crm/*": "crm-service",
  "/api/communications/*": "crm-service",
  "/api/campaigns/*": "crm-service",
}
