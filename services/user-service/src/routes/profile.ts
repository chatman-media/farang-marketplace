import { Router } from 'express';
import { ProfileController } from '../controllers/ProfileController';
import { UserService } from '../services/UserService';
import { UserRepository } from '../repositories/UserRepository';
import { AuthMiddleware } from '../middleware/auth';
import { authService } from './auth';

// Create router
const router = Router();

// Initialize dependencies
const userRepository = new UserRepository();
const userService = new UserService(userRepository);
const profileController = new ProfileController(userService);
const authMiddleware = new AuthMiddleware(authService);

// Multer error handler middleware
const handleMulterError = (error: any, req: any, res: any, next: any) => {
  if (error.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      error: {
        code: 'FILE_TOO_LARGE',
        message: 'File size exceeds the 5MB limit',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }

  if (error.message === 'Only image files are allowed') {
    return res.status(400).json({
      error: {
        code: 'INVALID_FILE_TYPE',
        message: 'Only image files are allowed',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }

  next(error);
};

// All profile routes require authentication
router.use(authMiddleware.requireAuth());

// Profile management routes
router.get('/', profileController.getProfile);
router.put('/', profileController.updateProfile);
router.post(
  '/avatar',
  ProfileController.getUploadMiddleware(),
  handleMulterError,
  profileController.uploadAvatar
);

// Verification routes
router.post('/verification/request', profileController.requestVerification);

// Admin/Manager routes for verification management
router.post(
  '/verification/:userId/approve',
  profileController.approveVerification
);
router.post(
  '/verification/:userId/reject',
  profileController.rejectVerification
);

// Get user profile by ID (for admins/managers or own profile)
router.get('/:userId', profileController.getUserProfile);

export default router;
