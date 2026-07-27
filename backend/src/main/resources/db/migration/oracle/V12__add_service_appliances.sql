-- V12: Adiciona aparelhos da categoria Serviços ao catálogo
-- O ML Service já foi treinado com a categoria "Servicos" (bomba d'água,
-- portão elétrico, motor de piscina), mas o catálogo do banco não
-- incluía nenhum aparelho dessa categoria, tornando o valor
-- "Servicos" nunca enviado na prática.
--
-- ATENÇÃO: A ordem é importante — primeiro dropar a CHECK constraint
-- que impedia a inserção de 'Serviços', depois inserir os registros,
-- e por fim recriar a constraint com o novo valor.

-- 1. Remover CHECK constraint antiga ('Serviços' não era permitido)
ALTER TABLE tb_appliance DROP CONSTRAINT chk_appliance_category;

-- 2. Inserir aparelhos de Serviços (agora sem constraint bloqueando)
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Bomba d''Água', 'Serviços', 500.00, 6.00);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Portão Elétrico', 'Serviços', 300.00, 0.50);
INSERT INTO tb_appliance (name, appliance_category, average_power_watts, average_daily_use_hours)
    VALUES ('Motor de Piscina', 'Serviços', 1500.00, 8.00);

-- 3. Recriar CHECK constraint incluindo 'Serviços'
ALTER TABLE tb_appliance ADD CONSTRAINT chk_appliance_category
    CHECK (appliance_category IN (
        'Iluminação', 'Refrigeração', 'Climatização',
        'Eletrodomésticos', 'Tecnologia', 'Serviços'
    ));
