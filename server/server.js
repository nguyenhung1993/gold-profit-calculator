// ===== Gold Calculator Backend API =====
// Simple Express server with JSON file storage

const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3001;

// Data file path
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());

// Initialize data file if not exists
function initDataFile() {
    if (!fs.existsSync(DATA_FILE)) {
        const initialData = {
            transactions: [],
            sellPrice: 14.5,
            lastUpdated: new Date().toISOString()
        };
        fs.writeFileSync(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('📁 Created data.json file');
    }
}

// Read data from file
function readData() {
    try {
        const data = fs.readFileSync(DATA_FILE, 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error reading data:', error);
        return { transactions: [], sellPrice: 14.5 };
    }
}

// Write data to file
function writeData(data) {
    try {
        data.lastUpdated = new Date().toISOString();
        fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2));
        return true;
    } catch (error) {
        console.error('Error writing data:', error);
        return false;
    }
}

// ===== API Routes =====

// GET /api/transactions - Get all data
app.get('/api/transactions', (req, res) => {
    const data = readData();
    res.json({
        success: true,
        data: data
    });
});

// POST /api/transactions - Save all data
app.post('/api/transactions', (req, res) => {
    const { transactions, sellPrice } = req.body;

    if (!Array.isArray(transactions)) {
        return res.status(400).json({
            success: false,
            error: 'transactions must be an array'
        });
    }

    const data = {
        transactions: transactions,
        sellPrice: sellPrice || 14.5
    };

    if (writeData(data)) {
        res.json({
            success: true,
            message: 'Data saved successfully',
            data: data
        });
    } else {
        res.status(500).json({
            success: false,
            error: 'Failed to save data'
        });
    }
});

// DELETE /api/transactions - Clear all data
app.delete('/api/transactions', (req, res) => {
    const data = {
        transactions: [],
        sellPrice: 14.5
    };

    if (writeData(data)) {
        res.json({
            success: true,
            message: 'All data cleared'
        });
    } else {
        res.status(500).json({
            success: false,
            error: 'Failed to clear data'
        });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ===== Start Server =====

initDataFile();

app.listen(PORT, () => {
    console.log(`
🚀 Gold Calculator API Server
================================
📍 URL: http://localhost:${PORT}
📋 Endpoints:
   GET    /api/transactions  - Get all data
   POST   /api/transactions  - Save data
   DELETE /api/transactions  - Clear all data
   GET    /api/health        - Health check
================================
    `);
});
