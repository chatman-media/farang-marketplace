#!/bin/bash

# Development Environment Setup Script
set -e

echo "🚀 Setting up Marketplace Rental Platform development environment..."

# Check if bun is installed
if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed. Please install Bun first: https://bun.sh"
    exit 1
fi

# Check if docker is installed and running
if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed. Please install Docker first."
    exit 1
fi

if ! docker info &> /dev/null; then
    echo "❌ Docker is not running. Please start Docker first."
    exit 1
fi

echo "✅ Prerequisites check passed"

# Install dependencies
echo "📦 Installing dependencies..."
bun install

# Build shared packages first
echo "🔨 Building shared packages..."
bun run build --filter=@marketplace/shared-types

# Start Docker services
echo "🐳 Starting Docker services..."
docker-compose up -d

# Wait for services to be ready
echo "⏳ Waiting for services to be ready..."
sleep 10

# Check service health
echo "🔍 Checking service health..."
docker-compose ps

# Create MinIO buckets
echo "🪣 Setting up MinIO buckets..."
docker exec marketplace-minio mc alias set local http://localhost:9000 minioadmin minioadmin123 || true
docker exec marketplace-minio mc mb local/marketplace-images || true
docker exec marketplace-minio mc mb local/marketplace-documents || true
docker exec marketplace-minio mc policy set public local/marketplace-images || true

echo "✅ Development environment setup complete!"
echo ""
echo "🎯 Next steps:"
echo "  1. Copy .env.example to .env in each service and configure"
echo "  2. Run 'bun run dev' to start all services"
echo "  3. Access services:"
echo "     - PostgreSQL: localhost:5432"
echo "     - Redis: localhost:6379"
echo "     - MinIO Console: http://localhost:9001"
echo "     - MailHog: http://localhost:8025"
echo "     - PgAdmin: http://localhost:5050 (with --profile tools)"
echo ""
echo "📚 Useful commands:"
echo "  - bun run docker:logs    # View Docker logs"
echo "  - bun run docker:reset   # Reset Docker environment"
echo "  - bun run test           # Run all tests"
echo "  - bun run lint           # Run linting"