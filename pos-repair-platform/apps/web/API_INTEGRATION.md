# Frontend API Integration Guide

This guide explains how the Next.js frontend connects to the NestJS backend API.

## Overview

The frontend uses a centralized API client to communicate with the backend API running on `http://localhost:3000`. All API requests are authenticated using JWT tokens stored in localStorage.

## Architecture

### 1. API Client (`src/lib/api-client.ts`)

The `ApiClient` class provides a centralized way to make authenticated HTTP requests to the backend.

**Features:**
- Automatic JWT token management
- Token storage in localStorage
- Error handling with custom error types
- Support for GET, POST, PATCH, DELETE methods
- Query parameter support

**Usage:**
```typescript
import { apiClient } from '@/lib/api-client';

// GET request
const stores = await apiClient.get<Store[]>('/stores');

// POST request
const newStore = await apiClient.post<Store>('/stores', {
  name: 'New Store',
  timezone: 'America/Chicago'
});

// PATCH request
const updatedStore = await apiClient.patch<Store>('/stores/123', {
  name: 'Updated Store Name'
});

// DELETE request
await apiClient.delete<void>('/stores/123');
```

### 2. Authentication Context (`src/contexts/auth-context.tsx`)

The `AuthProvider` component manages authentication state throughout the application.

**Features:**
- User authentication state
- JWT token management
- Login/Register/Logout functions
- Automatic token persistence in localStorage
- Store selection for multi-store users

**Usage:**
```typescript
import { useAuth } from '@/contexts/auth-context';

function MyComponent() {
  const { user, isAuthenticated, login, logout } = useAuth();

  const handleLogin = async () => {
    try {
      await login('user@example.com', 'password');
      // User is automatically redirected to dashboard
    } catch (error) {
      console.error('Login failed:', error);
    }
  };

  return (
    <div>
      {isAuthenticated ? (
        <p>Welcome, {user?.firstName}!</p>
      ) : (
        <button onClick={handleLogin}>Login</button>
      )}
    </div>
  );
}
```

### 3. API Service Modules (`src/lib/api/`)

Organized API service functions for different modules:

- **`auth.ts`** - Authentication endpoints (login, register)
- **`stores.ts`** - Store management endpoints
- **`employees.ts`** - Employee management endpoints
- **`inventory.ts`** - Inventory management endpoints
- **`time-clock.ts`** - Time clock endpoints
- **`refunds.ts`** - Refund management endpoints

**Usage:**
```typescript
import { storesApi } from '@/lib/api/stores';
import { inventoryApi } from '@/lib/api/inventory';

// Get all stores
const stores = await storesApi.findAll();

// Get inventory items for a specific store
const items = await inventoryApi.findAll('store-id-123');

// Create a new inventory item
const newItem = await inventoryApi.create('store-id-123', {
  sku: 'IPH14-SCR-001',
  name: 'iPhone 14 Screen',
  unitPrice: 150.00,
  quantityOnHand: 10
});
```

## Environment Configuration

### `.env.local`

Create a `.env.local` file in the `apps/web` directory:

```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:3000

# Environment
NEXT_PUBLIC_ENV=development
```

The `NEXT_PUBLIC_API_URL` is used by the API client to determine the backend API base URL.

## Authentication Flow

1. **Login:**
   - User submits email and password
   - Frontend calls `POST /auth/login` with credentials
   - Backend validates credentials and returns JWT token
   - Frontend stores token in localStorage and redirects to dashboard

2. **Protected Routes:**
   - Dashboard layout checks authentication status
   - If not authenticated, redirects to login page
   - If authenticated, renders protected content

3. **API Requests:**
   - All API requests include JWT token in `Authorization` header
   - Format: `Authorization: Bearer <token>`
   - Backend validates token and extracts user information

4. **Logout:**
   - User clicks logout button
   - Frontend clears token from localStorage
   - User is redirected to login page

## Available API Endpoints

### Authentication
- `POST /auth/login` - Login with email and password
- `POST /auth/register` - Register a new user

### Stores
- `GET /stores` - Get all stores (filtered by user access)
- `GET /stores/:id` - Get a specific store
- `POST /stores` - Create a new store
- `PATCH /stores/:id` - Update a store
- `DELETE /stores/:id` - Delete a store

### Employees
- `GET /employees` - Get all employees
- `GET /employees/:id` - Get a specific employee
- `POST /employees` - Create a new employee
- `POST /employees/assign` - Assign employee to a store
- `DELETE /employees/:userId/stores/:storeId` - Remove employee from store

