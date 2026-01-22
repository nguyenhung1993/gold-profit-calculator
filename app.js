// ===== Gold & Silver Profit Calculator - Realtime =====
// With Backend API Support

// API Configuration
const API_URL = 'https://gold-profit-calculator.onrender.com/api';
let useAPI = true; // Will fallback to LocalStorage if API unavailable

// State Management
let currentType = 'gold'; // 'gold' or 'silver'

const appState = {
    gold: {
        transactions: [],
        sellPrice: 14.5,
        idCounter: 0
    },
    silver: {
        transactions: [],
        sellPrice: 0.5,
        idCounter: 0
    }
};

// Sample data
const SAMPLE_DATA = {
    gold: [
        { qty: 1, unit: 'cay', buyPrice: 10.710 },
        { qty: 2, unit: 'cay', buyPrice: 10.850 },
        { qty: 1, unit: 'cay', buyPrice: 11.750 },
    ],
    silver: [
        { qty: 1, unit: 'cay', buyPrice: 0.450 },
        { qty: 2, unit: 'cay', buyPrice: 0.480 },
    ]
};

// ===== DOM Helper =====

function getElements(type) {
    // Suffix is empty for gold (legacy compatibility) or 'Silver' for silver
    const suffix = type === 'gold' ? '' : 'Silver';
    const prefix = type === 'gold' ? 'current' : 'silver'; // for sellPrice ID inconsistency

    return {
        // Inputs
        sellPriceInput: document.getElementById(type === 'gold' ? 'currentSellPrice' : 'silverSellPrice'),
        tableBody: document.getElementById(type === 'gold' ? 'transactionsBody' : 'silverTransactionsBody'),

        // Buttons
        addRowBtn: document.getElementById(type === 'gold' ? 'addRowBtn' : 'silverAddRowBtn'),
        loadSampleBtn: document.getElementById(type === 'gold' ? 'loadSampleBtn' : 'silverLoadSampleBtn'),
        clearAllBtn: document.getElementById(type === 'gold' ? 'clearAllBtn' : 'silverClearAllBtn'),

        // Summary
        totalChiEl: document.getElementById(type === 'gold' ? 'totalChi' : 'silverTotalChi'),
        totalCayEl: document.getElementById(type === 'gold' ? 'totalCay' : 'silverTotalCay'),
        totalBuyEl: document.getElementById(type === 'gold' ? 'totalBuy' : 'silverTotalBuy'),
        totalSellEl: document.getElementById(type === 'gold' ? 'totalSell' : 'silverTotalSell'),
        breakEvenEl: document.getElementById(type === 'gold' ? 'breakEven' : 'silverBreakEven'),

        // Profit Card
        profitCardEl: document.getElementById(type === 'gold' ? 'profitCard' : 'silverProfitCard'),
        profitValueEl: document.getElementById(type === 'gold' ? 'profitValue' : 'silverProfitValue'),
        profitPercentageEl: document.getElementById(type === 'gold' ? 'profitPercentage' : 'silverProfitPercentage'),
        profitIconEl: document.getElementById(type === 'gold' ? 'profitIcon' : 'silverProfitIcon'),
        profitLabelEl: document.getElementById(type === 'gold' ? 'profitLabel' : 'silverProfitLabel')
    };
}

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

// ===== Tab Switching =====

window.switchTab = function (type) {
    currentType = type;

    // Update Tab Buttons
    document.querySelectorAll('.metal-tab').forEach(btn => {
        btn.classList.remove('active-gold', 'active-silver');
    });
    const activeBtn = document.getElementById(type === 'gold' ? 'tabGold' : 'tabSilver');
    activeBtn.classList.add(type === 'gold' ? 'active-gold' : 'active-silver');

    // Update Sections
    document.querySelectorAll('.calculator-section').forEach(sec => {
        sec.classList.remove('active');
    });
    document.getElementById(`${type}-section`).classList.add('active');

    // Refresh UI
    renderTable(type);
    calculateSummary(type);
};

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
                transactions: appState.gold.transactions,
                sellPrice: appState.gold.sellPrice,
                silverTransactions: appState.silver.transactions,
                silverSellPrice: appState.silver.sellPrice
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
            // Load Gold Data
            appState.gold.transactions = result.data.transactions || [];
            appState.gold.sellPrice = result.data.sellPrice || 14.5;

            // Load Silver Data (Check for new fields, fallback to defaults)
            appState.silver.transactions = result.data.silverTransactions || [];
            appState.silver.sellPrice = result.data.silverSellPrice || 0.5;

            // Sync IDs
            syncIdCounter('gold');
            syncIdCounter('silver');

            // Update Inputs
            const goldEls = getElements('gold');
            const silverEls = getElements('silver');

            goldEls.sellPriceInput.value = appState.gold.sellPrice;
            silverEls.sellPriceInput.value = appState.silver.sellPrice;

            showStatus('Đã tải dữ liệu từ server');
            return true;
        }
    } catch (error) {
        console.error('API load error:', error);
        return loadFromLocalStorage();
    }
    return false;
}

