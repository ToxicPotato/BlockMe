CREATE TABLE block_version (
    id             BIGSERIAL PRIMARY KEY,
    block_id       BIGINT  NOT NULL REFERENCES block(id),
    mc_version_id  BIGINT  NOT NULL REFERENCES mc_version(id),
    added_in       BOOLEAN NOT NULL DEFAULT FALSE,
    removed_in     BOOLEAN NOT NULL DEFAULT FALSE,
    UNIQUE (block_id, mc_version_id)
);
