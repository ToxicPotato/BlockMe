package com.blockme.api.block;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "block")
@Data
public class Block {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @Column(name = "namespace_id", unique = true, nullable = false)
    private String namespaceId;

    @Column(name = "display_name", nullable = false)
    private String displayName;

    @ManyToOne
    @JoinColumn(name = "category_id")
    private BlockCategory category;

    @Column(name = "is_air", nullable = false)
    private boolean air = false;

    @Column(name = "is_fluid", nullable = false)
    private boolean fluid = false;

    @Column(name = "is_technical", nullable = false)
    private boolean technical = false;

    @Column(name = "is_renderable", nullable = false)
    private boolean renderable = true;

    @Column(name = "gravity_affected", nullable = false)
    private boolean gravityAffected = false;

    @Column(nullable = false)
    private short luminance = 0;

    @Column(name = "obtainable_survival", nullable = false)
    private boolean obtainableSurvival = true;

    @Column(name = "obtainable_creative", nullable = false)
    private boolean obtainableCreative = true;
}
