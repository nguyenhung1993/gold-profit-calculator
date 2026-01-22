// ===== Gold Calculator Backend API =====
// Express server with Supabase PostgreSQL storage

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { createClient } = require('@supabase/supabase-js');

const app = express();
const PORT = process.env.PORT || 3001;

// ===== Supabase Connection =====

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_ANON_KEY;

let supabase = null;
let dbConnected = false;

if (supabaseUrl && supabaseKey) {
    supabase = createClient(supabaseUrl, supabaseKey);
    dbConnected = true;
    console.log('✅ Supabase client initialized');
} else {
    console.log('⚠️  Supabase credentials not found. Running without database.');
}

// ===== Middleware =====

app.use(cors());
app.use(express.json());

// ===== Helper Functions =====

// Get data from Supabase
async function getData() {
    if (!supabase) {
        return { transactions: [], sellPrice: 14.5, lastUpdated: new Date().toISOString() };
    }

    try {
        const { data, error } = await supabase
            .from('calculator_data')
            .select('*')
            .eq('doc_id', 'main')
            .single();

        if (error) {
            // If no data exists, create initial record
            if (error.code === 'PGRST116') {
                return await createInitialData();
            }
            throw error;
        }

        return {
            transactions: data.transactions || [],
            sellPrice: data.sell_price || 14.5,
            silverTransactions: data.silver_transactions || [],
            silverSellPrice: data.silver_sell_price || 0,
            lastUpdated: data.updated_at
        };
    } catch (error) {
        console.error('Error getting data:', error.message);
        return {
            transactions: [], sellPrice: 14.5,
            silverTransactions: [], silverSellPrice: 0,
            lastUpdated: new Date().toISOString()
        };
    }
}

// Create initial data in Supabase
async function createInitialData() {
    const initialData = {
        doc_id: 'main',
        transactions: [],
        sell_price: 14.5
    };

    const { data, error } = await supabase
        .from('calculator_data')
        .insert(initialData)
        .select()
        .single();

    if (error) {
        console.error('Error creating initial data:', error.message);
        return { transactions: [], sellPrice: 14.5, lastUpdated: new Date().toISOString() };
    }

    console.log('📁 Created initial Supabase record');
    return {
        transactions: data.transactions || [],
        sellPrice: data.sell_price || 14.5,
        silverTransactions: [],
        silverSellPrice: 0,
        lastUpdated: data.updated_at
    };
}

// Save data to Supabase
async function saveData(dataPayload) {
    if (!supabase) {
        return { success: false, error: 'Database not connected' };
    }

    try {
        const { transactions, sellPrice, silverTransactions, silverSellPrice } = dataPayload;

        const upsertData = {
            doc_id: 'main',
            transactions: transactions,
            sell_price: sellPrice,
            updated_at: new Date().toISOString()
        };

        // Only add silver fields if they are provided (for backward compatibility if needed)
        if (silverTransactions !== undefined) upsertData.silver_transactions = silverTransactions;
        if (silverSellPrice !== undefined) upsertData.silver_sell_price = silverSellPrice;

        const { data, error } = await supabase
            .from('calculator_data')
            .upsert(upsertData, {
                onConflict: 'doc_id'
            })
            .select()
            .single();

        if (error) throw error;

        return {
            success: true,
            data: {
                transactions: data.transactions,
                sellPrice: data.sell_price,
                silverTransactions: data.silver_transactions,
                silverSellPrice: data.silver_sell_price,
                lastUpdated: data.updated_at
            }
        };
    } catch (error) {
        console.error('Error saving data:', error.message);
        return { success: false, error: error.message };
    }
}

// ===== API Routes =====

// GET /api/transactions - Get all data
app.get('/api/transactions', async (req, res) => {
    try {
        const data = await getData();
        res.json({
            success: true,
            data: data
        });
    } catch (error) {
        console.error('Error getting data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to fetch data'
        });
    }
});

// POST /api/transactions - Save all data
app.post('/api/transactions', async (req, res) => {
    try {
        const { transactions, sellPrice, silverTransactions, silverSellPrice } = req.body;

        if (!Array.isArray(transactions)) {
            return res.status(400).json({
                success: false,
                error: 'transactions must be an array'
            });
        }

        const result = await saveData({
            transactions,
            sellPrice: sellPrice || 14.5,
            silverTransactions: silverTransactions || [],
            silverSellPrice: silverSellPrice || 0
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'Data saved successfully',
                data: result.data
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to save data'
            });
        }
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to save data'
        });
    }
});

// DELETE /api/transactions - Clear all data
app.delete('/api/transactions', async (req, res) => {
    try {
        const result = await saveData({
            transactions: [],
            sellPrice: 14.5,
            silverTransactions: [],
            silverSellPrice: 0
        });

        if (result.success) {
            res.json({
                success: true,
                message: 'All data cleared'
            });
        } else {
            res.status(500).json({
                success: false,
                error: result.error || 'Failed to clear data'
            });
        }
    } catch (error) {
        console.error('Error clearing data:', error);
        res.status(500).json({
            success: false,
            error: 'Failed to clear data'
        });
    }
});

// Health check
app.get('/api/health', async (req, res) => {
    res.json({
        status: 'ok',
        database: dbConnected ? 'connected' : 'disconnected',
        provider: 'Supabase PostgreSQL',
        timestamp: new Date().toISOString()
    });
});

// ===== Start Server =====

app.listen(PORT, () => {
    console.log(`
🚀 Gold Calculator API Server
================================
📍 URL: http://localhost:${PORT}
🗄️  Database: Supabase PostgreSQL
📋 Endpoints:
   GET    /api/transactions  - Get all data
   POST   /api/transactions  - Save data
   DELETE /api/transactions  - Clear all data
   GET    /api/health        - Health check
================================
    `);
});
