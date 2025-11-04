#!/bin/bash

# Verification Script for Development Environment Setup
set -e

echo "🔍 Verifying Marketplace Rental Platform setup..."

# Check if all required tools are available
echo "📋 Checking prerequisites..."

if ! command -v bun &> /dev/null; then
    echo "❌ Bun is not installed"
    exit 1
fi
echo "✅ Bun is installed"

if ! command -v docker &> /dev/null; then
    echo "❌ Docker is not installed"
    exit 1
fi
echo "✅ Docker is installed"

# Check if dependencies are installed
echo "📦 Checking dependencies..."
if [ ! -d "node_modules" ]; then
    echo "❌ Dependencies not installed. Run 'bun install' first."
    exit 1
fi
echo "✅ Dependencies are installed"

# Build shared types
echo "🔨 Building shared types package..."
bun run build --filter=@marketplace/shared-types

# Run type checking
echo "🔍 Running type checks..."
bun run type-check --filter=@marketplace/shared-types

# Run linting
echo "🧹 Running linting..."
bun run lint --filter=@marketplace/shared-types

# Check formatting
echo "💅 Checking code formatting..."
bun run format:check

# Check Docker services
echo "🐳 Checking Docker services..."
if docker-compose ps | grep -q "Up"; then
    echo "✅ Docker services are running"
else
    echo "⚠️  Docker services are not running. Run 'bun run docker:up' to start them."
fi

# Verify project structure
echo "📁 Verifying project structure..."
required_dirs=(
    "packages/shared-types"
    "services/user-service"
    "apps/web"
    "apps/admin"
    "apps/ton-app"
    "docker"
    "scripts"
    "docs"
)

for dir in "${required_dirs[@]}"; do
    if [ ! -d "$dir" ]; then
        echo "❌ Missing directory: $dir"
        exit 1
    fi
done
echo "✅ Project structure is correct"

# Check configuration files
echo "⚙️  Checking configuration files..."
required_files=(
    "package.json"
    "turbo.json"
    "biome.json"
    "tsconfig.json"
    "docker-compose.yml"
    ".env.example"
)

for file in "${required_files[@]}"; do
    if [ ! -f "$file" ]; then
        echo "❌ Missing file: $file"
        exit 1
    fi
done
echo "✅ Configuration files are present"

# Check shared types build output
if [ ! -d "packages/shared-types/dist" ]; then
    echo "❌ Shared types not built"
    exit 1
fi
echo "✅ Shared types are built"

echo ""
echo "🎉 Setup verification completed successfully!"
echo ""
echo "📚 Next steps:"
echo "  1. Start Docker services: bun run docker:up"
echo "  2. Copy environment files: cp .env.example .env"
echo "  3. Start development: bun run dev"
echo ""
echo "🔗 Useful links:"
echo "  - Development guide: docs/DEVELOPMENT.md"
echo "  - Task list: .kiro/specs/marketplace-rental-platform/tasks.md"