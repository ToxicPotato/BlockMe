package com.blockme.api.texture;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/textures")
public class TextureController {
    private final TextureService service;

    public TextureController(TextureService service) {
        this.service = service;
    }

    @GetMapping
    public List<BlockTexture> getAll() {
        return service.getAll();
    }
}
