FROM node:20-alpine AS builder

WORKDIR /app

# Copy root package files
COPY package.json package-lock.json* ./

# Copy workspace package files
COPY apps/owner/package.json ./apps/owner/
COPY packages/*/package.json ./packages/*/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/owner ./apps/owner
COPY packages ./packages

# Set build-time environment variable
ARG NEXT_PUBLIC_API_URL=http://localhost:3000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

# Build the application
WORKDIR /app
RUN npm run build:owner

FROM node:20-alpine AS runner

WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3002
ENV HOSTNAME="0.0.0.0"

# Install wget for health checks
RUN apk add --no-cache wget

# Copy standalone build
COPY --from=builder /app/apps/owner/.next/standalone ./
COPY --from=builder /app/apps/owner/.next/static ./apps/owner/.next/static

# Copy node_modules for packages (if used)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages ./packages

# Copy public directory if it exists (optional)
RUN mkdir -p ./apps/owner/public

EXPOSE 3002

HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3002/ || exit 1

CMD ["node", "apps/owner/server.js"]

