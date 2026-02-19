/**
 * ResultModal.tsx
 * ─────────────────────────────────────────────────────────────
 * Full-screen modal shown after a schematic is loaded.
 *
 * Layout:
 *   ┌─────────────────────────────────────────────────────┐
 *   │  [✕]                                                │
 *   │  ┌──────────────┐  ┌─────────────────────────────┐ │
 *   │  │  Left panel  │  │      3D Scene viewer        │ │
 *   │  │  • Source    │  │                             │ │
 *   │  │  • Dims      │  │                             │ │
 *   │  │  • Materials │  │                             │ │
 *   │  │  • Downloads │  │                             │ │
 *   │  │  • [Reset]   │  │                             │ │
 *   │  └──────────────┘  └─────────────────────────────┘ │
 *   └─────────────────────────────────────────────────────┘
 * ─────────────────────────────────────────────────────────────
 */

import type { ParsedSchematic, MaterialEntry, SchematicSource } from '../types/schematic'
import Scene          from '../Scene'
import MaterialList   from './MaterialList'
import DownloadButtons from './DownloadButtons'

interface Props {
  schematic: ParsedSchematic
  source:    SchematicSource
  nickname:  string | null
  filename:  string | null
  materials: MaterialEntry[]
  onReset:   () => void
}

export default function ResultModal({
  schematic,
  source,
  nickname,
  filename,
  materials,
  onReset,
}: Props) {
  const downloadLabel =
    source === 'player' ? (nickname ?? 'skin') :
    (filename ?? 'schematic').replace(/\.[^.]+$/, '')

  const sourceLabel =
    source === 'player' ? `👤 ${nickname}` : `📦 ${filename}`

  return (
    <div style={styles.backdrop}>
      <div style={styles.modal}>

        {/* ── Close button ──────────────────────────────────── */}
        <button style={styles.closeBtn} onClick={onReset} title="Back to home">
          ✕
        </button>

        {/* ── Body ──────────────────────────────────────────── */}
        <div style={styles.body}>

          {/* Left panel */}
          <div style={styles.leftPanel}>

            {/* Source badge + dims */}
            <div style={styles.sourceRow}>
              <span style={styles.sourceName}>{sourceLabel}</span>
            </div>

            <div style={styles.dims}>
              {(['W', 'H', 'L'] as const).map((k, i) => (
                <span key={k} style={styles.dim}>
                  <span style={styles.dimLabel}>{k}</span>
                  <span style={styles.dimValue}>
                    {[schematic.width, schematic.height, schematic.length][i]}
                  </span>
                </span>
              ))}
              <span style={styles.dim}>
                <span style={styles.dimLabel}>Blocks</span>
                <span style={styles.dimValue}>{schematic.blocks.length.toLocaleString()}</span>
              </span>
            </div>

            <div style={styles.divider} />

            {/* Material list – grows to fill remaining space */}
            <div style={styles.materialWrapper}>
              <MaterialList materials={materials} />
            </div>

            <div style={styles.divider} />

            <DownloadButtons materials={materials} label={downloadLabel} />

            <div style={styles.divider} />

            {/* Back to home */}
            <button style={styles.resetBtn} onClick={onReset}>
              ← Load another
            </button>
          </div>

          {/* Right panel: 3D viewer */}
          <div style={styles.sceneWrapper}>
            <Scene schematic={schematic} />
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  backdrop: {
    position:   'fixed',
    inset:      0,
    zIndex:     50,
    display:    'flex',
    fontFamily: 'var(--font-body)',
  },
  modal: {
    position:      'relative',
    width:         '100%',
    height:        '100%',
    background:    'var(--color-bg-base)',
    display:       'flex',
    flexDirection: 'column',
    overflow:      'hidden',
  },
  closeBtn: {
    position:     'absolute',
    top:          14,
    right:        16,
    zIndex:       10,
    background:   'transparent',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-secondary)',
    fontSize:     16,
    cursor:       'pointer',
    padding:      '4px 10px',
    fontFamily:   'inherit',
    transition:   'color 0.15s, border-color 0.15s',
  },
  body: {
    display:  'flex',
    flex:     1,
    overflow: 'hidden',
  },
  leftPanel: {
    width:         300,
    flexShrink:    0,
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    padding:       '16px 14px',
    borderRight:   '1px solid var(--color-border-subtle)',
    boxShadow:     'var(--shadow-pixel-panel)',
    overflowY:     'auto',
    boxSizing:     'border-box',
  },
  sourceRow: {
    display:      'flex',
    alignItems:   'center',
    paddingRight: 48,
  },
  sourceName: {
    color:        'var(--color-text-accent)',
    fontSize:     13,
    fontWeight:   600,
    overflow:     'hidden',
    textOverflow: 'ellipsis',
    whiteSpace:   'nowrap',
  },
  dims: {
    display: 'flex',
    gap:     12,
  },
  dim: {
    display:       'flex',
    flexDirection: 'column',
    alignItems:    'center',
    gap:           1,
  },
  dimLabel: {
    color:    'var(--color-text-secondary)',
    fontSize: 10,
  },
  dimValue: {
    color:      'var(--color-text-primary)',
    fontSize:   13,
    fontWeight: 600,
  },
  divider: {
    height:     1,
    background: 'var(--color-border-subtle)',
    flexShrink: 0,
  },
  materialWrapper: {
    flex:          1,
    minHeight:     0,
    display:       'flex',
    flexDirection: 'column',
  },
  resetBtn: {
    background:   'transparent',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-secondary)',
    fontSize:     12,
    cursor:       'pointer',
    padding:      '8px 0',
    fontFamily:   'inherit',
    textAlign:    'center',
    transition:   'color 0.15s, border-color 0.15s',
  },
  sceneWrapper: {
    flex:     1,
    minWidth: 0,
    position: 'relative',
  },
}
