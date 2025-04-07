-- Enable RLS on all tables
DO $RLS_POLICIES$
BEGIN
    -- Users table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'users') THEN
        ALTER TABLE users ENABLE ROW LEVEL SECURITY;
        -- Users policies
        DROP POLICY IF EXISTS users_select ON users;
        CREATE POLICY users_select ON users FOR SELECT USING (true);
        DROP POLICY IF EXISTS users_update ON users;
        CREATE POLICY users_update ON users FOR UPDATE USING (auth.uid()::text::integer = id);
        DROP POLICY IF EXISTS users_delete ON users;
        CREATE POLICY users_delete ON users FOR DELETE USING (auth.uid()::text::integer = id);
    END IF;

    -- Products table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'products') THEN
        ALTER TABLE products ENABLE ROW LEVEL SECURITY;
        -- Products policies
        DROP POLICY IF EXISTS products_select ON products;
        CREATE POLICY products_select ON products FOR SELECT USING (true);
        DROP POLICY IF EXISTS products_insert ON products;
        CREATE POLICY products_insert ON products FOR INSERT WITH CHECK (auth.jwt() ->> 'role' = 'admin');
        DROP POLICY IF EXISTS products_update ON products;
        CREATE POLICY products_update ON products FOR UPDATE USING (auth.jwt() ->> 'role' = 'admin');
        DROP POLICY IF EXISTS products_delete ON products;
        CREATE POLICY products_delete ON products FOR DELETE USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Cart table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'cart') THEN
        ALTER TABLE cart ENABLE ROW LEVEL SECURITY;
        -- Cart policies
        DROP POLICY IF EXISTS cart_select ON cart;
        CREATE POLICY cart_select ON cart FOR SELECT USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS cart_insert ON cart;
        CREATE POLICY cart_insert ON cart FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS cart_update ON cart;
        CREATE POLICY cart_update ON cart FOR UPDATE USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS cart_delete ON cart;
        CREATE POLICY cart_delete ON cart FOR DELETE USING (auth.uid()::text::integer = user_id);
    END IF;

    -- Orders table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'orders') THEN
        ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
        -- Orders policies
        DROP POLICY IF EXISTS orders_select ON orders;
        CREATE POLICY orders_select ON orders FOR SELECT USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS orders_insert ON orders;
        CREATE POLICY orders_insert ON orders FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS orders_update ON orders;
        CREATE POLICY orders_update ON orders FOR UPDATE USING (auth.uid()::text::integer = user_id);
    END IF;

    -- Order items table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'order_items') THEN
        ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
        -- Order items policies
        DROP POLICY IF EXISTS order_items_select ON order_items;
        CREATE POLICY order_items_select ON order_items FOR SELECT 
        USING (EXISTS (SELECT 1 FROM orders WHERE orders.id = order_items.order_id AND orders.user_id = auth.uid()::text::integer));
    END IF;

    -- Wishlist table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'wishlist') THEN
        ALTER TABLE wishlist ENABLE ROW LEVEL SECURITY;
        -- Wishlist policies
        DROP POLICY IF EXISTS wishlist_select ON wishlist;
        CREATE POLICY wishlist_select ON wishlist FOR SELECT USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS wishlist_insert ON wishlist;
        CREATE POLICY wishlist_insert ON wishlist FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS wishlist_delete ON wishlist;
        CREATE POLICY wishlist_delete ON wishlist FOR DELETE USING (auth.uid()::text::integer = user_id);
    END IF;

    -- Categories table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'categories') THEN
        ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
        -- Categories policies
        DROP POLICY IF EXISTS categories_select ON categories;
        CREATE POLICY categories_select ON categories FOR SELECT USING (true);
        DROP POLICY IF EXISTS categories_modify ON categories;
        CREATE POLICY categories_modify ON categories FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Addresses table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'addresses') THEN
        ALTER TABLE addresses ENABLE ROW LEVEL SECURITY;
        -- Addresses policies
        DROP POLICY IF EXISTS addresses_select ON addresses;
        CREATE POLICY addresses_select ON addresses FOR SELECT USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS addresses_insert ON addresses;
        CREATE POLICY addresses_insert ON addresses FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS addresses_update ON addresses;
        CREATE POLICY addresses_update ON addresses FOR UPDATE USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS addresses_delete ON addresses;
        CREATE POLICY addresses_delete ON addresses FOR DELETE USING (auth.uid()::text::integer = user_id);
    END IF;

    -- Coupons table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupons') THEN
        ALTER TABLE coupons ENABLE ROW LEVEL SECURITY;
        -- Coupons policies
        DROP POLICY IF EXISTS coupons_select ON coupons;
        CREATE POLICY coupons_select ON coupons FOR SELECT USING (true);
        DROP POLICY IF EXISTS coupons_modify ON coupons;
        CREATE POLICY coupons_modify ON coupons FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Coupon products table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'coupon_products') THEN
        ALTER TABLE coupon_products ENABLE ROW LEVEL SECURITY;
        -- Coupon products policies
        DROP POLICY IF EXISTS coupon_products_select ON coupon_products;
        CREATE POLICY coupon_products_select ON coupon_products FOR SELECT USING (true);
        DROP POLICY IF EXISTS coupon_products_modify ON coupon_products;
        CREATE POLICY coupon_products_modify ON coupon_products FOR ALL USING (auth.jwt() ->> 'role' = 'admin');
    END IF;

    -- Brand reviews table
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'brand_reviews') THEN
        ALTER TABLE brand_reviews ENABLE ROW LEVEL SECURITY;
        -- Brand reviews policies
        DROP POLICY IF EXISTS brand_reviews_select ON brand_reviews;
        CREATE POLICY brand_reviews_select ON brand_reviews FOR SELECT USING (true);
        DROP POLICY IF EXISTS brand_reviews_insert ON brand_reviews;
        CREATE POLICY brand_reviews_insert ON brand_reviews FOR INSERT WITH CHECK (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS brand_reviews_update ON brand_reviews;
        CREATE POLICY brand_reviews_update ON brand_reviews FOR UPDATE USING (auth.uid()::text::integer = user_id);
        DROP POLICY IF EXISTS brand_reviews_delete ON brand_reviews;
        CREATE POLICY brand_reviews_delete ON brand_reviews FOR DELETE USING (auth.uid()::text::integer = user_id);
    END IF;
END $RLS_POLICIES$; 