package com.blockme.api.version;

import jakarta.persistence.*;
import lombok.Data;
import java.time.LocalDate;

@Entity
@Table(name = "mc_version")
@Data
public class McVersion {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String version;

    @Column(name = "release_date")
    private LocalDate releaseDate;

    @Column(name = "is_snapshot", nullable = false)
    private boolean snapshot;
}
