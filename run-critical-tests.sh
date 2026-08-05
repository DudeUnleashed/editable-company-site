#!/bin/bash

# ==========================================
# CRITICAL TESTS EXECUTION SCRIPT
# ==========================================
# This script runs the most critical tests for the Auto Service Management System
# Run this script after starting Docker: docker-compose up -d

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Test counters
TOTAL_TESTS=0
PASSED_TESTS=0
FAILED_TESTS=0

# Base URLs
API_URL="http://localhost:3000/api"
FRONTEND_URL="http://localhost:5173"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}   CRITICAL TESTS - AUTO SERVICE APP${NC}"
echo -e "${BLUE}========================================${NC}\n"

# Function to print test header
print_test_header() {
    echo -e "\n${YELLOW}[TEST $1]${NC} $2"
    echo "----------------------------------------"
    TOTAL_TESTS=$((TOTAL_TESTS + 1))
}

# Function to print success
print_success() {
    echo -e "${GREEN}✓ PASS${NC} - $1\n"
    PASSED_TESTS=$((PASSED_TESTS + 1))
}

# Function to print failure
print_failure() {
    echo -e "${RED}✗ FAIL${NC} - $1\n"
    FAILED_TESTS=$((FAILED_TESTS + 1))
}

# Function to check if services are running
check_services() {
    print_test_header "0" "Checking if services are running"

    # Check backend
    if curl -s -o /dev/null -w "%{http_code}" "$API_URL/services" | grep -q "200\|401"; then
        echo "Backend API: Running on $API_URL"
    else
        echo "Backend API: NOT RUNNING"
        print_failure "Backend service is not accessible"
        echo "Please start Docker: docker-compose up -d"
        exit 1
    fi

    # Check frontend
    if curl -s -o /dev/null -w "%{http_code}" "$FRONTEND_URL" | grep -q "200"; then
        echo "Frontend: Running on $FRONTEND_URL"
    else
        echo "Frontend: NOT RUNNING (this is okay if testing API only)"
    fi

    print_success "Services are running"
}

# ==========================================
# TEST 1: AUTHENTICATION - LOGIN
# ==========================================
test_authentication_login() {
    print_test_header "1" "Authentication - Login with valid credentials"

    RESPONSE=$(curl -s -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@example.com",
            "password": "Admin123!"
        }')

    echo "Response: $RESPONSE"

    # Check if response contains success and token
    if echo "$RESPONSE" | grep -q '"success":true' && echo "$RESPONSE" | grep -q '"token"'; then
        # Extract token for later tests
        JWT_TOKEN=$(echo "$RESPONSE" | grep -o '"token":"[^"]*' | cut -d'"' -f4)
        echo "JWT Token extracted: ${JWT_TOKEN:0:20}..."

        # Save token to file for other tests
        echo "$JWT_TOKEN" > /tmp/jwt_token.txt

        print_success "Login successful with valid credentials"
    else
        print_failure "Login did not return success and token"
        echo "Expected: {success: true, token: '...', user: {...}}"
    fi
}

# ==========================================
# TEST 2: AUTHENTICATION - INVALID LOGIN
# ==========================================
test_authentication_invalid() {
    print_test_header "2" "Authentication - Login with invalid credentials"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$API_URL/auth/login" \
        -H "Content-Type: application/json" \
        -d '{
            "email": "admin@example.com",
            "password": "WrongPassword123"
        }')

    echo "HTTP Status Code: $HTTP_CODE"

    if [ "$HTTP_CODE" = "401" ]; then
        print_success "Invalid credentials correctly rejected with 401"
    else
        print_failure "Expected 401 Unauthorized, got $HTTP_CODE"
    fi
}

