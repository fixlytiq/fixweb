FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files for dependency installation
COPY package.json ./
COPY package-lock.json* ./
COPY apps/api/package.json ./apps/api/
COPY apps/api/package-lock.json* ./apps/api/

# Install all dependencies
RUN npm ci

# Copy Prisma schema
COPY apps/api/prisma ./apps/api/prisma

# Generate Prisma Client
WORKDIR /app/apps/api
RUN npx prisma generate --schema=prisma/schema.prisma
WORKDIR /app

# Copy source code
COPY apps/api ./apps/api

# Build the application
RUN npm run build:api

FROM node:20-alpine AS runner

WORKDIR /app

# Install runtime dependencies
RUN apk add --no-cache bash netcat-openbsd wget

# Create package.json without "type": "module" to avoid ES module conflicts
RUN echo '{"name": "pos-repair-platform", "private": true}' > package.json

# Copy all node_modules from builder (includes all dependencies)
# In workspace setup, some deps are in root, some in apps/api
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/api/node_modules ./apps/api/node_modules

# Copy Prisma schema and migrations
COPY --from=builder /app/apps/api/prisma ./apps/api/prisma

# Copy built application
COPY --from=builder /app/apps/api/dist ./dist

# Copy entrypoint script
COPY apps/api/docker-entrypoint.sh ./docker-entrypoint.sh
RUN chmod +x ./docker-entrypoint.sh

# Set NODE_PATH to include both node_modules locations
ENV NODE_PATH=/app/node_modules:/app/apps/api/node_modules

EXPOSE 3000

ENTRYPOINT ["./docker-entrypoint.sh"]
CMD ["node", "dist/main.js"]

