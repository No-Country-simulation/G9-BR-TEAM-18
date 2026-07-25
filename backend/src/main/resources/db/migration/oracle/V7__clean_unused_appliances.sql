-- V7: Remove appliances that are no longer covered by the ML Service
-- The ML model was trained with PPH 2019 survey data covering only 11 appliance types.
-- Appliances outside that scope were removed from the frontend and should be
-- removed from the database catalog to prevent inconsistency.

-- 1. Remove 'Secadora' (Dryer) -- not present in PPH training data
-- Delete from property_appliance first to avoid FK violation
DELETE FROM tb_property_appliance
WHERE appliance_id IN (SELECT id FROM tb_appliance WHERE name = 'Secadora');
DELETE FROM tb_appliance WHERE name = 'Secadora';

-- 2. Rename 'Lâmpada LED' to 'Lâmpada' — frontend consolidated all bulb types
-- into a single generic 'Lâmpada' entry matching PPH's qtd_lampadas
UPDATE tb_appliance
SET name = 'Lâmpada'
WHERE name = 'Lâmpada LED';
