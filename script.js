document.addEventListener('DOMContentLoaded', () => {

    // --- DOM Elements ---
    const customerIdInput = document.getElementById('customer-id');
    const customerNameInput = document.getElementById('customer-name');
    const customerAddressInput = document.getElementById('customer-address');
    const customerEmailInput = document.getElementById('customer-email');
    const paymentMethodSelect = document.getElementById('payment-method');
    const productCodeInput = document.getElementById('product-code');
    const addProductButton = document.getElementById('add-product-button');
    const searchProductButton = document.getElementById('search-product-button'); // New
    const invoiceBody = document.getElementById('invoice-body');
    const invoiceTotalSpan = document.getElementById('invoice-total');
    const totalProductsSpan = document.getElementById('total-products');
    const totalCodesSpan = document.getElementById('total-codes');
    const saveInvoiceButton = document.getElementById('save-invoice-button');
    const newInvoiceButton = document.getElementById('new-invoice-button');
    const messageBox = document.getElementById('message-box');

    // Product Search Modal Elements
    const productSearchModal = document.getElementById('product-search-modal');
    const closeProductSearchButton = productSearchModal.querySelector('.product-search-close');
    const productSearchInput = document.getElementById('product-search-input');
    const productSearchResults = document.getElementById('product-search-results');

    // Add these after the existing DOM Elements section
    const cashPaymentModal = document.getElementById('cash-payment-modal');
    const creditCardPaymentModal = document.getElementById('credit-card-payment-modal');
    const combinedPaymentModal = document.getElementById('combined-payment-modal');

    const cashReceivedInput = document.getElementById('cash-received');
    const cashChangeSpan = document.getElementById('cash-change');
    const cashTotalAmountSpan = document.getElementById('cash-total-amount');
    const creditTotalAmountSpan = document.getElementById('credit-total-amount');
    const combinedTotalAmountSpan = document.getElementById('combined-total-amount');
    const combinedPaymentInputs = document.getElementById('combined-payment-inputs');
    const combinedEnteredAmountSpan = document.getElementById('combined-entered-amount');
    const combinedDifferenceSpan = document.getElementById('combined-difference');

    let messageTimeout;

    // Add this after the DOM Elements section
    const formInputs = [
        customerIdInput,
        customerNameInput,
        customerAddressInput,
        customerEmailInput,
        paymentMethodSelect,
        productCodeInput
    ];

    // Add Enter key navigation
    formInputs.forEach((input, index) => {
        input.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                if (index < formInputs.length - 1) {
                    formInputs[index + 1].focus();
                }
            }
        });
    });

    // --- Email Autocomplete ---
    const emailDomains = [
        '@gmail.com',
        '@outlook.com',
        '@hotmail.com',
        '@yahoo.com',
        '@icloud.com',
        '@protonmail.com',
        '@aol.com',
        '@mail.com',
        '@zoho.com',
        '@yandex.com'
    ];
    
    const emailSuggestions = document.getElementById('email-suggestions');
    let selectedSuggestionIndex = -1;
    
    customerEmailInput.addEventListener('input', function() {
        const inputValue = this.value.trim();
        const atIndex = inputValue.indexOf('@');
        
        // Clear suggestions
        emailSuggestions.innerHTML = '';
        emailSuggestions.style.display = 'none';
        selectedSuggestionIndex = -1;
        
        // If there's text and either no @ or @ is at the end, show suggestions
        if (inputValue && (atIndex === -1 || atIndex === inputValue.length - 1)) {
            const username = atIndex === -1 ? inputValue : inputValue.substring(0, atIndex);
            
            // Create and append suggestions
            emailDomains.forEach((domain, index) => {
                const suggestion = document.createElement('div');
                suggestion.className = 'email-suggestion';
                suggestion.textContent = username + domain;
                suggestion.dataset.value = username + domain;
                
                suggestion.addEventListener('click', () => {
                    customerEmailInput.value = username + domain;
                    emailSuggestions.style.display = 'none';
                });
                
                emailSuggestions.appendChild(suggestion);
            });
            
            if (emailSuggestions.children.length > 0) {
                emailSuggestions.style.display = 'block';
            }
        }
    });
    
    customerEmailInput.addEventListener('keydown', function(e) {
        const suggestions = emailSuggestions.querySelectorAll('.email-suggestion');
        
        if (suggestions.length === 0) return;
        
        // Down arrow
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            selectedSuggestionIndex = Math.min(selectedSuggestionIndex + 1, suggestions.length - 1);
            updateSelectedSuggestion(suggestions);
        }
        // Up arrow
        else if (e.key === 'ArrowUp') {
            e.preventDefault();
            selectedSuggestionIndex = Math.max(selectedSuggestionIndex - 1, 0);
            updateSelectedSuggestion(suggestions);
        }
        // Enter key
        else if (e.key === 'Enter' && selectedSuggestionIndex >= 0) {
            e.preventDefault();
            customerEmailInput.value = suggestions[selectedSuggestionIndex].dataset.value;
            emailSuggestions.style.display = 'none';
        }
        // Escape key
        else if (e.key === 'Escape') {
            emailSuggestions.style.display = 'none';
        }
    });
    
    function updateSelectedSuggestion(suggestions) {
        // Remove selected class from all suggestions
        suggestions.forEach(suggestion => suggestion.classList.remove('selected'));
        
        // Add selected class to current suggestion
        if (selectedSuggestionIndex >= 0) {
            suggestions[selectedSuggestionIndex].classList.add('selected');
            suggestions[selectedSuggestionIndex].scrollIntoView({ block: 'nearest' });
        }
    }
    
    // Hide suggestions when clicking outside
    document.addEventListener('click', function(e) {
        if (!customerEmailInput.contains(e.target) && !emailSuggestions.contains(e.target)) {
            emailSuggestions.style.display = 'none';
        }
    });

    // --- Functions ---

    function showMessage(message, type = 'success') {
        clearTimeout(messageTimeout);
        messageBox.textContent = message;
        messageBox.className = `message-box ${type} show`;
        messageTimeout = setTimeout(() => {
            messageBox.className = 'message-box';
        }, 3000);
    }

    function showSuccessAnimation() {
        const overlay = document.getElementById('success-overlay');
        const animationContainer = document.getElementById('success-animation');

        // Show overlay
        overlay.classList.add('show');

        // Load and play Lottie animation
        const animation = lottie.loadAnimation({
            container: animationContainer,
            renderer: 'svg',
            loop: false,
            autoplay: true,
            animationData: successAnimationData
        });

        // When animation completes, hide overlay and clear form
        animation.addEventListener('complete', () => {
            setTimeout(() => {
                overlay.classList.remove('show');
                animation.destroy();
                clearForm();
            }, 500);
        });
    }

    function findProduct(code) {
        return products.find(p => p.code === code);
    }

    function validateDiscount(discountInput) {
        let value = parseFloat(discountInput.value);
        if (isNaN(value) || value < 0) value = 0;
        else if (value > 100) value = 100;
        discountInput.value = value;
        return value;
    }

    function updateRowTotal(row) {
        const quantityInput = row.querySelector('.quantity-input');
        const discountInput = row.querySelector('.discount-input');
        const price = parseFloat(row.dataset.price);
        const quantity = parseInt(quantityInput.value, 10);
        const discount = validateDiscount(discountInput);
        const totalCell = row.querySelector('.row-total');

        if (!isNaN(price) && !isNaN(quantity) && quantity > 0) {
            const subTotal = price * quantity;
            const discountAmount = subTotal * (discount / 100);
            const total = subTotal - discountAmount;
            totalCell.textContent = total.toFixed(2);
        } else {
            totalCell.textContent = '0.00';
        }
        updateInvoiceTotal();
    }

    function updateInvoiceTotal() {
        let total = 0;
        invoiceBody.querySelectorAll('tr').forEach(row => {
            const totalCell = row.querySelector('.row-total');
            if (totalCell) {
                const value = parseFloat(totalCell.textContent) || 0;
                total += value;
            }
        });
        invoiceTotalSpan.textContent = total.toFixed(2);
        updateInvoiceSummary();
        fillInvoiceTableWithEmptyRows();
    }

    function updateRowNumbers() {
        const rows = Array.from(invoiceBody.querySelectorAll('tr')).filter(row => !row.classList.contains('empty-row'));
        rows.forEach((row, index) => {
            const rowNumberCell = row.querySelector('.row-number');
            if (rowNumberCell) {
                rowNumberCell.textContent = index + 1;
            }
        });
    }

    function updateInvoiceSummary() {
        const rows = Array.from(invoiceBody.querySelectorAll('tr')).filter(row => !row.classList.contains('empty-row'));

        // Total products = sum of all quantities
        let totalProducts = 0;
        rows.forEach(row => {
            const quantityInput = row.querySelector('.quantity-input');
            if (quantityInput) {
                totalProducts += parseInt(quantityInput.value, 10) || 0;
            }
        });

        // Total codes = count of unique product rows
        const totalCodes = rows.length;

        totalProductsSpan.textContent = totalProducts;
        totalCodesSpan.textContent = totalCodes;
    }

    function generateFilename() {
        const now = new Date();
        const timestamp = `${now.getFullYear()}_${String(now.getMonth() + 1).padStart(2, '0')}_${String(now.getDate()).padStart(2, '0')}_${String(now.getHours()).padStart(2, '0')}_${String(now.getMinutes()).padStart(2, '0')}_${String(now.getSeconds()).padStart(2, '0')}`;
        return `invoice_${timestamp}.csv`;
    }

    function downloadCSV(csvContent, filename) {
        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute('href', url);
            link.setAttribute('download', filename);
            link.style.visibility = 'hidden';
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
        } else {
            showMessage('CSV download not supported.', 'error');
        }
    }

    function clearForm() {
        customerIdInput.value = '';
        customerNameInput.value = '';
        customerAddressInput.value = '';
        customerEmailInput.value = '';
        paymentMethodSelect.selectedIndex = 0;
        productCodeInput.value = '';
        invoiceBody.innerHTML = '';
        updateInvoiceTotal();
        
        // Focus on product code input field after clearing the form
        setTimeout(() => {
            productCodeInput.focus();
        }, 100);
    }

    // --- Local Storage Operations ---
    const STORAGE_KEY = 'savedInvoices';

    function saveToLocalStorage(invoices) { // Now saves the whole array
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
        } catch (e) {
            console.error("Error saving to local storage:", e);
            showMessage('Could not save invoice locally.', 'error');
        }
    }

    function loadFromLocalStorage() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            console.error("Error loading from local storage:", e);
            showMessage('Could not load saved invoices.', 'error');
            return [];
        }
    }

    // --- Save Invoice (Main Function) ---
    function saveInvoice() {
        const paymentMethod = paymentMethodSelect.value;
        const items = Array.from(invoiceBody.querySelectorAll('tr')).filter(row => {
            // Filter out empty rows (row.cells[1] is the code column, cells[0] is row number)
            const code = row.cells[1] ? row.cells[1].textContent.trim() : '';
            return code !== '' && code !== 'Empty';
        });

        if (!paymentMethod) {
            showMessage('Please select a payment method.', 'error');
            paymentMethodSelect.focus(); return;
        }
        if (items.length === 0) {
            showMessage('Please add at least one product.', 'error');
            productCodeInput.focus(); return;
        }

        const customerInfo = {
            id: customerIdInput.value.trim() || '9999999999',
            name: customerNameInput.value.trim() || 'Consumidor Final',
            address: customerAddressInput.value.trim() || 'Ecuador',
            email: customerEmailInput.value.trim() || 'mumusoecuador@gmail.com'
        };

        const invoiceItems = [];
        items.forEach(row => {
            const quantityInput = row.querySelector('.quantity-input');
            const discountInput = row.querySelector('.discount-input');
            
            // Skip if no quantity input (empty row)
            if (!quantityInput) return;
            
            invoiceItems.push({
                code: row.cells[1].textContent,
                name: row.cells[2].textContent,
                quantity: parseInt(quantityInput.value, 10),
                price: parseFloat(row.dataset.price),
                discount: parseFloat(discountInput.value) || 0,
                total: parseFloat(row.cells[6].textContent)
            });
        });

        const invoiceTotal = parseFloat(invoiceTotalSpan.textContent);
        const saveTimestamp = new Date().toISOString();

        const invoiceData = {
            customer: customerInfo,
            paymentMethod: paymentMethod,
            items: invoiceItems,
            invoiceTotal: invoiceTotal,
            saveTimestamp: saveTimestamp,
            status: 'Pending'
        };

        // Add payment details based on payment method
        if (paymentMethod === 'Tarjeta') {
            invoiceData.bank = document.getElementById('bank-select').value;
            invoiceData.loteNumber = document.getElementById('lote-number').value.trim();
        } else if (paymentMethod === 'Combinado') {
            const combinedPayments = {};
            document.querySelectorAll('.combined-payment-input').forEach(input => {
                const amount = parseFloat(input.value) || 0;
                if (amount > 0) {
                    combinedPayments[input.dataset.method] = amount;
                }
            });
            invoiceData.combinedPayments = combinedPayments;
        }

        // Save to Local Storage (add to existing list)
        const invoices = loadFromLocalStorage();
        invoices.push(invoiceData);
        saveToLocalStorage(invoices);

        // Generate CSV
        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Type,Value\r\n";
        csvContent += `Customer ID,"${customerInfo.id}"\r\n`;
        csvContent += `Customer Name,"${customerInfo.name}"\r\n`;
        csvContent += `Customer Address,"${customerInfo.address}"\r\n`;
        csvContent += `Customer Email,"${customerInfo.email}"\r\n`;
        csvContent += `Payment Method,"${paymentMethod}"\r\n`;
        if (paymentMethod === 'Tarjeta') {
            csvContent += `Bank,"${invoiceData.bank}"\r\n`;
            csvContent += `Lote Number,"${invoiceData.loteNumber}"\r\n`;
        } else if (paymentMethod === 'Combinado') {
            Object.entries(invoiceData.combinedPayments).forEach(([method, amount]) => {
                csvContent += `${method} Amount,${amount.toFixed(2)}\r\n`;
            });
        }
        csvContent += `Status,"${invoiceData.status}"\r\n`;
        csvContent += "\r\n";
        csvContent += "Code,Name,Quantity,Price,Discount (%),Total\r\n";
        invoiceItems.forEach(item => {
            csvContent += `${item.code},"${item.name}",${item.quantity},${item.price.toFixed(2)},${item.discount.toFixed(2)},${item.total.toFixed(2)}\r\n`;
        });
        csvContent += "\r\n";
        csvContent += `Invoice Total,,,,,,${invoiceTotal.toFixed(2)}\r\n`;

        // Trigger Download
        const filename = generateFilename();
        downloadCSV(csvContent, filename);

        // Print receipt to thermal printer
        printReceipt(invoiceData);

        // Show success animation instead of message
        showSuccessAnimation();
    }

    // --- Print Receipt Function ---
    function printReceipt(invoiceData) {
        const timestamp = new Date().getTime();
        const filename = `invoice_${timestamp}.json`;

        // Create blob with invoice data
        const blob = new Blob([JSON.stringify(invoiceData, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('Invoice JSON saved for printing:', filename);
    }

    saveInvoiceButton.addEventListener('click', () => {
        const paymentMethod = paymentMethodSelect.value;
        const total = parseFloat(invoiceTotalSpan.textContent);

        if (!paymentMethod) {
            showMessage('Por favor seleccione un método de pago.', 'error');
            return;
        }
        
        // Check if there are items in the invoice
        const items = Array.from(invoiceBody.querySelectorAll('tr')).filter(row => {
            const code = row.cells[0].textContent.trim();
            return code !== '' && code !== 'Empty';
        });
        
        if (items.length === 0) {
            showMessage('Por favor agregue al menos un producto.', 'error');
            return;
        }

        switch(paymentMethod) {
            case 'Efectivo':
                showCashPaymentModal(total);
                break;
            case 'Tarjeta':
                showCreditCardPaymentModal(total);
                break;
            case 'Combinado':
                showCombinedPaymentModal(total);
                break;
            default:
                // For De Una and JepFaster, directly save the invoice
                saveInvoice();
                break;
        }
    });

    // --- Product Search Modal Logic ---
    function openProductSearchModal() {
        productSearchInput.value = ''; // Clear previous search
        productSearchResults.innerHTML = '<p>Usa las flechas arriba/abajo para seleccionar un codigo</p>'; // Reset results
        productSearchModal.style.display = 'flex';
        productSearchInput.focus();
    }

    function closeProductSearchModal() {
        productSearchModal.style.display = 'none';
    }

    function performProductSearch() {
        const searchTerm = productSearchInput.value.trim().toLowerCase();
        productSearchResults.innerHTML = ''; // Clear previous results

        if (searchTerm.length < 2) { // Start searching after 2 characters
             productSearchResults.innerHTML = '<p>Usa las flechas arriba/abajo para seleccionar un codigo</p>';
             return;
        }

        const matchedProducts = products.filter(p =>
            p.name.toLowerCase().includes(searchTerm)
        );

        if (matchedProducts.length === 0) {
            productSearchResults.innerHTML = '<p>No products found matching that name.</p>';
        } else {
            matchedProducts.forEach(p => {
                const item = document.createElement('div');
                item.classList.add('search-result-item');
                item.dataset.code = p.code; // Store code for selection
                item.innerHTML = `
                    <span class="product-code">${p.code}</span>
                    <span class="product-name">${p.name}</span>
                    <span class="product-price">$${p.price.toFixed(2)}</span>
                `;
                item.addEventListener('click', () => {
                    selectSearchResult(p.code);
                });
                productSearchResults.appendChild(item);
            });
            
            // Select the first result by default
            const firstItem = productSearchResults.querySelector('.search-result-item');
            if (firstItem) {
                firstItem.classList.add('selected');
            }
        }
    }
    
    // Handle keyboard navigation in search results
    function handleSearchKeyNavigation(e) {
        const selected = productSearchResults.querySelector('.search-result-item.selected');
        const items = productSearchResults.querySelectorAll('.search-result-item');
        
        if (items.length === 0) return;
        
        if (e.key === 'ArrowDown') {
            e.preventDefault();
            if (selected) {
                const next = selected.nextElementSibling;
                if (next && next.classList.contains('search-result-item')) {
                    selected.classList.remove('selected');
                    next.classList.add('selected');
                    next.scrollIntoView({ block: 'nearest' });
                }
            }
        } else if (e.key === 'ArrowUp') {
            e.preventDefault();
            if (selected) {
                const prev = selected.previousElementSibling;
                if (prev && prev.classList.contains('search-result-item')) {
                    selected.classList.remove('selected');
                    prev.classList.add('selected');
                    prev.scrollIntoView({ block: 'nearest' });
                }
            }
        } else if (e.key === 'Enter') {
            e.preventDefault();
            if (selected) {
                const code = selected.dataset.code;
                selectSearchResult(code);
            }
        } else if (e.key === 'Escape') {
            closeProductSearchModal();
        }
    }
    
    function selectSearchResult(code) {
        productCodeInput.value = code;
        closeProductSearchModal();
        setTimeout(() => {
            addProduct(); // Automatically add the product
        }, 100);
    }

    productSearchInput.addEventListener('input', performProductSearch);
    productSearchInput.addEventListener('keydown', handleSearchKeyNavigation);

    // --- Event Listeners ---

    addProductButton.addEventListener('click', addProduct);
    productCodeInput.addEventListener('keypress', (e) => { if (e.key === 'Enter') addProduct(); });
    
    // Product Search Listeners
    searchProductButton.addEventListener('click', openProductSearchModal);
    closeProductSearchButton.addEventListener('click', closeProductSearchModal);
    productSearchModal.addEventListener('click', (event) => { // Close on overlay click
        if (event.target === productSearchModal) closeProductSearchModal();
    });

    // New Invoice Button Listener
    newInvoiceButton.addEventListener('click', () => {
        clearForm();
        showMessage('Nueva factura iniciada', 'success');
    });

    // Cash Payment Modal Functions
    function showCashPaymentModal(total) {
        console.log('Showing cash payment modal with total:', total);
        cashTotalAmountSpan.textContent = `$${total.toFixed(2)}`;
        cashReceivedInput.value = '';
        cashChangeSpan.textContent = '$0.00';
        cashPaymentModal.style.display = 'flex';
        cashReceivedInput.focus();
        
        // Add keydown event listener directly to the input field
        cashReceivedInput.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('accept-cash-payment').click();
            }
        };
    }

    cashReceivedInput.addEventListener('input', () => {
        const total = parseFloat(cashTotalAmountSpan.textContent.replace('$', ''));
        const received = parseFloat(cashReceivedInput.value) || 0;
        const change = received - total;
        console.log('Cash payment input changed:', { total, received, change });
        cashChangeSpan.textContent = `$${change.toFixed(2)}`;
    });

    document.getElementById('accept-cash-payment').addEventListener('click', () => {
        const received = parseFloat(cashReceivedInput.value) || 0;
        const total = parseFloat(cashTotalAmountSpan.textContent.replace('$', ''));
        
        if (received < total) {
            showMessage('El monto recibido es menor al total.', 'error');
            return;
        }
        
        cashPaymentModal.style.display = 'none';
        saveInvoice();
    });

    // Credit Card Payment Modal Functions
    function showCreditCardPaymentModal(total) {
        creditTotalAmountSpan.textContent = `$${total.toFixed(2)}`;
        document.getElementById('bank-select').selectedIndex = 0;
        document.getElementById('lote-number').value = '';
        creditCardPaymentModal.style.display = 'flex';
        
        const bankSelect = document.getElementById('bank-select');
        const loteNumber = document.getElementById('lote-number');
        
        bankSelect.focus();
        
        // Add keydown event to lote number input
        loteNumber.onkeydown = function(e) {
            if (e.key === 'Enter') {
                e.preventDefault();
                document.getElementById('accept-credit-payment').click();
            }
        };
    }

    document.getElementById('accept-credit-payment').addEventListener('click', () => {
        const bank = document.getElementById('bank-select').value;
        const loteNumber = document.getElementById('lote-number').value.trim();
        
        if (!bank) {
            showMessage('Por favor seleccione un banco.', 'error');
            return;
        }
        
        if (!loteNumber) {
            showMessage('Por favor ingrese el número de lote.', 'error');
            return;
        }
        
        creditCardPaymentModal.style.display = 'none';
        saveInvoice();
    });

    // Combined Payment Modal Functions
    function showCombinedPaymentModal(total) {
        combinedTotalAmountSpan.textContent = `$${total.toFixed(2)}`;
        
        // Generate payment method inputs dynamically
        const paymentMethods = ['Efectivo', 'Tarjeta', 'De Una', 'JepFaster'];
        const combinedPaymentInputsContainer = document.getElementById('combined-payment-inputs');
        
        // Clear previous inputs
        combinedPaymentInputsContainer.innerHTML = '';
        
        // Create input for each payment method
        paymentMethods.forEach(method => {
            const formGroup = document.createElement('div');
            formGroup.className = 'form-group';
            
            const label = document.createElement('label');
            label.textContent = `${method}:`;
            
            const input = document.createElement('input');
            input.type = 'number';
            input.step = '0.01';
            input.min = '0';
            input.className = 'combined-payment-input';
            input.dataset.method = method;
            input.placeholder = '0.00';
            
            formGroup.appendChild(label);
            formGroup.appendChild(input);
            combinedPaymentInputsContainer.appendChild(formGroup);
        });
        
        // Clear previous values
        const inputFields = document.querySelectorAll('.combined-payment-input');
        inputFields.forEach(input => {
            input.value = '';
            
            // Add keydown event to each input field
            input.onkeydown = function(e) {
                if (e.key === 'Enter') {
                    e.preventDefault();
                    
                    // Find the next input field
                    const currentIndex = Array.from(inputFields).indexOf(this);
                    if (currentIndex < inputFields.length - 1) {
                        // Move to next input if not the last one
                        inputFields[currentIndex + 1].focus();
                        inputFields[currentIndex + 1].select();
                    } else {
                        // If it's the last input, click the accept button
                        document.getElementById('accept-combined-payment').click();
                    }
                }
            };
        });
        
        combinedEnteredAmountSpan.textContent = '$0.00';
        combinedDifferenceSpan.textContent = `$${total.toFixed(2)}`;
        combinedDifferenceSpan.className = 'negative';
        
        combinedPaymentModal.style.display = 'flex';
        
        // Focus on the first input field
        if (inputFields.length > 0) {
            inputFields[0].focus();
            inputFields[0].select();
        }
    }

    combinedPaymentInputs.addEventListener('input', (e) => {
        if (e.target.classList.contains('combined-payment-input')) {
            updateCombinedPaymentTotal();
        }
    });

    function updateCombinedPaymentTotal() {
        const total = parseFloat(combinedTotalAmountSpan.textContent.replace('$', ''));
        let enteredTotal = 0;
        
        document.querySelectorAll('.combined-payment-input').forEach(input => {
            enteredTotal += parseFloat(input.value) || 0;
        });
        
        const difference = total - enteredTotal;
        combinedEnteredAmountSpan.textContent = `$${enteredTotal.toFixed(2)}`;
        combinedDifferenceSpan.textContent = `$${difference.toFixed(2)}`;
        
        if (difference === 0) {
            combinedDifferenceSpan.className = 'zero';
        } else {
            combinedDifferenceSpan.className = '';
        }
    }

    document.getElementById('accept-combined-payment').addEventListener('click', () => {
        const difference = parseFloat(combinedDifferenceSpan.textContent.replace('$', ''));
        
        if (difference !== 0) {
            showMessage('El total ingresado no coincide con el total de la factura.', 'error');
            return;
        }
        
        combinedPaymentModal.style.display = 'none';
        saveInvoice();
    });

    // Close buttons for modals
    document.querySelectorAll('.close-button').forEach(button => {
        button.addEventListener('click', () => {
            button.closest('.modal').style.display = 'none';
        });
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target.classList.contains('modal')) {
            e.target.style.display = 'none';
        }
    });

    // Help button and modal
    const helpButton = document.getElementById('help-button');
    const helpModal = document.getElementById('help-modal');
    const closeHelpButton = document.querySelector('.help-modal-close');

    helpButton.addEventListener('click', () => {
        helpModal.style.display = 'flex';
    });

    closeHelpButton.addEventListener('click', () => {
        helpModal.style.display = 'none';
    });

    // Keyboard shortcuts
    document.addEventListener('keydown', function(e) {
        // Only process if not in an input field or if explicitly allowed
        const isInInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        
        // Ctrl+G: Save invoice (Guardar factura)
        if (e.ctrlKey && e.key.toLowerCase() === 'g') {
            e.preventDefault();
            saveInvoiceButton.click();
        }
        
        // Ctrl+E: Focus on product scan field (Escanear)
        if (e.ctrlKey && e.key.toLowerCase() === 'e') {
            e.preventDefault();
            productCodeInput.focus();
        }
        
        // Ctrl+D: Focus on customer ID field (Documento/CI/RUC)
        if (e.ctrlKey && e.key.toLowerCase() === 'd') {
            e.preventDefault();
            customerIdInput.focus();
        }
        
        // Ctrl+F: Focus on payment method (Forma de pago)
        if (e.ctrlKey && e.key.toLowerCase() === 'f') {
            e.preventDefault();
            paymentMethodSelect.focus();
        }
        
        // Ctrl+B: Open product search (Buscar)
        if (e.ctrlKey && e.key.toLowerCase() === 'b') {
            e.preventDefault();
            searchProductButton.click();
        }
    });

    // --- Fill Invoice Table with Empty Rows ---
    function fillInvoiceTableWithEmptyRows() {
        const table = document.getElementById('invoice-table');
        const tbody = document.getElementById('invoice-body');
        const header = table.querySelector('thead');
        // Calculate available height for tbody
        const tableRect = table.getBoundingClientRect();
        const headerRect = header.getBoundingClientRect();
        const maxTableHeight = parseInt(getComputedStyle(table).maxHeight) || 320;
        const rowHeight = 38; // px, should match CSS
        const currentRows = tbody.querySelectorAll('tr').length;
        let visibleRows = Math.floor((maxTableHeight - headerRect.height) / rowHeight);
        if (visibleRows < 1) visibleRows = 5;
        // Count only data rows, not empty rows
        const productRows = Array.from(tbody.children).filter(row => !row.classList.contains('empty-row')).length;
        const neededEmptyRows = Math.max(visibleRows - productRows, 0);
        // Remove old empty rows
        Array.from(tbody.querySelectorAll('.empty-row')).forEach(row => row.remove());
        // Add empty rows if needed
        for (let i = 0; i < neededEmptyRows; i++) {
            const tr = document.createElement('tr');
            tr.className = 'empty-row';
            for (let j = 0; j < 8; j++) {
                const td = document.createElement('td');
                td.textContent = '';
                tr.appendChild(td);
            }
            tbody.appendChild(tr);
        }
    }
    
    window.addEventListener('DOMContentLoaded', fillInvoiceTableWithEmptyRows);
    window.addEventListener('resize', fillInvoiceTableWithEmptyRows);

    // --- Initial setup ---
    updateInvoiceTotal();
    
    // Focus on product code input field when page loads
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            productCodeInput.focus();
        }, 100); // Small delay to ensure DOM is fully loaded
    });

    function addProduct() {
        // Store the code and clear input immediately
        const code = productCodeInput.value.trim();
        productCodeInput.value = '';
        const quantity = 1;

        if (!code) {
            showMessage('Ingresa un codigo o usa el buscador.', 'error');
            productCodeInput.focus();
            return;
        }

        const product = findProduct(code);
        if (!product) {
            showMessage(`Product with code ${code} not found.`, 'error');
            productCodeInput.focus();
            return;
        }

        const existingRow = invoiceBody.querySelector(`tr[data-code="${code}"]`);
        if (existingRow) {
            const existingQuantityInput = existingRow.querySelector('.quantity-input');
            existingQuantityInput.value = parseInt(existingQuantityInput.value, 10) + quantity;
            updateRowTotal(existingRow);
            showMessage(`Increased quantity for ${product.name}.`, 'success');
        } else {
            createAndAppendRow(product, quantity, 0);
            showMessage(`${product.name} agregado.`, 'success');
        }

        // Force focus back to input field
        productCodeInput.blur();
        productCodeInput.focus();
    }

    function createAndAppendRow(product, quantity, discount) {
        const row = document.createElement('tr');
        row.dataset.code = product.code;
        row.dataset.price = product.price;
        const subTotal = product.price * quantity;
        const discountAmount = subTotal * (discount / 100);
        const total = subTotal - discountAmount;

        row.innerHTML = `
            <td class="row-number"></td>
            <td>${product.code}</td>
            <td>${product.name}</td>
            <td><input type="number" class="quantity-input" value="${quantity}" min="1"></td>
            <td>${product.price.toFixed(2)}</td>
            <td class="discount-column"><input type="number" class="discount-input" value="${discount}" min="0" max="100" step="any"></td>
            <td class="row-total">${total.toFixed(2)}</td>
            <td><button class="button danger2 remove-item">Quitar</button></td>
        `;

        const quantityInput = row.querySelector('.quantity-input');
        quantityInput.addEventListener('input', () => {
            if (parseInt(quantityInput.value, 10) < 1) quantityInput.value = '1';
            updateRowTotal(row);
        });

        const discountInput = row.querySelector('.discount-input');
        discountInput.addEventListener('input', () => updateRowTotal(row));
        discountInput.addEventListener('change', () => {
            validateDiscount(discountInput); // Validate on change/blur too
            updateRowTotal(row);
        });

        const removeButton = row.querySelector('.remove-item');
        removeButton.addEventListener('click', () => {
            row.remove();
            updateRowNumbers();
            updateInvoiceTotal();
            showMessage('Item removed.', 'success');
        });

        // Append at the end of the table
        invoiceBody.appendChild(row);

        updateRowNumbers();
        updateInvoiceTotal();
    }
});
