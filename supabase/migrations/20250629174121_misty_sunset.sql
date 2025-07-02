/*
  # Create update triggers

  1. Functions
    - Create function to automatically update updated_at timestamps

  2. Triggers
    - Add triggers to establishments table
    - Add triggers to products table
    - Add triggers to orders table
*/

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Add triggers for updated_at
DO $$
BEGIN
  -- Establishments table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_establishments_updated_at'
  ) THEN
    CREATE TRIGGER update_establishments_updated_at
      BEFORE UPDATE ON establishments
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Products table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_products_updated_at'
  ) THEN
    CREATE TRIGGER update_products_updated_at
      BEFORE UPDATE ON products
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;

  -- Orders table
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.triggers 
    WHERE trigger_name = 'update_orders_updated_at'
  ) THEN
    CREATE TRIGGER update_orders_updated_at
      BEFORE UPDATE ON orders
      FOR EACH ROW
      EXECUTE FUNCTION update_updated_at_column();
  END IF;
END $$;