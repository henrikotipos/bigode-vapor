/*
  # Fix RLS policies for public order creation

  1. Security Changes
    - Update orders table policies to allow anonymous users to create orders
    - Update order_items table policies to allow anonymous users to create order items
    - Ensure establishments and categories are readable by anonymous users
    - Maintain security for admin operations

  2. Policy Updates
    - Allow INSERT operations for anonymous users on orders table
    - Allow INSERT operations for anonymous users on order_items table
    - Keep existing policies for authenticated users (admin operations)
*/

-- Drop existing policies for orders table
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "Authenticated users can manage orders" ON orders;

-- Create new policies for orders table
CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read orders"
  ON orders
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update orders"
  ON orders
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete orders"
  ON orders
  FOR DELETE
  TO authenticated
  USING (true);

-- Drop existing policies for order_items table
DROP POLICY IF EXISTS "Anyone can create order items" ON order_items;
DROP POLICY IF EXISTS "Authenticated users can manage order items" ON order_items;

-- Create new policies for order_items table
CREATE POLICY "Anyone can create order items"
  ON order_items
  FOR INSERT
  TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Anyone can read order items"
  ON order_items
  FOR SELECT
  TO anon, authenticated
  USING (true);

CREATE POLICY "Authenticated users can update order items"
  ON order_items
  FOR UPDATE
  TO authenticated
  USING (true);

CREATE POLICY "Authenticated users can delete order items"
  ON order_items
  FOR DELETE
  TO authenticated
  USING (true);

-- Ensure establishments table allows anonymous reads
DROP POLICY IF EXISTS "Anyone can read establishments" ON establishments;
CREATE POLICY "Anyone can read establishments"
  ON establishments
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure categories table allows anonymous reads
DROP POLICY IF EXISTS "Anyone can read categories" ON categories;
CREATE POLICY "Anyone can read categories"
  ON categories
  FOR SELECT
  TO anon, authenticated
  USING (true);

-- Ensure products table allows anonymous reads for active products
DROP POLICY IF EXISTS "Anyone can read active products" ON products;
CREATE POLICY "Anyone can read active products"
  ON products
  FOR SELECT
  TO anon, authenticated
  USING (active = true);