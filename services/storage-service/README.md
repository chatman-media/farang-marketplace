# @marketplace/storage-service

Unified storage service for Thailand Marketplace supporting Vercel Blob and S3-compatible storage.

## 🎯 Features

- ✅ **Simple API** - Upload, delete, list files with one line
- ✅ **Vercel Blob** - Primary storage with global CDN
- ✅ **TypeScript** - Full type safety
- ✅ **Categories** - Organize files by type (cars, documents, avatars)
- ✅ **Batch Operations** - Upload/delete multiple files
- ✅ **Metadata** - Get file info without downloading
- ✅ **Helpers** - File size formatting, type validation

## 📦 Installation

```bash
bun add @marketplace/storage-service
```

## 🚀 Quick Start

```typescript
import { storage } from '@marketplace/storage-service';

// Upload file
const result = await storage.upload(imageFile, {
  category: 'cars',
  filename: 'toyota-camry-2024.jpg'
});

console.log(result.url); // https://xxx.blob.vercel-storage.com/...

// Delete file
await storage.delete(result.url);
```

## 📚 API Documentation

### Upload Single File

```typescript
const result = await storage.upload(file, {
  category: 'cars',        // 'cars' | 'equipment' | 'documents' | 'avatars' | 'other'
  filename: 'custom.jpg',  // Optional, uses original if not provided
  addRandomSuffix: true,   // Prevents name conflicts
  access: 'public',        // 'public' | 'private'
});

// Returns
{
  url: string;        // Public URL
  pathname: string;   // File path
  size: number;       // Size in bytes
  uploadedAt: Date;   // Upload timestamp
}
```

### Upload Multiple Files

```typescript
const results = await storage.uploadMany([
  { file: image1, options: { category: 'cars' } },
  { file: image2, options: { category: 'cars' } },
  { file: document, options: { category: 'documents' } },
]);
```

### Delete Files

```typescript
// Delete one
await storage.delete(fileUrl);

// Delete many
await storage.deleteMany([url1, url2, url3]);

// Delete entire category
const deletedCount = await storage.deleteCategory('old-cars');
```

### List Files

```typescript
// List all files in category
const { blobs, hasMore, cursor } = await storage.list({
  category: 'cars',
  limit: 50,
});

// Paginate
const nextPage = await storage.list({
  category: 'cars',
  cursor: cursor, // From previous result
});
```

### Get Metadata

```typescript
const metadata = await storage.getMetadata(fileUrl);

console.log(metadata);
// {
//   url: string;
//   size: number;
//   uploadedAt: Date;
//   pathname: string;
//   contentType: string;
//   contentDisposition: string;
// }
```

### Copy Files

```typescript
const backup = await storage.copy(
  originalUrl,
  'backups/file-backup.jpg',
  { access: 'public' }
);
```

### Category Operations

```typescript
// Get total size of category
const totalBytes = await storage.getCategorySize('cars');
console.log(`Total: ${formatBytes(totalBytes)}`); // "125.5 MB"

// Delete all files in category
const deleted = await storage.deleteCategory('temp-uploads');
console.log(`Deleted ${deleted} files`);
```

## 🛠️ Utility Functions

### Format File Size

```typescript
import { formatBytes } from '@marketplace/storage-service';

formatBytes(1024);       // "1 KB"
formatBytes(1048576);    // "1 MB"
formatBytes(1073741824); // "1 GB"
```

### Validate File Type

```typescript
import { isImageFile, getFileExtension } from '@marketplace/storage-service';

isImageFile('photo.jpg');     // true
isImageFile('document.pdf');  // false

getFileExtension('photo.jpg'); // "jpg"
```

## 🎨 Usage Examples

### Upload Car Image

```typescript
import { storage } from '@marketplace/storage-service';

export async function uploadCarImage(file: File, carId: string) {
  const result = await storage.upload(file, {
    category: 'cars',
    filename: `${carId}/${file.name}`,
    addRandomSuffix: true,
  });

  return result.url;
}
```

### Upload Multiple Product Images

```typescript
export async function uploadProductGallery(
  files: File[],
  productId: string
) {
  const uploads = files.map((file) => ({
    file,
    options: {
      category: 'cars' as const,
      filename: `${productId}/${file.name}`,
    },
  }));

  const results = await storage.uploadMany(uploads);
  return results.map(r => r.url);
}
```

### Upload Avatar with Validation

```typescript
import { storage, isImageFile } from '@marketplace/storage-service';

export async function uploadAvatar(file: File, userId: string) {
  // Validate
  if (!isImageFile(file.name)) {
    throw new Error('Only image files allowed');
  }

  if (file.size > 5 * 1024 * 1024) {
    throw new Error('File too large (max 5MB)');
  }

  // Upload
  const result = await storage.upload(file, {
    category: 'avatars',
    filename: `${userId}.jpg`,
    addRandomSuffix: false, // Overwrite previous avatar
  });

  return result.url;
}
```

### Clean Old Files

```typescript
export async function cleanOldUploads(category: string, daysOld: number) {
  const { blobs } = await storage.list({ category, limit: 1000 });

  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - daysOld);

  const oldFiles = blobs.filter(
    blob => blob.uploadedAt < cutoffDate
  );

  if (oldFiles.length > 0) {
    await storage.deleteMany(oldFiles.map(f => f.url));
  }

  return oldFiles.length;
}
```

## 🔧 Configuration

### Environment Variables

```bash
# .env.local
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXX
```

### Create Custom Instance

```typescript
import { StorageService } from '@marketplace/storage-service';

// With prefix for multi-tenant
const tenantStorage = new StorageService('tenant-123/');

// Upload will use prefix
await tenantStorage.upload(file, { category: 'cars' });
// Saves to: tenant-123/cars/file.jpg
```

## 🧪 Testing

```typescript
import { storage } from '@marketplace/storage-service';

// Mock in tests
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://mock.com/file.jpg',
    pathname: 'file.jpg',
    size: 1024,
    uploadedAt: new Date(),
  }),
}));

// Test
const result = await storage.upload(mockFile, { category: 'test' });
expect(result.url).toBe('https://mock.com/file.jpg');
```

## 📊 Categories

Supported categories for file organization:

- `cars` - Vehicle images and videos
- `equipment` - Equipment photos
- `documents` - Contracts, invoices, PDFs
- `avatars` - User profile pictures
- `other` - Miscellaneous files

## 🔐 Access Control

```typescript
// Public (default) - anyone can view
await storage.upload(file, { access: 'public' });

// Private (Vercel Pro) - requires auth token
await storage.upload(file, { access: 'private' });
```

## 💰 Limits

### Vercel Blob Free Tier
- 500GB bandwidth/month
- 100GB storage
- Unlimited requests
- 500MB max file size

## 🐛 Error Handling

```typescript
try {
  const result = await storage.upload(file, {
    category: 'cars',
  });
} catch (error) {
  if (error.message.includes('413')) {
    console.error('File too large (max 500MB)');
  } else if (error.message.includes('BLOB_READ_WRITE_TOKEN')) {
    console.error('Missing token, check environment variables');
  } else {
    console.error('Upload failed:', error);
  }
}
```

## 🔗 Related

- [Vercel Blob Setup Guide](../../docs/VERCEL_BLOB_SETUP.md)
- [Vercel Blob Docs](https://vercel.com/docs/storage/vercel-blob)
- [@vercel/blob Package](https://www.npmjs.com/package/@vercel/blob)

## 📄 License

MIT
