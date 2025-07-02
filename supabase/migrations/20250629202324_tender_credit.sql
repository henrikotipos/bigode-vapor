/*
  # Sistema de Entregas

  1. New Tables
    - `delivery_drivers`
      - `id` (uuid, primary key)
      - `name` (text)
      - `phone` (text)
      - `vehicle_type` (text)
      - `license_plate` (text)
      - `commission_rate` (numeric)
      - `active` (boolean)
      - `created_at` (timestamp)
    
    - `deliveries`
      - `id` (uuid, primary key)
      - `order_id` (uuid, foreign key)
      - `driver_id` (uuid, foreign key)
      - `pickup_time` (timestamp)
      - `delivery_time` (timestamp)
      - `delivery_fee` (numeric)
      - `driver_commission` (numeric)
      - `status` (text)
      - `notes` (text)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on both tables
    - Add policies for authenticated users
*/

-- Create delivery_drivers table
CREATE TABLE IF NOT EXISTS delivery_drivers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  phone text NOT NULL,
  vehicle_type text NOT NULL DEFAULT 'moto',
  license_plate text,
  commission_rate numeric DEFAULT 0.10 CHECK (commission_rate >= 0 AND commission_rate <= 1),
  active boolean DEFAULT true,
  created_at timestamptz DEFAULT now()
);

-- Create deliveries table
CREATE TABLE IF NOT EXISTS deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id uuid NOT NULL REFERENCES orders(id) ON DELETE CASCADE,
  driver_id uuid NOT NULL REFERENCES delivery_drivers(id),
  pickup_time timestamptz,
  delivery_time timestamptz,
  delivery_fee numeric DEFAULT 0 CHECK (delivery_fee >= 0),
  driver_commission numeric DEFAULT 0 CHECK (driver_commission >= 0),
  status text DEFAULT 'assigned' CHECK (status IN ('assigned', 'picked_up', 'delivered', 'cancelled')),
  notes text,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE delivery_drivers ENABLE ROW LEVEL SECURITY;
ALTER TABLE deliveries ENABLE ROW LEVEL SECURITY;

-- Create policies for delivery_drivers
CREATE POLICY "Authenticated users can manage delivery drivers"
  ON delivery_drivers
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create policies for deliveries
CREATE POLICY "Authenticated users can manage deliveries"
  ON deliveries
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_deliveries_order_id ON deliveries(order_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_driver_id ON deliveries(driver_id);
CREATE INDEX IF NOT EXISTS idx_deliveries_status ON deliveries(status);
CREATE INDEX IF NOT EXISTS idx_deliveries_created_at ON deliveries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_drivers_active ON delivery_drivers(active);