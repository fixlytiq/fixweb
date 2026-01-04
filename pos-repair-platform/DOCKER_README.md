# Running the POS Repair Platform with Docker

This guide explains how to run the entire POS Repair Platform using Docker Compose.

## Prerequisites

- Docker Desktop (Windows/Mac) or Docker Engine + Docker Compose (Linux)
- At least 4GB of available RAM
- Ports 3000, 3001, 3002, 5433, and 6380 available

## Quick Start

1. **Navigate to the project directory:**
   ```bash
   cd pos-repair-platform
   ```

2. **Create environment file (optional):**
   ```bash
   cp .env.example .env
   ```
   Edit `.env` if you need to change any default values.

3. **Start all services:**
   ```bash
   docker-compose up -d
   ```

4. **View logs:**
   ```bash
   docker-compose logs -f
   ```

5. **Stop all services:**
   ```bash
   docker-compose down
   ```

## Services

The Docker Compose setup includes:

- **PostgreSQL** (port 5433) - Database
- **Redis** (port 6380) - Cache and queue management
- **API** (port 3000) - NestJS backend API
- **Web** (port 3001) - Next.js customer-facing web app
- **Owner** (port 3002) - Next.js owner/admin dashboard

## Accessing the Applications

Once all services are running:

- **API**: http://localhost:3000
- **Web App**: http://localhost:3001
- **Owner Dashboard**: http://localhost:3002

## Environment Variables

Key environment variables (can be set in `.env` file):

- `POSTGRES_USER` - PostgreSQL username (default: postgres)
- `POSTGRES_PASSWORD` - PostgreSQL password (default: password)
- `POSTGRES_DB` - Database name (default: pos_repair_platform)
- `JWT_SECRET` - Secret key for JWT tokens (change in production!)
- `NEXT_PUBLIC_API_URL` - API URL for frontend apps (default: http://localhost:3000)

## Database Migrations

Database migrations run automatically when the API container starts. The API will wait for PostgreSQL to be ready before running migrations.

## Troubleshooting

### Check service status:
```bash
docker-compose ps
```

### View logs for a specific service:
```bash
docker-compose logs api
docker-compose logs web
docker-compose logs postgres
```

### Rebuild containers after code changes:
```bash
docker-compose up -d --build
```

### Reset database (WARNING: deletes all data):
```bash
docker-compose down -v
docker-compose up -d
```

### Access database directly:
```bash
docker-compose exec postgres psql -U postgres -d pos_repair_platform
```

### Access Redis CLI:
```bash
docker-compose exec redis redis-cli -a redispassword
```

## Development vs Production

The current setup is configured for development. For production:

1. Change `JWT_SECRET` to a strong random value
2. Set `NODE_ENV=production`
3. Use strong database passwords
4. Configure proper SMTP/Twilio credentials
5. Consider using Docker secrets for sensitive data
6. Set up proper SSL/TLS certificates

## Building Individual Services

To build a specific service:

```bash
docker-compose build api
docker-compose build web
docker-compose build owner
```

## Stopping and Cleaning Up

```bash
# Stop services
docker-compose stop

# Stop and remove containers
docker-compose down

# Stop, remove containers, and delete volumes (WARNING: deletes data)
docker-compose down -v
```

