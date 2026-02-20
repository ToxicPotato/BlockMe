package com.blockme.api.block;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.blockme.api.version.McVersion;

public interface BlockVersionRepository extends JpaRepository<BlockVersion, Long> {
    boolean existsByBlockAndMcVersion(Block block, McVersion mcVersion);
    Optional<BlockVersion> findByBlockAndMcVersion(Block block, McVersion mcVersion);
}
