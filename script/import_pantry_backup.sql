-- SQL gerado automaticamente a partir de backup.csv
-- Ajuste @default_unit, @default_sector e @exit_type se necessário.
-- No Workbench: selecione o schema correto antes de rodar (ou use USE seu_banco;).
-- Desabilita safe updates nesta sessão para evitar bloqueios.
SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

START TRANSACTION;
SET @tenant_id = '2d2ab1db-7e40-45af-8fd8-b2e2d27bd60c';
SET @default_sector = 'Geral';
SET @default_unit = 'un';
SET @min_stock = 0;
SET @exit_type = 'ATTENDED';
SET @entry_note = 'Importado do backup.csv';
SET @exit_note = 'Importado do backup.csv';

DROP TEMPORARY TABLE IF EXISTS tmp_pantry_backup;
CREATE TEMPORARY TABLE tmp_pantry_backup (
  group_name VARCHAR(191) NOT NULL,
  ano_mes CHAR(7) NOT NULL,
  total_entrada DECIMAL(10,2) NOT NULL,
  total_saida DECIMAL(10,2) NOT NULL,
  saldo DECIMAL(10,2) NOT NULL,
  entry_id CHAR(36) NULL,
  exit_id CHAR(36) NULL
) ENGINE=InnoDB;

INSERT INTO tmp_pantry_backup (group_name, ano_mes, total_entrada, total_saida, saldo) VALUES
('Achocolatado','2026-04',9,5,4),
('Achocolatado','2026-05',4,4,0),
('Achocolatado','2026-07',8,8,0),
('Achocolatado','2026-08',3,2,1),
('Achocolatado','2026-11',1,1,0),
('Achocolatado','2027-01',4,4,0),
('Acompanhamentos','2026-07',5,1,4),
('Açúcar','2026-07',3,2,1),
('Açúcar','2026-09',1,0,1),
('Açúcar','2026-10',1,1,0),
('Açúcar','2027-07',1,1,0),
('Açúcar','2027-08',1,1,0),
('Açúcar','2027-09',1,1,0),
('Açúcar','2027-10',1,1,0),
('Açúcar','2028-01',9,8,1),
('Arroz','2026-01',12,0,12),
('Arroz','2026-04',107,5,102),
('Arroz','2026-07',25,0,25),
('Arroz','2026-08',1,0,1),
('Arroz','2026-09',120,7,113),
('Arroz','2026-10',1,1,0),
('Arroz','2026-11',6,2,4),
('Bebidas','2026-05',18,0,18),
('Bebidas','2026-07',1,0,1),
('Biscoito | Bolacha','2026-01',24,24,0),
('Biscoito | Bolacha','2026-02',1,0,1),
('Biscoito | Bolacha','2026-05',78,0,78),
('Biscoito | Bolacha','2026-06',91,0,91),
('Biscoito | Bolacha','2026-07',26,0,26),
('Biscoito | Bolacha','2026-08',1,0,1),
('Café','2026-12',20,15,5),
('Carne','2029-09',31,9,22),
('Cesta Básica','2026-06',70,61,9),
('Chá','2027-11',38,1,37),
('Farinha','2026-02',15,12,3),
('Farinha','2026-03',25,5,20),
('Farinha','2026-04',4,0,4),
('Farinha','2026-06',4,1,3),
('Farinha','2026-08',4,0,4),
('Farinha','2026-09',2,1,1),
('Farinha','2026-10',3,0,3),
('Feijão','2026-01',35,35,0),
('Feijão','2026-02',22,9,13),
('Feijão','2026-03',60,2,58),
('Feijão','2026-04',15,5,10),
('Feijão','2026-05',17,0,17),
('Feijão','2026-06',1,0,1),
('Feijão','2026-07',1,0,1),
('Feijão','2026-09',1,0,1),
('Feijão','2026-10',1,0,1),
('Feijão','2026-11',1,0,1),
('Frutas','2026-12',1,1,0),
('Leite','2026-01',143,143,0),
('Leite','2026-02',381,221,160),
('Leite','2026-03',160,57,103),
('Leite','2026-04',49,31,18),
('Leite','2026-05',12,0,12),
('Leite','2026-09',2,2,0),
('Leite','2026-10',25,0,25),
('Maizena','2026-05',23,0,23),
('Maizena','2026-09',6,0,6),
('Massas','2026-01',3,0,3),
('Massas','2026-03',6,0,6),
('Massas','2026-04',2,0,2),
('Massas','2026-05',2,0,2),
('Massas','2026-06',41,18,23),
('Massas','2026-07',60,0,60),
('Massas','2026-08',20,0,20),
('Massas','2026-09',139,2,137),
('Massas','2026-10',2,0,2),
('Massas','2026-12',4,0,4),
('Massas','2027-01',367,53,314),
('Massas','2027-11',8,2,6),
('Molho','2025-09',3,0,3),
('Molho','2026-02',183,181,2),
('Molho','2026-03',11,0,11),
('Molho','2026-06',6,0,6),
('Molho','2026-07',38,0,38),
('Molho','2026-08',2,0,2),
('Molho','2026-09',11,0,11),
('Molho','2026-10',5,0,5),
('Molho','2026-12',36,0,36),
('Molho','2027-01',145,106,39),
('Molho','2027-02',8,0,8),
('Molho','2027-03',2,0,2),
('Molho','2027-06',71,0,71),
('Molho','2027-10',1,0,1),
('Molho','2027-11',8,0,8),
('Óleo','2026-03',4,4,0),
('Óleo','2026-04',9,6,3),
('Óleo','2026-05',20,20,0),
('Óleo','2026-06',1,1,0),
('Óleo','2026-08',4,4,0),
('Óleo','2027-07',3,3,0),
('Pão','2026-03',226,173,53),
('Pipoca','2026-05',1,1,0),
('Pipoca','2026-06',1,1,0),
('Pipoca','2026-07',2,0,2),
('Pipoca','2026-08',1,1,0),
('Sal','2026-05',3,0,3),
('Sal','2026-12',2,0,2),
('Sal','2027-01',2,0,2),
('Sal','2027-02',6,0,6),
('Sal','2027-03',9,0,9),
('Sal','2027-04',6,1,5),
('Sal','2027-05',1,0,1),
('Sal','2027-06',3,0,3),
('Sal','2027-07',1,1,0),
('Sal','2027-08',1,0,1),
('Sal','2028-08',1,1,0),
('Sobremesa','2026-02',1,1,0),
('Sobremesa','2026-04',49,27,22),
('Sobremesa','2026-07',2,2,0),
('Sobremesa','2026-08',1,1,0),
('Sobremesa','2026-09',16,13,3),
('Sobremesa','2026-10',6,0,6),
('Sobremesa','2026-11',26,10,16),
('Tempero','2026-03',2,2,0),
('Tempero','2026-10',8,6,2),
('Tempero','2027-11',2,1,1);

