import { Router } from "express"
import { ListingController } from "../controllers/ListingController.js"
import { authMiddleware } from "../middleware/auth.js"
import { upload, processImages, validateImageUpload } from "../middleware/upload.js"
import { param } from "express-validator"

const router = Router()
const listingController = new ListingController()

// Validation for ID parameter
const validateId = [param("id").isUUID().withMessage("Invalid listing ID format")]

// Vehicle listing routes
router.post(
  "/vehicles",
  authMiddleware,
  upload.array("images", 20),
  validateImageUpload,
  processImages,
  ListingController.createVehicleValidation,
  listingController.createVehicleListing
)

router.get("/vehicles/search", listingController.searchVehicleListings)

router.get("/vehicles/:id", validateId, listingController.getVehicleListing)

// Product listing routes
router.post(
  "/products",
  authMiddleware,
  upload.array("images", 20),
  validateImageUpload,
  processImages,
  ListingController.createProductValidation,
  listingController.createProductListing
)

router.get("/products/search", listingController.searchProductListings)

router.get("/products/:id", validateId, listingController.getProductListing)

// General listing management routes
router.patch("/:id/status", authMiddleware, validateId, listingController.updateListingStatus)

router.delete("/:id", authMiddleware, validateId, listingController.deleteListing)

export default router