### Inventory
- `GET /inventory` - Get all inventory items (optional `storeId` query param)
- `GET /inventory/:id` - Get a specific inventory item
- `POST /inventory/:storeId` - Create a new inventory item (Owner/Manager only)
- `PATCH /inventory/:id/:storeId` - Update an inventory item (Owner/Manager only)
- `POST /inventory/:id/adjust` - Adjust stock quantity (Owner/Manager only)
- `DELETE /inventory/:id/:storeId` - Delete an inventory item (Owner/Manager only)

### Time Clock
- `POST /time-clock/clock-in` - Clock in (requires `storeId`)
- `POST /time-clock/clock-out` - Clock out (requires `storeId`)
- `GET /time-clock/my-clocks` - Get user's time clock records (optional `storeId` query param)
- `GET /time-clock/active` - Get active clock-in record (optional `storeId` query param)

### Refunds
- `GET /refunds` - Get all refunds (optional `storeId` query param)
- `GET /refunds/:id` - Get a specific refund
- `POST /refunds` - Create a refund (Owner/Manager only)

## Error Handling

The API client automatically handles errors and throws `ApiClientError` exceptions:

```typescript
import { ApiClientError } from '@/lib/api-client';

try {
  const stores = await storesApi.findAll();
} catch (error) {
  if (error instanceof ApiClientError) {
    console.error('API Error:', error.message);
    console.error('Status Code:', error.statusCode);
  }
}
```

## Data Isolation

The backend automatically filters data based on the authenticated user's:
- **Organization ID** - Users can only access data from their organization
- **Accessible Store IDs** - Users can only access stores they have access to
- **Role** - Users can only perform actions allowed by their role

The frontend doesn't need to manually filter data - the backend handles this automatically.

## Store Selection

For users with access to multiple stores, the frontend allows store selection:

```typescript
import { useAuth } from '@/contexts/auth-context';

function StoreSelector() {
  const { user, setCurrentStore } = useAuth();

  const handleStoreChange = (storeId: string) => {
    setCurrentStore(storeId);
  };

  return (
    <select onChange={(e) => handleStoreChange(e.target.value)}>
      {user?.accessibleStoreIds?.map(storeId => (
        <option key={storeId} value={storeId}>{storeId}</option>
      ))}
    </select>
  );
}
```

## Example: Updating a Page to Use Real API

### Before (Using Mock Data):
```typescript
import { mockStores } from '@/lib/mock-data';

export default function StoresPage() {
  const stores = mockStores;
  return <div>{/* Render stores */}</div>;
}
```

### After (Using Real API):
```typescript
'use client';

import { useEffect, useState } from 'react';
import { storesApi, Store } from '@/lib/api/stores';

export default function StoresPage() {
  const [stores, setStores] = useState<Store[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchStores = async () => {
      try {
        setIsLoading(true);
        const data = await storesApi.findAll();
        setStores(data);
      } catch (err: any) {
        setError(err.message || 'Failed to load stores');
      } finally {
        setIsLoading(false);
      }
    };

    fetchStores();
  }, []);

  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error: {error}</div>;

  return <div>{/* Render stores */}</div>;
}
```

## Testing the Integration

1. **Start the Backend:**
   ```powershell
   cd pos-repair-platform/apps/api
   npm run start:dev
   ```

2. **Start the Frontend:**
   ```powershell
   cd pos-repair-platform/apps/web
   npm run dev
   ```

3. **Test Login:**
   - Navigate to `http://localhost:3001/login`
   - Enter credentials (must be registered in the database)
   - Should redirect to dashboard on success

4. **Test API Calls:**
   - Open browser developer tools
   - Check Network tab for API requests
   - Verify JWT token is included in Authorization header
   - Check responses for data

## Troubleshooting

### Common Issues

1. **CORS Errors:**
   - Ensure backend CORS is configured to allow requests from `http://localhost:3001`
   - Check `main.ts` in the backend for CORS configuration

2. **401 Unauthorized:**
   - Check if JWT token is stored in localStorage
   - Verify token is included in Authorization header
   - Check if token has expired
   - Re-login to get a new token

3. **403 Forbidden:**
   - User doesn't have permission for the requested action
   - Check user's role and store access

4. **404 Not Found:**
   - Verify API endpoint URL is correct
   - Check if backend server is running
   - Verify route exists in backend controller

5. **Network Errors:**
   - Verify backend is running on `http://localhost:3000`
   - Check `.env.local` has correct `NEXT_PUBLIC_API_URL`
   - Verify firewall/antivirus isn't blocking requests

## Next Steps

1. Update remaining pages to use real API calls instead of mock data
2. Add loading states and error handling to all API calls
3. Implement store selection UI for multi-store users
4. Add API response caching for better performance
5. Implement refresh token mechanism for token renewal
6. Add request interceptors for logging and monitoring

