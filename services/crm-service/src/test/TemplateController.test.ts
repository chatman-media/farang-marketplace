import { describe, it, expect, beforeEach, afterEach, vi } from "vitest"
import { createApp } from "../index"
import { FastifyInstance } from "fastify"
import { CommunicationChannel } from "@marketplace/shared-types"

// Mock the database connection
vi.mock("../db/connection", () => ({
  query: vi.fn(),
}))

// Mock authentication middleware
vi.mock("../middleware/auth", () => ({
  authenticateToken: vi.fn((request: any, reply: any, done: any) => done()),
  requireRole: vi.fn(() => (request: any, reply: any, done: any) => done()),
}))

describe("TemplateController", () => {
  let app: FastifyInstance
  let mockQuery: any

  beforeEach(async () => {
    // Reset all mocks
    vi.clearAllMocks()

    // Mock query function
    const { query } = await import("../db/connection")
    mockQuery = query as any
    mockQuery.mockResolvedValue({ rows: [], rowCount: 0 })

    // Create app instance
    app = await createApp()
  })

  afterEach(async () => {
    if (app) {
      await app.close()
    }
  })

  describe("GET /api/crm/templates", () => {
    it("should get templates with pagination", async () => {
      // Mock count query first (TemplateService calls count first)
      mockQuery.mockResolvedValueOnce({
        rows: [{ total: "1" }],
      })

      // Mock templates query
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "template-1",
            name: "welcome_email",
            type: "email",
            category: "welcome",
            subject: "Welcome {{firstName}}!",
            content: "Hello {{firstName}}, welcome!",
            variables: JSON.stringify(["firstName"]),
            conditions: JSON.stringify({}),
            is_active: true,
            created_by: "admin",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data).toHaveLength(1)
      expect(data.pagination.total).toBe(1)
    })

    it("should filter templates by type", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "0" }] })
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates?type=email",
      })

      expect(response.statusCode).toBe(200)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("WHERE type = $1"),
        expect.arrayContaining(["email"]),
      )
    })

    it("should search templates", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "0" }] })
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates?search=welcome",
      })

      expect(response.statusCode).toBe(200)
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining("name ILIKE $1 OR content ILIKE $1"),
        expect.arrayContaining(["%welcome%"]),
      )
    })
  })

  describe("GET /api/crm/templates/:id", () => {
    it("should get template by ID", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "template-1",
            name: "welcome_email",
            type: "email",
            category: "welcome",
            subject: "Welcome!",
            content: "Hello!",
            variables: JSON.stringify([]),
            conditions: JSON.stringify({}),
            is_active: true,
            created_by: "admin",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates/template-1",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.id).toBe("template-1")
    })

    it("should return 404 for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates/non-existent",
      })

      expect(response.statusCode).toBe(404)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Template not found")
    })
  })

  describe("POST /api/crm/templates", () => {
    it("should create a new template", async () => {
      // Mock name check (no existing template)
      mockQuery.mockResolvedValueOnce({ rows: [] })

      // Mock insert
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "new-template-id",
            name: "test_template",
            type: "email",
            category: "test",
            subject: "Test Subject",
            content: "Test content",
            variables: JSON.stringify(["name"]),
            conditions: JSON.stringify({}),
            is_active: true,
            created_by: "admin",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates",
        payload: {
          name: "test_template",
          type: CommunicationChannel.EMAIL,
          category: "test",
          subject: "Test Subject",
          content: "Test content",
          variables: ["name"],
        },
      })

      expect(response.statusCode).toBe(201)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe("test_template")
    })

    it("should return validation error for invalid data", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates",
        payload: {
          name: "", // Invalid: empty name
          type: CommunicationChannel.EMAIL,
          category: "test",
          content: "Test content",
        },
      })

      expect(response.statusCode).toBe(400)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Validation failed")
    })

    it("should return conflict error for duplicate name", async () => {
      // Mock existing template
      mockQuery.mockResolvedValueOnce({
        rows: [{ id: "existing-id" }],
      })

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates",
        payload: {
          name: "existing_template",
          type: CommunicationChannel.EMAIL,
          category: "test",
          subject: "Test",
          content: "Test content",
        },
      })

      expect(response.statusCode).toBe(409)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Template already exists")
    })
  })

  describe("PUT /api/crm/templates/:id", () => {
    it("should update template", async () => {
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "template-1",
            name: "updated_template",
            type: "email",
            category: "test",
            subject: "Updated Subject",
            content: "Updated content",
            variables: JSON.stringify(["name"]),
            conditions: JSON.stringify({}),
            is_active: true,
            created_by: "admin",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const response = await app.inject({
        method: "PUT",
        url: "/api/crm/templates/template-1",
        payload: {
          name: "updated_template",
          subject: "Updated Subject",
          content: "Updated content",
        },
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.name).toBe("updated_template")
    })

    it("should return 404 for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "PUT",
        url: "/api/crm/templates/non-existent",
        payload: {
          name: "updated_template",
        },
      })

      expect(response.statusCode).toBe(404)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Template not found")
    })
  })

  describe("DELETE /api/crm/templates/:id", () => {
    it("should delete template", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 1 })

      const response = await app.inject({
        method: "DELETE",
        url: "/api/crm/templates/template-1",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.message).toBe("Template deleted successfully")
    })

    it("should return 404 for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rowCount: 0 })

      const response = await app.inject({
        method: "DELETE",
        url: "/api/crm/templates/non-existent",
      })

      expect(response.statusCode).toBe(404)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Template not found")
    })
  })

  describe("POST /api/crm/templates/:id/render", () => {
    it("should render template with variables", async () => {
      // Mock template fetch
      mockQuery.mockResolvedValueOnce({
        rows: [
          {
            id: "template-1",
            name: "welcome_email",
            type: "email",
            category: "welcome",
            subject: "Welcome {{firstName}}!",
            content: "Hello {{firstName}}, welcome to {{company}}!",
            variables: JSON.stringify(["firstName", "company"]),
            conditions: JSON.stringify({}),
            is_active: true,
            created_by: "admin",
            created_at: "2023-01-01T00:00:00Z",
            updated_at: "2023-01-01T00:00:00Z",
          },
        ],
      })

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates/template-1/render",
        payload: {
          variables: {
            firstName: "John",
            company: "Acme Corp",
          },
        },
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.content).toContain("Hello John")
      expect(data.data.content).toContain("Acme Corp")
    })

    it("should return 404 for non-existent template", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates/non-existent/render",
        payload: {
          variables: { name: "John" },
        },
      })

      expect(response.statusCode).toBe(404)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Template not found")
    })
  })

  describe("POST /api/crm/templates/preview", () => {
    it("should preview template without saving", async () => {
      const response = await app.inject({
        method: "POST",
        url: "/api/crm/templates/preview",
        payload: {
          content: "Hello {{name}}, welcome!",
          subject: "Welcome {{name}}!",
          variables: {
            name: "John",
          },
        },
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.content).toBe("Hello John, welcome!")
      expect(data.data.subject).toBe("Welcome John!")
    })
  })

  describe("GET /api/crm/templates/stats", () => {
    it("should get template statistics", async () => {
      // Mock stats queries
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "5" }] }) // total
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "4" }] }) // active
      mockQuery.mockResolvedValueOnce({ rows: [{ type: "email", count: "3" }] }) // by type
      mockQuery.mockResolvedValueOnce({ rows: [{ category: "welcome", count: "2" }] }) // by category

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates/stats",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.data.totalTemplates).toBe(5)
      expect(data.data.activeTemplates).toBe(4)
    })
  })

  describe("GET /api/crm/templates/search", () => {
    it("should search templates", async () => {
      mockQuery.mockResolvedValueOnce({ rows: [{ total: "0" }] })
      mockQuery.mockResolvedValueOnce({ rows: [] })

      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates/search?q=welcome",
      })

      expect(response.statusCode).toBe(200)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(true)
      expect(data.query).toBe("welcome")
    })

    it("should return error for short search query", async () => {
      const response = await app.inject({
        method: "GET",
        url: "/api/crm/templates/search?q=a",
      })

      expect(response.statusCode).toBe(400)
      const data = JSON.parse(response.body)
      expect(data.success).toBe(false)
      expect(data.error).toBe("Invalid search query")
    })
  })
})
