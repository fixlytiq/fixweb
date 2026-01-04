# Testing Guide - POS Repair Platform

All services are now running in Docker and ready for testing!

## 🚀 Access Your Applications

### 1. **API (Backend)**
- **URL**: http://localhost:3000
- **Status**: ✅ Running and Healthy
- **Health Check**: http://localhost:3000/health (if available)
- **API Documentation**: Check for Swagger/OpenAPI endpoint

### 2. **Web App (Customer/Store Frontend)**
- **URL**: http://localhost:3001
- **Status**: ✅ Running and Healthy
- **Purpose**: Customer-facing interface for store operations

### 3. **Owner Dashboard (Admin Frontend)**
- **URL**: http://localhost:3002
- **Status**: ✅ Running and Healthy
- **Purpose**: Owner/admin dashboard for managing stores, employees, reports, etc.

## 📊 Service Status

All services are running in Docker containers:

| Service | Container Name | Port | Status |
|---------|---------------|------|--------|
| PostgreSQL | pos-repair-postgres | 5433 | ✅ Healthy |
| Redis | pos-repair-redis | 6380 | ✅ Healthy |
| API | pos-repair-api | 3000 | ✅ Healthy |
| Web App | pos-repair-web | 3001 | ✅ Healthy |
| Owner Dashboard | pos-repair-owner | 3002 | ✅ Healthy |

## 🧪 Testing Checklist

### API Testing
1. **Health Check**: Verify API is responding
   ```powershell
   Invoke-WebRequest -Uri http://localhost:3000
   ```

2. **Authentication**: Test login endpoint
   - POST `/auth/login`
   - POST `/auth/register`

3. **Protected Routes**: Test with JWT token
   - GET `/stores`
   - GET `/employees`
   - GET `/tickets`

### Web App Testing (Port 3001)
1. Navigate to http://localhost:3001
2. Test login functionality
3. Test dashboard access
4. Test store operations (tickets, inventory, etc.)

### Owner Dashboard Testing (Port 3002)
1. Navigate to http://localhost:3002
2. Test owner login
3. Test store management
4. Test employee management
5. Test reports and analytics

## 🔧 Useful Commands

### View Logs
```powershell
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f web
docker compose logs -f owner
```

### Check Service Status
```powershell
docker compose ps
```

### Restart a Service
```powershell
docker compose restart api
docker compose restart web
docker compose restart owner
```

### Stop All Services
```powershell
docker compose down
```

### Start All Services
```powershell
docker compose up -d
```

### Access Database
```powershell
docker compose exec postgres psql -U postgres -d pos_repair_platform
```

### Access Redis
```powershell
docker compose exec redis redis-cli -a redispassword
```

## 🐛 Troubleshooting

### If a service is not responding:
1. Check logs: `docker compose logs [service-name]`
2. Check status: `docker compose ps`
3. Restart service: `docker compose restart [service-name]`
4. Rebuild if needed: `docker compose up -d --build [service-name]`

### If database connection fails:
1. Verify PostgreSQL is running: `docker compose ps postgres`
2. Check database logs: `docker compose logs postgres`
3. Verify DATABASE_URL in docker-compose.yml

### If frontend can't connect to API:
1. Verify API is running: `docker compose ps api`
2. Check API logs: `docker compose logs api`
3. Verify NEXT_PUBLIC_API_URL is set correctly

## 📝 Notes

- All services are running in production mode
- Database migrations run automatically on API startup
- Data persists in Docker volumes
- Default credentials are in docker-compose.yml (change for production!)

## 🎯 Next Steps

1. Test authentication flow
2. Create test data (stores, employees, tickets)
3. Test all major features
4. Verify reports functionality
5. Test notifications (if configured)

Happy Testing! 🚀

