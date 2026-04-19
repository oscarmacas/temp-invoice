# Copilot Instructions: Temporary Invoice System

## Project Overview

This is a **temporary invoice management system** designed for use when the main system is unavailable. It's a standalone web application that enables offline invoice registration with product scanning, customer management, and multiple payment method handling. All data is stored locally in browser storage.

**Important:** Invoices created here are temporary and must be migrated to the main system later.

## Architecture

### File Structure & Responsibilities

- **index.html** - Main invoice creation page. Contains forms for customer info, payment methods, and product table. Includes all modals (payment, product search, help).
- **invoices.html** - Invoice search/listing page. Displays saved invoices with statistics and allows viewing/deleting individual records.
- **script.js** (~1000 lines) - Core logic for invoice creation: product addition, calculations, payment processing, keyboard shortcuts, form handling, and localStorage integration.
- **invoices.js** (~500 lines) - Invoice search/listing page logic: filtering, statistics aggregation, export to CSV, local storage retrieval.
- **products.js** - Auto-generated product database. Created by run.bat from an external API. Maps barcode codes to prices and names.
- **success-animation-data.js** - Lottie animation JSON data (auto-generated). Used for success overlay animation.
- **styles.css** - Shared stylesheet for both pages. Responsive design with modal, form, and table styles.
- **run.bat** - Windows batch script that:
  1. Auto-updates the app by fetching latest repo zip from GitHub
  2. Fetches product database from external API using curl
  3. Generates products.js from API response
  4. Stores ETag/timestamp for version tracking

### Data Flow

1. **Product Database**: External API → curl (in run.bat) → JSON → PowerShell processing → products.js
2. **Invoice Creation**: Form inputs → script.js → localStorage (as JSON)
3. **Invoice Retrieval**: localStorage → invoices.js → HTML table display

### Key Design Decisions

- **No Backend**: All data persists locally in browser `localStorage` under key `'savedInvoices'`
- **Offline-First**: Works completely offline after initial load
- **Product Lookup**: Uses barcode scanning via product code input field; searches products.js array
- **Currency**: All amounts in USD (hardcoded $ symbol)
- **Language**: Spanish UI (customer info labels, button text, modals)

## Build, Test, and Lint Commands

No formal build, test, or lint infrastructure exists. This is a vanilla HTML/CSS/JS project.

**Manual Testing:**
- Open `index.html` in a browser to test invoice creation
- Open `invoices.html` to test invoice listing
- Use `run.bat` (Windows only) to update products and app files

**Update System:**
```batch
run.bat
```
This downloads the latest code from GitHub and fetches new product data from the configured API.

**Automated UI Testing:**
This project is configured with Playwright for browser automation testing. Tests can verify invoice creation flow, form validation, payment processing, and data persistence. See `.playwright/` or `playwright.config.js` for test configuration.

## Code Conventions

### Invoice Object Structure
```javascript
{
  customerId: "9999999999",        // CI or RUC
  customerName: "Consumidor Final",
  customerPhone: "0999999999",
  customerEmail: "test@gmail.com",
  paymentMethod: "Efectivo",       // One of: Efectivo, Tarjeta, De Una, JepFaster, Combinado
  items: [
    { code: "123456", name: "Product", qty: 1, price: 10.00, discount: 0, total: 10.00 },
    ...
  ],
  invoiceTotal: 10.00,
  timestamp: 1234567890000         // JavaScript timestamp
}
```

### Payment Methods
- **Efectivo** (Cash): Triggered by cashPaymentModal. Calculates change from received amount.
- **Tarjeta** (Card): Triggered by creditCardPaymentModal. Requires bank selection and batch/lote number.
- **De Una** (App Payment): Triggers combinedPaymentModal internally (single payment method).
- **JepFaster** (Jep): Similar to app payment flow.
- **Combinado** (Combined): Multi-payment modal allowing mix of cash + card with real-time balance calculation.

### Keyboard Shortcuts (Hard-Coded)
- **Ctrl + g** - Save invoice
- **Ctrl + e** - Focus product code input
- **Ctrl + d** - Focus customer ID input
- **Ctrl + f** - Focus payment method select
- **Ctrl + b** - Open product search modal
- **Enter** - Accept in payment modals

### Form Navigation
- Tab/Enter cycles through: Customer ID → Name → Phone → Email → Payment Method → Product Code
- Product search modal uses arrow keys (↑/↓) to select from filtered results, Enter to confirm

### Email Autocomplete
- Triggered when user types in email field
- Suggests common domains (gmail.com, outlook.com, etc.)
- Selected via arrow keys + Enter or mouse click

### Product Searching
- By code: Type barcode in "product-code" field, click add button
- By name: Click search icon or press Ctrl+B, type product name fragment, use arrow keys to select

### Discount Handling
- Applied per-line-item as percentage (not absolute)
- Formula: `total = qty * price * (1 - discount/100)`

### Message Display
- Uses `showMessage(text, type)` function called from both pages
- Auto-hides after 3 seconds
- Types: 'success', 'error', 'info' (defines CSS class)

### Modal Pattern
- All modals use `.modal` and `.modal-content` classes
- Close button class: `.close-button` or specific close class (e.g., `.cash-payment-close`)
- Display toggle: show/hide class or direct `.style.display` manipulation

### LocalStorage Key
All invoices stored under single key: `'savedInvoices'` as JSON array. No indexing or DB abstraction layer.

## Document Validation

### Files
- `validators.js` - Complete validation library with Verhoeff algorithm for Ecuadorian documents
- `VALIDATION_GUIDE.md` - Comprehensive testing guide and examples

### Supported Documents
- **Ecuadorian ID (Cédula)**: 10 digits, includes Verhoeff checksum, province code 01-24
- **Ecuadorian RUC**: 13 digits (10-digit valid cedula + 2-digit type + 2-digit sequential)
- **International Passports (ICAO 9303)**: 6-9 alphanumeric, starts with letter

### Validation Integration
Customer ID field (`#customer-id`) includes:
- Real-time validation on blur (when user leaves field)
- Automatic document type detection
- Visual feedback: green (valid) or red border + background (invalid)
- Error messages in Spanish
- Styling cleared on focus for re-editing

### Usage in Code
```javascript
validateDocument(value);                    // Auto-detect and validate
validateDocument(value, 'cedula');          // Specific type validation
validateCedula(value);                      // Direct cedula validation
validateRUC(value);                         // Direct RUC validation
validatePassport(value);                    // Direct passport validation
detectDocumentType(value);                  // Returns: 'cedula'|'ruc'|'passport'|null
```

### Important Notes
- Validates **structure only**, not document existence (offline-first)
- Special case: `9999999999` (Consumidor Final) is always valid
- Verhoeff algorithm validates first 10 digits of RUC and full Cedula

## Important Notes

### API Integration (run.bat only)
- Configured to call: `https://consulta-codigos.arcana.qzz.io/api/items` (requires X-API-Key header)
- API key hardcoded in run.bat (not sensitive, used for public product lookup)
- Handles malformed JSON and network errors gracefully

### Browser Compatibility
- Depends on `localStorage` (not available in private/incognito mode on some browsers)
- Uses ES6 features (arrow functions, template strings, destructuring)
- Clipboard API used for copy-to-clipboard functionality

### Spanish Localization
Payment method values stored in Spanish ("Efectivo", not "Cash"). Affects filtering/comparisons in invoices.js.

### Files to Preserve
- `.gitignore` includes: `*.bat`, `*.cmd`, `products.js` (auto-generated)
- Never commit `products.js` or `run.bat` output
