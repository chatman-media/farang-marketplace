export { UserEntity } from './models/User'
export { UserRepository } from './repositories/UserRepository'
export { UserService } from './services/UserService'
export { runMigrations } from './database/migrate'
export { pool, query, getClient } from './database/connection'

// Re-export types from shared-types for convenience
export type { User, UserRole, UserProfile, VerificationStatus } from '@marketplace/shared-types'
