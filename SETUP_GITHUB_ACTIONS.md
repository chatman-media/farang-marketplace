# 🚀 GitHub Actions Setup Guide

Complete guide to configure all workflows and integrations for the Thailand Marketplace project.

## 📋 Prerequisites

Before setting up GitHub Actions, ensure you have:

- ✅ Repository on GitHub
- ✅ Admin access to repository settings
- ✅ Local development environment working
- ✅ Docker installed (for local testing)

## 🔐 Step 1: Configure Repository Secrets

Navigate to **Settings → Secrets and variables → Actions** and add these secrets:

### Required Secrets

#### 1. Codecov Token

```bash
# Get your Codecov token from https://codecov.io
# 1. Sign in to Codecov with GitHub
# 2. Add your repository
# 3. Copy the upload token

Secret name: CODECOV_TOKEN
Secret value: <your-codecov-token>
```

#### 2. Codacy Project Token (Optional)

```bash
# Get from https://app.codacy.com
# 1. Add your repository
# 2. Go to Settings → Integrations
# 3. Copy Project API Token

Secret name: CODACY_PROJECT_TOKEN
Secret value: <your-codacy-token>
```

### Optional Secrets (for notifications)

```bash
# Slack webhook for notifications
Secret name: SLACK_WEBHOOK_URL
Secret value: <your-slack-webhook>
```

## 🔧 Step 2: Enable GitHub Features

### Enable GitHub Actions

1. Go to **Settings → Actions → General**
2. Set **Actions permissions** to "Allow all actions and reusable workflows"
3. Set **Workflow permissions** to "Read and write permissions"
4. Check "Allow GitHub Actions to create and approve pull requests"

### Enable GitHub Pages (for web app deployment)

1. Go to **Settings → Pages**
2. Source: "GitHub Actions"
3. The web app will be deployed to `https://<username>.github.io/thailand-marketplace/`

### Enable Dependabot

1. Go to **Settings → Code security and analysis**
2. Enable **Dependabot alerts**
3. Enable **Dependabot security updates**
4. Enable **Dependabot version updates**

### Enable Code Scanning

1. Go to **Security → Code scanning**
2. Enable **CodeQL analysis** (already configured in workflows)
3. View results in **Security → Code scanning alerts**

## 📊 Step 3: Configure Branch Protection

Go to **Settings → Branches → Branch protection rules** and add a rule for `main`:

### Required Settings

```yaml
Branch name pattern: main

Require a pull request before merging:
  ✅ Enabled
  Required approvals: 1
  ✅ Dismiss stale PR approvals when new commits are pushed
  ✅ Require review from Code Owners

Require status checks to pass before merging:
  ✅ Enabled
  ✅ Require branches to be up to date before merging

Status checks that are required:
  - ✅ CI Pipeline / lint
  - ✅ CI Pipeline / type-check
  - ✅ CI Pipeline / test
  - ✅ CI Pipeline / build
  - ✅ CI Pipeline / all-checks-passed
  - ✅ Coverage Report / coverage
  - ✅ CodeQL Security Analysis / analyze

Require conversation resolution before merging:
  ✅ Enabled

Do not allow bypassing the above settings:
  ✅ Enabled (except for admins if needed)
```

### Optional (Recommended)

```yaml
Require linear history: ✅
Include administrators: ✅ (recommended for consistency)
Restrict who can push to matching branches: (optional)
```

## 🔄 Step 4: Set Up Codecov Integration

### 1. Sign up for Codecov

1. Go to https://codecov.io
2. Sign in with GitHub
3. Authorize Codecov access

### 2. Add Repository

1. Select "Add new repository"
2. Find "thailand-marketplace"
3. Copy the upload token
4. Add it to GitHub secrets (see Step 1)

### 3. Configure Codecov Badge

Update README.md:

```markdown
[![codecov](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace)
```

### 4. Configure Codecov Settings

In Codecov dashboard:
- **Project Settings → General**
  - Enable PR comments
  - Enable commit status
  - Enable GitHub checks
- **Project Settings → YAML**
  - Should auto-detect `codecov.yml` from repo

## 🛡️ Step 5: Set Up Security Scanning

### CodeQL Configuration

Already configured in `.github/workflows/codeql.yml`. No additional setup needed.

**View results**: Security → Code scanning → CodeQL

### Trivy Configuration

Already configured in `.github/workflows/trivy.yml`. Scans:
- Dependencies
- Docker images
- Configuration files
- Secrets

**View results**: Security → Code scanning → Trivy

### Dependabot Configuration

Already configured in `.github/dependabot.yml`.

**Settings**:
- Weekly updates
- Grouped by dependency type
- Auto-labeled PRs

**Manage**: Security → Dependabot

## 📧 Step 6: Configure Notifications (Optional)

### Slack Integration

1. Create Slack webhook:
   ```bash
   # In Slack workspace
   # Apps → Incoming Webhooks → Add to Slack
   # Copy webhook URL
   ```

2. Add to GitHub secrets:
   ```bash
   SLACK_WEBHOOK_URL=https://hooks.slack.com/services/YOUR/WEBHOOK/URL
   ```

3. Update workflows to use webhook (examples in workflow files)

### Email Notifications

GitHub automatically sends emails for:
- Workflow failures (to commit author)
- Security alerts
- Dependabot alerts

Configure in **Settings → Notifications**

## 🧪 Step 7: Test Workflows

