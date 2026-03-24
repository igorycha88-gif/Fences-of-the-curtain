# Fix for 401 Unauthorized Error on Panel3D Creation

## Problem
POST request to `/api/admin/panel3d` was returning `401 Unauthorized` when trying to create a new 3D panel in the admin panel.

## Root Causes

### 1. Missing `credentials: 'include'` in Fetch Requests
NextAuth.js uses cookies for JWT session management by default. However, the browser's `fetch()` API does not send cookies by default for cross-origin or even same-origin requests unless explicitly specified.

**Before:**
```typescript
const res = await fetch('/api/admin/panel3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(formValues),
});
```

**After:**
```typescript
const res = await fetch('/api/admin/panel3d', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify(formValues),
});
```

### 2. Incomplete Session Validation
The API routes were using `getServerSession()` without passing `authOptions`, which meant custom callbacks and session configuration weren't being applied correctly.

**Before:**
```typescript
const session = await getServerSession();
```

**After:**
```typescript
const session = await getServerSession(authOptions);
```

### 3. Missing Role-Based Authorization
The API routes didn't check if users had the appropriate role (ADMIN or MANAGER) to perform admin operations.

## Solution

### Files Modified

1. **`src/app/(admin)/admin/references/panel3d/page.tsx`**
   - Added `credentials: 'include'` to all fetch requests
   - Requests updated: GET, POST, PUT, DELETE, PATCH

2. **`src/app/api/admin/panel3d/route.ts`**
   - Imported `authOptions` from '@/lib/auth'
   - Updated `getServerSession()` to `getServerSession(authOptions)`
   - Added role-based authorization (ADMIN or MANAGER only)

3. **`src/app/api/admin/panel3d/[id]/route.ts`**
   - Imported `authOptions` from '@/lib/auth'
   - Updated all API methods to use `getServerSession(authOptions)`
   - Added role-based authorization to all endpoints (GET, PUT, DELETE, PATCH)

4. **`src/lib/api-client.ts`** (NEW)
   - Created reusable API client utility
   - Automatically includes `credentials: 'include'`
   - Provides typed methods for common HTTP operations
   - Includes toast notifications support

## Best Practices Implemented

### 1. Credential Management
- Always use `credentials: 'include'` when making authenticated requests
- This ensures cookies are sent with requests for session-based auth

### 2. Role-Based Authorization
- Check user roles before allowing admin operations
- Return appropriate HTTP status codes:
  - 401 Unauthorized: No session
  - 403 Forbidden: Session exists but insufficient permissions

### 3. Consistent Error Handling
- Use NextResponse with proper status codes
- Provide meaningful error messages to clients
- Log errors server-side for debugging

### 4. Type Safety
- Created TypeScript types for API responses
- Use typed fetch wrapper to prevent runtime errors

## Testing

To test the fix:

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Login to admin panel at `http://localhost:3001/admin/login`

3. Navigate to `/admin/references/panel3d`

4. Try creating a new 3D panel - should work without 401 error

5. Test editing, deleting, and toggling active status - all should work

## Additional Recommendations

### 1. Centralize API Calls
Consider using the new `apiClient` utility throughout the admin panel to avoid code duplication:

```typescript
import { adminApiClient } from '@/lib/api-client';

const response = await adminApiClient.post('/panel3d', {
  body: formData,
  showToast: true,
  successMessage: '3D-панель создана',
  errorMessage: 'Ошибка создания',
});
```

### 2. Port Configuration
Ensure `NEXTAUTH_URL` in `.env` matches the actual server port:
- `.env` currently has: `NEXTAUTH_URL="http://localhost:3001"`
- Package.json dev script: `"dev": "next dev -p 3001"`
- These are correctly aligned

### 3. Session Management
For production, consider:
- Implementing session timeout warnings
- Adding refresh token mechanism if using JWT
- Implementing rate limiting for sensitive operations

## Security Considerations

1. **Never trust client-side role checks**: Always validate on the server
2. **Use HTTPS in production**: Cookies are not sent over HTTP in secure contexts
3. **Implement CSRF protection**: Consider adding CSRF tokens for state-changing operations
4. **Audit logging**: The API already creates audit logs for admin operations

## Related Files

- `/src/lib/auth.ts` - NextAuth configuration
- `/src/lib/api-client.ts` - New API client utility
- `/src/app/(admin)/admin/references/panel3d/page.tsx` - Admin UI
- `/src/app/api/admin/panel3d/route.ts` - API routes
- `/src/app/api/admin/panel3d/[id]/route.ts` - API routes for specific items
