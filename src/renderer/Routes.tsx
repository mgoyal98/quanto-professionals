import { Route, Routes } from 'react-router';

import CompanyLayout from './layouts/company';
import SelectCompany from './pages/select-company';
import NewCompany from './pages/new-company';

export default function AppRoutes() {
  return (
    <Routes>
      {/* Company selection routes */}
      <Route path='/' element={<CompanyLayout />}>
        <Route index element={<SelectCompany />} />
        <Route path='new-company' element={<NewCompany />} />
      </Route>
    </Routes>
  );
}
