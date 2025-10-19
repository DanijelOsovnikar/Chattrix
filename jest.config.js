export default {
  testEnvironment: "node",
  transform: {},
  testMatch: ["**/Backend/**/*.test.js"],
  setupFilesAfterEnv: ["<rootDir>/Backend/tests/setup.js"],
  collectCoverageFrom: [
    "Backend/**/*.js",
    "!Backend/server.js",
    "!Backend/tests/**",
  ],
  coverageDirectory: "coverage",
};
