#!/bin/bash

# Civic Notices Testing Quick Start Script
# This script helps you quickly start testing the application

echo "🚀 Starting Civic Notices Testing Environment..."
echo ""

# Kill any existing processes on ports 5173 and 5174
echo "📍 Clearing ports 5173 and 5174..."
lsof -ti tcp:5173 | xargs kill -9 2>/dev/null || true
lsof -ti tcp:5174 | xargs kill -9 2>/dev/null || true
sleep 1

# Function to open URL after delay
open_browser() {
    sleep 5
    echo "🌐 Opening browser at http://localhost:5173"
    open http://localhost:5173 2>/dev/null || echo "Please open http://localhost:5173 in your browser"
}

# Start the servers with demo mode enabled
echo "✅ Starting servers with demo mode enabled..."
echo "   Frontend: http://localhost:5173"
echo "   API: http://localhost:5174"
echo ""
echo "📘 Testing guide available at: TESTING_GUIDE.md"
echo ""
echo "Press Ctrl+C to stop the servers"
echo ""

# Start browser opening in background
open_browser &

# Start the development servers with demo mode
VITE_DEMO_MODE=true npm run dev