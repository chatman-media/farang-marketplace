import fs from "node:fs/promises"
import path from "node:path"
import logger from "@marketplace/logger"
import type { FastifyInstance, FastifyPluginAsync } from "fastify"
import sharp from "sharp"
import { env } from "../app"
import { authMiddleware } from "../middleware/auth"

const ALLOWED_MIME = new Set(["image/jpeg", "image/jpg", "image/png", "image/webp"])
const MAX_FILES = 20
const MAX_FILE_BYTES = 10 * 1024 * 1024 // 10 MB

const uploadRoutes: FastifyPluginAsync = async (fastify: FastifyInstance) => {
  // POST /api/listings/images
  // Accepts multipart/form-data with field name "images" (1-20 files).
  // Returns { success: true, images: ["/uploads/listings/xxx.webp", ...] }
  fastify.post("/images", { preHandler: [authMiddleware] }, async (request, reply) => {
    const uploadDir = path.join(process.cwd(), env.UPLOAD_PATH, "listings")
    await fs.mkdir(uploadDir, { recursive: true })

    const savedPaths: string[] = []

    const parts = request.files({ limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES } })

    for await (const part of parts) {
      if (!ALLOWED_MIME.has(part.mimetype)) {
        // drain the stream so the connection stays clean, then skip
        part.file.resume()
        continue
      }

      let buffer: Buffer
      try {
        buffer = await part.toBuffer()
      } catch (err) {
        logger.warn("File stream error (possibly too large), skipping", err)
        continue
      }

      const uid = `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
      const outFile = path.join(uploadDir, `${uid}.webp`)

      await sharp(buffer)
        .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
        .webp({ quality: 85 })
        .toFile(outFile)

      savedPaths.push(`/uploads/listings/${uid}.webp`)
    }

    if (savedPaths.length === 0) {
      return reply.code(400).send({
        success: false,
        message: "No valid images uploaded. Allowed formats: JPEG, PNG, WebP. Max size: 10 MB each.",
      })
    }

    return reply.code(201).send({ success: true, images: savedPaths })
  })

  // DELETE /api/listings/images
  // Body: { path: "/uploads/listings/xxx.webp" }
  // Removes the file from disk. Validates path is inside uploads dir (no traversal).
  fastify.delete<{ Body: { path: string } }>("/images", { preHandler: [authMiddleware] }, async (request, reply) => {
    const imgPath = request.body?.path
    if (!imgPath || typeof imgPath !== "string") {
      return reply.code(400).send({ success: false, message: '"path" is required' })
    }

    const uploadsRoot = path.join(process.cwd(), env.UPLOAD_PATH)
    const relative = imgPath.replace(/^\/uploads\//, "")
    const resolved = path.resolve(uploadsRoot, relative)

    // Prevent path traversal
    if (!resolved.startsWith(uploadsRoot + path.sep)) {
      return reply.code(400).send({ success: false, message: "Invalid path" })
    }

    try {
      await fs.unlink(resolved)
      return { success: true }
    } catch {
      return reply.code(404).send({ success: false, message: "Image not found" })
    }
  })
}

export default uploadRoutes
