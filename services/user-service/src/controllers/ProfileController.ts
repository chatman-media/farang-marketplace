import { Request, Response } from 'express';
import { UserService } from '../services/UserService';
import { z } from 'zod';
import { UserRole, VerificationStatus } from '@marketplace/shared-types';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';

// Validation schemas
const UpdateProfileSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50).optional(),
  lastName: z.string().min(1, 'Last name is required').max(50).optional(),
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
});

const VerificationRequestSchema = z.object({
  documents: z.array(z.string()).min(1, 'At least one document is required'),
  notes: z.string().optional(),
});

// File upload configuration
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = path.join(process.cwd(), 'uploads', 'profiles');
    try {
      await fs.mkdir(uploadDir, { recursive: true });
      cb(null, uploadDir);
    } catch (error) {
      cb(error as Error, uploadDir);
    }
  },
  filename: (req, file, cb) => {
    const userId = req.user?.userId || 'unknown';
    const timestamp = Date.now();
    const ext = path.extname(file.originalname);
    cb(null, `${userId}-${timestamp}${ext}`);
  },
});

const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Allow only image files
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files are allowed'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
    files: 1, // Only one file at a time for avatar
  },
});

export class ProfileController {
  constructor(private userService: UserService) {}

  // Get current user's profile
  getProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const user = await this.userService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Update current user's profile
  updateProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Validate request body
      const profileData = UpdateProfileSchema.parse(req.body);

      // Update user profile
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: profileData,
      });

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'Profile updated successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Profile update failed';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Upload profile avatar
  uploadAvatar = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      if (!req.file) {
        return res.status(400).json({
          error: {
            code: 'FILE_REQUIRED',
            message: 'Avatar image file is required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Generate avatar URL (in production, this would be a CDN URL)
      const baseUrl =
        process.env.BASE_URL || `http://localhost:${process.env.PORT || 3001}`;
      const avatarUrl = `${baseUrl}/uploads/profiles/${req.file.filename}`;

      // Update user profile with new avatar
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: { avatar: avatarUrl },
      });

      if (!updatedUser) {
        // Clean up uploaded file if user update fails
        await fs.unlink(req.file.path).catch(() => {});
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          avatarUrl,
        },
        message: 'Avatar uploaded successfully',
      });
    } catch (error) {
      // Clean up uploaded file on error
      if (req.file) {
        await fs.unlink(req.file.path).catch(() => {});
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Avatar upload failed';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Request user verification
  requestVerification = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Validate request body
      const verificationData = VerificationRequestSchema.parse(req.body);

      // Get current user
      const user = await this.userService.getUserById(req.user.userId);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Check if user is already verified
      if (user.profile.verificationStatus === VerificationStatus.VERIFIED) {
        return res.status(400).json({
          error: {
            code: 'ALREADY_VERIFIED',
            message: 'User is already verified',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Check if verification is already pending
      if (user.profile.verificationStatus === VerificationStatus.PENDING) {
        return res.status(400).json({
          error: {
            code: 'VERIFICATION_PENDING',
            message: 'Verification request is already pending',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Update verification status to pending
      const updatedUser = await this.userService.updateUser(req.user.userId, {
        profile: {
          ...user.profile,
          verificationStatus: VerificationStatus.PENDING,
        },
      });

      // In a real implementation, you would:
      // 1. Store verification documents
      // 2. Create a verification request record
      // 3. Notify administrators
      // 4. Send confirmation email to user

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          verificationRequest: {
            status: VerificationStatus.PENDING,
            documents: verificationData.documents,
            notes: verificationData.notes,
            submittedAt: new Date().toISOString(),
          },
        },
        message: 'Verification request submitted successfully',
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request data',
            details: error.issues,
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const errorMessage =
        error instanceof Error ? error.message : 'Verification request failed';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Admin/Manager endpoints for verification management
  approveVerification = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Check if user has permission to approve verifications
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.MANAGER
      ) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to approve verifications',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const { userId } = req.params;

      // Verify the user
      const updatedUser = await this.userService.verifyUser(userId);
      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: updatedUser,
        message: 'User verification approved successfully',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Verification approval failed';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Reject user verification
  rejectVerification = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Check if user has permission to reject verifications
      if (
        req.user.role !== UserRole.ADMIN &&
        req.user.role !== UserRole.MANAGER
      ) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to reject verifications',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const { userId } = req.params;
      const { reason } = req.body;

      // Get current user to preserve profile data
      const currentUser = await this.userService.getUserById(userId);
      if (!currentUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // Update verification status to rejected
      const updatedUser = await this.userService.updateUser(userId, {
        profile: {
          ...currentUser.profile,
          verificationStatus: VerificationStatus.REJECTED,
        },
      });

      if (!updatedUser) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      // In a real implementation, you would:
      // 1. Store rejection reason
      // 2. Send notification to user
      // 3. Log the action

      res.status(200).json({
        success: true,
        data: {
          user: updatedUser,
          rejection: {
            reason,
            rejectedAt: new Date().toISOString(),
            rejectedBy: req.user.userId,
          },
        },
        message: 'User verification rejected successfully',
      });
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Verification rejection failed';
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: errorMessage,
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Get user profile by ID (for admins/managers)
  getUserProfile = async (req: Request, res: Response) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          error: {
            code: 'AUTHENTICATION_REQUIRED',
            message: 'Authentication required',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const { userId } = req.params;

      // Check if user can access this profile
      const canAccess =
        req.user.userId === userId ||
        req.user.role === UserRole.ADMIN ||
        req.user.role === UserRole.MANAGER;

      if (!canAccess) {
        return res.status(403).json({
          error: {
            code: 'INSUFFICIENT_PERMISSIONS',
            message: 'Insufficient permissions to access this profile',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      const user = await this.userService.getUserById(userId);
      if (!user) {
        return res.status(404).json({
          error: {
            code: 'USER_NOT_FOUND',
            message: 'User not found',
            timestamp: new Date().toISOString(),
            requestId: req.headers['x-request-id'] || 'unknown',
          },
        });
      }

      res.status(200).json({
        success: true,
        data: user,
        message: 'Profile retrieved successfully',
      });
    } catch {
      res.status(500).json({
        error: {
          code: 'INTERNAL_SERVER_ERROR',
          message: 'An unexpected error occurred',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    }
  };

  // Multer middleware for avatar upload
  static getUploadMiddleware() {
    return upload.single('avatar');
  }
}
