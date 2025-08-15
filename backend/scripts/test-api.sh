#!/bin/bash

# Precision Ads API Testing Script
# Usage: ./scripts/test-api.sh [base-url] [test-suite-number]

echo "🚀 Precision Ads API Testing"
echo "=============================="

# Default values
BASE_URL=${1:-"http://localhost:7401"}
TEST_SUITE=${2:-"0"}

echo "🌐 Base URL: $BASE_URL"
echo "🎯 Test Suite: $TEST_SUITE"
echo ""

# Check if server is running
echo "🔍 Checking server availability..."
if curl -s "$BASE_URL/health" > /dev/null; then
    echo "✅ Server is running and responding"
else
    echo "❌ Server is not accessible. Please ensure the backend is running."
    echo "   Run: npm run dev"
    exit 1
fi

echo ""
echo "🧪 Starting API tests..."

# Run the test suite
if [ "$TEST_SUITE" = "0" ]; then
    echo "🎯 Running all test suites..."
    npx tsx testing/run-tests.ts "$BASE_URL" 0
else
    echo "🎯 Running test suite $TEST_SUITE..."
    npx tsx testing/run-tests.ts "$BASE_URL" "$TEST_SUITE"
fi

echo ""
echo "🎉 Testing completed!" 