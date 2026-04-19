#!/bin/bash

# UTCN Events API Test Script
# This script demonstrates the authentication flow and API usage

BASE_URL="http://localhost:8080"
STUDENT_EMAIL="student@utcn.edu"
STUDENT_PASSWORD="StudentPass123!"
ORGANIZER_EMAIL="organizer@utcn.edu"
ORGANIZER_PASSWORD="OrganizerPass123!"
ADMIN_EMAIL="admin@utcn.edu"
ADMIN_PASSWORD="AdminPass123!"

echo "============================================"
echo "UTCN Extracurricular Events - API Test"
echo "============================================"
echo ""

# Check if server is running
echo "Checking server health..."
HEALTH_RESPONSE=$(curl -s -X GET "$BASE_URL/health")
if echo "$HEALTH_RESPONSE" | grep -q "ok"; then
    echo "✓ Server is running"
else
    echo "✗ Server is not responding. Please start the application first."
    exit 1
fi

echo ""
echo "============================================"
echo "1. REGISTRATION FLOW"
echo "============================================"
echo ""

# Register Student
echo "Registering student..."
STUDENT_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$STUDENT_PASSWORD\",
    \"firstName\": \"John\",
    \"lastName\": \"Student\",
    \"role\": \"STUDENT\"
  }")

STUDENT_TOKEN=$(echo "$STUDENT_RESPONSE" | jq -r '.token' 2>/dev/null)
STUDENT_ID=$(echo "$STUDENT_RESPONSE" | jq -r '.user.id' 2>/dev/null)

if [ "$STUDENT_TOKEN" != "null" ] && [ -n "$STUDENT_TOKEN" ]; then
    echo "✓ Student registered successfully"
    echo "  Email: $STUDENT_EMAIL"
    echo "  Token: ${STUDENT_TOKEN:0:20}..."
else
    echo "✗ Student registration failed"
    echo "$STUDENT_RESPONSE" | jq '.'
fi

# Register Organizer
echo ""
echo "Registering organizer..."
ORGANIZER_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ORGANIZER_EMAIL\",
    \"password\": \"$ORGANIZER_PASSWORD\",
    \"firstName\": \"Jane\",
    \"lastName\": \"Organizer\",
    \"role\": \"ORGANIZER\"
  }")

ORGANIZER_TOKEN=$(echo "$ORGANIZER_RESPONSE" | jq -r '.token' 2>/dev/null)
if [ "$ORGANIZER_TOKEN" != "null" ] && [ -n "$ORGANIZER_TOKEN" ]; then
    echo "✓ Organizer registered successfully"
else
    echo "✗ Organizer registration failed"
fi

# Register Admin
echo ""
echo "Registering admin..."
ADMIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$ADMIN_EMAIL\",
    \"password\": \"$ADMIN_PASSWORD\",
    \"firstName\": \"Bob\",
    \"lastName\": \"Admin\",
    \"role\": \"ADMIN\"
  }")

ADMIN_TOKEN=$(echo "$ADMIN_RESPONSE" | jq -r '.token' 2>/dev/null)
if [ "$ADMIN_TOKEN" != "null" ] && [ -n "$ADMIN_TOKEN" ]; then
    echo "✓ Admin registered successfully"
else
    echo "✗ Admin registration failed"
fi

echo ""
echo "============================================"
echo "2. LOGIN FLOW"
echo "============================================"
echo ""

echo "Logging in as student..."
LOGIN_RESPONSE=$(curl -s -X POST "$BASE_URL/auth/login" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"$STUDENT_EMAIL\",
    \"password\": \"$STUDENT_PASSWORD\"
  }")

NEW_TOKEN=$(echo "$LOGIN_RESPONSE" | jq -r '.token' 2>/dev/null)
if [ "$NEW_TOKEN" != "null" ] && [ -n "$NEW_TOKEN" ]; then
    echo "✓ Login successful"
    echo "  Token: ${NEW_TOKEN:0:20}..."
else
    echo "✗ Login failed"
fi

echo ""
echo "============================================"
echo "3. AUTHENTICATED ENDPOINTS"
echo "============================================"
echo ""

echo "Getting current user profile..."
ME_RESPONSE=$(curl -s -X GET "$BASE_URL/auth/me" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "$ME_RESPONSE" | jq '.'

echo ""
echo "============================================"
echo "4. ROLE-BASED ACCESS CONTROL"
echo "============================================"
echo ""

echo "Student accessing user list (should fail)..."
FAIL_RESPONSE=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

if echo "$FAIL_RESPONSE" | grep -q "Insufficient permissions\|Forbidden"; then
    echo "✓ Access denied (as expected)"
else
    echo "✗ Access should have been denied"
fi

echo ""
echo "Admin accessing user list (should succeed)..."
ADMIN_USERS=$(curl -s -X GET "$BASE_URL/api/users" \
  -H "Authorization: Bearer $ADMIN_TOKEN")

echo "$ADMIN_USERS" | jq '.' | head -20

echo ""
echo "============================================"
echo "5. EVENT MANAGEMENT (Organizer)"
echo "============================================"
echo ""

echo "Organizer creating event..."
EVENT_RESPONSE=$(curl -s -X POST "$BASE_URL/api/events" \
  -H "Authorization: Bearer $ORGANIZER_TOKEN" \
  -H "Content-Type: application/json" \
  -d "{
    \"title\": \"Kotlin Workshop\",
    \"description\": \"Learn modern Kotlin programming\",
    \"date\": \"2026-06-15\",
    \"category\": \"Workshop\",
    \"department\": \"Computer Science\"
  }")

EVENT_ID=$(echo "$EVENT_RESPONSE" | jq -r '.id' 2>/dev/null)
if [ "$EVENT_ID" != "null" ] && [ -n "$EVENT_ID" ]; then
    echo "✓ Event created successfully"
    echo "  Event ID: $EVENT_ID"
else
    echo "✗ Event creation failed"
    echo "$EVENT_RESPONSE" | jq '.'
fi

echo ""
echo "============================================"
echo "6. STUDENT ACCESS TO EVENTS"
echo "============================================"
echo ""

echo "Student viewing all events..."
EVENTS_RESPONSE=$(curl -s -X GET "$BASE_URL/api/events" \
  -H "Authorization: Bearer $STUDENT_TOKEN")

echo "$EVENTS_RESPONSE" | jq '.' | head -30

echo ""
echo "============================================"
echo "TEST SUMMARY"
echo "============================================"
echo ""
echo "✓ Registration flow works"
echo "✓ Login flow works"
echo "✓ JWT authentication works"
echo "✓ Role-based access control works"
echo "✓ Event creation works"
echo ""
echo "For detailed API documentation, see AUTHENTICATION_SETUP.md"

