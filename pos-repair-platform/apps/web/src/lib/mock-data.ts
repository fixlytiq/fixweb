// Mock data based on Prisma schema

export type TicketStatus = "RECEIVED" | "IN_PROGRESS" | "AWAITING_PARTS" | "READY" | "COMPLETED" | "CANCELLED";
export type PaymentStatus = "PENDING" | "AUTHORIZED" | "PAID" | "REFUNDED" | "VOID";
export type StoreRole = "OWNER" | "MANAGER" | "TECHNICIAN" | "CASHIER" | "VIEWER";

export interface Organization {
  id: string;
  name: string;
  createdAt: string;
}

export interface Store {
  id: string;
  organizationId: string;
  name: string;
  timezone: string;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
}

export interface Customer {
  id: string;
  organizationId: string;
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
}

export interface Ticket {
  id: string;
  organizationId: string;
  storeId: string;
  customerId?: string;
  technicianId?: string;
  title: string;
  description?: string;
  status: TicketStatus;
  estimatedCost?: number;
  subtotal?: number;
  tax?: number;
  total?: number;
  scheduledAt?: string;
  startedAt?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  customer?: Customer;
  technician?: User;
}

export interface StockItem {
  id: string;
  organizationId: string;
  storeId: string;
  sku: string;
  name: string;
  description?: string;
  unitCost?: number;
  unitPrice?: number;
  reorderPoint?: number;
  quantityOnHand: number;
}

export interface Sale {
  id: string;
  organizationId: string;
  storeId: string;
  ticketId?: string;
  customerId?: string;
  paymentStatus: PaymentStatus;
  reference?: string;
  subtotal?: number;
  tax?: number;
  total?: number;
  paidAt?: string;
  createdAt: string;
  customer?: Customer;
}

// Mock Data
export const mockOrganizations: Organization[] = [
  { id: "org-1", name: "TechRepair Inc", createdAt: "2024-01-15T00:00:00Z" },
];

export const mockStores: Store[] = [
  { id: "store-1", organizationId: "org-1", name: "Downtown Location", timezone: "America/Chicago" },
  { id: "store-2", organizationId: "org-1", name: "Mall Location", timezone: "America/Chicago" },
];

export const mockCustomers: Customer[] = [
  { id: "cust-1", organizationId: "org-1", firstName: "John", lastName: "Doe", email: "john@example.com", phone: "555-0101" },
  { id: "cust-2", organizationId: "org-1", firstName: "Jane", lastName: "Smith", email: "jane@example.com", phone: "555-0102" },
  { id: "cust-3", organizationId: "org-1", firstName: "Bob", lastName: "Johnson", phone: "555-0103" },
];

export const mockUsers: User[] = [
  { id: "user-1", email: "owner@fixlytiq.com", firstName: "Admin", lastName: "User", phone: "555-1000" },
  { id: "user-2", email: "tech1@fixlytiq.com", firstName: "Mike", lastName: "Technician", phone: "555-1001" },
];

