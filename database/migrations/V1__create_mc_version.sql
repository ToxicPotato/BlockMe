CREATE TABLE mc_version (
    id           BIGSERIAL PRIMARY KEY,
    version      VARCHAR(20)  NOT NULL UNIQUE,
    release_date DATE,
    is_snapshot  BOOLEAN      NOT NULL DEFAULT FALSE
);