UPDATE tmp_pantry_backup SET entry_id = UUID() WHERE total_entrada > 0;
UPDATE tmp_pantry_backup SET exit_id = UUID() WHERE total_saida > 0;

-- garante setor padrão
INSERT INTO PantrySector (id, tenantId, name, createdAt, updatedAt)
SELECT UUID(), @tenant_id, @default_sector, NOW(), NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM PantrySector WHERE tenantId = @tenant_id AND name = @default_sector
);

-- cria itens ausentes (usa unidade padrão e estoque mínimo 0)
INSERT INTO PantryItem (id, tenantId, name, `group`, defaultSector, unit, minStock, createdAt, updatedAt)
SELECT UUID(), @tenant_id, b.group_name, NULL, @default_sector, @default_unit, @min_stock, NOW(), NOW()
FROM (SELECT DISTINCT group_name FROM tmp_pantry_backup) b
WHERE NOT EXISTS (
  SELECT 1 FROM PantryItem i WHERE i.tenantId = @tenant_id AND i.name = b.group_name
);

-- mapeia items por nome (se houver duplicados, usa o menor id)
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_item_map;
CREATE TEMPORARY TABLE tmp_pantry_item_map AS
SELECT name AS group_name, MIN(id) AS item_id, MIN(unit) AS unit
FROM PantryItem
WHERE tenantId = @tenant_id
GROUP BY name;

-- insere entradas mensais
INSERT INTO PantryEntry (id, tenantId, itemId, donorId, sector, quantity, unit, entryDate, expiryDate, notes, reversalOfExitId, createdAt, updatedAt)
SELECT
  b.entry_id,
  @tenant_id,
  m.item_id,
  NULL,
  @default_sector,
  b.total_entrada,
  m.unit,
  TIMESTAMP(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d")),
  NULL,
  @entry_note,
  NULL,
  TIMESTAMP(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d")),
  TIMESTAMP(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d"))
FROM tmp_pantry_backup b
JOIN tmp_pantry_item_map m ON m.group_name = b.group_name
WHERE b.total_entrada > 0;

-- insere saídas mensais
INSERT INTO PantryExit (id, tenantId, itemId, sector, quantity, unit, exitDate, type, eventName, notes, reversalOfEntryId, createdAt, updatedAt)
SELECT
  b.exit_id,
  @tenant_id,
  m.item_id,
  @default_sector,
  b.total_saida,
  m.unit,
  TIMESTAMP(LAST_DAY(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d"))),
  @exit_type,
  NULL,
  @exit_note,
  NULL,
  TIMESTAMP(LAST_DAY(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d"))),
  TIMESTAMP(LAST_DAY(STR_TO_DATE(CONCAT(b.ano_mes, "-01"), "%Y-%m-%d")))
FROM tmp_pantry_backup b
JOIN tmp_pantry_item_map m ON m.group_name = b.group_name
WHERE b.total_saida > 0;

-- cria alocações (todas as saídas são alocadas na entrada do mesmo mês)
INSERT INTO PantryExitAllocation (id, tenantId, exitId, entryId, quantity, createdAt)
SELECT UUID(), @tenant_id, b.exit_id, b.entry_id, b.total_saida, NOW()
FROM tmp_pantry_backup b
WHERE b.total_saida > 0 AND b.total_entrada > 0;

-- limpeza
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_item_map;
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_backup;
COMMIT;

SET SQL_SAFE_UPDATES = COALESCE(@old_sql_safe_updates, @@SQL_SAFE_UPDATES);
