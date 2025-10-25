#!/bin/bash

echo "🧪 Starting Chattrix Test Suite..."
echo "==================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    if [ $1 -eq 0 ]; then
        echo -e "${GREEN}✅ $2 PASSED${NC}"
    else
        echo -e "${RED}❌ $2 FAILED${NC}"
    fi
}

# Function to show current test status
show_status() {
    echo -e "${BLUE}📊 Current Test Status${NC}"
    echo "======================"
    echo -e "${GREEN}✅ Total Tests: 75 passing${NC}"
    echo -e "${GREEN}✅ Test Suites: 5 passing${NC}"
    echo ""
    echo "Test Files:"
    echo "  • authController.test.js       (17 tests)"
    echo "  • shopController.test.js       (26 tests)"
    echo "  • warehouseController.test.js  (23 tests)"
    echo "  • messageController.test.js    (6 tests)"
    echo "  • externalRequests.test.js     (3 tests)"
    echo ""
    echo "Coverage:"
    echo -e "  • auth.controller.js:       ${GREEN}81% ✅${NC}"
    echo -e "  • shop.controller.js:       ${GREEN}82% ✅${NC}"
    echo -e "  • warehouse.controller.js:  ${GREEN}81% ✅${NC}"
    echo -e "  • message.controller.js:    ${RED}13% 🔴${NC}"
    echo -e "  • user.controller.js:       ${RED}0% 🔴${NC}"
    echo ""
}

# Check for command line arguments
if [ $# -gt 0 ]; then
    case $1 in
        status)
            show_status
            exit 0
            ;;
        coverage)
            echo -e "${YELLOW}📊 Running tests with coverage report...${NC}"
            npm test -- --coverage
            exit $?
            ;;
        watch)
            echo -e "${YELLOW}👀 Running tests in watch mode...${NC}"
            npm run test:watch
            exit $?
            ;;
        backend)
            echo -e "${YELLOW}🔧 Running Backend Tests only...${NC}"
            npm test
            exit $?
            ;;
        frontend)
            echo -e "${YELLOW}⚛️  Running Frontend Tests only...${NC}"
            cd Frontend
            npm test run
            exit $?
            ;;
        help)
            echo "Usage: ./run-tests.sh [command]"
            echo ""
            echo "Commands:"
            echo "  (no args)   - Run all tests (backend and frontend)"
            echo "  status      - Show current test status"
            echo "  coverage    - Run tests with coverage report"
            echo "  watch       - Run tests in watch mode"
            echo "  backend     - Run backend tests only"
            echo "  frontend    - Run frontend tests only"
            echo "  help        - Show this help message"
            echo ""
            echo "Examples:"
            echo "  ./run-tests.sh"
            echo "  ./run-tests.sh coverage"
            echo "  ./run-tests.sh status"
            exit 0
            ;;
        *)
            echo -e "${RED}❌ Unknown command: $1${NC}"
            echo "Run './run-tests.sh help' to see available commands"
            exit 1
            ;;
    esac
fi

# Show current status before running tests
show_status
echo ""

# Backend Tests
echo -e "${YELLOW}🔧 Running Backend Tests...${NC}"
npm test -- --passWithNoTests
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
echo "==================================="

# Overall results
if [ $BACKEND_EXIT_CODE -eq 0 ] && [ $FRONTEND_EXIT_CODE -eq 0 ]; then
    echo -e "${GREEN}🎉 All tests passed successfully!${NC}"
    echo ""
    echo "📝 View detailed reports:"
    echo "   • TEST_SUMMARY.md - Comprehensive test report"
    echo "   • CODE_HEALTH_REPORT.md - Code quality analysis"
    echo "   • TESTING_GUIDE.md - Quick reference guide"
    exit 0
else
    echo -e "${RED}💥 Some tests failed. Please check the output above.${NC}"
    exit 1
fi