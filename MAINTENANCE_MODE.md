# Maintenance Mode Feature

## 🚧 Overview

The Maintenance Mode feature allows you to temporarily disable public access to your website while keeping it accessible to administrators. This is useful during deployments, updates, or when performing maintenance.

---

## ⚙️ Setup

### **Environment Variables (Vercel)**

Add these to your Vercel project settings:

1. **MAINTENANCE_MODE**
   - Type: `true` or `false`
   - Default: `false` (site works normally)
   - When `true`: Public users see maintenance page

2. **MAINTENANCE_SECRET**
   - Type: String (any random secret key)
   - Example: `mySecretKey123!@#`
   - Used for admin bypass authentication

### **How to Set in Vercel**

1. Go to your Vercel project dashboard
2. Navigate to **Settings** → **Environment Variables**
3. Add:
   - **Key**: `MAINTENANCE_MODE`, **Value**: `true` or `false`
   - **Key**: `MAINTENANCE_SECRET`, **Value**: `your-random-secret-key`
4. Redeploy your application

---

## 🔄 How It Works

### **When Maintenance Mode is OFF** (`MAINTENANCE_MODE=false`)
- ✅ Site works normally for everyone
- ✅ No redirects or restrictions
- ✅ All routes accessible

### **When Maintenance Mode is ON** (`MAINTENANCE_MODE=true`)

#### **Public Users**
- ❌ All routes redirect to `/maintenance`
- ✅ Can see maintenance page
- ✅ Can refresh the page

#### **Admin Bypass**
- ✅ Visit: `https://yourdomain.com/admin-bypass?key=YOUR_SECRET`
- ✅ Sets `maintenance_bypass=true` cookie (HTTP-only, 7 days)
- ✅ Cookie allows full site access
- ✅ No redirects while cookie is valid

#### **Always Accessible Routes** (Even During Maintenance)
- `/maintenance` - Maintenance page itself
- `/admin-bypass` - Admin bypass route
- `/_next/*` - Next.js internal files
- `/api/auth/login` - Admin login
- `/api/auth/logout` - Admin logout
- `/api/auth/me` - Auth check
- `/api/maintenance/bypass` - Bypass API

---

## 📋 Usage Guide

### **Turn Maintenance Mode ON**

1. In Vercel dashboard:
   - Set `MAINTENANCE_MODE=true`
   - Ensure `MAINTENANCE_SECRET` is set
2. Redeploy or wait for automatic deployment
3. Public users will now see maintenance page

### **Bypass as Admin**

1. Open your browser
2. Visit: `https://yourdomain.com/admin-bypass?key=YOUR_SECRET`
   - Replace `YOUR_SECRET` with your `MAINTENANCE_SECRET` value
3. You'll see "Maintenance bypass activated!"
4. Cookie is set automatically
5. You can now browse the site normally

### **Turn Maintenance Mode OFF**

1. In Vercel dashboard:
   - Set `MAINTENANCE_MODE=false`
2. Redeploy or wait for automatic deployment
3. Everyone gets full access again

---

## 🔒 Security Features

### **Cookie Security**
- **HTTP-only**: Prevents JavaScript access (XSS protection)
- **Secure**: Only sent over HTTPS in production
- **SameSite**: `lax` (CSRF protection)
- **Expiry**: 7 days
- **Path**: `/` (site-wide)

### **Key Validation**
- Secret key is compared server-side
- Invalid keys return 401 error
- No information leakage about valid keys

### **No Redirect Loops**
- Maintenance page is always accessible
- Admin bypass route is always accessible
- Next.js internal routes are excluded
- API routes for auth are excluded

---

## 📁 Files Created

1. **`middleware.ts`** (root)
   - Intercepts all requests
   - Checks maintenance mode
   - Redirects public users
   - Allows bypass cookie holders

2. **`app/maintenance/page.tsx`**
   - Maintenance page UI
   - Professional design
   - Institution branding
   - Refresh button

3. **`app/admin-bypass/page.tsx`**
   - Admin bypass interface
   - Key verification
   - Success/error states
   - Auto-redirect on success

4. **`app/api/maintenance/bypass/route.ts`**
   - API endpoint for bypass verification
   - Sets bypass cookie
   - Validates secret key
   - Returns success/error response

---

## 🧪 Testing

### **Test Maintenance Mode ON**

1. Set `MAINTENANCE_MODE=true` in Vercel
2. Visit your site → Should redirect to `/maintenance`
3. Visit `/admin-bypass?key=WRONG_KEY` → Should show error
4. Visit `/admin-bypass?key=CORRECT_KEY` → Should set cookie and redirect
5. Visit your site again → Should work normally (cookie active)

### **Test Maintenance Mode OFF**

1. Set `MAINTENANCE_MODE=false` in Vercel
2. Visit your site → Should work normally
3. No redirects should occur

---

## 🐛 Troubleshooting

### **Issue: Redirect Loop**
- **Solution**: Ensure `/maintenance` and `/admin-bypass` are in allowed paths
- Check middleware.ts `allowedPaths` array

### **Issue: Bypass Not Working**
- **Solution**: 
  - Verify `MAINTENANCE_SECRET` is set correctly
  - Check cookie is being set (browser DevTools → Application → Cookies)
  - Ensure you're using HTTPS in production

### **Issue: Admin Can't Access**
- **Solution**:
  - Clear browser cookies
  - Visit `/admin-bypass?key=YOUR_SECRET` again
  - Verify secret key matches exactly

### **Issue: API Routes Blocked**
- **Solution**: Add API route to `allowedPaths` in middleware.ts if needed

---

## 📝 Notes

- Maintenance mode works at the middleware level (before pages render)
- Cookie persists for 7 days (can be adjusted in code)
- Secret key should be strong and unique
- Test in staging before using in production
- Remember to turn OFF maintenance mode after deployment

---

## 🔄 Quick Reference

| Action | MAINTENANCE_MODE | Result |
|--------|------------------|--------|
| Normal operation | `false` | Everyone can access |
| Enable maintenance | `true` | Public redirected, admin can bypass |
| Admin bypass URL | `true` + secret | `/admin-bypass?key=SECRET` |
| Disable maintenance | `false` | Everyone can access again |
