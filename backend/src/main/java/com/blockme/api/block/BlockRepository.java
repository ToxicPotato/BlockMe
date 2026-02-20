package com.blockme.api.block;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface BlockRepository extends JpaRepository<Block, Long> {
    Optional<Block> findByNamespaceId(String namespaceId);
}
