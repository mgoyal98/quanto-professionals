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
import { CompanyIpcChannel, CustomerIpcChannel } from '@shared/ipc';
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

contextBridge.exposeInMainWorld('companyApi', companyApi);
contextBridge.exposeInMainWorld('customerApi', customerApi);
