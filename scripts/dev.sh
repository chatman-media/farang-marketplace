#!/bin/bash

# Development startup script
echo "🚀 Starting Marketplace Development Environment"

# Check if Docker is running
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

# Start development services
echo "📦 Starting development services (PostgreSQL, Redis, MinIO)..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
    echo "📥 Installing dependencies..."
    bun install
fi

# Build shared types
echo "🔧 Building shared types..."
bun run --filter @marketplace/shared-types build

echo "✅ Development environment is ready!"
echo ""
echo "Available services:"
echo "  - PostgreSQL: localhost:5432"
echo "  - Redis: localhost:6379"
echo "  - MinIO: localhost:9000 (console: localhost:9001)"
echo ""
echo "To start development servers, run:"
echo "  bun run dev"
echo ""
echo "Individual apps:"
echo "  - Web: bun run --filter @marketplace/web dev"
echo "  - TON App: bun run --filter @marketplace/ton-app dev"
echo "  - Admin: bun run --filter @marketplace/admin dev"