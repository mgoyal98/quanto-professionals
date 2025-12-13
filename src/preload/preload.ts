import {
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
import {
  CreateDiscountTemplateRequest,
  DiscountTemplate,
  UpdateDiscountTemplateRequest,
} from '@shared/discount';
import {
  CompanyIpcChannel,
  CustomerIpcChannel,
  InvoiceSeriesIpcChannel,
  TaxTemplateIpcChannel,
  DiscountTemplateIpcChannel,
} from '@shared/ipc';
import { contextBridge, ipcRenderer } from 'electron';

const companyApi = {
  createCompany: (payload: CreateCompanyRequest) =>
    ipcRenderer.invoke(CompanyIpcChannel.Create, payload) as Promise<string>,
  openCompany: (filePath: string) =>
    ipcRenderer.invoke(CompanyIpcChannel.Open, filePath) as Promise<void>,
  getRecentCompanies: () =>
    ipcRenderer.invoke(CompanyIpcChannel.GetRecent) as Promise<RecentCompany[]>,
  chooseCompanyFile: () =>
    ipcRenderer.invoke(CompanyIpcChannel.ChooseFile) as Promise<string | null>,
  getCompanyDetails: () =>
    ipcRenderer.invoke(CompanyIpcChannel.GetCompanyDetails) as Promise<Company>,
  closeCompany: () =>
    ipcRenderer.invoke(CompanyIpcChannel.Close) as Promise<void>,
  updateCompany: (payload: UpdateCompanyRequest) =>
    ipcRenderer.invoke(CompanyIpcChannel.Update, payload) as Promise<Company>,
};

const customerApi = {
  createCustomer: (payload: CreateCustomerRequest) =>
    ipcRenderer.invoke(CustomerIpcChannel.Create, payload) as Promise<Customer>,
  getCustomer: (id: number) =>
    ipcRenderer.invoke(CustomerIpcChannel.Get, id) as Promise<
      Customer | undefined
    >,
  updateCustomer: (payload: UpdateCustomerRequest) =>
    ipcRenderer.invoke(CustomerIpcChannel.Update, payload) as Promise<Customer>,
  listCustomers: () =>
    ipcRenderer.invoke(CustomerIpcChannel.List) as Promise<Customer[]>,
  listArchivedCustomers: () =>
    ipcRenderer.invoke(CustomerIpcChannel.ListArchived) as Promise<Customer[]>,
  archiveCustomer: (id: number, name: string) =>
    ipcRenderer.invoke(CustomerIpcChannel.Delete, id, name) as Promise<boolean>,
  restoreCustomer: (id: number, name: string) =>
    ipcRenderer.invoke(
      CustomerIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,
};

const invoiceSeriesApi = {
  createInvoiceSeries: (payload: CreateInvoiceSeriesRequest) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.Create,
      payload
    ) as Promise<InvoiceSeries>,

  getInvoiceSeries: (id: number) =>
    ipcRenderer.invoke(InvoiceSeriesIpcChannel.Get, id) as Promise<
      InvoiceSeries | undefined
    >,

  updateInvoiceSeries: (payload: UpdateInvoiceSeriesRequest) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.Update,
      payload
    ) as Promise<InvoiceSeries>,

  listInvoiceSeries: () =>
    ipcRenderer.invoke(InvoiceSeriesIpcChannel.List) as Promise<
      InvoiceSeries[]
    >,

  listArchivedInvoiceSeries: () =>
    ipcRenderer.invoke(InvoiceSeriesIpcChannel.ListArchived) as Promise<
      InvoiceSeries[]
    >,

  archiveInvoiceSeries: (id: number, name: string) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.Archive,
      id,
      name
    ) as Promise<boolean>,

  restoreInvoiceSeries: (id: number, name: string) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,

  setDefaultSeries: (id: number) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.SetDefault,
      id
    ) as Promise<InvoiceSeries>,

  getNextNumber: (id: number) =>
    ipcRenderer.invoke(InvoiceSeriesIpcChannel.GetNextNumber, id) as Promise<
      number | null
    >,

  incrementNextNumber: (id: number) =>
    ipcRenderer.invoke(
      InvoiceSeriesIpcChannel.IncrementNumber,
      id
    ) as Promise<InvoiceSeries>,
};

