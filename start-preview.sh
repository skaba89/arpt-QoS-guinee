#!/bin/bash
cd /home/z/my-project

# Kill any existing server
pkill -f "next dev" 2>/dev/null
pkill -f "next start" 2>/dev/null
pkill -f "next-server" 2>/dev/null
sleep 2

# Build if needed
if [ ! -f .next/BUILD_ID ]; then
  echo "Building..."
  npx next build
fi

# Start production server (more stable than dev mode)
echo "Starting ONIT-PNG server on port 3000..."
NODE_ENV=production npx next start -p 3000 &
sleep 5

echo "Server started!"
echo "Homepage: http://localhost:3000"
curl -s -o /dev/null -w "HTTP Status: %{http_code}" http://localhost:3000/
echo ""
