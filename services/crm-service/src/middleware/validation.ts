import { body, param, query } from "express-validator"
import {
  CustomerStatus,
  LeadStatus,
  LeadPriority,
  LeadSource,
  CommunicationChannel,
} from "@marketplace/shared-types"

// Customer validation
export const validateCreateCustomer = [
  body("email").isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("firstName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("First name is required and must be 1-100 characters"),
  body("lastName")
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name is required and must be 1-100 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage("Invalid phone number format"),
  body("telegramId")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("Telegram ID must be a string with max 100 characters"),
  body("whatsappId")
    .optional()
    .isString()
    .isLength({ max: 100 })
    .withMessage("WhatsApp ID must be a string with max 100 characters"),
  body("preferredLanguage")
    .optional()
    .matches(/^[a-z]{2}$/)
    .withMessage("Preferred language must be a 2-letter language code"),
  body("preferredChannel")
    .optional()
    .isIn(Object.values(CommunicationChannel))
    .withMessage("Invalid communication channel"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("tags.*")
    .optional()
    .isString()
    .isLength({ min: 1, max: 50 })
    .withMessage("Each tag must be a string with 1-50 characters"),
  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),
]

export const validateUpdateCustomer = [
  param("id").isUUID().withMessage("Valid customer ID is required"),
  body("email").optional().isEmail().normalizeEmail().withMessage("Valid email is required"),
  body("firstName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("First name must be 1-100 characters"),
  body("lastName")
    .optional()
    .trim()
    .isLength({ min: 1, max: 100 })
    .withMessage("Last name must be 1-100 characters"),
  body("phone")
    .optional()
    .matches(/^\+?[\d\s\-\(\)]+$/)
    .withMessage("Invalid phone number format"),
  body("status")
    .optional()
    .isIn(Object.values(CustomerStatus))
    .withMessage("Invalid customer status"),
  body("leadScore")
    .optional()
    .isInt({ min: 0, max: 100 })
    .withMessage("Lead score must be between 0 and 100"),
  body("preferredLanguage")
    .optional()
    .matches(/^[a-z]{2}$/)
    .withMessage("Preferred language must be a 2-letter language code"),
  body("preferredChannel")
    .optional()
    .isIn(Object.values(CommunicationChannel))
    .withMessage("Invalid communication channel"),
  body("tags").optional().isArray().withMessage("Tags must be an array"),
  body("customFields").optional().isObject().withMessage("Custom fields must be an object"),
]

// Lead validation
export const validateCreateLead = [
  body("customerId").isUUID().withMessage("Valid customer ID is required"),
  body("listingId").optional().isUUID().withMessage("Listing ID must be a valid UUID"),
  body("source").isIn(Object.values(LeadSource)).withMessage("Valid lead source is required"),
  body("priority")
    .optional()
    .isIn(Object.values(LeadPriority))
    .withMessage("Invalid lead priority"),
  body("value").optional().isFloat({ min: 0 }).withMessage("Lead value must be a positive number"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Notes must be a string with max 5000 characters"),
  body("followUpDate")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Follow-up date cannot be in the past")
      }
      return true
    })
    .withMessage("Follow-up date must be a valid future date"),
]

export const validateUpdateLead = [
  param("id").isUUID().withMessage("Valid lead ID is required"),
  body("customerId").optional().isUUID().withMessage("Customer ID must be a valid UUID"),
  body("listingId").optional().isUUID().withMessage("Listing ID must be a valid UUID"),
  body("source").optional().isIn(Object.values(LeadSource)).withMessage("Invalid lead source"),
  body("status").optional().isIn(Object.values(LeadStatus)).withMessage("Invalid lead status"),
  body("priority")
    .optional()
    .isIn(Object.values(LeadPriority))
    .withMessage("Invalid lead priority"),
  body("assignedTo").optional().isUUID().withMessage("Assigned to must be a valid UUID"),
  body("value").optional().isFloat({ min: 0 }).withMessage("Lead value must be a positive number"),
  body("notes")
    .optional()
    .isString()
    .isLength({ max: 5000 })
    .withMessage("Notes must be a string with max 5000 characters"),
  body("followUpDate")
    .optional()
    .isISO8601()
    .toDate()
    .custom((value) => {
      if (new Date(value) < new Date()) {
        throw new Error("Follow-up date cannot be in the past")
      }
      return true
    })
    .withMessage("Follow-up date must be a valid future date"),
]

// Query validation
export const validateCustomerQuery = [
  query("status")
    .optional()
    .isIn(Object.values(CustomerStatus))
    .withMessage("Invalid customer status"),
  query("search")
    .optional()
    .isString()
    .isLength({ min: 1, max: 100 })
    .withMessage("Search term must be 1-100 characters"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
]

export const validateLeadQuery = [
  query("status").optional().isIn(Object.values(LeadStatus)).withMessage("Invalid lead status"),
  query("priority")
    .optional()
    .isIn(Object.values(LeadPriority))
    .withMessage("Invalid lead priority"),
  query("assignedTo").optional().isUUID().withMessage("Assigned to must be a valid UUID"),
  query("customerId").optional().isUUID().withMessage("Customer ID must be a valid UUID"),
  query("page").optional().isInt({ min: 1 }).withMessage("Page must be a positive integer"),
  query("limit")
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage("Limit must be between 1 and 100"),
]

// Parameter validation
export const validateUUIDParam = [param("id").isUUID().withMessage("Valid ID is required")]
