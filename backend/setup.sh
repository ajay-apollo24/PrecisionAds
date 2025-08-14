#!/bin/bash

echo "🚀 Setting up Precision Ads Platform..."

# Check if Node.js is installed
if ! command -v node &> /dev/null; then
    echo "❌ Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi

# Check if npm is installed
if ! command -v npm &> /dev/null; then
    echo "❌ npm is not installed. Please install npm first."
    exit 1
fi

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js version 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js $(node -v) detected"

# Create necessary directories
echo "📁 Creating project structure..."
mkdir -p logs
mkdir -p frontend/src/components
mkdir -p frontend/src/pages
mkdir -p frontend/src/contexts
mkdir -p frontend/src/services

# Backend setup
echo "🔧 Setting up backend..."
cd backend

if [ ! -f "package.json" ]; then
    echo "❌ Backend package.json not found. Please check the project structure."
    exit 1
fi

echo "📦 Installing backend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install backend dependencies"
    exit 1
fi

# Generate Prisma client
echo "🗄️ Generating Prisma client..."
npm run db:generate

if [ $? -ne 0 ]; then
    echo "❌ Failed to generate Prisma client"
    exit 1
fi

cd ..

# Frontend setup
echo "🔧 Setting up frontend..."
cd frontend

if [ ! -f "package.json" ]; then
    echo "❌ Frontend package.json not found. Please check the project structure."
    exit 1
fi

echo "📦 Installing frontend dependencies..."
npm install

if [ $? -ne 0 ]; then
    echo "❌ Failed to install frontend dependencies"
    exit 1
fi

cd ..

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "📝 Creating .env file..."
    cp env.example .env
    echo "⚠️  Please edit .env file with your database credentials before starting the application."
fi

echo ""
echo "🎉 Setup completed successfully!"
echo ""
echo "📋 Next steps:"
echo "1. Edit .env file with your database credentials"
echo "2. Start PostgreSQL database on port 5435"
echo "3. Run database migrations: cd backend && npm run db:push"
echo "4. Start backend: cd backend && npm run dev"
echo "5. Start frontend: cd frontend && npm start"
echo ""
echo "🌐 The application will be available at:"
echo "   Frontend: http://localhost:3000"
echo "   Backend:  http://localhost:3001"
echo "   API Docs: http://localhost:3001/api/v1/docs"
echo ""
echo "📚 For more information, check the README.md file" 