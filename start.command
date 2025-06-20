#!/bin/bash
cd "$(dirname "$0")"

echo "Starting Net Worth Tracker..."

# Start backend
echo "Starting backend..."
cd server
node index.js &
cd ..

# Start frontend
sleep 2
echo "Starting frontend..."
cd client
npm run dev 