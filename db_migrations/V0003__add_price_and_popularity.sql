-- Add price and popularity fields to games table
ALTER TABLE games ADD COLUMN IF NOT EXISTS price DECIMAL(10, 2) DEFAULT 0.00;
ALTER TABLE games ADD COLUMN IF NOT EXISTS is_popular BOOLEAN DEFAULT false;