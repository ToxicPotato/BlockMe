"""
BlockMe Database Ingest Script
================================
Populates the database with:
  1. Minecraft versions (from Mojang version manifest API)
  2. Block categories (from data/blocktypes.json)
  3. Blocks (from data/blocks.json)
  4. Block textures (PNG + avg color from Mojang asset CDN)

Usage:
    python database/ingest.py [--version 1.21.4] [--no-textures] [--help]

Requirements:
    pip install psycopg2-binary requests pillow
"""

import argparse
import io
import json
import os
import sys
import time
from pathlib import Path

import psycopg2
import requests
from PIL import Image

# ── Config ────────────────────────────────────────────────────────────────────

DB_URL = os.environ.get(
    "DATABASE_URL",
    "postgresql://blockme:blockme_dev@localhost:5432/blockme",
)

MOJANG_VERSION_MANIFEST = (
    "https://launchermeta.mojang.com/mc/game/version_manifest_v2.json"
)
MOJANG_ASSET_BASE = (
    "https://raw.githubusercontent.com/InventivetalentDev/minecraft-assets"
    "/{version}/assets/minecraft/textures/block/{block}.png"
)

DATA_DIR = Path(__file__).parent.parent / "data"

# ── Helpers ───────────────────────────────────────────────────────────────────


def namespace(block_id: str) -> str:
    """'stone' → 'minecraft:stone'"""
    if ":" in block_id:
        return block_id
    return f"minecraft:{block_id}"


def display_name(block_id: str) -> str:
    """'acacia_planks' → 'Acacia Planks'"""
    return block_id.replace("_", " ").title()


def avg_color(png_bytes: bytes) -> tuple[int, int, int]:
    """Return (r, g, b) average of non-transparent pixels."""
    img = Image.open(io.BytesIO(png_bytes)).convert("RGBA")
    pixels = [
        (r, g, b)
        for r, g, b, a in img.getdata()
        if a > 10  # skip transparent
    ]
    if not pixels:
        return (0, 0, 0)
    n = len(pixels)
    return (
        sum(p[0] for p in pixels) // n,
        sum(p[1] for p in pixels) // n,
        sum(p[2] for p in pixels) // n,
    )


# ── Steps ─────────────────────────────────────────────────────────────────────


def fetch_versions() -> list[dict]:
    """Fetch release versions from Mojang manifest (newest first)."""
    print("Fetching version manifest from Mojang...")
    resp = requests.get(MOJANG_VERSION_MANIFEST, timeout=15)
    resp.raise_for_status()
    data = resp.json()
    versions = [
        v
        for v in data["versions"]
        if v["type"] in ("release", "snapshot")
    ]
    print(f"  Found {len(versions)} versions")
    return versions


def ingest_versions(cur, versions: list[dict]) -> dict[str, int]:
    """Insert versions, return {version_str: id}."""
    print("Inserting versions...")
    version_ids: dict[str, int] = {}
    for v in versions:
        is_snapshot = v["type"] == "snapshot"
        release_date = v["releaseTime"][:10]  # 'YYYY-MM-DD'
        cur.execute(
            """
            INSERT INTO mc_version (version, release_date, is_snapshot)
            VALUES (%s, %s, %s)
            ON CONFLICT (version) DO UPDATE
                SET release_date = EXCLUDED.release_date,
                    is_snapshot  = EXCLUDED.is_snapshot
            RETURNING id, version
            """,
            (v["id"], release_date, is_snapshot),
        )
        row = cur.fetchone()
        version_ids[row[1]] = row[0]

    print(f"  Inserted/updated {len(version_ids)} versions")
    return version_ids


