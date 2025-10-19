#!/bin/bash

echo "🧪 Starting GigaApp Test Suite..."
echo "=================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
    fi
}

# Backend Tests
echo -e "${YELLOW}🔧 Running Backend Tests...${NC}"
npm test -- --testPathPattern=Backend --passWithNoTests
BACKEND_EXIT_CODE=$?
print_status $BACKEND_EXIT_CODE "Backend Tests"

echo ""

# Frontend Tests
echo -e "${YELLOW}⚛️  Running Frontend Tests...${NC}"
cd Frontend
npm test run
FRONTEND_EXIT_CODE=$?
print_status $FRONTEND_EXIT_CODE "Frontend Tests"

cd ..

echo ""
echo "=================================="

# Overall results
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    exit 0
else
    echo -e "${RED}💥 Some tests failed. Please check the output above.${NC}"
    exit 1
fi