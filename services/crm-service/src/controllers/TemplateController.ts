import { CommunicationChannel } from "@marketplace/shared-types"
import { FastifyReply, FastifyRequest } from "fastify"
import { CreateTemplateRequest, Template, UpdateTemplateRequest } from "../models/Template"
import { TemplateService } from "../services/TemplateService"

export class TemplateController {
  private templateService: TemplateService

  constructor() {
    this.templateService = new TemplateService()
  }

  // GET /api/crm/templates - Get all templates with pagination and filtering
  async getTemplates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        page?: string
        limit?: string
        type?: CommunicationChannel
        category?: string
        isActive?: string
        search?: string
      }

      const page = parseInt(query.page || "1")
      const limit = parseInt(query.limit || "20")
      const offset = (page - 1) * limit

      const filters = {
        type: query.type,
        category: query.category,
        isActive: query.isActive === "true" ? true : query.isActive === "false" ? false : undefined,
        search: query.search,
        limit,
        offset,
      }

      const result = await this.templateService.getTemplates(filters)

      return reply.code(200).send({
        success: true,
        data: result.templates,
        pagination: {
          page,
          limit,
          total: result.total,
          totalPages: Math.ceil(result.total / limit),
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get templates")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve templates",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/templates/:id - Get template by ID
  async getTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const template = await this.templateService.getTemplateById(params.id)

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: "Template not found",
          message: `Template with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        data: template.toJSON(),
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get template")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/templates - Create new template
  async createTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const templateData = request.body as CreateTemplateRequest

      // Validate the request
      const validationErrors = Template.validateCreateRequest(templateData)
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          message: "Template data is invalid",
          details: validationErrors,
          timestamp: new Date().toISOString(),
        })
      }

      const template = await this.templateService.createTemplate(templateData)

      return reply.code(201).send({
        success: true,
        data: template.toJSON(),
        message: "Template created successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to create template")

      if (error instanceof Error && error.message.includes("already exists")) {
        return reply.code(409).send({
          success: false,
          error: "Template already exists",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to create template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // PUT /api/crm/templates/:id - Update template
  async updateTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const updateData = request.body as UpdateTemplateRequest

      // Validate the request
      const validationErrors = Template.validateUpdateRequest(updateData)
      if (validationErrors.length > 0) {
        return reply.code(400).send({
          success: false,
          error: "Validation failed",
          message: "Update data is invalid",
          details: validationErrors,
          timestamp: new Date().toISOString(),
        })
      }

      const template = await this.templateService.updateTemplate(params.id, updateData)

      if (!template) {
        return reply.code(404).send({
          success: false,
          error: "Template not found",
          message: `Template with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        data: template.toJSON(),
        message: "Template updated successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to update template")
      return reply.code(500).send({
        success: false,
        error: "Failed to update template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // DELETE /api/crm/templates/:id - Delete template
  async deleteTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const deleted = await this.templateService.deleteTemplate(params.id)

      if (!deleted) {
        return reply.code(404).send({
          success: false,
          error: "Template not found",
          message: `Template with ID ${params.id} does not exist`,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(200).send({
        success: true,
        message: "Template deleted successfully",
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to delete template")
      return reply.code(500).send({
        success: false,
        error: "Failed to delete template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/templates/:id/render - Render template with variables
  async renderTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const params = request.params as { id: string }
      const body = request.body as { variables: Record<string, any> }

      const result = await this.templateService.renderTemplate(params.id, body.variables || {})

      return reply.code(200).send({
        success: true,
        data: result,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to render template")

      if (error instanceof Error && error.message.includes("not found")) {
        return reply.code(404).send({
          success: false,
          error: "Template not found",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      if (error instanceof Error && error.message.includes("inactive")) {
        return reply.code(400).send({
          success: false,
          error: "Template inactive",
          message: error.message,
          timestamp: new Date().toISOString(),
        })
      }

      return reply.code(500).send({
        success: false,
        error: "Failed to render template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // POST /api/crm/templates/preview - Preview template without saving
  async previewTemplate(request: FastifyRequest, reply: FastifyReply) {
    try {
      const body = request.body as {
        content: string
        subject?: string
        variables: Record<string, any>
      }

      // Create a temporary template for preview
      const tempTemplate = {
        content: body.content,
        subject: body.subject,
        variables: Object.keys(body.variables || {}),
      }

      // Use TemplateService's simple rendering logic
      const renderedContent = this.templateService.renderSimpleTemplate(tempTemplate.content, body.variables || {})

      const renderedSubject = tempTemplate.subject
        ? this.templateService.renderSimpleTemplate(tempTemplate.subject, body.variables || {})
        : undefined

      return reply.code(200).send({
        success: true,
        data: {
          content: renderedContent,
          subject: renderedSubject,
          variables: tempTemplate.variables,
        },
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to preview template")
      return reply.code(500).send({
        success: false,
        error: "Failed to preview template",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/templates/stats - Get template usage statistics
  async getTemplateStats(request: FastifyRequest, reply: FastifyReply) {
    try {
      const stats = await this.templateService.getTemplateStats()

      return reply.code(200).send({
        success: true,
        data: stats,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to get template stats")
      return reply.code(500).send({
        success: false,
        error: "Failed to retrieve template statistics",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }

  // GET /api/crm/templates/search - Search templates by content
  async searchTemplates(request: FastifyRequest, reply: FastifyReply) {
    try {
      const query = request.query as {
        q: string
        type?: CommunicationChannel
        category?: string
        limit?: string
      }

      if (!query.q || query.q.trim().length < 2) {
        return reply.code(400).send({
          success: false,
          error: "Invalid search query",
          message: "Search query must be at least 2 characters long",
          timestamp: new Date().toISOString(),
        })
      }

      const limit = parseInt(query.limit || "10")
      const filters = {
        type: query.type,
        category: query.category,
        search: query.q.trim(),
        limit,
        offset: 0,
      }

      const result = await this.templateService.getTemplates(filters)

      return reply.code(200).send({
        success: true,
        data: result.templates,
        total: result.total,
        query: query.q,
        timestamp: new Date().toISOString(),
      })
    } catch (error) {
      request.log.error({ error }, "Failed to search templates")
      return reply.code(500).send({
        success: false,
        error: "Failed to search templates",
        message: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      })
    }
  }
}
