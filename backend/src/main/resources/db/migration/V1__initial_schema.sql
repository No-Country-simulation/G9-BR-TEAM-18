-- =============================================================================
-- EnergIAI — Migration V1: Initial schema
--
-- This is the base migration that creates the core tables for the application.
-- Both PostgreSQL (current) and Oracle (future) are supported via separate
-- migration directories.
-- =============================================================================

-- ---------------------------------------------------------------------------
-- Sequences for ID generation (compatible with @SequenceGenerator)
-- ---------------------------------------------------------------------------
CREATE SEQUENCE IF NOT EXISTS analysis_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

CREATE SEQUENCE IF NOT EXISTS user_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- ---------------------------------------------------------------------------
-- Table: app_user
-- Stores registered users with hashed passwords (SHA-256 + salt / BCrypt)
-- ---------------------------------------------------------------------------
CREATE TABLE app_user (
    id              BIGINT       NOT NULL DEFAULT nextval('user_seq'),
    name            VARCHAR(100) NOT NULL,
    email           VARCHAR(150) NOT NULL,
    password_hash   VARCHAR(255) NOT NULL,
    created_at      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_app_user PRIMARY KEY (id),
    CONSTRAINT uq_app_user_email UNIQUE (email)
);

-- ---------------------------------------------------------------------------
-- Table: energy_analysis
-- Stores each energy analysis result returned by the ML Service
-- ---------------------------------------------------------------------------
CREATE TABLE energy_analysis (
    id                              BIGINT       NOT NULL DEFAULT nextval('analysis_seq'),
    consumption_kwh                 DOUBLE PRECISION NOT NULL,
    peak_hour_usage                 BOOLEAN      NOT NULL,
    equipment_quantity              INTEGER      NOT NULL,
    property_type                   VARCHAR(50)  NOT NULL,
    high_consumption_hours          DOUBLE PRECISION NOT NULL,
    highest_consumption_category    VARCHAR(50),
    refrigeration_watts             DOUBLE PRECISION,
    heating_watts                   DOUBLE PRECISION,
    air_conditioning_watts          DOUBLE PRECISION,
    lighting_watts                  DOUBLE PRECISION,
    category                        VARCHAR(20)  NOT NULL,
    probability                     DOUBLE PRECISION NOT NULL,
    estimated_monthly_cost          DOUBLE PRECISION NOT NULL,
    recommendations                 TEXT,
    source                          VARCHAR(100),
    created_at                      TIMESTAMP    NOT NULL DEFAULT NOW(),
    CONSTRAINT pk_energy_analysis PRIMARY KEY (id)
);

-- ---------------------------------------------------------------------------
-- Index for faster lookups on the dashboard (order by created_at)
-- ---------------------------------------------------------------------------
CREATE INDEX idx_energy_analysis_created_at ON energy_analysis (created_at DESC);

-- ---------------------------------------------------------------------------
-- Comments for documentation purposes
-- ---------------------------------------------------------------------------
COMMENT ON TABLE app_user IS 'Usuários registrados do sistema EnergIAI';
COMMENT ON COLUMN app_user.password_hash IS 'Hash SHA-256 + salt (futuramente BCrypt) codificado em Base64';

COMMENT ON TABLE energy_analysis IS 'Análises energéticas realizadas';
COMMENT ON COLUMN energy_analysis.category IS 'Categoria: EXCELENTE, BOM, MEDIANO, RUIM, CRITICO';
COMMENT ON COLUMN energy_analysis.probability IS 'Confiança da predição (0.0 a 1.0)';
COMMENT ON COLUMN energy_analysis.source IS 'Origem: model, model+groq, rule-based';
COMMENT ON COLUMN energy_analysis.estimated_monthly_cost IS 'Custo estimado em R$ (consumo × tarifa 0.75)';
