# Fixlytiq – Complete Architecture, Structure, Progress & Current State

This document describes the **Fixlytiq** (POS Repair Platform) application in full: architecture, codebase structure, implementation progress, and current deployment state. 

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Architecture](#2-system-architecture)
3. [Repository & Codebase Structure](#3-repository--codebase-structure)
4. [Data Model (Database)](#4-data-model-database)
5. [API Surface (Backend)](#5-api-surface-backend)
6. [Frontend Applications](#6-frontend-applications)
7. [Infrastructure & Deployment](#7-infrastructure--deployment)
8. [Implementation Progress](#8-implementation-progress)
9. [Current State & Known Issues](#9-current-state--known-issues)
10. [References](#10-references)

---

## 1. Product Overview

| Item | Description |
|------|-------------|
| **Product name** | Fixlytiq |
| **Tagline** | POS & Repair Management |
| **Target users** | Mobile device repair stores (single or multi-location) |
| **Purpose** | All-in-one platform for repair tickets, point-of-sale, inventory, employees, customers, vendors, and reporting |

**Core value:** One system replaces spreadsheets, paper tickets, and separate POS for repair shops.

---

## 2. System Architecture

### 2.1 High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              FIXLYTIQ (Product)                                    │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                    │
│   ┌─────────────────────┐         ┌─────────────────────┐                       │
│   │   WEB APP (Store)    │         │  OWNER APP (Admin)   │                       │
│   │   Next.js :3001     │         │  Next.js :3002      │                       │
│   │   • Dashboard        │         │  • Multi-store       │                       │
│   │   • Tickets          │         │  • Reports          │                       │
│   │   • POS              │         │  • Team / Employees │                       │
│   │   • Inventory        │         │  • Notifications    │                       │
│   │   • Customers        │         │  • Refunds           │                       │
│   │   • Vendors          │         │  • Settings          │                       │
│   │   • Reports          │         │  • Tickets (view)    │                       │
│   │   • Settings         │         │  • Inventory        │                       │
│   └──────────┬──────────┘         └──────────┬──────────┘                       │
│              │                                │                                    │
│              │  HTTPS / JWT                    │  HTTPS / JWT                       │
│              └────────────────┬───────────────┘                                    │
│                                ▼                                                      │
│   ┌─────────────────────────────────────────────────────────────────────────────┐  │
│   │                        API (NestJS)  :3000                                     │  │
│   │   Auth • Stores • Employees • Tickets • Sales • Inventory • Categories        │  │
│   │   Customers • Vendors • PurchaseOrders • Refunds • Reports • Disputes        │  │
│   │   TimeClock • Notifications                                                   │  │
│   └─────────────────────────────────────┬───────────────────────────────────────┘  │
│                                          │                                           │
│              ┌───────────────────────────┼───────────────────────────┐              │
│              ▼                           ▼                           ▼              │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐        │
│   │   PostgreSQL     │      │      Redis       │      │  (Optional)       │        │
│   │   (Primary DB)   │      │  Cache / BullMQ  │      │  Twilio / SMTP    │        │
│   └──────────────────┘      └──────────────────┘      └──────────────────┘        │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

1. User opens **Web** or **Owner** app in browser.
2. Login: **store email** + **PIN** → API returns JWT (contains `employeeId`, `storeId`, `role`).
3. All subsequent API calls send `Authorization: Bearer <JWT>` and optional `X-Store-Id`.
4. API validates JWT, resolves store context, enforces role-based access, reads/writes PostgreSQL (and Redis when used).
5. Notifications (SMS/Email) are sent by the API when configured (Twilio, SMTP).

### 2.3 Authentication Model

- **Store-centric:** One store has one `storeEmail`; employees have a **PIN** (hashed) per store.
- **Login:** `POST /auth/login` with `{ storeEmail, pin }` → JWT.
- **Registration:** Creates **Owner** + **Store** + first **Employee** (role OWNER) in one transaction; returns JWT.
- **Roles (StoreRole):** `OWNER` | `MANAGER` | `TECHNICIAN` | `CASHIER` | `VIEWER`. Access control is enforced in API via guards and service logic.

---

## 3. Repository & Codebase Structure

### 3.1 Repository Layout

```
fixweb-1/                          # Git repo root (trigger runs from here)
├── cloudbuild.yaml                # CI/CD: build images, push, deploy to Cloud Run
└── pos-repair-platform/           # Monorepo root
    ├── package.json               # Workspace root (dev:api, dev:web, dev:owner, build:*)
    ├── docker-compose.yml         # Local: postgres, redis, api, web, owner
    ├── .env.example               # Env template for local/Docker
    ├── apps/
    │   ├── api/                   # NestJS backend
    │   ├── web/                   # Next.js store app (Fixlytiq UI)
    │   └── owner/                 # Next.js owner/admin app
    ├── packages/
    │   ├── api-client/            # Shared API client (owner uses this)
    │   ├── types/                 # Shared TypeScript types
    │   └── tsconfig/              # Shared tsconfig base
    ├── scripts/                   # GCP, Cloud SQL, deployment helpers
    └── docs (*.md)                # README, GCP_SETUP_GUIDE, DEPLOYMENT_FIXES, etc.
```

### 3.2 Apps Overview

| App | Path | Stack | Port (local) | Purpose |
|-----|------|--------|----------------|--------|
| **API** | `apps/api/` | NestJS, Prisma, Redis | 3000 | Backend: REST API, auth, business logic, DB, notifications |
| **Web** | `apps/web/` | Next.js (App Router), React, Tailwind | 3001 | Store staff: tickets, POS, inventory, customers, reports, settings |
| **Owner** | `apps/owner/` | Next.js, React Query, Tailwind | 3002 | Owners/admins: multi-store, reports, team, notifications, refunds, settings |

### 3.3 API Source Structure (`apps/api/src/`)

```
api/src/
├── main.ts                    # Bootstrap, CORS (FRONTEND_URL), global validation pipe
├── app.module.ts              # Imports all feature modules
├── app.controller.ts          # Health check
├── prisma/                    # PrismaModule, PrismaService
├── redis/                     # Redis config & module (GCP Memorystore–aware)
├── queue/                     # QueueModule (BullMQ)
├── auth/                      # Login (PIN), register, JWT strategy, roles guard
├── stores/                    # CRUD stores, tenant context
├── employees/                 # CRUD employees (store-scoped)
├── time-clock/                # Clock in/out
├── tickets/                   # Full ticket lifecycle, notes, waivers
├── sales/                     # Sales, line items
├── refunds/                   # Refunds linked to sales
├── inventory/                 # Stock items, categories, adjustments
├── categories/                # Categories (store-scoped)
├── customers/                 # Customers
├── vendors/                   # Vendors (store-scoped)
├── purchase-orders/           # Purchase orders and items
├── reports/                   # Summary, sales, tickets, inventory-low
├── disputes/                  # Disputes and evidence
└── notifications/             # Notification history, SMS/Email sending
```

### 3.4 Web App Routes (`apps/web/src/app/`)

| Route | Purpose |
|-------|--------|
| `/` | Landing |
| `/login` | Store email + PIN login |
| `/register` | New store + owner registration |
| `/(dashboard)/dashboard` | Dashboard |
| `/(dashboard)/tickets` | Ticket list |
| `/(dashboard)/tickets/new` | New ticket (pre/post repair forms, waiver) |
| `/(dashboard)/tickets/[id]` | Ticket detail |
| `/(dashboard)/pos` | Point of sale |
| `/(dashboard)/inventory` | Inventory & categories |
| `/(dashboard)/customers` | Customers |
| `/(dashboard)/vendors` | Vendors |
| `/(dashboard)/purchase-orders` | Purchase orders |
| `/(dashboard)/reports` | Reports |
| `/(dashboard)/disputes` | Disputes |
| `/(dashboard)/settings` | Store settings, employees |

### 3.5 Owner App Routes (`apps/owner/src/app/owner/`)

| Route | Purpose |
|-------|--------|
| `/owner/login` | Owner login |
| `/owner/dashboard` | Dashboard |
| `/owner/stores` | Store management |
| `/owner/team` | Employees |
| `/owner/tickets` | Tickets (list/detail/new) |
| `/owner/inventory` | Inventory |
| `/owner/customers` | Customers |
| `/owner/refunds` | Refunds |
| `/owner/reports` | Reports |
| `/owner/notifications` | Notifications |
| `/owner/pos-insights` | POS insights |
| `/owner/settings` | Settings |
| `/owner/access-denied` | Access denied |

---

## 4. Data Model (Database)

**ORM:** Prisma. **Database:** PostgreSQL.

### 4.1 Entity Relationship Summary

- **Owner** – One per store owner account (email + password). Can own multiple **Store**s.
- **Store** – Tenant unit. Has: name, timezone, tax rate, store email/phone, notification email, owner.
- **Employee** – Belongs to one store; has name, PIN (hashed), **StoreRole**. Used for login and RBAC.
- **Customer** – First/last name, email, phone, notes. Linked to tickets and sales.
- **Ticket** – Repair job: title, description, status (RECEIVED → IN_PROGRESS → … → COMPLETED/CANCELLED), customer, technician, costs, timestamps. Has **TicketNote** and **TicketWaiver**.
- **Sale** – Store, optional ticket/customer, payment status, subtotal/tax/total, line items. **Refund** links to Sale.
- **SaleLineItem** – Links sale to stock item, quantity, unit/total price.
- **StockItem** – Store, SKU, name, category, unit cost/price, reorder point, quantity on hand.
- **Category** – Store-scoped name for grouping stock items.
- **StockMovement** – Immutable ledger: stock item, store, quantity change, reason (SALE, PURCHASE, ADJUSTMENT, etc.), optional ticket/PO/sale line reference.
- **Vendor** – Store-scoped; name, contact, email, phone, website.
- **PurchaseOrder** / **PurchaseOrderItem** – PO linked to vendor and store; items can link to StockItem. Receiving creates stock movements.
- **TimeClock** – Employee clock in/out/break for a store.
- **Dispute** / **DisputeEvidence** – Dispute linked to store, optional ticket, status, evidence (note, document, image, etc.).
- **NotificationHistory** – Store, type, channel (SMS/EMAIL/etc.), recipient, ticket/sale ref, read/sent timestamps.
- **WaiverTemplate** – Store-specific waiver text for tickets.
- **User** / **Membership** / **StoreUserRole** – Used for organization/multi-tenant user model (some flows may still use Owner+Employee; schema supports both).

### 4.2 Enums (Prisma)

- **TicketStatus:** RECEIVED, IN_PROGRESS, AWAITING_PARTS, READY, COMPLETED, CANCELLED
- **StoreRole:** OWNER, MANAGER, TECHNICIAN, CASHIER, VIEWER
- **PaymentStatus:** PENDING, AUTHORIZED, PAID, REFUNDED, VOID
- **PurchaseOrderStatus:** DRAFT, SUBMITTED, ORDERED, RECEIVED, CANCELLED
- **StockMovementReason:** SALE, PURCHASE, ADJUSTMENT, RETURN, TRANSFER, RESERVATION, RELEASE
- **DisputeStatus:** OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- **NotificationType / NotificationChannel:** e.g. TICKET_STATUS_UPDATE, SMS, EMAIL, etc.

### 4.3 Migrations

Migrations live under `apps/api/prisma/migrations/`. Examples:

- `20250115000000_remove_organization_add_owner_employee`
- `20250116000000_add_categories`
- `20250117000000_add_tax_rate_to_store`
- `20250130000000_add_notification_history`
- `20251114033003_init`
- `20251121180541_add_store_phone_email`

Schema is applied in production via `prisma migrate deploy` (run from API container entrypoint when `DATABASE_URL` is set).

---

## 5. API Surface (Backend)

### 5.1 Auth

- `POST /auth/register` – Register new store + owner + first employee (OWNER). Body: ownerName, storeName, storeEmail, storePhone?, notificationEmail?, pin.
- `POST /auth/login` – Login with storeEmail + pin. Returns JWT and store/employee info.

### 5.2 Protected Endpoints (JWT + store/role)

All below are store-scoped where applicable; many use `@Roles()` and role guards.

- **Stores:** CRUD (create additional store, update store).
- **Employees:** Create, list, update, delete (store-scoped).
- **Time clock:** Clock in, clock out.
- **Tickets:** Full CRUD, notes, status updates.
- **Sales:** Create sale, list, get by id; line items.
- **Refunds:** Create refund, list.
- **Inventory:** Stock items CRUD, categories, adjust stock.
- **Categories:** CRUD (store-scoped).
- **Customers:** CRUD.
- **Vendors:** CRUD (store-scoped).
- **Purchase orders:** CRUD, order items.
- **Reports:** Summary, sales report, tickets report, inventory-low report (query params: date range, storeId where applicable).
- **Disputes:** CRUD, evidence.
- **Notifications:** List notification history, mark read, etc.

### 5.3 Web API Client Modules (`apps/web/src/lib/api/`)

The Web app mirrors the API with typed clients: `auth`, `stores`, `employees`, `tickets`, `sales`, `refunds`, `inventory`, `categories`, `customers`, `vendors`, `purchase-orders`, `reports`, `disputes`, `time-clock`. Owner app uses `packages/api-client` and `apps/owner/src/lib/api.ts` for similar coverage.

---

## 6. Frontend Applications

### 6.1 Web (Store App)

- **Framework:** Next.js (App Router), React, TypeScript.
- **UI:** Tailwind CSS, Radix-style components, dark/light theme (storage key `fixlytiq-theme`).
- **Auth:** AuthProvider (context), login/register pages, JWT stored and sent via api-client.
- **Features:** Dashboard, tickets (list/new/detail with pre/post repair forms and waiver), POS, inventory, customers, vendors, purchase orders, reports, disputes, settings (store + employees).

### 6.2 Owner App

- **Framework:** Next.js, React, TypeScript, React Query (TanStack Query).
- **UI:** Tailwind, theme (storage key `fixlytiq-owner-theme`).
- **Auth:** Owner login flow; access control for owner/admin views.
- **Features:** Multi-store, dashboard, team (employees), tickets, inventory, customers, refunds, reports, notifications, POS insights, settings.

---

## 7. Infrastructure & Deployment

### 7.1 Local Development

- **Option A – Docker:** `docker-compose up -d` runs PostgreSQL (5433), Redis (6380), API (3000), Web (3001), Owner (3002). See `DOCKER_README.md`.
- **Option B – Local processes:** Run Postgres and Redis locally (or in Docker), then:
  - `npm run dev:api` (API :3000)
  - `npm run dev:web` (Web :3001)
  - `npm run dev:owner` (Owner :3002)
- **Env:** Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_*`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, etc.

### 7.2 Production (Google Cloud Platform)

| Component | Technology |
|-----------|------------|
| **Compute** | Cloud Run (API, Web, Owner as separate services) |
| **Database** | Cloud SQL for PostgreSQL (private IP, VPC) |
| **Cache** | Memorystore for Redis (private IP, VPC) |
| **Networking** | VPC (custom network + subnet), VPC Access Connector for Cloud Run → VPC |
| **Images** | Artifact Registry (e.g. `us-central1-docker.pkg.dev/<project>/pos-repair-images/*`) |
| **CI/CD** | Cloud Build: trigger on push to `main`; build Docker images from `pos-repair-platform/`, push to Artifact Registry, deploy to Cloud Run |

### 7.3 Cloud Build Pipeline (Root `cloudbuild.yaml`)

1. **Build** (from `dir: pos-repair-platform`): Docker build for API, Web, Owner (with `NEXT_PUBLIC_API_URL` build arg using `_PROJECT_NUMBER`).
2. **Push:** Push images (by `$BUILD_ID` and `latest`) to Artifact Registry.
3. **Deploy:** Deploy API (with Cloud SQL connection, VPC connector, env: `DATABASE_URL`, `REDIS_HOST`, `JWT_SECRET`, `FRONTEND_URL`, etc.), Web, Owner (env: `NEXT_PUBLIC_API_URL`, `PORT=8080`).
4. **Traffic:** Update traffic to latest revision for all three services.

**Substitution variables (trigger):** `_SQL_CONNECTION_NAME`, `_VPC_CONNECTOR`, `_DATABASE_URL`, `_REDIS_HOST`, `_JWT_SECRET`, `_FRONTEND_URL` (semicolon-separated URLs), `_PROJECT_NUMBER`.

### 7.4 Environment Variables (Production)

- **API (Cloud Run):** `DATABASE_URL` (Cloud SQL socket), `REDIS_HOST` (Memorystore IP), `REDIS_PORT`, `REDIS_PASSWORD` (empty for Memorystore), `JWT_SECRET`, `NODE_ENV`, `PORT=8080`, `FRONTEND_URL` (comma or semicolon separated). Optional: Twilio, SMTP.
- **Web/Owner:** `NEXT_PUBLIC_API_URL` (build-time + runtime), `NODE_ENV`, `PORT=8080`.

---

## 8. Implementation Progress

### 8.1 Completed

- **Auth:** PIN-based login and registration (store + owner + first employee), JWT and role guards.
- **Stores:** CRUD, store-scoped tenancy.
- **Employees:** CRUD, store-scoped, role assignment.
- **Tickets:** Full lifecycle, notes, waivers (template + signed waiver), status workflow.
- **Sales & Refunds:** Sales with line items; refunds linked to sales.
- **Inventory:** Stock items, categories, adjustments, stock movements (ledger).
- **Customers & Vendors:** CRUD, store-scoped where applicable.
- **Purchase orders:** CRUD, purchase order items.
- **Reports:** Summary, sales, tickets, inventory-low (API + Web/Owner UI).
- **Disputes:** Dispute and evidence entities and API.
- **Time clock:** Clock in/out.
- **Notifications:** Notification history; optional Twilio (SMS) and SMTP (email) for ticket/sale events.
- **Web app:** All dashboard pages above; pre/post repair forms; waiver and legal copy (Fixlytiq branding).
- **Owner app:** Multi-store, team, tickets, inventory, customers, refunds, reports, notifications, settings.
- **Database:** Full Prisma schema and migrations; applied on API startup in Cloud Run.
- **Docker:** Dockerfiles for API, Web, Owner; docker-compose for local stack.
- **GCP:** Cloud Run, Cloud SQL, Memorystore, VPC, Artifact Registry, Cloud Build trigger (push to main). VPC peering for Cloud SQL private IP.

### 8.2 Partially Done / Optional

- **Queue (BullMQ):** Queue module present; background jobs (e.g. scheduled low-stock) can be extended.
- **Organization/User model:** Schema has User, Membership, StoreUserRole; some flows use Owner+Employee. Blueprint (`structure.md`) describes store-based PIN auth; current implementation is store + employee PIN.
- **Mobile app:** Blueprint mentions React Native/Expo; not present in this repo (web + owner only).
- **AI dispute assistant:** Not implemented; disputes are manual.
- **Hardware:** Scanners, printers, cash drawers not integrated.

### 8.3 Not Started (from blueprint)

- Customer portal (repair tracking, payments).
- Warranty management.
- Offline-first POS.
- Demand forecasting / ML.

---

## 9. Current State & Known Issues

### 9.1 Deployment State

- **GCP project:** `repair-pos-485101` (project number `233232647471`).
- **Cloud SQL:** Instance `pos-repair-postgres` created and **RUNNABLE**; database `pos_repair_platform` and user `posrepair_user` created.
- **Memorystore:** Redis instance created; IP used in `_REDIS_HOST`.
- **VPC:** Custom network and connector configured; peering for Cloud SQL.
- **Cloud Build:** Trigger on push to `main`; `cloudbuild.yaml` at repo root, steps run with `dir: pos-repair-platform`.
- **Initial deploy:** We do not use `--no-traffic`; first deploy sends 100% traffic to the new revision. API deploy uses `--vpc-egress=all-traffic` so the API can reach Redis (VPC) and Twilio/SMTP (public). Migrations run in the API container entrypoint before the app starts.
- **Trigger substitution:** Ensure trigger has all variables including `_PROJECT_NUMBER=233232647471` and `_FRONTEND_URL` with **semicolons** (not commas). See `DEPLOYMENT_FIXES.md`.

### 9.2 Application URLs (After Successful Deploy)

- **API:** `https://pos-repair-api-233232647471.us-central1.run.app`
- **Web:** `https://pos-repair-web-233232647471.us-central1.run.app`
- **Owner:** `https://pos-repair-owner-233232647471.us-central1.run.app`

### 9.3 Codebase Health

- **Linting:** No linter errors reported for the repo.
- **Tests:** API has `app.controller.spec.ts`; no project-wide test suite referenced in root scripts.
- **Documentation:** README, GCP_SETUP_GUIDE, DEPLOYMENT_FIXES, DOCKER_README, TESTING_GUIDE, app-specific READMEs. Redundant MDs removed; main docs kept.

### 9.4 Security & Config

- **Secrets:** JWT secret, DB passwords, and API keys belong in env/trigger substitution (not committed). `.gcp-config` is gitignored.
- **CORS:** API uses `FRONTEND_URL` (comma or semicolon separated) in production to allow Web and Owner origins.

---

## 10. References

| Document | Purpose |
|----------|--------|
| `README.md` | Project overview, quick start, features, env vars |
| `GCP_SETUP_GUIDE.md` | Full GCP setup (project, APIs, VPC, Redis, Cloud SQL, trigger, substitution vars) |
| `DEPLOYMENT_FIXES.md` | Critical fixes (e.g. `_PROJECT_NUMBER`, `_FRONTEND_URL` semicolons) and trigger checklist |
| `DOCKER_README.md` | Docker Compose usage |
| `TESTING_GUIDE.md` | Testing instructions |
| `apps/api/README.md` | API-specific docs |
| `apps/web/README.md` | Web app docs |
| `apps/owner/README.md` | Owner app docs |

---

*Document generated to reflect the codebase and deployment state as of the last review. Update this file when architecture, structure, or deployment changes.*
