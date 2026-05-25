#!/bin/bash
cd /home/z/my-project
while true; do
  npx next dev -p 3000 >> /home/z/my-project/next-output.log 2>&1
  echo "[$(date)] Server died, restarting in 3s..." >> /home/z/my-project/next-output.log
  sleep 3
done
