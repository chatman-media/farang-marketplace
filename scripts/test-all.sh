#!/bin/bash

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${BLUE}🚀 Running all tests for Thailand Marketplace${NC}"
echo -e "${BLUE}================================================${NC}"
echo ""

# Array to store results
declare -a results=()
declare -a services=()
declare -a test_counts=()
declare -a durations=()

# Function to run tests for a service
run_service_tests() {
    local service_path=$1
    local service_name=$2

    echo -e "${CYAN}📦 Testing ${service_name}...${NC}"

    if [ -d "$service_path" ]; then
        cd "$service_path"

        # Run tests and capture output
        if output=$(bun test --run 2>&1); then
            # Extract test count and duration from output - improved parsing for Bun test format
            test_count=$(echo "$output" | grep -E "^[[:space:]]*[0-9]+ pass" | tail -1 | grep -oE '[0-9]+' || echo "0")
            if [ "$test_count" = "0" ]; then
                # Try counting ✓ symbols as fallback
                test_count=$(echo "$output" | grep -c "✓" || echo "0")
            fi
            duration=$(echo "$output" | grep -E "Ran [0-9]+ tests.*\[[0-9]+\.[0-9]+s\]" | tail -1 | grep -oE '\[[0-9]+\.[0-9]+s\]' | tr -d '[]' || echo "N/A")

            echo -e "${GREEN}✅ ${service_name}: ${test_count} tests passed${NC}"
            results+=("✅")
            services+=("$service_name")
            test_counts+=("$test_count")
            durations+=("$duration")
        else
            # Check if it's a failure or just no tests
            if echo "$output" | grep -q "No test files found"; then
                echo -e "${YELLOW}⚠️  ${service_name}: No tests found${NC}"
                results+=("⚠️")
                services+=("$service_name")
                test_counts+=("0")
                durations+=("N/A")
            else
                echo -e "${RED}❌ ${service_name}: Tests failed${NC}"
                echo -e "${RED}   Error: $(echo "$output" | tail -3 | head -1)${NC}"
                results+=("❌")
                services+=("$service_name")
                test_counts+=("FAILED")
                durations+=("N/A")
            fi
        fi

        cd - > /dev/null
    else
        echo -e "${YELLOW}⚠️  ${service_name}: Directory not found${NC}"
        results+=("⚠️")
        services+=("$service_name")
        test_counts+=("N/A")
        durations+=("N/A")
    fi

    echo ""
}

# Test all services
echo -e "${PURPLE}🔍 Discovering and testing services...${NC}"
echo ""

run_service_tests "services/user-service" "User Service"
run_service_tests "services/ai-service" "AI Service"
run_service_tests "services/voice-service" "Voice Service"
run_service_tests "services/agency-service" "Agency Service"
run_service_tests "services/payment-service" "Payment Service"
run_service_tests "services/booking-service" "Booking Service"
run_service_tests "services/listing-service" "Listing Service"

# Summary
echo -e "${BLUE}📊 TEST SUMMARY${NC}"
echo -e "${BLUE}===============${NC}"
echo ""

total_tests=0
passed_services=0
failed_services=0

for i in "${!services[@]}"; do
    service="${services[$i]}"
    result="${results[$i]}"
    count="${test_counts[$i]}"
    duration="${durations[$i]}"

    if [[ "$result" == "✅" ]]; then
        echo -e "${GREEN}${result} ${service}: ${count} tests passed (${duration})${NC}"
        ((passed_services++))
        if [[ "$count" =~ ^[0-9]+$ ]] && [ "$count" -gt 0 ]; then
            ((total_tests += count))
        fi
    elif [[ "$result" == "❌" ]]; then
        echo -e "${RED}${result} ${service}: Tests failed${NC}"
        ((failed_services++))
    elif [[ "$result" == "⚠️" ]]; then
        if [[ "$count" == "0" ]]; then
            echo -e "${YELLOW}${result} ${service}: No tests found${NC}"
        else
            echo -e "${YELLOW}${result} ${service}: Not found${NC}"
        fi
    fi
done

echo ""
echo -e "${BLUE}🎯 OVERALL RESULTS${NC}"
echo -e "${BLUE}==================${NC}"
echo -e "${GREEN}✅ Passed Services: ${passed_services}${NC}"
if [ $failed_services -gt 0 ]; then
    echo -e "${RED}❌ Failed Services: ${failed_services}${NC}"
fi
echo -e "${CYAN}📈 Total Tests Passed: ${total_tests}${NC}"

if [ $failed_services -eq 0 ]; then
    echo ""
    echo -e "${GREEN}🎉 ALL TESTS PASSED! 🎉${NC}"
    echo -e "${GREEN}Thailand Marketplace is ready for production! 🚀${NC}"
    exit 0
else
    echo ""
    echo -e "${RED}💥 Some tests failed. Please check the output above.${NC}"
    exit 1
fi
