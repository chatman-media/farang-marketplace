import { FastifyInstance } from "fastify"
import { SegmentController } from "../controllers/SegmentController"

export default async function segmentRoutes(fastify: FastifyInstance) {
  const segmentController = new SegmentController()

  // Segment CRUD operations
  fastify.get("/", segmentController.getSegments.bind(segmentController))
  fastify.get("/stats", segmentController.getSegmentStats.bind(segmentController))
  fastify.get("/fields", segmentController.getSegmentFields.bind(segmentController))
  fastify.post("/", segmentController.createSegment.bind(segmentController))
  fastify.post("/recalculate-all", segmentController.recalculateAllSegments.bind(segmentController))
  fastify.get("/:id", segmentController.getSegment.bind(segmentController))
  fastify.put("/:id", segmentController.updateSegment.bind(segmentController))
  fastify.delete("/:id", segmentController.deleteSegment.bind(segmentController))
  fastify.post("/:id/recalculate", segmentController.recalculateSegment.bind(segmentController))
  fastify.get("/:id/customers", segmentController.getSegmentCustomers.bind(segmentController))
}
