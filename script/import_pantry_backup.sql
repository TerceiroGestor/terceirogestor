-- Importa movimentações da despensa a partir do CSV `vw_movimentacoes_alimentos.csv`.
--
-- Requisitos:
-- - MySQL 5.7+ (usa RANDOM_BYTES)
--
-- Ajuste as variáveis (@tenant_id, @default_sector, @default_unit, @exit_type) se necessário.
-- No Workbench: selecione o schema correto antes de rodar (ou use USE seu_banco;).

-- Desabilita safe updates nesta sessão para evitar bloqueios.
SET @old_sql_safe_updates = @@SQL_SAFE_UPDATES;
SET SQL_SAFE_UPDATES = 0;

-- Padroniza charset/collation da sessão (as tabelas do Prisma usam utf8mb4_unicode_ci).
-- Evita erros do tipo: "Illegal mix of collations ... for operation '='".
SET NAMES utf8mb4 COLLATE utf8mb4_unicode_ci;

START TRANSACTION;

SET @tenant_id = '2d2ab1db-7e40-45af-8fd8-b2e2d27bd60c';
SET @default_sector = 'Geral';
SET @default_unit = 'un';
SET @min_stock = 0;
SET @exit_type = 'ATTENDED';
SET @entry_note = 'Importado do vw_movimentacoes_alimentos.csv';
SET @exit_note = 'Importado do vw_movimentacoes_alimentos.csv';

