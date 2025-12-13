import type {
  Company,
  CreateCompanyRequest,
  RecentCompany,
  UpdateCompanyRequest,
} from '@shared/company';
import {
  CreateCustomerRequest,
  Customer,
  UpdateCustomerRequest,
} from '@shared/customer';

declare global {
  interface Window {
    companyApi?: {
      createCompany(payload: CreateCompanyRequest): Promise<string>;
      openCompany(filePath: string): Promise<void>;
      getRecentCompanies(): Promise<RecentCompany[]>;
      chooseCompanyFile(): Promise<string | null>;
      getCompanyDetails(): Promise<Company>;
      closeCompany(): Promise<void>;
      updateCompany(payload: UpdateCompanyRequest): Promise<Company>;
    };
    customerApi?: {
      createCustomer(payload: CreateCustomerRequest): Promise<Customer>;
      getCustomer(id: number): Promise<Customer | undefined>;
      updateCustomer(payload: UpdateCustomerRequest): Promise<Customer>;
      listCustomers(): Promise<Customer[]>;
      listArchivedCustomers(): Promise<Customer[]>;
      archiveCustomer(id: number, name: string): Promise<boolean>;
      restoreCustomer(id: number, name: string): Promise<boolean>;
    };
  }
}

export {};
