#!/bin/bash
# Bash script to start the POS Repair Platform with Docker

echo "========================================"
echo "POS Repair Platform - Docker Startup"
echo "========================================"
echo ""

# Check if Docker is running
echo "Checking Docker..."
if ! docker info > /dev/null 2>&1; then
    echo "✗ Docker is not running. Please start Docker."
    exit 1
fi
echo "✓ Docker is running"

# Check if docker-compose is available
echo "Checking Docker Compose..."
if ! docker compose version > /dev/null 2>&1; then
    echo "✗ Docker Compose is not available."
    exit 1
fi
echo "✓ Docker Compose is available"

echo ""
echo "Starting all services..."
echo ""

# Start services
docker compose up -d

if [ $? -eq 0 ]; then
    echo ""
    echo "========================================"
    echo "Services started successfully!"
    echo "========================================"
    echo ""
    echo "Services:"
    echo "  - API:        http://localhost:3000"
    echo "  - Web App:    http://localhost:3001"
    echo "  - Owner App:  http://localhost:3002"
    echo "  - PostgreSQL: localhost:5433"
    echo "  - Redis:      localhost:6380"
    echo ""
    echo "View logs: docker compose logs -f"
    echo "Stop services: docker compose down"
    echo ""
    
    # Show logs
    echo "Showing logs (Ctrl+C to exit)..."
    echo ""
    docker compose logs -f
else
    echo ""
    echo "✗ Failed to start services. Check the errors above."
    exit 1
fi

