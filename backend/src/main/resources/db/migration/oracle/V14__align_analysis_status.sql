-- V14: Alinha a CHECK constraint de status da análise com o frontend
--
-- A constraint original foi criada em V1 inline sem nome explícito:
--   status VARCHAR2(20) NOT NULL
--       CHECK (status IN ('PENDENTE', 'PROCESSADO', 'FALHA', 'FINALIZADO')),
--
-- Como o Oracle gera um nome automático (SYS_Cnnnnn) para constraints
-- inline sem nome, usamos PL/SQL para localizá-la dinamicamente
-- e removê-la antes de adicionar a nova constraint com nome explícito.
--
-- Antes: PENDENTE, PROCESSADO, FALHA, FINALIZADO
-- Depois: PENDENTE, CONCLUIDA, FALHA

DECLARE
    v_constraint_name VARCHAR2(30);
BEGIN
    -- Localiza a CHECK constraint da coluna status usando o conteudo
    -- da condicao para distinguir do NOT NULL (tbem armazenado como CHECK).
    SELECT c.constraint_name INTO v_constraint_name
    FROM user_constraints c
    WHERE c.table_name = 'TB_ENERGY_ANALYSIS'
      AND c.constraint_type = 'C'
      AND c.search_condition_vc LIKE '%PENDENTE%PROCESSADO%FALHA%FINALIZADO%';

    EXECUTE IMMEDIATE 'ALTER TABLE tb_energy_analysis DROP CONSTRAINT '
        || v_constraint_name;
EXCEPTION
    WHEN NO_DATA_FOUND THEN
        -- Ja foi removida em execucao anterior, apenas segue
        NULL;
    WHEN TOO_MANY_ROWS THEN
        -- Seguranca: se houver mais de uma constraint, dropa todas
        FOR r IN (
            SELECT c.constraint_name
            FROM user_constraints c
            WHERE c.table_name = 'TB_ENERGY_ANALYSIS'
              AND c.constraint_type = 'C'
              AND c.search_condition_vc LIKE '%PENDENTE%PROCESSADO%FALHA%FINALIZADO%'
        ) LOOP
            EXECUTE IMMEDIATE 'ALTER TABLE tb_energy_analysis DROP CONSTRAINT '
                || r.constraint_name;
        END LOOP;
END;
/

ALTER TABLE tb_energy_analysis ADD CONSTRAINT chk_analysis_status
    CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'FALHA'));
