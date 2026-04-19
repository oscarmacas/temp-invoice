# Document Validation - Test Cases & Implementation Guide

## Overview
Integrated document validation for:
- **Ecuadorian ID (Cédula)** - 10 digits with Verhoeff check
- **Ecuadorian RUC** - 13 digits (10-digit valid cedula + type + sequential)
- **International Passports** - 6-9 alphanumeric (ICAO 9303)

## Files Added/Modified

### New Files:
- `validators.js` - Complete validation library with Verhoeff algorithm

### Modified Files:
- `index.html` - Added script reference to validators.js
- `script.js` - Added validation listener to customer ID field

## Validation Features

### 1. Ecuadorian ID (Cédula)
**Structure:** 10 digits exactly
- Format: `XXXXXXXXXX`
- Province code: First 2 digits (01-24)
- Verhoeff check digit: Last digit
- Special case: `9999999999` (Consumidor Final)

**Examples:**
- Valid: `1234567890` (if Verhoeff is correct)
- Valid: `9999999999` (Consumidor Final)
- Invalid: `12345678` (too short)
- Invalid: `25123456789` (province > 24)

### 2. Ecuadorian RUC
**Structure:** 13 digits exactly
- First 10: Valid cedula (with Verhoeff check)
- Digits 10-11: Contributor type (01-12)
- Digits 12-13: Sequential number (00-99)
- Format: `XXXXXXXXXX + XX + XX`

**Examples:**
- Valid: `1234567890001` (if first 10 are valid cedula)
- Invalid: `1234567890099` (contributor type 00 not valid)
- Invalid: `9999999999001` (uses special cedula)

### 3. International Passport (ICAO 9303)
**Structure:** 6-9 alphanumeric characters
- First character: LETTER (A-Z)
- Remaining: Letters or numbers (A-Z, 0-9)
- No spaces or special characters
- Format: `L + (5-8 alphanumeric)`

**Examples:**
- Valid: `ABC123456` (9 chars)
- Valid: `EC123456` (8 chars)
- Valid: `E1234567` (8 chars)
- Invalid: `1ABC123` (starts with number)
- Invalid: `AB CD1234` (contains space)
- Invalid: `ABC@123` (contains special char)

## Real-Time Validation

The customer ID field now has:
1. **Blur validation** - Validates when user leaves the field
2. **Visual feedback**:
   - Green success message
   - Red border + red background on error
   - Clear error message indicating what's wrong
3. **Auto-detection** - Determines if it's a Cédula, RUC, or Passport
4. **Focus clear** - Removes red styling when user clicks to edit

## How to Use

### In HTML Form:
```html
<input type="text" id="customer-id" placeholder="9999999999">
```

### From JavaScript:
```javascript
// Auto-detect and validate
const result = validateDocument('1234567890');
// Returns: { valid: true/false, type: 'cedula'|'ruc'|'passport', error: null|'message' }

// Specific type validation
const result = validateDocument('1234567890', 'cedula');
const result = validateDocument('1234567890001', 'ruc');
const result = validateDocument('ABC123456', 'passport');

// Direct validators
validateCedula('1234567890');      // → boolean
validateRUC('1234567890001');      // → boolean
validatePassport('ABC123456');     // → boolean
```

## Implementation Details

### Verhoeff Algorithm
- Implements the official Verhoeff check digit algorithm
- Used for Ecuadorian Cedula (last digit)
- Also validates first 10 digits of RUC
- Tables: Inv table (10 values) + Perm table (10x10 matrix)

### Auto-Detection Logic
1. **10 digits** + valid → Cédula
2. **13 digits** + valid cedula in first 10 → RUC
3. **6-9 characters** + starts with letter → Passport
4. Otherwise → Invalid

### Error Handling
All validators return meaningful error messages:
- "Cédula inválida. Debe tener 10 dígitos..."
- "RUC inválido. Debe tener 13 dígitos..."
- "Pasaporte inválido. Debe tener 6-9 caracteres..."

## Testing Scenarios

### Valid Cédulas (Real Verhoeff):
- `1712345678` - Province 17, valid Verhoeff
- `0912345675` - Province 09, valid Verhoeff

### Valid RUCs:
- `1712345678001` - Valid cedula + type 00 + seq 01
- `1712345678005` - Valid cedula + type 00 + seq 05

### Valid Passports:
- `E1234567` - Ecuadorian format
- `ABC12345` - Generic format
- `US1234567` - USA format (example)

### Invalid Examples:
- `123456789` - Cedula too short
- `12345678901` - Cedula too long
- `25123456789` - Province > 24
- `1234567890` - Cedula (if Verhoeff fails)
- `9999999999001` - RUC with special cedula
- `123456789` - Passport starts with number
- `AB CD123` - Passport with space

## Future Enhancements

- Add Ministry of Health doc validation
- Add Ecuadorian vehicle plate validation
- Add checksum validation for other document types
- Add optional online verification (needs backend)
- Add document expiration date tracking
- Support for formatted input (spaces, dashes)
