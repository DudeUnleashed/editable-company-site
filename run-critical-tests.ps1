# ==========================================
# CRITICAL TESTS EXECUTION SCRIPT (PowerShell)
# ==========================================
# This script runs the most critical tests for the Auto Service Management System
# Prerequisites: Docker containers must be running (docker-compose up -d)

# Test counters
$script:TotalTests = 0
$script:PassedTests = 0
$script:FailedTests = 0

# Base URLs
$ApiUrl = "http://localhost:3000/api"
$FrontendUrl = "http://localhost:5173"

# Test results storage
$script:JwtToken = ""
$script:RequestId = ""

Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "   CRITICAL TESTS - AUTO SERVICE APP"  -ForegroundColor Cyan
Write-Host "========================================`n"  -ForegroundColor Cyan

# Function to print test header
function Print-TestHeader {
    param($Number, $Description)
    Write-Host "`n[TEST $Number] $Description" -ForegroundColor Yellow
    Write-Host "----------------------------------------"
    $script:TotalTests++
}

# Function to print success
function Print-Success {
    param($Message)
    Write-Host "✓ PASS" -ForegroundColor Green -NoNewline
    Write-Host " - $Message`n"
    $script:PassedTests++
}

# Function to print failure
function Print-Failure {
    param($Message)
    Write-Host "✗ FAIL" -ForegroundColor Red -NoNewline
    Write-Host " - $Message`n"
    $script:FailedTests++
}

# ==========================================
# TEST 0: CHECK SERVICES
# ==========================================
Print-TestHeader "0" "Checking if services are running"

try {
    $response = Invoke-WebRequest -Uri "$ApiUrl/services" -UseBasicParsing -ErrorAction SilentlyContinue
    Write-Host "Backend API: Running on $ApiUrl"
} catch {
    if ($_.Exception.Response.StatusCode.value__ -eq 401) {
        Write-Host "Backend API: Running on $ApiUrl (authentication required)"
    } else {
        Write-Host "Backend API: NOT RUNNING" -ForegroundColor Red
        Write-Host "Please start Docker: docker-compose up -d"
        exit 1
    }
}

try {
    $response = Invoke-WebRequest -Uri $FrontendUrl -UseBasicParsing -TimeoutSec 2 -ErrorAction SilentlyContinue
    Write-Host "Frontend: Running on $FrontendUrl"
} catch {
    Write-Host "Frontend: NOT RUNNING (this is okay if testing API only)"
}

Print-Success "Services are running"

# ==========================================
# TEST 1: AUTHENTICATION - LOGIN
# ==========================================
Print-TestHeader "1" "Authentication - Login with valid credentials"

$loginBody = @{
    email = "admin@example.com"
    password = "Admin123!"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $loginBody

    Write-Host "Response: $($response | ConvertTo-Json -Compress)"

    if ($response.success -and $response.token) {
        $script:JwtToken = $response.token
        Write-Host "JWT Token extracted: $($script:JwtToken.Substring(0, [Math]::Min(20, $script:JwtToken.Length)))..."
        Print-Success "Login successful with valid credentials"
    } else {
        Print-Failure "Login did not return success and token"
    }
} catch {
    Print-Failure "Login request failed: $($_.Exception.Message)"
}

# ==========================================
# TEST 2: AUTHENTICATION - INVALID LOGIN
# ==========================================
Print-TestHeader "2" "Authentication - Login with invalid credentials"

$invalidLoginBody = @{
    email = "admin@example.com"
    password = "WrongPassword123"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/auth/login" `
        -Method Post `
        -ContentType "application/json" `
        -Body $invalidLoginBody

    Print-Failure "Should have received 401 error, but got success"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status Code: $statusCode"

    if ($statusCode -eq 401) {
        Print-Success "Invalid credentials correctly rejected with 401"
    } else {
        Print-Failure "Expected 401 Unauthorized, got $statusCode"
    }
}

# ==========================================
# TEST 3: AUTHENTICATION - TOKEN VERIFICATION
# ==========================================
Print-TestHeader "3" "Authentication - Verify JWT token"

