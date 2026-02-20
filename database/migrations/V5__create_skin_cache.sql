CREATE TABLE player_skin_cache (
    id           BIGSERIAL PRIMARY KEY,
    username     VARCHAR(16)  NOT NULL,
    uuid         UUID,
    skin_url     TEXT,
    skin_data    BYTEA,
    fetched_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW(),
    expires_at   TIMESTAMPTZ  NOT NULL DEFAULT NOW() + INTERVAL '1 hour',
    UNIQUE (username)
);

CREATE INDEX idx_skin_cache_username ON player_skin_cache(username);
CREATE INDEX idx_skin_cache_expires  ON player_skin_cache(expires_at);
