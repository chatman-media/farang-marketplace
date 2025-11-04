#!/usr/bin/env bash

# 🔍 GitHub Actions Workflow Checker
# Validates all workflow files and checks configuration

set -e

WORKFLOWS_DIR=".github/workflows"
BOLD='\033[1m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BOLD}🔍 Checking GitHub Actions Workflows${NC}\n"

# Check if workflows directory exists
if [ ! -d "$WORKFLOWS_DIR" ]; then
    echo -e "${RED}❌ Workflows directory not found: $WORKFLOWS_DIR${NC}"
    exit 1
fi

# Count workflows
WORKFLOW_COUNT=$(find "$WORKFLOWS_DIR" -name "*.yml" -type f | wc -l | tr -d ' ')
echo -e "${GREEN}📁 Found $WORKFLOW_COUNT workflow files${NC}\n"

# List all workflows
echo -e "${BOLD}📋 Workflow Files:${NC}"
for file in "$WORKFLOWS_DIR"/*.yml; do
    if [ -f "$file" ]; then
        filename=$(basename "$file")
        echo -e "  ${GREEN}✓${NC} $filename"
    fi
done
echo ""

# Check YAML syntax (if yamllint is available)
if command -v yamllint &> /dev/null; then
    echo -e "${BOLD}🔍 Checking YAML syntax...${NC}"
    if yamllint -d relaxed "$WORKFLOWS_DIR"/*.yml 2>/dev/null; then
        echo -e "${GREEN}✓ All YAML files are valid${NC}\n"
    else
        echo -e "${YELLOW}⚠️  Some YAML warnings found (non-critical)${NC}\n"
    fi
else
    echo -e "${YELLOW}⚠️  yamllint not installed, skipping syntax check${NC}"
    echo -e "   Install with: ${BOLD}pip install yamllint${NC} or ${BOLD}brew install yamllint${NC}\n"
fi

# Check required secrets
echo -e "${BOLD}🔐 Required Secrets:${NC}"
echo -e "  ${YELLOW}⚠️${NC}  CODECOV_TOKEN - Required for coverage uploads"
echo -e "  ${YELLOW}⚠️${NC}  CODACY_PROJECT_TOKEN - Optional, for Codacy integration"
echo -e "  ${YELLOW}⚠️${NC}  SLACK_WEBHOOK_URL - Optional, for Slack notifications"
echo -e "\n${BOLD}Configure at:${NC} https://github.com/YOUR_USERNAME/YOUR_REPO/settings/secrets/actions\n"

# Check if .env.example exists
if [ -f ".env.example" ]; then
    echo -e "${GREEN}✓ .env.example found${NC}"
else
    echo -e "${YELLOW}⚠️  .env.example not found - workflows may need it${NC}"
fi

# Check if codecov.yml exists
if [ -f "codecov.yml" ]; then
    echo -e "${GREEN}✓ codecov.yml found${NC}"
else
    echo -e "${RED}❌ codecov.yml not found${NC}"
fi

# Check if dependabot.yml exists
if [ -f ".github/dependabot.yml" ]; then
    echo -e "${GREEN}✓ dependabot.yml found${NC}"
else
    echo -e "${YELLOW}⚠️  dependabot.yml not found${NC}"
fi

echo ""

# Check Docker setup
echo -e "${BOLD}🐳 Docker Setup:${NC}"
if [ -f "docker-compose.yml" ]; then
    echo -e "${GREEN}✓ docker-compose.yml found${NC}"
    
    # Validate docker-compose syntax if docker-compose is available
    if command -v docker compose &> /dev/null; then
        if docker compose config > /dev/null 2>&1; then
            echo -e "${GREEN}✓ docker-compose.yml is valid${NC}"
        else
            echo -e "${RED}❌ docker-compose.yml has errors${NC}"
        fi
    fi
else
    echo -e "${RED}❌ docker-compose.yml not found${NC}"
fi

echo ""

# Check test setup
echo -e "${BOLD}🧪 Test Setup:${NC}"
if [ -f "package.json" ]; then
    if grep -q '"test"' package.json; then
        echo -e "${GREEN}✓ Test script found in package.json${NC}"
    else
        echo -e "${RED}❌ No test script in package.json${NC}"
    fi
    
    if grep -q '"test:coverage"' package.json; then
        echo -e "${GREEN}✓ Coverage script found in package.json${NC}"
    else
        echo -e "${YELLOW}⚠️  No test:coverage script in package.json${NC}"
    fi
else
    echo -e "${RED}❌ package.json not found${NC}"
fi

echo ""

# Check for vitest config files
VITEST_CONFIGS=$(find . -name "vitest.config.ts" -not -path "*/node_modules/*" | wc -l | tr -d ' ')
echo -e "${GREEN}✓ Found $VITEST_CONFIGS vitest config files${NC}"

echo ""

# Summary
echo -e "${BOLD}📊 Summary:${NC}"
echo -e "  ${GREEN}✓${NC} $WORKFLOW_COUNT workflow files configured"
echo -e "  ${GREEN}✓${NC} $VITEST_CONFIGS services/apps with test setup"

echo ""
echo -e "${BOLD}🎯 Next Steps:${NC}"
echo -e "  1. Configure required secrets in GitHub repository settings"
echo -e "  2. Enable branch protection rules for main branch"
echo -e "  3. Set up Codecov integration"
echo -e "  4. Review and customize workflows as needed"
echo -e "  5. Create a test PR to verify all workflows"

echo ""
echo -e "${GREEN}✅ Workflow check complete!${NC}"
echo -e "\n${BOLD}📚 Documentation:${NC}"
echo -e "  - Workflow details: .github/workflows/README.md"
echo -e "  - Setup guide: SETUP_GITHUB_ACTIONS.md"
echo -e "  - Security policy: .github/SECURITY.md"

