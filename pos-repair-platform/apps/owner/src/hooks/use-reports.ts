import { useQuery } from '@tanstack/react-query';
import { reportsApi } from '@/lib/api';
import type { ReportSummary, SalesReport, TicketsReport, InventoryLowReport } from '@/lib/types';

// Query keys
export const reportKeys = {
  all: ['reports'] as const,
  summary: (from?: string, to?: string, storeId?: string) =>
    [...reportKeys.all, 'summary', { from, to, storeId }] as const,
  sales: (from?: string, to?: string, storeId?: string) =>
    [...reportKeys.all, 'sales', { from, to, storeId }] as const,
  tickets: (from?: string, to?: string, storeId?: string) =>
    [...reportKeys.all, 'tickets', { from, to, storeId }] as const,
  inventoryLow: (threshold?: number, storeId?: string) =>
    [...reportKeys.all, 'inventory-low', { threshold, storeId }] as const,
};

// Fetch summary report
export function useReportSummary(from?: string, to?: string, storeId?: string) {
  return useQuery({
    queryKey: reportKeys.summary(from, to, storeId),
    queryFn: () => reportsApi.summary(from, to, storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch sales report
export function useSalesReport(from?: string, to?: string, storeId?: string) {
  return useQuery({
    queryKey: reportKeys.sales(from, to, storeId),
    queryFn: () => reportsApi.sales(from, to, storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch tickets report
export function useTicketsReport(from?: string, to?: string, storeId?: string) {
  return useQuery({
    queryKey: reportKeys.tickets(from, to, storeId),
    queryFn: () => reportsApi.tickets(from, to, storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

// Fetch inventory low report
export function useInventoryLowReport(threshold?: number, storeId?: string) {
  return useQuery({
    queryKey: reportKeys.inventoryLow(threshold, storeId),
    queryFn: () => reportsApi.inventoryLow(threshold, storeId),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });
}

