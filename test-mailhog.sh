#!/bin/bash

echo "🚀 Testing MailHog setup..."
echo ""

# Check Docker
echo "1️⃣ Checking Docker..."
if ! docker info >/dev/null 2>&1; then
    echo "❌ Docker daemon is not running!"
    echo "   Please start Docker Desktop and try again"
    exit 1
fi
echo "✅ Docker is running"
echo ""

# Start MailHog
echo "2️⃣ Starting MailHog..."
docker compose up -d mailhog
sleep 3

# Check if MailHog is running
if docker ps | grep -q mailhog; then
    echo "✅ MailHog container is running"
else
    echo "❌ MailHog failed to start"
    echo "   Check logs: docker compose logs mailhog"
    exit 1
fi
echo ""

# Check MailHog ports
echo "3️⃣ Checking MailHog ports..."
if nc -z localhost 1025 2>/dev/null; then
    echo "✅ SMTP server is ready on port 1025"
else
    echo "⚠️  SMTP server not responding on port 1025"
fi

if nc -z localhost 8025 2>/dev/null; then
    echo "✅ Web UI is ready on port 8025"
else
    echo "⚠️  Web UI not responding on port 8025"
fi
echo ""

# Run test
echo "4️⃣ Sending test email..."
cd services/crm-service
bun run test-email.ts
echo ""

echo "5️⃣ Open MailHog UI:"
echo "   http://localhost:8025"
echo ""
echo "✨ Done!"
