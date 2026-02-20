CREATE TABLE texture_pack (
    id          BIGSERIAL PRIMARY KEY,
    name        VARCHAR(100) NOT NULL,
    slug        VARCHAR(100) NOT NULL UNIQUE,
    is_default  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE block_texture (
    id              BIGSERIAL PRIMARY KEY,
    block_id        BIGINT  NOT NULL REFERENCES block(id),
    mc_version_id   BIGINT  NOT NULL REFERENCES mc_version(id),
    texture_pack_id BIGINT  NOT NULL REFERENCES texture_pack(id),
    face            VARCHAR(10) NOT NULL DEFAULT 'all',
    image_data      BYTEA,
    source_url      TEXT,
    avg_color_r     SMALLINT,
    avg_color_g     SMALLINT,
    avg_color_b     SMALLINT,
    fetched_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (block_id, mc_version_id, texture_pack_id, face)
);
