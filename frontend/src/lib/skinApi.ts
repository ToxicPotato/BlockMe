/**
 * skinApi.ts
 * ─────────────────────────────────────────────────────────────
 * Calls the backend to convert a Minecraft username into a
 * ParsedSchematic (skin built from coloured blocks).
 *
 * When the backend is not yet running, MOCK_MODE returns a
 * placeholder schematic so the frontend can be developed
 * independently.
 * ─────────────────────────────────────────────────────────────
 */

import type { ParsedSchematic } from '../types/schematic'

// ─── Config ───────────────────────────────────────────────────

const API_BASE  = import.meta.env.VITE_API_URL ?? 'http://localhost:8000'
const MOCK_MODE = import.meta.env.VITE_MOCK_SKIN === 'true'

// ─── Request / response types ─────────────────────────────────

export interface SkinSchemaRequest {
  username:           string
  excludedBlocks?:    string[]
  excludedCategories?: string[]
}

export interface SkinSchemaResponse extends ParsedSchematic {
  username: string
  uuid:     string
  slim:     boolean
}

// ─── Public API ───────────────────────────────────────────────

/**
 * Fetch a block-built skin schematic from the backend.
 *
 * @param req  - username + optional exclusion lists
 * @returns    - ParsedSchematic-compatible response
 * @throws     - Error with human-readable message on failure
 */
export async function fetchSkinSchema(
  req: SkinSchemaRequest
): Promise<SkinSchemaResponse> {
  if (MOCK_MODE) return mockResponse(req.username)

  const res = await fetch(`${API_BASE}/api/player/skin-schema`, {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(req),
  })

  if (!res.ok) {
    const text = await res.text().catch(() => res.statusText)
    throw new Error(`API error ${res.status}: ${text}`)
  }

  return res.json() as Promise<SkinSchemaResponse>
}

// ─── Mock (used when VITE_MOCK_SKIN=true) ────────────────────

function mockResponse(username: string): SkinSchemaResponse {
  // 8×16×4 placeholder structure shaped like a Minecraft character
  const blocks = []

  // Head (8×8×8, y 24–31)
  for (let y = 24; y < 32; y++)
    for (let z = 0; z < 8; z++)
      for (let x = 0; x < 8; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:oak_planks' })

  // Body (8×12×4, y 12–23)
  for (let y = 12; y < 24; y++)
    for (let z = 1; z < 5; z++)
      for (let x = 0; x < 8; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:blue_wool' })

  // Right arm (4×12×4, y 12–23, x -4..0)
  for (let y = 12; y < 24; y++)
    for (let z = 1; z < 5; z++)
      for (let x = -4; x < 0; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:oak_planks' })

  // Left arm (4×12×4, y 12–23, x 9..13)
  for (let y = 12; y < 24; y++)
    for (let z = 1; z < 5; z++)
      for (let x = 9; x < 13; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:oak_planks' })

  // Right leg (4×12×4, y 0–11)
  for (let y = 0; y < 12; y++)
    for (let z = 1; z < 5; z++)
      for (let x = 1; x < 5; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:dark_oak_planks' })

  // Left leg (4×12×4, y 0–11)
  for (let y = 0; y < 12; y++)
    for (let z = 1; z < 5; z++)
      for (let x = 5; x < 9; x++)
        blocks.push({ x: x + 1, y, z: z + 1, blockId: 'minecraft:dark_oak_planks' })

  return {
    username,
    uuid:   '00000000-0000-0000-0000-000000000000',
    slim:   false,
    width:  14,
    height: 32,
    length: 8,
    blocks,
  }
}
