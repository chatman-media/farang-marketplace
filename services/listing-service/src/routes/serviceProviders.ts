import { Router } from 'express';
import { ServiceProviderController } from '../controllers/ServiceProviderController.js';
import { authMiddleware, optionalAuthMiddleware } from '../middleware/auth.js';
import {
  upload,
  processImages,
  validateImageUpload,
} from '../middleware/upload.js';

const router = Router();
const serviceProviderController = new ServiceProviderController();

// Create service provider (with image upload)
router.post(
  '/',
  authMiddleware,
  upload.array('images', 10),
  validateImageUpload,
  processImages,
  ServiceProviderController.createValidationRules,
  serviceProviderController.createServiceProvider.bind(
    serviceProviderController
  )
);

// Get service provider by ID
router.get(
  '/:id',
  optionalAuthMiddleware,
  serviceProviderController.getServiceProvider.bind(serviceProviderController)
);

// Search service providers
router.get(
  '/search',
  optionalAuthMiddleware,
  serviceProviderController.searchServiceProviders.bind(
    serviceProviderController
  )
);

// Update service provider (with optional image upload)
router.patch(
  '/:id',
  authMiddleware,
  upload.array('images', 10),
  processImages, // Optional - only processes if images are uploaded
  ServiceProviderController.updateValidationRules,
  serviceProviderController.updateServiceProvider.bind(
    serviceProviderController
  )
);

// Delete service provider
router.delete(
  '/:id',
  authMiddleware,
  serviceProviderController.deleteServiceProvider.bind(
    serviceProviderController
  )
);

export default router;
