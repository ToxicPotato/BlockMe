package com.blockme.api.texture;

import org.springframework.stereotype.Service;
import java.util.List;

@Service
public class TextureService {
    private final TextureRepository repository;

    public TextureService(TextureRepository repository) {
        this.repository = repository;
    }

    public List<BlockTexture> getAll() {
        return repository.findAll();
    }
}