### Test Locally (Optional)

Install `act` to run workflows locally:

```bash
# macOS
brew install act

# Linux
curl https://raw.githubusercontent.com/nektos/act/master/install.sh | sudo bash

# Test CI workflow
act -j lint
act -j test

# Test with secrets
echo "CODECOV_TOKEN=test" > .secrets
act --secret-file .secrets
```

### Test on GitHub

1. **Create a test branch**:
   ```bash
   git checkout -b test/workflows
   git commit --allow-empty -m "test: trigger workflows"
   git push origin test/workflows
   ```

2. **Create a PR**

3. **Check Actions tab** for running workflows

4. **Verify all checks pass**

## 📊 Step 8: Verify Setup

### Checklist

- [ ] All required secrets configured
- [ ] GitHub Actions enabled
- [ ] Branch protection rules active
- [ ] Codecov integration working
- [ ] Security scanning enabled
- [ ] Dependabot active
- [ ] Workflows run successfully on test PR

### Verification Commands

```bash
# Check workflow syntax locally
yamllint .github/workflows/*.yml

# List all workflows
ls -la .github/workflows/

# Check Dependabot config
cat .github/dependabot.yml

# Verify codecov config
cat codecov.yml
```

## 🎯 Step 9: Create Status Badges

Add to your README.md:

```markdown
# Thailand Marketplace

[![CI Pipeline](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/CI%20Pipeline/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/ci.yml)
[![Coverage](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace/branch/main/graph/badge.svg)](https://codecov.io/gh/YOUR_USERNAME/thailand-marketplace)
[![CodeQL](https://github.com/YOUR_USERNAME/thailand-marketplace/workflows/CodeQL%20Security%20Analysis/badge.svg)](https://github.com/YOUR_USERNAME/thailand-marketplace/actions/workflows/codeql.yml)
[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
```

## 📚 Step 10: Update Documentation

### Update README.md

Add section about CI/CD:

```markdown
## 🚀 CI/CD Pipeline

Our project uses GitHub Actions for comprehensive CI/CD:

- ✅ **Continuous Integration**: Automated testing on every PR
- ✅ **Code Coverage**: 80%+ coverage requirement
- ✅ **Security Scanning**: CodeQL, Trivy, Dependabot
- ✅ **Performance Tests**: Automated benchmarks
- ✅ **Docker Validation**: Container build verification
- ✅ **Automated Releases**: Semantic versioning

See [Workflows Documentation](.github/workflows/README.md) for details.
```

### Update CONTRIBUTING.md

Add section about PR requirements:

```markdown
## Pull Request Process

1. Ensure all tests pass locally
2. Update documentation as needed
3. Add tests for new features
4. Follow the PR template
5. Wait for automated checks to pass:
   - ✅ CI Pipeline
   - ✅ Code Coverage (80%+)
   - ✅ Security Scans
   - ✅ Code Review
```

## 🔍 Troubleshooting

### Workflows not running

**Check**:
1. Actions enabled in repository settings
2. Workflow files in `.github/workflows/`
3. Valid YAML syntax
4. Correct trigger conditions

### Coverage upload fails

**Solutions**:
1. Verify `CODECOV_TOKEN` is set
2. Check internet connectivity
3. Verify coverage files exist
4. Check Codecov service status

### Tests fail in CI but pass locally

**Common causes**:
1. Missing environment variables
2. Service not ready (increase timeout)
3. Timezone differences
4. File permission issues
5. Different Node.js/Bun versions

**Debug**:
```bash
# Enable debug logging
# Add to workflow env:
ACTIONS_STEP_DEBUG: true
ACTIONS_RUNNER_DEBUG: true
```

### Docker tests fail

**Check**:
1. Docker service healthy
2. Port conflicts
3. Volume mounts correct
4. Network connectivity
5. Image pull successful

### Security scans report issues

**Process**:
1. Review findings in Security tab
2. Assess severity
3. Update dependencies if needed
4. Add exceptions for false positives

## 📞 Support

### Resources

- **GitHub Actions Docs**: https://docs.github.com/en/actions
- **Codecov Docs**: https://docs.codecov.com/
- **Dependabot Docs**: https://docs.github.com/en/code-security/dependabot
- **Workflow README**: `.github/workflows/README.md`

### Getting Help

1. Check workflow logs in Actions tab
2. Review troubleshooting section above
3. Search GitHub Issues
4. Create new issue with workflow run link

## 🎉 Success Criteria

Your setup is complete when:

✅ All workflows run successfully on a test PR
✅ Coverage reports appear on Codecov
✅ Security scanning results in Security tab
✅ Dependabot creates update PRs
✅ Status badges show in README
✅ Branch protection enforces checks

---

## 🚦 Next Steps

After setup:

1. **Monitor**: Watch first few PRs to ensure all checks work
2. **Tune**: Adjust timeouts, thresholds as needed
3. **Document**: Keep team informed about requirements
4. **Maintain**: Regularly review and update workflows
5. **Improve**: Add more tests, checks as project grows

## 📝 Maintenance Schedule

- **Weekly**: Review Dependabot PRs
- **Monthly**: Check security alerts and findings
- **Quarterly**: Update workflow versions and configurations
- **Yearly**: Review and optimize entire CI/CD pipeline

---

**Setup Date**: ___________
**Setup By**: ___________
**Verified By**: ___________

✅ Setup Complete!
