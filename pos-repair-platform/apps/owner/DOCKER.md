# Owner App Docker Setup

## Building the Docker Image

### Build from root directory:
```bash
docker build -f apps/owner/Dockerfile -t pos-repair-owner:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://localhost:3000 .
```

### Build with custom API URL:
```bash
docker build -f apps/owner/Dockerfile -t pos-repair-owner:latest \
  --build-arg NEXT_PUBLIC_API_URL=http://api:3000 .
```

## Running with Docker Compose

The owner app is included in `docker-compose.yml`. To start all services:

```bash
docker-compose up -d owner
```

Or start all services:
```bash
docker-compose up -d
```

## Environment Variables

The owner app uses the following environment variables:

- `NEXT_PUBLIC_API_URL` - API server URL (default: http://localhost:3000)
- `PORT` - Port to run on (default: 3002)
- `NODE_ENV` - Environment (production/development)

## Ports

- Default port: `3002`
- Can be changed via `OWNER_PORT` environment variable in docker-compose.yml

## Health Check

The container includes a health check that verifies the app is responding on port 3002.

## Standalone Build

The Dockerfile uses Next.js standalone output mode for optimal production builds with minimal dependencies.

