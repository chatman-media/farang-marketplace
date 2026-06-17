import { randomUUID } from "node:crypto"
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
  // Returns { success: true, images: ["/uploads/listings/<userId>/xxx.webp", ...] }
  fastify.post("/images", { preHandler: [authMiddleware] }, async (request, reply) => {
    // Files are namespaced per user so that deletes can be authorized by ownership
    // (see DELETE below) without a DB lookup at this pre-listing-creation stage.
    const ownerId = sanitizeUserId(request.user?.id)
    if (!ownerId) {
      return reply.code(401).send({ success: false, message: "Authentication required" })
    }

    const uploadDir = path.join(process.cwd(), env.UPLOAD_PATH, "listings", ownerId)
    await fs.mkdir(uploadDir, { recursive: true })

    const savedPaths: string[] = []
    const writtenFiles: string[] = []

    const parts = request.files({ limits: { fileSize: MAX_FILE_BYTES, files: MAX_FILES } })

    try {
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

        const uid = `${Date.now()}-${randomUUID()}`
        const outFile = path.join(uploadDir, `${uid}.webp`)

        try {
          await sharp(buffer)
            .resize(1200, 900, { fit: "inside", withoutEnlargement: true })
            .webp({ quality: 85 })
            .toFile(outFile)
        } catch (err) {
          // Corrupt / non-image payload with an allowed MIME — skip this file
          // instead of 500-ing the whole batch.
          logger.warn("Image processing failed, skipping file", err)
          continue
        }

        writtenFiles.push(outFile)
        savedPaths.push(`/uploads/listings/${ownerId}/${uid}.webp`)
      }
    } catch (err) {
      // Iterator-level failure (too many files / malformed multipart). Roll back
      // anything already written so we don't leave orphaned files on disk.
      logger.warn("Upload stream failed, rolling back partial uploads", err)
      await Promise.all(writtenFiles.map((f) => fs.unlink(f).catch(() => {})))
      return reply.code(400).send({
        success: false,
        message: `Upload failed. Check file count (max ${MAX_FILES}), format and size (max 10 MB each).`,
      })
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
  // Body: { path: "/uploads/listings/<userId>/xxx.webp" }
  // Removes the file from disk. Only the user who uploaded it may delete it.
  fastify.delete<{ Body: { path: string } }>("/images", { preHandler: [authMiddleware] }, async (request, reply) => {
    const ownerId = sanitizeUserId(request.user?.id)
    if (!ownerId) {
      return reply.code(401).send({ success: false, message: "Authentication required" })
    }

    const imgPath = request.body?.path
    if (!imgPath || typeof imgPath !== "string") {
      return reply.code(400).send({ success: false, message: '"path" is required' })
    }

    const uploadsRoot = path.join(process.cwd(), env.UPLOAD_PATH)
    const relative = imgPath.replace(/^\/uploads\//, "")
    const resolved = path.resolve(uploadsRoot, relative)

    // Confine deletes to the caller's own folder. This blocks both path traversal
    // and deleting another user's images (IDOR).
    const ownerDir = path.join(uploadsRoot, "listings", ownerId)
    if (!resolved.startsWith(ownerDir + path.sep)) {
      return reply.code(403).send({ success: false, message: "Invalid path" })
    }

    try {
      await fs.unlink(resolved)
      return { success: true }
    } catch {
      return reply.code(404).send({ success: false, message: "Image not found" })
    }
  })
}

// User ids come from a verified JWT, but they end up as a filesystem path
// segment — strip anything that isn't a safe identifier character defensively.
function sanitizeUserId(id: string | undefined): string | null {
  if (!id) return null
  const safe = id.replace(/[^a-zA-Z0-9_-]/g, "")
  return safe.length > 0 ? safe : null
}

export default uploadRoutes
