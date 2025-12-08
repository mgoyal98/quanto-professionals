import { CreateCompanyRequest, RecentCompany } from '@shared/company';
import { CompanyIpcChannel } from '@shared/ipc';
import { contextBridge, ipcRenderer } from 'electron';

const companyApi = {
  createCompany: (payload: CreateCompanyRequest) =>
    ipcRenderer.invoke(CompanyIpcChannel.Create, payload) as Promise<string>,
  getRecentCompanies: () =>
    ipcRenderer.invoke(CompanyIpcChannel.GetRecent) as Promise<RecentCompany[]>,
  chooseCompanyFile: () =>
    ipcRenderer.invoke(CompanyIpcChannel.ChooseFile) as Promise<string | null>,
};

contextBridge.exposeInMainWorld('companyApi', companyApi);