export const mockTickets: Ticket[] = [
  {
    id: "ticket-1",
    organizationId: "org-1",
    storeId: "store-1",
    customerId: "cust-1",
    technicianId: "user-2",
    title: "iPhone 14 Screen Repair",
    description: "Cracked screen, needs replacement",
    status: "IN_PROGRESS",
    estimatedCost: 150.00,
    subtotal: 150.00,
    tax: 12.00,
    total: 162.00,
    startedAt: "2024-01-20T10:00:00Z",
    createdAt: "2024-01-20T09:00:00Z",
    updatedAt: "2024-01-20T10:00:00Z",
    customer: mockCustomers[0],
    technician: mockUsers[1],
  },
  {
    id: "ticket-2",
    organizationId: "org-1",
    storeId: "store-1",
    customerId: "cust-2",
    title: "Samsung Battery Replacement",
    description: "Battery not holding charge",
    status: "AWAITING_PARTS",
    estimatedCost: 80.00,
    subtotal: 80.00,
    tax: 6.40,
    total: 86.40,
    createdAt: "2024-01-21T14:00:00Z",
    updatedAt: "2024-01-21T14:00:00Z",
    customer: mockCustomers[1],
  },
  {
    id: "ticket-3",
    organizationId: "org-1",
    storeId: "store-1",
    customerId: "cust-3",
    technicianId: "user-2",
    title: "iPad Charging Port Repair",
    description: "Port not working, needs cleaning/repair",
    status: "READY",
    estimatedCost: 120.00,
    subtotal: 120.00,
    tax: 9.60,
    total: 129.60,
    startedAt: "2024-01-19T11:00:00Z",
    createdAt: "2024-01-19T10:00:00Z",
    updatedAt: "2024-01-22T15:00:00Z",
    customer: mockCustomers[2],
    technician: mockUsers[1],
  },
  {
    id: "ticket-4",
    organizationId: "org-1",
    storeId: "store-1",
    customerId: "cust-1",
    title: "MacBook Pro Keyboard Repair",
    description: "Keys not responding",
    status: "COMPLETED",
    estimatedCost: 200.00,
    subtotal: 200.00,
    tax: 16.00,
    total: 216.00,
    startedAt: "2024-01-18T09:00:00Z",
    completedAt: "2024-01-18T16:00:00Z",
    createdAt: "2024-01-18T08:00:00Z",
    updatedAt: "2024-01-18T16:00:00Z",
    customer: mockCustomers[0],
  },
];

export const mockStockItems: StockItem[] = [
  {
    id: "item-1",
    organizationId: "org-1",
    storeId: "store-1",
    sku: "IPH14-SCR-001",
    name: "iPhone 14 Screen Assembly",
    description: "Original quality screen replacement",
    unitCost: 45.00,
    unitPrice: 150.00,
    reorderPoint: 5,
    quantityOnHand: 12,
  },
  {
    id: "item-2",
    organizationId: "org-1",
    storeId: "store-1",
    sku: "BAT-SAM-001",
    name: "Samsung Galaxy Battery",
    description: "Genuine replacement battery",
    unitCost: 25.00,
    unitPrice: 80.00,
    reorderPoint: 10,
    quantityOnHand: 8,
  },
  {
    id: "item-3",
    organizationId: "org-1",
    storeId: "store-1",
    sku: "IPAD-CHG-001",
    name: "iPad Charging Port",
    description: "Replacement charging port assembly",
    unitCost: 30.00,
    unitPrice: 120.00,
    reorderPoint: 3,
    quantityOnHand: 2,
  },
  {
    id: "item-4",
    organizationId: "org-1",
    storeId: "store-1",
    sku: "MBP-KBD-001",
    name: "MacBook Pro Keyboard",
    description: "Replacement keyboard assembly",
    unitCost: 80.00,
    unitPrice: 200.00,
    reorderPoint: 2,
    quantityOnHand: 5,
  },
];

export const mockSales: Sale[] = [
  {
    id: "sale-1",
    organizationId: "org-1",
    storeId: "store-1",
    ticketId: "ticket-4",
    customerId: "cust-1",
    paymentStatus: "PAID",
    reference: "TXN-001",
    subtotal: 200.00,
    tax: 16.00,
    total: 216.00,
    paidAt: "2024-01-18T16:30:00Z",
    createdAt: "2024-01-18T16:00:00Z",
    customer: mockCustomers[0],
  },
];

// Helper functions
export const getTicketsByStatus = (status: TicketStatus): Ticket[] => {
  return mockTickets.filter(ticket => ticket.status === status);
};

export const getLowStockItems = (): StockItem[] => {
  return mockStockItems.filter(item => item.reorderPoint && item.quantityOnHand <= item.reorderPoint);
};

export const getDashboardStats = () => {
  const openTickets = mockTickets.filter(t => !["COMPLETED", "CANCELLED"].includes(t.status)).length;
  const completedToday = mockTickets.filter(t => 
    t.status === "COMPLETED" && 
    t.completedAt && 
    new Date(t.completedAt).toDateString() === new Date().toDateString()
  ).length;
  const totalRevenue = mockSales.reduce((sum, sale) => sum + (sale.total || 0), 0);
  const lowStockCount = getLowStockItems().length;

  return {
    openTickets,
    completedToday,
    totalRevenue,
    lowStockCount,
  };
};

