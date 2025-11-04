# 🔐 Security Policy

## Supported Versions

We actively support the following versions with security updates:

| Version | Supported          |
| ------- | ------------------ |
| 1.x.x   | :white_check_mark: |
| < 1.0   | :x:                |

## 🛡️ Security Measures

### Automated Security Scanning

We employ multiple security scanning tools in our CI/CD pipeline:

#### 1. **CodeQL Analysis**
- Runs on every push and PR
- Daily scheduled scans
- Scans for:
  - SQL injection
  - XSS vulnerabilities
  - Command injection
  - Path traversal
  - Insecure randomness
  - And 200+ other vulnerability types

#### 2. **Trivy Security Scanner**
- Multi-layer scanning:
  - Filesystem and dependencies
  - Docker images
  - Configuration files
  - Secret detection
- Severity levels: CRITICAL, HIGH, MEDIUM, LOW

#### 3. **Codacy Security Scan**
- Code quality and security issues
- SARIF reports to GitHub Security
- Weekly comprehensive scans

#### 4. **Dependabot**
- Automated dependency updates
- Security patch notifications
- Vulnerable dependency alerts

### Security Best Practices

Our codebase follows these security practices:

✅ **Input Validation**: All user inputs are validated and sanitized
✅ **SQL Injection Prevention**: Using parameterized queries with Drizzle ORM
✅ **XSS Prevention**: Output encoding and Content Security Policy
✅ **CSRF Protection**: Token-based CSRF protection
✅ **Authentication**: JWT with secure token storage
✅ **Authorization**: Role-based access control (RBAC)
✅ **Rate Limiting**: API rate limiting via Fastify
✅ **HTTPS Only**: All production traffic over HTTPS
✅ **Secrets Management**: No secrets in code, environment variables only
✅ **Security Headers**: Helmet.js for security headers
✅ **CORS**: Properly configured CORS policies

## 🐛 Reporting a Vulnerability

We take security vulnerabilities seriously. If you discover a security issue, please follow these steps:

### **DO:**

1. **Email us privately** at: `security@marketplace.local` (replace with actual email)
2. Include detailed information:
   - Description of the vulnerability
   - Steps to reproduce
   - Potential impact
   - Suggested fix (if any)
3. Allow us time to fix the issue before public disclosure
4. We aim to respond within **48 hours**

### **DON'T:**

- ❌ Open a public GitHub issue
- ❌ Share the vulnerability publicly before we've fixed it
- ❌ Exploit the vulnerability beyond proof-of-concept

## 🎯 Vulnerability Response Process

1. **Receipt**: We acknowledge your report within 48 hours
2. **Assessment**: We assess the severity and impact (1-5 business days)
3. **Fix**: We develop and test a fix
4. **Release**: We release a security patch
5. **Disclosure**: We publicly disclose after fix is deployed
6. **Credit**: We credit you in our security advisories (if desired)

## 🏆 Security Hall of Fame

We recognize security researchers who responsibly disclose vulnerabilities:

<!-- List of contributors who found security issues -->

## 📋 Security Checklist

For developers contributing to this project:

### Code Review Checklist

- [ ] No hardcoded secrets or credentials
- [ ] Input validation on all user inputs
- [ ] Parameterized database queries
- [ ] Output encoding for XSS prevention
- [ ] Authorization checks on protected routes
- [ ] Rate limiting on API endpoints
- [ ] Proper error handling (no sensitive info in errors)
- [ ] Security headers configured
- [ ] CSRF tokens where applicable
- [ ] Secure session management

### Before Committing

```bash
# Check for secrets
git diff | grep -E "(password|secret|token|key)" --color

# Run security scans locally
bun run lint
bun run type-check
bun run test

# Check dependencies
bun audit
```

### Environment Variables

Never commit these to git:
- API keys
- Database passwords
- JWT secrets
- OAuth credentials
- Encryption keys
- Third-party service tokens

Always use `.env` files and add them to `.gitignore`.

## 🔒 Security Features by Service

### User Service
- Password hashing with bcrypt (cost factor: 12)
- JWT token authentication
- Refresh token rotation
- Account lockout after failed attempts
- Email verification
- Password reset tokens (expiring)

### Payment Service
- PCI DSS compliant payment processing
- No storage of card numbers
- Secure payment gateway integration
- Transaction logging and monitoring
- Fraud detection

### API Gateway
- Rate limiting per IP and user
- Request validation
- Circuit breaker pattern
- DDoS protection
- Request signing

### Notification Service
- Template injection prevention
- Content sanitization
- Bounce and complaint handling
- SPF/DKIM/DMARC configured

## 🛠️ Security Tools & Commands

### Local Security Testing

```bash
# Install security tools
bun add -D @typescript-eslint/eslint-plugin-security

# Run security linting
bun run lint:security

# Audit dependencies
bun audit

# Check for outdated packages with known vulnerabilities
bun outdated

# Test with security headers
curl -I https://localhost:3000 | grep -E "X-|Strict|Content-Security"
```

### Docker Security

```bash
# Scan Docker images
docker scan marketplace-postgres

# Check for vulnerabilities in base images
trivy image postgres:15-alpine

# Verify image signatures
docker trust inspect postgres:15-alpine
```

## 📚 Security Resources

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [OWASP API Security](https://owasp.org/www-project-api-security/)
- [Node.js Security Best Practices](https://nodejs.org/en/docs/guides/security/)
- [TypeScript Security Guide](https://typescript-eslint.io/linting/configs/#recommended-configurations)
- [Fastify Security](https://fastify.dev/docs/latest/Reference/Security/)

## 🔄 Security Update Schedule

- **Critical**: Immediate patch release
- **High**: Within 7 days
- **Medium**: Next minor release
- **Low**: Next major release

## 📧 Contact

For security concerns:
- **Email**: security@marketplace.local
- **PGP Key**: [Link to PGP key]
- **Security Advisories**: GitHub Security Advisories page

## 📜 Compliance

This project aims to comply with:
- GDPR (General Data Protection Regulation)
- PCI DSS Level 1 (for payment processing)
- OWASP Top 10 Web Application Security Risks
- CWE Top 25 Most Dangerous Software Weaknesses

---

**Last Updated**: 2025-11-04

Thank you for helping keep Thailand Marketplace secure! 🙏
