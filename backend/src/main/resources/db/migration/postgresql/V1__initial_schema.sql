CREATE TABLE tb_user (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL
);

CREATE TABLE tb_property (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id BIGINT NOT NULL,
    alias VARCHAR(100) NOT NULL,
    property_type VARCHAR(50) NOT NULL,
    active SMALLINT DEFAULT 1 CHECK (active IN (0, 1)),
    CONSTRAINT fk_property_user
        FOREIGN KEY (user_id)
        REFERENCES tb_user(id)
        ON DELETE CASCADE
);

CREATE TABLE tb_appliance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    appliance_category VARCHAR(100),
    average_power_watts NUMERIC(10, 2) NOT NULL,
    average_daily_use_hours NUMERIC(4, 2)
);

CREATE TABLE tb_property_appliance (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id BIGINT NOT NULL,
    appliance_id BIGINT NOT NULL,
    quantity INTEGER DEFAULT 1 CHECK (quantity > 0),
    CONSTRAINT uk_property_appliance UNIQUE (property_id, appliance_id),
    CONSTRAINT fk_pa_property
        FOREIGN KEY (property_id)
        REFERENCES tb_property(id)
        ON DELETE CASCADE,
    CONSTRAINT fk_pa_appliance
        FOREIGN KEY (appliance_id)
        REFERENCES tb_appliance(id)
        ON DELETE CASCADE
);

CREATE TABLE tb_energy_analysis (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id BIGINT NOT NULL,
    consumption_kwh NUMERIC(10, 2) NOT NULL,
    peak_hour_usage SMALLINT NOT NULL CHECK (peak_hour_usage IN (0, 1)),
    high_consumption_hours NUMERIC(4, 2) NOT NULL,
    estimated_monthly_cost NUMERIC(10, 2),
    category VARCHAR(50)
        CHECK (category IN ('EFICIENTE', 'MODERADO', 'INEFICIENTE')),
    probability NUMERIC(5, 2),
    status VARCHAR(20) NOT NULL
        CHECK (status IN ('PENDENTE', 'PROCESSADO', 'FALHA', 'FINALIZADO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_property
        FOREIGN KEY (property_id)
        REFERENCES tb_property(id)
        ON DELETE CASCADE
);

CREATE TABLE tb_analysis_recommendation (
    id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    analysis_id BIGINT NOT NULL,
    descricao VARCHAR(1000) NOT NULL,
    CONSTRAINT fk_recomendacao_analise
        FOREIGN KEY (analysis_id)
        REFERENCES tb_energy_analysis(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_property_user ON tb_property(user_id);
CREATE INDEX idx_pa_property ON tb_property_appliance(property_id);
CREATE INDEX idx_pa_appliance ON tb_property_appliance(appliance_id);
CREATE INDEX idx_analysis_property ON tb_energy_analysis(property_id);
CREATE INDEX idx_rec_analysis ON tb_analysis_recommendation(analysis_id);
