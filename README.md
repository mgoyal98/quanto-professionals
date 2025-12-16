# Quanto Professionals

<p align="center">
  <img src="assets/icon.png" alt="Quanto Professionals Logo" width="128" height="128">
</p>

<p align="center">
  <strong>A modern, offline-first invoice management desktop application for service providers</strong>
</p>

<p align="center">
  <a href="#features">Features</a> •
  <a href="#screenshots">Screenshots</a> •
  <a href="#installation">Installation</a> •
  <a href="#development">Development</a> •
  <a href="#tech-stack">Tech Stack</a> •
  <a href="#contributing">Contributing</a> •
  <a href="#license">License</a>
</p>

---

## Overview

Quanto Professionals is a desktop invoice management application built specifically for freelancers, consultants, and small service providers in India. It provides comprehensive GST-compliant invoicing with support for CGST, SGST, IGST, and Cess calculations.

**Key Highlights:**

- 🔒 **Privacy-First** - All data stored locally on your machine
- 🌐 **Offline-Ready** - Works completely offline, no internet required
- 🏢 **Multi-Company** - Manage multiple businesses from one app
- 📄 **GST Compliant** - Full support for Indian GST tax structure
- 🎨 **Customizable** - Create your own invoice templates

## Features

### 📊 Dashboard

- Overview of total invoices, customers, and items
- Revenue tracking and outstanding payment alerts
- Quick actions for common tasks
- Recent invoices at a glance

### 👥 Customer Management

- Create and manage customer profiles
- Store GSTIN, PAN, and contact details
- Address management with state code support
- Archive/restore functionality

### 📦 Item Management

- Product and service catalog
- HSN/SAC code support
- Default tax template assignment
- Rate and unit management

### 🧾 Invoice Management

- **GST Support**: Automatic CGST/SGST (intra-state) or IGST (inter-state) calculation
- **Tax Templates**: Pre-configured tax rates (0%, 5%, 12%, 18%, 28%)
- **Cess Support**: Additional cess calculation where applicable
- **Discounts**: Item-level and invoice-level discounts (percentage or fixed amount)
- **Invoice Series**: Multiple numbering series with customizable prefixes
- **Payment Tracking**: Record partial payments and track outstanding amounts
- **Invoice Statuses**: Unpaid, Partially Paid, Paid, Cancelled
- **Reverse Charge**: Support for reverse charge mechanism

### 💳 Payment Methods

- Configure multiple payment methods
- Bank account details (account number, IFSC, branch)
- UPI ID support
- Automatic display on invoices

### 🖨️ Invoice Printing & PDF

- **Customizable Templates**: Create your own invoice designs using HTML/CSS
- **EJS Templating**: Full control over invoice layout
- **PDF Export**: Generate professional PDF invoices
- **Print Support**: Direct printing via system dialog
- **Template Variables**: Access to all invoice data in templates

### ⚙️ Settings

- Company profile management
- Invoice series configuration
- Payment method setup
- Invoice format/template editor

## Screenshots

<!-- Add screenshots here -->

_Screenshots coming soon_

## Installation

### Pre-built Releases

