-- V14: Alinha a CHECK constraint de status da análise com o frontend
-- Antes: PENDENTE, PROCESSADO, FALHA, FINALIZADO
-- Depois: PENDENTE, CONCLUIDA, FALHA
--
-- O frontend já esperava CONCLUIDA, mas o backend salvava como
-- FINALIZADO. Agora ambas as camadas usam CONCLUIDA.

ALTER TABLE tb_energy_analysis DROP CONSTRAINT chk_analysis_status;

ALTER TABLE tb_energy_analysis ADD CONSTRAINT chk_analysis_status
    CHECK (status IN ('PENDENTE', 'CONCLUIDA', 'FALHA'));
