// ===== Gold Profit Calculator - Realtime =====
// With Backend API Support

// API Configuration
const API_URL = 'https://gold-profit-calculator.onrender.com/api';
let useAPI = true; // Will fallback to LocalStorage if API unavailable

// Sample data from the image (for demo)
const SAMPLE_DATA = [
    { qty: 1, unit: 'cay', buyPrice: 10.710 },
    { qty: 2, unit: 'cay', buyPrice: 10.850 },
    { qty: 1, unit: 'cay', buyPrice: 11.750 },
];

// App State
let transactions = [];
let transactionIdCounter = 0;

// DOM Elements
const transactionsBody = document.getElementById('transactionsBody');
const currentSellPriceInput = document.getElementById('currentSellPrice');
const addRowBtn = document.getElementById('addRowBtn');
const loadSampleBtn = document.getElementById('loadSampleBtn');
const clearAllBtn = document.getElementById('clearAllBtn');

// Summary Elements
const totalChiEl = document.getElementById('totalChi');
const totalCayEl = document.getElementById('totalCay');
const totalBuyEl = document.getElementById('totalBuy');
const totalSellEl = document.getElementById('totalSell');
const breakEvenEl = document.getElementById('breakEven');
const profitValueEl = document.getElementById('profitValue');
const profitPercentageEl = document.getElementById('profitPercentage');
const profitCardEl = document.getElementById('profitCard');
const profitIconEl = document.getElementById('profitIcon');
const profitLabelEl = document.getElementById('profitLabel');

// ===== Utility Functions =====

function formatNumber(num, decimals = 2) {
    return num.toLocaleString('vi-VN', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

function qtyToChi(qty, unit) {
    return unit === 'cay' ? qty * 10 : qty;
}

function chiToCay(chi) {
    return chi / 10;
}

function showStatus(message, isError = false) {
    console.log(isError ? '❌' : '✅', message);
}

// ===== API Functions =====

async function checkAPIHealth() {
    try {
        const response = await fetch(`${API_URL}/health`, {
            method: 'GET',
            signal: AbortSignal.timeout(2000)
        });
        return response.ok;
    } catch (error) {
        console.log('⚠️ API not available, using LocalStorage');
        return false;
    }
}

async function saveToAPI() {
    if (!useAPI) {
        saveToLocalStorage();
        return;
    }

    try {
        const response = await fetch(`${API_URL}/transactions`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                transactions: transactions,
                sellPrice: parseFloat(currentSellPriceInput.value) || 14.5
            })
        });

        if (response.ok) {
            showStatus('Đã lưu lên server');
        } else {
            throw new Error('API save failed');
        }
    } catch (error) {
        console.error('API save error:', error);
        saveToLocalStorage();
    }
}

async function loadFromAPI() {
    if (!useAPI) {
        return loadFromLocalStorage();
    }

    try {
        const response = await fetch(`${API_URL}/transactions`);
        const result = await response.json();

        if (result.success && result.data) {
            transactions = result.data.transactions || [];

            // Find max ID to continue counter
            transactions.forEach(t => {
                if (t.id >= transactionIdCounter) {
                    transactionIdCounter = t.id + 1;
                }
            });

            if (result.data.sellPrice) {
                currentSellPriceInput.value = result.data.sellPrice;
            }

            showStatus('Đã tải dữ liệu từ server');
            return transactions.length > 0;
        }
    } catch (error) {
        console.error('API load error:', error);
        return loadFromLocalStorage();
    }

    return false;
}

async function clearFromAPI() {
    if (!useAPI) {
        return;
    }

    try {
        await fetch(`${API_URL}/transactions`, { method: 'DELETE' });
    } catch (error) {
        console.error('API delete error:', error);
    }
}

// ===== Local Storage (Fallback) =====

function saveToLocalStorage() {
    const data = {
        transactions: transactions,
        sellPrice: parseFloat(currentSellPriceInput.value) || 0
    };
    localStorage.setItem('goldCalculatorData', JSON.stringify(data));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('goldCalculatorData');
    if (data) {
        try {
            const parsed = JSON.parse(data);
            transactions = parsed.transactions || [];

            // Find max ID to continue counter
            transactions.forEach(t => {
                if (t.id >= transactionIdCounter) {
                    transactionIdCounter = t.id + 1;
                }
            });

            if (parsed.sellPrice) {
                currentSellPriceInput.value = parsed.sellPrice;
            }
            return true;
        } catch (e) {
            console.error('Error loading data:', e);
        }
    }
    return false;
}

// ===== Data Save (Unified) =====

// Debounce save to avoid too many API calls
let saveTimeout = null;
function saveData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToAPI();
    }, 500); // Wait 500ms after last change
}

// ===== Transaction Management =====

function addTransaction(data = {}) {
    const transaction = {
        id: transactionIdCounter++,
        qty: data.qty || 1,
        unit: data.unit || 'chi',
        buyPrice: data.buyPrice || 0
    };
    transactions.push(transaction);
    renderTable();
    calculateSummary();
    saveData();
    return transaction;
}

function updateTransaction(id, field, value) {
    const transaction = transactions.find(t => t.id === id);
    if (transaction) {
        if (field === 'qty' || field === 'buyPrice') {
            transaction[field] = parseFloat(value) || 0;
        } else {
            transaction[field] = value;
        }
        renderTable();
        calculateSummary();
        saveData();
    }
}

function deleteTransaction(id) {
    transactions = transactions.filter(t => t.id !== id);
    renderTable();
    calculateSummary();
    saveData();
}

