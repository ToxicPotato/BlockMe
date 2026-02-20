package com.blockme.api.version;

import java.util.List;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/versions")
public class McVersionController {
    private final McVersionService service;

    public McVersionController(McVersionService service) {
        this.service = service;
    }

    @GetMapping
    public List<McVersion> getAll() {
        return service.getAll();
    }
}
