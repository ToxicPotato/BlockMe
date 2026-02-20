package com.blockme.api.version;

import java.util.List;

import org.springframework.stereotype.Service;

@Service
public class McVersionService {
    private final McVersionRepository repository;

    public McVersionService(McVersionRepository repository) {
        this.repository = repository;
    }

    public List<McVersion> getAll() {
        return repository.findAll();
    }

}
