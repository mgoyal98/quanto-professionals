import { useEffect, useState, useRef } from 'react';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import {
  ArrowBack,
  Print,
  Download,
  Edit,
  Visibility,
} from '@mui/icons-material';
import { useNavigate, useParams } from 'react-router';
import { useNotification } from '@/providers/notification';

export default function InvoicePrintView() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { showSuccess, showError } = useNotification();
  const iframeRef = useRef<HTMLIFrameElement>(null);

  const [renderedHtml, setRenderedHtml] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadRenderedInvoice();
  }, [id]);

  const loadRenderedInvoice = async () => {
    if (!id || !window.invoiceFormatApi) {
      setError('Invoice ID or API is not available.');
      setLoading(false);
      return;
    }

    try {
      // First, initialize default formats if needed
      await window.invoiceFormatApi.initializeDefaults();

      const result = await window.invoiceFormatApi.renderInvoice({
        invoiceId: Number(id),
      });
      setRenderedHtml(result.html);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to render invoice.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = async () => {
    if (!id || !window.invoiceFormatApi) return;

    try {
      await window.invoiceFormatApi.printInvoice(Number(id));
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to print');
    }
  };

  const handleDownloadPdf = async () => {
    if (!id || !window.invoiceFormatApi) return;

    setGenerating(true);
    try {
      const result = await window.invoiceFormatApi.generatePdf({
        invoiceId: Number(id),
      });

      if (result.success) {
        showSuccess(`PDF saved to ${result.filePath}`);
      } else if (result.error && result.error !== 'Save cancelled by user') {
        showError(result.error);
      }
    } catch (err) {
      showError(err instanceof Error ? err.message : 'Failed to generate PDF');
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return (
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: '100vh',
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Box sx={{ p: 3 }}>
        <Alert severity='error'>{error}</Alert>
        <Button
          startIcon={<ArrowBack />}
          onClick={() => navigate(`/invoices/${id}`)}
          sx={{ mt: 2 }}
        >
          Back to Invoice
        </Button>
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Toolbar */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: 'divider',
          bgcolor: 'background.paper',
        }}
      >
        <Stack direction='row' spacing={2} justifyContent='space-between'>
          <Stack direction='row' spacing={1} alignItems='center'>
            <IconButton onClick={() => navigate(`/invoices/${id}`)}>
              <ArrowBack />
            </IconButton>
            <Typography variant='h6'>Invoice Preview</Typography>
          </Stack>
          <Stack direction='row' spacing={1}>
            <Button
              variant='outlined'
              startIcon={<Visibility />}
              onClick={() => navigate(`/invoices/${id}`)}
            >
              View Details
            </Button>
            <Button
              variant='outlined'
              startIcon={<Edit />}
              onClick={() => navigate(`/invoices/${id}/edit`)}
            >
              Edit
            </Button>
            <Button
              variant='contained'
              startIcon={<Print />}
              onClick={handlePrint}
            >
              Print
            </Button>
            <Button
              variant='contained'
              color='secondary'
              startIcon={
                generating ? <CircularProgress size={20} /> : <Download />
              }
              onClick={handleDownloadPdf}
              disabled={generating}
            >
              {generating ? 'Generating...' : 'Download PDF'}
            </Button>
          </Stack>
        </Stack>
      </Box>

      {/* Preview */}
      <Box
        sx={{
          flex: 1,
          overflow: 'auto',
          bgcolor: 'grey.300',
          p: 3,
          display: 'flex',
          justifyContent: 'center',
        }}
      >
        <Paper
          elevation={3}
          sx={{
            width: '210mm', // A4 width
            minHeight: '297mm', // A4 height
            bgcolor: 'white',
            overflow: 'hidden',
          }}
        >
          <iframe
            ref={iframeRef}
            srcDoc={renderedHtml}
            style={{
              width: '100%',
              height: '297mm',
              border: 'none',
              display: 'block',
            }}
            title='Invoice Preview'
          />
        </Paper>
      </Box>
    </Box>
  );
}

