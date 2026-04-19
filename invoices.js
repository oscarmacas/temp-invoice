// Global copy to clipboard function
function copyToClipboard(text, button) {
    navigator.clipboard.writeText(text).then(() => {
        button.classList.add('copied');
        setTimeout(() => {
            button.classList.remove('copied');
        }, 500);
    }).catch(err => {
        console.error('Error copying to clipboard:', err);
        alert('Error al copiar al portapapeles');
    });
}

document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const invoicesTableBody = document.getElementById('invoices-table-body');
    const downloadAllInvoicesButton = document.getElementById('download-all-invoices');
    const deleteAllInvoicesButton = document.getElementById('delete-all-invoices');
    const deleteAllConfirmationModal = document.getElementById('delete-all-confirmation-modal');
    const confirmDeleteAllButton = document.getElementById('confirm-delete-all');
    const cancelDeleteAllButton = document.getElementById('cancel-delete-all');
    const countdownElement = document.querySelector('#delete-all-confirmation-modal .countdown');
    const backButton = document.getElementById('back-button');
    const messageBox = document.getElementById('message-box');
    const invoiceDetailModal = document.getElementById('invoice-detail-modal');
    const invoiceDetailContainer = document.getElementById('invoice-detail-container');
    const closeDetailButton = document.querySelector('.invoice-detail-close');

    let messageTimeout;
    let deleteAllCountdown;

    // Local Storage Operations
    const STORAGE_KEY = 'savedInvoices';

    function loadFromLocalStorage() {
        try {
            return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
        } catch (e) {
            console.error("Error loading from local storage:", e);
            showMessage('Could not load saved invoices.', 'error');
            return [];
        }
    }

    function saveToLocalStorage(invoices) {
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify(invoices));
        } catch (e) {
            console.error("Error saving to local storage:", e);
            showMessage('Could not save invoice locally.', 'error');
        }
    }

    function showMessage(message, type = 'success') {
        clearTimeout(messageTimeout);
        messageBox.textContent = message;
        messageBox.className = `message-box ${type} show`;
        messageTimeout = setTimeout(() => {
            messageBox.className = 'message-box';
        }, 3000);
    }

    // Update invoice statistics
    function updateInvoiceStats(invoices) {
        const stats = {
            total: invoices.length,
            cash: 0,
            credit: 0,
            app: 0,
            jep: 0,
            combined: 0,
            global: 0
        };

        invoices.forEach(invoice => {
            stats.global += invoice.invoiceTotal;
            switch(invoice.paymentMethod) {
                case 'Efectivo':
                    stats.cash += invoice.invoiceTotal;
                    break;
                case 'Tarjeta':
                    stats.credit += invoice.invoiceTotal;
                    break;
                case 'De Una':
                    stats.app += invoice.invoiceTotal;
                    break;
                case 'JepFaster':
                    stats.jep += invoice.invoiceTotal;
                    break;
                case 'Combinado':
                    stats.combined += invoice.invoiceTotal;
                    break;
            }
        });

        document.getElementById('total-invoices').textContent = stats.total;
        document.getElementById('cash-total').textContent = `$${stats.cash.toFixed(2)}`;
        document.getElementById('credit-total').textContent = `$${stats.credit.toFixed(2)}`;
        document.getElementById('app-total').textContent = `$${stats.app.toFixed(2)}`;
        document.getElementById('jep-total').textContent = `$${stats.jep.toFixed(2)}`;
        document.getElementById('combined-total').textContent = `$${stats.combined.toFixed(2)}`;
        document.getElementById('global-total').textContent = `$${stats.global.toFixed(2)}`;
    }

    // Display saved invoices as table rows
    function displaySavedInvoices() {
        const invoices = loadFromLocalStorage();
        invoicesTableBody.innerHTML = '';

        if (invoices.length === 0) {
            invoicesTableBody.innerHTML = '<tr><td colspan="7" style="text-align: center; padding: 40px;">No hay facturas guardadas.</td></tr>';
            updateInvoiceStats(invoices);
            return;
        }

        updateInvoiceStats(invoices);

        invoices.forEach((invoice, index) => {
            const row = document.createElement('tr');
            row.dataset.invoiceIndex = index;
            row.style.cursor = 'pointer';

            const statusClass = invoice.status === 'Processed' ? 'status-processed' : 'status-pending';
            const statusText = invoice.status === 'Processed' ? 'Procesada' : 'Pendiente';
            const savedDate = new Date(invoice.saveTimestamp).toLocaleString();

            row.innerHTML = `
                <td><strong>${index + 1}</strong></td>
                <td>${savedDate}</td>
                <td>${invoice.customer.id}</td>
                <td>${invoice.customer.name}</td>
                <td><strong>$${invoice.invoiceTotal.toFixed(2)}</strong></td>
                <td>${invoice.paymentMethod}</td>
                <td><span class="invoice-status-badge ${statusClass}">${statusText}</span></td>
            `;

            // Add click handler to open detail modal
            row.addEventListener('click', () => showInvoiceDetail(invoice, index));

            invoicesTableBody.appendChild(row);
        });
    }

    // Helper function to truncate text with middle ellipsis
    function truncateMiddle(text, maxLength = 31) {
        if (!text || text.length <= maxLength) return text;
        const firstPart = text.substring(0, 23);
        const lastPart = text.substring(text.length - 5);
        return `${firstPart}...${lastPart}`;
    }

    // Show invoice detail in modal
    function showInvoiceDetail(invoice, index) {
        const statusClass = invoice.status === 'Processed' ? 'status-processed' : 'status-pending';
        const statusText = invoice.status === 'Processed' ? 'Procesada' : 'Pendiente';
        const savedDate = new Date(invoice.saveTimestamp).toLocaleString();

        let paymentDetailsHTML = '';
        if (invoice.paymentMethod === 'Tarjeta') {
            const bancoText = truncateMiddle(invoice.bank || 'N/A');
            paymentDetailsHTML = `
                <div class="data-field">
                    <label>Banco:</label>
                    <div class="data-value-plain" title="${invoice.bank || 'N/A'}">${bancoText}</div>
                </div>
                <div class="data-field">
                    <label>Lote:</label>
                    <div class="data-value-plain">${invoice.loteNumber || 'N/A'}</div>
                </div>`;
        } else if (invoice.paymentMethod === 'Combinado') {
            paymentDetailsHTML = '';
            if (invoice.combinedPayments) {
                Object.entries(invoice.combinedPayments).forEach(([method, amount]) => {
                    if (amount > 0) {
                        paymentDetailsHTML += `
                            <div class="data-field">
                                <label>${method}:</label>
                                <div class="data-value-plain">$${amount.toFixed(2)}</div>
                            </div>`;
                    }
                });
            }
        }

        invoiceDetailContainer.innerHTML = `
            <div class="saved-invoice-container">
                <div class="invoice-header">
                    <h3>Factura #${index + 1}</h3>
                    <span class="invoice-status ${statusClass}">${statusText}</span>
                </div>

                <div class="invoice-detail-grid">
                    <!-- Customer Details (Left) -->
                    <div class="detail-section">
                        <h4>Datos de cliente</h4>
                        <div class="data-field">
                            <label>CI / RUC:</label>
                            <div class="data-value-container">
                                <div class="data-value">${invoice.customer.id}</div>
                                <button class="copy-btn" onclick="copyToClipboard('${invoice.customer.id}', this)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="data-field">
                            <label>Nombre:</label>
                            <div class="data-value-container">
                                <div class="data-value">${invoice.customer.name}</div>
                                <button class="copy-btn" onclick="copyToClipboard('${invoice.customer.name}', this)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="data-field">
                            <label>Telefono:</label>
                            <div class="data-value-container">
                                <div class="data-value">${invoice.customer.address}</div>
                                <button class="copy-btn" onclick="copyToClipboard('${invoice.customer.address}', this)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                        <div class="data-field">
                            <label>Correo:</label>
                            <div class="data-value-container">
                                <div class="data-value">${invoice.customer.email}</div>
                                <button class="copy-btn" onclick="copyToClipboard('${invoice.customer.email}', this)">
                                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="16" height="16">
                                        <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                        <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>
                    </div>

                    <!-- Payment Information (Right) -->
                    <div class="detail-section">
                        <h4>Informacion de pago</h4>
                        <div class="data-field">
                            <label>Fecha y Hora:</label>
                            <div class="data-value-plain">${savedDate}</div>
                        </div>
                        <div class="data-field">
                            <label>Forma de pago:</label>
                            <div class="data-value-plain">${invoice.paymentMethod}</div>
                        </div>
                        ${paymentDetailsHTML}
                    </div>
                </div>

                <!-- Products Section (Full Width) -->
                <div class="products-section">
                    <h4>Productos</h4>
                    <table class="invoice-items-table">
                        <thead>
                            <tr>
                                <th>Codigo</th>
                                <th>Nombre</th>
                                <th>Cant</th>
                                <th>Precio</th>
                                <th>Desc.</th>
                                <th>Total</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${invoice.items.map(item => `
                                <tr>
                                    <td>
                                        <div style="display: flex; align-items: center; gap: 8px;">
                                            <span class="code-cell"><strong>${item.code}</strong></span>
                                            <button class="copy-btn" style="padding: 6px;" onclick="copyToClipboard('${item.code}', this)">
                                                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" width="14" height="14">
                                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect>
                                                    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path>
                                                </svg>
                                            </button>
                                        </div>
                                    </td>
                                    <td>${item.name}</td>
                                    <td>${item.quantity}</td>
                                    <td>$${item.price.toFixed(2)}</td>
                                    <td>${item.discount.toFixed(2)}%</td>
                                    <td><strong>$${item.total.toFixed(2)}</strong></td>
                                </tr>
                            `).join('')}
                        </tbody>
                    </table>
                    <div class="invoice-overall-total" style="text-align: right; font-size: 1.2em; margin-top: 15px;">
                        <strong>Total: $${invoice.invoiceTotal.toFixed(2)}</strong>
                    </div>
                </div>

                <div class="invoice-actions" style="margin-top: 25px; display: flex; gap: 12px; justify-content: flex-end;">
                    <button class="button primary print-saved-invoice" data-invoice-index="${index}">Imprimir</button>
                    <button class="button secondary process-saved-invoice" data-invoice-index="${index}" ${invoice.status === 'Processed' ? 'disabled' : ''}>
                        ${invoice.status === 'Processed' ? 'Procesada' : 'Marcar como ingresado'}
                    </button>
                    <button class="button danger delete-saved-invoice" data-invoice-index="${index}">Eliminar</button>
                </div>
            </div>
        `;

        invoiceDetailModal.style.display = 'flex';
    }

    // Print receipt function
    function printReceipt(invoiceData) {
        const date = new Date(invoiceData.saveTimestamp || Date.now());
        const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
        const dia = String(date.getDate()).padStart(2, '0');
        const mes = meses[date.getMonth()];
        const anio = date.getFullYear();
        const hora = String(date.getHours()).padStart(2, '0');
        const minuto = String(date.getMinutes()).padStart(2, '0');
        const segundo = String(date.getSeconds()).padStart(2, '0');
        const filename = `factura_${dia}_${mes}_${anio}_${hora}${minuto}${segundo}.csv`;

        let csvContent = "Tipo,Valor\r\n";
        csvContent += `CI/RUC,"${invoiceData.customer.id}"\r\n`;
        csvContent += `Nombre Cliente,"${invoiceData.customer.name}"\r\n`;
        csvContent += `Dirección Cliente,"${invoiceData.customer.address}"\r\n`;
        csvContent += `Correo Cliente,"${invoiceData.customer.email}"\r\n`;
        csvContent += `Forma de Pago,"${invoiceData.paymentMethod}"\r\n`;
        
        if (invoiceData.paymentMethod === 'Tarjeta') {
            csvContent += `Banco,"${invoiceData.bank || ''}"\r\n`;
            csvContent += `Número de Lote,"${invoiceData.loteNumber || ''}"\r\n`;
        } else if (invoiceData.paymentMethod === 'Combinado' && invoiceData.combinedPayments) {
            Object.entries(invoiceData.combinedPayments).forEach(([method, amount]) => {
                csvContent += `Monto ${method},${parseFloat(amount).toFixed(2)}\r\n`;
            });
        }
        
        csvContent += `Estado,"${invoiceData.status}"\r\n`;
        csvContent += `Fecha de Guardado,"${date.toLocaleString()}"\r\n`;
        csvContent += "\r\n";
        
        csvContent += "Código,Nombre,Cantidad,Precio,Descuento (%),Total\r\n";
        if (invoiceData.items && Array.isArray(invoiceData.items)) {
            invoiceData.items.forEach(item => {
                csvContent += `${item.code},"${item.name}",${item.quantity},${parseFloat(item.price).toFixed(2)},${parseFloat(item.discount).toFixed(2)},${parseFloat(item.total).toFixed(2)}\r\n`;
            });
        }
        
        csvContent += "\r\n";
        csvContent += `Total Factura,,,,,,${parseFloat(invoiceData.invoiceTotal).toFixed(2)}\r\n`;

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        a.style.display = 'none';
        document.body.appendChild(a);
        a.click();

        setTimeout(() => {
            document.body.removeChild(a);
            URL.revokeObjectURL(url);
        }, 100);

        console.log('Invoice CSV saved for printing:', filename);
    }

    // Invoice actions
    function printSavedInvoice(index) {
        const invoices = loadFromLocalStorage();
        if (index >= 0 && index < invoices.length) {
            printReceipt(invoices[index]);
            showMessage(`Imprimiendo factura #${index + 1}...`, 'success');
        } else {
            showMessage('Error: Factura no encontrada.', 'error');
        }
    }

    function deleteSavedInvoice(index) {
        if (!confirm(`¿Está seguro que desea eliminar la factura #${index + 1}? Esta acción no se puede deshacer.`)) {
            return;
        }
        const invoices = loadFromLocalStorage();
        if (index >= 0 && index < invoices.length) {
            invoices.splice(index, 1);
            saveToLocalStorage(invoices);
            invoiceDetailModal.style.display = 'none';
            displaySavedInvoices();
            showMessage(`Factura #${index + 1} eliminada.`, 'success');
        } else {
            showMessage('Error al eliminar factura: Invalid index.', 'error');
        }
    }

    function markInvoiceAsProcessed(index) {
        const invoices = loadFromLocalStorage();
        if (index >= 0 && index < invoices.length) {
            invoices[index].status = 'Processed';
            saveToLocalStorage(invoices);
            invoiceDetailModal.style.display = 'none';
            displaySavedInvoices();
            showMessage(`Factura #${index + 1} marcada como procesada.`, 'success');
        } else {
            showMessage('Error al actualizar estado de factura: Invalid index.', 'error');
        }
    }

    function downloadAllInvoices() {
        const invoices = loadFromLocalStorage();
        if (invoices.length === 0) {
            showMessage('No hay facturas para descargar.', 'error');
            return;
        }

        let csvContent = "data:text/csv;charset=utf-8,";
        csvContent += "Fecha\tCliente\tCI/RUC\tDirección\tCorreo\tForma de Pago\tTotal\tEstado\r\n";

        invoices.forEach(invoice => {
            const date = new Date(invoice.saveTimestamp).toLocaleString();
            const customer = invoice.customer;
            const row = [
                date,
                customer.name,
                customer.id,
                customer.address,
                customer.email,
                invoice.paymentMethod,
                invoice.invoiceTotal.toFixed(2),
                invoice.status
            ].map(field => `"${field}"`).join('\t');
            csvContent += row + "\r\n";
        });

        const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        const url = URL.createObjectURL(blob);
        link.setAttribute('href', url);
        link.setAttribute('download', `facturas_${new Date().toISOString().split('T')[0]}.csv`);
        link.style.visibility = 'hidden';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);

        showMessage('Facturas descargadas exitosamente.', 'success');
    }

    function startDeleteAllCountdown() {
        deleteAllConfirmationModal.style.display = 'flex';
        confirmDeleteAllButton.disabled = true;
        let count = 5;

        deleteAllCountdown = setInterval(() => {
            count--;
            countdownElement.textContent = count;

            if (count <= 0) {
                clearInterval(deleteAllCountdown);
                confirmDeleteAllButton.disabled = false;
            }
        }, 1000);
    }

    function cancelDeleteAll() {
        clearInterval(deleteAllCountdown);
        deleteAllConfirmationModal.style.display = 'none';
        confirmDeleteAllButton.disabled = true;
        countdownElement.textContent = '5';
    }

    function deleteAllInvoices() {
        saveToLocalStorage([]);
        displaySavedInvoices();
        deleteAllConfirmationModal.style.display = 'none';
        showMessage('Todas las facturas han sido eliminadas.', 'success');
    }

    // Event Listeners
    backButton.addEventListener('click', () => {
        window.location.href = 'index.html';
    });

    downloadAllInvoicesButton.addEventListener('click', downloadAllInvoices);
    deleteAllInvoicesButton.addEventListener('click', startDeleteAllCountdown);
    confirmDeleteAllButton.addEventListener('click', deleteAllInvoices);
    cancelDeleteAllButton.addEventListener('click', cancelDeleteAll);

    // Close detail modal
    closeDetailButton.addEventListener('click', () => {
        invoiceDetailModal.style.display = 'none';
    });

    // Invoice action buttons (event delegation) - now in modal
    invoiceDetailContainer.addEventListener('click', (event) => {
        const target = event.target;
        const invoiceIndex = target.dataset.invoiceIndex;

        if (target.classList.contains('print-saved-invoice')) {
            printSavedInvoice(parseInt(invoiceIndex, 10));
        } else if (target.classList.contains('delete-saved-invoice')) {
            deleteSavedInvoice(parseInt(invoiceIndex, 10));
        } else if (target.classList.contains('process-saved-invoice') && !target.disabled) {
            markInvoiceAsProcessed(parseInt(invoiceIndex, 10));
        }
    });

    // Close modals on overlay click
    window.addEventListener('click', (e) => {
        if (e.target === deleteAllConfirmationModal) {
            cancelDeleteAll();
        } else if (e.target === invoiceDetailModal) {
            invoiceDetailModal.style.display = 'none';
        }
    });

    // Load invoices on page load
    displaySavedInvoices();
});
