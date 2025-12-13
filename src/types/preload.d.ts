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
import {
  CreateInvoiceSeriesRequest,
  InvoiceSeries,
  UpdateInvoiceSeriesRequest,
} from '@shared/invoice-series';
import {
  CreateTaxTemplateRequest,
  TaxTemplate,
  TaxType,
  UpdateTaxTemplateRequest,
} from '@shared/tax-template';

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
    invoiceSeriesApi?: {
      createInvoiceSeries(
        payload: CreateInvoiceSeriesRequest
      ): Promise<InvoiceSeries>;
      getInvoiceSeries(id: number): Promise<InvoiceSeries | undefined>;
      updateInvoiceSeries(
        payload: UpdateInvoiceSeriesRequest
      ): Promise<InvoiceSeries>;
      listInvoiceSeries(): Promise<InvoiceSeries[]>;
      listArchivedInvoiceSeries(): Promise<InvoiceSeries[]>;
      archiveInvoiceSeries(id: number, name: string): Promise<boolean>;
      restoreInvoiceSeries(id: number, name: string): Promise<boolean>;
      setDefaultSeries(id: number): Promise<InvoiceSeries>;
      getNextNumber(id: number): Promise<number | null>;
      incrementNextNumber(id: number): Promise<InvoiceSeries>;
    };
    taxTemplateApi?: {
      createTaxTemplate(payload: CreateTaxTemplateRequest): Promise<TaxTemplate>;
      getTaxTemplate(id: number): Promise<TaxTemplate | undefined>;
      updateTaxTemplate(payload: UpdateTaxTemplateRequest): Promise<TaxTemplate>;
      listTaxTemplates(): Promise<TaxTemplate[]>;
      listArchivedTaxTemplates(): Promise<TaxTemplate[]>;
      listTaxTemplatesByType(taxType: TaxType): Promise<TaxTemplate[]>;
      archiveTaxTemplate(id: number, name: string): Promise<boolean>;
      restoreTaxTemplate(id: number, name: string): Promise<boolean>;
      setDefaultTaxTemplate(id: number): Promise<TaxTemplate>;
    };
  }
}

export {};
