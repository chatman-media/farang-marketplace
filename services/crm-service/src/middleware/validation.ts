import { CommunicationChannel, CustomerStatus, LeadPriority, LeadSource, LeadStatus } from "@marketplace/shared-types"

// Customer validation schemas
export const createCustomerSchema = {
  body: {
    type: "object",
    required: ["email", "firstName", "lastName"],
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Valid email is required",
      },
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "First name is required and must be 1-100 characters",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Last name is required and must be 1-100 characters",
      },
      phone: {
        type: "string",
        pattern: "^\\+?[\\d\\s\\-\\(\\)]+$",
        description: "Invalid phone number format",
      },
      telegramId: {
        type: "string",
        maxLength: 100,
        description: "Telegram ID must be a string with max 100 characters",
      },
      whatsappId: {
        type: "string",
        maxLength: 100,
        description: "WhatsApp ID must be a string with max 100 characters",
      },
      preferredLanguage: {
        type: "string",
        pattern: "^[a-z]{2}$",
        description: "Preferred language must be a 2-letter language code",
      },
      preferredChannel: {
        type: "string",
        enum: Object.values(CommunicationChannel),
        description: "Invalid communication channel",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "Tags must be an array of strings with 1-50 characters each",
      },
      customFields: {
        type: "object",
        description: "Custom fields must be an object",
      },
    },
    additionalProperties: false,
  },
}

export const updateCustomerSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Valid customer ID is required",
      },
    },
    additionalProperties: false,
  },
  body: {
    type: "object",
    properties: {
      email: {
        type: "string",
        format: "email",
        description: "Valid email is required",
      },
      firstName: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "First name must be 1-100 characters",
      },
      lastName: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Last name must be 1-100 characters",
      },
      phone: {
        type: "string",
        pattern: "^\\+?[\\d\\s\\-\\(\\)]+$",
        description: "Invalid phone number format",
      },
      status: {
        type: "string",
        enum: Object.values(CustomerStatus),
        description: "Invalid customer status",
      },
      leadScore: {
        type: "integer",
        minimum: 0,
        maximum: 100,
        description: "Lead score must be between 0 and 100",
      },
      preferredLanguage: {
        type: "string",
        pattern: "^[a-z]{2}$",
        description: "Preferred language must be a 2-letter language code",
      },
      preferredChannel: {
        type: "string",
        enum: Object.values(CommunicationChannel),
        description: "Invalid communication channel",
      },
      tags: {
        type: "array",
        items: {
          type: "string",
          minLength: 1,
          maxLength: 50,
        },
        description: "Tags must be an array",
      },
      customFields: {
        type: "object",
        description: "Custom fields must be an object",
      },
    },
    additionalProperties: false,
  },
}

// Lead validation schemas
export const createLeadSchema = {
  body: {
    type: "object",
    required: ["customerId", "source"],
    properties: {
      customerId: {
        type: "string",
        format: "uuid",
        description: "Valid customer ID is required",
      },
      listingId: {
        type: "string",
        format: "uuid",
        description: "Listing ID must be a valid UUID",
      },
      source: {
        type: "string",
        enum: Object.values(LeadSource),
        description: "Valid lead source is required",
      },
      priority: {
        type: "string",
        enum: Object.values(LeadPriority),
        description: "Invalid lead priority",
      },
      value: {
        type: "number",
        minimum: 0,
        description: "Lead value must be a positive number",
      },
      notes: {
        type: "string",
        maxLength: 5000,
        description: "Notes must be a string with max 5000 characters",
      },
      followUpDate: {
        type: "string",
        format: "date-time",
        description: "Follow-up date must be a valid future date",
      },
    },
    additionalProperties: false,
  },
}

export const updateLeadSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Valid lead ID is required",
      },
    },
    additionalProperties: false,
  },
  body: {
    type: "object",
    properties: {
      customerId: {
        type: "string",
        format: "uuid",
        description: "Customer ID must be a valid UUID",
      },
      listingId: {
        type: "string",
        format: "uuid",
        description: "Listing ID must be a valid UUID",
      },
      source: {
        type: "string",
        enum: Object.values(LeadSource),
        description: "Invalid lead source",
      },
      status: {
        type: "string",
        enum: Object.values(LeadStatus),
        description: "Invalid lead status",
      },
      priority: {
        type: "string",
        enum: Object.values(LeadPriority),
        description: "Invalid lead priority",
      },
      assignedTo: {
        type: "string",
        format: "uuid",
        description: "Assigned to must be a valid UUID",
      },
      value: {
        type: "number",
        minimum: 0,
        description: "Lead value must be a positive number",
      },
      notes: {
        type: "string",
        maxLength: 5000,
        description: "Notes must be a string with max 5000 characters",
      },
      followUpDate: {
        type: "string",
        format: "date-time",
        description: "Follow-up date must be a valid future date",
      },
    },
    additionalProperties: false,
  },
}

// Query validation schemas
export const customerQuerySchema = {
  querystring: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: Object.values(CustomerStatus),
        description: "Invalid customer status",
      },
      search: {
        type: "string",
        minLength: 1,
        maxLength: 100,
        description: "Search term must be 1-100 characters",
      },
      page: {
        type: "integer",
        minimum: 1,
        description: "Page must be a positive integer",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Limit must be between 1 and 100",
      },
    },
    additionalProperties: false,
  },
}

export const leadQuerySchema = {
  querystring: {
    type: "object",
    properties: {
      status: {
        type: "string",
        enum: Object.values(LeadStatus),
        description: "Invalid lead status",
      },
      priority: {
        type: "string",
        enum: Object.values(LeadPriority),
        description: "Invalid lead priority",
      },
      assignedTo: {
        type: "string",
        format: "uuid",
        description: "Assigned to must be a valid UUID",
      },
      customerId: {
        type: "string",
        format: "uuid",
        description: "Customer ID must be a valid UUID",
      },
      page: {
        type: "integer",
        minimum: 1,
        description: "Page must be a positive integer",
      },
      limit: {
        type: "integer",
        minimum: 1,
        maximum: 100,
        description: "Limit must be between 1 and 100",
      },
    },
    additionalProperties: false,
  },
}

// Parameter validation schemas
export const uuidParamSchema = {
  params: {
    type: "object",
    required: ["id"],
    properties: {
      id: {
        type: "string",
        format: "uuid",
        description: "Valid ID is required",
      },
    },
    additionalProperties: false,
  },
}
