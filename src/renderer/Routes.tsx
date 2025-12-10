import { Route, Routes } from 'react-router';

import CompanyLayout from './layouts/company';
import SelectCompany from './pages/select-company';
import NewCompany from './pages/new-company';
import MainLayout from './layouts/main';
import Dashboard from './pages/dashboard';
import CustomerList from './pages/customers/list-customers';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Company selection routes */}
      <Route path='/' element={<CompanyLayout />}>
        <Route index element={<SelectCompany />} />
        <Route path='new-company' element={<NewCompany />} />
      </Route>

      <Route path='/' element={<MainLayout />}>
        <Route path='dashboard' element={<Dashboard />} />

        <Route path='customers' element={<CustomerList />} />
      </Route>
    </Routes>
  );
}
