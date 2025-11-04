# 🪣 Vercel Blob Storage Setup

Complete guide for setting up Vercel Blob storage in Thailand Marketplace.

## 🎯 Why Vercel Blob?

### Advantages

✅ **Simple Setup** - No Docker containers or infrastructure
✅ **Global CDN** - Files served fast worldwide automatically
✅ **Free Tier** - 500GB bandwidth/month included
✅ **Image Optimization** - Built-in image processing
✅ **Edge-Ready** - Works on Vercel Edge Functions
✅ **Zero Config** - No buckets, no permissions setup
✅ **Automatic Backups** - Managed by Vercel

### Comparison

| Feature | Vercel Blob | MinIO | AWS S3 |
|---------|-------------|-------|--------|
| Setup | ⚡ 2 min | 🔧 15 min | 🔧 30 min |
| Infrastructure | ✅ None | 🐳 Docker | ☁️ AWS Account |
| CDN | ✅ Built-in | ❌ Manual | 💰 CloudFront |
| Free Tier | 500GB/mo | ✅ Unlimited local | 5GB |
| Image Optimization | ✅ Built-in | ❌ Manual | ❌ Manual |
| Maintenance | ✅ Zero | 🔧 Manual | 🔧 Manual |

## 📋 Prerequisites

- Vercel account (free)
- Project deployed on Vercel (or link existing project)

## 🚀 Step 1: Create Vercel Blob Store

### Via Vercel Dashboard

1. Go to https://vercel.com/dashboard
2. Select your project (or create new one)
3. Go to **Storage** tab
4. Click **Create Database**
5. Select **Blob**
6. Name it: `thailand-marketplace-storage`
7. Click **Create**

### Via Vercel CLI

```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Link project (if not linked yet)
vercel link

# Create Blob store
vercel blob create thailand-marketplace-storage
```

## 🔑 Step 2: Get Access Token

### From Dashboard

1. Go to **Storage → Blob → thailand-marketplace-storage**
2. Click **Settings**
3. Copy **Read-Write Token**
4. Format: `vercel_blob_rw_XXXXXXXXXXXXXXXX`

### From CLI

```bash
# Get token
vercel env pull .env.local
```

## 🔧 Step 3: Configure Environment Variables

### Local Development

Add to `.env.local`:

```bash
BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXXXXXXXXXX
```

### Production (Vercel)

```bash
# Add via CLI
vercel env add BLOB_READ_WRITE_TOKEN production

# Or via dashboard:
# Settings → Environment Variables → Add
```

### CI/CD (GitHub Actions)

Add to GitHub Secrets:

```
Name: BLOB_READ_WRITE_TOKEN
Value: vercel_blob_rw_XXXXXXXXXXXXXXXX
```

## 📦 Step 4: Install Package

```bash
# Install Vercel Blob SDK
bun add @vercel/blob

# TypeScript types included
```

## 💻 Step 5: Usage Examples

### Basic Upload

```typescript
import { put } from '@vercel/blob';

// Upload file
export async function uploadImage(file: File) {
  const blob = await put(
    `cars/${file.name}`,
    file,
    {
      access: 'public',
      addRandomSuffix: true, // Prevents name conflicts
    }
  );

  return blob.url; // https://xxx.public.blob.vercel-storage.com/...
}
```

### Upload from Buffer

```typescript
import { put } from '@vercel/blob';

// Upload from buffer (server-side)
export async function uploadFromBuffer(
  filename: string,
  buffer: Buffer,
  contentType: string
) {
  const blob = await put(filename, buffer, {
    access: 'public',
    contentType,
  });

  return blob;
}
```

### List Files

```typescript
import { list } from '@vercel/blob';

// List all files
const { blobs } = await list();

// List with prefix
const { blobs: carImages } = await list({
  prefix: 'cars/',
  limit: 100,
});

console.log(blobs);
// [
//   {
//     url: 'https://...',
//     pathname: 'cars/toyota-camry.jpg',
//     size: 125840,
//     uploadedAt: Date,
//   }
// ]
```

### Delete File

```typescript
import { del } from '@vercel/blob';

// Delete single file
await del('https://xxx.public.blob.vercel-storage.com/file.jpg');

// Delete multiple files
await del([
  'https://xxx.public.blob.vercel-storage.com/file1.jpg',
  'https://xxx.public.blob.vercel-storage.com/file2.jpg',
]);
```

### Copy File

```typescript
import { copy } from '@vercel/blob';

// Copy file
const newBlob = await copy(
  'https://xxx.public.blob.vercel-storage.com/original.jpg',
  'backups/original-backup.jpg',
  { access: 'public' }
);
```

### Get Metadata

```typescript
import { head } from '@vercel/blob';

// Get file metadata without downloading
const metadata = await head(
  'https://xxx.public.blob.vercel-storage.com/file.jpg'
);

console.log(metadata);
// {
//   url: 'https://...',
//   size: 125840,
//   uploadedAt: Date,
//   pathname: 'file.jpg',
//   contentType: 'image/jpeg',
//   contentDisposition: 'attachment; filename="file.jpg"',
// }
```

## 🎨 Image Optimization

Vercel Blob automatically optimizes images:

```typescript
// Original image
const imageUrl = 'https://xxx.public.blob.vercel-storage.com/car.jpg';

// Optimized with Next.js Image component
<Image
  src={imageUrl}
  alt="Car"
  width={800}
  height={600}
  quality={85}
/>

// Manual optimization via URL params
const optimized = `${imageUrl}?w=800&q=85&fm=webp`;
```

## 📱 Complete API Service Example