Download the latest release for your platform from the [Releases](https://github.com/mgoyal98/quanto-professionals/releases) page.

| Platform | Download                 |
| -------- | ------------------------ |
| Windows  | `.exe` installer         |
| macOS    | `.zip` archive           |
| Linux    | `.deb` / `.rpm` packages |

### Bypassing Security Warnings

Since the application may not be code-signed, your operating system might show security warnings when you first run it.

#### Windows (SmartScreen)

When Windows SmartScreen blocks the app:

1. Click **"More info"** on the SmartScreen popup
2. Click **"Run anyway"** to proceed with the installation

Alternatively, you can right-click the installer → **Properties** → Check **"Unblock"** → Click **Apply** → **OK**, then run the installer.

#### macOS (Gatekeeper)

When macOS shows "app can't be opened because it is from an unidentified developer":

**Method 1: Right-click to open**

1. Right-click (or Control-click) the app in Finder
2. Select **"Open"** from the context menu
3. Click **"Open"** in the dialog that appears

**Method 2: System Settings**

1. Go to **System Settings** → **Privacy & Security**
2. Scroll down to find the blocked app message
3. Click **"Open Anyway"**
4. Enter your password if prompted

**Method 3: Terminal (if above methods don't work)**

```bash
xattr -cr /Applications/Quanto\ Professionals.app
```

> ⚠️ **Note**: These warnings exist to protect you from malicious software. Only bypass them for applications you trust and have downloaded from official sources.

### Build from Source

1. **Clone the repository**

   ```bash
   git clone https://github.com/mgoyal98/quanto-professionals.git
   cd quanto-professionals
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Start in development mode**

   ```bash
   npm start
   ```

4. **Build for production**

   ```bash
   # Package without creating installers
   npm run package

   # Create platform-specific installers
   npm run make
   ```

## Development

### Prerequisites

- **Node.js** 18.x or higher
- **npm** 9.x or higher
- **Python** 3.x (for native module compilation)
- **C++ Build Tools**:
  - Windows: Visual Studio Build Tools
  - macOS: Xcode Command Line Tools
  - Linux: `build-essential` package

### Project Structure

```
quanto-app/
├── src/
│   ├── main/              # Electron main process
│   │   ├── main.ts        # Application entry point
│   │   ├── company-manager.ts
│   │   ├── invoice.ts
│   │   ├── customer.ts
│   │   ├── item.ts
│   │   ├── pdf-generator.ts
│   │   └── template-engine.ts
│   │
│   ├── preload/           # Preload scripts (context bridge)
│   │   └── preload.ts
│   │
│   ├── renderer/          # React frontend
│   │   ├── App.tsx
│   │   ├── Routes.tsx
│   │   ├── pages/         # Page components
│   │   ├── components/    # Reusable components
│   │   ├── providers/     # React context providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── common/        # Shared utilities
│   │   └── theme/         # MUI theme configuration
│   │
│   ├── db/
│   │   └── schema/        # Drizzle ORM schema definitions
│   │
│   ├── shared/            # Shared types and utilities
│   │   ├── invoice.ts     # Invoice types and calculations
│   │   ├── customer.ts
│   │   ├── item.ts
│   │   ├── ipc.ts         # IPC channel definitions
│   │   └── states.ts      # Indian states with codes
│   │
│   └── types/             # TypeScript declarations
│
├── drizzle/               # Database migrations
├── assets/                # Application icons
├── docs/                  # Documentation and specs
└── forge.config.ts        # Electron Forge configuration
```

### Available Scripts

| Script            | Description                                       |
| ----------------- | ------------------------------------------------- |
| `npm start`       | Start the app in development mode with hot reload |
| `npm run package` | Package the app for the current platform          |
| `npm run make`    | Create distributable installers                   |
| `npm run lint`    | Run ESLint for code quality checks                |

### Database

The application uses **SQLite** via `better-sqlite3` for local data storage. Each company has its own database file stored in the user's Documents folder:

```
Documents/
└── QuantoProfessionals/
    ├── company-name.quanto.db
    ├── another-company.quanto.db
    └── recent-companies.json
```

Database schema is managed with **Drizzle ORM**. To generate migrations after schema changes:

```bash
npx drizzle-kit generate
```

### IPC Communication

The app uses Electron's IPC (Inter-Process Communication) for main-renderer communication. All IPC channels are defined in `src/shared/ipc.ts`:

- `CompanyIpcChannel` - Company management
- `CustomerIpcChannel` - Customer CRUD operations
- `InvoiceIpcChannel` - Invoice management
- `ItemIpcChannel` - Item/product management
- `PaymentIpcChannel` - Payment tracking
- `InvoiceFormatIpcChannel` - Template management

## Tech Stack

### Core

| Technology                                      | Purpose                       |
| ----------------------------------------------- | ----------------------------- |
| [Electron](https://www.electronjs.org/)         | Desktop application framework |
| [Electron Forge](https://www.electronforge.io/) | Build tooling and packaging   |
| [React 19](https://react.dev/)                  | UI framework                  |
| [TypeScript](https://www.typescriptlang.org/)   | Type-safe JavaScript          |

### UI

| Technology                                  | Purpose             |
| ------------------------------------------- | ------------------- |
| [MUI (Material UI) v7](https://mui.com/)    | Component library   |
| [Emotion](https://emotion.sh/)              | CSS-in-JS styling   |
| [React Router v7](https://reactrouter.com/) | Client-side routing |

### Data & Forms

| Technology                                                   | Purpose                   |
| ------------------------------------------------------------ | ------------------------- |
| [SQLite](https://www.sqlite.org/)                            | Local database            |
| [better-sqlite3](https://github.com/WiseLibs/better-sqlite3) | SQLite driver for Node.js |
| [Drizzle ORM](https://orm.drizzle.team/)                     | Type-safe ORM             |
| [React Hook Form](https://react-hook-form.com/)              | Form management           |
| [Zod](https://zod.dev/)                                      | Schema validation         |

### Utilities

| Technology                        | Purpose                    |
| --------------------------------- | -------------------------- |
| [EJS](https://ejs.co/)            | Invoice template rendering |
| [date-fns](https://date-fns.org/) | Date manipulation          |
| [Vite](https://vitejs.dev/)       | Build tool and dev server  |

## GST Calculation Logic

The application handles Indian GST calculations as follows:

1. **Intra-state (Same State)**: GST is split into CGST + SGST (equal halves)
2. **Inter-state (Different State)**: Full IGST is applied
3. **Cess**: Additional cess can be applied on top of GST

Example for 18% GST:

- Intra-state: 9% CGST + 9% SGST = 18%
- Inter-state: 18% IGST

The GST type is automatically determined based on the company's state code and the customer's state code.

## Invoice Templates

Invoice templates use EJS (Embedded JavaScript) with full access to invoice data. Available template variables:

```javascript
{
  company: { name, gstin, pan, address, ... },
  customer: { name, gstin, pan, address, ... },
  invoice: { invoiceNumber, invoiceDate, grandTotal, ... },
  items: [{ name, quantity, rate, taxableAmount, ... }],
  taxSummary: [{ type, name, rate, amount, ... }],
  payments: [{ date, amount, method, ... }],
  bankDetails: { bankName, accountNumber, ifscCode, ... },
  // Helper functions
  formatCurrency(amount),
  formatDate(date),
  formatNumber(number)
}
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Development Guidelines

- Follow the existing code style and conventions
- Write meaningful commit messages
- Add/update tests where applicable
- Update documentation for new features

## Roadmap

- [ ] Reports and analytics
- [ ] Data export (CSV, Excel)
- [ ] Data backup and restore
- [ ] Multi-language support
- [ ] Dark mode
- [ ] Recurring invoices
- [ ] Email invoice support
- [ ] E-invoice integration (GST portal)

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Author

**Madhur Goyal**

- Email: hi@mgoyal.com

## Acknowledgements

- [Electron](https://www.electronjs.org/) team for the excellent framework
- [MUI](https://mui.com/) for the beautiful component library
- [Drizzle](https://orm.drizzle.team/) for the type-safe ORM

---

<p align="center">
  Made with ❤️ for Indian service providers
</p>