-- 1) Carrega CSV para staging
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_movements;
CREATE TEMPORARY TABLE tmp_pantry_movements (
  row_id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT,
  movement_type VARCHAR(20) NOT NULL,
  item_name VARCHAR(191) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  movement_at DATETIME(3) NOT NULL,
  expiry_date DATE NULL,
  PRIMARY KEY (row_id),
  INDEX idx_type (movement_type),
  INDEX idx_item (item_name),
  INDEX idx_expiry (expiry_date)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Dados do CSV embutidos (evita depender de `LOAD DATA LOCAL INFILE`).
-- Se você atualizar `script/vw_movimentacoes_alimentos.csv`, regenere este bloco.
-- CSV_DATA_START
INSERT INTO tmp_pantry_movements (movement_type, item_name, quantity, movement_at, expiry_date) VALUES
('ENTRADA','Sal',3,'2026-01-22 13:31:59','2026-05-01'),
('ENTRADA','Molho',180,'2026-01-26 13:41:09','2026-02-07'),
('ENTRADA','Arroz',1,'2026-01-22 15:17:52','2026-08-29'),
('ENTRADA','Bebidas',18,'2026-01-26 13:57:12','2026-05-07'),
('ENTRADA','Leite',49,'2026-01-22 11:35:37','2026-02-07'),
('ENTRADA','Feijão',8,'2026-01-15 10:35:10','2026-02-11'),
('ENTRADA','Massas',5,'2026-01-15 15:00:44','2027-01-01'),
('ENTRADA','Arroz',20,'2026-01-15 09:46:11','2026-07-01'),
('ENTRADA','Molho',1,'2026-01-22 11:13:40','2026-08-12'),
('ENTRADA','Feijão',30,'2026-01-15 10:23:43','2026-03-01'),
('ENTRADA','Açúcar',1,'2026-01-22 15:13:19','2027-08-12'),
('ENTRADA','Sal',2,'2026-01-22 14:05:46','2027-06-01'),
('ENTRADA','Leite',12,'2026-01-22 11:57:58','2026-02-28'),
('ENTRADA','Massas',1,'2026-01-29 07:40:11','2026-10-01'),
('ENTRADA','Feijão',1,'2026-01-15 11:07:22','2026-04-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:34:06','2026-09-01'),
('ENTRADA','Molho',6,'2026-01-22 10:31:42','2027-02-01'),
('ENTRADA','Molho',17,'2026-01-22 10:48:24','2026-07-01'),
('ENTRADA','Óleo',1,'2026-01-16 14:18:00','2026-06-09'),
('ENTRADA','Molho',8,'2026-01-22 10:33:29','2027-11-01'),
('ENTRADA','Óleo',4,'2026-01-16 14:16:05','2026-08-01'),
('ENTRADA','Molho',1,'2026-01-22 11:06:58','2026-07-01'),
('ENTRADA','Farinha',3,'2026-01-22 14:57:50','2026-02-05'),
('ENTRADA','Massas',21,'2026-01-15 14:46:26','2027-01-01'),
('ENTRADA','Sobremesa',6,'2026-01-26 13:53:11','2026-10-01'),
('ENTRADA','Sal',2,'2026-01-22 13:59:57','2027-01-01'),
('ENTRADA','Molho',3,'2026-01-22 10:52:33','2026-02-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:32:07','2026-05-01'),
('ENTRADA','Massas',32,'2026-01-15 14:47:54','2027-01-01'),
('ENTRADA','Arroz',6,'2026-01-15 09:50:10','2026-01-15'),
('ENTRADA','Sal',1,'2026-01-22 14:18:27','2027-07-01'),
('ENTRADA','Molho',11,'2026-01-22 10:30:55','2026-03-01'),
('ENTRADA','Arroz',19,'2026-01-15 09:38:38','2026-09-01'),
('ENTRADA','Farinha',5,'2026-01-22 14:24:55','2026-03-01'),
('ENTRADA','Massas',27,'2026-01-15 14:32:50','2027-01-01'),
('ENTRADA','Massas',5,'2026-01-15 15:14:21','2027-01-13'),
('ENTRADA','Massas',1,'2026-01-15 15:16:06','2027-01-15'),
('ENTRADA','Feijão',1,'2026-01-29 07:27:37','2026-10-01'),
('ENTRADA','Pão',226,'2026-01-22 13:57:11','2026-03-01'),
('ENTRADA','Leite',31,'2026-01-22 12:01:44','2026-04-06'),
('ENTRADA','Massas',6,'2026-01-15 14:52:52','2027-01-01'),
('ENTRADA','Maizena',2,'2026-01-16 13:59:30','2026-09-26'),
('ENTRADA','Sal',2,'2026-01-22 14:03:44','2027-02-01'),
('ENTRADA','Feijão',5,'2026-01-15 11:08:09','2026-05-19'),
('ENTRADA','Molho',3,'2026-01-22 10:37:37','2026-07-01'),
('ENTRADA','Achocolatado',2,'2026-01-22 09:32:19','2026-08-01'),
('ENTRADA','Farinha',20,'2026-01-22 14:23:02','2026-03-10'),
('ENTRADA','Açúcar',9,'2026-01-22 14:57:02','2028-01-26'),
('ENTRADA','Molho',1,'2026-01-22 10:50:25','2026-12-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:06:36','2026-06-01')
;
INSERT INTO tmp_pantry_movements (movement_type, item_name, quantity, movement_at, expiry_date) VALUES
('ENTRADA','Molho',11,'2026-01-22 10:38:16','2026-09-01'),
('ENTRADA','Massas',5,'2026-01-15 15:29:08','2027-01-01'),
('ENTRADA','Massas',11,'2026-01-15 14:34:04','2027-01-15'),
('ENTRADA','Massas',8,'2026-01-26 13:46:51','2027-11-07'),
('ENTRADA','Massas',2,'2026-01-15 15:13:52','2026-04-10'),
('ENTRADA','Molho',1,'2026-01-26 14:30:01','2027-10-01'),
('ENTRADA','Massas',13,'2026-01-15 15:24:49','2027-01-01'),
('ENTRADA','Açúcar',1,'2026-01-22 14:59:13','2027-10-01'),
('ENTRADA','Leite',6,'2026-01-22 11:40:52','2026-02-10'),
('ENTRADA','Leite',12,'2026-01-22 11:39:08','2026-02-18'),
('ENTRADA','Massas',38,'2026-01-15 10:54:35','2026-09-01'),
('ENTRADA','Leite',25,'2026-01-26 14:12:44','2026-10-13'),
('ENTRADA','Farinha',2,'2026-01-22 15:01:12','2026-08-25'),
('ENTRADA','Sal',4,'2026-01-22 13:33:42','2027-02-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:17:54','2026-05-01'),
('ENTRADA','Feijão',1,'2026-01-15 11:10:16','2026-05-29'),
('ENTRADA','Biscoito | Bolacha',78,'2026-01-16 13:31:02','2026-05-30'),
('ENTRADA','Sal',1,'2026-01-22 14:17:06','2027-06-01'),
('ENTRADA','Leite',2,'2026-01-22 11:36:47','2026-02-07'),
('ENTRADA','Arroz',94,'2026-01-15 09:13:04','2026-09-02'),
('ENTRADA','Feijão',1,'2026-01-29 07:20:02','2026-05-01'),
('ENTRADA','Massas',100,'2026-01-15 10:40:46','2026-09-01'),
('ENTRADA','Massas',20,'2026-01-15 10:49:21','2026-06-01'),
('ENTRADA','Massas',6,'2026-01-15 15:17:40','2027-01-01'),
('ENTRADA','Leite',50,'2026-01-15 15:04:06','2026-01-31'),
('ENTRADA','Feijão',1,'2026-01-22 08:57:05','2026-01-10'),
('ENTRADA','Sal',1,'2026-01-22 14:27:52','2028-08-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:09:11','2026-05-01'),
('ENTRADA','Sobremesa',2,'2026-01-22 15:22:23','2026-07-01'),
('ENTRADA','Maizena',23,'2026-01-16 13:49:07','2026-05-12'),
('ENTRADA','Sal',2,'2026-01-22 13:39:44','2026-12-01'),
('ENTRADA','Óleo',9,'2026-01-16 14:14:23','2026-04-01'),
('ENTRADA','Maizena',4,'2026-01-16 13:57:58','2026-09-05'),
('ENTRADA','Bebidas',1,'2026-01-26 14:11:01','2026-07-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:20:59','2026-05-04'),
('ENTRADA','Feijão',1,'2026-01-15 10:50:30','2026-02-11'),
('ENTRADA','Farinha',2,'2026-01-22 14:26:02','2026-04-30'),
('ENTRADA','Feijão',1,'2026-01-15 11:04:32','2026-04-01'),
('ENTRADA','Molho',9,'2026-01-22 10:30:46','2027-01-05'),
('ENTRADA','Feijão',2,'2026-01-26 14:36:45','2026-03-26'),
('ENTRADA','Massas',1,'2026-01-29 07:41:47','2026-10-31'),
('ENTRADA','Massas',1,'2026-01-29 07:43:55','2027-01-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:28:15','2026-04-01'),
('ENTRADA','Achocolatado',4,'2026-01-22 10:00:29','2026-05-13'),
('ENTRADA','Massas',3,'2026-01-15 11:46:29','2026-01-01'),
('ENTRADA','Óleo',18,'2026-01-16 14:12:53','2026-05-26'),
('ENTRADA','Molho',136,'2026-01-22 10:05:20','2027-01-05'),
('ENTRADA','Achocolatado',1,'2026-01-22 10:10:24','2026-08-19'),
('ENTRADA','Farinha',3,'2026-01-22 14:56:13','2026-10-12'),
('ENTRADA','Feijão',3,'2026-01-15 10:57:14','2026-04-01')
;
INSERT INTO tmp_pantry_movements (movement_type, item_name, quantity, movement_at, expiry_date) VALUES
('ENTRADA','Molho',1,'2026-01-22 10:41:56','2026-07-01'),
('ENTRADA','Pipoca',2,'2026-01-22 11:18:20','2026-07-01'),
('ENTRADA','Leite',71,'2026-01-15 15:38:07','2026-01-21'),
('ENTRADA','Massas',4,'2026-01-15 14:59:55','2026-03-04'),
('ENTRADA','Sal',4,'2026-01-22 13:40:39','2027-04-01'),
('ENTRADA','Molho',35,'2026-01-22 10:19:09','2026-12-01'),
('ENTRADA','Feijão',9,'2026-01-15 10:32:25','2026-01-15'),
('ENTRADA','Pipoca',1,'2026-01-22 11:19:30','2026-08-05'),
('ENTRADA','Chá',38,'2026-01-22 09:36:28','2027-11-01'),
('ENTRADA','Feijão',1,'2026-01-15 11:10:55','2026-05-25'),
('ENTRADA','Feijão',1,'2026-01-15 11:03:38','2026-04-27'),
('ENTRADA','Leite',23,'2026-01-22 11:38:04','2026-02-12'),
('ENTRADA','Cesta Básica',70,'2026-01-22 14:16:15','2026-06-01'),
('ENTRADA','Açúcar',1,'2026-01-22 15:14:51','2027-07-25'),
('ENTRADA','Massas',20,'2026-01-15 11:11:00','2026-08-01'),
('ENTRADA','Café',20,'2026-01-26 14:01:50','2026-12-08'),
('ENTRADA','Molho',2,'2026-01-26 14:22:06','2027-03-01'),
('ENTRADA','Sal',8,'2026-01-22 13:25:26','2027-03-01'),
('ENTRADA','Farinha',10,'2026-01-22 14:27:03','2026-02-12'),
('ENTRADA','Feijão',3,'2026-01-15 10:53:28','2026-04-01'),
('ENTRADA','Arroz',1,'2026-01-15 10:16:07','2026-10-01'),
('ENTRADA','Óleo',3,'2026-01-22 14:40:20','2027-07-07'),
('ENTRADA','Molho',71,'2026-01-22 10:57:46','2027-06-04'),
('ENTRADA','Feijão',1,'2026-01-15 10:50:02','2026-02-04'),
('ENTRADA','Massas',14,'2026-01-15 14:49:39','2027-01-01'),
('ENTRADA','Farinha',1,'2026-01-26 14:31:21','2026-02-24'),
('ENTRADA','Sal',1,'2026-01-22 14:12:43','2027-08-01'),
('ENTRADA','Arroz',6,'2026-01-15 09:49:01','2026-01-15'),
('ENTRADA','Achocolatado',5,'2026-01-22 09:34:38','2026-07-11'),
('ENTRADA','Farinha',1,'2026-01-22 15:24:16','2026-09-09'),
('ENTRADA','Biscoito | Bolacha',58,'2026-01-16 13:29:41','2026-06-29'),
('ENTRADA','Frutas',1,'2026-01-22 11:13:22','2026-12-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:33:17','2026-03-01'),
('ENTRADA','Leite',12,'2026-01-22 11:37:31','2026-02-09'),
('ENTRADA','Sobremesa',1,'2026-01-22 14:04:35','2026-02-06'),
('ENTRADA','Arroz',6,'2026-01-15 09:42:20','2026-09-08'),
('ENTRADA','Achocolatado',9,'2026-01-22 09:28:44','2026-04-11'),
('ENTRADA','Arroz',1,'2026-01-22 15:15:11','2026-07-01'),
('ENTRADA','Leite',2,'2026-01-26 14:16:16','2026-09-25'),
('ENTRADA','Tempero',2,'2026-01-26 14:19:13','2027-11-07'),
('ENTRADA','Feijão',1,'2026-01-29 07:23:49','2026-11-01'),
('ENTRADA','Acompanhamentos',5,'2026-01-26 13:45:02','2026-07-03'),
('ENTRADA','Arroz',107,'2026-01-15 09:14:50','2026-04-04'),
('ENTRADA','Leite',121,'2026-01-22 11:44:00','2026-02-12'),
('ENTRADA','Feijão',1,'2026-01-29 07:17:14','2026-04-01'),
('ENTRADA','Leite',18,'2026-01-22 13:31:39','2026-04-02'),
('ENTRADA','Farinha',1,'2026-01-22 15:05:06','2026-04-03'),
('ENTRADA','Pipoca',1,'2026-01-22 11:21:06','2026-05-19'),
('ENTRADA','Feijão',1,'2026-01-15 11:04:52','2026-04-01'),
('ENTRADA','Massas',1,'2026-01-29 07:42:44','2026-09-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:10:11','2026-04-16'),
('ENTRADA','Massas',2,'2026-01-15 15:16:20','2027-01-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:05:52','2026-07-30'),
('ENTRADA','Arroz',3,'2026-01-15 10:17:53','2026-07-01'),
('ENTRADA','Biscoito | Bolacha',33,'2026-01-26 14:43:40','2026-06-28'),
('ENTRADA','Carne',31,'2026-01-26 14:14:56','2029-09-01'),
('ENTRADA','Sal',1,'2026-01-22 14:02:10','2027-03-01'),
('ENTRADA','Feijão',3,'2026-01-15 10:51:35','2026-03-01'),
('ENTRADA','Arroz',1,'2026-01-22 15:16:22','2026-07-01'),
('ENTRADA','Massas',27,'2026-01-15 14:35:10','2027-01-01'),
('ENTRADA','Tempero',7,'2026-01-26 13:54:37','2026-10-22'),
('ENTRADA','Achocolatado',3,'2026-01-22 09:35:11','2026-07-21'),
('ENTRADA','Massas',141,'2026-01-15 10:37:10','2027-01-01'),
('ENTRADA','Massas',11,'2026-01-15 15:05:03','2027-01-01'),
('ENTRADA','Óleo',2,'2026-01-22 14:44:54','2026-05-01'),
('ENTRADA','Sal',1,'2026-01-22 14:14:52','2027-04-01'),
('ENTRADA','Achocolatado',4,'2026-01-22 09:31:47','2027-01-16'),
('ENTRADA','Feijão',20,'2026-01-15 10:25:55','2026-01-15'),
('ENTRADA','Açúcar',1,'2026-01-22 15:19:28','2026-10-01'),
('ENTRADA','Açúcar',2,'2026-01-22 15:17:43','2026-07-26'),
('ENTRADA','Leite',10,'2026-01-22 13:36:12','2026-01-28'),
('ENTRADA','Feijão',1,'2026-01-29 07:16:12','2026-05-01'),
('ENTRADA','Molho',3,'2026-01-22 11:16:32','2026-06-18'),
('ENTRADA','Feijão',1,'2026-01-15 10:52:44','2026-03-15'),
('ENTRADA','Molho',3,'2026-01-22 09:45:15','2025-09-08'),
('ENTRADA','Molho',4,'2026-01-22 10:35:10','2026-07-01'),
('ENTRADA','Biscoito | Bolacha',24,'2026-01-16 13:38:44','2026-01-26'),
('ENTRADA','Feijão',1,'2026-01-15 11:09:46','2026-05-21'),
('ENTRADA','Feijão',1,'2026-01-15 11:04:11','2026-04-01'),
('ENTRADA','Açúcar',1,'2026-01-22 15:16:07','2026-09-17'),
('ENTRADA','Massas',9,'2026-01-15 14:57:08','2027-01-01'),
('ENTRADA','Feijão',1,'2026-01-29 07:30:46','2026-04-01'),
('ENTRADA','Molho',5,'2026-01-22 10:40:03','2026-10-01'),
('ENTRADA','Massas',9,'2026-01-15 14:41:17','2027-01-01'),
('ENTRADA','Leite',12,'2026-01-15 15:15:13','2026-01-23'),
('ENTRADA','Arroz',6,'2026-01-15 09:44:11','2026-11-01'),
('ENTRADA','Massas',1,'2026-01-15 15:20:37','2026-03-03'),
('ENTRADA','Sobremesa',49,'2026-01-22 11:06:36','2026-04-01'),
('ENTRADA','Molho',2,'2026-01-22 10:56:47','2027-02-01'),
('ENTRADA','Sobremesa',26,'2026-01-22 11:05:32','2026-11-01'),
('ENTRADA','Sal',1,'2026-01-22 14:21:52','2027-04-01'),
('ENTRADA','Feijão',19,'2026-01-15 10:37:13','2026-03-07'),
('ENTRADA','Leite',101,'2026-01-22 13:32:20','2026-03-01'),
('ENTRADA','Pipoca',1,'2026-01-22 15:13:24','2026-06-01'),
('ENTRADA','Sobremesa',16,'2026-01-22 11:03:55','2026-09-01'),
('ENTRADA','Feijão',3,'2026-01-29 07:11:49','2026-05-01'),
('ENTRADA','Molho',3,'2026-01-22 11:17:34','2026-06-17'),
('ENTRADA','Arroz',1,'2026-01-22 15:12:24','2026-09-01'),
('ENTRADA','Feijão',5,'2026-01-15 19:57:04','2026-01-20'),
('ENTRADA','Massas',4,'2026-01-15 15:24:04','2026-12-12')
;
INSERT INTO tmp_pantry_movements (movement_type, item_name, quantity, movement_at, expiry_date) VALUES
('ENTRADA','Tempero',2,'2026-01-22 15:27:02','2026-03-19'),
('ENTRADA','Leite',144,'2026-01-22 11:31:34','2026-02-04'),
('ENTRADA','Massas',3,'2026-01-15 15:33:28','2027-01-01'),
('ENTRADA','Óleo',1,'2026-01-22 14:53:28','2026-03-01'),
('ENTRADA','Massas',60,'2026-01-15 10:56:11','2026-07-01'),
('ENTRADA','Farinha',2,'2026-01-22 15:21:32','2026-08-03'),
('ENTRADA','Molho',1,'2026-01-22 11:02:17','2026-08-01'),
('ENTRADA','Farinha',1,'2026-01-26 14:38:09','2026-02-22'),
('ENTRADA','Molho',12,'2026-01-22 10:36:24','2026-07-14'),
('ENTRADA','Farinha',1,'2026-01-22 15:08:45','2026-09-17'),
('ENTRADA','Massas',1,'2026-01-15 15:22:02','2026-03-04'),
('ENTRADA','Feijão',1,'2026-01-29 07:29:54','2026-03-01'),
('ENTRADA','Farinha',1,'2026-01-22 15:03:14','2026-04-13'),
('ENTRADA','Feijão',2,'2026-01-15 10:50:57','2026-02-21'),
('ENTRADA','Feijão',1,'2026-01-29 07:26:07','2026-03-01'),
('ENTRADA','Biscoito | Bolacha',26,'2026-01-16 13:33:56','2026-07-26'),
('ENTRADA','Açúcar',1,'2026-01-22 15:16:57','2026-07-27'),
('ENTRADA','Massas',14,'2026-01-15 15:07:10','2027-01-01'),
('ENTRADA','Leite',59,'2026-01-22 11:58:24','2026-03-06'),
('ENTRADA','Farinha',1,'2026-01-22 15:07:31','2026-06-05'),
('ENTRADA','Biscoito | Bolacha',1,'2026-01-26 14:35:16','2026-08-29'),
('ENTRADA','Sal',1,'2026-01-22 14:26:17','2027-05-01'),
('ENTRADA','Leite',12,'2026-01-26 13:58:56','2026-05-05'),
('ENTRADA','Achocolatado',1,'2026-01-26 14:05:18','2026-11-19'),
('ENTRADA','Feijão',1,'2026-01-29 07:14:35','2026-03-01'),
('ENTRADA','Farinha',1,'2026-01-26 14:06:43','2026-06-20'),
('ENTRADA','Biscoito | Bolacha',1,'2026-01-26 14:51:23','2026-02-22'),
('ENTRADA','Sobremesa',1,'2026-01-22 15:24:46','2026-08-01'),
('ENTRADA','Tempero',1,'2026-02-12 09:30:42','2026-10-26'),
('ENTRADA','Óleo',3,'2026-01-22 14:46:53','2026-03-01'),
('ENTRADA','Açúcar',1,'2026-01-22 14:58:36','2027-09-01'),
('ENTRADA','Massas',2,'2026-01-15 15:21:01','2027-01-01'),
('ENTRADA','Massas',2,'2026-01-15 14:40:25','2027-01-01'),
('ENTRADA','Massas',2,'2026-01-15 15:04:35','2026-05-01'),
('ENTRADA','Feijão',10,'2026-01-15 10:30:17','2026-02-24'),
('ENTRADA','Farinha',2,'2026-01-22 14:59:26','2026-06-19'),
('ENTRADA','Massas',21,'2026-01-15 11:09:57','2026-06-01'),
('ENTRADA','Feijão',1,'2026-01-15 10:52:03','2026-03-07'),
('SAIDA','Molho',116,'2026-01-29 12:35:15','2026-02-07'),
('SAIDA','Molho',4,'2026-02-02 15:38:42','2026-02-07'),
('SAIDA','Molho',60,'2026-02-05 09:02:38','2026-02-07'),
('SAIDA','Leite',49,'2026-02-02 15:31:44','2026-02-07'),
('SAIDA','Feijão',8,'2026-02-23 08:56:56','2026-02-11'),
('SAIDA','Açúcar',1,'2026-02-12 09:27:52','2027-08-12'),
('SAIDA','Óleo',1,'2026-02-12 09:28:23','2026-06-09'),
('SAIDA','Óleo',2,'2026-02-02 15:38:18','2026-08-01'),
('SAIDA','Óleo',2,'2026-01-28 07:56:04','2026-08-01'),
('SAIDA','Molho',1,'2026-02-05 09:01:26','2026-02-01'),
('SAIDA','Massas',6,'2026-02-09 16:15:55','2027-01-01'),
('SAIDA','Sal',1,'2026-02-09 16:12:36','2027-07-01'),
('SAIDA','Farinha',5,'2026-01-28 08:34:04','2026-03-01'),
('SAIDA','Pão',18,'2026-02-06 16:04:29','2026-03-01'),
('SAIDA','Pão',9,'2026-01-26 08:58:06','2026-03-01'),
('SAIDA','Pão',18,'2026-02-02 15:39:08','2026-03-01'),
('SAIDA','Pão',18,'2026-02-09 16:30:01','2026-03-01'),
('SAIDA','Pão',18,'2026-02-06 15:45:29','2026-03-01'),
('SAIDA','Pão',15,'2026-02-23 08:58:07','2026-03-01'),
('SAIDA','Pão',58,'2026-01-29 12:41:42','2026-03-01'),
('SAIDA','Pão',1,'2026-01-23 07:40:53','2026-03-01'),
('SAIDA','Pão',18,'2026-02-05 07:45:00','2026-03-01'),
('SAIDA','Leite',31,'2026-02-23 09:01:20','2026-04-06'),
('SAIDA','Achocolatado',2,'2026-02-02 15:32:27','2026-08-01'),
('SAIDA','Açúcar',1,'2026-02-12 09:25:01','2028-01-26'),
('SAIDA','Açúcar',2,'2026-01-26 08:52:40','2028-01-26'),
('SAIDA','Açúcar',2,'2026-02-23 08:53:23','2028-01-26'),
('SAIDA','Açúcar',3,'2026-02-19 09:23:08','2028-01-26'),
('SAIDA','Massas',2,'2026-01-26 13:47:33','2027-11-07'),
('SAIDA','Açúcar',1,'2026-02-12 09:25:49','2027-10-01'),
('SAIDA','Leite',6,'2026-02-09 07:35:51','2026-02-10'),
('SAIDA','Leite',12,'2026-02-09 07:35:26','2026-02-18'),
('SAIDA','Leite',2,'2026-02-25 08:33:25','2026-10-13'),
('SAIDA','Leite',2,'2026-01-28 08:27:54','2026-02-07'),
('SAIDA','Arroz',2,'2026-01-26 08:44:18','2026-09-02'),
('SAIDA','Arroz',3,'2026-02-09 16:11:51','2026-09-02'),
('SAIDA','Arroz',1,'2026-01-22 08:54:03','2026-09-02'),
('SAIDA','Arroz',1,'2026-01-28 08:24:45','2026-09-02'),
('SAIDA','Massas',2,'2026-02-09 16:16:22','2026-09-01'),
('SAIDA','Massas',18,'2026-02-23 08:57:50','2026-06-01'),
('SAIDA','Leite',20,'2026-01-22 09:48:10','2026-01-31'),
('SAIDA','Leite',6,'2026-01-22 10:46:08','2026-01-31'),
('SAIDA','Leite',24,'2026-01-22 09:48:34','2026-01-31'),
('SAIDA','Feijão',1,'2026-01-22 08:56:01','2026-01-10'),
('SAIDA','Sal',1,'2026-02-09 16:12:07','2028-08-01'),
('SAIDA','Sobremesa',2,'2026-01-26 08:43:22','2026-07-01'),
('SAIDA','Óleo',1,'2026-01-22 09:05:06','2026-04-01'),
('SAIDA','Óleo',5,'2026-01-26 08:53:45','2026-04-01'),
('SAIDA','Feijão',1,'2026-01-26 08:51:06','2026-02-11'),
('SAIDA','Feijão',2,'2026-02-02 15:32:48','2026-03-26'),
('SAIDA','Achocolatado',2,'2026-02-12 09:26:33','2026-05-13'),
('SAIDA','Achocolatado',2,'2026-02-12 09:27:01','2026-05-13'),
('SAIDA','Óleo',3,'2026-02-19 07:26:10','2026-05-26'),
('SAIDA','Óleo',1,'2026-02-09 07:40:34','2026-05-26'),
('SAIDA','Óleo',8,'2026-02-09 16:17:49','2026-05-26'),
('SAIDA','Óleo',6,'2026-02-23 08:54:50','2026-05-26'),
('SAIDA','Molho',27,'2026-02-23 08:54:38','2027-01-05'),
('SAIDA','Molho',4,'2026-02-19 14:12:41','2027-01-05'),
('SAIDA','Molho',8,'2026-02-19 09:27:44','2027-01-05'),
('SAIDA','Molho',2,'2026-02-02 15:34:38','2027-01-05'),
('SAIDA','Molho',1,'2026-02-05 07:44:15','2027-01-05'),
('SAIDA','Molho',20,'2026-02-05 07:44:19','2027-01-05')
;
INSERT INTO tmp_pantry_movements (movement_type, item_name, quantity, movement_at, expiry_date) VALUES
('SAIDA','Molho',14,'2026-02-18 12:04:11','2027-01-05'),
('SAIDA','Molho',30,'2026-01-26 08:40:22','2027-01-05'),
('SAIDA','Feijão',2,'2026-01-26 08:48:44','2026-04-01'),
('SAIDA','Leite',71,'2026-01-22 09:46:32','2026-01-21'),
('SAIDA','Feijão',9,'2026-02-09 16:33:36','2026-01-15'),
('SAIDA','Pipoca',1,'2026-02-23 08:52:33','2026-08-05'),
('SAIDA','Chá',1,'2026-02-09 16:12:54','2027-11-01'),
('SAIDA','Feijão',1,'2026-01-26 08:48:00','2026-04-27'),
('SAIDA','Leite',19,'2026-02-05 16:16:14','2026-02-12'),
('SAIDA','Cesta Básica',50,'2026-02-24 11:05:37','2026-06-01'),
('SAIDA','Cesta Básica',1,'2026-02-24 11:01:46','2026-06-01'),
('SAIDA','Cesta Básica',3,'2026-02-24 13:45:44','2026-06-01'),
('SAIDA','Cesta Básica',7,'2026-02-10 13:42:45','2026-06-01'),
('SAIDA','Açúcar',1,'2026-02-12 09:28:09','2027-07-25'),
('SAIDA','Café',4,'2026-02-09 16:13:44','2026-12-08'),
('SAIDA','Café',5,'2026-02-23 08:51:08','2026-12-08'),
('SAIDA','Café',2,'2026-02-02 15:33:38','2026-12-08'),
('SAIDA','Café',2,'2026-01-26 14:02:23','2026-12-08'),
('SAIDA','Café',1,'2026-01-28 08:22:28','2026-12-08'),
('SAIDA','Café',1,'2026-02-05 07:43:48','2026-12-08'),
('SAIDA','Farinha',10,'2026-02-09 16:18:21','2026-02-12'),
('SAIDA','Arroz',1,'2026-02-02 15:37:25','2026-10-01'),
('SAIDA','Óleo',1,'2026-02-02 15:41:40','2027-07-07'),
('SAIDA','Óleo',1,'2026-02-09 16:29:18','2027-07-07'),
('SAIDA','Óleo',1,'2026-02-23 08:53:55','2027-07-07'),
('SAIDA','Massas',6,'2026-02-18 12:04:56','2027-01-01'),
('SAIDA','Farinha',1,'2026-02-09 16:18:39','2026-02-24'),
('SAIDA','Achocolatado',1,'2026-02-23 08:50:39','2026-07-11'),
('SAIDA','Achocolatado',3,'2026-02-19 07:25:52','2026-07-11'),
('SAIDA','Achocolatado',1,'2026-02-09 16:14:24','2026-07-11'),
('SAIDA','Frutas',1,'2026-01-28 08:26:23','2026-12-01'),
('SAIDA','Leite',12,'2026-02-05 16:00:37','2026-02-09'),
('SAIDA','Sobremesa',1,'2026-01-26 08:47:25','2026-02-06'),
('SAIDA','Achocolatado',1,'2026-02-09 16:14:09','2026-04-11'),
('SAIDA','Achocolatado',4,'2026-02-23 08:50:51','2026-04-11'),
('SAIDA','Leite',2,'2026-01-28 08:16:56','2026-09-25'),
('SAIDA','Tempero',1,'2026-01-28 08:26:04','2027-11-07'),
('SAIDA','Acompanhamentos',1,'2026-01-28 16:19:15','2026-07-03'),
('SAIDA','Arroz',4,'2026-02-23 08:53:43','2026-04-04'),
('SAIDA','Arroz',1,'2026-02-10 13:59:00','2026-04-04'),
('SAIDA','Leite',121,'2026-02-05 09:03:12','2026-02-12'),
('SAIDA','Pipoca',1,'2026-02-23 08:53:13','2026-05-19'),
('SAIDA','Feijão',1,'2026-01-26 08:49:01','2026-04-01'),
('SAIDA','Carne',6,'2026-02-06 10:29:08','2029-09-01'),
('SAIDA','Carne',2,'2026-02-06 10:30:30','2029-09-01'),
('SAIDA','Carne',1,'2026-01-28 08:17:16','2029-09-01'),
('SAIDA','Massas',1,'2026-02-09 16:16:09','2027-01-01'),
('SAIDA','Tempero',1,'2026-02-19 07:25:35','2026-10-22'),
('SAIDA','Tempero',1,'2026-02-05 07:44:44','2026-10-22'),
('SAIDA','Tempero',1,'2026-02-09 16:18:08','2026-10-22'),
('SAIDA','Tempero',1,'2026-02-23 08:56:09','2026-10-22'),
('SAIDA','Tempero',1,'2026-01-28 07:57:04','2026-10-22'),
('SAIDA','Achocolatado',3,'2026-02-09 16:14:52','2026-07-21'),
('SAIDA','Massas',40,'2026-02-06 15:46:33','2027-01-01'),
('SAIDA','Óleo',1,'2026-02-09 07:41:22','2026-05-01'),
('SAIDA','Óleo',1,'2026-02-12 09:26:07','2026-05-01'),
('SAIDA','Achocolatado',3,'2026-02-02 15:33:09','2027-01-16'),
('SAIDA','Achocolatado',1,'2026-01-28 08:23:07','2027-01-16'),
('SAIDA','Feijão',20,'2026-02-09 16:35:20','2026-01-15'),
('SAIDA','Açúcar',1,'2026-02-12 09:28:42','2026-10-01'),
('SAIDA','Açúcar',2,'2026-02-12 09:27:27','2026-07-26'),
('SAIDA','Leite',10,'2026-01-28 08:28:32','2026-01-28'),
('SAIDA','Biscoito | Bolacha',24,'2026-01-16 13:52:09','2026-01-26'),
('SAIDA','Feijão',1,'2026-01-26 08:52:24','2026-04-01'),
('SAIDA','Leite',12,'2026-01-22 09:47:31','2026-01-23'),
('SAIDA','Arroz',2,'2026-02-02 15:37:03','2026-11-01'),
('SAIDA','Sobremesa',2,'2026-01-28 08:27:06','2026-04-01'),
('SAIDA','Sobremesa',10,'2026-02-19 09:21:23','2026-04-01'),
('SAIDA','Sobremesa',6,'2026-02-23 08:54:04','2026-04-01'),
('SAIDA','Sobremesa',2,'2026-02-02 15:34:04','2026-04-01'),
('SAIDA','Sobremesa',2,'2026-02-09 16:13:09','2026-04-01'),
('SAIDA','Sobremesa',5,'2026-01-26 08:46:46','2026-04-01'),
('SAIDA','Sobremesa',8,'2026-02-09 16:13:21','2026-11-01'),
('SAIDA','Sobremesa',2,'2026-02-02 15:34:19','2026-11-01'),
('SAIDA','Sal',1,'2026-02-09 16:12:21','2027-04-01'),
('SAIDA','Leite',17,'2026-02-23 08:58:28','2026-03-01'),
('SAIDA','Pipoca',1,'2026-02-23 08:52:23','2026-06-01'),
('SAIDA','Sobremesa',8,'2026-02-23 08:51:26','2026-09-01'),
('SAIDA','Sobremesa',5,'2026-01-28 08:29:24','2026-09-01'),
('SAIDA','Feijão',5,'2026-02-09 16:34:08','2026-01-20'),
('SAIDA','Tempero',1,'2026-01-22 15:28:39','2026-03-19'),
('SAIDA','Tempero',1,'2026-02-06 10:28:13','2026-03-19'),
('SAIDA','Óleo',1,'2026-02-06 10:29:33','2026-03-01'),
('SAIDA','Farinha',1,'2026-02-23 08:56:28','2026-02-22'),
('SAIDA','Farinha',1,'2026-02-09 16:19:10','2026-09-17'),
('SAIDA','Leite',40,'2026-02-09 16:11:23','2026-03-06'),
('SAIDA','Achocolatado',1,'2026-01-28 08:25:34','2026-11-19'),
('SAIDA','Biscoito | Bolacha',1,'2026-02-25 08:21:04','2026-02-22'),
('SAIDA','Sobremesa',1,'2026-01-28 08:26:44','2026-08-01'),
('SAIDA','Tempero',1,'2026-02-12 09:31:24','2026-10-26'),
('SAIDA','Óleo',3,'2026-01-26 08:53:59','2026-03-01'),
('SAIDA','Açúcar',1,'2026-02-02 15:37:51','2027-09-01'),
('SAIDA','Farinha',1,'2026-02-09 16:18:50','2026-06-19')
;
-- CSV_DATA_END

-- 2) Garante setor padrão (UUID v4)
INSERT INTO PantrySector (id, tenantId, name, createdAt, updatedAt)
SELECT
  LOWER(CONCAT(
    SUBSTR(h, 1, 8), '-',
    SUBSTR(h, 9, 4), '-',
    '4', SUBSTR(h, 14, 3), '-',
    SUBSTR('89ab', (CONV(SUBSTR(h, 17, 1), 16, 10) & 3) + 1, 1), SUBSTR(h, 18, 3), '-',
    SUBSTR(h, 21, 12)
  )),
  @tenant_id,
  @default_sector,
  NOW(3),
  NOW(3)
