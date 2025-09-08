import { FastifyRequest, FastifyReply } from "fastify"
import { UserService } from "../services/UserService"
import { z } from "zod"
import { UserRole, VerificationStatus } from "@marketplace/shared-types"
import multer from "multer"
import path from "path"
import fs from "fs/promises"

// Validation schemas
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, "First name is required").max(50).optional(),
  lastName: z.string().min(1, "Last name is required").max(50).optional(),
  avatar: z.string().url().optional(),
  location: z
    .object({
      latitude: z.number(),
      longitude: z.number(),
      address: z.string(),
      city: z.string(),
      country: z.string(),
      region: z.string(),
    })
    .optional(),
})

const VerificationRequestSchema = z.object({
  documents: z.array(z.string()).min(1, "At least one document is required"),
  notes: z.string().optional(),
})

// Multer configuration for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, "uploads/profiles/")
  },
  filename: (req, file, cb) => {
    const userId = (req as any).user?.userId || "unknown"
    const timestamp = Date.now()
    const ext = path.extname(file.originalname)
    cb(null, `${userId}-${timestamp}${ext}`)
  },
})

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  // Accept only image files
  if (file.mimetype.startsWith("image/")) {
    cb(null, true)
  } else {
    cb(null, false)
  }
}

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time for avatar
  },
})

export class ProfileController {
  constructor(private userService: UserService) {}

