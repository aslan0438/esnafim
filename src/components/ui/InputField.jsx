import { forwardRef } from 'react'
import { cn } from '../../lib/utils'

const InputField = forwardRef(function InputField(
  { label, error, icon: Icon, className, ...props },
  ref
) {
  return (
    <div className={cn('space-y-1.5', className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}
      <div className="relative">
        {Icon && (
          <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
            <Icon className="h-4.5 w-4.5 text-gray-400" />
          </div>
        )}
        <input
          ref={ref}
          className={cn(
            'w-full rounded-lg border bg-white px-3 py-2.5 text-sm text-gray-900 outline-none transition-colors placeholder:text-gray-400',
            Icon && 'pl-10',
            error
              ? 'border-red-300 focus:border-red-500 focus:ring-1 focus:ring-red-500'
              : 'border-gray-300 focus:border-primary focus:ring-1 focus:ring-primary'
          )}
          {...props}
        />
      </div>
      {error && (
        <p className="text-xs text-red-500">{error}</p>
      )}
    </div>
  )
})

export default InputField
