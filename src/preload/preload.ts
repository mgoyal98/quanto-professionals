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
  CreateItemRequest,
  UpdateItemRequest,
  ItemListParams,
  ItemListResponse,
  ItemWithTaxTemplates,
} from '@shared/item';
import {
  CreatePaymentMethodRequest,
  UpdatePaymentMethodRequest,
  PaymentMethod,
} from '@shared/payment-method';
import {
  CreateInvoiceRequest,
  UpdateInvoiceRequest,
  UpdateInvoiceStatusRequest,
  RecordPaymentRequest,
  InvoiceListParams,
  InvoiceListResponse,
  InvoiceWithDetails,
} from '@shared/invoice';
import {
  CompanyIpcChannel,
  CustomerIpcChannel,
  InvoiceSeriesIpcChannel,
  TaxTemplateIpcChannel,
  DiscountTemplateIpcChannel,
  ItemIpcChannel,
  PaymentMethodIpcChannel,
  InvoiceIpcChannel,
  PaymentIpcChannel,
  InvoiceFormatIpcChannel,
} from '@shared/ipc';
import {
  PaymentListParams,
  PaymentListResponse,
  PaymentWithDetails,
} from '@shared/payment';
import {
  InvoiceFormat,
  CreateInvoiceFormatRequest,
  UpdateInvoiceFormatRequest,
  RenderInvoiceRequest,
  RenderInvoiceResponse,
  GeneratePdfRequest,
  GeneratePdfResponse,
} from '@shared/invoice-format';
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

const itemApi = {
  createItem: (payload: CreateItemRequest) =>
    ipcRenderer.invoke(
      ItemIpcChannel.Create,
      payload
    ) as Promise<ItemWithTaxTemplates>,

  getItem: (id: number) =>
    ipcRenderer.invoke(ItemIpcChannel.Get, id) as Promise<
      ItemWithTaxTemplates | undefined
    >,

  updateItem: (payload: UpdateItemRequest) =>
    ipcRenderer.invoke(
      ItemIpcChannel.Update,
      payload
    ) as Promise<ItemWithTaxTemplates>,

  listItems: (params?: ItemListParams) =>
    ipcRenderer.invoke(
      ItemIpcChannel.List,
      params
    ) as Promise<ItemListResponse>,

  listArchivedItems: (params?: Omit<ItemListParams, 'isActive'>) =>
    ipcRenderer.invoke(
      ItemIpcChannel.ListArchived,
      params
    ) as Promise<ItemListResponse>,

  searchItems: (search: string, limit?: number) =>
    ipcRenderer.invoke(
      ItemIpcChannel.Search,
      search,
      limit
    ) as Promise<ItemListResponse>,

  archiveItem: (id: number, name: string) =>
    ipcRenderer.invoke(ItemIpcChannel.Archive, id, name) as Promise<boolean>,

  restoreItem: (id: number, name: string) =>
    ipcRenderer.invoke(ItemIpcChannel.Restore, id, name) as Promise<boolean>,
};

const paymentMethodApi = {
  createPaymentMethod: (payload: CreatePaymentMethodRequest) =>
    ipcRenderer.invoke(
      PaymentMethodIpcChannel.Create,
      payload
    ) as Promise<PaymentMethod>,

  getPaymentMethod: (id: number) =>
    ipcRenderer.invoke(PaymentMethodIpcChannel.Get, id) as Promise<
      PaymentMethod | undefined
    >,

  updatePaymentMethod: (payload: UpdatePaymentMethodRequest) =>
    ipcRenderer.invoke(
      PaymentMethodIpcChannel.Update,
      payload
    ) as Promise<PaymentMethod>,

  listPaymentMethods: () =>
    ipcRenderer.invoke(PaymentMethodIpcChannel.List) as Promise<
      PaymentMethod[]
    >,

  listArchivedPaymentMethods: () =>
    ipcRenderer.invoke(PaymentMethodIpcChannel.ListArchived) as Promise<
      PaymentMethod[]
    >,

  archivePaymentMethod: (id: number, name: string) =>
    ipcRenderer.invoke(
      PaymentMethodIpcChannel.Archive,
      id,
      name
    ) as Promise<boolean>,

  restorePaymentMethod: (id: number, name: string) =>
    ipcRenderer.invoke(
      PaymentMethodIpcChannel.Restore,
      id,
      name
    ) as Promise<boolean>,

  setDefaultPaymentMethod: (id: number) =>
    ipcRenderer.invoke(
      PaymentMethodIpcChannel.SetDefault,
      id
    ) as Promise<PaymentMethod>,
};

