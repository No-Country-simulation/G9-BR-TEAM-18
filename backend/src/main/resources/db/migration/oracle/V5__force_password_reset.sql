ALTER TABLE tb_user ADD password_reset_required NUMBER(1) DEFAULT 0;

UPDATE tb_user SET password_reset_required = 1;