  // Get current user's profile
  getProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const user = await this.userService.getUserById(req.user.userId)
      if (!user) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: user,
        message: "Profile retrieved successfully",
      })
    } catch {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Update current user's profile
  updateProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Validate request body
      const profileData = UpdateProfileSchema.parse(req.body)

      // Update user profile
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: profileData,
      })

      if (!updatedUser) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: updatedUser,
        message: "Profile updated successfully",
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const errorMessage = error instanceof Error ? error.message : "Profile update failed"
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Upload profile avatar
  uploadAvatar = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Handle Fastify multipart
      let data
      try {
        data = await req.file()
      } catch (error) {
        // No file uploaded
        return reply.status(400).send({
          error: {
            code: "FILE_REQUIRED",
            message: "Avatar image file is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      if (!data) {
        return reply.status(400).send({
          error: {
            code: "FILE_REQUIRED",
            message: "Avatar image file is required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Check file size first (5MB limit)
      const buffer = await data.toBuffer()
      if (buffer.length > 5 * 1024 * 1024) {
        return reply.status(400).send({
          error: {
            code: "FILE_TOO_LARGE",
            message: "File size must be less than 5MB",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Validate file type
      if (!data.mimetype.startsWith("image/")) {
        return reply.status(400).send({
          error: {
            code: "INVALID_FILE_TYPE",
            message: "Only image files are allowed",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Generate filename and save file
      const timestamp = Date.now()
      const ext = path.extname(data.filename || ".jpg")
      const filename = `${req.user.userId}-${timestamp}${ext}`
      const uploadDir = "uploads/profiles/"

      // Ensure upload directory exists
      await fs.mkdir(uploadDir, { recursive: true })

      // Save file
      const filePath = path.join(uploadDir, filename)
      await fs.writeFile(filePath, buffer)

      // Generate avatar URL (in production, this would be a CDN URL)
      const baseUrl = process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`
      const avatarUrl = `${baseUrl}/uploads/profiles/${filename}`

      // Update user profile with new avatar
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: { avatar: avatarUrl },
      })

      if (!updatedUser) {
        // Clean up uploaded file if user update fails
        await fs.unlink(filePath).catch(() => {})
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: {
          user: updatedUser,
          avatarUrl,
        },
        message: "Avatar uploaded successfully",
      })
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : "Avatar upload failed"
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Request user verification
  requestVerification = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Validate request body
      const verificationData = VerificationRequestSchema.parse(req.body)

      // Check if user exists
      const user = await this.userService.getUserById(req.user.userId)
      if (!user) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Check if user is already verified
      if (user.profile.verificationStatus === VerificationStatus.VERIFIED) {
        return reply.status(400).send({
          error: {
            code: "ALREADY_VERIFIED",
            message: "User is already verified",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Check if there's already a pending verification request
      if (user.profile.verificationStatus === VerificationStatus.PENDING) {
        return reply.status(400).send({
          error: {
            code: "VERIFICATION_PENDING",
            message: "Verification request is already pending",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Update user verification status and data
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: {
          ...user.profile,
          verificationStatus: VerificationStatus.PENDING,
        },
      })

      return reply.status(200).send({
        success: true,
        data: {
          user: updatedUser,
          verificationRequest: {
            status: VerificationStatus.PENDING,
            documents: verificationData.documents,
            notes: verificationData.notes,
            submittedAt: new Date(),
            submittedBy: req.user.userId,
          },
        },
        message: "Verification request submitted successfully",
      })
    } catch (error) {
      if (error instanceof z.ZodError) {
        return reply.status(400).send({
          error: {
            code: "VALIDATION_ERROR",
            message: "Invalid request data",
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Approve user verification (Admin/Manager only)
  approveVerification = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Check if user has admin or manager role
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MANAGER) {
        return reply.status(403).send({
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Admin or Manager role required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const { userId } = req.params as any
      const user = await this.userService.getUserById(userId)

      if (!user) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Update user verification status to verified
      const updatedUser = await this.userService.updateUser(userId, {
        profile: {
          ...user.profile,
          verificationStatus: VerificationStatus.VERIFIED,
        },
      })

      if (!updatedUser) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: updatedUser,
        message: "User verification approved successfully",
      })
    } catch {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Reject user verification (Admin/Manager only)
  rejectVerification = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Check if user has admin or manager role
      if (req.user.role !== UserRole.ADMIN && req.user.role !== UserRole.MANAGER) {
        return reply.status(403).send({
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Admin or Manager role required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const { userId } = req.params as any
      const { reason } = req.body as any
      const user = await this.userService.getUserById(userId)

      if (!user) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      // Update user verification status to rejected
      const updatedUser = await this.userService.updateUser(userId, {
        profile: {
          ...user.profile,
          verificationStatus: VerificationStatus.REJECTED,
        },
      })

      if (!updatedUser) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: {
          user: updatedUser,
          rejection: {
            reason: reason,
            rejectedAt: new Date(),
            rejectedBy: req.user.userId,
          },
        },
        message: "User verification rejected successfully",
      })
    } catch {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }

  // Get user profile by ID (Admin/Manager or own profile)
  getUserProfile = async (req: FastifyRequest, reply: FastifyReply) => {
    try {
      if (!req.user) {
        return reply.status(401).send({
          error: {
            code: "AUTHENTICATION_REQUIRED",
            message: "Authentication required",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const { userId } = req.params as any

      // Check if user can access this profile
      const canAccess =
        req.user.userId === userId || req.user.role === UserRole.ADMIN || req.user.role === UserRole.MANAGER

      if (!canAccess) {
        return reply.status(403).send({
          error: {
            code: "INSUFFICIENT_PERMISSIONS",
            message: "Access denied",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      const user = await this.userService.getUserById(userId)
      if (!user) {
        return reply.status(404).send({
          error: {
            code: "USER_NOT_FOUND",
            message: "User not found",
            timestamp: new Date().toISOString(),
            requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          },
        })
      }

      return reply.status(200).send({
        success: true,
        data: user,
        message: "Profile retrieved successfully",
      })
    } catch {
      return reply.status(500).send({
        error: {
          code: "INTERNAL_SERVER_ERROR",
          message: "An unexpected error occurred",
          timestamp: new Date().toISOString(),
          requestId: req.headers["x-request-id"] || `req-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        },
      })
    }
  }
}

export { upload }
