CREATE TABLE tb_user (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    email VARCHAR2(255) UNIQUE NOT NULL,
    password VARCHAR2(255) NOT NULL
);

CREATE TABLE tb_property (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    user_id NUMBER NOT NULL,
    alias VARCHAR2(100) NOT NULL,
    property_type VARCHAR2(50) NOT NULL,
    active NUMBER(1) DEFAULT 1 CHECK (active IN (0, 1)),
    CONSTRAINT fk_property_user
        FOREIGN KEY (user_id)
        REFERENCES tb_user(id)
        ON DELETE CASCADE
);

CREATE TABLE tb_appliance (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name VARCHAR2(100) NOT NULL,
    appliance_category VARCHAR2(100),
    average_power_watts NUMBER(10, 2) NOT NULL,
    average_daily_use_hours NUMBER(4, 2)
);

CREATE TABLE tb_property_appliance (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id NUMBER NOT NULL,
    appliance_id NUMBER NOT NULL,
    quantity NUMBER DEFAULT 1 CHECK (quantity > 0),
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
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    property_id NUMBER NOT NULL,
    consumption_kwh NUMBER(10, 2) NOT NULL,
    peak_hour_usage NUMBER(1) NOT NULL CHECK (peak_hour_usage IN (0, 1)),
    high_consumption_hours NUMBER(4, 2) NOT NULL,
    estimated_monthly_cost NUMBER(10, 2),
    category VARCHAR2(50)
        CHECK (category IN ('EXCELENTE', 'BOM', 'MEDIANO', 'RUIM', 'CRITICO')),
    probability NUMBER(5, 2),
    status VARCHAR2(20) NOT NULL
        CHECK (status IN ('PENDENTE', 'PROCESSADO', 'FALHA', 'FINALIZADO')),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_analysis_property
        FOREIGN KEY (property_id)
        REFERENCES tb_property(id)
        ON DELETE CASCADE
);

CREATE TABLE tb_analysis_recommendation (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    analysis_id NUMBER NOT NULL,
    descricao VARCHAR2(1000) NOT NULL,
    CONSTRAINT fk_recomendacao_analise
        FOREIGN KEY (analysis_id)
        REFERENCES tb_energy_analysis(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_property_user
    ON tb_property(user_id);

CREATE INDEX idx_pa_property
    ON tb_property_appliance(property_id);

CREATE INDEX idx_pa_appliance
    ON tb_property_appliance(appliance_id);

CREATE INDEX idx_analysis_property
    ON tb_energy_analysis(property_id);

CREATE INDEX idx_rec_analysis
    ON tb_analysis_recommendation(analysis_id);