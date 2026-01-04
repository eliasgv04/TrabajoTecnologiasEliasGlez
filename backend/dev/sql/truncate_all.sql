-- Vacía (TRUNCATE) todas las tablas del esquema actual, manteniendo la estructura y reiniciando AUTO_INCREMENT
-- Úsalo en MySQL Workbench contra la base de datos `gramola`

USE gramola;

DELIMITER $$

CREATE PROCEDURE truncate_all_tables()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE t VARCHAR(128);
  DECLARE cur CURSOR FOR
    SELECT table_name
    FROM information_schema.tables
    WHERE table_schema = DATABASE() AND table_type = 'BASE TABLE';
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  SET FOREIGN_KEY_CHECKS = 0;

  OPEN cur;
  read_loop: LOOP
    FETCH cur INTO t;
    IF done THEN
      LEAVE read_loop;
    END IF;
    SET @s = CONCAT('TRUNCATE TABLE `', t, '`');
    PREPARE stmt FROM @s;
    EXECUTE stmt;
    DEALLOCATE PREPARE stmt;
  END LOOP;
  CLOSE cur;

  SET FOREIGN_KEY_CHECKS = 1;
END$$

DELIMITER ;

CALL truncate_all_tables();
DROP PROCEDURE truncate_all_tables;
