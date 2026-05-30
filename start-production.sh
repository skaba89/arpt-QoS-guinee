#!/bin/bash
# Production server startup with double-fork for process isolation
# This prevents the ZAI agent from killing the server process
cd /home/z/my-project
(setsid node server.js > /tmp/next-production.log 2>&1 &)
