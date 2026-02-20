package com.blockme.api.skin;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class PlayerSkinService {
    private final PlayerSkinRepository repository;

    public PlayerSkinService(PlayerSkinRepository repository) {
        this.repository = repository;
    }

    public List<PlayerSkinCache> getAll() {
        return repository.findAll();
    }
}
