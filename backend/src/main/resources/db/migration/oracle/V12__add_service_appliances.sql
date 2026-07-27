-- V12: Adiciona aparelhos da categoria Serviços ao catálogo
-- O ML Service já foi treinado com a categoria "Servicos" (bomba d'água,
-- portão elétrico, motor de piscina), mas o catálogo do banco não
-- incluía nenhum aparelho dessa categoria, tornando o valor
-- "Servicos" nunca enviado na prática.

-- 1. Inserir aparelhos de Serviços
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Bomba d''Água', 'Serviços', 500.00, 6.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Portão Elétrico', 'Serviços', 300.00, 0.50);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Motor de Piscina', 'Serviços', 1500.00, 8.00);

-- 2. Atualizar CHECK constraint para incluir 'Serviços'
ALTER TABLE tb_appliance DROP CONSTRAINT chk_appliance_category;
ALTER TABLE tb_appliance ADD CONSTRAINT chk_appliance_category
    CHECK (appliance_category IN (
        'Iluminação', 'Refrigeração', 'Climatização',
        'Eletrodomésticos', 'Tecnologia', 'Serviços'
    ));
