import { FastifyInstance } from "fastify"
import { TemplateController } from "../controllers/TemplateController"

export default async function templateRoutes(fastify: FastifyInstance) {
  const templateController = new TemplateController()

  // Template CRUD operations
  fastify.get("/", templateController.getTemplates.bind(templateController))
  fastify.get("/stats", templateController.getTemplateStats.bind(templateController))
  fastify.get("/search", templateController.searchTemplates.bind(templateController))
  fastify.post("/", templateController.createTemplate.bind(templateController))
  fastify.post("/preview", templateController.previewTemplate.bind(templateController))
  fastify.get("/:id", templateController.getTemplate.bind(templateController))
  fastify.put("/:id", templateController.updateTemplate.bind(templateController))
  fastify.delete("/:id", templateController.deleteTemplate.bind(templateController))
  fastify.post("/:id/render", templateController.renderTemplate.bind(templateController))
}