FROM (SELECT HEX(RANDOM_BYTES(16)) AS h) s
WHERE NOT EXISTS (
  SELECT 1
  FROM PantrySector
  WHERE tenantId = @tenant_id
    AND name = (@default_sector COLLATE utf8mb4_unicode_ci)
);

-- 3) Cria itens ausentes (UUID v4)
INSERT INTO PantryItem (id, tenantId, name, `group`, defaultSector, unit, minStock, createdAt, updatedAt)
SELECT
  LOWER(CONCAT(
    SUBSTR(h, 1, 8), '-',
    SUBSTR(h, 9, 4), '-',
    '4', SUBSTR(h, 14, 3), '-',
    SUBSTR('89ab', (CONV(SUBSTR(h, 17, 1), 16, 10) & 3) + 1, 1), SUBSTR(h, 18, 3), '-',
    SUBSTR(h, 21, 12)
  )),
  @tenant_id,
  b.item_name,
  NULL,
  @default_sector,
  @default_unit,
  @min_stock,
  NOW(3),
  NOW(3)
FROM (
  SELECT item_name, HEX(RANDOM_BYTES(16)) AS h
  FROM (
    SELECT DISTINCT item_name
    FROM tmp_pantry_movements
    WHERE item_name IS NOT NULL AND item_name <> ''
  ) x
) b
WHERE NOT EXISTS (
  SELECT 1
  FROM PantryItem i
  WHERE i.tenantId = @tenant_id
    AND i.name = (b.item_name COLLATE utf8mb4_unicode_ci)
);

