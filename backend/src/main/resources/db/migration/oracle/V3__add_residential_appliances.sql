-- V3: Insere equipamentos residenciais faltantes e adiciona CHECK constraints

-- 1. Migrar dados existentes de property_type para o novo padrão
UPDATE tb_property SET property_type = 'RESIDENCIAL' WHERE property_type = 'Apartamento';
UPDATE tb_property SET property_type = 'RESIDENCIAL' WHERE property_type = 'Casa';

-- 2. Equipamentos novos (7 de 12; os outros 5 já existem em V2)
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Ventilador', 'Climatização', 70.00, 8.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Micro-ondas', 'Eletrodomésticos', 1200.00, 0.33);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Air Fryer', 'Eletrodomésticos', 1500.00, 0.50);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Máquina de Lavar', 'Eletrodomésticos', 500.00, 1.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Secadora', 'Eletrodomésticos', 3000.00, 1.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Computador', 'Tecnologia', 300.00, 6.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Videogame', 'Tecnologia', 200.00, 3.00);

-- 3. CHECK constraint para tipos de imóvel válidos
ALTER TABLE tb_property ADD CONSTRAINT chk_property_type
    CHECK (property_type IN ('RESIDENCIAL', 'COMERCIAL'));

-- 4. CHECK constraint para categorias de equipamento válidas
ALTER TABLE tb_appliance ADD CONSTRAINT chk_appliance_category
    CHECK (appliance_category IN (
        'Iluminação', 'Refrigeração', 'Climatização', 'Eletrodomésticos', 'Tecnologia'
    ));
