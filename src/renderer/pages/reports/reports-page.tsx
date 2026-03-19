import { Box, Tab, Tabs, Typography } from '@mui/material';
import { useState } from 'react';
import InvoiceReport from './invoice-report';
import PaymentReport from './payment-report';
import GstReport from './gst-report';

type ReportTab = 'invoice' | 'payment' | 'gst';

export default function ReportsPage() {
  const [activeTab, setActiveTab] = useState<ReportTab>('invoice');

  return (
    <Box>
      <Box sx={{ mb: 3 }}>
        <Typography variant='h4' gutterBottom>Reports</Typography>
        <Typography variant='body1' color='text.secondary'>
          Generate and export reports for invoices, payments, and GST.
        </Typography>
      </Box>

      <Tabs
        value={activeTab}
        onChange={(_e, val) => setActiveTab(val as ReportTab)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label='Invoice Report' value='invoice' />
        <Tab label='Payment Report' value='payment' />
        <Tab label='GST Summary' value='gst' />
      </Tabs>

      {activeTab === 'invoice' && <InvoiceReport />}
      {activeTab === 'payment' && <PaymentReport />}
      {activeTab === 'gst' && <GstReport />}
    </Box>
  );
}
