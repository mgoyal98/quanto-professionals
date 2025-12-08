import { Company } from '@shared/company';
import { createContext, useContext, useEffect, useMemo, useState } from 'react';

interface CompanyState {
  company: Company | null;
  getCompany: () => Promise<Company | null>;
}

const CompanyContext = createContext<CompanyState | null>(null);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompany] = useState<Company | null>(null);

  const getCompany = async (): Promise<Company | null> => {
    if (!window.companyApi) {
      return null;
    }
    try {
      const companyDetails = await window.companyApi.getCompanyDetails();
      setCompany({...companyDetails});
      return companyDetails;
    } catch (error) {
      console.error('Failed to fetch company details:', error);
      return null;
    }
  };

  useEffect(() => {
    console.log('company', company);
  }, [company]);

  const value = useMemo(
    () => ({
      company,
      getCompany,
    }),
    [company, getCompany]
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
