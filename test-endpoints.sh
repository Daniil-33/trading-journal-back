#!/bin/bash

# Test script for new indicator endpoints

BASE_URL="http://localhost:3001/api"

echo "🧪 Testing Indicator Endpoints"
echo "================================"
echo ""

# 1. Get first indicator to get an ID
echo "1️⃣  Getting indicators list to fetch ID..."
RESPONSE=$(curl -s "${BASE_URL}/indicators?limit=1")
echo "$RESPONSE" | jq '.'
INDICATOR_ID=$(echo "$RESPONSE" | jq -r '.data[0].id')
echo ""
echo "Got indicator ID: $INDICATOR_ID"
echo ""

# 2. Test GET indicator by ID
echo "2️⃣  Testing GET /api/indicators/:id"
echo "URL: ${BASE_URL}/indicators/${INDICATOR_ID}"
curl -s "${BASE_URL}/indicators/${INDICATOR_ID}" | jq '.'
echo ""
echo ""

# 3. Test GET publications statistics without filters
echo "3️⃣  Testing GET /api/indicators/publications/statistics (no filters)"
echo "URL: ${BASE_URL}/indicators/publications/statistics?limit=10"
curl -s "${BASE_URL}/indicators/publications/statistics?limit=10" | jq '.'
echo ""
echo ""

# 4. Test GET publications statistics with indicatorId
echo "4️⃣  Testing GET /api/indicators/publications/statistics (with indicatorId)"
echo "URL: ${BASE_URL}/indicators/publications/statistics?indicatorId=${INDICATOR_ID}&limit=10"
curl -s "${BASE_URL}/indicators/publications/statistics?indicatorId=${INDICATOR_ID}&limit=10" | jq '.'
echo ""
echo ""

# 5. Test GET publications statistics with date range
echo "5️⃣  Testing GET /api/indicators/publications/statistics (with date range)"
START_DATE="2024-01-01"
END_DATE="2024-12-31"
echo "URL: ${BASE_URL}/indicators/publications/statistics?indicatorId=${INDICATOR_ID}&startDate=${START_DATE}&endDate=${END_DATE}&limit=20"
curl -s "${BASE_URL}/indicators/publications/statistics?indicatorId=${INDICATOR_ID}&startDate=${START_DATE}&endDate=${END_DATE}&limit=20" | jq '.'
echo ""

echo "✅ Tests completed!"
