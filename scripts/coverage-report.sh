#!/bin/bash

# 📊 Modern Coverage Reporter for Thailand Marketplace
# Generates comprehensive coverage reports and uploads to Codecov

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
PURPLE='\033[0;35m'
CYAN='\033[0;36m'
NC='\033[0m' # No Color

echo -e "${PURPLE}🚀 Thailand Marketplace - Coverage Report Generator${NC}"
echo -e "${CYAN}=================================================${NC}"

# Function to check if command exists
command_exists() {
    command -v "$1" >/dev/null 2>&1
}

# Function to get service coverage
get_service_coverage() {
    local service_path=$1
    local service_name=$(basename "$service_path")
    
    if [ -f "${service_path}/coverage/coverage-summary.json" ]; then
        local coverage=$(node -e "
            const fs = require('fs');
            try {
                const data = JSON.parse(fs.readFileSync('${service_path}/coverage/coverage-summary.json', 'utf8'));
                const total = data.total;
                console.log(\`\${total.lines.pct}%\`);
            } catch(e) {
                console.log('N/A');
            }
        ")
        echo "$coverage"
    else
        echo "N/A"
    fi
}

# Function to display coverage table
display_coverage_table() {
    echo -e "${BLUE}📊 Coverage Summary by Service:${NC}"
    echo -e "${CYAN}┌─────────────────────────────┬──────────────┐${NC}"
    echo -e "${CYAN}│ Service                     │ Coverage     │${NC}"
    echo -e "${CYAN}├─────────────────────────────┼──────────────┤${NC}"
    
    for service_dir in services/*/; do
        if [ -d "$service_dir" ]; then
            service_name=$(basename "$service_dir")
            coverage=$(get_service_coverage "$service_dir")
            
            # Color code based on coverage
            if [[ "$coverage" == "N/A" ]]; then
                color=$RED
            elif [[ "${coverage%\%}" -ge 90 ]]; then
                color=$GREEN
            elif [[ "${coverage%\%}" -ge 70 ]]; then
                color=$YELLOW
            else
                color=$RED
            fi
            
            printf "${CYAN}│${NC} %-27s ${CYAN}│${NC} ${color}%-12s${NC} ${CYAN}│${NC}\n" "$service_name" "$coverage"
        fi
    done
    
    echo -e "${CYAN}└─────────────────────────────┴──────────────┘${NC}"
}

# Run tests with coverage for all services
echo -e "${BLUE}🧪 Running tests with coverage...${NC}"
bun run test:coverage

# Merge coverage reports
echo -e "${BLUE}🔄 Merging coverage reports...${NC}"
./scripts/merge-coverage.sh

# Display coverage table
display_coverage_table

# Generate badges
echo -e "${BLUE}🏷️  Generating coverage badges...${NC}"
if [ -f "coverage/merged/coverage-summary.json" ]; then
    node -e "
        const fs = require('fs');
        try {
            const data = JSON.parse(fs.readFileSync('coverage/merged/coverage-summary.json', 'utf8'));
            const coverage = data.total.lines.pct;
            
            let color = 'red';
            if (coverage >= 90) color = 'brightgreen';
            else if (coverage >= 70) color = 'yellow';
            else if (coverage >= 50) color = 'orange';
            
            const badge = \`https://img.shields.io/badge/coverage-\${coverage}%25-\${color}\`;
            console.log('Coverage Badge URL:', badge);
            
            // Save badge info
            fs.writeFileSync('coverage/badge.json', JSON.stringify({
                coverage: coverage,
                color: color,
                url: badge
            }, null, 2));
        } catch(e) {
            console.log('Could not generate badge:', e.message);
        }
    "
fi

# Upload to Codecov if token is available
if [ -n "$CODECOV_TOKEN" ] || [ -n "$CI" ]; then
    echo -e "${BLUE}☁️  Uploading to Codecov...${NC}"
    
    if command_exists codecov; then
        codecov -f coverage/merged/lcov.info -t "$CODECOV_TOKEN"
        echo -e "${GREEN}✅ Coverage uploaded to Codecov${NC}"
    else
        echo -e "${YELLOW}⚠️  Codecov CLI not found, installing...${NC}"
        npm install -g codecov
        codecov -f coverage/merged/lcov.info -t "$CODECOV_TOKEN"
    fi
else
    echo -e "${YELLOW}⚠️  Codecov token not found, skipping upload${NC}"
    echo -e "${CYAN}💡 Set CODECOV_TOKEN environment variable to enable upload${NC}"
fi

# Open HTML report if in development
if [ "$NODE_ENV" != "production" ] && [ "$CI" != "true" ]; then
    if [ -f "coverage/html/index.html" ]; then
        echo -e "${BLUE}🌐 Opening coverage report in browser...${NC}"
        if command_exists open; then
            open coverage/html/index.html
        elif command_exists xdg-open; then
            xdg-open coverage/html/index.html
        fi
    fi
fi

echo -e "${GREEN}🎉 Coverage report generation completed!${NC}"
echo -e "${CYAN}📁 Reports available at:${NC}"
echo -e "  • HTML Report: coverage/html/index.html"
echo -e "  • JSON Summary: coverage/merged/coverage-summary.json"
echo -e "  • LCOV Info: coverage/merged/lcov.info"

if [ -f "coverage/badge.json" ]; then
    echo -e "${CYAN}🏷️  Coverage badge: $(cat coverage/badge.json | node -e "console.log(JSON.parse(require('fs').readFileSync(0, 'utf8')).url)")"
fi
