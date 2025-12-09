import { Company, CreateCompanyRequest, RecentCompany } from '@shared/company';
import { CompanyIpcChannel } from '@shared/ipc';
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
};

contextBridge.exposeInMainWorld('companyApi', companyApi);
