# 🚀 GitHub Actions Workflows

Comprehensive CI/CD pipeline for the Thailand Marketplace platform with extensive testing, security scanning, and deployment automation.

## 📋 Overview

| Workflow | Trigger | Purpose | Status Badge |
|----------|---------|---------|--------------|
| **CI Pipeline** | Push, PR | Fast checks (lint, type-check, test, build) | [![CI](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/CI%20Pipeline/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/ci.yml) |
| **Coverage** | Push, PR, Daily | Test coverage reporting to Codecov | [![Coverage](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace) |
| **Integration Tests** | Push, PR, Nightly | Full-stack integration testing | [![Integration](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/Integration%20Tests/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/integration.yml) |
| **Docker** | Push (docker files) | Docker build and validation | [![Docker](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/Docker%20Build%20&%20Validation/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/docker.yml) |
| **CodeQL** | Push, PR, Daily | Advanced security analysis | [![CodeQL](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/codeql.yml) |
| **Trivy** | Push, PR, Daily | Vulnerability scanning | [![Trivy](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/Trivy%20Security%20Scan/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/trivy.yml) |
| **Codacy** | Push, PR, Weekly | Code quality analysis | - |
| **Performance** | Push (main), Weekly | Performance benchmarks | [![Performance](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/Performance%20Tests/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/performance.yml) |
| **Release** | Tag push | Release creation | - |
| **Deploy** | Push to main | GitHub Pages deployment | - |

## 🔧 Workflows Details

### 🚀 CI Pipeline (`ci.yml`)

**Fast, parallel checks on every push and PR**

- **Lint & Format Check**: Biome linting, Prettier formatting
- **Type Check**: TypeScript type validation
- **Unit Tests**: Vitest tests with PostgreSQL and Redis
- **Build**: Production build validation

**Environment**:
- PostgreSQL 16 (test database)
- Redis 7
- Bun 1.2.1

**Duration**: ~5-8 minutes

---

### 🧪 Coverage Report (`coverage.yml`)

**Comprehensive test coverage reporting**

- Runs all tests with coverage
- Merges coverage from all services/apps
- Uploads to Codecov with service-specific flags
- Comments coverage on PRs
- Quality gate enforcement (70% minimum)

**Runs**:
- On push to main/develop
- On PRs
- Daily at 2 AM UTC

**Coverage Targets**:
- Project: 80%
- Patch: 75%
- Minimum (hard gate): 60%

---

### 🔄 Integration Tests (`integration.yml`)

**Full-stack testing with real services**

Three test suites:
1. **Integration Tests**: All services with PostgreSQL, Redis, MinIO
2. **E2E Tests**: End-to-end user workflows
3. **API Contract Tests**: OpenAPI/Pact validation

**Environment**:
- PostgreSQL 15 (with schemas for all services)
- Redis 7
- MinIO (with bucket initialization)
- Database migrations
- Service orchestration

**Duration**: ~15-30 minutes

**Runs**:
- On push to main/develop
- On PRs
- Nightly at 1 AM UTC

---

### 🐳 Docker Build & Validation (`docker.yml`)

**Docker infrastructure testing**

- Validates docker-compose.yml syntax
- Tests full Docker stack startup
- Health checks for all services
- Connectivity tests
- Security scanning with Trivy

**Tests**:
- PostgreSQL connectivity
- Redis operations
- MinIO bucket operations
- Service health endpoints

---

### 🔐 CodeQL Security Analysis (`codeql.yml`)

**Advanced security vulnerability detection**

- Scans JavaScript/TypeScript code
- Security-extended queries
- Quality analysis
- SARIF reports to GitHub Security

**Runs**:
- On push to main/develop
- On PRs
- Daily at 3 AM UTC

---

### 🛡️ Trivy Security Scan (`trivy.yml`)

**Multi-layer security scanning**

Four scan types:
1. **Filesystem Scan**: Dependencies vulnerabilities
2. **Configuration Scan**: IaC misconfigurations
3. **Docker Image Scan**: Container vulnerabilities
4. **Secret Scan**: Leaked credentials/keys

**Severity Levels**: CRITICAL, HIGH, MEDIUM

**Runs**:
- On push to main/develop
- On PRs
- Daily at 4 AM UTC

---

### ⚡ Performance Tests (`performance.yml`)

**Performance monitoring and benchmarking**

- Bundle size analysis
- Build performance metrics
- API response time testing
- Memory leak detection

**Runs**:
- On push to main
- On PRs to main
- Weekly on Sundays at 2 AM UTC
- Manual trigger

---

### 🚢 Release (`release.yml`)

**Automated release creation**

- Validates code (type-check, lint, tests)
- Builds all packages
- Creates release tarball
- Generates changelog
- Creates GitHub release

**Triggers**:
- Tag push matching `v*.*.*`
- Manual workflow dispatch

---

### 📦 Deploy to GitHub Pages (`deploy.yml`)

**Deployment of web app**

- Builds production web app
- Deploys to GitHub Pages
- Automatic on main branch pushes

---

### 🔍 Codacy Security Scan (`codacy.yml`)

**Third-party code quality analysis**

- SARIF report generation
- Integration with GitHub Security
- Weekly scheduled scans

**Runs**:
- On push to main
- On PRs to main
- Weekly on Mondays

---

## 🤖 Dependabot

**Automated dependency updates** (`.github/dependabot.yml`)

**Monitors**:
- npm packages (root + all services/apps)
- GitHub Actions versions
- Docker base images

**Schedule**: Weekly updates on Mondays

**Auto-groups**:
- Development dependencies
- Type definitions
- Testing tools

## 🔐 Required Secrets

Configure these secrets in GitHub repository settings:

### Codecov
```
CODECOV_TOKEN
```

### Codacy
```
CODACY_PROJECT_TOKEN
```

### Optional (for notifications)
```
SLACK_WEBHOOK_URL
```

## 📊 Status Checks

**Required checks for PR merging**:
1. ✅ CI Pipeline - All Checks Passed
2. ✅ Coverage Report - Coverage Quality Gate
3. ✅ CodeQL Security Analysis
4. ✅ Trivy Security Scan

**Optional checks**:
- Integration Tests
- Docker Validation
- Performance Tests

## 🎯 Coverage Configuration

See `codecov.yml` for detailed coverage configuration.

**Service-specific flags**:
- `payment-service`
- `user-service`
- `listing-service`
- `booking-service`
- `notification-service`
- `ai-service`
- `crm-service`
- `agency-service`
- `web-app`
- `mobile-app`
- `admin-dashboard`
- `shared-types`
- `shared-utils`

## 🚀 Running Workflows Locally

### Prerequisites
```bash
# Install act for local GitHub Actions testing
brew install act

# Or on Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash
```

### Run CI locally
```bash
# Run entire CI pipeline
act -j ci

# Run specific job
act -j lint
act -j test
act -j build
```

### Run with secrets
```bash
# Create .secrets file
echo "CODECOV_TOKEN=your-token" > .secrets

# Run with secrets
act -j coverage --secret-file .secrets
```

## 📈 Monitoring & Metrics

### Coverage Trends
View at: `https://app.codecov.io/gh/YOUR_USERNAME/thailand-marketplace`

### Security Alerts
View at: `https://github.com/YOUR_USERNAME/thailand-marketplace/security`

### Performance Metrics
View in: Actions > Performance Tests > Latest run

## 🛠️ Maintenance

### Updating Workflows

1. Test changes locally with `act`
2. Create PR with workflow changes
3. Verify workflows run successfully
4. Merge after approval

### Adding New Services

When adding a new service:

1. Update `codecov.yml` with new flag
2. Add to Dependabot config
3. Update integration tests if needed
4. Update this README

## 📝 Best Practices

1. **Fast Feedback**: CI pipeline runs in parallel jobs
2. **Comprehensive Coverage**: Multiple security scanning tools
3. **Full Environment**: Tests run with real PostgreSQL, Redis, MinIO
4. **Daily Scans**: Security checks run daily
5. **Dependency Updates**: Weekly Dependabot PRs
6. **Performance Monitoring**: Regular performance benchmarks
7. **Clear Reporting**: Detailed summaries in PR comments

## 🔗 Useful Links

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Codecov Documentation](https://docs.codecov.com/)
- [Trivy Documentation](https://aquasecurity.github.io/trivy/)
- [CodeQL Documentation](https://codeql.github.com/docs/)
- [Dependabot Documentation](https://docs.github.com/en/code-security/dependabot)

## 🆘 Troubleshooting

### Workflow fails with "service unhealthy"
- Check service health checks in workflow
- Increase timeout values
- Review service logs in failed workflow

### Coverage upload fails
- Verify CODECOV_TOKEN is set
- Check codecov.yml syntax
- Ensure coverage files exist

### Docker tests fail
- Ensure docker files exist
- Check port conflicts
- Verify service configurations

## 📞 Support

For workflow issues, check:
1. Workflow run logs
2. GitHub Actions status page
3. Create issue with workflow run link
