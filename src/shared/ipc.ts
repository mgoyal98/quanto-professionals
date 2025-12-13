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

export function formatIpcError(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  return 'Unexpected error';
}