def ingest_categories(cur) -> dict[str, int]:
    """Insert block categories from blocktypes.json, return {name: id}."""
    print("Inserting block categories...")
    blocktypes_path = DATA_DIR / "blocktypes.json"
    with open(blocktypes_path, encoding="utf-8") as f:
        blocktypes = json.load(f)

    category_ids: dict[str, int] = {}
    for category_name in blocktypes:
        cur.execute(
            """
            INSERT INTO block_category (name)
            VALUES (%s)
            ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name
            RETURNING id
            """,
            (category_name,),
        )
        category_ids[category_name] = cur.fetchone()[0]

    print(f"  Inserted {len(category_ids)} categories: {list(category_ids)}")
    return category_ids, blocktypes


def ingest_blocks(cur, category_ids: dict[str, int], blocktypes: dict) -> dict[str, int]:
    """Insert blocks from blocks.json, return {namespace_id: id}."""
    print("Inserting blocks...")
    blocks_path = DATA_DIR / "blocks.json"
    with open(blocks_path, encoding="utf-8") as f:
        blocks_data = json.load(f)

    # Build lookup: block_id → category
    block_to_category: dict[str, str] = {}
    for cat_name, block_list in blocktypes.items():
        for b in block_list:
            block_to_category[b] = cat_name

    # Flags derived from categories
    unobtainable = set(blocktypes.get("unobtainable_survival", []))
    falling = set(blocktypes.get("falling_blocks", []))

    block_ids: dict[str, int] = {}
    for entry in blocks_data:
        raw_id = entry["block"]
        ns_id = namespace(raw_id)
        cat_name = block_to_category.get(raw_id)
        cat_id = category_ids.get(cat_name) if cat_name else None

        cur.execute(
            """
            INSERT INTO block (
                namespace_id, display_name, category_id,
                is_air, is_fluid, is_technical, is_renderable,
                gravity_affected, luminance,
                obtainable_survival, obtainable_creative
            ) VALUES (
                %s, %s, %s,
                FALSE, FALSE, FALSE, TRUE,
                %s, 0,
                %s, TRUE
            )
            ON CONFLICT (namespace_id) DO UPDATE SET
                display_name        = EXCLUDED.display_name,
                category_id         = EXCLUDED.category_id,
                gravity_affected    = EXCLUDED.gravity_affected,
                obtainable_survival = EXCLUDED.obtainable_survival
            RETURNING id
            """,
            (
                ns_id,
                display_name(raw_id),
                cat_id,
                raw_id in falling,
                raw_id not in unobtainable,
            ),
        )
        block_ids[ns_id] = cur.fetchone()[0]

    print(f"  Inserted/updated {len(block_ids)} blocks")
    return block_ids


def ingest_block_versions(cur, block_ids: dict[str, int], version_ids: dict[str, int], target_version: str):
    """Link all blocks to the target version in block_version table."""
    print(f"Linking blocks to version {target_version}...")

    if target_version not in version_ids:
        print(f"  WARNING: version '{target_version}' not found in DB, skipping")
        return

    ver_id = version_ids[target_version]
    count = 0
    for block_id in block_ids.values():
        cur.execute(
            """
            INSERT INTO block_version (block_id, mc_version_id, added_in, removed_in)
            VALUES (%s, %s, TRUE, FALSE)
            ON CONFLICT (block_id, mc_version_id) DO NOTHING
            """,
            (block_id, ver_id),
        )
        count += 1

    print(f"  Linked {count} blocks to version {target_version}")


