/*
  # Create default establishment and sample data

  1. Default Establishment
    - Create a default establishment if none exists
    - Set up basic information for the restaurant

  2. Sample Categories
    - Create some basic categories for testing

  3. Sample Products
    - Create some sample products for testing
*/

-- Create default establishment if none exists
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM establishments LIMIT 1) THEN
    INSERT INTO establishments (
      id,
      name,
      logo_url,
      phone,
      address,
      theme_color,
      created_at,
      updated_at
    ) VALUES (
      '00000000-0000-0000-0000-000000000000',
      'Restaurante Exemplo',
      'https://media.discordapp.net/attachments/1355737047943348337/1388967164580724857/BIGODEVAPOR-LOGO-SEM-FUNDO.png?ex=6862e7f9&is=68619679&hm=40a2edabedd9bd1773d50b4a7926fe67539dbacb265570538e20f4195dfa2807&=&format=webp&quality=lossless&width=968&height=968',
      '(11) 99999-9999',
      'Rua Exemplo, 123 - Centro',
      '#dc2626',
      now(),
      now()
    );
  END IF;
END $$;

-- Create sample categories if none exist
DO $$
DECLARE
  establishment_uuid uuid := '00000000-0000-0000-0000-000000000000';
BEGIN
  IF NOT EXISTS (SELECT 1 FROM categories LIMIT 1) THEN
    INSERT INTO categories (name, description, establishment_id) VALUES
    ('Pratos Principais', 'Nossos pratos principais deliciosos', establishment_uuid),
    ('Bebidas', 'Bebidas refrescantes e saborosas', establishment_uuid),
    ('Sobremesas', 'Doces irresistíveis para finalizar', establishment_uuid),
    ('Entradas', 'Aperitivos para começar bem', establishment_uuid);
  END IF;
END $$;

-- Create sample products if none exist
DO $$
DECLARE
  establishment_uuid uuid := '00000000-0000-0000-0000-000000000000';
  category_pratos uuid;
  category_bebidas uuid;
  category_sobremesas uuid;
  category_entradas uuid;
BEGIN
  IF NOT EXISTS (SELECT 1 FROM products LIMIT 1) THEN
    -- Get category IDs
    SELECT id INTO category_pratos FROM categories WHERE name = 'Pratos Principais' LIMIT 1;
    SELECT id INTO category_bebidas FROM categories WHERE name = 'Bebidas' LIMIT 1;
    SELECT id INTO category_sobremesas FROM categories WHERE name = 'Sobremesas' LIMIT 1;
    SELECT id INTO category_entradas FROM categories WHERE name = 'Entradas' LIMIT 1;
    
    -- Insert sample products
    INSERT INTO products (name, description, price, cost, stock, category_id, establishment_id, active) VALUES
    ('Hambúrguer Artesanal', 'Hambúrguer com carne 180g, queijo, alface, tomate e molho especial', 25.90, 12.00, 50, category_pratos, establishment_uuid, true),
    ('Pizza Margherita', 'Pizza tradicional com molho de tomate, mussarela e manjericão', 32.90, 15.00, 30, category_pratos, establishment_uuid, true),
    ('Refrigerante Lata', 'Refrigerante gelado 350ml', 5.90, 2.50, 100, category_bebidas, establishment_uuid, true),
    ('Suco Natural', 'Suco natural de frutas da estação', 8.90, 3.00, 25, category_bebidas, establishment_uuid, true),
    ('Brownie com Sorvete', 'Brownie de chocolate com sorvete de baunilha', 15.90, 6.00, 20, category_sobremesas, establishment_uuid, true),
    ('Batata Frita', 'Porção de batata frita crocante', 12.90, 4.00, 40, category_entradas, establishment_uuid, true);
  END IF;
END $$;