'use client'

import React, { useState } from 'react'
import { EmptyState } from './empty-state'

/* ─────────────────────────────────────────────────────────
   DataTable
   Table générique, triable, avec barre de recherche.

   Types:
     Column       définition d'une colonne
     DataTableProps  props du composant

   Props:
     columns            Column[]
     data               RowData[]
     loading            boolean
     emptyTitle         string
     emptyDescription   string
     searchable         boolean   — affiche la barre de recherche
     searchPlaceholder  string
     onSearch           (q: string) => void  — contrôlé externe
     searchValue        string               — contrôlé externe
     caption            string               — texte accessibilité
     onRowClick         (row: RowData) => void
     className          string
───────────────────────────────────────────────────────── */

type RowData = Record<string, unknown>

export interface Column {
  key:      string
  header:   string
  render?:  (value: unknown, row: RowData) => React.ReactNode
  width?:   string
  align?:   'left' | 'center' | 'right'
  hidden?:  boolean   // cache sur mobile (sm:table-cell)
}

interface DataTableProps {
  columns:            Column[]
  data:               RowData[]
  loading?:           boolean
  emptyTitle?:        string
  emptyDescription?:  string
  searchable?:        boolean
  searchPlaceholder?: string
  onSearch?:          (query: string) => void
  searchValue?:       string
  caption?:           string
  onRowClick?:        (row: RowData) => void
  className?:         string
}

/* ── Skeleton row ── */
function SkeletonRow({ cols }: { cols: number }) {
  return (
    <tr>
      {Array.from({ length: cols }).map((_, i) => (
        <td key={i} className="px-4 py-3">
          <span
            className="block h-4 rounded animate-pulse"
            style={{ background: 'var(--border)', width: i === 0 ? 160 : 80 + i * 20 }}
          />
        </td>
      ))}
    </tr>
  )
}

export function DataTable({
  columns,
  data,
  loading            = false,
  emptyTitle         = 'Aucune donnée',
  emptyDescription,
  searchable         = false,
  searchPlaceholder  = 'Rechercher…',
  onSearch,
  searchValue,
  caption,
  onRowClick,
  className          = '',
}: DataTableProps) {
  /* Recherche interne si non contrôlée */
  const [internalQuery, setInternalQuery] = useState('')
  const isControlled = onSearch !== undefined

  const query     = isControlled ? (searchValue ?? '') : internalQuery
  const visibleCols = columns.filter((c) => !c.hidden)

  /* Filtrage interne (si non contrôlé) */
  const rows = isControlled ? data : data.filter((row) => {
    if (!query) return true
    return Object.values(row).some((v) =>
      String(v ?? '').toLowerCase().includes(query.toLowerCase())
    )
  })

  function handleSearch(q: string) {
    if (isControlled) onSearch?.(q)
    else setInternalQuery(q)
  }

  return (
    <div
      className={`flex flex-col overflow-hidden ${className}`}
      style={{
        background:   'var(--card)',
        border:       '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)',
        boxShadow:    'var(--shadow-card)',
      }}
    >
      {/* Search bar */}
      {searchable && (
        <div
          className="px-4 py-3 flex items-center gap-2"
          style={{ borderBottom: '1px solid var(--border)' }}
        >
          <svg
            className="w-4 h-4 shrink-0"
            style={{ color: 'var(--muted-foreground)' }}
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
          </svg>
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder={searchPlaceholder}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--foreground)' }}
          />
          {query && (
            <button
              onClick={() => handleSearch('')}
              className="w-5 h-5 rounded-full flex items-center justify-center transition-opacity opacity-50 hover:opacity-100"
              style={{ background: 'var(--border)', color: 'var(--foreground)' }}
            >
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12"/>
              </svg>
            </button>
          )}
        </div>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="w-full text-sm" role="table">
          {caption && <caption className="sr-only">{caption}</caption>}

          {/* Headers */}
          <thead>
            <tr style={{ borderBottom: '1px solid var(--border)' }}>
              {visibleCols.map((col) => (
                <th
                  key={col.key}
                  className="px-4 py-3 text-left font-semibold uppercase tracking-widest whitespace-nowrap"
                  style={{
                    fontSize:   10,
                    color:      'var(--muted-foreground)',
                    width:      col.width,
                    textAlign:  col.align ?? 'left',
                  }}
                >
                  {col.header}
                </th>
              ))}
            </tr>
          </thead>

          {/* Body */}
          <tbody>
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <SkeletonRow key={i} cols={visibleCols.length} />
              ))
            ) : rows.length === 0 ? (
              <tr>
                <td colSpan={visibleCols.length}>
                  <EmptyState
                    title={emptyTitle}
                    description={emptyDescription}
                  />
                </td>
              </tr>
            ) : (
              rows.map((row, ri) => (
                <tr
                  key={ri}
                  onClick={() => onRowClick?.(row)}
                  className={onRowClick ? 'cursor-pointer' : ''}
                  style={{ borderBottom: '1px solid var(--border)' }}
                  onMouseEnter={(e) => {
                    if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = 'var(--secondary)'
                  }}
                  onMouseLeave={(e) => {
                    if (onRowClick) (e.currentTarget as HTMLTableRowElement).style.background = ''
                  }}
                >
                  {visibleCols.map((col) => (
                    <td
                      key={col.key}
                      className="px-4 py-3"
                      style={{
                        color:     'var(--foreground)',
                        textAlign: col.align ?? 'left',
                      }}
                    >
                      {col.render
                        ? col.render(row[col.key], row)
                        : (row[col.key] as React.ReactNode) ?? '—'}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}
