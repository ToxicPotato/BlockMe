package com.blockme.api.texture;

import com.blockme.api.block.Block;
import com.blockme.api.version.McVersion;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDateTime;

@Entity
@Table(name = "block_texture")
@Data
public class BlockTexture {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "block_id", nullable = false)
    private Block block;

    @ManyToOne
    @JoinColumn(name = "mc_version_id", nullable = false)
    private McVersion mcVersion;

    @ManyToOne
    @JoinColumn(name = "texture_pack_id", nullable = false)
    private TexturePack texturePack;

    @Column(nullable = false)
    private String face = "all";

    @Column(name = "image_data", columnDefinition = "bytea")
    private byte[] imageData;

    @Column(name = "source_url")
    private String sourceUrl;

    @Column(name = "avg_color_r")
    private Short avgColorR;

    @Column(name = "avg_color_g")
    private Short avgColorG;

    @Column(name = "avg_color_b")
    private Short avgColorB;

    @Column(name = "fetched_at", nullable = false)
    private LocalDateTime fetchedAt = LocalDateTime.now();
}
