package com.blockme.api.skin;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "player_skin_cache")
@Data
public class PlayerSkinCache {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(nullable = false, unique = true)
    private String username;

    private UUID uuid;

    @Column(name = "skin_url")
    private String skinUrl;

    @Column(name = "skin_data", columnDefinition = "bytea")
    private byte[] skinData;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt = LocalDateTime.now();

    @Column(name = "expires_at", nullable = false)
    private LocalDateTime expiresAt = LocalDateTime.now().plusHours(1);
}