function syncIdCounter(type) {
    let maxId = 0;
    appState[type].transactions.forEach(t => {
        if (t.id >= maxId) maxId = t.id + 1;
    });
    appState[type].idCounter = maxId;
}

async function clearFromAPI() {
    if (!useAPI) return;
    try {
        await fetch(`${API_URL}/transactions`, { method: 'DELETE' });
    } catch (e) {
        console.error('API delete error:', e);
    }
}

// ===== Local Storage =====

function saveToLocalStorage() {
    localStorage.setItem('goldProfitData', JSON.stringify(appState));
}

function loadFromLocalStorage() {
    const data = localStorage.getItem('goldProfitData');
    // Fallback for old key 'goldCalculatorData'
    const oldData = localStorage.getItem('goldCalculatorData');

    if (data) {
        try {
            const parsed = JSON.parse(data);
            appState.gold = parsed.gold || appState.gold;
            appState.silver = parsed.silver || appState.silver;

            syncIdCounter('gold');
            syncIdCounter('silver');

            getElements('gold').sellPriceInput.value = appState.gold.sellPrice;
            getElements('silver').sellPriceInput.value = appState.silver.sellPrice;
            return true;
        } catch (e) { console.error(e); }
    } else if (oldData) {
        // Migrate old data
        try {
            const parsed = JSON.parse(oldData);
            appState.gold.transactions = parsed.transactions || [];
            appState.gold.sellPrice = parsed.sellPrice || 14.5;
            syncIdCounter('gold');
            getElements('gold').sellPriceInput.value = appState.gold.sellPrice;
            return true;
        } catch (e) { console.error(e); }
    }
    return false;
}

// ===== Data Persistence =====

let saveTimeout = null;
function saveData() {
    if (saveTimeout) clearTimeout(saveTimeout);
    saveTimeout = setTimeout(() => {
        saveToAPI();
    }, 500);
}

// ===== Transaction Logic =====

function addTransaction(type) {
    const state = appState[type];
    const newTx = {
        id: state.idCounter++,
        qty: 1,
        unit: 'chi',
        buyPrice: 0
    };
    state.transactions.push(newTx);
    renderTable(type);
    calculateSummary(type);
    saveData();
}

function updateTransaction(type, id, field, value) {
    const state = appState[type];
    const tx = state.transactions.find(t => t.id === id);
    if (tx) {
        if (field === 'qty' || field === 'buyPrice') {
            tx[field] = parseFloat(value) || 0;
        } else {
            tx[field] = value;
        }
        calculateSummary(type);
        saveData();
        // Note: No need to re-render table for input changes to avoid losing focus
        // Unless unit changes, which updates calculation display?
        if (field === 'unit' || field === 'qty' || field === 'buyPrice') {
            // Update specific row calculation if needed, or just let summary handle it
            // Better to update the "Thành tiền" cell specifically
            updateRowDisplay(type, tx);
        }
    }
}

function updateRowDisplay(type, tx) {
    const els = getElements(type);
    // Find row
    const row = els.tableBody.querySelector(`tr[data-id="${tx.id}"]`);
    if (!row) return;

    const qtyChi = qtyToChi(tx.qty, tx.unit);
    const total = qtyChi * tx.buyPrice;

    // Update computed cells
    // 4th cell: SL (Chỉ) -> index 3
    // 6th cell: Thành tiền -> index 5
    row.cells[3].textContent = formatNumber(qtyChi);
    row.cells[5].textContent = formatNumber(total) + ' tr';
}

function deleteTransaction(type, id) {
    appState[type].transactions = appState[type].transactions.filter(t => t.id !== id);
    renderTable(type);
    calculateSummary(type);
    saveData();
}

function clearAllData(type) {
    if (confirm(`Bạn có chắc muốn xóa tất cả dữ liệu ${type === 'gold' ? 'Vàng' : 'Bạc'}?`)) {
        appState[type].transactions = [];
        appState[type].idCounter = 0;
        renderTable(type);
        calculateSummary(type);
        saveData();
    }
}

function loadSample(type) {
    if (appState[type].transactions.length > 0) {
        if (!confirm('Dữ liệu hiện tại sẽ bị thay thế. Tiếp tục?')) return;
    }

    appState[type].transactions = [];
    appState[type].idCounter = 0;

    SAMPLE_DATA[type].forEach(item => {
        appState[type].transactions.push({
            id: appState[type].idCounter++,
            qty: item.qty,
            unit: item.unit,
            buyPrice: item.buyPrice
        });
    });

    renderTable(type);
    calculateSummary(type);
    saveData();
}

// ===== Rendering =====