-- 4) Mapeia items por nome (se houver duplicados, usa o menor id)
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_item_map;
CREATE TEMPORARY TABLE tmp_pantry_item_map AS
SELECT name AS item_name, MIN(id) AS item_id, MIN(unit) AS unit
FROM PantryItem
WHERE tenantId = @tenant_id
GROUP BY name;

-- 5) Prepara importação (gera IDs v4 por linha)
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_entry_import;
CREATE TEMPORARY TABLE tmp_pantry_entry_import (
  row_id BIGINT UNSIGNED NOT NULL,
  entry_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(191) NOT NULL,
  sector VARCHAR(191) NOT NULL,
  entry_date DATETIME(3) NOT NULL,
  expiry_date DATE NULL,
  PRIMARY KEY (row_id),
  UNIQUE INDEX ux_entry_id (entry_id),
  INDEX idx_item_expiry (item_id, expiry_date)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

INSERT INTO tmp_pantry_entry_import (
  row_id, entry_id, item_id, quantity, unit, sector, entry_date, expiry_date
)
SELECT
  t.row_id,
  LOWER(CONCAT(
    SUBSTR(t.h, 1, 8), '-',
    SUBSTR(t.h, 9, 4), '-',
    '4', SUBSTR(t.h, 14, 3), '-',
    SUBSTR('89ab', (CONV(SUBSTR(t.h, 17, 1), 16, 10) & 3) + 1, 1), SUBSTR(t.h, 18, 3), '-',
    SUBSTR(t.h, 21, 12)
  )),
  m.item_id,
  t.quantity,
  m.unit,
  @default_sector,
  t.movement_at,
  t.expiry_date
FROM (
  SELECT row_id, item_name, quantity, movement_at, expiry_date, HEX(RANDOM_BYTES(16)) AS h
  FROM tmp_pantry_movements
  WHERE movement_type = 'ENTRADA'
) t
JOIN tmp_pantry_item_map m ON m.item_name = (t.item_name COLLATE utf8mb4_unicode_ci);

DROP TEMPORARY TABLE IF EXISTS tmp_pantry_exit_import;
CREATE TEMPORARY TABLE tmp_pantry_exit_import (
  row_id BIGINT UNSIGNED NOT NULL,
  exit_id CHAR(36) NOT NULL,
  item_id CHAR(36) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unit VARCHAR(191) NOT NULL,
  sector VARCHAR(191) NOT NULL,
  exit_date DATETIME(3) NOT NULL,
  expiry_date DATE NULL,
  PRIMARY KEY (row_id),
  UNIQUE INDEX ux_exit_id (exit_id),
  INDEX idx_item_expiry (item_id, expiry_date),
  INDEX idx_exit_date (exit_date)
) ENGINE=InnoDB
  DEFAULT CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

INSERT INTO tmp_pantry_exit_import (
  row_id, exit_id, item_id, quantity, unit, sector, exit_date, expiry_date
)
SELECT
  t.row_id,
  LOWER(CONCAT(
    SUBSTR(t.h, 1, 8), '-',
    SUBSTR(t.h, 9, 4), '-',
    '4', SUBSTR(t.h, 14, 3), '-',
    SUBSTR('89ab', (CONV(SUBSTR(t.h, 17, 1), 16, 10) & 3) + 1, 1), SUBSTR(t.h, 18, 3), '-',
    SUBSTR(t.h, 21, 12)
  )),
  m.item_id,
  t.quantity,
  m.unit,
  @default_sector,
  t.movement_at,
  t.expiry_date
FROM (
  SELECT row_id, item_name, quantity, movement_at, expiry_date, HEX(RANDOM_BYTES(16)) AS h
  FROM tmp_pantry_movements
  WHERE movement_type = 'SAIDA'
) t
JOIN tmp_pantry_item_map m ON m.item_name = (t.item_name COLLATE utf8mb4_unicode_ci);

-- 6) Insere entradas e saídas
INSERT INTO PantryEntry (
  id, tenantId, itemId, donorId, sector, quantity, unit, entryDate, expiryDate, notes, reversalOfExitId, createdAt, updatedAt
)
SELECT
  e.entry_id,
  @tenant_id,
  e.item_id,
  NULL,
  e.sector,
  e.quantity,
  e.unit,
  e.entry_date,
  e.expiry_date,
  @entry_note,
  NULL,
  e.entry_date,
  NOW(3)
