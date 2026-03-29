# Dashboard Authentication Quick Reference

## Built-in Email/Password (Recommended)

```typescript
import express from 'express';
import { Pool } from 'pg';
import { createDashboard } from 'worker-que/dist/dashboard';

const app = express();
const pool = new Pool({ /* config */ });

app.use('/admin/queue', createDashboard(pool, {
  title: 'My Queue Dashboard',
  auth: {
    email: process.env.DASHBOARD_EMAIL!,
    password: process.env.DASHBOARD_PASSWORD!
  }
}));

app.listen(3000);
```

### Environment Variables (.env)

```bash
DASHBOARD_EMAIL=admin@example.com
DASHBOARD_PASSWORD=SecurePassword123!
```

### Features
✅ Secure login page with Microsoft Fluent Design  
✅ Session management (24 hours default)  
✅ "Remember me" extends to 30 days  
✅ User email shown in header  
✅ Sign out button  
✅ Auto-redirect to login when not authenticated  

---

## Custom Authentication

For integration with existing auth systems:

```typescript
app.use('/admin/queue', createDashboard(pool, {
  customAuth: async (req, res, next) => {
    // Return true to allow access, false to deny
    return req.session?.user?.isAdmin === true;
  }
}));
```

### Examples

**API Key:**
```typescript
customAuth: (req) => req.headers['x-api-key'] === process.env.API_KEY
```

**JWT:**
```typescript
customAuth: (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  return jwt.verify(token, process.env.JWT_SECRET).role === 'admin';
}
```

**Passport.js:**
```typescript
customAuth: (req) => req.isAuthenticated() && req.user?.role === 'admin'
```

---

## Security Checklist

### Production Setup
- [ ] Store credentials in environment variables
- [ ] Use HTTPS (not HTTP)
- [ ] Use strong passwords (12+ characters)
- [ ] Set NODE_ENV=production for secure cookies
- [ ] Enable rate limiting on login endpoint
- [ ] Monitor login attempts
- [ ] Regular security audits

### Strong Password Requirements
- Minimum 12 characters
- Mix of uppercase and lowercase
- Include numbers
- Include special characters
- Not dictionary words
- Unique per environment

### Example Strong Password Generation
```bash
# Linux/Mac
openssl rand -base64 32

# Node.js
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

---

## Login Page Preview

When you visit the dashboard without authentication:

1. **Login Screen** appears with:
   - Logo and title
   - Email input
   - Password input
   - "Keep me signed in" checkbox
   - Sign in button
   - Error messages (if login fails)

2. **After Login**:
   - Redirected to dashboard
   - User email displayed in header
   - Session stored securely in cookie
   - Sign out option available

3. **Session Expiry**:
   - Default: 24 hours
   - With "Remember me": 30 days
   - Automatic cleanup on logout

---

## Troubleshooting

### "Cannot GET /admin/queue/login"
✅ Ensure `express-session` is installed: `npm install express-session`

### Login doesn't redirect
✅ Check that email and password match exactly  
✅ Verify basePath matches mount path  

### Session not persisting
✅ Ensure cookies are enabled in browser  
✅ Check if using HTTPS in production  
✅ Verify SESSION_SECRET is set  

### "Access denied" on API calls
✅ Login first via the web interface  
✅ Or use customAuth for API access  

---

## Advanced Configuration

### Custom Session Store (for production)

```typescript
import session from 'express-session';
import RedisStore from 'connect-redis';
import { createClient } from 'redis';

const redisClient = createClient();
await redisClient.connect();

app.use(session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET!,
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000
  }
}));
```

### Rate Limiting Login

```typescript
import rateLimit from 'express-rate-limit';

const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 attempts
  message: 'Too many login attempts, please try again later'
});

app.use('/admin/queue/login', loginLimiter);
```

---

## URLs

### Default Routes
- Dashboard: `http://localhost:3000/admin/queue`
- Login: `http://localhost:3000/admin/queue/login` (auto-redirect)
- Logout: `POST http://localhost:3000/admin/queue/logout`
- API Stats: `http://localhost:3000/admin/queue/api/stats`
- API Jobs: `http://localhost:3000/admin/queue/api/jobs`

### Custom basePath
```typescript
app.use('/my-queue', createDashboard(pool, {
  basePath: '/my-queue', // Must match!
  auth: { email: '...', password: '...' }
}));
```

Access at: `http://localhost:3000/my-queue`

---

**For complete documentation, see [DASHBOARD.md](./DASHBOARD.md)**
