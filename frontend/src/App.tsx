/**
 * App.tsx
 * ─────────────────────────────────────────────────────────────
 * Root component. Owns all global state.
 *
 * Views:
 *   • HomeScreen  – shown when no schematic is loaded
 *   • ResultModal – full-screen modal shown after a schematic loads
 *
 * Global drag-and-drop: files can be dropped anywhere on the page.
 * A full-screen overlay appears during drag to indicate the drop zone.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useMemo, useCallback, useEffect, useRef } from 'react'
import HomeScreen   from './components/HomeScreen'
import ResultModal  from './components/ResultModal'
import { parseSchematicBuffer } from './lib/nbtParser'
import { buildMaterialList }    from './lib/materialList'
import type {
  ParsedSchematic,
  SchematicSource,
  MaterialEntry,
} from './types/schematic'

// ─── State ────────────────────────────────────────────────────

interface AppState {
  schematic:  ParsedSchematic | null
  source:     SchematicSource | null
  nickname:   string | null
  filename:   string | null
  playerLoading: boolean
  playerError:   string | null
  fileLoading:   boolean
  fileError:     string | null
}

const INITIAL: AppState = {
  schematic:     null,
  source:        null,
  nickname:      null,
  filename:      null,
  playerLoading: false,
  playerError:   null,
  fileLoading:   false,
  fileError:     null,
}

// ─── Component ────────────────────────────────────────────────

export default function App() {
  const [state,      setState]    = useState<AppState>(INITIAL)
  const [isDragging, setDragging] = useState(false)
  const dragCounter = useRef(0)   // track nested drag-enter/leave events

  // ── Derived ───────────────────────────────────────────────

  const materials: MaterialEntry[] = useMemo(
    () => state.schematic ? buildMaterialList(state.schematic.blocks) : [],
    [state.schematic]
  )

  // ── File handler (shared by drag-drop + home screen browse) ─

  const handleFileLoad = useCallback(
    async (buffer: ArrayBuffer, filename: string) => {
      setState(s => ({ ...s, fileLoading: true, fileError: null }))
      try {
        const schematic = await parseSchematicBuffer(buffer)
        setState(s => ({
          ...s,
          schematic,
          source:      'file',
          filename,
          nickname:    null,
          fileLoading: false,
          fileError:   null,
        }))
        console.info(
          `[BlockMe] "${filename}" → ` +
          `${schematic.width}×${schematic.height}×${schematic.length}, ` +
          `${schematic.blocks.length} blocks`
        )
      } catch (err) {
        setState(s => ({
          ...s,
          fileLoading: false,
          fileError:   err instanceof Error ? err.message : String(err),
          schematic:   null,
        }))
      }
    },
    []
  )

  const handlePlayerLoad = useCallback(
    (schematic: ParsedSchematic, label: string) => {
      setState(s => ({
        ...s,
        schematic,
        source:        'player',
        nickname:      label.replace('_skin', ''),
        filename:      null,
        playerLoading: false,
        playerError:   null,
      }))
    },
    []
  )

  const handleReset = useCallback(() => setState(INITIAL), [])

  // ── Global drag-and-drop ──────────────────────────────────

  useEffect(() => {
    function readFile(file: File) {
      const reader = new FileReader()
      reader.onload = e => {
        const buf = e.target?.result
        if (buf instanceof ArrayBuffer) handleFileLoad(buf, file.name)
      }
      reader.readAsArrayBuffer(file)
    }

    function onDragEnter(e: DragEvent) {
      e.preventDefault()
      dragCounter.current++
      if (dragCounter.current === 1) setDragging(true)
    }

    function onDragOver(e: DragEvent) {
      e.preventDefault()
    }

    function onDragLeave(e: DragEvent) {
      e.preventDefault()
      dragCounter.current--
      if (dragCounter.current === 0) setDragging(false)
    }

    function onDrop(e: DragEvent) {
      e.preventDefault()
      dragCounter.current = 0
      setDragging(false)
      const file = e.dataTransfer?.files?.[0]
      if (file) readFile(file)
    }

    window.addEventListener('dragenter', onDragEnter)
    window.addEventListener('dragover',  onDragOver)
    window.addEventListener('dragleave', onDragLeave)
    window.addEventListener('drop',      onDrop)

    return () => {
      window.removeEventListener('dragenter', onDragEnter)
      window.removeEventListener('dragover',  onDragOver)
      window.removeEventListener('dragleave', onDragLeave)
      window.removeEventListener('drop',      onDrop)
    }
  }, [handleFileLoad])

  // ── Render ────────────────────────────────────────────────

  return (
    <div style={styles.root}>

      {/* Home screen (always mounted so drag-hint is visible) */}
      <HomeScreen
        onPlayerLoad={handlePlayerLoad}
        onFileLoad={handleFileLoad}
        playerLoading={state.playerLoading}
        playerError={state.playerError}
        fileLoading={state.fileLoading}
        fileError={state.fileError}
      />

      {/* Results modal – mounts on top when schematic is ready */}
      {state.schematic && state.source && (
        <ResultModal
          schematic={state.schematic}
          source={state.source}
          nickname={state.nickname}
          filename={state.filename}
          materials={materials}
          onReset={handleReset}
        />
      )}

      {/* Global drag-and-drop overlay */}
      {isDragging && (
        <div style={styles.dropOverlay}>
          <div style={styles.dropBox}>
            <span style={styles.dropIcon}>📦</span>
            <span style={styles.dropText}>Drop schematic here</span>
            <span style={styles.dropSub}>.schematic · .schem · .litematic</span>
          </div>
        </div>
      )}

      {/* Global loading overlay (file parse) */}
      {state.fileLoading && (
        <div style={styles.loadingOverlay}>
          <span style={styles.loadingText}>⏳ Parsing…</span>
        </div>
      )}
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    position:   'relative',
    width:      '100vw',
    height:     '100vh',
    overflow:   'hidden',
    background: 'var(--color-bg-base)',
    fontFamily: 'var(--font-body)',
  },
  dropOverlay: {
    position:       'fixed',
    inset:          0,
    zIndex:         200,
    background:     'var(--color-bg-overlay)',
    backdropFilter: 'blur(4px)',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    pointerEvents:  'none',
  },
  dropBox: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            12,
    padding:        '48px 64px',
    border:         '2px dashed var(--color-accent)',
    borderRadius:   2,
    background:     'var(--color-bg-surface)',
  },
  dropIcon: {
    fontSize: 52,
  },
  dropText: {
    color:      'var(--color-text-primary)',
    fontSize:   22,
    fontWeight: 700,
  },
  dropSub: {
    color:    'var(--color-text-secondary)',
    fontSize: 13,
  },
  loadingOverlay: {
    position:       'fixed',
    inset:          0,
    zIndex:         190,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'var(--color-bg-overlay)',
    backdropFilter: 'blur(2px)',
    pointerEvents:  'none',
  },
  loadingText: {
    color:        'var(--color-text-title)',
    fontSize:     20,
    fontWeight:   600,
    background:   'var(--color-bg-surface)',
    padding:      '14px 32px',
    borderRadius: 2,
    border:       '1px solid var(--color-border-input)',
  },
}
