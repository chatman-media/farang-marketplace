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
echo "🚀 Starting core development servers..."

# Function to start a service in background
start_service() {
    local service_name=$1
    local service_path=$2
    local port=$3

    echo "📦 Starting $service_name on port $port..."
    cd "$service_path"
    bun run dev > "../logs/${service_name}.log" 2>&1 &
    local pid=$!
    echo "$pid" > "../logs/${service_name}.pid"
    cd - > /dev/null
    echo "✅ $service_name started (PID: $pid)"
}

# Create logs directory
mkdir -p logs

# Start core services
start_service "api-gateway" "services/api-gateway" "3000"
sleep 2
start_service "listing-service" "services/listing-service" "3003"
sleep 2
start_service "web-app" "apps/web" "3001"

echo ""
echo "🎉 Core services started!"
echo ""
echo "Available endpoints:"
echo "  - Web App: http://localhost:3001"
echo "  - API Gateway: http://localhost:3000"
echo "  - Listings API: http://localhost:3000/api/listings"
echo "  - Service Providers API: http://localhost:3000/api/service-providers"
echo ""
echo "📊 Service status: http://localhost:3000/services"
echo "📝 Logs are in ./logs/ directory"
echo ""
echo "To stop all services, run: ./scripts/stop-dev.sh"