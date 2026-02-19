/**
 * DownloadButtons.tsx
 * ─────────────────────────────────────────────────────────────
 * Two download buttons: CSV and TXT material list.
 * All generation happens client-side via download.ts.
 * ─────────────────────────────────────────────────────────────
 */

import type { MaterialEntry } from '../types/schematic'
import { downloadMaterialListCsv, downloadMaterialListTxt } from '../lib/download'

interface Props {
  materials: MaterialEntry[]
  /** Used in the filename: "my_house" or "Steve_skin" */
  label: string
}

export default function DownloadButtons({ materials, label }: Props) {
  if (materials.length === 0) return null

  return (
    <div style={styles.wrapper}>
      <p style={styles.heading}>⬇ Download material list</p>
      <div style={styles.row}>
        <button
          style={styles.btn}
          onClick={() => downloadMaterialListCsv(materials, label)}
          title="Download as CSV (Excel / Sheets compatible)"
        >
          📊 CSV
        </button>
        <button
          style={styles.btn}
          onClick={() => downloadMaterialListTxt(materials, label)}
          title="Download as plain text"
        >
          📄 TXT
        </button>
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
  },
  heading: {
    color:    'var(--color-text-secondary)',
    fontSize: 11,
    margin:   0,
  },
  row: {
    display: 'flex',
    gap:     8,
  },
  btn: {
    flex:         1,
    padding:      '7px 0',
    background:   'var(--color-bg-btn-download)',
    border:       '1px solid var(--color-border-input)',
    borderRadius: 2,
    color:        'var(--color-text-accent)',
    fontSize:     12,
    cursor:       'pointer',
    fontFamily:   'inherit',
    transition:   'background 0.15s, border-color 0.15s',
  },
}
