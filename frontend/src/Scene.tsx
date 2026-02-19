/**
 * Scene.tsx
 * ─────────────────────────────────────────────────────────────
 * React Three Fiber canvas that renders the schematic viewer.
 *
 * When no schematic is loaded it shows a simple placeholder grid.
 * When blocks are provided it renders them via <BlockMeshes>.
 * ─────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react'
import { Canvas }          from '@react-three/fiber'
import { OrbitControls, Grid, GizmoHelper, GizmoViewport } from '@react-three/drei'
import { Vector3 }         from 'three'

import BlockMeshes         from './components/BlockMeshes'
import type { ParsedSchematic } from './types/schematic'
import { useThemeColors }  from './hooks/useThemeColors'

interface Props {
  schematic: ParsedSchematic | null
}

/** Compute the offset that centres the schematic at the world origin. */
function useCentreOffset(s: ParsedSchematic | null): Vector3 {
  return useMemo(() => {
    if (!s) return new Vector3(0, 0, 0)
    return new Vector3(s.width / 2, s.height / 2, s.length / 2)
  }, [s])
}

/** A sensible camera position based on schematic size. */
function useCameraPosition(s: ParsedSchematic | null): [number, number, number] {
  return useMemo(() => {
    if (!s) return [10, 8, 10]
    const d = Math.max(s.width, s.height, s.length) * 1.5
    return [d, d * 0.7, d]
  }, [s])
}

// ─── Scene contents (inside Canvas) ──────────────────────────

function SceneContents({ schematic }: Props) {
  const offset   = useCentreOffset(schematic)
  const camPos   = useCameraPosition(schematic)
  const colors   = useThemeColors()

  return (
    <>
      {/* Lighting */}
      <ambientLight intensity={0.6} />
      <directionalLight
        position={[50, 80, 30]}
        intensity={1.2}
        castShadow
        shadow-mapSize={[2048, 2048]}
      />
      <directionalLight position={[-30, 40, -20]} intensity={0.4} />

      {/* Camera controls */}
      <OrbitControls makeDefault dampingFactor={0.1} />

      {/* Orientation helper */}
      <GizmoHelper alignment="bottom-right" margin={[80, 80]}>
        <GizmoViewport />
      </GizmoHelper>

      {/* Floor grid – sized to schematic or default */}
      <Grid
        args={[
          schematic ? schematic.width + 4  : 20,
          schematic ? schematic.length + 4 : 20,
        ]}
        position={[0, schematic ? -offset.y - 0.5 : -0.5, 0]}
        cellColor={colors.gridCell}
        sectionColor={colors.gridSection}
        cellSize={1}
        sectionSize={8}
        fadeDistance={200}
        infiniteGrid={false}
      />

      {/* Blocks */}
      {schematic && (
        <BlockMeshes
          blocks={schematic.blocks}
          centreOffset={offset}
        />
      )}

      {/* Placeholder when nothing is loaded */}
      {!schematic && (
        <mesh>
          <boxGeometry args={[2, 2, 2]} />
          <meshStandardMaterial color={colors.placeholderMesh} wireframe />
        </mesh>
      )}

      {/* Temporary camera target so OrbitControls starts centred */}
      <perspectiveCamera position={camPos} />
    </>
  )
}

// ─── Exported component ───────────────────────────────────────

export default function Scene({ schematic }: Props) {
  const camPos = useCameraPosition(schematic)

  return (
    <Canvas
      shadows
      camera={{ position: camPos, fov: 60, near: 0.1, far: 5000 }}
      gl={{ antialias: true }}
      style={{ width: '100%', height: '100%' }}
    >
      <SceneContents schematic={schematic} />
    </Canvas>
  )
}
