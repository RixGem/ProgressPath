# Embed Token API - Quick Start Guide

Get your ProgressPath dashboard embedded in Notion in 5 minutes!

## 🚀 Quick Setup

### 1. Configure Environment Variables

Add to your `.env.local`:

```env
JWT_EMBED_SECRET=generate_with_openssl_rand_base64_32
```

Generate a secure secret:
```bash
openssl rand -base64 32
```

### 2. Test the API

**Option A: Using cURL**
```bash
# Get your Supabase token first (from browser console or auth flow)
curl -X POST http://localhost:3000/api/auth/generate-embed-token \
  -H "Authorization: Bearer YOUR_SUPABASE_AUTH_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"duration": "7d"}'
```

**Option B: Using JavaScript**
```javascript
const { data: { session } } = await supabase.auth.getSession();

const response = await fetch('/api/auth/generate-embed-token', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${session.access_token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({ duration: '30d' })
});

const { embedUrl } = await response.json();
console.log('Your embed URL:', embedUrl);
```

### 3. Add to Notion

1. Copy the `embedUrl` from the API response
2. In Notion, type `/embed`
3. Paste your embed URL
4. Press Enter

Done! 🎉

## 📋 API Quick Reference

### Endpoint
```
POST /api/auth/generate-embed-token
GET  /api/auth/generate-embed-token?duration=7d
```

### Headers
```
Authorization: Bearer <supabase_token>
Content-Type: application/json
```

### Request Body (POST only)
```json
{
  "duration": "7d"  // Options: 30s, 60m, 12h, 7d, 30d
}
```

### Response
```json
{
  "success": true,
  "token": "eyJhbGci...",
  "embedUrl": "https://your-app.com/embed?token=...",
  "expiresAt": "2025-01-02T16:08:53.000Z",
  "user": { ... },
  "permissions": ["read"],
  "type": "embed"
}
```

## 🔒 Security Notes

- ✅ Tokens are **read-only** by default
- ✅ Tokens expire automatically (default: 7 days)
- ✅ Use HTTPS in production
- ❌ Never commit tokens to git
- ❌ Don't share tokens publicly

## 🛠️ Common Issues

### "Missing or invalid authorization header"
- Make sure you're logged in to Supabase
- Include `Bearer ` prefix in Authorization header
- Check if your session hasn't expired

### "User not found"
- Verify the user exists in your database
- Check the `userId` parameter if provided

### Token expired in Notion
- Regenerate a new token with longer duration
- Update the embed in Notion with the new URL

## 📚 Full Documentation

For complete documentation, see [EMBED_TOKEN_API_GUIDE.md](./EMBED_TOKEN_API_GUIDE.md)

## 💡 Pro Tips

1. **Set appropriate expiration times:**
   - Testing: `1d`
   - Personal use: `7d` - `30d`
   - Team sharing: `30d` - `90d`

2. **Store your embed URL securely** if you need to reuse it

3. **Create multiple tokens** for different purposes (personal, team, public)

4. **Regenerate tokens regularly** for better security

## 🎯 Next Steps

- [ ] Generate your first embed token
- [ ] Add to Notion and test
- [ ] Share with your team
- [ ] Set up token rotation (optional)
- [ ] Explore advanced features in full documentation

## 🆘 Need Help?

- Check [EMBED_TOKEN_API_GUIDE.md](./EMBED_TOKEN_API_GUIDE.md) for detailed docs
- Review server logs for error details
- Open a GitHub issue if you need assistance

---

**Made with ❤️ for seamless Notion integration**