function renderTable(type) {
    const els = getElements(type);
    const transactions = appState[type].transactions;

    els.tableBody.innerHTML = '';

    if (transactions.length === 0) {
        els.tableBody.innerHTML = `
            <tr class="empty-row">
                <td colspan="7" style="text-align: center; padding: 40px; color: var(--text-muted);">
                    <p style="font-size: 2rem; margin-bottom: 10px;">📋</p>
                    <p>Chưa có giao dịch ${type === 'gold' ? 'Vàng' : 'Bạc'}</p>
                    <p style="font-size: 0.85rem;">Nhấn "Thêm Dòng" để bắt đầu</p>
                </td>
            </tr>
        `;
        return;
    }

    transactions.forEach((t, index) => {
        const qtyChi = qtyToChi(t.qty, t.unit);
        const total = qtyChi * t.buyPrice;

        const row = document.createElement('tr');
        row.dataset.id = t.id; // Mark row for easier selection
        row.innerHTML = `
            <td>${index + 1}</td>
            <td>
                <input type="number" value="${t.qty}" step="any" min="0" inputmode="decimal" data-id="${t.id}" data-field="qty">
            </td>
            <td>
                <select data-id="${t.id}" data-field="unit">
                    <option value="chi" ${t.unit === 'chi' ? 'selected' : ''}>Chỉ</option>
                    <option value="cay" ${t.unit === 'cay' ? 'selected' : ''}>Cây</option>
                </select>
            </td>
            <td class="calculated-value">${formatNumber(qtyChi)}</td>
            <td>
                <input type="number" value="${t.buyPrice}" step="any" min="0" inputmode="decimal" data-id="${t.id}" data-field="buyPrice">
            </td>
            <td class="calculated-value">${formatNumber(total)} tr</td>
            <td>
                <button class="btn-delete" data-id="${t.id}" title="Xóa dòng này">✕</button>
            </td>
        `;
        els.tableBody.appendChild(row);
    });
}

function calculateSummary(type) {
    const els = getElements(type);
    const state = appState[type];
    const sellPrice = parseFloat(els.sellPriceInput.value) || 0;

    // Update state sellPrice
    state.sellPrice = sellPrice;

    let totalChi = 0;
    let totalBuy = 0;

    state.transactions.forEach(t => {
        const qtyChi = qtyToChi(t.qty, t.unit);
        totalChi += qtyChi;
        totalBuy += qtyChi * t.buyPrice;
    });

    const totalSell = totalChi * sellPrice;
    const profit = totalSell - totalBuy;
    const breakEven = totalChi > 0 ? totalBuy / totalChi : 0;
    const profitPercent = totalBuy > 0 ? (profit / totalBuy) * 100 : 0;

    // DOM Updates
    els.totalChiEl.textContent = formatNumber(totalChi);
    els.totalCayEl.textContent = formatNumber(chiToCay(totalChi), 1);
    els.totalBuyEl.textContent = formatNumber(totalBuy);
    els.totalSellEl.textContent = formatNumber(totalSell);
    els.breakEvenEl.textContent = formatNumber(breakEven, 3);

    const isProfit = profit >= 0;
    els.profitValueEl.textContent = (isProfit ? '+' : '') + formatNumber(profit);
    els.profitPercentageEl.textContent = (isProfit ? '+' : '') + formatNumber(profitPercent) + '%';

    // Update Card Style
    els.profitCardEl.classList.remove('profit', 'loss');
    if (profit > 0) {
        els.profitCardEl.classList.add('profit');
        els.profitIconEl.textContent = '📈';
        els.profitLabelEl.textContent = 'Lãi';
    } else if (profit < 0) {
        els.profitCardEl.classList.add('loss');
        els.profitIconEl.textContent = '📉';
        els.profitLabelEl.textContent = 'Lỗ';
    } else {
        els.profitIconEl.textContent = '⚖️';
        els.profitLabelEl.textContent = 'Hòa Vốn';
    }
}

// ===== Initialization & Events =====

function attachEvents(type) {
    const els = getElements(type);

    // Add Row
    els.addRowBtn.addEventListener('click', () => addTransaction(type));

    // Load Sample
    els.loadSampleBtn.addEventListener('click', () => loadSample(type));

    // Clear All
    els.clearAllBtn.addEventListener('click', () => clearAllData(type));

    // Sell Price Change
    els.sellPriceInput.addEventListener('input', () => {
        calculateSummary(type);
        saveData();
    });

    // Table Inputs (Delegation)
    els.tableBody.addEventListener('input', (e) => {
        if (e.target.matches('input, select')) {
            const id = parseInt(e.target.dataset.id);
            const field = e.target.dataset.field;
            const value = e.target.value;
            updateTransaction(type, id, field, value);
        }
    });

    // Delete Button
    els.tableBody.addEventListener('click', (e) => {
        if (e.target.matches('.btn-delete')) {
            const id = parseInt(e.target.dataset.id);
            deleteTransaction(type, id);
        }
    });
}

async function init() {
    useAPI = await checkAPIHealth();
    if (useAPI) console.log('🌐 Connected to Backend');
    else console.log('💾 Offline Mode');

    await loadFromAPI();

    // Attach events for both
    attachEvents('gold');
    attachEvents('silver');

    // Initial Render
    renderTable('gold');
    calculateSummary('gold');

    renderTable('silver');
    calculateSummary('silver');

    // Default Tab
    switchTab('gold');

    // Tab Event Listeners
    document.getElementById('tabGold').addEventListener('click', () => switchTab('gold'));
    document.getElementById('tabSilver').addEventListener('click', () => switchTab('silver'));
}

document.addEventListener('DOMContentLoaded', init);
