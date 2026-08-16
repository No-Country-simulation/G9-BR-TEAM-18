ALTER TABLE tb_energy_analysis ADD property_type VARCHAR2(50);

CREATE TABLE tb_analysis_appliance_snapshot (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    analysis_id NUMBER NOT NULL,
    appliance_name VARCHAR2(100) NOT NULL,
    appliance_category VARCHAR2(100),
    quantity NUMBER NOT NULL CHECK (quantity > 0),
    average_power_watts NUMBER(10, 2) NOT NULL,
    average_daily_use_hours NUMBER(4, 2),
    monthly_consumption_kwh NUMBER(10, 2),
    CONSTRAINT fk_snapshot_analysis
        FOREIGN KEY (analysis_id)
        REFERENCES tb_energy_analysis(id)
        ON DELETE CASCADE
);

CREATE INDEX idx_snapshot_analysis ON tb_analysis_appliance_snapshot(analysis_id);