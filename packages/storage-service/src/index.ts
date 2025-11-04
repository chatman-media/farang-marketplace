/**
 * @marketplace/storage-service
 * Unified storage service supporting Vercel Blob and S3-compatible storage
 */

import { put, del, list, head, copy } from '@vercel/blob';

export interface UploadOptions {
  /** File category for organization */
  category?: 'cars' | 'equipment' | 'documents' | 'avatars' | 'other';
  /** Custom filename (optional, uses original if not provided) */
  filename?: string;
  /** Add random suffix to prevent name conflicts */
  addRandomSuffix?: boolean;
  /** Content type override */
  contentType?: string;
  /** Access level */
  access?: 'public' | 'private';
}

export interface UploadResult {
  /** Public URL to access the file */
  url: string;
  /** File path in storage */
  pathname: string;
  /** File size in bytes */
  size: number;
  /** Upload timestamp */
  uploadedAt: Date;
}

export interface ListOptions {
  /** Filter by category prefix */
  category?: string;
  /** Maximum number of results */
  limit?: number;
  /** Pagination cursor */
  cursor?: string;
}

/**
 * Unified Storage Service
 * Provides a simple interface for file storage operations
 */
export class StorageService {
  private readonly basePrefix: string;

  constructor(prefix: string = '') {
    this.basePrefix = prefix;
  }

  /**
   * Upload a file to storage
   *
   * @example
   * ```ts
   * const storage = new StorageService();
   * const result = await storage.upload(imageFile, {
   *   category: 'cars',
   *   filename: 'toyota-camry-2024.jpg'
   * });
   * console.log(result.url);
   * ```
   */
  async upload(
    file: File | Buffer | Blob,
    options: UploadOptions = {}
  ): Promise<UploadResult> {
    const {
      category = 'other',
      filename,
      addRandomSuffix = true,
      contentType,
      access = 'public',
    } = options;

    // Build file path
    const name = filename || (file instanceof File ? file.name : 'file');
    const path = `${this.basePrefix}${category}/${name}`;

    // Upload to Vercel Blob
    const blob = await put(path, file, {
      access,
      addRandomSuffix,
      contentType,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };
  }

  /**
   * Upload multiple files at once
   *
   * @example
   * ```ts
   * const results = await storage.uploadMany([
   *   { file: image1, options: { category: 'cars' } },
   *   { file: image2, options: { category: 'cars' } },
   * ]);
   * ```
   */
  async uploadMany(
    uploads: Array<{ file: File | Buffer | Blob; options?: UploadOptions }>
  ): Promise<UploadResult[]> {
    return Promise.all(
      uploads.map(({ file, options }) => this.upload(file, options))
    );
  }

  /**
   * Delete a file by URL
   *
   * @example
   * ```ts
   * await storage.delete('https://xxx.blob.vercel-storage.com/file.jpg');
   * ```
   */
  async delete(url: string): Promise<void> {
    await del(url);
  }

  /**
   * Delete multiple files
   *
   * @example
   * ```ts
   * await storage.deleteMany([url1, url2, url3]);
   * ```
   */
  async deleteMany(urls: string[]): Promise<void> {
    if (urls.length === 0) return;
    await del(urls);
  }

  /**
   * List files with optional filtering
   *
   * @example
   * ```ts
   * // List all car images
   * const files = await storage.list({ category: 'cars', limit: 50 });
   * ```
   */
  async list(options: ListOptions = {}) {
    const { category, limit = 100, cursor } = options;

    const prefix = category
      ? `${this.basePrefix}${category}/`
      : this.basePrefix;

    const result = await list({
      prefix,
      limit,
      cursor,
    });

    return {
      blobs: result.blobs.map((blob) => ({
        url: blob.url,
        pathname: blob.pathname,
        size: blob.size,
        uploadedAt: blob.uploadedAt,
      })),
      cursor: result.cursor,
      hasMore: result.hasMore,
    };
  }

  /**
   * Get file metadata without downloading
   *
   * @example
   * ```ts
   * const metadata = await storage.getMetadata(fileUrl);
   * console.log(`File size: ${metadata.size} bytes`);
   * ```
   */
  async getMetadata(url: string) {
    const metadata = await head(url);
    return {
      url: metadata.url,
      size: metadata.size,
      uploadedAt: metadata.uploadedAt,
      pathname: metadata.pathname,
      contentType: metadata.contentType,
      contentDisposition: metadata.contentDisposition,
    };
  }

  /**
   * Copy a file to a new location
   *
   * @example
   * ```ts
   * const backup = await storage.copy(
   *   originalUrl,
   *   'backups/file-backup.jpg'
   * );
   * ```
   */
  async copy(
    sourceUrl: string,
    destinationPath: string,
    options: { access?: 'public' | 'private' } = {}
  ): Promise<UploadResult> {
    const blob = await copy(sourceUrl, destinationPath, {
      access: options.access || 'public',
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
      uploadedAt: blob.uploadedAt,
    };
  }

  /**
   * Delete all files in a category
   *
   * @example
   * ```ts
   * await storage.deleteCategory('old-cars');
   * ```
   */
  async deleteCategory(category: string): Promise<number> {
    const { blobs } = await this.list({ category, limit: 1000 });
    const urls = blobs.map((b) => b.url);

    if (urls.length > 0) {
      await this.deleteMany(urls);
    }

    return urls.length;
  }

  /**
   * Get total size of all files in a category
   *
   * @example
   * ```ts
   * const totalSize = await storage.getCategorySize('cars');
   * console.log(`Total: ${totalSize} bytes`);
   * ```
   */
  async getCategorySize(category: string): Promise<number> {
    const { blobs } = await this.list({ category, limit: 1000 });
    return blobs.reduce((total, blob) => total + blob.size, 0);
  }
}

/**
 * Default storage instance
 * Use this for simple operations without creating a new instance
 *
 * @example
 * ```ts
 * import { storage } from '@marketplace/storage-service';
 *
 * const result = await storage.upload(file, { category: 'cars' });
 * ```
 */
export const storage = new StorageService();

/**
 * Helper function to format file size
 *
 * @example
 * ```ts
 * formatBytes(1024) // "1 KB"
 * formatBytes(1048576) // "1 MB"
 * ```
 */
export function formatBytes(bytes: number, decimals = 2): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];

  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(dm))} ${sizes[i]}`;
}

/**
 * Helper to validate file type
 *
 * @example
 * ```ts
 * isImageFile('image.jpg') // true
 * isImageFile('document.pdf') // false
 * ```
 */
export function isImageFile(filename: string): boolean {
  const ext = filename.split('.').pop()?.toLowerCase();
  return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'svg'].includes(ext || '');
}

/**
 * Helper to get file extension
 *
 * @example
 * ```ts
 * getFileExtension('photo.jpg') // "jpg"
 * ```
 */
export function getFileExtension(filename: string): string {
  return filename.split('.').pop()?.toLowerCase() || '';
}

// Export Vercel Blob utilities for advanced usage
export { put, del, list, head, copy } from '@vercel/blob';
