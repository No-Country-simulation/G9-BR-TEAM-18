-- =============================================================================
-- EnergIAI — Migration V2: Add user_id to energy_analysis
--
-- Associates each energy analysis with the authenticated user who created it.
-- This enables per-user filtering on /analyses and /dashboard endpoints.
-- =============================================================================

ALTER TABLE energy_analysis
    ADD COLUMN user_id BIGINT NOT NULL DEFAULT 0;

ALTER TABLE energy_analysis
    ADD CONSTRAINT fk_energy_analysis_user
        FOREIGN KEY (user_id) REFERENCES app_user(id);

CREATE INDEX idx_energy_analysis_user_id ON energy_analysis (user_id DESC);

COMMENT ON COLUMN energy_analysis.user_id IS 'ID do usuário que realizou a análise';
