export enum CompanyIpcChannel {
  Create = 'company:create',
  Open = 'company:open',
  GetCompanyDetails = 'company:get-company-details',
  ChooseFile = 'company:choose-file',
  GetRecent = 'company:get-recent',
  Close = 'company:close',
  Update = 'company:update',
}

export enum CustomerIpcChannel {
  Create = 'customer:create',
  Update = 'customer:update',
  Get = 'customer:get',
  List = 'customer:list',
  ListArchived = 'customer:list-archived',
  Delete = 'customer:delete',
  Restore = 'customer:restore',
}

export enum InvoiceSeriesIpcChannel {
  Create = 'invoice-series:create',
  Update = 'invoice-series:update',
  Get = 'invoice-series:get',
  List = 'invoice-series:list',
  ListArchived = 'invoice-series:list-archived',
  Archive = 'invoice-series:archive',
  Restore = 'invoice-series:restore',
  SetDefault = 'invoice-series:set-default',
  GetNextNumber = 'invoice-series:get-next-number',
  IncrementNumber = 'invoice-series:increment-number',
}

export enum TaxTemplateIpcChannel {
  Create = 'tax-template:create',
  Update = 'tax-template:update',
  Get = 'tax-template:get',
  List = 'tax-template:list',
  ListArchived = 'tax-template:list-archived',
  ListByType = 'tax-template:list-by-type',
  Archive = 'tax-template:archive',
  Restore = 'tax-template:restore',
  SetDefault = 'tax-template:set-default',
}

export enum DiscountTemplateIpcChannel {
  Create = 'discount-template:create',
  Update = 'discount-template:update',
  Get = 'discount-template:get',
  List = 'discount-template:list',
  ListArchived = 'discount-template:list-archived',
  Archive = 'discount-template:archive',
  Restore = 'discount-template:restore',
  SetDefault = 'discount-template:set-default',
}

export enum ItemIpcChannel {
  Create = 'item:create',
  Update = 'item:update',
  Get = 'item:get',
  List = 'item:list',
  ListArchived = 'item:list-archived',
  Search = 'item:search',
  Archive = 'item:archive',
  Restore = 'item:restore',
}

export enum PaymentMethodIpcChannel {
  Create = 'payment-method:create',
  Update = 'payment-method:update',
  Get = 'payment-method:get',
  List = 'payment-method:list',
  ListArchived = 'payment-method:list-archived',
  Archive = 'payment-method:archive',
  Restore = 'payment-method:restore',
  SetDefault = 'payment-method:set-default',
}

export enum InvoiceIpcChannel {
  Create = 'invoice:create',
  Update = 'invoice:update',
  Get = 'invoice:get',
  List = 'invoice:list',
  UpdateStatus = 'invoice:update-status',
  Archive = 'invoice:archive',
  Restore = 'invoice:restore',
  RecordPayment = 'invoice:record-payment',
  DeletePayment = 'invoice:delete-payment',
  GetPayments = 'invoice:get-payments',
}

export enum PaymentIpcChannel {
  List = 'payment:list',
  Get = 'payment:get',
  Delete = 'payment:delete',
}

export enum InvoiceFormatIpcChannel {
  Create = 'invoice-format:create',
  Update = 'invoice-format:update',
  Get = 'invoice-format:get',
  List = 'invoice-format:list',
  ListActive = 'invoice-format:list-active',
  Delete = 'invoice-format:delete',
  Duplicate = 'invoice-format:duplicate',
  SetDefault = 'invoice-format:set-default',
  Preview = 'invoice-format:preview',
  RenderInvoice = 'invoice-format:render-invoice',
  GeneratePdf = 'invoice-format:generate-pdf',
  PrintInvoice = 'invoice-format:print',
  InitializeDefaults = 'invoice-format:initialize-defaults',
}

export function formatIpcError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unexpected error';
}
