export { UserEntity } from "./models/User"
export { UserRepository } from "./repositories/UserRepository"
export { UserService } from "./services/UserService"
export { AuthService } from "./services/AuthService"
export { OAuthService } from "./services/OAuthService"
export { AuthController } from "./controllers/AuthController"
export { OAuthController } from "./controllers/OAuthController"
export { AuthMiddleware, authErrorHandler } from "./middleware/auth"
export { runMigrations } from "./database/migrate"
export { pool, query, getClient } from "./database/connection"

// Re-export types from shared-types for convenience
export type {
  User,
  UserRole,
  UserProfile,
  VerificationStatus,
  AuthProvider,
  SocialProfile,
} from "@marketplace/shared-types"

// Export auth-related types
export type {
  LoginRequest,
  RegisterRequest,
  RefreshRequest,
  AuthResponse,
  TokenPayload,
} from "./services/AuthService"
