'use client'

import { getPasswordStrength } from '@/lib/password-strength'

type Props = { password: string }

const LEVEL_CONFIG = {
  vide:   { label: '',       bars: 0, color: '#e5e7eb' },
  faible: { label: 'Faible', bars: 1, color: '#ef4444' },
  moyen:  { label: 'Moyen',  bars: 2, color: '#f59e0b' },
  fort:   { label: 'Fort',   bars: 3, color: '#16a34a' },
}

export function PasswordStrengthIndicator({ password }: Props) {
  const { level, rules } = getPasswordStrength(password)
  const config = LEVEL_CONFIG[level]

  return (
    <div className="mt-3 space-y-3">

      {/* Jauge */}
      <div className="space-y-1.5">
        <div className="flex gap-1.5">
          {[1, 2, 3].map((bar) => (
            <div
              key={bar}
              className="h-1.5 flex-1 rounded-full transition-all duration-300"
              style={{
                background: bar <= config.bars ? config.color : '#e5e7eb',
              }}
            />
          ))}
        </div>
        {level !== 'vide' && (
          <p
            className="text-xs font-semibold transition-colors duration-200"
            style={{ color: config.color }}
          >
            {config.label}
          </p>
        )}
      </div>

      {/* Checklist */}
      <ul className="space-y-1">
        {rules.map(({ rule, passed }) => (
          <li
            key={rule.id}
            className="flex items-center gap-2 text-xs transition-colors duration-200"
            style={{ color: passed ? '#16a34a' : '#94a3b8' }}
          >
            <span
              className="flex items-center justify-center w-4 h-4 rounded-full shrink-0 transition-all duration-200"
              style={{
                background: passed ? '#dcfce7' : '#f1f5f9',
                border:     `1px solid ${passed ? '#86efac' : '#e2e8f0'}`,
              }}
            >
              {passed ? (
                <svg width="8" height="8" viewBox="0 0 10 10" fill="none">
                  <path d="M2 5l2.5 2.5L8 3" stroke="#16a34a" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              ) : (
                <span style={{ width: 6, height: 6, borderRadius: '50%', display: 'block', background: '#cbd5e1' }} />
              )}
            </span>
            {rule.label}
          </li>
        ))}
      </ul>

    </div>
  )
}
