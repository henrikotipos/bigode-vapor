/*
  # Create order_items table

  1. New Tables
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer, not null)
      - `price` (numeric, not null)
      - `notes` (text, nullable)

  2. Security
    - Enable RLS on `order_items` table
    - Add policy for anyone to create order items (for public menu)
    - Add policy for authenticated users to manage order items

  3. Indexes
    - Add index on order_id for better query performance
    - Add index on product_id for better query performance
*/

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL CHECK (quantity > 0),
  price numeric NOT NULL CHECK (price >= 0),
  notes text
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create order items"
  ON order_items
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);
CREATE INDEX IF NOT EXISTS idx_order_items_product_id ON order_items(product_id);