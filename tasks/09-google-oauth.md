# Task 09: Set up Google OAuth for Staff Authentication

**Status:** ⏳ PENDING  
**Priority:** Medium  
**Dependencies:** Task 02 (TypeScript Models)

## Description

Implement Google OAuth authentication for staff members with allowlisted email addresses, as specified in SPEC.md authentication strategy.

## Requirements from SPEC.md

- Google OAuth integration for staff/admin access
- Allowlisted Google accounts for authorized staff
- Three access levels: staff, admin, manager
- No individual customer accounts (they use shared tablet access)

## Authentication Strategy

**Staff/Admin Access:**

- Google OAuth integration
- Allowlisted Google accounts for authorized staff
- Access admin functions from personal devices or staff terminals

## Technical Implementation

### Environment Variables Needed

```
GOOGLE_CLIENT_ID=your_google_client_id
GOOGLE_CLIENT_SECRET=your_google_client_secret
GOOGLE_REDIRECT_URI=https://your-app.workers.dev/auth/callback
```

### Routes to Add

```
GET  /auth/google         # Initiate Google OAuth
GET  /auth/callback       # OAuth callback
POST /auth/logout         # Staff logout
GET  /admin               # Admin dashboard (protected)
```

### OAuth Flow

```typescript
// 1. Generate OAuth URL
const authUrl =
  `https://accounts.google.com/o/oauth2/v2/auth?` +
  `client_id=${GOOGLE_CLIENT_ID}&` +
  `redirect_uri=${GOOGLE_REDIRECT_URI}&` +
  `response_type=code&` +
  `scope=openid email profile&` +
  `state=${generateState()}`;

// 2. Handle callback
const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    client_id: GOOGLE_CLIENT_ID,
    client_secret: GOOGLE_CLIENT_SECRET,
    code: authCode,
    grant_type: 'authorization_code',
    redirect_uri: GOOGLE_REDIRECT_URI,
  }),
});

// 3. Get user info and check allowlist
const userInfo = await fetch('https://www.googleapis.com/oauth2/v2/userinfo', {
  headers: { Authorization: `Bearer ${accessToken}` },
});

// 4. Check against allowlisted emails
const allowlistedEmails = [
  'staff@poolturtle.com',
  'manager@poolturtle.com',
  'admin@poolturtle.com',
];
```

### Session Management

```typescript
// Store session in secure cookie or KV
interface StaffSession {
  userId: string;
  email: string;
  name: string;
  role: 'staff' | 'admin' | 'manager';
  expiresAt: string;
}

// Middleware for protected routes
async function requireAuth(c: Context, next: Next) {
  const session = await getSession(c);
  if (!session || session.expiresAt < new Date().toISOString()) {
    return c.redirect('/auth/google');
  }
  c.set('user', session);
  await next();
}
```

## Database Integration

```sql
-- Update staff_users table on successful login
UPDATE staff_users
SET last_login = CURRENT_TIMESTAMP,
    name = $1,
    updated_at = CURRENT_TIMESTAMP
WHERE google_id = $2 AND is_active = true

-- Or create new staff user if not exists
INSERT INTO staff_users (id, google_id, email, name, role, is_active)
VALUES ($1, $2, $3, $4, 'staff', true)
ON CONFLICT (google_id) DO UPDATE SET
  last_login = CURRENT_TIMESTAMP,
  name = EXCLUDED.name
```

## Allowlist Management

Store allowlisted emails in:

1. **Environment variables** (simple)
2. **Cloudflare KV** (dynamic updates)
3. **Database table** (admin can manage)

```typescript
// KV-based allowlist (recommended)
const allowlistedEmails =
  (await env.ALLOWLIST_KV.get('staff_emails', 'json')) || [];

// Check if user is allowed
if (!allowlistedEmails.includes(userInfo.email)) {
  return c.html('Access denied. Contact administrator.', 403);
}
```

## Files to Create/Modify

- `src/index.ts` - Add auth routes
- `src/lib/auth.ts` - OAuth implementation
- `src/middleware/auth.ts` - Authentication middleware
- `src/views/admin/` - Admin interface templates
- `.env.example` - Add Google OAuth variables

## UI/UX Requirements

- Simple "Sign in with Google" button
- Clear error messages for non-allowlisted users
- Redirect to intended page after login
- Secure logout functionality

## Security Considerations

- Validate state parameter to prevent CSRF
- Secure session storage (HttpOnly cookies)
- Regular session expiration (2 hours per SPEC.md)
- Rate limiting on auth endpoints

## Acceptance Criteria

- [ ] Google OAuth flow works correctly
- [ ] Only allowlisted emails can access admin
- [ ] Session management with automatic expiration
- [ ] Role-based access control (staff/admin/manager)
- [ ] Secure logout functionality
- [ ] Error handling for authentication failures
- [ ] Integration with staff_users database table

## Admin Features Unlocked

This enables:

- Task 10: Admin CRUD for games and copies
- Analytics dashboard access
- Staff management interface
- System configuration access

## Environment Setup Required

1. Create Google OAuth app in Google Console
2. Configure redirect URIs
3. Add client ID/secret to environment
4. Set up allowlisted email addresses
