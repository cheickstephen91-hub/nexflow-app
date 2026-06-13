'use client'

import React from 'react'
import { FormSection } from './form-section'

/* ─────────────────────────────────────────────────────────
   SettingsCard
   Alias de FormSection, optimisé pour les pages de paramètres.
   Réexporte FormSection avec un display name distinct
   pour faciliter le repérage dans les DevTools.

   Props: identiques à FormSection
───────────────────────────────────────────────────────── */

export type { } // isolatedModules compat

interface SettingsCardProps {
  id?:           string
  title:         string
  subtitle?:     string
  icon?:         React.ReactNode
  iconBg?:       string
  iconColor?:    string
  actions?:      React.ReactNode
  illustration?: React.ReactNode
  children:      React.ReactNode
  className?:    string
}

export function SettingsCard(props: SettingsCardProps) {
  return <FormSection {...props} />
}
