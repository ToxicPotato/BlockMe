package com.blockme.api.skin;

import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/skins")
public class PlayerSkinController {
    private final PlayerSkinService service;

    public PlayerSkinController(PlayerSkinService service) {
        this.service = service;
    }

    @GetMapping
    public List<PlayerSkinCache> getAll() {
        return service.getAll();
    }
}
