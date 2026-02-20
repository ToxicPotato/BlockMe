package com.blockme.api.version;

import java.util.List;
import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface McVersionRepository extends JpaRepository<McVersion, Long> {
    boolean existsByVersion(String version);

    Optional<McVersion> findByVersion(String version);

    List<McVersion> findBySnapshotFalseOrderByReleaseDateAsc();
}
