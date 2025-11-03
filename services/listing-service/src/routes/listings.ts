import { FastifyInstance, FastifyPluginAsync } from "fastify"
import { ListingController } from "../controllers/ListingController"
import { authMiddleware } from "../middleware/auth"

const listingController = new ListingController()

const listingRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // Vehicle listing routes
  fastify.post(
    "/vehicles",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
        },
      },
    },
    listingController.createVehicle,
  )

  fastify.get("/vehicles", listingController.getVehicles)

  fastify.get("/vehicles/search", listingController.searchListings)

  fastify.get(
    "/vehicles/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.getVehicleById,
  )

  fastify.put(
    "/vehicles/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.updateVehicle,
  )

  fastify.delete(
    "/vehicles/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.deleteVehicle,
  )

  // Product listing routes
  fastify.post(
    "/products",
    {
      preHandler: [authMiddleware],
    },
    listingController.createProduct,
  )

  fastify.get("/products", listingController.getProducts)

  fastify.get(
    "/products/:id",
    {
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.getProductById,
  )

  fastify.put(
    "/products/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.updateProduct,
  )

  fastify.delete(
    "/products/:id",
    {
      preHandler: [authMiddleware],
      schema: {
        params: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
          },
          required: ["id"],
        },
      },
    },
    listingController.deleteProduct,
  )

  // General listing routes
  fastify.get("/", listingController.getAllListings)

  fastify.get("/search", listingController.searchListings)

  fastify.get("/featured", listingController.getFeaturedListings)
}

export default listingRoutes