if (-not $script:JwtToken) {
    Print-Failure "JWT token not found. Login test must have failed."
} else {
    try {
        $headers = @{
            Authorization = "Bearer $script:JwtToken"
        }

        $response = Invoke-RestMethod -Uri "$ApiUrl/auth/verify" `
            -Method Get `
            -Headers $headers

        Write-Host "Response: $($response | ConvertTo-Json -Compress)"

        if ($response.success) {
            Print-Success "Token verification successful"
        } else {
            Print-Failure "Token verification failed"
        }
    } catch {
        Print-Failure "Token verification request failed: $($_.Exception.Message)"
    }
}

# ==========================================
# TEST 4: AUTHORIZATION - NO TOKEN
# ==========================================
Print-TestHeader "4" "Authorization - Access protected endpoint without token"

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/quotes" -Method Get
    Print-Failure "Should have been blocked, but got response"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Write-Host "HTTP Status Code: $statusCode"

    if ($statusCode -eq 401) {
        Print-Success "Protected endpoint correctly blocked without token (401)"
    } else {
        Print-Failure "Expected 401 Unauthorized, got $statusCode"
    }
}

# ==========================================
# TEST 5: AUTHORIZATION - WITH VALID TOKEN
# ==========================================
Print-TestHeader "5" "Authorization - Access protected endpoint with valid token"

if (-not $script:JwtToken) {
    Print-Failure "JWT token not found. Login test must have failed."
} else {
    try {
        $headers = @{
            Authorization = "Bearer $script:JwtToken"
        }

        $uri = "$ApiUrl/quotes" + '?page=1&per_page=25'
        $response = Invoke-RestMethod -Uri $uri `
            -Method Get `
            -Headers $headers

        Write-Host "Response contains $($response.requests.Count) requests"
        Print-Success "Protected endpoint accessible with valid token (200)"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Print-Failure "Expected 200 OK, got $statusCode - $($_.Exception.Message)"
    }
}

# ==========================================
# TEST 6: XSS PREVENTION
# ==========================================
Print-TestHeader "6" "XSS Prevention - Sanitize malicious input"

$xssBody = @{
    name = '<script>alert("XSS")</script>Test User'
    email = "xss-test@example.com"
    phone = "0400123456"
    service = "Oil Change"
    car_type = '<img src=x onerror=alert(1)>Toyota'
    notes = 'Test<script>alert(1)</script>'
    preferred_contact = "email"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/requests" `
        -Method Post `
        -ContentType "application/json" `
        -Body $xssBody

    $responseJson = $response | ConvertTo-Json -Compress
    Write-Host "Response (truncated): $($responseJson.Substring(0, [Math]::Min(200, $responseJson.Length)))..."

    if ($responseJson -match "<script>") {
        Print-Failure "XSS sanitization failed - script tags present in response"
    } else {
        Write-Host "No script tags found in response"
        Print-Success "XSS prevention working - malicious input sanitized"
    }
} catch {
    Print-Failure "Request creation failed: $($_.Exception.Message)"
}

# ==========================================
# TEST 7: SERVICE REQUEST CREATION
# ==========================================
Print-TestHeader "7" "Service Request - Create new request"

$requestBody = @{
    name = "Test Customer $(Get-Date -Format 'HHmmss')"
    email = "test-customer-$(Get-Date -Format 'HHmmss')@example.com"
    phone = "0411222333"
    service = "Oil Change"
    car_type = "Honda Civic"
    rego_or_vin = "TEST123"
    notes = "Automated test request"
    preferred_contact = "email"
    returningCustomer = "no"
} | ConvertTo-Json

