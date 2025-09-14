import logger from "@marketplace/logger"
import { ListingCategory } from "@marketplace/shared-types"
import { FastifyInstance } from "fastify"
import { getAvailableCategories, getCategoryConfig, getEnabledCategories } from "../config/categories"

export default async function categoriesRoutes(fastify: FastifyInstance) {
  // Get all available categories (enabled and disabled)
  fastify.get(
    "/categories",
    {
      schema: {
        description: "Get all available listing categories with their configuration",
        tags: ["Categories"],
        summary: "Get listing categories",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  categories: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        category: { type: "string" },
                        enabled: { type: "boolean" },
                        label: { type: "string" },
                        description: { type: "string" },
                        icon: { type: "string" },
                        comingSoon: { type: "boolean" },
                      },
                    },
                  },
                  enabledOnly: {
                    type: "array",
                    items: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const allCategories = getAvailableCategories()
        const enabledCategories = getEnabledCategories()

        return reply.send({
          success: true,
          data: {
            categories: allCategories.map(({ category, config }) => ({
              category,
              ...config,
            })),
            enabledOnly: enabledCategories,
          },
        })
      } catch (error) {
        logger.error("Error getting categories:", error)
        return (reply as any).status(500).send({
          success: false,
          message: "Failed to get categories",
        })
      }
    },
  )

  // Get enabled categories only
  fastify.get(
    "/categories/enabled",
    {
      schema: {
        description: "Get only enabled listing categories",
        tags: ["Categories"],
        summary: "Get enabled categories",
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "array",
                items: {
                  type: "object",
                  properties: {
                    category: { type: "string" },
                    label: { type: "string" },
                    description: { type: "string" },
                    icon: { type: "string" },
                  },
                },
              },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const enabledCategories = getEnabledCategories()
        const categoriesWithConfig = enabledCategories.map((category) => ({
          category,
          ...getCategoryConfig(category),
        }))

        return reply.send({
          success: true,
          data: categoriesWithConfig,
        })
      } catch (error) {
        logger.error("Error getting enabled categories:", error)
        return (reply as any).status(500).send({
          success: false,
          message: "Failed to get enabled categories",
        })
      }
    },
  )

  // Get specific category info
  fastify.get(
    "/categories/:category",
    {
      schema: {
        description: "Get information about a specific category",
        tags: ["Categories"],
        summary: "Get category info",
        params: {
          type: "object",
          required: ["category"],
          properties: {
            category: {
              type: "string",
              enum: Object.values(ListingCategory),
            },
          },
        },
        response: {
          200: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              data: {
                type: "object",
                properties: {
                  category: { type: "string" },
                  enabled: { type: "boolean" },
                  label: { type: "string" },
                  description: { type: "string" },
                  icon: { type: "string" },
                  comingSoon: { type: "boolean" },
                },
              },
            },
          },
          404: {
            type: "object",
            properties: {
              success: { type: "boolean" },
              message: { type: "string" },
            },
          },
        },
      },
    },
    async (request, reply) => {
      try {
        const { category } = request.params as { category: string }

        if (!Object.values(ListingCategory).includes(category as ListingCategory)) {
          return reply.code(404).send({
            success: false,
            message: `Category "${category}" not found`,
          })
        }

        const config = getCategoryConfig(category as ListingCategory)

        if (!config) {
          return reply.code(404).send({
            success: false,
            message: `Configuration for category "${category}" not found`,
          })
        }

        return reply.send({
          success: true,
          data: {
            category,
            ...config,
          },
        })
      } catch (error) {
        logger.error("Error getting category info:", error)
        return (reply as any).status(500).send({
          success: false,
          message: "Failed to get category information",
        })
      }
    },
  )
}
