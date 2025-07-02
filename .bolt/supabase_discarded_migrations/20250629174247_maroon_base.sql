/*
  # Create order_items table

  1. New Tables
    - `order_items`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key to orders)
      - `product_id` (uuid, foreign key to products)
      - `quantity` (integer, required)
      - `price` (numeric, required)
      - `notes` (text, optional)

  2. Security
    - Enable RLS on `order_items` table
    - Add policy for authenticated users to manage order items
*/

CREATE TABLE IF NOT EXISTS order_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  product_id uuid NOT NULL REFERENCES products(id) ON DELETE CASCADE,
  quantity integer NOT NULL,
  price numeric NOT NULL,
  notes text
);

ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage order items"
  ON order_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);