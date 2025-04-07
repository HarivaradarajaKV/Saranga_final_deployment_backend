-- Create reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS reviews (
    id SERIAL PRIMARY KEY,
    product_id INTEGER REFERENCES products(id) ON DELETE CASCADE,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(product_id, user_id)
);

-- Create brand_reviews table if it doesn't exist
CREATE TABLE IF NOT EXISTS brand_reviews (
    id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_name VARCHAR(255),
    UNIQUE(user_id)
);

-- Enable RLS on reviews table
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;

-- Enable RLS on brand_reviews table
ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;

-- Add RLS policies for reviews
DO $$ 
BEGIN
    -- Reviews policies
    DROP POLICY IF EXISTS reviews_select ON reviews;
    CREATE POLICY reviews_select ON reviews FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS reviews_insert ON reviews;
    CREATE POLICY reviews_insert ON reviews FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
    
    DROP POLICY IF EXISTS reviews_update ON reviews;
    CREATE POLICY reviews_update ON reviews FOR UPDATE USING (auth.uid()::text::integer = user_id);
    
    DROP POLICY IF EXISTS reviews_delete ON reviews;
    CREATE POLICY reviews_delete ON reviews FOR DELETE USING (auth.uid()::text::integer = user_id);

    -- Brand reviews policies
    DROP POLICY IF EXISTS brand_reviews_select ON brand_reviews;
    CREATE POLICY brand_reviews_select ON brand_reviews FOR SELECT USING (true);
    
    DROP POLICY IF EXISTS brand_reviews_insert ON brand_reviews;
    CREATE POLICY brand_reviews_insert ON brand_reviews FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
    
    DROP POLICY IF EXISTS brand_reviews_update ON brand_reviews;
    CREATE POLICY brand_reviews_update ON brand_reviews FOR UPDATE USING (auth.uid()::text::integer = user_id);
    
    DROP POLICY IF EXISTS brand_reviews_delete ON brand_reviews;
    CREATE POLICY brand_reviews_delete ON brand_reviews FOR DELETE USING (auth.uid()::text::integer = user_id);
END $$; 