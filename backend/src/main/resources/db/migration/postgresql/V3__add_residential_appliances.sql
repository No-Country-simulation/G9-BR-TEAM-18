-- V3: Insere todos os equipamentos residenciais e adiciona CHECK constraints
-- (PostgreSQL não possui V2 com seed data, então inserimos todos os 12)

-- 1. Migrar dados existentes de property_type para o novo padrão
UPDATE tb_property SET property_type = 'RESIDENCIAL' WHERE property_type = 'Apartamento';
UPDATE tb_property SET property_type = 'RESIDENCIAL' WHERE property_type = 'Casa';

-- 2. Inserir todos os 12 equipamentos residenciais
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Lâmpada LED', 'Iluminação', 12.00, 6.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Geladeira', 'Refrigeração', 150.00, 24.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Ventilador', 'Climatização', 70.00, 8.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Ar-condicionado', 'Climatização', 1500.00, 8.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Micro-ondas', 'Eletrodomésticos', 1200.00, 0.33);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Air Fryer', 'Eletrodomésticos', 1500.00, 0.50);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Máquina de Lavar', 'Eletrodomésticos', 500.00, 1.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Secadora', 'Eletrodomésticos', 3000.00, 1.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Chuveiro Elétrico', 'Eletrodomésticos', 5500.00, 0.50);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Computador', 'Tecnologia', 300.00, 6.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Videogame', 'Tecnologia', 200.00, 3.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Televisão', 'Tecnologia', 150.00, 6.00);

-- 3. CHECK constraint para tipos de imóvel válidos
ALTER TABLE tb_property ADD CONSTRAINT chk_property_type
    CHECK (property_type IN ('RESIDENCIAL', 'COMERCIAL'));

-- 4. CHECK constraint para categorias de equipamento válidas
ALTER TABLE tb_appliance ADD CONSTRAINT chk_appliance_category
    CHECK (appliance_category IN (
        'Iluminação', 'Refrigeração', 'Climatização', 'Eletrodomésticos', 'Tecnologia'
    ));
