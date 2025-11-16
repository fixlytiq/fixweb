import { StoreRole } from '@prisma/client';

export interface UserPayload {
  employeeId: string;
  storeId: string;
  role: StoreRole;
}


