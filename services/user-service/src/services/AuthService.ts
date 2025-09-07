import * as jwt from "jsonwebtoken"
import { UserService } from "./UserService"
import { UserEntity } from "../models/User"
import { User, UserRole } from "@marketplace/shared-types"

export interface LoginRequest {
  email: string
  password: string
}

export interface RegisterRequest {
  email: string
  password: string
  phone?: string
  telegramId?: string
  profile: {
    firstName: string
    lastName: string
    location?: any
  }
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

export interface RefreshRequest {
  refreshToken: string
}

export interface TokenPayload {
  userId: string
  email: string
  role: UserRole
  type: "access" | "refresh"
}

export class AuthService {
  private readonly accessTokenSecret: string
  private readonly refreshTokenSecret: string
  private readonly accessTokenExpiry: string
  private readonly refreshTokenExpiry: string

  constructor(private userService: UserService) {
    this.accessTokenSecret = process.env.JWT_SECRET || "default-access-secret"
    this.refreshTokenSecret = process.env.JWT_REFRESH_SECRET || "default-refresh-secret"
    this.accessTokenExpiry = process.env.JWT_EXPIRES_IN || "15m"
    this.refreshTokenExpiry = process.env.JWT_REFRESH_EXPIRES_IN || "7d"

    if (process.env.NODE_ENV === "production") {
      if (
        this.accessTokenSecret === "default-access-secret" ||
        this.refreshTokenSecret === "default-refresh-secret"
      ) {
        throw new Error("JWT secrets must be set in production environment")
      }
    }
  }

  async login(loginData: LoginRequest): Promise<AuthResponse> {
    const { email, password } = loginData

    // Validate credentials using UserService
    const userEntity = await this.userService.validateUserCredentials(email, password)
    if (!userEntity) {
      throw new Error("Invalid email or password")
    }

    if (!userEntity.isActive) {
      throw new Error("Account is deactivated")
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(userEntity)
    const refreshToken = this.generateRefreshToken(userEntity)

    return {
      user: userEntity.toPublicUser(),
      accessToken,
      refreshToken,
    }
  }

  async register(registerData: RegisterRequest): Promise<AuthResponse> {
    // Create user using UserService
    const user = await this.userService.createUser({
      ...registerData,
      role: UserRole.USER, // Default role for registration
    })

    // Get the user entity for token generation
    const userEntity = await this.userService.validateUserCredentials(
      registerData.email,
      registerData.password
    )

    if (!userEntity) {
      throw new Error("Failed to create user account")
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(userEntity)
    const refreshToken = this.generateRefreshToken(userEntity)

    return {
      user,
      accessToken,
      refreshToken,
    }
  }

  async refreshTokens(refreshRequest: RefreshRequest): Promise<AuthResponse> {
    const { refreshToken } = refreshRequest

    try {
      // Verify refresh token
      const payload = jwt.verify(refreshToken, this.refreshTokenSecret) as TokenPayload

      if (payload.type !== "refresh") {
        throw new Error("Invalid token type")
      }

      // Get current user data
      const user = await this.userService.getUserById(payload.userId)
      if (!user || !user.isActive) {
        throw new Error("User not found or inactive")
      }

      // For refresh tokens, we need to get the user entity without password validation
      // We'll create a simple UserEntity from the user data
      const userEntity = new UserEntity(
        user.id,
        user.email,
        "", // We don't need the password hash for token generation
        user.role,
        user.profile,
        user.socialProfiles,
        user.primaryAuthProvider,
        user.phone,
        user.telegramId,
        user.isActive,
        user.createdAt,
        user.updatedAt
      )

      // Generate new tokens
      const newAccessToken = this.generateAccessToken(userEntity)
      const newRefreshToken = this.generateRefreshToken(userEntity)

      return {
        user,
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      }
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid refresh token")
      }
      throw error
    }
  }

  async validateAccessToken(token: string): Promise<TokenPayload> {
    try {
      const payload = jwt.verify(token, this.accessTokenSecret) as TokenPayload

      if (payload.type !== "access") {
        throw new Error("Invalid token type")
      }

      return payload
    } catch (error) {
      if (error instanceof jwt.JsonWebTokenError) {
        throw new Error("Invalid access token")
      }
      throw error
    }
  }

  private generateAccessToken(userEntity: UserEntity): string {
    const payload: TokenPayload = {
      userId: userEntity.id,
      email: userEntity.email,
      role: userEntity.role,
      type: "access",
    }

    return jwt.sign(payload, this.accessTokenSecret, {
      expiresIn: this.accessTokenExpiry as any,
      issuer: "marketplace-auth",
      audience: "marketplace-api",
    } as jwt.SignOptions)
  }

  private generateRefreshToken(userEntity: UserEntity): string {
    const payload: TokenPayload = {
      userId: userEntity.id,
      email: userEntity.email,
      role: userEntity.role,
      type: "refresh",
    }

    return jwt.sign(payload, this.refreshTokenSecret, {
      expiresIn: this.refreshTokenExpiry as any,
      issuer: "marketplace-auth",
      audience: "marketplace-api",
    } as jwt.SignOptions)
  }

  // Utility method to extract token from Authorization header
  static extractTokenFromHeader(authHeader: string | undefined): string | null {
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return null
    }
    return authHeader.substring(7) // Remove 'Bearer ' prefix
  }

  // Method to check if user has required role
  static hasRequiredRole(userRole: UserRole, requiredRoles: UserRole[]): boolean {
    return requiredRoles.includes(userRole)
  }

  // Method to check if user has admin privileges
  static isAdmin(userRole: UserRole): boolean {
    return userRole === UserRole.ADMIN
  }

  // Method to check if user has manager privileges
  static isManager(userRole: UserRole): boolean {
    return userRole === UserRole.MANAGER || userRole === UserRole.ADMIN
  }
}
