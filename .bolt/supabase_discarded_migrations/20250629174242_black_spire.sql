/*
  # Create orders table

  1. New Tables
    - `orders`
      - `id` (uuid, primary key)
      - `customer_name` (text, required)
      - `customer_phone` (text, optional)
      - `total` (numeric, required)
      - `status` (text, default 'pending')
      - `payment_method` (text, required)
      - `delivery_address` (text, optional)
      - `establishment_id` (uuid, foreign key to establishments)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS on `orders` table
    - Add policy for authenticated users to manage orders
*/

CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  customer_name text NOT NULL,
  customer_phone text,
  total numeric NOT NULL,
  status text DEFAULT 'pending',
  payment_method text NOT NULL,
  delivery_address text,
  establishment_id uuid NOT NULL REFERENCES establishments(id) ON DELETE CASCADE,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can manage orders"
  ON orders
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);