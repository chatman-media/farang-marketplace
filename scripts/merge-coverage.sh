#!/bin/bash

# 🧪 Modern Coverage Merger for Thailand Marketplace
# Merges coverage reports from all services and apps

set -e

echo "🔍 Merging coverage reports from all workspaces..."

# Create coverage directory
mkdir -p coverage/merged
mkdir -p coverage/reports

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to merge coverage files
merge_coverage() {
    local workspace_type=$1
    echo -e "${BLUE}📊 Processing ${workspace_type}...${NC}"
    
    for dir in ${workspace_type}/*/; do
        if [ -d "$dir" ]; then
            service_name=$(basename "$dir")
            echo -e "${YELLOW}  📁 Checking ${service_name}...${NC}"
            
            # Check for coverage files
            if [ -f "${dir}coverage/coverage-final.json" ]; then
                echo -e "${GREEN}    ✅ Found coverage for ${service_name}${NC}"
                cp "${dir}coverage/coverage-final.json" "coverage/reports/${service_name}-coverage.json"
            elif [ -f "${dir}coverage/lcov.info" ]; then
                echo -e "${GREEN}    ✅ Found LCOV for ${service_name}${NC}"
                cp "${dir}coverage/lcov.info" "coverage/reports/${service_name}-lcov.info"
            else
                echo -e "${RED}    ❌ No coverage found for ${service_name}${NC}"
            fi
        fi
    done
}

# Process all workspace types
merge_coverage "services"
merge_coverage "apps"
merge_coverage "packages"

# Merge all JSON coverage files using nyc
echo -e "${BLUE}🔄 Merging JSON coverage files...${NC}"
if ls coverage/reports/*-coverage.json 1> /dev/null 2>&1; then
    npx nyc merge coverage/reports coverage/merged/coverage.json
    echo -e "${GREEN}✅ JSON coverage merged successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No JSON coverage files found${NC}"
fi

# Merge LCOV files
echo -e "${BLUE}🔄 Merging LCOV files...${NC}"
if ls coverage/reports/*-lcov.info 1> /dev/null 2>&1; then
    cat coverage/reports/*-lcov.info > coverage/merged/lcov.info
    echo -e "${GREEN}✅ LCOV coverage merged successfully${NC}"
else
    echo -e "${YELLOW}⚠️  No LCOV files found${NC}"
fi

# Generate HTML report
echo -e "${BLUE}📊 Generating HTML report...${NC}"
if [ -f "coverage/merged/coverage.json" ]; then
    npx nyc report --reporter=html --report-dir=coverage/html --temp-dir=coverage/merged
    echo -e "${GREEN}✅ HTML report generated at coverage/html/index.html${NC}"
fi

# Generate summary
echo -e "${BLUE}📈 Generating coverage summary...${NC}"
if [ -f "coverage/merged/coverage.json" ]; then
    npx nyc report --reporter=text-summary --temp-dir=coverage/merged
    npx nyc report --reporter=json-summary --report-dir=coverage/merged --temp-dir=coverage/merged
fi

echo -e "${GREEN}🎉 Coverage merge completed!${NC}"
echo -e "${BLUE}📁 Reports available in:${NC}"
echo -e "  • HTML: coverage/html/index.html"
echo -e "  • JSON: coverage/merged/coverage.json"
echo -e "  • LCOV: coverage/merged/lcov.info"
echo -e "  • Summary: coverage/merged/coverage-summary.json"
