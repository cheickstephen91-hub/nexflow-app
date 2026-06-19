export type PasswordRule = {
  id:      string
  label:   string
  test:    (pwd: string) => boolean
}

export type PasswordStrengthResult = {
  score:    number      // 0-5
  level:    'faible' | 'moyen' | 'fort' | 'vide'
  rules:    { rule: PasswordRule; passed: boolean }[]
  allPassed: boolean
}

export const PASSWORD_RULES: PasswordRule[] = [
  { id: 'length',   label: '8 caractères minimum',  test: (p) => p.length >= 8 },
  { id: 'upper',    label: 'Une majuscule',          test: (p) => /[A-Z]/.test(p) },
  { id: 'lower',    label: 'Une minuscule',          test: (p) => /[a-z]/.test(p) },
  { id: 'digit',    label: 'Un chiffre',             test: (p) => /[0-9]/.test(p) },
  { id: 'special',  label: 'Un caractère spécial',   test: (p) => /[^A-Za-z0-9]/.test(p) },
]

export function getPasswordStrength(password: string): PasswordStrengthResult {
  if (!password) {
    return {
      score:     0,
      level:     'vide',
      rules:     PASSWORD_RULES.map((rule) => ({ rule, passed: false })),
      allPassed: false,
    }
  }

  const rules = PASSWORD_RULES.map((rule) => ({ rule, passed: rule.test(password) }))
  const score = rules.filter((r) => r.passed).length

  let level: PasswordStrengthResult['level']
  if (score <= 2)      level = 'faible'
  else if (score <= 4) level = 'moyen'
  else                 level = 'fort'

  return { score, level, rules, allPassed: score === 5 }
}

export function validatePassword(password: string): string | null {
  const { rules } = getPasswordStrength(password)
  const failed = rules.find((r) => !r.passed)
  if (!failed) return null
  return `Mot de passe invalide : ${failed.rule.label.toLowerCase()} requis.`
}
