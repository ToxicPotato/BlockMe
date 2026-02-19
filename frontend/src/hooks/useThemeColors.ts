/**
 * useThemeColors.ts
 * ─────────────────────────────────────────────────────────────
 * Reads CSS custom properties at component mount time so
 * Three.js can receive concrete hex strings (it cannot consume
 * CSS variables directly).
 *
 * Safe to call because:
 *   • theme.css is imported in main.tsx before App mounts
 *   • getComputedStyle runs after the stylesheet is parsed
 *
 * For runtime theme switching: replace useMemo with useState +
 * a useEffect that listens for a custom "themechange" event.
 * ─────────────────────────────────────────────────────────────
 */

import { useMemo } from 'react'

function cssVar(name: string): string {
  return getComputedStyle(document.documentElement)
    .getPropertyValue(name)
    .trim()
}

export interface ThreeColors {
  gridCell:        string
  gridSection:     string
  placeholderMesh: string
}

export function useThemeColors(): ThreeColors {
  return useMemo(() => ({
    gridCell:        cssVar('--color-grid-cell'),
    gridSection:     cssVar('--color-grid-section'),
    placeholderMesh: cssVar('--color-placeholder-mesh'),
  }), [])
}
