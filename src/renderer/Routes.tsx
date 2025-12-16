import { Navigate, Route, Routes } from 'react-router';

import CompanyLayout from './layouts/company';
import SelectCompany from './pages/select-company';
import NewCompany from './pages/new-company';
import MainLayout from './layouts/main';
import Dashboard from './pages/dashboard';
import CustomerList from './pages/customers/list-customers';
import SettingsPage from './pages/settings';
import CompanySettings from './pages/settings/company-settings';
import InvoiceSeriesSettings from './pages/settings/invoice-series-settings';
import PaymentMethodSettings from './pages/settings/payment-method-settings';
import TaxTemplateSettings from './pages/taxes/tax-template-settings';
import DiscountTemplateList from './pages/discounts/discount-template-list';
import ItemList from './pages/items/item-list';
import InvoiceList from './pages/invoices/invoice-list';
import InvoiceForm from './pages/invoices/invoice-form';
import InvoiceView from './pages/invoices/invoice-view';
import InvoicePrintView from './pages/invoices/invoice-print';
import PaymentList from './pages/payments/payment-list';
import InvoiceFormatSettings from './pages/settings/invoice-format-settings';
import InvoiceFormatForm from './pages/settings/invoice-format-form';

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

        <Route path='items' element={<ItemList />} />

        <Route path='tax-templates' element={<TaxTemplateSettings />} />

        <Route path='discounts' element={<DiscountTemplateList />} />

        {/* Invoice routes */}
        <Route path='invoices' element={<InvoiceList />} />
        <Route path='invoices/new' element={<InvoiceForm />} />
        <Route path='invoices/:id' element={<InvoiceView />} />
        <Route path='invoices/:id/edit' element={<InvoiceForm />} />
        <Route path='invoices/:id/print' element={<InvoicePrintView />} />

        {/* Payment routes */}
        <Route path='payments' element={<PaymentList />} />

        {/* Invoice Format routes (top-level) */}
        <Route path='formats' element={<InvoiceFormatSettings />} />
        <Route path='formats/new' element={<InvoiceFormatForm />} />
        <Route path='formats/:id/edit' element={<InvoiceFormatForm />} />

        {/* Settings routes */}
        <Route path='settings' element={<SettingsPage />}>
          <Route index element={<Navigate to='company' replace />} />
          <Route path='company' element={<CompanySettings />} />
          <Route path='invoice-series' element={<InvoiceSeriesSettings />} />
          <Route path='payment-methods' element={<PaymentMethodSettings />} />
        </Route>
      </Route>
    </Routes>
  );
}
