# 🧪 Test Coverage Guide

## 📊 Overview

Thailand Marketplace uses modern test coverage tools to ensure code quality and
reliability across all services and applications.

## 🚀 Quick Start

### Run Coverage for All Services

```bash
# Generate coverage for all workspaces
bun run test:coverage

# Merge coverage reports
bun run test:coverage:merge

# Generate comprehensive report
bun run test:coverage:report

# Upload to Codecov (requires token)
bun run test:coverage:upload
```

### Run Coverage for Specific Service

```bash
cd services/payment-service
bun run test:coverage
```

## 🎯 Coverage Targets

| Service         | Target  | Current                                                                                                                                                                       |
| --------------- | ------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Payment Service | 90%     | [![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?flag=payment-service)](https://codecov.io/gh/chatman-media/farang-marketplace) |
| User Service    | 85%     | [![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?flag=user-service)](https://codecov.io/gh/chatman-media/farang-marketplace)    |
| Listing Service | 85%     | [![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?flag=listing-service)](https://codecov.io/gh/chatman-media/farang-marketplace) |
| Booking Service | 85%     | [![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg?flag=booking-service)](https://codecov.io/gh/chatman-media/farang-marketplace) |
| **Overall**     | **80%** | [![codecov](https://codecov.io/gh/chatman-media/farang-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/chatman-media/farang-marketplace)                      |

## 🛠️ Tools & Technologies

### Coverage Engines

- **Vitest + V8**: Modern coverage for TypeScript/JavaScript
- **C8**: Alternative coverage tool for Node.js
- **NYC**: Legacy support for older projects

### Reporting & Integration

- **Codecov**: Cloud-based coverage reporting
- **HTML Reports**: Local detailed coverage visualization
- **LCOV**: Industry-standard coverage format
- **JSON**: Machine-readable coverage data

## 📁 Coverage Structure

```
coverage/
├── merged/                 # Merged coverage from all services
│   ├── coverage.json      # Combined JSON coverage
│   ├── lcov.info         # Combined LCOV format
│   └── coverage-summary.json
├── html/                  # HTML reports
│   └── index.html        # Main coverage report
├── reports/               # Individual service reports
│   ├── payment-service-coverage.json
│   ├── user-service-coverage.json
│   └── ...
└── badge.json            # Coverage badge data
```

## 🔧 Configuration

### Codecov Configuration (`codecov.yml`)

```yaml
coverage:
  precision: 2
  round: down
  range: "70...100"

  status:
    project:
      default:
        target: 80%
        threshold: 2%
```

### Service-Specific Vitest Config

```typescript
// vitest.config.ts
export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html", "lcov"],
      reportsDirectory: "./coverage",
      exclude: ["node_modules/", "dist/", "**/*.test.ts", "**/*.spec.ts"],
      thresholds: {
        lines: 80,
        functions: 80,
        branches: 80,
        statements: 80,
      },
    },
  },
})
```

## 🚦 CI/CD Integration

### GitHub Actions

Coverage is automatically generated and uploaded on:

- **Push to main/develop**
- **Pull requests**
- **Daily scheduled runs**

### Quality Gates

- **Minimum 70%** overall coverage required
- **No decrease** in coverage for PRs
- **Service-specific targets** enforced

## 📈 Coverage Metrics

### What We Measure

- **Lines**: Percentage of executed lines
- **Functions**: Percentage of called functions
- **Branches**: Percentage of executed branches
- **Statements**: Percentage of executed statements

### Coverage Levels

- 🟢 **90%+**: Excellent
- 🟡 **80-89%**: Good
- 🟠 **70-79%**: Fair
- 🔴 **<70%**: Needs Improvement

## 🎨 Viewing Reports

### Local HTML Report

```bash
# Generate and open HTML report
bun run test:coverage:report

# Manual open
open coverage/html/index.html
```

### Codecov Dashboard

Visit: https://app.codecov.io/gh/chatman-media/farang-marketplace

### VS Code Integration

Install the **Coverage Gutters** extension for inline coverage display.

## 🔍 Troubleshooting

### Common Issues

#### Coverage Not Generated

```bash
# Ensure test scripts are configured
bun run test:coverage

# Check vitest config
cat vitest.config.ts
```

#### Merge Failures

```bash
# Clean coverage directory
rm -rf coverage/

# Regenerate coverage
bun run test:coverage:merge
```

#### Codecov Upload Issues

```bash
# Check token
echo $CODECOV_TOKEN

# Manual upload
codecov -f coverage/merged/lcov.info -t $CODECOV_TOKEN
```

## 📚 Best Practices

### Writing Testable Code

1. **Small functions**: Easier to test and cover
2. **Pure functions**: Predictable and testable
3. **Dependency injection**: Mock external dependencies
4. **Error handling**: Test both success and failure paths

### Coverage Goals

1. **Focus on critical paths**: Payment, authentication, data integrity
2. **Test edge cases**: Error conditions, boundary values
3. **Integration tests**: Cover service interactions
4. **E2E tests**: Cover user workflows

### Excluding Files

```typescript
// In vitest.config.ts
coverage: {
  exclude: [
    "src/types/**",
    "src/migrations/**",
    "src/**/*.d.ts",
    "src/test/fixtures/**",
  ]
}
```

## 🎯 Service-Specific Guidelines

### Payment Service (Target: 90%)

- **Critical**: All payment flows, refunds, webhooks
- **Important**: Validation, error handling, security
- **Nice-to-have**: Utility functions, formatters

### User Service (Target: 85%)

- **Critical**: Authentication, authorization, profile management
- **Important**: OAuth flows, session management
- **Nice-to-have**: Profile utilities, formatters

### API Services (Target: 85%)

- **Critical**: All endpoints, middleware, validation
- **Important**: Error handling, rate limiting
- **Nice-to-have**: Utility functions, helpers

## 🔗 Links

- [Codecov Dashboard](https://app.codecov.io/gh/chatman-media/farang-marketplace)
- [Vitest Coverage Guide](https://vitest.dev/guide/coverage.html)
- [V8 Coverage](https://v8.dev/blog/javascript-code-coverage)
- [LCOV Format](http://ltp.sourceforge.net/coverage/lcov/genhtml.1.php)
