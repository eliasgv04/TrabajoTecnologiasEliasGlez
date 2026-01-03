-- Reset Gramola database: drop all tables in schema `gramola`
-- Use with MySQL 5.7+/8.0: this script builds and executes a DROP TABLE statement

-- Ensure we are operating on the correct database
USE gramola;

-- Disable FK checks to allow dropping in any order
SET FOREIGN_KEY_CHECKS = 0;

-- Build a comma-separated list of all tables in the current schema
SET @tables = NULL;
SELECT GROUP_CONCAT(CONCAT('`', table_name, '`') SEPARATOR ',') INTO @tables
FROM information_schema.tables
WHERE table_schema = DATABASE();

-- If there are tables, drop them
SET @sql = IFNULL(CONCAT('DROP TABLE IF EXISTS ', @tables), NULL);
PREPARE stmt FROM @sql;
EXECUTE stmt;
DEALLOCATE PREPARE stmt;

-- Re-enable FK checks
SET FOREIGN_KEY_CHECKS = 1;

-- Optional: you can also truncate specific tables or seed defaults here.
