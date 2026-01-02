# Owner Portal

Owner and Manager dashboard for the POS & Repair Management Platform.

## Features

- **Dashboard**: Business KPIs, revenue tracking, ticket overview
- **Stores**: Multi-store management
- **Team**: Employee management and role assignment
- **Inventory**: Stock tracking and low stock alerts
- **Tickets**: Repair ticket oversight
- **POS Insights**: Sales analytics and performance
- **Refunds**: Refund management
- **Reports**: Business analytics and exports
- **Settings**: Store configuration
- **Notifications**: Notification history and preferences

## Getting Started

### Development

```bash
# From root directory
npm run dev:owner

# Or from apps/owner
npm run dev
```

The app will run on `http://localhost:3002`

### Build

```bash
npm run build:owner
```

### Production

```bash
npm run start:owner
```

## Authentication

Only users with `OWNER` or `MANAGER` roles can access this portal. Login uses the same credentials as the main app (storeEmail + PIN).

### Demo Credentials

To create a demo owner account, run:

```bash
# From apps/api directory
npm run create-demo
```

This will create a demo account with:
- **Store Email**: `owner@demo.com`
- **PIN**: `1234`

Alternatively, you can register a new account via the web app at `http://localhost:3001/register`.

## Theme

The owner app uses the same shadcn/ui Yellow theme as the main web app, ensuring visual consistency across the platform.

## API Integration

The owner app uses the shared `@pos-repair/api-client` package to communicate with the backend API. All API calls are automatically authenticated using JWT tokens.

## Pages

- `/owner/login` - Login page
- `/owner/dashboard` - Main dashboard with KPIs
- `/owner/stores` - Store management
- `/owner/team` - Employee management
- `/owner/inventory` - Inventory tracking
- `/owner/tickets` - Ticket oversight
- `/owner/pos-insights` - Sales analytics
- `/owner/refunds` - Refund management
- `/owner/reports` - Business reports
- `/owner/settings` - Store settings
- `/owner/notifications` - Notifications