const taxTemplateApi = {
  createTaxTemplate: (payload: CreateTaxTemplateRequest) =>
    ipcRenderer.invoke(
      TaxTemplateIpcChannel.Create,
      payload
    ) as Promise<TaxTemplate>,

  getTaxTemplate: (id: number) =>
    ipcRenderer.invoke(TaxTemplateIpcChannel.Get, id) as Promise<
      TaxTemplate | undefined
    >,

  updateTaxTemplate: (payload: UpdateTaxTemplateRequest) =>
    ipcRenderer.invoke(
      TaxTemplateIpcChannel.Update,
      payload
    ) as Promise<TaxTemplate>,

  listTaxTemplates: () =>
    ipcRenderer.invoke(TaxTemplateIpcChannel.List) as Promise<TaxTemplate[]>,

  listArchivedTaxTemplates: () =>
    ipcRenderer.invoke(TaxTemplateIpcChannel.ListArchived) as Promise<
      TaxTemplate[]
    >,

  listTaxTemplatesByType: (taxType: TaxType) =>
    ipcRenderer.invoke(TaxTemplateIpcChannel.ListByType, taxType) as Promise<
      TaxTemplate[]
    >,

  archiveTaxTemplate: (id: number, name: string) =>
    ipcRenderer.invoke(
      TaxTemplateIpcChannel.Archive,
      id,
      name
    ) as Promise<boolean>,

  restoreTaxTemplate: (id: number, name: string) =>
    ipcRenderer.invoke(
      TaxTemplateIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,

  setDefaultTaxTemplate: (id: number) =>
    ipcRenderer.invoke(
      TaxTemplateIpcChannel.SetDefault,
      id
    ) as Promise<TaxTemplate>,
};

const discountTemplateApi = {
  createDiscountTemplate: (payload: CreateDiscountTemplateRequest) =>
    ipcRenderer.invoke(
      DiscountTemplateIpcChannel.Create,
      payload
    ) as Promise<DiscountTemplate>,

  getDiscountTemplate: (id: number) =>
    ipcRenderer.invoke(DiscountTemplateIpcChannel.Get, id) as Promise<
      DiscountTemplate | undefined
    >,

  updateDiscountTemplate: (payload: UpdateDiscountTemplateRequest) =>
    ipcRenderer.invoke(
      DiscountTemplateIpcChannel.Update,
      payload
    ) as Promise<DiscountTemplate>,

  listDiscountTemplates: () =>
    ipcRenderer.invoke(DiscountTemplateIpcChannel.List) as Promise<
      DiscountTemplate[]
    >,

  listArchivedDiscountTemplates: () =>
    ipcRenderer.invoke(DiscountTemplateIpcChannel.ListArchived) as Promise<
      DiscountTemplate[]
    >,

  archiveDiscountTemplate: (id: number, name: string) =>
    ipcRenderer.invoke(
      DiscountTemplateIpcChannel.Archive,
      id,
      name
    ) as Promise<boolean>,

  restoreDiscountTemplate: (id: number, name: string) =>
    ipcRenderer.invoke(
      DiscountTemplateIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,

  setDefaultDiscountTemplate: (id: number) =>
    ipcRenderer.invoke(
      DiscountTemplateIpcChannel.SetDefault,
      id
    ) as Promise<DiscountTemplate>,
};

contextBridge.exposeInMainWorld('companyApi', companyApi);
contextBridge.exposeInMainWorld('customerApi', customerApi);
contextBridge.exposeInMainWorld('invoiceSeriesApi', invoiceSeriesApi);
contextBridge.exposeInMainWorld('taxTemplateApi', taxTemplateApi);
contextBridge.exposeInMainWorld('discountTemplateApi', discountTemplateApi);
