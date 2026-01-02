import { z } from 'zod';

export const employeeSchema = z.object({
  name: z.string().min(1, 'Employee name is required'),
  pin: z.string().min(4, 'PIN must be at least 4 characters').max(8, 'PIN must be at most 8 characters'),
  role: z.enum(['OWNER', 'MANAGER', 'TECHNICIAN', 'CASHIER', 'VIEWER'], {
    required_error: 'Role is required',
  }),
});

export type EmployeeFormData = z.infer<typeof employeeSchema>;

