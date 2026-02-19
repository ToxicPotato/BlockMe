/**
 * BlockMeshes.tsx
 * ─────────────────────────────────────────────────────────────
 * Renders a list of BlockEntry values as Three.js meshes inside
 * a React Three Fiber <Canvas>.
 *
 * Performance strategy
 * ─────────────────────
 * We group blocks by block-id and create ONE instanced mesh per
 * unique block type.  InstancedMesh lets Three.js draw thousands
 * of identical cubes in a single draw call, which is critical for
 * large schematics.
 *
 * Textures
 * ─────────
 * • If a PNG exists under public/textures/blocks/ it is loaded via
 *   Three.js TextureLoader and applied to all 6 faces uniformly.
 * • If no PNG is found the material falls back to a solid colour
 *   from textureMap.getFallbackColor().
 * ─────────────────────────────────────────────────────────────
 */

import { useMemo, useRef, useEffect } from 'react'
import { useThree } from '@react-three/fiber'
import {
  Matrix4, Vector3,
  TextureLoader, NearestFilter,
  MeshLambertMaterial,
  InstancedMesh,
  BoxGeometry,
} from 'three'
import type { BlockEntry } from '../types/schematic'
import { getTextureUrl, getFallbackColor } from '../lib/textureMap'

// Shared geometry for all cubes
const CUBE_GEO = new BoxGeometry(1, 1, 1)

interface Props {
  blocks: BlockEntry[]
  /** Offset so schematic is centred at origin */
  centreOffset: Vector3
}

interface BlockGroup {
  blockId: string
  positions: Vector3[]
}

// ─── Helper: group blocks by id ───────────────────────────────

function groupByBlockId(blocks: BlockEntry[], offset: Vector3): BlockGroup[] {
  const map = new Map<string, Vector3[]>()
  for (const b of blocks) {
    const pos = new Vector3(
      b.x - offset.x,
      b.y - offset.y,
      b.z - offset.z,
    )
    if (!map.has(b.blockId)) map.set(b.blockId, [])
    map.get(b.blockId)!.push(pos)
  }
  return Array.from(map.entries()).map(([blockId, positions]) => ({ blockId, positions }))
}

// ─── Single instanced mesh for one block type ─────────────────

interface BlockTypeProps {
  blockId: string
  positions: Vector3[]
}

function BlockTypeInstanced({ blockId, positions }: BlockTypeProps) {
  const meshRef = useRef<InstancedMesh>(null)
  const { gl } = useThree()

  // Build material (texture or colour fallback)
  const material = useMemo(() => {
    const url = getTextureUrl(blockId)
    if (url) {
      const loader = new TextureLoader()
      const tex = loader.load(url)
      // Nearest-neighbour filtering keeps pixel art crisp
      tex.magFilter = NearestFilter
      tex.minFilter = NearestFilter
      return new MeshLambertMaterial({ map: tex })
    }
    return new MeshLambertMaterial({ color: getFallbackColor(blockId) })
  }, [blockId])

  // Write per-instance matrices
  useEffect(() => {
    const mesh = meshRef.current
    if (!mesh) return
    const mat = new Matrix4()
    positions.forEach((pos, i) => {
      mat.setPosition(pos.x, pos.y, pos.z)
      mesh.setMatrixAt(i, mat)
    })
    mesh.instanceMatrix.needsUpdate = true
    // Frustum culling on instanced meshes requires a bounding sphere
    mesh.computeBoundingSphere()
  }, [positions, gl])

  return (
    <instancedMesh
      ref={meshRef}
      args={[CUBE_GEO, material, positions.length]}
      castShadow
      receiveShadow
    />
  )
}

// ─── Public component ─────────────────────────────────────────

export default function BlockMeshes({ blocks, centreOffset }: Props) {
  const groups = useMemo(
    () => groupByBlockId(blocks, centreOffset),
    [blocks, centreOffset]
  )

  return (
    <group>
      {groups.map((g) => (
        <BlockTypeInstanced
          key={g.blockId}
          blockId={g.blockId}
          positions={g.positions}
        />
      ))}
    </group>
  )
}
