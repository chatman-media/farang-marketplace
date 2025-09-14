import logger from "@marketplace/logger"
import { FastifyReply, FastifyRequest } from "fastify"
import fs from "fs/promises"
import multer from "multer"
import path from "path"
import sharp from "sharp"

// Configure multer for memory storage
const storage = multer.memoryStorage()

// File filter for images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"]

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error("Invalid file type. Only JPEG, PNG, and WebP images are allowed."))
  }
}

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20, // Maximum 20 files
  },
})

// Image processing middleware for Fastify
export const processImages = async (request: FastifyRequest, reply: FastifyReply) => {
  try {
    const files = (request as any).files
    if (!files || !Array.isArray(files) || files.length === 0) {
      return
    }

    const uploadDir = path.join(process.cwd(), "uploads", "listings")
    await fs.mkdir(uploadDir, { recursive: true })

    const processedImages: string[] = []

    for (const file of files) {
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`

      // Process main image (800x600)
      const mainImagePath = path.join(uploadDir, `${filename}.webp`)
      await sharp(file.buffer)
        .resize(800, 600, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 85 })
        .toFile(mainImagePath)

      // Process thumbnail (300x225)
      const thumbnailPath = path.join(uploadDir, `${filename}_thumb.webp`)
      await sharp(file.buffer)
        .resize(300, 225, {
          fit: "cover",
          position: "center",
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath)

      // Store relative paths
      processedImages.push(`/uploads/listings/${filename}.webp`)
    }

    // Add processed image URLs to request body
    if (!request.body) request.body = {}
    ;(request.body as any).processedImages = processedImages
  } catch (error) {
    logger.error("Image processing error:", error)
    reply.status(500).send({
      error: {
        code: "IMAGE_PROCESSING_ERROR",
        message: "Failed to process uploaded images",
        details: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }
}

// Validation middleware for image uploads
export const validateImageUpload = (request: FastifyRequest, reply: FastifyReply) => {
  const maxImages = 20
  const minImages = 1
  const files = (request as any).files

  if (!files || !Array.isArray(files)) {
    return reply.status(400).send({
      error: {
        code: "NO_IMAGES_UPLOADED",
        message: `At least ${minImages} image is required`,
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }

  if (files.length < minImages) {
    return reply.status(400).send({
      error: {
        code: "INSUFFICIENT_IMAGES",
        message: `At least ${minImages} image is required`,
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }

  if (files.length > maxImages) {
    return reply.status(400).send({
      error: {
        code: "TOO_MANY_IMAGES",
        message: `Maximum ${maxImages} images allowed`,
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }
}

// Cleanup old images
export const cleanupImages = async (imagePaths: string[]) => {
  try {
    for (const imagePath of imagePaths) {
      const fullPath = path.join(process.cwd(), imagePath.replace(/^\//, ""))
      const thumbnailPath = fullPath.replace(".webp", "_thumb.webp")

      try {
        await fs.unlink(fullPath)
        await fs.unlink(thumbnailPath)
      } catch (error) {
        logger.warn(`Failed to delete image: ${fullPath}`, error)
      }
    }
  } catch (error) {
    logger.error("Image cleanup error:", error)
  }
}

// Serve static images for Fastify
export const serveImages = async (request: FastifyRequest, reply: FastifyReply) => {
  const params = request.params as { "*": string }
  const imagePath = path.join(process.cwd(), "uploads", params["*"])

  try {
    // Check if file exists
    await fs.access(imagePath)

    // Set appropriate headers
    reply.header("Cache-Control", "public, max-age=31536000") // 1 year
    reply.type("image/webp")

    // Send file
    const fileStream = await fs.readFile(imagePath)
    reply.send(fileStream)
  } catch (error) {
    reply.status(404).send({
      error: {
        code: "IMAGE_NOT_FOUND",
        message: "Image not found",
        timestamp: new Date().toISOString(),
        requestId: request.headers["x-request-id"] || "unknown",
      },
    })
  }
}
