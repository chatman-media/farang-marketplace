import { Router } from 'express';
import { ServiceAssignmentController,
  createAssignmentValidation,
  updateAssignmentStatusValidation,
  addFeedbackValidation,
  assignmentIdValidation,
  agencyIdValidation,
  listingIdValidation
} from '../controllers/ServiceAssignmentController.js';
import { 
  authenticateToken, 
  requireAgencyStaff,
  requireAgencyOwnership,
  requireAdmin
} from '../middleware/auth.js';

const router = Router();
const serviceAssignmentController = new ServiceAssignmentController();

// All routes require authentication
router.use(authenticateToken);

// Assignment management routes
router.post('/', createAssignmentValidation, requireAgencyStaff, serviceAssignmentController.createAssignment.bind(serviceAssignmentController));
router.get('/search', serviceAssignmentController.searchAssignments.bind(serviceAssignmentController));
router.get('/stats', serviceAssignmentController.getAssignmentStats.bind(serviceAssignmentController));

// Individual assignment routes
router.get('/:id', assignmentIdValidation, serviceAssignmentController.getAssignmentById.bind(serviceAssignmentController));
router.patch('/:id/status', updateAssignmentStatusValidation, requireAgencyStaff, serviceAssignmentController.updateAssignmentStatus.bind(serviceAssignmentController));
router.post('/:id/feedback', addFeedbackValidation, serviceAssignmentController.addCustomerFeedback.bind(serviceAssignmentController));

// Agency-specific assignment routes
router.get('/agency/:agencyId', agencyIdValidation, requireAgencyOwnership, serviceAssignmentController.getAssignmentsByAgency.bind(serviceAssignmentController));

// Listing-specific assignment routes
router.get('/listing/:listingId', listingIdValidation, serviceAssignmentController.getAssignmentsByListing.bind(serviceAssignmentController));

export default router;
