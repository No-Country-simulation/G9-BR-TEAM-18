-- V6: Normaliza property_type para consistência com frontend
-- Garante que dados existentes estejam em conformidade com os CHECK constraints

-- 1. Normalizar property_type para uppercase
UPDATE tb_property SET property_type = 'RESIDENCIAL' WHERE UPPER(property_type) = 'RESIDENCIAL' AND property_type != 'RESIDENCIAL';
UPDATE tb_property SET property_type = 'COMERCIAL' WHERE UPPER(property_type) = 'COMERCIAL' AND property_type != 'COMERCIAL';