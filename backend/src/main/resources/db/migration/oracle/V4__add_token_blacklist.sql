CREATE TABLE tb_token_blacklist (
    id NUMBER GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    token_hash VARCHAR2(64) NOT NULL,
    expires_at TIMESTAMP NOT NULL
);

CREATE INDEX idx_tbl_expires_at ON tb_token_blacklist(expires_at);
