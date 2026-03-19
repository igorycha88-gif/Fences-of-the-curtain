# Security Policy

## Secure Cookies

### Session Cookie Security

The application uses secure session cookies to protect user sessions from Man-in-the-Middle (MITM) attacks.

#### Secure Flag

Session cookies are configured with the `secure` flag that is automatically set based on the environment:

- **Production** (`NODE_ENV=production`): `secure: true`
  - Cookies are only transmitted over HTTPS connections
  - Prevents cookie interception via unencrypted HTTP
  - Protects against MITM attacks in networks under attacker control

- **Development** (`NODE_ENV=development`): `secure: false`
  - Allows local development without SSL certificates
  - Cookies work over HTTP on localhost

#### Implementation

The secure flag is implemented in `src/lib/session.ts`:

```typescript
cookieStore.set(SESSION_COOKIE_NAME, sessionId, {
  httpOnly: true,
  sameSite: 'strict',
  maxAge: SESSION_MAX_AGE,
  path: '/',
  secure: process.env.NODE_ENV === 'production',
});
```

#### Cookie Security Attributes

All session cookies include the following security attributes:

| Attribute | Value | Purpose |
|-----------|-------|---------|
| `httpOnly` | `true` | Prevents JavaScript access (XSS protection) |
| `secure` | `true` in production | Ensures HTTPS-only transmission |
| `sameSite` | `strict` | Prevents CSRF attacks |
| `path` | `/` | Limits cookie scope to entire application |
| `maxAge` | `3600` | Session expires after 1 hour |

### Standards Compliance

The implementation follows these security standards:

- **OWASP Session Management Cheat Sheet**
  - Secure cookie transmission
  - Proper session lifecycle management

- **OWASP Top 10: A01:2021 - Broken Access Control**
  - Session identifiers protected from interception

- **CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute**
  - Mitigated through environment-based secure flag

### Risk Assessment

| Aspect | Before | After |
|--------|--------|-------|
| **Risk Level** | Medium | Low |
| **Attack Vector** | MITM in HTTP networks | Requires HTTPS compromise |
| **Impact** | Session hijacking | Significantly reduced |

### Production Requirements

**IMPORTANT**: Production deployments MUST use HTTPS for session cookies to function correctly.

Without HTTPS in production:
- Session cookies will not be sent by browsers (due to `secure: true`)
- Users will not be able to maintain sessions
- Application functionality will be impaired

### Testing

Unit tests verify the secure flag behavior:

- Tests confirm `secure: true` in production environment
- Tests confirm `secure: false` in development environment
- Tests verify all other cookie parameters are preserved

Run tests:
```bash
npm test -- __tests__/lib/session.test.ts
```

### References

- [OWASP Session Management Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Session_Management_Cheat_Sheet.html)
- [CWE-614: Sensitive Cookie in HTTPS Session Without 'Secure' Attribute](https://cwe.mitre.org/data/definitions/614.html)
- [MDN: Set-Cookie Secure](https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Set-Cookie#secure)
- [Next.js Cookies API](https://nextjs.org/docs/app/api-reference/functions/cookies)

---

*Last updated: 2026-03-18*
