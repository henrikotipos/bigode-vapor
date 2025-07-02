/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, not null)
      - `customer_phone` (text, nullable)
      - `total` (numeric, not null)
      - `status` (text, default 'pending')
      - `payment_method` (text, not null)
      - `delivery_address` (text, nullable)
      - `establishment_id` (uuid, foreign key to establishments)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Add policy for authenticated users to manage orders
    - Add policy for anyone to create orders (for public menu)

  3. Indexes
    - Add index on establishment_id for better query performance
    - Add index on status for filtering
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  total numeric NOT NULL CHECK (total >= 0),
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'confirmed', 'preparing', 'ready', 'delivered', 'cancelled')),
  payment_method text NOT NULL,
  delivery_address text,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can create orders"
  ON orders
  FOR INSERT
  TO authenticated, anon
  WITH CHECK (true);

CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_orders_establishment_id ON orders(establishment_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);