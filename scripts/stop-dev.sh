#!/bin/bash

# Stop development services script
echo "🛑 Stopping development services..."

# Function to stop a service
stop_service() {
    local service_name=$1
    local pid_file="logs/${service_name}.pid"
    
    if [ -f "$pid_file" ]; then
        local pid=$(cat "$pid_file")
        if kill -0 "$pid" 2>/dev/null; then
            echo "🔴 Stopping $service_name (PID: $pid)..."
            kill "$pid"
            rm "$pid_file"
            echo "✅ $service_name stopped"
        else
            echo "⚠️  $service_name was not running"
            rm "$pid_file"
        fi
    else
        echo "⚠️  No PID file found for $service_name"
    fi
}

# Stop services
stop_service "web-app"
stop_service "listing-service" 
stop_service "api-gateway"

# Kill any remaining processes on our ports
echo ""
echo "🧹 Cleaning up any remaining processes..."

for port in 3000 3001 3003; do
    local pid=$(lsof -ti:$port 2>/dev/null)
    if [ ! -z "$pid" ]; then
        echo "🔴 Killing process on port $port (PID: $pid)"
        kill -9 "$pid" 2>/dev/null || true
    fi
done

echo ""
echo "✅ All development services stopped!"