FROM tmp_pantry_entry_import e;

INSERT INTO PantryExit (
  id, tenantId, itemId, sector, quantity, unit, exitDate, type, eventName, notes, reversalOfEntryId, createdAt, updatedAt
)
SELECT
  x.exit_id,
  @tenant_id,
  x.item_id,
  x.sector,
  x.quantity,
  x.unit,
  x.exit_date,
  @exit_type,
  NULL,
  @exit_note,
  NULL,
  x.exit_date,
  NOW(3)
FROM tmp_pantry_exit_import x;

-- 7) Aloca saídas em entradas (FIFO por entryDate) usando a validade do CSV
DROP PROCEDURE IF EXISTS sp_allocate_pantry_exits_import;
DELIMITER $$
CREATE PROCEDURE sp_allocate_pantry_exits_import()
BEGIN
  DECLARE done INT DEFAULT 0;

  DECLARE v_exit_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_item_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_sector VARCHAR(191) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_exit_date DATETIME(3);
  DECLARE v_expiry DATE;
  DECLARE v_qty DECIMAL(10,2);
  DECLARE v_remaining DECIMAL(10,2);

  DECLARE v_entry_id CHAR(36) CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
  DECLARE v_entry_remaining DECIMAL(10,2);
  DECLARE v_alloc_qty DECIMAL(10,2);

  DECLARE cur CURSOR FOR
    SELECT exit_id, item_id, sector, exit_date, expiry_date, quantity
    FROM tmp_pantry_exit_import
    ORDER BY exit_date ASC, row_id ASC;

  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = 1;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO v_exit_id, v_item_id, v_sector, v_exit_date, v_expiry, v_qty;
    IF done = 1 THEN
      LEAVE read_loop;
    END IF;

    SET v_remaining = v_qty;

    WHILE v_remaining > 0 DO
      BEGIN
        DECLARE no_entry INT DEFAULT 0;
        DECLARE CONTINUE HANDLER FOR NOT FOUND SET no_entry = 1;

        SET no_entry = 0;
        SET v_entry_id = NULL;
        SET v_entry_remaining = NULL;

        SELECT
          e.id AS entry_id,
          (e.quantity - IFNULL(SUM(a.quantity), 0)) AS remaining_qty
        INTO v_entry_id, v_entry_remaining
        FROM PantryEntry e
        LEFT JOIN PantryExitAllocation a
          ON a.tenantId = (@tenant_id COLLATE utf8mb4_unicode_ci) AND a.entryId = e.id
        WHERE e.tenantId = (@tenant_id COLLATE utf8mb4_unicode_ci)
          AND e.itemId = (v_item_id COLLATE utf8mb4_unicode_ci)
          AND e.sector = (v_sector COLLATE utf8mb4_unicode_ci)
          AND (
            (v_expiry IS NULL AND e.expiryDate IS NULL) OR
            (v_expiry IS NOT NULL AND DATE(e.expiryDate) = v_expiry)
          )
        GROUP BY e.id, e.quantity, e.entryDate
        HAVING (e.quantity - IFNULL(SUM(a.quantity), 0)) > 0
        ORDER BY e.entryDate ASC, e.id ASC
        LIMIT 1;

        IF no_entry = 1 OR v_entry_id IS NULL THEN
          SIGNAL SQLSTATE '45000'
            SET MESSAGE_TEXT = 'Saldo insuficiente para alocar saida (verifique entradas/validade no CSV).';
        END IF;
      END;

      SET v_alloc_qty = LEAST(v_remaining, v_entry_remaining);

      INSERT INTO PantryExitAllocation (id, tenantId, exitId, entryId, quantity, createdAt)
      SELECT
        LOWER(CONCAT(
          SUBSTR(h, 1, 8), '-',
          SUBSTR(h, 9, 4), '-',
          '4', SUBSTR(h, 14, 3), '-',
          SUBSTR('89ab', (CONV(SUBSTR(h, 17, 1), 16, 10) & 3) + 1, 1), SUBSTR(h, 18, 3), '-',
          SUBSTR(h, 21, 12)
        )),
        @tenant_id,
        v_exit_id,
        v_entry_id,
        v_alloc_qty,
        v_exit_date
      FROM (SELECT HEX(RANDOM_BYTES(16)) AS h) s;

      SET v_remaining = v_remaining - v_alloc_qty;
    END WHILE;
  END LOOP;

  CLOSE cur;
END$$
DELIMITER ;

CALL sp_allocate_pantry_exits_import();
DROP PROCEDURE sp_allocate_pantry_exits_import;

-- 8) Limpeza
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_exit_import;
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_entry_import;
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_item_map;
DROP TEMPORARY TABLE IF EXISTS tmp_pantry_movements;

COMMIT;

SET SQL_SAFE_UPDATES = COALESCE(@old_sql_safe_updates, @@SQL_SAFE_UPDATES);
