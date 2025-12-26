# Embed Token Generation API Guide

This guide explains how to use the JWT embed token generation API for integrating ProgressPath into external applications like Notion.

## Overview

The embed token API generates secure JWT tokens that allow read-only access to user dashboards. These tokens can be embedded in external applications to display ProgressPath data without requiring users to log in separately.

## API Endpoint

**URL:** `/api/auth/generate-embed-token`

**Methods:** `POST`, `GET`

## Prerequisites

1. **Environment Variables**: Add the following to your `.env.local` file:
   ```env
   JWT_EMBED_SECRET=your_secure_jwt_secret_here
   ```
   
   If `JWT_EMBED_SECRET` is not set, the API will fall back to using `SUPABASE_SERVICE_ROLE_KEY`.

2. **Supabase Authentication**: Users must be authenticated with Supabase to generate embed tokens.

## Usage

### Method 1: POST Request

**Endpoint:** `POST /api/auth/generate-embed-token`

**Headers:**
```
Authorization: Bearer <supabase_auth_token>
Content-Type: application/json
```

**Request Body:**
```json
{
  "userId": "optional-user-id",
  "duration": "7d"
}
```

**Parameters:**
- `userId` (optional): User ID to generate token for. If not provided, uses the authenticated user's ID.
- `duration` (optional): Token expiration duration. Default: `7d`
  - Supported formats: `30s`, `60m`, `12h`, `7d`, `30d`

**Response:**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "embedUrl": "http://localhost:3000/embed?token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "expiresAt": "2025-01-02T16:08:53.000Z",
  "user": {
    "id": "user-id",
    "email": "user@example.com",
    "fullName": "John Doe"
  },
  "permissions": ["read"],
  "type": "embed"
}
```

### Method 2: GET Request

**Endpoint:** `GET /api/auth/generate-embed-token?duration=7d`

**Headers:**
```
Authorization: Bearer <supabase_auth_token>
```

**Query Parameters:**
- `duration` (optional): Token expiration duration. Default: `7d`

**Response:** Same as POST method

## Example Usage

### JavaScript/TypeScript

```javascript
// Using fetch API
async function generateEmbedToken() {
  const supabaseToken = 'your-supabase-auth-token';
  
  const response = await fetch('/api/auth/generate-embed-token', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${supabaseToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      duration: '30d'
    }),
  });
  
  const data = await response.json();
  
  if (data.success) {
    console.log('Embed URL:', data.embedUrl);
    return data.embedUrl;
  } else {
    console.error('Error:', data.error);
  }
}
```

### cURL

```bash
# POST request
curl -X POST https://your-app.vercel.app/api/auth/generate-embed-token \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "7d"}'

# GET request
curl -X GET "https://your-app.vercel.app/api/auth/generate-embed-token?duration=30d" \
  -H "Authorization: Bearer YOUR_SUPABASE_TOKEN"
```

### React Component Example

```jsx
import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

