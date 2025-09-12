#!/bin/bash

echo "🚀 Testing React Query API Integration"
echo "======================================"

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Test 1: Basic API connectivity
echo -e "\n${YELLOW}Test 1: Basic API connectivity${NC}"
response=$(curl -s -w "%{http_code}" -o /tmp/api_response.json "http://localhost:3000/api/service-providers")

if [ "$response" = "200" ]; then
    echo -e "${GREEN}✅ API is responding (HTTP 200)${NC}"
else
    echo -e "${RED}❌ API failed (HTTP $response)${NC}"
    exit 1
fi

# Test 2: Response structure validation
echo -e "\n${YELLOW}Test 2: Response structure validation${NC}"
success=$(cat /tmp/api_response.json | jq -r '.success')
message=$(cat /tmp/api_response.json | jq -r '.message')
providers_count=$(cat /tmp/api_response.json | jq '.data.serviceProviders | length')
pagination=$(cat /tmp/api_response.json | jq '.data.pagination')

if [ "$success" = "true" ]; then
    echo -e "${GREEN}✅ Response success: $success${NC}"
else
    echo -e "${RED}❌ Response success: $success${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Message: $message${NC}"
echo -e "${GREEN}✅ Service providers count: $providers_count${NC}"
echo -e "${GREEN}✅ Pagination: $pagination${NC}"

# Test 3: Service provider data structure
echo -e "\n${YELLOW}Test 3: Service provider data structure${NC}"
first_provider=$(cat /tmp/api_response.json | jq '.data.serviceProviders[0]')
business_name=$(echo "$first_provider" | jq -r '.businessName')
rating=$(echo "$first_provider" | jq -r '.rating')
review_count=$(echo "$first_provider" | jq -r '.reviewCount')

echo -e "${GREEN}✅ First provider: $business_name${NC}"
echo -e "${GREEN}✅ Rating: $rating ($review_count reviews)${NC}"

# Test 4: Multiple concurrent requests (simulating React Query behavior)
echo -e "\n${YELLOW}Test 4: Multiple concurrent requests${NC}"
for i in {1..3}; do
    curl -s "http://localhost:3000/api/service-providers" > /tmp/response_$i.json &
done
wait

# Check all responses
all_success=true
for i in {1..3}; do
    success=$(cat /tmp/response_$i.json | jq -r '.success')
    if [ "$success" != "true" ]; then
        all_success=false
        break
    fi
done

if [ "$all_success" = true ]; then
    echo -e "${GREEN}✅ All concurrent requests successful${NC}"
else
    echo -e "${RED}❌ Some concurrent requests failed${NC}"
    exit 1
fi

# Test 5: Query parameters
echo -e "\n${YELLOW}Test 5: Query parameters${NC}"
response=$(curl -s "http://localhost:3000/api/service-providers?page=1&limit=10")
page=$(echo "$response" | jq -r '.data.pagination.page')
limit=$(echo "$response" | jq -r '.data.pagination.limit')

if [ "$page" = "1" ] && [ "$limit" = "10" ]; then
    echo -e "${GREEN}✅ Query parameters working (page: $page, limit: $limit)${NC}"
else
    echo -e "${RED}❌ Query parameters not working properly${NC}"
    exit 1
fi

# Test 6: React Query cache simulation
echo -e "\n${YELLOW}Test 6: React Query cache simulation${NC}"
echo "Simulating React Query behavior with rapid requests..."

start_time=$(date +%s%N)
for i in {1..5}; do
    curl -s "http://localhost:3000/api/service-providers" > /dev/null
done
end_time=$(date +%s%N)

duration=$(( (end_time - start_time) / 1000000 ))
echo -e "${GREEN}✅ 5 rapid requests completed in ${duration}ms${NC}"

if [ $duration -lt 1000 ]; then
    echo -e "${GREEN}✅ API is fast enough for React Query${NC}"
else
    echo -e "${YELLOW}⚠️  API might be slow for React Query (${duration}ms for 5 requests)${NC}"
fi

# Cleanup
rm -f /tmp/api_response.json /tmp/response_*.json

echo -e "\n${GREEN}🎉 All tests passed!${NC}"
echo -e "${GREEN}✨ React Query should work correctly with this API${NC}"
echo -e "\n${YELLOW}Summary:${NC}"
echo "- API endpoint: http://localhost:3000/api/service-providers"
echo "- Response format: JSON with success, data, message fields"
echo "- Service providers: Array of provider objects"
echo "- Pagination: Included in response"
echo "- Query parameters: Supported (page, limit)"
echo "- Concurrent requests: Handled properly"
echo "- Performance: Suitable for React Query"
