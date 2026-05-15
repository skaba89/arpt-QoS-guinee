#!/bin/bash
cd /home/z/my-project
export PORT=3000
export HOSTNAME=0.0.0.0
exec node node_modules/.bin/next dev -p 3000 -H 0.0.0.0
