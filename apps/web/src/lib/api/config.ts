// API Configuration
export const API_CONFIG = {
  // Base URL for the API Gateway
  BASE_URL: import.meta.env.VITE_API_BASE_URL || "http://localhost:3001",

  // Timeout for API requests (in milliseconds)
  TIMEOUT: 30000,

  // Default headers
  DEFAULT_HEADERS: {
    "Content-Type": "application/json",
    Accept: "application/json",
  },

  // Authentication
  AUTH: {
    TOKEN_KEY: "auth_token",
    REFRESH_TOKEN_KEY: "refresh_token",
    USER_KEY: "user_data",
  },

  // API Endpoints
  ENDPOINTS: {
    // Authentication
    AUTH: {
      LOGIN: "/api/auth/login",
      REGISTER: "/api/auth/register",
      REFRESH: "/api/auth/refresh",
      LOGOUT: "/api/auth/logout",
      PROFILE: "/api/auth/profile",
    },

    // Users
    USERS: {
      BASE: "/api/users",
      PROFILE: (id: string) => `/api/users/${id}/profile`,
      UPDATE: (id: string) => `/api/users/${id}`,
    },

    // Listings
    LISTINGS: {
      BASE: "/api/listings",
      BY_ID: (id: string) => `/api/listings/${id}`,
      SEARCH: "/api/listings/search",
      FEATURED: "/api/listings/featured",
      USER_LISTINGS: (userId: string) => `/api/listings/user/${userId}`,
    },

    // Real Estate
    REAL_ESTATE: {
      BASE: "/api/real-estate",
      BY_ID: (id: string) => `/api/real-estate/${id}`,
      SEARCH: "/api/real-estate/search",
      FEATURED: "/api/real-estate/featured",
    },

    // Service Providers
    SERVICE_PROVIDERS: {
      BASE: "/api/service-providers",
      BY_ID: (id: string) => `/api/service-providers/${id}`,
      SEARCH: "/api/service-providers/search",
      SERVICES: (id: string) => `/api/service-providers/${id}/services`,
    },

    // Bookings
    BOOKINGS: {
      BASE: "/api/bookings",
      BY_ID: (id: string) => `/api/bookings/${id}`,
      USER_BOOKINGS: (userId: string) => `/api/bookings/user/${userId}`,
      CREATE: "/api/bookings",
      UPDATE_STATUS: (id: string) => `/api/bookings/${id}/status`,
    },

    // Payments
    PAYMENTS: {
      BASE: "/api/payments",
      INITIATE: "/api/payments/initiate",
      STATUS: (id: string) => `/api/payments/${id}/status`,
      METHODS: "/api/payments/methods",
    },

    // Agencies
    AGENCIES: {
      BASE: "/api/agencies",
      BY_ID: (id: string) => `/api/agencies/${id}`,
      SERVICES: "/api/agency-services",
      SERVICE_BY_ID: (id: string) => `/api/agency-services/${id}`,
    },

    // AI Services
    AI: {
      SEARCH: "/api/ai/search",
      RECOMMENDATIONS: "/api/recommendations",
      SUGGESTIONS: "/api/ai/suggestions",
    },

    // Voice Services
    VOICE: {
      SPEECH_TO_TEXT: "/api/speech/transcribe",
      COMMANDS: "/api/voice/commands",
    },

    // CRM
    CRM: {
      CUSTOMERS: "/api/crm/customers",
      LEADS: "/api/crm/leads",
      COMMUNICATIONS: "/api/communications",
      CAMPAIGNS: "/api/campaigns",
    },
  },
} as const

// Environment-specific configurations
export const getApiConfig = () => {
  const env = import.meta.env.MODE || "development"

  switch (env) {
    case "production":
      return {
        ...API_CONFIG,
        BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://api.thailand-marketplace.com",
      }
    case "staging":
      return {
        ...API_CONFIG,
        BASE_URL: import.meta.env.VITE_API_BASE_URL || "https://staging-api.thailand-marketplace.com",
      }
    default:
      return API_CONFIG
  }
}
