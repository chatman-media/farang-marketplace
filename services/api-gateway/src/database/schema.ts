// Export centralized schema for api-gateway
export {
  apiRequestLogs,
  apiResponseLogs,
  auditLogs,
} from "@marketplace/database-schema"

// Re-export other relevant schema items that api-gateway might need
export type {
  ApiRequestLog,
  ApiResponseLog,
  AuditLog,
} from "@marketplace/database-schema"
