export enum CompanyIpcChannel {
  Create = 'company:create',
  Open = 'company:open',
  GetCompanyDetails = 'company:get-company-details',
  ChooseFile = 'company:choose-file',
  GetRecent = 'company:get-recent',
  Close = 'company:close',
}

export enum CustomerIpcChannel {
  Create = 'customer:create',
  List = 'customer:list',
  Delete = 'customer:delete',
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
