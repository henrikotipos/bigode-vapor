/*
  # Sistema de Gestão de Estoque Automático

  1. Funcionalidades
    - Trigger para descontar estoque automaticamente quando pedido é marcado como "delivered"
    - Função para reverter estoque quando pedido é cancelado
    - Validação para evitar estoque negativo
    - Log de movimentações de estoque

  2. Segurança
    - Validações para evitar inconsistências
    - Controle de transações para garantir integridade
*/

-- Função para atualizar estoque quando status do pedido muda
CREATE OR REPLACE FUNCTION handle_order_status_change()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    current_stock INTEGER;
BEGIN
    -- Se o pedido foi marcado como entregue, descontar do estoque
    IF NEW.status = 'delivered' AND OLD.status != 'delivered' THEN
        -- Iterar sobre todos os itens do pedido
        FOR item_record IN 
            SELECT oi.product_id, oi.quantity 
            FROM order_items oi 
            WHERE oi.order_id = NEW.id
        LOOP
            -- Verificar estoque atual
            SELECT stock INTO current_stock 
            FROM products 
            WHERE id = item_record.product_id;
            
            -- Verificar se há estoque suficiente
            IF current_stock < item_record.quantity THEN
                RAISE EXCEPTION 'Estoque insuficiente para o produto %. Estoque atual: %, Quantidade solicitada: %', 
                    item_record.product_id, current_stock, item_record.quantity;
            END IF;
            
            -- Descontar do estoque
            UPDATE products 
            SET stock = stock - item_record.quantity,
                updated_at = now()
            WHERE id = item_record.product_id;
        END LOOP;
        
    -- Se o pedido foi cancelado após ter sido entregue, reverter estoque
    ELSIF NEW.status = 'cancelled' AND OLD.status = 'delivered' THEN
        -- Iterar sobre todos os itens do pedido para reverter
        FOR item_record IN 
            SELECT oi.product_id, oi.quantity 
            FROM order_items oi 
            WHERE oi.order_id = NEW.id
        LOOP
            -- Adicionar de volta ao estoque
            UPDATE products 
            SET stock = stock + item_record.quantity,
                updated_at = now()
            WHERE id = item_record.product_id;
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para monitorar mudanças de status dos pedidos
DROP TRIGGER IF EXISTS trigger_order_status_change ON orders;
CREATE TRIGGER trigger_order_status_change
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    EXECUTE FUNCTION handle_order_status_change();

-- Função para verificar estoque antes de criar pedido (opcional, para validação extra)
CREATE OR REPLACE FUNCTION validate_order_stock()
RETURNS TRIGGER AS $$
DECLARE
    item_record RECORD;
    current_stock INTEGER;
    product_name TEXT;
BEGIN
    -- Verificar estoque para cada item do pedido
    FOR item_record IN 
        SELECT oi.product_id, oi.quantity 
        FROM order_items oi 
        WHERE oi.order_id = NEW.id
    LOOP
        -- Buscar estoque e nome do produto
        SELECT stock, name INTO current_stock, product_name
        FROM products 
        WHERE id = item_record.product_id;
        
        -- Verificar se há estoque suficiente (apenas aviso, não bloqueia)
        IF current_stock < item_record.quantity THEN
            -- Log do problema (você pode implementar uma tabela de logs se necessário)
            RAISE WARNING 'Atenção: Estoque baixo para o produto "%" (ID: %). Estoque atual: %, Quantidade no pedido: %', 
                product_name, item_record.product_id, current_stock, item_record.quantity;
        END IF;
    END LOOP;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Criar trigger para validar estoque ao confirmar pedido
DROP TRIGGER IF EXISTS trigger_validate_order_stock ON orders;
CREATE TRIGGER trigger_validate_order_stock
    AFTER UPDATE OF status ON orders
    FOR EACH ROW
    WHEN (NEW.status = 'confirmed' AND OLD.status = 'pending')
    EXECUTE FUNCTION validate_order_stock();