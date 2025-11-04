# 🔄 Migration to Vercel Blob

Quick start guide for switching from MinIO to Vercel Blob storage.

## ✅ What Changed

- ✅ **Removed**: MinIO Docker container
- ✅ **Added**: Vercel Blob configuration
- ✅ **Created**: `@marketplace/storage-service` package
- ✅ **Updated**: Environment variables

## 🚀 Quick Setup (5 minutes)

### 1. Get Vercel Blob Token

```bash
# Option A: Via Vercel Dashboard
# 1. Go to https://vercel.com/dashboard
# 2. Select your project
# 3. Storage → Create → Blob
# 4. Copy token

# Option B: Via CLI
npm i -g vercel
vercel login
vercel link
vercel blob create thailand-marketplace-storage
```

### 2. Configure Environment

```bash
# Copy to .env.local
echo "BLOB_READ_WRITE_TOKEN=vercel_blob_rw_XXXXXXXX" >> .env.local

# Or add to Vercel project
vercel env add BLOB_READ_WRITE_TOKEN production
```

### 3. Install Package

```bash
# Install storage service
cd packages/storage-service
bun install

# Build
bun run build
```

### 4. Use in Code

```typescript
import { storage } from '@marketplace/storage-service';

// Upload
const result = await storage.upload(file, {
  category: 'cars',
  filename: 'toyota-camry.jpg'
});

console.log(result.url); // Ready to use!
```

## 📋 Full Documentation

- **Setup Guide**: [docs/VERCEL_BLOB_SETUP.md](docs/VERCEL_BLOB_SETUP.md)
- **API Reference**: [packages/storage-service/README.md](packages/storage-service/README.md)

## 💡 Benefits

| Feature | MinIO (Before) | Vercel Blob (Now) |
|---------|----------------|-------------------|
| Setup | 🔧 Docker + Config | ⚡ 2 minutes |
| CDN | ❌ Manual | ✅ Automatic |
| Free Tier | Local only | 500GB/month |
| Maintenance | 🔧 Self-managed | ✅ Zero |
| Image Optimization | ❌ Manual | ✅ Built-in |

## 🎯 Next Steps

1. ✅ Get token from Vercel
2. ✅ Add to environment variables
3. ✅ Use `@marketplace/storage-service`
4. ✅ Deploy and test

Questions? Check [VERCEL_BLOB_SETUP.md](docs/VERCEL_BLOB_SETUP.md)

---

**Migration Date**: 2025-11-04
**Status**: ✅ Ready to use
