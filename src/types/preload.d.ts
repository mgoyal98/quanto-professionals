import type {
  Company,
  CreateCompanyRequest,
  RecentCompany,
} from '@shared/company';
import { CreateCustomerRequest, Customer } from '@shared/customer';

declare global {
  interface Window {
    companyApi?: {
      createCompany(payload: CreateCompanyRequest): Promise<string>;
      openCompany(filePath: string): Promise<void>;
      getRecentCompanies(): Promise<RecentCompany[]>;
      chooseCompanyFile(): Promise<string | null>;
      getCompanyDetails(): Promise<Company>;
      closeCompany(): Promise<void>;
    };
    customerApi?: {
      createCustomer(payload: CreateCustomerRequest): Promise<Customer>;
      listCustomers(): Promise<Customer[]>;
      deleteCustomer(id: number, name: string): Promise<boolean>;
    };
  }
}

export {};