async function clearAllTransactions() {
    if (confirm('Bạn có chắc muốn xóa tất cả dữ liệu?')) {
        transactions = [];
        transactionIdCounter = 0;
        renderTable();
        calculateSummary();
        await clearFromAPI();
        saveData();
    }
}

function loadSampleData() {
    if (transactions.length > 0) {
        if (!confirm('Dữ liệu hiện tại sẽ bị thay thế. Tiếp tục?')) {
            return;
        }
    }

    transactions = [];
    transactionIdCounter = 0;

    SAMPLE_DATA.forEach(item => {
        const transaction = {
            id: transactionIdCounter++,
            qty: item.qty,
            unit: item.unit,
            buyPrice: item.buyPrice
        };
        transactions.push(transaction);
    });

    renderTable();
    calculateSummary();
    saveData();
}

// ===== Render Table =====

function renderTable() {
    transactionsBody.innerHTML = '';

    if (transactions.length === 0) {
        transactionsBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 2rem; margin-bottom: 10px;">📋</p>
                    <p>Chưa có giao dịch nào</p>
                    <p style="font-size: 0.85rem;">Nhấn "Thêm Dòng" hoặc "Tải Dữ Liệu Mẫu" để bắt đầu</p>
                </td>
            </tr>
        `;
        return;
    }

    transactions.forEach((t, index) => {
        const qtyChi = qtyToChi(t.qty, t.unit);
        const total = qtyChi * t.buyPrice;

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input type="number" 
                       value="${t.qty}" 
                       step="0.1" 
                       min="0" 
                       data-id="${t.id}" 
                       data-field="qty">
            </td>
            <td>
                <select data-id="${t.id}" data-field="unit">
                    <option value="chi" ${t.unit === 'chi' ? 'selected' : ''}>Chỉ</option>
                    <option value="cay" ${t.unit === 'cay' ? 'selected' : ''}>Cây</option>
                </select>
            </td>
            <td class="calculated-value">${formatNumber(qtyChi)}</td>
            <td>
                <input type="number" 
                       value="${t.buyPrice}" 
                       step="0.001" 
                       min="0" 
                       data-id="${t.id}" 
                       data-field="buyPrice">
            </td>
            <td class="calculated-value">${formatNumber(total)} tr</td>
            <td>
                <button class="btn-delete" data-id="${t.id}" title="Xóa dòng này">
                    ✕
                </button>
            </td>
        `;
        transactionsBody.appendChild(row);
    });
}

// ===== Calculate Summary =====

function calculateSummary() {
    const sellPrice = parseFloat(currentSellPriceInput.value) || 0;

    let totalChi = 0;
    let totalBuy = 0;

    transactions.forEach(t => {
        const qtyChi = qtyToChi(t.qty, t.unit);
        totalChi += qtyChi;
        totalBuy += qtyChi * t.buyPrice;
    });

    const totalSell = totalChi * sellPrice;
    const profit = totalSell - totalBuy;
    const breakEven = totalChi > 0 ? totalBuy / totalChi : 0;
    const profitPercent = totalBuy > 0 ? (profit / totalBuy) * 100 : 0;

    // Update DOM
    totalChiEl.textContent = formatNumber(totalChi);
    totalCayEl.textContent = formatNumber(chiToCay(totalChi), 1);
    totalBuyEl.textContent = formatNumber(totalBuy);
    totalSellEl.textContent = formatNumber(totalSell);
    breakEvenEl.textContent = formatNumber(breakEven, 3);

    // Update profit display
    const isProfit = profit >= 0;
    profitValueEl.textContent = (isProfit ? '+' : '') + formatNumber(profit);
    profitPercentageEl.textContent = (isProfit ? '+' : '') + formatNumber(profitPercent) + '%';

    // Update card styling
    profitCardEl.classList.remove('profit', 'loss');
    if (profit > 0) {
        profitCardEl.classList.add('profit');
        profitIconEl.textContent = '📈';
        profitLabelEl.textContent = 'Lãi';
    } else if (profit < 0) {
        profitCardEl.classList.add('loss');
        profitIconEl.textContent = '📉';
        profitLabelEl.textContent = 'Lỗ';
    } else {
        profitIconEl.textContent = '⚖️';
        profitLabelEl.textContent = 'Hòa Vốn';
    }
}

// ===== Event Listeners =====

// Add row button
addRowBtn.addEventListener('click', () => {
    addTransaction();
});

// Load sample data button
loadSampleBtn.addEventListener('click', loadSampleData);

// Clear all button
clearAllBtn.addEventListener('click', clearAllTransactions);

// Current sell price change
currentSellPriceInput.addEventListener('input', () => {
    calculateSummary();
    saveData();
});

// Table input/select changes (event delegation)
transactionsBody.addEventListener('input', (e) => {
    const target = e.target;
    if (target.matches('input, select')) {
        const id = parseInt(target.dataset.id);
        const field = target.dataset.field;
        const value = target.value;
        updateTransaction(id, field, value);
    }
});

// Delete button clicks (event delegation)
transactionsBody.addEventListener('click', (e) => {
    const target = e.target;
    if (target.matches('.btn-delete')) {
        const id = parseInt(target.dataset.id);
        deleteTransaction(id);
    }
});

// ===== Initialize App =====

async function init() {
    // Check if API is available
    useAPI = await checkAPIHealth();

    if (useAPI) {
        console.log('🌐 Using Backend API');
    } else {
        console.log('💾 Using LocalStorage (offline mode)');
    }

    // Load data
    const hasData = await loadFromAPI();

    renderTable();
    calculateSummary();

    console.log('🚀 Gold Profit Calculator initialized!');
}

// Run on DOM ready
document.addEventListener('DOMContentLoaded', init);
