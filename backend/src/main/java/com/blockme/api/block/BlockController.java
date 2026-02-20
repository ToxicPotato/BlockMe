package com.blockme.api.block;

import java.util.List;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/blocks")
public class BlockController {
    private final BlockService service;

    public BlockController(BlockService service) {
        this.service = service;
    }

    @GetMapping
    public List<Block> getAll() {
        return service.getAll();
    }

}
