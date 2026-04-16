/**
 * Document Validators for Ecuador and International Documents
 * Validates structure (not existence) of:
 * - Ecuadorian ID (Cédula)
 * - Ecuadorian RUC
 * - International Passports (ICAO 9303)
 */

// ============================================
// NOTE: Verhoeff algorithm removed
// Structure-based validation only (offline-first)
// ============================================

// ============================================
// ECUADORIAN ID VALIDATION (Cédula)
// ============================================

function validateCedula(value) {
    if (!value) return false;
    
    // Convert to string and remove spaces
    const cedula = String(value).replace(/\s/g, '').trim();
    
    // Must be exactly 10 digits
    if (!/^\d{10}$/.test(cedula)) return false;
    
    // Special case: Consumidor Final
    if (cedula === '9999999999') return true;
    
    // Validate province code (first 2 digits): 01-24
    const provinceCode = parseInt(cedula.substring(0, 2));
    if (provinceCode < 1 || provinceCode > 24) return false;
    
    // Structure validation only (offline-first, no Verhoeff checksum)
    return true;
}

// ============================================
// ECUADORIAN RUC VALIDATION
// ============================================

function validateRUC(value) {
    if (!value) return false;
    
    // Convert to string and remove spaces
    const ruc = String(value).replace(/\s/g, '').trim();
    
    // Must be exactly 13 digits
    if (!/^\d{13}$/.test(ruc)) return false;
    
    // First 10 digits must be a valid cedula
    const cedulaPart = ruc.substring(0, 10);
    if (!validateCedula(cedulaPart)) return false;
    
    // Digits 10-11: Contributor type (00-14)
    const contributorType = ruc.substring(10, 12);
    const validTypes = ['00', '01', '02', '03', '04', '05', '06', '07', '08', '09', '10', '11', '12', '13', '14'];
    if (!validTypes.includes(contributorType)) return false;
    
    // Last 2 digits: Sequential number (00-99)
    const sequential = ruc.substring(11, 13);
    if (!/^\d{2}$/.test(sequential)) return false;
    
    return true;
}

// ============================================
// INTERNATIONAL PASSPORT VALIDATION (ICAO 9303)
// ============================================

function validatePassport(value) {
    if (!value) return false;
    
    // Convert to string and remove spaces
    const passport = String(value).replace(/\s/g, '').trim();
    
    // International passports: 6-9 alphanumeric characters
    // First character: Letter (country/type code)
    // Remaining: Letters and numbers
    
    // Check length: 6-9 characters
    if (passport.length < 6 || passport.length > 9) return false;
    
    // First character must be a letter
    if (!/^[A-Z]/.test(passport)) return false;
    
    // Remaining characters must be alphanumeric (letters and numbers only)
    if (!/^[A-Z][A-Z0-9]*$/.test(passport)) return false;
    
    return true;
}

// ============================================
// DOCUMENT TYPE DETECTION
// ============================================

function detectDocumentType(value) {
    if (!value) return null;
    
    const input = String(value).replace(/\s/g, '').trim();
    
    // Check by length first
    if (input.length === 10 && /^\d+$/.test(input)) {
        if (validateCedula(input)) return 'cedula';
        return null;
    }
    
    if (input.length === 13 && /^\d+$/.test(input)) {
        if (validateRUC(input)) return 'ruc';
        return null;
    }
    
    if ((input.length >= 6 && input.length <= 9) && /^[A-Z]/.test(input)) {
        if (validatePassport(input)) return 'passport';
        return null;
    }
    
    return null;
}

// ============================================
// UNIFIED VALIDATION FUNCTION
// ============================================

function validateDocument(value, documentType = null) {
    if (!value) return { valid: false, type: null, error: 'Documento vacío' };
    
    const input = String(value).replace(/\s/g, '').trim();
    
    // If document type is specified, validate only that type
    if (documentType) {
        switch (documentType.toLowerCase()) {
            case 'cedula':
            case 'ci':
                return {
                    valid: validateCedula(input),
                    type: 'cedula',
                    error: validateCedula(input) ? null : 'Cédula inválida. Debe tener 10 dígitos y código de provincia válido (01-24)'
                };
            
            case 'ruc':
                return {
                    valid: validateRUC(input),
                    type: 'ruc',
                    error: validateRUC(input) ? null : 'RUC inválido. Debe tener 13 dígitos (cédula válida + tipo contribuyente + secuencial)'
                };
            
            case 'passport':
            case 'pasaporte':
                return {
                    valid: validatePassport(input),
                    type: 'passport',
                    error: validatePassport(input) ? null : 'Pasaporte inválido. Debe tener 6-9 caracteres: letra inicial + números/letras'
                };
            
            default:
                return { valid: false, type: null, error: 'Tipo de documento no reconocido' };
        }
    }
    
    // Auto-detect document type
    const detectedType = detectDocumentType(input);
    
    if (!detectedType) {
        return {
            valid: false,
            type: null,
            error: 'Formato de documento no válido. Use: Cédula (10 dígitos), RUC (13 dígitos) o Pasaporte (6-9 caracteres)'
        };
    }
    
    let valid = false;
    let error = null;
    
    switch (detectedType) {
        case 'cedula':
            valid = validateCedula(input);
            error = valid ? null : 'Cédula inválida';
            break;
        case 'ruc':
            valid = validateRUC(input);
            error = valid ? null : 'RUC inválido';
            break;
        case 'passport':
            valid = validatePassport(input);
            error = valid ? null : 'Pasaporte inválido';
            break;
    }
    
    return { valid, type: detectedType, error };
}

// ============================================
// EXPORT FOR BROWSER
// ============================================

// Make functions available globally if used in browser
if (typeof window !== 'undefined') {
    window.validators = {
        validateCedula,
        validateRUC,
        validatePassport,
        validateDocument,
        detectDocumentType
    };
}
