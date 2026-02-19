/**
 * MaterialList.tsx
 * ─────────────────────────────────────────────────────────────
 * Scrollable, filterable list of block counts.
 * Receives a pre-computed MaterialEntry[] from the parent.
 * ─────────────────────────────────────────────────────────────
 */

import { useState, useMemo } from 'react'
import type { MaterialEntry } from '../types/schematic'
import { getFallbackColor } from '../lib/textureMap'

interface Props {
  materials: MaterialEntry[]
}

type SortKey = 'count' | 'name' | 'category'

export default function MaterialList({ materials }: Props) {
  const [search,  setSearch]  = useState('')
  const [sortKey, setSortKey] = useState<SortKey>('count')
  const [catFilter, setCatFilter] = useState<string>('all')

  // Unique categories
  const categories = useMemo(() => {
    const cats = [...new Set(materials.map(m => m.category))].sort()
    return ['all', ...cats]
  }, [materials])

  // Filtered + sorted list
  const visible = useMemo(() => {
    let list = materials

    if (catFilter !== 'all') {
      list = list.filter(m => m.category === catFilter)
    }

    if (search.trim()) {
      const q = search.trim().toLowerCase()
      list = list.filter(m =>
        m.displayName.toLowerCase().includes(q) ||
        m.blockId.toLowerCase().includes(q)
      )
    }

    return [...list].sort((a, b) => {
      if (sortKey === 'count')    return b.count - a.count
      if (sortKey === 'name')     return a.displayName.localeCompare(b.displayName)
      if (sortKey === 'category') return a.category.localeCompare(b.category)
      return 0
    })
  }, [materials, search, sortKey, catFilter])

  const total = materials.reduce((s, m) => s + m.count, 0)

  return (
    <div style={styles.wrapper}>

      {/* Header */}
      <div style={styles.header}>
        <span style={styles.title}>🧱 Materials</span>
        <span style={styles.badge}>{materials.length} types · {total.toLocaleString()} blocks</span>
      </div>

      {/* Search */}
      <input
        style={styles.search}
        placeholder="Search blocks…"
        value={search}
        onChange={e => setSearch(e.target.value)}
      />

      {/* Controls row */}
      <div style={styles.controls}>
        {/* Category filter */}
        <select
          style={styles.select}
          value={catFilter}
          onChange={e => setCatFilter(e.target.value)}
        >
          {categories.map(c => (
            <option key={c} value={c}>
              {c === 'all' ? 'All categories' : c}
            </option>
          ))}
        </select>

        {/* Sort */}
        <select
          style={styles.select}
          value={sortKey}
          onChange={e => setSortKey(e.target.value as SortKey)}
        >
          <option value="count">Sort: Count</option>
          <option value="name">Sort: Name</option>
          <option value="category">Sort: Category</option>
        </select>
      </div>

      {/* List */}
      <div style={styles.list}>
        {visible.length === 0 && (
          <p style={styles.empty}>No blocks match</p>
        )}
        {visible.map(m => (
          <div key={m.blockId} style={styles.row}>
            {/* Color swatch */}
            <span
              style={{
                ...styles.swatch,
                background: getFallbackColor(m.blockId),
              }}
            />
            <div style={styles.rowInfo}>
              <span style={styles.rowName}>{m.displayName}</span>
              <span style={styles.rowId}>{m.blockId}</span>
            </div>
            <span style={styles.rowCount}>{m.count.toLocaleString()}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Styles ───────────────────────────────────────────────────

const styles: Record<string, React.CSSProperties> = {
  wrapper: {
    display:       'flex',
    flexDirection: 'column',
    gap:           6,
    minHeight:     0,
  },
  header: {
    display:        'flex',
    justifyContent: 'space-between',
    alignItems:     'center',
  },
  title: {
    color:      'var(--color-text-title)',
    fontWeight: 700,
    fontSize:   13,
  },
  badge: {
    color:    'var(--color-text-secondary)',
    fontSize: 11,
  },
  search: {
    background:   'var(--color-bg-surface-deep)',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-primary)',
    padding:      '5px 10px',
    fontSize:     12,
    outline:      'none',
    width:        '100%',
    boxSizing:    'border-box',
    fontFamily:   'inherit',
  },
  controls: {
    display: 'flex',
    gap:     6,
  },
  select: {
    flex:         1,
    background:   'var(--color-bg-surface-deep)',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-primary)',
    padding:      '4px 6px',
    fontSize:     11,
    outline:      'none',
    cursor:       'pointer',
    fontFamily:   'inherit',
  },
  list: {
    overflowY:     'auto',
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    gap:           2,
    maxHeight:     300,
    paddingRight:  2,
  },
  empty: {
    color:     'var(--color-text-secondary)',
    fontSize:  12,
    textAlign: 'center',
    padding:   '12px 0',
    margin:    0,
  },
  row: {
    display:      'flex',
    alignItems:   'center',
    gap:          8,
    padding:      '4px 6px',
    borderRadius: 2,
    background:   'var(--color-bg-row-hover)',
    cursor:       'default',
  },
  swatch: {
    width:        14,
    height:       14,
    borderRadius: 2,
    flexShrink:   0,
    border:       '1px solid rgba(255,255,255,0.08)',
  },
  rowInfo: {
    flex:          1,
    display:       'flex',
    flexDirection: 'column',
    minWidth:      0,
  },
  rowName: {
    color:        'var(--color-text-row-name)',
    fontSize:     12,
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  rowId: {
    color:        'var(--color-text-row-id)',
    fontSize:     10,
    whiteSpace:   'nowrap',
    overflow:     'hidden',
    textOverflow: 'ellipsis',
  },
  rowCount: {
    color:      'var(--color-text-accent)',
    fontSize:   12,
    fontWeight: 600,
    flexShrink: 0,
  },
}