const invoiceApi = {
  createInvoice: (payload: CreateInvoiceRequest) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.Create,
      payload
    ) as Promise<InvoiceWithDetails>,

  getInvoice: (id: number) =>
    ipcRenderer.invoke(InvoiceIpcChannel.Get, id) as Promise<
      InvoiceWithDetails | undefined
    >,

  updateInvoice: (payload: UpdateInvoiceRequest) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.Update,
      payload
    ) as Promise<InvoiceWithDetails>,

  listInvoices: (params?: InvoiceListParams) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.List,
      params
    ) as Promise<InvoiceListResponse>,

  updateInvoiceStatus: (payload: UpdateInvoiceStatusRequest) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.UpdateStatus,
      payload
    ) as Promise<InvoiceWithDetails>,

  archiveInvoice: (id: number, invoiceNumber: string) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.Archive,
      id,
      invoiceNumber
    ) as Promise<boolean>,

  restoreInvoice: (id: number, invoiceNumber: string) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.Restore,
      id,
      invoiceNumber
    ) as Promise<boolean>,

  recordPayment: (payload: RecordPaymentRequest) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.RecordPayment,
      payload
    ) as Promise<InvoiceWithDetails>,

  deletePayment: (paymentId: number) =>
    ipcRenderer.invoke(
      InvoiceIpcChannel.DeletePayment,
      paymentId
    ) as Promise<InvoiceWithDetails | null>,
};

const paymentApi = {
  listPayments: (params?: PaymentListParams) =>
    ipcRenderer.invoke(
      PaymentIpcChannel.List,
      params
    ) as Promise<PaymentListResponse>,

  getPayment: (id: number) =>
    ipcRenderer.invoke(
      PaymentIpcChannel.Get,
      id
    ) as Promise<PaymentWithDetails | null>,

  deletePayment: (id: number) =>
    ipcRenderer.invoke(PaymentIpcChannel.Delete, id) as Promise<{
      success: boolean;
    }>,
};

const invoiceFormatApi = {
  createInvoiceFormat: (payload: CreateInvoiceFormatRequest) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.Create,
      payload
    ) as Promise<InvoiceFormat>,

  updateInvoiceFormat: (payload: UpdateInvoiceFormatRequest) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.Update,
      payload
    ) as Promise<InvoiceFormat>,

  getInvoiceFormat: (id: number) =>
    ipcRenderer.invoke(InvoiceFormatIpcChannel.Get, id) as Promise<
      InvoiceFormat | undefined
    >,

  listInvoiceFormats: () =>
    ipcRenderer.invoke(InvoiceFormatIpcChannel.List) as Promise<
      InvoiceFormat[]
    >,

  listActiveInvoiceFormats: () =>
    ipcRenderer.invoke(InvoiceFormatIpcChannel.ListActive) as Promise<
      InvoiceFormat[]
    >,

  deleteInvoiceFormat: (id: number) =>
    ipcRenderer.invoke(InvoiceFormatIpcChannel.Delete, id) as Promise<boolean>,

  duplicateInvoiceFormat: (id: number) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.Duplicate,
      id
    ) as Promise<InvoiceFormat>,

  setDefaultInvoiceFormat: (id: number) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.SetDefault,
      id
    ) as Promise<InvoiceFormat>,

  renderInvoice: (payload: RenderInvoiceRequest) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.RenderInvoice,
      payload
    ) as Promise<RenderInvoiceResponse>,

  generatePdf: (payload: GeneratePdfRequest) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.GeneratePdf,
      payload
    ) as Promise<GeneratePdfResponse>,

  printInvoice: (invoiceId: number, formatId?: number) =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.PrintInvoice,
      invoiceId,
      formatId
    ) as Promise<boolean>,

  initializeDefaults: () =>
    ipcRenderer.invoke(
      InvoiceFormatIpcChannel.InitializeDefaults
    ) as Promise<boolean>,
};

contextBridge.exposeInMainWorld('companyApi', companyApi);
contextBridge.exposeInMainWorld('customerApi', customerApi);
contextBridge.exposeInMainWorld('invoiceSeriesApi', invoiceSeriesApi);
contextBridge.exposeInMainWorld('taxTemplateApi', taxTemplateApi);
contextBridge.exposeInMainWorld('discountTemplateApi', discountTemplateApi);
contextBridge.exposeInMainWorld('itemApi', itemApi);
contextBridge.exposeInMainWorld('paymentMethodApi', paymentMethodApi);
contextBridge.exposeInMainWorld('invoiceApi', invoiceApi);
contextBridge.exposeInMainWorld('paymentApi', paymentApi);
contextBridge.exposeInMainWorld('invoiceFormatApi', invoiceFormatApi);