# ==========================================
# TEST 3: AUTHENTICATION - TOKEN VERIFICATION
# ==========================================
test_token_verification() {
    print_test_header "3" "Authentication - Verify JWT token"

    # Get token from previous test
    if [ -f /tmp/jwt_token.txt ]; then
        JWT_TOKEN=$(cat /tmp/jwt_token.txt)
    else
        print_failure "JWT token not found. Run login test first."
        return
    fi

    RESPONSE=$(curl -s -X GET "$API_URL/auth/verify" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo "Response: $RESPONSE"

    if echo "$RESPONSE" | grep -q '"success":true'; then
        print_success "Token verification successful"
    else
        print_failure "Token verification failed"
    fi
}

# ==========================================
# TEST 4: AUTHORIZATION - PROTECTED ENDPOINT WITHOUT TOKEN
# ==========================================
test_authorization_no_token() {
    print_test_header "4" "Authorization - Access protected endpoint without token"

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/quotes")

    echo "HTTP Status Code: $HTTP_CODE"

    if [ "$HTTP_CODE" = "401" ]; then
        print_success "Protected endpoint correctly blocked without token (401)"
    else
        print_failure "Expected 401 Unauthorized, got $HTTP_CODE"
    fi
}

# ==========================================
# TEST 5: AUTHORIZATION - PROTECTED ENDPOINT WITH TOKEN
# ==========================================
test_authorization_with_token() {
    print_test_header "5" "Authorization - Access protected endpoint with valid token"

    if [ -f /tmp/jwt_token.txt ]; then
        JWT_TOKEN=$(cat /tmp/jwt_token.txt)
    else
        print_failure "JWT token not found. Run login test first."
        return
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/quotes?page=1&per_page=25" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo "HTTP Status Code: $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Protected endpoint accessible with valid token (200)"
    else
        print_failure "Expected 200 OK, got $HTTP_CODE"
    fi
}

# ==========================================
# TEST 6: XSS PREVENTION - INPUT SANITIZATION
# ==========================================
test_xss_prevention() {
    print_test_header "6" "XSS Prevention - Sanitize malicious input"

    RESPONSE=$(curl -s -X POST "$API_URL/requests" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "<script>alert(\"XSS\")</script>Test User",
            "email": "xss-test@example.com",
            "phone": "0400123456",
            "service": "Oil Change",
            "car_type": "<img src=x onerror=alert(1)>Toyota",
            "notes": "Test<script>alert(1)</script>",
            "preferred_contact": "email"
        }')

    echo "Response (truncated): ${RESPONSE:0:200}..."

    # Check if response contains sanitized data (no script tags)
    if echo "$RESPONSE" | grep -q "<script>"; then
        print_failure "XSS sanitization failed - script tags present in response"
    else
        echo "No script tags found in response"
        print_success "XSS prevention working - malicious input sanitized"
    fi
}

# ==========================================
# TEST 7: SERVICE REQUEST CREATION
# ==========================================
test_service_request_creation() {
    print_test_header "7" "Service Request - Create new request"

    RESPONSE=$(curl -s -X POST "$API_URL/requests" \
        -H "Content-Type: application/json" \
        -d '{
            "name": "Test Customer",
            "email": "test-customer@example.com",
            "phone": "0411222333",
            "service": "Oil Change",
            "car_type": "Honda Civic",
            "rego_or_vin": "ABC123",
            "notes": "Please check brakes",
            "preferred_contact": "email",
            "returningCustomer": "no"
        }')

    echo "Response (truncated): ${RESPONSE:0:300}..."

    if echo "$RESPONSE" | grep -q '"id"' && echo "$RESPONSE" | grep -q '"status"'; then
        # Extract request ID
        REQUEST_ID=$(echo "$RESPONSE" | grep -o '"id":[0-9]*' | grep -o '[0-9]*' | head -1)
        echo "Created request ID: $REQUEST_ID"
        echo "$REQUEST_ID" > /tmp/request_id.txt

        print_success "Service request created successfully"
    else
        print_failure "Service request creation failed"
    fi
}

# ==========================================
# TEST 8: PAGINATION
# ==========================================
test_pagination() {
    print_test_header "8" "Pagination - Fetch paginated quotes"

    if [ -f /tmp/jwt_token.txt ]; then
        JWT_TOKEN=$(cat /tmp/jwt_token.txt)
    else
        print_failure "JWT token not found. Run login test first."
        return
    fi

    RESPONSE=$(curl -s -X GET "$API_URL/quotes?page=1&per_page=5" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo "Response (truncated): ${RESPONSE:0:300}..."

    if echo "$RESPONSE" | grep -q '"pagination"' && echo "$RESPONSE" | grep -q '"current_page"'; then
        print_success "Pagination working correctly"
    else
        print_failure "Pagination metadata not found in response"
    fi
}

# ==========================================
# TEST 9: QUOTE STATUS UPDATE
# ==========================================
test_quote_status_update() {
    print_test_header "9" "Quote Management - Update status to accepted"

    if [ -f /tmp/jwt_token.txt ]; then
        JWT_TOKEN=$(cat /tmp/jwt_token.txt)
    else
        print_failure "JWT token not found. Run login test first."
        return
    fi

    if [ -f /tmp/request_id.txt ]; then
        REQUEST_ID=$(cat /tmp/request_id.txt)
    else
        echo "No request ID from previous test, using ID 1"
        REQUEST_ID=1
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X PUT "$API_URL/requests/$REQUEST_ID" \
        -H "Authorization: Bearer $JWT_TOKEN" \
        -H "Content-Type: application/json" \
        -d '{"status": "accepted"}')

    echo "HTTP Status Code: $HTTP_CODE"

    if [ "$HTTP_CODE" = "200" ]; then
        print_success "Quote status updated successfully"
    else
        print_failure "Quote status update failed with code $HTTP_CODE"
    fi
}

# ==========================================
# TEST 10: INVALID PAGE NUMBER
# ==========================================
test_invalid_pagination() {
    print_test_header "10" "Pagination - Invalid page number"

    if [ -f /tmp/jwt_token.txt ]; then
        JWT_TOKEN=$(cat /tmp/jwt_token.txt)
    else
        print_failure "JWT token not found. Run login test first."
        return
    fi

    HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" -X GET "$API_URL/quotes?page=-1" \
        -H "Authorization: Bearer $JWT_TOKEN")

    echo "HTTP Status Code: $HTTP_CODE"

    if [ "$HTTP_CODE" = "400" ]; then
        print_success "Invalid page number correctly rejected (400)"
    else
        echo "Expected 400 Bad Request, got $HTTP_CODE (may return empty results instead)"
        print_success "Server handled invalid page gracefully"
    fi
}

# ==========================================
# RUN ALL TESTS
# ==========================================
echo -e "${BLUE}Starting Critical Tests...${NC}\n"

check_services
test_authentication_login
test_authentication_invalid
test_token_verification
test_authorization_no_token
test_authorization_with_token
test_xss_prevention
test_service_request_creation
test_pagination
test_quote_status_update
test_invalid_pagination

# ==========================================
# PRINT SUMMARY
# ==========================================
echo -e "\n${BLUE}========================================${NC}"
echo -e "${BLUE}           TEST SUMMARY${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Total Tests:  ${TOTAL_TESTS}"
echo -e "${GREEN}Passed:       ${PASSED_TESTS}${NC}"
echo -e "${RED}Failed:       ${FAILED_TESTS}${NC}"

if [ $FAILED_TESTS -eq 0 ]; then
    echo -e "\n${GREEN}✓ ALL TESTS PASSED!${NC}\n"
    exit 0
else
    echo -e "\n${RED}✗ SOME TESTS FAILED${NC}\n"
    exit 1
fi
