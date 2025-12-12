import { Snackbar, Alert, AlertColor } from '@mui/material';
import {
  createContext,
  useContext,
  useState,
  useCallback,
  ReactNode,
} from 'react';

interface NotificationContextType {
  showNotification: (message: string, severity?: AlertColor) => void;
  showSuccess: (message: string) => void;
  showError: (message: string) => void;
  showWarning: (message: string) => void;
  showInfo: (message: string) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(
  undefined
);

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within NotificationProvider');
  }
  return context;
};

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider = ({
  children,
}: NotificationProviderProps) => {
  const [open, setOpen] = useState(false);
  const [message, setMessage] = useState('');
  const [severity, setSeverity] = useState<AlertColor>('info');

  const showNotification = useCallback(
    (msg: string, sev: AlertColor = 'info') => {
      setMessage(msg);
      setSeverity(sev);
      setOpen(true);
    },
    []
  );

  const showSuccess = useCallback(
    (msg: string) => {
      showNotification(msg, 'success');
    },
    [showNotification]
  );

  const showError = useCallback(
    (msg: string) => {
      showNotification(msg, 'error');
    },
    [showNotification]
  );

  const showWarning = useCallback(
    (msg: string) => {
      showNotification(msg, 'warning');
    },
    [showNotification]
  );

  const showInfo = useCallback(
    (msg: string) => {
      showNotification(msg, 'info');
    },
    [showNotification]
  );

  const handleClose = (
    _event?: React.SyntheticEvent | Event,
    reason?: string
  ) => {
    if (reason === 'clickaway') {
      return;
    }
    setOpen(false);
  };

  return (
    <NotificationContext.Provider
      value={{
        showNotification,
        showSuccess,
        showError,
        showWarning,
        showInfo,
      }}
    >
      {children}
      <Snackbar
        open={open}
        autoHideDuration={6000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          sx={{ width: '100%' }}
          variant='filled'
        >
          {message}
        </Alert>
      </Snackbar>
    </NotificationContext.Provider>
  );
};
