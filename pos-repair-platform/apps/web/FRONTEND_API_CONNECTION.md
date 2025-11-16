# Frontend API Connection Guide

## Quick Start

The frontend is now fully connected to the backend API. Here's what was implemented:

### 1. Environment Configuration

Created `.env.local` file with API URL:
```env
NEXT_PUBLIC_API_URL=http://localhost:3000
```

### 2. API Client

Created a centralized API client (`src/lib/api-client.ts`) that:
- Automatically adds JWT tokens to requests
- Handles errors gracefully
- Supports GET, POST, PATCH, DELETE methods

### 3. Authentication System

Implemented authentication context (`src/contexts/auth-context.tsx`) that:
- Manages user authentication state
- Stores JWT tokens in localStorage
- Provides login/logout functions
- Protects routes automatically

### 4. API Service Modules

Created API service modules for:
- **Auth** (`src/lib/api/auth.ts`) - Login, Register
- **Stores** (`src/lib/api/stores.ts`) - Store management
- **Employees** (`src/lib/api/employees.ts`) - Employee management
- **Inventory** (`src/lib/api/inventory.ts`) - Inventory management
- **Time Clock** (`src/lib/api/time-clock.ts`) - Clock in/out
- **Refunds** (`src/lib/api/refunds.ts`) - Refund management

### 5. Updated Components

- **Login Page** - Now uses real API authentication
- **Sidebar** - Shows user information and logout functionality
- **Dashboard Layout** - Protected with authentication check

### 6. Backend CORS

Enabled CORS in the backend to allow requests from `http://localhost:3001`

## How to Use

### 1. Start the Backend

```powershell
cd pos-repair-platform/apps/api
npm run start:dev
```

The backend will run on `http://localhost:3000`

### 2. Start the Frontend

```powershell
cd pos-repair-platform/apps/web
npm run dev
```

The frontend will run on `http://localhost:3001`

### 3. Login

1. Navigate to `http://localhost:3001/login`
2. Enter your credentials (must be registered in the database)
3. On success, you'll be redirected to the dashboard

### 4. Use API in Components

```typescript
'use client';

import { useEffect, useState } from 'react';
import { storesApi, Store } from '@/lib/api/stores';
import { useAuth } from '@/contexts/auth-context';

export default function StoresPage() {
  const { user, isAuthenticated } = useAuth();
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (isAuthenticated) {
      const fetchStores = async () => {
        try {
          const data = await storesApi.findAll();
          setStores(data);
        } catch (error) {
          console.error('Failed to load stores:', error);
        } finally {
          setIsLoading(false);
        }
      };

      fetchStores();
    }
  }, [isAuthenticated]);

  if (isLoading) return <div>Loading...</div>;

  return (
    <div>
      <h1>Stores</h1>
      {stores.map(store => (
        <div key={store.id}>{store.name}</div>
      ))}
    </div>
  );
}
```

## Available API Functions

### Authentication
```typescript
import { useAuth } from '@/contexts/auth-context';

const { login, logout, user, isAuthenticated } = useAuth();

// Login
await login('user@example.com', 'password');

// Logout
logout();
```

### Stores
```typescript
import { storesApi } from '@/lib/api/stores';

// Get all stores
const stores = await storesApi.findAll();

// Get a store
const store = await storesApi.findOne('store-id');

// Create a store
const newStore = await storesApi.create({
  name: 'New Store',
  timezone: 'America/Chicago'
});

// Update a store
const updatedStore = await storesApi.update('store-id', {
  name: 'Updated Store Name'
});

// Delete a store
await storesApi.remove('store-id');
```

### Inventory
```typescript
import { inventoryApi } from '@/lib/api/inventory';

// Get all inventory items
const items = await inventoryApi.findAll();

// Get inventory for a specific store
const items = await inventoryApi.findAll('store-id');

// Create an inventory item
const newItem = await inventoryApi.create('store-id', {
  sku: 'IPH14-SCR-001',
  name: 'iPhone 14 Screen',
  unitPrice: 150.00,
  quantityOnHand: 10
});

// Update an inventory item
const updatedItem = await inventoryApi.update('item-id', 'store-id', {
  unitPrice: 160.00
});

// Adjust stock
await inventoryApi.adjustStock('item-id', {
  quantity: 5,
  reason: 'Received new shipment'
});

// Delete an inventory item
await inventoryApi.remove('item-id', 'store-id');
```

### Employees
```typescript
import { employeesApi } from '@/lib/api/employees';

// Get all employees
const employees = await employeesApi.findAll();

// Create an employee
const newEmployee = await employeesApi.create({
  email: 'employee@example.com',
  password: 'password123',
  firstName: 'John',
  lastName: 'Doe'
});

// Assign employee to store
await employeesApi.assignToStore({
  userId: 'user-id',
  storeId: 'store-id',
  role: 'TECHNICIAN'
});
```

### Time Clock
```typescript
import { timeClockApi } from '@/lib/api/time-clock';

// Clock in
await timeClockApi.clockIn({
  storeId: 'store-id',
  notes: 'Starting work'
});

// Clock out
await timeClockApi.clockOut({
  storeId: 'store-id',
  notes: 'Finished work'
});

// Get my time clocks
const timeClocks = await timeClockApi.getMyTimeClocks('store-id');

// Get active clock
const activeClock = await timeClockApi.getActiveClock('store-id');
```

### Refunds
```typescript
import { refundsApi } from '@/lib/api/refunds';

// Get all refunds
const refunds = await refundsApi.findAll('store-id');

// Create a refund
await refundsApi.create({
  saleId: 'sale-id',
  storeId: 'store-id',
  amount: 100.00,
  reason: 'Customer request'
});
```

## Error Handling

All API calls should be wrapped in try-catch blocks:

```typescript
try {
  const stores = await storesApi.findAll();
} catch (error: any) {
  console.error('API Error:', error.message);
  // Show error message to user
}
```

## Authentication Flow

1. User logs in with email and password
2. Frontend calls `POST /auth/login`
3. Backend validates credentials and returns JWT token
4. Frontend stores token in localStorage
5. All subsequent API requests include token in `Authorization` header
6. Backend validates token and extracts user information
7. Data is filtered based on user's organization and store access

## Protected Routes

The dashboard layout automatically protects all routes:
- If user is not authenticated, redirects to login
- If user is authenticated, renders the dashboard

## Next Steps

1. Update remaining pages to use real API calls instead of mock data
2. Add loading states and error handling to all API calls
3. Implement store selection UI for multi-store users
4. Add form validation for all input fields
5. Implement optimistic updates for better UX

## Troubleshooting

### CORS Errors
- Ensure backend is running on `http://localhost:3000`
- Check CORS configuration in `main.ts`
- Verify frontend URL is `http://localhost:3001`

### 401 Unauthorized
- Check if JWT token is stored in localStorage
- Verify token is included in Authorization header
- Re-login to get a new token

### 403 Forbidden
- User doesn't have permission for the requested action
- Check user's role and store access

### Network Errors
- Verify backend is running
- Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
- Verify firewall/antivirus isn't blocking requests

## Documentation

For more detailed information, see:
- `API_INTEGRATION.md` - Complete API integration guide
- `QUICK_START.md` - Backend quick start guide

