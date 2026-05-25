import { useState, forwardRef } from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { cn } from '../../lib/utils'

const PasswordField = forwardRef(function PasswordField(
  { label, error, className, showStrength, passwordValue, ...props },
  ref
) {
  const [visible, setVisible] = useState(false)

  const strength = showStrength && passwordValue ? getStrength(passwordValue) : null

  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        <input
          ref={ref}
          type={visible ? 'text' : 'password'}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 pr-10 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
          )}
          {...props}
        />
        <button
          type="button"
          tabIndex={-1}
          onClick={() => setVisible((v) => !v)}
          className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600"
        >
          {visible ? (
            <EyeOff className="h-4.5 w-4.5" />
          ) : (
            <Eye className="h-4.5 w-4.5" />
          )}
        </button>
      </div>
      {showStrength && strength && (
        <div className="space-y-1">
          <div className="flex gap-1">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className={cn(
                  'h-1 flex-1 rounded-full transition-colors',
                  i <= strength.level
                    ? strength.color
                    : 'bg-gray-200'
                )}
              />
            ))}
          </div>
          <p className="text-xs text-gray-500">{strength.label}</p>
        </div>
      )}
      {error && <p className="text-xs text-red-500">{error}</p>}
    </div>
  )
})

function getStrength(pw) {
  let score = 0
  if (pw.length >= 6) score++
  if (pw.length >= 10) score++
  if (/[A-Z]/.test(pw)) score++
  if (/[0-9]/.test(pw)) score++
  if (/[^A-Za-z0-9]/.test(pw)) score++

  const map = [
    { level: 1, color: 'bg-red-400', label: 'Çok zayıf' },
    { level: 2, color: 'bg-orange-400', label: 'Zayıf' },
    { level: 3, color: 'bg-yellow-400', label: 'Orta' },
    { level: 4, color: 'bg-green-500', label: 'Güçlü' },
  ]
  const idx = Math.min(Math.floor(score / 1.25), 3)
  return map[idx]
}

export default PasswordField
