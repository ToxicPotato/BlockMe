package com.blockme.api.ingest;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.Set;

import org.springframework.http.client.SimpleClientHttpRequestFactory;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;

import com.blockme.api.block.Block;
import com.blockme.api.block.BlockRepository;
import com.blockme.api.block.BlockVersion;
import com.blockme.api.block.BlockVersionRepository;
import com.blockme.api.version.McVersion;
import com.blockme.api.version.McVersionRepository;
import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.databind.ObjectMapper;

@Service
public class MojangIngestService {

    private final McVersionRepository mcVersionRepository;
    private final BlockRepository blockRepository;
    private final BlockVersionRepository blockVersionRepository;
    private final RestClient restClient;
    private final ObjectMapper objectMapper;

    public MojangIngestService(
            McVersionRepository mcVersionRepository,
            BlockRepository blockRepository,
            BlockVersionRepository blockVersionRepository,
            ObjectMapper objectMapper) {
        this.mcVersionRepository = mcVersionRepository;
        this.blockRepository = blockRepository;
        this.blockVersionRepository = blockVersionRepository;
        this.objectMapper = objectMapper;
        var factory = new SimpleClientHttpRequestFactory();
        factory.setConnectTimeout(10000);
        factory.setReadTimeout(10000);
        this.restClient = RestClient.builder()
                .requestFactory(factory)
                .build();
    }

    // ── Records for Mojang version manifest ──────────────────────────────────
    private record VersionManifest(List<VersionEntry> versions) {
    }

    private record VersionEntry(String id, String type, String releaseTime) {
    }

    // ── Records for minecraft-data blocks.json ────────────────────────────────
    @JsonIgnoreProperties(ignoreUnknown = true)
    private record BlockEntry(String name, String displayName, int emitLight, boolean transparent) {
    }

    public void ingest() {
        ingestVersions();
        ingestBlocks();
    }

    // ── Step 1: Save all Minecraft versions from Mojang ───────────────────────
    private void ingestVersions() {
        VersionManifest manifest = restClient.get()
                .uri("https://launchermeta.mojang.com/mc/game/version_manifest_v2.json")
                .retrieve()
                .body(VersionManifest.class);

        for (VersionEntry entry : manifest.versions()) {
            if (mcVersionRepository.existsByVersion(entry.id())) {
                continue;
            }

            McVersion version = new McVersion();
            version.setVersion(entry.id());
            version.setSnapshot(entry.type().equals("snapshot"));

            var releaseDate = OffsetDateTime.parse(entry.releaseTime(), DateTimeFormatter.ISO_OFFSET_DATE_TIME)
                    .toLocalDate();
            version.setReleaseDate(releaseDate);

            mcVersionRepository.save(version);
        }
    }

    // ── Step 2: Fetch blocks per version and compute addedIn/removedIn ────────
    private void ingestBlocks() {
        List<McVersion> allReleases = mcVersionRepository.findBySnapshotFalseOrderByReleaseDateAsc();
        System.out.println("Processing " + allReleases.size() + " release versions");

        Map<String, Block> previousBlockMap = null;
        McVersion previousMcVersion = null;

        for (McVersion mcVersion : allReleases) {
            String versionId = mcVersion.getVersion();

            BlockEntry[] blocks = fetchBlocksJson(versionId);
            if (blocks == null) {
                // Carry forward previousBlockMap unchanged — minecraft-data has no data for this version
                System.out.println("Skipping " + versionId + " — no block data in minecraft-data");
                continue;
            }

            System.out.println("Ingesting " + blocks.length + " blocks for version " + versionId);

            // Build current block map: namespaceId -> Block entity (find or create)
            Map<String, Block> currentBlockMap = new HashMap<>();
            for (BlockEntry entry : blocks) {
                String namespaceId = "minecraft:" + entry.name();

                Block block = blockRepository.findByNamespaceId(namespaceId).orElseGet(() -> {
                    Block b = new Block();
                    b.setNamespaceId(namespaceId);
                    b.setDisplayName(entry.displayName());
                    b.setAir(entry.name().equals("air"));
                    b.setLuminance((short) entry.emitLight());
                    b.setRenderable(!entry.transparent() && !entry.name().equals("air"));
                    return blockRepository.save(b);
                });

                currentBlockMap.put(namespaceId, block);
            }

            // Compute which blocks were added and removed compared to previous version
            Set<String> addedNames = new HashSet<>(currentBlockMap.keySet());
            Set<String> removedNames = new HashSet<>();

            if (previousBlockMap != null) {
                addedNames.removeAll(previousBlockMap.keySet());
                removedNames.addAll(previousBlockMap.keySet());
                removedNames.removeAll(currentBlockMap.keySet());
            }
            // If previousBlockMap is null this is the first version — all blocks are addedIn

            // Persist BlockVersion rows for all blocks present in this version
            for (Map.Entry<String, Block> entry : currentBlockMap.entrySet()) {
                Block block = entry.getValue();
                boolean isAdded = addedNames.contains(entry.getKey());

                if (!blockVersionRepository.existsByBlockAndMcVersion(block, mcVersion)) {
                    BlockVersion bv = new BlockVersion();
                    bv.setBlock(block);
                    bv.setMcVersion(mcVersion);
                    bv.setAddedIn(isAdded);
                    blockVersionRepository.save(bv);
                }
            }

            // Mark removed blocks on the previous version's BlockVersion row
            for (String namespaceId : removedNames) {
                Block block = previousBlockMap.get(namespaceId);
                blockVersionRepository.findByBlockAndMcVersion(block, previousMcVersion)
                        .ifPresent(bv -> {
                            bv.setRemovedIn(true);
                            blockVersionRepository.save(bv);
                        });
            }

            previousBlockMap = currentBlockMap;
            previousMcVersion = mcVersion;
        }
    }

    // ── Helper: fetch and parse blocks.json from minecraft-data on GitHub ─────
    private BlockEntry[] fetchBlocksJson(String versionId) {
        String url = "https://raw.githubusercontent.com/PrismarineJS/minecraft-data/master/data/pc/"
                + versionId + "/blocks.json";
        String json;
        try {
            json = restClient.get()
                    .uri(url)
                    .retrieve()
                    .body(String.class);
        } catch (Exception e) {
            System.out.println("HTTP error fetching blocks for " + versionId + ": " + e.getMessage());
            return null;
        }
        if (json == null) return null;
        try {
            return objectMapper.readValue(json, BlockEntry[].class);
        } catch (Exception e) {
            System.out.println("Failed to parse blocks for " + versionId + ": " + e.getMessage());
            return null;
        }
    }
}
