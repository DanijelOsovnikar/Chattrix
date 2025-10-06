#!/bin/bash

# Test script for multi-shop backend

echo "🧪 Testing Multi-Shop Backend Integration"
echo "======================================="

# Base URL
BASE_URL="http://localhost:3000"

echo ""
echo "1. Testing login to get user with shop information..."
echo "----------------------------------------------------"

# Test login (replace with actual credentials)
curl -X POST "$BASE_URL/api/auth/login" \
  -H "Content-Type: application/json" \
  -d '{"userName": "admin", "password": "password"}' \
  -c cookies.txt \
  -s | jq '.'

echo ""
echo "2. Testing get users (should be shop-scoped)..."
echo "----------------------------------------------"

curl -X GET "$BASE_URL/api/users" \
  -b cookies.txt \
  -s | jq '.'

echo ""
echo "3. Testing get shops..."
echo "---------------------"

curl -X GET "$BASE_URL/api/shops" \
  -b cookies.txt \
  -s | jq '.'

echo ""
echo "4. Testing socket connection..."
echo "-----------------------------"
echo "Socket connection will be tested when frontend connects"

echo ""
echo "🎉 Backend tests complete!"
echo "Now test the frontend by:"
echo "1. Running the frontend: npm run dev"
echo "2. Logging in with existing credentials"
echo "3. Checking browser console for socket room connections"
echo "4. Verifying users list shows only shop-scoped users"

# Clean up
rm -f cookies.txt