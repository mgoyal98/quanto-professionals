import { Routes } from '@/common/routes';
import { Company } from '@shared/company';
import { createContext, useContext, useMemo, useState } from 'react';
import { useNavigate } from 'react-router';

interface CompanyState {
  company: Company | null;
  getCompany: () => Promise<Company | null>;
  closeCompany: () => Promise<void>;
}

const CompanyContext = createContext<CompanyState | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const navigate = useNavigate();
  const [company, setCompany] = useState<Company | null>(null);

  const getCompany = async (): Promise<Company | null> => {
    if (!window.companyApi) {
      return null;
    }
    try {
      const companyDetails = await window.companyApi.getCompanyDetails();
      setCompany({ ...companyDetails });
      return companyDetails;
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      return null;
    }
  };

  const closeCompany = async () => {
    if (!window.companyApi) {
      return;
    }
    await window.companyApi.closeCompany();

    setCompany(null);
    navigate(Routes.SelectCompany);
  };

  const value = useMemo(
    () => ({
      company,
      getCompany,
      closeCompany,
    }),
    [company, getCompany, closeCompany]
  );

  return (
    <CompanyContext.Provider value={value}>{children}</CompanyContext.Provider>
  );
}

export const useCompany = () => {
  const ctx = useContext(CompanyContext);
  if (!ctx) throw new Error('useCompany must be used inside <CompanyProvider>');
  return ctx;
};
