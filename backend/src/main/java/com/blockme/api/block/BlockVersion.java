package com.blockme.api.block;

import com.blockme.api.version.McVersion;

import jakarta.persistence.*;
import lombok.Data;

@Entity
@Table(name = "block_version")
@Data
public class BlockVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private long id;

    @ManyToOne
    @JoinColumn(name = "block_id", nullable = false)
    private Block block;

    @ManyToOne
    @JoinColumn(name = "mc_version_id", nullable = false)
    private McVersion mcVersion;

    @Column(name = "added_in", nullable = false)
    private boolean addedIn = false;

    @Column(name = "removed_in", nullable = false)
    private boolean removedIn = false;

}
