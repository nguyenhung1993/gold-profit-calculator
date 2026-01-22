-- Add columns for Silver Calculator
ALTER TABLE calculator_data 
ADD COLUMN IF NOT EXISTS silver_transactions JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS silver_sell_price DECIMAL(10,2) DEFAULT 0;

-- Update existing row to initialize silver columns if null
UPDATE calculator_data 
SET 
  silver_transactions = '[]'::jsonb,
  silver_sell_price = 0
WHERE silver_transactions IS NULL;
