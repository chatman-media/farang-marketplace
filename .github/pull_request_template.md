## 📝 Description

<!-- Provide a brief description of the changes in this PR -->

## 🎯 Type of Change

<!-- Mark the relevant option with an "x" -->

- [ ] 🐛 Bug fix (non-breaking change which fixes an issue)
- [ ] ✨ New feature (non-breaking change which adds functionality)
- [ ] 💥 Breaking change (fix or feature that would cause existing functionality to not work as expected)
- [ ] 📚 Documentation update
- [ ] 🎨 Style update (formatting, renaming)
- [ ] ♻️ Code refactoring (no functional changes)
- [ ] ⚡ Performance improvement
- [ ] ✅ Test update
- [ ] 🔧 Build configuration change
- [ ] 🔒 Security fix

## 🔗 Related Issues

<!-- Link to related issues using #issue_number -->

Closes #
Related to #

## 🧪 Testing

### Test Coverage

- [ ] Unit tests added/updated
- [ ] Integration tests added/updated
- [ ] E2E tests added/updated
- [ ] Manual testing completed

### Test Results

```bash
# Paste relevant test output here
```

**Coverage**: X% (target: 80%)

## 📸 Screenshots

<!-- If applicable, add screenshots to help explain your changes -->

## ✅ Checklist

### Code Quality

- [ ] My code follows the project's style guidelines
- [ ] I have performed a self-review of my own code
- [ ] I have commented my code, particularly in hard-to-understand areas
- [ ] I have made corresponding changes to the documentation
- [ ] My changes generate no new warnings or errors
- [ ] I have added tests that prove my fix is effective or that my feature works
- [ ] New and existing unit tests pass locally with my changes

### Security

- [ ] No sensitive data (passwords, keys, tokens) in code
- [ ] Input validation implemented where needed
- [ ] SQL injection prevention verified
- [ ] XSS prevention verified
- [ ] Authorization checks in place
- [ ] Security best practices followed

### Performance

- [ ] No performance regressions introduced
- [ ] Database queries optimized
- [ ] Large datasets handled efficiently
- [ ] Memory leaks checked

### Database

- [ ] Database migrations added (if schema changed)
- [ ] Migration rollback tested
- [ ] No data loss in migrations
- [ ] Indexes added where appropriate

### Dependencies

- [ ] Dependencies reviewed for security vulnerabilities
- [ ] License compatibility checked
- [ ] Package lock file updated
- [ ] Unnecessary dependencies removed

### Documentation

- [ ] README updated (if needed)
- [ ] API documentation updated (if applicable)
- [ ] Code comments added/updated
- [ ] CHANGELOG updated

## 🚀 Deployment Notes

<!-- Any special deployment considerations or migration steps -->

- [ ] Requires environment variable changes
- [ ] Requires database migration
- [ ] Requires cache clearing
- [ ] Requires service restart
- [ ] Breaking changes (document in CHANGELOG)

### Environment Variables

<!-- List any new or changed environment variables -->

```bash
# Add new variables to .env
NEW_VAR=value
```

## 📊 Performance Impact

<!-- Describe any performance implications -->

- **Build time**: No change / Faster / Slower by X%
- **Bundle size**: No change / Smaller / Larger by X KB
- **Runtime performance**: No change / Faster / Slower

## 🔄 Migration Guide

<!-- If this is a breaking change, provide migration steps -->

```bash
# Steps to migrate
```

## 📝 Additional Notes

<!-- Any additional information that reviewers should know -->

---

## 🤖 Automated Checks

<!-- These will be automatically checked by CI/CD -->

- ✅ Lint checks pass
- ✅ Type checks pass
- ✅ Unit tests pass
- ✅ Integration tests pass
- ✅ Code coverage meets threshold (80%)
- ✅ Build succeeds
- ✅ Security scans pass (CodeQL, Trivy)
- ✅ Docker validation passes

## 👀 Reviewers

<!-- Tag specific reviewers if needed -->

@reviewer1 @reviewer2

## 📚 References

<!-- Links to relevant documentation, RFCs, or discussions -->

- [Related RFC](#)
- [Design Document](#)
- [External Documentation](https://example.com)

---

**Reviewer Guidelines:**

1. Check code quality and adherence to standards
2. Verify test coverage and test quality
3. Review security implications
4. Check performance impact
5. Validate documentation updates
6. Test locally if possible
7. Review database migrations carefully
8. Check for breaking changes

**Remember**: Every PR should improve code quality, not just add features!