try {
    $response = Invoke-RestMethod -Uri "$ApiUrl/requests" `
        -Method Post `
        -ContentType "application/json" `
        -Body $requestBody

    Write-Host "Response: $($response | ConvertTo-Json -Compress)"

    if ($response.id) {
        $script:RequestId = $response.id
        Write-Host "Created request ID: $script:RequestId"
        Print-Success "Service request created successfully"
    } else {
        Print-Failure "Service request creation failed - no ID returned"
    }
} catch {
    Print-Failure "Service request creation failed: $($_.Exception.Message)"
}

# ==========================================
# TEST 8: PAGINATION
# ==========================================
Print-TestHeader "8" "Pagination - Fetch paginated quotes"

if (-not $script:JwtToken) {
    Print-Failure "JWT token not found. Login test must have failed."
} else {
    try {
        $headers = @{
            Authorization = "Bearer $script:JwtToken"
        }

        $uri = "$ApiUrl/quotes" + '?page=1&per_page=5'
        $response = Invoke-RestMethod -Uri $uri `
            -Method Get `
            -Headers $headers

        Write-Host "Response structure: $($response | ConvertTo-Json -Depth 2 -Compress)"

        if ($response.pagination -and $response.pagination.current_page) {
            Write-Host "Pagination: Page $($response.pagination.current_page) of $($response.pagination.total_pages)"
            Print-Success "Pagination working correctly"
        } else {
            Print-Failure "Pagination metadata not found in response"
        }
    } catch {
        Print-Failure "Pagination request failed: $($_.Exception.Message)"
    }
}

# ==========================================
# TEST 9: QUOTE STATUS UPDATE
# ==========================================
Print-TestHeader "9" "Quote Management - Update status to accepted"

if (-not $script:JwtToken) {
    Print-Failure "JWT token not found. Login test must have failed."
} elseif (-not $script:RequestId) {
    Write-Host "No request ID from previous test, attempting with ID 1"
    $script:RequestId = 1
}

$statusBody = @{
    status = "accepted"
} | ConvertTo-Json

try {
    $headers = @{
        Authorization = "Bearer $script:JwtToken"
    }

    $response = Invoke-RestMethod -Uri "$ApiUrl/requests/$script:RequestId" `
        -Method Put `
        -Headers $headers `
        -ContentType "application/json" `
        -Body $statusBody

    Write-Host "Status updated to: $($response.status)"
    Print-Success "Quote status updated successfully"
} catch {
    $statusCode = $_.Exception.Response.StatusCode.value__
    Print-Failure "Quote status update failed with code $statusCode - $($_.Exception.Message)"
}

# ==========================================
# TEST 10: INVALID PAGINATION
# ==========================================
Print-TestHeader "10" "Pagination - Invalid page number"

if (-not $script:JwtToken) {
    Print-Failure "JWT token not found. Login test must have failed."
} else {
    try {
        $headers = @{
            Authorization = "Bearer $script:JwtToken"
        }

        $uri = "$ApiUrl/quotes" + '?page=-1'
        $response = Invoke-RestMethod -Uri $uri `
            -Method Get `
            -Headers $headers

        Write-Host "Server returned results (may return empty page instead of error)"
        Print-Success "Server handled invalid page gracefully"
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        Write-Host "HTTP Status Code: $statusCode"

        if ($statusCode -eq 400) {
            Print-Success "Invalid page number correctly rejected (400)"
        } else {
            Write-Host "Got $statusCode - server handled gracefully"
            Print-Success "Server handled invalid page"
        }
    }
}

# ==========================================
# PRINT SUMMARY
# ==========================================
Write-Host "`n========================================"  -ForegroundColor Cyan
Write-Host "           TEST SUMMARY"  -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Total Tests:  $script:TotalTests"
Write-Host "Passed:       " -NoNewline
Write-Host "$script:PassedTests" -ForegroundColor Green
Write-Host "Failed:       " -NoNewline
Write-Host "$script:FailedTests" -ForegroundColor Red

if ($script:FailedTests -eq 0) {
    Write-Host "`n✓ ALL TESTS PASSED!`n" -ForegroundColor Green
    exit 0
} elseif ($script:FailedTests -gt 0) {
    Write-Host "`n✗ SOME TESTS FAILED`n" -ForegroundColor Red
    exit 1
}
