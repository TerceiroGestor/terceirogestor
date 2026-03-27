-- Rollback das inserções do import (por tenant e data de hoje)
-- Ajuste @tenant_id se necessário.
-- Desabilita safe updates nesta sessão para evitar bloqueios.
SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;
SET @tenant_id = '2d2ab1db-7e40-45af-8fd8-b2e2d27bd60c';
SET @today_start = TIMESTAMP(CURDATE());
SET @tomorrow_start = TIMESTAMP(DATE_ADD(CURDATE(), INTERVAL 1 DAY));

START TRANSACTION;

-- Apaga alocações ligadas a saídas/entradas criadas hoje
DELETE pea
FROM PantryExitAllocation pea
JOIN PantryExit pe ON pe.id = pea.exitId
WHERE CAST(pe.tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND pe.createdAt >= @today_start
  AND pe.createdAt < @tomorrow_start;

DELETE pea
FROM PantryExitAllocation pea
JOIN PantryEntry pen ON pen.id = pea.entryId
WHERE CAST(pen.tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND pen.createdAt >= @today_start
  AND pen.createdAt < @tomorrow_start;

-- Apaga saídas e entradas criadas hoje
DELETE FROM PantryExit
WHERE CAST(tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND createdAt >= @today_start
  AND createdAt < @tomorrow_start;

DELETE FROM PantryEntry
WHERE CAST(tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND createdAt >= @today_start
  AND createdAt < @tomorrow_start;

-- Apaga itens e setores criados hoje
DELETE FROM PantryItem
WHERE CAST(tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND createdAt >= @today_start
  AND createdAt < @tomorrow_start;

DELETE FROM PantrySector
WHERE CAST(tenantId AS BINARY(36)) = CAST(@tenant_id AS BINARY(36))
  AND createdAt >= @today_start
  AND createdAt < @tomorrow_start;

COMMIT;

SET SQL_SAFE_UPDATES = COALESCE(@old_sql_safe_updates, @@SQL_SAFE_UPDATES);
