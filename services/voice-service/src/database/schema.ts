// Voice Service Schema - Uses centralized schema from @marketplace/database-schema
// Since we're using the centralized schema, we'll create local aliases for type safety
import type {
  apiRequestLogs as apiRequestLogsType,
  apiResponseLogs as apiResponseLogsType,
  auditLogs as auditLogsType,
} from "@marketplace/database-schema"
import type {
  ApiRequestLog as ApiRequestLogType,
  ApiResponseLog as ApiResponseLogType,
  AuditLog as AuditLogType,
} from "@marketplace/database-schema"

// Export types only - the actual tables will be imported from centralized schema
export type ApiRequestLog = ApiRequestLogType
export type ApiResponseLog = ApiResponseLogType
export type AuditLog = AuditLogType

// Export table names as constants for usage
export const apiRequestLogs = "api_request_logs" as const
export const apiResponseLogs = "api_response_logs" as const
export const auditLogs = "audit_logs" as const
