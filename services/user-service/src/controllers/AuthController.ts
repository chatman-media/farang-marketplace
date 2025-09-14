import { FastifyReply, FastifyRequest } from "fastify"
import { z } from "zod"
import { AuthService, LoginRequest, RefreshRequest, RegisterRequest } from "../services/AuthService"

// Validation schemas for request bodies
const LoginSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(1, "Password is required"),
})

const RegisterSchema = z.object({
  email: z.string().email("Invalid email format"),
  password: z.string().min(8, "Password must be at least 8 characters"),
  phone: z
    .string()
    .regex(/^\+?[1-9]\d{6,14}$/, "Invalid international phone format")
    .optional(),
  telegramId: z.string().optional(),
  profile: z.object({
    firstName: z.string().min(1, "First name is required").max(50),
    lastName: z.string().min(1, "Last name is required").max(50),
    location: z
      .object({
        latitude: z.number(),
        longitude: z.number(),
        address: z.string().optional(),
        city: z.string().optional(),
        country: z.string().optional(),
      })
      .optional(),
  }),
})

const RefreshTokenSchema = z.object({
  refreshToken: z.string().min(1, "Refresh token is required"),
})

export class AuthController {
  constructor(private authService: AuthService) {}

  login = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const loginData = LoginSchema.parse(req.body) as LoginRequest

      // Authenticate user
      const authResponse = await this.authService.login(loginData)

      return reply.status(200).send({
        success: true,
        data: authResponse,
        message: "Login successful",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Login failed"

      // Check for specific error types
      if (errorMessage.includes("Invalid email or password") || errorMessage.includes("Account is deactivated")) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_FAILED",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Generic server error
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      })
    }
  }

  register = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const registerData = RegisterSchema.parse(req.body) as RegisterRequest

      // Register user
      const authResponse = await this.authService.register(registerData)

      return reply.status(201).send({
        success: true,
        data: authResponse,
        message: "Registration successful",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Registration failed"

      // Check for specific error types
      if (errorMessage.includes("already exists")) {
        return reply.status(409).send({
          error: {
            code: "CONFLICT",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Generic server error
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      })
    }
  }

  refreshToken = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      // Validate request body
      const refreshData = RefreshTokenSchema.parse(req.body) as RefreshRequest

      // Refresh tokens
      const authResponse = await this.authService.refreshTokens(refreshData)

      return reply.status(200).send({
        success: true,
        data: authResponse,
        message: "Token refresh successful",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Token refresh failed"

      // Check for specific error types
      if (errorMessage.includes("Invalid") || errorMessage.includes("expired")) {
        return reply.status(401).send({
          error: {
            code: "INVALID_REFRESH_TOKEN",
            message: errorMessage,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Validation errors
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Generic server error
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      })
    }
  }

  // Get current user profile (requires authentication)
  getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      // Get user data (this would typically come from UserService)
      // For now, we'll return the token payload data
      return reply.status(200).send({
        success: true,
        data: {
          userId: req.user.userId,
          email: req.user.email,
          role: req.user.role,
        },
        message: "Profile retrieved successfully",
      })
    } catch (error) {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      })
    }
  }

  // Logout endpoint (for client-side token cleanup)
  logout = async (_req: FastifyRequest, reply: FastifyReply) => {
    // In a stateless JWT implementation, logout is typically handled client-side
    // by removing the tokens from storage. However, we can provide this endpoint
    // for consistency and future token blacklisting if needed.

    return reply.status(200).send({
      success: true,
      message: "Logout successful",
    })
  }

  // Validate token endpoint (for other services to validate tokens)
  validateToken = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      const authHeader = req.headers.authorization
      const token = AuthService.extractTokenFromHeader(authHeader)

      if (!token) {
        return reply.status(400).send({
          error: {
            code: "MISSING_TOKEN",
            message: "Access token is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || "unknown",
          },
        })
      }

      const payload = await this.authService.validateAccessToken(token)

      return reply.status(200).send({
        success: true,
        data: {
          valid: true,
          payload,
        },
        message: "Token is valid",
      })
    } catch (error) {
      return reply.status(401).send({
        error: {
          code: "INVALID_TOKEN",
          message: "Token validation failed",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || "unknown",
        },
      })
    }
  }
}
