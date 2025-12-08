export interface RecentCompany {
  filePath: string;
  name: string;
  lastOpened: string;
}

export interface CreateCompanyRequest {
  name: string;
  profession?: string;
  pan?: string;
  gstin?: string;
  addressLine1?: string;
  addressLine2?: string;
  city: string;
  state: string;
  stateCode: string;
  pinCode: string;
  phone?: string;
  email?: string;
}
