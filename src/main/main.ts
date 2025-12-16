import { app, BrowserWindow, Menu } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { closeActiveDb, registerCompanyHandlers } from './company-manager';
import { registerCustomerHandlers } from './customer';
import { registerInvoiceSeriesHandlers } from './invoice-series';
import { registerTaxTemplateHandlers } from './tax-template';
import { registerDiscountTemplateHandlers } from './discount-template';
import { registerItemHandlers } from './item';
import { registerPaymentMethodHandlers } from './payment-method';
import { registerInvoiceHandlers } from './invoice';
import { registerPaymentHandlers } from './payment';
import { registerInvoiceFormatHandlers } from './invoice-format';

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    minWidth: 1024,
    minHeight: 720,
    show: false,
    webPreferences: {
      devTools: !app.isPackaged,
      contextIsolation: true,
      nodeIntegration: false,
      preload: path.join(__dirname, 'preload.js'),
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`)
    );
  }

  mainWindow.once('ready-to-show', () => {
    mainWindow.maximize(); // makes it full window size (not fullscreen)
    mainWindow.show();
  });

  if (!app.isPackaged) {
    // Open the DevTools.
    mainWindow.webContents.openDevTools();
  }

  mainWindow.webContents.on('devtools-opened', () => {
    if (app.isPackaged) {
      mainWindow.webContents.closeDevTools();
    }
  });
};

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.on('ready', () => {
  if (app.isPackaged) {
    if (process.platform === 'darwin') {
      // macOS requires at least one menu item (usually the App Name)
      const osxMenu = Menu.buildFromTemplate([
        {
          label: app.name,
          submenu: [
            { role: 'about' },
            { type: 'separator' },
            // We omit { role: 'services' } here to hide the Services tab
            { role: 'hide' },
            { role: 'hideOthers' },
            { role: 'unhide' },
            { type: 'separator' },
            { role: 'quit' },
          ],
        },
        // You can add other top-level menus like Edit if your users need Copy/Paste
        { role: 'editMenu' },
      ]);
      Menu.setApplicationMenu(osxMenu);
    } else {
      // Windows/Linux can be totally null
      Menu.setApplicationMenu(null);
    }
  }
  createWindow();
});

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

app.on('before-quit', () => {
  closeActiveDb();
});

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and import them here.

// Handlers
registerCompanyHandlers();
registerCustomerHandlers();
registerInvoiceSeriesHandlers();
registerTaxTemplateHandlers();
registerDiscountTemplateHandlers();
registerItemHandlers();
registerPaymentMethodHandlers();
registerInvoiceHandlers();
registerPaymentHandlers();
registerInvoiceFormatHandlers();