def ingest_textures(cur, block_ids: dict[str, int], version_ids: dict[str, int], target_version: str):
    """Fetch PNG textures from Mojang CDN and insert with avg color."""
    print(f"\nFetching textures for version {target_version}...")

    if target_version not in version_ids:
        print(f"  WARNING: version '{target_version}' not found, skipping textures")
        return

    ver_id = version_ids[target_version]

    # Ensure default texture pack exists
    cur.execute(
        """
        INSERT INTO texture_pack (name, slug, is_default)
        VALUES ('Vanilla', %s, TRUE)
        ON CONFLICT (slug) DO UPDATE SET is_default = TRUE
        RETURNING id
        """,
        (f"vanilla-{target_version}",),
    )
    pack_id = cur.fetchone()[0]

    total = len(block_ids)
    ok = 0
    failed = []

    for i, (ns_id, block_db_id) in enumerate(block_ids.items(), 1):
        raw_id = ns_id.split(":")[-1]  # 'minecraft:stone' → 'stone'
        url = MOJANG_ASSET_BASE.format(version=target_version, block=raw_id)

        try:
            resp = requests.get(url, timeout=10)
            if resp.status_code == 404:
                failed.append(raw_id)
                print(f"  [{i}/{total}] 404 {raw_id}")
                continue

            resp.raise_for_status()
            png_bytes = resp.content
            r, g, b = avg_color(png_bytes)

            cur.execute(
                """
                INSERT INTO block_texture (
                    block_id, mc_version_id, texture_pack_id, face,
                    image_data, source_url,
                    avg_color_r, avg_color_g, avg_color_b
                ) VALUES (%s, %s, %s, 'all', %s, %s, %s, %s, %s)
                ON CONFLICT (block_id, mc_version_id, texture_pack_id, face)
                DO UPDATE SET
                    image_data  = EXCLUDED.image_data,
                    source_url  = EXCLUDED.source_url,
                    avg_color_r = EXCLUDED.avg_color_r,
                    avg_color_g = EXCLUDED.avg_color_g,
                    avg_color_b = EXCLUDED.avg_color_b,
                    fetched_at  = NOW()
                """,
                (block_db_id, ver_id, pack_id, psycopg2.Binary(png_bytes), url, r, g, b),
            )
            ok += 1
            print(f"  [{i}/{total}] OK {raw_id} (avg: {r},{g},{b})")

        except requests.RequestException as e:
            failed.append(raw_id)
            print(f"  [{i}/{total}] ERROR {raw_id}: {e}")

        # polite rate limiting
        time.sleep(0.05)

    print(f"\nTextures: {ok} ok, {len(failed)} failed")
    if failed:
        print(f"Failed blocks: {', '.join(failed)}")


# ── Main ──────────────────────────────────────────────────────────────────────


def main():
    parser = argparse.ArgumentParser(description="BlockMe DB ingest script")
    parser.add_argument(
        "--version",
        default="1.21.1",
        help="Minecraft version to link blocks/textures to (default: 1.21.1)",
    )
    parser.add_argument(
        "--no-textures",
        action="store_true",
        help="Skip texture fetching (faster, for dev)",
    )
    parser.add_argument(
        "--no-versions",
        action="store_true",
        help="Skip fetching all MC versions from Mojang (only insert target version)",
    )
    args = parser.parse_args()

    print(f"Connecting to: {DB_URL.split('@')[-1]}")  # hide password
    conn = psycopg2.connect(DB_URL)
    conn.autocommit = False

    try:
        with conn.cursor() as cur:
            # 1. Versions
            if args.no_versions:
                # Just insert the target version
                cur.execute(
                    """
                    INSERT INTO mc_version (version, is_snapshot)
                    VALUES (%s, FALSE)
                    ON CONFLICT (version) DO NOTHING
                    RETURNING id, version
                    """,
                    (args.version,),
                )
                row = cur.fetchone()
                if row:
                    version_ids = {row[1]: row[0]}
                else:
                    cur.execute("SELECT id, version FROM mc_version WHERE version = %s", (args.version,))
                    row = cur.fetchone()
                    version_ids = {row[1]: row[0]} if row else {}
            else:
                versions = fetch_versions()
                version_ids = ingest_versions(cur, versions)

            # 2. Categories
            category_ids, blocktypes = ingest_categories(cur)

            # 3. Blocks
            block_ids = ingest_blocks(cur, category_ids, blocktypes)

            # 4. Block-version links
            ingest_block_versions(cur, block_ids, version_ids, args.version)

            # 5. Textures
            if not args.no_textures:
                ingest_textures(cur, block_ids, version_ids, args.version)

        conn.commit()
        print("\nDone! All changes committed.")

    except Exception as e:
        conn.rollback()
        print(f"\nERROR: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    main()
