import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { employeesApi } from '@/lib/api';
import type { Employee, StoreRole } from '@/lib/types';
import { toast } from 'sonner';

// Query keys
export const employeeKeys = {
  all: ['employees'] as const,
  lists: () => [...employeeKeys.all, 'list'] as const,
  list: () => [...employeeKeys.lists()] as const,
  details: () => [...employeeKeys.all, 'detail'] as const,
  detail: (id: string) => [...employeeKeys.details(), id] as const,
};

// Fetch employees
export function useEmployees() {
  return useQuery({
    queryKey: employeeKeys.list(),
    queryFn: () => employeesApi.findAll(),
    staleTime: 60 * 1000, // 1 minute
  });
}

// Fetch single employee
export function useEmployee(id: string) {
  return useQuery({
    queryKey: employeeKeys.detail(id),
    queryFn: () => employeesApi.findOne(id),
    enabled: !!id,
  });
}

// Create employee mutation
export function useCreateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: { name: string; pin: string; role: string }) =>
      employeesApi.create(data),
    onMutate: async (newEmployee) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });
      const previousEmployees = queryClient.getQueriesData({ queryKey: employeeKeys.lists() });

      queryClient.setQueriesData<Employee[]>({ queryKey: employeeKeys.lists() }, (old = []) => {
        const optimisticEmployee: Employee = {
          id: `temp-${Date.now()}`,
          name: newEmployee.name,
          role: newEmployee.role as StoreRole,
          storeId: '',
          createdAt: new Date().toISOString(),
        };
        return [...old, optimisticEmployee];
      });

      return { previousEmployees };
    },
    onError: (error: any, _, context) => {
      if (context?.previousEmployees) {
        context.previousEmployees.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to create employee');
    },
    onSuccess: () => {
      toast.success('Employee created successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

// Update employee mutation
export function useUpdateEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<Employee> }) =>
      employeesApi.update(id, data),
    onMutate: async ({ id, data }) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });
      await queryClient.cancelQueries({ queryKey: employeeKeys.detail(id) });

      const previousEmployees = queryClient.getQueriesData({ queryKey: employeeKeys.lists() });
      const previousEmployee = queryClient.getQueryData<Employee>(employeeKeys.detail(id));

      queryClient.setQueriesData<Employee[]>({ queryKey: employeeKeys.lists() }, (old = []) =>
        old.map((employee) => (employee.id === id ? { ...employee, ...data } : employee))
      );

      if (previousEmployee) {
        queryClient.setQueryData<Employee>(employeeKeys.detail(id), {
          ...previousEmployee,
          ...data,
        });
      }

      return { previousEmployees, previousEmployee };
    },
    onError: (error: any, _, context) => {
      if (context?.previousEmployees) {
        context.previousEmployees.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      if (context?.previousEmployee) {
        queryClient.setQueryData(employeeKeys.detail(context.previousEmployee.id), context.previousEmployee);
      }
      toast.error(error.message || 'Failed to update employee');
    },
    onSuccess: () => {
      toast.success('Employee updated successfully');
    },
    onSettled: (_, __, variables) => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
      queryClient.invalidateQueries({ queryKey: employeeKeys.detail(variables.id) });
    },
  });
}

// Delete employee mutation
export function useDeleteEmployee() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) => employeesApi.remove(id),
    onMutate: async (id) => {
      await queryClient.cancelQueries({ queryKey: employeeKeys.lists() });
      const previousEmployees = queryClient.getQueriesData({ queryKey: employeeKeys.lists() });

      queryClient.setQueriesData<Employee[]>({ queryKey: employeeKeys.lists() }, (old = []) =>
        old.filter((employee) => employee.id !== id)
      );

      return { previousEmployees };
    },
    onError: (error: any, _, context) => {
      if (context?.previousEmployees) {
        context.previousEmployees.forEach(([queryKey, data]) => {
          queryClient.setQueryData(queryKey, data);
        });
      }
      toast.error(error.message || 'Failed to delete employee');
    },
    onSuccess: () => {
      toast.success('Employee deleted successfully');
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: employeeKeys.lists() });
    },
  });
}

