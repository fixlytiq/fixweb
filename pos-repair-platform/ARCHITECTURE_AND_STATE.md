# Fixlytiq – Architecture, Structure, Progress & Current State

This document is the single source of truth for **Fixlytiq** (POS & Repair Platform): architecture, codebase structure, data model, API, frontends, payment system, implementation progress, and deployment.

---

## Table of Contents

1. [Product Overview](#1-product-overview)
2. [System Architecture](#2-system-architecture)
3. [Repository & Codebase Structure](#3-repository--codebase-structure)
4. [Data Model (Database)](#4-data-model-database)
5. [Payment System (Provider-Agnostic)](#5-payment-system-provider-agnostic)
6. [API Surface (Backend)](#6-api-surface-backend)
7. [Frontend Applications](#7-frontend-applications)
8. [Infrastructure & Deployment](#8-infrastructure--deployment)
9. [Implementation Progress](#9-implementation-progress)
10. [Current State & Known Issues](#10-current-state--known-issues)
11. [References](#11-references)

---

## 1. Product Overview

| Item | Description |
|------|-------------|
| **Product name** | Fixlytiq |
| **Tagline** | POS & Repair Management |
| **Target users** | Mobile device repair stores (single or multi-location) |
| **Purpose** | All-in-one platform for repair tickets, point-of-sale, inventory, employees, customers, vendors, payments, and reporting |

**Core value:** One system replaces spreadsheets, paper tickets, and separate POS for repair shops.

---

## 2. System Architecture

### 2.1 High-Level Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│                              FIXLYTIQ (Product)                                   │
├──────────────────────────────────────────────────────────────────────────────────┤
│                                                                                   │
│   ┌─────────────────────┐         ┌─────────────────────┐                        │
│   │   WEB APP (Store)   │         │  OWNER APP (Admin)   │                        │
│   │   Next.js :3001     │         │  Next.js :3002       │                        │
│   │   • Dashboard       │         │  • Multi-store       │                        │
│   │   • Tickets         │         │  • Reports           │                        │
│   │   • POS             │         │  • Team / Employees  │                        │
│   │   • Inventory       │         │  • Notifications     │                        │
│   │   • Customers       │         │  • Refunds           │                        │
│   │   • Vendors         │         │  • Settings          │                        │
│   │   • Reports         │         │  • Tickets (view)    │                        │
│   │   • Settings        │         │  • Inventory        │                        │
│   └──────────┬──────────┘         └──────────┬──────────┘                        │
│              │                                │                                    │
│              │  HTTPS / JWT                    │  HTTPS / JWT                     │
│              └────────────────┬───────────────┘                                     │
│                               ▼                                                    │
│   ┌────────────────────────────────────────────────────────────────────────────┐ │
│   │                        API (NestJS)  :3000                                  │ │
│   │   Auth • Stores • Employees • Tickets • Sales • Payment (adapter layer)    │ │
│   │   Inventory • Categories • Customers • Vendors • PurchaseOrders • Refunds   │ │
│   │   Reports • Disputes • TimeClock • Notifications • Schedule (cron)         │ │
│   └─────────────────────────────────────┬────────────────────────────────────┘ │
│                                          │                                         │
│              ┌───────────────────────────┼───────────────────────────┐             │
│              ▼                           ▼                           ▼             │
│   ┌──────────────────┐      ┌──────────────────┐      ┌──────────────────┐         │
│   │   PostgreSQL     │      │      Redis       │      │  (Optional)       │         │
│   │   (Primary DB)   │      │  Cache / BullMQ  │      │  Twilio / SMTP    │         │
│   └──────────────────┘      └──────────────────┘      └──────────────────┘         │
│                                                                                    │
└──────────────────────────────────────────────────────────────────────────────────┘
```

### 2.2 Request Flow

1. User opens **Web** or **Owner** app in browser.
2. **Login:** store email + PIN → API returns JWT (contains `employeeId`, `storeId`, `role`).
3. All subsequent API calls send `Authorization: Bearer <JWT>` and optional `X-Store-Id`.
4. API validates JWT, resolves store context, enforces role-based access, reads/writes PostgreSQL (and Redis when used).
5. **Payments:** Card flows go through the payment adapter (Stub/Stripe/Adyen/etc.); idempotency keys prevent double charge; Sale is set to PAID only after provider confirms (SUCCEEDED).
6. Notifications (SMS/Email) are sent by the API when configured (Twilio, SMTP).

### 2.3 Authentication Model

- **Store-centric:** One store has one `storeEmail`; employees have a **PIN** (hashed) per store.
- **Login:** `POST /auth/login` with `{ storeEmail, pin }` → JWT.
- **Registration:** Creates **Owner** + **Store** + first **Employee** (role OWNER) in one transaction; returns JWT.
- **Roles (StoreRole):** `OWNER` | `MANAGER` | `TECHNICIAN` | `CASHIER` | `VIEWER`. Access control is enforced in API via guards and service logic.

---

## 3. Repository & Codebase Structure

### 3.1 Repository Layout

```
fixweb-1/                              # Git repo root
├── cloudbuild.yaml                    # CI/CD: build images, push, deploy to Cloud Run
└── pos-repair-platform/                # Monorepo root
    ├── package.json                   # Workspace root (dev:api, dev:web, dev:owner, build:*)
    ├── docker-compose.yml             # Local: postgres, redis, api, web, owner
    ├── .env.example                   # Env template for local/Docker
    ├── ARCHITECTURE_AND_STATE.md      # This document
    ├── apps/
    │   ├── api/                       # NestJS backend
    │   ├── web/                       # Next.js store app (Fixlytiq UI)
    │   └── owner/                     # Next.js owner/admin app
    ├── packages/
    │   ├── api-client/                # Shared API client (owner uses this)
    │   ├── types/                     # Shared TypeScript types
    │   └── tsconfig/                  # Shared tsconfig base
    └── scripts/                       # GCP, Cloud SQL, deployment helpers
```

### 3.2 Apps Overview

| App | Path | Stack | Port (local) | Purpose |
|-----|------|--------|----------------|--------|
| **API** | `apps/api/` | NestJS, Prisma, Redis, @nestjs/schedule | 3000 | Backend: REST API, auth, business logic, payment abstraction, DB, cron, notifications |
| **Web** | `apps/web/` | Next.js (App Router), React, Tailwind | 3001 | Store staff: tickets, POS (Cash/Card + idempotency), inventory, customers, reports, settings |
| **Owner** | `apps/owner/` | Next.js, React Query, Tailwind | 3002 | Owners/admins: multi-store, reports, team, notifications, refunds, settings |

### 3.3 API Source Structure (`apps/api/src/`)

```
api/src/
├── main.ts                        # Bootstrap, CORS (FRONTEND_URL), global validation pipe
├── app.module.ts                  # Imports all feature modules + ScheduleModule, PaymentModule
├── app.controller.ts              # Health check
├── prisma/                        # PrismaModule, PrismaService
├── redis/                         # Redis config & module (GCP Memorystore–aware)
├── queue/                         # QueueModule (BullMQ)
├── auth/                          # Login (PIN), register, JWT strategy, roles guard
├── stores/                        # CRUD stores, tenant context
├── employees/                     # CRUD employees (store-scoped)
├── time-clock/                    # Clock in/out
├── tickets/                       # Full ticket lifecycle, notes, waivers
├── sales/                         # Sales, line items; CASH vs CARD flow; calls PaymentService for card
├── payment/                       # Provider-agnostic payment layer
│   ├── interfaces/
│   │   └── payment.interface.ts   # PaymentInterface: authorize, capture, refund, void, retrieve
│   ├── adapters/
│   │   ├── stub.adapter.ts        # StubAdapter (dev/testing; always succeeds)
│   │   └── index.ts
│   ├── constants.ts               # Internal error codes (DECLINED, NETWORK_ERROR, etc.)
│   ├── payment.service.ts         # Idempotency, confirmPayment, reconciliation cron
│   └── payment.module.ts          # Provides PaymentInterface (StubAdapter), PaymentService
├── refunds/                       # Refunds linked to sales
├── inventory/                     # Stock items, categories, adjustments
├── categories/                    # Categories (store-scoped)
├── customers/                     # Customers
├── vendors/                       # Vendors (store-scoped)
├── purchase-orders/               # Purchase orders and items
├── reports/                       # Summary, sales, tickets, inventory-low
├── disputes/                      # Disputes and evidence
├── notifications/                 # Notification history, SMS/Email sending
└── utils/                         # Helpers (e.g. database-url)
```

### 3.4 Web App Routes (`apps/web/src/app/`)

| Route | Purpose |
|-------|---------|
| `/` | Landing |
| `/login` | Store email + PIN login |
| `/register` | New store + owner registration |
| `/(dashboard)/dashboard` | Dashboard |
| `/(dashboard)/tickets` | Ticket list |
| `/(dashboard)/tickets/new` | New ticket (pre/post repair forms, waiver) |
| `/(dashboard)/tickets/[id]` | Ticket detail |
| `/(dashboard)/pos` | Point of sale (Cash / Card; idempotency key per attempt) |
| `/(dashboard)/inventory` | Inventory & categories |
| `/(dashboard)/customers` | Customers |
| `/(dashboard)/vendors` | Vendors |
| `/(dashboard)/purchase-orders` | Purchase orders |
| `/(dashboard)/reports` | Reports |
| `/(dashboard)/disputes` | Disputes |
| `/(dashboard)/settings` | Store settings, employees |

### 3.5 Owner App Routes (`apps/owner/src/app/owner/`)

| Route | Purpose |
|-------|---------|
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
- **Ticket** – Repair job: title, description, status (RECEIVED → … → COMPLETED/CANCELLED), customer, technician, costs, timestamps. Has **TicketNote** and **TicketWaiver**.
- **Sale** – Store, optional ticket/customer, **paymentStatus** (default PENDING), subtotal/tax/total, line items. Only set to PAID after payment provider confirms (for card) or immediately (cash). Has **SaleLineItem**, **PaymentTransaction**, **Refund**.
- **PaymentTransaction** – One per payment attempt; unique **idempotencyKey**; status **TransactionStatus**; provider name, providerTransactionId; masked request/response payloads; internalErrorCode. Used for double-charge guard and reconciliation.
- **SaleLineItem** – Links sale to stock item, quantity, unit/total price.
- **StockItem** – Store, SKU, name, category, unit cost/price, reorder point, quantity on hand.
- **Category** – Store-scoped name for grouping stock items.
- **StockMovement** – Immutable ledger: stock item, store, quantity change, reason (SALE, PURCHASE, ADJUSTMENT, etc.), optional ticket/PO/sale line reference.
- **Vendor** – Store-scoped; name, contact, email, phone, website.
- **PurchaseOrder** / **PurchaseOrderItem** – PO linked to vendor and store; items can link to StockItem. Receiving creates stock movements.
- **TimeClock** – Employee clock in/out/break for a store.
- **Dispute** / **DisputeEvidence** – Dispute linked to store, optional ticket, status, evidence.
- **NotificationHistory** – Store, type, channel, recipient, ticket/sale ref, read/sent timestamps.
- **WaiverTemplate** – Store-specific waiver text for tickets.
- **User** / **Membership** / **StoreUserRole** – Multi-tenant user model (some flows use Owner+Employee).

### 4.2 Enums (Prisma)

- **TicketStatus:** RECEIVED, IN_PROGRESS, AWAITING_PARTS, READY, COMPLETED, CANCELLED
- **StoreRole:** OWNER, MANAGER, TECHNICIAN, CASHIER, VIEWER
- **PaymentStatus:** PENDING, AUTHORIZED, PAID, REFUNDED, VOID, FAILED
- **TransactionStatus:** PENDING, AUTHORIZED, FAILED, SUCCEEDED, UNKNOWN (per-attempt provider handshake; Sale becomes PAID only after SUCCEEDED)
- **PurchaseOrderStatus:** DRAFT, SUBMITTED, ORDERED, RECEIVED, CANCELLED
- **StockMovementReason:** SALE, PURCHASE, ADJUSTMENT, RETURN, TRANSFER, RESERVATION, RELEASE
- **DisputeStatus:** OPEN, UNDER_REVIEW, RESOLVED, DISMISSED
- **NotificationType / NotificationChannel:** e.g. TICKET_STATUS_UPDATE, SMS, EMAIL, etc.

### 4.3 Migrations

Migrations live under `apps/api/prisma/migrations/` and are applied in **name order**. Pending (not yet applied): migration adding **PaymentTransaction**, **TransactionStatus** enum, **FAILED** to PaymentStatus, and Sale default PENDING. Run when DB is available:

```bash
cd pos-repair-platform/apps/api && npx prisma migrate dev --name add_payment_transaction_and_states
```

Existing migrations include: init, remove_organization_add_owner_employee, add_categories, add_tax_rate_to_store, add_notification_history, add_store_phone_email, ensure_store_tax_rate. Schema is applied in production by the **Cloud Run Job** `pos-repair-migrate` (runs `prisma migrate deploy` with `RUN_MIGRATIONS_ONLY=1`).

---

## 5. Payment System (Provider-Agnostic)

### 5.1 Design Principles

- **PCI:** Raw card data never touches Fixlytiq servers. Frontend sends card data only to the provider; provider returns a **token**; backend stores and uses only the token.
- **Provider-agnostic:** Core logic depends only on **PaymentInterface**; adapters (Stub, Stripe, Adyen, Square) implement the interface and map provider errors to internal codes.
- **Idempotency:** Every card transaction request includes a unique **idempotency key** (e.g. `pos_<timestamp>_<random>`). If the same key is sent again, the API returns the result of the first request and does not process again (no double charge).
- **State safety:** Sale is set to **PAID** and inventory is deducted only after the provider returns **SUCCEEDED**. Intermediate states (PENDING, AUTHORIZED, FAILED, UNKNOWN) are stored on **PaymentTransaction**.

### 5.2 Payment Interface & Adapters

- **PaymentInterface** (`payment/interfaces/payment.interface.ts`): `authorize()`, `capture()`, `refund()`, `void()`, `retrieve()`. All return a normalized **TransactionStatusResult** (PENDING | AUTHORIZED | FAILED | SUCCEEDED | UNKNOWN).
- **StubAdapter** (`payment/adapters/stub.adapter.ts`): Implements the interface; always returns SUCCEEDED with a fake provider id. Used for development and provider-agnostic flow testing.
- **Internal error codes** (`payment/constants.ts`): DECLINED, INSUFFICIENT_FUNDS, INVALID_TOKEN, EXPIRED_CARD, NETWORK_ERROR, TIMEOUT, PROVIDER_ERROR, UNKNOWN. Real adapters map provider errors to these.

### 5.3 Flow: CASH vs CARD

| Step | CASH | CARD |
|------|------|------|
| 1 | Create Sale (PAID) + SaleLineItems + StockMovement (deduct) in one transaction | Create Sale (PENDING) + SaleLineItems only (no deduction) |
| 2 | — | Create PaymentTransaction (PENDING, idempotencyKey); call adapter.capture(amountCents, currency, { idempotencyKey, token }) |
| 3 | — | On SUCCEEDED: update Sale to PAID, set paidAt; run deductInventoryForSale(saleId) |
| 4 | — | On FAILED/UNKNOWN: leave Sale PENDING; return error to client (no inventory deduction) |

**Idempotency:** If the client resends the same `idempotencyKey` (e.g. retry after timeout), the API finds the existing PaymentTransaction and returns that result without calling the adapter again.

### 5.4 Reconciliation Worker

- **Purpose:** Sync transactions stuck in PENDING or UNKNOWN (e.g. timeout/network) with the provider.
- **Logic:** Every hour (cron `0 * * * *`), find PaymentTransaction with status PENDING or UNKNOWN, createdAt &gt; 10 minutes ago, and non-null providerTransactionId; call `adapter.retrieve(providerTransactionId)`; update PaymentTransaction and, if provider reports SUCCEEDED, set Sale to PAID and optionally run inventory deduction if not already done.
- **Logging:** requestPayload and responsePayload on PaymentTransaction are masked (no card/token); used for disputes and auditing.

### 5.5 Web POS Integration

- On “Process Payment,” the POS generates a single **idempotency key** per modal open (e.g. `pos_<Date.now()>_<random>`).
- User selects **Cash** or **Card / Device**; on “Complete payment,” the client sends `paymentMethod: 'CASH' | 'CARD'`, and for CARD also `idempotencyKey` (and optionally `paymentToken` when a real provider is used).
- Sales API `create()` accepts `paymentMethod`, `idempotencyKey`, `paymentToken`; backend branches on paymentMethod and runs the flow above.

---

## 6. API Surface (Backend)

### 6.1 Auth

- `POST /auth/register` – Register new store + owner + first employee (OWNER). Body: ownerName, storeName, storeEmail, storePhone?, notificationEmail?, pin.
- `POST /auth/login` – Login with storeEmail + pin. Returns JWT and store/employee info.

### 6.2 Protected Endpoints (JWT + store/role)

All below are store-scoped where applicable; many use `@Roles()` and role guards.

- **Stores:** CRUD (create additional store, update store).
- **Employees:** Create, list, update, delete (store-scoped).
- **Time clock:** Clock in, clock out.
- **Tickets:** Full CRUD, notes, status updates.
- **Sales:** Create sale (body: lineItems, paymentMethod, idempotencyKey for CARD, paymentToken optional); list; get by id. Create sale creates Sale + line items; for CARD calls PaymentService.confirmPayment and deducts inventory only on SUCCEEDED.
- **Refunds:** Create refund, list.
- **Inventory:** Stock items CRUD, categories, adjust stock.
- **Categories:** CRUD (store-scoped).
- **Customers:** CRUD.
- **Vendors:** CRUD (store-scoped).
- **Purchase orders:** CRUD, order items.
- **Reports:** Summary, sales report, tickets report, inventory-low report (query params: date range, storeId where applicable).
- **Disputes:** CRUD, evidence.
- **Notifications:** List notification history, mark read, etc.

**Payment** is used internally by Sales (no public “payment” controller required for current flow). Optional: add `POST /payments/reconcile` (admin) that calls `PaymentService.runReconciliation()`.

### 6.3 Web API Client Modules (`apps/web/src/lib/api/`)

The Web app uses typed clients: auth, stores, employees, tickets, sales (with paymentMethod, idempotencyKey, paymentToken), refunds, inventory, categories, customers, vendors, purchase-orders, reports, disputes, time-clock. Owner app uses `packages/api-client` and `apps/owner/src/lib/api.ts` for similar coverage.

---

## 7. Frontend Applications

### 7.1 Web (Store App)

- **Framework:** Next.js (App Router), React, TypeScript.
- **UI:** Tailwind CSS, Radix-style components, dark/light theme (storage key `fixlytiq-theme`).
- **Auth:** AuthProvider (context), login/register pages, JWT stored and sent via api-client.
- **Features:** Dashboard, tickets (list/new/detail with pre/post repair forms and waiver), **POS with Cash/Card and idempotency key**, inventory, customers, vendors, purchase orders, reports, disputes, settings (store + employees).

### 7.2 Owner App

- **Framework:** Next.js, React, TypeScript, React Query (TanStack Query).
- **UI:** Tailwind, theme (storage key `fixlytiq-owner-theme`).
- **Auth:** Owner login flow; access control for owner/admin views.
- **Features:** Multi-store, dashboard, team (employees), tickets, inventory, customers, refunds, reports, notifications, POS insights, settings.

---

## 8. Infrastructure & Deployment

### 8.1 Local Development

- **Option A – Docker:** `docker-compose up -d` runs PostgreSQL (5433), Redis (6380), API (3000), Web (3001), Owner (3002). See `docker-compose.yml`.
- **Option B – Local processes:** Run Postgres and Redis locally (or in Docker), then:
  - `npm run dev:api` (API :3000)
  - `npm run dev:web` (Web :3001)
  - `npm run dev:owner` (Owner :3002)
- **Env:** Copy `.env.example` to `.env` and set `DATABASE_URL`, `REDIS_*`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`, etc.

### 8.2 Production (Google Cloud Platform)

| Component | Technology |
|-----------|------------|
| **Compute** | Cloud Run (API, Web, Owner as separate services) |
| **Database** | Cloud SQL for PostgreSQL (private IP, VPC) |
| **Cache** | Memorystore for Redis (private IP, VPC) |
| **Networking** | VPC (custom network + subnet), VPC Access Connector for Cloud Run → VPC |
| **Images** | Artifact Registry |
| **CI/CD** | Cloud Build: trigger on push to `main`; build Docker images from `pos-repair-platform/`, push to Artifact Registry, deploy to Cloud Run |

### 8.3 Cloud Build Pipeline (Root `cloudbuild.yaml`)

1. Validate `_DATABASE_URL` (e.g. private IP only).
2. Build (from `dir: pos-repair-platform`): Docker build for API, Web, Owner (with `NEXT_PUBLIC_API_URL` build arg).
3. Push images to Artifact Registry.
4. Deploy migrate job; run migrations (`prisma migrate deploy`).
5. Deploy API, Web, Owner; update traffic to latest revision.

**Substitution variables (trigger):** `_VPC_CONNECTOR`, `_DATABASE_URL`, `_REDIS_HOST`, `_JWT_SECRET`, `_FRONTEND_URL`, `_PROJECT_NUMBER`.

### 8.4 Environment Variables (Production)

- **API:** `DATABASE_URL` (private IP), `REDIS_HOST`, `REDIS_PORT`, `REDIS_PASSWORD`, `JWT_SECRET`, `NODE_ENV`, `PORT=8080`, `FRONTEND_URL`. Optional: Twilio, SMTP.
- **Web/Owner:** `NEXT_PUBLIC_API_URL` (build-time), `NODE_ENV`, `PORT=8080`.

---

## 9. Implementation Progress

### 9.1 Completed

- **Auth:** PIN-based login and registration (store + owner + first employee), JWT and role guards.
- **Stores:** CRUD, store-scoped tenancy.
- **Employees:** CRUD, store-scoped, role assignment.
- **Tickets:** Full lifecycle, notes, waivers (template + signed waiver), status workflow.
- **Sales & Refunds:** Sales with line items; refunds linked to sales.
- **Payment abstraction:**
  - PaymentInterface and StubAdapter; internal error codes.
  - Idempotency via PaymentTransaction.idempotencyKey; double-charge guard.
  - CASH: Sale PAID + inventory deduction in one step. CARD: Sale PENDING → adapter capture → on SUCCEEDED set PAID and deduct inventory.
  - Reconciliation cron (hourly) for PENDING/UNKNOWN &gt; 10 min; masked request/response logging.
- **Inventory:** Stock items, categories, adjustments, stock movements (ledger).
- **Customers & Vendors:** CRUD, store-scoped where applicable.
- **Purchase orders:** CRUD, purchase order items.
- **Reports:** Summary, sales, tickets, inventory-low (API + Web/Owner UI).
- **Disputes:** Dispute and evidence entities and API.
- **Time clock:** Clock in/out.
- **Notifications:** Notification history; optional Twilio (SMS) and SMTP (email).
- **Web app:** All dashboard pages; POS with Cash/Card and idempotency; pre/post repair forms; waiver and legal copy.
- **Owner app:** Multi-store, team, tickets, inventory, customers, refunds, reports, notifications, settings.
- **Database:** Prisma schema including PaymentTransaction, TransactionStatus, Sale default PENDING; migrations (run new migration when DB available).
- **Docker & GCP:** Dockerfiles and docker-compose; Cloud Run (API, Web, Owner), migrate job, Cloud SQL (private IP), Memorystore Redis, VPC connector, Artifact Registry, Cloud Build.

### 9.2 Partially Done / Optional

- **Queue (BullMQ):** Queue module present; background jobs can be extended.
- **Real payment provider:** Stripe/Adyen/Square adapter implementing PaymentInterface; frontend tokenization; swap StubAdapter in PaymentModule.
- **Organization/User model:** Schema has User, Membership, StoreUserRole; some flows use Owner+Employee.
- **Offline POS / store-and-forward:** Not implemented; blueprint describes local queue + background sync and max offline limit.
- **Mobile app:** Not present (web + owner only).
- **AI dispute assistant, hardware (scanners, printers):** Not implemented.

### 9.3 Not Started (from blueprint)

- Customer portal (repair tracking, payments).
- Warranty management.
- Demand forecasting / ML.

---

## 10. Current State & Known Issues

### 10.1 Deployment State

- **GCP:** Cloud Run (API, Web, Owner), Cloud Run Job (migrate), Cloud SQL (private IP), Memorystore Redis, VPC connector, Artifact Registry, Cloud Build trigger on push to `main`.
- **Trigger substitution:** `_DATABASE_URL` (private IP), `_VPC_CONNECTOR`, `_REDIS_HOST`, `_JWT_SECRET`, `_FRONTEND_URL`, `_PROJECT_NUMBER`.

### 10.2 Application URLs (After Successful Deploy)

- **API:** e.g. `https://pos-repair-api-<project-number>.us-central1.run.app`
- **Web:** e.g. `https://pos-repair-web-<project-number>.us-central1.run.app`
- **Owner:** e.g. `https://pos-repair-owner-<project-number>.us-central1.run.app`

### 10.3 Codebase Health

- **Linting:** ESLint/Prettier as configured in the monorepo.
- **Tests:** API has `app.controller.spec.ts`; no project-wide test suite in root scripts.
- **Build:** API build may fail due to **pre-existing** TS strictness in a few DTOs (disputes, purchase-orders, vendors: “property has no initializer”). Payment and sales code compiles; fixing those DTOs (e.g. `!` or optional) will allow full API build.
- **Migrations:** New payment schema (PaymentTransaction, TransactionStatus, Sale default PENDING, FAILED in PaymentStatus) requires running `prisma migrate dev` (or deploy with migrate job) when database is available.

### 10.4 Security & Config

- **Secrets:** JWT secret, DB passwords, and API keys in env/trigger substitution (not committed). `.gcp-config` is gitignored.
- **CORS:** API uses `FRONTEND_URL` in production to allow Web and Owner origins.
- **PCI:** No raw card data on backend; only provider tokens when using a real payment provider.

---

## 11. References

- **This document** – Single source of truth for Fixlytiq: architecture, repo structure, data model, payment system, API, frontends, infrastructure, progress, and deployment.
- **Local run:** Copy `.env.example` to `.env`; set `DATABASE_URL`, `REDIS_*`, `JWT_SECRET`, `NEXT_PUBLIC_API_URL`; use `docker-compose up` or `npm run dev:api`, `dev:web`, `dev:owner`.
- **Production:** Set Cloud Build trigger substitution variables; push to `main` to build and deploy.
- **Payment:** See [§5 Payment System](#5-payment-system-provider-agnostic) for adapter design, idempotency, reconciliation, and PCI approach.

---

*Update this file when architecture, structure, payment flow, or deployment changes.*
