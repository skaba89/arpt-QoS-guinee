#!/bin/bash
# Persistent Next.js dev server runner
while true; do
  cd /home/z/my-project
  npx next dev -p 3000
  echo "[Restart] Server exited, restarting in 3 seconds..."
  sleep 3
done
