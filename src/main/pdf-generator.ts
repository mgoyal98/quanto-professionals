import { BrowserWindow, dialog } from 'electron';
import { writeFile } from 'fs/promises';

export interface PdfOptions {
  paperSize: 'A4' | 'Letter' | 'Legal';
  orientation: 'portrait' | 'landscape';
  margins: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
}

/**
 * Generate a PDF from HTML content using Electron's built-in printToPDF
 */
export async function generatePdfFromHtml(
  html: string,
  options: PdfOptions
): Promise<Buffer> {
  // Create a hidden window for PDF generation
  const pdfWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      offscreen: true,
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    // Load the HTML content
    await pdfWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    // Wait a bit for the content to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Generate PDF
    const pdfBuffer = await pdfWindow.webContents.printToPDF({
      pageSize: options.paperSize,
      landscape: options.orientation === 'landscape',
      margins: {
        marginType: 'custom',
        top: options.margins.top / 25.4, // Convert mm to inches
        right: options.margins.right / 25.4,
        bottom: options.margins.bottom / 25.4,
        left: options.margins.left / 25.4,
      },
      printBackground: true,
      preferCSSPageSize: false,
    });

    return Buffer.from(pdfBuffer);
  } finally {
    pdfWindow.close();
  }
}

/**
 * Generate PDF and save to a file
 * If savePath is provided, saves directly to that path.
 * Otherwise, prompts user with a save dialog.
 */
export async function generateAndSavePdf(
  html: string,
  options: PdfOptions,
  defaultFileName: string,
  savePath?: string
): Promise<{ success: boolean; filePath?: string; error?: string }> {
  try {
    // Generate PDF
    const pdfBuffer = await generatePdfFromHtml(html, options);

    // Determine save path
    let targetPath = savePath;

    if (!targetPath) {
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save Invoice PDF',
        defaultPath: defaultFileName,
        filters: [{ name: 'PDF Documents', extensions: ['pdf'] }],
      });

      if (result.canceled || !result.filePath) {
        return { success: false, error: 'Save cancelled by user' };
      }

      targetPath = result.filePath;
    }

    // Ensure .pdf extension
    if (!targetPath.toLowerCase().endsWith('.pdf')) {
      targetPath = targetPath + '.pdf';
    }

    // Write file
    await writeFile(targetPath, pdfBuffer);

    return { success: true, filePath: targetPath };
  } catch (error) {
    console.error('PDF generation error:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Failed to generate PDF',
    };
  }
}

/**
 * Print HTML content using system print dialog
 */
export async function printHtml(html: string): Promise<boolean> {
  // Create a visible window for printing
  const printWindow = new BrowserWindow({
    show: false,
    width: 800,
    height: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  try {
    // Load the HTML content
    await printWindow.loadURL(
      `data:text/html;charset=utf-8,${encodeURIComponent(html)}`
    );

    // Wait for content to render
    await new Promise((resolve) => setTimeout(resolve, 500));

    // Print using system dialog
    printWindow.webContents.print(
      {
        silent: false,
        printBackground: true,
      },
      (success, errorType) => {
        if (!success) {
          console.error('Print failed:', errorType);
        }
        printWindow.close();
      }
    );

    return true;
  } catch (error) {
    console.error('Print error:', error);
    printWindow.close();
    return false;
  }
}

