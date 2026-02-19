/**
 * download.ts
 * ─────────────────────────────────────────────────────────────
 * Client-side file generation + download trigger.
 * No server needed – uses Blob + object URL.
 *
 * Exports:
 *   downloadMaterialListCsv()  – Excel-compatible CSV
 *   downloadMaterialListTxt()  – Plain text for Minecraft players
 * ─────────────────────────────────────────────────────────────
 */

import type { MaterialEntry } from '../types/schematic'

// ─── Shared helper ────────────────────────────────────────────

function triggerDownload(content: string, filename: string, mime: string) {
  const blob = new Blob([content], { type: mime })
  const url  = URL.createObjectURL(blob)
  const a    = document.createElement('a')
  a.href     = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

// ─── CSV export ───────────────────────────────────────────────

/**
 * Download material list as CSV.
 * Compatible with Excel / Google Sheets.
 *
 * Columns: Count, Block ID, Display Name, Category
 */
export function downloadMaterialListCsv(
  list: MaterialEntry[],
  label: string          // used in filename, e.g. "my_house" or "Steve_skin"
) {
  const header = 'Count,Block ID,Display Name,Category\n'
  const rows   = list
    .map(e => `${e.count},${e.blockId},"${e.displayName}",${e.category}`)
    .join('\n')

  const total = list.reduce((s, e) => s + e.count, 0)
  const footer = `\nTotal,${total},,`

  triggerDownload(
    header + rows + footer,
    `blockme_${label}_materials.csv`,
    'text/csv;charset=utf-8;'
  )
}

// ─── Plain text export ────────────────────────────────────────

/**
 * Download material list as plain text.
 * Easy to read while gathering blocks in-game.
 *
 * Format:
 *   142x Stone
 *    64x Oak Planks
 *   ...
 *   ───────────────
 *   Total: 1234 blocks
 */
export function downloadMaterialListTxt(
  list: MaterialEntry[],
  label: string
) {
  const maxCount = Math.max(...list.map(e => e.count))
  const pad      = String(maxCount).length

  const lines = list.map(e =>
    `${String(e.count).padStart(pad)}x  ${e.displayName} (${e.blockId})`
  )

  const total   = list.reduce((s, e) => s + e.count, 0)
  const divider = '─'.repeat(50)
  const content = [
    `BlockMe – Material List`,
    `Source: ${label}`,
    `Generated: ${new Date().toLocaleString()}`,
    divider,
    ...lines,
    divider,
    `Total: ${total.toLocaleString()} blocks  |  ${list.length} unique block types`,
  ].join('\n')

  triggerDownload(
    content,
    `blockme_${label}_materials.txt`,
    'text/plain;charset=utf-8;'
  )
}
