package com.blockme.api.ingest;

import java.util.Map;

import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/ingest")
public class IngestController {
    private final MojangIngestService service;

    public IngestController(MojangIngestService service) {
        this.service = service;
    }

    @PostMapping("/run")
    public Map<String, String> runIngest() {
        service.ingest();
        return Map.of("message", "Ingest completed");
    }
}