export interface PasswordStrengthResult {
  score: number // 0-100
  level: 'weak' | 'medium' | 'strong'
  feedback: string[]
  isValid: boolean
  criteria: PasswordCriteria
}

export interface PasswordCriteria {
  minLength: boolean
  hasLowercase: boolean
  hasUppercase: boolean
  hasNumbers: boolean
  hasSpecialChars: boolean
  notContainsUsername: boolean
  notCommonPassword: boolean
}

// Common weak passwords to check against
const COMMON_PASSWORDS = [
  'password', '123456', '123456789', 'qwerty', 'abc123', 'password123',
  'admin', 'letmein', 'welcome', 'monkey', '1234567890', 'password1',
  'qwerty123', 'dragon', 'master', 'hello', 'freedom', 'whatever',
  'qazwsx', 'trustno1', 'jordan23', 'harley', 'password1', 'welcome123'
]

export function calculatePasswordStrength(
  password: string, 
  username?: string
): PasswordStrengthResult {
  const criteria = checkPasswordCriteria(password, username)
  const score = calculateScore(criteria)
  const level = getStrengthLevel(score)
  const feedback = generateFeedback(criteria, score)
  const isValid = score >= 60 // Minimum score for valid password

  return {
    score,
    level,
    feedback,
    isValid,
    criteria
  }
}

function checkPasswordCriteria(password: string, username?: string): PasswordCriteria {
  return {
    minLength: password.length >= 8 && password.length <= 50,
    hasLowercase: /[a-z]/.test(password),
    hasUppercase: /[A-Z]/.test(password),
    hasNumbers: /\d/.test(password),
    hasSpecialChars: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?~`]/.test(password),
    notContainsUsername: !username || !password.toLowerCase().includes(username.toLowerCase()),
    notCommonPassword: !COMMON_PASSWORDS.includes(password.toLowerCase())
  }
}

function calculateScore(criteria: PasswordCriteria): number {
  let score = 0
  
  // Length check (20 points)
  if (criteria.minLength) {
    score += 20
  }
  
  // Character diversity (60 points total)
  if (criteria.hasLowercase) score += 10
  if (criteria.hasUppercase) score += 10
  if (criteria.hasNumbers) score += 10
  if (criteria.hasSpecialChars) score += 10
  
  // Bonus for having all character types
  const diversityCount = [
    criteria.hasLowercase,
    criteria.hasUppercase,
    criteria.hasNumbers,
    criteria.hasSpecialChars
  ].filter(Boolean).length
  
  if (diversityCount === 4) score += 20
  
  // Security checks (20 points total)
  if (criteria.notContainsUsername) score += 10
  if (criteria.notCommonPassword) score += 10
  
  return Math.min(score, 100)
}

function getStrengthLevel(score: number): 'weak' | 'medium' | 'strong' {
  if (score < 40) return 'weak'
  if (score < 70) return 'medium'
  return 'strong'
}

function generateFeedback(criteria: PasswordCriteria, score: number): string[] {
  const feedback: string[] = []
  
  if (!criteria.minLength) {
    feedback.push('Password must be at least 8 characters long')
  }
  
  if (!criteria.hasLowercase) {
    feedback.push('Add lowercase letters (a-z)')
  }
  
  if (!criteria.hasUppercase) {
    feedback.push('Add uppercase letters (A-Z)')
  }
  
  if (!criteria.hasNumbers) {
    feedback.push('Add numbers (0-9)')
  }
  
  if (!criteria.hasSpecialChars) {
    feedback.push('Add special characters (!@#$%^&*)')
  }
  
  if (!criteria.notContainsUsername) {
    feedback.push('Password should not contain your username')
  }
  
  if (!criteria.notCommonPassword) {
    feedback.push('Avoid common passwords like "password" or "123456"')
  }
  
  // Positive feedback for strong passwords
  if (score >= 80) {
    feedback.push('Great! Your password is strong and secure')
  } else if (score >= 60) {
    feedback.push('Good password strength')
  }
  
  return feedback
}
