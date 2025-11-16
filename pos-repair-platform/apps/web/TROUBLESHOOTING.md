# Troubleshooting Guide

## Common Issues and Solutions

### 1. "Failed to fetch" or "Unable to connect to the server" Error

**Problem:** The frontend cannot connect to the backend API.

**Solution:**
1. **Start the Backend Server:**
   ```powershell
   cd pos-repair-platform/apps/api
   npm run start:dev
   ```
   
2. **Verify Backend is Running:**
   - Check if the backend is running on `http://localhost:3000`
   - You should see output like: `Nest application successfully started`
   - Test the API endpoint: `http://localhost:3000/auth/login` (should return an error, not a connection error)

3. **Check Environment Variables:**
   - Ensure `.env.local` exists in `apps/web` directory
   - Verify `NEXT_PUBLIC_API_URL=http://localhost:3000`
   - Restart the frontend server after changing environment variables

4. **Check CORS Configuration:**
   - Backend CORS should allow requests from `http://localhost:3001`
   - Check `apps/api/src/main.ts` for CORS configuration

5. **Check Firewall/Antivirus:**
   - Ensure firewall/antivirus is not blocking connections to localhost:3000
   - Try disabling temporarily to test

### 2. 401 Unauthorized Error

**Problem:** Authentication token is invalid or missing.

**Solution:**
1. **Clear localStorage:**
   - Open browser developer tools
   - Go to Application > Local Storage
   - Clear `auth_token` and `auth_user`
   - Try logging in again

2. **Check Token:**
   - Verify JWT token is stored in localStorage
   - Check if token is included in Authorization header
   - Re-login to get a new token

3. **Verify Backend JWT Configuration:**
   - Check `JWT_SECRET` is set in backend `.env` file
   - Ensure JWT token expiration is not too short

### 3. 403 Forbidden Error

**Problem:** User doesn't have permission for the requested action.

**Solution:**
1. **Check User Role:**
   - Verify user's role in the database
   - Ensure user has the required permissions
   - Check if user is assigned to the correct store

2. **Verify Store Access:**
   - Ensure user has access to the store they're trying to access
   - Check store assignments in the database

### 4. CORS Errors

**Problem:** Browser blocks requests due to CORS policy.

**Solution:**
1. **Check Backend CORS Configuration:**
   ```typescript
   // In apps/api/src/main.ts
   app.enableCors({
     origin: 'http://localhost:3001',
     credentials: true,
     methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
     allowedHeaders: ['Content-Type', 'Authorization'],
   });
   ```

2. **Verify Frontend URL:**
   - Ensure frontend is running on `http://localhost:3001`
   - Check if backend CORS allows this origin

3. **Restart Backend:**
   - After changing CORS configuration, restart the backend server

### 5. Database Connection Errors

**Problem:** Backend cannot connect to PostgreSQL database.

**Solution:**
1. **Check PostgreSQL is Running:**
   - Verify PostgreSQL service is running
   - Check if database exists
   - Verify connection credentials

2. **Check Database URL:**
   - Verify `DATABASE_URL` in `apps/api/.env`
   - Ensure URL is properly formatted
   - Check for special characters in password (URL encode if needed)

3. **Run Migrations:**
   ```powershell
   cd pos-repair-platform/apps/api
   npx prisma migrate dev
   ```

### 6. Environment Variables Not Loading

**Problem:** Environment variables are not being loaded in Next.js.

**Solution:**
1. **Check File Location:**
   - Ensure `.env.local` is in `apps/web` directory
   - Verify file name is exactly `.env.local` (not `.env.local.txt`)

2. **Restart Development Server:**
   - Environment variables are only loaded on server start
   - Restart the Next.js development server

3. **Check Variable Names:**
   - Next.js public variables must start with `NEXT_PUBLIC_`
   - Example: `NEXT_PUBLIC_API_URL` (not `API_URL`)

### 7. Port Already in Use

**Problem:** Port 3000 or 3001 is already in use.

**Solution:**
1. **Find Process Using Port:**
   ```powershell
   # For port 3000 (backend)
   netstat -ano | findstr :3000
   
   # For port 3001 (frontend)
   netstat -ano | findstr :3001
   ```

2. **Kill Process:**
   ```powershell
   taskkill /PID <process_id> /F
   ```

3. **Change Port:**
   - Backend: Set `PORT` in `apps/api/.env`
   - Frontend: Update `package.json` scripts or use `-p` flag

### 8. TypeScript Errors

**Problem:** TypeScript compilation errors.

**Solution:**
1. **Install Dependencies:**
   ```powershell
   cd pos-repair-platform/apps/web
   npm install
   ```

2. **Check Type Definitions:**
   - Ensure all types are properly imported
   - Check for missing type definitions

3. **Restart TypeScript Server:**
   - In VS Code: `Ctrl+Shift+P` > "TypeScript: Restart TS Server"

### 9. Module Not Found Errors

**Problem:** Cannot find module or import errors.

**Solution:**
1. **Install Dependencies:**
   ```powershell
   npm install
   ```

2. **Check Import Paths:**
   - Verify import paths are correct
   - Check if files exist at the specified paths
   - Ensure file extensions are correct

3. **Clear Cache:**
   ```powershell
   # Clear Next.js cache
   rm -rf .next
   npm run dev
   ```

### 10. Login Not Working

**Problem:** Login fails even with correct credentials.

**Solution:**
1. **Verify User Exists:**
   - Check if user is registered in the database
   - Verify email and password are correct
   - Check if user has an organization membership

2. **Check Password Hashing:**
   - Ensure passwords are properly hashed in the database
   - Verify bcrypt is working correctly

3. **Check Backend Logs:**
   - Look at backend console for error messages
   - Check for authentication errors
   - Verify JWT token generation

## Quick Diagnostic Checklist

- [ ] Backend server is running on `http://localhost:3000`
- [ ] Frontend server is running on `http://localhost:3001`
- [ ] PostgreSQL database is running and accessible
- [ ] Database migrations have been run
- [ ] Environment variables are set correctly
- [ ] CORS is configured in backend
- [ ] JWT_SECRET is set in backend `.env`
- [ ] User exists in database with correct credentials
- [ ] User has organization membership
- [ ] User has store assignments (if required)
- [ ] Browser console shows no CORS errors
- [ ] Network tab shows API requests going to correct URL
- [ ] Authorization header includes JWT token

## Getting Help

If you're still experiencing issues:

1. **Check Backend Logs:**
   - Look at the backend console for error messages
   - Check for database connection errors
   - Verify API endpoints are responding

2. **Check Frontend Console:**
   - Open browser developer tools
   - Check Console tab for errors
   - Check Network tab for failed requests

3. **Verify Setup:**
   - Follow the setup guide in `QUICK_START.md`
   - Ensure all dependencies are installed
   - Verify database is set up correctly

4. **Test API Directly:**
   - Use Postman or curl to test API endpoints
   - Verify backend is responding correctly
   - Check authentication is working

## Common Commands

```powershell
# Start Backend
cd pos-repair-platform/apps/api
npm run start:dev

# Start Frontend
cd pos-repair-platform/apps/web
npm run dev

# Run Database Migrations
cd pos-repair-platform/apps/api
npx prisma migrate dev

# Generate Prisma Client
cd pos-repair-platform/apps/api
npx prisma generate

# Check if ports are in use
netstat -ano | findstr :3000
netstat -ano | findstr :3001

# Kill process on port
taskkill /PID <process_id> /F
```

