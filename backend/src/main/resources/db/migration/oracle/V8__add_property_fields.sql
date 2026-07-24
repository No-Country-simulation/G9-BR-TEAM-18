-- V8: Adiciona campos address, resident_count, area_sqm à tb_property
ALTER TABLE tb_property ADD address VARCHAR2(255);
ALTER TABLE tb_property ADD resident_count NUMBER;
ALTER TABLE tb_property ADD area_sqm NUMBER;
