# Quick Start Guide - Testing the Application

## 🚀 Servers Status

The development servers have been started in the background:
- **Backend API**: Starting on `http://localhost:3000`
- **Frontend Web**: Starting on `http://localhost:3001`

## ⚠️ Prerequisites

Before testing, you need to set up:

### 1. Database Setup

The application requires PostgreSQL. You have two options:

#### Option A: Use Docker Compose (Recommended)

```powershell
cd pos-repair-platform
docker-compose up -d postgres redis
```

This will start:
- PostgreSQL on port `5433` (mapped from container port 5432)
- Redis on port `6380` (mapped from container port 6379)

#### Option B: Use Local PostgreSQL

If you have PostgreSQL installed locally, create a database and update the `.env` file.

### 2. Environment Variables

Create `.env` file in `apps/api/` directory:

```env
DATABASE_URL=postgresql://postgres:password@localhost:5433/pos_repair_platform
JWT_SECRET=your-secret-key-change-in-production
PORT=3000
NODE_ENV=development
```

Create `.env.local` file in `apps/web/` directory:

```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 3. Run Database Migrations

```powershell
cd pos-repair-platform/apps/api
npx prisma migrate dev
npx prisma generate
```

## 📋 Testing Steps

1. **Start Database** (if using Docker):
   ```powershell
   cd pos-repair-platform
   docker-compose up -d postgres redis
   ```

2. **Verify Servers are Running**:
   - Backend: http://localhost:3000
   - Frontend: http://localhost:3001

3. **Register a New Store**:
   - Go to http://localhost:3001/register
   - Fill in the registration form
   - This creates a store, owner, and first employee

4. **Login**:
   - Go to http://localhost:3001/login
   - Use the store email and PIN you created

5. **Test Features**:
   - Dashboard: View summary statistics
   - Tickets: Create and manage repair tickets
   - Inventory: Manage stock items
   - Customers: Manage customer database
   - Vendors: Manage vendor contacts
   - Purchase Orders: Create and manage purchase orders
   - Disputes: Create and manage disputes
   - Reports: View analytics and reports

## 🔍 Troubleshooting

### Servers Not Starting

Check if ports are in use:
```powershell
netstat -ano | findstr ":3000 :3001"
```

### Database Connection Errors

1. Verify PostgreSQL is running
2. Check DATABASE_URL in `.env` file
3. Ensure database exists: `pos_repair_platform`
4. Run migrations: `npx prisma migrate dev`

### Frontend Can't Connect to API

1. Verify API is running on port 3000
2. Check `NEXT_PUBLIC_API_URL` in `.env.local`
3. Check browser console for CORS errors

## 📝 Current Status

✅ **Backend API**: Starting (check http://localhost:3000)
✅ **Frontend Web**: Starting (check http://localhost:3001)
⚠️ **Database**: Needs setup (see above)
⚠️ **Environment Variables**: Need to be created (see above)

## 🎯 Next Steps

1. Set up database (Docker Compose or local PostgreSQL)
2. Create `.env` files
3. Run database migrations
4. Access http://localhost:3001 and register/login
5. Start testing the features!

