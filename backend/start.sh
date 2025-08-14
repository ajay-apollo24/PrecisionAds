#!/bin/bash

echo "🚀 Starting Precision Ads Platform..."

# Check if .env file exists
if [ ! -f ".env" ]; then
    echo "❌ .env file not found. Please run setup.sh first or create .env file manually."
    exit 1
fi

# Function to cleanup background processes
cleanup() {
    echo "🛑 Shutting down servers..."
    kill $BACKEND_PID $FRONTEND_PID 2>/dev/null
    exit 0
}

# Set trap to cleanup on exit
trap cleanup SIGINT SIGTERM

# Start backend
echo "🔧 Starting backend server..."
cd backend
npm run dev &
BACKEND_PID=$!
cd ..

# Wait a moment for backend to start
sleep 3

# Start frontend
echo "🔧 Starting frontend server..."
cd frontend
npm start &
FRONTEND_PID=$!
cd ..

echo ""
echo "✅ Servers started successfully!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔗 Backend:  http://localhost:3001"
echo "📚 API Docs: http://localhost:3001/api/v1/docs"
echo ""
echo "Press Ctrl+C to stop all servers"

# Wait for both processes
wait 