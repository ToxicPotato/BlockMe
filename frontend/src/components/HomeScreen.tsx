/**
 * HomeScreen.tsx
 * ─────────────────────────────────────────────────────────────
 * Landing page shown when no schematic is loaded.
 *
 * Contains:
 *   • Logo + tagline
 *   • Large Minecraft username input
 *   • Collapsible "Exclude blocks" advanced panel
 *   • "Browse file" button (hidden file input)
 *   • Drag-and-drop hint (actual DnD is handled globally in App)
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useRef, type FormEvent, type KeyboardEvent } from 'react'
import type { ParsedSchematic } from '../types/schematic'
import { fetchSkinSchema } from '../lib/skinApi'

interface Props {
  onPlayerLoad: (schematic: ParsedSchematic, label: string) => void
  onFileLoad:   (buffer: ArrayBuffer, filename: string) => void
  playerLoading: boolean
  playerError:   string | null
  fileLoading:   boolean
  fileError:     string | null
}

export default function HomeScreen({
  onPlayerLoad,
  onFileLoad,
  playerLoading,
  playerError,
  fileLoading,
  fileError,
}: Props) {
  const [nickname,       setNickname]       = useState('')
  const [excludeInput,   setExcludeInput]   = useState('')
  const [excludedBlocks, setExcludedBlocks] = useState<string[]>([])
  const [showAdvanced,   setShowAdvanced]   = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loading = playerLoading || fileLoading

  // ── Submit nickname ────────────────────────────────────────

  async function handleSubmit(e?: FormEvent) {
    e?.preventDefault()
    const name = nickname.trim()
    if (!name || loading) return

    try {
      const result = await fetchSkinSchema({ username: name, excludedBlocks })
      onPlayerLoad(result, `${name}_skin`)
    } catch {
      // error shown via playerError prop
    }
  }

  // ── Exclude blocks ─────────────────────────────────────────

  function addExclude() {
    const val = excludeInput.trim().toLowerCase()
    if (!val) return
    const id = val.startsWith('minecraft:') ? val : `minecraft:${val}`
    if (!excludedBlocks.includes(id)) setExcludedBlocks(prev => [...prev, id])
    setExcludeInput('')
  }

  function removeExclude(id: string) {
    setExcludedBlocks(prev => prev.filter(b => b !== id))
  }

  function onExcludeKeyDown(e: KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') { e.preventDefault(); addExclude() }
  }

  // ── File browse ────────────────────────────────────────────

  function handleFileInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = ev => {
      const buf = ev.target?.result
      if (buf instanceof ArrayBuffer) onFileLoad(buf, file.name)
    }
    reader.readAsArrayBuffer(file)
    e.target.value = ''
  }

  // ── Render ─────────────────────────────────────────────────

  return (
    <div style={styles.root}>

      {/* ── Card ─────────────────────────────────────────────── */}
      <div style={styles.card}>

        {/* Logo */}
        <div style={styles.logo}>⛏</div>
        <h1 style={styles.title}>BlockMe</h1>
        <p style={styles.tagline}>Visualise your Minecraft skin as blocks</p>

        {/* Nickname form */}
        <form onSubmit={handleSubmit} style={styles.form}>
          <label style={styles.label}>Minecraft username</label>
          <div style={styles.inputRow}>
            <input
              style={styles.input}
              type="text"
              placeholder="e.g. Notch"
              value={nickname}
              onChange={e => setNickname(e.target.value)}
              disabled={loading}
              autoComplete="off"
              spellCheck={false}
              autoFocus
            />
            <button
              type="submit"
              style={{
                ...styles.submitBtn,
                opacity: loading || !nickname.trim() ? 0.45 : 1,
              }}
              disabled={loading || !nickname.trim()}
            >
              {playerLoading ? '⏳' : '→'}
            </button>
          </div>

          {/* Advanced: exclude blocks */}
          <button
            type="button"
            style={styles.advancedToggle}
            onClick={() => setShowAdvanced(v => !v)}
          >
            {showAdvanced ? '▲' : '▼'} Advanced
            {excludedBlocks.length > 0 && (
              <span style={styles.advancedBadge}>{excludedBlocks.length}</span>
            )}
          </button>

          {showAdvanced && (
            <div style={styles.advancedPanel}>
              <p style={styles.advancedHint}>
                Blocks to exclude from the skin render
              </p>
              <div style={styles.inputRow}>
                <input
                  style={styles.input}
                  type="text"
                  placeholder="e.g. diamond_block"
                  value={excludeInput}
                  onChange={e => setExcludeInput(e.target.value)}
                  onKeyDown={onExcludeKeyDown}
                />
                <button type="button" style={styles.addBtn} onClick={addExclude}>+</button>
              </div>
              {excludedBlocks.length > 0 && (
                <div style={styles.tagList}>
                  {excludedBlocks.map(id => (
                    <span key={id} style={styles.tag}>
                      {id.replace('minecraft:', '')}
                      <button
                        type="button"
                        style={styles.tagX}
                        onClick={() => removeExclude(id)}
                      >✕</button>
                    </span>
                  ))}
                </div>
              )}
            </div>
          )}

          {playerError && <p style={styles.error}>⚠ {playerError}</p>}
        </form>

        {/* Divider */}
        <div style={styles.dividerRow}>
          <div style={styles.dividerLine} />
          <span style={styles.dividerText}>or</span>
          <div style={styles.dividerLine} />
        </div>

        {/* File upload */}
        <input
          ref={fileInputRef}
          type="file"
          accept=".schematic,.schem,.litematic"
          style={{ display: 'none' }}
          onChange={handleFileInputChange}
        />

        {fileLoading ? (
          <p style={styles.fileHint}>⏳ Parsing file…</p>
        ) : (
          <button
            style={styles.fileBtn}
            onClick={() => fileInputRef.current?.click()}
          >
            📦 Browse schematic file…
          </button>
        )}

        {fileError && <p style={styles.error}>⚠ {fileError}</p>}

        {/* Drag hint */}
        <p style={styles.dragHint}>
          ✦ or drag &amp; drop a file anywhere on the page
        </p>
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  root: {
    position:       'fixed',
    inset:          0,
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    background:     'var(--color-bg-base)',
    fontFamily:     'var(--font-body)',
  },
  card: {
    display:        'flex',
    flexDirection:  'column',
    alignItems:     'center',
    gap:            16,
    padding:        '48px 56px',
    background:     'var(--color-bg-surface)',
    border:         '1px solid var(--color-border-subtle)',
    borderRadius:   4,
    boxShadow:      'var(--shadow-pixel-card)',
    width:          420,
    maxWidth:       '92vw',
    boxSizing:      'border-box' as const,
  },
  logo: {
    fontSize:   48,
    lineHeight: 1,
  },
  title: {
    color:         'var(--color-text-title)',
    fontSize:      40,
    fontWeight:    400,
    letterSpacing: 2,
    margin:        0,
    fontFamily:    'var(--font-heading)',
  },
  tagline: {
    color:     'var(--color-text-secondary)',
    fontSize:  13,
    margin:    0,
    textAlign: 'center',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           10,
    width:         '100%',
  },
  label: {
    color:    'var(--color-text-secondary)',
    fontSize: 12,
  },
  inputRow: {
    display: 'flex',
    gap:     8,
  },
  input: {
    flex:         1,
    background:   'var(--color-bg-surface-deep)',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-primary)',
    padding:      '10px 14px',
    fontSize:     15,
    outline:      'none',
    fontFamily:   'inherit',
  },
  submitBtn: {
    padding:      '10px 18px',
    background:   'var(--color-bg-btn-primary)',
    border:       '1px solid var(--color-border-accent)',
    borderRadius: 2,
    color:        'var(--color-text-primary)',
    fontSize:     18,
    cursor:       'pointer',
    fontFamily:   'inherit',
    flexShrink:   0,
    transition:   'background 0.15s',
  },
  advancedToggle: {
    background:  'transparent',
    border:      'none',
    color:       'var(--color-text-secondary)',
    fontSize:    12,
    cursor:      'pointer',
    padding:     0,
    textAlign:   'left',
    fontFamily:  'inherit',
    display:     'flex',
    alignItems:  'center',
    gap:         6,
  },
  advancedBadge: {
    background:   'var(--color-bg-btn-primary)',
    border:       '1px solid var(--color-border-accent)',
    borderRadius: 2,
    color:        'var(--color-text-accent)',
    fontSize:     10,
    padding:      '1px 6px',
  },
  advancedPanel: {
    display:       'flex',
    flexDirection: 'column',
    gap:           8,
    padding:       '12px',
    background:    'var(--color-bg-advanced)',
    borderRadius:  2,
    border:        '1px solid var(--color-border-input)',
  },
  advancedHint: {
    color:    'var(--color-text-secondary)',
    fontSize: 11,
    margin:   0,
  },
  addBtn: {
    padding:      '10px 14px',
    background:   'var(--color-bg-btn-primary)',
    border:       '1px solid var(--color-border-accent)',
    borderRadius: 2,
    color:        'var(--color-text-primary)',
    fontSize:     16,
    cursor:       'pointer',
    fontFamily:   'inherit',
    flexShrink:   0,
  },
  tagList: {
    display:  'flex',
    flexWrap: 'wrap',
    gap:      6,
  },
  tag: {
    display:      'flex',
    alignItems:   'center',
    gap:          5,
    background:   'var(--color-bg-tag)',
    border:       '1px solid var(--color-border-tag)',
    borderRadius: 2,
    color:        'var(--color-text-accent)',
    fontSize:     11,
    padding:      '3px 8px',
  },
  tagX: {
    background: 'transparent',
    border:     'none',
    color:      'var(--color-text-secondary)',
    cursor:     'pointer',
    padding:    0,
    fontSize:   10,
    lineHeight: 1,
    fontFamily: 'inherit',
  },
  error: {
    color:        'var(--color-text-error)',
    fontSize:     12,
    background:   'var(--color-bg-error)',
    borderRadius: 2,
    padding:      '6px 12px',
    margin:       0,
    textAlign:    'center',
    width:        '100%',
    boxSizing:    'border-box' as const,
  },
  dividerRow: {
    display:    'flex',
    alignItems: 'center',
    gap:        12,
    width:      '100%',
  },
  dividerLine: {
    flex:       1,
    height:     1,
    background: 'var(--color-border-subtle)',
  },
  dividerText: {
    color:    'var(--color-text-muted)',
    fontSize: 12,
  },
  fileBtn: {
    width:        '100%',
    padding:      '10px 0',
    background:   'transparent',
    border:       '1px dashed var(--color-border-dashed)',
    borderRadius: 2,
    color:        'var(--color-text-secondary)',
    fontSize:     13,
    cursor:       'pointer',
    fontFamily:   'inherit',
    transition:   'border-color 0.15s, color 0.15s',
  },
  fileHint: {
    color:    'var(--color-text-secondary)',
    fontSize: 13,
    margin:   0,
  },
  dragHint: {
    color:     'var(--color-text-muted)',
    fontSize:  12,
    margin:    0,
    textAlign: 'center',
  },
}
