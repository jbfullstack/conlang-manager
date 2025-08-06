#!/bin/bash
echo "🛑 Stopping everything..."
pkill -f "next dev" || echo "No Next.js running"
docker-compose down
echo "✅ All stopped!"