```typescript
// lib/storage.ts
import { put, del, list } from '@vercel/blob';

export class StorageService {
  private readonly basePrefix: string;

  constructor(prefix: string = '') {
    this.basePrefix = prefix;
  }

  /**
   * Upload file with automatic path organization
   */
  async upload(
    category: 'cars' | 'documents' | 'avatars',
    file: File | Buffer,
    filename?: string
  ) {
    const path = `${this.basePrefix}${category}/${filename || file.name}`;

    const blob = await put(path, file, {
      access: 'public',
      addRandomSuffix: true,
    });

    return {
      url: blob.url,
      pathname: blob.pathname,
      size: blob.size,
    };
  }

  /**
   * Delete file by URL
   */
  async delete(url: string) {
    await del(url);
  }

  /**
   * Delete multiple files
   */
  async deleteMany(urls: string[]) {
    await del(urls);
  }

  /**
   * List files by category
   */
  async listByCategory(category: string, limit = 100) {
    const { blobs } = await list({
      prefix: `${this.basePrefix}${category}/`,
      limit,
    });

    return blobs;
  }

  /**
   * Get file size
   */
  async getSize(url: string) {
    const { size } = await head(url);
    return size;
  }
}

// Usage
const storage = new StorageService();

// Upload car image
const carImage = await storage.upload('cars', imageFile, 'toyota-camry.jpg');

// List all car images
const carImages = await storage.listByCategory('cars');

// Delete image
await storage.delete(carImage.url);
```

## 🔒 Access Control

### Public Access (Default)

```typescript
// Anyone can view
await put('file.jpg', file, { access: 'public' });
```

### Private Access (Vercel Pro)

```typescript
// Requires authentication token
await put('private-doc.pdf', file, { access: 'private' });

// Generate signed URL (expires in 1 hour)
const signedUrl = await generateSignedUrl(privateUrl, {
  expiresIn: 3600,
});
```

## 💰 Pricing

### Free Tier
- ✅ 500GB bandwidth/month
- ✅ 100GB storage
- ✅ Unlimited requests
- ✅ Global CDN

### Pro Tier ($20/month)
- ✅ 5TB bandwidth/month
- ✅ 1TB storage
- ✅ Private files support
- ✅ Advanced analytics

### Enterprise
- Custom limits
- SLA guarantees
- Priority support

## 🧪 Testing

### Local Development

```typescript
// Use mock in tests
jest.mock('@vercel/blob', () => ({
  put: jest.fn().mockResolvedValue({
    url: 'https://mock.blob.com/file.jpg',
    pathname: 'file.jpg',
    size: 1024,
  }),
  del: jest.fn().mockResolvedValue(undefined),
  list: jest.fn().mockResolvedValue({
    blobs: [],
  }),
}));
```

### Environment Variables

```bash
# .env.test
BLOB_READ_WRITE_TOKEN=test_token_for_ci
```

## 🔄 Migration from MinIO/S3

### 1. Keep Dual Support (Recommended)

```typescript
// lib/storage-adapter.ts
import { put as blobPut, del as blobDel } from '@vercel/blob';
import { S3Client } from '@aws-sdk/client-s3';

const useBlob = process.env.BLOB_READ_WRITE_TOKEN;
const useS3 = process.env.MINIO_ENDPOINT;

export async function uploadFile(file: File) {
  if (useBlob) {
    return blobPut(file.name, file, { access: 'public' });
  }

  if (useS3) {
    // S3/MinIO upload logic
  }

  throw new Error('No storage configured');
}
```

### 2. Migrate Existing Files

```typescript
// scripts/migrate-to-blob.ts
import { put } from '@vercel/blob';
import { S3Client, GetObjectCommand, ListObjectsV2Command } from '@aws-sdk/client-s3';

async function migrateFromS3ToBlob() {
  const s3 = new S3Client({...});

  // List all objects
  const objects = await s3.send(new ListObjectsV2Command({
    Bucket: 'marketplace-images',
  }));

  // Upload each to Vercel Blob
  for (const obj of objects.Contents || []) {
    const { Body } = await s3.send(new GetObjectCommand({
      Bucket: 'marketplace-images',
      Key: obj.Key,
    }));

    const buffer = await Body.transformToByteArray();

    await put(obj.Key, Buffer.from(buffer), {
      access: 'public',
    });

    console.log(`Migrated: ${obj.Key}`);
  }
}
```

## 🐛 Troubleshooting

### Token Not Found

```
Error: BLOB_READ_WRITE_TOKEN is required
```

**Solution**: Ensure token is in `.env.local` or environment variables

### Upload Fails

```
Error: Request failed with status 413
```

**Solution**: File too large. Max size: 500MB per file

### Rate Limiting

```
Error: Too many requests
```

**Solution**: Implement retry logic with exponential backoff

## 📚 Resources

- **Docs**: https://vercel.com/docs/storage/vercel-blob
- **SDK**: https://www.npmjs.com/package/@vercel/blob
- **Pricing**: https://vercel.com/docs/storage/vercel-blob/usage-and-pricing
- **Dashboard**: https://vercel.com/dashboard/stores

## ✅ Checklist

- [ ] Create Vercel Blob store
- [ ] Copy Read-Write token
- [ ] Add token to `.env.local`
- [ ] Add token to Vercel environment variables
- [ ] Add token to GitHub Secrets (if using CI/CD)
- [ ] Install `@vercel/blob` package
- [ ] Update storage service code
- [ ] Test upload/download
- [ ] Deploy to Vercel

---

🎉 You're ready to use Vercel Blob Storage!
