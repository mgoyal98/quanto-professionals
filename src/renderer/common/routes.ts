export enum Routes {
  SelectCompany = '/',
  NewCompany = '/new-company',
  Dashboard = '/dashboard',

  Customers = '/customers',
  NewCustomer = '/customers?newCustomer=true',

  Items = '/items',

  TaxTemplates = '/tax-templates',
  Discounts = '/discounts',

  Invoices = '/invoices',
  InvoiceCreate = '/invoices/new',
  InvoiceView = '/invoices/:id',
  InvoiceEdit = '/invoices/:id/edit',
  InvoicePrint = '/invoices/:id/print',

  Payments = '/payments',

  // Invoice Formats (top-level)
  InvoiceFormats = '/formats',
  InvoiceFormatNew = '/formats/new',
  InvoiceFormatEdit = '/formats/:id/edit',

  Settings = '/settings',
  SettingsCompany = '/settings/company',
  SettingsInvoiceSeries = '/settings/invoice-series',
  SettingsPaymentMethods = '/settings/payment-methods',
}
