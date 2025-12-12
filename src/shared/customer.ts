import { customersTable } from '@db/schema/customers';
import { InferSelectModel } from 'drizzle-orm';

export interface CreateCustomerRequest {
  name: string;
  pan?: string;
  gstin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  phone?: string;
  email?: string;
}

export interface UpdateCustomerRequest {
  id: number;
  name: string;
  pan?: string;
  gstin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pinCode?: string;
  phone?: string;
  email?: string;
}

export type Customer = InferSelectModel<typeof customersTable>;
