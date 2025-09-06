import multer from 'multer';
import sharp from 'sharp';
import path from 'path';
import fs from 'fs/promises';
import { Request, Response, NextFunction } from 'express';

// Configure multer for memory storage
const storage = multer.memoryStorage();

// File filter for images
const fileFilter = (
  req: Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        'Invalid file type. Only JPEG, PNG, and WebP images are allowed.'
      )
    );
  }
};

// Multer configuration
export const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
    files: 20, // Maximum 20 files
  },
});

// Image processing middleware
export const processImages = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
      return next();
    }

    const uploadDir = path.join(process.cwd(), 'uploads', 'listings');
    await fs.mkdir(uploadDir, { recursive: true });

    const processedImages: string[] = [];

    for (const file of req.files) {
      const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}`;

      // Process main image (800x600)
      const mainImagePath = path.join(uploadDir, `${filename}.webp`);
      await sharp(file.buffer)
        .resize(800, 600, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 85 })
        .toFile(mainImagePath);

      // Process thumbnail (300x225)
      const thumbnailPath = path.join(uploadDir, `${filename}_thumb.webp`);
      await sharp(file.buffer)
        .resize(300, 225, {
          fit: 'cover',
          position: 'center',
        })
        .webp({ quality: 80 })
        .toFile(thumbnailPath);

      // Store relative paths
      processedImages.push(`/uploads/listings/${filename}.webp`);
    }

    // Add processed image URLs to request
    req.body.processedImages = processedImages;
    next();
  } catch (error) {
    console.error('Image processing error:', error);
    res.status(500).json({
      error: {
        code: 'IMAGE_PROCESSING_ERROR',
        message: 'Failed to process uploaded images',
        details: error instanceof Error ? error.message : 'Unknown error',
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }
};

// Validation middleware for image uploads
export const validateImageUpload = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const maxImages = 20;
  const minImages = 1;

  if (!req.files || !Array.isArray(req.files)) {
    return res.status(400).json({
      error: {
        code: 'NO_IMAGES_UPLOADED',
        message: `At least ${minImages} image is required`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }

  if (req.files.length < minImages) {
    return res.status(400).json({
      error: {
        code: 'INSUFFICIENT_IMAGES',
        message: `At least ${minImages} image is required`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }

  if (req.files.length > maxImages) {
    return res.status(400).json({
      error: {
        code: 'TOO_MANY_IMAGES',
        message: `Maximum ${maxImages} images allowed`,
        timestamp: new Date().toISOString(),
        requestId: req.headers['x-request-id'] || 'unknown',
      },
    });
  }

  next();
};

// Cleanup old images
export const cleanupImages = async (imagePaths: string[]) => {
  try {
    for (const imagePath of imagePaths) {
      const fullPath = path.join(process.cwd(), imagePath.replace(/^\//, ''));
      const thumbnailPath = fullPath.replace('.webp', '_thumb.webp');

      try {
        await fs.unlink(fullPath);
        await fs.unlink(thumbnailPath);
      } catch (error) {
        console.warn(`Failed to delete image: ${fullPath}`, error);
      }
    }
  } catch (error) {
    console.error('Image cleanup error:', error);
  }
};

// Serve static images
export const serveImages = (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  const imagePath = path.join(process.cwd(), 'uploads', req.path);

  // Check if file exists
  fs.access(imagePath)
    .then(() => {
      // Set appropriate headers
      res.setHeader('Cache-Control', 'public, max-age=31536000'); // 1 year
      res.setHeader('Content-Type', 'image/webp');
      res.sendFile(imagePath);
    })
    .catch(() => {
      res.status(404).json({
        error: {
          code: 'IMAGE_NOT_FOUND',
          message: 'Image not found',
          timestamp: new Date().toISOString(),
          requestId: req.headers['x-request-id'] || 'unknown',
        },
      });
    });
};
