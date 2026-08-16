-- V13: Adiciona 'APARTAMENTO' como tipo de imóvel válido no CHECK constraint
--
-- O enum PropertyType.java e o frontend já suportam RESIDENCIAL, APARTAMENTO
-- e COMERCIAL, mas a CHECK constraint chk_property_type (criada em V3) só
-- permitia 'RESIDENCIAL' e 'COMERCIAL'. Qualquer tentativa de salvar uma
-- propriedade como 'APARTAMENTO' violava a constraint.

ALTER TABLE tb_property DROP CONSTRAINT chk_property_type;
ALTER TABLE tb_property ADD CONSTRAINT chk_property_type
    CHECK (property_type IN ('RESIDENCIAL', 'APARTAMENTO', 'COMERCIAL'));
