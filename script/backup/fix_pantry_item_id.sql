-- Ajuste manual de PantryItem incorreto
-- Move entradas/saídas do item errado para o item correto
-- Atualiza somente o itemId informado

SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;

SET @wrong_item_id = '76c4a5f9-c2df-4169-be7e-6108178e80a4';
SET @correct_item_id = '61631d83-98f4-4272-97d5-e95fc60de73b';

-- Entradas
UPDATE PantryEntry
SET itemId = @correct_item_id
WHERE CAST(itemId AS BINARY(36)) = CAST(@wrong_item_id AS BINARY(36));

-- Saídas
UPDATE PantryExit
SET itemId = @correct_item_id
WHERE CAST(itemId AS BINARY(36)) = CAST(@wrong_item_id AS BINARY(36));

-- (Opcional) remover o item incorreto após a migração
-- DELETE FROM PantryItem
-- WHERE CAST(id AS BINARY(36)) = CAST(@wrong_item_id AS BINARY(36));

COMMIT;

SET SQL_SAFE_UPDATES = COALESCE(@old_sql_safe_updates, @@SQL_SAFE_UPDATES);
