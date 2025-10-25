# Test Suite Documentation

This document explains how to run and maintain the test suite for the GigaApp external request tracking functionality.

## 🏗️ Test Architecture

### Backend Tests (Jest + Supertest)

- **Location**: `Backend/tests/`
- **Framework**: Jest with Supertest for API testing
- **Database**: MongoDB Memory Server for isolated testing
- **Coverage**: API endpoints, controller functions, data models

### Frontend Tests (Vitest + React Testing Library)

- **Location**: `Frontend/src/tests/`
- **Framework**: Vitest with React Testing Library
- **Environment**: jsdom for DOM simulation
- **Coverage**: Components, hooks, user interactions

## 🚀 How to Run Tests

### Prerequisites

First, install all test dependencies:

```bash
# Install backend test dependencies
npm install

# Install frontend test dependencies
cd Frontend && npm install
```

### Backend Tests

```bash
# Run all backend tests
npm run test:backend

# Run tests in watch mode
npm run test:watch

# Run with coverage report
npm test -- --coverage

# Run specific test file
npm test Backend/tests/externalRequests.test.js
```

### Frontend Tests

```bash
# Navigate to frontend directory
cd Frontend

# Run all frontend tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests with UI (interactive)
npm run test:ui

# Run with coverage
npm run test:coverage

# Run specific test file
npm test src/tests/TrackingView.test.jsx
```

### Run All Tests

```bash
# From root directory, run both backend and frontend tests
npm test && cd Frontend && npm test
```

## 🧪 Test Structure

### Backend Test Files

1. **`externalRequests.test.js`**

   - API endpoint testing for tracking functionality
   - Authentication and authorization tests
   - Request filtering and direction marking
   - Status update functionality

2. **`messageController.test.js`**
   - Unit tests for controller functions
   - Data validation and error handling
   - Database interaction testing

### Frontend Test Files

1. **`TrackingView.test.jsx`**

   - Component rendering and UI elements
   - Filter functionality (direction, status, pagination)
   - User interactions and state changes
   - Empty states and error handling

2. **`useGetMessages.test.js`**
   - Hook functionality testing
   - API call mocking and response handling
   - Error handling and loading states

## 📊 Test Coverage Areas

### ✅ Backend Coverage

- **Authentication**: Role-based access control (manager, admin, super_admin)
- **API Endpoints**: `/api/messages/tracking/outgoing`
- **Data Filtering**: Shop-specific request filtering
- **Status Updates**: External request status management
- **Direction Marking**: Outgoing vs incoming request identification
- **Error Handling**: Invalid requests, missing data, server errors

### ✅ Frontend Coverage

- **Component Rendering**: TrackingView UI elements and layout
- **Filter Controls**: Direction, status, and pagination filters
- **User Interactions**: Filter changes, pagination navigation
- **Data Display**: Request cards, status indicators, product lists
- **Responsive Design**: Mobile layout adjustments
- **Empty States**: No data scenarios and filter mismatches

## 🔧 Test Configuration

### Backend Jest Config (`jest.config.js`)

```javascript
export default {
  testEnvironment: "node",
  extensionsToTreatAsEsm: [".js"],
  testMatch: ["**/Backend/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/Backend/tests/setup.js"],
  collectCoverageFrom: ["Backend/**/*.js"],
};
```

### Frontend Vitest Config (`Frontend/vitest.config.js`)

```javascript
export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/tests/setup.js"],
  },
});
```

## 🎯 Key Test Scenarios

### External Request Tracking

1. **Manager Access**: Only managers/admins can access tracking
2. **Direction Filtering**: Separate outgoing vs incoming requests
3. **Status Filtering**: Filter by pending/sending/keeping/rejected
4. **Pagination**: Handle large datasets with page navigation
5. **Real-time Updates**: Status changes reflected in UI

### API Integration

1. **Authentication**: JWT token validation
2. **Authorization**: Role-based endpoint access
3. **Data Integrity**: Correct shop filtering and user association
4. **Error Handling**: Network failures, invalid data, server errors

## 🐛 Debugging Tests

### Backend Test Debugging

```bash
# Run tests with verbose output
npm test -- --verbose

# Run specific test with debugging
npm test -- --testNamePattern="should return external requests for manager"

# Check test coverage
npm test -- --coverage --collectCoverageFrom="Backend/controller/message.controller.js"
```

### Frontend Test Debugging

```bash
# Run with detailed output
npm test -- --reporter=verbose

# Debug specific component
npm test -- --testNamePattern="TrackingView"

# Run tests in browser (with UI)
npm run test:ui
```

## 📈 Continuous Integration

For CI/CD pipelines, add these commands to your workflow:

```yaml
# Example GitHub Actions step
- name: Run Backend Tests
  run: npm test

- name: Run Frontend Tests
  run: cd Frontend && npm test

- name: Generate Coverage Reports
  run: |
    npm test -- --coverage
    cd Frontend && npm run test:coverage
```

## 🔄 Updating Tests

When adding new features to the external request tracking system:

1. **Add Backend Tests**: Create tests for new API endpoints or controller functions
2. **Add Frontend Tests**: Test new components, hooks, or user interactions
3. **Update Mocks**: Ensure mocks reflect actual API responses
4. **Verify Coverage**: Maintain high test coverage for critical paths

## 📋 Test Checklist

Before deploying changes:

- ✅ All backend tests pass
- ✅ All frontend tests pass
- ✅ Test coverage remains above 80%
- ✅ New features have corresponding tests
- ✅ Integration tests cover end-to-end workflows
- ✅ Error scenarios are properly tested

This comprehensive test suite ensures the external request tracking functionality is reliable, maintainable, and bug-free.
