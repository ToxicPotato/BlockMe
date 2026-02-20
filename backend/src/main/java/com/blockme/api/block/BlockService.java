package com.blockme.api.block;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class BlockService {
    private final BlockRepository repository;

    public BlockService(BlockRepository repository) {
        this.repository = repository;
    }

    public List<Block> getAll() {
        return repository.findAll();
    }
}
