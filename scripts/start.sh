#!/bin/bash
set -e
echo "🚀 Starting Conlang Manager..."
docker-compose up -d postgres redis adminer redis-commander
sleep 10
npm run db:push
npm run db:seed
echo "✅ Ready! Run 'npm run dev' to start the app"
