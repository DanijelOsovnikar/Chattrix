# Quick Test Reference Guide

## 🚀 Quick Start

### Run All Tests

```bash
npm test
```

### Run Tests with Coverage

```bash
npm test -- --coverage
```

### Run Specific Test File

```bash
npm test authController.test.js
```

### Run Tests in Watch Mode

```bash
npm run test:watch
```

---

## 📊 Current Test Status

✅ **75 tests passing**  
✅ **5 test suites passing**

### Coverage by Controller

- **auth.controller.js**: 81% ✅ Excellent
- **shop.controller.js**: 82% ✅ Excellent
- **warehouse.controller.js**: 81% ✅ Excellent
- **message.controller.js**: 13% 🔴 Needs Work
- **user.controller.js**: 0% 🔴 No Tests

---

## 🧪 Test Files

### Backend Tests (75 tests)

```
Backend/tests/
├── setup.js                     # Test configuration
├── authController.test.js       # 17 tests ✅
├── shopController.test.js       # 26 tests ✅
├── warehouseController.test.js  # 23 tests ✅
├── messageController.test.js    # 6 tests ✅
└── externalRequests.test.js     # 3 tests ✅
```

---

## 🔧 Test Configuration Files

### Jest Configuration

**File:** `jest.config.js`

```javascript
{
  testEnvironment: "node",
  testMatch: ["**/Backend/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/Backend/tests/setup.js"],
  collectCoverageFrom: ["Backend/**/*.js"]
}
```

### Package Scripts

**File:** `package.json`

```json
{
  "test": "NODE_OPTIONS=--experimental-vm-modules jest",
  "test:watch": "NODE_OPTIONS=--experimental-vm-modules jest --watch",
  "test:backend": "NODE_OPTIONS=--experimental-vm-modules jest Backend/"
}
```

---

## 📝 Writing New Tests

### Basic Test Template

```javascript
import { describe, it, expect, beforeEach, jest } from "@jest/globals";
import ControllerFunction from "../controller/your.controller.js";
import Model from "../models/your.model.js";

describe("Controller Tests", () => {
  let testData, res;

  beforeEach(async () => {
    // Setup test data
    testData = await Model.create({
      /* ... */
    });

    // Mock response object
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
    };
  });

  it("should perform expected action", async () => {
    const req = {
      user: testData,
      body: {
        /* ... */
      },
      params: {
        /* ... */
      },
    };

    await ControllerFunction(req, res);

    expect(res.status).toHaveBeenCalledWith(200);
    expect(res.json).toHaveBeenCalledWith(
      expect.objectContaining({
        /* ... */
      })
    );
  });
});
```

---

## 🎯 Common Test Patterns

### Testing Authorization

```javascript
it("should reject unauthorized access", async () => {
  const req = { user: employeeUser };
  await restrictedFunction(req, res);
  expect(res.status).toHaveBeenCalledWith(403);
});
```

### Testing Database Operations

```javascript
it("should create record in database", async () => {
  const req = { body: { name: "Test" } };
  await createFunction(req, res);

  const record = await Model.findOne({ name: "Test" });
  expect(record).toBeTruthy();
});
```

### Testing Validation

```javascript
it("should reject invalid data", async () => {
  const req = { body: { invalid: "data" } };
  await validateFunction(req, res);
  expect(res.status).toHaveBeenCalledWith(400);
});
```

---

## 🐛 Debugging Tests

### View Full Error Output

```bash
npm test -- --verbose
```

### Run Single Test

```bash
npm test -- --testNamePattern="should login user"
```

### Check Coverage for Specific File

```bash
npm test -- --coverage --collectCoverageFrom="Backend/controller/auth.controller.js"
```

### Enable Console Logs in Tests

Remove `--silent` flag or add console.log statements in tests

---

## 📈 Coverage Goals

### Current Coverage

- **Statements:** 23.32%
- **Branches:** 19.67%
- **Functions:** 24.21%
- **Lines:** 23.37%

### Target Coverage

- **Statements:** 80%+
- **Branches:** 75%+
- **Functions:** 80%+
- **Lines:** 80%+

---

## ⚠️ Common Issues & Solutions

### Issue: Jest module import errors

**Solution:** Ensure `"type": "module"` in package.json and use NODE_OPTIONS flag

### Issue: MongoDB connection errors

**Solution:** MongoDB Memory Server handles this automatically in tests

### Issue: JWT_SECRET undefined

**Solution:** Setup file defines test environment variables

### Issue: Tests fail randomly

**Solution:** Ensure proper cleanup in afterEach and avoid shared state

---

## 📚 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [MongoDB Memory Server](https://github.com/nodkz/mongodb-memory-server)
- [Testing Best Practices](https://testingjavascript.com/)

---

## 🔄 Continuous Integration

### Pre-commit Hook (Recommended)

```json
{
  "husky": {
    "hooks": {
      "pre-commit": "npm test"
    }
  }
}
```

### GitHub Actions (Example)

```yaml
name: Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install
      - name: Run tests
        run: npm test -- --coverage
```

---

**Last Updated:** October 25, 2025  
**Next Review:** When adding new controllers or major features
