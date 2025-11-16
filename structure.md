% POS & Repair Management System Blueprint (v2.0)

## Overview

This document restructures the original Word blueprint into Markdown so it can serve as source material for future web or documentation tooling. It captures the architectural vision for a point-of-sale and repair management platform tailored to mobile repair stores. The system unifies ticketing, inventory, vendor management, AI-assisted dispute handling, and analytics across web and mobile surfaces. The architecture uses a store-based model where each registration creates an owner, store, and first employee.

## 1. Tech Stack

### Frontend (Web + Mobile)
- `Web`: React / Next.js (App Router, TypeScript)
- `Mobile`: React Native (Expo) for technician and owner dashboards
- `Styling`: Tailwind CSS + Radix UI
- `State Management`: React Query (TanStack)
- `Validation`: Zod + React Hook Form
- `Charts`: Recharts or Chart.js

### Backend & Infrastructure
- `Framework`: Node.js (NestJS) with Prisma ORM
- `Database`: PostgreSQL (Supabase or AWS RDS) with row-level security
- `Cache & Queues`: Redis + BullMQ for background jobs
- `Real-time`: NestJS WebSocket gateways
- `Storage`: AWS S3 or Supabase Storage
- `Authentication`: JWT + refresh tokens, OAuth, MFA-ready
- `AI`: OpenAI or Google Gemini APIs for dispute analysis
- `Notifications`: Twilio (SMS) and SendGrid (Email)

### DevOps & Monitoring
- `Deployment`: Docker, GitHub Actions, AWS ECS
- `Infrastructure`: Terraform
- `Observability`: Pino, Grafana, Prometheus

## 2. Core User Flows

### Ticket Intake & Repair Lifecycle
1. Staff member creates a repair ticket with device details, issues, and estimates.
2. Digital waiver automatically attaches for customer signature.
3. Technician claims the ticket and updates status (Received → In Progress → Awaiting Parts → Ready → Completed).
4. Automated notifications trigger on key status changes.
5. Checkout reconciles parts consumption with inventory and records payment.

### Inventory & Vendor Flow
- Low stock triggers purchase suggestions.
- Managers approve purchase orders.
- Vendor integrations enable direct ordering.

### AI Dispute Resolution
- AI aggregates waivers, ticket notes, and photo evidence.
- Produces structured dispute summaries with timestamps.

## 3. Application Surfaces

### Web App (Owners & Managers)
- `Dashboard`: KPIs, revenue, open tickets, turnaround time.
- `Tickets`: Management with filters and timeline.
- `POS Register`: Sales, quotes, tax, payments.
- `Inventory`: Stock, purchase orders, transfers, returns.
- `Reports`: Analytics and exports.
- `Settings`: Roles, stores, taxes, waiver templates.

### Mobile App (Technicians & Owners)
- `My Tickets`: Status updates, image uploads, internal notes.
- `Inventory Quick Access`: Scan to reserve or consume parts.
- `Approvals & Quotes`: One-tap send/approve workflow.

### Core UI Components
- `TicketTimeline`, `SignaturePad`, `POSCart`, `VendorForm`, `AuditTrailTable`.

## 4. Data Architecture

- Hierarchy: `Owner → Store → Employee`.
- Store-based authentication: Users log in with `storeEmail` and individual employee `pin`.
- RBAC via store-specific roles (OWNER, MANAGER, TECHNICIAN, CASHIER, VIEWER).
- Operational tables: `tickets`, `waivers`, `stock_items`, `purchase_orders`, `sales`, `disputes`, `dispute_evidence`.
- All queries scoped by `store_id` derived from JWT token claims. Row-level security enforced through JWT claims.
- Registration creates the first store, owner, and owner-employee in a single transaction.

## 5. Role Access Matrix

| Feature        | Owner         | Manager          | Technician  | Cashier    |
|---------------|---------------|------------------|-------------|------------|
| Reports        | All           | Store Only       | No          | No         |
| Inventory      | Full          | Edit             | View Only   | No         |
| Tickets        | All           | All              | Own Only    | View       |
| POS/Payments   | All           | All              | No          | Execute    |
| Vendor Orders  | All           | Limited          | No          | No         |
| Disputes       | All           | Store Only       | No          | No         |

## 6. Store Model

- Each registration creates one store with one owner and the first employee (the owner).
- Owners can create additional stores via the "Create Additional Store" endpoint.
- Each employee belongs to a single store and authenticates with the store's email and their unique PIN.
- Store ID is automatically derived from the JWT token for all API requests.
- No store switching UI needed - users are bound to their store context.

## 7. Implementation Roadmap

### Phase 1: MVP Launch
- Auth, tenancy, RBAC foundations.
- Ticketing with digital waivers.
- Technician mobile app core loop.
- Inventory tracking with stock movement ledger.
- POS register for sales and payments.
- Hardware R&D for scanners, printers.

### Phase 2: Post-Launch Enhancements
- Vendor API integrations and automated purchase orders.
- Automated SMS/Email notifications.
- Advanced reporting and analytics dashboards.
- Full hardware integration (scanners, printers, cash drawers).

### Phase 3: Advanced Features
- AI dispute assistant and PDF generation.
- Comprehensive observability and audit trails.
- Public launch and ecosystem features (customer portal, warranty tracking).

## 8. CI/CD Pipeline

### Step 1: Pre-Commit
- Husky hooks run `eslint --fix`, `prettier --write`, and Jest/Vitest on changed files.

### Step 2: Pull Request (CI)
- GitHub Actions workflow (`ci.yml`) executes lint, format, full test suite, and Docker build.

### Step 3: Merge to `main` (Staging Deploy)
- Workflow (`deploy-staging.yml`) builds and pushes Docker image to AWS ECR.
- Runs `npx prisma migrate deploy` on staging.
- Updates AWS ECS service and runs staging E2E tests.

### Step 4: Git Tag (Production Release)
- Workflow (`deploy-production.yml`) reuses tested image.
- Applies production migrations.
- Promotes ECS service to the tagged image.

## 9. Sample Schema Highlights

```sql
CREATE TABLE owners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz DEFAULT now()
);

CREATE TABLE stores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid REFERENCES owners(id) NOT NULL,
  name text NOT NULL,
  store_email text UNIQUE NOT NULL,
  timezone text DEFAULT 'America/Chicago',
  created_at timestamptz DEFAULT now()
);

CREATE TABLE employees (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id uuid REFERENCES stores(id) NOT NULL,
  pin_hash text NOT NULL,
  role text NOT NULL, -- OWNER, MANAGER, TECHNICIAN, CASHIER, VIEWER
  first_name text,
  last_name text,
  email text,
  phone text,
  created_at timestamptz DEFAULT now(),
  UNIQUE(store_id, pin_hash) -- Ensures unique PINs per store
);
```

```sql
CREATE TABLE stock_movements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stock_item_id uuid REFERENCES stock_items(id) NOT NULL,
  store_id uuid REFERENCES stores(id) NOT NULL,
  quantity_change int NOT NULL,
  reason text NOT NULL,
  ticket_id uuid REFERENCES tickets(id),
  purchase_order_id uuid,
  created_at timestamptz DEFAULT now()
);
```

## 10. Automation & Integrity Rules

- Inventory counts derive from the immutable `stock_movements` ledger.
- Ticket part usage inserts negative stock movements automatically.
- Purchase receipts add positive movements and update ledgers.
- Scheduled low-stock checks publish purchase order suggestions.

## 11. Future Enhancements

- Customer portal for repair tracking and payments.
- Warranty management for repairs and serialized parts.
- Offline-first POS terminal mode.
- Demand forecasting via machine learning.