function EmbedTokenGenerator() {
  const [embedUrl, setEmbedUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const generateToken = async () => {
    setLoading(true);
    setError(null);

    try {
      // Get current session
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        throw new Error('Not authenticated');
      }

      // Generate embed token
      const response = await fetch('/api/auth/generate-embed-token', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          duration: '30d'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setEmbedUrl(data.embedUrl);
      } else {
        throw new Error(data.error);
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <button onClick={generateToken} disabled={loading}>
        {loading ? 'Generating...' : 'Generate Embed Token'}
      </button>
      
      {error && <p className="error">{error}</p>}
      
      {embedUrl && (
        <div>
          <p>Embed URL:</p>
          <input type="text" value={embedUrl} readOnly />
        </div>
      )}
    </div>
  );
}
```

## Notion Integration

### Step 1: Generate Embed Token

Use the API to generate an embed token as shown in the examples above.

### Step 2: Add to Notion

1. In your Notion page, type `/embed`
2. Select "Embed" from the menu
3. Paste your embed URL (the `embedUrl` from the API response)
4. Click "Embed link"

### Step 3: Customize Display

The embed will display as an iframe in your Notion page. You can resize it by dragging the corners.

## Token Information

### JWT Payload

The generated JWT token contains the following claims:

```json
{
  "userId": "user-id",
  "email": "user@example.com",
  "fullName": "John Doe",
  "permissions": ["read"],
  "type": "embed",
  "createdAt": "2025-12-26T16:08:53.000Z",
  "sub": "user-id",
  "iat": 1735232933,
  "exp": 1735837733
}
```

### Permissions

Embed tokens have **read-only** permissions by default. This means:
- ✅ Can view dashboard data
- ✅ Can view progress statistics
- ✅ Can view learning materials
- ❌ Cannot create or modify data
- ❌ Cannot delete data
- ❌ Cannot access admin features

## Security Best Practices

1. **Keep Tokens Secret**: Never commit tokens to version control or share them publicly.

2. **Use HTTPS**: Always use HTTPS in production to prevent token interception.

3. **Set Appropriate Expiration**: Use shorter durations for sensitive data:
   - Short-term embeds: `1d` - `7d`
   - Long-term embeds: `30d` - `90d`
   - Never use durations longer than necessary

4. **Rotate Tokens**: Regenerate tokens periodically, especially if:
   - User roles or permissions change
   - Token may have been compromised
   - For compliance requirements

5. **Validate Origin**: Consider implementing origin validation in your embed endpoint to prevent unauthorized embedding.

## Error Handling

### Common Error Responses

#### 401 Unauthorized
```json
{
  "error": "Missing or invalid authorization header"
}
```
**Solution**: Ensure you're sending a valid Supabase auth token in the Authorization header.

#### 404 Not Found
```json
{
  "error": "User not found"
}
```
**Solution**: The user ID doesn't exist in the database. Verify the userId parameter.

#### 500 Internal Server Error
```json
{
  "error": "Failed to generate embed token",
  "details": "Error message"
}
```
**Solution**: Check server logs for detailed error information. Common causes:
- Missing environment variables
- Database connection issues
- Invalid JWT secret

## Testing

### Test the API

1. **Get your Supabase token**:
   ```javascript
   const { data } = await supabase.auth.getSession();
   console.log(data.session.access_token);
   ```

2. **Make a test request**:
   ```bash
   curl -X POST http://localhost:3000/api/auth/generate-embed-token \
     -H "Authorization: Bearer YOUR_TOKEN" \
     -H "Content-Type: application/json" \
     -d '{"duration": "1d"}'
   ```

3. **Verify the response**: You should receive a JSON response with the embed token and URL.

### Verify Token Expiration

```javascript
import { jwtVerify } from 'jose';

async function verifyToken(token) {
  const secret = new TextEncoder().encode(process.env.JWT_EMBED_SECRET);
  
  try {
    const { payload } = await jwtVerify(token, secret);
    console.log('Token is valid:', payload);
    console.log('Expires at:', new Date(payload.exp * 1000));
    return true;
  } catch (error) {
    console.error('Token verification failed:', error);
    return false;
  }
}
```

## Migration Notes

If you're migrating from an existing embed system:

1. **Update Environment Variables**: Add `JWT_EMBED_SECRET` to your environment configuration.

2. **Update Client Code**: Replace old embed token generation with the new API endpoint.

3. **Regenerate Tokens**: Old tokens will become invalid. Generate new tokens using this API.

4. **Update Documentation**: Inform users about the new embed URL format.

## Support

For issues or questions:
- Check the [TROUBLESHOOTING.md](./TROUBLESHOOTING.md) file
- Review server logs for detailed error messages
- Open an issue on GitHub with relevant error details

## Future Enhancements

Planned improvements:
- [ ] Token revocation endpoint
- [ ] Webhook support for token expiration notifications
- [ ] Admin dashboard for token management
- [ ] Custom permission levels beyond read-only
- [ ] Rate limiting and usage analytics
- [ ] Multiple embed URLs per user
