CREATE TABLE block_category (
    id   BIGSERIAL PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
);

CREATE TABLE block (
    id                   BIGSERIAL PRIMARY KEY,
    namespace_id         VARCHAR(100) NOT NULL UNIQUE,
    display_name         VARCHAR(100) NOT NULL,
    category_id          BIGINT REFERENCES block_category(id),
    is_air               BOOLEAN NOT NULL DEFAULT FALSE,
    is_fluid             BOOLEAN NOT NULL DEFAULT FALSE,
    is_technical         BOOLEAN NOT NULL DEFAULT FALSE,
    is_renderable        BOOLEAN NOT NULL DEFAULT TRUE,
    gravity_affected     BOOLEAN NOT NULL DEFAULT FALSE,
    luminance            SMALLINT NOT NULL DEFAULT 0,
    obtainable_survival  BOOLEAN NOT NULL DEFAULT TRUE,
    obtainable_creative  BOOLEAN NOT NULL DEFAULT TRUE
);
